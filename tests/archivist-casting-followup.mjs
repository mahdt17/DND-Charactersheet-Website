import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import * as S from '../src/lib/campaignSpellEffects.js';
import {creatureTemplate} from '../src/lib/campaignCreatures.js';

const creature=name=>creatureTemplate({name,role:'caster',level:20});
const withCast=(rule={},extra={})=>({ ...C.createArchivistCampaign(),archivistCampaign:{creatures:['primary','second','third'].map(name=>({...creature(name),id:name,cyst:{}})),lastCast:{id:'cast',name:'Test',spellId:'test',dc:18,casterLevel:20,chain:true,secondaryTargets:20,resolved:[],rule,...extra}}});

test('Chain queues explicit primary and secondary targets and persists independent statuses',()=>{
 let c=withCast();
 assert.throws(()=>S.queueChainTarget(c,{targetId:'second',secondary:true,distanceFromPrimary:10}),/primary/i);
 c=S.queueChainTarget(c,{targetId:'primary'});
 c=S.queueChainTarget(c,{targetId:'second',secondary:true,distanceFromPrimary:30});
 assert.throws(()=>S.queueChainTarget(c,{targetId:'primary',secondary:true,distanceFromPrimary:10}),/already|duplicate/i);
 assert.throws(()=>S.queueChainTarget(c,{targetId:'third',secondary:true,distanceFromPrimary:31}),/30/);
 c=S.resolveCampaignSpell(c,'primary',{damaging:true,damage:21});
 assert.equal(c.archivistCampaign.lastCast.targets[0].status,'resolved');
 assert.equal(c.archivistCampaign.lastCast.targets[1].status,'queued');
 assert.throws(()=>S.resolveCampaignSpell(c,'second',{secondary:true,distanceFromPrimary:30}),/save/i);
 c=S.resolveCampaignSpell(c,'second',{secondary:true,distanceFromPrimary:30,save:18});
 assert.equal(c.archivistCampaign.creatures[1].hp.current,c.archivistCampaign.creatures[1].hp.max-5);
 assert.equal(JSON.parse(JSON.stringify(c)).archivistCampaign.lastCast.targets[1].status,'resolved');
});

test('ordinary non-damage Chain save successes do not apply effect and primary must precede secondary',()=>{
 let c=withCast();
 c=S.resolveCampaignSpell(c,'primary',{});
 c=S.resolveCampaignSpell(c,'second',{secondary:true,distanceFromPrimary:5,save:14});
 assert.match(c.archivistCampaign.lastCast.lastResult,/save succeeded/i);
});

test('necrotic damage Chain secondaries use normal DEX DC without cyst CON penalty',()=>{
 let c=withCast({effect:'damage',requiresCyst:true,damageCap:10},{spellId:'darkdonte:necrotic-bloat'});
 c=S.resolveCampaignSpell(c,'primary',{damage:21});
 c=S.resolveCampaignSpell(c,'second',{secondary:true,distanceFromPrimary:5,save:18});
 assert.equal(c.archivistCampaign.creatures[1].hp.current,c.archivistCampaign.creatures[1].hp.max-5);
});

test('Cooperative validates explicit adjacency edges for every participant',()=>{
 let c=withCast();c.feats=[{name:'Cooperative Spell'}];c.archivistCampaign.lastCast.slot=9;
 c.archivistCampaign.creatures=c.archivistCampaign.creatures.map(n=>({...n,cooperative:true,spells:[{id:'same',name:'Test',level:3,prepared:true}]}));
 const helpers=['primary','second'].map(creatureId=>({creatureId,spellId:'same',slot:3}));
 assert.throws(()=>S.applyCooperativeSpell(c,{adjacency:[['lead','primary'],['primary','second']]},helpers),/adjacent/i);
 const next=S.applyCooperativeSpell(c,{adjacency:[['lead','primary'],['primary','second'],['second','lead']]},helpers);
 assert.equal(next.archivistCampaign.lastCast.dc,21);
 assert(next.archivistCampaign.creatures.slice(0,2).every(n=>n.reactionUsed&&n.slotsUsed[3]===1&&!n.concentration));
});
test('Chain resolves a queued ordinary secondary Self rather than rejecting its selection',()=>{
 let c=withCast();c.hp={current:100,max:100,temp:0};c=S.queueChainTarget(c,{targetId:'primary'});c=S.queueChainTarget(c,{targetId:'self',secondary:true,distanceFromPrimary:10});c=S.resolveCampaignSpell(c,'primary',{damaging:true,damage:21});
 c=S.resolveCampaignSpell(c,'self',{save:18});assert.equal(c.hp.current,95);assert.equal(c.archivistCampaign.lastCast.targets[1].status,'resolved');
});
