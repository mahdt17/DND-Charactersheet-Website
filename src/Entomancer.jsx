import EntomancerCompanions from './EntomancerCompanions';
import React,{useState,useRef} from 'react';
import {effectiveAbilityScores} from './lib/abilityScores';
import {entomancerSpecies,entomancerInstruments,entomancerSource} from './data/entomancer';
import {entomancerProfile,entomancerSkillRank,entomancerFeatureRows,entomancerStartsCharacter,entomancerActionBlockReason,entomancerSongSaves} from './lib/entomancer';
import {availableEntomancerActions,applyEntomancerAction} from './lib/entomancerActions';
const Field=({label,children})=><label className="l-field"><span>{label}</span>{children}</label>;
const Choice=({label,value,options,onChange})=><Field label={label}><select aria-label={label} value={value||''} onChange={e=>onChange(e.target.value)}><option value="">Choose…</option>{options.map(x=><option key={x}>{x}</option>)}</select></Field>;
export function entomancerChoicesComplete(c,{startingClass=entomancerStartsCharacter(c)}={}){const p=entomancerProfile(c),s=c.entomancer||{};return !p.level||entomancerSpecies.includes(s.species)&&(!startingClass||['Herbalism Kit','Poisoner’s Kit'].includes(s.tool))&&(s.species!=='Orthoptera'||entomancerInstruments.includes(s.instrument))&&(p.level<3||['Dry','Humid'].includes(s.moisture)&&['Hot','Cold'].includes(s.temperature));}
export function EntomancerChoices({char,patch,startingClass=entomancerStartsCharacter(char)}){
 const p=entomancerProfile(char),s=char.entomancer||{};if(!p.level)return null;
 const change=(key,value)=>patch({entomancer:{...s,[key]:value}});
 return <section aria-label="Entomancer choices"><h3>Entomancer choices</h3><div className="form-grid">
  <Choice label="Swarm species" value={s.species} options={entomancerSpecies} onChange={v=>change('species',v)}/>
  {startingClass&&<Choice label="Entomancer tool proficiency" value={s.tool} options={['Herbalism Kit','Poisoner’s Kit']} onChange={v=>change('tool',v)}/>}
  {s.species==='Orthoptera'&&<Choice label="Natural Savant instrument" value={s.instrument} options={entomancerInstruments} onChange={v=>change('instrument',v)}/>}
  {p.level>=3&&<><Choice label="Moisture adaptation" value={s.moisture} options={['Dry','Humid']} onChange={v=>change('moisture',v)}/><Choice label="Temperature adaptation" value={s.temperature} options={['Hot','Cold']} onChange={v=>change('temperature',v)}/></>}
 </div></section>;
}
export default function Entomancer({char,patch,roll}){
 const [action,setAction]=useState('pestilence'),[input,setInput]=useState({target:'',distance:0,type:'humanoid',size:'Medium',points:1,maxHP:22,actualDamage:0,hours:1,hp:1,cr:0,ability:'dex'}),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [setupOpen,setSetupOpen]=useState(()=>!entomancerChoicesComplete(char)),setupRef=useRef(null);
 const p=entomancerProfile(char),s=char.entomancer||{},actions=availableEntomancerActions(char),chosen=actions.find(a=>a.id===action)||actions[0];if(!p.level)return null;
 const blocked=entomancerActionBlockReason(char),songSaves=entomancerSongSaves(char);
 const put=(k,v)=>setInput({...input,[k]:v});
 const set=(k,v)=>patch({entomancer:{...s,[k]:v}});
 const rule=(k,v)=>set('settings',{...s.settings,[k]:v});
 const run=(id,values=input)=>{try{const next=patch(current=>applyEntomancerAction(current,id,values));setNotice(next?.entomancer?.log?.at(-1)||'Ability resolved.');setError('');}catch(e){setError(e.message);setNotice('');}};
 const number=(key,label,min=0)=><Field label={label}><input aria-label={label} type="number" min={min} value={input[key]??0} onChange={e=>put(key,Number(e.target.value))}/></Field>;
 const check=(key,label)=><label className="l-check"><input aria-label={label} type="checkbox" checked={!!input[key]} onChange={e=>put(key,e.target.checked)}/>{label}</label>;
 const usesTarget=['entomancy','pestilence','bug-swarm','summon','infest','many-eyed','apex-attack','corpse-jacker','decompose','latch','pure-terror','sonnet','serenade'].includes(chosen.id);
 const save=['entomancy','pestilence','bug-swarm','infest','pure-terror','sonnet'].includes(chosen.id);
 const latchTarget=(s.targets||[]).find(t=>t.id===s.latch?.targetId),hemo=Math.max(0,p.con+p.pb+(p.level>=18&&latchTarget?.conditions.includes('Frightened')?p.pb+p.wis:0));
 const references=<>
<details className="feature-detail swarm-reference" ref={setupRef} open={setupOpen} onToggle={e=>setSetupOpen(e.currentTarget.open)}><summary>Swarm choices &amp; table rulings</summary><EntomancerChoices char={char} patch={patch}/><p>The detailed feature text sets Adaptation improvement at level 11 and includes species abilities at level 6. The following values resolve gaps in the source and can be changed for your table.</p>
   <Choice label="Unspecified save ability" value={p.settings.saveAbility||'wis'} options={['wis','con']} onChange={v=>rule('saveAbility',v)}/>
   <Field label="Override unspecified save DC (blank uses ability)"><input aria-label="Override unspecified save DC" type="number" min="1" value={p.settings.saveDC??''} onChange={e=>rule('saveDC',e.target.value===''?null:Number(e.target.value))}/></Field>
   <Field label="Short-rest Population recovery (blank uses half maximum)"><input aria-label="Short-rest Population recovery" type="number" min="0" value={p.settings.shortRecovery??''} onChange={e=>rule('shortRecovery',e.target.value===''?null:Number(e.target.value))}/></Field>
   <label className="l-check"><input type="checkbox" checked={!!p.settings.shortRestRequiresFood} onChange={e=>rule('shortRestRequiresFood',e.target.checked)}/>Short-rest recovery also requires feeding</label>
   <Field label="Enhanced Exoskeleton AC duration (rounds)"><input type="number" min="1" value={p.settings.reflexArmorRounds??1} onChange={e=>rule('reflexArmorRounds',Math.max(1,Number(e.target.value)))}/></Field>
   <label className="l-check"><input type="checkbox" checked={!!p.settings.deadManInSwarm} onChange={e=>rule('deadManInSwarm',e.target.checked)}/>Allow Dead Man Walking to prevent Swarm Form death</label>
   <p>Multiclass spell slots use half your Entomancer level, rounded down. Hungry Mouths doubles the Population committed to foraging and recharges after a fed long rest; normal short-rest recovery is separate. Summon and Invicta activation costs in actions follow your table’s ruling.</p>
  </details>
  <details className="feature-detail swarm-reference"><summary>Environment &amp; derived benefits</summary><div className="form-grid"><Choice label="Current moisture" value={s.environmentMoisture||'Neutral'} options={['Neutral','Dry','Humid']} onChange={v=>set('environmentMoisture',v)}/><Choice label="Current temperature" value={s.environmentTemperature||'Neutral'} options={['Neutral','Hot','Cold']} onChange={v=>set('environmentTemperature',v)}/></div>
   {[['underwater','Currently underwater'],['visibleEffect','Dexterity save is against a visible effect'],['targetConstruct','Attack target is a construct']].map(([key,label])=><label key={key} className="l-check"><input type="checkbox" checked={!!s[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}
   <p>Resistances: {p.resistances.join(', ')||'none'}{p.nonmagicalSlashing?' · nonmagical slashing':''}{p.allResistance?' · all non-vulnerable types':''}. Nonmagical physical damage reduction: {p.physicalReduction}.</p>
   <p>Size: {p.size}. Speed ×{p.speedMultiplier}; underwater movement ×{p.waterMultiplier}; burrow {p.burrow} ft. {p.waterBreathing?'Water breathing. ':''}{p.noWater?'No drinking water required. ':''}{p.adapted?'Immune to exhaustion from the matching extreme environment. ':''}{p.level>=11&&p.humid?'Unhindered underwater movement/attacks; walk on liquids. ':''}{p.species==='Exo-Gotas'?'Height +18 inches and body weight ×2. ':''}{p.species==='Exo-Gotas'&&p.level>=6?'Jump distance and carrying capacity ×2. ':''}</p>
   {p.level>=7&&<p>Many-Eyed detects hidden/invisible presence within 100 ft; spend Population to locate it.</p>}
   {p.species==='Decomposers'&&p.level>=14&&<p>No food required for you; your swarm still needs feeding. Life and undead detection do not detect you.</p>}
   {p.species==='Endo-Gotas'&&<button className="l-button" disabled={!!blocked} onClick={()=>{if(blocked)return;roll(`1d20${p.str+entomancerSkillRank(char,'Athletics')*p.pb+(p.level>=6?p.con:0)>=0?'+':''}${p.str+entomancerSkillRank(char,'Athletics')*p.pb+(p.level>=6?p.con:0)}`,'Grapple check');}}>Roll grapple</button>}
   {p.species==='Orthoptera'&&<><Choice label="Instrument check ability" value={s.instrumentAbility||'cha'} options={['str','dex','con','int','wis','cha']} onChange={v=>set('instrumentAbility',v)}/><button className="l-button" disabled={!!blocked} onClick={()=>{if(blocked)return;const key=s.instrumentAbility||'cha',bonus=Math.floor((effectiveAbilityScores(char)[key]-10)/2)+p.wis+p.pb;roll(`1d20${bonus>=0?'+':''}${bonus}`,`${s.instrument||'Instrument'} check`);}}>Roll instrument + Natural Savant</button></>}
  </details>
 </>;
 return <section className={`l-panel entomancer-swarm ${entomancerChoicesComplete(char)?'is-configured':''}`} aria-label="Entomancer swarm"><h2>Entomancer swarm</h2><p>{p.species||'Choose a species'} · Population {p.remaining} / {p.max} · <a href={entomancerSource} target="_blank" rel="noreferrer">Homebrew source</a></p>
  {!entomancerChoicesComplete(char)&&<p role="alert">Complete your swarm choices. <button className="l-button" onClick={()=>{setSetupOpen(true);requestAnimationFrame(()=>{setupRef.current?.scrollIntoView({block:'start'});setupRef.current?.querySelector('select')?.focus({preventScroll:true});});}}>Complete swarm setup</button></p>}
  <div className="form-grid"><Field label="Swarm ability"><select aria-label="Swarm ability" value={chosen.id} onChange={e=>{setAction(e.target.value);setNotice('');setError('');}}>{[...new Set(actions.map(a=>a.activation))].map(activation=><optgroup key={activation} label={activation}>{actions.filter(a=>a.activation===activation).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>)}</select></Field><p>{chosen.activation} · {chosen.cost==null?'Variable':chosen.cost} Population<br/>{chosen.description}</p></div>
  {usesTarget&&<div className="form-grid"><Field label="Target or corpse name"><input aria-label="Target or corpse name" value={input.target} onChange={e=>put('target',e.target.value)}/></Field>{number('distance','Target distance (ft.)')}{['entomancy','infest','corpse-jacker','latch'].includes(chosen.id)&&<Choice label="Target creature type" value={input.type} options={['humanoid','insect','beast','construct','undead','elemental','ooze','other']} onChange={v=>put('type',v)}/>}{['corpse-jacker','decompose'].includes(chosen.id)&&<Choice label="Corpse size" value={input.size} options={['Tiny','Small','Medium','Large','Huge','Gargantuan']} onChange={v=>put('size',v)}/>}</div>}
  {save&&<><p>Save DC {['infest','pure-terror'].includes(chosen.id)?p.uncertainDC:chosen.id==='sonnet'||chosen.id==='entomancy'?p.spellDC:p.populationDC}{['infest','pure-terror'].includes(chosen.id)?' (table ruling)':''}.</p>{check('success','Target succeeded on its save')}</>}
  {chosen.id==='entomancy'&&number('cr','Insect challenge rating')}
  {chosen.id==='infest'&&number('points','Population to invest',1)}
  {chosen.id==='many-eyed'&&check('detected','Entity was previously detected')}
  {chosen.id==='latch'&&<>{check('grappled','Grapple succeeded')}{p.level>=14&&<><p>Neuro Toxin: Constitution save DC {p.uncertainDC}.</p>{check('failedSave','Target failed initial Neuro Toxin save')}</>}</>}
  {chosen.id==='bug-armor'&&(char.hp.temp||0)>0&&check('replaceTemp','Replace existing temporary HP')}
  {['corpse-jacker','summon'].includes(chosen.id)&&number('maxHP','Summon maximum HP',1)}
  {chosen.id==='hungry-mouths'&&number('hours','Completed foraging hours',1)}
  {chosen.id==='end-condition'&&<Choice label="Condition to end" value={input.condition} options={['Charmed','Frightened']} onChange={v=>put('condition',v)}/>}
  {chosen.id==='apex-attack'&&<><Choice label="Apex attack ability" value={input.ability} options={['str','dex']} onChange={v=>put('ability',v)}/></>}
  {chosen.id==='serenade'&&<>{number('hp','Ally current HP',1)}{check('canHear','Ally can hear the song')}</>}
  {blocked&&<p role="status">{blocked}</p>}
  <button className="l-button primary" disabled={!entomancerChoicesComplete(char)||!!blocked&&!(chosen.id==='dead-man'&&!s.dead&&char.hp.current===0)||(chosen.id==='harmonize'&&p.song)||(chosen.cost||0)>p.remaining} onClick={()=>run(chosen.id)}>Use {chosen.name}</button>
  <p className="l-muted">Confirm target saves, range and actual damage at the table. Target damage below is a running record; it does not change another character’s sheet.</p>
  {notice&&<p className="action-feedback" role="status">{notice}</p>}
  {error&&<p role="alert">{error}</p>}
  {(chosen.cost||0)>p.remaining&&<p className="l-muted">Needs {chosen.cost} Population; {p.remaining} remaining.</p>}
  {s.pendingApex&&<p>Apex attack: {s.pendingApex.attack}; damage on hit: {s.pendingApex.damage}. <button className="l-button" onClick={()=>run('apex-hit',{hit:true})}>Apex attack hit</button><button className="l-button" onClick={()=>run('apex-hit',{hit:false})}>Apex attack missed</button></p>}
  {chosen.id==='pure-terror'&&s.effects?.terror&&<button className="l-button" disabled={!!blocked} onClick={()=>run('terror-save')}>Resolve another Terror target (no extra cost)</button>}
  {p.form&&<button className="l-button" disabled={!!blocked} onClick={()=>run('end-form',{})}>End Swarm Form (bonus action)</button>}
  {p.invisible&&<p>Invisible; attacking and spellcasting do not end Apex invisibility.</p>}
  {s.psychicSave&&<p>Hive Mind: the next selected saving throw has advantage.</p>}
  {p.song&&<><p>Harmonize: {p.songRange} ft; friendly saves {p.wis>=0?'+':''}{p.wis}.{p.level<14?' Moving or another action ends the song.':''}</p><button className="l-button" onClick={()=>run('end-song',{})}>Stop singing</button><button className="l-button" onClick={()=>run('move',{})}>Move / other action</button>{songSaves.length>0&&<><p>{songSaves.length} concentration {songSaves.length===1?'check':'checks'} pending</p><p>Song concentration: CON DC {songSaves[0]}</p><button className="l-button" onClick={()=>{const r=roll(`1d20${p.con+(char.saveProf?.con?p.pb:0)+(p.song?p.wis:0)>=0?'+':''}${p.con+(char.saveProf?.con?p.pb:0)+(p.song?p.wis:0)}`,'Constitution saving throw');if(r)run('song-save',{success:r.total>=songSaves[0]});}}>Resolve song concentration</button></>}</>}
  {p.species==='Endo-Gotas'&&latchTarget&&<div><p>Latched to {latchTarget.name}. Hemo damage: {hemo}; heal damage actually dealt.{p.level>=10?' Victim has disadvantage on Strength and Dexterity checks.':''}{p.level>=14?` Neuro Toxin: CON DC ${p.uncertainDC}, repeat at target turn end.`:''}</p>{number('actualDamage','Hemo damage actually dealt')}{p.level>=14&&check('failedSave','Target failed Neuro Toxin save')}<button className="l-button" disabled={!!blocked} onClick={()=>run('hemo',{...input,timing:'your-start'})}>Resolve Hemo — your turn start</button>{p.level>=14&&<button className="l-button" disabled={!!blocked} onClick={()=>run('hemo',{...input,timing:'target-end'})}>Resolve Hemo — target turn end</button>}<button className="l-button" onClick={()=>run('end-grapple',{})}>Grapple ended</button></div>}
  <EntomancerCompanions char={char} patch={patch} roll={roll}/>
  {!!s.targets?.length&&<><h3>Target effects</h3>{s.targets.map(t=><div className="feature-detail" key={t.id}><strong>{t.name}</strong><p>Damage recorded: {t.damage}; healing: {t.healing||0}. {t.conditions.join('; ')}</p>{t.infestation?.remaining>0&&<><p>Infestation: {t.infestation.points}d8 · {t.infestation.remaining} rounds left.</p><button className="l-button" disabled={!!blocked} onClick={()=>run('infestation-damage',{id:t.id,distance:input.distance})}>Infestation damage — {t.name}</button></>}{t.conditions.includes('Paralyzed')&&<button className="l-button" onClick={()=>run('toxin-save',{id:t.id,success:true})}>Neuro Toxin save succeeded — {t.name}</button>}<button className="l-button" onClick={()=>run('clear-target',{id:t.id})}>Clear {t.name}</button></div>)}</>}
  {references}
  <details className="feature-detail"><summary>Time &amp; recent activity</summary><p>Advance elapsed game time to expire effects and complete Decomposition. Turn-triggered damage and healing use their own controls.</p><div className="l-toolbar">{[[1,'1 round'],[10,'1 minute'],[600,'1 hour'],[14400,'1 day']].map(([rounds,label])=><button key={rounds} className="l-button" onClick={()=>run('advance-time',{rounds})}>Advance {label}</button>)}</div>{Object.entries(s.effects||{}).filter(([,e])=>e).map(([key,e])=><p key={key}>{key}: {e.remaining} rounds</p>)}{(s.log||[]).slice(-8).reverse().map((text,i)=><p key={i}>{text}</p>)}</details>
 </section>;
}
