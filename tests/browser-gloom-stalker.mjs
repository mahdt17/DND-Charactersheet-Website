import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const harness=`import React from 'react';import {createRoot} from 'react-dom/client';import ModernLedger from '/src/ModernLedger.jsx';import {PresentationProvider} from '/src/PresentationSettings.jsx';import '/src/index.css';import '/src/modern.css';import '/src/fantasy.css';import '/src/refined.css';window.storage={async get(key){if(key==='char-index')return {value:JSON.stringify(Object.keys(localStorage).filter(k=>k.startsWith('expanded-test:char-detail:')).map(k=>JSON.parse(localStorage.getItem(k))).map(c=>({id:c.id,name:c.name})))};const value=localStorage.getItem('expanded-test:'+key);return value?{value}:null;},async set(key,value){localStorage.setItem('expanded-test:'+key,value);return {value};},async delete(key){localStorage.removeItem('expanded-test:'+key);}};createRoot(document.getElementById('root')).render(React.createElement(PresentationProvider,null,React.createElement(ModernLedger,{theme:'dark',onToggleTheme:()=>{},onSignOut:()=>{}})));`;
const server=await createServer({base:'/',configFile:false,plugins:[{name:'steel-sheet-harness',resolveId:id=>id==='virtual:steel-sheet.js'?id:null,load:id=>id==='virtual:steel-sheet.js'?harness:null,configureServer(s){s.middlewares.use('/__steel-sheet',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body><div id="root"></div><script type="module" src="/@id/virtual:steel-sheet.js"></script></body></html>');});}}],server:{host:'127.0.0.1',port:5314,strictPort:true,hmr:false}});await server.listen();const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
const fixture={id:'gloom',name:'Gloom Stalker live test',ruleset:'2014',className:'Ranger',subclass:'Gloom Stalker',level:15,classDefinition:{name:'Ranger',index:'ranger',edition:'2014'},abilities:{str:10,dex:18,con:14,int:10,wis:16,cha:10},hp:{current:30,max:50,temp:0},speed:30,ac:14,inventory:[{id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true,qty:1}],resources:[],activeEffects:[],spells:[],actions:[],conditions:[],saveProf:{str:true,dex:true},deathSaves:{failure:0,success:0}};
await page.addInitScript(c=>{if(!localStorage.getItem('expanded-test:char-detail:gloom'))localStorage.setItem('expanded-test:char-detail:gloom',JSON.stringify(c));},fixture);
const open=async()=>{await page.locator('.character-card').filter({hasText:'Gloom Stalker live test'}).getByRole('button',{name:'Open character'}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();};
const close=async()=>{const b=page.getByRole('button',{name:'Close dice roller'});if(await b.isVisible())await b.click();};
const history=page.locator('.roll-history');
async function waitForAttack(label){
  await history.getByText(label,{exact:true}).waitFor({state:'visible',timeout:30000});
}
try{
 await page.goto('http://127.0.0.1:5314/__steel-sheet');await open();const p=()=>page.getByRole('region',{name:'Gloom Stalker combat'}).filter({visible:true});await p().waitFor();
 assert.match(await p().innerText(),/darkvision 60 feet/);assert.equal(await p().getByRole('button',{name:'Dread Ambusher extra weapon attack'}).isEnabled(),false);
 await page.getByLabel('Dread Ambusher: this is my first combat turn',{exact:true}).filter({visible:true}).check();assert.match(await page.locator('.vital-tile').filter({hasText:'Walking speed'}).innerText(),/40/);
 await p().getByLabel('Beginning a new first-turn Attack action').check();
 await p().getByRole('button',{name:'Begin Dread Ambusher Attack action'}).click();
 await page.evaluate(()=>{Math.random=()=>0.99});
 await p().getByRole('button',{name:'Dread Ambusher extra weapon attack'}).click();
 await waitForAttack('Longbow · Dread Ambusher · attack');
 assert.equal(await history.getByText('Longbow · Dread Ambusher · attack',{exact:true}).count(),1);
 const bonusDamage=history.locator('.roll-result').filter({hasText:'bonus weapon damage'});
 assert.match(await bonusDamage.innerText(),/2d8/);
 await close();
 assert.equal(await p().getByRole('button',{name:'Dread Ambusher extra weapon attack'}).isEnabled(),false);

 await page.locator('.action-row').filter({hasText:'Longbow'}).getByRole('button',{name:/to hit/}).click();
 await waitForAttack('Longbow · attack');
 assert.equal(await bonusDamage.count(),1,'ordinary attack adds no second Dread bonus');
 await close();

 await p().getByLabel('My weapon attack missed on my turn').check();
 await page.evaluate(()=>{Math.random=()=>0.5});
 await p().getByRole('button',{name:"Stalker's Flurry weapon attack"}).click();
 await waitForAttack("Longbow · Stalker's Flurry · attack");
 assert.equal(await history.locator('.roll-result').filter({hasText:"Stalker's Flurry"}).count(),2);
 await close();
 assert.equal(await p().getByRole('button',{name:"Stalker's Flurry weapon attack"}).isEnabled(),false);
 await p().getByLabel('Shadowy Dodge reaction requirements').check();await p().getByRole('button',{name:'Use Shadowy Dodge reaction'}).click();assert.match(await p().innerText(),/Reaction spent/);
 await page.getByRole('button',{name:'End turn',exact:true}).click();assert.match(await page.locator('.vital-tile').filter({hasText:'Walking speed'}).innerText(),/30/);await page.waitForTimeout(700);await page.reload();await open();assert.equal(await p().getByRole('button',{name:'Dread Ambusher extra weapon attack'}).isEnabled(),false);assert.match(await p().innerText(),/Reaction spent/);await page.getByRole('button',{name:'Start next turn',exact:true}).click();await p().getByLabel('My weapon attack missed on my turn').check();assert.equal(await p().getByRole('button',{name:"Stalker's Flurry weapon attack"}).isEnabled(),true);assert.doesNotMatch(await p().innerText(),/Reaction spent/);
 await page.getByRole('tab',{name:'Traits',exact:true}).click();const traits=page.getByRole('region',{name:'Gloom Stalker combat'}).filter({visible:true});await traits.getByLabel('My weapon attack missed on my turn').check();await traits.getByRole('button',{name:"Stalker's Flurry weapon attack"}).click();await waitForAttack("Longbow · Stalker's Flurry · attack");assert.deepEqual(await page.getByRole('alert').allTextContents(),[]);await close();await page.waitForTimeout(700);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('expanded-test:char-detail:gloom')));assert.equal(saved.saveProf.wis,true);assert.ok(saved.activeEffects.some(e=>e.stateKey==='gloom-flurry-used'));assert.equal(saved.spells.filter(s=>s.classSpellGrant&&s.castingClassId==='2014:ranger').length,4);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByRole('tab',{name:'Actions',exact:true}).click();await page.waitForTimeout(10000);await p().screenshot({path:'test-results/gloom-stalker-mobile.png'});console.log('PASS Gloom actual weapon callback/critical d8, ordinary attack isolation, Flurry/Shadowy Dodge costs, end-turn, reload, Traits callback, training/spells/mobile');
}catch(e){console.log(await page.locator('body').innerText());throw e;}finally{await browser.close();await server.close();}
