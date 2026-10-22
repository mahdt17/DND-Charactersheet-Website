import React,{useState} from 'react';
import {eladrinSeasons,eladrinAbilities,eladrinRace} from './data/eladrin';
import {isEladrin,eladrinProfile,eladrinTranceOptions,feyStepBlocked,useFeyStep} from './lib/eladrin';

export function EladrinChoices({char,patch,rest=false}){
 if(!isEladrin(char))return null;
 const choices=char.eladrin||{},options=eladrinTranceOptions(char);
 const change=values=>patch({eladrin:{...choices,...values}});
 return <section aria-label={rest?'Eladrin Trance':'Eladrin choices'}>
  <h3>{rest?'Eladrin Trance':'Eladrin · Monsters of the Multiverse'}</h3>
  {rest&&<p>Complete a long rest with 4 hours of conscious Trance. You may change season. Previous Trance training expires; choose two new proficiencies, or leave both empty.</p>}
  <div className="form-grid">
   <label className="l-field"><span>Eladrin season</span><select aria-label="Eladrin season" value={choices.season||''} onChange={e=>change({season:e.target.value})}><option value="">Choose season</option>{eladrinSeasons.map(s=><option key={s}>{s}</option>)}</select></label>
   {!rest&&<label className="l-field"><span>Fey Step ability</span><select aria-label="Fey Step ability" value={choices.ability||''} onChange={e=>change({ability:e.target.value})}><option value="">Choose ability</option>{Object.entries(eladrinAbilities).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
  </div>
  {!rest&&<p>This ability sets your Fey Step save DC and stays fixed. You can change season after Trance.</p>}
  <details className="feature-detail" open={rest||undefined}><summary>Trance weapon and tool training (optional)</summary>
   <p>Choose PHB weapons or tools you do not already know. These proficiencies last until your next long rest.</p>
   <div className="form-grid">{[0,1].map(i=><label className="l-field" key={i}><span>Trance proficiency {i+1}</span><select aria-label={`Trance proficiency ${i+1}`} value={choices.trance?.[i]||''} onChange={e=>{const next=[...(choices.trance||[])];next[i]=e.target.value;change({trance:next});}}><option value="">None</option>{options.filter(o=>!(choices.trance||[]).some((id,j)=>j!==i&&id===o.index)).map(o=><option key={o.index} value={o.index}>{o.name} ({o.kind==='weapons'?'weapon':'tool'})</option>)}</select></label>)}</div>
  </details>
 </section>;
}

export default function Eladrin({char,patch,abilities}){
 const [notice,setNotice]=useState(''),[error,setError]=useState('');
 const p=eladrinProfile(char,abilities);if(!p.active)return null;
 const blocked=feyStepBlocked(char);
 const effects={
  Autumn:`After teleporting: up to two visible creatures within 10 feet make a Wisdom save DC ${p.dc}; failure charms for 1 minute, ending when you or allies damage them.`,
  Winter:`Before teleporting: one visible creature within 5 feet makes a Wisdom save DC ${p.dc}; failure frightens until your next turn ends.`,
  Spring:'Touch a willing creature within 5 feet; it teleports instead, to visible unoccupied space within 30 feet of you.',
  Summer:`After teleporting: chosen visible creatures within 5 feet take ${p.fireDamage} fire damage each.`
 };
 return <section className="l-panel section-spaced" aria-label="Eladrin Fey Step">
  <h3>Fey Step · {p.season||'Choose season'}</h3><p>Bonus action · 30-foot teleport · {p.remaining} / {p.max} uses remaining · long-rest recovery</p>
  <p>Choose visible, unoccupied space. {p.seasonal?effects[p.season]:'Seasonal effects unlock at character level 3.'}</p>
  {!p.complete&&<EladrinChoices char={char} patch={patch}/>}
  <button className="l-button primary" disabled={!!blocked} onClick={()=>{try{patch(useFeyStep(char));setNotice('Fey Step used. Resolve teleportation and eligible seasonal targets at the table.');setError('');}catch(e){setError(e.message);}}}>Use Fey Step</button>
  {blocked&&<p className="l-muted">{blocked}</p>}{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
  <p className="l-muted">Fey Ancestry: advantage on saves to avoid or end being charmed. Trance prevents magical sleep. Darkvision: 60 feet.</p>
  <a href={eladrinRace.sourceUrl} target="_blank" rel="noreferrer">Eladrin source · Monsters of the Multiverse</a>
 </section>;
}
