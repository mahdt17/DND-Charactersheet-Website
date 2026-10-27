import React,{useState} from 'react';
import ClassFeatureChoices from './ClassFeatureChoices';
import {totemSourceUrl} from './data/totemWarrior';
import {totemProfile,totemFeatureRows,totemChoicePlan,startTotemRage,endTotemRage,totemActionBlockReason,totemCastingBlockReason,totemRituals,castTotemRitual} from './lib/totemWarrior';
import {conditionEffects} from './lib/play';

export default function TotemWarrior({char,patch,roll,show}){
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[picks,setPicks]=useState({});
 const p=totemProfile(char,undefined,conditionEffects(char).speed),plan=totemChoicePlan(char,char,picks);
 if(p.level<3)return null;
 const blocked=totemActionBlockReason(char),castingBlocked=blocked||totemCastingBlockReason(char);
 const act=(action,message)=>{try{patch(action());setError('');setNotice(message);}catch(e){setError(e.message);}};
 return <section aria-label="Totem Warrior"><div className="l-section-head"><h3>Path of the Totem Warrior</h3><a href={totemSourceUrl} target="_blank" rel="noreferrer">2014 source ↗</a></div>
  <p>Spirit: {p.spirit||'Choose'} · Aspect: {p.level>=6?p.aspect||'Choose':'Barbarian 6'} · Attunement: {p.level>=14?p.attunement||'Choose':'Barbarian 14'}</p>
  {plan.groups.length>0&&<><p>Complete your missing Totem Warrior choices. Each choice is permanent; changing an existing choice requires your DM’s ruling.</p><ClassFeatureChoices plan={plan} picks={picks} onChange={setPicks}/><button className="l-button" disabled={!plan.valid} onClick={()=>{patch(plan.patch);setPicks({});setNotice('Totem choices saved.');}}>Save totem choices</button></>}
  <h4>Rage · bonus action</h4><p>{p.activeRage?'Rage active':'Rage inactive'} · {p.unlimited?'Unlimited uses':`${p.remaining} / ${p.max} uses remaining`} · Rage damage +{p.rageDamage}</p>
  <p>Rage lasts up to 1 minute. It normally ends early if you fall unconscious or end a turn without attacking a hostile creature or taking damage since your last turn. At Barbarian 15, Persistent Rage removes that attack/damage requirement. End it voluntarily as a bonus action. Track turns and these checks with your DM.</p>
  <p>While raging, you cannot cast spells or maintain concentration. Without heavy armor, Rage grants advantage on Strength checks and saves, its damage bonus to melee weapon attacks using Strength, and resistance to bludgeoning, piercing and slashing. The sheet includes these benefits in eligible rolls and typed damage.</p>
  {p.heavyArmor&&<p className="l-notice">Heavy armor suppresses the normal Rage combat benefits and the Eagle and Elk level 3 benefits. Bear resistance and other totem benefits follow their own source conditions.</p>}
  <div className="l-toolbar">{p.activeRage?<button className="l-button" onClick={()=>act(()=>endTotemRage(char),'Rage ended.')}>End Rage</button>:<button className="l-button" disabled={!!blocked||!p.unlimited&&!p.remaining} onClick={()=>act(()=>startTotemRage(char),'Rage started; concentration ended.')}>Start Rage{p.unlimited?'':' · spend 1 use'}</button>}</div>
  {blocked&&<p className="l-notice">{blocked}</p>}
  {p.activeRage&&p.movementBonus>0&&<p>Elk walking speed bonus: +{p.movementBonus} feet.</p>}
  {p.flyingSpeed>0&&<p>Flying speed: {p.flyingSpeed} feet. {p.flightNote}</p>}
  {p.activeRage&&p.attunement==='Elk'&&<><p>Elk trample · bonus action during movement · Strength save DC {p.elkDC} · Large or smaller target. Failure: prone and {p.elkDamage} bludgeoning damage.</p><button className="l-button" disabled={!!blocked||!roll} onClick={()=>roll?.(p.elkDamage,'Totemic Attunement · Elk · damage on failed save',{kind:'damage'})}>Roll Elk trample damage</button></>}
  <div>{totemFeatureRows(char).map(f=><details className="feature-detail" key={f.index}><summary>{f.name} · Barbarian {f.level}</summary><p>{f.description}</p>{f.name==='Totem Spirit'&&<p>Make or acquire your physical totem and record it in Inventory. Optional cosmetic animal traits can be recorded in Notes.</p>}</details>)}</div>
  <h4>Spirit rituals</h4><p>These class grants use ritual casting only: add 10 minutes to the listed casting time, spend no slot, and provide the normal components. Complete that time before marking a ritual cast. Starting Beast Sense replaces existing concentration.</p>
  {castingBlocked&&<p className="l-notice">{castingBlocked}</p>}
  {totemRituals(char).map(s=><details className="feature-detail" key={s.index}><summary>{s.name} · ritual only</summary><p>{s.casting_time} + 10 minutes · {s.range} · {s.duration}</p><p>Components: {s.components?.join(', ')}{s.material?` (${s.material})`:''}</p><p>{s.description}</p><div className="l-toolbar"><a href={s.sourceUrl} target="_blank" rel="noreferrer">Spell source ↗</a>{show&&<button className="l-button" onClick={()=>show(s)}>View spell</button>}<button className="l-button" disabled={!!castingBlocked} onClick={()=>act(()=>castTotemRitual(char,s.name),`${s.name} ritual completed.${s.concentration?' Concentration started.':''}`)}>Complete {s.name} ritual</button></div></details>)}
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
