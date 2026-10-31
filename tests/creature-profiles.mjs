import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
const profiles=existsSync('src/lib/creatureProfiles.js')?await import('../src/lib/creatureProfiles.js'):{};
test('local profiles expose source statistics and actionable structured attacks',()=>{
 assert.equal(typeof profiles.localCreatureProfile,'function');
 const wolf=profiles.localCreatureProfile('dire-wolf');
 assert.equal(wolf.ac,14); assert.equal(wolf.hpMax,37); assert.equal(wolf.abilities.str,17);
 assert.equal(wolf.attacks[0].toHit,5); assert.equal(wolf.attacks[0].damage[0].dice,'2d6+3');
 assert.equal(profiles.localCreatureProfile('missing'),null);
});
test('Moon eligibility uses own druid level and normal movement limits',()=>{
 assert.equal(typeof profiles.moonFormOptions,'function');
 const low=profiles.moonFormOptions(2); assert(low.some(x=>x.id==='brown-bear')); assert(!low.some(x=>x.id==='giant-octopus'));
 assert(!low.some(x=>x.type==='elemental')); assert(profiles.moonFormOptions(10).some(x=>x.id==='fire-elemental'));
});
test('original ranger options are beasts no larger than Medium with CR at most one quarter',()=>{
 assert.equal(typeof profiles.rangerBeastOptions,'function');
 const options=profiles.rangerBeastOptions(); assert(options.some(x=>x.id==='wolf')); assert(!options.some(x=>x.id==='dire-wolf')); assert(!options.some(x=>x.id==='brown-bear'));
});
test('elemental condition immunities are readable source names',()=>{
 assert(profiles.localCreatureProfile('fire-elemental').conditionImmunities.includes('Poisoned'));
});

