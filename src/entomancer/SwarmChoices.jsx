import React from 'react';
import {entomancerSpecies,entomancerInstruments} from '../data/entomancer';
import {entomancerProfile,entomancerStartsCharacter} from '../lib/entomancer';
import {Choice} from './SwarmFields';
export default function EntomancerChoices({char,patch,functional=false,startingClass=entomancerStartsCharacter(char)}){
 const p=entomancerProfile(char),s=char.entomancer||{};if(!p.level)return null;
 const change=(key,value)=>patch(functional?current=>({...current,entomancer:{...current.entomancer,[key]:value}}):{entomancer:{...s,[key]:value}});
 return <section aria-label="Entomancer choices"><h3>Entomancer choices</h3><div className="form-grid">
  <Choice label="Swarm species" value={s.species} options={entomancerSpecies} onChange={v=>change('species',v)}/>
  {startingClass&&<Choice label="Entomancer tool proficiency" value={s.tool} options={['Herbalism Kit','Poisoner’s Kit']} onChange={v=>change('tool',v)}/>}
  {s.species==='Orthoptera'&&<Choice label="Natural Savant instrument" value={s.instrument} options={entomancerInstruments} onChange={v=>change('instrument',v)}/>}
  {p.level>=3&&<><Choice label="Moisture adaptation" value={s.moisture} options={['Dry','Humid']} onChange={v=>change('moisture',v)}/><Choice label="Temperature adaptation" value={s.temperature} options={['Hot','Cold']} onChange={v=>change('temperature',v)}/></>}
 </div></section>;
}
