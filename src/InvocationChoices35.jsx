import React from 'react';
import SpellPicker from './EditionSpellPicker';
import {invocationCatalog35,activeInvocations35,validateInvocationReplacement35} from './lib/invocationAcquisition35';

const grades=['least','lesser','greater','dark'];
export default function InvocationChoices35({character,events=[],picks={},onChange}){
 const selectedElsewhere=id=>new Set(Object.entries(picks).filter(([key])=>key!==id).flatMap(([,value])=>Array.isArray(value)?value:[]));
 return <section aria-label="3.5 invocation choices">
  <p className="l-notice">Choose invocations from your class list. Invocations are spell-like abilities used at will; they do not use spell slots. Read each linked source for its effect.</p>
  {events.map(event=>{
   const id=event.eventId||event.id,value=picks[id],catalog=invocationCatalog35(event.classId),owned=activeInvocations35(character,event.classId);
   const chosenElsewhere=selectedElsewhere(id),ownedIds=new Set(owned.map(row=>row.invocationKey));
   if(event.kind==='choose-invocations'){
    const selected=Array.isArray(value)?value:[];
    const candidates=catalog.filter(row=>grades.indexOf(row.grade)<=grades.indexOf(event.maxGrade)&&!ownedIds.has(row.catalogId)&&!chosenElsewhere.has(row.catalogId));
    return <SpellPicker key={id} label={'Invocations at class level '+event.classLevel} spells={candidates} selected={selected} limit={event.count} onToggle={row=>onChange({...picks,[id]:selected.includes(row.catalogId)?selected.filter(key=>key!==row.catalogId):selected.length<event.count?[...selected,row.catalogId]:selected})}/>;
   }
   const enabled=value?.skip===false,removed=value?.removedInvocationKey||'',added=value?.addedInvocationKey||'';
   const candidates=catalog.filter(row=>!chosenElsewhere.has(row.catalogId)&&validateInvocationReplacement35(character,event,{removedInvocationKey:removed,addedInvocation:row}).valid);
   return <div className="feature-detail" key={id}>
    <label className="l-check"><input type="checkbox" checked={enabled} onChange={e=>onChange({...picks,[id]:{skip:!e.target.checked}})}/>{'Replace an invocation at class level '+event.classLevel}</label>
    {enabled&&<>
     <label className="l-field"><span>{'Invocation to replace at class level '+event.classLevel}</span><select value={removed} onChange={e=>onChange({...picks,[id]:{skip:false,removedInvocationKey:e.target.value}})}><option value="">Choose an invocation you already knew</option>{owned.filter(row=>row.acquiredAtClassLevel<event.classLevel).map(row=><option key={row.invocationKey} value={row.invocationKey}>{row.invocationName}</option>)}</select></label>
     {removed&&<SpellPicker label={'Replacement invocation at class level '+event.classLevel} spells={candidates} selected={added?[added]:[]} limit={1} onToggle={row=>onChange({...picks,[id]:{...value,addedInvocationKey:added===row.catalogId?'':row.catalogId}})}/>}
    </>}
   </div>;
  })}
  {!events.length&&<p>No invocation choices are required at this class level.</p>}
 </section>;
}
