import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import classes from '../src/data/classes.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {spellSlotPools} from '../src/lib/editions.js';
import {reconcileClassGrants,removeClassProgression,classAutomationReport,annotateClassGrantKinds} from '../src/lib/classIntegration.js';

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
assert.deepEqual(a4.classSpellSlots.find(profile=>profile.sourceClassId===archivist.catalogId)?.slots.slice(0,4),[4,4,3,0],'Archivist multi-row slot table');
assert.deepEqual(spellSlotPools(a4).standard.slice(0,4),[4,4,3,0],'3.5 slot engine consumes reconciled Archivist slots');
assert.equal(spellSlotPools(a4).mode,'automatic');
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
  assert.deepEqual(spellSlotPools(sheet).standard.slice(0,4),expected,`${name} casting-engine slots`);
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
