import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/arcane-devotee-657'),reference);
assert(definition,'exact Arcane Devotee record must exist');
const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
const imported={
  name:'Reviewed Effects UI 3.5',ruleset:'3.5',mechanics:'3.5',level,
  className:definition.name,classDefinition:definition,
  classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],
  abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},
  hp:{current:50,max:50,temp:0},ac:16,speed:30,
  inventory:[],spells:[],actions:[],feats:[],resources:[],trainingGrants:[],classEffects35:[],featureChoices:{},conditions:[]
};
await fs.mkdir('test-results',{recursive:true});
const importPath='test-results/class-effects35-import.json';
await fs.writeFile(importPath,JSON.stringify(imported));

const server=await createServer({server:{host:'127.0.0.1',port:5189}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(row=>row.name===name).id)).value);},name);
try{
  await page.goto('http://127.0.0.1:5189/');
  await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(importPath);
  await page.locator('.sheet-identity').filter({hasText:imported.name}).waitFor();
  let character=await saved(imported.name);
  const effect=character.classEffects35?.find(item=>item.sourceClassId===definition.catalogId&&item.effectId==='sacred-defense-save');
  assert(effect,'import normalization must materialize the exact reviewed Arcane Devotee structured effect');
  assert.equal(effect.value,2,'Sacred Defense must resolve its 4th-level scaling before persistence');
  await page.getByRole('tab',{name:'Features',exact:true}).click();
  const panel=page.getByRole('region',{name:'Structured class effects'});
  await panel.waitFor();
  assert.match(await panel.innerText(),/Sacred Defense/i);
  assert.match(await panel.innerText(),/\+2 save sacred bonus against divine spells and outsider spell-like or supernatural abilities/i);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:imported.name}).getByRole('button',{name:'Open character'}).click();
  await page.getByRole('tab',{name:'Features',exact:true}).click();
  assert.match(await page.getByRole('region',{name:'Structured class effects'}).innerText(),/\+2 save sacred bonus/i,'structured effect summary survives save and reopen');
  character=await saved(imported.name);
  assert.equal(character.classEffects35.filter(item=>item.sourceClassId===definition.catalogId).length,1,'reopen remains idempotent and does not duplicate structured effects');
  assert.deepEqual(errors,[],'structured class effects UI must not raise browser errors');
  console.log('PASS structured class effects UI: exact reviewed effect materializes, renders and survives save/reopen');
}finally{
  await browser.close();await server.close();
}
