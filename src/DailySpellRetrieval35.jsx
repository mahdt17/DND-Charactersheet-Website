import React,{useMemo,useState} from 'react';
import SpellAcquisitionChoices35 from './SpellAcquisitionChoices35';
import {keyOf} from './lib/editions';
import {characterClasses} from './lib/advancement';
import {spellAcquisitionCandidates35,spellAcquisitionEvents35,spellAcquisitionPicksComplete35,applySpellAcquisitionEvent35} from './lib/spellAcquisition35';

export default function DailySpellRetrieval35({char,classId,spells=[],patch}){
  const [picks,setPicks]=useState({}),[error,setError]=useState('');
  const row=characterClasses(char).find(entry=>entry.catalogId===classId);
  const level=Math.max(1,Number(row?.level)||1);
  const events=spellAcquisitionEvents35(char,{classId,previousClassLevel:level,targetClassLevel:level}).filter(event=>event.kind==='retrieve-daily-spells');
  const candidates=useMemo(()=>spellAcquisitionCandidates35(char,classId,spells),[char,classId,spells]);
  if(!events.length)return null;
  const legal=new Set(candidates.map(keyOf));
  const complete=spellAcquisitionPicksComplete35(events,picks,legal);
  const save=()=>{
    try{
      let next=char;
      for(const event of events){
        const value=picks[event.eventId||event.id]||{},byLevel={};
        for(const [spellLevel,ids] of Object.entries(value.byLevel||{}))byLevel[spellLevel]=(ids||[]).map(id=>candidates.find(spell=>keyOf(spell)===id)).filter(Boolean);
        next=applySpellAcquisitionEvent35(next,event,{byLevel});
      }
      patch({spellAcquisition35:next.spellAcquisition35,spellAcquisition35Incomplete:next.spellAcquisition35Incomplete,spells:next.spells});
      setPicks({});setError('');
    }catch(e){setError(e.message);}
  };
  return <section className="feature-detail" aria-label="Daily spell retrieval"><SpellAcquisitionChoices35 events={events} spells={candidates} picks={picks} onChange={setPicks} character={char}/>{error&&<p role="alert" className="l-notice">{error}</p>}<button type="button" className="l-button primary" disabled={!complete} onClick={save}>Retrieve spells for today</button></section>;
}
