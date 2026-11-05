import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import * as S from '../src/lib/campaignSpellEffects.js';
import * as P from '../src/lib/campaignPsionics.js';
const make=()=>{const c=C.createArchivistCampaign();c.classLevels[1].level=3;c.level=7;c.feats=[{name:'Cooperative Spell'}];return c;};
test('manual party members cooperate without creature records, spending their own slots and reactions',()=>{
 let c=make();c.archivistCampaign.creatures=[];
 c=S.savePartyCaster(c,{name:'Party wizard',baseDC:20,slot:3,available:2,reactionAvailable:true,featConfirmed:true,spellName:'Test',spellLevel:3});
 const ally=c.archivistCampaign.partyCasters[0];c.archivistCampaign.lastCast={id:'cast',name:'Test',slot:3,dc:16,chain:true,rule:{}};
 const entries=[{partyId:ally.id,slot:3}];const next=S.applyCooperativeSpell(c,{adjacency:[['lead',ally.id]]},entries);
 assert.equal(next.archivistCampaign.lastCast.dc,22);assert.equal(next.archivistCampaign.lastCast.effectCount,1);assert.equal(next.archivistCampaign.creatures.length,0);
 assert.equal(next.archivistCampaign.partyCasters[0].slotsUsed[3],1);assert(next.archivistCampaign.partyCasters[0].reactionUsed);assert.equal(next.archivistCampaign.lastCast.cooperativeParticipants[0].name,'Party wizard');
 assert.throws(()=>S.applyCooperativeSpell(next,{adjacency:[['lead',ally.id]]},entries),/reaction/i);
 const turn=S.advanceCampaignRound(next);assert.equal(turn.archivistCampaign.partyCasters[0].reactionUsed,false);
});
test('manual helpers validate same spell, feat, available tier, unique identity and actual adjacency',()=>{
 let c=make();c=S.savePartyCaster(c,{name:'Ally',baseDC:18,slot:2,available:1,reactionAvailable:true,featConfirmed:true,spellName:'Test',spellLevel:2});
 const id=c.archivistCampaign.partyCasters[0].id;c.archivistCampaign.lastCast={name:'Other',slot:2,dc:16,rule:{}};
 assert.throws(()=>S.applyCooperativeSpell(c,{adjacency:[['lead',id]]},[{partyId:id,slot:2}]),/same.*spell/i);
 assert.throws(()=>S.savePartyCaster(c,{name:'Ally',baseDC:18,slot:2,available:1,reactionAvailable:true,featConfirmed:true,spellName:'Test',spellLevel:2}),/already|duplicate/i);
});
test('psionic resolution follows selected power and previous resolved results persist as history',()=>{
 let c=make();c=C.useCampaignPower(c,'attraction');const previous=c.archivistCampaign.lastManifest;
 assert.equal(P.selectedPowerManifest(c,'mindlink'),null);assert.equal(P.selectedPowerManifest(c,'attraction').id,previous.id);
 c=C.useCampaignPower(c,'mindlink',{targetConfirmed:true});assert.equal(c.archivistCampaign.manifestHistory[0].id,previous.id);assert.equal(c.archivistCampaign.lastManifest.power.id,'mindlink');
 assert.equal(P.selectedPowerManifest(c,'attraction').id,previous.id);
 c.archivistCampaign.creatures=[{id:'foe',name:'Foe',type:'humanoid',hp:{current:20,max:20,temp:0},conditions:[]}];
 const next=P.resolveExtendedPower(c,'foe',{save:0,manifestId:previous.id});assert.equal(next.archivistCampaign.lastManifest.power.id,'mindlink');assert.equal(next.archivistCampaign.manifestHistory[0].lastResult,'Effect applied');
});
import {campaignDuration,campaignCooldowns} from '../src/lib/campaignClock.js';
test('clock formatting and cooldowns use the same saved campaign minutes without restoring slots',()=>{
 let c=make();c.slotsUsed={1:2};c.archivistCampaign.grafts=[{recipeId:'heart'}];c.archivistCampaign.heartUsedAt=0;
 assert.equal(campaignCooldowns(c)[0].minutes,1440);c=C.advanceCampaignTime(c,61);assert.equal(campaignCooldowns(c)[0].minutes,1379);assert.equal(campaignDuration(1379),'22h 59m');assert.equal(campaignDuration(0.1),'6s');assert.deepEqual(c.slotsUsed,{1:2});c=C.advanceCampaignTime(c,1379);assert.equal(campaignCooldowns(c)[0].minutes,0);
});
test('multiple party helpers use the highest DC and a complete adjacency graph',()=>{
 let c=make();for(const [name,baseDC] of [['A',18],['B',22]])c=S.savePartyCaster(c,{name,baseDC,slot:2,available:1,reactionAvailable:true,featConfirmed:true,spellName:'Test',spellLevel:2});
 const [a,b]=c.archivistCampaign.partyCasters;c.archivistCampaign.lastCast={name:'Test',slot:2,dc:16};const helpers=[a,b].map(n=>({partyId:n.id,slot:2}));
 assert.throws(()=>S.applyCooperativeSpell(c,{adjacency:[['lead',a.id],[a.id,b.id]]},helpers),/adjacent/);
 const next=S.applyCooperativeSpell(c,{adjacency:[['lead',a.id],['lead',b.id],[a.id,b.id]]},helpers);assert.equal(next.archivistCampaign.lastCast.dc,25);assert.equal(c.archivistCampaign.partyCasters[0].slotsUsed[2],0);
});

import {previousManifestHistory} from '../src/lib/manifestHistory.js';
test('manifest history retains older pending and resolved records and prefers the current result',()=>{
 const history=Array.from({length:40},(_,i)=>({id:'past'+i,power:{id:'attraction'},resolved:i%2?['target']:[]}));const current={id:'current',lastResult:'new',resolved:['target']};
 const records=previousManifestHistory({lastManifest:current,manifestHistory:[{...current,lastResult:'stale'},...history]});assert.equal(records.length,41);assert.equal(records[0].lastResult,'new');assert(records.some(m=>m.id==='past39'));
});
