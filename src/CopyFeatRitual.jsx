import React,{useState} from 'react';
import {useReferenceIndex} from './lib/referenceIndex';
import {featSpellCatalog,featMagicState,copyFeatRitual} from './lib/featMagic';
import Dialog from './Dialog';

export default function CopyFeatRitual({feat,char,onChange}){
 const [open,setOpen]=useState(false),[id,setId]=useState(''),[source,setSource]=useState(''),[error,setError]=useState('');
 const reference=useReferenceIndex(open?['spells']:[],'2014'),state=featMagicState(feat,char);
 if(!state.valid||state.profile.kind!=='ritual'||state.profile.edition!=='2014')return null;
 const spells=featSpellCatalog(feat,char,reference.entries).filter(s=>s.ritual&&s.level>0&&s.level<=Math.ceil(char.level/2)&&s.classes.includes(state.list)&&!state.spells.some(x=>x.catalogId===s.catalogId)),spell=spells.find(s=>s.catalogId===id);
 function save(){try{onChange(copyFeatRitual(feat,char,spell,source));setOpen(false);setId('');setSource('');setError('');}catch(e){setError(e.message);}}
 return <><button className="l-button" onClick={()=>setOpen(true)}>Copy a ritual into the book</button>{open&&<Dialog title="Copy a written ritual" onClose={()=>setOpen(false)}><label className="l-field"><span>Ritual to copy</span><select aria-label="Ritual to copy" value={id} onChange={e=>setId(e.target.value)}><option value="">Choose a ritual</option>{spells.map(s=><option key={s.catalogId} value={s.catalogId}>{s.name} · level {s.level}</option>)}</select></label><label className="l-field"><span>Written source</span><input aria-label="Written source" value={source} onChange={e=>setSource(e.target.value)} placeholder="Scroll or spellbook supplied at the table"/></label>{spell&&<p>Spend {spell.level*2} hours and {spell.level*50} gp on copying supplies. Record payment with your currency before copying.</p>}{reference.loading&&<p>Loading rituals…</p>}{reference.error&&<p role="alert">{reference.error}</p>}{error&&<p role="alert">{error}</p>}<button className="l-button primary" disabled={!spell||!source.trim()} onClick={save}>Record completed copy</button></Dialog>}</>;
}
