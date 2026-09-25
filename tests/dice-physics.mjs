import assert from 'node:assert/strict';
import {Quaternion,Vec3} from 'cannon-es';
import {simulateDice,upperFace} from '../src/lib/dicePhysics.js';
import {visualDice} from '../src/lib/presentation.js';

let collisions=0;
for(const aspect of [.6,1.6])for(const sides of [4,6,8,10,12,20,3,37]) {
  const dice=Array.from({length:6},(_,i)=>({id:`physics:${aspect}:${sides}:${i}`,sides,value:(i*3)%sides+1}));
  const before=structuredClone(dice),s=simulateDice(dice,{aspect});
  assert.deepEqual(dice,before,'Physics must never mutate recorded rolls');
  assert(s.settled,`d${sides} must come to rest`);collisions+=s.collisions;
  assert(s.frames.length>60);assert(s.duration<=18);
  for(const [i,die] of dice.entries()) {
    const final=s.frames.at(-1)[i],mesh=s.meshes[i],q=new Quaternion(...final.slice(3));
    assert.equal(upperFace(mesh,final.slice(3)),s.tops[i]);
    assert.equal(Number(s.labels[i][s.tops[i]]),die.value,'Upward face must match the original roll');
    if(sides!==3&&sides!==37)assert.equal(new Set(s.labels[i]).size,sides);
    for(const vertex of mesh.vertices){const point=q.vmult(new Vec3(...vertex.map(x=>x*s.radius)));point.vadd(new Vec3(...final.slice(0,3)),point);assert(point.y>-.08,'Die must rest on the table, not tunnel through it');assert(Math.abs(point.x)<s.halfWidth+.08);assert(Math.abs(point.z)<s.halfHeight+.08);}
    assert(s.frames.some(f=>f[i].slice(3).some((n,j)=>Math.abs(n-s.frames[0][i][j+3])>.1)),'Orientation must tumble');
    assert(s.frames.slice(20,-1).some((f,j)=>f[i][1]>s.frames[j+19][i][1]+.015),'Dice must bounce after falling');
  }
}
assert(collisions>0,'Multi-die rolls must include rigid-body collisions');
for(const value of [1,37,90,100]) {
  const dice=visualDice([{id:`percentile:${value}`,expression:'1d100',rolls:[value]}]).dice,s=simulateDice(dice);
  const values=s.labels.map((labels,i)=>Number(labels[s.tops[i]]));assert.equal(values[0]+values[1]||100,value);
}
for(const seed of [1,9,19]) {
  const dice=Array.from({length:18},(_,i)=>({id:`stress:${seed}:${i}`,sides:[4,6,8,10,12,20][i%6],value:i%[4,6,8,10,12,20][i%6]+1}));
  const s=simulateDice(dice,{aspect:.6});assert(s.settled);assert.equal(s.frames[0].length,18);
}
console.log('PASS real collisions, tumbling, bounce, floor/wall containment, settled faces, percentile pairs, custom dice and 18-die narrow-screen stress');
