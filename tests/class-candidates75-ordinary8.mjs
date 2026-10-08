import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,spellSlotProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-08-candidates75-ordinary8';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats,spells]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats'),service.load('3.5/spells')]);
const reference=[...classes,...feats];
const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/ebonmar-infiltrator-261'),reference);
assert(definition,'missing exact Ebonmar Infiltrator record');
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const base=(level=10)=>({id:'candidate75-ordinary8',name:'Candidate 75 Ordinary 8',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:12,dex:18,con:14,int:18,wis:14,cha:14},hp:{current:90,max:90,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(character,key)=>(character[key]||[]).filter(item=>item.sourceClassId===definition.catalogId);
const training=character=>source(character,'trainingGrants').flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,name)=>source(character,'resources').find(item=>item.name===name);
const action=(character,name)=>source(character,'actions').find(item=>item.name===name);
const exactSpell=name=>spells.find(spell=>spell.name===name&&spell.edition==='3.5');
const assertClassSpell=(name,level)=>{
  const spell=exactSpell(name);
  assert(spell,`missing 3.5 spell ${name}`);
  assert((spell.classes||[]).includes('Ebonmar Infiltrator'),`${name} must list Ebonmar Infiltrator`);
  assert.equal(spell.classLevels?.['Ebonmar Infiltrator'],level,`${name} Ebonmar level drift`);
};

assert.equal(definition.name,'Ebonmar Infiltrator');
assert.equal(definition.sourceBook,'Prestige Class CityScape');
const slots=spellSlotProgression(definition,10);
assert(slots,'Ebonmar Infiltrator must expose intrinsic spell slots');
assert.deepEqual(slots.slots.slice(1,5),[3,3,3,3],'Ebonmar Infiltrator level 10 spell slots drift');
assert.deepEqual(slots.unlockedSpellLevels.filter(level=>level>=1&&level<=4),[1,2,3,4],'Ebonmar Infiltrator must unlock spell levels 1-4');
const level1Slots=spellSlotProgression(definition,1);
assert.equal(level1Slots?.slots?.[1],0,'Ebonmar Infiltrator level 1 printed zero slot must remain zero');
assert(level1Slots?.unlockedSpellLevels?.includes(1),'printed zero slot must unlock bonus-spell access');
for(const [name,level] of [['Comprehend Languages',1],['Detect Magic',1],['Invisibility',2],['Arcane Sight',3],['Dimension Door',4],['Greater Invisibility',4]])assertClassSpell(name,level);

assert.equal(definition.reviewBatch,REVIEW_BATCH,'Ebonmar Infiltrator must publish through ordinary slice 8');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.5');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
for(const text of ['Decipher Script 4 ranks','Hide 8 ranks','Move Silently 8 ranks','Search 4 ranks','Sense Motive 4 ranks','Any two of the following','Alertness','Deceitful','Investigator','Negotiator','Stealthy','House Ebonmar'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Ebonmar Infiltrator missing reviewed prerequisite ${text}`);
for(const skill of ['Balance','Bluff','Climb','Craft','Decipher Script','Diplomacy','Disable Device','Disguise','Escape Artist','Forgery','Gather Information','Hide','Jump','Knowledge (nobility and royalty)','Listen','Move Silently','Open Lock','Search','Sense Motive','Sleight of Hand','Spot','Tumble','Use Rope'])assert((definition.classSkills||[]).includes(skill),`Ebonmar Infiltrator missing class skill ${skill}`);
assert.deepEqual(definition.proficiencies||[],[],'Ebonmar Infiltrator must not invent new training');

const built=reconcileClassGrants(base());
assert.deepEqual(training(built),[],'Ebonmar Infiltrator training drift');
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,description:grant.description}));
assert.equal(unresolved.length,0,`Ebonmar Infiltrator has undescribed grants: ${JSON.stringify(unresolved)}`);
assert.equal(definition.conditionalMechanics?.piercingInsight?.bonusAt10,4);
assert.equal(definition.conditionalMechanics?.combatAnticipation?.bonusAt3,1);
assert.equal(definition.conditionalMechanics?.combatAnticipation?.bonusAt6,2);
assert.equal(definition.conditionalMechanics?.combatAnticipation?.requiresLightOrNoArmor,true);
assert.deepEqual(definition.conditionalMechanics?.combatAnticipation?.eligibleCreatureTypes,['humanoid','monstrous humanoid','giant']);
assert.equal(definition.conditionalMechanics?.sneakAttack?.extraDamageAt8,'3d6');
assert.equal(definition.conditionalMechanics?.hyperAwareness?.darkvisionFeet,30);
assert.equal(definition.conditionalMechanics?.hyperAwareness?.blindsenseFeet,5);
assert.equal(resource(built,'Shadow in the Night')?.max,1);
assert.equal(action(built,'Shadow in the Night')?.type,'Standard action');
assert.equal(definition.conditionalMechanics?.shadowInTheNight?.durationFormula,'1 + Intelligence modifier rounds');
assert.deepEqual(reconcileClassGrants(built),built,'Ebonmar Infiltrator reconciliation must be idempotent');

const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...built,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,key).length,`Ebonmar Infiltrator ${key} survive removal`);

console.log('PASS candidate 75 ordinary slice 8: Ebonmar Infiltrator exact-source lifecycle.');
