import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';

const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const psion=classes.find(r=>r.sourceId==='classes/psion-137');assert(psion);
const make=(name,level,known)=>({name,ruleset:'3.5',mechanics:'3.5',level,className:'Psion',classDefinition:psion,classLevels:[{catalogId:psion.catalogId,name:'Psion',definition:psion,edition:'3.5',level}],race:'Human',alignment:'lawful neutral',hp:{current:10,max:10,temp:0},hitDie:'d4',abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:10},abilityBonuses:{},inventory:[],actions:[],resources:[],spells:known?[{id:'test-known-power',name:'Test known power',edition:'3.5',school:'Psychokinesis',level:3,classLevels:{Psion:3},classes:['Psion'],castingClassId:psion.catalogId}]:[],feats:[],conditions:[],featureChoices:{}});
await fs.mkdir('test-results',{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(server.resolvedUrls.local[0]);await page.getByRole('button',{name:'Explore the demo'}).click();
 const load=async character=>{const file='test-results/manifesting-entry-import.json';await fs.writeFile(file,JSON.stringify(character));await page.locator('input[type="file"][accept*="json"]').setInputFiles(file);await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();};
 const check=async(id,text,want)=>{
  await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByLabel('Advancement path').selectOption('prestige');
  const target=classes.find(r=>r.sourceId===id);await page.getByLabel('Search level-up classes').fill(target.name);
  await page.getByLabel('Class to advance').locator('option').filter({hasText:target.name}).first().waitFor({state:'attached'});await page.getByLabel('Class to advance').selectOption(target.catalogId);
  const item=page.locator('.requirements li').filter({hasText:text});await item.waitFor();
  assert.equal((await item.locator('strong').innerText()).trim(),want+':');
  assert.equal(await item.getByRole('checkbox').count(),want==='Needs manual confirmation'?1:0);
  assert(await page.getByRole('button',{name:'Continue to level choices'}).isDisabled(),'other entry rules still apply');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
 };
 const level=want=>check('classes/crystal-master-1046','Manifester level 5th.',want),access=want=>check('classes/psion-uncarnate-913','Able to manifest 3rd-level powers.',want);
 await load(make('Manifesting below threshold',4,false));await level('Unmet');await access('Unmet');
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 await load(make('Manifesting missing known power',5,false));await level('Met');await access('Needs manual confirmation');
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 const character=make('Manifesting known power',5,true);await load(character);await level('Met');await access('Met');
 const pool=page.getByRole('group',{name:'Power Points resource',exact:true});await page.getByLabel('Power Points amount',{exact:true}).fill('35');await pool.getByRole('button',{name:'Use',exact:true}).click();
 assert.equal(await pool.locator('.resource-count').innerText(),'0 / 35');
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
 await level('Met');await access('Met');assert.deepEqual(errors,[]);
 console.log('PASS manifesting prerequisite UI: level threshold, unknown/known power, manual boundary, spent reserve and reopening');
}finally{if(browser)await browser.close();await server.close();}
