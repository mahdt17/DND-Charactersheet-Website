import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';

const REVIEW_BATCH='2026-10-07-candidates75-ordinary6';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const definition=exact('classes/foe-hunter-612');
assert(definition,'missing exact Foe Hunter record');
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:'3.5',level,definition:record});
const character=(level=1)=>({id:'candidate75-ordinary6',name:'Candidate 75 Ordinary 6',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:18,dex:16,con:16,int:14,wis:16,cha:12},hp:{current:120,max:120,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const source=(items,classId)=>(items||[]).filter(item=>item.sourceClassId===classId);
const action=(value,name)=>source(value.actions,definition.catalogId).find(item=>item.name===name);

assert.equal(definition.name,'Foe Hunter');
assert.equal(definition.reviewBatch,REVIEW_BATCH,'Foe Hunter must publish through ordinary slice 6');
assert.equal(definition.referenceOnly,false);
assert.equal(definition.sourceVersion,'D&D 3.0');
assert.equal(definition.sourceBook,'Prestige Class Masters of the Wild: A Guidebook to Barbarians, Druids, and Rangers');
assert.equal(definition.prerequisiteReview?.verified,true);
assert.equal(definition.classSkillReview?.verified,true);
assert.equal(definition.proficiencyReview?.verified,true);
assert.deepEqual(definition.proficiencies,[],'Foe Hunter gains no weapon or armor proficiencies');
for(const text of ['+7','Track','Weapon Focus','language (if any) of the intended hated enemy','must have a favored enemy'])assert((definition.prerequisites||[]).some(item=>String(item.text||'').toLowerCase().includes(text.toLowerCase())),`Foe Hunter missing prerequisite ${text}`);
for(const skill of ['Climb','Intimidate','Jump','Listen','Ride','Spot','Swim','Wilderness Lore'])assert((definition.classSkills||[]).includes(skill),`Foe Hunter missing class skill ${skill}`);

const favoredEnemyChoice={className:'Ranger',classId:'test:ranger',sourceClassId:'test:ranger',edition:'3.5',level:1,feature:'Favored Enemy',choices:['Giants'],choiceKind:'favored-enemy'};
const boostChoice={className:'Ranger',classId:'test:ranger',sourceClassId:'test:ranger',edition:'3.5',level:5,feature:'Favored Enemy Bonus Increase',choices:['Giants'],choiceKind:'favored-enemy-boost'};
const choiceBase={...character(1),featureChoices:{'ranger:enemy':favoredEnemyChoice,'ranger:boost':boostChoice}};
const choicePlan=featureChoicePlan(choiceBase,null,{}, {feats});
const hatedEnemyGroup=choicePlan.groups.find(group=>group.label==='Hated Enemy');
assert(hatedEnemyGroup,'Foe Hunter must prompt for its hated enemy');
assert.deepEqual(hatedEnemyGroup.options,['Giants'],'Foe Hunter may only choose an already-owned favored enemy');
assert.equal(featureChoicePlan(choiceBase,null,{[hatedEnemyGroup.id]:['Orcs']},{feats}).groups.find(group=>group.id===hatedEnemyGroup.id)?.valid,false,'Foe Hunter must reject an arbitrary enemy');
const selected=applyFeatureChoices(choiceBase,null,{[hatedEnemyGroup.id]:['Giants']},{feats});
assert.equal(Object.values(selected.featureChoices).filter(choice=>choice?.sourceClassId===definition.catalogId&&choice?.feature==='Hated Enemy')[0]?.choices?.[0],'Giants');
assert.equal(featureChoicePlan(selected,null,{}, {feats}).groups.length,0,'Foe Hunter hated-enemy choice must survive reopen');

const built10=reconcileClassGrants({...selected,level:10,classLevels:[row(definition,10)]});
const unresolved=(definition.levelGrants||[]).filter(grant=>!grant.name||String(grant.description||'').trim().length<12).map(grant=>({level:grant.level,name:grant.name,progressionText:grant.progressionText,description:grant.description}));
assert.equal(unresolved.length,0,`Foe Hunter has undescribed grants: ${JSON.stringify(unresolved)}`);
assert.equal(definition.conditionalMechanics?.rancor?.extraDamageDiceAt10,'5d6');
assert.equal(definition.conditionalMechanics?.rancor?.frequency,'once per round');
assert.deepEqual(definition.conditionalMechanics?.hatedEnemyDamageReduction?.progression,{2:3,4:5,6:7,8:9,10:11});
assert.equal(definition.conditionalMechanics?.hatedEnemySpellResistance?.formula,'15 + Foe Hunter class level');
assert.equal(definition.conditionalMechanics?.deathAttack?.level,10);
assert.equal(action(built10,'Rancor')?.type,'Special action');
assert.equal(action(built10,'Death Attack')?.type,'Special action');
assert.deepEqual(reconcileClassGrants(built10),built10,'Foe Hunter reconciliation must be idempotent');

const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...built10,classLevels:[row(definition,10),survivor],level:11},definition.catalogId);
assert(!source(removed.grantedFeatures,definition.catalogId).length,'Foe Hunter features survive removal');
assert(!source(removed.actions,definition.catalogId).length,'Foe Hunter actions survive removal');
assert(!Object.values(removed.featureChoices||{}).some(choice=>choice?.sourceClassId===definition.catalogId),'Foe Hunter dependent choice survives removal');
assert(Object.values(removed.featureChoices||{}).some(choice=>choice?.sourceClassId==='test:ranger'&&choice?.choiceKind==='favored-enemy'),'removal must preserve the source favored-enemy choice');

console.log('PASS candidate 75 ordinary slice 6: Foe Hunter exact-source lifecycle.');
