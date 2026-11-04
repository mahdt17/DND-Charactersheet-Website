import React, {useState} from 'react';
import {archivistCantripCatalog, reconcilePrayerbook} from './lib/archivistPrayerbook';
import {campaignProfile} from './lib/archivistCampaign';
import {campaignIds} from './data/archivistCampaign';

export default function ArchivistCantrips({char, patch, creation=false, onCast, show, blocked}) {
 const [query,setQuery]=useState('');
 const [quickOnly,setQuickOnly]=useState(false);
 const state=char.archivistCampaign||{};
 const catalog=archivistCantripCatalog(char);
 const pins=state.cantripQuickAccess||[];
 const update=changes=>{
  if(creation){patch({archivistCampaign:{...state,...changes}});return;}
  patch(current=>{
  const next={...current,archivistCampaign:{...current.archivistCampaign,...changes}};
  return reconcilePrayerbook(next,campaignProfile(next));
  });
 };
 const recorded=(char.spells||[]).filter(s=>s.castingClassId===campaignIds.archivist&&s.level===0);
 const rows=catalog.map(s=>recorded.find(r=>r.name.toLowerCase()===s.name.toLowerCase())||s);
 const key=s=>s.name.toLowerCase();
 return <section aria-label="Archivist cantrips">
  <h3>Cleric cantrips</h3>
  <p>{catalog.length} approved cantrips known at will. Quick access is your shortlist.</p>
  <label className="l-field">Search Archivist cantrips<input value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <label><input type="checkbox" checked={quickOnly} onChange={e=>setQuickOnly(e.target.checked)}/>Show quick access only</label>
  <label><input type="checkbox" checked={!!state.approvedUACantrips} onChange={e=>update({approvedUACantrips:e.target.checked})}/>Include Unearthed Arcana cantrips approved by my DM</label>
  <div className="spell-table">{rows.filter(s=>key(s).includes(query.trim().toLowerCase())&&(!quickOnly||pins.includes(key(s)))).map(s=>
   <div className="spell-item" key={key(s)}>
    {show?<button type="button" className="spell-name" onClick={()=>show(s)}>{s.name}</button>:<strong>{s.name}</strong>}
    <small>{s.sourceBook||"Player's Handbook"}</small>
    <label><input type="checkbox" checked={pins.includes(key(s))} onChange={e=>update({cantripQuickAccess:e.target.checked?[...pins,key(s)]:pins.filter(k=>k!==key(s))})}/>Quick access: {s.name}</label>
    {onCast&&<button className="l-button" type="button" disabled={!!blocked||!recorded.includes(s)} onClick={()=>onCast(s)}>Cast</button>}
   </div>)}</div>
 </section>;
}
