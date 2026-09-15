import ClassProgression from './ClassProgression';
import React,{useState,useEffect,useRef} from 'react';
import {ABILITIES,effectiveAbilities} from './CharacterManager';
import {modifier} from './lib/rules';
import {modern,mechanics,is35,levelRecord,spellCounts,permittedSpells,keyOf,castingKey,legacyProgression} from './lib/editions';
import {useReferenceIndex} from './lib/referenceIndex';
import SpellPicker from './EditionSpellPicker';
import {focusDialog} from './GuidedSetup';

export default function EditionLevelUp({char,onCancel,onFinish,homebrew=[]}) {
  const shell=useRef(null);useEffect(focusDialog(shell),[]);
  const target=Math.min(20,char.level+1),manual=is35(char)||char.ruleset==='custom';
  const record=levelRecord(char,target),asi=!manual&&(record.features||[]).some(f=>/ability score improvement/i.test(f.name));
  const [step,setStep]=useState(0),[mode,setMode]=useState('scores'),[first,setFirst]=useState(''),[second,setSecond]=useState(''),[feat,setFeat]=useState(''),[notes,setNotes]=useState(''),[subclass,setSubclass]=useState(char.subclass||'');
  const [abilities,setAbilities]=useState({...char.abilities}),[hpGain,setHpGain]=useState(Math.floor(Number(char.hitDie?.slice(1)||8)/2)+1);
  const [added,setAdded]=useState([]);
  const reference=useReferenceIndex();
  const needsSubclass=!manual&&target>=3&&!char.subclass;
  const nextAbilities={...abilities};
  if(asi&&mode==='scores'){if(first)nextAbilities[first]++;if(second)nextAbilities[second]++;}
  const draft={...char,level:target,abilities:nextAbilities},effective=effectiveAbilities(draft);
  const counts=spellCounts(draft,effective[castingKey(draft)]||10),current=char.spells||[];
  const candidates=permittedSpells(draft,[...homebrew,...reference.entries]).filter(s=>!current.some(c=>keyOf(c)===keyOf(s)));
  const cantripGain=manual?Infinity:Math.max(0,counts.cantrips-current.filter(s=>s.level===0&&!s.auto).length);
  const spellGain=manual?Infinity:Math.max(0,(counts.mode==='spellbook'?counts.known:counts.prepared||0)-current.filter(s=>s.level>0&&!s.auto).length);
  const selectedCantrips=added.filter(s=>s.level===0),selectedSpells=added.filter(s=>s.level!==0);
  const hp=Math.max(1,hpGain+modifier(effective.con))+(mechanics(char)==='2024'&&char.race==='Dwarf'?1:0)+(modifier(effective.con)-modifier(effectiveAbilities(char).con))*char.level;
  function toggle(s){setAdded(list=>list.some(x=>keyOf(x)===keyOf(s))?list.filter(x=>keyOf(x)!==keyOf(s)):[...list,s]);}
  const choicesValid=(!needsSubclass||subclass.trim().length>1)&&(!asi||(mode==='feat'?feat.trim().length>1:first&&second&&Object.values(effective).every(n=>n<=20)));
  const spellsValid=manual||selectedCantrips.length===cantripGain&&selectedSpells.length===spellGain;
  function finish(){if(!choicesValid||!spellsValid)return;const result={...draft,subclass:subclass.trim(),hp:{...char.hp,max:char.hp.max+hp,current:Math.min(char.hp.max+hp,char.hp.current+hp)},spells:[...current,...added.map(s=>({...s,id:crypto.randomUUID(),prepared:manual||counts.mode!=='spellbook'}))],notes:[char.notes,notes].filter(Boolean).join('\n\n')};if(mode==='feat'&&feat.trim())result.feats=[...(char.feats||[]),{id:crypto.randomUUID(),name:feat.trim(),description:notes,level:target}];if(is35(result)){const before=legacyProgression(char),after=legacyProgression(result);result.bab=(Number(char.bab)||0)+after.bab-before.bab;result.save35=Object.fromEntries(['fort','ref','will'].map(k=>[k,(char.save35?.[k]||0)+after[k]-before[k]]));}onFinish(result);}
  return <div className="creation-overlay" role="dialog" aria-modal="true" aria-label="Edition level up" ref={shell}><div className="creation-shell"><aside className="creation-sidebar"><h2>Level {char.level} → {target}</h2>{['Level choices','Spells','Review'].map((name,i)=><p key={name}>{i===step?'→ ':''}{name}</p>)}</aside><section className="creation-content"><div className="creation-topbar">Level up · {char.name}<ClassProgression char={char} score={effectiveAbilities(char)[castingKey(char)]||10}/></div><div className="creation-scroll">
    {step===0&&<><h2>Level {target} choices</h2><p>{record.features?.map(f=>f.name).join(' · ')||'Review your class progression and record the new choices below.'}</p>{manual&&<p>Review 3.5 prerequisites, skill ranks, feat eligibility and cross-edition conversions with your DM. Adjust base scores and hit points here.</p>}
      <label className="creation-field"><span>Hit die result before Constitution</span><input type="number" min="1" max="30" value={hpGain} onChange={e=>setHpGain(Math.max(1,Math.min(30,Number(e.target.value)||1)))}/></label>
      {needsSubclass&&<label className="creation-field"><span>Subclass name</span><input list="edition-subclasses" value={subclass} onChange={e=>setSubclass(e.target.value)}/><datalist id="edition-subclasses">{modern.subclasses.filter(s=>s.class.name===char.className).map(s=><option key={s.index} value={s.name}/>)}</datalist></label>}
      {asi&&<><label className="creation-field"><span>Ability improvement</span><select value={mode} onChange={e=>setMode(e.target.value)}><option value="scores">Ability scores: +2 or +1/+1</option><option value="feat">Choose a feat</option></select></label>{mode==='scores'&&[first,second].map((value,i)=><label className="creation-field" key={i}><span>Ability increase {i+1}</span><select value={value} onChange={e=>(i?setSecond:setFirst)(e.target.value)}><option value="">Choose</option>{ABILITIES.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}</select></label>)}</>}
      {(manual||mode==='feat')&&<label className="creation-field"><span>New feat (if eligible)</span><input value={feat} onChange={e=>{setFeat(e.target.value);if(manual)setMode('feat');}} list="level-feats"/><datalist id="level-feats">{modern.feats.map(f=><option key={f.index} value={f.name}/>)}</datalist></label>}
      {manual&&<div className="form-grid">{ABILITIES.map(a=><label className="creation-field" key={a.key}><span>{a.label} (base)</span><input type="number" min="1" max="30" value={abilities[a.key]} onChange={e=>setAbilities({...abilities,[a.key]:Math.max(1,Math.min(30,Number(e.target.value)||1))})}/></label>)}</div>}
      <label className="creation-field"><span>Feature choices and level-up notes</span><textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)}/></label></>}
    {step===1&&<><h2>New spell choices</h2>{cantripGain>0&&<SpellPicker label="New cantrips" spells={candidates.filter(s=>s.level===0)} selected={selectedCantrips.map(keyOf)} limit={cantripGain} onToggle={toggle}/>} {spellGain>0&&<SpellPicker label="New spells" spells={candidates.filter(s=>s.level!==0)} selected={selectedSpells.map(keyOf)} limit={spellGain} onToggle={toggle}/>} {!cantripGain&&!spellGain&&<p>No additional spell choices are required at this level.</p>}</>}
    {step===2&&<><h2>Review level {target}</h2><p>Maximum HP: {char.hp.max} → {char.hp.max+hp}</p><p>Subclass: {subclass||'None'}</p><p>{added.length} new spells{feat?` · Feat: ${feat}`:''}</p><div className="review-grid">{ABILITIES.map(a=><div className="review-stat" key={a.key}><span>{a.label}</span><strong>{effective[a.key]}</strong></div>)}</div></>}
    </div><div className="creation-footer"><button className="creation-secondary" onClick={()=>step?setStep(step-1):onCancel()}>{step?'Back':'Cancel'}</button><button className="creation-primary" disabled={step===0?!choicesValid:!spellsValid} onClick={()=>step===2?finish():setStep(step+1)}>{step===2?'Apply level up':'Continue'}</button></div></section></div></div>;
}
