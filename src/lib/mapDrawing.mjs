export const floorWidth=200, floorDepth=150;
export const sketchPointLimit=128;
const samePoint=(a,b)=>a&&a[0]===b[0]&&a[1]===b[1];
const turnArea=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);

export function appendSketchPoint(points,point,freehand){
  if(samePoint(points.at(-1),point))return points;
  if(points.length<sketchPointLimit)return [...points,point];
  if(!freehand)return points;
  // Retain the endpoints and sharp turns as the stroke grows.
  const next=[...points,point];
  let leastArea=Infinity,remove=1;
  for(let i=1;i<next.length-1;i++){
    const area=Math.abs(turnArea(next[i-1],next[i],next[i+1]));
    if(area<leastArea){leastArea=area;remove=i;}
  }
  next.splice(remove,1);
  return next.filter((p,i)=>!i||!samePoint(next[i-1],p));
}

export function validSketch(kind,points){
  if(!['freehand','polygon'].includes(kind)||points.length<(kind==='polygon'?3:2)||points.length>sketchPointLimit)return false;
  if(!points.every((p,i)=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)
    &&p[0]>=0&&p[0]<=floorWidth&&p[1]>=0&&p[1]<=floorDepth&&(!i||!samePoint(points[i-1],p))))return false;
  if(kind==='freehand')return true;
  return !samePoint(points[0],points.at(-1))&&points.reduce((sum,p,i)=>sum+turnArea([0,0],p,points[(i+1)%points.length]),0)!==0;
}

export function roomBounds({x,y,width,depth}){return {x,y,width,depth};}

export function reconcileRoomHistory(history,rooms){
  const revisions=new Map(rooms.map(room=>[room.id,room.revision]));
  const current=entry=>revisions.get(entry.id)===entry.revision;
  return {undo:history.undo.filter(current),redo:history.redo.filter(current)};
}

export function roomHistoryAfterEdit(history,action,before,after){
  if(after.revision!==before.revision+1)return history;
  return historyAfterChange(history,action,before.id,before.revision,after.revision,roomBounds(before),roomBounds(after));
}
export function historyAfterChange(history,action,id,priorRevision,revision,before,after){
  // Only our own confirmed edit advances the expected revision of earlier entries.
  const advance=entries=>entries.filter(e=>e.id!==id||e.revision===priorRevision)
    .map(e=>e.id===id?{...e,revision}:e);
  const undo=advance(history.undo),redo=advance(history.redo);
  if(action==='undo'){if(undo.length)redo.push(undo.pop());}
  else if(action==='redo'){if(redo.length)undo.push(redo.pop());}
  else{
    undo.push({id,before,after,revision});
    return {undo:undo.slice(-32),redo:[]};
  }
  return {undo,redo};
}

export function validRoom({x,y,width,depth}){
  return [x,y,width,depth].every(Number.isInteger)&&x>=0&&y>=0&&width>=5&&depth>=5
    &&x+width<=floorWidth&&y+depth<=floorDepth;
}

export function drawingPoint(clientX,clientY,bounds,snap){
  const step=snap?5:1;
  function coordinate(offset,pixels,feet){
    return Math.min(feet,Math.max(0,Math.round(offset*feet/pixels/step)*step));
  }
  return {x:coordinate(clientX-bounds.left,bounds.width,floorWidth),
    y:coordinate(clientY-bounds.top,bounds.height,floorDepth)};
}

export function validBarrier({x1,y1,x2,y2}){
  function within(value,limit){return Number.isInteger(value)&&value>=0&&value<=limit;}
  return within(x1,floorWidth)&&within(x2,floorWidth)&&within(y1,floorDepth)&&within(y2,floorDepth)
    &&(x1!==x2||y1!==y2);
}
