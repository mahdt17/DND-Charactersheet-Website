import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import classes from '../src/data/classes.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression,classAutomationReport,annotateClassGrantKinds,castingAdvancementPlan,castingAdvancementSelectionsValid,applyCastingAdvancementSelections,legacyClassSkillStatus} from '../src/lib/classIntegration.js';

const baseCharacter=(classLevels,ruleset='3.5')=>({
  id:'test-character',name:'Automation Test',ruleset,mechanics:ruleset,level:classLevels.reduce((n,row)=>n+row.level,0),
  className:classLevels[0].name,classDefinition:classLevels[0].definition,classLevels,
  abilities:{str:14,dex:14,con:14,int:16,wis:14,cha:12},hp:{current:30,max:30,temp:4},
  actions:[{id:'manual-action',name:'Table ruling',type:'Action',description:'Keep me.'}],
  feats:[{id:'manual-feat',name:'Manual Feat',description:'Keep me.'}],
  resources:[],spells:[],trainingGrants:[],featureChoices:{}
});

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes35,feats35]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference35=[...classes35,...feats35];
const integrated35=name=>annotateClassGrantKinds(classes35.find(record=>record.name===name),reference35);
const archivist=integrated35('Archivist');
assert(archivist,'Archivist must exist in the canonical 3.5 catalog');
assert(archivist.progression?.length||archivist.tables?.length,'Archivist must expose structured progression data');

const archivist1=baseCharacter([{catalogId:archivist.catalogId,name:'Archivist',edition:'3.5',level:1,definition:archivist}]);
const a1=reconcileClassGrants(archivist1);
assert(a1.grantedFeatures.some(feature=>feature.name==='Dark Knowledge'&&feature.sourceClassLevel===1));
assert(a1.actions.some(action=>action.name==='Dark Knowledge'&&action.sourceClassId===archivist.catalogId));
assert(a1.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===archivist.catalogId));
assert.equal(a1.resources.find(resource=>resource.name==='Dark Knowledge')?.max,3);
assert(a1.actions.some(action=>action.id==='manual-action'));
assert(a1.feats.some(feat=>feat.id==='manual-feat'));

const a4=reconcileClassGrants(baseCharacter([{catalogId:archivist.catalogId,name:'Archivist',edition:'3.5',level:4,definition:archivist}]));
for(const name of ['Dark Knowledge','Scribe Scroll','Lore Mastery','Still Mind'])assert(a4.grantedFeatures.some(feature=>feature.name===name),name);
assert.equal(a4.resources.find(resource=>resource.name==='Dark Knowledge')?.max,4);
assert(a4.grantedFeatures.every(feature=>feature.description&&['rule-text','progression'].includes(feature.descriptionSource)),'Every granted class feature needs a usable sourced description');
assert(!a4.grantedFeatures.some(feature=>feature.description.includes('See the class source for complete rules.')),'Progression text replaces vague description placeholders');
const trainedSheet=reconcileClassGrants(archivist1);
const archivistTraining=trainedSheet.trainingGrants.find(grant=>grant.sourceClassId===archivist.catalogId);
assert(archivistTraining?.automatic,'verified 3.5 proficiency supplements become automatic class training');
assert.deepEqual(archivistTraining.proficiencies.map(item=>item.index),['light-armor','medium-armor','simple-weapons']);
const trainedAgain=reconcileClassGrants(trainedSheet);
assert.equal(trainedAgain.trainingGrants.filter(grant=>grant.sourceClassId===archivist.catalogId).length,1,'supplement-backed class training reconciliation is idempotent');
for(const [name,expected] of [
  ['Psychic Warrior',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Shugenja',['simple-weapons','shortsword']],
  ['Soulborn',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Spellthief',['light-armor','simple-weapons']],
  ['Swashbuckler',['light-armor','simple-weapons','martial-weapons']]
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${name} verified source training`);
}
for(const [name,expected] of [
  ['Swordsage',['light-armor','simple-weapons','martial-melee-weapons']],
  ['Totemist',['light-armor','shields-except-tower','simple-weapons']],
  ['Warblade',['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-melee-weapons']],
  ['Warlock',['light-armor','simple-weapons']],
  ['Wilder',['light-armor','shields-except-tower','simple-weapons']],
  ['Wu Jen',['simple-weapons']]
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${name} verified source training`);
}

for(const [name,sourceOnlyIndex] of [
  ['Psion','shortspear'],
  ['Psychic Rogue','sap'],
  ['Scout','throwing-axe'],
  ['Soulknife','mind-blade']
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  const sourceOnly=grant?.proficiencies.find(item=>item.index===sourceOnlyIndex);
  assert(sourceOnly?.sourceOnly,`${name} keeps unmapped source proficiency as source-only`);
  assert.equal(sourceOnly.sourceClassId,record.catalogId,`${name} source-only training keeps provenance`);
}
const warmage35=integrated35('Warmage');
const warmage1=reconcileClassGrants(baseCharacter([{catalogId:warmage35.catalogId,name:'Warmage',edition:'3.5',level:1,definition:warmage35}]));
assert(!warmage1.trainingGrants.flatMap(grant=>grant.proficiencies).some(item=>item.index==='medium-armor'),'Warmage medium armor is not a level-1 grant');
const warmage8=reconcileClassGrants(baseCharacter([{catalogId:warmage35.catalogId,name:'Warmage',edition:'3.5',level:8,definition:warmage35}]));
assert(warmage8.trainingGrants.some(grant=>grant.sourceClassLevel===8&&grant.proficiencies.some(item=>item.index==='medium-armor')),'Warmage gains medium-armor proficiency at level 8');


const skilledArchivist={...archivist,classSkills:['Concentration','Knowledge (religion)','Spellcraft']};
const skilledSheet=reconcileClassGrants(baseCharacter([{catalogId:skilledArchivist.catalogId,name:'Archivist',edition:'3.5',level:1,definition:skilledArchivist}]));
assert.deepEqual(skilledSheet.classSkills35.map(skill=>skill.name),['Concentration','Knowledge (religion)','Spellcraft']);
const dynamicSkillClass={name:'Adaptive Scholar',edition:'3.5',catalogId:'dndtools:classes/adaptive-scholar',classSkillRule:{mode:'choose_any',count:4,additional:['Craft']},progression:[['Class Level','Special'],['1st','Adaptive training']]};
const dynamicSkillSheet=reconcileClassGrants(baseCharacter([{catalogId:dynamicSkillClass.catalogId,name:dynamicSkillClass.name,edition:'3.5',level:1,definition:dynamicSkillClass}]));
assert.equal(dynamicSkillSheet.classSkillRules35[0].rule.mode,'choose_any');
assert.equal(reconcileClassGrants(dynamicSkillSheet).classSkillRules35.length,1,'dynamic class-skill rules reconcile idempotently');
assert.deepEqual(legacyClassSkillStatus(skilledSheet,'Spellcraft'),{classSkill:true,fixed:true,manual:false,dynamic:false,rankCap:4});
assert.deepEqual(legacyClassSkillStatus(skilledSheet,'Tumble'),{classSkill:false,fixed:false,manual:false,dynamic:false,rankCap:2});
const dynamicMarked={...dynamicSkillSheet,classSkillOverrides35:{tumble:true}};
assert.deepEqual(legacyClassSkillStatus(dynamicMarked,'Tumble'),{classSkill:true,fixed:false,manual:true,dynamic:true,rankCap:4});



assert.deepEqual(a4.classSpellSlots.find(profile=>profile.sourceClassId===archivist.catalogId)?.slots.slice(0,4),[4,4,3,0],'Archivist multi-row slot table');
const again=reconcileClassGrants(a4);
assert.equal(new Set(again.actions.map(x=>x.id)).size,again.actions.length);
assert.equal(new Set(again.feats.map(x=>x.id)).size,again.feats.length);
assert.equal(new Set(again.grantedFeatures.map(x=>x.id)).size,again.grantedFeatures.length);

// Recurring 3.5 progression families are retained generically instead of hard-coded per class.
for(const [name,level,expected] of [
  ['Psion',3,{'Power Points per Day':'11','Powers Known':'7','Maximum Power Level Known':'2nd'}],
  ['Warblade',3,{'Maneuvers Known':'5','Maneuvers Readied':'3','Stances Known':'1'}],
  ['Warlock',3,{'Invocations Known':'2'}],
  ['Incarnate',3,{'Soulmelds':'3','Essentia':'3','Chakra Binds':'1'}],
  ['Loremaster',3,{'Spells per Day':'+1 level of existing class'}]
]){
  const record=integrated35(name);
  assert(record,`${name} must exist in the canonical 3.5 catalog`);
  const reconciled=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level,definition:record}]));
  const tracks=Object.fromEntries((reconciled.classProgressionTracks||[]).map(track=>[track.name,track.value]));
  for(const [track,value] of Object.entries(expected))assert.equal(tracks[track],value,`${name} ${track}`);
  assert.equal(classAutomationReport(reconciled).classes[0].progressionComplete,true,`${name} progression`);
}

for(const [name,level,expected] of [
  ['Bard',5,[3,3,1,0]],
  ['Assassin',3,[0,2,0,0]],
  ['Dread Necromancer',4,[0,6,3,0]]
]){
  const record=integrated35(name);
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level,definition:record}]));
  assert.deepEqual(sheet.classSpellSlots.find(profile=>profile.sourceClassId===record.catalogId)?.slots.slice(0,4),expected,`${name} source-derived spell slots`);
}

// Every no-table variant can resolve through its audited inheritance pointer.
const fighterVariant=integrated35('Fighter Variant');
assert(fighterVariant?.inheritedFromClassId,'Fighter Variant should resolve canonical parent progression');
assert(fighterVariant.progression?.length,'Inherited Fighter progression must be available');
const variantSheet=reconcileClassGrants(baseCharacter([{catalogId:fighterVariant.catalogId,name:fighterVariant.name,edition:'3.5',level:2,definition:fighterVariant}]));
assert.equal(classAutomationReport(variantSheet).classes[0].progressionComplete,true);
assert((variantSheet.grantedFeatures||[]).every(feature=>feature.sourceClassId===fighterVariant.catalogId),'Inherited grants retain variant provenance');

const compoundRaw=classes35.find(record=>record.name==='Sorcerer/Wizard Variant');
const compound=annotateClassGrantKinds(compoundRaw,reference35);
assert.equal(compound.inheritanceRequired,true);
assert.deepEqual(compound.inheritanceOptions.map(option=>option.name).sort(),['Sorcerer','Wizard']);
for(const parent of ['Sorcerer','Wizard']){
  const resolved=annotateClassGrantKinds({...compoundRaw,inheritanceChoice:parent},reference35);
  assert.equal(resolved.inheritanceRequired,false,`${parent} variant choice resolves`);
  assert.equal(resolved.inheritanceChoice,parent);
  assert(resolved.progression?.length,`${parent} progression inherited`);
  assert(resolved.hit_die,`${parent} hit die inherited`);
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:resolved.catalogId,name:resolved.name,edition:'3.5',level:1,definition:resolved}]));
  assert.equal(classAutomationReport(sheet).classes[0].progressionComplete,true);
}

// Plural "Specials" is a real catalog shape and must be parsed as class features.
const planar=integrated35('Planar Vanguard');
assert(planar);
const planarSheet=reconcileClassGrants(baseCharacter([{catalogId:planar.catalogId,name:planar.name,edition:'3.5',level:1,definition:planar}]));
assert(planarSheet.grantedFeatures.length>0,'Specials column should produce class grants');

// NPC progressions without a Special column are still structurally valid progressions.
const aristocrat=integrated35('Aristocrat');
const aristocratSheet=reconcileClassGrants(baseCharacter([{catalogId:aristocrat.catalogId,name:aristocrat.name,edition:'3.5',level:3,definition:aristocrat}]));
assert.equal(classAutomationReport(aristocratSheet).classes[0].progressionComplete,true);

const fighterRecord={...classes.find(row=>row.name==='Fighter'),edition:'2014',catalogId:'2014:fighter'};
const wizardRecord={...classes.find(row=>row.name==='Wizard'),edition:'2014',catalogId:'2014:wizard'};
const multiclass=baseCharacter([
  {catalogId:fighterRecord.catalogId,name:'Fighter',edition:'2014',level:2,definition:fighterRecord},
  {catalogId:wizardRecord.catalogId,name:'Wizard',edition:'2014',level:1,definition:wizardRecord}
],'2014');
multiclass.spells=[{id:'wizard-spell',name:'Magic Missile',castingClassId:wizardRecord.catalogId},{id:'manual-spell',name:'Gift Spell'}];
multiclass.trainingGrants=[{classId:wizardRecord.catalogId,className:'Wizard',proficiencies:[]}];
const mixed=reconcileClassGrants(multiclass);
assert(mixed.grantedFeatures.some(feature=>feature.sourceClassId===fighterRecord.catalogId));
assert(mixed.grantedFeatures.some(feature=>feature.sourceClassId===wizardRecord.catalogId));
assert.equal(classAutomationReport(mixed).classes.length,2);

// Prestige advancement applies only to the chosen existing caster/manifesting progression.
const wizard35=integrated35('Wizard'),cleric35=integrated35('Cleric'),psion35=integrated35('Psion');
const wizardRow={catalogId:wizard35.catalogId,name:'Wizard',edition:'3.5',level:5,definition:wizard35};
const wizard5=reconcileClassGrants(baseCharacter([wizardRow]));
const loremaster=integrated35('Loremaster'),lorePlan=castingAdvancementPlan(wizard5,loremaster,1);
assert.equal(lorePlan.groups.length,1);
assert(lorePlan.groups[0].candidates.some(option=>option.classId===wizard35.catalogId));
const lorePicks={[lorePlan.groups[0].id]:wizard35.catalogId};
assert(castingAdvancementSelectionsValid(lorePlan,lorePicks));
const loreAdvanced=applyCastingAdvancementSelections({...wizard5,classLevels:[wizardRow,{catalogId:loremaster.catalogId,name:'Loremaster',edition:'3.5',level:1,definition:loremaster}],level:6},lorePlan,lorePicks);
const loreSheet=reconcileClassGrants(loreAdvanced),wizard6=reconcileClassGrants(baseCharacter([{...wizardRow,level:6}]));
assert.equal(loreSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,6);
assert.deepEqual(loreSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.slots,wizard6.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.slots);

const mystic=integrated35('Mystic Theurge');
const dualBase=reconcileClassGrants(baseCharacter([
  {...wizardRow,level:3},
  {catalogId:cleric35.catalogId,name:'Cleric',edition:'3.5',level:3,definition:cleric35}
]));
const mysticPlan=castingAdvancementPlan(dualBase,mystic,1);
assert.equal(mysticPlan.groups.length,2,'Mystic Theurge should advance two casting progressions');
const arcaneGroup=mysticPlan.groups.find(group=>group.kind==='arcane'),divineGroup=mysticPlan.groups.find(group=>group.kind==='divine');
assert(arcaneGroup&&divineGroup);
const mysticPicks={[arcaneGroup.id]:wizard35.catalogId,[divineGroup.id]:cleric35.catalogId};
assert(castingAdvancementSelectionsValid(mysticPlan,mysticPicks));
const mysticSheet=reconcileClassGrants(applyCastingAdvancementSelections({...dualBase,classLevels:[...dualBase.classLevels,{catalogId:mystic.catalogId,name:mystic.name,edition:'3.5',level:1,definition:mystic}],level:7},mysticPlan,mysticPicks));
assert.equal(mysticSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,4);
assert.equal(mysticSheet.classSpellSlots.find(profile=>profile.sourceClassId===cleric35.catalogId)?.effectiveClassLevel,4);

const cerebremancer=integrated35('Cerebremancer');
const psiBase=reconcileClassGrants(baseCharacter([
  {...wizardRow,level:3},
  {catalogId:psion35.catalogId,name:'Psion',edition:'3.5',level:3,definition:psion35}
]));
const cerePlan=castingAdvancementPlan(psiBase,cerebremancer,1);
assert(cerePlan.groups.some(group=>group.kind==='arcane'));
assert(cerePlan.groups.some(group=>group.kind==='psionic'));
const cerePicks=Object.fromEntries(cerePlan.groups.map(group=>[group.id,group.kind==='psionic'?psion35.catalogId:wizard35.catalogId]));
assert(castingAdvancementSelectionsValid(cerePlan,cerePicks));
const cereSheet=reconcileClassGrants(applyCastingAdvancementSelections({...psiBase,classLevels:[...psiBase.classLevels,{catalogId:cerebremancer.catalogId,name:cerebremancer.name,edition:'3.5',level:1,definition:cerebremancer}],level:7},cerePlan,cerePicks));
assert.equal(cereSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,4);
assert.equal(cereSheet.classProgressionTracks.find(track=>track.sourceClassId===psion35.catalogId&&track.name==='Power Points per Day')?.effectiveClassLevel,4);

const prestige={
  id:'classes/test-prestige',catalogId:'dndtools:classes/test-prestige',name:'Test Prestige',edition:'3.5',prestige:true,hit_die:8,
  progression:[['Level','BAB','Fort','Ref','Will','Special'],['1st','+0','+0','+0','+2','Secret lore 1/day']],
  sourceDescription:'Secret Lore: Once per day, you can use a special action to recall a hidden truth.',
  mechanicsPresence:{classFeatures:true}
};
const prestiged=reconcileClassGrants({...a4,classLevels:[...a4.classLevels,{catalogId:prestige.catalogId,name:prestige.name,edition:'3.5',level:1,definition:prestige}],level:5});
assert(prestiged.grantedFeatures.some(feature=>feature.sourceClassId===prestige.catalogId));
assert(prestiged.resources.some(resource=>resource.sourceClassId===prestige.catalogId&&resource.max===1));

const removed=removeClassProgression(mixed,wizardRecord.catalogId);
assert.equal(removed.classLevels.length,1);
assert.equal(removed.classLevels[0].name,'Fighter');
assert(removed.actions.some(action=>action.id==='manual-action'));
assert(removed.feats.some(feat=>feat.id==='manual-feat'));
assert(removed.spells.some(spell=>spell.id==='manual-spell'));
assert(!removed.spells.some(spell=>spell.id==='wizard-spell'));
assert(!removed.trainingGrants.some(grant=>grant.classId===wizardRecord.catalogId));
assert(!removed.grantedFeatures.some(feature=>feature.sourceClassId===wizardRecord.catalogId));

console.log('PASS class reconciliation: Archivist, recurring 3.5 progression families, inherited variants, plural Specials, multiclassing, prestige, idempotence, and safe removal');
