const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,n)=>a.map(v=>v*n);
export const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>mul(a,1/(Math.hypot(...a)||1));
const center=points=>mul(points.reduce(add,[0,0,0]),1/points.length);

// Find supporting planes and merge coplanar triangles into polygonal faces.
export function convexMesh(vertices) {
  const found=new Map(),eps=1e-5;
  for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)for(let k=j+1;k<vertices.length;k++) {
    let n=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));
    if(Math.hypot(...n)<eps)continue;n=unit(n);
    let d=dot(n,vertices[i]),dist=vertices.map(v=>dot(n,v)-d);
    if(dist.some(x=>x>eps)&&dist.some(x=>x<-eps))continue;
    if(d<0){n=mul(n,-1);d=-d;dist=dist.map(x=>-x);}
    const ids=dist.flatMap((x,index)=>Math.abs(x)<eps?[index]:[]),key=ids.join(',');
    if(found.has(key))continue;
    const c=center(ids.map(index=>vertices[index])),u=unit(sub(vertices[ids[0]],c)),v=cross(n,u);
    ids.sort((a,b)=>Math.atan2(dot(sub(vertices[a],c),v),dot(sub(vertices[a],c),u))-Math.atan2(dot(sub(vertices[b],c),v),dot(sub(vertices[b],c),u)));
    found.set(key,{ids,normal:n,d,center:c});
  }
  return {vertices,faces:[...found.values()]};
}
const normalizeVertices=vertices=>{const radius=Math.max(...vertices.map(v=>Math.hypot(...v)));return vertices.map(v=>mul(v,1/radius));};
const phi=(1+Math.sqrt(5))/2;
const ico=[];for(const a of [-1,1])for(const b of [-phi,phi])ico.push([0,a,b],[a,b,0],[b,0,a]);
const dual=vertices=>convexMesh(vertices).faces.map(f=>mul(f.normal,1/f.d));
const antiprism=[];for(let i=0;i<10;i++){const angle=i*Math.PI/5;antiprism.push([Math.cos(angle),Math.sin(angle),i%2?.5:-.5]);}
const shapes={4:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],6:[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>[x,y,z]))),8:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],10:dual(antiprism),12:dual(ico),20:ico};
const cache=new Map();
export function diceMesh(sides) {
  if(!shapes[sides])return null;
  if(cache.has(sides))return cache.get(sides);
  const mesh=convexMesh(normalizeVertices(shapes[sides]));
  // Face zero points toward the viewer at rest, so its label is the actual result.
  const z=mesh.faces[0].normal,x=unit(cross(Math.abs(z[1])>.9?[1,0,0]:[0,1,0],z)),y=cross(z,x);
  const oriented=convexMesh(mesh.vertices.map(v=>[dot(v,x),dot(v,y),dot(v,z)]));
  oriented.faces.sort((a,b)=>b.normal[2]-a.normal[2]);cache.set(sides,oriented);return oriented;
}
export function rotatePoint([x,y,z],a,b,c) {
  let yy=y*Math.cos(a)-z*Math.sin(a),zz=y*Math.sin(a)+z*Math.cos(a);
  let xx=x*Math.cos(b)+zz*Math.sin(b);zz=-x*Math.sin(b)+zz*Math.cos(b);
  return [xx*Math.cos(c)-yy*Math.sin(c),xx*Math.sin(c)+yy*Math.cos(c),zz];
}
