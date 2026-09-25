import * as THREE from 'three';
import {simulateDice} from './dicePhysics';

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

// The heavyweight WebGL and physics modules load only when a roll is animated.
export function createDiceRenderer(canvas,dice,style,{onPhase,onFinish,onUnavailable}={}) {
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{onUnavailable?.();return()=>{};}
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
  const initial=canvas.getBoundingClientRect(),simulation=simulateDice(dice,{aspect:initial.width/Math.max(1,initial.height)});
  canvas.dataset.engine='webgl-physics';canvas.dataset.collisions=String(simulation.collisions);
  canvas.dataset.topValues=simulation.labels.map((labels,i)=>labels[simulation.tops[i]]).join(',');
  const objects=simulation.meshes.map((mesh,i)=>{const object=makeDie(mesh,simulation.labels[i],style,simulation.radius);scene.add(object);return object;});
  const a=new THREE.Quaternion(),b=new THREE.Quaternion(),pa=new THREE.Vector3(),pb=new THREE.Vector3();
  let frame=0,start=null,disposed=false,settled=false,hiddenAt=null;
  const playDuration=Math.max(2.1,Math.min(3.8,simulation.duration)),hold=1.6;
  function resize(){
    const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;
    renderer.setSize(rect.width,rect.height,false);
    const aspect=rect.width/rect.height,vertical=Math.max(simulation.halfHeight+2,(simulation.halfWidth+1.5)/aspect);
    camera.left=-vertical*aspect;camera.right=vertical*aspect;camera.top=vertical;camera.bottom=-vertical;camera.updateProjectionMatrix();
  }
  resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
  function draw(now){
    if(disposed)return;
    if(document.hidden||innerWidth<120||innerHeight<120){if(hiddenAt===null)hiddenAt=now;frame=requestAnimationFrame(draw);return;}
    if(hiddenAt!==null){if(start!==null)start+=now-hiddenAt;hiddenAt=null;}
    if(start===null)start=now;
    const elapsed=(now-start)/1000,progress=Math.min(1,elapsed/playDuration),index=progress*(simulation.frames.length-1),lo=Math.floor(index),hi=Math.min(lo+1,simulation.frames.length-1),fraction=index-lo;
    objects.forEach((object,i)=>{const from=simulation.frames[lo][i],to=simulation.frames[hi][i];pa.fromArray(from);pb.fromArray(to);object.position.copy(pa).lerp(pb,fraction);a.fromArray(from,3);b.fromArray(to,3);object.quaternion.copy(a).slerp(b,fraction);});
    renderer.render(scene,camera);
    if(progress===1&&!settled){settled=true;canvas.dataset.phase='settled';onPhase?.('settled');}
    if(elapsed<playDuration+hold)frame=requestAnimationFrame(draw);else onFinish?.();
  }
  const lost=e=>{e.preventDefault();onUnavailable?.();};canvas.addEventListener('webglcontextlost',lost);
  canvas.dataset.phase='rolling';onPhase?.('rolling');frame=requestAnimationFrame(draw);
  return()=>{
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);
    scene.traverse(object=>{object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(m=>{m.map?.dispose();m.dispose();});});
    key.shadow.dispose();renderer.dispose();renderer.forceContextLoss();
  };
}
