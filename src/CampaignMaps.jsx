import React,{useEffect,useRef,useState} from 'react';
import Dialog from './Dialog';

const width=200,depth=150;
const emptyRoom={x:0,y:0,width:20,depth:20};
function draw(canvas,rooms,grid,corner){
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const colors=getComputedStyle(canvas);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(canvas.width/width,canvas.height/depth);
  if(grid){
    ctx.beginPath();
    for(let x=0;x<=width;x+=5){ctx.moveTo(x,0);ctx.lineTo(x,depth);}
    for(let y=0;y<=depth;y+=5){ctx.moveTo(0,y);ctx.lineTo(width,y);}
    ctx.strokeStyle=colors.color;ctx.globalAlpha=.15;ctx.lineWidth=.2;ctx.stroke();ctx.globalAlpha=1;
  }
  for(const room of rooms){
    ctx.fillStyle=colors.color;ctx.globalAlpha=.17;ctx.fillRect(room.x,room.y,room.width,room.depth);
    ctx.globalAlpha=1;ctx.lineWidth=.5;ctx.strokeStyle=colors.color;ctx.strokeRect(room.x,room.y,room.width,room.depth);
  }
  if(corner){ctx.fillStyle=colors.color;ctx.beginPath();ctx.arc(corner.x,corner.y,1.2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function FloorEditor({api,campaignId,id}){
  const [rooms,setRooms]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [room,setRoom]=useState(emptyRoom),[grid,setGrid]=useState(true),[corner,setCorner]=useState(null),[retry,setRetry]=useState(0);
  const canvas=useRef(null),pending=useRef(null),lock=useRef(false),sequence=useRef(0);
  useEffect(()=>{
    let active=true;
    const request=++sequence.current;
    api.mapFloor(campaignId,id).then(floor=>{if(active&&request===sequence.current){if(!floor)throw Error('Floor unavailable');setRooms(floor.rooms);setError('');}}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[api,campaignId,id,retry]);
  useEffect(()=>{if(canvas.current)draw(canvas.current,rooms||[],grid,corner);},[rooms,grid,corner]);
  function point(event){
    const bounds=event.currentTarget.getBoundingClientRect();
    const x=Math.min(width,Math.max(0,Math.round((event.clientX-bounds.left)*width/bounds.width)));
    const y=Math.min(depth,Math.max(0,Math.round((event.clientY-bounds.top)*depth/bounds.height)));
    if(!corner){setCorner({x,y});return;}
    setRoom({x:Math.min(x,corner.x),y:Math.min(y,corner.y),width:Math.abs(x-corner.x),depth:Math.abs(y-corner.y)});setCorner(null);
  }
  async function change(kind,oldRoom){
    if(lock.current)return;
    const payload=kind==='room'?Object.fromEntries(Object.entries(room).map(([k,v])=>[k,Number(v)])):{};
    const signature=JSON.stringify([kind,oldRoom?.id,payload]);
    if(pending.current?.signature!==signature)pending.current={signature,id:oldRoom?.id||crypto.randomUUID()};
    lock.current=true;++sequence.current;setBusy(true);setError('');
    try{
      await api.prepareMap(campaignId,kind,pending.current.id,id,payload);
      const floor=await api.mapFloor(campaignId,id);
      if(!floor)throw Error('Floor unavailable');
      setRooms(floor.rooms);pending.current=null;setCorner(null);
    }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  }
  const valid=Object.values(room).every(v=>v!==''&&Number.isInteger(Number(v)))&&Number(room.x)>=0&&Number(room.y)>=0&&Number(room.width)>=5&&Number(room.depth)>=5&&Number(room.x)+Number(room.width)<=width&&Number(room.y)+Number(room.depth)<=depth;
  return <section aria-label="Floor editor"><div className="l-toolbar"><strong>200 × 150 ft</strong>
    <label><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Show 5-ft grid</label>
    <button type="button" className="l-button" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Refresh floor</button></div>
    {rooms!==null&&<><canvas ref={canvas} width={800} height={600} className="map-drawing-board" aria-label="Floor drawing, with a room list below" onClick={point}/>
      <p>{corner?'Choose the opposite corner.':'Choose two corners or enter room dimensions in feet.'}</p>
      <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void change('room');}}>
        {Object.entries({x:'Left',y:'Top',width:'Width',depth:'Depth'}).map(([key,label])=><label className="l-field" key={key}>{label} (ft)<input type="number" value={room[key]} onChange={e=>setRoom({...room,[key]:e.target.value})}/></label>)}
        <button className="l-button primary" disabled={busy||!valid}>Draw room</button></form>
      {!!rooms.length&&<ul aria-label="Rooms on floor">{rooms.map(r=><li key={r.id}>{r.width} × {r.depth} ft at ({r.x}, {r.y}){' '}
        <button type="button" className="l-button" disabled={busy} aria-label={'Erase room at '+r.x+', '+r.y} onClick={()=>change('erase',r)}>Erase</button></li>)}</ul>}</>}
    {error&&<p role="alert">{error}</p>}</section>;
}
function Maps({api,campaignId,close}){
  const [maps,setMaps]=useState(null),[sceneId,setSceneId]=useState(''),[floorId,setFloorId]=useState('');
  const [name,setName]=useState(''),[floorName,setFloorName]=useState(''),[elevation,setElevation]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const pending=useRef(null),lock=useRef(false);
  useEffect(()=>{
    let active=true;
    api.mapCatalog(campaignId).then(rows=>{if(active){setMaps(rows);setError('');}}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[api,campaignId,retry]);
  const scene=maps?.find(m=>m.id===sceneId)||maps?.[0],floor=scene?.floors.find(f=>f.id===floorId)||scene?.floors[0];
  async function add(kind){
    if(lock.current)return;
    const parent=kind==='floor'?scene.id:null,value=kind==='floor'?{name:floorName.trim(),elevation:Number(elevation)}:{name:name.trim()};
    const signature=JSON.stringify([kind,parent,value]);
    if(pending.current?.signature!==signature)pending.current={signature,id:crypto.randomUUID()};
    const id=pending.current.id;
    lock.current=true;setBusy(true);setError('');
    try{
      await api.prepareMap(campaignId,kind,id,parent,value);
      const rows=await api.mapCatalog(campaignId);setMaps(rows);
      setSceneId(parent||id);setFloorId(id);setName('');setFloorName('');pending.current=null;
    }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  }
  return <Dialog wide title="DM maps" onClose={close}><p>Private campaign maps · distances in feet</p>
    <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void add('scene');}}><label className="l-field">Map name<input maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><button className="l-button" disabled={!maps||busy||!name.trim()}>Create map</button></form>
    {!maps&&!error&&<p role="status">Loading maps…</p>}
    {scene&&<><div className="l-toolbar"><label className="l-field">Map<select value={scene.id} onChange={e=>{setSceneId(e.target.value);setFloorId('');}}>{maps.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label className="l-field">Floor<select value={floor?.id||''} onChange={e=>setFloorId(e.target.value)}>{scene.floors.map(f=><option key={f.id} value={f.id}>{f.name} ({f.elevation} ft)</option>)}</select></label></div>
      <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void add('floor');}}><label className="l-field">Floor name<input maxLength={100} value={floorName} onChange={e=>setFloorName(e.target.value)}/></label>
        <label className="l-field">Elevation (ft)<input type="number" required min={-100000} max={100000} step="1" value={elevation} onChange={e=>setElevation(e.target.value)}/></label>
        <button className="l-button" disabled={busy||!floorName.trim()}>Add floor</button></form>
      {floor&&<FloorEditor key={floor.id} api={api} campaignId={campaignId} id={floor.id}/>}</>}
    {error&&<p role="alert">{error} <button type="button" className="l-button" onClick={()=>setRetry(n=>n+1)}>Reload maps</button></p>}</Dialog>;
}
export default function CampaignMaps({api,campaignId}){
  const [open,setOpen]=useState(false);
  return <><button className="l-button" onClick={()=>setOpen(true)}>DM maps</button>{open&&<Maps api={api} campaignId={campaignId} close={()=>setOpen(false)}/>}</>;
}
