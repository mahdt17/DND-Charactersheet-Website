#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const levelUp=await fs.readFile('src/LevelUp.jsx','utf8');
const setup=await fs.readFile('src/GuidedSetup.jsx','utf8');

assert.match(levelUp,/useReferenceIndex\(\['classes','feats','equipment'\],ruleset\)/,'LevelUp must load the 3.5 equipment catalog alongside classes and feats');
assert.match(levelUp,/equipment:\[\.\.\.homebrew\.filter\([\s\S]*?\.\.\.catalog\.entries\.filter\(entry=>\/(?:equipment|weapon)/i\.test\(entry\?\.category\|\|''\)\|\|entry\?\.kind==='weapon'\|\|entry\?\.itemType==='weapon'\)\]/,'LevelUp feature-choice context must expose weapon/equipment records');

assert.match(setup,/step===6\?\['spells','feats','equipment'\]:step===7\?\['feats','spells','equipment'\]/,'GuidedSetup must keep equipment available for acquisition and final feature choices');
assert.match(setup,/const acquisitionFeatureContext=\{[\s\S]*?equipment:homebrew\.filter\(entry=>\/(?:equipment|weapon)/i\.test\(entry\?\.category\|\|''\)\|\|entry\?\.kind==='weapon'\|\|entry\?\.itemType==='weapon'\)[\s\S]*?\};/,'GuidedSetup acquisition choices must receive equipment records');
assert.match(setup,/const featureContext=\{[\s\S]*?equipment:\[\.\.\.customEntries\.filter\([\s\S]*?\.\.\.reference\.entries\.filter\(entry=>\/(?:equipment|weapon)/i\.test\(entry\?\.category\|\|''\)\|\|entry\?\.kind==='weapon'\|\|entry\?\.itemType==='weapon'\)\][\s\S]*?\};/,'GuidedSetup final feature choices must receive equipment records');

console.log('source choice UI context regression passed');
