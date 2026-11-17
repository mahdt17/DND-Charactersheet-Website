import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const live=process.env.ARCANE_ARCHER_TEST_URL;
const server=live?null:await createServer({base:'/',server:{host:'127.0.0.1',port:5392,strictPort:true,hmr:false}});
await server?.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));

const classes=JSON.parse(await readFile('src/data/classes.json','utf8'));
const spellCatalog=JSON.parse(await readFile('src/data/spells.json','utf8'));
const name='Shadow Archer prestige test';
const classLevels=[['Fighter',2,''],['Wizard',6,'Bladesinging'],['Ranger',3,'Gloom Stalker']].map(([name,level,subclass])=>{
  const catalogId='2014:'+name.toLowerCase();
  return {name,level,subclass,edition:'2014',catalogId,definition:{...classes.find(c=>c.name===name),edition:'2014',catalogId}};
});
const spells=['web','shield'].map(index=>{
  const spell=spellCatalog.find(spell=>spell.index===index);
  return {...spell,id:index,catalogId:'2014:'+index,edition:'2014',prepared:true,castingClassId:'2014:wizard'};
});
const character={
  id:'arcane-archer-test',name,ruleset:'2014',className:'Fighter',classLevels,classDefinition:classLevels[0].definition,level:11,
  race:'Shadar-kai',raceDefinition:{name:'Shadar-kai',catalogId:'2014:shadar-kai-motm',edition:'2014'},
  abilities:{str:10,dex:20,con:15,int:18,wis:15,cha:13},hp:{current:70,max:70,temp:0},speed:30,ac:16,
  inventory:[{id:'bow',name:'Longbow',equipmentIndex:'longbow',qty:1,equipped:true}],fightingStyles:{choices:['Archery']},
  feats:[{id:'sharpshooter',name:'Sharpshooter',edition:'2014',catalogId:'wikidot5e:feat:sharpshooter'}],
  expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:bladesinging':{'bladesinger-weapon':['Rapier']}}},
  spells,resources:[],actions:[],activeEffects:[],concentration:'',
};
const exact=(name,scope=page)=>scope.getByRole('button',{name,exact:true});
const next=()=>exact('Continue',page.locator('.creation-footer')).click();
const saved=()=>page.evaluate(async name=>{
  const index=JSON.parse((await window.storage.get('char-index')).value);
  return JSON.parse((await window.storage.get('char-detail:'+index.find(row=>row.name===name).id)).value);
},name);
const prestigeName='Arcane Archer (5e Conversion)';
const archerId='2014:prestige:arcane-archer';

async function advance(enter,level){
  await exact('Level up').click();
  const dialog=page.getByRole('dialog',{name:'Choose how to level up'});
  if(enter){
    await dialog.getByLabel('Advancement path').selectOption('prestige');
    await dialog.getByLabel('Search level-up classes').fill('Arcane Archer');
  }
  await dialog.getByLabel('Class to advance').selectOption(archerId);
  await dialog.getByRole('checkbox',{name:/I reviewed the class/}).check();
  await exact('Continue to level choices',dialog).click();
  await next();
  await next();
  await exact('Apply level up').click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL '+level}).waitFor({timeout:3500}).catch(async error=>{
    console.log('PAGE ERRORS',errors);
    console.log('DIALOG',await page.getByRole('dialog').allTextContents());
    throw error;
  });
}

try{
  await page.goto(live||'http://127.0.0.1:5392/');
  await page.getByRole('button',{name:/Explore the demo/}).click();
  await page.locator('input[type=file]').setInputFiles({name:'shadow-archer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))});
  await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
  await advance(true,12);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  const bow=page.locator('.action-row').filter({has:page.getByText('Longbow',{exact:true})}).first();
  await exact('+12 to hit',bow).waitFor();
  await exact('1d8+6',bow).waitFor();
  const archerTools=page.getByRole('region',{name:'Arcane Archer',exact:true});
  await archerTools.getByLabel('Longbow existing magic bonus').selectOption('2');
  await exact('+13 to hit',bow).waitFor();
  await exact('1d8+7',bow).waitFor();
  await archerTools.getByLabel('Longbow existing magic bonus').selectOption('0');
  await advance(false,13);
  assert.equal((await saved()).classLevels.at(-1)?.name,prestigeName);
  await page.getByRole('tab',{name:'Features',exact:true}).click();
  assert.equal(await page.locator('summary').filter({hasText:/Imbue Arrow/}).count(),1);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  await exact('Start Bladesong').click();
  await page.getByText('Bladesong active',{exact:true}).filter({visible:true}).first().waitFor();
  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  await page.getByLabel('Spellcasting class',{exact:true}).selectOption('2014:wizard');
  assert.deepEqual(await Promise.all([1,2,3,4,5].map(level=>page.getByRole('button',{name:new RegExp('^Level '+level+' slot ')}).count())),[4,3,3,1,0]);

  const castRow=spell=>page.locator('.spell-item').filter({has:page.getByRole('button',{name:new RegExp('^'+spell+' ')})});
  await exact('Cast',castRow('Shield')).click();
  assert.equal(await page.getByLabel('Cast through an arrow').count(),0);
  await exact('Cancel casting').click();

  await exact('Cast',castRow('Web')).click();
  const casting=page.getByRole('dialog',{name:'Cast Web'});
  await casting.getByLabel('Cast through an arrow').check();
  await casting.getByLabel('Distance to landing point (feet)',{exact:true}).fill('601');
  await casting.getByLabel('Arrow landing point').fill('Far courtyard');
  await exact('Cast with Imbue Arrow',casting).click();
  assert.match(await casting.getByRole('alert').innerText(),/600 feet/);
  assert.doesNotMatch(await exact('Level 2 slot 1').getAttribute('class'),/used/);
  await casting.getByLabel('Distance to landing point (feet)',{exact:true}).fill('425');
  await exact('Cast with Imbue Arrow',casting).click();
  await page.getByRole('status').filter({hasText:'Web cast with Imbue Arrow'}).waitFor();
  assert.match(await exact('Level 2 slot 1').getAttribute('class'),/used/);
  assert.doesNotMatch(await exact('Level 2 slot 2').getAttribute('class'),/used/);
  let c;
  for(let attempt=0;attempt<40;attempt++){
    c=await saved();
    if(c.archivistCampaign?.lastCast?.imbueArrow)break;
    await page.waitForTimeout(50);
  }
  assert.equal(c.concentration,'Web');
  assert.equal(c.archivistCampaign.lastCast.dc,17);
  assert.equal(c.archivistCampaign.lastCast.imbueArrow.distance,425);
  assert.equal(c.archivistCampaign.lastCast.imbueArrow.point,'Far courtyard');
  assert.equal(c.slotsUsed[2],1);
  assert.ok(!c.activeEffects.some(effect=>effect.name==='Bladesong'));
  await page.getByRole('region',{name:'Spell effect resolution'}).getByText(/Imbue Arrow origin: Far courtyard/).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS 2014 Arcane Archer prestige entry, Enhance Arrow, shared slots, Imbue Arrow range, spell DC, concentration and expenditure');
} finally {
  await browser.close();
  await server?.close();
}
