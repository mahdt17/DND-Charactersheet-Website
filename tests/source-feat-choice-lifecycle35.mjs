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

const ownedChoiceDefinition={catalogId:'test:owned-source-choice',name:'Owned Source Choice',edition:'3.5',levelGrants:[
  {level:1,name:'Hated Enemy',description:'Choose one creature already selected as a favored enemy; this choice is irreversible.',choiceKind:'source',choiceCount:1,choiceLevels:[1],choiceOptionsFromCharacter:{choiceKind:'favored-enemy'}}
]};
const rangerChoice={className:'Ranger',classId:'test:ranger',sourceClassId:'test:ranger',edition:'3.5',level:1,feature:'Favored Enemy',choices:['Giants'],choiceKind:'favored-enemy'};
const boostChoice={className:'Ranger',classId:'test:ranger',sourceClassId:'test:ranger',edition:'3.5',level:5,feature:'Favored Enemy Bonus Increase',choices:['Giants'],choiceKind:'favored-enemy-boost'};
const ownedChoiceBase={...base,classLevels:[{catalogId:ownedChoiceDefinition.catalogId,name:ownedChoiceDefinition.name,edition:'3.5',level:1,definition:ownedChoiceDefinition}],featureChoices:{'old:ranger:1:favored-enemy:0':rangerChoice,'old:ranger:5:favored-enemy:0:boost':boostChoice}};
const ownedPlan=featureChoicePlan(ownedChoiceBase,null,{},context);
assert.equal(ownedPlan.groups.length,1);
assert.deepEqual(ownedPlan.groups[0].options,['Giants'],'character-sourced choices must expose only matching prior selections, not related boost records');
assert.equal(featureChoicePlan(ownedChoiceBase,null,{[ownedPlan.groups[0].id]:['Orcs']},context).groups[0].valid,false,'an arbitrary option not already owned must be rejected');
const ownedSelected=applyFeatureChoices(ownedChoiceBase,null,{[ownedPlan.groups[0].id]:['Giants']},context);
assert.equal(Object.values(ownedSelected.featureChoices).filter(choice=>choice?.sourceClassId===ownedChoiceDefinition.catalogId&&choice?.feature==='Hated Enemy').length,1);
assert.equal(featureChoicePlan(ownedSelected,null,{},context).groups.length,0,'character-sourced choices must survive reopening');
const removedOwned=removeClassProgression({...ownedSelected,classLevels:[...ownedSelected.classLevels,survivor],level:2},ownedChoiceDefinition.catalogId);
assert(Object.values(removedOwned.featureChoices).some(choice=>choice?.sourceClassId==='test:ranger'&&choice?.choiceKind==='favored-enemy'),'removing the dependent class must preserve the source favored-enemy choice');
assert(!Object.values(removedOwned.featureChoices).some(choice=>choice?.sourceClassId===ownedChoiceDefinition.catalogId),'removing the dependent class must remove only its dependent choice');
console.log('PASS character-sourced choice lifecycle: filtered options, validation, persistence, and source preservation.');

const templateFeat={catalogId:'test:critical-source-a',name:'Improved Critical',edition:'3.5',sourceBook:'Source A',description:'Apply the feat to the chosen weapon.',prerequisites:[]};
const wrongVariant={...templateFeat,catalogId:'test:critical-source-b',sourceBook:'Source B'};
const templateContext={feats:[wrongVariant,templateFeat,...context.feats]};
const templateDefinition={catalogId:'test:template-choice',name:'Template Choice',edition:'3.5',levelGrants:[{
  level:1,name:'Weapon feat',description:'Choose a weapon for the source-defined bonus feat.',
  choiceKind:'feat',choiceLevels:[1,3],choiceCount:1,uniqueChoices:true,choiceValidatePrerequisites:true,
  choiceFeatTemplates:[{featId:'test:critical-source-a',subjects:['Longsword','Rapier']}]
}]};
const templateBase={...base,classLevels:[{catalogId:templateDefinition.catalogId,name:templateDefinition.name,edition:'3.5',level:1,definition:templateDefinition}]};
const templateGroup=featureChoicePlan(templateBase,null,{},templateContext).groups[0];
assert.deepEqual(templateGroup.options,['Improved Critical (Longsword)','Improved Critical (Rapier)'],'feat templates must expand into legal subject choices');
assert.equal(featureChoicePlan(templateBase,null,{[templateGroup.id]:['Improved Critical']},templateContext).valid,false,'an unparameterized feat cannot satisfy a subject choice');
assert.equal(featureChoicePlan(templateBase,null,{[templateGroup.id]:['Improved Critical (Axe)']},templateContext).valid,false,'unreviewed subjects must be rejected');
assert.equal(featureChoicePlan(templateBase,null,{[templateGroup.id]:['Improved Critical (Longsword)']},{feats:[wrongVariant]}).valid,false,'a missing exact template must not resolve by name');
const templateChosen=applyFeatureChoices(templateBase,null,{[templateGroup.id]:['Improved Critical (Longsword)']},templateContext);
const subjectFeat=templateChosen.feats.find(feat=>feat.sourceClassId===templateDefinition.catalogId);
assert.equal(subjectFeat.catalogId,'test:critical-source-a');
assert.equal(subjectFeat.featTemplateId,'test:critical-source-a');
assert.equal(subjectFeat.featSubject,'Longsword');
assert.equal(subjectFeat.name,'Improved Critical (Longsword)');
assert.equal(subjectFeat.sourceBook,'Source A','same-name variants must not replace the explicit source');
assert.deepEqual(reconcileClassGrants(templateChosen),templateChosen);
const savedTemplate=JSON.parse(JSON.stringify(templateChosen));
assert.equal(featureChoicePlan(savedTemplate,null,{},templateContext).groups.length,0,'saved subject choices must not be asked again');
const missingTemplateFeat={...savedTemplate,feats:savedTemplate.feats.filter(feat=>feat.sourceClassId!==templateDefinition.catalogId)};
const recoveredTemplate=featureChoicePlan(missingTemplateFeat,null,{},{}).patch;
assert.equal(recoveredTemplate.feats.find(feat=>feat.sourceClassId===templateDefinition.catalogId)?.featSubject,'Longsword','saved exact template snapshots repair missing feat rows without a loaded catalog');
const templateThird={...templateChosen,level:3,classLevels:[{...templateChosen.classLevels[0],level:3}]};
const laterTemplateGroup=featureChoicePlan(templateThird,templateChosen,{},templateContext).groups[0];
assert.deepEqual(laterTemplateGroup.options,['Improved Critical (Rapier)'],'a repeated template milestone may select a different subject');
const templateAdvanced=applyFeatureChoices(templateThird,templateChosen,{[laterTemplateGroup.id]:['Improved Critical (Rapier)']},templateContext);
assert.equal(templateAdvanced.feats.filter(feat=>feat.featTemplateId==='test:critical-source-a').length,2);
assert.equal(featureChoicePlan(templateAdvanced,null,{},templateContext).groups.length,0);
const templateRemoved=removeClassProgression({...templateAdvanced,classLevels:[...templateAdvanced.classLevels,survivor],level:4},templateDefinition.catalogId);
assert(!templateRemoved.feats.some(feat=>feat.sourceClassId===templateDefinition.catalogId));
assert(templateRemoved.feats.some(feat=>feat.id==='manual'));
console.log('PASS parameterized source feat choices: exact source, legal subjects, repeated milestones, save/reopen repair, and cleanup.');
