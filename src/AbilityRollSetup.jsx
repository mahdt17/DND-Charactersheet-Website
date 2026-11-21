import React,{useEffect,useRef} from 'react';
import {abilityRollKeys,abilityRollSetup,recordAbilityRoll,assignAbilityRoll} from './lib/abilityRolls';
const names=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
export default function AbilityRollSetup({draft,patch,onRoll,rolling,setRolling}){
 const active=useRef(null);
 useEffect(()=>()=>{active.current=null;setRolling(false);},[setRolling]);
 async function roll(indices){
   if(active.current)return;
   const request={};active.current=request;setRolling(true);
   try{
     const scores=await Promise.all(indices.map(async index=>{
       const result=onRoll('4d6dl1',`Roll ${index+1} ability score`,{inline:true,mode:'normal',waitForDice:true,readLanding:true});
       return result?.settled??result;
     }));
     if(active.current!==request||scores.some(score=>!score))return;
     patch(indices.length===1?recordAbilityRoll(draft,indices[0],scores[0]):abilityRollSetup(scores,draft.abilityRollAssignments).patch);
   }finally{if(active.current===request){active.current=null;setRolling(false);}}
 }
 return <div className="l-notice"><p>Roll four d6 and drop one lowest die for each score. Roll individually or all at once, then assign each result to an ability. Choosing an occupied ability swaps the two assigned rolls. Normal bonuses are added separately.</p>
  <button type="button" className="l-button primary" disabled={rolling} onClick={()=>roll([0,1,2,3,4,5])}>Roll all six ability scores</button>
  {rolling&&<p role="status">Waiting for ability dice to settle…</p>}
  <section aria-label="Ability roll results" role="region" aria-live="polite" className="creation-grid three">
   {Array.from({length:6},(_,index)=>{const result=draft.abilityRollPool?.[index],assigned=abilityRollKeys.find(key=>draft.abilityRollAssignments?.[key]===index)||'';return <article key={index}>
    <h4>Roll {index+1}{result?` · ${result.total}`:''}</h4>
    {result?<p>[{result.rolls.join(', ')}] · drop {result.dropped[0]} · kept {result.kept.join(' + ')} = <strong>{result.total}</strong></p>:<p>Not rolled yet</p>}
    <button type="button" className="l-button" disabled={rolling} onClick={()=>roll([index])}>{result?'Reroll':'Roll'} score {index+1}</button>
    <label className="creation-field"><span>Assign roll {index+1} to</span><select aria-label={`Assign roll ${index+1} to`} value={assigned} disabled={rolling||!result} onChange={e=>patch(assignAbilityRoll(draft,index,e.target.value))}><option value="">Unassigned</option>{abilityRollKeys.map((key,i)=><option key={key} value={key}>{names[i]}</option>)}</select></label>
   </article>;})}
  </section>
 </div>;
}
