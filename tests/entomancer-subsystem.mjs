import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {make} from './entomancer.mjs';
import {entomancerProfile,populationId} from '../src/lib/entomancer.js';
import {applyEntomancerAction as A,availableEntomancerActions} from '../src/lib/entomancerActions.js';
import {restResources} from '../src/lib/resources.js';
assert(existsSync('src/lib/entomancerSubsystem.js'),'a shared Swarm subsystem model must exist');
const {swarmSubsystem:S,createSwarmUi}=await import('../src/lib/entomancerSubsystem.js');
const ready=(level=18,species='Decomposers',extra={})=>make(level,species,{entomancer:{species,tool:'Herbalism Kit',instrument:'Lute',moisture:'Dry',temperature:'Hot'},...extra});
for(const species of ['Decomposers','Endo-Gotas','Exo-Gotas','Orthoptera'])for(let level=1;level<=20;level++){
 const c=ready(level,species),m=S(c);assert.equal(m.summary.available,entomancerProfile(c).remaining);assert.equal(m.summary.max,entomancerProfile(c).max);assert(m.setupComplete);
 assert.deepEqual(m.actions.map(a=>a.id),availableEntomancerActions(c).map(a=>a.id));assert(m.actions.every(a=>a.fullDescription.length));
}
let c=ready(),m=S(c,{actionId:'bug-swarm',inputs:{target:'Ogre',distance:30,success:false}});assert(m.selected.canResolve);assert.equal(m.selected.cost,2);
for(const inputs of [{},{target:'Ogre',distance:-1,success:false},{target:'Ogre',distance:NaN,success:false},{target:'Ogre',distance:31,success:false},{target:'Ogre',distance:30}])assert(!S(c,{actionId:'bug-swarm',inputs}).selected.canResolve);
assert(!S(c,{actionId:'infest',inputs:{target:'Ogre',success:false,points:0}}).selected.canResolve);
assert.equal(S(ready(6),{actionId:'corpse-jacker'}).selected.cost,2);assert.equal(S(c,{actionId:'corpse-jacker'}).selected.cost,1);
c=A(c,'swarm-form');m=S(c,{actionId:'swarm-form'});assert(m.selected.active&&m.selected.usedDaily&&!m.selected.available);
for(const lost of [0,5,20]){let armor=A(ready(),'bug-armor');armor.entomancer.effects.bugArmor.left-=lost;assert.equal(S(armor).activities.find(a=>a.effectKey==='bugArmor').refund.amount,lost===0?3:lost===20?0:1);}
c=A(ready(),'summon',{target:'Scouts'});for(const [hp,expected] of [[11,2],[10,1],[0,0]]){c.entomancer.summons[0].hp=hp;assert.equal(S(c).creatures[0].returnAmount,expected);}
c.entomancer.summons[0].hp=22;c={...c,...restResources(c,'long',{fed:true})};assert.equal(S(c).summary.available,24);assert.equal(S(c).creatures[0].returnAmount,2);
c=A(ready(),'decompose',{target:'Corpse',size:'Large'});assert.equal(S(c).activities[0].committed,24);assert.equal(S(c).activities[0].remainingRounds,4);
const frozen=structuredClone(c);function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}freeze(frozen);assert.deepEqual(S(frozen),S(frozen));assert.deepEqual(frozen,c);
assert.equal(S(ready(5,'Decomposers',{resources:[{id:'import',classResourceKey:populationId,used:3}]})).summary.available,4);
assert(S({...ready(),ruleset:'custom',mechanics:'2014'}).supported);assert(!S({...ready(),ruleset:'2024'}).supported);assert.equal(S(c,{actionId:'removed'}).selected.id,'pestilence');assert.equal(createSwarmUi(c).section,'abilities');
c=ready(18,'Orthoptera');assert.match(S(c,{actionId:'sonnet'}).selected.unavailableReason,/Harmonize/);
c=ready(20);assert.match(S(c,{actionId:'apex-attack'}).selected.unavailableReason,/Swarm Form/);
c=ready(18,'Decomposers',{hp:{current:0,max:100,temp:0}});assert(S(c,{actionId:'dead-man'}).selected.available);assert(!S(c,{actionId:'pestilence'}).selected.available);
c=ready(18,'Decomposers',{resources:[{id:populationId,used:24}]});assert(S(c,{actionId:'entomancy'}).selected.available);assert(!S(c,{actionId:'bug-swarm'}).selected.available);
console.log('PASS shared Swarm model: species/levels, costs, explicit saves, validation, conditional refunds, purity, imports and eligibility');
