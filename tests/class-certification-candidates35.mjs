#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {indexCertificationArtifacts35,buildCertificationCandidateReport35} from '../scripts/class_certification_candidates35.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'class-cert-candidates35-'));
for(const dir of ['tests','docs','src/data'])await fs.mkdir(path.join(root,dir),{recursive:true});
await fs.writeFile(path.join(root,'tests','alpha-regression.mjs'),'// classes/alpha-1 exact runtime regression\n// classes/blocked-3 stays blocked\n');
await fs.writeFile(path.join(root,'docs','alpha-review.json'),JSON.stringify({recordId:'classes/alpha-1'}));
await fs.writeFile(path.join(root,'src/data','beta-review-wave.json'),JSON.stringify({entries:{'classes/beta-2':{verified:true}}}));
await fs.writeFile(path.join(root,'docs','class-review-queue35.json'),JSON.stringify({recordId:'classes/beta-2'}));
await fs.writeFile(path.join(root,'tests','near-match.mjs'),'// classes/alpha-10 must not count as alpha-1\n');

const index=await indexCertificationArtifacts35({root});
assert.deepEqual(index['classes/alpha-1'].map(item=>item.path),['docs/alpha-review.json','tests/alpha-regression.mjs']);
assert.deepEqual(index['classes/beta-2'].map(item=>item.path),['src/data/beta-review-wave.json']);
assert.deepEqual(index['classes/alpha-10'].map(item=>item.path),['tests/near-match.mjs']);
assert(!index['classes/beta-2'].some(item=>item.path==='docs/class-review-queue35.json'),'generated queue output must not become circular certification evidence');

const ledger={entries:[
  {sourceId:'classes/alpha-1',name:'Alpha',status:'certification-pending',certified:false},
  {sourceId:'classes/beta-2',name:'Beta',status:'certification-pending',certified:false},
  {sourceId:'classes/blocked-3',name:'Blocked',status:'blocked',certified:false},
  {sourceId:'classes/certified-4',name:'Certified',status:'certified-complete',certified:true}
]};
const report=buildCertificationCandidateReport35(ledger,index);
assert.equal(report.pending,2);
assert.equal(report.withExactArtifacts,2);
assert.equal(report.withDeterministicTests,1);
assert.equal(report.withReviewedArtifacts,2);
assert.deepEqual(report.records.map(row=>row.recordId),['classes/alpha-1','classes/beta-2']);
assert.deepEqual(report.records[0].testPaths,['tests/alpha-regression.mjs']);
assert.deepEqual(report.records[0].reviewPaths,['docs/alpha-review.json']);
assert.deepEqual(report.records[1].testPaths,[]);
assert.deepEqual(report.records[1].reviewPaths,['src/data/beta-review-wave.json']);
assert.equal(report.records.some(row=>row.recordId==='classes/blocked-3'),false,'blocked classes belong in blocker remediation, not certification candidates');
assert.equal(report.records.some(row=>row.recordId==='classes/certified-4'),false,'already certified classes must not remain candidates');

console.log('class certification candidate inventory regression passed');
