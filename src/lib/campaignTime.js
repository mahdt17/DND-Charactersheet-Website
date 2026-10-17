export function tickCampaign(c,minutes){
 const state=c.archivistCampaign||{},rounds=minutes*10,empowerment=state.empowerment?{...state.empowerment,rounds:Math.max(0,state.empowerment.rounds-rounds)}:null;
 const hp=state.empowerment?.rounds>0&&!empowerment.rounds&&c.hp?.tempSource==='campaign-empowerment'?{...c.hp,temp:0,tempSource:null}:c.hp;
 const creature=n=>({...n,control:n.control?.minutes!=null?({...n.control,minutes:Math.max(0,n.control.minutes-minutes)}):n.control,sensor:n.sensor&&c.concentration==='Necrotic Scrying'?{...n.sensor,minutes:Math.max(0,n.sensor.minutes-minutes)}:null,emergesInRounds:Math.max(0,(n.emergesInRounds||0)-rounds),conditions:(n.conditions||[]).filter(x=>typeof x!=='object'||x.rounds>rounds).map(x=>typeof x==='object'?{...x,rounds:x.rounds-rounds}:x)});
 return {...c,hp,archivistCampaign:{...state,clockMinutes:Number(state.clockMinutes||0)+minutes,empowerment,psicrystal:{...state.psicrystal,...Object.fromEntries(['legsMinutes','flightMinutes','sightMinutes'].map(k=>[k,Math.max(0,(state.psicrystal?.[k]||0)-minutes)])),sharedPowers:Object.fromEntries(Object.entries(state.psicrystal?.sharedPowers||{}).map(([id,e])=>[id,{...e,minutes:Math.max(0,e.minutes-minutes)}]).filter(([,e])=>e.minutes>0))},
  sensing:state.sensing&&c.concentration==='Necrotic Awareness'?{...state.sensing,minutes:Math.max(0,state.sensing.minutes-minutes)}:null,
  powerEffects:Object.fromEntries(Object.entries(state.powerEffects||{}).map(([k,v])=>[k,{...v,minutes:Math.max(0,v.minutes-minutes)}]).filter(([,v])=>v.minutes>0)),
  knowledgeEffect:state.knowledgeEffect?{...state.knowledgeEffect,rounds:Math.max(0,state.knowledgeEffect.rounds-rounds)}:null,
  followers:(state.followers||[]).map(f=>({...f,arrivalHours:Math.max(0,Number(f.arrivalHours||0)-minutes/60)})),creatures:(state.creatures||[]).map(creature)}};
}
