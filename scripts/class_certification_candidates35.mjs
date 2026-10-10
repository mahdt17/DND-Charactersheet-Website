#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CLASS_ID_RE=/classes\/[a-z0-9][a-z0-9.-]*(?:-\d+|3\.5e)?/gi;
const TEXT_EXTENSIONS=new Set(['.js','.jsx','.mjs','.cjs','.json','.py','.md','.yml','.yaml','.txt']);
const REVIEW_ARTIFACT_NAME=/(review|verification|finalization|candidate|ordinary|wave|class-feature-summaries|class-proficiencies)/i;
const GENERATED_ARTIFACT_NAME=/(class-completion-ledger35|class-review-queue35|class-completion-tracker|class-completion-evidence35|class-certification-candidates35)/i;

const collectClassIds=text=>new Set(String(text||'').match(CLASS_ID_RE)||[]);
const posix=relative=>relative.split(path.sep).join('/');

export async function indexCertificationArtifacts35({root='.',directories=['tests','docs','src/data']}={}){
  const rootPath=path.resolve(root);
  const byId={};
  const add=(sourceId,item)=>{
    if(!byId[sourceId])byId[sourceId]=[];
    if(!byId[sourceId].some(existing=>existing.path===item.path))byId[sourceId].push(item);
  };
  async function walk(relative){
    let entries=[];
    try{entries=await fs.readdir(path.join(rootPath,relative),{withFileTypes:true});}catch{return;}
    for(const entry of entries){
      const child=path.join(relative,entry.name);
      if(entry.isDirectory()){await walk(child);continue;}
      if(!entry.isFile()||!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))continue;
      const normalized=posix(child);
      const isTest=normalized.startsWith('tests/');
      if(!isTest&&!REVIEW_ARTIFACT_NAME.test(entry.name))continue;
      if(GENERATED_ARTIFACT_NAME.test(entry.name))continue;
      let content='';
      try{content=await fs.readFile(path.join(rootPath,child),'utf8');}catch{continue;}
      const kind=isTest?'test':'review';
      for(const sourceId of collectClassIds(content))add(sourceId,{path:normalized,kind});
    }
  }
  for(const directory of directories)await walk(directory);
  for(const items of Object.values(byId))items.sort((a,b)=>a.path.localeCompare(b.path)||a.kind.localeCompare(b.kind));
  return Object.fromEntries(Object.entries(byId).sort(([a],[b])=>a.localeCompare(b)));
}

export function buildCertificationCandidateReport35(ledger,artifactIndex={}){
  const pending=(ledger.entries||[])
    .filter(entry=>entry?.status==='certification-pending'&&!entry?.certified)
    .sort((a,b)=>String(a.sourceId).localeCompare(String(b.sourceId)));
  const records=pending.map(entry=>{
    const artifacts=artifactIndex[entry.sourceId]||[];
    const testPaths=artifacts.filter(item=>item.kind==='test').map(item=>item.path).sort();
    const reviewPaths=artifacts.filter(item=>item.kind==='review').map(item=>item.path).sort();
    return {
      recordId:entry.sourceId,
      name:entry.name||null,
      testPaths,
      reviewPaths,
      exactArtifactPaths:[...new Set([...testPaths,...reviewPaths])].sort(),
      readyForAutomaticCertification:false
    };
  });
  return {
    schemaVersion:1,
    pending:records.length,
    withExactArtifacts:records.filter(row=>row.exactArtifactPaths.length>0).length,
    withDeterministicTests:records.filter(row=>row.testPaths.length>0).length,
    withReviewedArtifacts:records.filter(row=>row.reviewPaths.length>0).length,
    records
  };
}

async function runCli(){
  const args=process.argv.slice(2);
  const ledgerPath=args.find(arg=>!arg.startsWith('--'))||'test-results/class-completion-ledger35.json';
  const outputArg=args.find(arg=>arg.startsWith('--output='));
  const rootArg=args.find(arg=>arg.startsWith('--root='));
  const root=rootArg?rootArg.split('=').slice(1).join('='):process.cwd();
  const ledger=JSON.parse(await fs.readFile(ledgerPath,'utf8'));
  const index=await indexCertificationArtifacts35({root});
  const report={...buildCertificationCandidateReport35(ledger,index),generatedAt:new Date().toISOString(),sourceLedger:ledgerPath};
  const out=JSON.stringify(report,null,2)+'\n';
  if(outputArg)await fs.writeFile(outputArg.split('=').slice(1).join('='),out);else process.stdout.write(out);
}

const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked)await runCli();
