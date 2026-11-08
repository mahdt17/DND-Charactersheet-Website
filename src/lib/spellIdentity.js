// Ordinary published 2014 SRD/reference equivalents share a candidate identity;
// source variants, custom spells and other editions keep their own identifiers.
const key=s=>s.catalogId||`${s.edition||'2014'}:${s.index||s.id||s.name}`;
export function ordinarySpellIdentity(s){
 const id=key(s),edition=s.edition||'2014',slug=String(s.name||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const variant=s.playtest||/unearthed arcana|\bUA\b|playtest/i.test(`${s.sourceBook||''} ${s.source||''}`);
 if(edition==='2014'&&!variant&&(id===`2014:${slug}`||id===`wikidot5e:spell:${slug}`))return `2014:ordinary:${slug}`;
 return `${edition}:source:${id}`;
}
export function eligibleSpellRepresentatives(spells,owned=[]){
 const map=new Map(),ownedKeys=new Set(owned.filter(s=>!s.classSpellGrant&&!s.featSpellGrant&&!s.featGrantId).map(key));
 for(const s of spells){const id=ordinarySpellIdentity(s),prior=map.get(id);if(!prior||ownedKeys.has(key(s))&&!ownedKeys.has(key(prior)))map.set(id,s);}
 return [...map.values()];
}
