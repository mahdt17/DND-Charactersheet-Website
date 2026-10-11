#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const output=execFileSync(process.execPath,[path.join(root,'scripts','audit_persistent_class_choices35.mjs'),'--json'],{cwd:root,encoding:'utf8'});
const report=JSON.parse(output);

assert.equal(report.schemaVersion,1);
assert.equal(report.totalTrackerRecords,1054);
assert.equal(report.persistentChoiceRecords,336,'persistent-choice cohort size changed; inspect classifier/tracker drift before changing this contract');
assert.equal(report.records.length,report.persistentChoiceRecords);
assert.equal(new Set(report.records.map(row=>row.sourceId)).size,report.records.length,'persistent-choice source IDs must be unique');
assert.equal(report.mutatesTracker,false,'choice decomposition must remain read-only');
assert.equal(report.certifiesClasses,false,'choice decomposition must never certify classes');
assert.ok(report.subtypeCounts&&Object.keys(report.subtypeCounts).length>0,'choice decomposition should expose subtype counts');

for(const row of report.records){
  assert.equal(row.trackerStatus,'needs-review',`${row.sourceId} should stay fail-closed while this is only a planning decomposition`);
  assert.ok(Array.isArray(row.choiceSubtypes)&&row.choiceSubtypes.length>0,`${row.sourceId} needs at least one choice subtype`);
  assert.ok(Array.isArray(row.implementationCohorts)&&row.implementationCohorts.includes('persistent feature choices'),`${row.sourceId} must actually belong to the persistent-choice cohort`);
}

const totalPrimary=Object.values(report.primarySubtypeCounts||{}).reduce((sum,count)=>sum+count,0);
assert.equal(totalPrimary,report.persistentChoiceRecords,'every persistent-choice record needs exactly one primary subtype for batching');
console.log(`persistent choice decomposition ok (${report.persistentChoiceRecords} records, ${Object.keys(report.subtypeCounts).length} subtypes)`);
