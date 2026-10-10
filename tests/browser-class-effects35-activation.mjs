import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/cloud-anchorite-499'),reference);
assert(definition,'exact Cloud Anchorite record must exist');
const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
const character=reconcileClassGrants({
  name:'Reviewed Default Active UI 3.5',ruleset:'3.5',mechanics:'3.5',level,
  className:definition.name,classDefinition:definition,
  classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],
  abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:50,max:50,temp:0},ac:16,speed:30,initiativeBonus:0,save35:{fort:0,ref:0,will:0},
  inventory:[],spells:[],actions:[],feats:[],resources:[],trainingGrants:[],classEffects35:[],classEffectToggles35:{},featureChoices:{},conditions:[]
});
const climb=character.classEffects35.find(effect=>effect.effectId==='climb-speed');
assert(climb,'Cloud Anchorite climb-speed effect must materialize');
assert.equal(climb.defaultActive,true,'fixture requires reviewed default-active climb speed');
await fs.mkdir('test-results',{recursive:true});
const importPath='test-results/class-effects35-default-active-import.json';
await fs.writeFile(importPath,JSON.stringify(character));

const server=await createServer({server:{host:'127.0.0.1',port:5192}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);const row=rows.find(item=>item.name===name);if(!row)return null;return JSON.parse((await window.storage.get('char-detail:'+row.id)).value);},name);
const waitForSaved=async(name,predicate,message)=>{for(let attempt=0;attempt<60;attempt++){const item=await saved(name);if(item&&predicate(item))return item;await page.waitForTimeout(50);}assert.fail(message);};
const operationalPanel=()=>page.locator('section.l-panel').filter({has:page.getByRole('heading',{name:'3.5 attacks & saves',exact:true})});
const controls=()=>operationalPanel().locator('details').filter({hasText:'Conditional class effects'}).first();
const climbSpeed=()=>operationalPanel().locator('[data-class-movement35="climb"]');
try{
  await page.goto('http://127.0.0.1:5192/');
  await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(importPath);
  await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
  assert.equal(await climbSpeed().innerText(),'Climb speed 50 ft.','default-active reviewed climb speed must appear as a live operational movement value');
  await controls().locator('summary').click();
  const row=controls().locator('label').filter({hasText:/Climb movement/i});
  const toggle=row.locator('input[type="checkbox"]');
  assert.equal(await toggle.isChecked(),true,'default-active climb speed control must render checked before any stored override exists');
  await toggle.uncheck();
  await waitForSaved(character.name,item=>item.classEffectToggles35?.[climb.id]===false,'explicit false default-active override did not persist');
  assert.equal(await toggle.isChecked(),false,'player can suppress the default-active effect while its restriction applies');
  assert.equal(await climbSpeed().count(),0,'suppressed climb speed must disappear from live operational movement values');
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
  assert.equal(await climbSpeed().count(),0,'saved climb-speed suppression remains absent after reopen');
  await controls().locator('summary').click();
  const reopened=controls().locator('label').filter({hasText:/Climb movement/i}).locator('input[type="checkbox"]');
  assert.equal(await reopened.isChecked(),false,'saved suppression remains off after reopen');
  assert.deepEqual(errors,[],'default-active class-effect UI must not raise browser errors');
  console.log('PASS structured class effects: default-active Cloud Anchorite climb control and live climb speed persist suppression state');
}finally{
  await browser.close();await server.close();
}
