import React,{useState} from 'react';
import Dialog from './Dialog';
import {classRecord,levelRecord,characterSlots,spellCounts,editionName} from './lib/editions';

export default function ClassProgression({char,score=10}) {
  const [open,setOpen]=useState(false),record=classRecord(char);
  const edition=record?.edition||char.ruleset||'2014';
  const model={...char,ruleset:edition,slotOverride:undefined};
  const levels=Array.from({length:20},(_,i)=>({...levelRecord(model,i+1),level:i+1}));
  const hasLevels=edition!=='3.5'&&levels.some(l=>l.features?.length);
  const casting=levels.some(l=>l.spellcasting),resources=[...new Set(levels.flatMap(l=>Object.entries(l.class_specific||{}).filter(([,v])=>typeof v==='number'||typeof v==='string').map(([k])=>k)))];
  const title=`${char.className} level progression`;
  return <><button type="button" className="l-button" disabled={!record} onClick={()=>setOpen(true)}>Class level table</button>{open&&<Dialog title={title} wide onClose={()=>setOpen(false)}>
    <p>{editionName(edition)} · Current level {char.level||1}. Use this reference before or during a level up.</p>
    {hasLevels?<><p className="l-muted">Spell slots are shown as level: count. Preparation limits use your current casting ability score ({score}); future ability increases can change them. Subclass features depend on your chosen subclass.</p>
      <div className="progression-scroll" tabIndex="0" role="region" aria-label={`${title} table`}><table className="progression-table"><caption>{char.className} · levels 1–20</caption><thead><tr><th scope="col">Level</th><th scope="col">Proficiency</th><th scope="col">Features</th>{resources.map(k=><th scope="col" key={k}>{k.replaceAll('_',' ')}</th>)}{casting&&<><th scope="col">Cantrips</th><th scope="col">Known / book</th><th scope="col">Prepared</th><th scope="col">Spell slots</th></>}</tr></thead><tbody>{levels.map(l=>{const c={...model,level:l.level},counts=spellCounts(c,score);return <tr key={l.level} aria-current={l.level===char.level?'step':undefined}><th scope="row">{l.level}{l.level===char.level?' · Current':''}</th><td>+{l.prof_bonus||2+Math.floor((l.level-1)/4)}</td><td>{l.features?.map(f=>f.name).join(', ')||'—'}</td>{resources.map(k=><td key={k}>{l.class_specific?.[k]??'—'}</td>)}{casting&&<><td>{counts.cantrips||'—'}</td><td>{counts.mode==='known'||counts.mode==='spellbook'?counts.known:'—'}</td><td>{counts.prepared??'—'}</td><td>{characterSlots(c).map((n,i)=>n?`${i}: ${n}`:null).filter(Boolean).join(' · ')||'—'}</td></>}</tr>;})}</tbody></table></div></>:
      record?.tables?.length?record.tables.map((table,i)=><div className="progression-scroll" tabIndex="0" role="region" aria-label={`${title} table ${i+1}`} key={i}><table className="progression-table"><caption>{char.className} · source table {i+1}</caption><tbody>{table.map((row,j)=><tr key={j} aria-current={/^\d+(st|nd|rd|th)$/.test(row[0])&&parseInt(row[0])===char.level?'step':undefined}>{row.map((cell,k)=>j===0?<th key={k} scope="col">{cell||'—'}</th>:k===0?<th key={k} scope="row">{cell||'—'}</th>:<td key={k}>{cell||'—'}</td>)}</tr>)}</tbody></table></div>):<p>This class’s progression table is in its source reference. {record?.description}</p>}
    {record?.sourceUrl&&<p><a href={record.sourceUrl} target="_blank" rel="noreferrer">Open {char.className} source and level table ↗</a></p>}
  </Dialog>}</>;
}
