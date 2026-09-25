import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5181}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const srd=JSON.parse(await fs.readFile('src/data/classes.json','utf8')),revised=JSON.parse(await fs.readFile('src/data/srd2024.json','utf8'));
const existing={id:'retained',name:'Existing table feat',description:'Keep these personal notes',source:'Homebrew',level:1};
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(r=>r.name===name).id)).value);},name);
async function start(edition,{weak=false}={}) {
 const definitions=edition==='2014'?srd:revised.classes,row=(name,level)=>({name,level,edition,catalogId:`${edition}:${name}`,subclass:name==='Fighter'?'Champion':'',definition:{...definitions.find(c=>c.name===name),edition}});
 const c={name:`Feat ${edition} ${weak?'blocked':'ready'}`,ruleset:edition,className:'Fighter',classDefinition:row('Fighter',3).definition,classLevels:[row('Fighter',3),row('Barbarian',1)],subclass:'Champion',race:'Human',level:4,hitDie:'d10',abilities:{str:weak?12:14,dex:12,con:14,int:12,wis:12,cha:12},abilityBonuses:{},hp:{current:30,max:30,temp:7},spells:[],inventory:[],actions:[],feats:[existing],notes:''};
 await page.locator('input[type=file]').setInputFiles({name:'character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();
 await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByRole('checkbox',{name:/I reviewed the class/}).check();await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
 if(edition==='2014'){await next();await page.getByRole('button',{name:/Take a feat/}).click();}else await page.getByLabel('Ability improvement',{exact:true}).selectOption('feat');
 assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
 await page.getByRole('button',{name:'Choose from feat catalog',exact:true}).click();return c;
}
try {
 await fs.mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:5181/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).click();
 for(const edition of ['2014','2024']) {
  await start(edition,{weak:true});await page.getByLabel('Search feats').fill('Grappler');let entry=page.locator(`[data-catalog-id="${edition}:grappler"]`);await entry.locator('summary').click();assert(await entry.getByRole('button',{name:'Add feat',exact:true}).isDisabled());assert.match(await entry.innerText(),/Unmet/);
  // Escape cancels this unsaved wizard; existing saved feats remain untouched.
  await page.keyboard.press('Escape');if(await page.getByRole('button',{name:'Cancel',exact:true}).count())await page.getByRole('button',{name:'Cancel',exact:true}).click();
  const c=await start(edition);
  if(edition==='2024'){await page.getByLabel('Search feats').fill('Boon of Combat Prowess');const boon=page.locator('[data-catalog-id="2024:boon-of-combat-prowess"]');await boon.locator('summary').click();assert(await boon.getByRole('button',{name:'Add feat',exact:true}).isDisabled());assert.match(await boon.innerText(),/Character level 19/);}
  await page.getByLabel('Custom feat name').fill('Reviewed alternative');await page.getByLabel('Custom feat effects and notes').fill('Keep table-specific effects.');assert(await page.getByRole('button',{name:'Add custom feat',exact:true}).isDisabled());await page.getByRole('checkbox',{name:/I reviewed this custom feat/}).check();await page.getByRole('button',{name:'Add custom feat',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Remove Existing table feat',exact:true}).count(),0);
  await page.getByLabel('Search feats').fill('Grappler');entry=page.locator(`[data-catalog-id="${edition}:grappler"]`);await entry.locator('summary').click();assert(await entry.getByRole('button',{name:'Add feat',exact:true}).isDisabled(),'one new feat per level-up choice');
  await page.getByRole('button',{name:'Remove Reviewed alternative',exact:true}).click();await entry.getByRole('button',{name:'Add feat',exact:true}).click();await page.getByRole('button',{name:'Remove Grappler',exact:true}).click();assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());await entry.getByRole('button',{name:'Add feat',exact:true}).click();
  assert.deepEqual((await saved(c.name)).feats,[existing]);await page.getByRole('button',{name:'Close feat catalog',exact:true}).click();
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`test-results/feat-level-${edition}-mobile.png`,fullPage:true});await page.setViewportSize({width:1440,height:1000});
  await next();if(edition==='2024')await next();assert.match(await page.locator('.creation-scroll').innerText(),/Grappler/);await page.locator('.creation-footer').getByRole('button',{name:'Back',exact:true}).click();if(edition==='2024')await page.locator('.creation-footer').getByRole('button',{name:'Back',exact:true}).click();assert(await page.getByRole('button',{name:'Remove Grappler',exact:true}).isVisible());
  await next();if(edition==='2024')await next();await page.getByRole('button',{name:'Apply level up',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 5'}).waitFor();const result=await saved(c.name);
  assert.equal(result.level,5);assert.deepEqual(result.classLevels.map(r=>r.level),[4,1]);assert.deepEqual(result.feats[0],existing);assert.equal(result.feats.length,2);assert.equal(result.feats[1].name,'Grappler');assert.equal(result.feats[1].catalogId,`${edition}:grappler`);assert.equal(result.feats[1].edition,edition);assert.equal(result.feats[1].level,5);assert(result.feats[1].prerequisites);assert.equal(result.hp.temp,7);
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:c.name}).getByRole('button',{name:'Open character'}).click();await page.getByRole('tab',{name:'Feats',exact:true}).click();assert.match(await page.locator('.ledger-main').innerText(),/Grappler/);
  console.log(`PASS ${edition} blocked prerequisites, custom review, single feat, replacement, unsaved/back review, preserved existing feats, source metadata and total acquisition level`);
 }
 assert.deepEqual(errors,[]);
} catch(e){await page.screenshot({path:'test-results/feat-level-failure.png',fullPage:true});throw e;} finally {await browser.close();await server.close();}
