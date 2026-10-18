import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {effectiveFeatureLevel35,featureProgressionContributions35} from '../src/lib/featureProgression35.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const row=(id,level)=>{const definition=catalog.find(r=>r.sourceId===id);assert(definition,id);return {catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition};};
const cleric=n=>row('classes/cleric-91',n),paladin=n=>row('classes/paladin-95',n);
const make=(...classLevels)=>({ruleset:'3.5',classLevels});
const cases=[['classes/deadgrim-583','turn undead',5],['classes/warpriest-255','turn undead',10],['classes/warpriest-255','rebuke undead',10],['classes/master-of-shrouds-550','rebuke undead',10]];
for(const [id,feature,max] of cases){
 for(const n of [1,max]){
  const source=row(id,n),character=make(cleric(7),source);
  assert.equal(effectiveFeatureLevel35(character,feature),7+n,`${id} adds all attained levels`);
  const state=reconcileClassGrants(character),profile=state.featureProgressions35.find(p=>p.feature===feature);
  assert.equal(profile.effectiveLevel,7+n);
  assert.equal(featureProgressionContributions35(character,feature).filter(c=>c.sourceClassId===source.catalogId).length,1,'an advancing class must not also become the native owner');
  assert.equal(effectiveFeatureLevel35(JSON.parse(JSON.stringify(state)),feature),7+n,'save/reopen');
  assert.equal(effectiveFeatureLevel35(reconcileClassGrants(state),feature),7+n,'idempotence');
  assert.equal(effectiveFeatureLevel35(removeClassProgression(state,source.catalogId),feature),null,'removal clears the managed advancement');
  assert.equal(effectiveFeatureLevel35(make(source),feature),null,'advancement does not grant standalone turning');
 }
}
for(const id of ['classes/deadgrim-583','classes/warpriest-255']){
 assert.equal(effectiveFeatureLevel35(make(paladin(6),row(id,1)),'turn undead'),4,'Paladin 6 plus one prestige level turns as Cleric 4');
 assert.equal(effectiveFeatureLevel35(make(paladin(3),row(id,1)),'turn undead'),null,'Paladin has no turning before fourth level');
}
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/deadgrim-583',2),row('classes/warpriest-255',3)),'turn undead'),12,'multiple reviewed advancements contribute once each');
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/master-of-shrouds-550',2),row('classes/warpriest-255',3)),'rebuke undead'),12);
for(const target of [{targetClassId:paladin(6).catalogId},{targetClassName:'Paladin'}]){
 const extra=row('classes/fighter-93',1);
 extra.definition={...extra.definition,featureProgressionAdvancement:[{feature:'turn undead',levels:'all',...target}]};
 assert.equal(effectiveFeatureLevel35(make(paladin(6),row('classes/warpriest-255',2),extra),'turn undead'),6,'explicit target declarations combine with the reviewed Paladin native level');
}
assert.equal(effectiveFeatureLevel35(make(cleric(7),paladin(6),row('classes/warpriest-255',2)),'turn undead'),null,'multiple native owners remain unresolved by the single-target ledger');
for(const id of ['classes/paladin-43','classes/paladin-67','classes/paladin-107'])assert.equal(effectiveFeatureLevel35(make(cleric(7),row(id,6),row('classes/warpriest-255',2)),'turn undead'),null,'incomplete unreviewed native inventory is not evidence of absence');
assert.equal(effectiveFeatureLevel35(make(cleric(7),paladin(3),row('classes/warpriest-255',2)),'turn undead'),9,'reviewed Paladin unlock proves absence below fourth level');
assert.equal(effectiveFeatureLevel35(make(cleric(7),paladin(6),row('classes/master-of-shrouds-550',2)),'rebuke undead'),9,'reviewed standard Paladin has no rebuking progression');
assert.equal(effectiveFeatureLevel35(make(row('classes/cleric-39',7),row('classes/warpriest-255',2)),'turn undead'),null,'same-name source variants cannot borrow reviewed native levels');
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/warpriest-370',2)),'turn undead'),null,'older Warpriest source is not activated');
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/master-of-shrouds-969',2)),'rebuke undead'),null,'older Master of Shrouds source is not activated');
const deadgrim=row('classes/deadgrim-583',2);
for(const bad of [{...deadgrim,edition:'2014'},{...deadgrim,catalogId:'dndtools:classes/other'},{...deadgrim,name:'Other'},{...deadgrim,level:1.5}])assert.equal(effectiveFeatureLevel35(make(cleric(7),bad),'turn undead'),null,'inconsistent reviewed source identity is not proof');
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/warpriest-255',2),{...deadgrim,level:1.5}),'turn undead'),null,'a valid advancement must not hide another malformed reviewed contributor');
assert.equal(effectiveFeatureLevel35(make(cleric(7),row('classes/warpriest-255',2),{...deadgrim,definition:{...deadgrim.definition,sourceId:'classes/other'}}),'turn undead'),null,'a conflicting preferred source ID cannot hide a reviewed contributor');
assert.equal(effectiveFeatureLevel35(make(cleric(7),deadgrim,deadgrim),'turn undead'),null,'duplicate source rows cannot double progression');
assert.equal(effectiveFeatureLevel35(make({...paladin(6),definition:{...paladin(6).definition,sourceId:'classes/paladin-43'}},deadgrim),'turn undead'),null,'inconsistent native identity cannot borrow an offset rule');
console.log('PASS reviewed turning progression: three exact prestige sources, Cleric/Paladin native levels, lifecycle, source isolation and unresolved boundaries');
