import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const lib=await server.ssrLoadModule('/src/lib/subclassSpecter.js');const rest=await server.ssrLoadModule('/src/lib/spellEffects.js');await server.close();
const make=()=>({ruleset:'2014',className:'Warlock',subclass:'Hexblade',level:6,classDefinition:{name:'Warlock',index:'warlock',edition:'2014'},abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:16},hp:{current:30,max:30,temp:0},resources:[],activeEffects:[],inventory:[],spells:[],actions:[]});
const apply=(c,p)=>({...c,...p});
test('binding requires slain humanoid, pays source use and preserves specter HP through reload',()=>{
 let c=make();assert.throws(()=>lib.bindAccursedSpecter(c,{}),/humanoid/i);c=apply(c,lib.bindAccursedSpecter(c,{slainHumanoid:true}));let s=lib.accursedSpecter(c);
 assert.equal(s.hp.temp,3);assert.equal(s.attacks[0].toHit,7);c=apply(c,lib.damageAccursedSpecter(c,s.id,5));s=lib.accursedSpecter(JSON.parse(JSON.stringify(c)));assert.equal(s.hp.temp,0);assert.equal(s.hp.current,s.hp.max-2);
 c=apply(c,lib.healAccursedSpecter(c,s.id,1,{eligible:true}));assert.equal(lib.accursedSpecter(c).hp.current,s.hp.max-1);
 let destroyed=apply(c,lib.damageAccursedSpecter(c,s.id,99));assert.throws(()=>lib.bindAccursedSpecter(destroyed,{slainHumanoid:true}),/resource/i);
 c=apply(c,rest.restEffectPatch(c,'long'));assert.equal(lib.accursedSpecter(c),null);
});
test('specter conditions and sunlight affect its own attack without accepting immunities',()=>{
 let c=make();c=apply(c,lib.bindAccursedSpecter(c,{slainHumanoid:true}));const id=lib.accursedSpecter(c).id;
 assert.throws(()=>lib.setSpecterConditions(c,id,['Poisoned']),/immune/i);
 c=apply(c,lib.setSpecterConditions(c,id,['Blinded']));assert.equal(lib.specterRollState(c,id).attackDisadvantage,true);
 c=apply(c,lib.setSpecterConditions(c,id,['Stunned']));assert.equal(lib.specterRollState(c,id).cannotAct,true);
 c=apply(c,lib.setSpecterConditions(c,id,[]));assert.equal(lib.specterRollState(c,id,{sunlight:true}).attackDisadvantage,true);
});
test('specter creation uses owning Warlock level and nonnegative Charisma bonus',()=>{
 let c=make();c={...c,level:10,classLevels:[{catalogId:'2014:warlock',name:'Warlock',edition:'2014',level:6,subclass:'Hexblade'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:4}],abilities:{...c.abilities,cha:8}};
 c=apply(c,lib.bindAccursedSpecter(c,{slainHumanoid:true}));const s=lib.accursedSpecter(c);assert.equal(s.hp.temp,3);assert.equal(s.attacks[0].toHit,4);
 assert.equal(lib.accursedSpecter({...c,dead:true}).id,s.id);assert.equal(lib.accursedSpecter({...c,classLevels:[{...c.classLevels[0],subclass:'Fiend'},c.classLevels[1]]}),null);
});
