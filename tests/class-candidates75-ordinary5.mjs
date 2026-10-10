import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,castingAdvancementPlan,applyCastingAdvancementSelections,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary5';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const definition=exact('classes/arboreal-guardian-522');
const cleric=exact('classes/cleric-91');
assert(definition&&cleric,'missing exact Arboreal Guardian or Cleric record');
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const character=classLevels=>({id:'candidate75-ordinary5',name:'Candidate 75 Ordinary 5',ruleset:'3.5',mechanics:'3.5',level:classLevels.reduce((sum,item)=>sum+item.level,0),className:classLevels[0].name,classDefinition:classLevels[0].definition,classLevels,abilities:{str:14,dex:16,con:14,int:14,wis:18,cha:14},hp:{current:100,max:100,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{},castingAdvancements:[]});
const source=(items,classId)=>(items||[]).filter(item=>item.sourceClassId===classId);
const training=(value,classId)=>source(value.trainingGrants,classId).flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(value,name)=>source(value.resources,definition.catalogId).find(item=>item.name===name);
const action=(value,name)=>source(value.actions,definition.catalogId).find(item=>item.name===name);

assert.equal(definition.name,'Arboreal Guardian');
assert.equal(definition.reviewBatch,REVIEW_BATCH,'Arboreal Guardian must publish through ordinary slice 5');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.5');
assert.equal(definition.sourceBook,'Prestige Class Ghostwalk');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
for(const text of ['Elf or half-elf','Knowledge (nature) 8 ranks','Spot 5 ranks','Survival 8 ranks','Great Fortitude','Green Bond','Point Blank Shot','Able to cast entangle','Any but Nessek or Orcus'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').includes(text)),`Arboreal Guardian missing prerequisite ${text}`);
for(const skill of ['Climb','Concentration','Craft','Diplomacy','Heal','Handle Animal','Hide','Jump','Knowledge (nature)','Listen','Move Silently','Spot','Survival','Swim'])assert((definition.classSkills||[]).includes(skill),`Arboreal Guardian missing class skill ${skill}`);
const built10=reconcileClassGrants(character([row(definition,10)]));
assert.deepEqual(training(built10,definition.catalogId),['shortbows']);
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
assert.equal(unresolved.length,0,`Arboreal Guardian has undescribed grants: ${JSON.stringify(unresolved)}`);

assert.equal(definition.conditionalMechanics?.forestwalk?.speedBonusFeet,10);
assert.equal(definition.conditionalMechanics?.naturalArmor?.bonusType,'enhancement to existing natural armor');
assert.deepEqual(definition.conditionalMechanics?.naturalArmor?.progression,{2:1,4:2,6:3,8:4,10:5});
assert.equal(definition.conditionalMechanics?.woodSpeech?.rangeMiles,1);
assert.equal(definition.conditionalMechanics?.natureDefender?.radiusFeet,500);
assert.equal(definition.conditionalMechanics?.natureDefender?.moraleBonus,1);
assert.equal(resource(built10,"Hunter's Mercy")?.max,1);
assert.equal(action(built10,"Hunter's Mercy")?.type,'Standard action');
assert.equal(resource(built10,'Blindsight')?.max,1);
assert.equal(action(built10,'Blindsight')?.type,'Free action');
assert.equal(resource(built10,'Quench')?.max,1);
assert.equal(resource(built10,'Tree Stride')?.max,1);
assert.deepEqual(reconcileClassGrants(built10),built10,'Arboreal Guardian reconciliation must be idempotent');

const baseline=character([row(cleric,5)]);
let advanced=baseline;
for(let level=1;level<=10;level++){
  const plan=castingAdvancementPlan(advanced,definition,level);
  if(level%2===0){
    assert.equal(plan.groups.length,1,`Arboreal Guardian level ${level} must advance divine casting`);
    assert.equal(plan.groups[0].kind,'divine');
    assert.deepEqual(plan.groups[0].candidates.map(item=>item.classId),[cleric.catalogId]);
    advanced=applyCastingAdvancementSelections(advanced,plan,{[plan.groups[0].id]:cleric.catalogId});
  }else assert.equal(plan.groups.length,0,`Arboreal Guardian level ${level} must not advance casting`);
  advanced=reconcileClassGrants({...advanced,classLevels:[row(cleric,5),row(definition,level)],level:5+level});
}
assert.equal(advanced.classSpellSlots.find(item=>item.sourceClassId===cleric.catalogId)?.effectiveClassLevel,10,'Arboreal Guardian must add five divine casting levels by class level 10');
const removed=removeClassProgression(advanced,definition.catalogId);
assert.equal(removed.castingAdvancements.length,0,'Arboreal Guardian casting choices survive removal');
assert.deepEqual(removed.classSpellSlots,reconcileClassGrants(baseline).classSpellSlots,'removal must restore original Cleric spell-slot profile');
assert(!source(removed.grantedFeatures,definition.catalogId).length,'Arboreal Guardian features survive removal');
assert(!source(removed.actions,definition.catalogId).length,'Arboreal Guardian actions survive removal');
assert(!source(removed.resources,definition.catalogId).length,'Arboreal Guardian resources survive removal');
assert(!source(removed.trainingGrants,definition.catalogId).length,'Arboreal Guardian training survives removal');

console.log('PASS candidate 75 ordinary slice 5: Arboreal Guardian exact-source lifecycle.');
