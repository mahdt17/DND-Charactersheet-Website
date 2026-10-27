import assert from 'node:assert/strict';
import test from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import * as N from '../src/lib/campaignCreatures.js';
import * as P from '../src/lib/campaignPsicrystal.js';
import * as W from '../src/lib/campaignDowntime.js';
import {spendCampaignGold} from '../src/lib/campaignEconomy.js';
import {campaignClasses} from '../src/data/archivistCampaign.js';
const row=(definition,level)=>({definition,name:definition.name,edition:'2014',level});
const fresh=()=>({...C.createArchivistCampaign(),archivistCampaign:{independentChoices:true},feats:[{name:'Psicrystal Affinity'},{name:'Graft Flesh: Silthilar'}],currency:{gp:50000}});

test('Psicrystal capabilities use each actual Psion level from 1 through 20',()=>{
 for(let level=1;level<=20;level++){
  const definition=campaignClasses[1],c={...fresh(),className:definition.name,classDefinition:definition,level,classLevels:[row(definition,level)],abilities:{str:10,dex:10,con:10,int:20,wis:10,cha:10},archivistCampaign:{independentChoices:true,knownPowers:[{id:'inertial-armor',name:'Inertial Armor',level:1,cost:1,range:'Self'},{id:'mindlink',name:'Mindlink',level:1,cost:1,range:'30 feet'},{id:'touch-audit',name:'Touch audit',level:1,cost:1,range:'Touch',minutes:1}],psicrystal:{distance:0}}};
  assert.equal(P.psicrystalProfile(c).level,level);assert.equal(P.psicrystalProfile(c).powerResistance,level>=11?level+5:0);
  assert.equal(P.psicrystalProfile(P.activatePsicrystal(c,'legs')).speed,30);
  if(level<9)assert.throws(()=>P.activatePsicrystal(c,'flight'),/level 9/);else assert.equal(P.psicrystalProfile(P.activatePsicrystal(c,'flight')).flight,50);
  if(level<13)assert.throws(()=>P.activatePsicrystal(c,'sight'),/level 13/);else {const sight=P.activatePsicrystal(c,'sight');assert.throws(()=>P.activatePsicrystal(sight,'sight'),/used/);assert.equal(P.psicrystalProfile(sight).sightUsed,true);}
  if(level<15)assert.throws(()=>P.manifestWithPsicrystal(c,'mindlink',{mode:'channel'}),/level 15/);else assert.equal(P.manifestWithPsicrystal(c,'mindlink',{mode:'channel'}).archivistCampaign.lastManifest.origin,'Psicrystal');
  if(level<3)assert.throws(()=>P.manifestWithPsicrystal(c,'touch-audit',{mode:'touch'}),/level 3/);else {const held=P.manifestWithPsicrystal(c,'touch-audit',{mode:'touch'});assert.equal(held.archivistCampaign.lastManifest.touchPending,true);assert.equal(P.deliverPsicrystalTouch(held).archivistCampaign.lastManifest.touchPending,false);}
  const shared=P.manifestWithPsicrystal(c,'inertial-armor',{mode:'share'});assert(P.psicrystalProfile(shared).sharedPowers['inertial-armor']);assert.deepEqual(P.psicrystalProfile(P.movePsicrystal(shared,6)).sharedPowers,{});
  assert.equal(C.campaignSkillBonus(P.movePsicrystal(c,5281),'Arcana'),0);assert.equal(C.campaignSkillBonus(P.changePsicrystalHP(c,1000),'Arcana'),0);
 }
});
test('destroyed Psicrystals stay destroyed after owner maximum HP increases',()=>{
 let c=P.changePsicrystalHP(fresh(),100);
 assert.equal(P.psicrystalProfile(c).alive,false);
 c={...c,hp:{...c.hp,max:40}};
 assert.equal(P.psicrystalProfile(c).currentHP,0);
 assert.equal(P.psicrystalProfile(c).alive,false);
 assert.equal(C.campaignSkillBonus(c,'Arcana'),0);
 assert.throws(()=>P.changePsicrystalHP(c,5,{heal:true}),/destroyed|ruling/i);
});
test('legacy lethal crystal damage is captured before owner HP growth',()=>{
 const old={...fresh(),archivistCampaign:{independentChoices:true,psicrystal:{damage:11}}};
 assert.equal(typeof P.preservePsicrystalDestruction,'function');
 const saved=P.preservePsicrystalDestruction(old),grown={...saved,hp:{...saved.hp,max:40}};
 assert.equal(P.psicrystalProfile(JSON.parse(JSON.stringify(grown))).alive,false);
});
test('scroll projects spend an available pooled slot after Archivist-only slots run out',()=>{
 const wizard={name:'Wizard',catalogId:'2014:wizard',edition:'2014',hit_die:6};
 let c={...fresh(),level:2,classLevels:[row(campaignClasses[0],1),row(wizard,1)]};
 const s={catalogId:'2014:audit-cure',name:'Cure Wounds',edition:'2014',level:1,classes:['Cleric']};
 c=C.prepareCampaignSpell(C.acquireCampaignSpell(c,s),s.catalogId,true);c.slotsUsed={1:2};
 const paid=W.startCampaignProject(c,{kind:'scroll',spell:s,materialsConfirmed:true});
 assert.equal(paid.slotsUsed[1],3);assert.equal(paid.currency.gp,49950);
 assert.throws(()=>W.startCampaignProject(paid,{kind:'scroll',spell:s,materialsConfirmed:true}),/slot/i);
});
test('copper precision accepts exact copper costs and rejects fractions of copper',()=>{
 assert.deepEqual(spendCampaignGold({currency:{gp:1}},0.29).currency,{cp:1,sp:7,ep:0,gp:0,pp:0});
 assert.throws(()=>spendCampaignGold({currency:{gp:1}},0.291),/copper/i);
 assert.throws(()=>spendCampaignGold({currency:{gp:1}},1.01),/enough/i);
});
test('NPC damage consumes temporary HP and ends concentration on incapacity',()=>{
 let c=N.addCampaignCreature(fresh(),{name:'Mage',role:'caster',level:3});const id=c.archivistCampaign.creatures[0].id;
 c=N.updateCreature(c,id,n=>({...n,hp:{max:17,current:17,temp:5},concentration:'Bless'}));
 c=N.changeCreatureHP(c,id,3);assert.equal(c.archivistCampaign.creatures[0].hp.current,17);assert.equal(c.archivistCampaign.creatures[0].hp.temp,2);
 c=N.changeCreatureHP(c,id,99);assert.equal(c.archivistCampaign.creatures[0].hp.current,0);assert.equal(c.archivistCampaign.creatures[0].concentration,null);
 c=N.updateCreature(c,id,n=>({...n,hp:{...n.hp,current:10},concentration:'Bless',dead:true}));assert.equal(c.archivistCampaign.creatures[0].concentration,null);
});
test('NPC incapacitating conditions prevent casts without spending slots',()=>{
 for(const condition of ['Paralyzed',{name:'Stunned',rounds:2},'Unconscious','Petrified','Incapacitated']){
  const c=N.addCampaignCreature(fresh(),{name:'Mage',role:'caster',level:3,conditions:[condition],spells:[{id:'bless',name:'Bless',level:1,prepared:true}]});
  assert.throws(()=>N.castCreatureSpell(c,c.archivistCampaign.creatures[0].id,'bless',1),/unable|incapacitated|unavailable/i);
  assert.deepEqual(c.archivistCampaign.creatures[0].slotsUsed,{});
 }
});
test('failed graft surgery applies damage to temporary HP for self and NPC recipients',()=>{
 for(const npc of [false,true]){
  let c=fresh(),targetId='self';if(npc){c=N.addCampaignCreature(c,{name:'Recipient'});targetId=c.archivistCampaign.creatures[0].id;c=N.updateCreature(c,targetId,n=>({...n,hp:{max:22,current:22,temp:20}}));}else c.hp={max:22,current:22,temp:20};
  c=W.startCampaignProject(c,{kind:'graft',recipeId:'chitin',targetId,materialsConfirmed:true});const job=c.archivistCampaign.projects[0];c=W.workCampaignProject(c,job.id,job.hours);c=W.finishCampaignProject(c,job.id,{medicine:0});
  const hp=npc?c.archivistCampaign.creatures[0].hp:c.hp;assert.deepEqual(hp,{max:22,current:22,temp:10});assert.equal(c.archivistCampaign.projects[0].status,'failed');
 }
});
test('incapacitated characters cannot start or work projects but may cancel paid work',()=>{
 const s={catalogId:'2014:audit-copy',name:'Cure Wounds',edition:'2014',level:1,classes:['Cleric']};
 let c=W.startCampaignProject(fresh(),{kind:'copy',spell:s,source:'Temple',materialsConfirmed:true});const id=c.archivistCampaign.projects[0].id;
 c={...c,hp:{...c.hp,current:0}};
 assert.throws(()=>W.startCampaignProject(c,{kind:'copy',spell:s,source:'Temple',materialsConfirmed:true}),/incapacitated|unconscious|revival/i);
 assert.throws(()=>W.workCampaignProject(c,id,1),/incapacitated|unconscious|revival/i);
 assert.equal(W.cancelCampaignProject(c,id).archivistCampaign.projects[0].status,'cancelled');
});
test('shared surgery damage supports saved character condition text',()=>{
 const c={...fresh(),conditions:'Poisoned',hp:{max:22,current:22,temp:20}};
 assert.deepEqual(N.damageCreature(c,10).hp,{max:22,current:22,temp:10});
});
test('graft installation requires a conscious living crafter after work is complete',()=>{
 let c=N.addCampaignCreature(fresh(),{name:'Recipient'});const targetId=c.archivistCampaign.creatures[0].id;
 c=W.startCampaignProject(c,{kind:'graft',recipeId:'chitin',targetId,materialsConfirmed:true});const job=c.archivistCampaign.projects[0];c=W.workCampaignProject(c,job.id,job.hours);
 for(const values of [{hp:{...c.hp,current:0}},{conditions:['Stunned']},{archivistCampaign:{...c.archivistCampaign,dead:true}}]){
  const blocked={...c,...values},before=structuredClone(blocked);
  assert.throws(()=>W.finishCampaignProject(blocked,job.id,{medicine:30}),/incapacitated|unconscious|revival/i);
  assert.deepEqual(blocked,before);assert.equal(W.cancelCampaignProject(blocked,job.id).archivistCampaign.projects[0].status,'cancelled');
 }
 const finished=W.finishCampaignProject(c,job.id,{medicine:30});assert.equal(finished.archivistCampaign.creatures[0].grafts.length,1);
});
