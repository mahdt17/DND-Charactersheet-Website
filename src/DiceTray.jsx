import React,{useState} from 'react';
import {Dices,X} from 'lucide-react';
import {diceStyles} from './lib/presentation';
import {signed} from './lib/rules';
import {usePresentation,useReducedMotion} from './PresentationSettings';

export default function DiceTray({rolls,mode,setMode,roll,clear,close}) {
  const [expression,setExpression]=useState('1d20'),{preferences,update}=usePresentation(),reduced=useReducedMotion();
  return <aside className="dice-tray" aria-label="Dice roller">
    <div className="l-section-head"><h3><Dices size={20}/> Dice roller</h3><button className="l-button" aria-label="Close dice roller" onClick={close}><X size={17}/></button></div>
    <fieldset className="dice-style-picker"><legend>Your dice collection</legend><div>{diceStyles.map(style=><label key={style.id} className="dice-style-option" title={style.description} style={{'--die-body':style.body,'--die-edge':style.edge,'--die-ink':style.ink}}>
      <input type="radio" name="dice-style" value={style.id} checked={preferences.diceStyle===style.id} onChange={()=>update({diceStyle:style.id})}/><span className="dice-swatch" aria-hidden="true">20</span><strong>{style.name}</strong>
    </label>)}</div></fieldset>
    <label className="dice-animation-setting"><input type="checkbox" checked={preferences.animation} onChange={e=>update({animation:e.target.checked})}/>Animated dice</label>
    {reduced&&<p className="dice-motion-note">Reduced motion is enabled on your device. Results appear without animation.</p>}
    <div className="dice-buttons">{[4,6,8,10,12,20,100].map(n=><button key={n} onClick={()=>roll(`1d${n}`)}>d{n}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();roll(expression);}}><input aria-label="Dice expression" value={expression} onChange={e=>setExpression(e.target.value)} placeholder="2d6+3"/><button className="l-button primary" type="submit">Roll</button></form>
    <select aria-label="D20 roll mode" value={mode} onChange={e=>setMode(e.target.value)}><option value="normal">Normal roll</option><option value="advantage">Advantage (1d20)</option><option value="disadvantage">Disadvantage (1d20)</option></select>
    <div className="roll-history" aria-live="polite">{rolls.length?rolls.map(r=><div className="roll-result" key={r.id}><strong>{r.total}</strong><div><b>{r.label}</b><small>{r.expression} · [{r.rolls.join(', ')}]{r.bonus?` ${signed(r.bonus)}`:''}{r.mode!=='normal'?` · ${r.mode}`:''}</small></div></div>):<p>Choose a die or click a character’s bonus to roll.</p>}</div>
    {rolls.length>0&&<button className="l-back" onClick={clear}>Clear history</button>}
  </aside>;
}
