#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'classify_class_implementation_cohorts.mjs');
const tracker = path.join(root, 'docs', 'class-completion-tracker.json');

const output = execFileSync(process.execPath, [script, tracker, '--check', '--records'], {
  cwd: root,
  encoding: 'utf8',
});
const report = JSON.parse(output);

assert.equal(report.total, 1054, 'cohort export should cover the full class tracker');
assert.equal(report.needsReview, 918, 'cohort export should preserve the verified needs-review baseline');
assert.ok(Array.isArray(report.records), '--records should expose record-level cohort assignments');
assert.equal(report.records.length, 918, 'record export should contain every needs-review record exactly once');
assert.equal(new Set(report.records.map((entry) => entry.sourceId)).size, report.records.length, 'record export source IDs should be unique');

for (const entry of report.records) {
  assert.ok(entry.sourceId, 'every exported record should include sourceId');
  assert.ok(entry.name, `${entry.sourceId} should include its class name`);
  assert.ok(entry.implementationCohort, `${entry.sourceId} should include its primary cohort`);
  assert.ok(Array.isArray(entry.implementationCohorts) && entry.implementationCohorts.length > 0, `${entry.sourceId} should include all cohort assignments`);
}

const target = report.records.filter((entry) => entry.implementationCohort === 'class actions/resources and feature reconciliation');
assert.equal(target.length, 210, 'the verified action/resource reconciliation cohort should contain 210 open records');

const finalized = new Set([
  'classes/battlesmith-725',
  'classes/duelist-768',
  'classes/goliath-liberator-732',
  'classes/ghost-slayer-525',
  'classes/gladiator-771',
  'classes/knight-protector-322',
]);
const excludedFinalized = target.filter((entry) => finalized.has(entry.sourceId));
const actionableTarget = target.filter((entry) => !finalized.has(entry.sourceId));
assert.equal(new Set(actionableTarget.map((entry) => entry.sourceId)).size, actionableTarget.length, 'actionable target IDs should remain unique after protected exclusions');

const result = {
  generatedFromNeedsReview: report.needsReview,
  cohortCount: target.length,
  excludedFinalized,
  actionableCount: actionableTarget.length,
  records: actionableTarget,
};
const resultDir = path.join(root, 'test-results');
fs.mkdirSync(resultDir, { recursive: true });
fs.writeFileSync(path.join(resultDir, 'class-implementation-cohorts.json'), JSON.stringify(result, null, 2) + '\n');

console.log(`class implementation cohort export ok (${target.length} tracked; ${actionableTarget.length} actionable; ${excludedFinalized.length} protected exclusions)`);
console.log(`ACTION_RESOURCE_COHORT=${actionableTarget.map((entry) => entry.sourceId).join(',')}`);
