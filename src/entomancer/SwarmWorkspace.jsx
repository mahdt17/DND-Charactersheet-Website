import React,{useRef,useState} from 'react';
import {entomancerSource} from '../data/entomancer';
import {swarmSubsystem} from '../lib/entomancerSubsystem';
import {applyEntomancerAction,availableEntomancerActions} from '../lib/entomancerActions';
import EntomancerPopulation from '../EntomancerPopulation';
import EntomancerCompanions from '../EntomancerCompanions';
import SwarmAbilities from './SwarmAbilities';
import SwarmActive from './SwarmActive';
import SwarmRecovery from './SwarmRecovery';
import SwarmResult from './SwarmResult';
const sections={abilities:'Abilities',active:'Active',creatures:'Creatures',recovery:'Recovery'};
export default function SwarmWorkspace({char,patch,roll,onRest,ui,onUiChange}){
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),heading=useRef(null);
 const legal=availableEntomancerActions(char),actionId=legal.find(a=>a.id===ui.actionId)?.id||legal.find(a=>a.id==='pestilence')?.id||legal[0]?.id;
 const model=swarmSubsystem(char,{actionId,inputs:ui.inputsByAction[actionId]});if(!model.supported)return null;
 const onSection=(section,disclosure=null)=>{onUiChange(u=>({...u,section,recoveryDisclosure:disclosure||u.recoveryDisclosure}));requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));};
 const onRun=(id,inputs={})=>{try{const next=patch(current=>{const currentModel=swarmSubsystem(current,{actionId:id,inputs});if(currentModel.actions.some(a=>a.id===id)&&!currentModel.selected.canResolve)throw Error(currentModel.selected.unavailableReason||Object.values(currentModel.selected.errors)[0]);return applyEntomancerAction(current,id,inputs);});setError('');setNotice(next?.entomancer?.lastAction?.id===id?'':next?.entomancer?.log?.at(-1)||'Swarm updated.');}catch(e){setError(e.message);setNotice('');}};
 return <section className="l-panel entomancer-swarm swarm-workspace" aria-label="Entomancer swarm"><header className="swarm-heading"><div><span className="l-eyebrow">YOUR SWARM</span><h2>Swarm</h2><p>{model.profile.species||'Choose a species'} · Level {model.profile.level}</p></div><a href={entomancerSource} target="_blank" rel="noreferrer">Class rules ↗</a></header>
 <EntomancerPopulation char={char} model={model} onRest={onRest}/>
 <nav className="swarm-section-nav" aria-label="Swarm sections">{Object.entries(sections).map(([key,label])=><button className="l-button" aria-label={label} aria-pressed={ui.section===key} key={key} onClick={()=>onSection(key)}>{label}{['active','creatures'].includes(key)&&<small aria-hidden="true">{key==='active'?model.summary.activityCount:model.summary.creatureCount}</small>}</button>)}</nav>
 <SwarmResult result={char.entomancer?.lastAction} available={model.summary.available} max={model.summary.max} onSection={onSection}/>{notice&&<p role="status" className="action-feedback">{notice}</p>}{error&&<p role="alert">{error}</p>}
 {!model.setupComplete&&<p className="swarm-empty">Complete your swarm choices. <button className="l-button" onClick={()=>onSection('recovery','setup')}>Complete swarm setup</button></p>}
 <div className="swarm-section-content"><h2 className="sr-only" tabIndex={-1} ref={heading}>{sections[ui.section]}</h2>
 {ui.section==='abilities'&&<SwarmAbilities model={model} ui={ui} onUiChange={onUiChange} onRun={onRun} onSection={onSection}/>}
 {ui.section==='active'&&<SwarmActive char={char} model={model} ui={ui} onUiChange={onUiChange} onRun={onRun} roll={roll} onSection={onSection}/>}
 {ui.section==='creatures'&&(model.creatures.length?<EntomancerCompanions char={char} patch={patch} roll={roll} input={ui.creatureInput} onInputChange={v=>onUiChange(u=>({...u,creatureInput:v}))}/>:<div className="swarm-empty-state"><h3>No controlled creatures</h3><p>Swarm Summon creates an insect swarm you can command.</p><button className="l-button" onClick={()=>onUiChange(u=>({...u,section:'abilities',actionId:'summon',query:'',availableOnly:false}))}>Use Swarm Summon</button></div>)}
 {ui.section==='recovery'&&<SwarmRecovery char={char} model={model} patch={patch} roll={roll} onRun={onRun} onRest={onRest} ui={ui} onUiChange={onUiChange}/>}
 </div></section>;
}
