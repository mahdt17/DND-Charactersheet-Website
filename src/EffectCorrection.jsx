import React,{useState} from 'react';
export default function EffectCorrection({effects,save}){
  const [selected,setSelected]=useState(null),[seconds,setSeconds]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const timers=(effects||[]).filter(e=>e.remainingSeconds!=null||e.expires);
  if(!timers.length)return null;
  async function apply(value){
    if(!selected||busy)return;
    setBusy(true);setNotice('');
    try{await save(selected,value);setNotice('Effect updated.');setSelected(null);}catch(e){setNotice(e.message);setSelected(null);}finally{setBusy(false);}
  }
  return <section className="l-panel" aria-label="DM effect controls"><h3>Adjust encounter effect</h3>
    <label className="l-field">Effect<select value={selected?.timerInstance||selected?.id||''} onChange={e=>{
      const item=timers.find(t=>(t.timerInstance||t.id)===e.target.value);
      setSelected(item);setSeconds(String(item?.remainingSeconds??''));setNotice('');
    }}><option value="">Choose an effect</option>{timers.map(e=><option key={e.timerInstance||e.id} value={e.timerInstance||e.id}>{e.name}</option>)}</select></label>
    {selected&&<div className="l-toolbar">{selected.remainingSeconds!=null&&!selected.expires&&<><label className="l-field">Seconds remaining<input type="number" min="1" step="1" value={seconds} onChange={e=>setSeconds(e.target.value)}/></label>
      <button className="l-button" disabled={busy||!Number.isSafeInteger(Number(seconds))||Number(seconds)<1} onClick={()=>apply(Number(seconds))}>Set duration</button></>}
      <button className="l-button" disabled={busy} onClick={()=>apply(0)}>End effect</button></div>}
    {notice&&<p role="status">{notice}</p>}</section>;
}
