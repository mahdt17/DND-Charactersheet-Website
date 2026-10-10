#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as certificationModule from '../scripts/class_completion_certification35.mjs';
const {REQUIRED_CLASS_EVIDENCE35,certifyClassEvidence35,buildClassCompletionLedger35,reviewedArtifactIds35}=certificationModule;

const fullEvidence=Object.fromEntries(REQUIRED_CLASS_EVIDENCE35.map(axis=>[axis,[`tests/${axis}.mjs`]]));
const trackerEntry={sourceId:'classes/example-1',name:'Example',status:'complete',gaps:[],verifiedCommit:'abc',ciRunUrl:'https://example.invalid/ci'};
const validProof={sourceId:trackerEntry.sourceId,certify:true,evidence:fullEvidence,evidencePaths:REQUIRED_CLASS_EVIDENCE35.map(axis=>`tests/${axis}.mjs`),verifiedCommit:'a'.repeat(40),ciRunUrl:'https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/123456789'};
for(const value of [{},true,1,' ',[],[' '],[{}],['tests/ui.mjs',false]]){
  const result=certifyClassEvidence35({trackerEntry,evidenceEntry:{...validProof,evidence:{...fullEvidence,ui:value}}});
  assert.equal(result.certified,false,`invalid evidence shape must not certify: ${JSON.stringify(value)}`);
  assert(result.missingEvidence.includes('ui'));
}
for(const patch of [
  {sourceId:undefined},{sourceId:'classes/other-2'},
  {verifiedCommit:undefined},{verifiedCommit:'abc'},{verifiedCommit:'z'.repeat(40)},
  {verifiedCommit:['a'.repeat(40)]},{ciRunUrl:[validProof.ciRunUrl]},
  {ciRunUrl:undefined},{ciRunUrl:'https://github.com/other/repo/actions/runs/123'},
  {ciRunUrl:'https://github.com/mahdt17/DND-Charactersheet-Website/pull/8'},
  {evidencePaths:[]},{evidencePaths:['tests/ui.mjs',null]},
  {evidencePaths:[...validProof.evidencePaths,'../outside.mjs']},
  {evidence:{...fullEvidence,ui:'tests/not-declared.mjs'}}
])assert.equal(certifyClassEvidence35({trackerEntry:{...trackerEntry,verifiedCommit:validProof.verifiedCommit,ciRunUrl:validProof.ciRunUrl},evidenceEntry:{...validProof,...patch}}).certified,false,`invalid proof must not use tracker metadata fallback: ${JSON.stringify(patch)}`);
const explicitBlocked=certifyClassEvidence35({trackerEntry:{...trackerEntry,status:'blocked'},evidenceEntry:validProof});
assert.equal(explicitBlocked.certified,false,'explicit blocked tracker status must remain a blocker even when gaps are empty');
assert(explicitBlocked.blockers.includes('blocked'));

const weak=certifyClassEvidence35({trackerEntry,evidenceEntry:null});
assert.equal(weak.certified,false,'tracker complete status alone must never certify');
assert.equal(weak.status,'certification-pending');
assert.deepEqual(weak.missingEvidence,REQUIRED_CLASS_EVIDENCE35);

const missing=certifyClassEvidence35({trackerEntry,evidenceEntry:{...validProof,evidence:{...fullEvidence,ui:[]}}});
assert.equal(missing.certified,false,'missing one proof axis must fail closed');
assert.deepEqual(missing.missingEvidence,['ui']);

const blocked=certifyClassEvidence35({trackerEntry:{...trackerEntry,gaps:['live combat effect not modeled']},evidenceEntry:{certify:true,evidence:fullEvidence}});
assert.equal(blocked.status,'blocked');
assert.equal(blocked.certified,false);
assert(blocked.blockers.includes('live combat effect not modeled'));

const certified=certifyClassEvidence35({trackerEntry,evidenceEntry:validProof});
assert.equal(certified.status,'certified-complete');
assert.equal(certified.certified,true);
assert.deepEqual(certified.missingEvidence,[]);
assert.deepEqual(certified.blockers,[]);
assert.deepEqual(certified.evidenceValidationErrors,[]);
assert.equal(certifyClassEvidence35({trackerEntry,evidenceEntry:{...validProof,evidence:{...fullEvidence,ui:'tests/ui.mjs'}}}).certified,true,'one declared reference string is allowed');

const ledger=buildClassCompletionLedger35({entries:[
  trackerEntry,
  {sourceId:'classes/blocked-2',name:'Blocked',status:'pending_audit',gaps:['manual subsystem remains']}
]},{entries:{'classes/example-1':validProof}});
assert.equal(ledger.total,2);
assert.equal(ledger.certifiedComplete,1);
assert.equal(ledger.blocked,1);
assert.deepEqual(ledger.entries.map(entry=>entry.sourceId),['classes/blocked-2','classes/example-1'],'ledger ordering must be stable by source ID');

assert.equal(typeof certificationModule.validateCompletionQueue35,'function','queue validation must support real certification, not require every tracker record');
const {validateCompletionQueue35}=certificationModule;
const queueTracker={entries:[trackerEntry,{sourceId:'classes/blocked-2',status:'pending_audit'}]};
const correctQueue={total:1,queue:[{recordId:'classes/blocked-2',certificationStatus:'blocked',reasons:[]}]};
assert.deepEqual(validateCompletionQueue35(queueTracker,ledger,correctQueue),[]);
for(const queue of [
  {total:0,queue:[]},
  {total:2,queue:[...correctQueue.queue,...correctQueue.queue]},
  {total:2,queue:[...correctQueue.queue,{recordId:trackerEntry.sourceId}]},
  {total:1,queue:[{...correctQueue.queue[0],certificationStatus:'certification-pending'}]}
])assert(validateCompletionQueue35(queueTracker,ledger,queue).length,'invalid queue must fail');
const pendingLedger=buildClassCompletionLedger35({entries:[trackerEntry]});
assert(validateCompletionQueue35({entries:[trackerEntry]},pendingLedger,{total:1,queue:[{recordId:trackerEntry.sourceId,certificationStatus:'certification-pending',reasons:[]}]}).length,'uncertified legacy complete must retain warning');

const root=await fs.mkdtemp(path.join(os.tmpdir(),'class-cert35-'));
const trackerFile=path.join(root,'tracker.json'),evidenceFile=path.join(root,'evidence.json'),queueFile=path.join(root,'queue.json');
await fs.writeFile(trackerFile,JSON.stringify(queueTracker));
await fs.writeFile(evidenceFile,JSON.stringify({entries:{[trackerEntry.sourceId]:validProof}}));
const originalArgs=process.argv;
process.argv=[process.execPath,'scripts/build_class_review_queue.mjs',trackerFile,`--evidence=${evidenceFile}`,`--output=${queueFile}`];
try{await import('../scripts/build_class_review_queue.mjs?certification-fixture');}finally{process.argv=originalArgs;}
const generated=JSON.parse(await fs.readFile(queueFile,'utf8'));
assert.equal(generated.total,1,'a structurally certified fixture leaves the actual generated queue');
assert.deepEqual(generated.queue.map(row=>row.recordId),['classes/blocked-2']);
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
