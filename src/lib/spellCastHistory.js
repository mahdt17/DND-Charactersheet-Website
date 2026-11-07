// Immutable cast snapshots keep source metadata/DC separate from later spell edits.
export const findSpellCast=(c,id)=>[c.archivistCampaign?.lastCast,...c.archivistCampaign?.castHistory||[]].find(x=>x?.id===id);
export function expireInactiveCastConditions(c){
 const state=c.archivistCampaign;if(!state?.creatures?.length)return c;
 let changed=false;const creatures=state.creatures.map(n=>{const conditions=(n.conditions||[]).filter(x=>{const active=typeof x!=='object'||!x?.castId||!x.concentration||c.concentration===x.sourceSpell&&state.concentrationCastId===x.castId;if(!active)changed=true;return active;});return conditions.length===(n.conditions||[]).length?n:{...n,conditions};});
 return changed?{...c,archivistCampaign:{...state,creatures}}:c;
}
export function replaceSpellCast(c,cast){
 const s=c.archivistCampaign||{};
 return {...c,archivistCampaign:{...s,...(s.lastCast?.id===cast.id?{lastCast:cast}:{castHistory:(s.castHistory||[]).map(x=>x.id===cast.id?cast:x)})}};
}
export function recordSpellCast(c,spell,options={}){
 if(['3.5','2024'].includes(options.edition||spell.edition||c.mechanics||c.ruleset))return c;
 const s=c.archivistCampaign||{},history=[s.lastCast,...s.castHistory||[]].filter((x,i,a)=>x?.id&&a.findIndex(y=>y?.id===x.id)===i);
 const cast={id:crypto.randomUUID(),name:spell.name,spellId:spell.catalogId||spell.index||spell.id,rule:{},resolved:[],results:[],targets:[],...options,spell:JSON.parse(JSON.stringify(spell)),edition:'2014',sourceDC:options.dc,createdAt:new Date().toISOString()};
 return expireInactiveCastConditions({...c,archivistCampaign:{...s,castHistory:history.filter(x=>x.id!==cast.id),lastCast:cast,...(spell.concentration?{concentrationCastId:cast.id}:{})}});
}
