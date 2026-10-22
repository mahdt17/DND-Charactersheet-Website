import {openSwarm,selectSwarmAbility,setSwarmSave} from './helpers/entomancer-workspace.mjs';
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {entomancerClass} from '../src/data/entomancer.js';

let server,browser;
before(async()=>{
 server=await createServer({server:{host:'127.0.0.1',port:5200}});await server.listen();
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
});
after(async()=>{await browser?.close();await server?.close();});
const openDemo=async t=>{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
 await page.goto('http://127.0.0.1:5200/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('heading',{name:'Your characters',exact:true}).waitFor();
 return page;
};
const swarm={name:'Usability swarm',ruleset:'2014',className:'Entomancer',classDefinition:entomancerClass,level:10,race:'Human',speed:30,hitDie:'d8',autoArmor:true,hp:{current:50,max:100,temp:0},abilities:{str:12,dex:14,con:16,int:10,wis:18,cha:10},abilityBonuses:{},inventory:[],spells:[],actions:[],entomancer:{species:'Orthoptera',tool:'Herbalism Kit',instrument:'Lute',moisture:'Dry',temperature:'Hot'}};
const importSwarm=async(page,overrides={})=>{
 await page.locator('input[type=file]').setInputFiles({name:'swarm.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...swarm,...overrides}))});
 await page.locator('.sheet-identity').filter({hasText:swarm.name}).waitFor();
};
const next=page=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const choose=(page,name)=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title',{hasText:new RegExp(`^${name}$`)})}).first().click();

test('creation names the missing choice and waits for interaction before showing a field error',async t=>{
 const page=await openDemo(t);await page.getByRole('button',{name:'Create character',exact:true}).click();
 const name=page.getByLabel('Character name');
 assert.notEqual(await name.getAttribute('aria-invalid'),'true');
 assert.match(await page.locator('.creation-footer-status').innerText(),/name.*2 characters/i);
 await name.fill('A');await name.press('Tab');
 assert.equal(await name.getAttribute('aria-invalid'),'true');
 await name.fill('Friendly hero');await next(page);
 assert.match(await page.locator('.creation-footer-status').innerText(),/choose a class/i);
 await page.getByLabel('Search class').fill('Entomancer');await choose(page,'Entomancer');await next(page);
 assert.match(await page.locator('.creation-footer-status').innerText(),/choose a species or race/i);
 await choose(page,'Human');await next(page);await choose(page,'Soldier');await next(page);await next(page);
 await page.getByLabel('Swarm species').selectOption('Decomposers');await page.getByLabel('Entomancer tool proficiency').selectOption('Herbalism Kit');
 assert.match(await page.locator('.creation-footer-status').innerText(),/choose 3 more class skills/i);
 await page.getByRole('button',{name:'Arcana',exact:true}).click();
 assert.match(await page.locator('.creation-footer-status').innerText(),/choose 2 more class skills/i);
});

test('mobile shortcuts reach the play panel and tabs work with the keyboard',async t=>{
 const page=await openDemo(t);await importSwarm(page);await page.setViewportSize({width:390,height:844});
 const shortcuts=page.getByRole('navigation',{name:'Character shortcuts'});
 assert.equal(await shortcuts.count(),1);
 assert((await shortcuts.boundingBox()).y<600,'shortcuts are near the character header');
 await shortcuts.getByRole('button',{name:'Spells',exact:true}).click();
 const spells=page.getByRole('tab',{name:'Spells',exact:true});
 assert.equal(await spells.getAttribute('aria-selected'),'true');
 assert.equal(await spells.evaluate(el=>el===document.activeElement),true);
 assert((await spells.boundingBox()).y<180,'shortcut brings the tabs into view');
 await spells.press('ArrowRight');
 assert.equal(await page.getByRole('tab',{name:'Inventory',exact:true}).getAttribute('aria-selected'),'true');
 assert.equal(await page.getByRole('tabpanel').getAttribute('aria-labelledby'),'sheet-tab-inventory');
 await page.getByRole('tab',{name:'Inventory',exact:true}).press('End');
 const notes=page.getByRole('tab',{name:'Notes',exact:true});
 await page.waitForFunction(()=>document.activeElement?.id==='sheet-tab-notes');
 const box=await notes.boundingBox();
 assert(box.x>=0&&box.x+box.width<=390,'keyboard selection reveals the last tab horizontally');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
});

test('hit point controls explain the amount and announce the resulting HP',async t=>{
 const page=await openDemo(t);await importSwarm(page);
 assert.match(await page.locator('.hp-adjustment').innerText(),/amount/i);
 await page.getByLabel('Hit point adjustment').fill('5');await page.getByRole('button',{name:'Damage',exact:true}).click();
 assert.match(await page.getByRole('status').filter({hasText:'Damage recorded'}).innerText(),/45 \/ 100 HP/);
 await page.getByRole('button',{name:'Heal',exact:true}).click();
 assert.match(await page.getByRole('status').filter({hasText:'Healing recorded'}).innerText(),/50 \/ 100 HP/);
});

test('swarm play comes before reference settings and resolves actions with clear feedback',async t=>{
 const page=await openDemo(t);await importSwarm(page);
 const panel=page.getByRole('region',{name:'Entomancer swarm'}),ability=page.locator('[data-swarm-action="pestilence"]');
 assert.equal(await panel.getByText('Swarm choices & table rulings',{exact:true}).count(),0,'reference settings stay in Recovery');
 assert(await ability.isVisible());
 assert.equal(await page.getByLabel('Target creature type',{exact:true}).count(),0,'pestilence does not ask for an unused type');
 await page.getByLabel('Target or corpse name').fill('Guard');await setSwarmSave(page,false);await page.getByRole('button',{name:'Use Glaring Pestilence',exact:true}).click();
 assert.match(await panel.getByRole('status').innerText(),/Glaring Pestilence/);
 assert.equal(await page.getByRole('group',{name:'Population resource'}).locator('.resource-count').innerText(),'13 / 14');
 const resource=page.getByRole('group',{name:'Population resource'});
 assert.match(await resource.innerText(),/Long rest.*fed/s);
 await openSwarm(page,'recovery');const recovery=panel.getByRole('region',{name:'Swarm recovery',exact:true});await recovery.getByText('Adjust Population manually',{exact:true}).click();
 await recovery.getByLabel('Population amount').fill('5');await recovery.getByRole('button',{name:'Restore Population',exact:true}).click();
 assert.match(await recovery.getByRole('status').innerText(),/1 Population restored/);
});

test('completing swarm setup keeps focus on the edited choice',async t=>{
 const page=await openDemo(t);await importSwarm(page,{entomancer:{...swarm.entomancer,tool:''}});
 await page.getByRole('button',{name:'Complete swarm setup',exact:true}).click();
 const tool=page.getByLabel('Entomancer tool proficiency');
 await tool.focus();await tool.selectOption('Herbalism Kit');
 assert.equal(await tool.evaluate(el=>el===document.activeElement),true);
 assert.equal(await tool.isVisible(),true);
 await tool.selectOption('');
 assert.equal(await tool.evaluate(el=>el===document.activeElement),true);
});
