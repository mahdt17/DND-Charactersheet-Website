import React,{useEffect,useState} from 'react';
import {B,F,Num,Target,sign} from './CampaignControls';
import {spellRule} from './lib/campaignSpellEffects';
import {findSpellCast,replaceSpellCast,spellSaveMetadata,targetSavePlan,recordTargetSaveRoll,clearTargetSaveRoll,reconcileSaveDrafts,saveBasisMatches,resolveSpellTarget,supportedConditions} from './lib/spellResolution';
import ChainTargetList from './ChainTargetList';

function Proof({result}){
 return <span>{result.method==='rolled'?`d20 [${result.faces.join(', ')}] ${sign(result.modifier)} modifier ${sign(result.adjustment)} adjustment ${sign(result.cystAdjustment)} cyst = `:result.method==='blocked'?'Blocked':result.total!=null?'Manual total ':''}{result.total!=null?`${result.total} vs DC ${result.dc}: ${result.passed?'Succeeded':'Failed'}`:''}</span>;
}
export function CampaignEffectResolver({char,patch,roll}){
 const [selected,setSelected]=useState('');
 const casts=[char.archivistCampaign?.lastCast,...char.archivistCampaign?.castHistory||[]].filter((x,i,a)=>x?.id&&a.findIndex(y=>y?.id===x.id)===i);
 const cast=findSpellCast(char,selected)||casts[0];
 if(!cast||['2024','3.5'].includes(cast.edition||char.mechanics||char.ruleset))return null;
 return <section className="l-panel" aria-label="Spell effect resolution"><h3>Resolve {cast.name}</h3>{casts.length>1&&<F label="Spell cast history"><select value={cast.id} onChange={e=>setSelected(e.target.value)}>{casts.map((s,i)=><option key={s.id} value={s.id}>{s.name} · DC {s.dc} · {i===0?'Current cast':Number.isFinite(Date.parse(s.createdAt))?new Date(s.createdAt).toLocaleString():'Earlier cast '+i} · {s.results?.length||s.resolved?.length||0} results</option>)}</select></F>}<TargetResolution key={cast.id} char={char} cast={{...cast,rule:cast.rule||spellRule(char,cast.spellId||'')}} patch={patch} roll={roll}/></section>;
}
function TargetResolution({char,cast,patch,roll}){
 const initial=()=>cast.damageRolls?.length?{damage:cast.damageRolls.reduce((sum,r)=>sum+r.total,0),damageProof:cast.damageRolls}:{};
 const firstDraft=Object.entries(cast.saveDrafts||{})[0],firstId=firstDraft?.[0]||'';
 const [target,setTarget]=useState(firstId.startsWith('table:')?'':firstId||(['sense','empower'].includes(cast.rule?.effect)?'self':'')),[name,setName]=useState(firstId.startsWith('table:')?firstDraft[1].input.name||firstId.slice(6):''),[input,setInput]=useState(firstDraft?.[1].input||initial),[rolled,setRolled]=useState(firstDraft?.[1].proof||null),[correct,setCorrect]=useState(false),[error,setError]=useState('');
 const id=name.trim()?'table:'+name.trim().toLowerCase():target,meta=spellSaveMetadata(cast),rule=cast.rule||{},plan=targetSavePlan(char,cast.id,id,{...input,name}),previous=cast.results?.find(r=>r.targetId===id),queued=cast.targets?.find(t=>t.targetId===id);
 const activeRolled=saveBasisMatches(plan,rolled)?rolled:null,pending=Object.entries(cast.saveDrafts||{}).filter(([draftId,draft])=>{try{return saveBasisMatches(targetSavePlan(char,cast.id,draftId,draft.input),draft.proof);}catch{return false;}});
 useEffect(()=>{if(reconcileSaveDrafts(char,cast.id)!==char)patch(current=>reconcileSaveDrafts(current,cast.id));},[char,cast.id]);
 const change=(key,value)=>{setInput(old=>({...old,[key]:value,...(key==='condition'?{rounds:old.rounds??1}:{}),...(key==='save'?{freshSaveConfirmed:true}:{}),...(key==='damage'?{damageProof:undefined}:{})}));if(['modifier','adjustment','cystConfirmed','mode','ability','save','area'].includes(key)){setRolled(null);patch(current=>clearTargetSaveRoll(current,cast.id,id));}};
 const choose=id=>{const draft=cast.saveDrafts?.[id];setTarget(id);setName(id.startsWith('table:')?draft?.input.name||id.slice(6):'');setInput(draft?.input||initial());setRolled(draft?.proof||null);setCorrect(false);setError('');};
 const run=fn=>{try{fn();setError('');}catch(e){setError(e.message);}};
 const reopen=r=>{const basis=targetSavePlan(char,cast.id,r.targetId,r.input||{}),fresh=saveBasisMatches(basis,r);setTarget(r.targetId);setName('');setInput(fresh?{...r.input,save:r.total==null?'':r.total-r.cystAdjustment}:{...r.input,modifier:undefined,save:'',freshSaveConfirmed:false});setRolled(fresh&&r.method==='rolled'?r:null);setCorrect(true);setError('');};
 const view={...char,archivistCampaign:{...char.archivistCampaign,lastCast:cast}};
 const legacyOrdinary=!cast.spell&&!rule.effect,damaging=meta.damaging||input.damaging||plan.chainDamage;
 const manualLabel=plan.chainDamage?'Target Dexterity save total':`Target ${plan.ability.toUpperCase()} save total (before cyst penalty)`;
 return <>
 <p>DC {plan.dc}{plan.secondary&&!plan.chainDamage?' (secondary DC −4)':''}{plan.chainDamage?' · Dexterity save for half secondary damage':''}. Confirm range, target eligibility, immunity, resistance, attack hits and legendary resistance at the table.</p>
 {pending.length>0&&<div aria-label="Pending target saves"><strong>Pending saved rolls</strong>{pending.map(([draftId,draft])=><B key={draftId} onClick={()=>choose(draftId)}>Resume {draft.proof.name}: {draft.proof.total} vs DC {draft.proof.dc}</B>)}</div>}
 {rule.description&&<p>{rule.description}</p>}
 {cast.chain&&<ChainTargetList char={view} patch={next=>patch(current=>replaceSpellCast(current,next.archivistCampaign.lastCast))} selected={target} onSelect={choose}/>}
 <div role="group" aria-label={queued?'Resolve target: '+queued.name:'Target resolution'}>
 {(!cast.chain||input.area)&&<><Target char={char} value={target} onChange={choose} self/><F label="Or enter a target name"><input value={name} onChange={e=>{setName(e.target.value);setTarget('');setRolled(null);setCorrect(false);}}/></F></>}
 {queued&&<p>Resolving {queued.secondary?'secondary':'primary'}: {queued.name}.</p>}
 {correct&&<p>Correcting {previous?.name}. No spell slots, components or helper resources will be spent.</p>}
 {correct&&previous&&!saveBasisMatches(plan,previous)&&<p role="alert">The saved result uses an earlier save basis. Roll again or enter a fresh manual total.</p>}
 {(plan.needsSave||!meta.ability&&!rule.effect&&!legacyOrdinary)&&<>
 {!meta.ability&&!plan.chainDamage&&<F label="Target save ability"><select value={input.ability||''} onChange={e=>change('ability',e.target.value)}><option value="">No known save / table resolution</option>{['str','dex','con','int','wis','cha'].map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}</select></F>}
 <Num label="Target save modifier" value={input.modifier??plan.modifier} min={-99} max={99} onChange={n=>change('modifier',n)}/><p>{plan.modifierSource==='creatureProfile.saves'?'Uses the tracked creature’s ability, proficiency and grafts. Enter a value to override.':plan.modifierSource==='character save'?'Uses this character’s sheet saving throw bonus. Enter a value to override.':'Use this target’s modifier.'}</p>
 <Num label="Additional save adjustment" value={input.adjustment??0} min={-99} max={99} onChange={n=>change('adjustment',n)}/>
 {meta.necromancy&&id.startsWith('table:')&&!plan.chainDamage&&<label><input type="checkbox" checked={!!input.cystConfirmed} onChange={e=>change('cystConfirmed',e.target.checked)}/>Target bears a Necrotic Cyst</label>}
 <p>Automatic Necrotic Cyst adjustment: {sign(plan.cystAdjustment)}. Do not include it in the modifier, additional adjustment or manual total.</p>
 <F label="Target save mode"><select value={input.mode||'normal'} onChange={e=>change('mode',e.target.value)}><option value="normal">Normal</option><option value="advantage">Target advantage</option><option value="disadvantage">Target disadvantage</option></select></F>
 <B disabled={!id||!plan.ability||previous&&!correct} onClick={()=>run(()=>{const next=recordTargetSaveRoll(char,cast.id,id,{...input,name},roll),draft=findSpellCast(next,cast.id).saveDrafts?.[id];if(draft){patch(next);setRolled(draft.proof);}})}>Roll Save</B>
 <Num label={manualLabel} value={input.save??''} min={-999} onChange={v=>change('save',v)}/><p>Manual total includes the target modifier and additional adjustments; cyst is applied separately.</p>
 {activeRolled&&<p aria-label="Visible save result" role="status"><Proof result={activeRolled}/></p>}
 </>}
 {!meta.damaging&&!rule.effect&&!plan.secondary&&<label><input type="checkbox" checked={!!input.damaging} onChange={e=>change('damaging',e.target.checked)}/>This spell deals damage</label>}
 {damaging&&(plan.chainDamage?<p>Primary damage {cast.primaryDamage}. Apply {Math.floor(cast.primaryDamage/2)} on a failed Dexterity save or {Math.floor(cast.primaryDamage/4)} on a success.</p>:<>
 <Num label={rule.damageCap?'Rolled primary necrotic damage':legacyOrdinary?'Damage dealt to the primary target':'Rolled damage before save'} value={input.damage??''} onChange={v=>change('damage',v)}/>
 {meta.rolls.length>0&&<B onClick={()=>run(()=>{const results=meta.rolls.map(d=>/^\d+$/.test(d.expression)?{total:Number(d.expression),rolls:[]}:roll(d.expression,cast.name+' '+d.label,{mode:'normal',ignoreCharacterEffects:true,inline:true,kind:'damage'}));if(results.some(r=>!r))return;setInput(old=>({...old,damage:results.reduce((n,r)=>n+r.total,0),damageProof:results}));})}>{rule.damageCap?`Roll ${meta.rolls[0].expression} necrotic damage`:'Roll spell damage'}</B>}
 {input.damageProof&&<p>Damage dice: {input.damageProof.map(r=>`[${r.rolls?.join(', ')||r.total}]`).join(' + ')} = {input.damage}</p>}
 {!rule.effect&&plan.needsSave&&!meta.success&&<F label="Damage on successful save"><select value={input.successOnSave||''} onChange={e=>change('successOnSave',e.target.value)}><option value="">Unknown: apply at table</option><option value="none">None (confirmed)</option><option value="half">Half (confirmed)</option><option value="full">Full (confirmed)</option></select></F>}
 </>)}
 {!rule.effect&&<details><summary>Configure a condition from the spell source</summary><p>Only select a condition and duration explicitly supported by the source and this target. Repeat saves, conditional endings and other effects remain table-managed.</p><F label="Condition on failed save"><select value={input.condition||''} onChange={e=>change('condition',e.target.value)}><option value="">No automatic condition</option>{supportedConditions.map(c=><option key={c}>{c}</option>)}</select></F>{input.condition&&<><Num label="Condition duration in rounds" value={input.rounds??1} min={1} onChange={v=>change('rounds',v)}/><label><input type="checkbox" checked={!!input.eligibilityConfirmed} onChange={e=>change('eligibilityConfirmed',e.target.checked)}/>Source, duration and target eligibility confirmed</label></>}</details>}
 {cast.erupted&&<><label><input type="checkbox" checked={!!input.area} onChange={e=>change('area',e.target.checked)}/>Eruption splash target within 20 feet</label>{input.area&&<Num label="Splash CON save against cyst" value={input.cystSave??''} min={-99} onChange={v=>change('cystSave',v)}/>}</>}
 {rule.effect==='awaken'&&<><Num label="Awakening 3d6 Intelligence" value={input.intRoll??''} min={3} max={18} onChange={v=>change('intRoll',v)}/><B onClick={()=>run(()=>change('intRoll',roll('3d6','Awakening Intelligence',{mode:'normal',ignoreCharacterEffects:true,inline:true})?.total))}>Roll awakening Intelligence</B><Num label="Awakening 1d3 Charisma increase" value={input.chaRoll??''} min={1} max={3} onChange={v=>change('chaRoll',v)}/><B onClick={()=>run(()=>change('chaRoll',roll('1d3','Awakening Charisma',{mode:'normal',ignoreCharacterEffects:true,inline:true})?.total))}>Roll awakening Charisma</B><F label="Awakened language"><input value={input.language??'Common'} onChange={e=>change('language',e.target.value)}/></F></>}
 <label><input type="checkbox" checked={!!input.blocked} onChange={e=>change('blocked',e.target.checked)}/>Protection, immunity or blocked access prevents this effect</label>
 {(correct||rule.effect&&(cast.spell?.concentration||rule.concentration)&&(char.concentration!==cast.name||char.archivistCampaign?.concentrationCastId!==cast.id))&&<label><input type="checkbox" checked={!!input.recordOnly} onChange={e=>change('recordOnly',e.target.checked)}/>Record-only {correct?'correction':'resolution'}: reconcile all effects manually; leave statistics unchanged</label>}
 <B disabled={!id||previous&&!correct||cast.chain&&!input.area&&(!queued||plan.secondary&&!cast.resolved?.length)} onClick={()=>run(()=>{const next=resolveSpellTarget(char,cast.id,id,{...input,name,rolled:activeRolled,correct});patch(next);setCorrect(false);setRolled(null);})}>{correct?'Save correction':'Apply spell effect'}</B>
 {error&&<p role="alert">{error}</p>}{cast.lastResult&&<p role="status">{cast.lastResult}</p>}
 </div>
 {!!cast.results?.length&&<section aria-label="Target results"><h4>Saved target results</h4>{cast.results.map(r=><article key={r.targetId}><strong>{r.name}</strong><p><Proof result={r}/></p><p>{r.instruction}</p>{r.needsCorrection&&<p role="alert">Needs correction: primary Chain damage changed. Reopen this secondary result.</p>}<B onClick={()=>reopen(r)}>Correct {r.name}</B>{r.revisions?.length>0&&<details><summary>{r.revisions.length} previous revision(s)</summary>{r.revisions.map((rev,i)=><p key={i}><Proof result={rev}/> · {rev.instruction}</p>)}</details>}</article>)}</section>}
 </>;
}
