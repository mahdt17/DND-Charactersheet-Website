import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary3';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary3',name:'Candidate 75 Ordinary 3',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:18,con:16,int:16,wis:14,cha:16},hp:{current:120,max:120,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const sourceFeatures=(character,classId)=>(character.grantedFeatures||[]).filter(item=>item.sourceClassId===classId);
const sourceFeats=(character,classId)=>(character.feats||[]).filter(item=>item.sourceClassId===classId);
const training=(character,classId)=>(character.trainingGrants||[]).filter(item=>item.sourceClassId===classId).flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();

const specs={
  'classes/aerial-avenger-980':{name:'Aerial Avenger',version:'D&D 3.5',level:10,training:['martial-weapons','simple-weapons']},
  'classes/exotic-weapon-master-610':{name:'Exotic Weapon Master',version:'D&D 3.0',level:5,training:['all-exotic-weapons']},
  'classes/iaijutsu-master-634':{name:'Iaijutsu Master',version:'D&D 3.0',level:10,training:['martial-weapons','simple-weapons']}
};

for(const [id,spec] of Object.entries(specs)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must publish through ordinary slice 3`);
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,spec.version);
  assert.equal(definition.prerequisiteReview?.verified,true);
  assert.equal(definition.classSkillReview?.verified,true);
  assert.equal(definition.proficiencyReview?.verified,true);
  assert(Array.isArray(definition.prerequisites)&&definition.prerequisites.length,`${spec.name} needs structured prerequisites`);
  assert(Array.isArray(definition.classSkills)&&definition.classSkills.length,`${spec.name} needs reviewed class skills`);
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
  assert.equal(unresolved.length,0,`${spec.name} has undescribed grants: ${JSON.stringify(unresolved)}`);
  const built=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(training(built,definition.catalogId),spec.training.slice().sort(),`${spec.name} training drift`);
  assert.deepEqual(reconcileClassGrants(built),built,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...built,classLevels:[row(definition,spec.level),survivor],level:spec.level+1},definition.catalogId);
  assert(!sourceFeatures(removed,definition.catalogId).length,`${spec.name} features survive removal`);
  assert(!(removed.feats||[]).some(item=>item.sourceClassId===definition.catalogId),`${spec.name} feats survive removal`);
  assert(!(removed.trainingGrants||[]).some(item=>item.sourceClassId===definition.catalogId),`${spec.name} training survives removal`);
}

{
  const definition=exact('classes/aerial-avenger-980');
  const built=reconcileClassGrants(base(definition,10));
  assert(sourceFeats(built,definition.catalogId).some(item=>item.name==='Flyby Attack'),'Aerial Avenger must grant Flyby Attack');
  assert.equal(definition.conditionalMechanics?.momentum?.damageBonusAt10,3);
  assert.equal(definition.conditionalMechanics?.speed?.bonusFeetAt10,20);
  assert.equal(definition.conditionalMechanics?.deathFromAbove?.attackBonusAt10,2);
  assert.equal(definition.conditionalMechanics?.rangeIncrease?.multiplier,1.5);
  assert((built.actions||[]).some(item=>item.sourceClassId===definition.catalogId&&item.name==='Swoop'&&item.type==='Full-round action'));
}

{
  const definition=exact('classes/exotic-weapon-master-610');
  const built=reconcileClassGrants(base(definition,5));
  assert(training(built,definition.catalogId).includes('all-exotic-weapons'),'Exotic Weapon Master must gain all exotic weapon proficiency at level 3');
  assert.equal(definition.conditionalMechanics?.partialExoticProficiency?.nonproficiencyPenaltyAt1,-2);
  assert.equal(definition.conditionalMechanics?.partialExoticProficiency?.nonproficiencyPenaltyAt2,-1);
  assert.equal(definition.conditionalMechanics?.exoticFocus?.attackBonus,1);
  assert.equal(definition.conditionalMechanics?.exoticSpecialization?.damageBonus,2);
}

{
  const definition=exact('classes/iaijutsu-master-634');
  const built=reconcileClassGrants(base(definition,10));
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Feat');
  assert(bonus,'Iaijutsu Master needs its guided bonus feat feature');
  assert.equal(bonus.choiceKind,'feat');
  assert.deepEqual(bonus.choiceLevels,[4,9]);
  for(const option of ['Dodge','Mobility','Spring Attack','Combat Expertise','Improved Disarm','Improved Trip','Whirlwind Attack','Skill Focus (Iaijutsu Focus)','Toughness'])assert(bonus.choiceOptions.includes(option),`Iaijutsu Master missing bonus feat option ${option}`);
  assert.equal(definition.conditionalMechanics?.weaponFinesse?.weapon,'katana');
  assert.equal(definition.conditionalMechanics?.cannyDefense?.ability,'int');
  assert.equal(definition.conditionalMechanics?.lightningBlade?.ability,'cha');
  assert((built.actions||[]).some(item=>item.sourceClassId===definition.catalogId&&item.name==='One Strike, Two Cuts'&&item.type==='Standard action'));
}

console.log('PASS candidate 75 ordinary slice 3: 3 exact-source classes.');
