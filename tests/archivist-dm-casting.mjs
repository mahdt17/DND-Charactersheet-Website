import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import {campaignClasses,campaignIds} from '../src/data/archivistCampaign.js';
import spells from '../src/data/spells.json' with {type:'json'};
import levels from '../src/data/levels.json' with {type:'json'};
import * as W from '../src/lib/campaignDowntime.js';
import * as F from '../src/lib/archivistFeatures.js';
const def=campaignClasses[0],row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'2014',definition,level});
const make=(level=1,int=16,extra=0)=>({...C.createArchivistCampaign('DM Archivist'),race:'Human',level:level+extra,classLevels:[row(def,level),...(extra?[row(campaignClasses[1],extra)]:[])],abilities:{str:10,dex:10,con:10,int,wis:10,cha:10},archivistCampaign:{independentChoices:true},feats:[],spells:[]});
const spell=(name,level=1,cleric=true)=>({name,level,edition:'2014',catalogId:'test:'+name,classes:[cleric?'Cleric':'Druid'],range:'30 feet'});

test('starting prayerbook and live preparation use distinct historical and current Intelligence',()=>{
 let c=C.reconcileCampaign(make());let p=C.campaignProfile(c);
 const cantrips=spells.filter(s=>s.level===0&&s.classes.some(x=>x.name==='Cleric'));
 assert.equal(p.startingAllowance,6);assert.equal(p.growthAllowance,6);assert.equal(p.preparedLimit,4);
 assert.equal(c.spells.filter(s=>s.level===0).length,cantrips.length);
 assert.equal(C.reconcileCampaign(c).spells.length,c.spells.length);
 c={...c,abilities:{...c.abilities,int:18}};p=C.campaignProfile(c);
 assert.equal(p.startingAllowance,6,'starting allotment is historical');assert.equal(p.preparedLimit,5,'preparation follows current Int');
 assert.equal(C.campaignProfile({...c,otherClassLevels:2}).preparedLimit,7,'level-up class drafts include other classes');
 assert.equal(C.campaignProfile(make(4,18,2)).preparedLimit,10,'total character level, not Archivist level');
 assert.equal(C.campaignProfile(make(1,3)).preparedLimit,1);
});
test('starting first-level choices and later two-per-level choices are enforced independently',()=>{
 let c=C.reconcileCampaign(make(3));
 assert.equal(C.campaignProfile(c).growthAllowance,10);
 for(let n=0;n<2;n++)c=C.acquireCampaignSpell(c,spell('higher'+n,2),{channel:'growth'});
 assert.throws(()=>C.acquireCampaignSpell(c,spell('too-many-higher',2)),/growth|class.level/i);
 for(let n=0;n<2;n++)c=C.acquireCampaignSpell(c,spell('level-two-choice'+n),{channel:'growth'});
 for(let n=0;n<6;n++)c=C.acquireCampaignSpell(c,spell('starter'+n),{channel:'starting'});
 assert.equal(C.campaignProfile(c).growthRemaining,0);
 assert.throws(()=>C.acquireCampaignSpell(c,spell('extra')),/remain|addition/i);
 const before=C.campaignProfile(c).growthUsed;
 c=C.acquireCampaignSpell(c,spell('druid',1,false),{channel:'outside',source:'DM-confirmed divine scroll; copying check succeeded',confirmed:true});
 assert.equal(C.campaignProfile(c).growthUsed,before);
 assert.equal(C.campaignProfile(JSON.parse(JSON.stringify(c))).growthRemaining,0);
});
test('legacy free books remain intact and preserve spent additions after migration',()=>{
 const old={...make(4),spells:[spell('existing1'),spell('existing2',2)].map(s=>({...s,castingClassId:campaignIds.archivist,campaignAcquisition:'growth',prepared:true})),archivistCampaign:{independentChoices:true,growthSpent:8}};
 const c=C.reconcileCampaign(old),p=C.campaignProfile(c);
 assert(c.spells.some(s=>s.name==='existing1'&&s.prepared));assert(c.spells.some(s=>s.name==='existing2'&&s.prepared));
 assert.equal(p.growthUsed,8);assert.equal(p.growthRemaining,4);assert.deepEqual(C.reconcileCampaign(c),c);
});
test('Wizard slots and recovery budgets match all twenty Archivist levels',()=>{
 for(let n=1;n<=20;n++){
  const p=C.campaignProfile(make(n)),table=levels.find(r=>r.class.name==='Wizard'&&r.level===n&&!r.subclass).spellcasting;
  assert.deepEqual(p.slots,[0,...Array.from({length:9},(_,i)=>table['spell_slots_level_'+(i+1)]||0)]);
  assert.equal(p.recoveryBudget,Math.ceil(n/2));
 }
});
test('Arcane Recovery validates a whole short-rest selection and persists its daily use',()=>{
 let c={...make(4),slotsUsed:{1:3,2:2},pactSlotsUsed:{1:2}};
 assert.throws(()=>C.recoverArchivistSlots(c,{1:3}),/budget/i);
 for(const selection of [{},{1:4},{2:-1},{1:1.5},{6:1},{pact:1},{1:NaN}])assert.throws(()=>C.recoverArchivistSlots(c,selection));
 const recovered=C.recoverArchivistSlots(c,{1:2});assert.equal(recovered.slotsUsed[1],1);assert.equal(recovered.slotsUsed[2],2);assert.deepEqual(recovered.pactSlotsUsed,c.pactSlotsUsed);
 assert.equal(C.campaignProfile(recovered).recoveryUsed,true);assert.throws(()=>C.recoverArchivistSlots(JSON.parse(JSON.stringify(recovered)),{2:1}),/used/i);
 assert.equal(C.campaignProfile(C.campaignRest(recovered,'short')).recoveryUsed,true);
 assert.equal(C.campaignProfile(C.campaignRest(recovered,'long')).recoveryUsed,false);
 assert.equal(c.slotsUsed[1],3,'failed validation and successful immutable updates preserve input');
});
test('individual feature adjustments disable mechanics and removed feats stay removed',()=>{
 let c={...make(10),archivistCampaign:{independentChoices:true,loreSkills:['Arcana','Religion']},feats:[{id:'chain',name:'Chain Spell',conversionBonusSlot:'archivist:10'},{id:'reach',name:'Reach Spell'}]};
 assert.equal(C.campaignSkillBonus(c,'Arcana'),2);
 c=F.setArchivistFeatureEnabled(c,'Lore Mastery',false);assert.equal(C.campaignSkillBonus(c,'Arcana'),0);
 c=F.setArchivistFeatureEnabled(c,'Dark Knowledge',false);assert.equal(C.campaignProfile(c).darkMax,0);assert.throws(()=>C.useDarkKnowledge(c,'tactics',{check:25,target:'Undead'}));
 c=F.setArchivistFeatureEnabled(c,'Scribe Scroll',false);assert.throws(()=>W.startCampaignProject(c,{kind:'scroll',spell:spell('missing'),materialsConfirmed:true}),/disabled/i);
 c=F.setArchivistFeatureEnabled(c,'Bonus feats',false);assert.deepEqual(c.feats.map(f=>f.name),['Reach Spell']);
 c=F.setArchivistFeatureEnabled(c,'Bonus feats',true);assert(c.feats.some(f=>f.name==='Chain Spell'));
 c=F.removeConvertedFeat(c,c.feats.find(f=>f.name==='Chain Spell'));assert(F.archivistBonusRemoved(c,'archivist:10'));assert(!C.reconcileCampaign(c).feats.some(f=>f.name==='Chain Spell'));
 c=F.setArchivistFeatureEnabled(c,'Arcane Recovery',false);assert.equal(C.campaignProfile(c).recoveryBudget,0);assert.throws(()=>C.recoverArchivistSlots(c,{1:1}),/unavailable/i);
});
test('divine scroll copying pays time/materials and checks Arcana with either outcome consuming the scroll',()=>{
 const s=spell('Divine scroll spell',2,false);
 let c={...make(3),currency:{gp:500},inventory:[{id:'scroll',name:'Divine scroll spell scroll',qty:2,campaignScroll:{spell:s,level:2}}]};
 c=W.startCampaignProject(c,{kind:'copy',spell:s,source:'DM-approved Druid divine scroll',scrollId:'scroll',materialsConfirmed:true});
 let j=c.archivistCampaign.projects[0];assert.equal(j.cost,100);assert.equal(j.hours,4);assert.equal(c.currency.gp,400);assert.equal(c.inventory[0].qty,1);
 assert.throws(()=>W.finishCampaignProject(c,j.id,{arcana:12}),/work/i);
 c=W.workCampaignProject(c,j.id,4);assert.throws(()=>W.finishCampaignProject(c,j.id),/Arcana/i);
 const failed=W.finishCampaignProject(c,j.id,{arcana:11});assert.equal(failed.archivistCampaign.projects[0].status,'failed');assert(!failed.spells.some(x=>x.catalogId===s.catalogId));assert.equal(failed.inventory[0].qty,1);
 c=W.finishCampaignProject(c,j.id,{arcana:12});assert(c.spells.some(x=>x.catalogId===s.catalogId&&x.campaignAcquisition==='outside'));assert.equal(C.campaignProfile(c).growthUsed,0);
 assert.throws(()=>W.finishCampaignProject(c,j.id,{arcana:99}),/active|completed/i);
});
test('standard material components distinguish focus, reusable costly objects and consumed inventory',()=>{
 const bless={...spell('Bless'),components:['V','S','M'],material:'A sprinkling of holy water.'};
 const revive={...spell('Revivify',3),components:['V','S','M'],material:'Diamonds worth 300gp, which the spell consumes.'};
 const identify={...spell('Identify'),components:['V','S','M'],material:'A pearl worth at least 100gp and an owl feather.',ritual:true};
 const own=s=>({...s,castingClassId:campaignIds.archivist,prepared:true,campaignAcquisition:'outside'});
 let c={...make(5),currency:{gp:999},inventory:[{id:'diamond',name:'300 gp diamonds',qty:2},{id:'pearl',name:'Pearl and feather',qty:1}],spells:[bless,revive,identify].map(own)};
 assert.equal(C.castCampaignSpell(c,bless.catalogId,{slot:1}).slotsUsed[1],1,'prayerbook focus supplies ordinary material');
 assert.throws(()=>C.castCampaignSpell(c,revive.catalogId,{slot:3}),/material|component/i);
 let cast=C.castCampaignSpell(c,revive.catalogId,{slot:3,componentsConfirmed:true,componentItemId:'diamond'});assert.equal(cast.inventory[0].qty,1);assert.equal(cast.currency.gp,999,'required diamonds are not replaced by gold');
 assert.throws(()=>C.castCampaignSpell(c,revive.catalogId,{slot:2,componentsConfirmed:true,componentItemId:'diamond'}),/slot/i);assert.equal(c.inventory[0].qty,2);
 cast=C.castCampaignSpell(c,identify.catalogId,{ritual:true,componentsConfirmed:true,componentItemId:'pearl'});assert.equal(cast.inventory[1].qty,1,'reusable pearl is retained');assert.equal(cast.currency.gp,999);assert(!cast.slotsUsed);
 assert.throws(()=>C.castCampaignSpell(c,revive.catalogId,{slot:3,componentsConfirmed:true,componentItemId:'absent'}),/inventory|component/i);
});
test('Archivist Scribe Scroll uses the DM rates and own-book backups cost one hour and ten gold per level',()=>{
 const s={...spell('Known prayer',2),castingClassId:campaignIds.archivist,prepared:true};let c={...make(3),spells:[s],currency:{gp:500}};
 const scribing=W.startCampaignProject(c,{kind:'scroll',spell:s,materialsConfirmed:true});assert.equal(scribing.archivistCampaign.projects[0].cost,100);assert.equal(scribing.archivistCampaign.projects[0].hours,4);
 c=W.startCampaignProject(c,{kind:'backup',spell:s,materialsConfirmed:true});const j=c.archivistCampaign.projects[0];assert.equal(j.cost,20);assert.equal(j.hours,2);c=W.workCampaignProject(c,j.id,2);c=W.finishCampaignProject(c,j.id);assert(c.inventory.some(i=>i.prayerbookBackup?.some(x=>x.catalogId===s.catalogId)));assert.equal(c.spells.length,1,'backup does not add a second learned spell');
});
test('copying from another book has the normal rate without consuming its source or requiring a scroll check',()=>{
 const s=spell('Book divine spell',2);let c={...make(3),currency:{gp:500},inventory:[{id:'book',name:'Borrowed prayerbook',qty:1}]};
 c=W.startCampaignProject(c,{kind:'copy',spell:s,source:'Approved divine prayerbook',copySource:'book',materialsConfirmed:true});let j=c.archivistCampaign.projects[0];assert.equal(j.cost,100);assert.equal(j.hours,4);assert.equal(j.scrollConsumed,false);c=W.workCampaignProject(c,j.id,4);c=W.finishCampaignProject(c,j.id);assert(c.spells.some(x=>x.catalogId===s.catalogId));assert.equal(c.inventory[0].qty,1);
});
