import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:5217,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:new RegExp('^'+name+'$')})}).first().click();
const saved=name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(r=>r.name===name);return row?JSON.parse((await window.storage.get('char-detail:'+row.id)).value):null;},name);
const panel=()=>page.getByRole('region',{name:'Aasimar racial abilities',exact:true});
const variants=[['Protector Aasimar','wis','Radiant Soul'],['Scourge Aasimar','con','Radiant Consumption'],['Fallen Aasimar','str','Necrotic Shroud']];
const created=[];
async function load(c){await page.locator('input[type=file]').setInputFiles({name:'aasimar.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();await page.getByRole('tab',{name:'Actions',exact:true}).click();}
try{
 mkdirSync('test-results',{recursive:true});await page.goto('http://127.0.0.1:5217');await page.getByRole('button',{name:'Explore the demo'}).click();
 for(const [variant,bonus,feature] of variants){
  const name='Create '+variant;await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill(name);await next();await choose('Fighter');await next();
  await page.getByLabel('Search race',{exact:true}).fill('Aasimar');await page.locator('[data-catalog-id="2014:aasimar-vgm"]').click();
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Aasimar requires a variant');
  await page.getByLabel('Lineage or subrace',{exact:true}).waitFor();assert.equal(await page.getByLabel('Lineage or subrace',{exact:true}).locator('option').count(),4);
  await page.getByLabel('Lineage or subrace',{exact:true}).selectOption(variant);await page.getByText('Species traits',{exact:true}).click();
  assert.match(await page.locator('details[open]').innerText(),new RegExp(feature));
  if(bonus==='wis')await page.locator('.creation-shell').screenshot({path:'test-results/aasimar-creation.png'});
  await next();await choose('Soldier');await next();await next();
  await page.getByRole('button',{name:'Perception',exact:true}).click();await page.getByRole('button',{name:'Survival',exact:true}).click();
  assert.match(await page.getByRole('dialog',{name:'Guided character setup'}).innerText(),/Common/);assert.match(await page.getByRole('dialog',{name:'Guided character setup'}).innerText(),/Celestial/);
  await next();await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
  const c=await saved(name);created.push(c);assert.deepEqual(c.abilityBonuses,{cha:2,[bonus]:1});assert.equal(c.speed,30);assert.equal(c.subrace,variant);assert.match(c.languages,/Common/);assert.match(c.languages,/Celestial/);assert(c.traits.some(t=>t.name===feature));assert.equal(c.spells.length,0);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();await panel().getByRole('button',{name:feature,exact:true}).click();assert(await panel().getByRole('button',{name:'Activate '+feature,exact:true}).isDisabled());
  await page.getByRole('tab',{name:'Spells',exact:true}).click();const light=page.getByRole('region',{name:'Aasimar Light Bearer',exact:true});assert.match(await light.innerText(),/Charisma.*DC 10/s);
  await light.getByRole('button',{name:'Cast Light',exact:true}).click();await light.getByRole('button',{name:'Cast Light',exact:true}).click();assert.match(await light.innerText(),/Light cast/);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
 }
 console.log('PASS 5e creation of all three Aasimar variants, required selection, fixed bonuses, saved traits/languages, level gate and additional racial Light');
 for(let i=0;i<variants.length;i++){
  const [variant,,feature]=variants[i],c={...created[i],name:'Level 5 '+variant,level:5,classLevels:created[i].classLevels.map(r=>({...r,level:5})),abilities:{str:10,dex:10,con:10,int:20,wis:10,cha:16},abilityBonuses:{},hp:{current:7,max:30,temp:2},resources:[]};
  await load(c);await panel().getByRole('button',{name:'Use Healing Hands',exact:true}).click();assert(await panel().getByRole('button',{name:'Use Healing Hands',exact:true}).isDisabled());
  await panel().getByRole('button',{name:feature,exact:true}).click();await panel().getByRole('button',{name:'Activate '+feature,exact:true}).click();assert.match(await panel().innerText(),/active/);
  if(i===0)assert.match(await panel().innerText(),/Flying speed: 30 feet/);
  if(i===1){assert.match(await panel().innerText(),/3 radiant damage/);assert.match(await panel().innerText(),/1 damage after.*resistance/i);}
  if(i===2){assert.match(await panel().innerText(),/Charisma save DC 14/);assert.match(await panel().innerText(),/do not grant flight/);}
  let state;for(let n=0;n<100;n++){state=await saved(c.name);if(state?.hp.current===12&&state.aasimar?.transformation)break;await page.waitForTimeout(50);}assert.equal(state.hp.current,12);assert.equal(state.hp.temp,2);assert(state.aasimar.transformation);
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:c.name}).getByRole('button',{name:'Open character',exact:true}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();await panel().getByRole('button',{name:feature,exact:true}).click();assert(await panel().getByRole('button',{name:'End '+feature,exact:true}).isVisible());assert(await panel().getByRole('button',{name:'Activate '+feature,exact:true}).isDisabled());
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Complete short rest',exact:true}).click();assert.equal(await panel().getByRole('button',{name:'End '+feature,exact:true}).count(),0);assert(await panel().getByRole('button',{name:'Activate '+feature,exact:true}).isDisabled());
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();assert(await panel().getByRole('button',{name:'Activate '+feature,exact:true}).isEnabled());
  if(i===1){await panel().getByRole('button',{name:'Activate '+feature,exact:true}).click();await page.setViewportSize({width:1440,height:6000});await page.evaluate(()=>scrollTo(0,0));await panel().screenshot({path:'test-results/aasimar-actions-desktop.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:390,height:7000});await page.evaluate(()=>scrollTo(0,0));await panel().screenshot({path:'test-results/aasimar-actions-mobile.png'});await page.setViewportSize({width:1440,height:1100});}
 }
 const wizard=JSON.parse(readFileSync('src/data/classes.json','utf8')).find(c=>c.name==='Wizard'),mage={...created[0],name:'Charisma racial Light Wizard',className:'Wizard',classDefinition:{...wizard,edition:'2014'},classLevels:undefined,level:5,abilities:{str:10,dex:10,con:10,int:20,wis:10,cha:16},abilityBonuses:{},hp:{current:20,max:20,temp:0},resources:[],spells:[],slotsUsed:{}};
 await load(mage);await page.getByRole('tab',{name:'Spells',exact:true}).click();const light=page.getByRole('region',{name:'Aasimar Light Bearer',exact:true});assert.match(await light.innerText(),/Charisma.*DC 14/s);await light.getByRole('button',{name:'Cast Light',exact:true}).click();await light.getByRole('button',{name:'Light details',exact:true}).click();await page.getByRole('dialog',{name:'Light',exact:true}).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 const fighter=JSON.parse(readFileSync('src/data/classes.json','utf8')).find(c=>c.name==='Fighter');
 const mixed={...mage,name:'Multiclass racial Light',classLevels:[{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:2,definition:fighter},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:3,definition:wizard}]};
 await load(mixed);await page.getByRole('tab',{name:'Spells',exact:true}).click();assert.equal(await page.getByRole('region',{name:'Aasimar Light Bearer',exact:true}).count(),1);assert.match(await light.innerText(),/Charisma.*DC 14/s);await page.getByLabel('Spellcasting class').filter({visible:true}).selectOption('2014:wizard');assert.match(await light.innerText(),/Charisma.*DC 14/s);await light.getByRole('button',{name:'Cast Light',exact:true}).click();const mixedSaved=await saved(mixed.name);assert.deepEqual(mixedSaved.slotsUsed,{});assert.equal(mixedSaved.spells.length,0);
 await load({...mage,name:'Unavailable Aasimar',conditions:['Stunned']});assert(await panel().getByRole('button',{name:'Use Healing Hands',exact:true}).isDisabled());await panel().getByRole('button',{name:'Radiant Soul',exact:true}).click();assert(await panel().getByRole('button',{name:'Activate Radiant Soul',exact:true}).isDisabled());
 assert.deepEqual(errors,[]);console.log('PASS Aasimar healing, all level-3 transformations, correct aura/flight/DC, shared uses, short/long rests, save/reopen, Wizard/multiclass racial Light and phone layout');
}catch(e){await page.screenshot({path:'test-results/aasimar-failure.png',fullPage:true});throw e;}finally{await browser.close();await server.close();}
