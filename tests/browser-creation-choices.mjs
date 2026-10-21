import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5191}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const card=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title',{hasText:new RegExp(`^${name}$`)})}).first();
const saved=()=>page.evaluate(async()=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(r=>r.name==='Custom swarm creation').id)).value);});
try{
 await fs.mkdir('test-results',{recursive:true});
 await page.goto(process.env.CREATION_TEST_URL||'http://127.0.0.1:5191/');
 await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('button',{name:'Create character',exact:true}).click();
 await page.getByLabel('Character name').fill('Custom swarm creation');
 await page.locator('.creation-choice').filter({has:page.getByText('Custom',{exact:true})}).click();await next();
 await page.getByLabel('Search class').fill('Entomancer');
 assert(!/Dandwiki homebrew/.test(await card('Entomancer').innerText()));
 await page.screenshot({path:'test-results/creation-clean-class.png'});
 await card('Entomancer').click();await next();
 assert(!/SRD/.test(await card('Elf').innerText()));
 await card('Elf').click();await page.getByLabel('Subrace').selectOption({label:'High Elf'});await next();
 const title=await card('Noble').locator('.creation-choice-title').boundingBox(),skills=await card('Noble').locator('small').boundingBox();
 assert(skills.y>=title.y+title.height,'Background skills appear beneath the title');
 await page.screenshot({path:'test-results/creation-clean-backgrounds.png'});
 await card('Noble').click();await next();await next();
 await page.getByLabel('Swarm species').selectOption('Decomposers');
 await page.getByLabel('Entomancer tool proficiency').selectOption('Herbalism Kit');
 for(const skill of ['Arcana','Medicine','Nature'])await page.getByRole('button',{name:skill,exact:true}).click();
 const languages=page.getByRole('region',{name:'Starting languages'});
 assert.match(await languages.innerText(),/Common \(Elf\).*Elvish \(Elf\)/);
 const extra=page.getByLabel('High Elf language 1',{exact:true});
 await extra.fill('Dwar');
 assert(await nextDisabled(),'Partial searches cannot be saved as languages');
 await extra.fill('Dwarvish');
 const noble=page.getByLabel('Noble language 1',{exact:true});
 const listId=await noble.getAttribute('list');
 assert.equal(await page.locator(`[id="${listId}"] option[value="Dwarvish"]`).count(),0,'Already known languages are excluded');
 await noble.fill('Dwarvish');assert(await nextDisabled(),'Duplicate choices cannot advance');
 await noble.fill('Giant');await page.screenshot({path:'test-results/creation-searchable-languages.png'});await next();
 const cantrips=page.getByRole('region',{name:'Cantrips',exact:true});
 for(const name of ['Guidance','Druidcraft']){
  await cantrips.getByLabel('Search spells',{exact:true}).fill(name);
  await cantrips.getByRole('button',{name:new RegExp(`^Select ${name} \\(5e · SRD 5.1`)}).click();
 }
 await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();
 await page.locator('.sheet-identity').filter({hasText:'Custom swarm creation'}).waitFor();
 let c=await saved();assert.equal(c.ruleset,'custom');assert.equal(c.entomancer.species,'Decomposers');
 assert.equal(c.spells.length,2);assert.equal(c.skillProf.Arcana,true);
 assert.equal(c.languages,'Common, Elvish, Dwarvish, Giant');
 assert.equal(await page.getByRole('group',{name:'Population resource'}).locator('.resource-count').innerText(),'2 / 2');
 await page.getByRole('tab',{name:'Features',exact:true}).click();
 for(const name of ['Entomancy','Population','Species','Cantrips','Half Alive'])assert(await page.locator('summary').filter({hasText:name}).count(),name+' is granted at level 1');
 for(const [level,names] of [[2,['Cure Wounds','Entangle','Fog Cloud']],[3,['Goodberry']],[4,['Healing Word','Longstrider']]]){
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices'}).click();
  if(level===3){await page.getByLabel('Moisture adaptation').selectOption('Dry');await page.getByLabel('Temperature adaptation').selectOption('Hot');}
  if(level===4){await page.getByLabel('Ability increase 1').selectOption('wis');await page.getByLabel('Ability increase 2').selectOption('wis');}
  await next();
  assert(await nextDisabled(),'Supported class spell additions are required');
  const additions=page.getByRole('region',{name:'New spells',exact:true});
  for(const name of names){await additions.getByLabel('Search spells',{exact:true}).fill(name);await additions.getByRole('button',{name:new RegExp(`^Select ${name} \\(5e · SRD 5.1`)}).click();}
  await next();await page.getByRole('button',{name:'Apply level up'}).click();
  await page.locator('.sheet-heading').filter({hasText:`Entomancer ${level}`}).waitFor();
 }
 assert.equal((await saved()).abilities.wis,c.abilities.wis+2);
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 await page.locator('.character-card').filter({hasText:'Custom swarm creation'}).getByRole('button',{name:'Open character'}).click();
 await page.locator('.sheet-identity').filter({hasText:'Custom swarm creation'}).waitFor();
 assert.equal((await saved()).languages,c.languages);
 await page.getByRole('tab',{name:'Spells',exact:true}).click();
 await page.getByRole('button',{name:'Manage spells'}).click();
 assert.equal(await page.getByRole('region',{name:'Class cantrips',exact:true}).count(),1,'Custom Entomancer uses limited class spell management');
 const {allSpells}=await server.ssrLoadModule('/src/lib/editions.js');
 const imported={...await saved(),name:'Over-limit swarm',classLevels:undefined,level:1,spells:allSpells.filter(s=>s.edition==='2014'&&['Guidance','Druidcraft','Mending'].includes(s.name)).map((s,i)=>({...s,id:'excess-'+i,prepared:true}))};
 assert.equal(imported.spells.length,3);
 await page.locator('input[type=file]').setInputFiles({name:'excess-swarm.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
 await page.locator('.sheet-identity').filter({hasText:'Over-limit swarm'}).waitFor();
 await page.getByRole('tab',{name:'Spells',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'exceeds its spell limit'}).waitFor();
 for(const button of await page.locator('.spell-item').getByRole('button',{name:'Cast',exact:true}).all())assert(await button.isDisabled(),'Over-limit imports cannot cast');
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile page does not overflow');
 assert.deepEqual(errors,[]);
 console.log('PASS clean cards, background layout, searchable automatic languages, invalid/duplicate choices, Custom Entomancer level-1 grants and persistence');
}catch(e){await page.screenshot({path:'test-results/creation-choices-failure.png',fullPage:true});throw e;}
finally{await browser.close();await server.close();}
async function nextDisabled(){return page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled();}
