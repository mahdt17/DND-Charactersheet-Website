import assert from 'node:assert/strict';
import {createArchivistCampaign} from '../src/lib/archivistCampaign.js';
import {assignPsicrystalRing,loadPsicrystalRing,reviveWithPsicrystal,changePsicrystalHP,preservePsicrystalDestruction} from '../src/lib/campaignPsicrystal.js';
let c=createArchivistCampaign();
assert.throws(()=>assignPsicrystalRing(c,'ring'),/inventory/i);
c={...c,inventory:[{id:'ring',name:'Ring of Spell Storing',qty:1}]};
c=assignPsicrystalRing(c,'ring');
assert.throws(()=>reviveWithPsicrystal(c,0,{}),/death/i);
assert.throws(()=>loadPsicrystalRing(c,{name:'Revivify',level:3}),/confirm/i);
c=loadPsicrystalRing(c,{name:'Revivify',level:3,confirmed:true});
assert.throws(()=>loadPsicrystalRing(c,{name:'Raise Dead',level:5,confirmed:true}),/capacity/i);
c={...c,hp:{...c.hp,current:0},deathSaves:{success:0,failure:3},archivistCampaign:{...c.archivistCampaign,dead:true}};
assert.throws(()=>reviveWithPsicrystal(c,0,{minutesSinceDeath:2,requirementsConfirmed:true}),/minute/i);
assert.throws(()=>reviveWithPsicrystal(c,0,{minutesSinceDeath:0,requirementsConfirmed:false}),/requirements/i);
let revived=reviveWithPsicrystal(c,0,{minutesSinceDeath:1,requirementsConfirmed:true});
assert.equal(revived.hp.current,1);assert.equal(revived.archivistCampaign.dead,false);assert.deepEqual(revived.inventory[0].storedSpells,[]);assert.equal(revived.deathSaves.failure,0);
let destroyed=changePsicrystalHP(c,100);assert.equal(destroyed.inventory[0].qty,0);assert.equal(destroyed.archivistCampaign.psicrystal.ringId,null);
destroyed=preservePsicrystalDestruction({...c,archivistCampaign:{...c.archivistCampaign,psicrystal:{...c.archivistCampaign.psicrystal,damage:100}}});assert.equal(destroyed.inventory[0].qty,0);
let r=assignPsicrystalRing({...createArchivistCampaign(),inventory:[{id:'r',name:'Ring of Spell Storing',qty:1}]},'r');r=loadPsicrystalRing(r,{name:'Raise Dead',level:5,confirmed:true});r={...r,hp:{...r.hp,current:0},deathSaves:{failure:3},archivistCampaign:{...r.archivistCampaign,dead:true}};
assert.throws(()=>reviveWithPsicrystal(r,0,{minutesSinceDeath:1,requirementsConfirmed:true,castingCompleted:false}),/casting/i);
r=reviveWithPsicrystal(r,0,{minutesSinceDeath:14400,requirementsConfirmed:true,castingCompleted:true});assert.equal(r.hp.current,1);
let full=assignPsicrystalRing({...createArchivistCampaign(),inventory:[{id:'full',name:'Ring of Spell Storing',qty:1}],slotsUsed:{3:2},concentration:'Bless'},'full');
full=loadPsicrystalRing(full,{name:'Shield',level:1,confirmed:true});full=loadPsicrystalRing(full,{name:'Aid',level:2,confirmed:true});assert.throws(()=>loadPsicrystalRing(full,{name:'Revivify',level:3,confirmed:true}),/capacity/i);
full={...full,hp:{...full.hp,current:0},deathSaves:{failure:3}};assert.throws(()=>reviveWithPsicrystal(full,0,{minutesSinceDeath:0,requirementsConfirmed:true}),/eligible/i);
let solo=assignPsicrystalRing({...createArchivistCampaign(),inventory:[{id:'solo',name:'Ring of Spell Storing',qty:1}],slotsUsed:{3:2},concentration:'Bless'},'solo');solo=loadPsicrystalRing(solo,{name:'Revivify',level:3,confirmed:true});solo={...solo,hp:{...solo.hp,current:0},deathSaves:{failure:3}};solo=reviveWithPsicrystal(solo,0,{minutesSinceDeath:0,requirementsConfirmed:true});assert.deepEqual(solo.slotsUsed,{3:2});assert.equal(solo.concentration,'Bless');
assert.throws(()=>reviveWithPsicrystal({...solo,deathSaves:{failure:3},inventory:[]},0,{minutesSinceDeath:0,requirementsConfirmed:true}),/ring/i);
let upcast=assignPsicrystalRing({...createArchivistCampaign(),inventory:[{id:'upcast',name:'Ring of Spell Storing',qty:1}]},'upcast');upcast=loadPsicrystalRing(upcast,{name:'Revivify',level:4,confirmed:true});upcast={...upcast,hp:{...upcast.hp,current:0},deathSaves:{failure:3}};assert.equal(reviveWithPsicrystal(upcast,0,{minutesSinceDeath:0,requirementsConfirmed:true}).hp.current,1);

let reinc=assignPsicrystalRing({...createArchivistCampaign(),inventory:[{id:'reinc',name:'Ring of Spell Storing',qty:1}]},'reinc');reinc=loadPsicrystalRing(reinc,{name:'Reincarnate',level:5,confirmed:true});reinc={...reinc,hp:{...reinc.hp,current:0},deathSaves:{failure:3}};assert.throws(()=>reviveWithPsicrystal(reinc,0,{minutesSinceDeath:2,requirementsConfirmed:true}),/casting/i);assert.equal(reviveWithPsicrystal(reinc,0,{minutesSinceDeath:60,requirementsConfirmed:true,castingCompleted:true}).hp.current,1);

const exhausted={...c,archivistCampaign:{...c.archivistCampaign,dead:false},deathSaves:{failure:0},exhaustion:6};
assert.equal(reviveWithPsicrystal(exhausted,0,{minutesSinceDeath:0,requirementsConfirmed:true}).exhaustion,5);
assert.throws(()=>reviveWithPsicrystal({...c,soulDestroyed:true},0,{minutesSinceDeath:0,requirementsConfirmed:true}),/soul/i);

console.log('PASS Psicrystal ring acquisition, storage, revival and destruction');
