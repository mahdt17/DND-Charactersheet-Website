import React from 'react';
import {temporaryHP} from './lib/hitPoints';

export default function TemporaryHPControl({hp,onChange}) {
  const current=Math.max(0,Math.floor(Number(hp?.temp)||0));
  const setValue=value=>{
    const next=Math.max(0,Math.min(99999,Math.floor(Number(value)||0)));
    onChange(temporaryHP(hp,next,'set'));
  };

  return <label className="temp-hp-inline" title="Edit temporary hit points">
    <input
      aria-label="Temporary hit points"
      inputMode="numeric"
      type="number"
      min="0"
      max="99999"
      step="1"
      value={current}
      onFocus={e=>e.currentTarget.select()}
      onChange={e=>setValue(e.target.value)}
    />
    <span>Temporary</span>
  </label>;
}
