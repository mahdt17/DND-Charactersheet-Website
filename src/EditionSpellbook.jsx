import React,{useState} from 'react';
import {effectiveAbilities} from './CharacterManager';
import {modifier,signed,rollDice} from './lib/rules';
import {characterSlots,spellCounts,castingKey,is35,mechanics,permittedSpells,keyOf,resolveSpell,editionName} from './lib/editions';
import {spellPlan,availableSlots,criticalDice} from './lib/play';
import {useReferenceIndex} from './lib/referenceIndex';
import Dialog from './Dialog';
import SpellPicker from './EditionSpellPicker';

export default function EditionSpellbook({char,patch,roll,show,homebrew=[]}) {
  const [manage,setManage]=useState(false),[cast,setCast]=useState(null),[slot,setSlot]=useState(1),[formula,setFormula]=useState(''),[attack,setAttack]=useState(false),[castError,setCastError]=useState(''),[castNotice,setCastNotice]=useState('');
  const reference=useReferenceIndex(),manual=is35(char)||char.ruleset==='custom';
  const slots=characterSlots(char),ability=castingKey(char),mod=modifier(effectiveAbilities(char)[ability]||10);
  const counts=spellCounts(char,effectiveAbilities(char)[ability]||10),pb=is35(char)?Number(char.bab)||0:2+Math.floor((char.level-1)/4);
  const candidates=permittedSpells(char,[...homebrew,...reference.entries]);
  const selected=(char.spells||[]).map(s=>keyOf(s));
  const cantrips=char.spells.filter(s=>!s.auto&&s.level===0),leveled=char.spells.filter(s=>!s.auto&&s.level>0);
  const spellLimit=manual||counts.mode==='spellbook'?Infinity:counts.prepared;
  const prepared=leveled.filter(s=>s.prepared).length;
  const overLimit=!manual&&(cantrips.length>counts.cantrips||leveled.length>spellLimit||counts.mode==='spellbook'&&prepared>counts.prepared);
  function add(s) {
    const key=keyOf(s),existing=char.spells.find(x=>keyOf(x)===key);
    if(existing){patch({spells:char.spells.filter(x=>x.id!==existing.id)});return;}
    const number=char.spells.filter(x=>!x.auto&&(x.level===0)===(s.level===0)).length;
    const limit=manual?Infinity:s.level===0?counts.cantrips:counts.mode==='spellbook'?Infinity:counts.prepared;
    if(number>=limit)return;
    patch({spells:[...char.spells,{...s,id:crypto.randomUUID(),prepared:manual||counts.mode!=='spellbook'}]});
  }
  function open(s){const data={...resolveSpell(s,char),...s};setCast(data);setCastError('');setSlot(availableSlots(char,data)[0]?.level??Math.max(is35(char)?0:1,Number(data.level)||0));setFormula(s.rollFormula||'');setAttack(!!s.rollAttack);}
  const plan=cast?spellPlan(cast,char,slot,mod):null;
  const expressions=plan?.rolls.filter(r=>/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$|^\d+$/.test(r.expression))||[];
  const needsSlot=cast&&(is35(char)||cast.level!==0)&&!cast.auto;
  function castSpell(ritual=false){
    if(cast.level==null){setCastError('Set this reference spell’s level before casting.');return;}
    if(needsSlot&&!ritual&&!availableSlots(char,cast).some(x=>x.level===slot)){setCastError('Choose an available slot for this spell.');return;}
    if(formula&&!/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/.test(formula.replace(/\s/g,''))){setCastError('Use a roll such as 3d6+2.');return;}
    const dice=formula?[{expression:formula.replace(/\s/g,''),label:'Custom spell roll'}]:expressions;
    try{for(const d of dice){if(!/^\d+$/.test(d.expression)){rollDice(d.expression,'normal',()=>0);if(!is35(char)&&(plan.attack||attack)&&/damage/i.test(d.label))rollDice(criticalDice(d.expression),'normal',()=>0);}}}catch(error){setCastError(error.message);return;}
    if(!ritual)for(let i=0;i<(plan.attack||attack?plan.count:1);i++){
      const hit=plan.attack||attack?roll(`1d20${signed(is35(char)?(Number(char.bab)||0)+modifier(effectiveAbilities(char)[/ranged/i.test(cast.attack_type||cast.description||'')?'dex':'str']):pb+mod)}`,`${cast.name} · attack ${i+1}`,{kind:'attack'}):null;
      for(const d of dice){if(/^\d+$/.test(d.expression))continue;roll(!is35(char)&&hit&&hit.total-hit.bonus===20&&/damage/i.test(d.label)?criticalDice(d.expression):d.expression,`${cast.name} · ${d.label}`,{kind:'damage'});}
    }
    patch({...(needsSlot&&!ritual?{slotsUsed:{...char.slotsUsed,[slot]:(char.slotsUsed?.[slot]||0)+1}}:{}),...(cast.concentration?{concentration:cast.name}:{}),spells:char.spells.map(s=>s.id===cast.id?{...s,rollFormula:formula,rollAttack:attack}:s)});
    setCastNotice(`${cast.name} cast${ritual?' as a ritual':needsSlot?` using a level ${slot} slot`:''}.${cast.concentration?' Concentration started.':''}`);setCast(null);
  }
  return <><div className="l-section-head"><h2>Spellbook · {editionName(char.ruleset)}</h2><button className="l-button" onClick={()=>setManage(!manage)}>{manage?'Done':'Manage spells'}</button></div>
    <div className="form-grid"><label className="l-field"><span>Casting ability</span><select value={ability} onChange={e=>patch({castingAbility:e.target.value})}><option value="">Choose</option>{['str','dex','con','int','wis','cha'].map(k=><option key={k}>{k}</option>)}</select></label><p>Spell attack {signed(pb+mod)} · Save DC {is35(char)?`10 + spell level ${signed(mod)}`:8+pb+mod}</p></div>
    {castNotice&&<p className="l-notice" role="status">{castNotice}</p>}{!manual&&<p>Cantrips: {cantrips.length} / {counts.cantrips} · Prepared spells: {counts.mode==='spellbook'?prepared:leveled.length} / {counts.prepared||0}{counts.mode==='spellbook'?` · Spellbook: ${leveled.length} spells`:''}</p>}{overLimit&&<p className="l-notice" role="alert">This character exceeds its spell limit. Remove extra class spells or unprepare extras before casting. Your saved spells have been kept.</p>}
    {manual&&<details className="feature-detail"><summary>Spell slots and homebrew adjustments</summary><p>Set slots from your class progression. In 3.5, level 0 spells also consume slots; damage scales with caster level. Psionic power points use an Actions resource counter.</p><div className="form-grid">{slots.map((n,i)=><label className="l-field" key={i}><span>Level {i} slots</span><input type="number" min="0" max="30" value={n} onChange={e=>patch({slotOverride:slots.map((x,j)=>j===i?Math.max(0,Math.min(30,Number(e.target.value)||0)):x)})}/></label>)}</div></details>}
    <div className="slot-trackers">{slots.map((n,i)=>n>0&&<div key={i}><strong>Level {i}</strong><span>{Array.from({length:n},(_,j)=><button key={j} className={`slot-pip ${(char.slotsUsed?.[i]||0)>j?'used':''}`} aria-label={`Level ${i} slot ${j+1}`} onClick={()=>patch({slotsUsed:{...char.slotsUsed,[i]:(char.slotsUsed?.[i]||0)===j+1?j:j+1}})}/>)}</span></div>)}</div>
    {manage&&<><p>Choose spells to add or remove. {manual?'Cross-edition rules and reference spell levels can be set below.':`Cantrip limit: ${counts.cantrips}. Prepared limit: ${counts.prepared||0}.`}</p>{manual?<SpellPicker label="Available edition spells" spells={candidates} selected={selected} onToggle={add}/>:<><SpellPicker label="Class cantrips" spells={candidates.filter(s=>s.level===0)} selected={cantrips.map(keyOf)} limit={counts.cantrips} onToggle={add}/><SpellPicker label={counts.mode==='spellbook'?'Spellbook spells':'Prepared class spells'} spells={candidates.filter(s=>s.level>0)} selected={leveled.map(keyOf)} limit={spellLimit} onToggle={add}/></>}{reference.error&&manual&&<p role="alert">{reference.error}</p>}</>}
    <div className="spell-table">{char.spells.map(s=><div className="spell-item" key={s.id}><button className="spell-name" onClick={()=>show(resolveSpell(s,char))}><strong>{s.name}</strong><small>{s.level==null?'Set spell level':s.level===0?'Level 0':`Level ${s.level}`} · {editionName(s.edition)}{s.referenceOnly?' · Source reference':''}</small></button>{s.sourceUrl&&<a href={s.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}{(s.referenceOnly||manual)&&<label className="l-field"><span>Spell level</span><select value={s.level??''} onChange={e=>patch({spells:char.spells.map(x=>x.id===s.id?{...x,level:Number(e.target.value)}:x)})}><option value="" disabled>Choose</option>{Array.from({length:10},(_,i)=><option key={i}>{i}</option>)}</select></label>}{!manual&&s.level>0&&counts.mode==='spellbook'&&<button className="l-button" disabled={!s.prepared&&char.spells.filter(x=>x.prepared&&x.level>0).length>=counts.prepared} onClick={()=>patch({spells:char.spells.map(x=>x.id===s.id?{...x,prepared:!x.prepared}:x)})}>{s.prepared?'Prepared':'Prepare'}</button>}<button className="l-button" disabled={overLimit||s.level==null||!manual&&s.level>0&&counts.mode==='spellbook'&&!s.prepared} onClick={()=>open(s)}>Cast</button></div>)}</div>
    {cast&&<Dialog title={`Cast ${cast.name}`} onClose={()=>setCast(null)}>{needsSlot&&<label className="l-field"><span>Spell slot</span><select value={slot} onChange={e=>setSlot(Number(e.target.value))}>{availableSlots(char,cast).map(o=><option key={o.level} value={o.level}>Level {o.level} · {o.remaining} left</option>)}</select></label>}{needsSlot&&!availableSlots(char,cast).length&&<p role="status">No spell slots remain for this spell. Rest to recover slots, or use ritual casting if available.</p>}<p>{plan.notes}</p><ul>{expressions.map((r,i)=><li key={i}>{r.label}: {r.expression}</li>)}</ul><label className="l-field"><span>Custom damage or healing roll (optional)</span><input value={formula} onChange={e=>setFormula(e.target.value)} placeholder="e.g. 5d6"/></label><label><input type="checkbox" checked={attack} onChange={e=>setAttack(e.target.checked)}/> Roll an attack</label>{castError&&<p role="alert">{castError}</p>}<div className="l-toolbar"><button className="l-button primary" disabled={needsSlot&&!availableSlots(char,cast).length} onClick={()=>castSpell()}>Cast{needsSlot?' & spend slot':''}</button>{cast.ritual&&!is35(char)&&<button className="l-button" onClick={()=>castSpell(true)}>Cast as ritual (+10 minutes)</button>}<button className="l-button" onClick={()=>setCast(null)}>Cancel casting</button></div><p className="l-muted">Damage rolls are potential results. Resolve targets, saves, resistances and continuing effects at the table.</p></Dialog>}
  </>;
}
