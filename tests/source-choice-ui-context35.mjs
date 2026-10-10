#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const levelUp=await fs.readFile('src/LevelUp.jsx','utf8');
const setup=await fs.readFile('src/GuidedSetup.jsx','utf8');

assert(levelUp.includes("useReferenceIndex(['classes','feats','equipment'],ruleset)"),'LevelUp must load the 3.5 equipment catalog alongside classes and feats');
assert(levelUp.includes("equipment:[...homebrew.filter(entry=>/equipment/i.test(entry?.category||'')||/weapon/i.test(entry?.category||'')||entry?.kind==='weapon'||entry?.itemType==='weapon'),...catalog.entries.filter(entry=>/equipment/i.test(entry?.category||'')||/weapon/i.test(entry?.category||'')||entry?.kind==='weapon'||entry?.itemType==='weapon')]"),'LevelUp feature-choice context must expose weapon/equipment records');

assert(setup.includes("step===6?['spells','feats','equipment']:step===7?['feats','spells','equipment']"),'GuidedSetup must keep equipment available for acquisition and final feature choices');
assert(setup.includes("equipment:homebrew.filter(entry=>/equipment/i.test(entry?.category||'')||/weapon/i.test(entry?.category||'')||entry?.kind==='weapon'||entry?.itemType==='weapon')"),'GuidedSetup acquisition choices must receive equipment records');
assert(setup.includes("equipment:[...customEntries.filter(entry=>/equipment/i.test(entry?.category||'')||/weapon/i.test(entry?.category||'')||entry?.kind==='weapon'||entry?.itemType==='weapon'),...reference.entries.filter(entry=>/equipment/i.test(entry?.category||'')||/weapon/i.test(entry?.category||'')||entry?.kind==='weapon'||entry?.itemType==='weapon')]"),'GuidedSetup final feature choices must receive equipment records');

console.log('source choice UI context regression passed');
