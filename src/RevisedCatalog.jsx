import React, { useState } from 'react';
import spells from './data/2024/spells.json';
import classes from './data/2024/classes.json';
import species from './data/2024/species.json';
import feats from './data/2024/feats.json';
import backgrounds from './data/2024/backgrounds.json';
import features from './data/2024/features.json';
import traits from './data/2024/traits.json';
import subclasses from './data/2024/subclasses.json';
import levels from './data/2024/levels.json';

const text = value => Array.isArray(value) ? value.join('\n\n') : value || '';
const catalogs = { Spells:spells, Classes:classes, Species:species, Feats:feats, Backgrounds:backgrounds, Subclasses:subclasses, Features:features, Traits:traits };
export default function RevisedCatalog({show}) {
  const [category,setCategory]=useState('Spells'),[query,setQuery]=useState(''),[level,setLevel]=useState('all'),[school,setSchool]=useState('all'),[page,setPage]=useState(0);
  const filtered=catalogs[category].filter(entry=>entry.name.toLowerCase().includes(query.trim().toLowerCase())&&(category!=='Spells'||(level==='all'||entry.level===Number(level))&&(school==='all'||entry.school?.name===school)));
  const pages=Math.max(1,Math.ceil(filtered.length/24)),current=Math.min(page,pages-1);
  const schools=[...new Set(spells.map(s=>s.school?.name).filter(Boolean))].sort();
  function open(entry) {
    const sections=[text(entry.description||entry.desc)];
    if(category==='Classes'){
      sections.push(`Hit die: d${entry.hit_die}\nPrimary ability: ${entry.primary_ability?.desc||'See class features'}\nSaving throws: ${entry.saving_throws?.map(s=>s.name).join(', ')}`);
      const progression=levels.filter(l=>l.class?.index===entry.index&&!l.subclass);
      progression.forEach(l=>sections.push(`Level ${l.level}: ${(l.features||[]).map(f=>f.name).join(', ')}`));
    }
    if(category==='Species'){
      sections.push(`${entry.size} · Speed ${entry.speed} ft.`);
      (entry.traits||[]).forEach(t=>{const data=traits.find(d=>d.index===t.index);sections.push(t.name+'\n'+text(data?.description||data?.desc));});
      if(entry.subspecies?.length)sections.push('Lineages: '+entry.subspecies.map(s=>s.name).join(', '));
    }
    if(category==='Backgrounds')sections.push('Ability scores: '+entry.ability_scores?.map(a=>a.name).join(', '),'Feat: '+entry.feat?.name,'Proficiencies: '+entry.proficiencies?.map(p=>p.name).join(', '),...(entry.equipment_options||[]).map(e=>e.desc));
    show({...entry,name:entry.name+' · 5.5e / 2024',school:entry.school?.name||entry.school,description:sections.filter(Boolean).join('\n\n'),higher_level:entry.higher_level?[text(entry.higher_level)]:[]});
  }
  return <section aria-label="Revised 5e catalog"><p>5.5e / 2024 SRD references. Character creation and advancement still use the supported 2014 rules.</p><div className="l-list-controls">
    <label className="l-field"><span>Revised category</span><select value={category} onChange={e=>{setCategory(e.target.value);setQuery('');setPage(0);}}>{Object.entries(catalogs).map(([name,entries])=><option key={name}>{name}</option>)}</select></label>
    <label className="l-field"><span>Search revised references</span><input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label>
    {category==='Spells'&&<><label className="l-field"><span>Revised spell level</span><select value={level} onChange={e=>{setLevel(e.target.value);setPage(0);}}><option value="all">All levels</option>{Array.from({length:10},(_,i)=><option key={i} value={i}>{i===0?'Cantrip':'Level '+i}</option>)}</select></label><label className="l-field"><span>Revised spell school</span><select value={school} onChange={e=>{setSchool(e.target.value);setPage(0);}}><option value="all">All schools</option>{schools.map(s=><option key={s}>{s}</option>)}</select></label></>}
    </div><p aria-live="polite">{filtered.length} results</p><div className="compendium-grid">{filtered.slice(current*24,current*24+24).map(entry=><button type="button" className="compendium-card" key={entry.index} onClick={()=>open(entry)}><span className="l-eyebrow">5.5e · {category}</span><h3>{entry.name}</h3><p>{category==='Spells'?`${entry.level===0?'Cantrip':'Level '+entry.level} · ${entry.school?.name}`:'Open reference'}</p></button>)}</div><div className="spell-picker-pagination"><button type="button" className="l-button" disabled={!current} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button type="button" className="l-button" disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button></div></section>;
}
