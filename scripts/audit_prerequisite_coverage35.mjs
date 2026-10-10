import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {lowerPrerequisiteText35} from '../src/lib/prerequisites35.js';

export function prerequisiteCoverage35(records){
  const groups=new Map();
  for(const record of records)for(const clause of record.prerequisites||[]){
    const lowered=lowerPrerequisiteText35(clause);
    const twoWeapon=['feat','feats'].includes(clause.kind)&&/\bTwo-Weapon\b/i.test(clause.text||'')&&!/\b(or|any|one|two|three|choose)\b/i.test(String(clause.text).replace(/Two-Weapon/gi,'DualWeapon'));
    const key=lowered?({feat_count:'typed-feat-count',skill_count:'ranked-skill-count',any:'named-feat-alternatives',all:'ranked-skill-alternatives'}[lowered.kind]):twoWeapon?'two-weapon-name':null;
    if(!key)continue;
    if(!groups.has(key))groups.set(key,new Map());
    const id=record.sourceId||record.id;
    if(!groups.get(key).has(id))groups.get(key).set(id,{sourceId:id,prerequisites:[]});
    groups.get(key).get(id).prerequisites.push({kind:clause.kind,text:clause.text});
  }
  const clusters=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([kind,entries])=>({kind,count:entries.size,records:[...entries.values()].sort((a,b)=>a.sourceId.localeCompare(b.sourceId))}));
  return {catalogCount:records.length,uniqueAffectedCount:new Set(clusters.flatMap(cluster=>cluster.records.map(record=>record.sourceId))).size,overlap:'Counts are exact source IDs; clusters may overlap. This measures recognized entry clauses, not class completion or all prerequisites being satisfied.',clusters};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const records=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
  const report=JSON.stringify(prerequisiteCoverage35(records),null,2)+'\n';
  if(process.argv[2])await fs.writeFile(process.argv[2],report);
  else process.stdout.write(report);
}
