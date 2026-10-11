import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createCatalogService} from '../src/lib/catalog.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const psion=classes.find(record=>record?.name==='Psion'&&!record?.prestige);
assert(psion,'published D&DTools catalog must contain the base Psion class');
const character=reconcileClassGrants({
  name:'Live Manifesting 3.5',ruleset:'3.5',mechanics:'3.5',level:1,
  className:psion.name,classDefinition:psion,
  classLevels:[{catalogId:psion.catalogId,name:psion.name,edition:'3.5',level:1,definition:psion}],
  race:'Human',hitDie:'d4',hp:{current:4,max:4,temp:0},
  abilities:{str:10,dex:10,con:10,int:16,wis:10,cha:10},abilityBonuses:{},
  inventory:[],actions:[],spells:[],feats:[],resources:[],featureChoices:{},conditions:[]
});
const profile=character.manifesting35?.find(row=>row.sourceClassId===psion.catalogId);
const pool=character.resources?.find(row=>row.manifesting35&&row.sourceClassId===psion.catalogId);
assert(profile,'exact Psion fixture must derive a manifesting profile before browser import');
assert(pool,'exact Psion fixture must derive a power-point pool before browser import');
assert.equal(profile.powerPointsMax,2);assert.equal(profile.powersKnown,3);assert.equal(profile.maxPowerLevel,1);assert.equal(pool.max,2);
await fs.mkdir('test-results',{recursive:true});
const importPath='test-results/manifesting35-import.json';await fs.writeFile(importPath,JSON.stringify(character));

const server=await createServer({server:{host:'127.0.0.1',port:5197}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const group=()=>page.getByRole('group',{name:'Power Points resource',exact:true});
const saved=async()=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(row=>row.name===name).id)).value);},character.name);
const waitSaved=async used=>{for(let attempt=0;attempt<80;attempt++){const state=await saved(),resource=state.resources?.find(row=>row.manifesting35);if(resource?.used===used)return state;await page.waitForTimeout(50);}assert.fail(`Power Points did not persist used=${used}`);};
try{
  await page.goto('http://127.0.0.1:5197/');await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(importPath);
  await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
  await group().waitFor();
  assert.equal(await group().locator('.resource-count').innerText(),'2 / 2','exact Psion begins with its table-derived PP maximum');
  assert.match(await group().innerText(),/Psion · 3\.5 manifesting progression/i,'automatic PP must identify its manifesting source rather than appear custom');
  await page.getByLabel('Power Points amount',{exact:true}).fill('1');await group().getByRole('button',{name:'Use',exact:true}).click();
  assert.equal(await group().locator('.resource-count').innerText(),'1 / 2','live resource controls spend one PP');
  let state=await waitSaved(1);assert.equal(state.manifesting35?.find(row=>row.sourceClassId===psion.catalogId)?.powersKnown,3);
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
  assert.equal(await group().locator('.resource-count').innerText(),'1 / 2','spent PP survives save and reopen');
  await group().getByRole('button',{name:'Restore',exact:true}).click();assert.equal(await group().locator('.resource-count').innerText(),'2 / 2');state=await waitSaved(0);
  assert.equal(state.resources.filter(row=>row.manifesting35&&row.sourceClassId===psion.catalogId).length,1,'reopen/reconcile must not duplicate PP pools');
  assert.deepEqual(errors,[],'manifesting resource UI must not raise browser errors');
  console.log(`PASS exact ${psion.sourceId}: live PP display, source labeling, spend/restore, persistence and reopen`);
}finally{await browser.close();await server.close();}
