import assert from 'node:assert/strict';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';
import {removeClassProgression,reconcileClassGrants} from '../src/lib/classIntegration.js';

const foundation={catalogId:'test:foundation',name:'Foundation',edition:'3.5',featType:'Metamagic',prerequisites:[]};
const advanced={catalogId:'test:advanced',name:'Advanced',edition:'3.5',featType:'Metamagic',prerequisites:[{kind:'feat',text:'Foundation'}]};
const context={feats:[foundation,advanced]};
const definition={catalogId:'test:sequential-feats',name:'Sequential Feats',edition:'3.5',levelGrants:[
  {level:1,name:'Bonus Feat',choiceKind:'feat',choiceCount:1,choiceLevels:[1,3],choiceFeatType:'Metamagic',description:'Choose a qualified metamagic feat at each milestone.'}
]};
const character={ruleset:'3.5',mechanics:'3.5',level:3,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:3,definition}],abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},feats:[{id:'manual',name:'Manual feat'}],actions:[],resources:[],featureChoices:{}};
const initial=featureChoicePlan(character,null,{},context);
const [first,last]=initial.groups;
assert.deepEqual(first.options,['Foundation']);
assert(!last.options.includes('Advanced'),'unselected earlier milestones must not satisfy later prerequisites');
const picks={[first.id]:['Foundation'],[last.id]:['Advanced']};
const plan=featureChoicePlan(character,null,picks,context);
assert(plan.groups[1].options.includes('Advanced'),'a valid earlier milestone must unlock a later typed feat in the same transaction');
assert.equal(plan.valid,true);
assert(!plan.groups[1].options.includes('Foundation'),'already chosen feats must not be offered again');
assert.equal(featureChoicePlan(character,null,{[first.id]:['Advanced'],[last.id]:['Foundation']},context).valid,false,'an illegal first pick cannot create grants for later choices');
const chosen=applyFeatureChoices(character,null,picks,context);
assert.deepEqual(chosen.feats.filter(f=>f.sourceType==='class-choice').map(f=>f.name),['Foundation','Advanced']);
assert.equal(character.feats.length,1,'planning and application preserve the input character');
const saved=JSON.parse(JSON.stringify(chosen));
assert.equal(featureChoicePlan(saved,null,{},context).groups.length,0);
const restored=reconcileClassGrants(saved);
assert.deepEqual(JSON.parse(JSON.stringify(restored)),saved,'reconciliation must preserve persisted state');
assert.deepEqual(reconcileClassGrants(restored),restored,'reconciliation must be idempotent');
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...saved,level:4,classLevels:[...saved.classLevels,survivor]},definition.catalogId);
assert.deepEqual(removed.feats.map(f=>f.name),['Manual feat']);
assert(!Object.values(removed.featureChoices).some(choice=>choice.sourceClassId===definition.catalogId));
console.log('PASS typed source feat prerequisites: same-transaction unlocks, illegal picks, persistence, idempotence and source removal.');

const focus={catalogId:'test:focus',name:'Weapon Focus',edition:'3.5',prerequisites:[]};
const critical={catalogId:'test:critical',name:'Improved Critical',edition:'3.5',prerequisites:[
  {kind:'all',requirements:[{kind:'feat',name:'Weapon Focus',featId:focus.catalogId,subject:'$subject'},{kind:'proficiency',proficiencyKind:'weapons',name:'$subject'}]}
]};
const subjectDefinition={catalogId:'test:subject-chain',name:'Subject Chain',edition:'3.5',levelGrants:[
  {level:1,name:'Focus',choiceKind:'feat',choiceCount:1,choiceFeatTemplates:[{featId:focus.catalogId,subjects:['Rapier','Longsword']}],choiceValidatePrerequisites:true},
  {level:2,name:'Critical',choiceKind:'feat',choiceCount:1,choiceFeatTemplates:[{featId:critical.catalogId,subjects:['Rapier','Longsword']}],choiceValidatePrerequisites:true}
]};
const subjectContext={feats:[focus,critical]};
const subjectCharacter={...character,level:2,classLevels:[{catalogId:subjectDefinition.catalogId,name:subjectDefinition.name,edition:'3.5',level:2,definition:subjectDefinition}],trainingGrants:[{proficiencies:[{kind:'weapons',name:'Rapier',index:'rapier'}]}]};
const subjectGroups=featureChoicePlan(subjectCharacter,null,{},subjectContext).groups;
const subjectPicks={[subjectGroups[0].id]:['Weapon Focus (Rapier)'],[subjectGroups[1].id]:['Improved Critical (Rapier)']};
const subjectPlan=featureChoicePlan(subjectCharacter,null,subjectPicks,subjectContext);
assert.deepEqual(subjectPlan.groups[1].options,['Improved Critical (Rapier)'],'template eligibility must share its subject across feat and training predicates');
assert.equal(subjectPlan.valid,true);
const categoryTrained={...subjectCharacter,trainingGrants:[{proficiencies:[{kind:'weapons',name:'Martial weapons',index:'martial-weapons'}]}]};
const categoryContext={...subjectContext,equipment:[{name:'Rapier',edition:'3.5-reference',kind:'weapon',itemCategory:'martial'},{name:'Longsword',edition:'3.5-reference',kind:'weapon',itemCategory:'martial'}]};
assert.deepEqual(featureChoicePlan(categoryTrained,null,subjectPicks,categoryContext).groups[1].options,['Improved Critical (Rapier)'],'choice context must provide canonical equipment to category prerequisites');
assert.equal(featureChoicePlan(subjectCharacter,null,{...subjectPicks,[subjectGroups[1].id]:['Improved Critical (Longsword)']},subjectContext).valid,false);
const subjectChosen=applyFeatureChoices(subjectCharacter,null,subjectPicks,subjectContext);
const criticalGrant=subjectChosen.feats.find(feat=>feat.featTemplateId===critical.catalogId);
assert.equal(criticalGrant.featSubject,'Rapier');
assert.equal(criticalGrant.sourceClassId,subjectDefinition.catalogId);
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(subjectChosen)),null,{},subjectContext).groups.length,0);
const subjectRemoved=removeClassProgression({...subjectChosen,level:3,classLevels:[...subjectChosen.classLevels,survivor]},subjectDefinition.catalogId);
assert.deepEqual(subjectRemoved.feats.map(feat=>feat.name),['Manual feat']);
assert(subjectRemoved.trainingGrants.some(grant=>grant.proficiencies.some(p=>p.name==='Rapier')),'source removal preserves unrelated training');
console.log('PASS subject-scoped source choices: exact feat identity, subject and proficiency intersection, persistence and cleanup.');

const fixedDefinition={...definition,catalogId:'test:fixed-chain',levelGrants:[
  {level:1,name:'Foundation',kind:'feat',featId:foundation.catalogId},
  {level:2,name:'Bonus Feat',choiceKind:'feat',choiceCount:1,choiceFeatType:'Metamagic'}
]};
const fixedCharacter={...character,level:2,classLevels:[{catalogId:fixedDefinition.catalogId,name:fixedDefinition.name,edition:'3.5',level:2,definition:fixedDefinition}],feats:[]};
assert.deepEqual(featureChoicePlan(fixedCharacter,null,{},context).groups[0].options,['Advanced'],'fixed feats restored by reconciliation must unlock choices');
const staleCharacter={...fixedCharacter,classLevels:[{...fixedCharacter.classLevels[0],definition:{...fixedDefinition,levelGrants:[fixedDefinition.levelGrants[1]]}}],feats:[{...foundation,sourceType:'class',automatic:true,sourceClassId:fixedDefinition.catalogId,id:'retired-foundation'}]};
assert.deepEqual(featureChoicePlan(staleCharacter,null,{},context).groups[0].options,['Foundation'],'retired automatic grants must not unlock choices');
