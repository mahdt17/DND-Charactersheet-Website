import React,{useEffect,useRef,useState} from 'react';
import {characterClasses} from './lib/advancement';
import {effectiveAbilityScores} from './lib/abilityScores';
import {armorFor,weaponAttacks} from './lib/rules';
import {spellSlotPools} from './lib/editions';
import {invitePattern,watchRoster} from './lib/sharedCampaigns';

const memberKey=m=>JSON.stringify([m.user_id,m.character_id]);
const pretty=key=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,s=>s.toUpperCase());
function Detail({label,value}) {
  const [open,setOpen]=useState(false);
  if(value==null||value==='')return null;
  if(typeof value!=='object')return <p><strong>{label}</strong> · {typeof value==='boolean'?(value?'Yes':'No'):String(value)}</p>;
  const fields=Object.entries(value);
  if(!fields.length)return null;
  return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary>{label}{Array.isArray(value)?' ('+fields.length+')':''}</summary>
    {open&&<div className="party-detail">{fields.map(([key,v])=><Detail key={key} label={Array.isArray(value)?v?.name||'Entry '+(Number(key)+1):pretty(key)} value={v}/>)}</div>}</details>;
}

function ReadOnlySheet({char}) {
  const abilities=effectiveAbilityScores(char),slots=spellSlotPools(char),attacks=weaponAttacks(char,abilities);
  return <article className="l-panel" aria-label="Live character sheet">
    <div className="l-section-head"><h2>{char.name}</h2><span>Read-only sheet</span></div>
    <p>{[char.race,char.background,characterClasses(char).map(c=>[c.name,c.level,c.subclass].filter(Boolean).join(' ')).join(' / ')].filter(Boolean).join(' · ')}</p>
    <p><strong>HP {char.hp?.current??0} / {char.hp?.max??0}</strong>{char.hp?.temp>0&&' + '+char.hp.temp+' temporary'} · AC {char.autoArmor?armorFor(char,abilities):char.ac??'—'}</p>
    <div className="review-grid">{Object.entries(abilities).map(([key,value])=><div className="review-stat" key={key}><span>{key.toUpperCase()}</span><strong>{value}</strong></div>)}</div>
    {slots.standard.some(Boolean)&&<p>Spell slots remaining · {slots.standard.flatMap((max,level)=>max?['L'+level+' '+Math.max(0,max-(char.slotsUsed?.[level]||0))+'/'+max]:[]).join(' · ')}</p>}
    {attacks.length>0&&<div><h3>Weapon attacks</h3>{attacks.map((a,i)=><p key={a.id||i}>{a.name} · {a.attack>=0?'+':''}{a.attack} to hit · {a.damage} {a.damageType}</p>)}</div>}
    {['actions','resources','spells','inventory','feats','grantedFeatures','traits','affiliations','companions','notes'].map(key=><Detail key={key} label={pretty(key)} value={char[key]}/>)}
    <Detail label="All saved sheet fields" value={char}/>
  </article>;
}

function PartyRoster({campaign,api}) {
  const [rows,setRows]=useState(null),[selected,setSelected]=useState(''),[detail,setDetail]=useState(null);
  const [error,setError]=useState(''),[sheetError,setSheetError]=useState(''),[retry,setRetry]=useState(0);
  const [copied,setCopied]=useState(false);
  useEffect(()=>watchRoster(api,campaign.id,list=>{
    setError('');setRows(list.slice().sort((a,b)=>a.sheet.name.localeCompare(b.sheet.name)));
    setSelected(old=>list.some(m=>memberKey(m)===old)?old:'');
  },message=>{setRows(null);setDetail(null);setError(message);}),[api,campaign.id,retry]);
  const member=rows?.find(m=>memberKey(m)===selected);
  const stamp=member?.sheet.updated_at;
  useEffect(()=>{
    let active=true;setSheetError('');
    if(!member){setDetail(null);return;}
    api.sheet(campaign.id,member).then(record=>{
      if(active)setDetail(record?{key:selected,...record}:null);
    }).catch(e=>{if(active){setDetail(null);setSheetError(e.message);}});
    return ()=>{active=false;};
  },[api,campaign.id,selected,stamp,retry]);
  return <section aria-label="DM campaign roster" className="l-panel"><h2>{campaign.name}</h2>
    <label className="l-field"><span>Campaign invite code</span><input value={campaign.id} readOnly onFocus={e=>e.target.select()}/></label>
    <button className="l-button" onClick={async()=>{try{await navigator.clipboard.writeText(campaign.id);setCopied(true);}catch{setCopied(false);}}}>{copied?'Code copied':'Copy invite code'}</button>
    <h3>Live party roster</h3>
    {error?<p role="alert">Could not load the party. {error} <button className="l-button" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>:
      !rows?<p role="status">Loading party…</p>:!rows.length?<p>Give players the invite code. Their characters appear here when they share a sheet.</p>:
      <div>{rows.map(m=><button key={memberKey(m)} className="l-button" aria-pressed={selected===memberKey(m)} onClick={()=>setSelected(memberKey(m))}>{m.sheet.name} · Level {m.sheet.level} {m.sheet.class_name}</button>)}</div>}
    {member&&<><p>Last saved {new Date(stamp).toLocaleString()}</p>
      {sheetError?<p role="alert">{sheetError} <button className="l-button" onClick={()=>setRetry(n=>n+1)}>Retry sheet</button></p>:
        detail?.key===selected&&detail.updated_at===stamp?<ReadOnlySheet char={detail.data}/>:<p role="status">Updating sheet…</p>}</>}
  </section>;
}

export default function SharedCampaigns({api,characters,initialCharacterId}) {
  const [list,setList]=useState({hosted:[],assigned:[]}),[host,setHost]=useState(''),[name,setName]=useState(''),[code,setCode]=useState('');
  const [characterId,setCharacterId]=useState(initialCharacterId||''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [creating,setCreating]=useState(false),[loaded,setLoaded]=useState(false),sequence=useRef(0);
  const campaign=list.hosted.find(c=>c.id===host);
  async function refresh(){
    const id=++sequence.current;
    try{const next=await api.list();if(id===sequence.current){setList(next);setLoaded(true);setError('');}}
    catch(e){if(id===sequence.current)setError(e.message);}
  }
  useEffect(()=>{void refresh();window.addEventListener('focus',refresh);return ()=>{sequence.current++;window.removeEventListener('focus',refresh);};},[api]);
  async function perform(action){
    if(busy)return;setBusy(true);setError('');setNotice('');
    try{await action();await refresh();}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  const assignment=list.assigned.find(a=>a.character_id===characterId);
  return <section className="party-sharing" aria-label="Shared campaigns">
    <section className="l-panel"><div className="l-section-head"><h2>DM campaigns</h2><button className="l-button primary" onClick={()=>setCreating(!creating)}>{creating?'Cancel':'Start a DM campaign'}</button></div>
      {creating&&<form onSubmit={e=>{e.preventDefault();void perform(async()=>{const c=await api.start(name);setHost(c.id);setName('');setCreating(false);});}}>
        <label className="l-field"><span>DM campaign name</span><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><button className="l-button" disabled={busy||!name.trim()}>Create shared campaign</button></form>}
      {list.hosted.length>0&&<label className="l-field"><span>Campaign to view as DM</span><select value={host} onChange={e=>setHost(e.target.value)}><option value="">Choose a campaign</option>{list.hosted.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
    </section>
    {campaign&&<PartyRoster key={campaign.id} campaign={campaign} api={api}/>}
    <section className="l-panel"><h2>Share a character with your DM</h2>
      {!characters.length?<p>Create a character in Characters, then choose it here.</p>:<>
        <label className="l-field"><span>Character to share</span><select value={characterId} onChange={e=>{setCharacterId(e.target.value);setNotice('');}}><option value="">Choose your character</option>{characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        {characterId&&(assignment?<><p>Sharing with the DM of <strong>{assignment.campaign?.name||'your campaign'}</strong>.</p>
          <button className="l-button" disabled={busy} onClick={()=>perform(async()=>{await api.leave(assignment.campaign_id,api.userId,characterId);setNotice('Sheet sharing stopped.');})}>Stop sharing sheet</button></>:
          <form onSubmit={e=>{e.preventDefault();void perform(async()=>{await api.assign(code,characterId);setCode('');setNotice('Sheet shared with your DM.');});}}>
            <label className="l-field"><span>Invite code from your DM</span><input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/></label>
            <p>Your DM can read this entire sheet, including notes, and see future saves. You control edits and can stop sharing here.</p>
            <button className="l-button" disabled={busy||!loaded||!invitePattern.test(code.trim())}>Join and share sheet</button></form>)}</>}
    </section>{error&&<p role="alert">{error} <button className="l-button" onClick={refresh}>Refresh campaigns</button></p>}{notice&&<p role="status">{notice}</p>}
  </section>;
}

