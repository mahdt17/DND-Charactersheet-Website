import React from 'react';
export const B=({children,...props})=><button type="button" className="l-button" {...props}>{children}</button>;
export const F=({label,children})=><label className="l-field"><span>{label}</span>{React.cloneElement(children,{'aria-label':children.props['aria-label']||label})}</label>;
export const Num=({label,value,onChange,min=0,max=999999,step=1})=><F label={label}><input type="number" min={min} max={max} step={step} value={value??0} onChange={e=>onChange(e.target.value===''?'':Number(e.target.value))}/></F>;
export const sign=n=>n>=0?'+'+n:String(n);
export const abilities=['str','dex','con','int','wis','cha'];
export const types=['humanoid','beast','monstrosity','fey','giant','aberration','dragon','elemental','celestial','fiend','undead','construct'];
export function Target({char,value,onChange,label='Effect target',self=false}){return <F label={label}><select value={value} onChange={e=>onChange(e.target.value)}><option value="">Choose creature</option>{self&&<option value="self">Self</option>}{(char.archivistCampaign?.creatures||[]).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></F>;}
