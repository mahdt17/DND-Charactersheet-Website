import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import Dialog from './Dialog';
import {drawingPoint,floorWidth as width,floorDepth as depth,validBarrier,validRoom,roomBounds,roomHistoryAfterEdit,reconcileRoomHistory} from './lib/mapDrawing.mjs';

const passageNames={stairs:'Stairs',ladder:'Ladder',pit:'Pit'};
const emptyRoom={x:0,y:0,width:20,depth:20};
const emptyBarrier={x1:0,y1:0,x2:0,y2:0};
function drawBarrier(ctx,barrier,preview=false){
  ctx.save();
  ctx.lineWidth=barrier.kind==='wall'?1.2:.8;
  if(preview){ctx.globalAlpha=.6;ctx.setLineDash([1,1]);}
  else if(barrier.open)ctx.setLineDash([1,2]);
  ctx.beginPath();ctx.moveTo(barrier.x1,barrier.y1);ctx.lineTo(barrier.x2,barrier.y2);ctx.stroke();
  if(barrier.kind==='door'){
    for(const [x,y] of [[barrier.x1,barrier.y1],[barrier.x2,barrier.y2]])ctx.fillRect(x-.75,y-.75,1.5,1.5);
  }
  ctx.restore();
}
function draw(canvas,rooms,grid,corner,ruler,passages,floorId,barriers,draft,roomPreview){
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
  ctx.fillStyle=colors.color;ctx.strokeStyle=colors.color;
  if(roomPreview&&validRoom(roomPreview)){
    ctx.save();ctx.lineWidth=.8;ctx.setLineDash([2,1]);
    ctx.strokeRect(roomPreview.x,roomPreview.y,roomPreview.width,roomPreview.depth);ctx.restore();
  }
  for(const barrier of barriers)drawBarrier(ctx,barrier);
  if(draft&&validBarrier(draft))drawBarrier(ctx,draft,true);
  ctx.font='3px sans-serif';ctx.textBaseline='middle';
  for(const p of passages){
    const from=p.fromFloor===floorId,x=from?p.fromX:p.toX,y=from?p.fromY:p.toY;
    ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fill();
    ctx.fillText(passageNames[p.kind],x+2,y);
  }
  if(corner){ctx.fillStyle=colors.color;ctx.beginPath();ctx.arc(corner.x,corner.y,1.2,0,Math.PI*2);ctx.fill();}
  if(ruler){
    const {from,to}=ruler;
    ctx.strokeStyle=colors.color;ctx.lineWidth=.7;ctx.setLineDash([2,1]);
    ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.setLineDash([]);
    for(const point of [from,to]){ctx.beginPath();ctx.arc(point.x,point.y,1.3,0,Math.PI*2);ctx.fillStyle=colors.color;ctx.fill();}
  }
  ctx.restore();
}
const defaultView={sceneId:'',floorId:'',grid:true,snap:false,zoom:1};
function readView(key){
  try{
    const saved=JSON.parse(localStorage.getItem(key))||{};
    return {
      sceneId:typeof saved.sceneId==='string'?saved.sceneId:'',
      floorId:typeof saved.floorId==='string'?saved.floorId:'',
      grid:saved.grid!==false,snap:saved.snap===true,
      zoom:[1,1.5,2,3].includes(saved.zoom)?saved.zoom:1
    };
  }catch{return defaultView;}
}
function FloorEditor({api,campaignId,id,floors,view,updateView}){
  const otherFloors=floors.filter(f=>f.id!==id);
  const [passages,setPassages]=useState([]);
  const [passage,setPassage]=useState(()=>({kind:'stairs',toFloor:otherFloors[0]?.id||'',fromX:0,fromY:0,toX:0,toY:0}));
  const {grid,snap,zoom}=view;
  const [rooms,setRooms]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [room,setRoom]=useState(emptyRoom),[corner,setCorner]=useState(null),[retry,setRetry]=useState(0);
  const [editing,setEditing]=useState(null);
  const [history,setHistory]=useState({undo:[],redo:[]});
  const [refreshing,setRefreshing]=useState(false);
  function resetRoom(){setEditing(null);setRoom(emptyRoom);setCorner(null);}
  function editRoom(r){
    setEditing(r);setRoom(roomBounds(r));
    setTool('room');setCorner(null);setError('');
  }
  const [tool,setTool]=useState('room');
  const [barriers,setBarriers]=useState([]),[segment,setSegment]=useState(emptyBarrier);
  const drawingBarrier=tool==='wall'||tool==='door';
  const [ruler,setRuler]=useState({from:{x:0,y:0},to:{x:0,y:0}});
  const viewport=useRef(null),viewCenter=useRef(null);
  const canvas=useRef(null),pending=useRef(null),lock=useRef(false),sequence=useRef(0);
  useEffect(()=>{
    let active=true;
    const request=++sequence.current;
    api.mapFloor(campaignId,id).then(floor=>{if(active&&request===sequence.current){if(!floor)throw Error('Floor unavailable');setRooms(floor.rooms);setPassages(floor.passages||[]);setBarriers(floor.barriers||[]);setHistory(h=>reconcileRoomHistory(h,floor.rooms));setError('');}}).catch(e=>{if(active&&request===sequence.current)setError(e.message);}).finally(()=>{if(active)setRefreshing(false);});
    return ()=>{active=false;};
  },[api,campaignId,id,retry]);
  useEffect(()=>{
    if(canvas.current)draw(canvas.current,rooms||[],grid,corner,tool==='measure'?ruler:null,passages,id,barriers,drawingBarrier?{...segment,kind:tool}:null,editing?room:null);
  },[rooms,grid,corner,tool,ruler,passages,id,barriers,drawingBarrier,segment,editing,room]);
  useLayoutEffect(()=>{
    const view=viewport.current,center=viewCenter.current;
    if(!view||!center)return;
    view.scrollLeft=center.x*view.scrollWidth-view.clientWidth/2;
    view.scrollTop=center.y*view.scrollHeight-view.clientHeight/2;
    viewCenter.current=null;
  },[zoom]);
  function changeZoom(next){
    const view=viewport.current;
    if(view)viewCenter.current={x:(view.scrollLeft+view.clientWidth/2)/view.scrollWidth,y:(view.scrollTop+view.clientHeight/2)/view.scrollHeight};
    updateView({zoom:next});
  }
  function point(event){
    if(lock.current)return;
    const {x,y}=drawingPoint(event.clientX,event.clientY,event.currentTarget.getBoundingClientRect(),snap);
    if(editing){setRoom(r=>({...r,x,y}));return;}
    if(tool==='passage'){setPassage(current=>({...current,fromX:x,fromY:y}));return;}
    if(!corner){
      setCorner({x,y});
      if(drawingBarrier)setSegment({x1:x,y1:y,x2:x,y2:y});
      if(tool==='measure')setRuler({from:{x,y},to:{x,y}});
      return;
    }
    if(tool==='measure'){setRuler({from:corner,to:{x,y}});setCorner(null);return;}
    if(drawingBarrier){setSegment({x1:corner.x,y1:corner.y,x2:x,y2:y});setCorner(null);return;}
    setRoom({x:Math.min(x,corner.x),y:Math.min(y,corner.y),width:Math.abs(x-corner.x),depth:Math.abs(y-corner.y)});setCorner(null);
  }
  function replayRoomEdit(action){
    const entry=history[action].at(-1);
    const current=rooms.find(r=>r.id===entry.id&&r.revision===entry.revision);
    if(!current)return;
    const bounds=action==='undo'?entry.before:entry.after;
    void change('edit_room',current,{...bounds,revision:entry.revision},action);
  }
  async function change(kind,existing,value,action='edit'){
    if(lock.current)return;
    const payload=kind==='room'?Object.fromEntries(Object.entries(room).map(([k,v])=>[k,Number(v)])):(value||{});
    const signature=JSON.stringify([kind,existing?.id,payload]);
    if(pending.current?.signature!==signature)pending.current={signature,id:existing?.id||crypto.randomUUID()};
    lock.current=true;++sequence.current;setBusy(true);setError('');
    try{
      await api.prepareMap(campaignId,kind,pending.current.id,id,payload);
      const floor=await api.mapFloor(campaignId,id);
      if(!floor)throw Error('Floor unavailable');
      setHistory(previous=>{
        let next=previous;
        if(kind==='edit_room'){
          const saved=floor.rooms.find(r=>r.id===existing.id);
          if(saved&&Object.keys(emptyRoom).every(key=>saved[key]===payload[key])){
            next=roomHistoryAfterEdit(previous,action,existing,saved);
          }
        }
        return reconcileRoomHistory(next,floor.rooms);
      });
      setRooms(floor.rooms);setPassages(floor.passages||[]);setBarriers(floor.barriers||[]);pending.current=null;
      if(action==='edit')setCorner(null);
      if(kind==='barrier')setSegment(emptyBarrier);
      if(editing&&(kind==='edit_room'||(kind==='erase'&&editing.id===existing?.id)))resetRoom();
    }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  }
  return <section aria-label="Floor editor"><div className="l-toolbar"><strong>200 × 150 ft</strong>
    <label><input type="checkbox" checked={grid} onChange={e=>updateView({grid:e.target.checked})}/> Show 5-ft grid</label>
    <button type="button" className="l-button" disabled={busy||refreshing} onClick={()=>{if(editing)resetRoom();setRefreshing(true);setRetry(n=>n+1);}}>Refresh floor</button></div>
    {rooms!==null&&<><div className="l-toolbar">
      {['undo','redo'].map(action=><button type="button" key={action} className="l-button"
        disabled={busy||refreshing||!!editing||!history[action].length} onClick={()=>replayRoomEdit(action)}>
        {action==='undo'?'Undo room edit':'Redo room edit'}</button>)}
      <label className="l-field">Tool<select aria-label="Map tool" disabled={busy} value={tool} onChange={e=>{if(editing)resetRoom();setTool(e.target.value);setCorner(null);setSegment(emptyBarrier);}}>
        <option value="room">Draw room</option><option value="wall">Draw wall</option><option value="door">Draw door</option><option value="measure">Measure distance</option>{otherFloors.length>0&&<option value="passage">Connect floors</option>}</select></label>
      <label className="l-field">Zoom<select aria-label="Map zoom" value={zoom} onChange={e=>changeZoom(Number(e.target.value))}>
        {[1,1.5,2,3].map(z=><option key={z} value={z}>{z*100}%</option>)}</select></label>
      <label><input type="checkbox" checked={snap} onChange={e=>updateView({snap:e.target.checked})}/> Snap clicks to 5 ft</label></div>
      <div className="map-viewport" ref={viewport} role="region" aria-label="Scrollable floor map" tabIndex={0}>
        <canvas ref={canvas} width={800} height={600} style={{width:zoom*100+'%'}} className="map-drawing-board" aria-label="Floor drawing" aria-disabled={busy} onClick={point}/>
      </div>
      {drawingBarrier?<form onSubmit={e=>{e.preventDefault();void change('barrier',null,{kind:tool,...segment});}}>
        <fieldset disabled={busy}><legend>{tool==='door'?'Door':'Wall'} endpoints</legend>
          <p>{corner?'Choose the second endpoint.':'Choose two points on the floor or enter their coordinates in feet.'}</p>
          <div className="l-toolbar">{Object.entries({x1:'First X',y1:'First Y',x2:'Last X',y2:'Last Y'}).map(([key,label])=>
            <label className="l-field" key={key}>{label} (ft)<input type="number" required min="0" max={key.startsWith('x')?width:depth}
              value={segment[key]} onChange={e=>{setCorner(null);setSegment({...segment,[key]:e.target.value===''?'':Number(e.target.value)});}}/></label>)}
            <button className="l-button primary" disabled={!validBarrier(segment)}>Add {tool}</button>
          </div>
        </fieldset></form>:tool==='measure'?<fieldset><legend>Distance ruler</legend>
        <p>{corner?'Choose the end point.':'Choose two points on the map or enter coordinates in feet.'}</p>
        <div className="l-toolbar">{['from','to'].map(end=>['x','y'].map(axis=><label key={end+axis} className="l-field">
          {(end==='from'?'Start ':'End ')+axis.toUpperCase()+' (ft)'}<input type="number" min={0} max={axis==='x'?width:depth} value={ruler[end][axis]}
            onChange={e=>{const n=Math.min(axis==='x'?width:depth,Math.max(0,Number(e.target.value)));setCorner(null);setRuler({...ruler,[end]:{...ruler[end],[axis]:n}});}}/>
        </label>))}</div>
        <output aria-label="Straight-line distance">{Number(Math.hypot(ruler.to.x-ruler.from.x,ruler.to.y-ruler.from.y).toFixed(1))} ft</output>
      </fieldset>:tool==='passage'?<form onSubmit={e=>{e.preventDefault();void change('passage',null,passage);}}>
        <fieldset><legend>Floor passage</legend><p>Click the map to set the entrance or enter both endpoints in feet.</p>
          <div className="l-toolbar"><label className="l-field">Kind<select aria-label="Passage kind" value={passage.kind} onChange={e=>setPassage({...passage,kind:e.target.value})}>
            {Object.entries(passageNames).map(([kind,name])=><option key={kind} value={kind}>{name}</option>)}</select></label>
            <label className="l-field">Destination<select aria-label="Destination floor" value={passage.toFloor} onChange={e=>setPassage({...passage,toFloor:e.target.value})}>
              {otherFloors.map(f=><option key={f.id} value={f.id}>{f.name} ({f.elevation} ft)</option>)}</select></label>
          </div><div className="l-toolbar">{Object.entries({fromX:'Entrance X',fromY:'Entrance Y',toX:'Exit X',toY:'Exit Y'}).map(([key,label])=><label className="l-field" key={key}>
            {label} (ft)<input type="number" required min="0" max={key.endsWith('X')?width:depth} value={passage[key]}
              onChange={e=>setPassage({...passage,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}</div>
          {passage.kind==='pit'&&<p>A pit leads one way to a lower floor.</p>}
          <button className="l-button primary" disabled={busy||!passage.toFloor}>Add passage</button>
        </fieldset></form>:<><p>{editing?'Click to move the top-left corner, or edit the position and size below.':corner?'Choose the opposite corner.':'Choose two corners or enter room dimensions in feet.'}</p>
      <form className="l-toolbar" onSubmit={e=>{e.preventDefault();if(editing)void change('edit_room',editing,{...room,revision:editing.revision});else void change('room');}}>
        {Object.entries({x:'Left',y:'Top',width:'Width',depth:'Depth'}).map(([key,label])=><label className="l-field" key={key}>{label} (ft)<input type="number" disabled={busy} required value={room[key]} onChange={e=>setRoom({...room,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}
        <button className="l-button primary" disabled={busy||!validRoom(room)}>{editing?'Save room':'Draw room'}</button>
        {editing&&<button type="button" className="l-button" disabled={busy} onClick={resetRoom}>Cancel room edit</button>}</form></>}
      {!!barriers.length&&<ul aria-label="Walls and doors on floor">{barriers.map(b=><li key={b.id}>
        <span>{b.kind==='door'?'Door':'Wall'} ({b.x1}, {b.y1}) to ({b.x2}, {b.y2})</span>{' '}
        {b.kind==='door'&&<>{b.open?'Open':'Closed'}{' '}
          <button type="button" className="l-button" disabled={busy} onClick={()=>change('door_state',b,{open:!b.open,revision:b.revision})}>{b.open?'Close door':'Open door'}</button>{' '}</>}
        <button type="button" className="l-button" disabled={busy} onClick={()=>change('erase_barrier',b)}>Erase {b.kind}</button>
      </li>)}</ul>}
      {!!passages.length&&<ul aria-label="Passages on floor">{passages.map(p=>{
        const from=p.fromFloor===id,other=floors.find(f=>f.id===(from?p.toFloor:p.fromFloor));
        if(!other)return null;
        return <li key={p.id}><strong>{passageNames[p.kind]}</strong>{' at ('}{from?p.fromX:p.toX}, {from?p.fromY:p.toY}) · {p.kind==='pit'?(from?'Drops to ':'Drops from '):'Connects to '}{other.name} ({other.elevation} ft){' '}
          <button type="button" className="l-button" onClick={()=>updateView({floorId:other.id})}>View {other.name}</button>{' '}
          <button type="button" className="l-button" disabled={busy} onClick={()=>change('erase_passage',p)}>Remove passage</button></li>;
      })}</ul>}
      {!!rooms.length&&<ul aria-label="Rooms on floor">{rooms.map(r=><li key={r.id}>{r.width} × {r.depth} ft at ({r.x}, {r.y}){' '}
        <button type="button" className="l-button" disabled={busy||refreshing} aria-label={'Edit room at '+r.x+', '+r.y} onClick={()=>editRoom(r)}>Edit</button>{' '}
        <button type="button" className="l-button" disabled={busy||refreshing} aria-label={'Erase room at '+r.x+', '+r.y} onClick={()=>change('erase',r,{revision:r.revision})}>Erase</button></li>)}</ul>}</>}
    {error&&<p role="alert">{error}</p>}</section>;
}
function Maps({api,campaignId,close}){
  const preferenceKey='ledger:dm-map-view:'+api.userId+':'+campaignId;
  const [view,setView]=useState(()=>readView(preferenceKey)),[maps,setMaps]=useState(null);
  const {sceneId,floorId}=view;
  function updateView(change){setView(current=>({...current,...change}));}
  useEffect(()=>{
    try{localStorage.setItem(preferenceKey,JSON.stringify(view));}catch{/* Device storage is optional. */}
  },[preferenceKey,view]);
  const [name,setName]=useState(''),[floorName,setFloorName]=useState(''),[elevation,setElevation]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const pending=useRef(null),lock=useRef(false);
  useEffect(()=>{
    let active=true;
    api.mapCatalog(campaignId).then(rows=>{if(active){setMaps(rows);setError('');}}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[api,campaignId,retry]);
  const scene=maps?.find(m=>m.id===sceneId)||maps?.[0],floor=scene?.floors.find(f=>f.id===floorId)||scene?.floors.find(f=>f.id===scene.id)||scene?.floors[0];
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
      updateView({sceneId:parent||id,floorId:id});setName('');setFloorName('');pending.current=null;
    }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
  }
  return <Dialog wide title="DM maps" onClose={close}><p>Private campaign maps · distances in feet</p>
    <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void add('scene');}}><label className="l-field">Map name<input maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><button className="l-button" disabled={!maps||busy||!name.trim()}>Create map</button></form>
    {!maps&&!error&&<p role="status">Loading maps…</p>}
    {scene&&<><div className="l-toolbar"><div className="l-field"><label htmlFor="campaign-map-select">Map</label><select id="campaign-map-select" value={scene.id} onChange={e=>updateView({sceneId:e.target.value,floorId:''})}>{maps.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div className="l-field"><label htmlFor="campaign-floor-select">Floor</label><select id="campaign-floor-select" value={floor?.id||''} onChange={e=>updateView({floorId:e.target.value})}>{scene.floors.map(f=><option key={f.id} value={f.id}>{f.name} ({f.elevation} ft)</option>)}</select></div></div>
      <form className="l-toolbar" onSubmit={e=>{e.preventDefault();void add('floor');}}><label className="l-field">Floor name<input maxLength={100} value={floorName} onChange={e=>setFloorName(e.target.value)}/></label>
        <label className="l-field">Elevation (ft)<input type="number" required min={-100000} max={100000} step="1" value={elevation} onChange={e=>setElevation(e.target.value)}/></label>
        <button className="l-button" disabled={busy||!floorName.trim()}>Add floor</button></form>
      {floor&&<FloorEditor key={floor.id} api={api} campaignId={campaignId} id={floor.id} floors={scene.floors} view={view} updateView={updateView}/>}</>}
    {error&&<p role="alert">{error} <button type="button" className="l-button" onClick={()=>setRetry(n=>n+1)}>Reload maps</button></p>}</Dialog>;
}
export default function CampaignMaps({api,campaignId}){
  const [open,setOpen]=useState(false);
  return <><button className="l-button" onClick={()=>setOpen(true)}>DM maps</button>{open&&<Maps key={api.userId+':'+campaignId} api={api} campaignId={campaignId} close={()=>setOpen(false)}/>}</>;
}
