import React,{useState} from 'react';
import {aasimarSource} from './data/aasimar';
import {aasimarProfile,aasimarActionBlock,useHealingHands,useAasimarTransformation,endAasimarTransformation,aasimarLightSpell} from './lib/aasimar';
const Button=({children,...props})=><button type="button" className="l-button" {...props}>{children}</button>;

export default function Aasimar({char,patch,abilities}){
 const [selected,setSelected]=useState('healing'),[target,setTarget]=useState('self'),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const p=aasimarProfile(char,abilities);if(!p.active)return null;
 const blocked=aasimarActionBlock(char),variant=p.variant,form=selected==='form'&&variant;
 function run(fn,message){try{patch(fn);setNotice(message);setError('');}catch(e){setError(e.message);}}
 return <section className="l-panel section-spaced" aria-label="Aasimar racial abilities">
  <h3>{variant?.name||'Aasimar'}</h3><p className="l-muted">{aasimarSource} · Darkvision 60 feet · Radiant and necrotic resistance</p>
  <div className="class-ability-picker" role="group" aria-label="Choose an Aasimar ability"><Button aria-label="Healing Hands" aria-pressed={!form} onClick={()=>setSelected('healing')}><strong>Healing Hands</strong><small>Action · {p.healingRemaining} / 1 use</small></Button>{variant&&<Button aria-label={variant.feature} aria-pressed={!!form} onClick={()=>setSelected('form')}><strong>{variant.feature}</strong><small>{p.canTransform?`Action · ${p.transformationRemaining} / 1 use`:'Unlocks at character level 3'}</small></Button>}</div>
  {!form?<article className="class-ability"><h4>Healing Hands</h4><p>Action · Touch · Restore {p.healing} HP · {p.healingRemaining} / 1 use · Long-rest recovery</p><label className="l-field"><span>Healing Hands target</span><select aria-label="Healing Hands target" value={target} onChange={e=>setTarget(e.target.value)}><option value="self">Myself — apply healing to my HP</option><option value="other">Another creature — resolve healing at the table</option></select></label><Button disabled={!!blocked||!p.healingRemaining} onClick={()=>run(current=>useHealingHands(current,{self:target==='self'}),target==='self'?`Healing Hands used: restored up to ${p.healing} HP to you.`:`Healing Hands used: the touched creature regains ${p.healing} HP. Apply this to its sheet.`)}>Use Healing Hands</Button></article>:<article className="class-ability">
   <h4>{variant.feature}</h4><p>Action to activate · 1 minute · {p.transformationRemaining} / 1 use · Long-rest recovery</p>
   {!p.canTransform&&<p>Available from character level 3.</p>}
   <p>Once on each of your own turns, add <strong>{p.extraDamage} {p.damageType} damage</strong> to one target you damage with an attack or spell.</p>
   {variant.id==='protector'&&<p>While transformed, gain a flying speed of 30 feet.</p>}
   {variant.id==='fallen'&&<p>On activation: Charisma save DC {p.dc} for other creatures within 10 feet that can see you. Failure frightens until your next turn ends. These wings do not grant flight.</p>}
   {variant.id==='scourge'&&<p>At the end of each of your turns: <strong>{p.auraDamage} radiant damage</strong> to you and every creature within 10 feet. Your share is {p.selfAuraDamage} damage after your radiant resistance. Bright light: 10 feet; dim light: another 10 feet.</p>}
   {p.formActive&&<p role="status">{variant.feature} active.{p.flyingSpeed>0?` Flying speed: ${p.flyingSpeed} feet.`:''}</p>}
   <div className="l-toolbar"><Button disabled={!!blocked||!p.canTransform||!p.transformationRemaining} onClick={()=>run(useAasimarTransformation,`${variant.feature} activated. Resolve targets and effects at the table.`)}>Activate {variant.feature}</Button>{p.formActive&&<Button onClick={()=>run(endAasimarTransformation,'Transformation ended.')}>End {variant.feature}</Button>}</div>
   <p className="l-muted">Resolve targets, saves and added damage at the table. End early as a bonus action, or clear the transformation when its minute finishes. Ending does not restore its use.</p>
   <details className="feature-detail"><summary>Full trait rules</summary><p>{variant.rules}</p></details>
  </article>}
  {blocked&&<p className="l-muted">{blocked}</p>}{!p.complete&&<p role="status">Choose Protector, Scourge or Fallen during character creation to gain a transformation.</p>}{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </section>;
}

export function AasimarLight({char,show,abilities}){
 const [notice,setNotice]=useState('');const spell=aasimarLightSpell(char),p=aasimarProfile(char,abilities);if(!spell)return null;
 const blocked=aasimarActionBlock(char);
 return <section className="l-panel section-spaced" aria-label="Aasimar Light Bearer"><h3>Light · Aasimar</h3><p>Racial cantrip · Action · Touch · 1 hour · At will</p><p>Charisma · save DC {p.dc} for an unwilling creature’s Dexterity save. Touch an object no larger than 10 feet in any dimension; it sheds bright light for 20 feet and dim light for another 20 feet. An opaque covering blocks the light.</p><p className="l-muted">This racial cantrip is additional to your class choices and uses no spell slot. Casting again or dismissing it as an action ends the earlier spell.</p><div className="l-toolbar"><Button disabled={!!blocked} onClick={()=>setNotice('Light cast. Resolve the touched object and any unwilling target’s save at the table.')}>Cast Light</Button><Button onClick={()=>show(spell)}>Light details</Button></div>{notice&&<p role="status">{notice}</p>}{blocked&&<p className="l-muted">{blocked}</p>}</section>;
}
