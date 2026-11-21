import React,{useCallback,useEffect,useRef,useState} from 'react';
import EncounterLogs from './EncounterLogs';
import EncounterPicker from './EncounterPicker';
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
  const submitted=encounter?.submittedCharacterIds?.includes(characterId)||participant?.initiative!=null||(encounter&&notice?.id===encounter.id&&notice.ok);
  async function initiative(roll){
    if(!encounter)return roll();
    if(submitted||inFlight.current)return;
    inFlight.current=true;setBusy(true);setNotice(null);
    try{
      if(pending.current?.id!==encounter.id){
        const result=roll();
        if(!result)return;
        const final=await result.settled||result;
        pending.current={id:encounter.id,total:final.total};
      }
      await api.combat(campaignId,encounter.id,'roll',{character:characterId,initiative:pending.current.total});
      setNotice({id:encounter.id,ok:true});refresh();
    }catch(e){setNotice({id:encounter.id,error:e.message});refresh();}
    finally{inFlight.current=false;setBusy(false);}
  }
  const turnSerial=encounter?.turn?.serial;
  useEffect(()=>{if(turnSerial!=null)window.dispatchEvent(new Event('ledger-turn-advanced'));},[turnSerial,encounter?.id]);
  return {encounter,submitted,busy,initiative,error:error||membershipError||(encounter&&notice?.id===encounter.id&&notice.error)};
}

function InitiativeOrder({encounter,onRemove,onVisibility,busy}){
  const ordered=[...encounter.entries].sort((a,b)=>(b.initiative??-Infinity)-(a.initiative??-Infinity)||(a.id<b.id?-1:a.id>b.id?1:0));
  return ordered.length?<ol className="combat-list" aria-label="Initiative order">
    {ordered.map(entry=><li key={entry.id}><div><strong>{entry.name}</strong> <small>{entry.kind}{onVisibility&&!entry.visible?' · Hidden':''}</small></div>
      <span>{entry.initiative??'Awaiting roll'}</span>
      {onVisibility&&<button className="l-button" disabled={busy} aria-label={(entry.visible?'Hide '+entry.name+' from players':'Show '+entry.name+' to players')} onClick={()=>onVisibility(entry)}>
        {entry.visible?'Hide from players':'Show to players'}</button>}
      {onRemove&&entry.kind!=='Player'&&<button className="l-button" disabled={busy} aria-label={'Remove '+entry.name+' from combat'} onClick={()=>onRemove(entry.id)}>Remove</button>}
    </li>)}</ol>:<p>Waiting for combatants.</p>;
}

export function PlayerCombat({combat,onRoll}){
  if(!combat.encounter)return combat.error?<p role="alert">Live combat: {combat.error}</p>:null;
  return <section className="l-panel" aria-label="Live encounter"><h2>{combat.encounter.name}</h2>
    <button className="l-button primary" disabled={combat.busy||combat.submitted} onClick={onRoll}>
      {combat.submitted?'Initiative submitted':'Roll encounter initiative'}</button>
    {combat.error&&<p role="alert">{combat.error}</p>}
    {combat.encounter.turn&&<p role="status">Round {combat.encounter.turn.round} · {combat.encounter.turn.name||'DM turn'}</p>}
    <InitiativeOrder encounter={combat.encounter}/>
  </section>;
}

export function DMCombat({api,campaignId,roll,characters,sheetInitiative}){
  const {encounter,error,refresh}=useEncounter(api,campaignId);
  const [title,setTitle]=useState(''),[name,setName]=useState(''),[kind,setKind]=useState('Enemy'),[score,setScore]=useState('');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[modifier,setModifier]=useState('0'),lock=useRef(false);
  async function command(action,payload){
    if(lock.current)return;
    lock.current=true;setBusy(true);setMessage('');
    try{
      if(action==='advance')await api.advanceTurn(campaignId,encounter.id,encounter.turn?.serial||0);
      else await api.combat(campaignId,encounter?.id||null,action,payload);
      refresh();
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
        <div className="l-toolbar">{encounter.turn&&<strong role="status">Round {encounter.turn.round} · {encounter.turn.name||'Combatant removed'}</strong>}
          <button type="button" className="l-button primary" disabled={busy||!encounter.entries.some(e=>e.initiative!=null)} onClick={()=>command('advance',{})}>{encounter.turn?'Next turn':'Begin turns'}</button>
        </div>
        <InitiativeOrder encounter={encounter} busy={busy} onVisibility={entry=>command('visibility',{id:entry.id,visible:!entry.visible})} onRemove={id=>command('remove',{id})}/>
        <EncounterPicker key={encounter.id} characters={characters} sheetInitiative={sheetInitiative} encounter={encounter} userId={api.userId}
          roll={roll} disabled={busy} submit={async entries=>{await api.combat(campaignId,encounter.id,'add_group',{entries});refresh();}}/>
        <h4>Custom combatant</h4>
        <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void command('add',{id:crypto.randomUUID(),name:name.trim(),kind,initiative:Number(score)});}}>
          <label className="l-field"><span>Combatant name</span><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label className="l-field"><span>Combatant type</span><select aria-label="Combatant type" value={kind} onChange={e=>setKind(e.target.value)}><option>Enemy</option><option>NPC</option></select></label>
          <label className="l-field"><span>Initiative modifier</span><input type="number" min="-99" max="99" value={modifier} onChange={e=>setModifier(e.target.value)}/></label>
          <button type="button" className="l-button" disabled={busy||Math.abs(Number(modifier))>99||!Number.isInteger(Number(modifier))} onClick={async()=>{
            const bonus=Number(modifier),result=roll(`1d20${bonus>=0?'+':''}${bonus}`,(name.trim()||kind)+' initiative',{inline:true,mode:'normal',waitForDice:true,readLanding:true});
            if(result){setBusy(true);try{const final=await result.settled||result;setScore(String(final.total));}finally{setBusy(false);}}
          }}>Roll d20</button>
          <label className="l-field"><span>Initiative total</span><input type="number" required min="-999" max="999" value={score} onChange={e=>setScore(e.target.value)}/></label>
          <button disabled={busy} className="l-button">Add combatant</button>
        </form></>}
    <EncounterLogs key={campaignId} api={api} campaignId={campaignId} activeId={encounter===null?null:encounter?.id}/>
    {message&&<p role="alert">{message}</p>}
  </section>;
}
