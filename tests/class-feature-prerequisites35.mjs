#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {requirements} from '../src/lib/advancement.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const exact=id=>{
  const record=classes.find(row=>row.sourceId===id);
  assert.ok(record,`missing exact class ${id}`);
  return record;
};
const featureClass=(name,rows)=>({
  catalogId:`test:${name.toLowerCase().replace(/\s+/g,'-')}`,
  sourceId:`classes/test-${name.toLowerCase().replace(/\s+/g,'-')}`,
  id:`classes/test-${name.toLowerCase().replace(/\s+/g,'-')}`,
  name,edition:'3.5',
  progression:[['Level','BAB','Special'],...rows.map(([level,special])=>[String(level),'+0',special])]
});
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const character=rows=>({ruleset:'3.5',level:rows.reduce((sum,item)=>sum+item.level,0),classLevels:rows,abilities:{str:14,dex:16,con:14,int:14,wis:14,cha:14},feats:[],skillRanks:{}});
const featureStatus=(targetId,pattern,c)=>{
  const check=requirements(exact(targetId),c).find(item=>pattern.test(item.text));
  assert.ok(check,`${targetId} missing feature prerequisite ${pattern}`);
  return check.status;
};

const rogue=featureClass('Rogue',[[1,'Sneak attack +1d6'],[2,'Evasion'],[3,'Sneak attack +2d6']]);
const barbarian=featureClass('Barbarian',[[1,'Rage 1/day']]);
const druid=featureClass('Druid',[[1,'Nature sense'],[5,'Wild shape 1/day']]);
const monk=featureClass('Monk',[[1,'Flurry of blows'],[2,'Evasion']]);
const cleric=featureClass('Cleric',[[1,'Turn or rebuke undead']]);

assert.equal(featureStatus('classes/arcane-trickster-379',/Sneak attack \+2d6/i,character([row(rogue,3)])),'met','quantified sneak attack must use attained feature progression');
assert.equal(featureStatus('classes/arcane-trickster-379',/Sneak attack \+2d6/i,character([row(rogue,1)])),'unmet');
assert.equal(featureStatus('classes/battlerager-694',/rage/i,character([row(barbarian,1)])),'met','rage prerequisites must use shared feature identity');
assert.equal(featureStatus('classes/daggerspell-shaper-206',/wild shape/i,character([row(druid,5)])),'met','wild shape prerequisites must use attained progression level');
assert.equal(featureStatus('classes/daggerspell-shaper-206',/wild shape/i,character([row(druid,4)])),'unmet');
assert.equal(featureStatus('classes/disciple-of-the-word-864',/^Evasion/i,character([row(monk,2)])),'met','evasion prerequisites must use shared feature identity');
assert.equal(featureStatus('classes/disciple-of-the-word-864',/^Evasion/i,character([row(monk,1)])),'unmet');
assert.equal(featureStatus('classes/hunter-of-the-dead-317',/turn undead/i,character([row(cleric,1)])),'met','turn-undead prerequisites must accept a reviewed turn/rebuke feature family');

const narrative=requirements({catalogId:'test:narrative-feature',edition:'3.5',prerequisites:[{kind:'special',text:'Must slay a dragon with a silver spoon.'}]},character([row(rogue,3)]));
assert.equal(narrative[0].status,'manual','narrative special conditions must remain fail-closed');

console.log('PASS shared class-feature prerequisites cover quantified and presence-based feature families without opening narrative gates.');
