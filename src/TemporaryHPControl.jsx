import React,{useEffect,useState} from 'react';
import {temporaryHP} from './lib/hitPoints';

export default function TemporaryHPControl({hp,onChange}) {
  const current=Math.max(0,Math.floor(Number(hp?.temp)||0));
  const [draft,setDraft]=useState(String(current));
  useEffect(()=>setDraft(String(current)),[current]);

  const commit=()=>{
    const value=Math.max(0,Math.min(99999,Math.floor(Number(draft)||0)));
    setDraft(String(value));
    if(value!==current)onChange(temporaryHP(hp,value,'set'));
  };

  return <label className="temp-hp-inline" title="Edit temporary hit points">
    <input
      aria-label="Temporary hit points"
      inputMode="numeric"
      type="number"
      min="0"
      max="99999"
      step="1"
      value={draft}
      onFocus={e=>e.currentTarget.select()}
      onChange={e=>setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e=>{
        if(e.key==='Enter')e.currentTarget.blur();
        if(e.key==='Escape'){setDraft(String(current));e.currentTarget.blur();}
      }}
    />
    <span>Temporary</span>
  </label>;
}
