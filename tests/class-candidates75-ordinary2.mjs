import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary2';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary2',name:'Candidate 75 Ordinary 2',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:18,con:18,int:16,wis:16,cha:16},hp:{current:150,max:150,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const trainingIndexes=character=>(character.trainingGrants||[]).flatMap(grant=>grant.proficiencies||[]).map(item=>item.index).sort();
const sourceFeatures=(character,classId)=>(character.grantedFeatures||[]).filter(item=>item.sourceClassId===classId);
const resource=(character,classId,name)=>(character.resources||[]).find(item=>item.sourceClassId===classId&&item.name===name);

const specs={
  'classes/breachgnome-696':{name:'Breachgnome',version:'D&D 3.0',level:5,training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons']},
  'classes/dwarf-paragon-1001':{name:'Dwarf Paragon',version:'D&D 3.5',level:3,training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields-except-tower','simple-weapons']},
  'classes/gray-hand-enforcer-302':{name:'Gray Hand Enforcer',version:'D&D 3.5',level:5,training:[]},
  'classes/guardian-paramount-457':{name:'Guardian Paramount',version:'D&D 3.0',level:10,training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons']},
  'classes/legendary-dreadnought-459':{name:'Legendary Dreadnought',version:'D&D 3.0',level:10,training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons']}
};

for(const [id,spec] of Object.entries(specs)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must publish through ordinary slice 2`);
  assert.equal(definition.referenceOnly,false,`${spec.name} must be source verified`);
  assert.equal(definition.sourceVersion,spec.version,`${spec.name} source version drift`);
  assert.equal(definition.prerequisiteReview?.verified,true,`${spec.name} prerequisites not reviewed`);
  assert.equal(definition.classSkillReview?.verified,true,`${spec.name} class skills not reviewed`);
  assert.equal(definition.proficiencyReview?.verified,true,`${spec.name} training not reviewed`);
  assert(Array.isArray(definition.prerequisites)&&definition.prerequisites.length,`${spec.name} needs structured entry requirements`);
  assert(Array.isArray(definition.classSkills),`${spec.name} needs reviewed class skills`);
  assert((definition.levelGrants||[]).every(grant=>grant.name&&String(grant.description||'').trim().length>=12),`${spec.name} has undescribed grants`);

  const built=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(trainingIndexes(built),spec.training.slice().sort(),`${spec.name} training drift`);
  assert.deepEqual(reconcileClassGrants(built),built,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...built,classLevels:[row(definition,spec.level),survivor],level:spec.level+1},definition.catalogId);
  assert(!sourceFeatures(removed,definition.catalogId).length,`${spec.name} features survive source removal`);
  assert(!(removed.actions||[]).some(item=>item.sourceClassId===definition.catalogId),`${spec.name} actions survive source removal`);
  assert(!(removed.resources||[]).some(item=>item.sourceClassId===definition.catalogId),`${spec.name} resources survive source removal`);
  assert(!(removed.trainingGrants||[]).some(item=>item.sourceClassId===definition.catalogId),`${spec.name} training survives source removal`);
}

{
  const definition=exact('classes/breachgnome-696');
  const built=reconcileClassGrants(base(definition,5));
  assert.deepEqual(sourceFeatures(built,definition.catalogId).map(item=>item.name).sort(),['Bonus Feat','Seal the Breach','Uncanny Dodge'].sort());
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Feat');
  assert.deepEqual(bonus.choiceLevels,[2,4]);
  assert.equal(bonus.choiceKind,'feat');
  assert(definition.conditionalMechanics?.sealTheBreach?.adjacentSolidObjectAcDodge===2);
  assert(definition.conditionalMechanics?.sealTheBreach?.oppositeSolidObjectsAcDodge===4);
}

{
  const definition=exact('classes/dwarf-paragon-1001');
  const built=reconcileClassGrants(base(definition,3));
  assert(sourceFeatures(built,definition.catalogId).some(item=>item.name==='Ability Boost'));
  assert.equal(definition.conditionalMechanics?.abilityBoost?.constitution,2);
  assert.equal(definition.conditionalMechanics?.improvedDarkvision?.increaseFeet,30);
}

{
  const definition=exact('classes/gray-hand-enforcer-302');
  const built=reconcileClassGrants(base(definition,5));
  assert.equal(resource(built,definition.catalogId,'Dragonward Strike')?.max,2);
  assert.equal(resource(built,definition.catalogId,"Lords' Boon")?.max,20);
  assert.equal(resource(built,definition.catalogId,"Lords' Boon")?.unit,'hit points');
  assert.equal(definition.conditionalMechanics?.spellResistance?.formula,'5 + character level');
  assert.equal(definition.conditionalMechanics?.dragonwardStrike?.waterdeepRangeMiles,10);
}

{
  const definition=exact('classes/guardian-paramount-457');
  const built=reconcileClassGrants(base(definition,10));
  assert.equal(resource(built,definition.catalogId,'Uncanny Dodge Enabler')?.max,6);
  assert.equal(resource(built,definition.catalogId,'Evasive Preceptor')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Protective Aura')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Adjust Probability')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Call Back')?.max,1);
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Feat');
  assert.deepEqual(bonus.choiceLevels,[1,4,7,10]);
  assert.equal(bonus.choiceKind,'feat');
  assert.equal(String(definition.minBab), '15');
}

{
  const definition=exact('classes/legendary-dreadnought-459');
  const built=reconcileClassGrants(base(definition,10));
  assert.equal(resource(built,definition.catalogId,'Unstoppable')?.max,2);
  assert.equal(resource(built,definition.catalogId,'Unmovable')?.max,2);
  assert.equal(definition.conditionalMechanics?.shrugOffPunishment?.bonusHitPointsAtLevel10,24);
  assert.equal(definition.conditionalMechanics?.thickSkinned?.damageReductionAtLevel10,6);
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Feat');
  assert.deepEqual(bonus.choiceLevels,[5,10]);
  assert.equal(String(definition.minBab),'23');
}

console.log('PASS candidate 75 ordinary slice 2: 5 exact-source classes.');
