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
async function openCharacter(name){
  if(await page.getByRole('button',{name:'All characters',exact:true}).count())await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.locator('.character-card').filter({hasText:name}).getByRole('button',{name:'Open character'}).click();
  await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
}

async function begin35(name,classId,className,{cha15=false,int15=false,wis15=false}={}){
  if(await page.getByRole('button',{name:'All characters',exact:true}).count())await page.getByRole('button',{name:'All characters',exact:true}).click();
  await page.getByRole('button',{name:'Create character',exact:true}).click();
  await page.getByLabel('Character name',{exact:true}).fill(name);
  await page.locator('.creation-choice').filter({hasText:'3.5e'}).click();await next();
  await page.getByLabel('Search class').fill(className);
  await page.locator('[data-catalog-id="dndtools:'+classId+'"]').click();await next();
  await page.getByLabel('Search race').fill('Human');await choose('Human');await next();
  await next();
  if(cha15)await page.getByLabel(/Charisma · total/).selectOption('15');
  if(int15)await page.getByLabel(/Intelligence · total/).selectOption('15');
  if(wis15)await page.getByLabel(/Wisdom · total/).selectOption('15');
  await next();
  const languages=page.getByLabel(/Human \/ Intelligence language \d+/);
  const languageChoices=['Draconic','Dwarven','Elven','Giant','Gnome','Goblin','Orc'];
  for(let i=0;i<await languages.count();i++)await languages.nth(i).selectOption(languageChoices[i]);
  await next();
}


async function selectSpellIn(picker,name){
  await picker.getByPlaceholder('Search by name…').fill(name);
  const button=picker.getByRole('button',{name:new RegExp('^Select '+name)}).first();
  await button.waitFor();
  assert.equal(await button.count(),1,'Expected legal acquisition option '+name);
  await button.click();
  await picker.getByPlaceholder('Search by name…').fill('');
}

async function selectSpell(pickerLabel,name){
  const picker=page.getByRole('region',{name:pickerLabel,exact:true});
  await picker.getByPlaceholder('Search by name…').fill(name);
  const button=picker.getByRole('button',{name:new RegExp('^Select '+name)}).first();
  await button.waitFor();
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

  const favoredSoulName='Acquisition Favored Soul 3.5',favoredSoulKey='dndtools:classes/favored-soul-7';
  await begin35(favoredSoulName,'classes/favored-soul-7','Favored Soul',{cha15:true});
  const favoredSoulRegion=page.getByRole('region',{name:'3.5 spell acquisition choices',exact:true});
  await favoredSoulRegion.waitFor();
  assert.equal(await favoredSoulRegion.getByRole('heading',{name:'Known level 0 spells',exact:true}).count(),1);
  assert.equal(await favoredSoulRegion.getByRole('heading',{name:'Known level 1 spells',exact:true}).count(),1);
  for(const name of ['Detect Magic','Guidance','Light','Resistance'])await selectSpell('Known level 0 spells',name);
  for(const name of ['Bless','Cure Light Wounds','Divine Favor'])await selectSpell('Known level 1 spells',name);
  await next();
  await page.getByLabel('Favored Soul 1 Deity’s favored weapon choice',{exact:true}).fill('Longsword');
  assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:favoredSoulName}).waitFor();
  const favoredSoulCreated=await saved(favoredSoulName),favoredSoulBucket=favoredSoulCreated.spellAcquisition35?.[favoredSoulKey];
  assert(favoredSoulBucket,'Favored Soul acquisition bucket is persisted');
  assert.equal(favoredSoulBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===0).length,4);
  assert.equal(favoredSoulBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===1).length,3);
  assert(favoredSoulCreated.spells.filter(x=>x.castingClassId===favoredSoulKey).every(x=>x.prepared===true),'Favored Soul acquired spells are spontaneous castable spells');
  assert(Object.values(favoredSoulCreated.featureChoices||{}).some(choice=>choice?.sourceClassId===favoredSoulKey&&choice?.choices?.includes('Longsword')),'Favored Soul deity weapon persists from creation');

  for(const expectedLevel of [2,3]){
    await page.getByRole('button',{name:'Level up',exact:true}).click();
    await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
    await next();
    const mandatory=page.getByRole('region',{name:/^Known level \d+ spells$/});
    const count=await mandatory.count();
    for(let i=0;i<count;i++){
      const picker=mandatory.nth(i);
      const select=picker.getByRole('button',{name:/^Select /}).first();
      await select.click();
    }
    await next();
    await page.getByRole('button',{name:'Apply level up',exact:true}).click();
    if(expectedLevel===3){
      const focus=page.getByLabel('Favored Soul 3 Deity’s Weapon Focus: Weapon Focus (Longsword)',{exact:true});
      await focus.waitFor();
      await focus.check();
      await page.getByRole('button',{name:'Save level and choices',exact:true}).click();
    }
    await page.locator('.sheet-identity').filter({hasText:`LEVEL ${expectedLevel}`}).waitFor();
  }
  const favoredSoulLevel3=await saved(favoredSoulName);
  assert(favoredSoulLevel3.feats.some(feat=>feat.name==='Weapon Focus (Longsword)'&&feat.sourceClassId===favoredSoulKey),'Favored Soul level 3 grants Weapon Focus for the persisted deity weapon');
  console.log('PASS guided 3.5 Favored Soul starting known spells and deity-weapon feat linkage');

  await openCharacter(sorcererName);
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  const sorcLevel2=page.getByRole('region',{name:'Known level 0 spells',exact:true});
  await sorcLevel2.waitFor();
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Sorcerer level-up blocks until its exact acquisition delta is resolved');
  assert.equal(await sorcLevel2.getByRole('button',{name:/^Select /}).count()>0,true);
  await selectSpell('Known level 0 spells','Prestidigitation');
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 2'}).waitFor();
  const sorcererLevel2Saved=await saved(sorcererName);
  const sorcererLevel2Bucket=sorcererLevel2Saved.spellAcquisition35['dndtools:classes/sorcerer-98'];
  assert.equal(sorcererLevel2Bucket.acquisitions.filter(x=>x.active!==false&&x.affectsQuota!==false&&x.spellLevel===0).length,5);
  assert.equal(sorcererLevel2Bucket.acquisitions.filter(x=>x.origin==='level-up'&&x.acquiredAtClassLevel===2).length,1);
  console.log('PASS 3.5 Sorcerer level-up acquisition event integration');

  await openCharacter(wizardName);
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  const wizardLevel2=page.getByRole('region',{name:'Wizard free spellbook additions',exact:true});
  await wizardLevel2.waitFor();
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Wizard level-up blocks until exactly two free additions are chosen');
  const wizardButtons=wizardLevel2.getByRole('button',{name:/^Select /});
  assert((await wizardButtons.count())>=2);
  await wizardButtons.nth(0).click();
  await wizardButtons.nth(0).click();
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  const pendingWizardChoices=page.getByRole('button',{name:'Save level and choices',exact:true});
  assert.equal(await pendingWizardChoices.count(),0,'Wizard 2 must not open a new class-feature choice dialog');
  assert.deepEqual(errors,[],'Wizard level-up must not throw a browser runtime error');
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 2'}).waitFor();
  const wizardLevel2Saved=await saved(wizardName);
  const wizardLevel2Bucket=wizardLevel2Saved.spellAcquisition35[wizardKey];
  assert.equal(wizardLevel2Bucket.acquisitions.filter(x=>x.origin==='wizard-free-level-up'&&x.acquiredAtClassLevel===2&&x.active!==false).length,2);
  console.log('PASS 3.5 Wizard two-free-spellbook-additions level-up integration');

  await openCharacter(sorcererName);
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  await selectSpell('Known level 1 spells','Mage Armor');
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 3'}).waitFor();

  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  await selectSpell('Known level 0 spells','Read Magic');
  await selectSpell('Known level 2 spells','Invisibility');
  const replacement=page.getByRole('region',{name:'Optional spell replacement',exact:true});
  await replacement.waitFor();
  const continueButton=page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true});
  assert(!await continueButton.isDisabled(),'optional Sorcerer replacement can be skipped');
  await replacement.getByLabel('Replace one known spell this level',{exact:true}).check();
  assert(await continueButton.isDisabled(),'opting into replacement requires a complete replacement choice');
  await replacement.getByLabel('Known spell to replace',{exact:true}).selectOption({label:'Acid Splash'});
  await selectSpell('Replacement level 0 spells','Ray of Frost');
  assert(!await continueButton.isDisabled(),'legal optional replacement completes the level-up spell step');
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 4'}).waitFor();
  const sorcererLevel4Saved=await saved(sorcererName);
  const sorcererLevel4Bucket=sorcererLevel4Saved.spellAcquisition35['dndtools:classes/sorcerer-98'];
  assert.equal(sorcererLevel4Bucket.replacements.length,1);
  assert(sorcererLevel4Bucket.acquisitions.some(x=>x.spellName==='Acid Splash'&&x.active===false));
  assert(sorcererLevel4Bucket.acquisitions.some(x=>x.spellName==='Ray of Frost'&&x.origin==='replacement'&&x.active!==false));
  console.log('PASS 3.5 Sorcerer optional level-4 spell replacement');

  // Advance once without a feat so Extra Spell is tested at character level 6, where the normal 3.5 feat cadence and caster-level prerequisite both apply.
  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  await selectSpell('Known level 1 spells','Burning Hands');
  await selectSpell('Known level 2 spells','Scorching Ray');
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 5'}).waitFor();

  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await page.getByRole('button',{name:'Choose from feat catalog',exact:true}).click();
  await page.getByLabel('Search feats',{exact:true}).fill('Extra Spell');
  const extraDetails=page.locator('[data-catalog-id="dndtools:feats/extra-spell-1044"]');
  await extraDetails.waitFor();
  await extraDetails.locator('summary').click();
  const prereqCheck=extraDetails.getByRole('checkbox');
  if(await prereqCheck.count())await prereqCheck.first().check();
  await extraDetails.getByRole('button',{name:'Add feat',exact:true}).click();

  const extraRegion=page.getByRole('region',{name:'Feat spell acquisition · Extra Spell',exact:true});
  await extraRegion.waitFor();
  const level6Continue=page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true});
  assert(await level6Continue.isDisabled(),'Extra Spell blocks level-up until its learned spell is chosen immediately');
  await selectSpell('Extra Spell spell choice','Web');
  assert(!await level6Continue.isDisabled(),'resolving Extra Spell immediately completes the feat portion of level-up');
  await level6Continue.click();

  await selectSpell('Known level 0 spells','Dancing Lights');
  await selectSpell('Known level 3 spells','Fireball');
  const level6Replacement=page.getByRole('region',{name:'Optional spell replacement',exact:true});
  await level6Replacement.waitFor();
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();

  const sorcererLevel6Saved=await saved(sorcererName);
  const sorcererLevel6Bucket=sorcererLevel6Saved.spellAcquisition35['dndtools:classes/sorcerer-98'];
  const extraAcquisition=sorcererLevel6Bucket.acquisitions.find(x=>x.origin==='feat'&&x.spellName==='Web'&&x.active!==false);
  assert(extraAcquisition,'Extra Spell acquisition is persisted immediately with feat provenance');
  assert.equal(extraAcquisition.affectsQuota,false,'Extra Spell does not consume the Sorcerer known-spell quota');
  assert.equal(sorcererLevel6Bucket.acquisitions.filter(x=>x.active!==false&&x.affectsQuota!==false&&x.spellLevel===2).length,2,'ordinary Sorcerer level-2 known-spell quota remains exactly two');
  assert(sorcererLevel6Saved.spells.some(x=>x.name==='Web'&&x.castingClassId==='dndtools:classes/sorcerer-98'),'feat-learned spell appears in the normal Spells section');
  assert(sorcererLevel6Saved.feats.some(f=>f.name==='Extra Spell'&&f.spellAcquisitionChoices35?.entries?.some(entry=>entry.name==='Web')));
  console.log('PASS immediate Extra Spell choice, feat provenance, quota isolation and normal spell-list materialization');

  const hexbladeName='Acquisition Hexblade';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(hexbladeName,'classes/hexblade-19','Hexblade',{cha15:true});
  await next();
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:hexbladeName}).waitFor();

  for(const expectedLevel of [2,3]){
    await page.getByRole('button',{name:'Level up',exact:true}).click();
    await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
    await next();
    assert.equal(await page.getByRole('region',{name:/Known level \d+ spells/}).count(),0,'Hexblade has no mandatory known-spell acquisition before level 4');
    await next();
    await page.getByRole('button',{name:'Apply level up',exact:true}).click();
    await page.locator('.sheet-identity').filter({hasText:`LEVEL ${expectedLevel}`}).waitFor();
  }

  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  const hexbladeKnown=page.getByRole('region',{name:'Known level 1 spells',exact:true});
  await hexbladeKnown.waitFor();
  const hexSelect=hexbladeKnown.getByRole('button',{name:/^Select /});
  assert((await hexSelect.count())>=2);
  await hexSelect.nth(0).click();
  await hexSelect.nth(0).click();
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  const hexFamiliar=page.getByLabel('Hexblade 4 Familiar: Raven',{exact:true});
  await hexFamiliar.waitFor();
  await hexFamiliar.check();
  await page.getByRole('button',{name:'Save level and choices',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 4'}).waitFor();
  const hexSaved=await saved(hexbladeName);
  const hexBucket=hexSaved.spellAcquisition35['dndtools:classes/hexblade-19'];
  assert.equal(hexBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===1&&x.affectsQuota!==false).length,2);
  assert.equal(hexBucket.acquisitions.filter(x=>x.origin==='level-up'&&x.acquiredAtClassLevel===4).length,2);
  assert(Object.values(hexSaved.featureChoices||{}).some(choice=>choice?.sourceClassId==='dndtools:classes/hexblade-19'&&choice?.choices?.includes('Raven')));
  console.log('PASS 3.5 Hexblade first known-spell acquisition at class level 4');


  const duskbladeName='Acquisition Duskblade',duskbladeKey='dndtools:classes/duskblade-102';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(duskbladeName,'classes/duskblade-102','Duskblade',{int15:true});
  const duskStart=page.getByRole('region',{name:'3.5 spell acquisition choices',exact:true});
  await duskStart.waitFor();
  const duskCantrips=duskStart.getByRole('region',{name:'Known level 0 spells',exact:true});
  const duskFirst=duskStart.getByRole('region',{name:'Known level 1 spells',exact:true});
  assert.equal(await duskCantrips.count(),1);
  assert.equal(await duskFirst.count(),1);
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Duskblade creation blocks until all starting known spells are chosen');
  for(let i=0;i<4;i++)await duskCantrips.getByRole('button',{name:/^Select /}).first().click();
  for(let i=0;i<2;i++)await duskFirst.getByRole('button',{name:/^Select /}).first().click();
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:duskbladeName}).waitFor();
  const duskCreated=await saved(duskbladeName),duskCreatedBucket=duskCreated.spellAcquisition35?.[duskbladeKey];
  assert(duskCreatedBucket,'Duskblade acquisition bucket is persisted');
  assert.equal(duskCreatedBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===0).length,4);
  assert.equal(duskCreatedBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===1).length,2);

  await page.getByRole('button',{name:'Level up',exact:true}).click();
  await page.getByRole('button',{name:'Continue to level choices',exact:true}).click();
  await next();
  const duskFlex=page.getByRole('region',{name:'Known spell up to level 1',exact:true});
  await duskFlex.waitFor();
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Duskblade level 2 blocks until its flexible known spell is chosen');
  await duskFlex.getByRole('button',{name:/^Select /}).first().click();
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 2'}).waitFor();
  const duskLevel2=await saved(duskbladeName),duskLevel2Bucket=duskLevel2.spellAcquisition35[duskbladeKey];
  assert.equal(duskLevel2Bucket.acquisitions.filter(x=>x.origin==='level-up'&&x.acquiredAtClassLevel===2&&x.active!==false).length,1);
  assert(duskLevel2.spells.some(x=>x.castingClassId===duskbladeKey&&x.prepared===true),'Duskblade learned spells materialize as spontaneous castable spells');
  console.log('PASS 3.5 Duskblade starting and flexible level-up spell acquisition UI');

  const magewrightName='Acquisition Magewright',magewrightKey='dndtools:classes/magewright-1029';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(magewrightName,'classes/magewright-1029','Magewright',{int15:true});
  const mageMastery=page.getByRole('region',{name:'Magewright spell mastery',exact:true});
  await mageMastery.waitFor();
  const masteredPicker=mageMastery.getByRole('region',{name:'Mastered spells',exact:true});
  assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Magewright creation blocks until its mastered repertoire is chosen');
  for(let i=0;i<2;i++)await masteredPicker.getByRole('button',{name:/^Select /}).first().click();
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await next();
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:magewrightName}).waitFor();
  const mageCreated=await saved(magewrightName),mageBucket=mageCreated.spellAcquisition35?.[magewrightKey];
  assert(mageBucket,'Magewright mastered repertoire is persisted');
  assert.equal(mageBucket.acquisitions.filter(x=>x.active!==false).length,2);
  assert(mageCreated.spells.filter(x=>x.castingClassId===magewrightKey).every(x=>x.prepared===false),'mastered Magewright spells are not treated as spontaneous prepared spells');

  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  await page.getByRole('button',{name:'Manage spells',exact:true}).click();
  assert.match(await page.getByText(/Spell ownership for this 3\.5 class is controlled by its acquisition history/).innerText(),/acquisition history/);
  assert.equal(await page.getByRole('region',{name:'Available class spells',exact:true}).count(),0,'Magewright cannot bypass Spell Mastery by manually adding repertoire spells');
  await page.getByRole('button',{name:'Done',exact:true}).click();

  const masteredForPrep=mageBucket.acquisitions.find(x=>x.active!==false);
  assert(masteredForPrep,'Magewright needs at least one mastered spell for preparation regression');
  await page.getByRole('button',{name:'Prepare daily spells',exact:true}).click();
  const magePrep=page.getByLabel(`Prepare Standard level ${masteredForPrep.spellLevel} slot 1`,{exact:true});
  await magePrep.selectOption({label:masteredForPrep.spellName});
  await page.getByRole('button',{name:'Finish daily preparation',exact:true}).click();
  const masteredItem=page.locator('.spell-item').filter({hasText:masteredForPrep.spellName}).first();
  await masteredItem.getByRole('button',{name:'Cast',exact:true}).click();
  await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();
  assert.match(await page.getByRole('region',{name:'Daily spell preparation',exact:true}).innerText(),new RegExp(`Standard level ${masteredForPrep.spellLevel} slot 1: Spent`));
  console.log('PASS 3.5 Magewright mastered repertoire creation, manual-add lockout, preparation and casting UI');

  await openCharacter(wizardName);
  const wizardBeforeCampaign=await saved(wizardName);
  assert(!wizardBeforeCampaign.spellAcquisition35[wizardKey].acquisitions.some(x=>x.spellName==='Scorching Ray'),'Scorching Ray is not already owned before campaign acquisition');
  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  await page.getByRole('button',{name:'Manage spells',exact:true}).click();
  assert.equal(await page.getByRole('region',{name:'Available class spells',exact:true}).count(),0,'managed Wizard no longer exposes unrestricted manual spell ownership');
  await page.getByRole('button',{name:'Add spell to spellbook',exact:true}).click();
  const campaignAdd=page.getByRole('region',{name:'Wizard campaign spellbook acquisition',exact:true});
  await campaignAdd.waitFor();
  const campaignPicker=campaignAdd.getByRole('region',{name:'Spell to add to spellbook',exact:true});
  await campaignPicker.getByLabel('Search spells',{exact:true}).fill('Scorching Ray');
  await campaignPicker.getByRole('button',{name:'Select Scorching Ray (3.5e)',exact:true}).first().click();
  await campaignAdd.getByLabel('Acquisition source',{exact:true}).selectOption('copied-scroll');
  await campaignAdd.getByLabel('Spell source note',{exact:true}).fill('Scroll recovered during the campaign');
  const recordCampaign=campaignAdd.getByRole('button',{name:'Record spellbook acquisition',exact:true});
  assert(await recordCampaign.isDisabled(),'campaign requirements must be explicitly confirmed');
  await campaignAdd.getByLabel('Campaign requirements completed',{exact:true}).check();
  assert(!await recordCampaign.isDisabled());
  await recordCampaign.click();
  await page.locator('.spell-item').filter({hasText:'Scorching Ray'}).waitFor();
  await page.waitForFunction(async ({name,classId})=>{
    const indexRecord=await window.storage.get('char-index');
    if(!indexRecord)return false;
    const rows=JSON.parse(indexRecord.value),row=rows.find(item=>item.name===name);
    if(!row)return false;
    const detail=await window.storage.get('char-detail:'+row.id);
    if(!detail)return false;
    const character=JSON.parse(detail.value),bucket=character.spellAcquisition35?.[classId];
    return Boolean(bucket?.acquisitions?.some(item=>item.spellName==='Scorching Ray'&&item.origin==='copied-scroll'));
  },{name:wizardName,classId:wizardKey});
  await page.waitForTimeout(750);
  await page.waitForFunction(async ({name,classId})=>{
    const indexRecord=await window.storage.get('char-index');
    if(!indexRecord)return false;
    const rows=JSON.parse(indexRecord.value),row=rows.find(item=>item.name===name);
    if(!row)return false;
    const detail=await window.storage.get('char-detail:'+row.id);
    if(!detail)return false;
    const character=JSON.parse(detail.value),bucket=character.spellAcquisition35?.[classId];
    return Boolean(bucket?.acquisitions?.some(item=>item.spellName==='Scorching Ray'&&item.origin==='copied-scroll'));
  },{name:wizardName,classId:wizardKey});
  const wizardCampaignSaved=await saved(wizardName);
  const wizardCampaignBucket=wizardCampaignSaved.spellAcquisition35[wizardKey];
  const scorching=wizardCampaignBucket.acquisitions.find(x=>x.spellName==='Scorching Ray');
  assert.equal(scorching.origin,'copied-scroll');
  assert.equal(scorching.affectsQuota,false);
  assert(wizardCampaignBucket.campaignEntries.some(x=>x.spellKey===scorching.spellKey&&x.confirmed===true));
  console.log('PASS Wizard campaign spellbook acquisition from Manage Spells');


  const shugenjaName='Acquisition Shugenja 3.5',shugenjaKey='dndtools:classes/shugenja-8';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(shugenjaName,'classes/shugenja-8','Shugenja',{cha15:true});
  await page.getByLabel('Shugenja 1 Shugenja Order: Order of the Consuming Flame',{exact:true}).check();
  const fireFocus=page.getByLabel('Shugenja 1 Element Focus: Fire',{exact:true});
  await fireFocus.waitFor();
  await fireFocus.check();
  const shugenja0=page.getByRole('region',{name:'Shugenja level 0 known spells',exact:true});
  const shugenja1=page.getByRole('region',{name:'Shugenja level 1 known spells',exact:true});
  await shugenja0.waitFor();await shugenja1.waitFor();
  const shOrder0=shugenja0.getByRole('region',{name:'Fixed Order spell',exact:true});
  const shFavored0=shugenja0.getByRole('region',{name:'Favored-element level 0 spells',exact:true});
  const shOpen0=shugenja0.getByRole('region',{name:'Additional level 0 spells',exact:true});
  assert.equal(await shFavored0.getByRole('button',{name:/Select Detect Magic/}).count(),0,'All-element spells are not offered in the favored-element quota picker');
  assert.equal(await shOpen0.getByRole('button',{name:/Select Create Water/}).count(),0,'Fire Shugenja cannot select prohibited Water spells');
  await selectSpellIn(shOrder0,'Flare');
  await selectSpellIn(shFavored0,'Dancing Lights');
  await selectSpellIn(shFavored0,'Disrupt Undead');
  await selectSpellIn(shOpen0,'Detect Magic');
  await selectSpellIn(shOpen0,'Read Magic');
  const shOrder1=shugenja1.getByRole('region',{name:'Fixed Order spell',exact:true});
  const shFavored1=shugenja1.getByRole('region',{name:'Favored-element level 1 spells',exact:true});
  const shOpen1=shugenja1.getByRole('region',{name:'Additional level 1 spells',exact:true});
  await selectSpellIn(shOrder1,'Burning Hands');
  await selectSpellIn(shFavored1,'Cause Fear');
  await selectSpellIn(shOpen1,'Endure Elements');
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'Shugenja setup becomes valid only after Order, Element Focus, and exact source quotas are complete');
  await next();
  assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:shugenjaName}).waitFor();
  const shugenjaSaved=await saved(shugenjaName),shugenjaBucket=shugenjaSaved.spellAcquisition35?.[shugenjaKey];
  assert(shugenjaBucket,'Shugenja acquisition history persists');
  assert.equal(shugenjaBucket.acquisitions.filter(x=>x.active!==false).length,8);
  assert.equal(shugenjaBucket.acquisitions.filter(x=>x.origin==='order-spell').length,2);
  assert(Object.values(shugenjaSaved.featureChoices||{}).some(choice=>choice.sourceClassId===shugenjaKey&&choice.feature==='Shugenja Order'&&choice.choices?.[0]==='Order of the Consuming Flame'));
  assert(Object.values(shugenjaSaved.featureChoices||{}).some(choice=>choice.sourceClassId===shugenjaKey&&choice.feature==='Element Focus'&&choice.choices?.[0]==='Fire'));
  console.log('PASS Shugenja Order-driven Element Focus, partitioned known-spell UI, prohibited element filtering and persistence');

  const spiritName='Acquisition Spirit Shaman 3.5',spiritKey='dndtools:classes/spirit-shaman-9';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(spiritName,'classes/spirit-shaman-9','Spirit Shaman',{cha15:true,wis15:true});
  const spiritDaily=page.getByRole('region',{name:'Spirit Shaman daily spell retrieval',exact:true});
  await spiritDaily.waitFor();
  for(const name of ['Detect Magic','Guidance','Light'])await selectSpellIn(spiritDaily.getByRole('region',{name:'Retrieved level 0 spells',exact:true}),name);
  await selectSpellIn(spiritDaily.getByRole('region',{name:'Retrieved level 1 spells',exact:true}),'Entangle');
  await next();
  await page.getByLabel('Spirit Shaman 1 Spirit Guide: Wolf',{exact:true}).check();
  assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:spiritName}).waitFor();
  const spiritCreated=await saved(spiritName),spiritBucket=spiritCreated.spellAcquisition35?.[spiritKey];
  assert.equal(spiritBucket?.dailyRetrievalReady,false);
  assert.equal(spiritBucket?.acquisitions.filter(x=>x.active!==false).length,4);
  assert(spiritBucket?.acquisitions.filter(x=>x.active!==false).every(x=>x.origin==='daily-retrieval'),'created Spirit Shaman repertoire is persisted as daily-retrieval state');
  assert(spiritCreated.feats?.some(feat=>feat.name==='Alertness'&&feat.sourceClassId===spiritKey),'Spirit Guide grants source-owned Alertness');
  await page.evaluate(()=>{window.__ledgerCharacterTrace=[];});
  await page.getByRole('button',{name:'Rest',exact:true}).click();
  await page.getByRole('button',{name:'Complete long rest',exact:true}).click();
  await page.waitForFunction(async ({name,key})=>{
    const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(item=>item.name===name);
    if(!row)return false;
    const stored=await window.storage.get('char-detail:'+row.id);
    if(!stored)return false;
    const detail=JSON.parse(stored.value),bucket=detail.spellAcquisition35?.[key];
    return bucket?.dailyRetrievalReady===true&&(bucket?.acquisitions||[]).filter(item=>item.active!==false).length===0;
  },{name:spiritName,key:spiritKey});
  await page.waitForTimeout(900);
  const spiritTrace=await page.evaluate(()=>window.__ledgerCharacterTrace||[]);
  console.log('TRACE Spirit Shaman ledger writes',JSON.stringify(spiritTrace));
  const spiritRested=await saved(spiritName);
  assert.equal(spiritRested.spellAcquisition35[spiritKey].acquisitions.filter(x=>x.active!==false).length,0,'long rest clears yesterday’s Spirit Shaman retrieved repertoire');
  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  await page.getByRole('button',{name:'Manage spells',exact:true}).click();
  const spiritReRetrieve=page.getByRole('region',{name:'Daily spell retrieval',exact:true});
  await spiritReRetrieve.waitFor();
  const re0=spiritReRetrieve.getByRole('region',{name:'Retrieved level 0 spells',exact:true});
  const re1=spiritReRetrieve.getByRole('region',{name:'Retrieved level 1 spells',exact:true});
  for(let i=0;i<3;i++)await re0.getByRole('button',{name:/^Select /}).first().click();
  await re1.getByRole('button',{name:/^Select /}).first().click();
  await spiritReRetrieve.getByRole('button',{name:'Retrieve spells for today',exact:true}).click();
  await page.waitForFunction(async ({name,key})=>{
    const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(item=>item.name===name);
    const detail=JSON.parse((await window.storage.get('char-detail:'+row.id)).value),bucket=detail.spellAcquisition35?.[key];
    return bucket?.dailyRetrievalReady===false&&bucket?.acquisitions?.filter(item=>item.active!==false).length===4;
  },{name:spiritName,key:spiritKey});
  console.log('PASS Spirit Shaman creation retrieval, Spirit Guide, long-rest reset and daily re-retrieval UI');

  const wuJenName='Acquisition Wu Jen 3.5',wuJenKey='dndtools:classes/wu-jen-6';
  await page.getByRole('button',{name:'All characters',exact:true}).click();
  await begin35(wuJenName,'classes/wu-jen-6','Wu Jen',{int15:true});
  const wuRegion=page.getByRole('region',{name:'3.5 spell acquisition choices',exact:true});
  await wuRegion.waitFor();
  const wuStart=wuRegion.getByRole('region',{name:'Starting spells',exact:true});
  for(let i=0;i<5;i++)await wuStart.getByRole('button',{name:/^Select /}).first().click();
  assert(!await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled(),'INT 15 Wu Jen requires five starting first-level spellbook choices');
  await next();
  await page.getByLabel('Wu Jen 1 Taboos: Cannot eat meat',{exact:true}).check();
  const wuBonusFeat=page.getByLabel('Wu Jen 1 Bonus Feat: Extend Spell',{exact:true});
  await wuBonusFeat.waitFor();await wuBonusFeat.check();
  assert(!await page.getByRole('button',{name:'Create Character',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Create Character',exact:true}).click();
  await page.locator('.sheet-identity').filter({hasText:wuJenName}).waitFor();
  const wuCreated=await saved(wuJenName),wuBucket=wuCreated.spellAcquisition35?.[wuJenKey];
  assert(wuBucket,'Wu Jen spellbook acquisition history persists');
  assert.equal(wuBucket.acquisitions.filter(x=>x.active!==false&&x.spellLevel===1&&x.origin==='starting').length,5);
  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  await page.getByRole('button',{name:'Manage spells',exact:true}).click();
  await page.getByRole('button',{name:'Add spell to spellbook',exact:true}).click();
  const wuCampaign=page.getByRole('region',{name:'Wu Jen campaign spellbook acquisition',exact:true});
  await wuCampaign.waitFor();
  const wuCampaignPicker=wuCampaign.getByRole('region',{name:'Spell to add to spellbook',exact:true});
  await wuCampaignPicker.getByLabel('Search spells',{exact:true}).fill('Fire Shuriken');
  await wuCampaignPicker.getByRole('button',{name:/^Select Fire Shuriken/}).first().click();
  await wuCampaign.getByLabel('Acquisition source',{exact:true}).selectOption('copied-spellbook');
  await wuCampaign.getByLabel('Spell source note',{exact:true}).fill('Copied from a recovered Wu Jen spellbook');
  await wuCampaign.getByLabel('Campaign requirements completed',{exact:true}).check();
  await wuCampaign.getByRole('button',{name:'Record spellbook acquisition',exact:true}).click();
  await page.waitForFunction(async ({name,key})=>{
    const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(item=>item.name===name);
    const detail=JSON.parse((await window.storage.get('char-detail:'+row.id)).value);
    return detail.spellAcquisition35?.[key]?.acquisitions?.some(item=>item.spellName==='Fire Shuriken'&&item.origin==='copied-spellbook');
  },{name:wuJenName,key:wuJenKey});
  console.log('PASS Wu Jen starting spellbook and generic campaign spellbook acquisition UI');


  assert.deepEqual(errors,[]);
}catch(error){
  await page.screenshot({path:'test-results/spell-acquisition35-failure.png',fullPage:true}).catch(()=>{});
  throw error;
}finally{
  await browser.close();await server.close();
}
