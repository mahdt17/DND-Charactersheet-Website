import React from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';

export default function SpellAcquisitionChoices35({events=[],spells=[],picks={},onChange}){
  if(!events.length)return null;
  const setPick=(event,value)=>onChange({...picks,[event.eventId||event.id]:value});
  const toggleIds=(event,spell,limit)=>{
    const id=keyOf(spell),key=event.eventId||event.id,current=Array.isArray(picks[key])?picks[key]:[];
    const next=current.includes(id)?current.filter(value=>value!==id):current.length<limit?[...current,id]:current;
    setPick(event,next);
  };
  return <section aria-label="3.5 spell acquisition choices">
    <h3>Spell acquisition</h3>
    {events.filter(event=>event.required!==false).map(event=>{
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
          <SpellPicker label="Starting Wizard level 1 spells" spells={first} selected={selected} limit={event.firstLevelChoices} onToggle={toggle}/>
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
      return null;
    })}
  </section>;
}
