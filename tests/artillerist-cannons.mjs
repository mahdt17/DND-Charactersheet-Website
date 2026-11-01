import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const lib=await server.ssrLoadModule('/src/lib/subclassCompanions.js');
const time=await server.ssrLoadModule('/src/lib/spellEffects.js');
const state=await server.ssrLoadModule('/src/lib/subclassState.js');
await server.close();
const definition=JSON.parse(readFileSync('public/catalogs/wikidot5e/classes.json','utf8')).find(x=>x.name==='Artificer');
const make=()=>({ruleset:'2014',className:'Artificer',subclass:'Artillerist',level:3,classDefinition:definition,classLevels:[{catalogId:'2014:artificer',name:'Artificer',edition:'2014',level:3,subclass:'Artillerist',definition}],abilities:{str:10,dex:10,con:10,int:16,wis:10,cha:10},hp:{current:20,max:20,temp:0},resources:[],slotsUsed:{},inventory:[],activeEffects:[],spells:[],actions:[]});
const apply=(c,p)=>({...c,...p});
test('cannon consumes its free use, respects capacity and expires on the shared clock',()=>{
 let c=make();c=apply(c,lib.createEldritchCannon(c,{type:'Protector',size:'Tiny',legs:true,tools:true,cost:'free'}));let cannon=lib.eldritchCannons(c)[0];
 assert.equal(cannon.hp.max,15);assert.equal(cannon.ac,18);assert.throws(()=>lib.createEldritchCannon(c,{type:'Protector',size:'Tiny',tools:true,cost:'free'}),/capacity/i);
 c=apply(c,time.advanceEffectTime(c,{seconds:3600}));assert.equal(lib.eldritchCannons(c).length,0);
 assert.throws(()=>lib.createEldritchCannon(c,{type:'Protector',size:'Tiny',tools:true,cost:'free'}),/resource/i);
 c=apply(c,lib.createEldritchCannon(c,{type:'Force Ballista',size:'Small',tools:true,cost:'slot',slotLevel:1,slotPool:'standard'}));assert.equal(c.slotsUsed[1],1);
});
test('Protector grants its own temporary hit points and damage consumes those first',()=>{
 let c=make();c=apply(c,lib.createEldritchCannon(c,{type:'Protector',size:'Small',tools:true,cost:'free'}));let id=lib.eldritchCannons(c)[0].id;
 c=apply(c,lib.activateProtectorCannon(c,id,{total:7},{within60:true}));c=apply(c,lib.damageEldritchCannon(c,id,9));const cannon=lib.eldritchCannons(c)[0];assert.equal(cannon.hp.temp,0);assert.equal(cannon.hp.current,13);
});
test('own Artificer level controls capacity and maximum, and a falling maximum cannot refill',()=>{
 let c=make();c.classLevels[0].level=15;c.level=15;c=apply(c,lib.createEldritchCannon(c,{type:'Flamethrower',size:'Small',tools:true,cost:'free'}));assert.equal(lib.eldritchCannons(c)[0].hp.max,75);
 c=apply(c,lib.createEldritchCannon(c,{type:'Protector',size:'Tiny',tools:true,cost:'slot',slotLevel:1,slotPool:'standard'}));assert.equal(lib.eldritchCannons(c).length,2);
 c.classLevels[0].level=3;c.level=3;c=state.reconcileSubclassStates(c);assert.equal(lib.eldritchCannons(c)[0].hp.current,15);
 c.classLevels[0].level=15;c.level=15;c=state.reconcileSubclassStates(c);assert.equal(lib.eldritchCannons(c)[0].hp.current,15);
});
test('Mending requires a confirmed cast and dismissal uses the owner action',()=>{
 let c=make();c=apply(c,lib.createEldritchCannon(c,{type:'Flamethrower',size:'Tiny',tools:true,cost:'free'}));const id=lib.eldritchCannons(c)[0].id;c=apply(c,lib.damageEldritchCannon(c,id,10));
 assert.throws(()=>lib.mendEldritchCannon(c,id,{total:7},{}),/confirm/i);
 c=apply(c,lib.mendEldritchCannon(c,id,{total:7},{confirmed:true}));assert.equal(lib.eldritchCannons(c)[0].hp.current,12);
 assert.throws(()=>lib.dismissEldritchCannon({...c,conditions:['Incapacitated']},id),/incapacitated/i);
 c=apply(c,lib.dismissEldritchCannon(c,id));assert.equal(lib.eldritchCannons(c).length,0);
});
test('detonation requires Artificer 9 and confirmed range, destroys only that cannon',()=>{
 let c=make();c=apply(c,lib.createEldritchCannon(c,{type:'Flamethrower',size:'Tiny',tools:true,cost:'free'}));let id=lib.eldritchCannons(c)[0].id;
 assert.throws(()=>lib.detonateEldritchCannon(c,id,{within60:true}),/level 9/i);c.classLevels[0].level=9;c.level=9;
 assert.throws(()=>lib.detonateEldritchCannon(c,id,{}),/60 feet/i);
 c=apply(c,lib.detonateEldritchCannon(c,id,{within60:true}));assert.equal(lib.eldritchCannons(c).length,0);
});
