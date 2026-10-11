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
const status=(id,needle,character)=>{
  const check=requirements(byId(id),{ruleset:'3.5',level:10,abilities:{},feats:[],skillRanks:{},...character}).find(row=>row.text.includes(needle));
  assert.ok(check,`missing ${id} prerequisite containing ${needle}`);
  return check.status;
};

assert.equal(status('classes/chameleon-705','Human or Doppleganger',{race:'Human'}),'met','closed race alternatives should qualify either exact race');
assert.equal(status('classes/chameleon-705','Human or Doppleganger',{race:'Elf'}),'unmet','closed race alternatives should reject races outside the list');
assert.equal(status('classes/blessed-gruumsh-982','Must be Orc or Half-Orc',{race:'Half-Orc'}),'met','prefixed closed race alternatives should share the same predicate');
assert.equal(status('classes/blessed-gruumsh-982','Must be Orc or Half-Orc',{race:'Dwarf'}),'unmet');

assert.equal(status('classes/atavist-717','Lawful good or lawful neutral',{alignment:'lawful neutral'}),'met','two-way alignment alternatives should qualify');
assert.equal(status('classes/atavist-717','Lawful good or lawful neutral',{alignment:'neutral good'}),'unmet');
assert.equal(status('classes/ghostwalker-770','Lawful good, lawful evil, chaotic good, chaotic evil, or true neutral',{alignment:'true neutral'}),'met','closed serial alignment alternatives should qualify');
assert.equal(status('classes/ghostwalker-770','Lawful good, lawful evil, chaotic good, chaotic evil, or true neutral',{alignment:'neutral good'}),'unmet');

assert.equal(status('classes/arboreal-guardian-522','Elf or half-elf.',{race:'Elf'}),'manual','race alternatives with narrative exceptions must remain manual');
console.log('PASS closed race/alignment prerequisite alternatives preserve narrative fail-closed behavior.');
