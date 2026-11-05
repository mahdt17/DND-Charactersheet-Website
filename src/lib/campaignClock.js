import {graftModifiers} from './campaignModifiers.js';
export function campaignDuration(minutes){
 let seconds=Math.max(0,Math.ceil(Number(minutes||0)*60-1e-7)),parts=[];
 for(const [size,label] of [[86400,'d'],[3600,'h'],[60,'m']]){const n=Math.floor(seconds/size);if(n)parts.push(n+label);seconds%=size;}
 if(seconds)parts.push(seconds+'s');return parts.join(' ')||'0m';
}
export function campaignCooldowns(c){
 const state=c.archivistCampaign||{},now=Number(state.clockMinutes||0),rows=[];
 for(const n of [{name:c.name||'Self',grafts:state.grafts,used:state.heartUsedAt},...(state.creatures||[]).map(n=>({name:n.name,grafts:n.grafts,used:n.heartUsedAt}))]){
  if(graftModifiers(n.grafts).heart)rows.push({name:'Silthilar Heart · '+n.name,minutes:n.used==null?0:Math.max(0,1440-(now-Number(n.used)))});
 }
 return rows;
}
