import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const psion=catalog.find(r=>r.sourceId==='classes/psion-137');assert(psion);
const make=(name,level,int)=>({name,ruleset:'3.5',mechanics:'3.5',level,className:'Psion',classDefinition:psion,classLevels:[{catalogId:psion.catalogId,name:'Psion',definition:psion,edition:'3.5',level}],race:'Human',alignment:'lawful neutral',hp:{current:10,max:10,temp:0},hitDie:'d4',abilities:{str:10,dex:10,con:10,int,wis:10,cha:10},abilityBonuses:{},inventory:[],actions:[],resources:[],spells:[],feats:[],conditions:[],featureChoices:{}});
await fs.mkdir('test-results',{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(server.resolvedUrls.local[0]);await page.getByRole('button',{name:'Explore the demo'}).click();
 const importCharacter=async character=>{
  const file='test-results/pp-prerequisite-import.json';await fs.writeFile(file,JSON.stringify(character));
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(file);
  await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
 };
 const check=async(id,text,want)=>{
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByLabel('Advancement path').selectOption('prestige');
  const target=catalog.find(r=>r.sourceId===id);assert(target);
  await page.getByLabel('Search level-up classes').fill(target.name);
  const option=page.getByLabel('Class to advance').locator('option').filter({hasText:target.name}).first();await option.waitFor({state:'attached'});
  await page.getByLabel('Class to advance').selectOption(target.catalogId);
  const requirement=page.locator('.requirements li').filter({hasText:text});await requirement.waitFor();
  assert.equal((await requirement.locator('strong').innerText()).trim(),want+':',target.name);
  assert.equal(await requirement.getByRole('checkbox').count(),0,'known capacity does not need manual confirmation');
  assert(await page.getByRole('button',{name:'Continue to level choices'}).isDisabled(),'other entry requirements still apply');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
 };
 const baseText='6+ (not including bonus power points).',reserveText='Must have a power point reserve of at least 1 power point.';
 await importCharacter(make('Bonus PP does not count as base',1,30));
 await check('classes/mindknight-1032',baseText,'Unmet');
 await check('classes/war-mind-916',reserveText,'Met');
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 const spent=make('Spent reserve still qualifies',2,18);await importCharacter(spent);
 const pool=()=>page.getByRole('group',{name:'Power Points resource',exact:true});
 assert.equal(await pool().locator('.resource-count').innerText(),'10 / 10');
 await page.getByLabel('Power Points amount',{exact:true}).fill('10');await pool().getByRole('button',{name:'Use',exact:true}).click();
 assert.equal(await pool().locator('.resource-count').innerText(),'0 / 10');
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 await page.locator('.character-card').filter({hasText:spent.name}).getByRole('button',{name:'Open character'}).click();
 assert.equal(await pool().locator('.resource-count').innerText(),'0 / 10','canonical expenditure survives reopen');
 await check('classes/mindknight-1032',baseText,'Met');
 await check('classes/war-mind-916',reserveText,'Met');
 assert.deepEqual(errors,[]);
 console.log('PASS PP prerequisite UI: bonus/base distinction, shared expenditure, reopen and remaining entry gates');
}finally{if(browser)await browser.close();await server.close();}
