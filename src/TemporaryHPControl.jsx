import React,{useState} from 'react';
import {temporaryHP} from './lib/hitPoints';

export default function TemporaryHPControl({hp,onChange}) {
  const [amount,setAmount]=useState(1);
  const change=mode=>onChange(temporaryHP(hp,amount,mode));
  return <section className="temp-hp-controls" aria-label="Temporary hit points">
    <div className="l-toolbar temp-hp-current">
      <label className="l-field"><span>Current temporary HP</span><input type="number" min="0" max="99999" step="1" value={hp.temp||0} onChange={e=>onChange(temporaryHP(hp,e.target.value,'set'))}/></label>
      <button className="l-button" disabled={!hp.temp} onClick={()=>change('clear')}>Clear temp HP</button>
    </div>
    <label className="l-field"><span>Temporary HP adjustment</span><input type="number" min="0" max="99999" step="1" value={amount} onChange={e=>setAmount(Math.max(0,Math.min(99999,Math.floor(Number(e.target.value)||0))))}/></label>
    <div className="l-toolbar"><button className="l-button" onClick={()=>change('grant')}>Grant temp HP</button><button className="l-button" disabled={!hp.temp} onClick={()=>change('reduce')}>Reduce temp HP</button></div>
    <p>Grant keeps the higher total. Edit the current value to set any amount.</p>
  </section>;
}
