import React,{useRef,useState} from 'react';
import CatalogItems from './CatalogItems';
import FeatChoices from './FeatChoices';
import equipment from './data/equipment.json';

export default function CampaignRewards({char,change}){
  const [open,setOpen]=useState(false),[field,setField]=useState('inventory'),[name,setName]=useState(''),[qty,setQty]=useState(1);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const pending=useRef(false),entries=char[field]||[];
  async function apply(adding,entry){
    if(pending.current)return;
    pending.current=true;setBusy(true);setMessage('');setError('');
    try{
      await change(field,adding,entry);
      setMessage(adding?`Gave ${entry.name} to ${char.name}.`:`Removed ${entry.name} from ${char.name}.`);
      if(adding){setName('');setQty(1);}
    }catch(e){setError(e.message);}finally{pending.current=false;setBusy(false);}
  }
  return <section className="l-panel campaign-rewards">
    <button className="l-button" aria-expanded={open} onClick={()=>setOpen(!open)}>Manage items and feats</button>
    {open&&<fieldset disabled={busy}><legend>{char.name}</legend>
      <label className="l-field"><span>Manage collection</span><select value={field} onChange={e=>{setField(e.target.value);setMessage('');setError('');}}>
        <option value="inventory">Items</option><option value="feats">Feats</option></select></label>
      {field==='inventory'?<>
        <form className="l-toolbar" onSubmit={e=>{
          e.preventDefault();const title=name.trim();if(!title)return;
          const item=equipment.find(row=>row.name.toLowerCase()===title.toLowerCase());
          void apply(true,{id:crypto.randomUUID(),name:item?.name||title,qty:Number(qty),weight:item?.weight||0,
            description:item?.desc?.join('\n')||'',equipmentIndex:item?.index,equipped:false});
        }}>
          <label className="l-field"><span>Item name</span><input list="reward-equipment" maxLength={200} required value={name} onChange={e=>setName(e.target.value)}/></label>
          <datalist id="reward-equipment">{equipment.map(item=><option key={item.index} value={item.name}/>)}</datalist>
          <label className="l-field"><span>Quantity</span><input type="number" required min="1" max="999" value={qty} onChange={e=>setQty(e.target.value)}/></label>
          <button className="l-button primary">Give item</button>
        </form>
        <CatalogItems char={char} onAdd={item=>apply(true,item)}/>
      </>:<FeatChoices char={char} patch={({feats})=>apply(true,feats.at(-1))}/>}
      <h3>{field==='inventory'?'Carried items':'Current feats'}</h3>
      {entries.length?<ul className="combat-list">{entries.map((entry,i)=><li key={entry.id||i}><span>{entry.name}{field==='inventory'&&entry.qty>1?' × '+entry.qty:''}</span>
        <button className="l-button party-danger" aria-label={'Remove '+entry.name} onClick={()=>apply(false,entry)}>Remove</button></li>)}</ul>:<p>None on this sheet.</p>}
    </fieldset>}
    {message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  </section>;
}
