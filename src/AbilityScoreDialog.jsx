import React,{useState} from 'react';
import Dialog from './Dialog';
import {abilityScoreBreakdown,abilityScoreEdit} from './lib/abilityScores';
const signed=value=>`${value>=0?'+':''}${value}`;
const descriptions={str:'Strength measures physical power, athletic training and the ability to exert force.',dex:'Dexterity measures agility, reflexes and balance.',con:'Constitution measures health, stamina and endurance.',int:'Intelligence measures reasoning, memory and knowledge.',wis:'Wisdom measures awareness, intuition and insight.',cha:'Charisma measures confidence, presence and force of personality.'};
export default function AbilityScoreDialog({char,ability,patch,onClose}){
 const initial=abilityScoreBreakdown(char,ability.key),[base,setBase]=useState(String(initial.base)),[bonus,setBonus]=useState(String(initial.bonus));
 let edit,error='';try{edit=abilityScoreEdit(char,ability.key,{base,bonus});}catch(e){error=e.message;}
 const preview=edit?abilityScoreBreakdown({...char,...edit},ability.key):initial,changed=Number(base)!==initial.base||Number(bonus)!==initial.bonus;
 const save=()=>{if(error||!changed)return;patch(current=>abilityScoreEdit(current,ability.key,{base,bonus}));onClose();};
 return <Dialog title={`${ability.label} ability score`} className="ability-score-dialog" onClose={onClose}><div className="ability-breakdown">
 <table aria-label={`${ability.label} score breakdown`}><tbody>
 <tr className="ability-total"><th scope="row">Total score</th><td>{preview.total}</td></tr>
 <tr className="ability-total"><th scope="row">Modifier</th><td>{signed(preview.modifier)}</td></tr>
 <tr><th scope="row">Base score</th><td>{preview.base}</td></tr>
 <tr><th scope="row">Recorded bonus <small>{preview.bonusSource}</small></th><td>{signed(preview.bonus)}</td></tr>
 {preview.featSources.map((source,i)=><tr key={i}><th scope="row">{source.name}<small>Feat increase{source.capped?' · capped at 20':''}</small></th><td>{signed(source.bonus)}</td></tr>)}
 {preview.effectBonus!==0&&<tr><th scope="row">Active effects<small>Applied grafts or temporary empowerment</small></th><td>{signed(preview.effectBonus)}</td></tr>}
 </tbody></table>
 <p className="ability-formula">Modifier = (total score − 10) ÷ 2, rounded down.</p>
 <div className="form-grid"><label className="l-field"><span>Base score</span><input aria-label="Base score" type="number" step="1" min="1" max="99" value={base} onChange={e=>setBase(e.target.value)}/></label><label className="l-field"><span>Recorded bonus</span><input aria-label="Recorded bonus" type="number" step="1" min="-99" max="99" value={bonus} onChange={e=>setBonus(e.target.value)}/></label></div>
 <p className="l-muted">Base includes permanent increases already recorded in that score. The recorded bonus includes your species or background increases; correct it for any additional table-approved adjustments. Feat and active-effect rows are added automatically.</p>
 {error&&<p className="ability-edit-error" role="alert">{error}</p>}
 <p>{descriptions[ability.key]}</p>
 {ability.key==='con'&&<p className="l-muted">Maximum hit points can be changed separately in Edit character.</p>}
 <div className="l-toolbar"><button type="button" className="l-button" onClick={onClose}>Cancel</button><button type="button" className="l-button primary" disabled={!!error||!changed} onClick={save}>Save changes</button></div>
 </div></Dialog>;
}
