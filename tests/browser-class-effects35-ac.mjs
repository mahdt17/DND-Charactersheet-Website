import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const baseImport=(definition,name,level)=>({
  name,ruleset:'3.5',mechanics:'3.5',level,
  className:definition.name,classDefinition:definition,
  classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],
  abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},
  hp:{current:50,max:50,temp:0},ac:16,speed:30,initiativeBonus:0,save35:{fort:0,ref:0,will:0},
  inventory:[],spells:[],actions:[],feats:[],resources:[],trainingGrants:[],classEffects35:[],classEffectToggles35:{},featureChoices:{},conditions:[]
});
const fixture=(definition,name,effectId)=>{
  assert(definition,`exact ${name} record must exist`);
  const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
  const character=reconcileClassGrants(baseImport(definition,name,level));
  const effect=character.classEffects35?.find(item=>item.sourceClassId===definition.catalogId&&item.effectId===effectId);
  assert(effect,`test fixture must materialize exact ${effectId} before browser import`);
  return {character,effect};
};

const cipherDefinition=exact('classes/cipher-adept-688');
const cipherFixture=fixture(cipherDefinition,'Reviewed AC UI 3.5','combat-instinct-ac');
assert.equal(cipherFixture.effect.value,3,'Cipher Adept must resolve +3 Combat Instinct AC at its highest class level');
assert.equal(cipherFixture.character.classEffectACBonus35,3,'unconditional AC effect must be reconciled before browser import');
assert.equal(cipherFixture.character.ac,19,'base AC 16 plus +3 Combat Instinct must import as 19');

const dreadDefinition=exact('classes/dread-fang-of-lolth-428');
const dreadFixture=fixture(dreadDefinition,'Reviewed Conditional AC UI 3.5','team-defense-ac');
assert.equal(dreadFixture.effect.value,2,'Dread Fang must resolve +2 Team Defense at its highest class level');
assert.equal(dreadFixture.character.classEffectACBonus35,undefined,'inactive conditional Team Defense must not be tracked as active derived AC');
assert.equal(dreadFixture.character.ac,16,'inactive conditional Team Defense must leave base AC unchanged');

await fs.mkdir('test-results',{recursive:true});
const cipherImportPath='test-results/class-effects35-ac-import.json';
const dreadImportPath='test-results/class-effects35-ac-conditional-import.json';
await fs.writeFile(cipherImportPath,JSON.stringify(cipherFixture.character));
await fs.writeFile(dreadImportPath,JSON.stringify(dreadFixture.character));

const server=await createServer({server:{host:'127.0.0.1',port:5190}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);const row=rows.find(item=>item.name===name);if(!row)return null;return JSON.parse((await window.storage.get('char-detail:'+row.id)).value);},name);
const waitForSaved=async(name,predicate,message)=>{
  for(let attempt=0;attempt<60;attempt++){
    const character=await saved(name);
    if(character&&predicate(character))return character;
    await page.waitForTimeout(50);
  }
  assert.fail(message);
};
const operationalPanel=()=>page.locator('section.l-panel').filter({has:page.getByRole('heading',{name:'3.5 attacks & saves',exact:true})});
const openConditionControls=async()=>{
  const detail=operationalPanel().locator('details').filter({hasText:'Conditional class effects'}).first();
  if(await detail.getAttribute('open')===null)await detail.locator('summary').click();
  return detail;
};
const acTile=()=>page.locator('.vital-tile').filter({hasText:'Armor class'}).first();

try{
  await page.goto('http://127.0.0.1:5190/');
  await page.getByRole('button',{name:'Explore the demo'}).click();

  await page.locator('input[type="file"][accept*="json"]').setInputFiles(cipherImportPath);
  await page.locator('.sheet-identity').filter({hasText:cipherFixture.character.name}).waitFor();
  assert.match(await acTile().innerText(),/19[\s\S]*Armor class/i,'unconditional +3 Combat Instinct must raise the live AC tile from 16 to 19');
  let character=await waitForSaved(cipherFixture.character.name,item=>item.ac===19&&item.classEffectACBonus35===3,'Cipher Adept derived AC did not persist');
  assert.equal(character.classEffectACManual35,16,'persisted Cipher Adept AC keeps the original manual AC separately');
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:cipherFixture.character.name}).getByRole('button',{name:'Open character'}).click();
  assert.match(await acTile().innerText(),/19[\s\S]*Armor class/i,'unconditional structured AC survives save and reopen');
  console.log('PASS structured class effects: exact reviewed Cipher Adept Combat Instinct contributes to live AC');

  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(dreadImportPath);
  await page.locator('.sheet-identity').filter({hasText:dreadFixture.character.name}).waitFor();
  assert.match(await acTile().innerText(),/16[\s\S]*Armor class/i,'inactive Team Defense leaves the live AC tile at base AC');
  await openConditionControls();
  const toggle=page.getByLabel('Apply Team Defense condition',{exact:true});
  assert.equal(await toggle.isChecked(),false,'Team Defense begins inactive');
  await toggle.check();
  assert.match(await acTile().innerText(),/18[\s\S]*Armor class/i,'player-activated +2 Team Defense raises the live AC tile from 16 to 18');
  character=await waitForSaved(dreadFixture.character.name,item=>item.classEffectToggles35?.[dreadFixture.effect.id]===true&&item.ac===18&&item.classEffectACBonus35===2,'Team Defense activation and derived AC did not persist');
  assert.equal(character.classEffectACManual35,16,'persisted Team Defense AC keeps the original manual AC separately');
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:dreadFixture.character.name}).getByRole('button',{name:'Open character'}).click();
  assert.match(await acTile().innerText(),/18[\s\S]*Armor class/i,'conditional structured AC survives save and reopen');
  character=await saved(dreadFixture.character.name);
  assert.equal(character.classEffectToggles35?.[dreadFixture.effect.id],true,'Team Defense activation remains persisted after reopen');
  assert.equal(character.classEffectACBonus35,2,'Team Defense derived AC remains stable after reopen');
  console.log('PASS structured class effects: player activation controls exact reviewed Dread Fang Team Defense AC');

  assert.deepEqual(errors,[],'structured class-effects AC UI must not raise browser errors');
}finally{
  await browser.close();await server.close();
}
