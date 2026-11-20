import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import classes from '../src/data/classes.json' with {type:'json'};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const failures=[];
page.on('pageerror',error=>failures.push(error.message));
const tab=name=>page.getByRole('tab',{name,exact:true}).click();
function entry(name,level,subclass){
  const edition='2014',catalogId=edition+':'+name.toLowerCase();
  const definition={...classes.find(c=>c.name===name),edition,catalogId};
  return {name,level,subclass,edition,catalogId,definition};
}
async function checkBackground(className,species,background){
  const next=page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true});
  await page.getByRole('button',{name:'Create character',exact:true}).click();
  const wizard=page.getByRole('dialog',{name:'Guided character setup'});
  await wizard.getByLabel('Character name',{exact:true}).fill('Origin check');
  await next.click();
  await wizard.getByLabel('Search class',{exact:true}).fill(className);
  await wizard.locator('.creation-choice-title').filter({hasText:new RegExp('^'+className+'$')}).first().click();
  await next.click();
  await wizard.getByLabel('Search race',{exact:true}).fill(species==='aasimar-vgm'?'Aasimar':'Shadar-kai');
  await wizard.locator('[data-catalog-id="2014:'+species+'"]').click();
  if(species==='aasimar-vgm')await wizard.getByLabel('Lineage or subrace').selectOption('Fallen Aasimar');
  await next.click();
  await wizard.getByText(background,{exact:true}).click();
  if(background==='Inheritor'){
    assert(await next.isDisabled());
    await wizard.getByLabel('Inheritor skill').selectOption('History');
    await wizard.getByLabel('Gaming set or musical instrument').fill('Playing cards');
  }
  await next.click();
  await wizard.getByRole('heading',{name:'Shape your abilities'}).waitFor();
  await wizard.locator('.creation-cancel').click();
}
async function importSheet(name,rows,extra){
  const sheet={name,className:rows[0].name,classDefinition:rows[0].definition,classLevels:rows,
    level:5,ruleset:'2014',abilities:{str:14,dex:16,con:15,int:9,wis:16,cha:18},
    hp:{max:35,current:35,temp:0},inventory:[],actions:[],spells:[],...extra};
  await page.locator('input[type=file]').setInputFiles({name:'character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(sheet))});
  await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
}
try {
  await page.goto(process.env.SHADOW_ARCHER_TEST_URL);
  await page.getByRole('button',{name:/Explore the demo/}).click();
  await checkBackground('Paladin','aasimar-vgm','Inheritor');
  await checkBackground('Warlock','shadar-kai-motm','Arcane Tinkerer / Researcher');
  await importSheet('Pact equipment test',[entry('Warlock',3,'Hexblade'),entry('Sorcerer',2,'Clockwork Soul')],{
    background:'Arcane Tinkerer / Researcher',inventory:[{id:'bow',name:'Test pact bow',equipmentIndex:'longbow',qty:1,equipped:true}],
    subclassEquipment:{'2014:warlock':{'2014:subclass:warlock:hexblade':{'pact-weapon':'bow','improved-pact-weapon':'bow'}}}
  });
  await tab('Actions');
  const attack=page.locator('.action-row').filter({has:page.getByText('Test pact bow',{exact:true})});
  assert.deepEqual(failures,[]);
  assert.match(await attack.innerText({timeout:5000}),/\+8 to hit/);
  await attack.getByRole('button',{name:'1d8+5',exact:true}).waitFor();
  await tab('Spells');
  assert.equal(await page.getByRole('region',{name:'Pact Magic slots'}).getByRole('button').count(),2);
  assert.equal(await page.getByRole('button',{name:/^Level 1 slot /}).count(),3);
  await page.getByLabel('Spellcasting class').selectOption('2014:sorcerer');
  await page.getByText('Alarm',{exact:true}).first().waitFor();
  await page.getByText('Protection from Evil and Good',{exact:true}).first().waitFor();
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await importSheet('Divine multiclass test',[entry('Paladin',3,'Redemption'),entry('Cleric',2,'Twilight')],{
    race:'Aasimar',subrace:'Fallen Aasimar',raceDefinition:{name:'Aasimar',edition:'2014',catalogId:'2014:aasimar-vgm'},
    aasimar:{healingMode:'proficiency-d4',darkvision:40},background:'Inheritor',
    fightingStyles:{choices:[{id:'protection',source:'PHB',edition:'2014',sourceClassName:'Paladin',sourceClassId:'2014:paladin',sourceClassLevel:2}]}
  });
  await tab('Actions');
  await page.getByRole('heading',{name:'Protection reaction'}).waitFor();
  const racial=page.getByRole('region',{name:'Aasimar racial abilities'});
  assert.match(await racial.innerText(),/Darkvision 40 feet/);
  assert.match(await racial.innerText(),/3d4 HP/);
  await tab('Spells');
  await page.getByLabel('Spellcasting class').selectOption('2014:cleric');
  await page.getByText('Faerie Fire',{exact:true}).first().waitFor();
  assert.equal(await page.getByRole('button',{name:/^Level 1 slot /}).count(),4);
  assert.equal(await page.getByRole('button',{name:/^Level 2 slot /}).count(),2);
  assert.equal(await page.getByRole('button',{name:/^Level 3 slot /}).count(),0);
  assert.deepEqual(failures,[]);
} catch(error){
  console.error('Sheet errors:', failures, '\nSheet content:', (await page.locator('body').innerText()).slice(-7500));
  throw error;
} finally { await browser.close(); }
