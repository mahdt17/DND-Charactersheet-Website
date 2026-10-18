#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {requirements} from '../src/lib/advancement.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {lowerCastingPrerequisite35} from '../src/lib/castingPrerequisites35.js';

const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const byId=id=>{
  const record=classes.find(row=>row.sourceId===id);
  assert.ok(record,`missing exact class ${id}`);
  return record;
};
const check=(id,pattern,character)=>{
  const row=requirements(byId(id),character).find(item=>pattern.test(item.text));
  assert.ok(row,`${id} missing prerequisite ${pattern}`);
  return row.status;
};
const base={ruleset:'3.5',level:10,abilities:{str:12,dex:16,con:14,int:14,wis:14,cha:12},feats:[],skillRanks:{},save35:{fort:0,ref:0,will:0}};

assert.equal(check('classes/arcane-archer-378',/^Feats:Point Blank Shot$/i,{...base,feats:[{name:'Point Blank Shot'},{name:'Precise Shot'}]}),'met','source-prefixed feat gates must reuse exact feat ownership');
assert.equal(check('classes/arcane-archer-378',/^Feats:Point Blank Shot$/i,{...base,feats:[{name:'Precise Shot'}]}),'unmet');

assert.equal(check('classes/battlesmith-725',/^Race:Dwarf$/i,{...base,race:'Dwarf'}),'met','source-prefixed race gates must reuse exact race matching');
assert.equal(check('classes/battlesmith-725',/^Race:Dwarf$/i,{...base,race:'Elf'}),'unmet');

assert.equal(check('classes/beastmaster-203',/Handle Animal 8 ranks.*Survival 4 ranks/i,{...base,skillRanks:{'Handle Animal':8,Survival:4}}),'met','comma-separated ranked skill lists must be evaluated as an all-group');
assert.equal(check('classes/beastmaster-203',/Handle Animal 8 ranks.*Survival 4 ranks/i,{...base,skillRanks:{'Handle Animal':8,Survival:3}}),'unmet');

assert.equal(check('classes/cancer-mage-180',/Fort.*\+5/i,{...base,save35:{fort:5,ref:0,will:0}}),'met','generic source save aliases must lower to the shared save predicate');
assert.equal(check('classes/cancer-mage-180',/Fort.*\+5/i,{...base,save35:{fort:4,ref:0,will:0}}),'unmet');

assert.deepEqual(lowerCastingPrerequisite35({kind:'spellcasting',text:'Must be able to cast 2nd-level divine spells.'}),{kind:'spellcasting',minimum:2,tradition:'divine'},'common mandatory-casting wording must lower without narrative inference');
assert.equal(lowerCastingPrerequisite35({kind:'special',text:'Must undergo the Ritual of Bonding.'}),null,'narrative special gates must remain fail-closed');

console.log('PASS prerequisite normalization wave covers exact prefixed feats/races, ranked skills, saves, and common casting wording.');
