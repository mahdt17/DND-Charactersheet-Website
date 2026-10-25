import * as THREE from 'three';
import {simulateDice,sampleDiceSimulation} from './dicePhysics';

const v=values=>new THREE.Vector3(...values);
function makeAtlas(style,labels) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d'),cols=5,cell=canvas.width/cols;
  labels.forEach((label,i)=>{
    const x=i%cols*cell,y=Math.floor(i/cols)*cell;
    ctx.save();ctx.beginPath();ctx.rect(x,y,cell,cell);ctx.clip();
    ctx.fillStyle=style.body;ctx.fillRect(x,y,cell,cell);
    const gradient=ctx.createLinearGradient(x,y,x+cell,y+cell);gradient.addColorStop(0,'#ffffff35');gradient.addColorStop(.45,'#ffffff08');gradient.addColorStop(1,'#00000038');
    ctx.fillStyle=gradient;ctx.fillRect(x,y,cell,cell);
    ctx.strokeStyle=style.edge;ctx.fillStyle=style.edge;
    if(style.pattern==='veins'){
      ctx.globalAlpha=.18;ctx.lineWidth=1.2;
      for(let n=0;n<8;n++){ctx.beginPath();ctx.moveTo(x-15,y+n*35);ctx.bezierCurveTo(x+cell*.3,y+n*35-36,x+cell*.6,y+n*35+20,x+cell+15,y+n*35-52);ctx.stroke();}
    }else if(style.pattern==='stars'){
      for(let n=0;n<58;n++){ctx.globalAlpha=.14+n%5*.08;ctx.beginPath();ctx.arc(x+(Math.sin(n*37+i)*.5+.5)*cell,y+(Math.cos(n*29+i)*.5+.5)*cell,n%7===0?2.4:.85,0,Math.PI*2);ctx.fill();}
    }else{
      ctx.globalAlpha=.25;ctx.lineWidth=1;
      for(let n=0;n<3;n++){ctx.strokeRect(x+14+n*6,y+14+n*6,cell-28-n*12,cell-28-n*12);}
    }
    ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${cell*(labels.length>12?.26:label.length>1?.31:.4)}px Georgia`;
    ctx.shadowColor='#0009';ctx.shadowBlur=3;ctx.shadowOffsetY=2;ctx.fillStyle=style.ink;ctx.fillText(label,x+cell/2,y+cell/2+2);
    if(label==='6'||label==='9'){ctx.font=`bold ${cell*.15}px Georgia`;ctx.fillText('•',x+cell/2,y+cell*.75);}
    ctx.restore();
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return {texture,cols};
}

function makeDie(mesh,labels,style,radius) {
  const atlas=makeAtlas(style,labels),positions=[],normals=[],uvs=[];
  mesh.faces.forEach((face,index)=>{
    const center=v(face.center),normal=v(face.normal),u=v(mesh.vertices[face.ids[0]]).sub(center).normalize(),axis=new THREE.Vector3().crossVectors(normal,u);
    const extent=Math.max(...face.ids.map(i=>v(mesh.vertices[i]).sub(center).length()))*1.06;
    const row=Math.floor(index/atlas.cols),col=index%atlas.cols;
    const push=point=>{const local=point.clone().sub(center);positions.push(...point.clone().multiplyScalar(radius).toArray());normals.push(...normal.toArray());uvs.push((col+.5+local.dot(u)/(2*extent))/atlas.cols,1-(row+.5-local.dot(axis)/(2*extent))/atlas.cols);};
    for(let i=1;i<face.ids.length-1;i++){push(v(mesh.vertices[face.ids[0]]));push(v(mesh.vertices[face.ids[i]]));push(v(mesh.vertices[face.ids[i+1]]));}
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const material=new THREE.MeshPhysicalMaterial({map:atlas.texture,roughness:style.id==='royal-ivory'?.42:.27,metalness:style.id==='emberforge'?.3:.12,clearcoat:.75,clearcoatRoughness:.2});
  const die=new THREE.Mesh(geometry,material);die.castShadow=true;die.receiveShadow=true;
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,10),new THREE.LineBasicMaterial({color:style.edge,transparent:true,opacity:.5}));die.add(edges);
  return die;
}

// One renderer survives every roll and idle period. Only unmounting releases it.
export function createDiceRenderer(canvas,{onPhase,onUnavailable}={}) {
  canvas.dataset.ready='false';
  let renderer;
  const empty={addDice(){},addBatches(){},clear(){},dispose(){}};
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{onUnavailable?.();return empty;}
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);
  camera.position.set(0,40,8);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xeaf2ff,0x32231b,3));
  const key=new THREE.DirectionalLight(0xfff0d5,4.3);key.position.set(-7,18,5);key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-24,right:24,top:18,bottom:-18,near:.1,far:60});key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;scene.add(key);
  const rim=new THREE.DirectionalLight(0xb5d9ff,2.2);rim.position.set(8,8,-12);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.ShadowMaterial({opacity:.29}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
  const a=new THREE.Quaternion(),b=new THREE.Quaternion(),pa=new THREE.Vector3(),pb=new THREE.Vector3();
  let diceEntries=[],playback=null,frame=0,disposed=false,unavailable=false,hiddenAt=null,width=0,height=0,halfWidth=12;
  const disposeObject=object=>object.traverse(child=>{child.geometry?.dispose();const materials=Array.isArray(child.material)?child.material:[child.material];materials.filter(Boolean).forEach(m=>{m.map?.dispose();m.dispose();});});
  function metadata(){
    canvas.dataset.diceIds=diceEntries.map(e=>e.die.id).join(',');
    canvas.dataset.values=diceEntries.map(e=>e.die.value).join(',');
    // Older dice keep their printed faces even if a later impact turns them over.
    canvas.dataset.topValues=diceEntries.map((e,i)=>e.labels[playback.simulation.tops[i]]).join(',');
    canvas.dataset.collisions=String(playback?.simulation.collisions||0);
    canvas.dataset.collisionPairs=JSON.stringify(playback?.simulation.collisionPairs||[]);
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2||rect.width===width&&rect.height===height)return;
    width=rect.width;height=rect.height;
    renderer.setSize(width,height,false);
    if(!diceEntries.length)halfWidth=7.5*Math.max(.6,Math.min(2.5,width/height));
    const aspect=width/height,vertical=Math.max(9.5,(halfWidth+1.5)/aspect);
    camera.left=-vertical*aspect;camera.right=vertical*aspect;camera.top=vertical;camera.bottom=-vertical;camera.updateProjectionMatrix();
    // Paint immediately after resizing; never expose the cleared drawing buffer.
    renderer.render(scene,camera);
  }
  function wake(){if(!frame&&!disposed&&!unavailable)frame=requestAnimationFrame(draw);}
  function syncPause(now){
    if(document.hidden||innerWidth<120||innerHeight<120){if(hiddenAt===null)hiddenAt=now;return true;}
    if(hiddenAt!==null){if(playback)playback.start+=now-hiddenAt;hiddenAt=null;}return false;
  }
  function draw(now){
    frame=0;if(disposed||unavailable)return;
    if(syncPause(now)){wake();return;}
    if(!playback)return;
    const progress=Math.min(1,Math.max(0,(now-playback.start)/playback.duration)),index=progress*(playback.simulation.frames.length-1),lo=Math.floor(index),hi=Math.min(lo+1,playback.simulation.frames.length-1),fraction=index-lo;
    diceEntries.forEach(({object},i)=>{const from=playback.simulation.frames[lo][i],to=playback.simulation.frames[hi][i];pa.fromArray(from);pb.fromArray(to);object.position.copy(pa).lerp(pb,fraction);a.fromArray(from,3);b.fromArray(to,3);object.quaternion.copy(a).slerp(b,fraction);});
    renderer.render(scene,camera);canvas.dataset.ready='true';
    const phase=progress<1?'rolling':'settled';if(canvas.dataset.phase!==phase){canvas.dataset.phase=phase;onPhase?.(phase);}
    if(progress<1)wake();
  }
  function addBatches(batches){
    if(disposed||unavailable)return;
    const incoming=batches.flatMap(({dice,style})=>dice.map(die=>({die,style}))).slice(-18);if(!incoming.length)return;
    resize();
    const now=performance.now();syncPause(now);
    const initialStates=playback?sampleDiceSimulation(playback.simulation,((hiddenAt??now)-playback.start)/playback.duration):[];
    // Retain only bodies that still have a visible mesh; queued bursts simulate once.
    const remove=Math.max(0,diceEntries.length+incoming.length-18);
    diceEntries.slice(0,remove).forEach(({object})=>{scene.remove(object);disposeObject(object);});
    const retained=diceEntries.slice(remove),next=[...retained,...incoming],simulation=simulateDice(next.map(e=>e.die),{aspect:halfWidth/7.5,initialStates});
    diceEntries=next.map((entry,i)=>{
      if(entry.object)return entry;
      const labels=simulation.labels[i],radius=simulation.radii[i],object=makeDie(simulation.meshes[i],labels,entry.style,radius);scene.add(object);return {...entry,labels,radius,object};
    });
    playback={simulation,start:performance.now(),duration:Math.max(2100,Math.min(3800,simulation.duration*1000))};
    if(hiddenAt!==null)hiddenAt=playback.start;
    metadata();
    canvas.dataset.engine='webgl-physics';canvas.dataset.phase='rolling';onPhase?.('rolling');wake();
  }
  const addDice=(dice,style)=>addBatches([{dice,style}]);
  function clear(){
    cancelAnimationFrame(frame);frame=0;hiddenAt=null;
    diceEntries.forEach(({object})=>{scene.remove(object);disposeObject(object);});diceEntries=[];playback=null;metadata();
    canvas.dataset.ready='false';canvas.dataset.phase='idle';
    if(!unavailable)renderer.render(scene,camera);
  }
  const lost=e=>{e.preventDefault();unavailable=true;cancelAnimationFrame(frame);frame=0;canvas.dataset.ready='false';onUnavailable?.();};
  canvas.addEventListener('webglcontextlost',lost);
  resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
  return {addDice,addBatches,clear,dispose(){
    if(disposed)return;disposed=true;clear();observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);
    disposeObject(scene);key.shadow.dispose();renderer.dispose();renderer.forceContextLoss();
  }};
}
