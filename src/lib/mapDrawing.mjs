export const floorWidth=200, floorDepth=150;

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
