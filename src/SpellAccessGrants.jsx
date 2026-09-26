import React,{useState} from 'react';
import {catalogSpells,keyOf} from './lib/editions';

export default function SpellAccessGrants({char,classId,edition,patch,entries=[]}) {
  const [query,setQuery]=useState(''),[selected,setSelected]=useState(''),[source,setSource]=useState('');
  const spells=catalogSpells(char.ruleset==='custom'?'custom':edition,entries);
  const options=[...new Map(spells.filter(s=>query.trim()&&s.name.toLowerCase().includes(query.toLowerCase())&&Number.isInteger(s.level)).map(s=>[keyOf(s),s])).values()].slice(0,40);
  const grants=(char.spellAccessGrants||[]).filter(g=>g.classId===classId);
  function grant(){const spell=options.find(s=>keyOf(s)===selected);if(!spell||!source.trim())return;
    patch({spellAccessGrants:[...(char.spellAccessGrants||[]).filter(g=>g.classId!==classId||g.spellId!==selected),{classId,spellId:selected,spellName:spell.name,spellLevel:spell.level,source:source.trim(),classLevel:1}]});setSelected('');setSource('');
  }
  return <details className="feature-detail"><summary>Additional spell access from a feature</summary><p>Record an individual spell granted by a subclass, feat, item, scroll, or table ruling. This adds access to that spell; it does not change preparation limits or give free casts.</p><label className="l-field"><span>Find a granted spell</span><input value={query} onChange={e=>{setQuery(e.target.value);setSelected('');}}/></label><label className="l-field"><span>Granted spell</span><select aria-label="Granted spell" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a spell</option>{options.map(s=><option key={keyOf(s)} value={keyOf(s)}>{s.name} · level {s.level} · {s.sourceBook||s.source||s.edition}</option>)}</select></label><label className="l-field"><span>Feature or source granting access</span><input value={source} onChange={e=>setSource(e.target.value)} placeholder="e.g. Magic Initiate — Wizard"/></label><button className="l-button" disabled={!selected||!source.trim()} onClick={grant}>Record spell access</button>{grants.map(g=><p key={g.spellId}>{g.spellName} · {g.source} <button className="l-button" onClick={()=>patch({spellAccessGrants:char.spellAccessGrants.filter(x=>x!==g)})}>Remove access to {g.spellName}</button></p>)}</details>;
}
