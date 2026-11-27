export const floorWidth=200, floorDepth=150;

export function roomBounds({x,y,width,depth}){return {x,y,width,depth};}

export function reconcileRoomHistory(history,rooms){
  const revisions=new Map(rooms.map(room=>[room.id,room.revision]));
  const current=entry=>revisions.get(entry.id)===entry.revision;
  return {undo:history.undo.filter(current),redo:history.redo.filter(current)};
}

export function roomHistoryAfterEdit(history,action,before,after){
  if(after.revision!==before.revision+1)return history;
  // Only our own confirmed edit advances the expected revision of earlier entries.
  const advance=entries=>entries.filter(e=>e.id!==before.id||e.revision===before.revision)
    .map(e=>e.id===before.id?{...e,revision:after.revision}:e);
  const undo=advance(history.undo),redo=advance(history.redo);
  if(action==='undo'){if(undo.length)redo.push(undo.pop());}
  else if(action==='redo'){if(redo.length)undo.push(redo.pop());}
  else{
    undo.push({id:before.id,before:roomBounds(before),after:roomBounds(after),revision:after.revision});
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
