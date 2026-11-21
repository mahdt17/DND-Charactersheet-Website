import React,{useCallback,useEffect,useRef,useState} from 'react';
import {watchRoster} from './lib/sharedCampaigns';

function useEncounter(api,campaignId){
  const [snapshot,setSnapshot]=useState(null),[revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(n=>n+1),[]);
  useEffect(()=>{
    if(!api||!campaignId)return;
    return watchRoster(api,campaignId,
      encounter=>setSnapshot({campaignId,encounter}),
      error=>setSnapshot({campaignId,error}),api.encounter);
  },[api,campaignId,revision]);
  return {...(campaignId&&snapshot?.campaignId===campaignId?snapshot:{}),refresh};
}

export function usePlayerCombat(api,characterId){
  const [membership,setMembership]=useState(null),[membershipError,setMembershipError]=useState('');
  const [notice,setNotice]=useState(null),[busy,setBusy]=useState(false),pending=useRef(null),inFlight=useRef(false);
  useEffect(()=>{
    if(!api)return;
    return watchRoster(api,'',campaignId=>{setMembership({characterId,campaignId});setMembershipError('');},
      message=>{setMembership(null);setMembershipError(message);},()=>api.membership(characterId));
  },[api,characterId]);
  const campaignId=membership?.characterId===characterId?membership.campaignId:'';
  const {encounter,error,refresh}=useEncounter(api,campaignId);
  const participant=encounter?.entries.find(row=>row.id===api.userId+':'+characterId);
  const submitted=participant?.initiative!=null||(encounter&&notice?.id===encounter.id&&notice.ok);
  async function initiative(roll){
    if(!encounter)return roll();
    if(submitted||inFlight.current)return;
    inFlight.current=true;setBusy(true);setNotice(null);
    try{
      if(pending.current?.id!==encounter.id){
        const result=roll();
        if(!result)return;
        pending.current={id:encounter.id,total:result.total};
      }
      await api.combat(campaignId,encounter.id,'roll',{character:characterId,initiative:pending.current.total});
      setNotice({id:encounter.id,ok:true});refresh();
    }catch(e){setNotice({id:encounter.id,error:e.message});refresh();}
    finally{inFlight.current=false;setBusy(false);}
  }
  return {encounter,submitted,busy,initiative,error:error||membershipError||(encounter&&notice?.id===encounter.id&&notice.error)};
}

function InitiativeOrder({encounter,onRemove}){
  const ordered=[...encounter.entries].sort((a,b)=>(b.initiative??-Infinity)-(a.initiative??-Infinity)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  return ordered.length?<ol className="combat-list" aria-label="Initiative order">
    {ordered.map(entry=><li key={entry.id}><div><strong>{entry.name}</strong> <small>{entry.kind}</small></div>
      <span>{entry.initiative??'Awaiting roll'}</span>
      {onRemove&&entry.kind!=='Player'&&<button className="l-button" aria-label={'Remove '+entry.name+' from combat'} onClick={()=>onRemove(entry.id)}>Remove</button>}
    </li>)}</ol>:<p>Waiting for combatants.</p>;
}

export function PlayerCombat({combat,onRoll}){
  if(!combat.encounter)return combat.error?<p role="alert">Live combat: {combat.error}</p>:null;
  return <section className="l-panel" aria-label="Live encounter"><h2>{combat.encounter.name}</h2>
    <button className="l-button primary" disabled={combat.busy||combat.submitted} onClick={onRoll}>
      {combat.submitted?'Initiative submitted':'Roll encounter initiative'}</button>
    {combat.error&&<p role="alert">{combat.error}</p>}
    <InitiativeOrder encounter={combat.encounter}/>
  </section>;
}

export function DMCombat({api,campaignId,roll}){
  const {encounter,error,refresh}=useEncounter(api,campaignId);
  const [title,setTitle]=useState(''),[name,setName]=useState(''),[kind,setKind]=useState('Enemy'),[score,setScore]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[modifier,setModifier]=useState('0'),lock=useRef(false);
  async function command(action,payload){
    if(lock.current)return;
    lock.current=true;setBusy(true);setMessage('');
    try{
      await api.combat(campaignId,encounter?.id||null,action,payload);refresh();
      if(action==='start')setTitle('');
      if(action==='add'){setName('');setScore('');setModifier('0');}
    }catch(e){setMessage(e.message);}finally{lock.current=false;setBusy(false);}
  }
  return <section className="campaign-combat" aria-label="DM live combat"><h3>Live combat</h3>
    {error?<p role="alert">{error} <button className="l-button" onClick={refresh}>Retry</button></p>:
      encounter===undefined?<p role="status">Loading encounter…</p>:!encounter?
      <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void command('start',{name:title.trim()});}}>
        <label className="l-field"><span>Encounter name</span><input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <button className="l-button primary" disabled={busy||!title.trim()}>Start live encounter</button>
      </form>:<>
        <div className="l-section-head"><h4>{encounter.name}</h4><button className="l-button" disabled={busy} onClick={()=>command('end',{})}>End encounter</button></div>
        <InitiativeOrder encounter={encounter} onRemove={id=>command('remove',{id})}/>
        <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void command('add',{id:crypto.randomUUID(),name:name.trim(),kind,initiative:Number(score)});}}>
          <label className="l-field"><span>Combatant name</span><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label className="l-field"><span>Side</span><select value={kind} onChange={e=>setKind(e.target.value)}><option>Enemy</option><option>NPC</option></select></label>
          <label className="l-field"><span>Initiative modifier</span><input type="number" min="-99" max="99" value={modifier} onChange={e=>setModifier(e.target.value)}/></label>
          <button type="button" className="l-button" disabled={busy||Math.abs(Number(modifier))>99||!Number.isInteger(Number(modifier))} onClick={()=>{
            const bonus=Number(modifier),result=roll(`1d20${bonus>=0?'+':''}${bonus}`,(name.trim()||kind)+' initiative',{inline:true,mode:'normal'});
            if(result)setScore(String(result.total));
          }}>Roll d20</button>
          <label className="l-field"><span>Initiative total</span><input type="number" required min="-999" max="999" value={score} onChange={e=>setScore(e.target.value)}/></label>
          <button disabled={busy} className="l-button">Add combatant</button>
        </form></>}
    {message&&<p role="alert">{message}</p>}
  </section>;
}
