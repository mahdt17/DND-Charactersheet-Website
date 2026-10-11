#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const script=path.join(root,'scripts','audit_stale_class_planning35.mjs');
const output=execFileSync(process.execPath,[script,'--json'],{cwd:root,encoding:'utf8'});
const report=JSON.parse(output);

assert.equal(report.totalTrackerRecords,1054);
assert.ok(report.reviewedRuntimeRecords>0,'audit should inspect source-reviewed runtime records');
assert.ok(Array.isArray(report.records));

const ordinary10=new Set([
  'classes/bayushi-deceiver-627',
  'classes/guild-thief-514',
  'classes/enlightened-spirit-267',
  'classes/hellfire-warlock-463',
  'classes/fist-of-dal-quor-814',
  'classes/inquisitor-of-the-drowning-goddess-901',
]);
const rows=report.records.filter(row=>ordinary10.has(row.sourceId));
assert.equal(rows.length,ordinary10.size,'ordinary10 should be represented exactly once per source ID');
for(const row of rows){
  assert.equal(row.runtimeReviewed,true,`${row.sourceId} should be recognized as reviewed runtime data`);
  assert.ok(row.resolvedPlanningAxes.includes('prerequisites'),`${row.sourceId} should mark reviewed prerequisites as a resolved planning axis`);
  assert.ok(row.resolvedPlanningAxes.includes('training'),`${row.sourceId} should mark reviewed class skills/proficiencies as a resolved planning axis`);
  assert.ok(row.remainingBlockers.length>0,`${row.sourceId} still has specialized blockers and must not be promoted by this audit`);
}

assert.equal(report.mutatesTracker,false,'planning audit must remain read-only');
assert.equal(report.certifiesClasses,false,'planning audit must never certify classes');
console.log(`class planning staleness audit ok (${report.records.length} reviewed runtime records)`);
