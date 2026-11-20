import React,{useState} from 'react';
import {rollDice,signed} from './lib/rules';

export function useLevelHitPoints(hitDie){
  const sides=Number(String(hitDie||'d8').replace(/^d/i,''));
  const fixed=Math.floor(sides/2)+1;
  const [choice,setChoice]=useState({method:'fixed',roll:null,manual:null});
  const result=choice.method==='fixed'?fixed:choice[choice.method];
  return {sides,fixed,choice,setChoice,result};
}

export default function LevelHitPoints({hp,conModifier,bonus=0,className,onRoll=expression=>rollDice(expression),allowManual=false}){
  const {sides,fixed,choice,setChoice,result}=hp;
  function roll(){
    const rolled=choice.roll??onRoll('1d'+sides,`${className} level-up HP`,{mode:'normal',inline:true})?.total;
    if(Number.isInteger(rolled)&&rolled>=1&&rolled<=sides)setChoice({...choice,method:'roll',roll:rolled});
  }
  const selectFixed=()=>setChoice({...choice,method:'fixed'});
  return <fieldset className="creation-section">
    <legend>Hit points for this level</legend>
    <div className="l-toolbar">
      <button type="button" className={'l-button'+(choice.method==='fixed'?' primary':'')} aria-pressed={choice.method==='fixed'} onClick={selectFixed}>Take fixed {fixed}</button>
      <button type="button" className={'l-button'+(choice.method==='roll'?' primary':'')} aria-pressed={choice.method==='roll'} onClick={roll}>{choice.roll===null?'Roll 1d'+sides:'Use roll of '+choice.roll}</button>
    </div>
    {allowManual&&<details className="feature-detail"><summary>Enter a table result</summary>
      <label className="creation-field"><span>Hit die result before Constitution</span><input type="number" min="1" max={Math.max(30,sides)} value={choice.manual??''} onChange={e=>{
        const manual=e.target.valueAsNumber;
        if(e.target.value==='')setChoice({...choice,method:'fixed',manual:null});
        else if(Number.isInteger(manual)&&manual>=1&&manual<=Math.max(30,sides))setChoice({...choice,method:'manual',manual});
      }}/></label></details>}
    <p aria-live="polite">{result} {choice.method==='fixed'?'fixed':choice.method==='roll'?'rolled':'entered'} · {signed(conModifier)} Constitution{bonus?' · +'+bonus+' ancestry':''} · <strong>Gain {Math.max(1,result+conModifier)+bonus} HP</strong></p>
  </fieldset>;
}
