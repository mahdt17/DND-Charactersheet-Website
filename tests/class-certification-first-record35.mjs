#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildClassCompletionLedger35,validateEvidenceArtifacts35} from '../scripts/class_completion_certification35.mjs';

const [tracker,evidence]=await Promise.all([
  fs.readFile('docs/class-completion-tracker.json','utf8').then(JSON.parse),
  fs.readFile('docs/class-completion-evidence35.json','utf8').then(JSON.parse)
]);
const sourceId='classes/cleric-91';
const proof=evidence.entries?.[sourceId];
assert(proof,sourceId+' must have explicit certification evidence');
assert.equal(proof.sourceId,sourceId);
assert.equal(proof.certify,true);
const artifactErrors=await validateEvidenceArtifacts35({entries:{[sourceId]:proof}},{root:process.cwd()});
assert.deepEqual(artifactErrors,{},sourceId+' evidence paths must exist and name the exact source record');
const ledger=buildClassCompletionLedger35(tracker,{entries:{[sourceId]:proof}},artifactErrors);
const entry=ledger.entries.find(row=>row.sourceId===sourceId);
assert(entry,sourceId+' must remain in the tracker');
assert.equal(entry.status,'certified-complete');
assert.equal(entry.certified,true);
assert.deepEqual(entry.missingEvidence,[]);
assert.deepEqual(entry.blockers,[]);
assert.deepEqual(entry.evidenceValidationErrors,[]);
console.log('first exact class certification regression passed:',sourceId);
