import React, {useEffect, useId, useRef} from 'react';

export default function Dialog({title, children, onClose, wide=false,className=''}) {
  const ref=useRef(null), titleId=useId();
  useEffect(()=>{const node=ref.current,previous=document.activeElement;node.showModal();return()=>{node.close();if(previous?.isConnected)previous.focus?.({preventScroll:true});};},[]);
  return <dialog ref={ref} aria-labelledby={titleId} className={`l-dialog ${wide?'wide':''} ${className}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <div className="l-dialog-title"><h2 id={titleId}>{title}</h2><button type="button" className="l-button" aria-label="Close dialog" onClick={onClose}>×</button></div>
    <div className="l-dialog-body">{children}</div>
  </dialog>;
}
