import assert from 'node:assert/strict';

let engine;
try {
  engine = await import('../src/lib/spellAcquisition35.js');
} catch (error) {
  assert.fail('3.5 spell acquisition engine must exist before these regressions can pass: ' + error.message);
}

const {
  SPELL_ACQUISITION35_VERSION,
  spellAcquisitionProfile35,
  spellKnownLimits35,
  spellAcquisitionEvents35,
  validateSpellReplacement35
} = engine;

assert.equal(SPELL_ACQUISITION35_VERSION, 1);

for (const id of [
  'classes/sorcerer-98',
  'classes/sorcerer-46',
  'classes/sorcerer-70',
  'classes/sorcerer-109',
  'dndtools:classes/sorcerer-98'
]) {
  const profile = spellAcquisitionProfile35(id);
  assert(profile, id + ' must resolve an acquisition profile');
  assert.equal(profile.id, 'sorcerer-35');
  assert.equal(profile.kind, 'known-table');
}

for (const id of ['classes/wizard-99', 'classes/wizard-47', 'classes/wizard-71', 'classes/wizard-110']) {
  const profile = spellAcquisitionProfile35({ sourceId: id, name: 'Wizard' });
  assert(profile, id + ' must resolve an acquisition profile');
  assert.equal(profile.id, 'wizard-35');
  assert.equal(profile.kind, 'spellbook');
}

assert.equal(spellAcquisitionProfile35('classes/hexblade-19')?.id, 'hexblade-35');
assert.equal(spellAcquisitionProfile35('classes/fighter-90'), null);

assert.deepEqual(spellKnownLimits35('sorcerer-35', 1), { 0: 4, 1: 2 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 4), { 0: 6, 1: 3, 2: 1 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 10), { 0: 9, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 20), { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 3, 9: 3 });

assert.deepEqual(spellKnownLimits35('hexblade-35', 1), {});
assert.deepEqual(spellKnownLimits35('hexblade-35', 3), {});
assert.deepEqual(spellKnownLimits35('hexblade-35', 4), { 1: 2 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 8), { 1: 4, 2: 2 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 12), { 1: 4, 2: 4, 3: 3 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 20), { 1: 5, 2: 5, 3: 5, 4: 5 });

const baseCharacter = (classId, name, level, cha = 18) => ({
  ruleset: '3.5',
  level,
  abilities: { str: 10, dex: 10, con: 10, int: 18, wis: 10, cha },
  classLevels: [{ catalogId: 'dndtools:' + classId, name, edition: '3.5', level }],
  spellAcquisition35: {}
});

const sorcerer = baseCharacter('classes/sorcerer-98', 'Sorcerer', 4, 18);
const sorcEvents = spellAcquisitionEvents35(sorcerer, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 3,
  targetClassLevel: 4
});
assert.deepEqual(
  sorcEvents.filter(e => e.kind === 'choose-known-spells').map(e => [e.spellLevel, e.count]),
  [[0, 1], [2, 1]],
  'Sorcerer level 4 gains only the per-spell-level table deltas'
);

const sorcReplace = sorcEvents.find(e => e.kind === 'optional-replacement');
assert(sorcReplace, 'Sorcerer level 4 offers one optional replacement');
assert.equal(sorcReplace.count, 1);
assert.equal(sorcReplace.maxReplacementSpellLevel, 0);

const sorc5 = baseCharacter('classes/sorcerer-98', 'Sorcerer', 5, 18);
assert(!spellAcquisitionEvents35(sorc5, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 4,
  targetClassLevel: 5
}).some(e => e.kind === 'optional-replacement'));

const sorc6 = baseCharacter('classes/sorcerer-98', 'Sorcerer', 6, 18);
assert(spellAcquisitionEvents35(sorc6, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 5,
  targetClassLevel: 6
}).some(e => e.kind === 'optional-replacement'));

const lowChaHex = baseCharacter('classes/hexblade-19', 'Hexblade', 4, 11);
const highChaHex = baseCharacter('classes/hexblade-19', 'Hexblade', 4, 12);
assert.equal(
  spellAcquisitionEvents35(lowChaHex, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: 3,
    targetClassLevel: 4
  }).filter(e => e.kind === 'choose-known-spells').length,
  0,
  'Hexblade level 4 first-level known spells require enough Charisma for a bonus 1st-level spell'
);

const highHexEvents = spellAcquisitionEvents35(highChaHex, {
  classId: 'dndtools:classes/hexblade-19',
  previousClassLevel: 3,
  targetClassLevel: 4
});
assert.deepEqual(highHexEvents.filter(e => e.kind === 'choose-known-spells').map(e => [e.spellLevel, e.count]), [[1, 2]]);
assert.equal(highHexEvents.find(e => e.kind === 'choose-known-spells')?.conditionalAccess, true);

for (const level of [12, 15, 18]) {
  const c = baseCharacter('classes/hexblade-19', 'Hexblade', level, 18);
  assert(spellAcquisitionEvents35(c, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: level - 1,
    targetClassLevel: level
  }).some(e => e.kind === 'optional-replacement'), 'Hexblade ' + level + ' offers replacement');
}

for (const level of [11, 13, 14, 16, 17, 19, 20]) {
  const c = baseCharacter('classes/hexblade-19', 'Hexblade', level, 18);
  assert(!spellAcquisitionEvents35(c, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: level - 1,
    targetClassLevel: level
  }).some(e => e.kind === 'optional-replacement'), 'Hexblade ' + level + ' does not offer replacement');
}

const wizard = baseCharacter('classes/wizard-99', 'Wizard', 1, 10);
const wizStart = spellAcquisitionEvents35(wizard, {
  classId: 'dndtools:classes/wizard-99',
  previousClassLevel: 0,
  targetClassLevel: 1
});
assert.equal(wizStart.length, 1);
assert.equal(wizStart[0].kind, 'wizard-starting-spellbook');
assert.equal(wizStart[0].firstLevelChoices, 7, 'INT 18 means 3 + 4 starting first-level choices');
assert.equal(wizStart[0].automaticCantrips, true);

const wiz2 = baseCharacter('classes/wizard-99', 'Wizard', 2, 10);
const wizLevel2 = spellAcquisitionEvents35(wiz2, {
  classId: 'dndtools:classes/wizard-99',
  previousClassLevel: 1,
  targetClassLevel: 2
});
assert.equal(wizLevel2.length, 1);
assert.equal(wizLevel2[0].kind, 'wizard-free-spellbook-additions');
assert.equal(wizLevel2[0].count, 2);
assert.equal(wizLevel2[0].maxSpellLevel, 1);

const replacementCharacter = {
  ...sorcerer,
  spellAcquisition35: {
    'dndtools:classes/sorcerer-98': {
      profileId: 'sorcerer-35',
      acquisitions: [
        { id: 'known-0', spellKey: 'spell:detect-magic', spellName: 'Detect Magic', spellLevel: 0, active: true, affectsQuota: true },
        { id: 'known-1', spellKey: 'spell:magic-missile', spellName: 'Magic Missile', spellLevel: 1, active: true, affectsQuota: true }
      ]
    }
  }
};

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:light', name: 'Light', level: 0, classes: ['Sorcerer'] }
}).valid, true);

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:mage-armor', name: 'Mage Armor', level: 1, classes: ['Sorcerer'] }
}).valid, false, 'replacement must be the same spell level');

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:magic-missile',
  addedSpell: { catalogId: 'spell:shield', name: 'Shield', level: 1, classes: ['Sorcerer'] }
}).valid, false, 'replacement level must be at least two below the highest castable level');

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:detect-magic', name: 'Detect Magic', level: 0, classes: ['Sorcerer'] }
}).valid, false, 'replacement cannot duplicate a spell already known through the same class');

console.log('PASS 3.5 spell acquisition profiles, known tables, events, and replacement rules');
