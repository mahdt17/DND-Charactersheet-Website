import classProgressionRepairs from '../data/class-progression-repairs.json' with {type:'json'};
import descriptionOverrides35 from '../data/source-description-overrides-35.json' with {type:'json'};
import classSixBatchReview35 from '../data/class-six-batch-review-35.json' with {type:'json'};
import classReviewedOverrides35 from '../data/class-reviewed-overrides-35.json' with {type:'json'};
import classReviewedMartialOverrides35 from '../data/class-reviewed-overrides-35-martial.json' with {type:'json'};
import {reviewedWave35Override} from './reviewedClassWave35.js';
import {normalizeContentEntry, normalizeEdition, contentType, textValue} from './content.js';
export const SOURCES = {'3.5':'dndtools', '2014':'wikidot5e'};
export const isBoilerplate = value => /logged in to clone|click here to|wikidot\.com|view wiki source|notify administrators/i.test(String(value || ''));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}
export function normalizeCatalogRecord(row, source, category) {
  const catalogId=row.catalogId||(source==='dndtools'?`dndtools:${row.id}`:row.id);
  const integrityIssues=['effect','effectSummary','description'].filter(k=>isBoilerplate(row[k])).map(k=>`Invalid source text in ${k}`);
  const descriptionOverride=source==='dndtools'?descriptionOverrides35.entries?.[row.id]:null;
  const wave35Override=source==='dndtools'&&category==='classes'?reviewedWave35Override(row):null;
  const reviewedClassOverride=source==='dndtools'&&category==='classes'?{...(classSixBatchReview35.entries?.[row.id]||{}),...(classReviewedOverrides35.entries?.[row.id]||{}),...(classReviewedMartialOverrides35.entries?.[row.id]||{}),...(wave35Override||{})}:null;
  const repair=source==='dndtools'&&category==='classes'?classProgressionRepairs.entries?.[row.id]:null;
  const matchingRepair=repair&&repair.name===row.name&&repair.sourceBook===row.sourceBook
    &&JSON.stringify(repair.expectedProgression)===JSON.stringify(row.progression);
  const progressionRepair=matchingRepair?{
    progression:repair.progression,
    advancement:repair.progression.slice(1).map(values=>Object.fromEntries(repair.progression[0].map((key,index)=>[key,values[index]??'']))),
    sourceAuxiliaryTables:[...(row.sourceAuxiliaryTables||[]),{kind:repair.replacedTableKind,table:row.progression,sourceUrl:row.sourceUrl||row.url}],
    progressionRepairProvenance:{sourceUrls:repair.sourceUrls,reviewedAt:repair.reviewedAt,reviewScope:repair.reviewScope}
  }:{};
  const clean={...row,...progressionRepair,...(reviewedClassOverride||{}),...(descriptionOverride?.effectSummary?{effectSummary:descriptionOverride.effectSummary,descriptionOverrideVerified:true,descriptionOverrideProvenance:descriptionOverride.provenance||[]}:{}),...(descriptionOverride?.description?{description:descriptionOverride.description}:{}),...(descriptionOverride?.effect?{effect:descriptionOverride.effect}:{}),...(descriptionOverride?.benefit?{benefit:descriptionOverride.benefit}:{}),...(descriptionOverride?.normalRule?{normalRule:descriptionOverride.normalRule}:{}),...(descriptionOverride?.specialRule?{specialRule:descriptionOverride.specialRule}:{})};
  for(const k of ['effect','effectSummary','description']) if(isBoilerplate(clean[k])) delete clean[k];
  const description=[clean.description||clean.effectSummary||clean.effect||clean.benefit,clean.normalRule&&`Normal: ${clean.normalRule}`,clean.specialRule&&`Special: ${clean.specialRule}`].filter(Boolean).join('\n\n');
  const verified=Boolean(reviewedClassOverride?.verified)||(row.enrichment?.validated&&!row.enrichment?.partial&&!integrityIssues.length);
  const normalized=normalizeContentEntry({...clean,sourceId:row.id,id:catalogId,catalogId,index:row.id,category:contentType(category),edition:source==='dndtools'?'3.5':'2014',source:clean.source||(source==='dndtools'?'DnD Tools':'D&D 5e Wikidot'),sourceUrl:clean.sourceUrl||clean.url||row.sourceUrl||row.url,description,referenceOnly:!verified,integrityIssues,
    tables:clean.progression?.length&&Array.isArray(clean.progression[0])&&!Array.isArray(clean.progression[0][0])?[clean.progression]:clean.tables||[]});
  if(integrityIssues.length) normalized.completeness={...normalized.completeness,complete:false,missing:[...normalized.completeness.missing,'effectIntegrity']};
  if(normalized.category==='spell') normalized.classes=(row.classes||[]).map(x=>typeof x==='string'?x:x.name);
  return freeze(normalized);
}
export function createCatalogService({fetcher=globalThis.fetch,baseUrl='/'}={}) {
  const cache=new Map();
  const read=path=>{
    if(!cache.has(path))cache.set(path,(async()=>{
      const response=await fetcher(`${baseUrl.replace(/\/?$/,'/')}catalogs/${path}.json`);
      if(!response.ok)throw Error(`Could not load catalog ${path} (${response.status}). Try again.`);
      return response.json();
    })().catch(e=>{cache.delete(path);throw e;}));
    return cache.get(path);
  };
  const manifest=async source=>{
    if(!Object.values(SOURCES).includes(source))throw Error('Unsupported catalog source.');
    const m=await read(`${source}/manifest`);
    if(!m.complete||!Array.isArray(m.categories))throw Error(`${source} manifest is incomplete.`);
    return m;
  };
  const load=id=>{
    const [label,category]=id.split('/'),edition=normalizeEdition(label),source=SOURCES[edition];
    if(!source||!category||id.split('/').length!==2)return Promise.reject(Error(`Unsupported catalog: ${id}`));
    const key=`normalized:${source}/${category}`;
    if(!cache.has(key))cache.set(key,(async()=>{
      const m=await manifest(source),expected=m.categories.find(c=>c.id===category)?.count;
      if(!Number.isInteger(expected))throw Error(`Category ${category} is missing from ${source}.`);
      const rows=await read(`${source}/${category}`);
      if(!Array.isArray(rows)||rows.length!==expected)throw Error(`Catalog count mismatch: ${id}. Expected ${expected}.`);
      const identities=new Set();
      for(const row of rows){if(!row.id||identities.has(row.id))throw Error(`Missing or duplicate source ID in ${id}.`);identities.add(row.id);}
      return freeze(rows.map(row=>normalizeCatalogRecord(row,source,category)));
    })().catch(e=>{cache.delete(key);cache.delete(`${source}/${category}`);throw e;}));
    return cache.get(key);
  };
  return {load,manifest,clear:()=>cache.clear()};
}
export function layerOverride(canonical,override) {
  if(!override)return canonical;
  const fields=['description','stats','prerequisites','progression','tables','progressionImage','sourceNotes'];
  return {...structuredClone(canonical),...Object.fromEntries(fields.filter(k=>Object.hasOwn(override,k)).map(k=>[k,structuredClone(override[k])])),catalogId:canonical.catalogId};
}
export function ownedItem(canonical) {
  return {id:crypto.randomUUID(),catalogId:canonical.catalogId,canonical:structuredClone(canonical),name:canonical.name,qty:1,weight:parseFloat(canonical.weight)||0,equipped:false,notes:'',charges:null,description:textValue(canonical.description||canonical.desc),sourceUrl:canonical.sourceUrl};
}
