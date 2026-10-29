import {subclassNumericProfile} from './lib/subclassNumerics';
import {campaignModifiers} from './lib/campaignModifiers';
import React,{useState} from 'react';
import {bladesongProfile,bladesongEffectId,startBladesong,endBladesong,useSongOfDefense} from './lib/bladesinging.js';
import {effectiveAbilityScores} from './lib/abilityScores.js';
import {activeEffects} from './lib/spellEffects.js';
import {availableSlots} from './lib/play.js';

const Button=props=><button type="button" className="l-button" {...props}/>;
export default function BladesingingTools({char,patch,roll,onSpells}){
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[selected,setSelected]=useState(''),[triggered,setTriggered]=useState(false);
 const p=bladesongProfile(char),scores=effectiveAbilityScores(char);
 if(!p.active)return null;
 const slots=p.canSongOfDefense?availableSlots(char,{level:1}):[];
 const key=s=>`${s.pool||'standard'}:${s.level}`,slot=slots.find(s=>key(s)===selected)||slots[0];
 const seconds=activeEffects(char).find(e=>e.id===bladesongEffectId)?.remainingSeconds;
 function run(action){setError('');try{action();}catch(e){setError(e.message);}}
 function start(){run(()=>{patch(startBladesong(char));setNotice('Bladesong started. Bonus action used.');});}
 function defense(){run(()=>{
  const result=useSongOfDefense(char,{slotLevel:slot?.level,slotPool:slot?.pool||'standard',availableSlots:slots,triggered});
  patch(result.patch);setTriggered(false);setNotice(`Prevent ${result.reduction} damage from the triggering hit. Apply any remaining damage to your HP.`);
 });}
 function concentration(){
  const bonus=Math.floor((Number(scores.con??10)-10)/2)+(char.saveProf?.con?p.pb:0)+p.concentrationBonus+subclassNumericProfile(char).saveBonus+(campaignModifiers(char).conSave||0);
  roll?.(`1d20${bonus>=0?'+':''}${bonus}`,'Concentration save · Bladesong',{kind:'save'});
 }
 return <section aria-label="Bladesinging tools" className="class-ability">
  <header><h3>Bladesong</h3><p className="l-muted">Tasha’s Cauldron of Everything · Wizard {p.level}</p></header>
  <p aria-label="Bladesong uses"><strong>{p.remaining} / {p.max}</strong> uses · Recover on a long rest</p>
  {p.singing?<><p role="status"><strong>Bladesong active</strong>{seconds!=null?` · ${Math.ceil(seconds/6)} rounds remaining`:''}</p><p>+{p.acBonus} AC · +10 ft. walking speed · +{p.concentrationBonus} to concentration saves · Advantage on Acrobatics checks</p><div className="l-toolbar"><Button onClick={concentration}>Roll concentration save</Button><Button onClick={()=>{patch(endBladesong(char));setNotice('Bladesong ended.');}}>End Bladesong</Button></div></>:<p>Use a bonus action to begin. Lasts up to 1 minute.</p>}
  <Button disabled={!!p.blocked||p.remaining===0} onClick={start}>Start Bladesong</Button>
  <p className="l-muted">No medium or heavy armor or shield. Bladesong ends if you become incapacitated or use two hands for a weapon attack.</p>
  {p.blocked&&<p role="status">{p.blocked}</p>}
  {p.level>=6&&<article><h4>Extra Attack</h4><p>Attack twice with the Attack action. You can replace one of those attacks with a cantrip.</p></article>}
  {p.canSongOfDefense&&<article><h4>Song of Defense</h4><p>While Bladesong is active, spend your reaction and a spell slot to prevent 5 damage per slot level.</p>
   <label className="l-field"><span>Song of Defense slot</span><select aria-label="Song of Defense slot" value={slot?key(slot):''} onChange={e=>setSelected(e.target.value)}>{!slots.length&&<option value="">No spell slots remaining</option>}{slots.map(s=><option key={key(s)} value={key(s)}>Level {s.level} · {s.pool==='pact'?'Pact':'Standard'} · {s.remaining} remaining</option>)}</select></label>
   <label><input type="checkbox" checked={triggered} onChange={e=>setTriggered(e.target.checked)}/>I am taking damage and my reaction is available</label>
   <div className="l-toolbar"><Button disabled={!p.singing||!triggered||!slot} onClick={defense}>Use Song of Defense</Button></div>
  </article>}
  {p.level>=14&&<article><h4>Song of Victory</h4><p>While Bladesong is active, add your Intelligence modifier (minimum +1) to your melee weapon attack damage.{p.singing?` Current bonus: +${p.meleeWeaponDamageBonus}.`:''}</p></article>}
  {onSpells&&<Button onClick={onSpells}>Open spells</Button>}
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </section>;
}
