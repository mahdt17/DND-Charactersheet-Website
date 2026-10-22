import React,{useState} from 'react';
import {adjustResource} from '../lib/resources';
import {populationId,entomancerProfile} from '../lib/entomancer';
import SwarmSettings from './SwarmSettings';
import {NumberField} from './SwarmFields';
export default function SwarmRecovery({char,model,patch,roll,ui,onUiChange}){
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),amount=ui.recoveryInput.amount,p=model.profile;
 const adjust=direction=>{try{let before;const after=patch(current=>{before=entomancerProfile(current);return {...current,...adjustResource(current,populationId,direction*amount)};});const delta=entomancerProfile(after).used-before.used;setNotice(`${Math.abs(delta)} Population ${delta>0?'spent':'restored'}.`);setError('');}catch(e){setError(e.message);setNotice('');}};
 return <section aria-label="Swarm recovery"><h3>Recover and maintain your swarm</h3><p>A short rest recovers up to {model.recovery.shortRecovery} Population{model.recovery.shortRequiresFood?' when fed':''}. A fed long rest refills the reserve. Use the rest buttons above to preview and complete the rest.</p>
 <h4>Population that may return</h4>{model.recovery.pendingReturns.length?<><p className="l-muted">These are possible future recoveries, not extra points to spend. Returns are capped at your maximum when resolved.</p>{model.recovery.pendingReturns.map(r=><div className="swarm-return-row" key={r.id}><strong>{r.name}</strong><span>Up to {r.amount} · {r.trigger}</span></div>)}</>:<p className="l-muted">No pending returns. Rest to recover spent Population.</p>}
 <details className="swarm-adjust"><summary>Adjust Population manually</summary><p>Use for table adjustments. Ability costs, refunds and rests are automatic.</p><div className="l-toolbar"><NumberField label="Population amount" min={1} value={amount} onChange={v=>onUiChange(u=>({...u,recoveryInput:{...u.recoveryInput,amount:v}}))}/><button className="l-button" disabled={!Number.isInteger(amount)||amount<1||amount>p.remaining} onClick={()=>adjust(1)}>Spend Population</button><button className="l-button" disabled={!Number.isInteger(amount)||amount<1||!p.used} onClick={()=>adjust(-1)}>Restore Population</button></div>{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}</details>
 <SwarmSettings char={char} patch={patch} roll={roll} model={model} ui={ui} onUiChange={onUiChange}/><details className="feature-detail"><summary>Recent swarm activity</summary>{(char.entomancer?.log||[]).slice(-12).reverse().map((t,i)=><p key={i}>{t}</p>)}</details></section>;
}
