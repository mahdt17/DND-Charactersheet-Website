import React,{useState} from 'react';
import {entomancerProfile,populationId} from './lib/entomancer';
import {adjustResource} from './lib/resources';

export default function EntomancerPopulation({char,patch,onRest}){
 const [amount,setAmount]=useState(1),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const p=entomancerProfile(char);if(!p.level)return null;
 const recovery=p.settings.shortRecovery==null?Math.floor(p.max/2):Math.max(0,Math.floor(Number(p.settings.shortRecovery)||0));
 const valid=Number.isInteger(amount)&&amount>0;
 function adjust(direction){
  try{
   const next=patch(current=>({...current,...adjustResource(current,populationId,direction*amount)}));
   setNotice(next?`${Math.abs(entomancerProfile(next).used-p.used)} Population ${direction>0?'spent':'restored'}.`:'Population updated.');setError('');
  }catch(e){setError(e.message);setNotice('');}
 }
 return <div className="swarm-population" role="group" aria-label="Population resource">
  <div className="swarm-population-top"><div><span className="l-eyebrow">Available Population</span><p>Abilities spend from this pool automatically.</p></div><strong className="resource-count" aria-label="Population remaining">{p.remaining} / {p.max}</strong></div>
  <div className="swarm-population-meter" role="progressbar" aria-label="Available Population" aria-valuemin={0} aria-valuemax={p.max} aria-valuenow={p.remaining}><span style={{width:`${p.max?p.remaining/p.max*100:0}%`}}/></div>
  <div className="swarm-recovery"><p><strong>Short rest</strong><span>Recover up to {recovery}{p.settings.shortRestRequiresFood?' when fed':''}.</span></p><p><strong>Long rest</strong><span>Refill when your swarm is fed.</span></p>{onRest&&<button className="l-button" onClick={onRest}>Take a rest</button>}</div>
  {!p.remaining&&<p className="swarm-empty">No Population available. Abilities with no Population cost can still be used.</p>}
  <details className="swarm-adjust"><summary>Adjust Population manually</summary><p>Use this only for changes resolved at the table. Ability costs, refunds and rests are already included.</p>
   <div className="l-toolbar"><label className="l-field"><span>Amount</span><input aria-label="Population amount" type="number" min="1" step="1" value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label><button className="l-button" disabled={!valid||amount>p.remaining} onClick={()=>adjust(1)}>Spend Population</button><button className="l-button" disabled={!valid||!p.used} onClick={()=>adjust(-1)}>Restore Population</button></div>
   {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
  </details>
 </div>;
}
