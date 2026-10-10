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
  hp:{current:50,max:50,temp:0},ac:16,speed:30,save35:{fort:0,ref:0,will:0},
  inventory:[],spells:[],actions:[],feats:[],resources:[],trainingGrants:[],classEffects35:[],classEffectToggles35:{},featureChoices:{},conditions:[]
});
const activeFixture=(definition,name,effectId)=>{
  assert(definition,`exact ${name} record must exist`);
  const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
  const materialized=reconcileClassGrants(baseImport(definition,name,level));
  const effect=materialized.classEffects35?.find(item=>item.sourceClassId===definition.catalogId&&item.effectId===effectId);
  assert(effect,`test fixture must materialize exact ${effectId} before browser import`);
  return {character:{...materialized,classEffectToggles35:{[effect.id]:true}},effect};
};
const arcaneDefinition=exact('classes/arcane-devotee-657');
const arcaneFixture=activeFixture(arcaneDefinition,'Reviewed Effects UI 3.5','sacred-defense-save');
const cloudDefinition=exact('classes/cloud-anchorite-499');
const cloudFixture=activeFixture(cloudDefinition,'Reviewed Movement UI 3.5','fast-movement');
assert.equal(cloudFixture.effect.value,20,'Cloud Anchorite fixture must resolve +20 ft. Fast Movement at its highest class level');
await fs.mkdir('test-results',{recursive:true});
const arcaneImportPath='test-results/class-effects35-import.json',cloudImportPath='test-results/class-effects35-movement-import.json';
await fs.writeFile(arcaneImportPath,JSON.stringify(arcaneFixture.character));
await fs.writeFile(cloudImportPath,JSON.stringify(cloudFixture.character));

const server=await createServer({server:{host:'127.0.0.1',port:5189}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(row=>row.name===name).id)).value);},name);
const openEffect=async (panel,name)=>{
  const detail=panel.locator('details').filter({hasText:name}).first();
  await detail.locator('summary').click();
  await detail.locator('p').first().waitFor();
  return detail;
};
const willSaveButton=()=>page.locator('section.l-panel').filter({has:page.getByRole('heading',{name:'3.5 attacks & saves',exact:true})}).locator('.l-toolbar').filter({hasText:'Will base + misc.'}).getByRole('button');
const speedTile=()=>page.locator('.vital-tile').filter({hasText:'Walking speed'}).first();
try{
  await page.goto('http://127.0.0.1:5189/');
  await page.getByRole('button',{name:'Explore the demo'}).click();

  await page.locator('input[type="file"][accept*="json"]').setInputFiles(arcaneImportPath);
  await page.locator('.sheet-identity').filter({hasText:arcaneFixture.character.name}).waitFor();
  let character=await saved(arcaneFixture.character.name);
  const effect=character.classEffects35?.find(item=>item.sourceClassId===arcaneDefinition.catalogId&&item.effectId==='sacred-defense-save');
  assert(effect,'import normalization must materialize the exact reviewed Arcane Devotee structured effect');
  assert.equal(effect.value,2,'Sacred Defense must resolve its 4th-level scaling before persistence');
  assert.equal(character.classEffectToggles35?.[effect.id],true,'explicit conditional-effect state survives import normalization');
  assert.equal(await willSaveButton().innerText(),'Roll +5','active Sacred Defense contributes +2 to the real 3.5 Will save control');
  await page.getByRole('tab',{name:'Features',exact:true}).click();
  const panel=page.getByRole('region',{name:'Structured class effects'});
  await panel.waitFor();
  assert.match(await panel.innerText(),/Sacred Defense/i);
  let detail=await openEffect(panel,'Sacred Defense');
  assert.match(await detail.innerText(),/\+2 save sacred bonus against divine spells and outsider spell-like or supernatural abilities/i);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:arcaneFixture.character.name}).getByRole('button',{name:'Open character'}).click();
  assert.equal(await willSaveButton().innerText(),'Roll +5','operational class-effect bonus survives save and reopen');
  character=await saved(arcaneFixture.character.name);
  assert.equal(character.classEffects35.filter(item=>item.sourceClassId===arcaneDefinition.catalogId).length,1,'reopen remains idempotent and does not duplicate structured effects');
  assert.equal(character.classEffectToggles35?.[effect.id],true,'conditional-effect activation persists after reopen');
  console.log('PASS structured class effects: exact reviewed Sacred Defense contributes to live 3.5 saves across save/reopen');

  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(cloudImportPath);
  await page.locator('.sheet-identity').filter({hasText:cloudFixture.character.name}).waitFor();
  character=await saved(cloudFixture.character.name);
  const movement=character.classEffects35?.find(item=>item.sourceClassId===cloudDefinition.catalogId&&item.effectId==='fast-movement');
  assert(movement,'import normalization must materialize exact Cloud Anchorite Fast Movement');
  assert.equal(movement.value,20);
  assert.equal(character.classEffectToggles35?.[movement.id],true,'explicit Fast Movement activation survives import normalization');
  assert.match(await speedTile().innerText(),/50\s*ft\.\s*Walking speed/i,'active +20 ft. Fast Movement raises the live Walking Speed tile from 30 to 50');
  await page.getByRole('tab',{name:'Features',exact:true}).click();
  const movementPanel=page.getByRole('region',{name:'Structured class effects'});
  detail=await openEffect(movementPanel,'Fast Movement');
  assert.match(await detail.innerText(),/Land movement \+20 ft\. while unarmored and not carrying a medium or heavy load/i);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:cloudFixture.character.name}).getByRole('button',{name:'Open character'}).click();
  assert.match(await speedTile().innerText(),/50\s*ft\.\s*Walking speed/i,'operational Fast Movement survives save and reopen');
  character=await saved(cloudFixture.character.name);
  assert.equal(character.classEffectToggles35?.[movement.id],true,'Fast Movement activation remains persisted after reopen');
  console.log('PASS structured class effects: exact reviewed Cloud Anchorite Fast Movement contributes to live walking speed across save/reopen');

  assert.deepEqual(errors,[],'structured class effects UI must not raise browser errors');
}finally{
  await browser.close();await server.close();
}
