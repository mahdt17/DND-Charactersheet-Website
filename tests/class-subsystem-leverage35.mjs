#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=execFileSync(process.execPath,[path.join(root,'scripts','classify_class_implementation_cohorts.mjs'),'docs/class-completion-tracker.json','--check','--leverage'],{cwd:root,encoding:'utf8'});
const report=JSON.parse(output);

assert.equal(report.total,1054,'leverage audit must cover the complete 3.5 class tracker');
assert.equal(report.mutatesTracker,false,'leverage mode must remain read-only');
assert.ok(Array.isArray(report.leverage)&&report.leverage.length>0,'leverage audit must rank reusable subsystem cohorts');
assert.equal(report.leverage.reduce((sum,row)=>sum+row.primaryCount,0),report.needsReview,'every needs-review class has exactly one primary subsystem');
for(const row of report.leverage){
  assert.ok(row.cohort,'each leverage row names a subsystem');
  assert.ok(Number.isInteger(row.primaryCount)&&row.primaryCount>=0);
  assert.ok(Number.isInteger(row.taggedCount)&&row.taggedCount>=row.primaryCount,'any-tag coverage cannot be smaller than primary coverage');
  assert.ok(row.statusCounts&&typeof row.statusCounts==='object','status distribution is required');
  assert.ok(Array.isArray(row.examples)&&row.examples.length>0,'each subsystem needs representative class records');
  assert.ok(row.examples.every(example=>example.sourceId&&example.name),'examples identify exact class records');
}
assert.ok(report.leverage.some(row=>row.taggedCount>row.primaryCount),'audit must expose overlapping subsystem leverage, not only primary blockers');
for(let i=1;i<report.leverage.length;i++)assert.ok(report.leverage[i-1].taggedCount>=report.leverage[i].taggedCount,'subsystems must be ranked by total tagged coverage');

console.log(`PASS subsystem leverage audit ranks ${report.leverage.length} reusable cohorts across ${report.total} classes.`);
