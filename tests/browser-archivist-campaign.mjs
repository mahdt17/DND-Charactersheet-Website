import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5189}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const reserve=name=>page.getByRole('group',{name:name+' resource'}).locator('.resource-count');
try{
 await fs.mkdir('test-results',{recursive:true});
 await page.goto('http://127.0.0.1:5189');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('button',{name:'Archivist campaign preset',exact:true}).click();await page.getByLabel('Campaign character name').fill('Archivist Browser');await page.getByRole('button',{name:'Create campaign character',exact:true}).click();
 await page.locator('.sheet-identity').filter({hasText:'Archivist Browser'}).waitFor();assert.match(await page.locator('.sheet-identity').innerText(),/Archivist 4.*Psion \(Telepath\) 1/s);
 assert.equal(await reserve('Power Points').innerText(),'3 / 3');assert.equal(await reserve('Dark Knowledge').innerText(),'4 / 4');
 await page.locator('summary').filter({hasText:'Mindlink'}).click();await page.getByRole('button',{name:'Manifest Mindlink',exact:true}).click();assert.equal(await reserve('Power Points').innerText(),'2 / 3');
 await page.locator('summary').filter({hasText:'Inertial Armor'}).click();await page.getByRole('button',{name:'Manifest Inertial Armor',exact:true}).click();assert.match(await page.locator('.vital-tile').filter({hasText:'Armor class'}).innerText(),/13/);
 await page.getByLabel('Studied creature or group').fill('Undead scouts');await page.getByLabel('Knowledge check result').fill('25');await page.getByRole('button',{name:'Use Dark Knowledge',exact:true}).click();assert.equal(await reserve('Dark Knowledge').innerText(),'3 / 4');
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Complete short rest'}).click();assert.equal(await reserve('Power Points').innerText(),'1 / 3');assert.equal(await reserve('Dark Knowledge').innerText(),'3 / 4');
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest'}).click();assert.equal(await reserve('Power Points').innerText(),'3 / 3');
 await page.getByRole('tab',{name:'Spells',exact:true}).click();await page.getByText('Add prayerbook spells',{exact:true}).click();await page.getByLabel('Search prayerbook spells').fill('Cure Wounds');await page.getByRole('button',{name:'Record Cure Wounds',exact:true}).click();await page.getByLabel('Prepare Cure Wounds').check();await page.getByRole('button',{name:'Cast Cure Wounds',exact:true}).click();await page.getByRole('status').filter({hasText:'Cure Wounds cast'}).waitFor();
 await page.getByRole('button',{name:'Roll Healing: 1d8+2',exact:true}).waitFor();
 await page.getByLabel('Search prayerbook spells').fill('Bless');await page.locator('[data-catalog-id="2014:bless"]').getByRole('button',{name:'Record Bless',exact:true}).click();await page.getByLabel('Prepare Bless').check();await page.getByLabel('Campaign casting slot').selectOption('2');await page.getByRole('button',{name:'Cast Bless',exact:true}).click();await page.getByRole('button',{name:'Concentrating: Bless'}).waitFor();
 await page.getByRole('tab',{name:'Feats',exact:true}).click();await page.locator('summary').filter({hasText:'Reach Spell'}).waitFor();
 await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByRole('button',{name:'Advance to level 6',exact:true}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();
 await page.getByLabel('Follower name or group').fill('Research cell');await page.getByLabel('Follower quantity').fill('5');await page.getByRole('button',{name:'Add follower record',exact:true}).click();await page.getByText('Research cell',{exact:true}).waitFor();
 assert.match(await page.getByRole('region',{name:'Archivist campaign'}).innerText(),/Score 10/);
 for(let level=7;level<=20;level++){await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByRole('button',{name:'Advance to level '+level,exact:true}).click();}
 assert.match(await page.locator('.sheet-identity').innerText(),/Archivist 18.*Psion \(Telepath\) 1.*Thrallherd 1/s);assert.equal(await reserve('Dark Knowledge').innerText(),'9 / 9');
 await page.getByRole('tab',{name:'Spells',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Cast Necrotic Termination',exact:true}).count(),1);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'test-results/archivist-campaign-mobile.png',fullPage:true});
 await page.waitForFunction(async()=>{const rows=JSON.parse((await window.storage.get('char-index')).value);const row=rows.find(r=>r.name==='Archivist Browser');if(!row)return false;const c=JSON.parse((await window.storage.get('char-detail:'+row.id)).value);return c.level===20&&c.spells.some(s=>s.name==='Cure Wounds'&&s.prepared)&&c.slotsUsed?.[1]===1;});
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:'Archivist Browser'}).getByRole('button',{name:'Open character'}).click();assert.match(await page.locator('.sheet-identity').innerText(),/Archivist 18/);
 assert.deepEqual(errors,[]);console.log('PASS campaign preset, level 6 entry and level 20 progression, powers, armor, Dark Knowledge, rests, prayerbook, followers, persistence and mobile');
}catch(e){console.error('Browser errors:',errors);await page.screenshot({path:'test-results/archivist-campaign-failure.png',fullPage:true});throw e;}finally{await browser.close();await server.close();}
