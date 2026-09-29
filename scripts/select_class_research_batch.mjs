#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const trackerPath=args.find(a=>!a.startsWith('--'))||'docs/class-completion-tracker.json';
const limit=Number((args.find(a=>a.startsWith('--limit='))||'--limit=25').split('=')[1])||25;
const tracker=JSON.parse(fs.readFileSync(trackerPath,'utf8'));
const eligible=new Set(['pending_audit','needs-review','failed-extraction','unresolved-source','source-conflict','validation-failed','reviewed_partial']);
const priority={reviewed_partial:0,'validation-failed':1,'failed-extraction':2,'source-conflict':3,'unresolved-source':4,'needs-review':5,pending_audit:6};
const records=tracker.entries.filter(e=>eligible.has(e.status)).sort((a,b)=>(priority[a.status]??99)-(priority[b.status]??99)||String(a.sourceId).localeCompare(String(b.sourceId))).slice(0,limit).map(e=>({
 recordId:e.sourceId,recordName:e.name,edition:'3.5',contentType:'class',sourceUrl:e.sourceUrl,currentStatus:e.status,sourceBook:e.sourceBook||null,preserveVerifiedWork:true,
 expectations:{minChars:800,requiredSections:['Class Skills'],requireTable:true,maxLevel:20}
}));
console.log(JSON.stringify({schemaVersion:1,sourceTracker:trackerPath,snapshotCommit:tracker.snapshotCommit||null,requestedLimit:limit,selected:records.length,routing:['exa-discovery','tavily-extraction','deterministic-validation','alternate-source-or-retry','firecrawl-last-resort'],records},null,2));
