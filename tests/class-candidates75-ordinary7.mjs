import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {featureChoicePlan} from '../src/lib/featureChoices.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary7';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary7',name:'Candidate 75 Ordinary 7',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:24,dex:20,con:22,int:14,wis:16,cha:16},hp:{current:250,max:250,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(items,classId)=>(items||[]).filter(item=>item.sourceClassId===classId);
const training=(character,classId)=>source(character.trainingGrants,classId).flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,classId,name)=>source(character.resources,classId).find(item=>item.name===name);

const specs={
  'classes/legendary-dreadnought-459':{
    name:'Legendary Dreadnought',skills:['Climb','Craft','Intimidate','Jump','Swim'],training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons'],
    prerequisiteTexts:['+23','Intimidate 15 ranks','Combat Reflexes','Great Cleave','Improved Bull Rush','Improved Critical'],bonusLevels:[5,10],bonusOptions:['Armor Skin','Devastating Critical','Dire Charge','Epic Fortitude','Epic Prowess','Epic Toughness','Epic Weapon Focus','Epic Weapon Specialization','Fast Healing','Great Constitution','Great Strength','Improved Combat Reflexes','Overwhelming Critical','Penetrate Damage Reduction']
  },
  'classes/guardian-paramount-457':{
    name:'Guardian Paramount',skills:['Bluff','Climb','Diplomacy','Intimidate','Jump','Listen','Profession','Spot'],training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons'],
    prerequisiteTexts:['+15','Spot 13 ranks','Alertness','Lightning Reflexes','Blinding Speed','Superior Initiative','Uncanny dodge','evasion'],bonusLevels:[1,4,7,10],bonusOptions:['Bulwark of Defense','Combat Archery','Damage Reduction','Dexterous Fortitude','Dexterous Will','Epic Dodge','Epic Fortitude','Epic Reflexes','Epic Reputation','Epic Skill Focus','Epic Speed','Epic Toughness','Epic Trapfinding','Epic Will','Exceptional Deflection','Fast Healing','Great Dexterity','Improved Combat Reflexes','Improved Sneak Attack','Improved Spell Resistance','Infinite Deflection','Legendary Climber','Lingering Damage','Mobile Defense','Perfect Health','Reflect Arrows','Self-Concealment','Sneak Attack of Opportunity','Spellcasting Harrier','Uncanny Accuracy']
  }
};

for(const [id,spec] of Object.entries(specs)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must publish through ordinary slice 7`);
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,'D&D 3.5');
  assert.equal(definition.prerequisiteReview?.verified,true);
  assert.equal(definition.classSkillReview?.verified,true);
  assert.equal(definition.proficiencyReview?.verified,true);
  for(const text of spec.prerequisiteTexts)assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`${spec.name} missing prerequisite ${text}`);
  for(const skill of spec.skills)assert((definition.classSkills||[]).includes(skill),`${spec.name} missing class skill ${skill}`);
  const built=reconcileClassGrants(base(definition,10));
  assert.deepEqual(training(built,definition.catalogId),spec.training.slice().sort(),`${spec.name} training drift`);
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
  assert.equal(unresolved.length,0,`${spec.name} has undescribed grants: ${JSON.stringify(unresolved)}`);
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Feat');
  assert(bonus,`${spec.name} needs guided bonus feats`);
  assert.equal(bonus.choiceKind,'feat');
  assert.deepEqual(bonus.choiceLevels,spec.bonusLevels);
  for(const option of spec.bonusOptions)assert(bonus.choiceOptions.includes(option),`${spec.name} missing bonus feat option ${option}`);
  const choicePlan=featureChoicePlan(built,null,{}, {feats});
  const bonusGroups=choicePlan.groups.filter(group=>group.label==='Bonus Feat');
  assert.equal(bonusGroups.length,spec.bonusLevels.length,`${spec.name} must prompt at every bonus-feat milestone`);
  assert.deepEqual(reconcileClassGrants(built),built,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...built,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
  assert(!source(removed.grantedFeatures,definition.catalogId).length,`${spec.name} features survive removal`);
  assert(!source(removed.actions,definition.catalogId).length,`${spec.name} actions survive removal`);
  assert(!source(removed.resources,definition.catalogId).length,`${spec.name} resources survive removal`);
  assert(!source(removed.trainingGrants,definition.catalogId).length,`${spec.name} training survives removal`);
}

{
  const definition=exact('classes/legendary-dreadnought-459');
  const built=reconcileClassGrants(base(definition,10));
  assert.equal(resource(built,definition.catalogId,'Unstoppable')?.max,2);
  assert.equal(resource(built,definition.catalogId,'Unmovable')?.max,2);
  assert.equal(definition.conditionalMechanics?.shrugOffPunishment?.bonusHitPointsAt10,24);
  assert.equal(definition.conditionalMechanics?.thickSkinned?.damageReductionAt10,6);
  assert.equal(definition.conditionalMechanics?.unstoppable?.bonus,20);
}

{
  const definition=exact('classes/guardian-paramount-457');
  const built=reconcileClassGrants(base(definition,10));
  assert.equal(resource(built,definition.catalogId,'Uncanny Dodge Enabler')?.max,6);
  assert.equal(resource(built,definition.catalogId,'Evasive Preceptor')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Protective Aura')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Adjust Probability')?.max,3);
  assert.equal(resource(built,definition.catalogId,'Call Back')?.max,1);
  assert.equal(definition.conditionalMechanics?.adjustProbability?.rangeFeet,25);
  assert.equal(definition.conditionalMechanics?.protectiveAura?.clericCasterLevel,8);
  assert.equal(definition.conditionalMechanics?.callBack?.clericCasterLevel,20);
}

console.log('PASS candidate 75 ordinary slice 7: 2 exact-source epic classes.');
