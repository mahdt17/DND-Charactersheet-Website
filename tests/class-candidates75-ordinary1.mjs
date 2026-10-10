import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,castingAdvancementPlan,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary1';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const character=classLevels=>({id:'candidate75-ordinary1',name:'Candidate 75 Ordinary 1',ruleset:'3.5',mechanics:'3.5',classLevels,level:classLevels.reduce((n,r)=>n+r.level,0),abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:100,max:100,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const sourceFeatureNames=(value,classId)=>(value.grantedFeatures||[]).filter(item=>item.sourceClassId===classId).map(item=>item.name);
const resource=(value,classId,name)=>(value.resources||[]).find(item=>item.sourceClassId===classId&&item.name===name);
const action=(value,classId,name)=>(value.actions||[]).find(item=>item.sourceClassId===classId&&item.name===name);

const specs=[
  ['classes/arcane-trickster-379','D&D 3.5',10],
  ['classes/eldritch-knight-386','D&D 3.5',10],
  ['classes/mystic-theurge-390','D&D 3.5',10],
  ['classes/fist-of-hextor-769','D&D 3.0',10],
  ['classes/force-missile-mage-986','D&D 3.5',5],
  ['classes/master-of-the-yuirwood-886','D&D 3.0',10]
];

for(const [id,version,level] of specs){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${definition.name} must publish through the candidate-75 ordinary review overlay`);
  assert.equal(definition.referenceOnly,false,`${definition.name} must be source verified`);
  assert.equal(definition.sourceVersion,version,`${definition.name} source version drift`);
  assert.equal(definition.prerequisiteReview?.verified,true,`${definition.name} prerequisites must be reviewed`);
  assert.equal(definition.classSkillReview?.verified,true,`${definition.name} class skills must be reviewed`);
  assert.equal(definition.proficiencyReview?.verified,true,`${definition.name} training must be reviewed`);
  assert(Array.isArray(definition.prerequisites),`${definition.name} must expose structured prerequisites`);
  assert(Array.isArray(definition.classSkills),`${definition.name} must expose reviewed class skills`);
  assert(Array.isArray(definition.proficiencies),`${definition.name} must expose reviewed proficiencies`);
  assert((definition.levelGrants||[]).every(grant=>grant.name&&Number(grant.level)>0&&String(grant.description||'').trim().length>=12),`${definition.name} grants need reviewed rule text`);

  const built=reconcileClassGrants(character([row(definition,level)]));
  assert.deepEqual(reconcileClassGrants(built),built,`${definition.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...built,classLevels:[row(definition,level),survivor],level:level+1},definition.catalogId);
  assert(!sourceFeatureNames(removed,definition.catalogId).length,`${definition.name} features survive source removal`);
  assert(!(removed.actions||[]).some(item=>item.sourceClassId===definition.catalogId),`${definition.name} actions survive source removal`);
  assert(!(removed.resources||[]).some(item=>item.sourceClassId===definition.catalogId),`${definition.name} resources survive source removal`);
}

const arcaneTrickster=exact('classes/arcane-trickster-379');
let built=reconcileClassGrants(character([row(arcaneTrickster,10)]));
assert.equal(resource(built,arcaneTrickster.catalogId,'Ranged Legerdemain')?.max,3,'Arcane Trickster ranged legerdemain must scale to 3/day');
assert.equal(resource(built,arcaneTrickster.catalogId,'Impromptu Sneak Attack')?.max,2,'Arcane Trickster impromptu sneak attack must scale to 2/day');
assert(sourceFeatureNames(built,arcaneTrickster.catalogId).includes('Sneak Attack'),'Arcane Trickster must reconcile sneak attack progression');

const eldritchKnight=exact('classes/eldritch-knight-386');
const bonusFeat=eldritchKnight.levelGrants.find(grant=>grant.name==='Bonus Feat');
assert.equal(bonusFeat?.choiceKind,'feat','Eldritch Knight level 1 fighter feat must be a guided feat choice');
assert.equal(bonusFeat?.choiceFeatType,'Fighter','Eldritch Knight bonus feat must use the fighter-feat pool');

const fist=exact('classes/fist-of-hextor-769');
built=reconcileClassGrants(character([row(fist,10)]));
assert.equal(resource(built,fist.catalogId,'Strength Boost')?.max,3,'Fist of Hextor Strength Boost must scale to 3/day');
assert.equal(resource(built,fist.catalogId,'Frightful Presence')?.max,3,'Fist of Hextor Frightful Presence must scale to 3/day');
assert.equal(action(built,fist.catalogId,'Frightful Presence')?.type,'Free action','Fist of Hextor Frightful Presence must be a free action');
for(const name of ['Simple weapons','Martial weapons','Light armor','Medium armor','Heavy armor','Shields'])assert(fist.proficiencies.some(item=>item.name===name),`Fist of Hextor missing ${name} proficiency`);

const forceMissileMage=exact('classes/force-missile-mage-986');
built=reconcileClassGrants(character([row(forceMissileMage,5)]));
assert.equal(resource(built,forceMissileMage.catalogId,'Swift Shield')?.max,1,'Force Missile Mage Swift Shield must be 1/day');
assert.equal(action(built,forceMissileMage.catalogId,'Swift Shield')?.type,'Immediate action','Force Missile Mage Swift Shield must be an immediate action');

const yuirwood=exact('classes/master-of-the-yuirwood-886');
built=reconcileClassGrants(character([row(yuirwood,10)]));
assert.equal(resource(built,yuirwood.catalogId,'Work Menhir Circle')?.max,10,'Master of the Yuirwood menhir uses must equal class level');
assert.equal(resource(built,yuirwood.catalogId,'Pass without Trace')?.max,1,'Master of the Yuirwood pass without trace must be 1/day');
for(const name of ['Simple weapons','Martial weapons','Light armor','Shields'])assert(yuirwood.proficiencies.some(item=>item.name===name),`Master of the Yuirwood missing ${name} proficiency`);

const wizard=exact('classes/wizard-99'),cleric=exact('classes/cleric-91'),mystic=exact('classes/mystic-theurge-390');
assert(wizard&&cleric&&mystic);
const castingBase=character([row(wizard,7),row(cleric,7)]);
let plan=castingAdvancementPlan(castingBase,mystic,1);
assert.deepEqual(plan.groups.map(group=>group.kind).sort(),['arcane','divine'],'Mystic Theurge must advance one arcane and one divine class each level');
plan=castingAdvancementPlan(castingBase,eldritchKnight,2);
assert.equal(plan.groups.length,1,'Eldritch Knight must expose its Special-column casting advancement from 2nd level');
assert.equal(plan.groups[0].kind,'arcane','Eldritch Knight advancement must remain arcane-only');
assert.deepEqual(plan.groups[0].candidates.map(item=>item.classId),[wizard.catalogId],'Eldritch Knight must not offer divine casting targets');
for(const definition of [arcaneTrickster,forceMissileMage,yuirwood]){
  plan=castingAdvancementPlan(castingBase,definition,definition===forceMissileMage?2:1);
  assert.equal(plan.groups.length,1,`${definition.name} must expose one existing-spellcasting advancement choice`);
  assert.equal(plan.groups[0].kind,'spellcasting',`${definition.name} source text is unrestricted existing spellcasting advancement`);
  assert.deepEqual(new Set(plan.groups[0].candidates.map(item=>item.classId)),new Set([wizard.catalogId,cleric.catalogId]),`${definition.name} unrestricted source text must preserve both valid existing casting targets`);
}

console.log('PASS candidate 75 ordinary slice 1: 6 exact-source classes.');
