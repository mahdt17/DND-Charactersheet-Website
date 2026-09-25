import React,{useState} from 'react';
import Modal from './Dialog';
import {adjustResource,characterResources,classResourceDefinitions,resourceMatches,resourceRecoveryText} from './lib/resources';

const initial={name:'',max:1,reset:'long',shortRecovery:1,unlimited:false};
export default function ResourceTracker({char,patch,abilities}) {
  const [draft,setDraft]=useState(null),[error,setError]=useState(''),[amounts,setAmounts]=useState({});
  const resources=characterResources(char,abilities),definitions=classResourceDefinitions(char,abilities);
  const candidates=r=>definitions.filter(d=>resourceMatches(r,d)&&!resources.some(x=>x.id!==r.id&&x.classResourceKey===d.classResourceKey));
  function edit(r) {setError('');setDraft(r?{...r,reset:r.shortRecovery&&r.shortRecovery!=='all'?'partial':r.reset,shortRecovery:Number(r.shortRecovery)||1}:{...initial});}
  function save(e) {
    e.preventDefault();
    const r={...draft,id:draft.id||crypto.randomUUID(),name:draft.name.trim(),max:Math.max(1,Math.floor(Number(draft.max)||1)),used:draft.used||0,manual:true,
      reset:draft.reset==='partial'?'long':draft.reset,shortRecovery:draft.reset==='short'?'all':draft.reset==='partial'?Math.max(1,Math.floor(Number(draft.shortRecovery)||1)):0,meditation:false,restoration:0};
    if(!r.name)return;
    patch({resources:draft.id?resources.map(x=>x.id===r.id?r:x):[...resources,r]});setDraft(null);
  }
  function change(r,direction) {
    try{patch(adjustResource(char,r.id,direction*(amounts[r.id]||1),abilities));setError('');}catch(e){setError(e.message);}
  }
  function remove(r) {
    const hidden=[...char.hiddenClassResources||[],...definitions.filter(d=>d.classResourceKey===r.classResourceKey||(!r.classResourceKey&&resourceMatches(r,d))).map(d=>d.classResourceKey)];
    patch({resources:resources.filter(x=>x.id!==r.id),hiddenClassResources:[...new Set(hidden)]});
  }
  function adopt(r,d) {patch({resources:resources.map(x=>x.id===r.id?{...r,...d,id:r.id,used:r.used,manual:false}:x)});}
  return <section aria-label="Limited-use resources">
    <div className="l-section-head section-spaced"><h2>Limited-use resources</h2><button className="l-button" onClick={()=>edit()}>Add resource</button></div>
    <p className="l-muted">Supported core class counters follow class levels. Apply feature effects, spell conversions, and initiative recovery yourself. Custom counters keep your settings.</p>
    {error&&<p className="l-error" role="alert">{error}</p>}
    {resources.map(r=>{
      const definition=definitions.find(d=>d.classResourceKey===r.classResourceKey),auto=definition&&!r.manual;
      return <div className="resource-entry" key={r.id} role="group" aria-label={`${r.name} resource`}>
        <div className="resource-row"><div><strong>{r.name}</strong><small>{auto?`${r.className} · ${r.edition} class progression`:'Custom counter'}</small><small>{resourceRecoveryText(r)}</small></div><strong className="resource-count">{r.unlimited?'Unlimited':`${Math.max(0,r.max-r.used)} / ${r.max}`}</strong></div>
        <div className="l-toolbar resource-controls">
          {!r.unlimited&&<><label className="l-field"><span>Amount</span><input aria-label={`${r.name} amount`} type="number" min="1" max={Math.max(r.max,r.used,1)} value={amounts[r.id]||1} onChange={e=>setAmounts({...amounts,[r.id]:Math.max(1,Math.floor(Number(e.target.value)||1))})}/></label><button className="l-button" disabled={!r.used} onClick={()=>change(r,-1)}>Restore</button><button className="l-button" disabled={r.used+(amounts[r.id]||1)>r.max} onClick={()=>change(r,1)}>Use</button></>}
          <button className="l-button" onClick={()=>edit(r)}>Edit</button><button className="l-button" onClick={()=>remove(r)}>Remove</button>
          {definition&&r.manual&&<button className="l-button" onClick={()=>adopt(r,definition)}>Use class progression</button>}
          {!r.classResourceKey&&candidates(r).map(d=><button className="l-button" key={d.classResourceKey} onClick={()=>adopt(r,d)}>Use {d.className} progression</button>)}
        </div>
      </div>;
    })}
    {!!char.hiddenClassResources?.length&&<button className="l-button section-spaced" onClick={()=>patch({hiddenClassResources:[]})}>Restore removed class counters</button>}
    {draft&&<Modal title={draft.id?'Edit resource':'Add resource'} onClose={()=>setDraft(null)}><form onSubmit={save}>
      <label className="l-field"><span>Resource name</span><input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label className="l-field"><span>Maximum uses</span><input type="number" min="1" max="1000" required value={draft.max} onChange={e=>setDraft({...draft,max:e.target.value})}/></label>
      <label className="l-field"><span>Rest recovery</span><select aria-label="Rest recovery" value={draft.reset} onChange={e=>setDraft({...draft,reset:e.target.value})}><option value="long">All on long rest</option><option value="short">All on short or long rest</option><option value="partial">Some on short rest; all on long rest</option><option value="none">Manual recovery</option></select></label>
      {draft.reset==='partial'&&<label className="l-field"><span>Uses recovered on short rest</span><input type="number" min="1" max="1000" required value={draft.shortRecovery} onChange={e=>setDraft({...draft,shortRecovery:e.target.value})}/></label>}
      <label className="l-check"><input type="checkbox" checked={!!draft.unlimited} onChange={e=>setDraft({...draft,unlimited:e.target.checked})}/>Unlimited uses</label>
      {draft.classResourceKey&&<p className="l-muted">Saving makes this a custom counter. Class progression can be restored later. Handle any special recovery requirements yourself.</p>}
      <button className="l-button primary" type="submit">Save resource</button>
    </form></Modal>}
  </section>;
}
