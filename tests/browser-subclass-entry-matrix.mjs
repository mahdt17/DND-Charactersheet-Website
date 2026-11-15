import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
// Real Ledger/GuidedSetup/LevelUp UI with durable browser storage, because the public demo intentionally resets on browser reload.
const harness=`import React from 'react';import {createRoot} from 'react-dom/client';import ModernLedger from '/src/ModernLedger.jsx';import {PresentationProvider} from '/src/PresentationSettings.jsx';import '/src/index.css';import '/src/modern.css';import '/src/fantasy.css';import '/src/refined.css';window.storage={async get(key){if(key==='char-index')return {value:JSON.stringify(Object.keys(localStorage).filter(k=>k.startsWith('expanded-test:char-detail:')&&!k.endsWith('ledger-workspace')).map(k=>JSON.parse(localStorage.getItem(k))).map(c=>({id:c.id,name:c.name})))};const value=localStorage.getItem('expanded-test:'+key);return value?{value}:null;},async set(key,value){localStorage.setItem('expanded-test:'+key,value);return {value};},async delete(key){localStorage.removeItem('expanded-test:'+key);}};createRoot(document.getElementById('root')).render(React.createElement(PresentationProvider,null,React.createElement(ModernLedger,{theme:'dark',onToggleTheme:()=>{},onSignOut:()=>{}})));`;
const server=await createServer({configFile:false,base:'/',plugins:[{name:'entry-proof-harness',resolveId:id=>id==='virtual:entry-proof.js'?id:null,load:id=>id==='virtual:entry-proof.js'?harness:null,configureServer(server){server.middlewares.use('/__entry-proof',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body><div id="root"></div><script type="module" src="/@id/virtual:entry-proof.js"></script></body></html>');});}}],server:{host:'127.0.0.1',port:5399,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));

const cases=[['Artificer','Battle Smith',3,'battle-smith'],['Barbarian','Berserker',3,'berserker'],['Bard','Valor',3,'valor'],['Cleric','Life',1,'life'],['Druid','Moon',2,'moon'],['Fighter','Champion',3,'champion'],['Monk','Open Hand',3,'open-hand'],['Paladin','Devotion',3,'devotion'],['Ranger','Gloom Stalker',3,'gloom-stalker'],['Rogue','Thief',3,'thief'],['Sorcerer','Wild Magic',1,'wild-magic'],['Warlock','Fiend',1,'fiend'],['Wizard','Bladesinging',2,'bladesinging']];
const choose=async name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:new RegExp('^'+name+'$')})}).first().click();
const footer=()=>page.locator('.creation-footer').filter({visible:true});
const next=()=>footer().getByRole('button',{name:'Continue',exact:true}).click();
async function saved(name){await page.waitForTimeout(600);return page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(c=>c.name===name);return JSON.parse((await window.storage.get('char-detail:'+row.id)).value);},name);}
async function featureChoices(scope=page){
 for(let pass=0;pass<3;pass++){
  for(const group of await scope.locator('.feature-choice-group').all()){
   if(!await group.isVisible())continue;
   for(const select of await group.locator('select').all())if(!await select.inputValue()){const value=await select.locator('option:not([disabled])').evaluateAll(xs=>xs.find(x=>x.value)?.value);if(value)await select.selectOption(value);}
   const radios=group.getByRole('radio');if(await radios.count()&&!await group.locator('input[type=radio]:checked').count())await radios.first().check();
   const text=await group.innerText(),match=text.match(/Choose (\d+)/),required=match?Number(match[1]):0;
   for(let count=await group.locator('input[type=checkbox]:checked').count();count<required;count++){const available=group.locator('input[type=checkbox]:not(:checked):not([disabled])');if(!await available.count())break;await available.first().check();}
  }
 }
}
async function spells(scope=page){
 for(const region of await scope.locator('section.spell-picker').all()){
  if(!await region.isVisible())continue;
  const summary=await region.locator('.l-section-head strong, .creation-section-title [aria-live]').innerText(),m=summary.match(/(\d+)\s*\/\s*(\d+)/);if(!m)continue;
  for(let i=Number(m[1]);i<Number(m[2]);i++)await region.getByRole('button',{name:/^Select /}).filter({visible:true}).first().click();
 }
}
async function create(className,subclass,entry,slug){
 const name='Entry proof '+className;
 await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill(name);await next();await page.getByLabel('Search class',{exact:true}).fill(className);await choose(className);await next();await page.getByLabel('Search race',{exact:true}).fill('Human');await choose('Human');await next();await choose('Soldier');await next();await next();
 const picker=page.getByLabel(className+' subclass source',{exact:true});assert.equal(await picker.count(),entry===1?1:0,'creation entry picker '+className);if(entry===1)await picker.selectOption('2014:subclass:'+className.toLowerCase()+':'+slug);
 const skillTitle=await page.getByRole('heading',{name:/Class skills/}).innerText(),required=Number(skillTitle.match(/choose (\d+)/)[1]);for(let i=0;i<required;i++)await page.locator('.skill-pill:not(.is-selected):not([disabled])').first().click();await page.getByLabel('Human language 1',{exact:true}).fill('Elvish');await featureChoices();await next();await spells();await next();await featureChoices();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
 let c=await saved(name);assert.equal(c.classLevels.length,1);assert.equal(c.classLevels[0].name,className);assert.equal(c.classLevels[0].level,1);if(entry>1)assert(!c.classLevels[0].subclassId,'no premature subclass '+className);
 if(className==='Artificer'){assert.equal(c.classDefinition.referenceOnly,false);assert.equal(c.classDefinition.spellcastingAbility,'int');assert(c.saveProf.con&&c.saveProf.int);}
 for(let level=2;level<=entry;level++){
  await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();let seen=false;for(let screen=0;screen<5;screen++){const p=page.getByLabel(className+' subclass source',{exact:true});if(await p.count()){assert.equal(level,entry,'no early entry '+className+level);assert.match(await p.innerText(),new RegExp(subclass));await p.selectOption('2014:subclass:'+className.toLowerCase()+':'+slug);seen=true;}if(await page.getByRole('button',{name:'Apply level up',exact:true}).count())break;await featureChoices();await spells();await next();}assert.equal(seen,level===entry,'entry picker at '+className+level);await page.getByRole('button',{name:'Apply level up',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Complete class feature choices',exact:true});if(await dialog.isVisible()){await featureChoices(dialog);await dialog.getByRole('button',{name:'Save level and choices',exact:true}).click();}
 }
 c=await saved(name);assert.equal(c.classLevels[0].level,entry);assert.equal(c.classLevels[0].subclassId,'2014:subclass:'+className.toLowerCase()+':'+slug);const owner=c.classLevels[0].catalogId;await page.reload();await page.locator('.character-card').filter({hasText:name}).getByRole('button',{name:'Open character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:name}).waitFor();const reloaded=await saved(name);assert.equal(reloaded.classLevels[0].catalogId,owner);assert.equal(reloaded.classLevels[0].subclassId,c.classLevels[0].subclassId);assert.equal(reloaded.classLevels[0].level,entry);console.log('PASS actual creation/entry/reload '+className+' '+subclass+' '+entry);await page.getByRole('button',{name:'All characters',exact:true}).click();
}
try{mkdirSync('test-results',{recursive:true});await page.goto('http://127.0.0.1:5399/__entry-proof');for(const c of cases)await create(...c);assert.deepEqual(errors,[]);console.log('PASS all13 actual creation/entry ownership and reload');}catch(e){await page.screenshot({path:'test-results/entry-proof-failure.png',fullPage:true});console.error((await page.locator('body').innerText()).slice(-11000));throw e;}finally{await browser.close();await server.close();}
