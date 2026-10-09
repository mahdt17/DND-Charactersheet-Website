#!/usr/bin/env node
import fs from 'node:fs/promises';
import proficiencySupplements35 from '../src/data/class-proficiencies35.json' with {type:'json'};
import featureSummaries35 from '../src/data/class-feature-summaries-35.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {progressionTables} from '../src/lib/advancement.js';
import {certifyClassEvidence35} from './class_completion_certification35.mjs';

const args=process.argv.slice(2);
const trackerPath=args.find(a=>!a.startsWith('--'))||'docs/class-completion-tracker.json';
const evidencePath=(args.find(a=>a.startsWith('--evidence='))||'--evidence=docs/class-completion-evidence35.json').split('=')[1];
const outputArg=args.find(a=>a.startsWith('--output='));
const tracker=JSON.parse(await fs.readFile(trackerPath,'utf8'));
const evidenceManifest=JSON.parse(await fs.readFile(evidencePath,'utf8'));
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const byId=new Map(classes.map(r=>[r.sourceId,r]));
const supplements=proficiencySupplements35.entries||{};
const norm=s=>String(s||'').toLowerCase();
const raw=record=>[record?.description,record?.sourceDescription,record?.effect,...progressionTables(record||{}).flat(3)].filter(Boolean).join(' ');
const family=record=>{const t=norm(raw(record)),out=[];for(const [name,re] of [['binding',/vestiges?|soul binding|binder level/],['incarnum',/soulmeld|essentia|chakra bind/],['psionics',/power points|powers? known|manifester level|psionic/],['invocations',/invocations? known|eldritch blast/],['maneuvers',/maneuvers? known|maneuvers? readied|stances? known|initiator level/]])if(re.test(t))out.push(name);return out;};
const queue=[];
for(const entry of tracker.entries||[]){
 const certification=certifyClassEvidence35({trackerEntry:entry,evidenceEntry:evidenceManifest.entries?.[entry.sourceId]});
 if(certification.certified)continue;
 const record=byId.get(entry.sourceId),reasons=[],families=family(record);
 const summaries=Array.isArray(featureSummaries35[entry.sourceId])?featureSummaries35[entry.sourceId]:[];
 const supplement=supplements[entry.sourceId];
 if(!record)reasons.push('catalog-record-missing');
 if(!summaries.length)reasons.push('missing-reviewed-feature-summaries');
 if(!supplement?.verified)reasons.push('missing-verified-training-profile');
 if(families.includes('binding')){reasons.push('binding-subsystem-requires-structured-model');if(/pact augmentation/i.test(raw(record)))reasons.push('repeatable-choice-not-representable-by-generic-checkbox-choice');}
 if(families.includes('incarnum'))reasons.push('incarnum-subsystem-requires-structured-model');
 if(families.includes('psionics')&&!summaries.length)reasons.push('psionics-needs-reviewed-mechanics');
 if(families.includes('invocations')&&!summaries.length)reasons.push('invocations-needs-reviewed-mechanics');
 if(families.includes('maneuvers'))reasons.push('maneuver-subsystem-requires-structured-model');
 if(entry.status==='source-conflict')reasons.push('source-conflict');
 if(entry.status==='failed-extraction')reasons.push('failed-extraction');
 if(entry.status==='unresolved-source')reasons.push('unresolved-source');
 if(entry.status==='validation-failed')reasons.push('validation-failed');
 reasons.push(...certification.blockers);
 reasons.push(...certification.missingEvidence.map(axis=>`missing-certification-evidence:${axis}`));
 if(entry.status==='complete'&&!certification.certified)reasons.push('tracker-complete-is-not-certification');
 queue.push({
   recordId:entry.sourceId,
   name:entry.name,
   status:entry.status,
   certificationStatus:certification.status,
   sourceUrl:entry.sourceUrl,
   mechanicFamilies:families,
   evidencePaths:certification.evidencePaths,
   missingEvidence:certification.missingEvidence,
   blockers:certification.blockers,
   reasons:[...new Set(reasons)],
   nextAction:entry.nextAction||null
 });
}
queue.sort((a,b)=>String(a.recordId).localeCompare(String(b.recordId)));
const report={schemaVersion:2,generatedAt:new Date().toISOString(),sourceTracker:trackerPath,sourceEvidence:evidencePath,total:queue.length,queue};
const out=JSON.stringify(report,null,2)+'\n';
if(outputArg)await fs.writeFile(outputArg.split('=')[1],out);else process.stdout.write(out);
