import assert from 'node:assert/strict';
import {make} from './entomancer.mjs';
import {availableEntomancerActions,applyEntomancerAction as use} from '../src/lib/entomancerActions.js';
import {entomancerProfile,populationId} from '../src/lib/entomancer.js';
import {restResources} from '../src/lib/resources.js';

for(const species of ['Decomposers','Endo-Gotas','Exo-Gotas','Orthoptera']){
 for(const action of availableEntomancerActions(make(20,species))){
  assert(action.fullDescription?.length,`${action.name} needs complete rules beside its controls`);
 }
}
const descriptions=Object.fromEntries(availableEntomancerActions(make(20)).map(a=>[a.id,a.fullDescription.join(' ')]));
assert.match(descriptions['bug-swarm'],/2d12/);assert.match(descriptions['bug-swarm'],/half/i);assert.match(descriptions['bug-swarm'],/30 feet/);
assert.match(descriptions.infest,/bonus action/i);assert.match(descriptions.infest,/Constitution.*attack/i);
let c=use(make(5),'bug-swarm',{target:'Ogre',distance:30,success:false},()=>0);
assert.deepEqual(c.entomancer.lastAction,{id:'bug-swarm',name:'Bug Swarm',target:'Ogre',populationSpent:2,roll:6,damage:6,formula:'2d12 + 4',saveDC:15,saveSucceeded:false});
assert.equal(c.entomancer.targets[0].damage,6);
c=use(c,'bug-swarm',{target:'Ogre',distance:30,success:true},()=>0);
assert.equal(c.entomancer.lastAction.damage,3);assert.equal(c.entomancer.lastAction.roll,6);
assert.equal(c.entomancer.targets[0].damage,9,'the result describes this use, not cumulative target damage');
assert.deepEqual(JSON.parse(JSON.stringify(c)).entomancer.lastAction,c.entomancer.lastAction,'the last use survives saving');
const oddDice=[0,0.1],odd=use(make(5),'bug-swarm',{target:'Ogre',success:true},()=>oddDice.shift());
assert.equal(odd.entomancer.lastAction.roll,7);assert.equal(odd.entomancer.lastAction.damage,3,'successful saves round odd damage down');
let other=use(make(5),'pestilence',{target:'Guard',success:false},()=>0);
assert.equal(other.entomancer.lastAction.damage,1);assert.deepEqual(other.entomancer.lastAction.conditions,['Blinded until the end of the next round']);
other=use(make(5),'pestilence',{target:'Guard',success:true},()=>0);
assert.equal(other.entomancer.lastAction.damage,0);assert.deepEqual(other.entomancer.lastAction.conditions,[]);
other=use(make(18,'Orthoptera'),'harmonize');other=use(other,'sonnet',{target:'Guard',success:true});assert.equal(other.entomancer.lastAction.damage,6);assert.equal(other.entomancer.lastAction.damageType,'psychic');
other=use(other,'serenade',{target:'Ally',hp:10,canHear:true});assert.equal(other.entomancer.lastAction.healing,4);
for(let level=1;level<=20;level++){
 const before=make(level,'Decomposers',{resources:[{id:populationId,used:27},{id:'potions',name:'Potions',max:3,used:2,reset:'none',manual:true}]});
 const after={...before,...restResources(before,'long',{fed:true})};
 assert.equal(entomancerProfile(after).remaining,entomancerProfile(after).max,`fed rest fully restores level ${level}`);
 assert.equal(after.resources.find(r=>r.id==='potions').used,2);
}
console.log('PASS complete action rules, per-use Bug Swarm results, save rounding, persistence and level 1–20 fed rest recovery');
