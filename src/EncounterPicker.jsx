import React,{useRef,useState} from 'react';
import monsters from './data/monsters.json';

const bestiary=monsters.map(monster=>({
  key:'monster:'+monster.index,name:monster.name,kind:'Enemy',
  bonus:Math.floor((monster.dexterity-10)/2),detail:'CR '+monster.challenge_rating
}));
const signed=value=>value>=0?'+'+value:String(value);

export default function EncounterPicker({characters,sheetInitiative,encounter,userId,roll,submit,disabled}){
  const [source,setSource]=useState('monsters'),[search,setSearch]=useState('');
  const [queue,setQueue]=useState([]),[rolling,setRolling]=useState(false),[error,setError]=useState('');
  const pending=useRef(null),lock=useRef(false);
  const playerIds=new Set(encounter.entries.filter(entry=>entry.kind==='Player').map(entry=>entry.id));
  const options=source==='monsters'?bestiary:characters
    .filter(char=>!playerIds.has(userId+':'+char.id))
    .map(char=>({key:'sheet:'+char.id,name:char.name,kind:'NPC',char,detail:'Level '+char.level}));
  const matches=options.filter(option=>option.name.toLowerCase().includes(search.trim().toLowerCase()));
  const total=queue.reduce((sum,row)=>sum+Number(row.count),0);
  const capacity=150-encounter.entries.filter(row=>row.kind!=='Player').length;
  const valid=queue.every(row=>Number.isInteger(Number(row.count))&&Number(row.count)>=1)&&total<=capacity;
  function update(next){pending.current=null;setQueue(next);setError('');}
  function toggle(option){
    if(queue.some(row=>row.key===option.key))update(queue.filter(row=>row.key!==option.key));
    else update([...queue,{key:option.key,name:option.name,kind:option.kind,bonus:option.char?sheetInitiative(option.char):option.bonus,count:1}]);
  }
  async function add(){
    if(lock.current||!total||!valid)return;
    lock.current=true;setRolling(true);setError('');
    try{
      if(!pending.current){
        const group=[];
        const names=new Set(encounter.entries.map(entry=>entry.name));
        for(const row of queue){
          let number=1;
          for(let i=0;i<Number(row.count);i++){
            let name=row.name.slice(0,120);
            if(row.count>1||names.has(name)){
              do {name=row.name.slice(0,110)+' '+number++;} while(names.has(name));
            }
            names.add(name);group.push({id:crypto.randomUUID(),name,kind:row.kind,bonus:row.bonus});
          }
        }
        // Keep each group of animated dice within the tray's display capacity.
        for(let offset=0;offset<group.length;offset+=12){
          await Promise.all(group.slice(offset,offset+12).map(async entry=>{
            const result=roll('1d20'+signed(entry.bonus),entry.name+' initiative',{inline:true,mode:'normal',waitForDice:true,readLanding:true});
            if(!result)throw Error('Could not roll initiative.');
            entry.initiative=(await result.settled||result).total;
          }));
        }
        pending.current=group;
      }
      await submit(pending.current);
      update([]);
    }catch(e){setError(e.message);}
    finally{lock.current=false;setRolling(false);}
  }
  return <fieldset className="encounter-picker" disabled={disabled||rolling}>
    <legend>Add encounter participants</legend>
    <div className="l-toolbar">
      <label className="l-field"><span>Choose from</span><select value={source} onChange={e=>{setSource(e.target.value);setSearch('');}}>
        <option value="monsters">Compendium monsters</option><option value="sheets">My characters</option>
      </select></label>
      <label className="l-field"><span>Search participants</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
    </div>
    <div className="encounter-options">
      {matches.map(option=><label key={option.key}><input type="checkbox" checked={queue.some(row=>row.key===option.key)} onChange={()=>toggle(option)}/>
        <span>{option.name}</span> <small>{option.detail}</small></label>)}
      {!matches.length&&<p>{search?'No matches.':'No available characters.'}</p>}
    </div>
    {!!queue.length&&<ul className="encounter-queue">{queue.map(row=><li key={row.key}><span>{row.name} <small>{signed(row.bonus)} initiative</small></span>
      {row.kind==='Enemy'&&<label>Quantity <input type="number" min="1" max="150" aria-label={'Quantity of '+row.name} value={row.count}
        onChange={e=>update(queue.map(item=>item.key===row.key?{...item,count:e.target.value}:item))}/></label>}
      <button className="l-button" aria-label={'Deselect '+row.name} onClick={()=>toggle(row)}>Deselect</button>
    </li>)}</ul>}
    <p>Added participants start hidden from players.</p>
    {total>capacity&&<p role="alert">Room for {capacity} more combatants.</p>}
    <button className="l-button primary" disabled={!total||!valid} onClick={add}>{rolling?'Adding participants…':'Roll initiative and add ('+total+')'}</button>
    {error&&<p role="alert">{error}</p>}
  </fieldset>;
}
