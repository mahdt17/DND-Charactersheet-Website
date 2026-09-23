import {useEffect,useState} from 'react';
import {createCatalogService} from './catalog.js';
export const catalogs=createCatalogService({baseUrl:import.meta.env.BASE_URL});
export function useCatalogs(ids=[]) {
  const key=[...new Set(ids)].sort().join('|');
  const [state,setState]=useState({key:'',entries:[],loading:false,error:''}),[attempt,retry]=useState(0);
  useEffect(()=>{
    let active=true;
    if(!key){setState({key,entries:[],loading:false,error:''});return;}
    setState({key,entries:[],loading:true,error:''});
    Promise.all(key.split('|').map(id=>catalogs.load(id))).then(groups=>{if(active)setState({key,entries:groups.flat(),loading:false,error:''});}).catch(error=>{if(active)setState({key,entries:[],loading:false,error:error.message});});
    return()=>{active=false;};
  },[key,attempt]);
  return {...(state.key===key?state:{entries:[],loading:!!key,error:''}),retry:()=>retry(n=>n+1)};
}
export function catalogIds(edition,categories) {
  return (edition==='custom'?['3.5','2014']:['3.5','2014'].includes(edition)?[edition]:[]).flatMap(e=>categories.filter(c=>e==='3.5'||!['races','equipment'].includes(c)).map(c=>`${e}/${c}`));
}
export function useReferenceIndex(categories=['classes','races','spells','feats'],edition='3.5') {return useCatalogs(catalogIds(edition,categories));}
