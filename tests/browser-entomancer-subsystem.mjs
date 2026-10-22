import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {entomancerClass} from '../src/data/entomancer.js';
import {openSwarm,selectSwarmAbility as choose,setSwarmSave} from './helpers/entomancer-workspace.mjs';
const server=await createServer({server:{host:'127.0.0.1',port:5202}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base={name:'Swarm subsystem',ruleset:'2014',className:'Entomancer',classDefinition:entomancerClass,level:18,race:'Human',speed:30,hitDie:'d8',abilities:{str:12,dex:14,con:16,int:10,wis:18,cha:10},hp:{current:70,max:100,temp:0},inventory:[],actions:[],spells:[],resources:[{id:'2014:Entomancer:population',used:4},{id:'potions',name:'Potions',used:1,max:3,manual:true,reset:'none'}],entomancer:{species:'Decomposers',tool:'Herbalism Kit',moisture:'Dry',temperature:'Hot'}};
const workspace=()=>page.getByRole('region',{name:'Entomancer swarm',exact:true}),count=()=>workspace().locator('.resource-count');
const importChar=async c=>{await page.locator('input[type=file]').setInputFiles({name:'swarm.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();};
try{
 await page.goto('http://127.0.0.1:5202');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character',exact:true}).click();await importChar(base);
 assert.equal(await workspace().getByRole('button',{name:'Abilities',exact:true}).count(),1,'Swarm needs focused section navigation');
 await choose(page,'bug-swarm');assert.equal(await workspace().getByRole('button',{name:'Use Bug Swarm',exact:true}).isDisabled(),true);await workspace().getByLabel('Target or corpse name').fill('Ogre');await setSwarmSave(page,false);
 await choose(page,'bug-armor');await choose(page,'bug-swarm');assert.equal(await workspace().getByLabel('Target or corpse name').inputValue(),'Ogre');
 await workspace().getByRole('button',{name:'Use Bug Swarm',exact:true}).click();assert.equal(await count().innerText(),'18 / 24');assert.match(await workspace().getByRole('status',{name:'Last swarm action'}).innerText(),/Ogre.*necrotic damage.*2 Population spent/s);
 await openSwarm(page,'active');assert.match(await workspace().innerText(),/No ongoing swarm effects/);assert.equal(await count().innerText(),'18 / 24');
 await choose(page,'bug-armor');await workspace().getByRole('button',{name:'Use Bug Armor',exact:true}).click();await openSwarm(page,'active');assert.match(await workspace().innerText(),/Bug Armor.*10 rounds.*3 Population/s);await workspace().getByText('Advance game time',{exact:true}).click();await workspace().getByRole('button',{name:'Advance 1 minute',exact:true}).click();assert.equal(await count().innerText(),'18 / 24');
 await choose(page,'summon');await workspace().getByLabel('Target or corpse name').fill('Scouts');await workspace().getByRole('button',{name:'Use Swarm Summon',exact:true}).click();await openSwarm(page,'creatures');assert.match(await workspace().innerText(),/Return.*2 Population/s);await workspace().getByLabel('Scouts current HP').fill('10');assert.match(await workspace().innerText(),/Return.*1 Population/s);await workspace().getByRole('button',{name:/^Return Scouts/}).click();assert.equal(await count().innerText(),'17 / 24');
 await openSwarm(page,'recovery');await workspace().getByRole('button',{name:'Long rest · refill Population',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();assert.equal(await count().innerText(),'24 / 24');
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/swarm-subsystem-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/swarm-subsystem-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS Swarm workspace navigation, drafts, full rules, action results, refunds, creatures, recovery and phone layout');
}finally{await browser.close();await server.close();}
