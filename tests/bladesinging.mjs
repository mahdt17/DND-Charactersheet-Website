import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
import {createServer} from 'vite';
const path=new URL('../src/lib/bladesinging.js',import.meta.url);
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
let rules={};
try{if(existsSync(path))rules=await server.ssrLoadModule('/src/lib/bladesinging.js');}finally{await server.close();}
const scores={str:10,dex:16,con:14,int:18,wis:10,cha:10};
const wizard={ruleset:'2014',className:'Wizard',classDefinition:{name:'Wizard',index:'wizard',edition:'2014'},subclass:'Bladesinging',level:2,abilities:scores,hp:{current:15,max:15,temp:0},resources:[],inventory:[],activeEffects:[],concentration:'Detect Magic'};
const merge=(c,p)=>({...c,...p});

test('Bladesong uses total proficiency but unlocks by Wizard level and preserves concentration',()=>{
 assert.equal(typeof rules.bladesongProfile,'function');
 assert.equal(rules.bladesongProfile({...wizard,level:1}).active,false);
 let c=merge(wizard,rules.startBladesong(wizard));
 let p=rules.bladesongProfile(c);
 assert.equal(p.max,2);assert.equal(p.remaining,1);assert.equal(p.singing,true);
 assert.equal(p.acBonus,4);assert.equal(p.speedBonus,10);assert.equal(p.concentrationBonus,4);
 assert.equal(c.concentration,'Detect Magic');
 assert.equal(rules.bladesongProfile({...c,abilities:{...scores,int:20}}).acBonus,5);
 assert.equal(rules.bladesongProfile({...c,abilities:{...scores,int:8}}).acBonus,1);
 c=merge(c,rules.startBladesong(c));assert.throws(()=>rules.startBladesong(c),/remaining/i);
 const multiclass={...wizard,level:18,classLevels:[{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:16,subclass:'Champion'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Bladesinging'}]};
 assert.equal(rules.bladesongProfile(multiclass).max,6);
 assert.equal(rules.bladesongProfile(multiclass).level,2);
});

test('Bladesong ends for prohibited armor/shield, incapacity, expiry and two-handed weapon attacks',()=>{
 const started=merge(wizard,rules.startBladesong(wizard));
 for(const equipmentIndex of ['chain-shirt','chain-mail','shield']){
  const worn={...started,inventory:[{equipmentIndex,equipped:true}]};
  assert.equal(rules.bladesongProfile(worn).singing,false,equipmentIndex);
  assert.throws(()=>rules.startBladesong(worn),/armor|shield/i);
  const ended=rules.reconcileBladesinging(worn);
  assert.equal(rules.bladesongProfile({...ended,inventory:[]}).singing,false);
 }
 assert.equal(rules.bladesongProfile({...started,inventory:[{equipmentIndex:'leather-armor',equipped:true}]}).singing,true);
 assert.equal(rules.bladesongProfile({...started,conditions:['Paralyzed']}).singing,false);
 assert.throws(()=>rules.startBladesong({...wizard,hp:{...wizard.hp,current:0}}),/conscious/i);
 const two=merge(started,rules.afterBladesingerAttack(started,{hands:2,weapon:true}));
 assert.equal(rules.bladesongProfile(two).singing,false);
 assert.equal(rules.bladesongProfile(merge(started,rules.afterBladesingerAttack(started,{hands:1,weapon:true}))).singing,true);
 assert.equal(rules.bladesongProfile(merge(started,rules.afterBladesingerAttack(started,{hands:2,weapon:false}))).singing,true);
 assert.equal(rules.bladesongProfile({...started,activeEffects:started.activeEffects.map(e=>({...e,remainingSeconds:0}))}).singing,false);
});

test('Bladesinging upgrades and Song of Defense validate own class level and an available slot',()=>{
 const level=number=>merge({...wizard,level:number},rules.startBladesong({...wizard,level:number}));
 assert.equal(rules.bladesongProfile(level(5)).attacks,1);
 assert.equal(rules.bladesongProfile(level(6)).attacks,2);
 assert.equal(rules.bladesongProfile(level(6)).cantripReplacement,true);
 assert.equal(rules.bladesongProfile(level(13)).meleeWeaponDamageBonus,0);
 assert.equal(rules.bladesongProfile(level(14)).meleeWeaponDamageBonus,4);
 const options={slotLevel:3,slotPool:'standard',availableSlots:[{level:3,remaining:1,pool:'standard'}],triggered:true};
 assert.throws(()=>rules.useSongOfDefense(level(9),options),/10/);
 assert.throws(()=>rules.useSongOfDefense(level(10),{...options,availableSlots:[]}),/slot/i);
 assert.throws(()=>rules.useSongOfDefense(level(10),{...options,triggered:false}),/damage/i);
 const result=rules.useSongOfDefense(level(10),options);
 assert.equal(result.reduction,15);assert.equal(result.patch.slotsUsed[3],1);
 const pact=rules.useSongOfDefense(level(10),{...options,slotPool:'pact',availableSlots:[{level:3,remaining:1,pool:'pact'}]});
 assert.equal(pact.patch.pactSlotsUsed[3],1);
});

test('canonical Bladesong resource identity retains spent imported uses and unrelated effects',()=>{
 const imported={...wizard,resources:[{id:'old-song',classResourceKey:'2014:Wizard:bladesong',used:2,max:2}],activeEffects:[{id:'spell:shield',key:'shield',name:'Shield',acBonus:5}]};
 assert.throws(()=>rules.startBladesong(imported),/remaining/i);
 const c=merge({...wizard,activeEffects:imported.activeEffects},rules.startBladesong({...wizard,activeEffects:imported.activeEffects}));
 const ended=merge(c,rules.endBladesong(c));
 assert.ok(ended.activeEffects.some(e=>e.id==='spell:shield'));
 const changed=rules.reconcileBladesinging({...c,subclass:'Evocation'});
 assert.ok(!changed.resources.some(r=>r.classResourceKey==='2014:Wizard:bladesong'));
 assert.ok(!changed.activeEffects.some(e=>e.id===rules.bladesongEffectId));
});
