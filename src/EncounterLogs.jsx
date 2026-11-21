import React,{useEffect,useState} from 'react';

const eventText={
  expired:e=>e.participant+' expired',
  added:e=>e.participant+' added, hidden from players (initiative '+e.initiative+')',
  initiative:e=>e.participant+' rolled initiative '+e.initiative,
  hidden:e=>e.participant+' hidden from players',
  revealed:e=>e.participant+' shown to players',
  removed:e=>e.participant+' removed from the encounter'
};
function plainText(log){
  const time=value=>new Date(value).toISOString();
  return [
    log.encounter+' — '+log.campaign,'DM encounter log (includes hidden combatants)',
    log.startedAt?'Started '+time(log.startedAt):'Recording began during this encounter.',
    'Ended '+time(log.endedAt),'','Encounter activity',
    ...log.events.map(e=>time(e.at)+'  '+(eventText[e.action]?.(e)??(e.participant+' · '+e.action))),
    ...(log.events.length?[]:['No initiative or roster changes recorded.']),
    '','Final initiative order',
    ...log.finalOrder.map(e=>(e.initiative??'Awaiting roll')+'  '+e.name+' ('+e.kind+(e.visible?'':', hidden')+')'),
    ...(log.finalOrder.length?[]:['No combatants.']),''
  ].join('\n');
}
function save(log,format){
  const data=format==='json'?JSON.stringify(log,null,2):plainText(log);
  const url=URL.createObjectURL(new Blob([data],{type:format==='json'?'application/json':'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  const name=log.encounter.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,80)||'encounter';
  link.href=url;link.download=name+'-'+new Date(log.endedAt).toISOString().replace(/[:.]/g,'-')+'.'+format;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export default function EncounterLogs({api,campaignId,activeId}){
  const [logs,setLogs]=useState([]),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [format,setFormat]=useState('txt'),[busy,setBusy]=useState(false);
  useEffect(()=>{
    if(activeId===undefined)return;
    let current=true;
    api.endedEncounters(campaignId).then(rows=>{if(current){setLogs(rows);setError('');}})
      .catch(e=>{if(current)setError(e.message);});
    return ()=>{current=false;};
  },[api,campaignId,activeId,retry]);
  async function download(id){
    setBusy(true);setError('');
    try{
      const log=await api.downloadEncounter(campaignId,id);
      if(!log){setLogs(rows=>rows.filter(row=>row.id!==id));throw Error('This encounter log is no longer available.');}
      save(log,format);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  if(!logs.length&&!error)return null;
  return <section aria-label="Finished encounters"><h4>Finished encounters</h4>
    {!!logs.length&&<><p>DM logs include hidden combatants. Download within seven days of the encounter ending.</p>
      <label className="l-field"><span>Log format</span><select value={format} onChange={e=>setFormat(e.target.value)}>
        <option value="txt">Plain text (.txt)</option><option value="json">JSON (.json)</option></select></label>
      <ul className="combat-list">{logs.map(row=><li key={row.id}><div><strong>{row.name}</strong> <small>{new Date(row.ended_at).toLocaleString()}</small></div>
        <button type="button" className="l-button" disabled={busy} aria-label={'Download log for '+row.name} onClick={()=>download(row.id)}>Download log</button></li>)}</ul>
    </>}
    {error&&<p role="alert">{error} <button type="button" className="l-button" onClick={()=>setRetry(n=>n+1)}>Refresh logs</button></p>}
  </section>;
}
