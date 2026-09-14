import React, { useEffect, useState } from 'react';

const root = `${import.meta.env.BASE_URL}catalogs/dndtools/`;
async function readJson(file, signal) {
  const response = await fetch(root + file, { signal });
  if (!response.ok) throw new Error('The reference catalog is not available in this build.');
  return response.json();
}
export default function ReferenceCatalog() {
  const [manifest,setManifest]=useState(null),[category,setCategory]=useState('spells');
  const [entries,setEntries]=useState([]),[query,setQuery]=useState(''),[page,setPage]=useState(0);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    const controller=new AbortController();
    readJson('manifest.json',controller.signal).then(data=>{
      if(!data.complete||!Array.isArray(data.categories))throw new Error('The reference catalog import is incomplete.');
      setManifest(data);
    }).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setLoading(false);}});
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!manifest)return;
    const controller=new AbortController();
    setLoading(true);setError('');setEntries([]);
    readJson(category+'.json',controller.signal).then(data=>{
      const expected=manifest.categories.find(c=>c.id===category)?.count;
      if(!Array.isArray(data)||data.length!==expected)throw new Error('This category did not pass its completeness check.');
      setEntries(data);setLoading(false);
    }).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setLoading(false);}});
    return ()=>controller.abort();
  },[manifest,category]);
  const filtered=entries.filter(e=>e.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pages=Math.max(1,Math.ceil(filtered.length/30)),current=Math.min(page,pages-1);
  return <section aria-label="DnD Tools reference catalog">
    <p>Browse names and source links from the DnD Tools 3.5 reference. Open an entry to read its full rules on DnD Tools.</p>
    {manifest&&<><p className="l-muted">{manifest.categories.reduce((n,c)=>n+c.count,0).toLocaleString()} indexed entries · {manifest.categories.length} categories · Verified {new Date(manifest.fetchedAt).toLocaleDateString()}</p>
    <div className="l-list-controls"><label className="l-field"><span>Reference category</span><select value={category} onChange={e=>{setCategory(e.target.value);setQuery('');setPage(0);}}>{manifest.categories.map(c=><option key={c.id} value={c.id}>{c.id} ({c.count.toLocaleString()})</option>)}</select></label><label className="l-field"><span>Search references</span><input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Name…"/></label></div></>}
    {error&&<p role="alert">{error} <a href="https://new.dndtools.org/" target="_blank" rel="noreferrer">Open DnD Tools</a></p>}
    {loading?<p role="status">Loading reference catalog…</p>:!error&&<><p aria-live="polite">{filtered.length.toLocaleString()} results</p><div className="compendium-grid">{filtered.slice(current*30,current*30+30).map(entry=><a className="compendium-card" key={entry.id} href={entry.url} target="_blank" rel="noreferrer"><span className="l-eyebrow">{entry.category}</span><h3>{entry.name}</h3><p>{entry.id.split('/').pop()} · Open source ↗</p></a>)}</div><div className="spell-picker-pagination"><button type="button" className="l-button" disabled={!current} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button type="button" className="l-button" disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button></div></>}
  </section>;
}
