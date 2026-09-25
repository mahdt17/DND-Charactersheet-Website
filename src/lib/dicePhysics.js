import {World,Body,Plane,Vec3,Quaternion,ConvexPolyhedron,Material,ContactMaterial} from 'cannon-es';
import {diceMesh,dot} from './diceGeometry.js';

export const STEP=1/60;
const hash=text=>[...text].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const snapshot=bodies=>bodies.map(b=>[b.position.x,b.position.y,b.position.z,b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w]);

export function upperFace(mesh,rotation) {
  const q=new Quaternion(...rotation),normal=new Vec3();
  // Looking down at the table; use the camera-facing normal to break d4 ties.
  let best=-Infinity,index=0;
  mesh.faces.forEach((face,i)=>{q.vmult(new Vec3(...face.normal),normal);const score=normal.y+normal.z*.001;if(score>best){best=score;index=i;}});
  return index;
}

export function faceValues(die,mesh,top) {
  const start=die.percentile?die.value+1:die.value;
  const values=mesh.faces.map((_,i)=>((start+i-top-1)%die.sides+die.sides)%die.sides+1);
  // Keep opposite faces complementary on the centrally symmetric solids.
  if([6,8,12,20].includes(die.sides)) {
    const remaining=new Set(Array.from({length:die.sides},(_,i)=>i+1));values.fill(null);
    for(const index of [top,...mesh.faces.map((_,i)=>i).filter(i=>i!==top)]) {
      if(values[index]!==null)continue;
      const value=index===top?die.value:Math.min(...remaining);
      const opposite=mesh.faces.findIndex(f=>dot(f.normal,mesh.faces[index].normal)<-.999);
      values[index]=value;remaining.delete(value);
      if(opposite>=0){values[opposite]=die.sides+1-value;remaining.delete(values[opposite]);}
    }
  }
  return values.map(n=>die.percentile?(die.percentile==='tens'?`${(n-1)%10}0`:String((n-1)%10)):String(n));
}

// Simulate real rigid bodies first, then play the recorded transforms. Label
// assignment happens before the first rendered frame so gameplay remains the
// existing single source of randomness and faces never change during a roll.
export function simulateDice(dice,{aspect=1.6}={}) {
  aspect=Math.max(.6,Math.min(2.5,aspect));
  const halfHeight=7.5,halfWidth=halfHeight*aspect;
  const world=new World({gravity:new Vec3(0,-38,0),allowSleep:true});
  world.solver.iterations=18;
  const material=new Material('dice'),table=new Material('table');
  world.addContactMaterial(new ContactMaterial(material,table,{friction:.32,restitution:.4}));
  world.addContactMaterial(new ContactMaterial(material,material,{friction:.18,restitution:.48}));
  function plane(position,rotation){const b=new Body({mass:0,material:table,shape:new Plane()});b.position.set(...position);b.quaternion.setFromEuler(...rotation);world.addBody(b);}
  plane([0,0,0],[-Math.PI/2,0,0]);
  plane([-halfWidth,0,0],[0,Math.PI/2,0]);plane([halfWidth,0,0],[0,-Math.PI/2,0]);
  plane([0,0,-halfHeight],[0,0,0]);plane([0,0,halfHeight],[0,Math.PI,0]);
  const rng=random(hash(dice.map(d=>d.id).join('|'))),radius=dice.length>10?.72:.95;
  const meshes=dice.map(d=>diceMesh(d.sides)||diceMesh(6));
  let collisions=0;
  const bodies=meshes.map((mesh,i)=>{
    const shape=new ConvexPolyhedron({vertices:mesh.vertices.map(v=>new Vec3(...v.map(x=>x*radius))),faces:mesh.faces.map(f=>[...f.ids])});
    const body=new Body({mass:1,material,shape,linearDamping:.24,angularDamping:.25,sleepSpeedLimit:.25,sleepTimeLimit:.4});
    const columns=Math.max(2,Math.floor((halfWidth*2-3)/(radius*2.3))),row=Math.floor(i/columns);
    body.position.set(-halfWidth+1.6+(i%columns)*radius*2.3,3.3+row*2.3,-halfHeight+1.4+row*.15);
    body.quaternion.setFromEuler(rng()*Math.PI*2,rng()*Math.PI*2,rng()*Math.PI*2);
    body.velocity.set(3+rng()*7,1+rng()*3,10+rng()*6);
    body.angularVelocity.set((rng()-.5)*22,(rng()-.5)*22,(rng()-.5)*22);
    body.addEventListener('collide',e=>{if(e.body.mass>0)collisions++;});
    world.addBody(body);return body;
  });
  const frames=[snapshot(bodies)];
  for(let i=0;i<1080;i++){
    if(i===240)bodies.forEach(b=>{b.linearDamping=.6;b.angularDamping=.6;b.sleepSpeedLimit=.65;});
    world.step(STEP);frames.push(snapshot(bodies));
    if(i>60&&bodies.every(b=>b.sleepState===Body.SLEEPING))break;
  }
  const final=frames.at(-1),tops=meshes.map((mesh,i)=>upperFace(mesh,final[i].slice(3)));
  return {frames,meshes,radius,halfWidth,halfHeight,collisions,tops,settled:bodies.every(b=>b.sleepState===Body.SLEEPING),
    labels:meshes.map((mesh,i)=>faceValues(dice[i],mesh,tops[i])),duration:(frames.length-1)*STEP};
}
