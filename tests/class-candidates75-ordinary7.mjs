import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';

const REVIEW_BATCH='2026-10-08-candidates75-ordinary7';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const definition=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/watch-detective-623'),reference);
assert(definition,'missing exact Watch Detective record');
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const base=(level=10)=>({id:'candidate75-ordinary7',name:'Candidate 75 Ordinary 7',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:14,dex:16,con:14,int:18,wis:16,cha:14},hp:{current:100,max:100,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(character,key)=>(character[key]||[]).filter(item=>item.sourceClassId===definition.catalogId);
const training=character=>source(character,'trainingGrants').flatMap(item=>item.proficiencies||[]).map(item=>item.index).sort();
const resource=(character,name)=>source(character,'resources').find(item=>item.name===name);
const action=(character,name)=>source(character,'actions').find(item=>item.name===name);

assert.equal(definition.name,'Watch Detective');
assert.equal(definition.reviewBatch,REVIEW_BATCH,'Watch Detective must publish through ordinary slice 7');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.0');
assert.equal(definition.sourceBook,'Prestige Class Masters of the Wild: A Guidebook to Barbarians, Druids, and Rangers');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
for(const text of ['Any nonevil','Gather Information 4 ranks','Knowledge (any) 4 ranks','Search 8 ranks','Track','Rule of Evidence'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Watch Detective missing prerequisite ${text}`);
for(const skill of ['Appraise','Bluff','Climb','Craft','Diplomacy','Disable Device','Disguise','Forgery','Gather Information','Heal','Hide','Innuendo','Intimidate','Intuit Direction','Jump','Knowledge','Listen','Move Silently','Open Lock','Profession','Ride','Search','Sense Motive','Spot','Swim','Use Rope'])assert((definition.classSkills||[]).includes(skill),`Watch Detective missing class skill ${skill}`);

const built=reconcileClassGrants(base());
assert.deepEqual(training(built),['light-armor','simple-weapons'],'Watch Detective training drift');
assert(source(built,'feats').some(feat=>feat.name==='Expertise'),'Watch Detective must grant Expertise at level 2');
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,description:grant.description}));
assert.equal(unresolved.length,0,`Watch Detective has undescribed grants: ${JSON.stringify(unresolved)}`);
assert.equal(definition.conditionalMechanics?.cityWatchTraining?.insightBonus,2);
assert.equal(definition.conditionalMechanics?.obsessiveSpecialty?.bonusFormula,'Watch Detective class level');
assert.equal(definition.conditionalMechanics?.profile?.gatherInformationDc,15);
assert.equal(definition.conditionalMechanics?.profile?.followupInsightBonus,2);
assert.equal(definition.conditionalMechanics?.cooperativeInterrogation?.allyBonus,4);
assert.equal(definition.conditionalMechanics?.superiorDisarming?.attackBonus,4);
assert.equal(definition.conditionalMechanics?.deductiveAugury?.successChanceFormula,'70% + 1% per Watch Detective class level');
assert.equal(definition.conditionalMechanics?.skillSynergy?.bonus,2);
assert.equal(definition.conditionalMechanics?.forensics?.searchDc,20);
assert.equal(definition.conditionalMechanics?.instantKnowledge?.intelligenceCheckDc,20);
assert.equal(definition.conditionalMechanics?.instantKnowledge?.insightBonus,10);
assert.equal(resource(built,'Deductive Augury')?.max,3);
assert.equal(action(built,'Deductive Augury')?.type,'Standard action');
assert.equal(resource(built,'Discern Lies')?.max,1);
assert.equal(resource(built,'Locate Creature')?.max,1);
assert.equal(resource(built,'Instant Knowledge')?.max,1);

const plan=featureChoicePlan(built,null,{}, {feats});
const specialty=plan.groups.find(group=>group.label==='Obsessive Specialty');
const synergy=plan.groups.find(group=>group.label==='Skill Synergy');
assert(specialty&&synergy,'Watch Detective must prompt for both persistent choices');
assert(specialty.options.includes('Knowledge (arcana)')&&specialty.options.includes('Knowledge (local)'),'Obsessive Specialty must offer Knowledge skills');
assert(synergy.options.includes('Listen-Spot')&&synergy.options.includes('Spot-Search'),'Skill Synergy must use the exact source pairs');
const chosen=applyFeatureChoices(built,null,{[specialty.id]:['Knowledge (arcana)'],[synergy.id]:['Listen-Spot']},{feats});
assert.equal(featureChoicePlan(chosen,null,{}, {feats}).groups.length,0,'Watch Detective choices must persist across reopen');
assert.deepEqual(reconcileClassGrants(chosen),chosen,'Watch Detective reconciliation must be idempotent');

const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...chosen,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
for(const key of ['grantedFeatures','actions','resources','trainingGrants'])assert(!source(removed,key).length,`Watch Detective ${key} survive removal`);
assert(!Object.values(removed.featureChoices||{}).some(choice=>choice?.sourceClassId===definition.catalogId),'Watch Detective choices survive removal');
assert(!removed.feats.some(feat=>feat.sourceClassId===definition.catalogId),'Watch Detective feat survives removal');

console.log('PASS candidate 75 ordinary slice 7: Watch Detective exact-source lifecycle.');
