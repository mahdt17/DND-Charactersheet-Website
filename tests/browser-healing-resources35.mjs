import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const row=(id,level)=>{const definition=catalog.find(r=>r.sourceId===id);assert(definition);return {catalogId:definition.catalogId,name:definition.name,definition,edition:'3.5',level};};
const paladin=row('classes/paladin-95',5),champion=row('classes/divine-champion-661',3);
const character={name:'Separate healing pools',ruleset:'3.5',mechanics:'3.5',className:'Paladin',classDefinition:paladin.definition,classLevels:[paladin,champion],level:8,race:'Human',alignment:'lawful good',hp:{current:20,max:30,temp:0},hitDie:'d10',abilities:{str:14,dex:10,con:14,int:10,wis:14,cha:16},abilityBonuses:{},inventory:[],actions:[],resources:[],feats:[],spells:[],featureChoices:{}};
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]);await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.locator('input[type="file"][accept*="json"]').setInputFiles({name:'healing.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))});
 await page.locator('.sheet-identity').filter({hasText:character.name}).waitFor();
 const groups=page.getByRole('group',{name:'Lay on Hands resource',exact:true});assert.equal(await groups.count(),2);
 const pal=groups.filter({hasText:'Paladin'}),champ=groups.filter({hasText:'Divine Champion'});
 assert.equal(await pal.count(),1,'the unrestricted Paladin pool has its source label');
 assert.equal(await champ.count(),1,'the restricted Divine Champion pool has its source label');
 const count=async(group,expected)=>assert.equal(await group.locator('.resource-count').innerText(),expected);
 await count(pal,'15 / 15');await count(champ,'9 / 9');
 await pal.getByLabel('Lay on Hands amount',{exact:true}).fill('12');await pal.getByRole('button',{name:'Use',exact:true}).click();
 await count(pal,'3 / 15');await count(champ,'9 / 9');
 await champ.getByLabel('Lay on Hands amount',{exact:true}).fill('4');await champ.getByRole('button',{name:'Use',exact:true}).click();await count(champ,'5 / 9');
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
 await count(pal,'3 / 15');await count(champ,'5 / 9');
 const rest=async(kind)=>{await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:kind==='short'?'Short rest':'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete '+kind+' rest',exact:true}).click();};
 await rest('long');await count(pal,'15 / 15');await count(champ,'9 / 9');
 assert.deepEqual(errors,[]);console.log('PASS healing UI: separate Paladin/Divine Champion pools, independent expenditure, save/reopen and daily recovery');
}finally{if(browser)await browser.close();await server.close();}
