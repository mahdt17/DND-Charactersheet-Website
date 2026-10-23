import React,{useState} from 'react';
import LevelUpFeatChoice from './LevelUpFeatChoice';
import {campaignProfile} from './lib/archivistCampaign';
import {extendedPsionProfile,learnCampaignPower} from './lib/campaignPsionics';
import {campaignPowers,campaignIds} from './data/archivistCampaign';
import {validFeatSelection} from './lib/featSelection';

export function conversionBonusSlots(char){
 const p=campaignProfile(char);
 return [...[1,5,10,15,20].filter(n=>p.psion>=n).map(n=>({id:`psion:${n}`,label:`Psion ${n} bonus feat`})),...[10,20].filter(n=>p.archivist>=n).map(n=>({id:`archivist:${n}`,label:`Archivist ${n} bonus feat`}))];
}
export function conversionChoicesComplete(char,previous=null){
 const p=extendedPsionProfile(char);
 if(!p.active)return true;
 const lore=[2,7,13,17].filter(n=>p.archivist>=n).length;
 return (!p.psion||(char.archivistCampaign?.knownPowers||[]).length===p.knownLimit)&&conversionBonusSlots(char).every(slot=>{
  const feat=(char.feats||[]).find(f=>f.conversionBonusSlot===slot.id);
  const saved=previous&&conversionBonusSlots(previous).some(old=>old.id===slot.id)&&(previous.feats||[]).find(f=>f.conversionBonusSlot===slot.id);
  // Level-up preserves already selected feats; only new or changed choices
  // need current eligibility and complete choice-dependent configuration.
  if(feat&&saved&&JSON.stringify(feat)===JSON.stringify(saved))return true;
  return feat&&validFeatSelection(feat,{...char,feats:(char.feats||[]).filter(f=>f!==feat)});
 })&&Array.from({length:lore},(_,i)=>char.archivistCampaign?.loreSkills?.[i]).every(Boolean);
}
export default function ConvertedClassChoices({char,patch,homebrew=[]}){
 const p=extendedPsionProfile(char),state=char.archivistCampaign||{};
 const [name,setName]=useState(''),[level,setLevel]=useState(1),[description,setDescription]=useState(''),[error,setError]=useState('');
 if(!p.active)return null;
 const known=state.knownPowers||[];
 const learn=power=>{try{patch({archivistCampaign:learnCampaignPower(char,power).archivistCampaign});setError('');}catch(e){setError(e.message);}};
 return <section aria-label="Converted class choices">
  {p.psion>0&&<><h3>Powers known · choose {p.knownLimit}</h3><p>{known.length} selected. Powers use Intelligence and share one reserve. Additional powers can use table-approved conversion details.</p>{campaignPowers.filter(power=>!known.some(k=>k.id===power.id)).map(power=><button type="button" className="l-button" key={power.id} disabled={known.length>=p.knownLimit} onClick={()=>learn({...power,level:1})}>Learn {power.name}</button>)}{known.map(power=><p key={power.id}>{power.name} · tier {power.level}<button type="button" className="l-button" onClick={()=>patch({archivistCampaign:{...state,knownPowers:known.filter(k=>k.id!==power.id)}})}>Remove {power.name}</button></p>)}<details><summary>Add another converted power</summary><label className="l-field">Power name<input value={name} onChange={e=>setName(e.target.value)}/></label><label className="l-field">Power tier<input type="number" min="1" max={p.maxPowerLevel} value={level} onChange={e=>setLevel(Number(e.target.value))}/></label><label className="l-field">Approved power effects<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><button type="button" className="l-button" disabled={!description.trim()} onClick={()=>learn({name,level,description})}>Learn power</button></details>{error&&<p role="alert">{error}</p>}</>}
  {Array.from({length:[2,7,13,17].filter(n=>p.archivist>=n).length},(_,i)=><label className="l-field" key={i}>Lore Mastery {i+1}<select aria-label={`Lore Mastery ${i+1}`} value={state.loreSkills?.[i]||''} onChange={e=>{const loreSkills=[...state.loreSkills||[]];loreSkills[i]=e.target.value;patch({archivistCampaign:{...state,loreSkills}});}}><option value="">Choose a knowledge skill</option>{['Arcana','History','Nature','Religion'].map(s=><option key={s}>{s}</option>)}</select></label>)}
  {conversionBonusSlots(char).map(slot=>{const feat=(char.feats||[]).find(f=>f.conversionBonusSlot===slot.id),other=(char.feats||[]).filter(f=>f!==feat);return <details key={slot.id} open={!feat}><summary>{slot.label}{feat?`: ${feat.name}`:''}</summary><p>{slot.id.startsWith('psion')?'Choose a psionic, metapsionic or psionic crafting feat.':'Choose a metamagic or crafting feat.'} Other converted feats require table approval.</p><LevelUpFeatChoice char={{...char,feats:other}} feat={feat} homebrew={homebrew} onChange={f=>patch({feats:[...other,...(f?[{...f,conversionBonusSlot:slot.id,sourceType:'converted-class-bonus',sourceClassId:campaignIds[slot.id.split(':')[0]]}]:[])]})}/></details>;})}
 </section>;
}
