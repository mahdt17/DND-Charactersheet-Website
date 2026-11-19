import React,{useLayoutEffect,useRef} from 'react';
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
