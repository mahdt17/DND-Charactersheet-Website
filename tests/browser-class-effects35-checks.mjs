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
const definition=exact('classes/cloud-anchorite-499');
assert(definition,'exact Cloud Anchorite record must exist');
const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
const character=reconcileClassGrants({
  name:'Reviewed Wisdom Check UI 3.5',ruleset:'3.5',mechanics:'3.5',level,
  className:definition.name,classDefinition:definition,
  classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],
  abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:50,max:50,temp:0},ac:16,speed:30,initiativeBonus:0,save35:{fort:0,ref:0,will:0},
  inventory:[],spells:[],actions:[],feats:[],resources:[],trainingGrants:[],classEffects35:[],classEffectToggles35:{},featureChoices:{},conditions:[]
});
const effect=character.classEffects35?.find(item=>item.sourceClassId===definition.catalogId&&item.effectId==='mountain-wisdom-check');
assert(effect,'Cloud Anchorite mountain Wisdom-check effect must materialize');
assert.equal(effect.value,2);
await fs.mkdir('test-results',{recursive:true});
const importPath='test-results/class-effects35-check-import.json';
await fs.writeFile(importPath,JSON.stringify(character));

const server=await createServer({server:{host:'127.0.0.1',port:5191}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
const wisdomButton=()=>page.locator('.ability-tile').filter({hasText:'Wisdom'}).getByRole('button');
const operationalPanel=()=>page.locator('section.l-panel').filter({has:page.getByRole('heading',{name:'3.5 attacks & saves',exact:true})});
try{
  await page.goto('http://127.0.0.1:5191/');
  await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(importPath);
  await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
  assert.equal(await wisdomButton().innerText(),'+3','inactive mountain condition leaves Wisdom check at the base +3 modifier');
  const detail=operationalPanel().locator('details').filter({hasText:'Conditional class effects'}).first();
  await detail.locator('summary').click();
  const row=detail.locator('label').filter({hasText:/Wisdom check/i});
  const toggle=row.locator('input[type="checkbox"]');
  assert.equal(await toggle.isChecked(),false,'mountain Wisdom-check effect begins inactive');
  await toggle.check();
  assert.equal(await wisdomButton().innerText(),'+5','active mountain condition adds +2 to the live Wisdom check control');
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
  assert.equal(await wisdomButton().innerText(),'+5','conditional Wisdom-check bonus survives save and reopen');
  assert.deepEqual(errors,[],'class-effect ability-check UI must not raise browser errors');
  console.log('PASS structured class effects: exact reviewed Cloud Anchorite Wisdom check contributes to the live ability control');
}finally{
  await browser.close();await server.close();
}
