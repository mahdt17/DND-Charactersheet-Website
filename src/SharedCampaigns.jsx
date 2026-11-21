import React,{useEffect,useRef,useState} from 'react';
import {Plus,LogIn,Trash2} from 'lucide-react';
import './sharedCampaigns.css';
import CampaignRewards from './CampaignRewards';
import {DMCombat} from './LiveCombat';
import {invitePattern,watchRoster} from './lib/sharedCampaigns';

const memberKey=m=>JSON.stringify([m.user_id,m.character_id]);
export function LiveCampaignSheet({campaign,member,api,back,renderSheet}){
  const [record,setRecord]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true,version=0,lastStamp;
    const stop=watchRoster(api,campaign.id,async rows=>{
      const current=rows.find(row=>memberKey(row)===memberKey(member));
      if(!current){version++;setRecord(null);back();return;}
      if(lastStamp===current.sheet.updated_at)return;
      lastStamp=current.sheet.updated_at;
      const request=++version;
      try{
        const next=await api.sheet(campaign.id,current);
        if(!active||request!==version)return;
        if(!next){setRecord(null);back();return;}
        setRecord(next);setError('');
      }catch(e){if(active&&request===version){lastStamp=undefined;setRecord(null);setError(e.message);}}
    },message=>{version++;lastStamp=undefined;setRecord(null);setError(message);});
    return ()=>{active=false;stop();};
  },[api,campaign.id,member,back,retry]);
  if(record)return <><CampaignRewards char={record.data} change={async(field,adding,entry,amount)=>{
    try{
      if(!adding&&field==='inventory')await api.editSheet(campaign.id,member,'remove_quantity',{item:entry,amount});
      else await api.reward(campaign.id,member,field,adding,entry);
    }finally{setRetry(n=>n+1);}
  }}/>{renderSheet(record.data,async(before,after)=>{
    try{await api.editSheet(campaign.id,member,'notes',{before,after});}
    finally{setRetry(n=>n+1);}
  })}</>;
  return <><button className="l-button" onClick={back}>Back to party roster</button>{error?<p role="alert">{error} <button className="l-button" onClick={()=>setRetry(n=>n+1)}>Retry sheet</button></p>:<p role="status">Loading character sheet.</p>}</>;
}

function PartyRoster({campaign,api,onDelete,onOpen,roll,characters,sheetInitiative}){
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [copied,setCopied]=useState(false),[removing,setRemoving]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  async function removeMember(m){
    setBusy(true);setNotice('');
    try{
      await api.leave(campaign.id,m.user_id,m.character_id);
      setRows(list=>list?.filter(row=>memberKey(row)!==memberKey(m)));
      setRemoving('');setNotice(m.sheet.name+' was removed from the campaign.');
    }catch(e){setNotice(e.message);}
    finally{setBusy(false);setRetry(n=>n+1);}
  }
  useEffect(()=>watchRoster(api,campaign.id,list=>{
    setError('');setRows(list.slice().sort((a,b)=>a.sheet.name.localeCompare(b.sheet.name)));
  },message=>{setRows(null);setError(message);}),[api,campaign.id,retry]);
  return <section aria-label="DM campaign roster" className="l-panel">
    <div className="l-section-head"><h2>{campaign.name}</h2><button className="l-button party-danger" onClick={onDelete}><Trash2 size={16}/>Delete campaign</button></div>
    <label className="l-field"><span>Campaign invite code</span><input value={campaign.id} readOnly onFocus={e=>e.target.select()}/></label>
    <button className="l-button" onClick={async()=>{try{await navigator.clipboard.writeText(campaign.id);setCopied(true);}catch{setCopied(false);}}}>{copied?'Code copied':'Copy invite code'}</button>
    <DMCombat characters={characters} sheetInitiative={sheetInitiative} roll={roll} api={api} campaignId={campaign.id}/>
    <h3>Live party roster</h3>
    {error?<p role="alert">{error} <button className="l-button" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>:
      !rows?<p role="status">Loading party.</p>:!rows.length?<p>Give players the invite code. Their characters appear here when they share a sheet.</p>:
      <div>{rows.map(m=><div className="party-membership" key={memberKey(m)}><button className="l-button" onClick={()=>onOpen({campaign,member:m})}>{m.sheet.name} · Level {m.sheet.level} {m.sheet.class_name}</button>
        {removing===memberKey(m)?<div className="l-toolbar"><span>End sharing for {m.sheet.name}? The player keeps their sheet.</span><button className="l-button" disabled={busy} onClick={()=>setRemoving('')}>Cancel</button><button className="l-button party-danger" disabled={busy} onClick={()=>removeMember(m)}>Confirm removal</button></div>:<button className="l-button party-danger" disabled={busy} aria-label={'Remove '+m.sheet.name+' from campaign'} onClick={()=>{setRemoving(memberKey(m));setNotice('');}}>Remove from campaign</button>}</div>)}</div>}
    {notice&&<p role="status">{notice}</p>}
  </section>;
}

export default function SharedCampaigns({api,characters,sheetInitiative,initialCharacterId,initialHost,onOpen,openCharacter,roll}) {
  const [list,setList]=useState({hosted:[],assigned:[]}),[host,setHost]=useState(initialHost||'');
  const [mode,setMode]=useState(initialCharacterId?'join':''),[name,setName]=useState(''),[code,setCode]=useState('');
  const [characterId,setCharacterId]=useState(initialCharacterId||characters[0]?.id||'');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [loaded,setLoaded]=useState(false),sequence=useRef(0),pending=useRef(false);
  const campaign=list.hosted.find(c=>c.id===host),assignment=list.assigned.find(a=>a.character_id===characterId);
  async function refresh(){
    const id=++sequence.current;
    try{const next=await api.list();if(id===sequence.current){setList(next);setLoaded(true);setError('');}}
    catch(e){if(id===sequence.current)setError(e.message);}
  }
  useEffect(()=>{
    void refresh();
    const sync=()=>{if(!document.hidden&&!pending.current)void refresh();};
    const timer=setInterval(sync,10000);
    window.addEventListener('focus',sync);
    return ()=>{sequence.current++;clearInterval(timer);window.removeEventListener('focus',sync);};
  },[api]);
  async function perform(action){
    if(pending.current)return;
    pending.current=true;setBusy(true);setError('');setNotice('');
    try{await action();await refresh();}catch(e){setError(e.message);}
    finally{pending.current=false;setBusy(false);}
  }
  function open(next){setMode(next);setNotice('');setError('');}
  function stop(member){void perform(async()=>{
    await api.leave(member.campaign_id,api.userId,member.character_id);
    setNotice('Sheet sharing stopped.');
  });}
  return <section className="party-sharing" aria-label="Shared campaigns">
    <div className="party-hub-actions"><button className="l-button primary" disabled={busy} onClick={()=>open('create')}><Plus size={17}/>Create campaign</button>
      <button className="l-button" disabled={busy} onClick={()=>open('join')}><LogIn size={17}/>Join campaign</button></div>
    {mode==='create'&&<form className="l-panel party-form" onSubmit={e=>{e.preventDefault();void perform(async()=>{
      const c=await api.start(name);setHost(c.id);setMode('');setName('');setNotice('Campaign created.');
    });}}><h2>Create campaign</h2><label className="l-field"><span>Campaign name</span><input autoFocus required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
      <div className="party-hub-actions"><button className="l-button primary" disabled={busy||!name.trim()}>Create as DM</button><button type="button" className="l-button" disabled={busy} onClick={()=>open('')}>Cancel</button></div></form>}
    {mode==='join'&&<section className="l-panel party-form"><h2>Join campaign</h2>
      {characters.length?<><label className="l-field"><span>Character to share</span><select value={characterId} onChange={e=>setCharacterId(e.target.value)}><option value="">Choose a character</option>{characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {assignment?<><p>This character is shared with <strong>{assignment.campaign?.name||'your campaign'}</strong>.</p><button className="l-button" disabled={busy} onClick={()=>stop(assignment)}>Stop sharing sheet</button></>:
        <form onSubmit={e=>{e.preventDefault();void perform(async()=>{await api.assign(code,characterId);setCode('');setMode('');setNotice('Sheet shared with your DM.');});}}>
          <label className="l-field"><span>Invite code from your DM</span><input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/></label>
          <p>Your DM can view this sheet, edit its journal, manage items and feats, and include the character in live encounters.</p><button className="l-button primary" disabled={busy||!loaded||!characterId||!invitePattern.test(code.trim())}>Join and share sheet</button></form>}</>:<p>Create a character in Characters to join a campaign.</p>}
      <button type="button" className="l-button" disabled={busy} onClick={()=>open('')}>Close</button></section>}
    {error&&<p role="alert">{error} <button className="l-button" onClick={refresh}>Refresh campaigns</button></p>}{notice&&<p role="status">{notice}</p>}
    <div className="party-directory"><section className="l-panel"><h2>Campaigns you DM</h2>
      {list.hosted.length?<div className="party-campaign-list">{list.hosted.map(c=><button className="l-button" aria-pressed={host===c.id} key={c.id} onClick={()=>{setHost(c.id);open('');}}>{c.name}</button>)}</div>:<p className="l-muted">{loaded?'Your campaigns appear here after you create one.':'Loading campaigns…'}</p>}</section>
      <section className="l-panel"><h2>Campaigns you joined</h2>
        {list.assigned.length?list.assigned.map(a=><div key={a.character_id} className="party-membership"><div><strong>{a.campaign?.name||'Campaign'}</strong><small>{characters.find(c=>c.id===a.character_id)?.name||'Shared character'}</small></div>
          <button className="l-button" onClick={()=>openCharacter(a.character_id)}>Open sheet for live combat</button>
          <button className="l-button" disabled={busy} onClick={()=>stop(a)} aria-label={'Leave campaign with '+(characters.find(c=>c.id===a.character_id)?.name||'character')}>Leave campaign</button></div>):<p className="l-muted">{loaded?'Use your DM’s invite code to share a character.':'Loading memberships…'}</p>}</section></div>
    {campaign&&mode==='delete'&&<section className="l-panel party-form" role="group" aria-label="Confirm campaign deletion"><h2>Delete {campaign.name}?</h2>
      <p>This ends sharing for everyone in this campaign. Each player keeps their character sheet.</p>
      <div className="party-hub-actions"><button className="l-button party-danger" disabled={busy} onClick={()=>perform(async()=>{await api.removeCampaign(campaign.id);setHost('');setMode('');setNotice('Campaign deleted.');})}>Confirm deletion</button>
      <button className="l-button" autoFocus disabled={busy} onClick={()=>open('')}>Cancel</button></div></section>}
    {campaign&&<PartyRoster characters={characters} sheetInitiative={sheetInitiative} roll={roll} key={campaign.id} campaign={campaign} api={api} onOpen={onOpen} onDelete={()=>open('delete')}/>}
  </section>;
}
