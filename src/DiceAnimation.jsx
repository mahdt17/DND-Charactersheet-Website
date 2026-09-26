import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {diceStyles,visualDice} from './lib/presentation';
import {usePresentation,useReducedMotion} from './PresentationSettings';

export default function DiceAnimation({rolls,trayOpen=false}) {
  const canvas=useRef(null),seen=useRef(new Set()),[scene,setScene]=useState(null),[phase,setPhase]=useState('loading'),{preferences}=usePresentation(),reduced=useReducedMotion();
  useEffect(()=>{
    const fresh=rolls.filter(r=>!seen.current.has(r.id)).reverse();seen.current=new Set(rolls.map(r=>r.id));
    if(!preferences.animation||reduced||!rolls.length){setScene(null);return;}
    if(fresh.length){setPhase('loading');setScene({...visualDice(fresh),results:fresh,key:fresh.at(-1).id,style:preferences.diceStyle});}
  },[rolls,preferences.animation,reduced,preferences.diceStyle]);
  useEffect(()=>{
    if(!scene||!canvas.current)return;
    const node=canvas.current,style=diceStyles.find(s=>s.id===scene.style)||diceStyles[0];
    let cancelled=false,dispose,timer;
    const finish=()=>{if(!cancelled)setScene(current=>current?.key===scene.key?null:current);};
    const fallback=()=>{if(cancelled)return;dispose?.();dispose=null;node.dataset.engine='results-only';node.dataset.phase='settled';setPhase('unavailable');timer=setTimeout(finish,2200);};
    import('./lib/diceRenderer').then(({createDiceRenderer})=>{
      if(cancelled)return;
      dispose=createDiceRenderer(node,scene.dice,style,{onPhase:value=>{if(!cancelled)setPhase(value);},onFinish:finish,onUnavailable:fallback});
    }).catch(fallback);
    return()=>{cancelled=true;clearTimeout(timer);dispose?.();};
  },[scene]);
  if(!scene)return null;
  const target=document.querySelector('dialog[open]')||document.querySelector('.creation-overlay')||document.body;
  const settled=phase==='settled'||phase==='unavailable';
  return createPortal(<div className="dice-stage" aria-hidden="true" data-style={scene.style} data-tray={trayOpen?'open':'closed'} data-phase={phase} data-roll-ids={scene.results.map(r=>r.id).join(',')}>
    <canvas key={scene.key} ref={canvas} className="dice-canvas" data-values={scene.dice.map(d=>d.value).join(',')}/>
    <div className="dice-stage-caption"><span>{diceStyles.find(s=>s.id===scene.style)?.name}</span>
      {settled?<div className="dice-stage-results">{scene.results.map(r=><div key={r.id}><strong>{r.total}</strong><small>{r.label}</small></div>)}</div>:<strong>{phase==='loading'?'Preparing dice…':'Rolling…'}</strong>}
      <small>{phase==='unavailable'?'3D unavailable · result saved':scene.total>scene.dice.length?`Showing ${scene.dice.length} of ${scene.total} dice · all results in history`:settled?'Result recorded in roll history':'Let fate decide'}</small>
    </div>
  </div>,target);
}
