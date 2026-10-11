import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {requirements} from '../src/lib/advancement.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';

const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const byId=id=>{
  const record=classes.find(row=>row.sourceId===id);
  assert.ok(record,`missing exact class record ${id}`);
  return record;
};
const base={ruleset:'3.5',level:10,abilities:{},feats:[],skillRanks:{}};
const status=(id,needle,character)=>{
  const check=requirements(byId(id),{...base,...character}).find(row=>row.text.includes(needle));
  assert.ok(check,`missing ${id} prerequisite containing ${needle}`);
  return check.status;
};
const training=(...indexes)=>({trainingGrants:[{proficiencies:indexes.map(index=>({kind:'weapons',index,name:index}))}]});

assert.equal(status('classes/abjurant-champion-264','at least one martial weapon',training('martial-weapons')),'met','broad martial training should satisfy a minimum martial-weapon gate');
assert.equal(status('classes/abjurant-champion-264','at least one martial weapon',training('simple-weapons')),'manual','absence of reviewed martial category evidence must not become a false denial');
assert.equal(status('classes/ardent-dilettante-685','at least two martial weapons',training('martial-weapons')),'met','category training should satisfy finite same-category weapon counts');
assert.equal(status('classes/ardent-dilettante-685','at least four martial weapons and one exotic weapon',training('martial-weapons','exotic-weapons')),'met','closed AND weapon-category counts should compose');
assert.equal(status('classes/fist-of-dal-quor-814','a mind blade counts',training('martial-weapons')),'manual','weapon gates with narrative exceptions remain fail-closed');

assert.equal(status('classes/ur-priest-177','Fort +3, Will +3',{save35:{fort:3,ref:0,will:3}}),'met','multi-save gates should evaluate every listed base save');
assert.equal(status('classes/ur-priest-177','Fort +3, Will +3',{save35:{fort:3,ref:0,will:2}}),'unmet');
assert.equal(status('classes/initiate-of-pistis-sophia-146','Fort +5, Ref +5, Will +5',{save35:{fort:5,ref:5,will:5}}),'met','three-save gates should share the same all-of predicate');
assert.equal(status('classes/initiate-of-pistis-sophia-146','Fort +5, Ref +5, Will +5',{save35:{fort:5,ref:4,will:5}}),'unmet');

console.log('PASS shared training-count and multi-save prerequisites reuse existing character state.');
