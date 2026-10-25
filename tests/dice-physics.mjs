import assert from 'node:assert/strict';
import {Quaternion,Vec3} from 'cannon-es';
import {simulateDice,upperFace} from '../src/lib/dicePhysics.js';
import * as physics from '../src/lib/dicePhysics.js';
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
    assert(s.frames.some(f=>f[i].slice(3,7).some((n,j)=>Math.abs(n-s.frames[0][i][j+3])>.1)),'Orientation must tumble');
    assert(s.frames.slice(20,-1).some((f,j)=>f[i][1]>s.frames[j+19][i][1]+.015),'Dice must bounce after falling');
  }
}
assert(collisions>0,'Multi-die rolls must include rigid-body collisions');
// Separate rolls must resume actual rigid bodies, not start another invisible table.
const oldDie={id:'older-roll:0',sides:6,value:4},newDie={id:'newer-roll:0',sides:6,value:2};
const resting={id:oldDie.id,position:[-.6,.56,0],quaternion:[0,0,0,1],velocity:[0,0,0],angularVelocity:[0,0,0],sleepState:2,radius:.95};
const incoming={id:newDie.id,position:[.9,.7,0],quaternion:[0,0,0,1],velocity:[-8,0,0],angularVelocity:[0,0,0],sleepState:0,radius:.95};
const alone=simulateDice([oldDie],{initialStates:[resting]});
assert.deepEqual(alone.frames[0][0].slice(0,3),resting.position,'An older die must continue from its visible pose');
assert.deepEqual(alone.frames.at(-1)[0].slice(0,3),resting.position,'A sleeping die stays still without an impact');
const impact=simulateDice([oldDie,newDie],{initialStates:[resting,incoming]});
assert(impact.collisionPairs.some(pair=>pair.includes(oldDie.id)&&pair.includes(newDie.id)),'Dice from different rolls make real contact');
assert(impact.frames.slice(0,60).some(f=>Math.abs(f[0][0]-resting.position[0])>.1),'A new impact must wake and move the resting die');
assert(impact.frames.slice(0,60).some(f=>Math.abs(f[0][7])>.1),'The resting die receives a collision impulse');
assert(impact.settled);assert.equal(impact.labels[1][impact.tops[1]],'2');
assert.equal(typeof physics.sampleDiceSimulation,'function','Shared timelines need physical state sampling');
const flight=simulateDice([newDie]);
const carried=physics.sampleDiceSimulation(flight,.2),resume=simulateDice([newDie,oldDie],{initialStates:carried});
assert.deepEqual(resume.frames[0][0].slice(0,3),carried[0].position);
assert.deepEqual(resume.frames[0][0].slice(3,7),carried[0].quaternion);
assert.deepEqual(resume.frames[0][0].slice(7,10),carried[0].velocity,'Continue linear momentum');
assert.deepEqual(resume.frames[0][0].slice(10,13),carried[0].angularVelocity,'Continue angular momentum');
const mixed=Array.from({length:18},(_,i)=>({id:i===0?oldDie.id:'mixed:'+i,sides:[4,6,8,10,12,20][i%6],value:1}));
const crowded=simulateDice(mixed,{aspect:.6,initialStates:[resting]});
assert.equal(crowded.radii[0],.95,'Retained colliders must keep their rendered size');assert.equal(crowded.radii[1],.72);assert(crowded.settled);
for(const [i,pose] of crowded.frames.at(-1).entries())for(const vertex of crowded.meshes[i].vertices){const q=new Quaternion(...pose.slice(3,7)),point=q.vmult(new Vec3(...vertex.map(x=>x*crowded.radii[i])));point.vadd(new Vec3(...pose.slice(0,3)),point);assert(point.y>-.08);assert(Math.abs(point.x)<crowded.halfWidth+.08);assert(Math.abs(point.z)<crowded.halfHeight+.08);}
let burst=[],previous=null;
for(let n=0;n<24;n++){
 const initialStates=previous?physics.sampleDiceSimulation(previous,[.2,.7,1][n%3]):[],before=structuredClone(initialStates);
 burst=[...burst.slice(-17),{id:'continued-burst:'+n,sides:[4,6,8,10,12,20][n%6],value:1}];
 const next=simulateDice(burst,{aspect:.6,initialStates});assert(next.settled,'Continued mixed-die bursts must settle');assert.equal(next.frames[0].length,Math.min(18,n+1));assert.deepEqual(initialStates,before,'Continuing a world must not mutate the sampled source state');
 assert.equal(next.labels.at(-1)[next.tops.at(-1)],'1','The new roll retains its recorded face');previous=next;
}
for(const value of [1,37,90,100]) {
  const dice=visualDice([{id:`percentile:${value}`,expression:'1d100',rolls:[value]}]).dice,s=simulateDice(dice);
  const values=s.labels.map((labels,i)=>Number(labels[s.tops[i]]));assert.equal(values[0]+values[1]||100,value);
}
for(const seed of [1,9,19]) {
  const dice=Array.from({length:18},(_,i)=>({id:`stress:${seed}:${i}`,sides:[4,6,8,10,12,20][i%6],value:i%[4,6,8,10,12,20][i%6]+1}));
  const s=simulateDice(dice,{aspect:.6});assert(s.settled);assert.equal(s.frames[0].length,18);
}
console.log('PASS real cross-roll impulses, waking sleeping dice, continued momentum, mixed collider sizes, tumbling, bounce, containment, recorded new faces, percentile pairs and narrow-screen stress');
