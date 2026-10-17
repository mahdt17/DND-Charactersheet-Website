import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary4';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'candidate75-ordinary4',name:'Candidate 75 Ordinary 4',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:14,dex:16,con:14,int:18,wis:12,cha:16},hp:{current:100,max:100,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{},languages:'Common',languageGrants:[]});
const source=(items,classId)=>(items||[]).filter(item=>item.sourceClassId===classId);
const training=(character,classId)=>source(character.trainingGrants,classId).flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,classId,name)=>source(character.resources,classId).find(item=>item.name===name);
const action=(character,classId,name)=>source(character.actions,classId).find(item=>item.name===name);

const definition=exact('classes/gatecrasher-602');
assert(definition,'missing exact Gatecrasher source record');
assert.equal(definition.name,'Gatecrasher');
assert.equal(definition.reviewBatch,REVIEW_BATCH,'Gatecrasher must publish through ordinary slice 4');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.0');
assert.equal(definition.sourceBook,'Prestige Class Manual of the Planes');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
assert.deepEqual(training(reconcileClassGrants(base(definition,10)),definition.catalogId),['light-armor','simple-weapons']);
for(const text of ['Any nonlawful','Knowledge (the planes) 4 ranks','Use Magic Device 8 ranks','visited two planes of existence other than his native plane'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').includes(text)),`Gatecrasher missing prerequisite ${text}`);
for(const skill of ['Appraise','Decipher Script','Disable Device','Open Lock','Speak Language','Use Magic Device'])assert((definition.classSkills||[]).includes(skill),`Gatecrasher missing class skill ${skill}`);
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
assert.equal(unresolved.length,0,`Gatecrasher has undescribed grants: ${JSON.stringify(unresolved)}`);

const bonusLanguage=definition.levelGrants.find(item=>item.name==='Bonus Language');
assert(bonusLanguage,'Gatecrasher needs reviewed Bonus Language');
assert.equal(bonusLanguage.choiceKind,'language');
assert.deepEqual(bonusLanguage.choiceLevels,[1,4,7,10]);
assert.equal(bonusLanguage.choiceCount,1);
assert.equal(bonusLanguage.uniqueChoices,true);
for(const language of ['Abyssal','Aquan','Auran','Celestial','Ignan','Infernal','Terran'])assert(bonusLanguage.choiceOptions.includes(language),`Gatecrasher missing language ${language}`);

const languageContext={feats};
let character=base(definition,1);
let plan=featureChoicePlan(character,null,{},languageContext);
let group=plan.groups.find(item=>item.label==='Bonus Language');
assert(group,'Gatecrasher level 1 must request Bonus Language');
character=applyFeatureChoices(character,null,{[group.id]:['Abyssal']},languageContext);
for(const [level,language] of [[4,'Celestial'],[7,'Infernal'],[10,'Terran']]){
  const previous=character;
  character={...previous,level,classLevels:[{...previous.classLevels[0],level}]};
  plan=featureChoicePlan(character,previous,{},languageContext);
  group=plan.groups.find(item=>item.label==='Bonus Language');
  assert(group,`Gatecrasher level ${level} must request Bonus Language`);
  for(const owned of (previous.languageGrants||[]).map(item=>item.name))assert(!group.options.includes(owned),`Gatecrasher must not offer already-known ${owned}`);
  character=applyFeatureChoices(character,previous,{[group.id]:[language]},languageContext);
}
assert.deepEqual((character.languageGrants||[]).filter(item=>item.sourceClassId===definition.catalogId).map(item=>item.name),['Abyssal','Celestial','Infernal','Terran']);
assert.equal(featureChoicePlan(character,null,{},languageContext).groups.length,0,'Gatecrasher language choices must survive reopen');
assert.deepEqual(character.languages.split(/,\s*/).sort(),['Abyssal','Celestial','Common','Infernal','Terran']);

character=reconcileClassGrants(character);
assert.equal(resource(character,definition.catalogId,'Analyze Portal')?.max,10,'Analyze Portal must scale once per class level per day');
assert.equal(resource(character,definition.catalogId,'Summon Spell Dampening')?.max,3);
assert.equal(resource(character,definition.catalogId,'Scramble Portal')?.max,3);
assert.equal(resource(character,definition.catalogId,'Plane Shift')?.max,1);
assert.equal(resource(character,definition.catalogId,'Planar Dampening')?.max,3);
assert.equal(action(character,definition.catalogId,'Open Portal')?.type,'Full-round action');
assert.equal(definition.conditionalMechanics?.comprehension?.insightBonus,2);
assert.equal(definition.conditionalMechanics?.openPortal?.ability,'int');
assert.equal(definition.conditionalMechanics?.silverTongue?.insightBonus,2);
assert.equal(definition.conditionalMechanics?.damageReduction?.amount,5);
assert.equal(definition.conditionalMechanics?.damageReduction?.bypass,'+1 enhancement or better');
assert.equal(definition.conditionalMechanics?.planarSurvival?.naturalPlanarEffectsImmune,true);
assert.deepEqual(reconcileClassGrants(character),character,'Gatecrasher reconciliation must be idempotent');

const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
const removed=removeClassProgression({...character,languages:character.languages+', Undercommon',classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
assert(!source(removed.grantedFeatures,definition.catalogId).length,'Gatecrasher features survive removal');
assert(!source(removed.actions,definition.catalogId).length,'Gatecrasher actions survive removal');
assert(!source(removed.resources,definition.catalogId).length,'Gatecrasher resources survive removal');
assert(!source(removed.trainingGrants,definition.catalogId).length,'Gatecrasher training survives removal');
assert(!source(removed.languageGrants,definition.catalogId).length,'Gatecrasher languages survive removal');
assert.deepEqual(removed.languages.split(/,\s*/).sort(),['Common','Undercommon'],'Gatecrasher removal must preserve manual languages');

console.log('PASS candidate 75 ordinary slice 4: Gatecrasher exact-source lifecycle.');
