import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:5221,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const choose=name=>page.getByRole('button',{name:new RegExp('^'+name+' ')}).first().click();
const panel=()=>page.getByRole('region',{name:'Shadar-kai racial abilities',exact:true});
const saved=name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(r=>r.name===name);return row?JSON.parse((await window.storage.get('char-detail:'+row.id)).value):null;},name);
async function load(c){await page.locator('input[type=file]').setInputFiles({name:'shadar-kai.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();await page.getByRole('tab',{name:'Actions',exact:true}).click();}
try{
 mkdirSync('test-results',{recursive:true});await page.goto('http://127.0.0.1:5221');await page.getByRole('button',{name:'Explore the demo'}).click();const created=[];
 for(const [version,year] of [['mtf',2018],['motm',2022]]){
  const name=`Shadar-kai ${year}`;await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill(name);await next();await choose('Fighter');await next();await page.getByLabel('Search race',{exact:true}).fill('Shadar-kai');
  assert.equal(await page.locator('.creation-choice[data-catalog-id^="2014:shadar-kai-"]').count(),2);const card=page.locator(`[data-catalog-id="2014:shadar-kai-${version}"]`);assert.match(await card.innerText(),new RegExp(String(year)));await card.click();
  if(version==='motm'){await page.getByText('Trance weapon and tool training (optional)',{exact:true}).click();await page.getByLabel('Trance proficiency 1',{exact:true}).selectOption('lute');assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());await page.getByLabel('Trance proficiency 2',{exact:true}).selectOption('herbalism-kit');}
  else assert.equal(await page.getByLabel('Trance proficiency 1',{exact:true}).count(),0);
  await next();await choose(version==='motm'?'Sailor':'Soldier');await next();
  if(version==='motm'){assert(await page.getByRole('heading',{name:'Shadar-kai ability increases',exact:true}).isVisible());await page.getByLabel('Ability increase 1').selectOption('wis');await page.getByLabel('Ability increase 2').selectOption('dex');}
  else assert.equal(await page.getByLabel('Ability increase 1',{exact:true}).count(),0);
  await next();assert(await page.getByRole('button',{name:'Perception',exact:true}).isDisabled());await page.getByRole('button',{name:'Acrobatics',exact:true}).click();await page.getByRole('button',{name:'Survival',exact:true}).click();
  if(version==='motm'){await page.getByLabel('Replacement background skill',{exact:true}).selectOption('Stealth');await page.getByLabel('Shadar-kai language 1',{exact:true}).fill('Elvish');}
  await next();await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:name}).waitFor();let c=await saved(name);console.log('Created '+name);created.push(c);
  assert.equal(c.raceDefinition.catalogId,`2014:shadar-kai-${version}`);assert.deepEqual(c.abilityBonuses,version==='motm'?{wis:2,dex:1}:{dex:2,con:1});assert(c.skillProf.Perception);assert.equal(c.speed,30);assert.match(c.languages,/Common/);assert.match(c.languages,/Elvish/);assert(c.traits.some(t=>t.name==='Necrotic Resistance'));if(version==='motm'){assert(c.skillProf.Stealth);assert.deepEqual(c.shadarKai.trance,['lute','herbalism-kit']);}
  await page.getByRole('tab',{name:'Actions',exact:true}).click();assert.match(await panel().innerText(),new RegExp(String(year)));assert.match(await panel().innerText(),/level 3/i);assert.equal(await panel().getByRole('button',{name:'Start next turn',exact:true}).count(),0);
  const max=version==='motm'?2:1;for(let i=0;i<max;i++)await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).click();assert(await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).isDisabled());
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:name}).getByRole('button',{name:'Open character',exact:true}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();assert.match(await panel().innerText(),new RegExp(`0 / ${max}`));
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Complete short rest',exact:true}).click();assert(await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();
  if(version==='motm'){const trance=page.getByRole('region',{name:'Shadar-kai Trance',exact:true});await trance.getByLabel('Trance proficiency 1',{exact:true}).selectOption('flute');await trance.getByLabel('Trance proficiency 2',{exact:true}).selectOption('poisoners-kit');}else assert.equal(await page.getByRole('region',{name:'Shadar-kai Trance',exact:true}).count(),0);
  await page.getByRole('button',{name:'Complete long rest',exact:true}).click();assert(await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).isEnabled());await page.getByRole('tab',{name:'Traits',exact:true}).click();
  if(version==='motm'){const training=await page.getByRole('region',{name:'Training and proficiencies'}).innerText();assert.match(training,/Flute/);assert.doesNotMatch(training,/Lute/);}
  await page.getByRole('button',{name:'All characters',exact:true}).click();
 }
 const definition=JSON.parse(readFileSync('src/data/classes.json','utf8')).find(c=>c.name==='Wizard');
 const mage={...created[1],name:'Shadar-kai level 5',className:'Wizard',classDefinition:{...definition,edition:'2014'},classLevels:undefined,level:5,hp:{current:20,max:20,temp:0},resources:[],inventory:[{id:'sword',name:'Longsword',equipmentIndex:'longsword',qty:1,equipped:true}],shadarKai:{trance:['longsword','lute']}};
 await load(mage);assert.match(await panel().innerText(),/3 \/ 3/);await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).click();assert.match(await panel().innerText(),/resistance to all damage until the start of your next turn/i);assert.match(await panel().innerText(),/2 \/ 3/);
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:mage.name}).getByRole('button',{name:'Open character',exact:true}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();assert(await panel().getByRole('button',{name:'Start next turn',exact:true}).isVisible());await panel().getByRole('button',{name:'Start next turn',exact:true}).click();assert.equal(await panel().getByRole('button',{name:'Start next turn',exact:true}).count(),0);assert.match(await panel().innerText(),/2 \/ 3/);
 await panel().screenshot({path:'test-results/shadar-kai-actions.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await panel().screenshot({path:'test-results/shadar-kai-actions-mobile.png'});
 await load({...mage,name:'Stunned Shadar-kai',conditions:['Stunned']});assert(await panel().getByRole('button',{name:'Use Blessing of the Raven Queen',exact:true}).isDisabled());
 assert.deepEqual(errors,[]);console.log('PASS both Shadar-kai sources: full creation, distinct bonuses/languages/Trance, Perception overlap, shared uses, turn reminder, rest recovery, persistence, incapacity and mobile layout');
}catch(e){await page.screenshot({path:'test-results/shadar-kai-failure.png',fullPage:true});throw e;}finally{await browser.close();await server.close();}
