import assert from 'node:assert/strict';
import {createShadowArcher} from './shadow-archer-fixture.mjs';
import {shadowArcherRoadmap} from '../src/lib/shadowArcherPlan.js';
import {advanceClass} from '../src/lib/advancement.js';
import {multiclassTrainingPlan} from '../src/lib/training.js';
import {arcaneArcherClass} from '../src/lib/arcaneArcher.js';
import {createInstitute,recordFame} from '../src/lib/esotericTraining.js';
import classes from '../src/data/classes.json' with {type:'json'};

function grandmaster() {
  let c=createShadowArcher('Grandmaster archer',5);
  let guild=recordFame(createInstitute(5),5,{id:'prior',kind:'prior'});
  for(let level=6; level<=20; level++){
    const [name]=shadowArcherRoadmap[level-1],base=classes.find(x=>x.name===name);
    const record=name==='Arcane Archer'?arcaneArcherClass:{...base,catalogId:'2014:'+base.index,edition:'2014'};
    const trainingChoices=Object.fromEntries(multiclassTrainingPlan(c,record).choices.filter(g=>g.required).map(g=>[g.id,g.options.slice(0,g.count)]));
    c=advanceClass(c,record,{flow:name==='Arcane Archer'?'prestige':'normal',trainingChoices,hpGain:6,subclass:level===12?'Gloom Stalker':undefined});
    if(level<=13)guild=recordFame(guild,level,{id:'quest-'+level,kind:'quest',note:'Research '+level,amount:5});
  }
  return {...c,affiliations:[{...guild,training:{...guild.training,approvedFame:45,bookAwards:true}}]};
}

// Supply an already-loaded owner sheet through the demo adapter in this browser test.
// Ordinary JSON imports go through the real import path and always get a new sheet ID.
async function openGrantedFixture(page,character) {
  await page.evaluate(c=>sessionStorage.setItem('granted-test-sheet',JSON.stringify(c)),character);
  await page.reload();
  await page.getByRole('button',{name:/Explore the demo/}).click();
  await page.locator('.character-card').filter({hasText:character.name}).getByRole('button',{name:'Open character'}).click();
}

export async function checkAffiliationFlow(page) {
  const button=(name,scope=page)=>scope.getByRole('button',{name,exact:true});
  const tab=name=>page.getByRole('tab',{name,exact:true}).click();
  await button('All characters').click();
  await button('Create character').click();
  assert.equal(await page.getByText('Use the Shadow Archer build',{exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:/Create level .* Shadow Archer/}).count(),0);
  await button('Cancel',page.locator('.creation-footer')).click();
  const copy={...createShadowArcher('Finral Strim',5),affiliations:[createInstitute(5)]};
  await page.locator('input[type=file]').setInputFiles({name:'copy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(copy))});
  await page.locator('.sheet-identity').filter({hasText:copy.name}).waitFor();
  await tab('Affiliations');
  assert.equal(await button('Join an arcane institute').count(),0);
  assert.equal(await page.getByRole('checkbox',{name:/Use the Shadow Archer roadmap/}).count(),0);
  assert.equal(await page.getByRole('region',{name:'Esoteric training'}).count(),0);
  await button('Delete affiliation: Arcane Institute').click();
  await button('Confirm deletion').click();
  await page.getByText('Add another affiliation',{exact:true}).click();
  await page.getByLabel('Guild or institution name').fill('Cartographers');
  await button('Add membership').click();
  await button('Delete affiliation: Cartographers').click();
  await button('Cancel').click();
  await button('Delete affiliation: Cartographers').click();
  await button('Confirm deletion').click();
  await button('All characters').click();
  await page.locator('.character-card').filter({hasText:copy.name}).getByRole('button',{name:'Open character'}).click();
  await tab('Affiliations');
  assert.equal(await page.getByRole('heading',{name:'Cartographers'}).count(),0);

  await page.addInitScript(()=>{
    const seed=sessionStorage.getItem('granted-test-sheet');
    if(!seed)return;
    const sheet=JSON.parse(seed);
    let adapter;
    Object.defineProperty(window,'storage',{configurable:true,get:()=>adapter,set:value=>{
      if(adapter!==value && value?.set)void value.set('char-detail:'+sheet.id,seed);
      adapter=value;
    }});
  });
  await openGrantedFixture(page,createShadowArcher('Institute archer',5));
  await tab('Affiliations');
  await page.getByText('Add another affiliation',{exact:true}).click();
  await page.getByLabel('Guild or institution name').fill('Silver Quill');
  await button('Add membership').click();
  await button('Join an arcane institute').click();
  await page.getByLabel('Award type').selectOption('prior');
  await button('Credit prior training').click();
  assert.equal(await button('Credit prior training').isDisabled(),true);
  await page.getByLabel('Highest rank approved by your DM').selectOption('5');
  await page.getByLabel('DM approves two spellbook additions').check();
  await page.getByText('Choose two spellbook additions · effective Wizard 5',{exact:true}).click();
  for(const name of ['Fireball','Counterspell']){
    await page.getByLabel('Search spells').fill(name);
    await page.getByRole('button',{name:new RegExp('^Select '+name+' [(]')}).first().click();
  }
  await button('Add both spells to spellbook').click();
  await tab('Spells');
  await page.getByLabel('Spellcasting class',{exact:true}).selectOption('2014:wizard');
  assert.equal(await page.getByRole('button',{name:/^Level 3 slot /}).count(),2);
  await button('Level up').click();
  const dialog=page.getByRole('dialog',{name:'Choose how to level up'});
  await dialog.getByLabel('Class to advance').selectOption('2014:wizard');
  await dialog.getByRole('checkbox',{name:/I reviewed the class/}).check();
  await button('Continue to level choices',dialog).click();
  await button('Continue',page.locator('.creation-footer')).click();
  await button('Apply level up').click();
  await page.locator('.sheet-identity').filter({hasText:/LEVEL 6/i}).waitFor();
  await tab('Affiliations');
  await page.getByRole('heading',{name:'Silver Quill'}).waitFor();
  await page.getByText('Choose two spellbook additions · effective Wizard 6',{exact:true}).waitFor();
  assert.equal(await page.getByText('Choose two spellbook additions · effective Wizard 5',{exact:true}).count(),0);
  await page.getByLabel('Check total including modifiers').fill('16');
  await button('Record education check').click();
  await page.getByText('6 Fame',{exact:true}).waitFor();
  await button('All characters').click();
  await page.locator('.character-card').filter({hasText:'Institute archer'}).getByRole('button',{name:'Open character'}).click();
  await tab('Affiliations');
  await page.getByText('6 Fame',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Silver Quill'}).waitFor();
  await button('Delete affiliation: Arcane Institute').click();
  await button('Confirm deletion').click();
  await button('Join an arcane institute').waitFor();
  await page.getByRole('heading',{name:'Silver Quill'}).waitFor();
  await openGrantedFixture(page,grandmaster());
  await tab('Affiliations');
  const finalAward=page.locator('details').filter({has:page.locator('summary').filter({hasText:/effective Wizard 17$/})});
  assert.equal(await finalAward.count(),0);
  await page.getByLabel('Completed Ascension quest').fill('Recover the first spellbow');
  await button('Record DM-approved Ascension').click();
  await finalAward.locator('summary').click();
  for(const name of ['Wish','Foresight']){
    await finalAward.getByLabel('Search spells').fill(name);
    await finalAward.getByRole('button',{name:new RegExp('^Select '+name+' [(]')}).first().click();
  }
  await button('Add both spells to spellbook',finalAward).click();
  await tab('Spells');
  await page.getByLabel('Spellcasting class',{exact:true}).selectOption('2014:wizard');
  const wish=page.locator('.spell-item').filter({has:page.getByText('Wish',{exact:true})});
  await button('Prepare',wish).click();
  await button('Cast',wish).click();
  await button('Cast & spend slot',page.getByRole('dialog',{name:'Cast Wish'})).click();
  assert.match(await button('Level 9 slot 1').getAttribute('class'),/used/);

}
