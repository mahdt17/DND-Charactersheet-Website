import assert from 'node:assert/strict';
import {appendSketchPoint,validSketch} from '../src/lib/mapDrawing.mjs';

test('strokes keep both ends within a bounded point budget and polygons enclose area',()=>{
  let points=[];
  for(let i=0;i<=200;i++)points=appendSketchPoint(points,[i,i%7],true);
  assert.deepEqual(points[0],[0,0]);assert.deepEqual(points.at(-1),[200,4]);
  assert.equal(points.length,128);
  assert.equal(appendSketchPoint(points,[200,4],true),points);
  assert(validSketch('freehand',points));
  assert(validSketch('polygon',[[0,0],[20,0],[10,5],[0,10]]));
  assert(!validSketch('polygon',[[0,0],[5,5],[10,10]]));
  assert(!validSketch('polygon',[[0,0],[10,0],[10,5],[0,0]]));
  assert(!validSketch('freehand',[[0,0],[201,0]]));
});
import test from 'node:test';
import {drawingPoint, validBarrier, validRoom, roomHistoryAfterEdit, reconcileRoomHistory} from '../src/lib/mapDrawing.mjs';

test('room undo and redo follow committed edits across rooms and successive revisions',()=>{
  const a={id:'a',x:0,y:0,width:20,depth:20,revision:0}, b={...a,id:'b'};
  let history={undo:[],redo:[]};
  const moved={...a,x:5,revision:1},resized={...moved,width:30,revision:2};
  history=roomHistoryAfterEdit(history,'edit',a,moved);
  history=roomHistoryAfterEdit(history,'edit',b,{...b,y:10,revision:1});
  history=roomHistoryAfterEdit(history,'edit',moved,resized);
  history=roomHistoryAfterEdit(history,'undo',resized,{...moved,revision:3});
  assert.equal(history.redo.at(-1).after.width,30);
  assert.equal(history.undo[0].revision,3);
  assert.equal(history.undo.at(-1).id,'b');
  history=roomHistoryAfterEdit(history,'redo',{...moved,revision:3},{...resized,revision:4});
  assert.equal(history.undo.at(-1).revision,4);
  const external={...resized,revision:5};
  history=reconcileRoomHistory(history,[external,{...b,y:10,revision:1}]);
  assert.deepEqual(history.undo.map(row=>row.id),['b']);
  assert.deepEqual(reconcileRoomHistory(history,[]),{undo:[],redo:[]});
});

test('a new room edit clears redo, a no-op preserves it, and history is bounded',()=>{
  let room={id:'one',x:0,y:0,width:20,depth:20,revision:0},history={undo:[],redo:[]};
  for(let n=1;n<=40;n++){
    const next={...room,x:n,revision:n};
    history=roomHistoryAfterEdit(history,'edit',room,next);
    room=next;
  }
  assert.equal(history.undo.length,32);
  const previous={...room,x:39,revision:41};
  history=roomHistoryAfterEdit(history,'undo',room,previous);
  assert.equal(roomHistoryAfterEdit(history,'edit',previous,previous),history);
  history=roomHistoryAfterEdit(history,'edit',previous,{...previous,x:60,revision:42});
  assert.equal(history.redo.length,0);
});

test('edited rooms fit the floor and retain a five-foot minimum',()=>{
  const edge={x:195,y:145,width:5,depth:5};
  assert.equal(validRoom(edge),true);
  for(const change of [{x:-1},{y:''},{width:6},{depth:4},{width:5.5}]){
    assert.equal(validRoom({...edge,...change}),false);
  }
});

test('canvas clicks use the zoomed bounds and optional five-foot snap',()=>{
  const bounds={left:40,top:-60,width:1600,height:1200};
  assert.deepEqual(drawingPoint(96,20,bounds,false),{x:7,y:10});
  assert.deepEqual(drawingPoint(96,20,bounds,true),{x:5,y:10});
  assert.deepEqual(drawingPoint(2000,-100,bounds,true),{x:200,y:0});
});

test('horizontal, diagonal and vertical barriers accept whole feet including floor edges',()=>{
  for(const [x1,y1,x2,y2] of [[0,0,200,150],[200,0,200,150],[0,150,200,150]]){
    assert.equal(validBarrier({x1,y1,x2,y2}),true);
  }
  const valid={x1:0,y1:0,x2:5,y2:5};
  for(const invalid of [{x2:0,y2:0},{x2:201},{y1:-1},{y2:151},{x1:2.5},{x1:''},{y2:null}]){
    assert.equal(validBarrier({...valid,...invalid}),false);
  }
});
