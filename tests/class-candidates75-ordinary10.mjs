import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-10-candidates75-ordinary10';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const specs={
  'classes/bayushi-deceiver-627':{name:'Bayushi Deceiver',version:'D&D 3.0',level:10,training:['light-armor','martial-weapons','medium-armor','simple-weapons']},
  'classes/guild-thief-514':{name:'Guild Thief',version:'D&D 3.0',level:5,training:['light-armor','simple-weapons']},
  'classes/enlightened-spirit-267':{name:'Enlightened Spirit',version:'D&D 3.5',level:10,training:[]},
  'classes/hellfire-warlock-463':{name:'Hellfire Warlock',version:'D&D 3.5',level:3,training:[]},
  'classes/fist-of-dal-quor-814':{name:'Fist of Dal Quor',version:'D&D 3.5',level:5,training:[]},
  'classes/inquisitor-of-the-drowning-goddess-901':{name:'Inquisitor of the Drowning Goddess',version:'D&D 3.5',level:5,training:['steel-fins']}
};
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const source=(character,key,id)=>(character[key]||[]).filter(item=>item.sourceClassId===id);
const base=(definition,level)=>({id:'candidate75-ordinary10',name:'Candidate 75 Ordinary 10',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:18,con:18,int:18,wis:18,cha:18},hp:{current:100,max:100,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const grant=(definition,name)=>definition.levelGrants.find(item=>norm(item.name)===norm(name));

const definitions={};
for(const [sourceId,spec] of Object.entries(specs)){
  const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId===sourceId),reference);
  assert(definition,`missing exact ${sourceId}`);
  definitions[sourceId]=definition;
  assert.equal(definition.name,spec.name);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must publish through ordinary slice 10`);
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,spec.version);
  assert.equal(definition.prerequisiteReview?.verified,true);
  assert.equal(definition.classSkillReview?.verified,true);
  assert.equal(definition.proficiencyReview?.verified,true);
  assert((definition.prerequisites||[]).length>0,`${spec.name} must retain reviewed entry requirements`);
  assert((definition.classSkills||[]).length>0,`${spec.name} must retain reviewed class skills`);
  const unresolved=(definition.levelGrants||[]).filter(item=>!item.name||String(item.description||'').trim().length<12);
  assert.equal(unresolved.length,0,`${spec.name} has undescribed grants: ${JSON.stringify(unresolved)}`);
  assert.deepEqual((definition.proficiencies||[]).map(item=>item.index).sort(),[...spec.training].sort(),`${spec.name} exact source training`);
  const built=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(reconcileClassGrants(built),built,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
  const removed=removeClassProgression({...built,classLevels:[row(definition,spec.level),survivor],level:spec.level+1},definition.catalogId);
  for(const key of ['grantedFeatures','actions','resources','trainingGrants','feats','classSkills35','classSkillRules35'])assert(!source(removed,key,definition.catalogId).length,`${spec.name} ${key} survive removal`);
}

const bayushi=definitions['classes/bayushi-deceiver-627'];
for(const text of ['Any nonlawful','Human (Scorpion)','+3','Bluff 8','Diplomacy 8','Improved Initiative','+2d6'])assert(bayushi.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Bayushi Deceiver missing prerequisite ${text}`);
for(const skill of ['Innuendo','Read Lips','Iaijutsu Focus'].filter(skill=>skill!=='Iaijutsu Focus'))assert(bayushi.classSkills.includes(skill),`Bayushi Deceiver missing class skill ${skill}`);
assert.equal(grant(bayushi,'Improved Disarm')?.featName,'Improved Disarm');
assert.equal(grant(bayushi,'Improved Critical')?.choiceKind,'feat');
assert.equal(bayushi.conditionalMechanics?.strikeFirstStrikeLast?.initiativeAbility,'int');
assert.equal(bayushi.conditionalMechanics?.scorpionFeint?.bluffBonus,2);

const guild=definitions['classes/guild-thief-514'];
for(const text of ['Gather Information 3','Hide 8','Intimidate 3','Move Silently 3','thieves'])assert(guild.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Guild Thief missing prerequisite ${text}`);
const guildBonus=grant(guild,'Bonus Feat');
assert.equal(guildBonus?.choiceKind,'feat');
assert.deepEqual(guildBonus?.choiceLevels,[2,4]);
assert((guildBonus?.choiceOptions||[]).includes('Alertness'));
assert.equal(guild.conditionalMechanics?.doublespeak?.bonus,2);

const spirit=definitions['classes/enlightened-spirit-267'];
for(const text of ['Any good','Knowledge (the planes) 8','Eldritch blast 3d6'])assert(spirit.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Enlightened Spirit missing prerequisite ${text}`);
const resistance=grant(spirit,'Energy Resistance 5');
assert.equal(resistance?.choiceKind,'source');
assert.deepEqual((resistance?.choiceOptions||[]).sort(),['Acid','Cold','Electricity','Fire'].sort());
assert.equal(spirit.conditionalMechanics?.spiritArmor?.bonusAt10,3);

const hellfire=definitions['classes/hellfire-warlock-463'];
for(const text of ['Intimidate 6','Knowledge (the planes) 12','Spellcraft 6','Infernal','brimstone blast or hellrime blast'])assert(hellfire.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Hellfire Warlock missing prerequisite ${text}`);
assert.equal(grant(hellfire,'Hellfire Infusion')?.actionType,'Swift action');
assert.equal(hellfire.conditionalMechanics?.hellfireBlast?.extraDicePerClassLevel,2);
assert.equal(hellfire.conditionalMechanics?.hellfireBlast?.constitutionDamagePerUse,1);

const fist=definitions['classes/fist-of-dal-quor-814'];
for(const text of ['+4','Knowledge (the planes) 4','Chosen, Inspired, or kalashtar','psionic feat','martial or exotic weapon'])assert(fist.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Fist of Dal Quor missing prerequisite ${text}`);
assert.equal(fist.conditionalMechanics?.stunningStrike?.usesFormula,'Fist of Dal Quor class level per day');
assert.equal(fist.conditionalMechanics?.resilientMind?.saveBonus,2);
assert.equal(fist.conditionalMechanics?.resilientSoul?.saveBonus,2);

const inquisitor=definitions['classes/inquisitor-of-the-drowning-goddess-901'];
for(const text of ['Kuo-toa','lawful evil or lawful neutral','Concentration 8','Knowledge (religion) 4','Improved Unarmed Strike','Blibdoolpoolp'])assert(inquisitor.prerequisites.some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Inquisitor missing prerequisite ${text}`);
assert.equal(grant(inquisitor,'Fear Aura')?.actionType,'Standard action');
assert.deepEqual(grant(inquisitor,'Fear Aura')?.resource,{max:1,period:'day'});
assert.equal(inquisitor.conditionalMechanics?.fearAura?.radiusFeet,20);
assert.equal(inquisitor.conditionalMechanics?.mienOfJustice?.bonusAt5,8);

console.log('PASS candidate 75 ordinary slice 10: six exact-source ordinary records reviewed against existing generic engines.');
