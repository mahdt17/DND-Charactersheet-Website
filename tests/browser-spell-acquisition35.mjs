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
  const saveStatus=page.locator('.save-status');
  await saveStatus.filter({hasText:'Saving…'}).waitFor();
  await saveStatus.filter({hasText:'All changes saved'}).waitFor();
  const wizardCampaignSaved=await saved(wizardName);
  const wizardCampaignBucket=wizardCampaignSaved.spellAcquisition35[wizardKey];
  const scorching=wizardCampaignBucket.acquisitions.find(x=>x.spellName==='Scorching Ray');
  assert.equal(scorching.origin,'copied-scroll');
  assert.equal(scorching.affectsQuota,false);
  assert(wizardCampaignBucket.campaignEntries.some(x=>x.spellKey===scorching.spellKey&&x.confirmed===true));
  console.log('PASS Wizard campaign spellbook acquisition from Manage Spells');

  assert.deepEqual(errors,[]);
}catch(error){
  await page.screenshot({path:'test-results/spell-acquisition35-failure.png',fullPage:true}).catch(()=>{});
  throw error;
}finally{
  await browser.close();await server.close();
}
