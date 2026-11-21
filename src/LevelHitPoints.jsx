import React,{useState} from 'react';
import {rollDice,signed} from './lib/rules';

export function useLevelHitPoints(hitDie){
  const sides=Number(String(hitDie||'d8').replace(/^d/i,''));
  const fixed=Math.floor(sides/2)+1;
  const [choice,setChoice]=useState({method:'fixed',roll:null,manual:null});
  const pending=choice.method==='roll'&&choice.pending;
  const result=choice.method==='fixed'?fixed:choice[choice.method];
  return {sides,fixed,choice,setChoice,result,pending};
}

export default function LevelHitPoints({hp,conModifier,bonus=0,className,onRoll=expression=>rollDice(expression),allowManual=false}){
  const {sides,fixed,choice,setChoice,result}=hp;
  async function roll(){
    if(choice.pending)return;
    if(choice.roll!==null){setChoice({...choice,method:'roll'});return;}
    const dice=onRoll('1d'+sides,`${className} level-up HP`,{mode:'normal',inline:true,waitForDice:true,readLanding:true});
    if(!dice)return;
    setChoice(current=>({...current,method:'roll',pending:true}));
    const settled=await (dice.settled??dice);
    const valid=Number.isInteger(settled.total)&&settled.total>=1&&settled.total<=sides;
    setChoice(current=>({...current,pending:false,roll:valid?settled.total:null,
      method:!valid&&current.method==='roll'?'fixed':current.method}));
  }
  const selectFixed=()=>setChoice({...choice,method:'fixed'});
  return <fieldset className="creation-section">
    <legend>Hit points for this level</legend>
    <div className="l-toolbar">
      <button type="button" className={'l-button'+(choice.method==='fixed'?' primary':'')} aria-pressed={choice.method==='fixed'} onClick={selectFixed}>Take fixed {fixed}</button>
      <button type="button" className={'l-button'+(choice.method==='roll'?' primary':'')} aria-pressed={choice.method==='roll'} disabled={!!choice.pending} onClick={roll}>{choice.pending?'Rolling hit die…':choice.roll===null?'Roll 1d'+sides:'Use roll of '+choice.roll}</button>
    </div>
    {allowManual&&<details className="feature-detail"><summary>Enter a table result</summary>
      <label className="creation-field"><span>Hit die result before Constitution</span><input type="number" min="1" max={Math.max(30,sides)} value={choice.manual??''} onChange={e=>{
        const manual=e.target.valueAsNumber;
        if(e.target.value==='')setChoice({...choice,method:'fixed',manual:null});
        else if(Number.isInteger(manual)&&manual>=1&&manual<=Math.max(30,sides))setChoice({...choice,method:'manual',manual});
      }}/></label></details>}
    <p aria-live="polite">{hp.pending?'Waiting for the hit die to settle…':<>{result} {choice.method==='fixed'?'fixed':choice.method==='roll'?'rolled':'entered'} · {signed(conModifier)} Constitution{bonus?' · +'+bonus+' ancestry':''} · <strong>Gain {Math.max(1,result+conModifier)+bonus} HP</strong></>}</p>
  </fieldset>;
}
