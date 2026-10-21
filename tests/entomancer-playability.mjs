import assert from 'node:assert/strict';
import {test} from 'node:test';
import {make} from './entomancer.mjs';
import {entomancerProfile} from '../src/lib/entomancer.js';
import {applyEntomancerAction as act,entomancerDamage,observeEntomancerHP,entomancerRest} from '../src/lib/entomancerActions.js';

const singing=()=>act(make(14,'Orthoptera'),'harmonize');
const roundTrip=c=>JSON.parse(JSON.stringify(c));

test('each hit keeps its own Harmonize concentration check across save/reload',()=>{
 let c=entomancerDamage(singing(),40,{type:'force'});
 c=entomancerDamage(c,1,{type:'force'});
 assert.deepEqual(c.entomancer.songSaveDCs,[20,10]);
 c=act(roundTrip(c),'song-save',{success:true});
 assert(entomancerProfile(c).song);
 assert.deepEqual(c.entomancer.songSaveDCs,[10]);
 c=act(c,'song-save',{success:true});
 assert(entomancerProfile(c).song);
 assert.deepEqual(c.entomancer.songSaveDCs,[]);
 assert.throws(()=>act(c,'song-save',{success:true}),/pending/i);
});

test('failed concentration ends Harmonize and clears every pending check',()=>{
 let c=entomancerDamage(singing(),3,{type:'force'});
 c=entomancerDamage(c,4,{type:'force'});
 c=act(c,'song-save',{success:false});
 assert.equal(entomancerProfile(c).song,false);
 assert.deepEqual(c.entomancer.songSaveDCs,[]);
});

test('an already active song cannot discard pending checks by starting again',()=>{
 const c=entomancerDamage(singing(),1,{type:'force'});
 assert.throws(()=>act(c,'harmonize'),/already/i);
 assert.deepEqual(act(c,'end-song').entomancer.songSaveDCs,[]);
 assert.deepEqual(entomancerRest(c,'long').entomancer.songSaveDCs,[]);
 const early=entomancerDamage(act(make(10,'Orthoptera'),'harmonize'),1,{type:'force'});
 assert.deepEqual(act(early,'move').entomancer.songSaveDCs,[]);
});

test('legacy scalar concentration checks survive migration and a subsequent hit',()=>{
 const legacy={...singing(),entomancer:{species:'Orthoptera',song:true,songSaveDC:20}};
 const c=entomancerDamage(roundTrip(legacy),1,{type:'force'});
 assert.deepEqual(c.entomancer.songSaveDCs,[20,10]);
 assert.deepEqual(act(roundTrip(legacy),'song-save',{success:true}).entomancer.songSaveDCs,[]);
 assert.equal(legacy.entomancer.songSaveDC,20,'migration does not mutate the original save');
});

test('unconscious or incapacitated singers lose benefits and do not restart on healing',()=>{
 for(const conditions of [[],['Stunned'],'Paralyzed', [' Incapacitated '], ['Unconscious'], ['Petrified']]){
  const before=singing();
  const after={...before,hp:{...before.hp,current:conditions.length?50:0},conditions};
  assert.equal(entomancerProfile(after).song,false);
  const stopped=observeEntomancerHP(before,after);
  assert.equal(stopped.entomancer.song,false);
  assert.deepEqual(stopped.entomancer.songSaveDCs,[]);
  const healed=observeEntomancerHP(after,{...after,hp:{...after.hp,current:50},conditions:[]});
  assert.equal(entomancerProfile(healed).song,false,'an inconsistent imported song cannot reactivate on recovery');
 }
 const down=entomancerDamage(singing(),1000,{type:'force'});
 assert.equal(down.entomancer.song,false);
 assert.deepEqual(down.entomancer.songSaveDCs,[]);
});

test('incapacitated Entomancers cannot activate abilities or spend Population',()=>{
 for(const overrides of [{hp:{current:0,max:100,temp:0}},{conditions:'Stunned'}, {conditions:['paralyzed']},{conditions:['Petrified']},{conditions:['Unconscious']},{conditions:['Incapacitated']}]){
  const c=make(14,'Orthoptera',overrides),before=roundTrip(c);
  assert.throws(()=>act(c,'pestilence',{target:'Guard'}),/unconscious|incapacitated/i);
  assert.deepEqual(c,before);
  assert.doesNotThrow(()=>act(c,'advance-time',{rounds:1}));
 }
});

test('Dead Man Walking still prevents death at its valid zero-HP trigger',()=>{
 const c=entomancerDamage(make(14),1000,{type:'force',deadMan:true});
 assert.equal(c.hp.current,1);
 assert.equal(c.entomancer.daily.deadMan,true);
 assert.equal(entomancerProfile(c).remaining,16);
 const dead=make(18,'Decomposers',{hp:{current:0,max:100,temp:0},entomancer:{species:'Decomposers',dead:true}});
 assert.throws(()=>act(dead,'dead-man'),/dead|revived/i);
 assert.doesNotThrow(()=>act(dead,'advance-time',{rounds:1}));
});

test('recording damage cannot use Dead Man Walking to revive an already dead character',()=>{
 const dead=make(18,'Decomposers',{hp:{current:0,max:100,temp:0},entomancer:{species:'Decomposers',dead:true}});
 for(const amount of [0,1]){
  const c=entomancerDamage(dead,amount,{type:'force',deadMan:true});
  assert.equal(c.hp.current,0);
  assert.equal(c.entomancer.dead,true);
  assert.equal(entomancerProfile(c).remaining,24);
 }
 const down=make(14,'Decomposers',{hp:{current:0,max:100,temp:0}});
 assert.equal(entomancerDamage(down,0,{deadMan:true}).hp.current,0,'the automatic trigger requires an actual reduction to zero');
});
