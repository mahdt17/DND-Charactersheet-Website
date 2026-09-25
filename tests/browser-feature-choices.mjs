import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5179}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title',{hasText:new RegExp(`^${name}$`)})}).first().click();
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(r=>r.name===name).id)).value);},name);
try {
 await fs.mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:5179/');await page.getByRole('button',{name:'Explore the demo'}).click();
 for(const edition of ['2014','2024']) {
  const name=`Guided Rogue ${edition}`;
  if(await page.getByRole('button',{name:'All characters',exact:true}).count())await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill(name);
  if(edition==='2024')await page.locator('.creation-choice').filter({hasText:'5.5e'}).click();await next();await page.getByLabel('Search class').fill('Rogue');await choose('Rogue');await next();await choose(edition==='2014'?'Human':'Dwarf');await next();await choose(edition==='2014'?'Noble':'Soldier');await next();
  if(edition==='2024'){await page.getByLabel('Ability increase 1').selectOption('dex');await page.getByLabel('Ability increase 2').selectOption('con');}await next();
  for(const skill of ['Stealth','Sleight of Hand','Deception','Investigation'])await page.getByRole('button',{name:skill,exact:true}).click();
  if(edition==='2014'){await page.getByLabel('Human language 1',{exact:true}).selectOption('Dwarvish');await page.getByLabel('Noble language 1',{exact:true}).selectOption('Elvish');}
  else {await page.getByLabel('Origin language 1',{exact:true}).selectOption('Dwarvish');await page.getByLabel('Origin language 2',{exact:true}).selectOption('Elvish');await page.getByLabel('Thieves’ Cant feature language 1',{exact:true}).selectOption('Goblin');}
  await next();await next();assert(await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  assert.equal(await page.getByLabel('Rogue 1 Expertise: Arcana',{exact:true}).count(),0);await page.getByLabel('Rogue 1 Expertise: Stealth',{exact:true}).check();assert(await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByLabel(`Rogue 1 Expertise: ${edition==='2014'?'Thieves’ tools':'Sleight of Hand'}`,{exact:true}).check();assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  assert(await page.getByLabel('Rogue 1 Expertise: Investigation',{exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:name}).waitFor();const c=await saved(name);assert.equal(c.expertise.Stealth,true);assert.equal(Object.keys(c.featureChoices).length,1);
  assert.equal(c.languages.split(', ').filter(n=>/Cant/.test(n)).length,1);if(edition==='2014')assert.equal(c.toolExpertise['thieves-tools'],true);else assert.equal(c.expertise['Sleight of Hand'],true);
  assert.equal(await page.getByRole('button',{name:'Stealth proficiency: 2',exact:true}).innerText(),'E');await page.getByRole('tab',{name:'Traits',exact:true}).click();assert.match(await page.getByRole('region',{name:'Training and proficiencies'}).innerText(),/Recorded feature choices/);
  await page.setViewportSize({width:390,height:844});assert(await page.getByLabel('Current temporary HP',{exact:true}).isVisible());await page.getByLabel('Current temporary HP',{exact:true}).fill('12');await page.getByLabel('Temporary HP options',{exact:true}).click();await page.getByLabel('Temporary HP adjustment',{exact:true}).fill('4');await page.getByRole('button',{name:'Reduce temp HP',exact:true}).click();assert.equal(await page.getByLabel('Current temporary HP').inputValue(),'8');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`test-results/feature-choices-${edition}-mobile.png`,fullPage:true});await page.setViewportSize({width:1440,height:1000});
  console.log(`PASS ${edition} required creation Expertise, eligible choices, saved grants, skill bonuses and visible mobile temporary HP controls`);
 }
 assert.deepEqual(errors,[]);
} catch(e){await page.screenshot({path:'test-results/feature-choices-failure.png',fullPage:true});throw e;} finally {await browser.close();await server.close();}
