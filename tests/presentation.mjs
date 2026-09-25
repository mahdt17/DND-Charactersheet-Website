import assert from 'node:assert/strict';
import {diceStyles,normalizePresentation,visualDice,readPresentation,writePresentation} from '../src/lib/presentation.js';
import {diceMesh,dot} from '../src/lib/diceGeometry.js';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try {
const {rollDice}=await server.ssrLoadModule('/src/lib/rules.js');
assert.equal(diceStyles.length,5);assert.equal(new Set(diceStyles.map(s=>s.id)).size,5);
assert.deepEqual(normalizePresentation(null),{backgrounds:true,animation:true,diceStyle:'emberforge'});
assert.deepEqual(normalizePresentation({backgrounds:false,animation:false,diceStyle:'moonstone'}),{backgrounds:false,animation:false,diceStyle:'moonstone'});
assert.equal(normalizePresentation({diceStyle:'unknown',backgrounds:'false'}).diceStyle,'emberforge');
for(const n of [4,6,8,10,12,20]) {
 const mesh=diceMesh(n);assert.equal(mesh.faces.length,n);assert(mesh.faces[0].normal[2]>.999);
 for(const face of mesh.faces){assert(face.ids.length>=3);assert(mesh.vertices.every(v=>dot(v,face.normal)<=face.d+1e-5));}
}
assert.equal(diceMesh(37),null);
for(const mode of ['normal','advantage','disadvantage']) {
 const r=rollDice('1d20+5',mode,()=>.35),before=structuredClone(r),v=visualDice([r]);
 assert.deepEqual(v.dice.map(d=>d.value),r.rolls);assert.deepEqual(r,before);assert.equal(v.total,mode==='normal'?1:2);
}
const percentile=value=>visualDice([{id:'test',expression:'1d100',rolls:[value]}]).dice;
assert.deepEqual(percentile(100).map(d=>d.value),[0,0]);assert.deepEqual(percentile(37).map(d=>d.value),[3,7]);
const many=rollDice('50d6+3','normal',()=>.5),v=visualDice([many]);assert.equal(v.total,50);assert.equal(v.dice.length,18);assert.equal(many.total,203);
assert.equal(visualDice([many,{...many,id:'other'}]).total,100);
globalThis.localStorage={getItem:()=>'{invalid',setItem:()=>{throw Error('blocked');}};
assert.equal(readPresentation().backgrounds,true);assert.doesNotThrow(()=>writePresentation({backgrounds:false}));
console.log('PASS five styles, validated preferences, storage fallback, all six polyhedra, unchanged outcomes, advantage/disadvantage, percentile pairs and bounded rendering');

} finally {await server.close();}
