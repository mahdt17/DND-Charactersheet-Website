import React from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';
import {activeAcquiredSpells35} from './lib/spellAcquisition35';

export default function SpellAcquisitionChoices35({events=[],spells=[],picks={},onChange,character=null}){
  if(!events.length)return null;
  const setPick=(event,value)=>onChange({...picks,[event.eventId||event.id]:value});
  const toggleIds=(event,spell,limit)=>{
    const id=keyOf(spell),key=event.eventId||event.id,current=Array.isArray(picks[key])?picks[key]:[];
    const next=current.includes(id)?current.filter(value=>value!==id):current.length<limit?[...current,id]:current;
    setPick(event,next);
  };
  return <section aria-label="3.5 spell acquisition choices">
    <h3>Spell acquisition</h3>
    {events.map(event=>{
      const key=event.eventId||event.id;
      if(event.kind==='choose-known-spells'){
        const legal=spells.filter(spell=>Number(spell.level)===Number(event.spellLevel));
        return <SpellPicker
          key={key}
          label={`Known level ${event.spellLevel} spells`}
          spells={legal}
          selected={Array.isArray(picks[key])?picks[key]:[]}
          limit={event.count}
          onToggle={spell=>toggleIds(event,spell,event.count)}
        />;
      }
      if(event.kind==='wizard-starting-spellbook'){
        const cantrips=spells.filter(spell=>Number(spell.level)===0);
        const first=spells.filter(spell=>Number(spell.level)===1);
        const value=picks[key]||{},selected=Array.isArray(value.firstLevel)?value.firstLevel:[];
        const toggle=spell=>{
          const id=keyOf(spell);
          const next=selected.includes(id)?selected.filter(value=>value!==id):selected.length<event.firstLevelChoices?[...selected,id]:selected;
          setPick(event,{...value,firstLevel:next});
        };
        return <div key={key}>
          <p className="l-notice">Automatic level 0 spellbook entries: {cantrips.length} legal Wizard spells will be added when you finish creation.</p>
          <SpellPicker label="Starting spells" spells={first} selected={selected} limit={event.firstLevelChoices} onToggle={toggle}/>
        </div>;
      }
      if(event.kind==='wizard-free-spellbook-additions'){
        const legal=spells.filter(spell=>Number(spell.level)<=Number(event.maxSpellLevel));
        return <SpellPicker
          key={key}
          label="Wizard free spellbook additions"
          spells={legal}
          selected={Array.isArray(picks[key])?picks[key]:[]}
          limit={event.count}
          onToggle={spell=>toggleIds(event,spell,event.count)}
        />;
      }
      if(event.kind==='optional-replacement'){
        const value=picks[key]||{},owned=activeAcquiredSpells35(character,event.classId)
          .filter(item=>item.affectsQuota!==false&&Number(item.spellLevel)<=Number(event.maxReplacementSpellLevel))
          .sort((a,b)=>Number(a.spellLevel)-Number(b.spellLevel)||String(a.spellName).localeCompare(String(b.spellName)));
        const removed=owned.find(item=>item.spellKey===value.removedSpellKey)||null;
        const alreadyOwned=new Set(activeAcquiredSpells35(character,event.classId).map(item=>item.spellKey));
        const selectedElsewhere=new Set(Object.entries(picks).filter(([id])=>id!==key).flatMap(([,pick])=>Array.isArray(pick)?pick:(Array.isArray(pick?.firstLevel)?pick.firstLevel:[])));
        const replacements=removed?spells.filter(spell=>Number(spell.level)===Number(removed.spellLevel)&&!alreadyOwned.has(keyOf(spell))&&!selectedElsewhere.has(keyOf(spell))):[];
        const enabled=Boolean(value.enabled);
        return <section key={key} aria-label="Optional spell replacement" className="creation-section">
          <h4>Optional spell replacement</h4>
          <p>You may replace one eligible known spell at this class level. Skipping this does not block level-up.</p>
          <label className="l-check"><input type="checkbox" aria-label="Replace one known spell this level" checked={enabled} onChange={e=>setPick(event,e.target.checked?{enabled:true}:{enabled:false})}/> Replace one known spell this level</label>
          {enabled&&<><label className="l-field"><span>Known spell to replace</span><select aria-label="Known spell to replace" value={value.removedSpellKey||''} onChange={e=>setPick(event,{enabled:true,removedSpellKey:e.target.value,addedSpellId:''})}><option value="">Choose known spell</option>{owned.map(item=><option key={item.id||item.spellKey} value={item.spellKey}>{item.spellName}</option>)}</select></label>
          {removed&&<SpellPicker label={`Replacement level ${removed.spellLevel} spells`} spells={replacements} selected={value.addedSpellId?[value.addedSpellId]:[]} limit={1} onToggle={spell=>setPick(event,{...value,enabled:true,removedSpellKey:removed.spellKey,addedSpellId:value.addedSpellId===keyOf(spell)?'':keyOf(spell)})}/>}</>}
        </section>;
      }
      return null;
    })}
  </section>;
}
