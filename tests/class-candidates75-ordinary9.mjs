import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-08-candidates75-ordinary9';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/frenzied-berserker-614'),reference);
assert(definition,'missing exact Masters of the Wild Frenzied Berserker record');
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const base=(level=10)=>({id:'candidate75-ordinary9',name:'Candidate 75 Ordinary 9',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:22,dex:14,con:18,int:10,wis:12,cha:14},hp:{current:160,max:160,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(character,key)=>(character[key]||[]).filter(item=>item.sourceClassId===definition.catalogId);
const resource=(character,name)=>source(character,'resources').find(item=>item.name===name);
const action=(character,name)=>source(character,'actions').find(item=>item.name===name);

assert.equal(definition.name,'Frenzied Berserker');
assert.equal(definition.sourceBook,'Prestige Class Masters of the Wild: A Guidebook to Barbarians, Druids, and Rangers');
const remainConscious=feats.find(feat=>feat.name==='Remain Conscious');
assert(remainConscious,'Masters of the Wild Frenzied Berserker requires the source Remain Conscious bonus feat in the 3.5 feat catalog');

assert.equal(definition.reviewBatch,REVIEW_BATCH,'Masters of the Wild Frenzied Berserker must publish through ordinary slice 9');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.0');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
assert.deepEqual(definition.proficiencies||[],[],'Masters of the Wild Frenzied Berserker grants no weapon or armor training');
for(const text of ['+6','Any nonlawful','Cleave','Destructive Rage','Intimidating Rage','Power Attack'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Frenzied Berserker missing prerequisite ${text}`);
for(const skill of ['Climb','Intimidate','Jump','Ride','Swim'])assert((definition.classSkills||[]).includes(skill),`Frenzied Berserker missing class skill ${skill}`);

const built=reconcileClassGrants(base());
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
assert.equal(unresolved.length,0,`Frenzied Berserker has undescribed grants: ${JSON.stringify(unresolved)}`);
const grantedRemain=source(built,'feats').find(feat=>feat.name==='Remain Conscious');
assert(grantedRemain,'Frenzied Berserker must grant Remain Conscious as a source-owned feat');
assert.equal(grantedRemain.catalogId,remainConscious.catalogId,'Frenzied Berserker must link its bonus feat to the exact Remain Conscious catalog record');
assert.equal(resource(built,'Frenzy')?.max,5);
assert.equal(resource(built,'Frenzy')?.period,'day');
assert.equal(action(built,'Frenzy')?.type,'Free action');
assert.equal(resource(built,'Inspire Frenzy')?.max,3);
assert.equal(definition.conditionalMechanics?.frenzy?.strengthBonusAt1,6);
assert.equal(definition.conditionalMechanics?.frenzy?.strengthBonusAt8,10);
assert.equal(definition.conditionalMechanics?.frenzy?.armorClassPenalty,-4);
assert.equal(definition.conditionalMechanics?.frenzy?.subdualDamagePerRound,2);
assert.equal(definition.conditionalMechanics?.frenzy?.durationFormula,'3 + Constitution modifier rounds');
assert.equal(definition.conditionalMechanics?.frenzy?.earlyEndWillSaveDc,20);
assert.equal(definition.conditionalMechanics?.frenzy?.damageTriggerWillSaveDcFormula,'10 + damage suffered since last action');
assert.equal(definition.conditionalMechanics?.frenzy?.fatiguedAfterwardUntilLevel,10);
assert.equal(definition.conditionalMechanics?.supremeCleave?.stepFeet,5);
assert.equal(definition.conditionalMechanics?.improvedPowerAttack?.damageBonusPerAttackPenalty,'+3 damage per -2 attack');
assert.equal(definition.conditionalMechanics?.inspireFrenzy?.radiusFeet,10);
assert.equal(definition.conditionalMechanics?.inspireFrenzy?.resistWillSaveDcFormula,'10 + Frenzied Berserker class level + Charisma modifier');
assert.equal(definition.conditionalMechanics?.supremePowerAttack?.damageBonusPerAttackPenalty,'+2 damage per -1 attack');
assert.deepEqual(reconcileClassGrants(built),built,'Frenzied Berserker reconciliation must be idempotent');

const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...built,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
for(const key of ['grantedFeatures','actions','resources','trainingGrants','feats'])assert(!source(removed,key).length,`Frenzied Berserker ${key} survive removal`);

console.log('PASS candidate 75 ordinary slice 9: Masters of the Wild Frenzied Berserker exact-source lifecycle.');
