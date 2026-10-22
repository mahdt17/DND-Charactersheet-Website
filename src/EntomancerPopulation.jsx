import React from 'react';
import {entomancerProfile} from './lib/entomancer';
export default function EntomancerPopulation({char,model,onRest}){
 const p=model?.profile||entomancerProfile(char);if(!p.level)return null;
 const recovery=model.recovery.shortRecovery;
 return <div className="swarm-population" role="group" aria-label="Population resource">
 <div className="swarm-population-top"><div><span className="l-eyebrow">Population ready to use</span><p>{p.max-p.remaining} unavailable · {model.summary.activityCount} ongoing · {model.summary.creatureCount} creatures</p></div><strong className="resource-count" aria-label="Population remaining">{p.remaining} / {p.max}</strong></div>
 <div className="swarm-population-meter" role="progressbar" aria-label="Available Population" aria-valuemin={0} aria-valuemax={p.max} aria-valuenow={p.remaining}><span style={{width:`${p.max?p.remaining/p.max*100:0}%`}}/></div>
 <div className="swarm-recovery"><p><strong>Short rest</strong><span>Recover up to {recovery}{model.recovery.shortRequiresFood?' when fed':''}.</span></p><p><strong>Long rest</strong><span>Restore all {p.max} when fed.</span></p></div>
 {onRest&&<div className="swarm-rest-buttons"><button className="l-button" onClick={()=>onRest('short')}>Short rest · recover Population</button><button className="l-button" onClick={()=>onRest('long')}>Long rest · refill Population</button></div>}
 {!p.remaining&&<p className="swarm-empty">No Population available. Free abilities can still be used.</p>}
 </div>;
}
