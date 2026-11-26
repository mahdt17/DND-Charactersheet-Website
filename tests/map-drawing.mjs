import assert from 'node:assert/strict';
import test from 'node:test';
import {drawingPoint, validBarrier} from '../src/lib/mapDrawing.mjs';

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
