import React from 'react';
import {featMagicState,featMagicOptions,artisanTools} from './lib/featMagic';
import {useReferenceIndex} from './lib/referenceIndex';

export default function FeatMagicChoices({feat,char,onChange}){
 const state=featMagicState(feat,char),p=state.profile;
 const reference=useReferenceIndex(state.supported?['spells']:[],p?.edition||char.ruleset||'2014');
 if(!state.supported)return null;
 const choice=feat.magicChoices||{},options=featMagicOptions(feat,char,reference.entries),count=p.spellCount??1;
 const patch=value=>{
  const next={...choice,...value},ids=[...(next.cantrips||[]),...(next.spells||[]),next.spell];
  next.entries=Object.fromEntries([...Object.values(choice.entries||{}),...reference.entries].filter(s=>ids.includes(s.catalogId)).map(s=>[s.catalogId,s]));
  onChange({...feat,magicChoices:next});
 };
 const spellSelect=(label,value,spells,change)=><label className="l-field"><span>{label}</span><select aria-label={label} value={value||''} onChange={e=>change(e.target.value)}><option value="">Choose a spell</option>{spells.map(s=><option key={s.catalogId} value={s.catalogId}>{s.name}{s.sourceBook?` · ${s.sourceBook}`:''}</option>)}</select></label>;
 const choose=(field,i,value)=>{const items=[...(choice[field]||[])];items[i]=value;patch({[field]:items});};
 return <section aria-label={`${feat.name} spell choices`}><p>These spells use this feat’s casting ability and do not use your class spell allowance.</p>{reference.loading&&<p role="status">Loading published spell choices…</p>}{reference.error&&<p role="alert">{reference.error}<button type="button" onClick={reference.retry}>Retry spells</button></p>}<div className="form-grid">
 {p.lists.length>0&&<label className="l-field"><span>Feat spell list</span><select aria-label="Feat spell list" value={state.list||''} onChange={e=>patch({list:e.target.value,cantrips:[],spell:'',spells:[]})}><option value="">Choose a class list</option>{p.lists.filter(name=>!feat.requiredSpellList||name===feat.requiredSpellList).map(name=><option key={name}>{name}</option>)}</select></label>}
 {p.ability||p.lists.length&&p.edition==='2014'?<p>Spellcasting ability: {state.ability?.toUpperCase()||'choose a list'}</p>:<label className="l-field"><span>Feat casting ability</span><select aria-label="Feat casting ability" value={choice.ability||''} onChange={e=>patch({ability:e.target.value})}><option value="">Choose an ability</option><option value="int">Intelligence</option><option value="wis">Wisdom</option><option value="cha">Charisma</option></select></label>}
 {Array.from({length:p.cantrips},(_,i)=><React.Fragment key={`cantrip-${i}`}>{spellSelect(`Feat cantrip ${i+1}`,choice.cantrips?.[i],options.cantrips.filter(s=>!(choice.cantrips||[]).some((id,n)=>n!==i&&id===s.catalogId)),value=>choose('cantrips',i,value))}</React.Fragment>)}
 {Array.from({length:count},(_,i)=><React.Fragment key={`spell-${i}`}>{spellSelect(count===1?'Feat level 1 spell':`Feat ritual ${i+1}`,count===1?choice.spell:choice.spells?.[i],options.spells.filter(s=>count===1||!(choice.spells||[]).some((id,n)=>n!==i&&id===s.catalogId)),value=>count===1?patch({spell:value}):choose('spells',i,value))}</React.Fragment>)}
 {p.tools&&<label className="l-field"><span>Artisan’s tool proficiency</span><select aria-label="Artisan’s tool proficiency" value={choice.tool||''} onChange={e=>patch({tool:e.target.value})}><option value="">Choose tools</option>{artisanTools.map(x=><option key={x}>{x}</option>)}</select></label>}
 </div>{p.fixed&&<p>{p.fixed} is also granted automatically.</p>}
 {p.abilityIncrease&&<label className="l-check"><input type="checkbox" checked={choice.applyAbilityIncrease!==false} onChange={e=>patch({applyAbilityIncrease:e.target.checked})}/>Apply the feat’s +1 to the chosen ability (maximum 20). Turn off if already included in your base score.</label>}
 {(!state.valid||!state.complete)&&<p role="status">Complete this feat’s distinct spell choices and casting ability. Repeated 2024 Magic Initiate feats must use different spell lists.</p>}</section>;
}
