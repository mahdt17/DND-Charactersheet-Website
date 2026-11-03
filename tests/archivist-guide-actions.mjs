import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createArchivistCampaign, useDarkKnowledge, activeDarkKnowledge, advanceCampaignTime, useCampaignPower, reconcileCampaign, campaignProfile, minimumMetamagicSlot} from '../src/lib/archivistCampaign.js';
import {advanceCampaignRound} from '../src/lib/campaignSpellEffects.js';
import {resolveExtendedPower, attractionInteractionBonus} from '../src/lib/campaignPsionics.js';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const {armorFor}=await server.ssrLoadModule('/src/lib/rules.js');
await server.close();

test('Dark Knowledge spends no combat action and refreshes the same effect only on a later turn',()=>{
 const c=createArchivistCampaign();
 const first=useDarkKnowledge(c,'tactics',{check:25,target:'Undead',distance:60});
 assert.equal(first.archivistCampaign.darkUsed,1);
 assert.equal(activeDarkKnowledge(first)[0].bonus,2);
 assert.throws(()=>useDarkKnowledge(first,'tactics',{check:35,target:'Undead'}),/once per turn/);
 const turn=advanceCampaignRound(first);
 assert.equal(activeDarkKnowledge(turn)[0].rounds,9);
 assert.throws(()=>useDarkKnowledge(turn,'tactics',{check:35,target:'Undead',distance:61}),/60 feet/);
 const refreshed=useDarkKnowledge(turn,'tactics',{check:35,target:'undead'});
 assert.equal(activeDarkKnowledge(refreshed).length,1);
 assert.equal(activeDarkKnowledge(refreshed)[0].bonus,3);
 assert.equal(activeDarkKnowledge(refreshed)[0].rounds,10);
 assert.equal(activeDarkKnowledge(advanceCampaignTime(refreshed,1)).length,0);
});
test('Inertial Armor uses its reaction, respects ML, and only replaces the worn armor bonus',()=>{
 const c=createArchivistCampaign();
 assert.throws(()=>useCampaignPower(c,'inertial-armor'),/targeted/);
 assert.throws(()=>useCampaignPower(c,'inertial-armor',{augmentation:2,targetConfirmed:true}),/manifester level/);
 let psion={...c,classLevels:c.classLevels.map((r,i)=>i?{...r,level:3}:r),archivistCampaign:{...c.archivistCampaign,rulings:{naturalArmorBonus:1},grafts:[{recipeId:'chitin-3'}]},inventory:[{equipped:true,equipmentIndex:'leather-armor'},{equipped:true,equipmentIndex:'shield'}],abilities:{...c.abilities,dex:14},concentration:'Guidance'};
 psion=useCampaignPower(psion,'inertial-armor',{augmentation:2,targetConfirmed:true});
 assert.equal(psion.powerPointsUsed,3);
 assert.equal(psion.archivistCampaign.powerEffects['inertial-armor'].minutes,180);
 assert.equal(psion.concentration,'Guidance');
 assert.equal(armorFor(psion,psion.abilities),23);
 assert.equal(armorFor({...psion,inventory:[{equipped:true,equipmentIndex:'plate-armor'}]},psion.abilities),22);
 assert.equal(armorFor(advanceCampaignTime(psion,180),psion.abilities),19);
});
test('Mindlink does not resolve a save, and failed Attraction adds exactly +4 to relevant checks until expiry',()=>{
 const c=createArchivistCampaign();
 c.archivistCampaign.creatures=[{id:'npc',hp:{current:10,max:10},conditions:[]}];
 assert.throws(()=>useCampaignPower(c,'mindlink'),/willing/);
 const link=useCampaignPower(c,'mindlink',{targetConfirmed:true});
 assert.equal(link.archivistCampaign.lastManifest.power.save,'');
 assert.throws(()=>resolveExtendedPower(link,'npc'),/no save/);
 const cast=useCampaignPower(c,'attraction');
 const dc=campaignProfile(c).dc;
 assert.equal(cast.archivistCampaign.lastManifest.dc,dc);
 assert.equal(attractionInteractionBonus(resolveExtendedPower(cast,'npc',{save:dc}),'npc',{relevant:true}),0);
 const hit=resolveExtendedPower(cast,'npc',{save:dc-1});
 assert.equal(attractionInteractionBonus(hit,'npc'),0);
 assert.equal(attractionInteractionBonus(hit,'npc',{relevant:true}),4);
 assert.equal(attractionInteractionBonus(advanceCampaignTime(hit,60),'npc',{relevant:true}),0);
});
test('approved cantrips are known independently of the quick-access list',()=>{
 const c=createArchivistCampaign();
 c.archivistCampaign.cantripQuickAccess=['toll the dead'];
 const first=reconcileCampaign(c);
 assert.equal(first.spells.filter(s=>s.level===0).length,9);
 assert.deepEqual(first.archivistCampaign.cantripQuickAccess,['toll the dead']);
 const approved=reconcileCampaign({...first,archivistCampaign:{...first.archivistCampaign,approvedUACantrips:true}});
 assert.equal(approved.spells.filter(s=>s.level===0).length,11);
 assert.equal(approved.spells.find(s=>s.name==='Guidance').id,first.spells.find(s=>s.name==='Guidance').id);
});

test('Healing Blood works between encounters and never revives the dead',()=>{
 const c=createArchivistCampaign();
 c.hp.current=0;
 c.archivistCampaign.grafts=[{recipeId:'blood'}];
 c.deathSaves={failure:2,success:0};
 const healed=advanceCampaignTime(c,1);
 assert.equal(healed.hp.current,20);
 assert.equal(healed.deathSaves.failure,0);
 assert.equal(advanceCampaignRound({...c,conditions:['Dead']}).hp.current,0);
});

test('The Archivist cap follows the character rather than the selected casting class',()=>{
 const c=createArchivistCampaign();
 assert.equal(minimumMetamagicSlot(7,{chain:true},campaignProfile(c)),9);
 assert.equal(minimumMetamagicSlot(5,{reach:true,chain:true},campaignProfile(c)),9);
 assert.equal(minimumMetamagicSlot(7,{chain:true},{archivist:0,rulings:{}}),10);
});
test('An elapsed turn restores helper reactions while no elapsed time preserves them',()=>{
 const c=createArchivistCampaign();
 c.archivistCampaign.creatures=[{id:'helper',reactionUsed:true,hp:{current:5,max:5}}];
 assert.equal(advanceCampaignTime(c,0).archivistCampaign.creatures[0].reactionUsed,true);
 assert.equal(advanceCampaignTime(c,60).archivistCampaign.creatures[0].reactionUsed,false);
});
