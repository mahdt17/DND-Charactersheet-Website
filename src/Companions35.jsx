import React from 'react';
import {transitionCompanion35} from './lib/companions35';

const relationshipLabel=value=>({
  'animal-companion':'Animal Companion',
  familiar:'Familiar',
  'special-mount':'Special Mount',
  'class-companion':'Class Companion'
}[value]||'Companion');

const abilityLabels={str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'};
function masterBenefitText(benefit){
  if(!benefit)return '';
  if(benefit.type==='hp')return `Master gains ${benefit.bonus>0?'+':''}${benefit.bonus} hit points`;
  if(benefit.type==='save')return `Master gains ${benefit.bonus>0?'+':''}${benefit.bonus} ${String(benefit.save||'').toUpperCase()} save`;
  if(benefit.type==='skill')return `Master gains ${benefit.bonus>0?'+':''}${benefit.bonus} ${benefit.skill}${benefit.condition?` (${benefit.condition})`:''}`;
  return 'Source-defined familiar benefit';
}

export default function Companions35({char,patch}){
  const companions=Array.isArray(char.companions)?char.companions:[];
  const classNames=ids=>(ids||[]).map(id=>char.classLevels?.find(row=>row.catalogId===id)?.name).filter(Boolean);
  const updateCompanion=(companionId,values)=>{
    patch({companions:companions.map(companion=>companion.id===companionId?{...companion,...values}:companion)});
  };
  const transition=(companion,event)=>{
    const next=transitionCompanion35(char,companion.id,event);
    patch({companions:next.companions});
  };
  return <section aria-label="Companions">
    <h2>Companions</h2>
    <p className="l-muted">Familiars, animal companions, special mounts, and other class companions use their source-derived 3.5 progression here.</p>
    {!companions.length&&<div className="l-notice">No companion is currently recorded for this character.</div>}
    {companions.map(companion=>{
      const stats=companion.derivedStats||{};
      const abilities=stats.abilities||{};
      const sources=classNames(companion.sourceClassIds);
      const inactive=companion.status&&companion.status!=='active';
      const replacementBlocked=inactive&&companion.lifecycle?.available===false;
      const replacementReady=inactive&&companion.lifecycle?.available===true;
      return <details className="feature-detail" open key={companion.id}>
        <summary>{companion.name}<span>{relationshipLabel(companion.relationshipType)} · {companion.status||'active'}</span></summary>
        <p><strong>{relationshipLabel(companion.relationshipType)}</strong>{sources.length?' · '+sources.join(' + '):''}</p>
        <p>Effective master level {companion.effectiveMasterLevel??0} · Effective companion level {companion.effectiveCompanionLevel??0}</p>
        {companion.incomplete&&<p className="l-notice">{companion.incompleteReason||'This companion needs additional source data before all statistics can be derived.'}</p>}
        <div className="form-grid">
          <label className="l-field"><span>Current HP</span><input aria-label={`${companion.name} current HP`} type="number" min="0" max={Math.max(1,Number(companion.hp?.max)||1)} value={Number.isFinite(Number(companion.hp?.current))?Number(companion.hp.current):0} onChange={event=>updateCompanion(companion.id,{hp:{...companion.hp,current:Math.max(0,Math.min(Number(companion.hp?.max)||0,Number(event.target.value)||0))}})}/></label>
          <div className="l-field"><span>Maximum HP</span><strong>{companion.hp?.max??'—'}</strong></div>
          {stats.ac&&<div className="l-field"><span>Armor class</span><strong>Armor class {stats.ac.total}</strong></div>}
          {stats.speed&&<div className="l-field"><span>Speed</span><strong>{Object.entries(stats.speed).filter(([,value])=>value!=null).map(([mode,value])=>`${mode} ${value} ft.`).join(' · ')||'—'}</strong></div>}
        </div>
        {Object.keys(abilities).length>0&&<p className="l-muted">{Object.entries(abilityLabels).map(([key,label])=>`${label} ${abilities[key]??'—'}`).join(' · ')}</p>}
        {stats.attacks?.length>0&&<p><strong>Attacks:</strong> {stats.attacks.join(' · ')}</p>}
        <p><strong>Progression:</strong> {[
          companion.progression?.bonusHD!=null?`+${companion.progression.bonusHD} bonus HD`:null,
          companion.progression?.naturalArmorAdjustment!=null?`+${companion.progression.naturalArmorAdjustment} natural armor`:null,
          companion.progression?.strDexAdjustment!=null?`+${companion.progression.strDexAdjustment} Str/Dex`:null,
          companion.progression?.strengthAdjustment!=null?`+${companion.progression.strengthAdjustment} Strength`:null,
          companion.progression?.strDexIntAdjustment!=null?`+${companion.progression.strDexIntAdjustment} Str/Dex/Int`:null,
          companion.progression?.intelligence!=null?`Intelligence ${companion.progression.intelligence}`:null,
          companion.progression?.bonusTricks!=null?`${companion.progression.bonusTricks} bonus trick${companion.progression.bonusTricks===1?'':'s'}`:null
        ].filter(Boolean).join(' · ')||'Source-defined progression'}</p>
        {companion.specialAbilities?.length>0&&<p><strong>Special abilities:</strong> {companion.specialAbilities.join(', ')}</p>}
        {companion.masterBenefits?.length>0&&<><p><strong>Master benefit:</strong> {companion.masterBenefits.map(masterBenefitText).join(' · ')}</p><label className="l-check"><input type="checkbox" checked={companion.masterBenefitActive!==false} onChange={event=>updateCompanion(companion.id,{masterBenefitActive:event.target.checked})}/> Familiar is within 1 mile of the master</label></>}
        {companion.familiarLanguageChoice&&<label className="l-field"><span>Raven spoken language</span><input aria-label={`${companion.name} familiar language`} value={companion.familiarLanguage||''} onChange={event=>updateCompanion(companion.id,{familiarLanguage:event.target.value})} placeholder="Choose one language the master knows"/></label>}
        {companion.lifecycle?.restrictionText&&inactive&&<p className="l-notice">{companion.lifecycle.restrictionText}{replacementBlocked?' Replacement is currently marked unavailable.':''}{companion.lifecycle?.consequenceText?` ${companion.lifecycle.consequenceText}`:''}</p>}
        {!inactive&&['special-mount','class-companion'].includes(companion.relationshipType)&&companion.lifecycle?.called!=null&&<p className="l-muted">Calling state: <strong>{companion.lifecycle.called?'present':'in the celestial realms'}</strong></p>}
        <label className="l-field"><span>Companion notes</span><textarea aria-label={`${companion.name} companion notes`} rows={3} value={companion.notes||''} onChange={event=>updateCompanion(companion.id,{notes:event.target.value})}/></label>
        <div className="l-toolbar">
          {!inactive&&<button type="button" className="l-button danger" aria-label={`Mark ${companion.name} dead`} onClick={()=>transition(companion,'mark-dead')}>Mark dead</button>}
          {!inactive&&companion.relationshipType==='animal-companion'&&<button type="button" className="l-button" aria-label={`Release ${companion.name}`} onClick={()=>transition(companion,'release')}>Release</button>}
          {!inactive&&companion.relationshipType==='familiar'&&<button type="button" className="l-button" aria-label={`Dismiss ${companion.name}`} onClick={()=>transition(companion,'dismiss')}>Dismiss</button>}
          {!inactive&&['special-mount','class-companion'].includes(companion.relationshipType)&&companion.lifecycle?.called===false&&<button type="button" className="l-button" aria-label={`Call ${companion.name}`} onClick={()=>transition(companion,'call')}>Call companion</button>}
          {!inactive&&['special-mount','class-companion'].includes(companion.relationshipType)&&companion.lifecycle?.called===true&&<button type="button" className="l-button" aria-label={`Return ${companion.name}`} onClick={()=>transition(companion,'uncall')}>Return companion</button>}
          {replacementBlocked&&<button type="button" className="l-button" aria-label={`Confirm ${companion.name} replacement available`} onClick={()=>transition(companion,'confirm-replacement-available')}>Confirm replacement available</button>}
          {replacementReady&&<button type="button" className="l-button" aria-label={`Restore ${companion.name}`} onClick={()=>transition(companion,'restore')}>Restore</button>}
        </div>
        {companion.sourceUrl&&<p><a href={companion.sourceUrl} target="_blank" rel="noreferrer">Read creature source</a></p>}
      </details>;
    })}
  </section>;
}
