import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {diceStyles,visualDice} from './lib/presentation';
import {diceMesh,rotatePoint} from './lib/diceGeometry';
import {usePresentation,useReducedMotion} from './PresentationSettings';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const ease=t=>1-(1-t)**3;
const shade=(hex,amount)=>`rgb(${hex.match(/\w\w/g).map(n=>clamp(Math.round(parseInt(n,16)*amount),0,255)).join(',')})`;
const hash=text=>[...text].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
const label=(die,face)=>die.percentile?(die.percentile==='tens'?`${(die.value+face)%10}0`:`${(die.value+face)%10}`):String((die.value+face-1)%die.sides+1);

function paintDie(ctx,die,x,y,size,turn,style,bounce) {
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,size*.78+bounce,size*.85/(1+bounce/110),size*.24,0,0,Math.PI*2);ctx.fill();
  ctx.shadowColor=style.glow;ctx.shadowBlur=12;
  const mesh=diceMesh(die.sides);
  if(!mesh){ctx.fillStyle=style.body;ctx.strokeStyle=style.edge;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-size*.8,-size*.6,size*1.6,size*1.2,12);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=style.ink;ctx.textAlign='center';ctx.font=`bold ${size*.55}px Georgia`;ctx.fillText(die.value,0,5);ctx.font=`${size*.26}px system-ui`;ctx.fillText(`d${die.sides}`,0,size*.4);ctx.restore();return;}
  const seed=hash(die.id),angles=[turn*(6+(seed%3))+.12,turn*(9+(seed%5))-.1,turn*(8+(seed%4))+(seed%17-8)/40];
  const rotate=v=>rotatePoint(v,...angles),vertices=mesh.vertices.map(rotate);
  const projected=vertices.map(([vx,vy,vz])=>[vx*size*4/(4-vz),-vy*size*4/(4-vz)]);
  const faces=mesh.faces.map((f,index)=>({...f,index,n:rotate(f.normal),depth:f.ids.reduce((s,i)=>s+vertices[i][2],0)/f.ids.length})).filter(f=>f.n[2]>.015).sort((a,b)=>a.depth-b.depth);
  for(const f of faces) {
    const points=f.ids.map(i=>projected[i]),cx=points.reduce((s,v)=>s+v[0],0)/points.length,cy=points.reduce((s,v)=>s+v[1],0)/points.length;
    ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();
    const gradient=ctx.createLinearGradient(cx-size,cy-size,cx+size,cy+size),light=.64+f.n[2]*.35-f.n[0]*.15+f.n[1]*.12;
    gradient.addColorStop(0,shade(style.body,light*1.45));gradient.addColorStop(1,shade(style.body,light*.72));ctx.fillStyle=gradient;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=style.edge;ctx.lineWidth=1.3;ctx.stroke();
    ctx.save();ctx.clip();ctx.globalAlpha=.28;ctx.strokeStyle=style.edge;ctx.lineWidth=.7;
    if(style.pattern==='veins'){for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(cx-size,cy+(k-1)*15);ctx.bezierCurveTo(cx-9,cy-15+k*7,cx+15,cy+14-k*9,cx+size,cy+(k-1)*12);ctx.stroke();}}
    else if(style.pattern==='stars'){ctx.fillStyle=style.edge;for(let k=0;k<7;k++){ctx.beginPath();ctx.arc(cx+Math.sin(k*7+seed)*size*.65,cy+Math.cos(k*13+seed)*size*.65,k%3===0?1.3:.7,0,Math.PI*2);ctx.fill();}}
    else {ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(cx+(px-cx)*.81,cy+(py-cy)*.81):ctx.moveTo(cx+(px-cx)*.81,cy+(py-cy)*.81));ctx.closePath();ctx.stroke();}
    ctx.restore();
    if(f.n[2]>.32){ctx.save();ctx.translate(cx,cy);ctx.scale(1,Math.max(.45,f.n[2]));ctx.fillStyle=style.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.round(size*(die.sides<=6?.58:die.sides===12?.48:.41))}px Georgia`;ctx.shadowColor=shade(style.body,.4);ctx.shadowBlur=2;ctx.fillText(label(die,f.index),0,1);ctx.restore();}
  }
  ctx.restore();
}

export default function DiceAnimation({rolls}) {
  const canvas=useRef(null),seen=useRef(new Set()),[scene,setScene]=useState(null),{preferences}=usePresentation(),reduced=useReducedMotion();
  useEffect(()=>{
    const fresh=rolls.filter(r=>!seen.current.has(r.id)).reverse();seen.current=new Set(rolls.map(r=>r.id));
    if(!preferences.animation||reduced||!rolls.length){setScene(null);return;}
    if(fresh.length)setScene({...visualDice(fresh),results:fresh,key:fresh.at(-1).id,style:preferences.diceStyle});
  },[rolls,preferences.animation,reduced,preferences.diceStyle]);
  useEffect(()=>{
    if(!scene||!canvas.current)return;
    const node=canvas.current,ctx=node.getContext('2d');if(!ctx){setScene(null);return;}
    const style=diceStyles.find(s=>s.id===scene.style)||diceStyles[0];let width=innerWidth,height=innerHeight,frame=0,started=null;
    function resize(){width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,2);node.width=Math.max(1,width*ratio);node.height=Math.max(1,height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
    resize();window.addEventListener('resize',resize);
    function draw(now){
      if(width<120||height<120){frame=requestAnimationFrame(draw);return;}
      if(started===null)started=now;const elapsed=now-started,progress=clamp(elapsed/1850,0,1);ctx.clearRect(0,0,width,height);
      const mobile=width<760,areaWidth=mobile?width:Math.max(320,width-395),cols=Math.min(mobile?4:6,scene.dice.length),rows=Math.ceil(scene.dice.length/cols);
      const size=Math.max(8,mobile?Math.min(32,(areaWidth-36)/(cols*2.5)):Math.min(48,(areaWidth-70)/(cols*2.65)));
      scene.dice.forEach((die,i)=>{
        const seed=hash(die.id),t=clamp((elapsed-(i%5)*45)/1600,0,1),travel=ease(t),endX=areaWidth/2+(i%cols-(cols-1)/2)*size*2.4,endY=mobile?112+Math.floor(i/cols)*size*2.2:height*.47+(Math.floor(i/cols)-(rows-1)/2)*size*2.3;
        const startX=i%2?-size:areaWidth+size,startY=80+seed%Math.max(90,Math.round(height*.3));
        const bounce=Math.abs(Math.sin(t*Math.PI*4.5))*65*(1-t),x=startX+(endX-startX)*travel+Math.sin(t*Math.PI*3)*(1-t)*size*1.5,y=startY+(endY-startY)*travel-bounce;
        paintDie(ctx,die,x,y,size,Math.max(0,1-ease(t)),style,bounce);
      });
      node.dataset.phase=progress<1?'rolling':'settled';
      if(elapsed<3200)frame=requestAnimationFrame(draw);else setScene(current=>current?.key===scene.key?null:current);
    }
    frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);ctx.clearRect(0,0,width,height);};
  },[scene]);
  if(!scene)return null;
  // Native dialogs occupy the top layer; placing the decorative canvas inside
  // the current dialog keeps inline hit-die rolls visible without stealing focus.
  const target=document.querySelector('dialog[open]')||document.querySelector('.creation-overlay')||document.body;
  return createPortal(<div className="dice-stage" aria-hidden="true" data-style={scene.style} data-roll-ids={scene.results.map(r=>r.id).join(',')}>
    <canvas ref={canvas} className="dice-canvas" data-values={scene.dice.map(d=>d.value).join(',')}/>
    <div className="dice-stage-caption"><span>{diceStyles.find(s=>s.id===scene.style)?.name}</span><strong>{scene.results.length===1?scene.results[0].label:`${scene.results.length} rolls`}</strong><small>{scene.total>scene.dice.length?`Showing ${scene.dice.length} of ${scene.total} dice · all results in history`:'Let fate decide'}</small></div>
  </div>,target);
}
