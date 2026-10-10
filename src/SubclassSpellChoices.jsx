import React from 'react';
import {subclassLandOptions} from './lib/subclassSpells';

export default function SubclassSpellChoices({char,model,classId,patch}){
 const options=subclassLandOptions(model);
 if(!options.length)return null;
 const choice=char.subclassSpellChoices?.[classId]||{};
 return <label className="l-field"><span>Circle of the Land terrain</span><select value={choice.land||''} onChange={e=>patch({subclassSpellChoices:{...char.subclassSpellChoices,[classId]:{...choice,land:e.target.value}}})}><option value="">Choose your circle's land</option>{options.map(land=><option key={land} value={land}>{land[0].toUpperCase()+land.slice(1)}</option>)}</select><small>{model.ruleset==='2024'?'Choose your land after a Long Rest.':'Choose the land where you became a druid.'} Its circle spells are always prepared in addition to your normal allowance.</small></label>;
}
