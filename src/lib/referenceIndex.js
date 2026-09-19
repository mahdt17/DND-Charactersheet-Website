import {useEffect,useState} from 'react';
import {normalizeContentEntry} from './content';

// Preserve source IDs: same-name entries from different books remain distinct.
export function useReferenceIndex() {
  const [state,setState]=useState({entries:[],loading:true,error:''});
  useEffect(()=>{
    const controller=new AbortController();
    const read=async file=>{
      const response=await fetch(`${import.meta.env.BASE_URL}catalogs/dndtools/${file}.json`,{signal:controller.signal});
      if(!response.ok)throw Error('DnD Tools references could not load. Bundled SRD and homebrew entries are still available.');
      return response.json();
    };
    (async()=>{
      const manifest=await read('manifest');
      if(!manifest.complete)throw Error('DnD Tools catalog is incomplete.');
      const groups=await Promise.all(['classes','races','spells','feats'].map(async category=>{
        const rows=await read(category);
        if(rows.length!==manifest.categories.find(c=>c.id===category)?.count)throw Error('Reference count mismatch: '+category);
        const type=({classes:'class',races:'race',spells:'spell',feats:'feat'})[category];
        return rows.map(r=>normalizeContentEntry({
          ...r,
          index:r.id,
          id:`dndtools:${r.id}`,
          catalogId:`dndtools:${r.id}`,
          edition:'3.5',
          category:type,
          source:'DnD Tools',
          sourceUrl:r.url,
          referenceOnly:true
        }));
      }));
      if(!controller.signal.aborted)setState({entries:groups.flat(),loading:false,error:''});
    })().catch(e=>{if(e.name!=='AbortError')setState({entries:[],loading:false,error:e.message});});
    return()=>controller.abort();
  },[]);
  return state;
}
