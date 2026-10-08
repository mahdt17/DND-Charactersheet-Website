import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-08-candidates75-ordinary8';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary8',name:'Candidate 75 Ordinary 8',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:18,con:16,int:14,wis:14,cha:16},hp:{current:140,max:140,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(character,definition,key)=>(character[key]||[]).filter(item=>item.sourceClassId===definition.catalogId);
const training=(character,definition)=>source(character,definition,'trainingGrants').flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,definition,name)=>source(character,definition,'resources').find(item=>item.name===name);
const action=(character,definition,name)=>source(character,definition,'actions').find(item=>item.name===name);
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};

{
  const definition=exact('classes/dread-commando-527');
  assert(definition,'missing exact Dread Commando record');
  assert.equal(definition.name,'Dread Commando');
  assert.equal(definition.reviewBatch,REVIEW_BATCH,'Dread Commando must publish through ordinary slice 8');
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,'D&D 3.5');
  assert.equal(definition.sourceBook,'Prestige Class Heroes of Battle');
  for(const text of ['+5','Hide 6 ranks','Move Silently 6 ranks','Dodge','Mobility'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Dread Commando missing prerequisite ${text}`);
  for(const skill of ['Climb','Craft','Disable Device','Disguise','Escape Artist','Hide','Jump','Knowledge (geography)','Listen','Move Silently','Open Lock','Profession','Search','Spot','Swim','Use Rope'])assert((definition.classSkills||[]).includes(skill),`Dread Commando missing class skill ${skill}`);
  assert.deepEqual(definition.proficiencies||[],[],'Dread Commando must not invent new proficiencies');
  const built=reconcileClassGrants(base(definition,5));
  assert.deepEqual(training(built,definition),[],'Dread Commando training drift');
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12);
  assert.equal(unresolved.length,0,`Dread Commando has undescribed grants: ${JSON.stringify(unresolved)}`);
  assert.equal(definition.conditionalMechanics?.suddenStrike?.extraDamageAt5,'3d6');
  assert.equal(definition.conditionalMechanics?.suddenStrike?.maximumRangeFeet,30);
  assert.equal(definition.conditionalMechanics?.teamInitiativeBonus?.bonusFormula,'Dread Commando class level');
  assert.equal(definition.conditionalMechanics?.teamInitiativeBonus?.radiusFeet,30);
  assert.equal(definition.conditionalMechanics?.armoredEase?.reductionAt2,2);
  assert.equal(definition.conditionalMechanics?.armoredEase?.reductionAt4,4);
  assert.equal(definition.conditionalMechanics?.stealthyMovement?.normalSpeedPenalty,0);
  assert.equal(definition.conditionalMechanics?.stealthyMovement?.runOrChargePenalty,-10);
  assert.deepEqual(reconcileClassGrants(built),built,'Dread Commando reconciliation must be idempotent');
  const removed=removeClassProgression({...built,classLevels:[row(definition,5),survivor],level:6},definition.catalogId);
  for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,definition,key).length,`Dread Commando ${key} survive removal`);
}

{
  const definition=exact('classes/ghost-faced-killer-186');
  assert(definition,'missing exact Ghost-Faced Killer record');
  assert.equal(definition.name,'Ghost-Faced Killer');
  assert.equal(definition.reviewBatch,REVIEW_BATCH,'Ghost-Faced Killer must publish through ordinary slice 8');
  assert.equal(definition.referenceOnly,false);
  assert.equal(definition.sourceVersion,'D&D 3.5');
  assert.equal(definition.sourceBook,'Prestige Class Complete Adventurer');
  for(const text of ['Any evil','+5','Hide 6 ranks','Concentration 4 ranks','Intimidate 8 ranks','Move Silently 6 ranks','Improved Initiative','Power Attack'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Ghost-Faced Killer missing prerequisite ${text}`);
  for(const skill of ['Bluff','Climb','Concentration','Hide','Intimidate','Jump','Listen','Move Silently','Open Lock','Search','Spot','Swim','Tumble'])assert((definition.classSkills||[]).includes(skill),`Ghost-Faced Killer missing class skill ${skill}`);
  const built=reconcileClassGrants(base(definition,10));
  assert.deepEqual(training(built,definition),['light-armor','martial-weapons','simple-weapons'],'Ghost-Faced Killer training drift');
  const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12);
  assert.equal(unresolved.length,0,`Ghost-Faced Killer has undescribed grants: ${JSON.stringify(unresolved)}`);
  assert.equal(resource(built,definition,'Ghost Step')?.max,4);
  assert.equal(action(built,definition,'Ghost Step')?.type,'Swift action');
  assert.equal(resource(built,definition,'Frightful Attack')?.max,3);
  assert.equal(definition.conditionalMechanics?.ghostStep?.etherealOptionLevel,6);
  assert.equal(definition.conditionalMechanics?.suddenStrike?.extraDamageAt8,'3d6');
  assert.equal(definition.conditionalMechanics?.frightfulAttack?.victimSaveDcFormula,'10 + Ghost-Faced Killer class level + Charisma modifier');
  assert.equal(definition.conditionalMechanics?.frightfulAttack?.requiresPowerAttackPenaltyMinimum,-1);
  assert.equal(definition.conditionalMechanics?.frightfulAttack?.onlookerRadiusFeet,30);
  assert.equal(definition.conditionalMechanics?.ghostSight?.level,7);
  assert.equal(definition.conditionalMechanics?.frightfulCleave?.level,10);
  assert.deepEqual(reconcileClassGrants(built),built,'Ghost-Faced Killer reconciliation must be idempotent');
  const removed=removeClassProgression({...built,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
  for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,definition,key).length,`Ghost-Faced Killer ${key} survive removal`);
}

console.log('PASS candidate 75 ordinary slice 8: Dread Commando and Ghost-Faced Killer exact-source lifecycles.');
