import React,{useState} from 'react';
import {effectiveAbilities} from './CharacterManager';
import {modifier,signed,rollDice} from './lib/rules';
import {characterSlots,spellSlotPools,spellCounts,castingKey,is35,mechanics,permittedSpells,spellAccess,keyOf,resolveSpell,editionName} from './lib/editions';
import {spellPlan,availableSlots,spendSpellSlot,criticalDice} from './lib/play';
import {useReferenceIndex} from './lib/referenceIndex';
import Dialog from './Dialog';
import SpellAccessGrants from './SpellAccessGrants';
import SubclassSpellChoices from './SubclassSpellChoices';
import {characterClasses,classCharacter,spellsForClass} from './lib/advancement';
import SpellPicker from './EditionSpellPicker';

export default function EditionSpellbook({char,patch,roll,show,homebrew=[]}) {
  const [manage,setManage]=useState(false),[cast,setCast]=useState(null),[slot,setSlot]=useState(1),[slotPool,setSlotPool]=useState('standard'),[formula,setFormula]=useState(''),[attack,setAttack]=useState(false),[castError,setCastError]=useState(''),[castNotice,setCastNotice]=useState('');
  const rows=characterClasses(char),multiple=rows.length>1;
  const [classId,setClassId]=useState('');
  const active=rows.find(r=>r.catalogId===classId)||rows[0],classModel=multiple?classCharacter(char,active):char;
  const accessModel=char.ruleset==='custom'?{...classModel,ruleset:'custom',mechanics:active.edition}:classModel;
  const accessFor=s=>s.auto?{allowed:true}:spellAccess(accessModel,resolveSpell(s,classModel));
  const classSpells=multiple?spellsForClass(char,active.catalogId):(char.spells||[]);
  const reference=useReferenceIndex(manage?['spells']:[],char.ruleset||'2014'),manual=is35(classModel)||char.ruleset==='custom';
  const perClassLegacySlots=is35(classModel),isPrimary=active.catalogId===rows[0]?.catalogId;
  const activeSlotsUsed=perClassLegacySlots?(char.classSlotsUsed?.[active.catalogId]??(isPrimary?char.slotsUsed||{}:{})):(char.slotsUsed||{});
  const activeOverride=perClassLegacySlots?(char.classSlotOverrides?.[active.catalogId]??(isPrimary?char.slotOverride:undefined)):char.slotOverride;
  const slotCharacter=perClassLegacySlots?{...classModel,slotsUsed:activeSlotsUsed,slotOverride:activeOverride}:char;
  const pools=spellSlotPools(slotCharacter),slots=pools.standard,ability=castingKey(classModel),mod=modifier(effectiveAbilities(char)[ability]||10);
  const counts=spellCounts(classModel,effectiveAbilities(char)[ability]||10),pb=is35(char)?Number(char.bab)||0:2+Math.floor((char.level-1)/4);
  const candidates=permittedSpells(accessModel,[...homebrew,...reference.entries]).filter(s=>!spellAccess(accessModel,s).alwaysPrepared);
  const restricted=classSpells.filter(s=>!accessFor(s).allowed);
  const activeTracks=(char.classProgressionTracks||[]).filter(track=>track.sourceClassId===active.catalogId);
  const trackNumber=name=>{const value=activeTracks.find(track=>track.name.toLowerCase()===name.toLowerCase())?.value;const number=parseInt(value);return Number.isFinite(number)?number:null;};
  const maneuverKnown=trackNumber('Maneuvers Known'),maneuverReadied=trackNumber('Maneuvers Readied'),stancesKnown=trackNumber('Stances Known');
  const maneuverMode=is35(classModel)&&maneuverKnown!=null;
  const isStance=spell=>Boolean(spell?.isManeuver&&/\(stance\)/i.test(spell.school||''));
  const knownManeuvers=classSpells.filter(spell=>spell.isManeuver&&!isStance(spell)),knownStances=classSpells.filter(isStance),readiedManeuvers=knownManeuvers.filter(spell=>spell.prepared);
  const selected=classSpells.map(s=>keyOf(s));
  const cantrips=classSpells.filter(s=>!s.auto&&!accessFor(s).alwaysPrepared&&s.level===0),leveled=classSpells.filter(s=>!s.auto&&!accessFor(s).alwaysPrepared&&s.level>0);
  const spellLimit=manual||counts.mode==='spellbook'?Infinity:counts.mode==='known'?counts.known:counts.prepared;
  const prepared=leveled.filter(s=>s.prepared).length;
  const overLimit=!manual&&(cantrips.length>counts.cantrips||leveled.length>spellLimit||counts.mode==='spellbook'&&prepared>counts.prepared);
  const slotUsePatch=used=>perClassLegacySlots?{classSlotsUsed:{...(char.classSlotsUsed||{}),[active.catalogId]:used}}:{slotsUsed:used};
  const overrideSlots=value=>patch(perClassLegacySlots?{classSlotOverrides:{...(char.classSlotOverrides||{}),[active.catalogId]:value},...(isPrimary?{slotOverride:null}:{})}:{slotOverride:value});
  const slotOptions=spell=>availableSlots(slotCharacter,spell);
  const spendActiveSlot=(spell,level,pool)=>{
    const spent=spendSpellSlot(slotCharacter,spell,level,pool);
    return perClassLegacySlots?slotUsePatch(spent.slotsUsed||{}):spent;
  };
  function add(s) {
    const key=keyOf(s),existing=classSpells.find(x=>keyOf(x)===key);
    if(existing){patch({spells:char.spells.filter(x=>x.id!==existing.id)});return;}
    if(!spellAccess(accessModel,s).allowed||accessFor(s).alwaysPrepared)return;
    if(maneuverMode&&s.isManeuver){
      const stance=isStance(s),number=stance?knownStances.length:knownManeuvers.length,limit=stance?(stancesKnown??Infinity):(maneuverKnown??Infinity);
      if(number>=limit)return;
      patch({spells:[...char.spells,{...s,id:crypto.randomUUID(),castingClassId:active.catalogId,prepared:stance}]});
      return;
    }
    const number=classSpells.filter(x=>!x.auto&&!accessFor(x).alwaysPrepared&&(x.level===0)===(s.level===0)).length;
    const limit=manual?Infinity:s.level===0?counts.cantrips:counts.mode==='spellbook'?Infinity:counts.mode==='known'?counts.known:counts.prepared;
    if(number>=limit)return;
    patch({spells:[...char.spells,{...s,id:crypto.randomUUID(),castingClassId:active.catalogId,prepared:manual||counts.mode!=='spellbook'}]});
  }
  function open(s){const data={...resolveSpell(s,char),...s,level:accessFor(s).level??s.level};setCast(data);setCastError('');const first=slotOptions(data)[0];setSlot(first?.level??Math.max(is35(char)?0:1,Number(data.level)||0));setSlotPool(first?.pool||'standard');setFormula(s.rollFormula||'');setAttack(!!s.rollAttack);}
  const plan=cast?spellPlan(cast,char,slot,mod):null;
  const expressions=plan?.rolls.filter(r=>/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$|^\d+$/.test(r.expression))||[];
  const needsSlot=cast&&!cast.isManeuver&&(is35(char)||cast.level!==0)&&!cast.auto;
  function castSpell(ritual=false){
    const access=accessFor(cast);if(!access.allowed){setCastError(access.reason);return;}
    if(cast.level==null){setCastError('Set this reference spell’s level before casting.');return;}
    if(needsSlot&&!ritual&&!slotOptions(cast).some(x=>x.level===slot&&(x.pool||'standard')===slotPool)){setCastError('Choose an available slot for this spell.');return;}
    if(formula&&!/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/.test(formula.replace(/\s/g,''))){setCastError('Use a roll such as 3d6+2.');return;}
    const dice=formula?[{expression:formula.replace(/\s/g,''),label:'Custom spell roll'}]:expressions;
    try{for(const d of dice){if(!/^\d+$/.test(d.expression)){rollDice(d.expression,'normal',()=>0);if(!is35(char)&&(plan.attack||attack)&&/damage/i.test(d.label))rollDice(criticalDice(d.expression),'normal',()=>0);}}}catch(error){setCastError(error.message);return;}
    if(!ritual)for(let i=0;i<(plan.attack||attack?plan.count:1);i++){
      const hit=plan.attack||attack?roll(`1d20${signed(is35(char)?(Number(char.bab)||0)+modifier(effectiveAbilities(char)[/ranged/i.test(cast.attack_type||cast.description||'')?'dex':'str']):pb+mod)}`,`${cast.name} · attack ${i+1}`,{kind:'attack'}):null;
      for(const d of dice){if(/^\d+$/.test(d.expression))continue;roll(!is35(char)&&hit&&hit.total-hit.bonus===20&&/damage/i.test(d.label)?criticalDice(d.expression):d.expression,`${cast.name} · ${d.label}`,{kind:'damage'});}
    }
    patch({...(needsSlot&&!ritual?spendActiveSlot(cast,slot,slotPool):{}),...(cast.concentration?{concentration:cast.name}:{}),spells:char.spells.map(s=>s.id===cast.id?{...s,rollFormula:formula,rollAttack:attack}:s)});
    setCastNotice(cast.isManeuver?`${cast.name} used.`:`${cast.name} cast${ritual?' as a ritual':needsSlot?` using a level ${slot}${slotPool==='pact'?' Pact Magic':''} slot`:''}.${cast.concentration?' Concentration started.':''}`);setCast(null);
  }
  return <><div className="l-section-head"><h2>{maneuverMode?'Maneuvers & stances':'Spellbook'} · {editionName(char.ruleset)}</h2><button className="l-button" onClick={()=>setManage(!manage)}>{manage?'Done':maneuverMode?'Manage maneuvers':'Manage spells'}</button></div>
    {char.ruleset==='custom'&&<label className="l-check"><input type="checkbox" checked={!!char.unrestrictedSpellAccess} onChange={e=>patch({unrestrictedSpellAccess:e.target.checked})}/> Allow spells from any class or edition (table-approved Custom rules)</label>}
    <SubclassSpellChoices char={char} model={classModel} classId={active.catalogId} patch={patch}/>{pools.restricted?.some(Boolean)&&<p className="l-notice">Your class also grants restricted slots: {pools.restricted.flatMap((n,level)=>n?[`level ${level}: ${n}`]:[]).join(' · ')}. Track domain or specialist casts separately; these slots cannot cast arbitrary class spells.</p>}
    {restricted.length>0&&<section aria-label="Spells needing review"><p className="l-notice" role="alert">{restricted.length} saved spell(s) need class access review. They remain saved, but cannot be cast until eligible or granted by a specific feature.</p>{restricted.map(s=><div key={s.id}><strong>{s.name}</strong><p>{accessFor(s).reason}</p><button className="l-button" onClick={()=>patch({spells:char.spells.filter(x=>x.id!==s.id)})}>Remove {s.name}</button></div>)}</section>}
    {multiple&&<label className="l-field"><span>Spellcasting class</span><select value={active.catalogId} onChange={e=>{setClassId(e.target.value);setCast(null);}}>{rows.map(r=><option key={r.catalogId} value={r.catalogId}>{r.name} {r.level} · {editionName(r.edition)}</option>)}</select></label>}<div className="form-grid"><label className="l-field"><span>Casting ability</span><select aria-label="Casting ability" value={ability} onChange={e=>multiple?patch({classLevels:rows.map(r=>r.catalogId===active.catalogId?{...r,castingAbility:e.target.value}:r)}):patch({castingAbility:e.target.value})}><option value="">Choose</option>{['str','dex','con','int','wis','cha'].map(k=><option key={k}>{k}</option>)}</select></label><p>Spell attack {signed(pb+mod)} · Save DC {is35(char)?`10 + spell level ${signed(mod)}`:8+pb+mod}</p></div>
    {castNotice&&<p className="l-notice" role="status">{castNotice}</p>}{maneuverMode?<p>Maneuvers known: {knownManeuvers.length} / {maneuverKnown} · Readied: {readiedManeuvers.length} / {maneuverReadied??'—'} · Stances: {knownStances.length} / {stancesKnown??'—'}</p>:!manual&&<p>Cantrips: {cantrips.length} / {counts.cantrips} · {counts.mode==='known'?'Known spells':'Prepared spells'}: {counts.mode==='spellbook'?prepared:leveled.length} / {counts.mode==='known'?counts.known:counts.prepared||0}{counts.mode==='spellbook'?` · Spellbook: ${leveled.length} spells`:''}</p>}{overLimit&&<p className="l-notice" role="alert">This character exceeds its spell limit. Remove extra class spells or unprepare extras before casting. Your saved spells have been kept.</p>}
    {(manual||multiple)&&<details className="feature-detail"><summary>Spell slots and homebrew adjustments</summary><p>{pools.mode==='automatic'?'Slots are calculated from your classes. Pact Magic has its own pool and recovers on a short rest.':pools.reason||'Set total slots from your class source.'} Each class’s spell choices use its individual level. Editing totals enables a personal override for this pool. In 3.5, each class keeps its own slots and expenditure. Prestige, unsupported subclasses and cross-edition conversions require your table’s ruling.</p>{pools.mode==='override'&&<button className="l-button" onClick={()=>overrideSlots(null)}>Use calculated spell slots</button>}<div className="form-grid">{slots.map((n,i)=><label className="l-field" key={i}><span>Level {i} slots</span><input type="number" min="0" max="30" value={n} onChange={e=>overrideSlots(slots.map((x,j)=>j===i?Math.max(0,Math.min(30,Number(e.target.value)||0)):x))}/></label>)}</div></details>}
    <div className="slot-trackers">{slots.map((n,i)=>n>0&&<div key={i}><strong>Level {i}</strong><span>{Array.from({length:n},(_,j)=><button key={j} className={`slot-pip ${(activeSlotsUsed?.[i]||0)>j?'used':''}`} aria-label={`${multiple&&perClassLegacySlots?active.name+' ':''}Level ${i} slot ${j+1}`} onClick={()=>patch(slotUsePatch({...activeSlotsUsed,[i]:(activeSlotsUsed?.[i]||0)===j+1?j:j+1}))}/>)}</span></div>)}</div>
    {pools.pact.some(Boolean)&&<section aria-label="Pact Magic slots"><h3>Pact Magic · short-rest recovery</h3><div className="slot-trackers">{pools.pact.map((n,i)=>n>0&&<div key={i}><strong>Level {i}</strong><span>{Array.from({length:n},(_,j)=><button key={j} className={`slot-pip ${(char.pactSlotsUsed?.[i]||0)>j?'used':''}`} aria-label={`Pact Magic level ${i} slot ${j+1}`} onClick={()=>patch({pactSlotsUsed:{...char.pactSlotsUsed,[i]:(char.pactSlotsUsed?.[i]||0)===j+1?j:j+1}})}/>)}</span></div>)}</div></section>}
    {manage&&<><SpellAccessGrants char={char} classId={active.catalogId} edition={active.edition} patch={patch} entries={[...homebrew,...reference.entries]}/>{maneuverMode?<><p>Choose maneuvers and stances from this class's catalog entries. Known/readied limits come directly from the class progression table.</p><SpellPicker label="Known maneuvers" spells={candidates.filter(s=>s.isManeuver&&!isStance(s))} selected={knownManeuvers.map(keyOf)} limit={maneuverKnown} onToggle={add}/><SpellPicker label="Known stances" spells={candidates.filter(isStance)} selected={knownStances.map(keyOf)} limit={stancesKnown??Infinity} onToggle={add}/></>:<><p>Choose spells to add or remove. {manual?'Only this class’s spells are listed. Record specific feature grants above when needed.':`Cantrip limit: ${counts.cantrips}. ${counts.mode==='known'?'Known':'Prepared'} limit: ${counts.mode==='known'?counts.known:counts.prepared||0}.`}</p>{manual?<SpellPicker label="Available class spells" spells={candidates} selected={selected} onToggle={add}/>:<><SpellPicker label="Class cantrips" spells={candidates.filter(s=>s.level===0)} selected={cantrips.map(keyOf)} limit={counts.cantrips} onToggle={add}/><SpellPicker label={counts.mode==='spellbook'?'Spellbook spells':counts.mode==='known'?'Known class spells':'Prepared class spells'} spells={candidates.filter(s=>s.level>0)} selected={leveled.map(keyOf)} limit={spellLimit} onToggle={add}/></>}</>}{reference.error&&<p role="alert">{reference.error}</p>}</>}
    <div className="spell-table">{classSpells.map(s=><div className="spell-item" key={s.id}><button className="spell-name" onClick={()=>show(resolveSpell(s,char))}><strong>{s.name}</strong><small>{s.level==null?'Set spell level':s.level===0?'Level 0':`Level ${s.level}`} · {editionName(s.edition)}{accessFor(s).alwaysPrepared?' · Always prepared':''}{s.referenceOnly?' · Source reference':''}</small></button>{s.sourceUrl&&<a href={s.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}{(s.referenceOnly||manual)&&!s.isManeuver&&<label className="l-field"><span>Spell level</span><select value={s.level??''} onChange={e=>patch({spells:char.spells.map(x=>x.id===s.id?{...x,level:Number(e.target.value)}:x)})}><option value="" disabled>Choose</option>{Array.from({length:10},(_,i)=><option key={i}>{i}</option>)}</select></label>}{maneuverMode&&s.isManeuver&&!isStance(s)&&<button className="l-button" disabled={!s.prepared&&maneuverReadied!=null&&readiedManeuvers.length>=maneuverReadied} onClick={()=>patch({spells:char.spells.map(x=>x.id===s.id?{...x,prepared:!x.prepared}:x)})}>{s.prepared?'Readied':'Ready'}</button>}{!manual&&!accessFor(s).alwaysPrepared&&s.level>0&&counts.mode==='spellbook'&&<button className="l-button" disabled={!s.prepared&&classSpells.filter(x=>x.prepared&&x.level>0&&!accessFor(x).alwaysPrepared).length>=counts.prepared} onClick={()=>patch({spells:char.spells.map(x=>x.id===s.id?{...x,prepared:!x.prepared}:x)})}>{s.prepared?'Prepared':'Prepare'}</button>}<button className="l-button" disabled={!accessFor(s).allowed||overLimit||s.level==null||!manual&&s.level>0&&counts.mode==='spellbook'&&!s.prepared&&!accessFor(s).alwaysPrepared} onClick={()=>open(s)}>{s.isManeuver?'Use':'Cast'}</button></div>)}</div>
    {cast&&<Dialog title={`${cast.isManeuver?'Use':'Cast'} ${cast.name}`} onClose={()=>setCast(null)}>{needsSlot&&<label className="l-field"><span>Spell slot</span><select aria-label="Spell slot" value={slotPool==='pact'?`pact:${slot}`:slot} onChange={e=>{const pact=e.target.value.startsWith('pact:');setSlotPool(pact?'pact':'standard');setSlot(Number(pact?e.target.value.slice(5):e.target.value));}}>{slotOptions(cast).map(o=><option key={`${o.pool||'standard'}:${o.level}`} value={o.pool==='pact'?`pact:${o.level}`:o.level}>{o.pool==='pact'?'Pact Magic · ':''}Level {o.level} · {o.remaining} left</option>)}</select></label>}{needsSlot&&!slotOptions(cast).length&&<p role="status">No spell slots remain for this spell. Rest to recover slots, or use ritual casting if available.</p>}<p>{plan.notes}</p><ul>{expressions.map((r,i)=><li key={i}>{r.label}: {r.expression}</li>)}</ul><label className="l-field"><span>Custom damage or healing roll (optional)</span><input value={formula} onChange={e=>setFormula(e.target.value)} placeholder="e.g. 5d6"/></label><label><input type="checkbox" checked={attack} onChange={e=>setAttack(e.target.checked)}/> Roll an attack</label>{castError&&<p role="alert">{castError}</p>}<div className="l-toolbar"><button className="l-button primary" disabled={needsSlot&&!slotOptions(cast).length} onClick={()=>castSpell()}>{cast.isManeuver?'Use':'Cast'}{needsSlot?' & spend slot':''}</button>{cast.ritual&&!is35(char)&&<button className="l-button" onClick={()=>castSpell(true)}>Cast as ritual (+10 minutes)</button>}<button className="l-button" onClick={()=>setCast(null)}>Cancel casting</button></div><p className="l-muted">Damage rolls are potential results. Resolve targets, saves, resistances and continuing effects at the table.</p></Dialog>}
  </>;
}
