import React from 'react';
import {spellSlotPools,spellCounts} from './lib/editions';
import {manualSpellChoices} from './lib/spellcastingPolicy';

export default function ClassSpellLimits({char,score=10}){
 const pools=spellSlotPools(char),counts=spellCounts(char,score);
 if(pools.mode!=='automatic')return <p className="l-notice" role="note" aria-label={`${char.className} spell limits`}>{pools.reason} Spell choices must follow this class’s source and class level.</p>;
 const slots=pools.standard.flatMap((count,level)=>count?[`${count} level ${level} spell slots`]:[]).join(' · ');
 return <p className="l-notice" role="note" aria-label={`${char.className} spell limits`}>{char.className} level {char.level}: {slots||'No spell slots at this class level'}. {manualSpellChoices(char)?'Daily preparation and spells known follow this class’s source.':counts.mode==='spellbook'?`Up to ${counts.prepared} prepared spells from your spellbook and ${counts.cantrips} cantrips.`:counts.mode==='known'?`Up to ${counts.known} known spells and ${counts.cantrips} cantrips.`:`Up to ${counts.prepared||0} prepared spells and ${counts.cantrips} cantrips.`} Slots count casts; prepared or known spells are the choices you can cast. Only spell levels unlocked by this class are available.{char.className==='Warlock'?' Pact Magic slots recover on a short or long rest.':''}</p>;
}
