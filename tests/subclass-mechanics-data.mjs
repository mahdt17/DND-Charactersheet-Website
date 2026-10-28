import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
import {subclassValue} from '../src/lib/subclassFormulas.js';
const file=new URL('../src/data/subclassMechanics2014.json',import.meta.url);
const records=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[];
const catalog=JSON.parse(readFileSync(new URL('../src/data/expandedSubclasses.json',import.meta.url),'utf8'));
const ids=new Set(catalog.map(r=>r.id));
const context={level:20,pb:6,str:3,dex:3,con:3,int:3,wis:3,cha:3};
const knownPools=new Set(['base:channel-divinity','base:ki','base:bardic-inspiration','base:bardic-inspiration-die-held','base:wild-shape','base:sorcery-points','base:rage','base:spell-slot','spell-slot','hit-die','hit-dice']);

test('every subclass has separate structured mechanics with source evidence',()=>{
 assert.equal(records.length,214);
 assert.equal(new Set(records.map(r=>r.recordId)).size,214);
 for(const r of records){
  assert.ok(ids.has(r.recordId));
  for(const key of ['choices','resources','actions'])assert.equal(new Set(r[key].map(x=>x.key)).size,r[key].length,`${r.recordId}/${key}`);
  for(const item of [...r.choices,...r.resources,...r.actions,...r.passives,...r.training])assert.ok(item.sourceEvidence,`${r.recordId}/${item.key||item.feature}`);
  assert.ok(r.passives.every(p=>!['source-rule','source-feature'].includes(p.kind)));
  for(const choice of r.choices){
   assert.ok(['advancement','rest','activation','replacement'].includes(choice.scope));
   assert.ok(choice.options.length||choice.filter||choice.freeText,`${r.recordId}/${choice.key}`);
   for(const value of choice.options){assert.equal(typeof value,'string');assert.ok(value.length<200&&!value.includes('\n'));assert.doesNotMatch(value,/Click here|Wikidot|^any (?:skill|tool|language|wizard|class spell)\b/i);}
  }
 }
});

test('resource limits are calculable and actions cannot spend nonexistent pools',()=>{
 for(const r of records){
  const pools=new Set(r.resources.map(p=>p.key));
  for(const p of r.resources){assert.ok(Number.isFinite(subclassValue(p.max,context)),`${r.recordId}/${p.key}`);assert.ok(['short','long','none'].includes(p.reset));}
  for(const a of r.actions)if(!a.referenceOnly&&a.resourceKey)assert.ok(pools.has(a.resourceKey)||knownPools.has(a.resourceKey),`${r.recordId}/${a.key}/${a.resourceKey}`);
 }
});

test('spell and training filters retain actual source restrictions instead of placeholder options',()=>{
 const bladesinger=records.find(r=>r.recordId==='2014:subclass:wizard:bladesinging');
 assert.equal(bladesinger.adapter,'bladesinging');
 assert.ok(bladesinger.choices.find(c=>c.key==='bladesinger-weapon').options.includes('Rapier'));
 const arcana=records.find(r=>r.recordId==='2014:subclass:cleric:arcana');
 assert.deepEqual(arcana.choices.find(c=>c.key==='wizard-cantrips').filter,{type:'spell',classes:['Wizard'],levels:[0]});
 assert.deepEqual(arcana.choices.find(c=>c.key==='wizard-spell-9').filter,{type:'spell',classes:['Wizard'],levels:[9]});
 const armorer=records.find(r=>r.recordId==='2014:subclass:artificer:armorer');
 assert.ok(armorer.choices.find(c=>c.key==='duplicate-tool').when.alreadyProficient);
 assert.equal(armorer.choices.find(c=>c.key==='armor-model').scope,'rest');
 const monk=records.find(r=>r.recordId==='2014:subclass:monk:four-elements').choices.find(c=>c.key==='disciplines');
 assert.equal(monk.options.length,16);assert.equal(monk.countMode,'gained');assert.equal(monk.optionDetails.find(o=>o.name==='Breath of Winter').minimumClassLevel,17);
});
