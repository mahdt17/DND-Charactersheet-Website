import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import classes from '../src/data/classes.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
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
const archivist=annotateClassGrantKinds(classes35.find(record=>record.name==='Archivist'),feats35);
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
const again=reconcileClassGrants(a4);
assert.equal(new Set(again.actions.map(x=>x.id)).size,again.actions.length);
assert.equal(new Set(again.feats.map(x=>x.id)).size,again.feats.length);
assert.equal(new Set(again.grantedFeatures.map(x=>x.id)).size,again.grantedFeatures.length);

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

console.log('PASS class reconciliation: Archivist actions/feat/resources, levels 1-4, idempotence, core multiclassing, prestige, and safe class removal');
