#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {requirements} from '../src/lib/advancement.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const exact=id=>{
  const row=classes.find(c=>c.sourceId===id);
  assert(row,'missing exact class '+id);
  return row;
};
const base={ruleset:'3.5',level:10,abilities:{int:14,wis:14,cha:14},feats:[],skillRanks:{}};
const status=(id,pattern,c)=>{
  const check=requirements(exact(id),c).find(row=>pattern.test(row.text));
  assert(check,`${id} missing language prerequisite ${pattern}`);
  return check.status;
};

assert.equal(status('classes/acolyte-of-the-ego-861',/four languages/i,{...base,languages:'Common, Elven, Dwarven, Draconic'}),'met','language-count prerequisites use distinct known languages');
assert.equal(status('classes/acolyte-of-the-ego-861',/four languages/i,{...base,languages:'Common, Elven, Elven'}),'unmet');
assert.equal(status('classes/bonded-summoner-575',/Aquan.*Auran.*Ignan.*Terran/i,{...base,languages:'Common; Ignan'}),'met','closed OR-language lists accept any named option');
assert.equal(status('classes/bonded-summoner-575',/Aquan.*Auran.*Ignan.*Terran/i,{...base,languages:'Common, Abyssal'}),'unmet');
assert.equal(status('classes/demonbinder-427',/^Abyssal\.?$/i,{...base,languages:['Common',{name:'Abyssal'}]}),'met','single-language gates support persisted array/object language forms');
assert.equal(status('classes/demonbinder-427',/^Abyssal\.?$/i,{...base,languages:['Common','Infernal']}),'unmet');

const manual=requirements({catalogId:'test:language-narrative',edition:'3.5',prerequisites:[{kind:'languages',text:'Must decipher the lost tongue during initiation.'}]},{...base,languages:'Common'});
assert.equal(manual[0].status,'manual','narrative language gates remain fail-closed');
console.log('PASS shared language prerequisite engine covers count, exact, and closed alternative language gates.');
