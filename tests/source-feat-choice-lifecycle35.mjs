import assert from 'node:assert/strict';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const definition={catalogId:'test:multiple-feat-choices',name:'Multiple Feat Choices',edition:'3.5',levelGrants:[
 {level:1,name:'Bonus Feats',description:'Choose two distinct feats from this list.',choiceKind:'feat',choiceCount:2,choiceLevels:[1],choiceOptions:['Alertness','Endurance','Toughness'],choiceValidatePrerequisites:true}
]};
const context={feats:['Alertness','Endurance','Toughness'].map(name=>({catalogId:'test:'+name,name,edition:'3.5',prerequisites:[]}))};
const base={ruleset:'3.5',mechanics:'3.5',level:1,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:1,definition}],abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},feats:[{id:'manual',name:'Manual feat'}],actions:[],resources:[],featureChoices:{}};
const group=featureChoicePlan(base,null,{},context).groups.find(g=>g.label==='Bonus Feats');
assert.equal(group.required,2);
const chosen=applyFeatureChoices(base,null,{[group.id]:['Alertness','Endurance']},context);
const selected=c=>c.feats.filter(f=>f.sourceChoiceId===group.id).map(f=>f.name).sort();
assert.deepEqual(selected(chosen),['Alertness','Endurance'],'a multi-feat selection must materialize every selected feat');
assert.equal(new Set(chosen.feats.map(f=>f.id)).size,chosen.feats.length);
assert(chosen.feats.some(f=>f.id==='manual'));
assert.deepEqual(reconcileClassGrants(chosen),chosen);
const partial={...chosen,feats:chosen.feats.filter(f=>f.name!=='Alertness')};
const repaired=featureChoicePlan(partial,null,{},context).patch;
assert.deepEqual(selected(repaired),['Alertness','Endurance'],'reopening repairs an individually missing source-owned feat');
assert.deepEqual(repaired.featureChoices,chosen.featureChoices,'repair preserves persistent selections');
assert(repaired.feats.some(f=>f.id==='manual'));
const reopened=featureChoicePlan({...chosen,...repaired},null,{},context);
assert.deepEqual(reopened.patch.feats,repaired.feats,'reopening does not duplicate or reorder intact choices');
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
const removed=removeClassProgression({...chosen,classLevels:[...chosen.classLevels,survivor],level:2},definition.catalogId);
assert(!removed.feats.some(f=>f.sourceClassId===definition.catalogId));
assert(removed.feats.some(f=>f.id==='manual'));
console.log('PASS source feat choice lifecycle: multiple selections, partial recovery, idempotence, and source removal.');
