import React from 'react';
import {featMagicState,featMagicOptions} from './lib/featMagic';

export default function FeatMagicChoices({feat,char,onChange}){
 const state=featMagicState(feat,char);if(!state.supported)return null;
 const p=state.profile,choice=feat.magicChoices||{},options=featMagicOptions(feat,char);
 const patch=value=>onChange({...feat,magicChoices:{...choice,...value}});
 const spellSelect=(label,value,spells,change)=><label className="l-field"><span>{label}</span><select aria-label={label} value={value||''} onChange={e=>change(e.target.value)}><option value="">Choose a spell</option>{spells.map(s=><option key={s.catalogId} value={s.catalogId}>{s.name}</option>)}</select></label>;
 return <section aria-label={`${feat.name} spell choices`}><p>These spells use this feat’s casting ability and do not use your class spell allowance. Make or replace choices only when the feat’s rules allow it.</p><div className="form-grid">
 {p.lists.length>0&&<label className="l-field"><span>Feat spell list</span><select aria-label="Feat spell list" value={state.list||''} onChange={e=>patch({list:e.target.value,cantrips:[],spell:''})}><option value="">Choose a class list</option>{p.lists.map(name=><option key={name}>{name}</option>)}</select></label>}
 {p.kind==='initiate'&&p.edition==='2014'?<p>Spellcasting ability: {state.ability?.toUpperCase()||'choose a list'}</p>:<label className="l-field"><span>Feat casting ability</span><select aria-label="Feat casting ability" value={choice.ability||''} onChange={e=>patch({ability:e.target.value})}><option value="">Choose an ability</option><option value="int">Intelligence</option><option value="wis">Wisdom</option><option value="cha">Charisma</option></select></label>}
 {Array.from({length:p.cantrips},(_,i)=><React.Fragment key={i}>{spellSelect(`Feat cantrip ${i+1}`,choice.cantrips?.[i],options.cantrips.filter(s=>s.catalogId!==choice.cantrips?.[1-i]),value=>{const cantrips=[...(choice.cantrips||[])];cantrips[i]=value;patch({cantrips});})}</React.Fragment>)}
 {spellSelect('Feat level 1 spell',choice.spell,options.spells,spell=>patch({spell}))}</div>{p.fixed&&<p>{p.fixed} is also granted automatically.</p>}
 {p.abilityIncrease&&<label className="l-check"><input type="checkbox" checked={choice.applyAbilityIncrease!==false} onChange={e=>patch({applyAbilityIncrease:e.target.checked})}/>Apply the feat’s +1 to the chosen ability (maximum 20). Turn off if already included in your base score.</label>}
 {!state.valid&&<p role="status">Complete this feat’s distinct spell choices and casting ability. Repeated 2024 Magic Initiate feats must use different spell lists.</p>}</section>;
}
