import spells from '../data/spells.json' with {type:'json'};
import {campaignIds} from '../data/archivistCampaign.js';
const count=n=>Math.max(0,Math.floor(Number(n)||0));
export const clericCantrips=spells.filter(s=>s.level===0&&s.classes.some(x=>(x.name||x)==='Cleric')).map(s=>({...s,edition:'2014',catalogId:'2014:'+s.index,classes:s.classes.map(x=>x.name||x),school:s.school?.name||s.school,description:s.desc?.join('\n\n')||'',castingClassId:campaignIds.archivist,campaignAcquisition:'cantrip',prepared:true}));
export function prayerbookAllowance(c,level,intModifier){
 const state=c.archivistCampaign||{},book=(c.spells||[]).filter(s=>s.castingClassId===campaignIds.archivist&&s.level>0),startingAllowance=3+count(state.startingIntBonus??Math.max(0,intModifier));
 const growthAllowance=level?startingAllowance+Math.max(0,level-1)*2:0;
 const growthUsed=count(state.growthSpent??book.filter(s=>['starting','growth'].includes(s.campaignAcquisition)).length);
 const explicit=book.filter(s=>s.campaignAcquisition==='starting').length,oldFirst=book.filter(s=>s.level===1&&s.campaignAcquisition==='growth').length;
 // Old saves did not distinguish starting spells. Preserve all spent choices,
 // assigning any excess above later-level capacity to their starting allowance.
 const startingUsed=count(state.startingSpent??Math.min(startingAllowance,Math.max(explicit+oldFirst,growthUsed-Math.max(0,level-1)*2)));
 const startingRemaining=Math.max(0,startingAllowance-startingUsed),levelGrowthRemaining=Math.max(0,Math.max(0,level-1)*2-(growthUsed-startingUsed));
 const growthByLevel=Object.fromEntries(Array.from({length:Math.max(0,level-1)},(_,i)=>[i+2,Math.min(2,count(state.growthByLevel?.[i+2]))]));
 let unassigned=Math.max(0,growthUsed-startingUsed-Object.values(growthByLevel).reduce((sum,n)=>sum+n,0));
 for(const k of Object.keys(growthByLevel)){const used=Math.min(2-growthByLevel[k],unassigned);growthByLevel[k]+=used;unassigned-=used;}
 const growthAvailableLevels=Object.entries(growthByLevel).filter(([,used])=>used<2).map(([n,used])=>({classLevel:Number(n),maxSpellLevel:Math.min(9,Math.ceil(Number(n)/2)),remaining:2-used}));
 return {startingAllowance,startingUsed,startingRemaining,levelGrowthRemaining,growthAllowance,growthUsed,growthByLevel,growthAvailableLevels,growthRemaining:Math.max(0,Math.min(growthAllowance-growthUsed,startingRemaining+levelGrowthRemaining))};
}
export function reconcilePrayerbook(c,p){
 if(!p.archivist)return c;
 const spells=[...(c.spells||[])];
 for(const s of clericCantrips)if(!spells.some(x=>x.castingClassId===campaignIds.archivist&&(x.catalogId===s.catalogId||x.name===s.name)))spells.push({...s,id:crypto.randomUUID()});
 return {...c,spells,archivistCampaign:{...c.archivistCampaign,startingIntBonus:c.archivistCampaign?.startingIntBonus??Math.max(0,p.int),startingSpent:p.startingUsed,growthSpent:p.growthUsed,growthByLevel:p.growthByLevel}};
}
