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
 {id:'classes/darkwood-stalker-308',level:10,features:['Ancient Foe','Uncanny Dodge','Sneak Attack','Darkvision','Improved Uncanny Dodge','Dodge Critical','Death Attack'],resource:['Dodge Critical',1],action:'Death Attack',training:[]},
 {id:'classes/avenging-executioner-289',level:5,features:['Bloody Blade','Sudden Strike','Rapid Intimidation','Dread Blade','Bloody Murder'],actions:['Rapid Intimidation'],training:[]},
 {id:'classes/chaotician-687',level:5,features:['Chaotic Contagion','Scofflaw','Anarchic Grace','Babble','Clarity of Confusion','Destiny’s Arbiter'],resources:[['Chaotic Contagion',5],['Anarchic Grace',2],['Babble',1],['Destiny’s Arbiter',1]],actions:['Scofflaw','Anarchic Grace','Destiny’s Arbiter'],training:['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']},
 {id:'classes/cragtop-archer-727',level:5,features:['Adept Climber','Farsight','Strike From Above','Arcing Shot','Horizon Shot','Mountain Skin'],resources:[['Mountain Skin',3]],actions:['Horizon Shot','Mountain Skin'],training:[]},
 {id:'classes/divine-seeker-663',level:5,features:['Sacred Stealth','Thwart Magic Trap','Sacred Defense','Sneak Attack','Locate Creature','Locate Object','Divine Perseverance','Find the Path'],resources:[['Sacred Stealth',1],['Locate Creature',1],['Locate Object',1],['Divine Perseverance',1],['Find the Path',1]],actions:['Sacred Stealth'],training:['light-armor','simple-weapons']},
 {id:'classes/menacing-brute-707',level:5,features:['Demoralizing Stare','Resourceful Search','Sneak Attack','Ruthless Cut','Making an Example'],resources:[['Resourceful Search',1]],training:[]},
 {id:'classes/cavelord-896',level:10,features:['Tunnelrunner','Cave Tracker','Lesser Cavesense','Tunnelswimmer','Strength of Stones','Greater Cavesense','Changestones','Bones of the Earth'],resources:[['Strength of Stones',1],['Changestones',1]],actions:['Strength of Stones'],training:['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']},
 {id:'classes/daidoji-bodyguard-630',level:10,features:['Defensive Refocus','Defensive Awareness','Evasion','Moving the Shadow','Damage Reduction','Defensive Roll'],resources:[['Defensive Roll',1]],actions:['Defensive Refocus'],training:[]},
 {id:'classes/dark-lantern-475',level:10,features:['Citadel Training','Sneak Attack','Nondetection','Skill Mastery','Slippery Mind','Hide in Plain Sight'],training:[]},
 {id:'classes/deepwarden-729',level:10,features:['Track','Trap Sense','Stone Warden','Animal Messenger','Uncanny Dodge','Stubborn Mind','Sending','Swift Tracker','Improved Uncanny Dodge','Greater Animal Messenger'],training:['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']},
 {id:'classes/astral-dancer-686',level:10,features:['Relative Altitude','Evasion','Improved Maneuverability','Astral Dodge','Improved Evasion','Astral Agility','Lightning Speed'],actions:['Astral Agility'],training:[]}
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
 for(const [name,max] of [...(spec.resource?[spec.resource]:[]),...(spec.resources||[])]){
   assert.equal(once.resources.find(item=>item.name===name)?.max,max,spec.id+' '+name+' resource maximum');
 }
 for(const name of [...(spec.action?[spec.action]:[]),...(spec.actions||[])]){
   assert(once.actions.some(item=>item.name===name&&item.sourceClassId===definition.catalogId),spec.id+' action '+name);
 }
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
