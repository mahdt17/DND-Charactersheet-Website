import React,{useId,useState} from 'react';
import {Heart,Shield,Sword,LockKeyhole} from 'lucide-react';
import {characterClasses} from './lib/advancement';
import {effectiveAbilityScores} from './lib/abilityScores';
import {classFeatures,editionName,is35,spellSlotPools} from './lib/editions';
import {grantedClassFeatures,modifier,sheetArmorFor,signed,spellLevel,weaponAttacks} from './lib/rules';
import {featMagicSpells} from './lib/featMagic';
import {conditionEffects,conditionNames} from './lib/play';
import {ownFormArmor,ownFormProfile,ownFormWalkingSpeed} from './lib/subclassOwnForm';
import {supportsInstitute} from './lib/instituteAccess';
import {trainingStatus} from './lib/esotericTraining';
import './sharedCampaigns.css';

const sections=['Actions','Profile','Spells','Inventory','Features','Feats','Traits','Affiliations','Companions','Notes'];
const abilityNames={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
function words(value){
  if(Array.isArray(value))return value.map(words).filter(Boolean).join('\n');
  if(value && typeof value==='object')return words(value.name||value.text||value.description);
  return value==null?'':String(value);
}
const line=(...parts)=>parts.map(words).filter(Boolean).join(' · ');
function description(row){return words(row.description||row.desc||row.effectSummary||row.effect||row.notes);}
function Entries({rows=[],empty,render}){
  if(!rows.length)return <p className="l-muted">{empty}</p>;
  return <ul className="party-entries">{rows.map((value,i)=>{
    const row=typeof value==='string'?{name:value}:value;
    if(!row)return null;
    const {meta,body}=render(row);
    return <li key={row.id||row.index||i}><strong>{row.name||row.title||row.featureName}</strong>{meta&&<small>{meta}</small>}{body&&<p>{body}</p>}</li>;
  })}</ul>;
}
function Attacks({char,abilities,form}){
  const equipment=form?(char.inventory||[]).filter(i=>form.wornItemIds?.includes(i.id)):char.inventory;
  const weapons=is35(char)?[]:weaponAttacks({...char,inventory:equipment||[]},abilities);
  return <><h3>Weapon attacks</h3>{weapons.length?<table className="party-table"><thead><tr><th>Weapon</th><th>To hit</th><th>Damage</th></tr></thead><tbody>{weapons.map(w=><tr key={w.id}><th scope="row">{w.name}</th><td>{signed(w.attack)}</td><td>{line(w.damage,w.damageType)}</td></tr>)}</tbody></table>:<p className="l-muted">No weapon attacks listed.</p>}
    <h3>Actions</h3><Entries rows={char.actions} empty="No actions recorded." render={r=>({meta:line(r.actionType||r.type,r.damage,r.damageType),body:description(r)})}/>
    {!!char.resources?.length&&<><h3>Resources</h3><Entries rows={char.resources} render={r=>({meta:line(r.max!=null?Math.max(0,r.max-(r.used||0))+' / '+r.max+' remaining':'',r.recharge||r.reset),body:description(r)})}/></>}</>;
}
function Spellbook({char}){
  const pools=spellSlotPools(char);
  const groups=new Map();
  for(const spell of [...(char.spells||[]),...featMagicSpells(char)]){
    const level=spellLevel(spell);
    if(!groups.has(level))groups.set(level,[]);
    groups.get(level).push(spell);
  }
  return <>{[['Spell slots',pools.standard,char.slotsUsed],['Pact slots',pools.pact,char.pactSlotsUsed],['Restricted slots',pools.restricted,null]].map(([label,slots,used])=>
    slots?.some(Boolean)&&<section key={label}><h3>{label}</h3><div className="party-slots">{slots.map((n,i)=>n>0&&<span key={i}>Level {i} <strong>{label==='Restricted slots'?n+' total':Math.max(0,n-(used?.[i]||0))+'/'+n}</strong></span>)}</div></section>)}
    {!groups.size&&<p className="l-muted">No spells recorded.</p>}
    {[...groups.keys()].sort((a,b)=>a-b).map(level=><section key={level}><h3>{level?'Level '+level+' spells':'Cantrips'}</h3><Entries rows={groups.get(level)} render={s=>({meta:line(s.school,s.prepared?'Prepared':'',s.casting_time||s.castingTime,s.range,s.duration,s.featSource),body:description(s)})}/></section>)}</>;
}
function SheetContent({section,char,abilities,form}){
  const standard=r=>({meta:line(r.sourceClassName||r.source,r.sourceClassLevel||r.level?'Level '+(r.sourceClassLevel||r.level):''),body:description(r)});
  switch(section){
    case 'Profile':{
      const list=values=>Object.entries(values||{}).filter(([,v])=>v).map(([key])=>abilityNames[key]||key).join(', ');
      const fields=[['Background',char.background],['Languages',words(char.languages)],['Saving throw proficiencies',list(char.saveProf)],['Skill proficiencies',list(char.skillProf)],['Alignment',char.alignment],['Experience',char.xp]];
      return <><h3>Character profile</h3><dl className="party-profile">{fields.filter(([,v])=>v!=null&&v!=='').map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></>;
    }
    case 'Actions':return <Attacks char={char} abilities={abilities} form={form}/>;
    case 'Spells':return <Spellbook char={char}/>;
    case 'Inventory':return <><h3>Inventory</h3>{char.currency&&<p>{Object.entries(char.currency).filter(([,n])=>Number(n)>0).map(([coin,n])=>n+' '+coin.toUpperCase()).join(' · ')}</p>}<Entries rows={char.inventory} empty="No inventory recorded." render={r=>({meta:line('Quantity '+(r.qty??1),r.equipped?'Equipped':'',r.attuned?'Attuned':''),body:description(r)})}/></>;
    case 'Features':return <><h3>Class features</h3><Entries rows={char.grantedFeatures?.length?char.grantedFeatures:classFeatures(char)||grantedClassFeatures(char)} empty="No features recorded." render={standard}/></>;
    case 'Feats':case 'Traits':return <><h3>{section}</h3><Entries rows={char[section.toLowerCase()]} empty={'No '+section.toLowerCase()+' recorded.'} render={standard}/></>;
    case 'Affiliations':return <><h3>Affiliations</h3><Entries rows={char.affiliations} empty="No affiliations recorded." render={r=>{
      const institute=r.training&&supportsInstitute(char)?trainingStatus(char):null;
      return {meta:line(r.type,r.rank,institute?.rank?.name,institute?institute.fame+' Fame':''),body:[r.contact&&'Contact · '+r.contact,r.notes,institute?.training.ascensionQuest].filter(Boolean).join('\n')};
    }}/></>;
    case 'Companions':return <><h3>Companions</h3><Entries rows={char.companions} empty="No companions recorded." render={r=>({meta:line(r.relationshipType,r.species,r.hp&&r.hp.current+' / '+r.hp.max+' HP'),body:description(r)})}/></>;
    case 'Notes':return <><h3>Notes</h3><p className="preserve-lines">{char.notes||'No notes recorded.'}</p></>;
  }
}

export default function SharedCharacterSheet({char}){
  const [section,setSection]=useState('Actions'),prefix=useId();
  const form=ownFormProfile(char),abilities={...effectiveAbilityScores(char),...form?.abilities},effects=conditionEffects(char);
  const hp=form?.hp||char.hp||{},max=form?hp.max:effects.maxHP;
  const classLine=characterClasses(char).map(r=>line(r.name+' '+r.level,r.subclass)).join(' / ');
  const tabs=sections.filter(s=>s!=='Companions'||is35(char)||char.companions?.length);
  const active=tabs.includes(section)?section:'Actions';
  function navigate(event,index){
    const direction={ArrowRight:1,ArrowLeft:-1}[event.key];
    if(!direction&&!['Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+direction+tabs.length)%tabs.length;
    setSection(tabs[next]);event.currentTarget.parentElement.children[next].focus();
  }
  return <article className="party-character" aria-label="Live character sheet">
    <header className="sheet-heading"><div className="ledger-avatar large"><Sword aria-hidden="true"/></div><div className="sheet-identity"><span className="l-eyebrow">{line('Level '+char.level,char.race,char.background)}</span><h2>{char.name}</h2><p>{classLine} <span className="l-tag">{editionName(char.ruleset||'2014')}</span></p></div><span className="party-lock"><LockKeyhole size={14}/> Read-only sheet</span></header>
    <div className="party-vitals"><div className="hp-panel"><span className="l-eyebrow"><Heart size={15}/> Hit points</span><div className="hp-value">{hp.current??0}<span>/ {max}</span>{char.hp?.temp>0&&<small>+{char.hp.temp} temporary</small>}</div><div className="hp-meter"><span style={{width:Math.max(0,Math.min(100,(hp.current||0)/Math.max(1,max)*100))+'%'}}/></div></div>
      <div className="vital-tile"><Shield size={19}/><strong>{form?ownFormArmor(char):sheetArmorFor(char,abilities)}</strong><span>Armor class</span></div>
      <div className="vital-tile"><strong>{form?ownFormWalkingSpeed(char):effects.speed}<small> ft.</small></strong><span>Walking speed</span></div>
      <div className="vital-tile"><strong>{signed(is35(char)?Number(char.bab)||0:2+Math.floor((char.level-1)/4))}</strong><span>{is35(char)?'Base attack':'Proficiency'}</span></div></div>
    <div className="party-abilities">{Object.entries(abilityNames).map(([key,label])=><div key={key}><span>{label}</span><strong>{signed(modifier(abilities[key]))}</strong><small>{abilities[key]}</small></div>)}</div>
    {conditionNames(char).length>0&&<p><strong>Conditions</strong> · {conditionNames(char).join(', ')}</p>}
    <div className="sheet-tabs" role="tablist" aria-label="Shared sheet sections">{tabs.map((name,i)=><button key={name} id={prefix+name} aria-controls={prefix+'panel'} role="tab" aria-selected={active===name} tabIndex={active===name?0:-1} onKeyDown={e=>navigate(e,i)} onClick={()=>setSection(name)}>{name}</button>)}</div>
    <div className="sheet-tab-content" role="tabpanel" id={prefix+'panel'} aria-labelledby={prefix+active}><SheetContent section={active} char={char} abilities={abilities} form={form}/></div>
  </article>;
}
