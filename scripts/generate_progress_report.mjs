#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const trackerPath=args.find(a=>!a.startsWith('--'))||'docs/class-completion-tracker.json';
const outputArg=args.find(a=>a.startsWith('--output='));
const tracker=JSON.parse(fs.readFileSync(trackerPath,'utf8'));
const entries=tracker.entries||[];
const by=field=>entries.reduce((acc,e)=>{const k=String(e[field]??'unknown');acc[k]=(acc[k]||0)+1;return acc;},{});
const complete=entries.filter(e=>e.status==='complete').length;
const reviewStates=new Set(['reviewed_partial','needs-review','source-conflict','validation-failed','failed-extraction','unresolved-source','regression-failed','blocked']);
const needsReview=entries.filter(e=>reviewStates.has(e.status)).length;
const pending=entries.length-complete-needsReview;
const report={schemaVersion:1,generatedAt:new Date().toISOString(),repository:tracker.repository,branch:tracker.branch,pullRequest:tracker.pullRequest,snapshotCommit:tracker.snapshotCommit,classes:{total:entries.length,verified:complete,needsReview,pending,completionPercent:entries.length?Number((complete*100/entries.length).toFixed(2)):0,byStatus:by('status'),byValidation:by('validation'),byFeatureIntegration:by('featureIntegration'),bySheetAutomation:by('sheetAutomation')},blockers:{sourceConflicts:entries.filter(e=>e.status==='source-conflict').length,failedExtractions:entries.filter(e=>e.status==='failed-extraction').length,unresolvedSources:entries.filter(e=>e.status==='unresolved-source').length,regressionFailures:entries.filter(e=>e.status==='regression-failed').length,blocked:entries.filter(e=>e.status==='blocked').length},currentWork:entries.filter(e=>e.status!=='complete'&&e.status!=='pending_audit').slice(0,50).map(e=>({recordId:e.sourceId,name:e.name,status:e.status,nextAction:e.nextAction||null,gaps:e.gaps||[]}))};
const out=JSON.stringify(report,null,2)+'\n';
if(outputArg)fs.writeFileSync(outputArg.split('=')[1],out);else process.stdout.write(out);
