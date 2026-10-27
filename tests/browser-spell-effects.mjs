import assert from 'node:assert/strict';

import {createServer} from 'vite';

import {chromium} from 'playwright';

const fixture={id:'effect-hero',name:'Effects hero',ruleset:'2014',className:'Wizard',classDefinition:{index:'wizard',name:'Wizard',edition:'2014'},level:5,autoArmor:true,ac:13,abilities:{str:10,dex:16,con:14,int:18,wis:18,cha:10},hp:{current:3,max:20,temp:2},inventory:[],spells:[],resources:[],slotsUsed:{},skillProf:{}};

const harness=`import React from 'react';import {createRoot} from 'react-dom/client';import Spellbook from '/src/EditionSpellbook.jsx';import CampaignSpells from '/src/CampaignSpells.jsx';import {allSpells} from '/src/lib/editions.js';import {sheetArmorFor,rollDice} from '/src/lib/rules.js';import '/src/index.css';import '/src/modern.css';function App(){const initial=${JSON.stringify(fixture)};initial.spells=allSpells.filter(s=>s.edition==='2014'&&['Shield','Mage Armor'].includes(s.name)).map(s=>({...s,id:s.name,prepared:true}));const [char,setChar]=React.useState(()=>JSON.parse(localStorage.getItem('effects-test')||'null')||initial);const [campaign,setCampaign]=React.useState(false);window.effectState=char;window.resetEffects=changes=>setChar({...initial,...changes});window.setCampaign=setCampaign;const patch=values=>setChar(c=>{const next={...c,...(typeof values==='function'?values(c):values)};localStorage.setItem('effects-test',JSON.stringify(next));return next;});const roll=(expression,label)=>{window.effectRolls=[...(window.effectRolls||[]),{expression,label}];return window.failHealing?null:rollDice(expression,'normal',()=>0);};return React.createElement(React.Fragment,null,React.createElement('p',{'data-testid':'armor'},'AC '+sheetArmorFor(char,char.abilities)),React.createElement(campaign?CampaignSpells:Spellbook,{char,patch,roll,show:()=>{}}));}createRoot(document.getElementById('root')).render(React.createElement(App));`;

const server=await createServer({base:'/',plugins:[{name:'spell-effect-harness',resolveId:id=>id==='virtual:spell-effect-test.js'?id:null,load:id=>id==='virtual:spell-effect-test.js'?harness:null,configureServer(server){server.middlewares.use('/__spell-effects',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body><div id="root"></div><script type="module" src="/@id/virtual:spell-effect-test.js"></script></body></html>');});}}],server:{host:'127.0.0.1',port:5243,strictPort:true,hmr:false}});await server.listen();

const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(7000);

const open=async name=>page.locator('.spell-item').filter({has:page.locator('.spell-name strong').filter({hasText:new RegExp('^'+name+'$')})}).getByRole('button',{name:'Cast',exact:true}).click();

try{

 await page.goto('http://127.0.0.1:5243/__spell-effects');await open('Mage Armor');

 assert.equal(await page.getByLabel('Spell recipient',{exact:true}).count(),1,'Mage Armor must ask who receives its effect');

 await page.getByLabel('Spell recipient',{exact:true}).selectOption('self');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).slotsUsed[1],1);assert.equal(await page.getByTestId('armor').innerText(),'AC 16');

 await open('Shield');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal(await page.getByTestId('armor').innerText(),'AC 21');

 await page.reload();assert.equal(await page.getByTestId('armor').innerText(),'AC 21');

 await page.getByRole('button',{name:'Start next turn',exact:true}).click();assert.equal(await page.getByTestId('armor').innerText(),'AC 16');

 await page.getByRole('button',{name:'End Mage Armor',exact:true}).click();assert.equal(await page.getByTestId('armor').innerText(),'AC 13');
 assert.equal(await page.getByLabel('Search spellbook',{exact:true}).count(),1,'Shared spellbook retains owned-spell searching');await page.getByLabel('Search spellbook',{exact:true}).fill('Shield');assert.equal(await page.locator('.spell-item').count(),1);await page.getByLabel('Search spellbook',{exact:true}).fill('');
 await page.getByLabel('Spellbook filter',{exact:true}).selectOption('cantrips');assert.equal(await page.locator('.spell-item').count(),0);await page.getByLabel('Spellbook filter',{exact:true}).selectOption('all');assert.equal(await page.locator('.spell-item').count(),2);

 await page.evaluate(async()=>{const {allSpells}=await import('/src/lib/editions.js');window.resetEffects({className:'Cleric',classDefinition:{index:'cleric',name:'Cleric',edition:'2014'},spells:[{...allSpells.find(s=>s.edition==='2014'&&s.name==='Healing Word'),id:'heal',prepared:true}]});window.effectRolls=[];});

 await open('Healing Word');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).slotsUsed[1],undefined,'Missing recipient must not spend');

 await page.getByLabel('Spell recipient',{exact:true}).selectOption('self');await page.evaluate(()=>window.failHealing=true);await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).slotsUsed[1],undefined,'Missing healing result must not spend');

 await page.evaluate(()=>{window.failHealing=false;window.effectRolls=[];});await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).hp.current,8);assert.equal(await page.evaluate(()=>window.effectRolls.length),1,'Reuse one healing roll');

 await open('Healing Word');await page.getByLabel('Spell recipient',{exact:true}).selectOption('other');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).hp.current,8,'Other creature never heals caster');

 await page.evaluate(async()=>{const {campaignClasses,campaignIds}=await import('/src/data/archivistCampaign.js');const {allSpells}=await import('/src/lib/editions.js');window.resetEffects({className:'Archivist',classDefinition:campaignClasses.find(c=>c.name==='Archivist'),spells:[{...allSpells.find(s=>s.edition==='2014'&&s.name==='Cure Wounds'),id:'heal',prepared:true,castingClassId:campaignIds.archivist}],archivistCampaign:{}});window.setCampaign(true);window.effectRolls=[];});

 await open('Cure Wounds');assert.equal(await page.getByLabel('Spell recipient',{exact:true}).count(),1,'Campaign healing must ask for its recipient');

 await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).slotsUsed[1],undefined);

 await page.getByLabel('Spell recipient',{exact:true}).selectOption('self');await page.evaluate(()=>window.failHealing=true);await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).slotsUsed[1],undefined);

 await page.evaluate(()=>{window.failHealing=false;window.effectRolls=[];});await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal((await page.evaluate(()=>window.effectState)).hp.current,8);assert.equal(await page.evaluate(()=>window.effectRolls.length),1);assert.equal(await page.getByRole('button',{name:/^Roll Healing/}).count(),0,'No second self-healing roll after committing the cast');
 await page.goto('http://127.0.0.1:5243'+server.config.base);await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Create character',exact:true}).click();
 const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click(),choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:new RegExp('^'+name+'$')})}).first().click();
 await page.getByLabel('Character name',{exact:true}).fill('Spell Effects Wizard');await next();await page.getByLabel('Search class',{exact:true}).fill('Wizard');await choose('Wizard');await next();await choose('Human');await next();await choose('Noble');await next();await next();await page.getByRole('button',{name:'Arcana',exact:true}).click();await page.getByRole('button',{name:'Investigation',exact:true}).click();await page.getByLabel('Human language 1',{exact:true}).fill('Dwarvish');await page.getByLabel('Noble language 1',{exact:true}).fill('Elvish');await next();
 async function pick(label,name){const region=page.getByRole('region',{name:label,exact:true});await region.getByLabel('Search spells',{exact:true}).fill(name);await region.getByRole('button',{name:new RegExp('^Select '+name+' \\(5e')}).first().click();}
 for(const name of ['Light','Mage Hand','Minor Illusion'])await pick('Cantrips',name);
 for(const name of ['Absorb Elements','Shield','Mage Armor','Magic Missile','Sleep','Detect Magic'])await pick('Starting spells',name);
 await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:'Spell Effects Wizard'}).waitFor();await page.getByRole('tab',{name:'Spells',exact:true}).click();assert.equal(await page.locator('.spell-item').filter({hasText:'Absorb Elements'}).count(),1,'Absorb Elements is saved from creation');
 const mageRow=page.locator('.spell-item').filter({hasText:'Mage Armor'});if(await mageRow.getByRole('button',{name:'Prepare',exact:true}).count()){const first=page.locator('.spell-item').getByRole('button',{name:'Prepared',exact:true}).first();if(await first.count())await first.click();await mageRow.getByRole('button',{name:'Prepare',exact:true}).click();}
 await open('Mage Armor');assert.equal(await page.getByLabel('Spell recipient',{exact:true}).count(),1,'Freshly created standard 2014 Wizard must use shared casting effects');
 await page.getByLabel('Spell recipient',{exact:true}).selectOption('self');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();
 const armorTile=()=>page.locator('.vital-tile').filter({hasText:'Armor class'}).locator('strong');assert.equal(await armorTile().innerText(),'15','Mage Armor immediately changes the real sheet AC');
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Complete short rest',exact:true}).click();assert.equal(await armorTile().innerText(),'15');assert.match(await page.getByRole('region',{name:'Active spell effects'}).innerText(),/420 minutes/);
 await page.getByRole('button',{name:'Manage spells',exact:true}).click();const starting=page.getByRole('region',{name:'Spellbook spells',exact:true});await starting.getByLabel('Search spells',{exact:true}).fill('Absorb Elements');assert.equal(await starting.getByRole('button',{name:/^Remove Absorb Elements/}).count(),1,'Management retains ownership of the creation reference spell');await page.getByRole('button',{name:'Done',exact:true}).last().click();
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();assert.equal(await armorTile().innerText(),'12');assert.equal(await page.getByRole('region',{name:'Active spell effects'}).count(),0);
 await open('Shield');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();assert.equal(await armorTile().innerText(),'17');await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Armor class',{exact:true}).fill('19');await page.getByRole('dialog',{name:'Edit character'}).getByRole('button',{name:'Done',exact:true}).click();assert.equal(await armorTile().innerText(),'24','Manual base AC retains Shield');await page.getByRole('button',{name:'Start next turn',exact:true}).click();assert.equal(await armorTile().innerText(),'19');

 assert.deepEqual(errors,[]);console.log('PASS recipient, automatic AC, slot spend, persistence, next turn and end effect controls');

}finally{await browser.close();await server.close();}
