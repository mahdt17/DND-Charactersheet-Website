import assert from 'node:assert/strict';import {test} from 'node:test';import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});const lib=await server.ssrLoadModule('/src/lib/subclassFungalZombie.js').catch(()=>({}));const time=await server.ssrLoadModule('/src/lib/spellEffects.js');await server.close();
const make=()=>({ruleset:'2014',className:'Druid',subclass:'Spores',level:6,classDefinition:{name:'Druid',index:'druid',edition:'2014'},abilities:{str:10,dex:10,con:10,int:10,wis:16,cha:10},hp:{current:30,max:30,temp:0},resources:[],activeEffects:[],inventory:[],spells:[],actions:[]});const apply=(c,p)=>({...c,...p});
test('each fungal zombie consumes its own use, starts at one HP and expires independently',()=>{
 let c=make();assert.throws(()=>lib.animateFungalZombie(c,{}),/confirm/i);c=apply(c,lib.animateFungalZombie(c,{triggered:true}));let z=lib.fungalZombies(c)[0];assert.equal(z.hp.current,1);assert.equal(z.hp.max,22);
 c=apply(c,time.advanceEffectTime(c,{seconds:1200}));c=apply(c,lib.animateFungalZombie(c,{triggered:true}));assert.equal(lib.fungalZombies(c).length,2);
 c=apply(c,time.advanceEffectTime(c,{seconds:2400}));assert.equal(lib.fungalZombies(c).length,1);assert.equal(lib.fungalZombies(c)[0].remainingSeconds,1200);
});
test('zero HP awaits a table resolution of Undead Fortitude and does not allow free healing',()=>{
 let c=make();c=apply(c,lib.animateFungalZombie(c,{triggered:true}));const id=lib.fungalZombies(c)[0].id;c=apply(c,lib.damageFungalZombie(c,id,2));assert.equal(lib.fungalZombies(c)[0].hp.current,0);
 assert.throws(()=>lib.healFungalZombie(c,id,5,{eligible:true}),/zero/i);c=apply(c,lib.resolveFungalZombieZero(c,id,{survives:true,confirmed:true}));assert.equal(lib.fungalZombies(c)[0].hp.current,1);
});
test('zombie attack follows its own conditions and poison immunity',()=>{
 let c=make();c=apply(c,lib.animateFungalZombie(c,{triggered:true}));const id=lib.fungalZombies(c)[0].id;
 assert.throws(()=>lib.setFungalZombieConditions(c,id,['Poisoned']),/immune/i);c=apply(c,lib.setFungalZombieConditions(c,id,['Prone']));assert.equal(lib.fungalZombieRollState(c,id).attackDisadvantage,true);
});
