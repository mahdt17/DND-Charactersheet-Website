import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants} from '../src/lib/classIntegration.js';
import {progressionRow,baseProgression} from '../src/lib/advancement.js';

const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const definitions=raw.map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const specs=[
 ['paladin-95',1,[1,0,0],['1st','2nd','3rd','4th']],
 ['druid-92',.75,[1,0,1],['0th','1st','2nd','3rd','4th','5th','6th','7th','8th','9th']],
 ['ranger-96',1,[1,1,0],['1st','2nd','3rd','4th']],
 ['sorcerer-98',.5,[0,0,1],['0th','1st','2nd','3rd','4th','5th','6th','7th','8th','9th']],
 ['paladin-of-freedom-125',1,[1,0,0],['1st','2nd','3rd','4th']],
 ['paladin-of-slaughter-126',1,[1,0,0],['1st','2nd','3rd','4th']],
 ['paladin-of-tyranny-127',1,[1,0,0],['1st','2nd','3rd','4th']],
 ['druidic-avenger-123',.75,[1,0,1],['0th','1st','2nd','3rd','4th','5th','6th','7th','8th','9th']],
 ['urban-ranger-134',1,[1,1,0],['1st','2nd','3rd','4th']],
 ['cloistered-cleric-120',.5,[1,0,1],['0th','1st','2nd','3rd','4th','5th','6th','7th','8th','9th']],
 ['savage-bard-129',.75,[1,0,1],['0th','1st','2nd','3rd','4th','5th','6th']],
];
for(const [slug,rate,good,slots] of specs){
 const original=raw.find(r=>r.id==='classes/'+slug),before=JSON.stringify(original);
 const definition=annotateClassGrantKinds(definitions.find(r=>r.sourceId===original.id),definitions);
 assert.equal(definition.progression.length,21,slug+' has exactly twenty advancement rows');
 assert.equal(definition.progression[0][0],'Level');
 assert.deepEqual(definition.progression[0].slice(6),slots,slug+' retains individual spell-level columns');
 for(let level=1;level<=20;level++){
  const expected={bab:Math.floor(level*rate),...Object.fromEntries(['fort','ref','will'].map((key,i)=>[key,good[i]?2+Math.floor(level/2):Math.floor(level/3)]))};
  assert.deepEqual(baseProgression(definition,level),expected,slug+' at level '+level);
  assert.equal(parseInt(progressionRow(definition,level).Level),level);
  for(const slot of slots)assert.match(progressionRow(definition,level)[slot],/^(?:\d+(?:\+1)?|—)$/);
 }
 assert.equal(JSON.stringify(original),before);
 const c=reconcileClassGrants({ruleset:'3.5',classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:20,definition}]});
 assert.equal(JSON.stringify(reconcileClassGrants(JSON.parse(JSON.stringify(c)))),JSON.stringify(c));
}
const get=slug=>annotateClassGrantKinds(definitions.find(r=>r.sourceId==='classes/'+slug),definitions);
for(const slug of ['paladin-95','paladin-of-freedom-125','paladin-of-slaughter-126','paladin-of-tyranny-127']){
 assert.equal(progressionRow(get(slug),4)['1st'],'0','printed zero must remain available for bonus spells');
 assert.equal(progressionRow(get(slug),20)['4th'],'3');
}
assert.equal(progressionRow(get('sorcerer-98'),1)['0th'],'5');
assert.equal(progressionRow(get('sorcerer-98'),20)['9th'],'6');
assert.equal(progressionRow(get('druid-92'),1)['0th'],'3');
assert.equal(progressionRow(get('ranger-96'),4)['1st'],'0');
assert.match(progressionRow(get('paladin-of-freedom-125'),3).Special,/resolve/i);
assert.match(progressionRow(get('paladin-of-slaughter-126'),3).Special,/debilitating/i);
assert.match(progressionRow(get('paladin-of-tyranny-127'),3).Special,/despair/i);
assert(!JSON.stringify(get('druidic-avenger-123').progression).match(/animal companion/i));
assert.match(progressionRow(get('druidic-avenger-123'),1).Special,/rage.*1\/day/i);
assert.match(progressionRow(get('druidic-avenger-123'),17).Special,/tireless rage/i);
assert.match(progressionRow(get('urban-ranger-134'),1).Special,/Urban Tracking/);
assert(!JSON.stringify(get('urban-ranger-134').progression).match(/woodland stride|camouflage/i));
for(const slug of ['paladin-95','druid-92','sorcerer-98','ranger-96']){
 const definition=get(slug),source=raw.find(r=>r.id==='classes/'+slug);
 assert(definition.sourceAuxiliaryTables.some(item=>JSON.stringify(item.table)===JSON.stringify(source.progression)),'replaced imported table retained for '+slug);
 const wrong=normalizeCatalogRecord({...source,sourceBook:'Different book'},'dndtools','classes');
 assert.deepEqual(wrong.progression,source.progression,'repair requires exact source book');
 const changed=[['Level','Special'],['1st','Custom table']];
 assert.deepEqual(normalizeCatalogRecord({...source,progression:changed},'dndtools','classes').progression,changed,'different source content cannot be overwritten');
}
for(const slug of ['druid-40','druid-64','druid-106']){
 const definition=get(slug);
 const character=reconcileClassGrants({ruleset:'3.5',classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:20,definition}]});
 assert(!character.grantedFeatures.some(f=>f.name==='Multiattack'),'companion advancement cannot grant Multiattack to the druid');
}
console.log('PASS source-correct advancement for four PHB classes and seven UA variants across all twenty levels; companion features stay separate.');
