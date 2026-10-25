import React,{useState} from 'react';
import {isMultiverseShadarKai,shadarKaiProfile,shadarKaiTranceOptions,blessingBlocked,useBlessing,endBlessingWard} from './lib/shadarKai';

export function ShadarKaiChoices({char,patch,rest=false,review=false}){
 if(!isMultiverseShadarKai(char))return null;
 const choices=char.shadarKai||{},options=shadarKaiTranceOptions(char);
 return <section aria-label={rest?'Shadar-kai Trance':'Shadar-kai choices'}>
  <h3>{rest?'Shadar-kai Trance':review?'Review Trance training':'Trance · Monsters of the Multiverse (2022)'}</h3>
  <p>{rest?'A 4-hour conscious Trance completes your long rest. Previous Trance training expires.':'After Trance, you may gain two PHB weapon or tool proficiencies you do not already have.'} Choose two proficiencies, or leave both empty.</p>
  <details className="feature-detail" open={rest||review||undefined}><summary>Trance weapon and tool training (optional)</summary>
   <div className="form-grid">{[0,1].map(i=><label className="l-field" key={i}><span>Trance proficiency {i+1}</span><select aria-label={`Trance proficiency ${i+1}`} value={choices.trance?.[i]||''} onChange={e=>{const trance=[...(choices.trance||[])];trance[i]=e.target.value;patch({shadarKai:{...choices,trance}});}}><option value="">None</option>{options.filter(o=>!(choices.trance||[]).some((id,j)=>j!==i&&id===o.index)).map(o=><option key={o.index} value={o.index}>{o.name} ({o.kind==='weapons'?'weapon':'tool'})</option>)}</select></label>)}</div>
   <p className="l-muted">This training lasts until your next long rest.</p>
  </details>
 </section>;
}

export default function ShadarKai({char,patch}){
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),p=shadarKaiProfile(char);if(!p.active)return null;
 const blocked=blessingBlocked(char);
 function use(){try{patch(current=>useBlessing(current));setNotice('Blessing used. Move to visible, unoccupied space within 30 feet at the table.');setError('');}catch(e){setError(e.message);}}
 return <section className="l-panel section-spaced" aria-label="Shadar-kai racial abilities">
  <h3>Blessing of the Raven Queen</h3><p className="l-muted">{p.race.source}</p>
  <p><strong>Bonus action · Teleport up to 30 feet</strong></p><p>{p.remaining} / {p.max} uses remaining · Recover all uses on a long rest</p>
  <p>Choose an unoccupied space you can see. {p.wardAvailable?'Teleporting also grants resistance to all damage until the start of your next turn.':'Resistance to all damage after teleporting unlocks at character level 3.'}</p>
  <button type="button" className="l-button primary" disabled={!!blocked} onClick={use}>Use Blessing of the Raven Queen</button>
  {p.wardActive&&<div className="l-notice" role="status"><strong>Ghostly resistance active</strong><p>You have resistance to all damage until the start of your next turn.</p><button type="button" className="l-button" onClick={()=>{patch(endBlessingWard);setNotice('Next turn started. The brief resistance has ended; the teleport use remains spent.');}}>Start next turn</button></div>}
  {blocked&&<p className="l-muted">{blocked}</p>}{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
  <p className="l-muted">Resolve movement and damage at the table. Clear the resistance reminder when your next turn starts.</p>
  <details className="feature-detail"><summary>Shadar-kai traits</summary><p>Darkvision: 60 feet · Necrotic resistance · Perception proficiency · Magical sleep immunity</p><p>{p.race.traits.find(t=>t.name==='Fey Ancestry').description}</p><p>{p.race.traits.find(t=>t.name==='Trance').description}</p><a href={p.race.sourceUrl} target="_blank" rel="noreferrer">Read {p.race.source}</a></details>
 </section>;
}
