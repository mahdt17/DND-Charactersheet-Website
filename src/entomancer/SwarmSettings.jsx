import React,{useRef,useEffect} from 'react';
import {effectiveAbilityScores} from '../lib/abilityScores';
import {entomancerSkillRank} from '../lib/entomancer';
import EntomancerChoices from './SwarmChoices';
import {Field,Choice} from './SwarmFields';
export default function SwarmSettings({char,patch,roll,model,ui,onUiChange}){
 const p=model.profile,s=char.entomancer||{},blocked=model.blockedReason,setupRef=useRef(null),environmentRef=useRef(null);
 const set=(key,value)=>patch(current=>({...current,entomancer:{...current.entomancer,[key]:value}}));
 const rule=(key,value)=>patch(current=>({...current,entomancer:{...current.entomancer,settings:{...current.entomancer?.settings,[key]:value}}}));
 useEffect(()=>{const ref=ui.recoveryDisclosure==='setup'?setupRef:ui.recoveryDisclosure==='environment'?environmentRef:null;ref?.current?.querySelector('select')?.focus({preventScroll:true});},[ui.recoveryDisclosure]);
 return <>
<details className="feature-detail swarm-reference" ref={setupRef} open={ui.recoveryDisclosure==='setup'} onToggle={e=>{if(e.currentTarget.open&&ui.recoveryDisclosure!=='setup')onUiChange(u=>({...u,recoveryDisclosure:'setup'}));else if(!e.currentTarget.open&&ui.recoveryDisclosure==='setup')onUiChange(u=>({...u,recoveryDisclosure:null}));}}><summary>Swarm choices &amp; table rulings</summary><EntomancerChoices char={char} patch={patch} functional/><p>The detailed feature text sets Adaptation improvement at level 11 and includes species abilities at level 6. The following values resolve gaps in the source and can be changed for your table.</p>
   <Choice label="Unspecified save ability" value={p.settings.saveAbility||'wis'} options={['wis','con']} onChange={v=>rule('saveAbility',v)}/>
   <Field label="Override unspecified save DC (blank uses ability)"><input aria-label="Override unspecified save DC" type="number" min="1" value={p.settings.saveDC??''} onChange={e=>rule('saveDC',e.target.value===''?null:Number(e.target.value))}/></Field>
   <Field label="Short-rest Population recovery (blank uses half maximum)"><input aria-label="Short-rest Population recovery" type="number" min="0" value={p.settings.shortRecovery??''} onChange={e=>rule('shortRecovery',e.target.value===''?null:Number(e.target.value))}/></Field>
   <label className="l-check"><input type="checkbox" checked={!!p.settings.shortRestRequiresFood} onChange={e=>rule('shortRestRequiresFood',e.target.checked)}/>Short-rest recovery also requires feeding</label>
   <Field label="Enhanced Exoskeleton AC duration (rounds)"><input type="number" min="1" value={p.settings.reflexArmorRounds??1} onChange={e=>rule('reflexArmorRounds',Math.max(1,Number(e.target.value)))}/></Field>
   <label className="l-check"><input type="checkbox" checked={!!p.settings.deadManInSwarm} onChange={e=>rule('deadManInSwarm',e.target.checked)}/>Allow Dead Man Walking to prevent Swarm Form death</label>
   <p>Multiclass spell slots use half your Entomancer level, rounded down. Hungry Mouths doubles the Population committed to foraging and recharges after a fed long rest; normal short-rest recovery is separate. Summon and Invicta activation costs in actions follow your table’s ruling.</p>
  </details>
  <details className="feature-detail swarm-reference" ref={environmentRef} open={ui.recoveryDisclosure==='environment'} onToggle={e=>{if(e.currentTarget.open&&ui.recoveryDisclosure!=='environment')onUiChange(u=>({...u,recoveryDisclosure:'environment'}));else if(!e.currentTarget.open&&ui.recoveryDisclosure==='environment')onUiChange(u=>({...u,recoveryDisclosure:null}));}}><summary>Environment &amp; derived benefits</summary><div className="form-grid"><Choice label="Current moisture" value={s.environmentMoisture||'Neutral'} options={['Neutral','Dry','Humid']} onChange={v=>set('environmentMoisture',v)}/><Choice label="Current temperature" value={s.environmentTemperature||'Neutral'} options={['Neutral','Hot','Cold']} onChange={v=>set('environmentTemperature',v)}/></div>
   {[['underwater','Currently underwater'],['visibleEffect','Dexterity save is against a visible effect'],['targetConstruct','Attack target is a construct']].map(([key,label])=><label key={key} className="l-check"><input type="checkbox" checked={!!s[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}
   <p>Resistances: {p.resistances.join(', ')||'none'}{p.nonmagicalSlashing?' · nonmagical slashing':''}{p.allResistance?' · all non-vulnerable types':''}. Nonmagical physical damage reduction: {p.physicalReduction}.</p>
   <p>Size: {p.size}. Speed ×{p.speedMultiplier}; underwater movement ×{p.waterMultiplier}; burrow {p.burrow} ft. {p.waterBreathing?'Water breathing. ':''}{p.noWater?'No drinking water required. ':''}{p.adapted?'Immune to exhaustion from the matching extreme environment. ':''}{p.level>=11&&p.humid?'Unhindered underwater movement/attacks; walk on liquids. ':''}{p.species==='Exo-Gotas'?'Height +18 inches and body weight ×2. ':''}{p.species==='Exo-Gotas'&&p.level>=6?'Jump distance and carrying capacity ×2. ':''}</p>
   {p.level>=7&&<p>Many-Eyed detects hidden/invisible presence within 100 ft; spend Population to locate it.</p>}
   {p.species==='Decomposers'&&p.level>=14&&<p>No food required for you; your swarm still needs feeding. Life and undead detection do not detect you.</p>}
   {p.species==='Endo-Gotas'&&<button className="l-button" disabled={!!blocked} onClick={()=>{if(blocked)return;roll(`1d20${p.str+entomancerSkillRank(char,'Athletics')*p.pb+(p.level>=6?p.con:0)>=0?'+':''}${p.str+entomancerSkillRank(char,'Athletics')*p.pb+(p.level>=6?p.con:0)}`,'Grapple check');}}>Roll grapple</button>}
   {p.species==='Orthoptera'&&<><Choice label="Instrument check ability" value={s.instrumentAbility||'cha'} options={['str','dex','con','int','wis','cha']} onChange={v=>set('instrumentAbility',v)}/><button className="l-button" disabled={!!blocked} onClick={()=>{if(blocked)return;const key=s.instrumentAbility||'cha',bonus=Math.floor((effectiveAbilityScores(char)[key]-10)/2)+p.wis+p.pb;roll(`1d20${bonus>=0?'+':''}${bonus}`,`${s.instrument||'Instrument'} check`);}}>Roll instrument + Natural Savant</button></>}
  </details>
 </>;
}
