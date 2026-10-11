#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const json=args.includes('--json');

const tracker=JSON.parse(fs.readFileSync(path.join(root,'docs','class-completion-tracker.json'),'utf8'));
const dataDir=path.join(root,'src','data');
const overrideFiles=fs.readdirSync(dataDir)
  .filter(name=>/^class-reviewed-overrides-35.*\.json$/i.test(name))
  .sort();

const reviewed=new Map();
for(const file of overrideFiles){
  const artifact=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'));
  for(const [sourceId,entry] of Object.entries(artifact.entries||{})){
    if(reviewed.has(sourceId))throw new Error(`Duplicate reviewed runtime override for ${sourceId}: ${reviewed.get(sourceId).file} and ${file}`);
    reviewed.set(sourceId,{file,entry});
  }
}

const text=value=>typeof value==='string'&&value.trim().length>0;
const list=value=>Array.isArray(value)?value:[];
const uniq=values=>[...new Set(values.filter(text))];
const planningText=entry=>uniq([
  ...list(entry?.gaps),
  ...list(entry?.dependencies),
  entry?.nextAction,
]);
const staleForAxis=(axis,items)=>{
  const patterns={
    prerequisites:/prerequisite|entry gate|entry rule|entry requirement|eligibility/i,
    training:/proficienc|training|class skill/i,
  };
  return items.filter(item=>patterns[axis].test(item));
};

const trackerById=new Map((tracker.entries||[]).map(entry=>[entry.sourceId,entry]));
const records=[];
for(const [sourceId,{file,entry}] of reviewed){
  const tracked=trackerById.get(sourceId)||null;
  const review=entry?.reviewEvidence||{};
  const resolvedPlanningAxes=[];
  if(list(entry?.prerequisites).length&&text(review?.requirementsUrl||review?.sourceUrl))resolvedPlanningAxes.push('prerequisites');
  if(Array.isArray(entry?.proficiencies)&&list(entry?.classSkills).length&&text(review?.classSkillsUrl||review?.sourceUrl))resolvedPlanningAxes.push('training');
  const blockers=planningText(tracked);
  const stalePlanning={};
  for(const axis of resolvedPlanningAxes){
    const matches=staleForAxis(axis,blockers);
    if(matches.length)stalePlanning[axis]=matches;
  }
  records.push({
    sourceId,
    name:entry?.name||tracked?.name||sourceId,
    trackerStatus:tracked?.status||null,
    reviewBatch:entry?.reviewBatch||null,
    reviewArtifact:`src/data/${file}`,
    runtimeReviewed:true,
    resolvedPlanningAxes,
    stalePlanning,
    remainingBlockers:blockers.filter(item=>!Object.values(stalePlanning).flat().includes(item)),
  });
}
records.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));

const report={
  schemaVersion:1,
  semantics:{
    purpose:'Read-only planning audit. Reviewed runtime evidence can identify stale planning text, but never certifies or promotes a class.',
    remainingBlockers:'Tracker gaps, dependencies, and nextAction after removing text that refers only to a reviewed prerequisite/training axis.',
  },
  totalTrackerRecords:(tracker.entries||[]).length,
  reviewedRuntimeRecords:records.length,
  staleRecordCount:records.filter(row=>Object.keys(row.stalePlanning).length).length,
  mutatesTracker:false,
  certifiesClasses:false,
  records,
};

if(json)process.stdout.write(JSON.stringify(report,null,2)+'\n');
else{
  console.log(`Reviewed runtime records: ${report.reviewedRuntimeRecords}`);
  console.log(`Records with stale planning text: ${report.staleRecordCount}`);
  for(const row of records.filter(item=>Object.keys(item.stalePlanning).length)){
    console.log(`${row.sourceId}: ${Object.keys(row.stalePlanning).join(', ')}`);
  }
}
