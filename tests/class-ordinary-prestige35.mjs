import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,classAutomationReport} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const base=row=>({id:'ordinary-prestige-test',name:'Ordinary Prestige Test',ruleset:'3.5',mechanics:'3.5',level:row.level,className:row.name,classDefinition:row.definition,classLevels:[row],abilities:{str:14,dex:16,con:14,int:14,wis:12,cha:12},hp:{current:30,max:30,temp:0},actions:[{id:'manual-action',name:'Manual action'}],feats:[{id:'manual-feat',name:'Manual feat'}],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const cases=[
 {id:'classes/streetfighter-197',level:5,features:['Always Ready','Streetwise','Stand Tough','Sneak Attack','Uncanny Dodge'],resource:['Stand Tough',2],training:[]},
 {id:'classes/survivor-822',level:5,features:['Uncanny Dodge','Evasion','Improved Evasion','Damage Reduction'],training:[]},
 {id:'classes/tempest-198',level:5,features:['Tempest Defense','Ambidexterity','Two-Weapon Versatility','Two-Weapon Spring Attack'],action:'Two-Weapon Spring Attack',training:[]},
 {id:'classes/thief-acrobat-199',level:5,features:['Fast Acrobatics','Kip Up','Steady Stance','Agile Fighting','Slow Fall','Acrobatic Charge','Defensive Roll','Skill Mastery','Improved Evasion'],resource:['Defensive Roll',2],action:'Kip Up',training:['simple-weapons']},
 {id:'classes/dark-hunter-307',level:5,features:['Improved Stonecunning','Enhanced Darkvision','Sneak Attack','Stone’s Hue','Death Attack'],action:'Death Attack',training:[]},
 {id:'classes/darkwood-stalker-308',level:10,features:['Ancient Foe','Uncanny Dodge','Sneak Attack','Darkvision','Improved Uncanny Dodge','Dodge Critical','Death Attack'],resource:['Dodge Critical',1],action:'Death Attack',training:[]}
];
for(const spec of cases){
 const definition=exact(spec.id);
 assert(definition,spec.id+' must exist');
 const classRow=row(definition,spec.level),once=reconcileClassGrants(base(classRow)),twice=reconcileClassGrants(once);
 assert.equal(JSON.stringify(once),JSON.stringify(twice),spec.id+' reconciliation must be idempotent');
 for(const name of spec.features){
   const feature=once.grantedFeatures.find(item=>item.name===name);
   assert(feature,spec.id+' missing '+name);
   assert.equal(feature.descriptionSource,'rule-text',spec.id+' '+name+' must use reviewed rule text');
 }
 assert.equal(classAutomationReport(once).classes[0].descriptionComplete,true,spec.id+' reviewed descriptions must be complete');
 if(spec.resource){
   const [name,max]=spec.resource;
   assert.equal(once.resources.find(item=>item.name===name)?.max,max,spec.id+' '+name+' resource maximum');
 }
 if(spec.action)assert(once.actions.some(item=>item.name===spec.action&&item.sourceClassId===definition.catalogId),spec.id+' action '+spec.action);
 const training=once.trainingGrants.flatMap(item=>item.proficiencies||[]).map(item=>item.index);
 assert.deepEqual(training.sort(),[...spec.training].sort(),spec.id+' exact starting training');
 const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
 const removed=removeClassProgression({...once,classLevels:[classRow,survivor],level:spec.level+1},definition.catalogId);
 assert(!removed.grantedFeatures.some(item=>item.sourceClassId===definition.catalogId),spec.id+' source-owned features survive removal');
 assert(!removed.actions.some(item=>item.sourceClassId===definition.catalogId),spec.id+' source-owned actions survive removal');
 assert(!removed.resources.some(item=>item.sourceClassId===definition.catalogId),spec.id+' source-owned resources survive removal');
 assert(!removed.trainingGrants.some(item=>item.sourceClassId===definition.catalogId),spec.id+' source-owned training survives removal');
 assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),spec.id+' removal must preserve manual data');
}
console.log('PASS ordinary prestige implementation cohort: '+cases.length+' exact-source classes with reviewed features, resources/actions, training, idempotence, and source removal.');
