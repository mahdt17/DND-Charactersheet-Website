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
  await importSheet('Pact equipment test',[entry('Warlock',3,'Hexblade'),entry('Sorcerer',2,'Clockwork Soul')],{
    background:'Arcane Tinkerer / Researcher',inventory:[{id:'bow',name:'Test pact bow',equipmentIndex:'longbow',qty:1,equipped:true}],
    subclassEquipment:{'2014:warlock':{'2014:subclass:warlock:hexblade':{'pact-weapon':'bow','improved-pact-weapon':'bow'}}}
  });
  await tab('Actions');
  const attack=page.locator('.action-row').filter({has:page.getByText('Test pact bow',{exact:true})});
  await attack.getByRole('button',{name:'+8 to hit',exact:true}).waitFor();
  await attack.getByRole('button',{name:'1d8+5',exact:true}).waitFor();
  await tab('Spells');
  assert.equal(await page.getByRole('region',{name:'Pact Magic slots'}).getByRole('button').count(),2);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await importSheet('Divine multiclass test',[entry('Paladin',3,'Redemption'),entry('Cleric',2,'Twilight')],{background:'Inheritor'});
  await tab('Spells');
  await page.getByLabel('Spellcasting class').selectOption('2014:cleric');
  await page.getByText('Faerie Fire',{exact:true}).first().waitFor();
  assert.deepEqual(failures,[]);
} finally { await browser.close(); }
