import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const directory=await fs.mkdtemp(path.join(os.tmpdir(),'class-review-coverage35-'));
const queuePath=path.join(directory,'queue.json');
const originalArgs=process.argv;
process.argv=[process.execPath,'scripts/build_class_review_queue.mjs',`--output=${queuePath}`];
try{await import('../scripts/build_class_review_queue.mjs');}finally{process.argv=originalArgs;}
const queue=JSON.parse(await fs.readFile(queuePath,'utf8'));
const byId=new Map(queue.queue.map(entry=>[entry.recordId,entry]));
for(const id of ['classes/arcane-devotee-657','classes/aerial-avenger-980','classes/arboreal-guardian-522','classes/frenzied-berserker-614']){
  const entry=byId.get(id);
  assert(!entry.reasons.includes('missing-reviewed-feature-summaries'),`${id} has reviewed runtime grants`);
  assert(!entry.reasons.includes('missing-verified-training-profile'),`${id} has a reviewed runtime training profile`);
  assert.equal(entry.missingEvidence.length,11,'coverage must not fill certification axes');
  assert.equal(entry.certificationStatus,'blocked');
  assert(entry.blockers.length);
  assert.equal(entry.coverage.features.complete,false,'some reviewed features cannot prove complete feature coverage');
}
assert.equal(queue.total,1054);
assert.equal(queue.queue.filter(entry=>entry.reasons.includes('missing-reviewed-feature-summaries')).length,916);
assert.equal(queue.queue.filter(entry=>entry.reasons.includes('missing-verified-training-profile')).length,843);
assert.equal(byId.get('classes/arcane-archer-378').certificationStatus,'certification-pending');
assert(!byId.get('classes/arcane-archer-378').reasons.includes('missing-verified-training-profile'));
assert(byId.get('classes/binder-112').reasons.includes('binding-subsystem-requires-structured-model'));
assert(byId.get('classes/commoner-24').blockers.some(text=>text.includes('Dragonlance')));

const {resolveClassReviewCoverage35,buildClassReviewClusters35}=await import('../scripts/class_review_coverage35.mjs');
const raw={sourceId:'classes/raw-1',verified:true,referenceOnly:false,levelGrants:[{name:'Raw grant',description:'Some prose'}]};
const unsupported=resolveClassReviewCoverage35({sourceId:raw.sourceId,record:raw});
assert.equal(unsupported.features.hasReviewedEvidence,false);
assert.equal(unsupported.training.hasReviewedEvidence,false);
const reviewed={...raw,proficiencyReview:{verified:true,sourceUrl:'https://example.invalid/raw-1'},levelGrants:[{name:'Reviewed',reviewedSourceUrl:'https://example.invalid/raw-1'}]};
assert.equal(resolveClassReviewCoverage35({sourceId:'classes/other-2',record:reviewed}).features.hasReviewedEvidence,false,'wrong exact record cannot supply evidence');
assert.equal(resolveClassReviewCoverage35({sourceId:'classes/other-2',record:reviewed}).training.hasReviewedEvidence,false);

const entries=[
  {sourceId:'classes/b-2',blockers:['Unmapped exact source concern','No structured vestige selection exists'],missingEvidence:['runtime','runtime'],reasons:['missing-profile','missing-profile']},
  {sourceId:'classes/a-1',blockers:['Unmapped exact source concern'],missingEvidence:['runtime'],reasons:['missing-profile']},
  {sourceId:'classes/b-2',blockers:['Unmapped exact source concern'],missingEvidence:['runtime'],reasons:['missing-profile']}
];
const trackerEntries=[{sourceId:'classes/b-2',implementationCohorts:['choices','choices','binding']},{sourceId:'classes/a-1',implementationCohorts:['choices']}];
const clusters=buildClassReviewClusters35(entries,{trackerEntries});
assert.deepEqual(clusters,buildClassReviewClusters35([...entries].reverse(),{trackerEntries:[...trackerEntries].reverse()}),'clusters must be deterministic across input order');
assert.equal(clusters.uniqueRecordCount,2);
assert.deepEqual(clusters.missingEvidence.find(group=>group.key==='runtime').sourceIds,['classes/a-1','classes/b-2']);
assert.equal(clusters.cohorts.find(group=>group.key==='choices').count,2);
assert.equal(clusters.diagnostics.find(group=>group.key==='missing-profile').count,2);
assert.equal(clusters.blockers.find(group=>group.key==='binding').count,1);
assert.deepEqual(clusters.blockers.find(group=>group.key==='unmapped').blockers,[{text:'Unmapped exact source concern',count:2,sourceIds:['classes/a-1','classes/b-2']}]);
assert(clusters.semantics.cohorts.includes('planning'));
assert(clusters.semantics.counts.includes('overlap'));
assert(queue.clusters.blockers.some(group=>group.key==='unmapped'));
const resistance=buildClassReviewClusters35([{sourceId:'classes/resistance-1',blockers:['Resistance to cold remains incomplete.']}]);
assert.equal(resistance.blockers.length,1);
assert.equal(resistance.blockers[0].key,'unmapped','ordinary resistance prose must not be classified as a martial stance');

const ledgerPath=path.join(directory,'ledger.json');
process.argv=[process.execPath,'scripts/build_class_completion_ledger.mjs',`--output=${ledgerPath}`];
try{await import('../scripts/build_class_completion_ledger.mjs');}finally{process.argv=originalArgs;}
const ledger=JSON.parse(await fs.readFile(ledgerPath,'utf8'));
assert.deepEqual([ledger.total,ledger.certifiedComplete,ledger.blocked,ledger.pending],[1054,0,927,127]);
assert.equal(ledger.clusters.uniqueRecordCount,1054);
assert.equal(ledger.clusters.missingEvidence.length,11);
assert(ledger.clusters.missingEvidence.every(group=>group.count===1054));
for(const entry of ledger.entries){
  const queued=byId.get(entry.sourceId);
  assert.deepEqual(queued.blockers,entry.blockers,'coverage must preserve every original certification blocker');
  assert.deepEqual(queued.missingEvidence,entry.missingEvidence,'coverage must preserve every missing certification axis');
  assert.equal(queued.certificationStatus,entry.status);
  for(const blocker of entry.blockers){
    assert(ledger.clusters.blockers.some(group=>group.blockers.some(item=>item.text===blocker&&item.sourceIds.includes(entry.sourceId))),'every original blocker must be recoverable from the clusters');
  }
}
console.log('class review coverage and deterministic clusters regression passed');
