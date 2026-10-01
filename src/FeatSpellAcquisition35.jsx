import React,{useEffect,useMemo,useState} from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';
import {
  featSpellAcquisitionPlan35,
  featSpellAcquisitionComplete35,
  setFeatSpellAcquisitionChoices35,
  autoResolveFeatSpellAcquisition35
} from './lib/featSpellAcquisition35';

function withoutChoices(feat){
  const next={...feat};
  delete next.spellAcquisitionChoices35;
  return next;
}

export default function FeatSpellAcquisition35({feat,char,spells=[],onChange}){
  const initialTarget=feat?.spellAcquisitionChoices35?.targetClassId||'';
  const initialIds=Array.isArray(feat?.spellAcquisitionChoices35?.entries)?feat.spellAcquisitionChoices35.entries.map(keyOf):[];
  const [targetClassId,setTargetClassId]=useState(initialTarget);
  const [selected,setSelected]=useState(initialIds);

  useEffect(()=>{
    setTargetClassId(feat?.spellAcquisitionChoices35?.targetClassId||'');
    setSelected(Array.isArray(feat?.spellAcquisitionChoices35?.entries)?feat.spellAcquisitionChoices35.entries.map(keyOf):[]);
  },[feat?.id,feat?.spellAcquisitionChoices35]);

  const working=useMemo(()=>targetClassId
    ?{...feat,spellAcquisitionChoices35:{...(feat?.spellAcquisitionChoices35||{}),targetClassId}}
    :feat,[feat,targetClassId]);
  const plan=useMemo(()=>featSpellAcquisitionPlan35(working,char,spells),[working,char,spells]);

  useEffect(()=>{
    if(!plan.supported||!plan.fixed||featSpellAcquisitionComplete35(feat,char))return;
    const next=autoResolveFeatSpellAcquisition35(working,char,spells);
    if(featSpellAcquisitionComplete35(next,char))onChange(next);
  },[plan.supported,plan.fixed,plan.fixedSpells?.length,targetClassId,feat,char,spells,onChange,working]);

  if(!plan.supported||plan.effect==='access-only'||!plan.requiresAcquisition)return null;

  const target=targetClassId||plan.targetClass?.classId||'';
  const chooseTarget=value=>{
    setTargetClassId(value);setSelected([]);
    onChange(withoutChoices({...feat,spellAcquisitionChoices35:{targetClassId:value}}));
  };
  const toggle=spell=>{
    const id=keyOf(spell);
    const next=selected.includes(id)?selected.filter(value=>value!==id):selected.length<plan.count?[...selected,id]:selected;
    setSelected(next);
    if(target&&next.length===plan.count){
      try{onChange(setFeatSpellAcquisitionChoices35(working,char,{targetClassId:target,spellIds:next},spells));}
      catch{onChange(withoutChoices(working));}
    }else onChange(withoutChoices(working));
  };

  return <section aria-label={`Feat spell acquisition · ${feat.name}`} className="feature-detail">
    <h4>{feat.name} · spell acquisition</h4>
    {plan.targetClasses.length>1&&<label className="l-field"><span>Spellcasting class</span><select aria-label={`${feat.name} spellcasting class`} value={target} onChange={e=>chooseTarget(e.target.value)}><option value="">Choose a class</option>{plan.targetClasses.map(row=><option key={row.classId} value={row.classId}>{row.name} {row.level}</option>)}</select></label>}
    {plan.targetClasses.length===1&&!targetClassId&&<p className="l-muted">Applies to {plan.targetClasses[0].name} {plan.targetClasses[0].level}.</p>}
    {plan.fixed?<p className="l-notice">This feat automatically adds {plan.fixedSpells.map(spell=>spell.name).join(', ')||'its source-defined spell'} to your {plan.effect==='spellbook-entry'?'spellbook':'known spells'}.</p>:<>
      <p>Choose {plan.count} spell{plan.count===1?'':'s'}{Number.isInteger(plan.maxSpellLevel)?` of level ${plan.maxSpellLevel} or lower`:''}. This choice is part of taking the feat.</p>
      {target?<SpellPicker label={`${feat.name} spell choice`} spells={plan.options} selected={selected} limit={plan.count} onToggle={toggle}/>:<p role="status">Choose which spellcasting class receives this feat first.</p>}
    </>}
    {!featSpellAcquisitionComplete35(feat,char)&&<p role="status">Complete this feat’s spell choice before continuing.</p>}
  </section>;
}
