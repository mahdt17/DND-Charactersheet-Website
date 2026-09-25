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
  const clean={...row};
  for(const k of ['effect','effectSummary','description']) if(isBoilerplate(clean[k])) delete clean[k];
  const description=[clean.description||clean.effectSummary||clean.effect||clean.benefit,clean.normalRule&&`Normal: ${clean.normalRule}`,clean.specialRule&&`Special: ${clean.specialRule}`].filter(Boolean).join('\n\n');
  const verified=row.enrichment?.validated&&!row.enrichment?.partial&&!integrityIssues.length;
  const normalized=normalizeContentEntry({...clean,sourceId:row.id,id:catalogId,catalogId,index:row.id,category:contentType(category),edition:source==='dndtools'?'3.5':'2014',source:row.source||(source==='dndtools'?'DnD Tools':'D&D 5e Wikidot'),sourceUrl:row.sourceUrl||row.url,description,referenceOnly:!verified,integrityIssues,
    tables:row.progression?.length&&Array.isArray(row.progression[0])&&!Array.isArray(row.progression[0][0])?[row.progression]:row.tables||[]});
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
