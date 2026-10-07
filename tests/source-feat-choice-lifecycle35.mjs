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

const repeatedDefinition={...definition,catalogId:'test:repeated-feat-choice',name:'Repeated Feat Choice',levelGrants:[{...definition.levelGrants[0],choiceCount:1,choiceLevels:[1,3]}]};
const repeatedBase={...base,classLevels:[{catalogId:repeatedDefinition.catalogId,name:repeatedDefinition.name,edition:'3.5',level:1,definition:repeatedDefinition}]};
const firstGroup=featureChoicePlan(repeatedBase,null,{},context).groups[0];
const first=applyFeatureChoices(repeatedBase,null,{[firstGroup.id]:['Alertness']},context);
const third={...first,level:3,classLevels:[{...first.classLevels[0],level:3}]};
const thirdGroup=featureChoicePlan(third,first,{},context).groups[0];
const advanced=applyFeatureChoices(third,first,{[thirdGroup.id]:['Endurance']},context);
assert.equal(featureChoicePlan(advanced,null,{},context).groups.length,0,'reopening after leveling must recognize the saved milestone choice');
assert.equal(advanced.feats.filter(f=>f.sourceType==='class-choice').length,2);
const savedId=Object.keys(advanced.featureChoices).find(id=>advanced.featureChoices[id].level===3);
const legacyId=savedId.replace(/:\d+$/,':0');
const legacy={...advanced,featureChoices:Object.fromEntries(Object.entries(advanced.featureChoices).map(([id,value])=>[id===savedId?legacyId:id,value])),feats:advanced.feats.map(feat=>feat.sourceChoiceId===savedId?{...feat,sourceChoiceId:legacyId}:feat)};
const legacyReopen=featureChoicePlan(legacy,null,{},context);
assert.equal(legacyReopen.groups.length,0,'previously saved filtered-index IDs remain recognized');
assert.deepEqual(legacyReopen.patch.featureChoices,legacy.featureChoices,'legacy selections are preserved without silent migration');
assert.equal(legacyReopen.patch.feats.filter(f=>f.sourceType==='class-choice').length,2);
console.log('PASS repeated feat milestone persistence across level-up and reopening.');

const languageDefinition={catalogId:'test:source-language-choices',name:'Source Language Choices',edition:'3.5',levelGrants:[
  {level:1,name:'Bonus Language',description:'Choose a new planar language at 1st level and again at 4th level.',choiceKind:'language',choiceCount:1,choiceLevels:[1,4],choiceOptions:['Abyssal','Celestial','Draconic','Infernal'],uniqueChoices:true}
]};
const languageBase={...base,languages:'Common, Draconic',languageGrants:[],classLevels:[{catalogId:languageDefinition.catalogId,name:languageDefinition.name,edition:'3.5',level:1,definition:languageDefinition}]};
const languageGroup=featureChoicePlan(languageBase,null,{},context).groups[0];
assert(!languageGroup.options.includes('Draconic'),'source language choices must exclude languages the character already knows');
const firstLanguage=applyFeatureChoices(languageBase,null,{[languageGroup.id]:['Abyssal']},context);
assert.deepEqual(firstLanguage.languages.split(/,\s*/).sort(),['Abyssal','Common','Draconic']);
assert.deepEqual((firstLanguage.languageGrants||[]).map(grant=>grant.name),['Abyssal']);
assert.equal(firstLanguage.languageGrants[0].sourceClassId,languageDefinition.catalogId);
const languageFourth={...firstLanguage,level:4,classLevels:[{...firstLanguage.classLevels[0],level:4}]};
const fourthLanguageGroup=featureChoicePlan(languageFourth,firstLanguage,{},context).groups[0];
assert(!fourthLanguageGroup.options.includes('Abyssal'),'later language milestones must exclude earlier source-owned choices');
const languageAdvanced=applyFeatureChoices(languageFourth,firstLanguage,{[fourthLanguageGroup.id]:['Celestial']},context);
assert.deepEqual(languageAdvanced.languages.split(/,\s*/).sort(),['Abyssal','Celestial','Common','Draconic']);
assert.equal(languageAdvanced.languageGrants.filter(grant=>grant.sourceClassId===languageDefinition.catalogId).length,2);
assert.equal(featureChoicePlan(languageAdvanced,null,{},context).groups.length,0,'source language choices must survive reopen without duplicate prompts');
const removedLanguages=removeClassProgression({...languageAdvanced,languages:languageAdvanced.languages+', Undercommon',classLevels:[...languageAdvanced.classLevels,survivor],level:5},languageDefinition.catalogId);
assert.equal(removedLanguages.languageGrants.filter(grant=>grant.sourceClassId===languageDefinition.catalogId).length,0);
assert.deepEqual(removedLanguages.languages.split(/,\s*/).sort(),['Common','Draconic','Undercommon'],'class removal must remove only source-owned languages and preserve manual languages');
console.log('PASS source language choice lifecycle: known-language filtering, milestones, persistence, and removal.');
