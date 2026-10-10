import fs from 'node:fs/promises';
import path from 'node:path';

export const REQUIRED_CLASS_EVIDENCE35=[
  'sourceIdentity','prerequisites','training','mechanics','choices','progression','runtime','ui','persistence','cleanup','regressions'
];

const list=value=>Array.isArray(value)?value.filter(Boolean):value?[value]:[];
const reference=value=>typeof value==='string'&&value===value.trim()&&/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(value)&&!value.split('/').some(part=>part==='.'||part==='..');
const references=value=>typeof value==='string'?[value]:Array.isArray(value)?value:[];
const hasEvidence=value=>references(value).length>0&&references(value).every(reference);

export function certifyClassEvidence35({trackerEntry=null,evidenceEntry=null}={}){
  const evidence=evidenceEntry?.evidence||{};
  const blockers=[...new Set([
    ...list(evidenceEntry?.blockers),
    ...list(trackerEntry?.gaps),
    ...(trackerEntry?.status==='blocked'?['blocked']:[]),
    ...(trackerEntry?.status==='source-conflict'?['source-conflict']:[]),
    ...(trackerEntry?.status==='failed-extraction'?['failed-extraction']:[]),
    ...(trackerEntry?.status==='unresolved-source'?['unresolved-source']:[]),
    ...(trackerEntry?.status==='validation-failed'?['validation-failed']:[])
  ])];
  const missingEvidence=REQUIRED_CLASS_EVIDENCE35.filter(axis=>!hasEvidence(evidence[axis]));
  const evidencePaths=[...new Set(references(evidenceEntry?.evidencePaths).filter(reference))];
  const evidenceValidationErrors=[];
  if(evidenceEntry!=null){
    if(!trackerEntry?.sourceId||evidenceEntry.sourceId!==trackerEntry.sourceId)evidenceValidationErrors.push('exact-source-id-required');
    if(typeof evidenceEntry.verifiedCommit!=='string'||!/^[a-f0-9]{40}$/i.test(evidenceEntry.verifiedCommit))evidenceValidationErrors.push('verified-commit-required');
    if(typeof evidenceEntry.ciRunUrl!=='string'||!/^https:\/\/github\.com\/mahdt17\/DND-Charactersheet-Website\/actions\/runs\/[1-9]\d*$/.test(evidenceEntry.ciRunUrl))evidenceValidationErrors.push('repository-ci-run-required');
    if(!hasEvidence(evidenceEntry.evidencePaths))evidenceValidationErrors.push('declared-evidence-paths-required');
    for(const axis of REQUIRED_CLASS_EVIDENCE35){
      if(hasEvidence(evidence[axis])&&references(evidence[axis]).some(ref=>!evidencePaths.includes(ref)))evidenceValidationErrors.push('undeclared-axis-reference:'+axis);
    }
  }
  const certified=Boolean(evidenceEntry?.certify===true)&&!blockers.length&&!missingEvidence.length&&!evidenceValidationErrors.length;
  return {
    status:blockers.length?'blocked':certified?'certified-complete':'certification-pending',
    certified,
    missingEvidence,
    blockers,
    evidencePaths,
    evidenceValidationErrors,
    verifiedCommit:evidenceEntry?.verifiedCommit||trackerEntry?.verifiedCommit||null,
    ciRunUrl:evidenceEntry?.ciRunUrl||trackerEntry?.ciRunUrl||null
  };
}

const collectIds=(value,out)=>{
  if(typeof value==='string'){
    const matches=value.match(/classes\/[a-z0-9][a-z0-9.-]*(?:-\d+|3\.5e)?/gi)||[];
    for(const id of matches)out.add(id);
    return;
  }
  if(Array.isArray(value)){for(const item of value)collectIds(item,out);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
    if(/^classes\//i.test(key))out.add(key);
    if(['sourceId','recordId','classId'].includes(key)&&typeof item==='string'&&/^classes\//i.test(item))out.add(item);
    collectIds(item,out);
  }
};

export function validateCompletionQueue35(tracker,ledger,queue){
  const errors=[];
  const exactSet=(rows,key,label)=>{
    const ids=rows.map(row=>row[key]);
    if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)errors.push(label+'-invalid-or-duplicate-ids');
    return new Set(ids);
  };
  const tracked=exactSet(tracker.entries||[],'sourceId','tracker');
  const recorded=exactSet(ledger.entries||[],'sourceId','ledger');
  const queued=exactSet(queue.queue||[],'recordId','queue');
  const same=(a,b)=>a.size===b.size&&[...a].every(id=>b.has(id));
  if(ledger.total!==(tracker.entries||[]).length||ledger.total!==(ledger.entries||[]).length||!same(tracked,recorded))errors.push('ledger-tracker-mismatch');
  const pending=new Set((ledger.entries||[]).filter(entry=>!entry.certified).map(entry=>entry.sourceId));
  if(queue.total!==(queue.queue||[]).length||!same(pending,queued))errors.push('queue-uncertified-set-mismatch');
  const byId=new Map((ledger.entries||[]).map(entry=>[entry.sourceId,entry]));
  for(const entry of queue.queue||[]){
    if(entry.certificationStatus!==byId.get(entry.recordId)?.status)errors.push('queue-status-mismatch:'+entry.recordId);
    if((tracker.entries||[]).some(row=>row.sourceId===entry.recordId&&row.status==='complete')&&!entry.reasons?.includes('tracker-complete-is-not-certification'))errors.push('missing-legacy-complete-warning:'+entry.recordId);
  }
  return errors;
}

export async function reviewedArtifactIds35({root='.',directories=['docs','src/data']}={}){
  const ids=new Set();
  const artifactName=/(review|verification|finalization|candidate|ordinary|wave)/i;
  async function walk(relative){
    let entries=[];
    try{entries=await fs.readdir(path.join(root,relative),{withFileTypes:true});}catch{return;}
    for(const entry of entries){
      const child=path.join(relative,entry.name);
      if(entry.isDirectory()){await walk(child);continue;}
      if(!entry.name.endsWith('.json')||!artifactName.test(entry.name))continue;
      try{collectIds(JSON.parse(await fs.readFile(path.join(root,child),'utf8')),ids);}catch{}
    }
  }
  for(const directory of directories)await walk(directory);
  return ids;
}

export function buildClassCompletionLedger35(tracker,evidenceManifest={}){
  const evidenceById=evidenceManifest.entries||{};
  const entries=(tracker.entries||[]).map(entry=>{
    const certification=certifyClassEvidence35({trackerEntry:entry,evidenceEntry:evidenceById[entry.sourceId]});
    return {
      sourceId:entry.sourceId,
      name:entry.name,
      trackerStatus:entry.status,
      sourceBook:entry.sourceBook||null,
      sourceUrl:entry.sourceUrl||null,
      ...certification,
      nextAction:entry.nextAction||null
    };
  }).sort((a,b)=>String(a.sourceId).localeCompare(String(b.sourceId)));
  return {
    schemaVersion:1,
    requiredEvidence:[...REQUIRED_CLASS_EVIDENCE35],
    total:entries.length,
    certifiedComplete:entries.filter(entry=>entry.certified).length,
    blocked:entries.filter(entry=>entry.status==='blocked').length,
    pending:entries.filter(entry=>entry.status==='certification-pending').length,
    entries
  };
}
