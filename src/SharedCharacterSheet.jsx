import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import './sharedCampaigns.css';

// The player sheet contains native controls from many edition-specific tools.
// Enable only controls that navigate or inspect the sheet in the DM's viewer.
const controls='button,input,select,textarea';
const viewControl='[data-sheet-view],.sheet-shortcuts button,.sheet-tabs [role="tab"],.spell-name,.ability-score-open,button[aria-label="Close dialog"]';

export default function SharedCharacterSheet({children}){
  const root=useRef(null);
  useLayoutEffect(()=>{
    function protect(){
      for(const control of root.current.querySelectorAll(controls)){
        if(control.matches(viewControl))continue;
        if(control.tagName==='TEXTAREA'){
          if(!control.readOnly)control.readOnly=true;
        }else if(!control.disabled)control.disabled=true;
      }
    }
    protect();
    const observer=new MutationObserver(protect);
    observer.observe(root.current,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','readonly']});
    return ()=>observer.disconnect();
  },[]);
  return <article ref={root} className="party-player-sheet" aria-label="Live character sheet">{children}</article>;
}

export function SharedJournal({notes,save}){
  const [draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const changedElsewhere=draft&&draft.before!==notes&&draft.text!==notes;
  useEffect(()=>{
    if(draft&&notes===draft.text&&!busy)setDraft(null);
  },[draft,notes,busy]);
  async function submit(){
    if(!draft||busy||changedElsewhere)return;
    setBusy(true);setError('');setMessage('');
    try{await save(draft.before,draft.text);setMessage('Notes saved.');}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  return <div>
    <label className="l-field"><span>Backstory, personality, bonds, and session notes</span>
      <textarea data-sheet-view rows={15} value={draft?.text??notes} disabled={busy} onChange={e=>{
        setDraft({before:draft?.before??notes,text:e.target.value});setMessage('');setError('');
      }}/></label>
    {changedElsewhere&&<><p role="alert">The saved notes changed while you were editing.</p><p className="preserve-lines">{notes||'The saved journal is empty.'}</p>
      <button data-sheet-view className="l-button" onClick={()=>{setDraft({...draft,before:notes});setError('');}}>Keep editing my draft</button></>}
    <div className="l-toolbar"><button data-sheet-view className="l-button primary" disabled={busy||!draft||draft.text===notes||changedElsewhere||message==='Notes saved.'} onClick={submit}>Save notes</button>
      {draft&&<button data-sheet-view className="l-button" disabled={busy} onClick={()=>{setDraft(null);setMessage('');setError('');}}>Use saved notes</button>}</div>
    {message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  </div>;
}
