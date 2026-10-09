import fs from 'node:fs/promises';
import path from 'node:path';

export const REQUIRED_CLASS_EVIDENCE35=[
  'sourceIdentity','prerequisites','training','mechanics','choices','progression','runtime','ui','persistence','cleanup','regressions'
];

const list=value=>Array.isArray(value)?value.filter(Boolean):value?[value]:[];
const hasEvidence=value=>Array.isArray(value)?value.some(Boolean):typeof value==='string'?value.trim().length>0:Boolean(value);

export function certifyClassEvidence35({trackerEntry=null,evidenceEntry=null}={}){
  const evidence=evidenceEntry?.evidence||{};
  const blockers=[...new Set([
    ...list(evidenceEntry?.blockers),
    ...list(trackerEntry?.gaps),
    ...(trackerEntry?.status==='source-conflict'?['source-conflict']:[]),
    ...(trackerEntry?.status==='failed-extraction'?['failed-extraction']:[]),
    ...(trackerEntry?.status==='unresolved-source'?['unresolved-source']:[]),
    ...(trackerEntry?.status==='validation-failed'?['validation-failed']:[])
  ])];
  const missingEvidence=REQUIRED_CLASS_EVIDENCE35.filter(axis=>!hasEvidence(evidence[axis]));
  const evidencePaths=[...new Set(list(evidenceEntry?.evidencePaths))];
  const certified=Boolean(evidenceEntry?.certify===true)&&!blockers.length&&!missingEvidence.length;
  return {
    status:blockers.length?'blocked':certified?'certified-complete':'certification-pending',
    certified,
    missingEvidence,
    blockers,
    evidencePaths,
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

export async function reviewedArtifactIds35({root='.',directories=['docs','src/data']}={}){
  const ids=new Set();
  const artifactName=/(review|verification|finalization|candidate|ordinary|wave|completion)/i;
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
