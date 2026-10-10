import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {lowerCastingPrerequisite35,castingTextSafe35} from '../src/lib/castingPrerequisites35.js';

export function castingPrerequisiteCoverage35(records){
  const supported=[],manualContext=[];
  for(const record of records){
    const clauses=(record.prerequisites||[]).filter(p=>lowerCastingPrerequisite35(p)).map(p=>({kind:p.kind,text:p.text,predicate:lowerCastingPrerequisite35(p)}));
    if(!clauses.length)continue;
    (castingTextSafe35(record)?supported:manualContext).push({sourceId:record.sourceId||record.id,clauses});
  }
  const sorted=rows=>rows.sort((a,b)=>a.sourceId.localeCompare(b.sourceId));
  return {schemaVersion:1,catalogCount:records.length,uniqueAffectedCount:supported.length,semantics:'Exact source records with recognized entry clauses. Runtime qualification still requires reviewed casting metadata and character capability; this is not a whole-class unblock or certification count.',supported:sorted(supported),manualContext:sorted(manualContext)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const records=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
  const out=JSON.stringify(castingPrerequisiteCoverage35(records),null,2)+'\n';
  if(process.argv[2])await fs.writeFile(process.argv[2],out);else process.stdout.write(out);
}
