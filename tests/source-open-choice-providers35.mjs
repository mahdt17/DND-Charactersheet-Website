import assert from 'node:assert/strict';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';
import {removeClassProgression} from '../src/lib/classIntegration.js';

const improvedCritical={catalogId:'test:improved-critical',name:'Improved Critical',edition:'3.5',description:'Choose one weapon.',prerequisites:[]};
const skillFocus={catalogId:'test:skill-focus',name:'Skill Focus',edition:'3.5',description:'Choose one skill.',prerequisites:[]};
const equipment=[
  {id:'equipment/battleaxe',name:'Battleaxe',edition:'3.5-reference',kind:'weapon',itemType:'weapon',itemCategory:'martial'},
  {id:'equipment/rapier',name:'Rapier',edition:'3.5-reference',kind:'weapon',itemType:'weapon',itemCategory:'martial'},
  {id:'equipment/chain-shirt',name:'Chain Shirt',edition:'3.5-reference',kind:'armor',itemType:'armor',itemCategory:'light'}
];
const context={feats:[improvedCritical,skillFocus],equipment};
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};

function baseFor(definition){
  return {
    ruleset:'3.5',mechanics:'3.5',level:1,
    classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:1,definition}],
    abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},feats:[],actions:[],resources:[],featureChoices:{},trainingGrants:[]
  };
}

const weaponFeatDefinition={catalogId:'test:any-weapon-feat',name:'Any Weapon Feat',edition:'3.5',classSkills:['Bluff','Hide'],levelGrants:[{
  level:1,name:'Weapon Critical',description:'Choose any weapon for Improved Critical.',choiceKind:'feat',choiceCount:1,choiceLevels:[1],choiceValidatePrerequisites:true,
  choiceFeatTemplates:[{featId:improvedCritical.catalogId,subjectProvider:{kind:'weapons'}}]
}]};
const weaponBase=baseFor(weaponFeatDefinition);
const weaponGroup=featureChoicePlan(weaponBase,null,{},context).groups[0];
assert.deepEqual(weaponGroup.options,['Improved Critical (Battleaxe)','Improved Critical (Rapier)'],'any-weapon feat subjects must come from weapon catalog entries only');
assert.equal(featureChoicePlan(weaponBase,null,{[weaponGroup.id]:['Improved Critical (Chain Shirt)']},context).valid,false,'non-weapons must not satisfy an any-weapon source rule');
const weaponChosen=applyFeatureChoices(weaponBase,null,{[weaponGroup.id]:['Improved Critical (Rapier)']},context);
const weaponFeat=weaponChosen.feats.find(feat=>feat.sourceClassId===weaponFeatDefinition.catalogId);
assert.equal(weaponFeat?.featSubject,'Rapier');
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(weaponChosen)),null,{},context).groups.length,0,'dynamic weapon subject choices must survive save/reopen');
const weaponRemoved=removeClassProgression({...weaponChosen,classLevels:[...weaponChosen.classLevels,survivor],level:2},weaponFeatDefinition.catalogId);
assert(!weaponRemoved.feats.some(feat=>feat.sourceClassId===weaponFeatDefinition.catalogId),'class removal must clean dynamic source-owned feat subjects');

const skillFeatDefinition={catalogId:'test:any-class-skill-feat',name:'Any Class Skill Feat',edition:'3.5',classSkills:['Bluff','Hide'],levelGrants:[{
  level:1,name:'Class Skill Focus',description:'Choose any class skill for Skill Focus.',choiceKind:'feat',choiceCount:1,choiceLevels:[1],choiceValidatePrerequisites:true,
  choiceFeatTemplates:[{featId:skillFocus.catalogId,subjectProvider:{kind:'class-skills'}}]
}]};
const skillBase=baseFor(skillFeatDefinition);
const skillGroup=featureChoicePlan(skillBase,null,{},context).groups[0];
assert.deepEqual(skillGroup.options,['Skill Focus (Bluff)','Skill Focus (Hide)'],'any-class-skill feat subjects must derive from this exact class source');
assert.equal(featureChoicePlan(skillBase,null,{[skillGroup.id]:['Skill Focus (Spot)']},context).valid,false,'a non-class skill must not satisfy the source rule');
const skillChosen=applyFeatureChoices(skillBase,null,{[skillGroup.id]:['Skill Focus (Hide)']},context);
assert.equal(skillChosen.feats.find(feat=>feat.sourceClassId===skillFeatDefinition.catalogId)?.featSubject,'Hide');
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(skillChosen)),null,{},context).groups.length,0,'dynamic class-skill subject choices must survive save/reopen');

const proficiencyDefinition={catalogId:'test:any-weapon-proficiency',name:'Any Weapon Proficiency',edition:'3.5',proficiencyChoices:[{
  id:'weapon-choice',level:1,label:'Weapon Proficiency',kind:'weapons',count:1,optionsProvider:{kind:'weapons'},sourceText:'Choose proficiency with any one weapon.'
}]};
const proficiencyBase=baseFor(proficiencyDefinition);
const proficiencyGroup=featureChoicePlan(proficiencyBase,null,{},context).groups.find(group=>group.choiceKind==='proficiency');
assert(proficiencyGroup,'a source-defined proficiency choice must be prompted');
assert.deepEqual(proficiencyGroup.options,['Battleaxe','Rapier'],'any-weapon proficiency choices must come from the weapon catalog');
assert.equal(featureChoicePlan(proficiencyBase,null,{[proficiencyGroup.id]:['Chain Shirt']},context).valid,false,'non-weapons must be rejected by a provider-backed proficiency choice');
const proficiencyChosen=applyFeatureChoices(proficiencyBase,null,{[proficiencyGroup.id]:['Battleaxe']},context);
const grant=proficiencyChosen.trainingGrants.find(item=>item.sourceClassId===proficiencyDefinition.catalogId);
assert.equal(grant?.proficiencies?.[0]?.name,'Battleaxe');
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(proficiencyChosen)),null,{},context).groups.length,0,'provider-backed proficiency choices must survive save/reopen');
const proficiencyRemoved=removeClassProgression({...proficiencyChosen,classLevels:[...proficiencyChosen.classLevels,survivor],level:2},proficiencyDefinition.catalogId);
assert(!proficiencyRemoved.trainingGrants.some(item=>item.sourceClassId===proficiencyDefinition.catalogId),'class removal must clean only source-owned proficiency grants');

console.log('PASS open 3.5 source choice providers: weapons, class skills, persistence, and cleanup.');
