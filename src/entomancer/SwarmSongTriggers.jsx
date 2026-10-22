import React from 'react';
import {swarmSubsystem} from '../lib/entomancerSubsystem';
import {Field,NumberField,Check,SaveChoice} from './SwarmFields';

export default function SwarmSongTriggers({char,ui,onUiChange,onRun}){
 const actions=['sonnet','serenade'].map(id=>swarmSubsystem(char,{actionId:id,inputs:ui.activeInputs[id]||{}}).selected).filter(a=>['sonnet','serenade'].includes(a?.id));
 const update=(id,key,value)=>onUiChange(u=>({...u,activeInputs:{...u.activeInputs,[id]:{...u.activeInputs[id],[key]:value}}}));
 return actions.map(a=>{
  const sonnet=a.id==='sonnet',targetLabel=sonnet?'Sonic Sonnet target':'Soothing Serenade ally';
  return <section className="feature-detail" key={a.id} aria-label={`${a.name} turn trigger`}><h4>{a.name}</h4>
   {a.fullDescription.map((text,i)=><p key={i}>{text}</p>)}
   <div className="form-grid"><Field label={targetLabel} error={a.errors.target}><input aria-label={targetLabel} value={a.inputs.target} onChange={e=>update(a.id,'target',e.target.value)}/></Field>
   <NumberField label={`${a.name} distance (ft.)`} value={a.inputs.distance} error={a.errors.distance} onChange={v=>update(a.id,'distance',v)}/>
   {!sonnet&&<NumberField label="Ally current HP" min={1} value={a.inputs.hp} error={a.errors.hp} onChange={v=>update(a.id,'hp',v)}/>}</div>
   {sonnet?<SaveChoice value={a.inputs.success} onChange={v=>update(a.id,'success',v)} ability={a.save.ability} dc={a.save.dc} error={a.errors.success}/>:<Check label="Ally can hear the song" value={a.inputs.canHear} error={a.errors.canHear} onChange={v=>update(a.id,'canHear',v)}/>}
   {a.unavailableReason&&<p>{a.unavailableReason}</p>}
   <button className="l-button" disabled={!a.canResolve} onClick={()=>onRun(a.id,a.inputs)}>Resolve {a.name} — {sonnet?'hostile':'ally'} turn start</button>
  </section>;
 });
}
