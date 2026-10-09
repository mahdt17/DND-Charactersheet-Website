#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {REQUIRED_CLASS_EVIDENCE35,certifyClassEvidence35,buildClassCompletionLedger35,reviewedArtifactIds35} from '../scripts/class_completion_certification35.mjs';

const fullEvidence=Object.fromEntries(REQUIRED_CLASS_EVIDENCE35.map(axis=>[axis,[`tests/${axis}.mjs`]]));
const trackerEntry={sourceId:'classes/example-1',name:'Example',status:'complete',gaps:[],verifiedCommit:'abc',ciRunUrl:'https://example.invalid/ci'};

const weak=certifyClassEvidence35({trackerEntry,evidenceEntry:null});
assert.equal(weak.certified,false,'tracker complete status alone must never certify');
assert.equal(weak.status,'certification-pending');
assert.deepEqual(weak.missingEvidence,REQUIRED_CLASS_EVIDENCE35);

const missing=certifyClassEvidence35({trackerEntry,evidenceEntry:{certify:true,evidence:{...fullEvidence,ui:[]}}});
assert.equal(missing.certified,false,'missing one proof axis must fail closed');
assert.deepEqual(missing.missingEvidence,['ui']);

const blocked=certifyClassEvidence35({trackerEntry:{...trackerEntry,gaps:['live combat effect not modeled']},evidenceEntry:{certify:true,evidence:fullEvidence}});
assert.equal(blocked.status,'blocked');
assert.equal(blocked.certified,false);
assert(blocked.blockers.includes('live combat effect not modeled'));

const certified=certifyClassEvidence35({trackerEntry,evidenceEntry:{certify:true,evidence:fullEvidence,evidencePaths:['tests/example.mjs'],verifiedCommit:'def',ciRunUrl:'https://example.invalid/new-ci'}});
assert.equal(certified.status,'certified-complete');
assert.equal(certified.certified,true);
assert.deepEqual(certified.missingEvidence,[]);
assert.deepEqual(certified.blockers,[]);

const ledger=buildClassCompletionLedger35({entries:[
  trackerEntry,
  {sourceId:'classes/blocked-2',name:'Blocked',status:'pending_audit',gaps:['manual subsystem remains']}
]},{entries:{'classes/example-1':{certify:true,evidence:fullEvidence}}});
assert.equal(ledger.total,2);
assert.equal(ledger.certifiedComplete,1);
assert.equal(ledger.blocked,1);
assert.deepEqual(ledger.entries.map(entry=>entry.sourceId),['classes/blocked-2','classes/example-1'],'ledger ordering must be stable by source ID');

const root=await fs.mkdtemp(path.join(os.tmpdir(),'class-cert35-'));
await fs.mkdir(path.join(root,'docs'),{recursive:true});
await fs.mkdir(path.join(root,'src/data'),{recursive:true});
await fs.writeFile(path.join(root,'docs','class-source-verification-batch.json'),JSON.stringify({records:[{recordId:'classes/reviewed-7'}]}));
await fs.writeFile(path.join(root,'src/data','class-reviewed-overrides-35-wave.json'),JSON.stringify({entries:{'classes/reviewed-8':{verified:true}}}));
await fs.writeFile(path.join(root,'docs','unrelated.json'),JSON.stringify({recordId:'classes/not-reviewed-9'}));
const artifactIds=await reviewedArtifactIds35({root});
assert(artifactIds.has('classes/reviewed-7'));
assert(artifactIds.has('classes/reviewed-8'));
assert(!artifactIds.has('classes/not-reviewed-9'),'unrelated JSON must not be treated as review evidence');

console.log('class completion certification regression passed');
