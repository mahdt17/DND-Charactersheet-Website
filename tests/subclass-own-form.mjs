import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const lifecycle=await server.ssrLoadModule('/src/lib/spellEffects.js');
const actor=await server.ssrLoadModule('/src/lib/subclassState.js');
const casting=await server.ssrLoadModule('/src/lib/rage2014.js');
const lib=existsSync('src/lib/subclassOwnForm.js')?await server.ssrLoadModule('/src/lib/subclassOwnForm.js'):{};await server.close();
const make=(level=2)=>({ruleset:'2014',className:'Druid',subclass:'Moon',level,classDefinition:{name:'Druid',index:'druid',edition:'2014'},abilities:{str:10,dex:10,con:10,int:14,wis:16,cha:12},hp:{current:20,max:20,temp:0},resources:[],inventory:[],activeEffects:[],spells:[],actions:[]});const apply=(c,p)=>({...c,...p});
test('Moon form requires seen confirmation and spends canonical Wild Shape',()=>{
 assert.equal(typeof lib.activateMoonForm,'function');let c=make();assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{}),/seen/i);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(c.resources.find(r=>r.id==='2014:Druid:wild-shape').used,1);const p=lib.ownFormProfile(c);assert.equal(p.name,'Brown Bear');assert.equal(p.hp.current,34);assert.equal(p.hp.max,34);assert.equal(c.hp.current,20);assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}),/active/i);
});
test('elemental form costs both uses, and damage overflow reaches normal HP only once',()=>{
 assert.equal(typeof lib.damageOwnForm,'function');let c=make(10);c=apply(c,lib.activateMoonForm(c,'fire-elemental',{equipmentResolved:true}));assert.equal(c.resources.find(r=>r.id==='2014:Druid:wild-shape').used,2);const hp=lib.ownFormProfile(c).hp.current;c=apply(c,lib.damageOwnForm(c,hp+3));assert.equal(c.hp.current,17);assert.equal(lib.ownFormProfile(c),null);assert.throws(()=>lib.damageOwnForm(c,3),/active/i);
});
test('Moon requires equipment resolution and expiry removes the linked profile state',()=>{
 let c=make();assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{seen:true}),/equipment/i);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lifecycle.advanceEffectTime(c,{seconds:3600}));assert.equal(lib.ownFormProfile(c),null);assert.deepEqual(c.profileState,{});
});
test('Moon projection retains mental scores and tags Primal Strike at Druid 6',()=>{
 let c=make(6);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));const p=lib.ownFormProfile(c);assert.equal(p.abilities.str,19);assert.equal(p.abilities.int,14);assert.equal(p.abilities.wis,16);assert.equal(p.abilities.cha,12);assert.equal(p.magicalAttacks,true);
});
test('Moon healing spends a spell slot without changing normal HP',()=>{
 assert.equal(typeof lib.healMoonForm,'function');let c=make(10);c.slotsUsed={};c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,lib.healMoonForm(c,{slotLevel:1,slotPool:'standard',result:{total:5}}));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);assert.equal(c.slotsUsed[1],1);
});
test('actor guard uses active form HP instead of the preserved normal body',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c.hp.current=0;assert.equal(actor.actorActionBlock(c),'');
});
test('Moon below Druid 18 cannot cast while transformed',()=>{
 let c=make(10);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.match(casting.featureCastingBlock(c,{name:'Cure Wounds',level:1,components:['V','S']}),/Wild Shape/i);
});
test('Beast Spells permits Druid verbal and somatic spells at 18; Archdruid can waive eligible materials at 20',()=>{
 let c=make(18);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(casting.featureCastingBlock(c,{name:'Cure Wounds',level:1,classes:['Druid'],components:['V','S']}),'');assert.match(casting.featureCastingBlock(c,{name:'Goodberry',level:1,classes:['Druid'],components:['V','S','M']}),/material/i);let d=make(20);d=apply(d,lib.activateMoonForm(d,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(casting.featureCastingBlock(d,{name:'Goodberry',level:1,classes:['Druid'],components:['V','S','M'],archdruidMaterialEligible:true}),'');
});
test('ordinary healing in Wild Shape heals form HP only',()=>{
 assert.equal(typeof lib.healOwnForm,'function');let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,lib.healOwnForm(c,5));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);
});
