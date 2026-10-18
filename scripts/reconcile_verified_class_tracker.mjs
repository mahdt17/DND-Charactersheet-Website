import fs from 'node:fs';
import assert from 'node:assert/strict';

const path='docs/class-completion-tracker.json';
const original=JSON.parse(fs.readFileSync(path,'utf8'));
const tracker=structuredClone(original);
const ids=new Set(['classes/arcane-archer-378','classes/dervish-309','classes/frenzied-berserker-313','classes/great-rift-deep-defender-792']);
const verifiedCommit='dc748a6ae8557ecd357dccab661757d951a3d932';
const ciRunUrl='https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37389875845';
assert.equal(tracker.entries.length,1054);
assert.equal(tracker.entries.filter(e=>ids.has(e.sourceId)).length,4);
let changed=0;
for(const entry of tracker.entries){
  if(!ids.has(entry.sourceId))continue;
  if(entry.status==='complete'){
    assert.equal(entry.verifiedCommit,verifiedCommit);
    assert.equal(entry.ciRunUrl,ciRunUrl);
    continue;
  }
  assert.equal(entry.status,'needs-review');
  Object.assign(entry,{status:'complete',sourceReview:'verified',featureIntegration:'complete',sheetAutomation:'complete',validation:'passed',gaps:[],verifiedCommit,ciRunUrl,nextAction:'Maintain exact-source lifecycle and conditional-mechanics regression coverage.'});
  entry.evidence.push('Reconciled against verified implementation '+verifiedCommit+' and successful modernization CI run 37389875845; exact-source core and martial regression suites verified again in GitHub Actions.');
  changed++;
}
for(let i=0;i<tracker.entries.length;i++){
  if(!ids.has(tracker.entries[i].sourceId))assert.deepEqual(tracker.entries[i],original.entries[i]);
}
for(const key of Object.keys(original).filter(k=>k!=='entries'))assert.deepEqual(tracker[key],original[key]);
if(changed)fs.writeFileSync(path,JSON.stringify(tracker,null,2)+'\n');
console.log(JSON.stringify({reconciled:changed,needsReviewBefore:original.entries.filter(e=>e.status==='needs-review').length,needsReviewAfter:tracker.entries.filter(e=>e.status==='needs-review').length}));
