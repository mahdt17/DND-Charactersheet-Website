import assert from 'node:assert/strict';
import {effectiveFeatureLevel35,featureProgressionContributions35} from '../src/lib/featureProgression35.js';

const cls=(id,name,feature,extra={})=>({
  sourceId:id,catalogId:`dndtools:${id}`,id,edition:'3.5',name,
  progression:[['Level','Special'],['1st',feature],['2nd','—'],['3rd','—'],['4th','—'],['5th','—'],['6th','—'],['7th','—'],['8th','—'],['9th','—'],['10th','—']],
  ...extra
});
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});

const cleric=cls('classes/cleric-stacking-test','Cleric','Turn Undead');
const sacred=cls('classes/sacred-stacking-test','Sacred Progressor','—',{
  featureProgressionAdvancement:[{feature:'turn undead',targetClassId:cleric.catalogId,levels:'all'}]
});
let character={ruleset:'3.5',classLevels:[row(cleric,5),row(sacred,3)]};
assert.equal(effectiveFeatureLevel35(character,'Turn Undead'),8,'all prestige levels should add to the exact target feature level');
assert.deepEqual(featureProgressionContributions35(character,'Turn Undead').map(item=>[item.sourceClassId,item.amount,item.kind]),[
  [cleric.catalogId,5,'base'],[sacred.catalogId,3,'advancement']
]);

const druid=cls('classes/druid-stacking-test','Druid','Wild Shape');
const shaper=cls('classes/shaper-stacking-test','Shaper','—',{
  featureProgressionAdvancement:[{feature:'wild shape',targetClassId:druid.catalogId,levels:[1,2,4]}]
});
character={ruleset:'3.5',classLevels:[row(druid,6),row(shaper,4)]};
assert.equal(effectiveFeatureLevel35(character,'wild shape'),9,'selected prestige levels should contribute only attained listed levels');

const barbarian=cls('classes/barbarian-stacking-test','Barbarian','Rage');
const cultist=cls('classes/cultist-stacking-test','Cultist','—',{
  featureProgressionAdvancement:[{feature:'rage',targetClassId:barbarian.catalogId,levels:'all',amountPerLevel:1}]
});
character={ruleset:'3.5',classLevels:[row(barbarian,7),row(cultist,2)]};
assert.equal(effectiveFeatureLevel35(character,'rage'),9,'the same contract should span unrelated feature families');

const monk=cls('classes/monk-stacking-test','Monk','Flurry of Blows');
const fist=cls('classes/fist-stacking-test','Fist','—',{
  featureProgressionAdvancement:[{feature:'flurry of blows',targetClassId:monk.catalogId,levels:[1,3,5],amountPerLevel:2}]
});
character={ruleset:'3.5',classLevels:[row(monk,4),row(fist,5)]};
assert.equal(effectiveFeatureLevel35(character,'Flurry of Blows'),10,'per-level contribution amounts should support non-1 advancement schedules');

const missingTarget={ruleset:'3.5',classLevels:[row(sacred,3)]};
assert.equal(effectiveFeatureLevel35(missingTarget,'turn undead'),null,'an advancement must not manufacture a missing target feature/class');

const otherCleric=cls('classes/other-cleric-stacking-test','Other Cleric','Turn Undead');
const ambiguous=cls('classes/ambiguous-stacking-test','Ambiguous Progressor','—',{
  featureProgressionAdvancement:[{feature:'turn undead',levels:'all'}]
});
character={ruleset:'3.5',classLevels:[row(cleric,4),row(otherCleric,4),row(ambiguous,2)]};
assert.equal(effectiveFeatureLevel35(character,'turn undead'),null,'feature-only targeting must fail closed when more than one native class can own the feature');

console.log('PASS generic feature progression stacking supports exact targets, selected levels, contribution rates, and ambiguity fail-closed behavior.');
