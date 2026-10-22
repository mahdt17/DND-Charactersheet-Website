import React from 'react';
export default function SwarmResult({result:r,available,max,onSection}){
 if(!r)return null;
 return <details className="swarm-result" open key={JSON.stringify(r)}><summary>{r.name} · {r.target||'Last result'}</summary><div role="status" aria-label="Last swarm action"><strong>{r.name} used{r.target?` · ${r.target}`:''}</strong>
 {r.saveDC!=null&&<p>{r.saveAbility||'Constitution'} save {r.saveSucceeded?'succeeded':'failed'} · DC {r.saveDC}</p>}
 {r.roll!=null&&<p>Rolled {r.formula} = {r.roll}{r.saveSucceeded?' · Half damage, rounded down':''}</p>}
 {r.damage!=null&&<p className="swarm-result-damage">{r.damage} {r.damageType||'necrotic'} damage</p>}{r.healing!=null&&<p className="swarm-result-damage">{r.healing} HP healing</p>}{r.conditions?.map(t=><p key={t}>{t}</p>)}
 <p>{r.populationSpent||0} Population spent{r.populationRestored?` · ${r.populationRestored} restored`:''} · {available} / {max} now available</p><small>{r.id==='bug-swarm'?'Immediate effect resolved. ':''}Apply target damage, healing and conditions at the table.</small>
 {['summon','corpse-jacker'].includes(r.id)&&<button className="l-button" onClick={()=>onSection('creatures')}>View creature</button>}{['bug-armor','infest','latch','harmonize','swarm-form','invisible','decompose','reflex-armor','invicta','pure-terror'].includes(r.id)&&<button className="l-button" onClick={()=>onSection('active')}>View active effect</button>}</div></details>;
}
