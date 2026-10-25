import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {diceStyles,visualDice} from './lib/presentation';
import {usePresentation,useReducedMotion} from './PresentationSettings';

const emptyDisplay={results:[],total:0,style:diceStyles[0].id};
export default function DiceAnimation({rolls,trayOpen=false}) {
  const canvas=useRef(null),stage=useRef(null),session=useRef(null),seen=useRef(new Set());
  const [portal]=useState(()=>document.createElement('div')),[display,setDisplay]=useState(emptyDisplay),[phase,setPhase]=useState('idle');
  const {preferences}=usePresentation(),reduced=useReducedMotion();
  // Moving this stable portal host into a modal must not replace its WebGL canvas.
  useLayoutEffect(()=>{const target=document.querySelector('dialog[open]')||document.querySelector('.creation-overlay')||document.body;if(portal.parentNode!==target)target.appendChild(portal);});
  useEffect(()=>()=>portal.remove(),[portal]);
  useEffect(()=>{
    const node=canvas.current,layer=stage.current;
    let cancelled=false,renderer,loading,pending=[],results=[],total=0,unavailable=false,settleTimer,fade,exitFrame,generation=0;
    function cancelExit(){clearTimeout(settleTimer);cancelAnimationFrame(exitFrame);fade?.cancel();fade=null;}
    function stop(){
      generation++;cancelExit();layer.hidden=true;pending=[];results=[];total=0;renderer?.clear();
      setDisplay(emptyDisplay);setPhase('idle');
    }
    function finish(){
      if(cancelled||!results.length)return;
      const current=generation;setPhase('dissipating');
      fade=layer.animate([{opacity:1},{opacity:0}],{duration:600,easing:'ease-out',fill:'forwards'});
      fade.finished.then(()=>{
        if(cancelled||current!==generation)return;
        // Clear geometry only after the invisible layer has been painted. Keep WebGL.
        exitFrame=requestAnimationFrame(()=>{exitFrame=requestAnimationFrame(()=>{if(!cancelled&&current===generation)stop();});});
      }).catch(()=>{});
    }
    function holdThenFinish(){clearTimeout(settleTimer);settleTimer=setTimeout(finish,600);}
    function renderedPhase(value){
      if(cancelled||fade||!results.length)return;
      clearTimeout(settleTimer);setPhase(value);
      // The renderer reports settled only after every active batch has finished.
      if(value==='settled')holdThenFinish();
    }
    function fallback(){unavailable=true;node.dataset.ready='false';node.dataset.engine='results-only';if(results.length&&!fade){setPhase('unavailable');holdThenFinish();}}
    function flush(createDiceRenderer){
      if(cancelled||!pending.length)return;
      if(!renderer)renderer=createDiceRenderer(node,{onPhase:renderedPhase,onUnavailable:fallback});
      renderer.addBatches(pending);pending=[];
      if(unavailable)fallback();
    }
    session.current={stop,add(fresh,styleId){
      generation++;cancelExit();layer.hidden=false;
      const visual=visualDice(fresh),style=diceStyles.find(s=>s.id===styleId)||diceStyles[0];
      results=[...results,...fresh].slice(-6);total+=visual.total;
      setDisplay({results,total,style:style.id});setPhase(unavailable?'unavailable':renderer?'rolling':'loading');
      pending.push({dice:visual.dice,style});
      // Bound the lazy-load queue as well as the live scene.
      let remaining=18;pending=pending.reverse().map(batch=>{const dice=remaining?batch.dice.slice(-remaining):[];remaining=Math.max(0,remaining-dice.length);return {...batch,dice};}).filter(batch=>batch.dice.length).reverse();
      if(renderer){flush();return;}
      if(!loading)loading=import('./lib/diceRenderer').then(({createDiceRenderer})=>flush(createDiceRenderer)).catch(()=>{if(!cancelled){fallback();pending=[];}}).finally(()=>{loading=null;});
    }};
    return()=>{cancelled=true;cancelExit();session.current=null;renderer?.dispose();};
  },[]);
  useEffect(()=>{
    const fresh=rolls.filter(r=>!seen.current.has(r.id)).reverse();seen.current=new Set(rolls.map(r=>r.id));
    if(!preferences.animation||reduced||!rolls.length){session.current.stop();return;}
    if(fresh.length)session.current.add(fresh,preferences.diceStyle);
  },[rolls,preferences.animation,reduced,preferences.diceStyle]);
  return createPortal(<div ref={stage} className="dice-stage" hidden={phase==='idle'} aria-hidden="true" data-style={display.style} data-tray={trayOpen?'open':'closed'} data-phase={phase} data-roll-ids={display.results.map(r=>r.id).join(',')}>
    <canvas ref={canvas} className="dice-canvas"/>
    <div className="dice-stage-caption"><span>{diceStyles.find(s=>s.id===display.style)?.name}</span>
      <div className="dice-stage-results">{display.results.map(r=><div key={r.id}><strong>{r.total}</strong><small>{r.label}</small></div>)}</div>
      <small>{phase==='unavailable'?'3D unavailable · result saved':display.total>18?`Showing 18 of ${display.total} dice · all results in history`:'Result recorded in roll history'}</small>
    </div>
  </div>,portal);
}
