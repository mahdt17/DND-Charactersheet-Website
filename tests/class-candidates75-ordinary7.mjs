import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';

const REVIEW_BATCH='2026-10-08-candidates75-ordinary7';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary7',name:'Candidate 75 Ordinary 7',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:14,con:16,int:14,wis:12,cha:16},hp:{current:120,max:120,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(character,definition,key)=>(character[key]||[]).filter(item=>item.sourceClassId===definition.catalogId);
const training=(character,definition)=>source(character,definition,'trainingGrants').flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,definition,name)=>source(character,definition,'resources').find(item=>item.name===name);
const action=(character,definition,name)=>source(character,definition,'actions').find(item=>item.name===name);
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};

{
  const definition=exact('classes/thayan-knight-337');
  assert(definition,'missing exact Thayan Knight record');
  assert.equal(definition.name,'Thayan Knight');
  assert.equal(definition.reviewBatch,REVIEW_BATCH,'Thayan Knight must publish through ordinary slice 7');
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,'D&D 3.5');
  assert.equal(definition.sourceBook,'Prestige Class Complete Warrior');
  assert.equal(definition.prerequisiteReview?.verified,true);
  assert.equal(definition.classSkillReview?.verified,true);
  assert.equal(definition.proficiencyReview?.verified,true);
  for(const text of ['Human','Any nongood','+5','Intimidate 2 ranks','Knowledge (arcana) 2 ranks','Knowledge (local, Thay) 2 ranks','Iron Will','Weapon Focus (longsword)','Sworn allegiance to the Red Wizards of Thay'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Thayan Knight missing prerequisite ${text}`);
  for(const skill of ['Bluff','Climb','Craft','Gather Information','Handle Animal','Intimidate','Jump','Knowledge (arcana)','Knowledge (local)','Profession','Ride','Spot','Swim'])assert((definition.classSkills||[]).includes(skill),`Thayan Knight missing class skill ${skill}`);

  const built=reconcileClassGrants(base(definition,5));
  assert.deepEqual(training(built,definition),['tower-shields'],'Thayan Knight must gain only tower-shield proficiency');
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,description:grant.description}));
  assert.equal(unresolved.length,0,`Thayan Knight has undescribed grants: ${JSON.stringify(unresolved)}`);
  assert.equal(definition.conditionalMechanics?.horrorsOfThay?.fearSaveBonusAt4,4);
  assert.equal(definition.conditionalMechanics?.horrorsOfThay?.charmSaveBonusAt4,2);
  assert.equal(definition.conditionalMechanics?.zulkirsFavor?.reflexSaveBonus,2);
  assert.equal(definition.conditionalMechanics?.zulkirsDefender?.attackBonus,2);
  assert.equal(definition.conditionalMechanics?.zulkirsDefender?.damageBonus,2);
  assert.equal(definition.conditionalMechanics?.finalStand?.temporaryHitPoints,'2d10');
  assert.equal(definition.conditionalMechanics?.zulkirsChampion?.savingThrowLuckBonus,2);
  assert.equal(resource(built,definition,'Final Stand')?.max,1);
  assert.equal(action(built,definition,'Final Stand')?.type,'Standard action');
  assert.equal(resource(built,definition,"Zulkir's Champion")?.max,1);

  const plan=featureChoicePlan(built,null,{}, {feats});
  const fighterFeat=plan.groups.find(group=>group.label==='Fighter Feat');
  assert(fighterFeat,'Thayan Knight must prompt for its fighter feat');
  assert(fighterFeat.options.length>0,'fighter feat list must resolve from feat metadata');
  assert(!fighterFeat.options.includes('Weapon Specialization'),'Weapon Specialization is explicitly excluded');
  const option=fighterFeat.options[0];
  const chosen=applyFeatureChoices(built,null,{[fighterFeat.id]:[option]},{feats});
  assert(chosen.feats.some(feat=>feat.sourceClassId===definition.catalogId&&feat.name===option),'selected fighter feat must materialize');
  assert.equal(featureChoicePlan(chosen,null,{}, {feats}).groups.length,0,'fighter feat choice must persist across reopen');
  assert.deepEqual(reconcileClassGrants(chosen),chosen,'Thayan Knight reconciliation must be idempotent');
  const removed=removeClassProgression({...chosen,classLevels:[row(definition,5),survivor],level:6},definition.catalogId);
  for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,definition,key).length,`Thayan Knight ${key} survive removal`);
  assert(!Object.values(removed.featureChoices||{}).some(choice=>choice?.sourceClassId===definition.catalogId),'Thayan Knight choice survives removal');
  assert(!removed.feats.some(feat=>feat.sourceClassId===definition.catalogId),'Thayan Knight selected feat survives removal');
}

{
  const definition=exact('classes/stormtalon-746');
  assert(definition,'missing exact Stormtalon record');
  assert.equal(definition.name,'Stormtalon');
  assert.equal(definition.reviewBatch,REVIEW_BATCH,'Stormtalon must publish through ordinary slice 7');
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,'D&D 3.5');
  assert.equal(definition.sourceBook,'Prestige Class Races of the Wild');
  for(const text of ['Raptoran','+5','Flight extraordinary ability'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Stormtalon missing prerequisite ${text}`);
  for(const skill of ['Balance','Climb','Craft','Intimidate','Jump','Spot','Tumble'])assert((definition.classSkills||[]).includes(skill),`Stormtalon missing class skill ${skill}`);
  assert.deepEqual(definition.proficiencies||[],[],'Stormtalon gains no new weapon or armor proficiency');

  const built=reconcileClassGrants(base(definition,10));
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,description:grant.description}));
  assert.equal(unresolved.length,0,`Stormtalon has undescribed grants: ${JSON.stringify(unresolved)}`);
  const bonus=definition.levelGrants.find(item=>item.name==='Bonus Aerial Feat');
  assert(bonus,'Stormtalon needs guided aerial feat choices');
  assert.equal(bonus.choiceKind,'feat');
  assert.deepEqual(bonus.choiceLevels,[2,4,6,8,10]);
  for(const option of ['Aerial Reflexes','Aerial Superiority','Born Flyer','Diving Charge','Flyby Attack','Hover','Improved Flight','Multiattack','Wingover'])assert(bonus.choiceOptions.includes(option),`Stormtalon missing aerial feat ${option}`);
  const groups=featureChoicePlan(built,null,{}, {feats}).groups.filter(group=>group.label==='Bonus Aerial Feat');
  assert.equal(groups.length,5,'Stormtalon must prompt at every aerial feat milestone');
  assert.equal(definition.conditionalMechanics?.footTalons?.damageAt1,'1d6');
  assert.equal(definition.conditionalMechanics?.footTalons?.requiresAirborneAt1,true);
  assert.equal(definition.conditionalMechanics?.fastFlight?.bonusFeetAt9,40);
  assert.equal(definition.conditionalMechanics?.improvedFootTalons?.damage,'1d8');
  assert.equal(definition.conditionalMechanics?.improvedFootTalons?.requiresAirborne,false);
  assert.deepEqual(reconcileClassGrants(built),built,'Stormtalon reconciliation must be idempotent');
  const removed=removeClassProgression({...built,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
  for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,definition,key).length,`Stormtalon ${key} survive removal`);
}

console.log('PASS candidate 75 ordinary slice 7: Thayan Knight and Stormtalon exact-source lifecycles.');
