import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=await createServer({server:{host:'127.0.0.1',port:5183}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
const choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title',{hasText:new RegExp('^'+name+'$')})}).first().click();
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(r=>r.name===name).id)).value);},name);

async function begin35(name,classId,className,{cha15=false}={}){
  if(await page.getByRole('button',{name:'All characters',exact:true}).count())await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.getByRole('button',{name:'Create character',exact:true}).click();
  await page.getByLabel('Character name',{exact:true}).fill(name);
  await page.locator('.creation-choice').filter({hasText:'3.5e'}).click();await next();
  await page.getByLabel('Search class').fill(className);
  await page.locator('[data-catalog-id="dndtools:'+classId+'"]').click();await next();
  await page.getByLabel('Search race').fill('Human');await choose('Human');await next();
  await next();
  if(cha15)await page.getByLabel(/Charisma · total/).selectOption('15');
  await next();
  const language=page.getByLabel('Human / Intelligence language 1',{exact:true});
  if(await language.count())await language.selectOption('Draconic');
  await next();
}

async function selectSpell(pickerLabel,name){
  const picker=page.getByRole('region',{name:pickerLabel,exact:true});
  await picker.getByPlaceholder('Search by name…').fill(name);
  const button=picker.getByRole('button',{name:new RegExp('^Select '+name)}).first();
  assert.equal(await button.count(),1,'Expected legal acquisition option '+name);
  await button.click();
  await picker.getByPlaceholder('Search by name…').fill('');
}

try{
  await fs.mkdir('test-results',{recursive:true});
  await page.goto('http://127.0.0.1:5183/');
  await page.getByRole('button',{name:'Explore the demo'}).click();

  const sorcererName='Acquisition Sorcerer 3.5';
  await begin35(sorcererName,'classes/sorcerer-98','Sorcerer',{cha15:true});
  const sorcRegion=page.getByRole('region',{name:'3.5 spell acquisition choices',exact:true});
  await sorcRegion.waitFor();
  assert.equal(await sorcRegion.getByRole('heading',{name:'Known level 0 spells',exact:true}).count(),1);
  assert.equal(await sorcRegion.getByRole('heading',{name:'Known level 1 spells',exact:true}).count(),1);
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Sorcerer setup blocks until exact known-spell choices are resolved');
  for(const name of ['Acid Splash','Detect Magic','Light','Mage Hand'])await selectSpell('Known level 0 spells',name);
  for(const name of ['Magic Missile','Shield'])await selectSpell('Known level 1 spells',name);
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByLabel('Sorcerer 1 Familiar: Raven',{exact:true}).check();
  assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:sorcererName}).waitFor();
  const sorcererSaved=await saved(sorcererName),sorcBucket=sorcererSaved.spellAcquisition35?.['dndtools:classes/sorcerer-98'];
  assert(sorcBucket,'Sorcerer acquisition bucket is persisted');
  assert.equal(sorcBucket.acquisitions.filter(x=>x.active!==false&&x.affectsQuota!==false&&x.spellLevel===0).length,4);
  assert.equal(sorcBucket.acquisitions.filter(x=>x.active!==false&&x.affectsQuota!==false&&x.spellLevel===1).length,2);
  assert(sorcBucket.acquisitions.every(x=>x.origin==='starting'));
  assert.equal(sorcererSaved.spells.filter(x=>x.castingClassId==='dndtools:classes/sorcerer-98').length,6);
  console.log('PASS guided 3.5 Sorcerer exact starting known-spell acquisition and persistence');

  const wizardName='Acquisition Wizard 3.5',wizardKey='dndtools:classes/wizard-99';
  await begin35(wizardName,'classes/wizard-99','Wizard');
  await page.getByLabel('Specialist school',{exact:true}).selectOption('Evocation');
  await page.getByLabel('Prohibited Enchantment',{exact:true}).check();
  await page.getByLabel('Prohibited Necromancy',{exact:true}).check();
  const wizRegion=page.getByRole('region',{name:'3.5 spell acquisition choices',exact:true});
  await wizRegion.waitFor();
  assert.match(await wizRegion.innerText(),/Automatic level 0 spellbook entries:/);
  assert.equal(await wizRegion.getByRole('heading',{name:'Starting spells',exact:true}).count(),1);
  assert.equal(await wizRegion.getByRole('button',{name:/Select Charm Person/}).count(),0,'prohibited Enchantment is excluded from Wizard acquisition options');
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  for(const name of ['Magic Missile','Mage Armor','Shield','Grease'])await selectSpell('Starting spells',name);
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'INT 12 Wizard requires exactly four starting 1st-level spellbook choices');
  await next();
  await page.getByLabel('Wizard 1 Familiar: Raven',{exact:true}).check();
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:wizardName}).waitFor();
  const wizardSaved=await saved(wizardName),wizBucket=wizardSaved.spellAcquisition35?.[wizardKey];
  assert(wizBucket,'Wizard acquisition bucket is persisted');
  const activeWizard=wizBucket.acquisitions.filter(x=>x.active!==false);
  assert.equal(activeWizard.filter(x=>x.spellLevel===1&&x.origin==='starting').length,4);
  const cantrips=activeWizard.filter(x=>x.spellLevel===0&&x.origin==='starting');
  assert(cantrips.length>0,'Wizard legal level-0 spells are automatically materialized');
  assert(!cantrips.some(x=>['Enchantment','Necromancy'].includes(x.spell?.school)),'prohibited-school cantrips never enter the starting spellbook');
  assert.equal(wizardSaved.spells.filter(x=>x.castingClassId===wizardKey).length,activeWizard.length);
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:wizardName}).getByRole('button',{name:'Open character'}).click();
  const wizardReloaded=await saved(wizardName);
  assert.deepEqual(wizardReloaded.spellAcquisition35[wizardKey].acquisitions.map(x=>x.id).sort(),wizBucket.acquisitions.map(x=>x.id).sort());
  console.log('PASS guided 3.5 Wizard starting spellbook, prohibited-school filtering, persistence and reopen');

  assert.deepEqual(errors,[]);
}catch(error){
  await page.screenshot({path:'test-results/spell-acquisition35-failure.png',fullPage:true}).catch(()=>{});
  throw error;
}finally{
  await browser.close();await server.close();
}
