import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';

const dataUrl = new URL('../src/data/fighterSubclasses.js', import.meta.url);
const data = existsSync(dataUrl) ? await import(dataUrl) : {};

test('2014 Fighter records cover both subclasses and every subclass milestone', () => {
  assert.ok(data.fighterSubclassRecords, 'The 2014 Fighter subclass rules data must exist');
  assert.deepEqual(data.fighterSubclassRecords.map(record => record.index), ['battle-master', 'cavalier']);
  for (const record of data.fighterSubclassRecords) {
    assert.equal(record.edition, '2014');
    assert.equal(record.class.name, 'Fighter');
    assert.deepEqual([...new Set(record.features.map(feature => feature.level))], [3, 7, 10, 15, 18]);
    assert.match(record.sourceUrl, /^https:\/\/dnd5e\.wikidot\.com\/fighter:/);
    assert.ok(record.sourceBook);
    assert.ok(record.features.every(feature => feature.name && feature.description && feature.sourceUrl));
  }
  const battleMaster = data.fighterSubclassRecords[0];
  for (const name of ['Combat Superiority', 'Student of War', 'Know Your Enemy', 'Improved Combat Superiority', 'Relentless']) {
    assert.ok(battleMaster.features.some(feature => feature.name === name), name);
  }
  assert.match(battleMaster.features.find(feature => feature.level === 10 && feature.name === 'Improved Combat Superiority').description, /d10/);
  assert.match(battleMaster.features.find(feature => feature.level === 18).description, /d12/);
  assert.deepEqual(data.cavalierSkills, ['Animal Handling', 'History', 'Insight', 'Performance', 'Persuasion']);
});

test('all 23 maneuvers identify damage dice separately from checks, defense, and secondary damage', () => {
  assert.equal(data.battleMasterManeuvers?.length, 23);
  assert.equal(new Set(data.battleMasterManeuvers.map(maneuver => maneuver.id)).size, 23);
  const damageManeuvers = ['brace', 'commanders-strike', 'disarming-attack', 'distracting-strike', 'feinting-attack', 'goading-attack', 'lunging-attack', 'maneuvering-attack', 'menacing-attack', 'pushing-attack', 'quick-toss', 'riposte', 'trip-attack'];
  const saves = { 'disarming-attack': 'Strength', 'goading-attack': 'Wisdom', 'menacing-attack': 'Wisdom', 'pushing-attack': 'Strength', 'trip-attack': 'Strength' };
  for (const maneuver of data.battleMasterManeuvers) {
    assert.match(maneuver.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(maneuver.name && maneuver.timing && maneuver.effect);
    assert.equal(maneuver.damage, damageManeuvers.includes(maneuver.id), maneuver.name);
    assert.equal(maneuver.save, saves[maneuver.id] ?? null, maneuver.name);
    assert.equal(maneuver.extraAbility, maneuver.id === 'parry' ? 'dex' : maneuver.id === 'rally' ? 'cha' : null, maneuver.name);
  }
});

test('maneuver summaries retain action, recipient, reach, and expiration restrictions', () => {
  assert.ok(data.battleMasterManeuvers);
  const text = id => {
    const maneuver = data.battleMasterManeuvers.find(item => item.id === id);
    assert.ok(maneuver, id);
    return `${maneuver.timing} ${maneuver.effect}`;
  };
  assert.match(text('ambush'), /incapacitated/);
  assert.match(text('bait-and-switch'), /willing/);
  assert.match(text('bait-and-switch'), /start of your next turn/);
  assert.match(text('commanders-strike'), /bonus action/);
  assert.match(text('commanders-strike'), /reaction/);
  assert.match(text('precision-attack'), /before.*effects/);
  assert.match(text('maneuvering-attack'), /half.*speed/);
  assert.match(text('maneuvering-attack'), /only.*target|target.*only/);
  assert.match(text('sweeping-attack'), /5 feet/);
  assert.match(text('sweeping-attack'), /reach/);
  for (const id of ['pushing-attack', 'trip-attack']) assert.match(text(id), /Large or smaller/);
  for (const id of ['goading-attack', 'menacing-attack']) assert.match(text(id), /end of your next turn/);
  assert.match(text('distracting-strike'), /start of your next turn/);
});
