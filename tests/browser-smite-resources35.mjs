import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8'));
const row=(id,level)=>{const definition=normalizeCatalogRecord(catalog.find(r=>r.id===id),'dndtools','classes');return {catalogId:definition.catalogId,name:definition.name,definition,edition:'3.5',level};};
const paladin=row('classes/paladin-95',5),argent=row('classes/argent-fist-468',9),monk=row('classes/monk-94',2);
const oldPool=row=>reconcileClassGrants({ruleset:'3.5',classLevels:[row],abilities:{cha:16}}).resources.find(r=>r.name==='Smite Evil');
const character={name:'Shared smite uses',ruleset:'3.5',mechanics:'3.5',className:'Paladin',classDefinition:paladin.definition,classLevels:[paladin,monk,argent],level:16,race:'Human',alignment:'lawful good',hp:{current:20,max:30,temp:0},hitDie:'d10',abilities:{str:14,dex:10,con:14,int:10,wis:14,cha:16},abilityBonuses:{},inventory:[],actions:[],resources:[{...oldPool(paladin),used:1},{...oldPool(argent),used:1}],feats:[],spells:[],featureChoices:{}};
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]);await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.locator('input[type="file"][accept*="json"]').setInputFiles({name:'smite.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))});
 await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
 const pool=page.getByRole('group',{name:'Smite Evil resource',exact:true});
 assert.equal(await pool.count(),1,'one pool after importing legacy per-class counters');
 assert.match(await pool.innerText(),/\+3 attack, \+16 damage/);
 assert.match(await pool.innerText(),/one melee attack against an evil creature/);
 assert.match(await pool.innerText(),/non-evil target still spends a use/);
 const count=async expected=>assert.equal(await pool.locator('.resource-count').innerText(),expected);
 await count('2 / 4');
 await pool.getByRole('button',{name:'Use',exact:true}).click();await count('1 / 4');
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
 await count('1 / 4');
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();await count('4 / 4');
 const unassigned={...removeClassProgression(reconcileClassGrants(character),paladin.catalogId),name:'Smite source removed'};
 await page.locator('input[type="file"][accept*="json"]').setInputFiles({name:'unassigned-smite.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(unassigned))});
 await page.locator('.sheet-identity').filter({hasText:unassigned.name}).waitFor();
 await count('0 / 0');assert(await pool.getByRole('button',{name:'Use',exact:true}).isDisabled());
 assert.match(await pool.innerText(),/Additional smite uses need a reviewed native source/);
 assert.deepEqual(errors,[]);
 console.log('PASS smite UI: one native pool, migrated spending, distinct attack/damage guidance, target restriction, reopen and recovery');
}finally{if(browser)await browser.close();await server.close();}
