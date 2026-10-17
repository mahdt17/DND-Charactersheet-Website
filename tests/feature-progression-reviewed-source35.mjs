import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';

const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const byId=id=>{
  const record=classes.find(row=>row.sourceId===id);
  assert.ok(record,`missing exact class record ${id}`);
  return record;
};
const baseMonk={
  sourceId:'test:monk',catalogId:'test:monk',id:'test:monk',edition:'3.5',name:'Monk',
  progression:[['Level','Special'],['1st','Flurry of Blows, Unarmed Strike'],['2nd','—'],['3rd','—'],['4th','—'],['5th','—'],['6th','—'],['7th','—'],['8th','—'],['9th','—'],['10th','—']]
};
const row=(definition,level)=>({catalogId:definition.catalogId||`dndtools:${definition.sourceId}`,name:definition.name,edition:'3.5',level,definition});
const state=(character,feature)=>reconcileClassGrants(character).featureProgressions35?.find(item=>item.feature===feature);

const disciple=byId('classes/disciple-of-the-eye-712');
let character={ruleset:'3.5',classLevels:[row(baseMonk,5),row(disciple,3)]};
assert.equal(state(character,'flurry of blows')?.effectiveLevel,8,'reviewed Disciple of the Eye should stack every attained level with monk flurry progression');

character={ruleset:'3.5',classLevels:[row(disciple,3)]};
assert.equal(state(character,'flurry of blows')?.effectiveLevel,3,'reviewed Disciple of the Eye explicitly functions as monk level when no monk levels exist');

const sunSoul=byId('classes/sun-soul-monk-305');
character={ruleset:'3.5',classLevels:[row(baseMonk,4),row(sunSoul,2)]};
assert.equal(state(character,'flurry of blows')?.effectiveLevel,6,'reviewed Sun Soul Monk levels should stack with monk for flurry');
assert.equal(state(character,'unarmed strike')?.effectiveLevel,6,'reviewed Sun Soul Monk levels should stack with monk for unarmed progression');

console.log('PASS reviewed exact-source progression metadata activates the shared stacking ledger.');
