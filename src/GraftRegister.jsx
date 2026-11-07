import {campaignDuration} from './lib/campaignClock';
import React from 'react';
import {graftRecipes} from './data/campaignExpansion';
import {campaignModifiers,graftModifiers} from './lib/campaignModifiers';

export default function GraftRegister({char}){
 const state=char.archivistCampaign||{},now=Number(state.clockMinutes||0);
 const recipients=[{name:'Self',grafts:state.grafts||[],used:state.heartUsedAt,mods:campaignModifiers(char)},...(state.creatures||[]).map(n=>({name:n.name,grafts:n.grafts||[],used:n.heartUsedAt,mods:graftModifiers(n.grafts)}))].filter(n=>n.grafts.length);
 return <section aria-label="Installed graft register"><h3>Installed grafts and applied bonuses</h3>{!recipients.length&&<p>No grafts installed.</p>}{recipients.map((n,i)=><div key={i}><h4>{n.name}</h4>{n.grafts.map((g,k)=>{const rule={...graftRecipes.find(r=>r.id===g.recipeId),...g.effects};return <p key={g.id||k}><strong>{rule.name||g.recipeId}</strong>: {rule.description||'Saved graft effect.'}</p>;})}<p>Applied: {Object.entries(n.mods.abilities||{}).filter(([,v])=>v).map(([k,v])=>`${k.toUpperCase()} +${v}`).concat(['ac','speed','initiative','perception','acrobatics','healing'].filter(k=>n.mods[k]).map(k=>`${k} +${n.mods[k]}`)).join(', ')||'No numeric bonuses'}.</p>{n.mods.heart&&<p>Silthilar Heart: {n.used==null||now-n.used>=1440?'ready':`${campaignDuration(1440-(now-n.used))} (${1440-(now-n.used)} game minutes until ready)`}; triggers automatically at 0 HP when alive and not killed outright.</p>}</div>)}</section>;
}
