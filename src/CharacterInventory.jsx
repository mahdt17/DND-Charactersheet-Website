import React,{useState} from 'react';
import {Plus,Search,X} from 'lucide-react';
import CatalogItems from './CatalogItems';
import equipment from './data/equipment.json';

function Button({children,icon:Icon,...props}){return <button type="button" className="l-button" {...props}>{Icon&&<Icon size={17}/>} {children}</button>;}
function Coin({label,value,onChange}){return <label className="l-field"><span>{label}</span><input type="number" min="0" max="999999" value={value??0} onChange={e=>onChange(Math.min(999999,Math.max(0,Number(e.target.value)||0)))}/></label>;}

export default function CharacterInventory({char,patch,show,follower=false}){
 const [query,setQuery]=useState(''),[custom,setCustom]=useState('');
 const inventory=char.inventory||[],Heading=follower?'h3':'h2';
 const add=item=>patch({inventory:[...inventory,{id:crypto.randomUUID(),name:item.name,qty:1,weight:item.weight||0,description:item.desc?.join('\n')||'',equipmentIndex:item.index,equipped:false}]});
 return <>
  <Heading>Inventory &amp; equipment</Heading>
  <CatalogItems char={char} onAdd={item=>patch({inventory:[...inventory,item]})}/>
  <div className="currency-grid">{['cp','sp','ep','gp','pp'].map(coin=><Coin key={coin} label={coin.toUpperCase()} value={char.currency?.[coin]} onChange={n=>patch({currency:{...char.currency,[coin]:n}})}/>)}</div>
  <p className="l-muted">Carried weight: {inventory.reduce((sum,item)=>sum+(Number(item.weight)||0)*(Number(item.qty)||0),0).toFixed(1)} lb. · {follower?'Mark equipped gear here. Adjust this creature’s armor and attack statistics in Manage.':'Equipped armor updates AC; equipped weapons appear in Actions. Magic bonuses and conditional effects need manual adjustments.'}</p>
  {inventory.map(item=><div className="inventory-row" key={item.id}>
   <input type="checkbox" aria-label={`Equip ${item.name}`} checked={!!item.equipped} onChange={e=>patch({...(!follower?{autoArmor:true}:{}),inventory:inventory.map(x=>x.id===item.id?{...x,equipped:e.target.checked}:x)})}/>
   <button type="button" onClick={()=>show(item.canonical?{...item.canonical,...item}:equipment.find(e=>e.index===item.equipmentIndex)||item)}>{item.name}</button>
   <input aria-label={`${item.name} quantity`} type="number" min="0" max="999" value={item.qty??1} onChange={e=>patch({inventory:inventory.map(x=>x.id===item.id?{...x,qty:Math.max(0,Math.min(999,Number(e.target.value)||0))}:x)})}/>
   <input aria-label={`${item.name} notes`} placeholder="Item notes" value={item.notes||''} onChange={e=>patch({inventory:inventory.map(x=>x.id===item.id?{...x,notes:e.target.value}:x)})}/>
   <Button icon={X} aria-label={`Remove ${item.name}`} onClick={()=>patch({inventory:inventory.filter(x=>x.id!==item.id)})}/>
  </div>)}
  <div className="l-section-head section-spaced"><h3>Add equipment</h3></div>
  <label className="l-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search weapons, armor, and adventuring gear…" aria-label="Search equipment"/></label>
  {query&&<div className="catalog-list">{equipment.filter(e=>e.name.toLowerCase().includes(query.toLowerCase())).slice(0,30).map(e=><div key={e.index}><button type="button" className="catalog-item" onClick={()=>show(e)}><strong>{e.name}</strong><small>{e.cost?.quantity} {e.cost?.unit} · {e.weight||0} lb.</small></button><Button icon={Plus} onClick={()=>add(e)}>Add</Button></div>)}</div>}
  <form className="l-toolbar section-spaced" onSubmit={e=>{e.preventDefault();if(custom.trim()){add({name:custom.trim()});setCustom('');}}}><input aria-label="Custom item name" placeholder="Custom item name" value={custom} onChange={e=>setCustom(e.target.value)}/><button className="l-button" type="submit">Add custom item</button></form>
 </>;
}
