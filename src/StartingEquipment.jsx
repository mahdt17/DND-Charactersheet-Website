import React from 'react';
import equipment from './data/equipment.json';
import categories from './data/equipment-categories.json';

function optionsFor(choice) {
  if(choice.from?.options)return choice.from.options;
  const category=categories.find(c=>c.index===choice.from?.equipment_category?.index);
  return (category?.equipment||[]).map(of=>({option_type:'counted_reference',of,count:1}));
}
function label(option) {
  if(option.option_type==='multiple')return option.items.map(label).join(' + ');
  if(option.option_type==='choice')return option.choice.desc;
  return `${option.count>1?`${option.count} × `:''}${option.of?.name||option.item?.name||'Equipment'}`;
}
export function resolveEquipment(choice,value=[]) {
  const options=optionsFor(choice);
  return Array.from({length:choice.choose||1},(_,i)=>resolveOption(options[value[i]?.index||0],value[i]?.children)).flat();
}
function resolveOption(option,children) {
  if(!option)return [];
  if(option.option_type==='multiple')return option.items.flatMap((o,i)=>resolveOption(o,children?.[i]));
  if(option.option_type==='choice')return resolveEquipment(option.choice,children);
  const ref=option.of||option.item;
  if(!ref)return [];
  const data=equipment.find(e=>e.index===ref.index);
  return [{id:crypto.randomUUID(),name:ref.name,qty:option.count||1,equipmentIndex:ref.index,weight:data?.weight||0,auto:'class'}];
}
function Nested({option,value,onChange}) {
  if(option?.option_type==='choice')return <EquipmentChoice choice={option.choice} value={value} onChange={onChange}/>;
  if(option?.option_type==='multiple')return <>{option.items.map((o,i)=><Nested key={i} option={o} value={value?.[i]} onChange={next=>onChange({...value,[i]:next})}/>)}</>;
  return null;
}
export default function EquipmentChoice({choice,value=[],onChange}) {
  const options=optionsFor(choice);
  return <div className="equipment-choice">{Array.from({length:choice.choose||1},(_,i)=><div key={i}><label className="creation-field"><span>{choice.desc}{choice.choose>1?` · choice ${i+1}`:''}</span><select value={value[i]?.index||0} onChange={e=>{const next=[...value];next[i]={index:Number(e.target.value),children:undefined};onChange(next);}}>{options.map((o,j)=><option key={j} value={j}>{label(o)}</option>)}</select></label><Nested option={options[value[i]?.index||0]} value={value[i]?.children} onChange={children=>{const next=[...value];next[i]={...next[i],children};onChange(next);}}/></div>)}</div>;
}
