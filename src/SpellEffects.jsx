import {conditionEffects} from './lib/play';
import React from 'react';
import {activeEffects,advanceEffectTime,endEffect,canEndEffect} from './lib/spellEffects';
export default function SpellEffects({char,patch}){
 const effects=activeEffects(char);
 if(!effects.length)return null;
 return <section aria-label="Active spell effects"><h3>Active effects</h3>{effects.map(e=><div key={e.id} className="resource-row"><span><strong>{e.name}</strong> · {e.expires==='start-next-turn'?'Until the start of your next turn':e.remainingSeconds!=null?`${Math.ceil(e.remainingSeconds/60)} minutes remaining`:'Until ended'}{e.requiresUnarmored?' · Unarmored only':''}</span>{canEndEffect(char,e)&&<button className="l-button" onClick={()=>patch(current=>endEffect(current,e.id))}>End {e.name}</button>}</div>)}<div className="l-toolbar"><button className="l-button" onClick={()=>patch(current=>advanceEffectTime(current,{startTurn:true,maxHP:conditionEffects(current).maxHP}))}>Start next turn</button><button className="l-button" onClick={()=>patch(current=>advanceEffectTime(current,{endTurn:true}))}>End turn</button>{[[6,'1 round'],[60,'1 minute'],[3600,'1 hour']].map(([seconds,label])=><button className="l-button" key={seconds} onClick={()=>patch(current=>advanceEffectTime(current,{seconds}))}>Advance {label}</button>)}</div><p className="l-muted">Advance elapsed game time here. Resting also advances these durations.</p></section>;
}
