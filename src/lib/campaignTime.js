import {campaignModifiers,graftModifiers} from './campaignModifiers.js';

function healElapsedTurns(target,healing,turns,dead=false){
 const conditions=Array.isArray(target.conditions)?target.conditions:String(target.conditions||'').split(',');
 const deadCondition=conditions.some(x=>String(x?.name??x).trim().toLowerCase()==='dead');
 if(dead||deadCondition||target.dead||target.soulDestroyed||Number(target.deathSaves?.failure||0)>=3||healing<=0||turns<=0||!target.hp)return target;
 const current=Math.min(target.hp.max,target.hp.current+healing*turns);
 if(current===target.hp.current)return target;
 return {...target,hp:{...target.hp,current},...(target.hp.current===0?{deathSaves:{success:0,failure:0}}:{})};
}

// Timers are stored as decimal game minutes; remove binary subtraction residue.
const remaining=(value,elapsed)=>Math.max(0,Math.round((Number(value||0)-elapsed)*1e9)/1e9);
export function tickCampaign(c,minutes){
 const state=c.archivistCampaign||{},rounds=minutes*10,empowerment=state.empowerment?{...state.empowerment,rounds:remaining(state.empowerment.rounds,rounds)}:null;
 const hp=state.empowerment?.rounds>0&&!empowerment.rounds&&c.hp?.tempSource==='campaign-empowerment'?{...c.hp,temp:0,tempSource:null}:c.hp;
 const turns=Math.floor(rounds);
 const restored=healElapsedTurns({...c,hp},campaignModifiers(c).healing,turns,state.dead||state.soulDestroyed||Number(c.exhaustion||0)>=6);
 const creature=n=>({...healElapsedTurns(n,graftModifiers(n.grafts).healing,turns),...(turns>0&&n.reactionUsed?{reactionUsed:false}:{}),control:n.control?.minutes!=null?({...n.control,minutes:remaining(n.control.minutes,minutes)}):n.control,sensor:n.sensor&&c.concentration==='Necrotic Scrying'?{...n.sensor,minutes:remaining(n.sensor.minutes,minutes)}:null,emergesInRounds:remaining(n.emergesInRounds,rounds),conditions:(n.conditions||[]).filter(x=>typeof x!=='object'||remaining(x.rounds,rounds)>0&&(!x.castId||!x.concentration||c.concentration===x.sourceSpell&&(!state.concentrationCastId||state.concentrationCastId===x.castId))).map(x=>typeof x==='object'?{...x,rounds:remaining(x.rounds,rounds)}:x)});
 return {...restored,archivistCampaign:{...state,clockMinutes:Math.round((Number(state.clockMinutes||0)+minutes)*1e9)/1e9,empowerment,psicrystal:{...state.psicrystal,...Object.fromEntries(['legsMinutes','flightMinutes','sightMinutes'].map(k=>[k,remaining(state.psicrystal?.[k],minutes)])),sharedPowers:Object.fromEntries(Object.entries(state.psicrystal?.sharedPowers||{}).map(([id,e])=>[id,{...e,minutes:remaining(e.minutes,minutes)}]).filter(([,e])=>e.minutes>0))},
  sensing:state.sensing&&c.concentration==='Necrotic Awareness'?{...state.sensing,minutes:remaining(state.sensing.minutes,minutes)}:null,
  powerEffects:Object.fromEntries(Object.entries(state.powerEffects||{}).map(([k,v])=>[k,{...v,minutes:remaining(v.minutes,minutes)}]).filter(([,v])=>v.minutes>0)),
  knowledgeEffects:(state.knowledgeEffects||[state.knowledgeEffect]).filter(e=>e?.bonus>0).map(e=>({...e,rounds:remaining(e.rounds,rounds)})).filter(e=>e.rounds>0),
  knowledgeEffect:state.knowledgeEffect?{...state.knowledgeEffect,rounds:remaining(state.knowledgeEffect.rounds,rounds)}:null,
  followers:(state.followers||[]).map(f=>({...f,arrivalHours:remaining(Number(f.arrivalHours||0)*60,minutes)/60})),partyCasters:(state.partyCasters||[]).map(n=>turns>0?{...n,reactionUsed:false}:n),creatures:(state.creatures||[]).map(creature)}};
}
