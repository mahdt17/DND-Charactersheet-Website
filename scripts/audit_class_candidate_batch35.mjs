import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,classAutomationReport,reconcileClassGrants} from '../src/lib/classIntegration.js';
import {progressionTables} from '../src/lib/advancement.js';

const manifest=JSON.parse(await fs.readFile('docs/class-action-resource-candidates-75-2026-10-06.json','utf8'));
const tracker=JSON.parse(await fs.readFile('docs/class-completion-tracker.json','utf8'));
assert.equal(manifest.records.length,75);
assert.equal(new Set(manifest.records.map(r=>r.sourceId)).size,75);
const protectedIds=new Set(['classes/battlesmith-725','classes/duelist-768','classes/goliath-liberator-732','classes/ghost-slayer-525','classes/gladiator-771','classes/knight-protector-322']);
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const references=[...classes,...feats],packets=new Map(),records=[];
for(const candidate of manifest.records){
 assert(!protectedIds.has(candidate.sourceId),'protected finalized class in candidate batch');
 const matches=classes.filter(r=>r.sourceId===candidate.sourceId);
 assert.equal(matches.length,1,'exact source identity must resolve once: '+candidate.sourceId);
 const definition=annotateClassGrantKinds(matches[0],references);
 assert.equal(definition.name,candidate.name);
 assert.equal(definition.sourceBook,candidate.sourceBook);
 for(const path of candidate.sourcePackets){
  if(!packets.has(path))packets.set(path,JSON.parse(await fs.readFile(path,'utf8')));
  assert(packets.get(path).records.some(r=>r.sourceId===candidate.sourceId&&r.sourceBook===candidate.sourceBook),'source packet identity mismatch: '+candidate.sourceId);
 }
 const levels=[...(definition.levelGrants||[]).map(g=>Number(g.level)||0)];
 for(const table of progressionTables(definition)){
  const header=table.findIndex(row=>row.some(value=>/^(?:class |racial )?level$/i.test(String(value).trim())));
  if(header<0)continue;
  const index=table[header].findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
  levels.push(...table.slice(header+1).map(row=>parseInt(row[index])).filter(n=>Number.isFinite(n)&&n>0&&n<=30));
 }
 const level=Math.max(1,...levels),row={catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition};
 const character=reconcileClassGrants({ruleset:'3.5',mechanics:'3.5',level,classLevels:[row],abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:100,max:100,temp:0},feats:[],actions:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
 const report=classAutomationReport(character).classes[0];
 const entry=tracker.entries.find(r=>(r.sourceId||r.id)===candidate.sourceId);
 assert(entry,'tracker source ID missing: '+candidate.sourceId);
 records.push({sourceId:candidate.sourceId,name:definition.name,sourceBook:definition.sourceBook,sourceVersion:definition.sourceVersion||null,trackerStatus:entry.status,level,sourcePacketCount:candidate.sourcePackets.length,reviewBatch:definition.reviewBatch||null,featureCount:report.featureCount,actionCount:report.actionCount,resourceCount:report.resourceCount,choiceCount:report.choiceCount,descriptionComplete:report.descriptionComplete,emptyFeatureSet:report.featureCount===0,fullAutomationVerified:false,recordedEvidenceGaps:candidate.completionGates});
}
const report={batchId:manifest.batchId,scope:manifest.scope,candidateCount:records.length,newlyCompleted:0,needsReview:tracker.entries.filter(r=>r.status==='needs-review').length,withSourcePackets:records.filter(r=>r.sourcePacketCount>0).length,emptyFeatureSets:records.filter(r=>r.emptyFeatureSet).map(r=>r.sourceId),records};
await fs.mkdir('test-results',{recursive:true});
await fs.writeFile('test-results/class-action-resource-candidates-75.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidateCount:report.candidateCount,newlyCompleted:0,needsReview:report.needsReview,withSourcePackets:report.withSourcePackets,emptyFeatureSets:report.emptyFeatureSets}));
