import {checkAffiliationFlow} from './shadow-archer-affiliation-flow.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const live=process.env.SHADOW_ARCHER_TEST_URL;
const server=live?null:await createServer({base:'/',server:{host:'127.0.0.1',port:5396,strictPort:true,hmr:false}});
await server?.listen();
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
page.setDefaultTimeout(12000);
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const names=['Fighter','Wizard','Ranger'];
const definitions=await read('src/data/classes.json');
const classLevels=names.map((name,index)=>{
  const catalogId='2014:'+name.toLowerCase(),edition='2014';
  return {name,level:[2,10,3][index],subclass:['','Bladesinging','Gloom Stalker'][index],edition,catalogId,definition:{...definitions.find(c=>c.name===name),edition,catalogId}};
});
const fireBolt=(await read('src/data/spells.json')).find(spell=>spell.index==='fire-bolt');
const character={
  id:'shadow-archer-combat-test',name:'Shadow Archer combat test',ruleset:'2014',className:'Fighter',level:15,classLevels,classDefinition:classLevels[0].definition,
  race:'Shadar-kai',raceDefinition:{name:'Shadar-kai',edition:'2014',catalogId:'2014:shadar-kai-motm'},
  hp:{current:80,max:80,temp:0},autoArmor:true,ac:17,abilities:{str:12,dex:18,con:15,int:17,wis:15,cha:13},abilityBonuses:{dex:2,int:1},
  inventory:[{id:'armor',name:'Studded Leather',equipmentIndex:'studded-leather-armor',equipped:true},{id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true},{id:'sword',name:'Longsword',equipmentIndex:'longsword',equipped:true}],
  fightingStyles:{choices:['Archery']},spells:[{...fireBolt,id:'fire-bolt',edition:'2014',catalogId:'2014:fire-bolt',castingClassId:'2014:wizard',prepared:true}],
  feats:[
    {id:'sharpshooter',name:'Sharpshooter',edition:'2014',catalogId:'wikidot5e:feat:sharpshooter'},
    {id:'elven-accuracy',name:'Elven Accuracy',edition:'2014',catalogId:'wikidot5e:feat:elven-accuracy',abilityChoices:{ability:'int'}},
  ],
  actions:[],resources:[],activeEffects:[],conditions:[],
};
const button=(name,scope=page)=>scope.getByRole('button',{name,exact:true});
const tab=name=>page.getByRole('tab',{name,exact:true}).click();
const row=name=>page.locator('.action-row').filter({has:page.getByText(name,{exact:true})}).first();
const rollCount=(text)=>text.match(/\[([\d, ]+)\]/)[1].split(',').length;
const newest=label=>page.locator('.roll-result').filter({hasText:label}).first();
const closeDice=()=>button('Close dice roller').click();

try{
  await page.goto(live||'http://127.0.0.1:5396/');
  await page.getByRole('button',{name:/Explore the demo/}).click();
  await page.locator('input[type=file]').setInputFiles({name:'shadow-archer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))});
  await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();

  await button('Intelligence score breakdown').click();
  const int=page.getByRole('dialog',{name:'Intelligence ability score'});
  assert.equal(await int.getByRole('row',{name:/^Total score/}).locator('td').innerText(),'19');
  assert.match(await int.getByRole('row',{name:/Elven Accuracy/}).innerText(),/\+1/);
  assert.equal(await int.getByLabel('Base score',{exact:true}).inputValue(),'17');
  await button('Close dialog',int).click();

  await tab('Actions');
  const ac=page.locator('.vital-tile').filter({hasText:'Armor class'}).locator('strong');
  assert.equal(await ac.innerText(),'17');
  await button('Configure Fighting Style').click();
  const styles=page.getByRole('dialog',{name:'Fighting Style choices'});
  assert.equal(await styles.getByRole('radio',{name:'Ranger 2 Fighting Style: Archery (PHB)',exact:true}).count(),0);
  await styles.getByRole('radio',{name:'Ranger 2 Fighting Style: Defense (PHB)',exact:true}).check();
  await button('Save Fighting Style',styles).click();
  assert.equal(await ac.innerText(),'18');
  assert.match(await page.getByRole('region',{name:'Fighter level-one tools'}).innerText(),/Defense: \+1 AC included/);

  await button('Dice roller').click();
  await page.getByLabel('D20 roll mode').selectOption('advantage');
  await closeDice();
  await page.evaluate(()=>{Math.random=()=>.42;});
  await page.getByLabel(/Use Sharpshooter/).check();
  await button('+7 to hit',row('Longbow')).click();
  const bow=await newest(/Longbow.*attack/).innerText();
  assert.match(bow,/1d20\+7.*Elven Accuracy/s);
  assert.equal(rollCount(bow),3);
  const damage=await newest(/Longbow.*damage/).innerText();
  assert.match(damage,/1d8\+15/);
  await closeDice();

  await button('+6 to hit',row('Longsword')).click();
  const sword=await newest(/Longsword.*attack/).innerText();
  assert.equal(rollCount(sword),2);
  assert.doesNotMatch(sword,/Elven Accuracy|Sharpshooter/);
  await closeDice();

  await page.getByLabel('Add condition',{exact:true}).selectOption('Poisoned');
  await button('+7 to hit',row('Longbow')).click();
  const canceled=await newest(/Longbow.*attack/).innerText();
  assert.equal(rollCount(canceled),1);
  assert.doesNotMatch(canceled,/Elven Accuracy/);
  await closeDice();
  await button('Remove Poisoned').click();

  await tab('Spells');
  await page.getByLabel('Spellcasting class',{exact:true}).selectOption('2014:wizard');
  const fireBoltRow=page.locator('.spell-item').filter({hasText:'Fire Bolt'});
  await button('Cast',fireBoltRow).click();
  await button('Cast',page.getByRole('dialog',{name:'Cast Fire Bolt'})).click();
  const spellAttack=await newest(/Fire Bolt.*attack/).innerText();
  assert.equal(rollCount(spellAttack),3);
  assert.match(spellAttack,/1d20\+9.*Elven Accuracy/s);
  assert.doesNotMatch(spellAttack,/Sharpshooter/);
  await closeDice();
  await checkAffiliationFlow(page);
  assert.deepEqual(errors,[]);
  console.log('PASS sheet feat bonus, Ranger Defense AC, Sharpshooter bow attack/damage, Elven Accuracy advantage for weapon and spell attacks, and canceled advantage');
} finally {
  await browser.close();
  await server?.close();
}
