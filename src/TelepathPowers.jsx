import {previousManifestHistory} from './lib/manifestHistory';
import {advanceCampaignRound} from './lib/campaignSpellEffects';
import React,{useState} from 'react';
import {B,F,Num,Target,abilities,types} from './CampaignControls';
import {campaignActionBlockReason} from './lib/campaignActivity';
import {extendedPsionProfile,learnCampaignPower,resolveExtendedPower,attractionInteractionBonus,manifestationOptions,selectedPowerManifest} from './lib/campaignPsionics';
import {manifestWithPsicrystal} from './lib/campaignPsicrystal';
export default function ExtendedPsionics({char,patch,roll}){
 const [chosenManifest,setChosenManifest]=useState('');
 const p=extendedPsionProfile(char),state=char.archivistCampaign||{},[error,setError]=useState(''),[name,setName]=useState(''),[level,setLevel]=useState(1),[save,setSave]=useState('wis'),[damage,setDamage]=useState(''),[minutes,setMinutes]=useState(1),[description,setDescription]=useState(''),[augmentation,setAugmentation]=useState(0),[discount,setDiscount]=useState(false),[targetType,setTargetType]=useState('humanoid'),[target,setTarget]=useState(''),[saveTotal,setSaveTotal]=useState(''),[damageTotal,setDamageTotal]=useState(''),[range,setRange]=useState('30 feet'),[mode,setMode]=useState('normal'),[selectedPower,setSelectedPower]=useState(''),[targetConfirmed,setTargetConfirmed]=useState(false),[relevant,setRelevant]=useState(false),[interactionSkill,setInteractionSkill]=useState('Persuasion');
 const run=fn=>{try{patch(fn());setError('');}catch(e){setError(e.message);}};
 if(!p.psion)return null;
 const selected=p.powers.find(power=>power.id===selectedPower)||p.powers[0],blocked=campaignActionBlockReason(char),history=previousManifestHistory(state),manifestOptions=history.filter(m=>m.power?.id===selected?.id),manifest=manifestOptions.find(m=>m.id===chosenManifest)||selectedPowerManifest(char,selected?.id);
 return <section className="class-psionics" aria-label="Psionic abilities"><h3>Telepath powers</h3><div className="class-power-picker" role="group" aria-label="Choose a Telepath power">{p.powers.map(power=><B key={power.id} aria-label={`Select ${power.name}`} aria-pressed={selected?.id===power.id} onClick={()=>{setSelectedPower(power.id);setChosenManifest('');setTarget('');setSaveTotal('');setDamageTotal('');setTargetConfirmed(false);setAugmentation(0);setDiscount(false);setMode('normal');setError('');}}><strong>{power.name}</strong><small>{power.cost??2*power.level-1} PP</small></B>)}</div>{error&&<p role="alert">{error}</p>}



 {p.powers.filter(power=>power.id===selected?.id).map(power=><article className="class-ability" key={power.id}><header><strong>{power.name}</strong><span className="l-tag">{power.cost??2*power.level-1} PP</span></header><p>{power.description||'Campaign default mental effect; Wisdom save.'}</p><PowerOptions char={char} power={power} options={manifestationOptions(char,power)}
 mode={mode} setMode={setMode} augmentation={augmentation} setAugmentation={setAugmentation}
 discount={discount} setDiscount={setDiscount} targetType={targetType} setTargetType={setTargetType}/> {['mindlink','inertial-armor'].includes(power.id)&&<label><input type="checkbox" checked={targetConfirmed} onChange={e=>setTargetConfirmed(e.target.checked)}/>{power.id==='mindlink'?'Willing Intelligence 3+ target is within close range':'I am being targeted before the attack roll and my reaction is available'}</label>}
 <B disabled={!!blocked||(power.id==='inertial-armor'&&state.inertialArmorReactionTurn===Number(state.clockMinutes||0))||(['mindlink','inertial-armor'].includes(power.id)&&!targetConfirmed)} onClick={()=>run(()=>{const next=manifestWithPsicrystal(char,power.id,{augmentation,discount:manifestationOptions(char,power).discount&&!manifestationOptions(char,power).discountUsed&&discount,targetType,mode:manifestationOptions(char,power).modes.some(option=>option.id===mode)?mode:'normal',targetConfirmed});setChosenManifest('');setTargetConfirmed(false);setSaveTotal('');return next;})}>Manifest {power.name}</B>{state.powerEffects?.[power.id]?.minutes>0&&<p className="action-feedback">{state.powerEffects[power.id].minutes} minutes remaining.{power.id==='inertial-armor'&&` +${state.powerEffects[power.id].armorBonus??4} armor bonus.`} <B onClick={()=>patch(current=>({...current,archivistCampaign:{...current.archivistCampaign,powerEffects:Object.fromEntries(Object.entries(current.archivistCampaign?.powerEffects||{}).filter(([id])=>id!==power.id))}}))}>End {power.name}</B></p>}</article>)}
 {state.inertialArmorReactionTurn===Number(state.clockMinutes||0)&&<p role="status">Your reaction is spent until your next turn. <B onClick={()=>run(()=>advanceCampaignRound(char))}>Begin next turn</B></p>}
 {manifestOptions.length>1&&<F label={selected.name+' manifestation'}><select value={manifest?.id||''} onChange={e=>{setChosenManifest(e.target.value);setTarget('');setSaveTotal('');setDamageTotal('');setError('');}}>{manifestOptions.map((m,i)=><option key={m.id} value={m.id}>{i===0?'Latest':'Earlier '+i} · {m.resolved?.length?'resolved':['mindlink','inertial-armor'].includes(m.power.id)?'no save required':'pending'}</option>)}</select></F>}
 {manifest&&<><p role="status" className="action-feedback">Last power: {manifest.power.name} · {manifest.cost} PP spent{manifest.power.save?` · save DC ${manifest.dc}`:''}.</p>
 {!['mindlink','inertial-armor'].includes(manifest.power.id)&&<>
 {!manifest.resolved.length&&<>
<Target char={char} value={target} onChange={id=>{setTarget(id);setRelevant(false);}} label="Psionic effect target"/>
 {manifest.power.save&&<Num label="Psionic target save total" min={-20} value={saveTotal} onChange={setSaveTotal}/>}
 {manifest.power.damage&&<><Num label="Psionic rolled damage" value={damageTotal} onChange={setDamageTotal}/><B onClick={()=>{const r=roll(manifest.power.damage,manifest.power.name);if(r)setDamageTotal(r.total);}}>Roll psionic damage</B></>}
 <B onClick={()=>run(()=>resolveExtendedPower(char,target,{save:saveTotal,damage:damageTotal,manifestId:manifest.id}))}>Apply psionic result</B></>}
 </>}
 {manifest.lastResult&&<p>{manifest.lastResult}</p>}</>}
 {selected?.id==='attraction'&&(state.creatures||[]).some(n=>attractionInteractionBonus(char,n.id,{relevant:true}))&&<fieldset>
 <legend>Attraction interaction check</legend>
 <Target char={char} value={target} onChange={id=>{setTarget(id);setRelevant(false);}} label="Attracted creature"/>
 <F label="Interaction skill"><select value={interactionSkill} onChange={e=>setInteractionSkill(e.target.value)}>{['Persuasion','Deception','Intimidation','Performance'].map(skill=><option key={skill}>{skill}</option>)}</select></F>
 <label><input type="checkbox" checked={relevant} onChange={e=>setRelevant(e.target.checked)}/>The check directly concerns the attraction</label>
 <B disabled={!!blocked||!attractionInteractionBonus(char,target,{relevant})} onClick={()=>{const bonus=Math.floor((p.scores.cha-10)/2)+p.pb*(char.expertise?.[interactionSkill]?2:char.skillProf?.[interactionSkill]?1:0)+attractionInteractionBonus(char,target,{relevant});roll(`1d20${bonus>=0?'+':''}${bonus}`,`${interactionSkill} · Attraction`);}}>Roll interaction with +4</B>
 </fieldset>}
 <section aria-label="Power history"><details><summary>Power history ({history.length})</summary>{history.map(m=><p key={m.id}><strong>{m.power.name}</strong> · {m.cost} PP · {m.lastResult||(m.resolved?.length?'Resolved':['mindlink','inertial-armor'].includes(m.power.id)?'Active effect':'Pending — select this power to resolve')}{m.resolved?.length>0?` · ${m.resolved.map(id=>state.creatures?.find(n=>n.id===id)?.name||id).join(', ')}`:''}</p>)}</details></section>
 <details className="feature-detail"><summary>Manifesting progression</summary><p>Manifester level {p.manifesterLevel}; power tier {p.maxPowerLevel}; learned powers {p.powers.filter(power=>!power.gate).length}/{p.knownLimit}, plus prestige grants. Psion bonus feats and Psicrystal abilities use actual Psion levels, not prestige advancement.</p><p>Choose class levels, known powers and bonus feats through Level up. New powers need their table-approved 5e description and effect values.</p></details>
 <details className="feature-detail"><summary>Learn another converted power</summary><F label="New Telepath power name"><input value={name} onChange={e=>setName(e.target.value)}/></F><Num label="New power tier" min={1} max={p.maxPowerLevel} value={level} onChange={setLevel}/><F label="New power save"><select value={save} onChange={e=>setSave(e.target.value)}><option value="">None</option>{abilities.map(a=><option key={a}>{a}</option>)}</select></F><F label="New power range"><select value={range} onChange={e=>setRange(e.target.value)}>{['Self','Touch','30 feet','60 feet','120 feet'].map(v=><option key={v}>{v}</option>)}</select></F><F label="New power damage dice"><input value={damage} onChange={e=>setDamage(e.target.value)} placeholder="e.g. 3d6"/></F><Num label="New power duration minutes" value={minutes} onChange={setMinutes}/><F label="Converted power effects"><textarea value={description} onChange={e=>setDescription(e.target.value)}/></F><B onClick={()=>run(()=>learnCampaignPower(char,{name,level,save,damage,minutes,description,range}))}>Learn converted Telepath power</B></details>
 </section>;
}


function PowerOptions({char,power,options,mode,setMode,augmentation,setAugmentation,discount,setDiscount,targetType,setTargetType}){
 const profile=extendedPsionProfile(char);
 const canAugment=power.id==='inertial-armor'&&profile.manifesterLevel>=3;
 if(options.modes.length===1&&!canAugment&&!options.discount&&!options.targetTypes)return null;
 return <details className="feature-detail"><summary>Advanced manifestation options</summary>
  {options.modes.length>1&&<F label="Psicrystal manifestation mode"><select value={options.modes.some(option=>option.id===mode)?mode:'normal'} onChange={e=>setMode(e.target.value)}>{options.modes.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></F>}
  {canAugment&&<><F label="Additional augmentation PP"><input type="number" min="0" step="2" max={options.augmentation} value={augmentation} onChange={e=>setAugmentation(e.target.value===''?'':Number(e.target.value))}/></F><p>Each additional 2 PP adds +1 armor. Maximum additional PP currently {options.augmentation}.</p></>}
  {options.discount&&<label><input type="checkbox" checked={!options.discountUsed&&discount} disabled={options.discountUsed} onChange={e=>setDiscount(e.target.checked)}/>Use the daily {power.name} discount{options.discountUsed?' (already used)':''}</label>}
  {options.targetTypes&&<><F label="Psionic target type"><select value={targetType} onChange={e=>setTargetType(e.target.value)}>{types.filter(type=>!['undead','construct'].includes(type)).map(type=><option key={type}>{type}</option>)}</select></F>{options.typeWaiver>0&&<p>The {options.typeWaiver}-PP target-type surcharge is waived by your Thrallherd feature.</p>}</>}
 </details>;
}
