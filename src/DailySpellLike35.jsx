import React,{useMemo,useState} from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';
import {
  dailySpellLikePlan35,
  dailySpellLikeCandidates35,
  dailySpellLikeMetamagicOptions35,
  prepareDailySpellLike35
} from './lib/dailySpellLike35';

const norm=value=>String(value||'').trim().toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();

export default function DailySpellLike35({char,classId,spells=[],patch}){
  const plan=dailySpellLikePlan35(char,classId);
  const [selected,setSelected]=useState([]);
  const [metamagic,setMetamagic]=useState({});
  const [error,setError]=useState('');
  const candidates=useMemo(()=>{
    const rows=dailySpellLikeCandidates35(char,classId,spells),seen=new Set();
    return rows.filter(spell=>{
      const key=norm(spell.name);
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  },[char,classId,spells]);

  if(!plan.supported||plan.count<=0)return null;

  const toggleSpell=spell=>{
    const id=keyOf(spell);
    const next=selected.includes(id)?selected.filter(value=>value!==id):selected.length<plan.count?[...selected,id]:selected;
    const nextMeta={...metamagic};
    if(!next.includes(id))delete nextMeta[id];
    setSelected(next);
    setMetamagic(nextMeta);
    setError('');
  };
  const chosen=selected.map(id=>candidates.find(spell=>keyOf(spell)===id)).filter(Boolean);
  const metaFor=id=>Array.isArray(metamagic[id])?metamagic[id]:[];
  const toggleFixed=(id,name)=>{
    const current=metaFor(id),exists=current.some(choice=>choice.name===name);
    setMetamagic({...metamagic,[id]:exists?current.filter(choice=>choice.name!==name):[...current,{name}]});
    setError('');
  };
  const setHeighten=(id,value)=>{
    const current=metaFor(id).filter(choice=>choice.name!=='Heighten Spell');
    setMetamagic({...metamagic,[id]:value?[...current,{name:'Heighten Spell',targetLevel:Number(value)}]:current});
    setError('');
  };
  const save=()=>{
    try{
      const result=prepareDailySpellLike35(char,classId,chosen.map(spell=>({spell,metamagic:metaFor(keyOf(spell))})));
      patch({dailySpellLike35:result.dailySpellLike35,spells:result.spells});
      setSelected([]);
      setMetamagic({});
      setError('');
    }catch(e){setError(e.message);}
  };

  if(!plan.ready){
    return <section className="feature-detail" aria-label="Arcane Dilettante daily repertoire">
      <h3>Arcane Dilettante</h3>
      <p className="l-notice">Today’s repertoire is prepared. Each selected spell-like ability can be used once, costs 1 Inspiration, and is replaced only after the next qualifying 8-hour daily recovery.</p>
      <ul>{(plan.selections||[]).map(selection=><li key={selection.id}>
        <strong>{selection.spellName}</strong> · prepared level {selection.modifiedLevel}
        {selection.metamagic?.length?' · '+selection.metamagic.map(item=>item.targetLevel?item.name+' '+item.targetLevel:item.name).join(', '):''}
        {' · '}{selection.used?'used':'available'}
      </li>)}</ul>
    </section>;
  }

  return <section className="feature-detail" aria-label="Arcane Dilettante daily repertoire">
    <h3>Arcane Dilettante</h3>
    <p className="l-notice">Choose exactly {plan.count} distinct Sorcerer/Wizard spell{plan.count===1?'':'s'} for today, up to level {plan.maxLevel}. Only one selection may occupy level {plan.maxLevel}. XP-cost spells are excluded. Prepared metamagic uses the feat’s adjusted spell level.</p>
    <SpellPicker label="Arcane Dilettante daily spells" spells={candidates} selected={selected} limit={plan.count} onToggle={toggleSpell}/>
    {chosen.map(spell=>{
      const id=keyOf(spell);
      const options=dailySpellLikeMetamagicOptions35(char,spell,plan.maxLevel);
      const heighten=options.find(option=>option.name==='Heighten Spell');
      const current=metaFor(id),heightenChoice=current.find(choice=>choice.name==='Heighten Spell');
      return <details className="feature-detail" key={id}>
        <summary>{spell.name} · base level {spell.level}{current.length?' · '+current.length+' metamagic':''}</summary>
        {!options.length?<p className="l-muted">No owned metamagic feat has a source-safe preparation-level adjustment for this spell at the current Factotum maximum.</p>:<>
          <p className="l-muted">Choose only metamagic whose own feat requirements apply to this spell. Arcane Dilettante validates ownership and adjusted spell level and fails closed when the level adjustment is not source-safe.</p>
          {options.filter(option=>!option.variable).map(option=><label className="l-check" key={option.name}>
            <input type="checkbox" checked={current.some(choice=>choice.name===option.name)} onChange={()=>toggleFixed(id,option.name)}/>
            {option.name} · {option.adjustment>0?'+'+option.adjustment+' prepared level':'normal prepared level'}
          </label>)}
          {heighten&&<label className="l-field"><span>Heighten Spell target level</span><select aria-label={spell.name+' Heighten Spell target level'} value={heightenChoice?.targetLevel||''} onChange={e=>setHeighten(id,e.target.value)}>
            <option value="">Do not heighten</option>
            {Array.from({length:Math.max(0,plan.maxLevel-spell.level)},(_,index)=>spell.level+index+1).map(level=><option key={level} value={level}>Level {level}</option>)}
          </select></label>}
        </>}
      </details>;
    })}
    {error&&<p role="alert" className="l-notice">{error}</p>}
    <button type="button" className="l-button primary" disabled={selected.length!==plan.count} onClick={save}>Prepare Arcane Dilettante repertoire</button>
  </section>;
}
