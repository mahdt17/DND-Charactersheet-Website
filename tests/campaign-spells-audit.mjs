import assert from 'node:assert/strict';
import test from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import * as S from '../src/lib/campaignSpellEffects.js';
import * as P from '../src/lib/campaignPsionics.js';
import * as X from '../src/lib/campaignPsicrystal.js';
import * as N from '../src/lib/campaignCreatures.js';
import {campaignClasses,campaignPowers,cystSpells} from '../src/data/archivistCampaign.js';
import {outsideCampaignSpells,psionPoints,psionKnown} from '../src/data/campaignExpansion.js';

const build=(kind,level)=>{
 const definition=campaignClasses.find(d=>d.campaignKind===kind);
 return {...C.createArchivistCampaign('Spell audit'),level,classDefinition:definition,className:definition.name,
  classLevels:[{name:definition.name,definition,edition:'2014',level}],
  abilities:{str:10,dex:10,con:10,int:20,wis:10,cha:10},
  feats:['Mother Cyst','Reach Spell','Chain Spell','Cooperative Spell','Psicrystal Affinity'].map(name=>({name})),
  archivistCampaign:{independentChoices:true},currency:{gp:10000}};
};
const withCreature=(c,options={})=>N.addCampaignCreature(c,{name:'Target',type:'monstrosity',level:20,abilities:{int:2},...options});
const cure={catalogId:'2014:cure-wounds',name:'Cure Wounds',level:1,range:'Touch',edition:'2014',classes:['Cleric']};

test('dead and incapacitated converted casters cannot spend spells, knowledge or PP',()=>{
 for(const values of [
  {hp:{current:0,max:20,temp:0},deathSaves:{failure:3}},
  {hp:{current:0,max:20,temp:0}},
  {conditions:['Unconscious']},{conditions:['Stunned']},{conditions:['Incapacitated']},{conditions:['Paralyzed']},
 ]){
  const c={...build('archivist',20),...values},before=structuredClone(c);
  assert.throws(()=>C.castCampaignSpell(c,'darkdonte:necrotic-awareness',{slot:1,confirmed:true}));
  assert.throws(()=>C.useDarkKnowledge(c,'tactics',{check:25,target:'Enemy'}));
  assert.deepEqual(c,before,'blocked attempts leave resources and effects untouched');
  let p={...build('psion',20),...values};p=P.learnCampaignPower(p,{...campaignPowers[0],level:1});p=P.learnCampaignPower(p,{name:'Configured blast',level:1,damage:'1d6'});
  const prior=structuredClone(p);
  assert.throws(()=>C.useCampaignPower(p,'mindlink'));
  assert.throws(()=>X.manifestWithPsicrystal(p,'mindlink'));
  assert.throws(()=>P.manifestExtendedPower(p,p.archivistCampaign.knownPowers[1].id));
  assert.deepEqual(p,prior);
 }
});

test('base powers reject unsupported augmentation and discount without spending PP',()=>{
 for(const base of campaignPowers){let c=build('psion',1);c=P.learnCampaignPower(c,{...base,level:1});const before=structuredClone(c);
  assert.throws(()=>C.useCampaignPower(c,base.id,{augmentation:999}),/augmentation/i);
  assert.throws(()=>X.manifestWithPsicrystal(c,base.id,{augmentation:999}),/augmentation/i);
  assert.throws(()=>P.manifestExtendedPower(c,base.id,{augmentation:1}),/augmentation/i);
  assert.throws(()=>C.useCampaignPower(c,base.id,{discount:true}),/discount/i);
  assert.throws(()=>X.manifestWithPsicrystal(c,base.id,{discount:true}),/discount/i);
  assert.deepEqual(c,before);
 }
});

test('cooperative Chain DC includes the cooperation bonus in primary and secondary feedback',()=>{
 let c=withCreature(build('archivist',20),{name:'Helper',role:'caster',cooperative:true,spells:[{id:'helper',name:'Necrotic Domination',level:4,prepared:true}]});
 c=S.castCooperativeSpell(c,'darkdonte:necrotic-domination',{slot:7,chain:true,confirmed:true,formationConfirmed:true},[{creatureId:c.archivistCampaign.creatures[0].id,spellId:'helper',slot:4}]);
 const cast=c.archivistCampaign.lastCast;assert.equal(cast.dc,C.campaignProfile(c).dc+2);assert.equal(cast.secondaryDC,cast.dc-4);
});

test('one-minute power and Dominate effects expire after exactly ten rounds',()=>{
 let c=build('psion',20);c=P.learnCampaignPower(c,{name:'Minute effect',level:1,minutes:1});const id=c.archivistCampaign.knownPowers[0].id;c=P.manifestExtendedPower(c,id);
 for(let i=0;i<9;i++)c=S.advanceCampaignRound(c);assert(c.archivistCampaign.powerEffects[id].minutes>0);c=S.advanceCampaignRound(c);assert(!c.archivistCampaign.powerEffects[id]);
 let t=build('psion',5);t={...t,level:10,classLevels:[...t.classLevels,{definition:campaignClasses[2],edition:'2014',level:5}]};t=withCreature(t);t=P.manifestExtendedPower(t,'psionic-dominate',{targetType:'monstrosity'});t=P.resolveExtendedPower(t,t.archivistCampaign.creatures[0].id,{save:0});
 for(let i=0;i<10;i++)t=S.advanceCampaignRound(t);assert.equal(t.archivistCampaign.creatures[0].control.minutes,0);
});

test('blocked Awareness and Empowerment have no effects and cannot be resolved twice',()=>{
 for(const id of ['necrotic-awareness','necrotic-empowerment']){
  let c=build('archivist',20),spell=cystSpells.find(s=>s.catalogId==='darkdonte:'+id);c=C.castCampaignSpell(c,spell.catalogId,{slot:spell.level,confirmed:true});const hp=structuredClone(c.hp);
  c=S.resolveCampaignSpell(c,'self',{blocked:true});assert.equal(c.archivistCampaign.lastCast.lastResult,'Blocked: no effect');assert(!c.archivistCampaign.sensing);assert(!c.archivistCampaign.empowerment);assert.deepEqual(c.hp,hp);
  assert.throws(()=>S.resolveCampaignSpell(c,'self',{blocked:true}),/already/);
 }
});

test('destroyed Sage Psicrystal cannot grant skill bonuses after maximum HP grows',()=>{
 let c=build('psion',20);c.archivistCampaign.psicrystal={destroyed:true,damage:1,distance:0};assert.equal(C.campaignProfile(c).psicrystalBonus,0);assert.equal(C.campaignSkillBonus(c,'Arcana'),0);
});

test('Sage skill bonuses honor a lethal saved crystal HP snapshot before reconciliation',()=>{
 const c=build('psion',20);c.archivistCampaign.psicrystal={destroyed:false,damage:1,maxHP:1,distance:0};assert.equal(X.psicrystalProfile(c).alive,false);assert.equal(C.campaignProfile(c).psicrystalBonus,0);
});

test('all 134 eligible converted spell and Archivist-level combinations cast and resolve',()=>{
 let count=0;
 for(let level=1;level<=20;level++)for(const spell of [...cystSpells,...outsideCampaignSpells]){
  let c=withCreature(build('archivist',level));const eligible=spell.level<=C.campaignProfile(c).maxSpellLevel;
  if(!spell.campaignCyst&&eligible){c=C.acquireCampaignSpell(c,spell,{channel:'outside',source:'Approved archive',confirmed:true});c=C.prepareCampaignSpell(c,spell.catalogId,true);}
  if(!eligible){assert.throws(()=>C.castCampaignSpell(c,spell.catalogId,{slot:spell.level,confirmed:true}));continue;}
  c=C.castCampaignSpell(c,spell.catalogId,{slot:spell.level,confirmed:true});const id=c.archivistCampaign.creatures[0].id,rule=c.archivistCampaign.lastCast.rule,initialHP=c.archivistCampaign.creatures[0].hp.current;
  if(rule.requiresCyst)c=N.updateCreature(c,id,n=>({...n,cyst:{caster:c.id}}));
  const target=['sense','empower'].includes(rule.effect)?'self':id;
  c=S.resolveCampaignSpell(c,target,{save:0,damage:6,intRoll:12,chaRoll:2});const n=c.archivistCampaign.creatures.find(n=>n.id===id);
  assert.equal(c.slotsUsed[spell.level],1);assert.equal(c.currency.gp,rule.cost?9000:10000);
  if(rule.effect==='sense'){assert.equal(c.archivistCampaign.sensing.stage,1);assert.equal(c.archivistCampaign.sensing.minutes,10);}
  else if(rule.effect==='empower'){assert.equal(c.hp.temp,100);assert.equal(c.archivistCampaign.empowerment.rounds,level);assert.equal(C.campaignProfile(c).scores.int,28);}
  else if(rule.effect==='cyst')assert.equal(n.cyst.caster,c.id);
  else if(rule.effect==='scry')assert.equal(n.sensor.minutes,10);
  else if(rule.effect==='damage')assert.equal(n.hp.current,initialHP-6);
  else if(rule.effect==='control'){assert.equal(n.control.spellId,spell.catalogId);assert.equal(n.control.minutes,spell.catalogId==='darkdonte:necrotic-domination'?1440:null);}
  else if(rule.effect==='awaken'){assert(n.awakened);assert.equal(n.abilities.int,12);assert.equal(n.abilities.cha,12);assert.equal(n.hitDice,22);assert(n.hp.current>initialHP);assert(n.languages.includes('Common'));assert(!n.control);}
  else{assert(n.dead);assert.equal(n.hp.current,0);assert.equal(!!n.soulDestroyed,rule.effect==='termination');assert.equal(c.archivistCampaign.creatures.length,2);if(rule.effect==='eruption')assert(c.archivistCampaign.lastCast.erupted);}
  assert.throws(()=>S.resolveCampaignSpell(c,target,{save:0,damage:6,intRoll:12,chaRoll:2}),/already/);count++;
 }
 assert.equal(count,134);
});

test('all Mother Cyst success-save branches and blocked target effects preserve duplicate protection',()=>{
 for(const spell of cystSpells){let c=withCreature(build('archivist',20)),id=c.archivistCampaign.creatures[0].id;c=N.updateCreature(c,id,n=>({...n,cyst:{caster:c.id}}));c=C.castCampaignSpell(c,spell.catalogId,{slot:spell.level,confirmed:true});const target=['sense','empower'].includes(c.archivistCampaign.lastCast.rule.effect)?'self':id;c=S.resolveCampaignSpell(c,target,{save:99,damage:6});assert.throws(()=>S.resolveCampaignSpell(c,target,{save:99,damage:6}),/already/);}
 let c=withCreature(build('archivist',20)),id=c.archivistCampaign.creatures[0].id;c=C.castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:2,confirmed:true});c=S.resolveCampaignSpell(c,id,{save:0,blocked:true});assert(!c.archivistCampaign.creatures[0].cyst);assert.equal(c.archivistCampaign.lastCast.lastResult,'Blocked: no effect');
});

test('prayerbook acquisition, preparation and slot exhaustion are bounded at every Archivist level',()=>{
 for(let level=1;level<=20;level++){
  let c=build('archivist',level),p=C.campaignProfile(c);
  assert.throws(()=>C.acquireCampaignSpell(c,{...cure,edition:'3.5'}));assert.throws(()=>C.acquireCampaignSpell(c,{...cure,level:p.maxSpellLevel+1}));assert.throws(()=>C.acquireCampaignSpell(c,{...cure,classes:['Wizard']}));
  assert.throws(()=>C.acquireCampaignSpell(c,cure,{channel:'outside',source:'',confirmed:true}));assert.throws(()=>C.acquireCampaignSpell(c,cure,{channel:'outside',source:'approved',confirmed:false}));
  const outside=C.acquireCampaignSpell(c,{...cure,classes:['Wizard']},{channel:'outside',source:'approved',confirmed:true});assert.equal(C.campaignProfile(outside).growthRemaining,p.growthRemaining);
  for(let i=0;i<p.growthAllowance;i++)c=C.acquireCampaignSpell(c,{...cure,catalogId:'test:growth'+i});assert.throws(()=>C.acquireCampaignSpell(c,{...cure,catalogId:'test:overgrowth'}),/No free/);assert.throws(()=>C.acquireCampaignSpell(c,{...cure,catalogId:'test:growth0'}),/Already/);
  let prep=build('archivist',level);for(let i=0;i<p.preparedLimit;i++){const id='test:prepared'+i;prep=C.acquireCampaignSpell(prep,{...cure,catalogId:id},{channel:'outside',source:'approved',confirmed:true});prep=C.prepareCampaignSpell(prep,id,true);}
  prep=C.acquireCampaignSpell(prep,{...cure,catalogId:'test:overprepared'},{channel:'outside',source:'approved',confirmed:true});assert.throws(()=>C.prepareCampaignSpell(prep,'test:overprepared',true),/Preparation limit/);
  let cast=C.acquireCampaignSpell(build('archivist',level),cure);assert.throws(()=>C.castCampaignSpell(cast,cure.catalogId,{slot:1}),/Prepare/);cast=C.prepareCampaignSpell(cast,cure.catalogId,true);for(let i=0;i<p.slots[1];i++)cast=C.castCampaignSpell(cast,cure.catalogId,{slot:1});assert.throws(()=>C.castCampaignSpell(cast,cure.catalogId,{slot:1}),/available slot/);
 }
});

test('Psion1–20 known tiers, canonical costs, undiscounted ML caps and rest recovery',()=>{
 for(let level=1;level<=20;level++){
  let c=build('psion',level),p=P.extendedPsionProfile(c);assert.equal(p.ppMax,psionPoints[level]+Math.floor(5*level/2));assert.equal(p.knownLimit,psionKnown[level]);
  for(let tier=1;tier<=p.maxPowerLevel;tier++){const learned=P.learnCampaignPower(c,{name:'Configured '+tier,level:tier,minutes:1,save:'wis',damage:'1d6'}),id=learned.archivistCampaign.knownPowers[0].id;const manifested=P.manifestExtendedPower(learned,id);assert.equal(manifested.powerPointsUsed,2*tier-1);assert.throws(()=>P.manifestExtendedPower(learned,id,{augmentation:level-(2*tier-1)+1}),/before/);}
  c=P.learnCampaignPower(c,{...campaignPowers[1],level:1});c=X.manifestWithPsicrystal(c,'inertial-armor');c=C.campaignRest(c,'short');assert.equal(c.powerPointsUsed,1);c=C.campaignRest(c,'long');assert.equal(c.powerPointsUsed,0);assert.deepEqual(c.archivistCampaign.powerEffects,{});
 }
});

test('cantrip limits, class ownership and unprepared rituals keep independent prayerbook accounting',()=>{
 for(let level=1;level<=20;level++){
  let c=build('archivist',level);const limit=C.campaignProfile(c).cantrips;
  for(let i=0;i<limit;i++)c=C.acquireCampaignSpell(c,{...cure,name:'Cantrip '+i,catalogId:'test:cantrip'+i,level:0});
  assert.throws(()=>C.acquireCampaignSpell(c,{...cure,catalogId:'test:extra-cantrip',level:0}),/Cantrip limit/);
  assert.equal(C.campaignProfile(c).growthUsed,0);const cantrip=C.castCampaignSpell(c,'test:cantrip0');assert.equal(cantrip.archivistCampaign.lastCast.slot,0);assert(!cantrip.slotsUsed);
 }
 let c=build('archivist',1);c.spells=[{...cure,castingClassId:'2014:wizard',prepared:true}];assert.throws(()=>C.castCampaignSpell(c,cure.catalogId,{slot:1}),/not available/);
 c=C.acquireCampaignSpell(c,cure);assert.equal(c.spells.length,2);assert.throws(()=>C.castCampaignSpell(c,cure.catalogId,{slot:1}),/Prepare/);
 const ritual={...cure,catalogId:'test:ritual',name:'Detect Magic',ritual:true,concentration:true};c=C.acquireCampaignSpell(c,ritual);const before=structuredClone(c.slotsUsed);c=C.castCampaignSpell(c,ritual.catalogId,{ritual:true});assert.equal(c.concentration,'Detect Magic');assert.deepEqual(c.slotsUsed,before);assert(!c.spells.find(s=>s.catalogId===ritual.catalogId).prepared);
});

test('Reach plus Chain spends adjusted slots while retaining ordinary effect levels and cap approval',()=>{
 let c=build('archivist',20);c=C.acquireCampaignSpell(c,cure);c=C.prepareCampaignSpell(c,cure.catalogId,true);
 const reach=C.castCampaignSpell(c,cure.catalogId,{slot:3,reach:true});assert.equal(reach.slotsUsed[3],1);assert.equal(reach.archivistCampaign.lastCast.effectLevel,1);
 const chained=C.castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:7,reach:true,chain:true,confirmed:true});assert.equal(chained.slotsUsed[7],1);assert.equal(chained.archivistCampaign.lastCast.effectLevel,2);assert.equal(chained.archivistCampaign.lastCast.secondaryTargets,20);
 assert.throws(()=>C.castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:6,reach:true,chain:true,confirmed:true}),/available slot/);
 assert.throws(()=>C.castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:7,chain:true,confirmed:true}),/eligibility and range/);
 assert.throws(()=>C.castCampaignSpell({...c,feats:c.feats.filter(f=>f.name!=='Reach Spell')},cure.catalogId,{slot:3,reach:true}),/feat/);
 assert.throws(()=>C.castCampaignSpell(c,'darkdonte:necrotic-tumor',{slot:9,chain:true,confirmed:true}),/available slot/);
 c.archivistCampaign.rulings={chainCapApproved:true};const capped=C.castCampaignSpell(c,'darkdonte:necrotic-tumor',{slot:9,chain:true,confirmed:true});assert.equal(capped.archivistCampaign.lastCast.effectLevel,7);
});

test('prestige grants, daily discounts and type waivers preserve the undiscounted ML limit',()=>{
 for(let level=1;level<=10;level++){
  let c=build('psion',5);c={...c,level:5+level,classLevels:[...c.classLevels,{definition:campaignClasses[2],edition:'2014',level}]};
  const grants=P.extendedPsionProfile(c).powers.filter(p=>p.gate).map(p=>p.id);assert.deepEqual(grants,level>=5?['psionic-charm','psionic-dominate']:level>=3?['psionic-charm']:[]);
  if(level<3)continue;const before=structuredClone(c);const cast=P.manifestExtendedPower(c,'psionic-charm',{discount:true});assert.equal(cast.powerPointsUsed,1);assert.throws(()=>P.manifestExtendedPower(cast,'psionic-charm',{discount:true}),/already/);assert.throws(()=>P.manifestExtendedPower(C.campaignRest(cast,'short'),'psionic-charm',{discount:true}),/already/);assert.doesNotThrow(()=>P.manifestExtendedPower(C.campaignRest(cast,'long'),'psionic-charm',{discount:true}));assert.deepEqual(c,before);
  if(level<5)continue;
  const beast=P.manifestExtendedPower(c,'psionic-dominate',{targetType:'beast'});assert.equal(beast.powerPointsUsed,level>=7?7:9);
  const dragonCost=level>=9?7:11;if(dragonCost>P.extendedPsionProfile(c).manifesterLevel)assert.throws(()=>P.manifestExtendedPower(c,'psionic-dominate',{targetType:'dragon',discount:true}),/before/);else assert.equal(P.manifestExtendedPower(c,'psionic-dominate',{targetType:'dragon'}).powerPointsUsed,dragonCost);
  assert.throws(()=>P.manifestExtendedPower(c,'psionic-dominate',{augmentation:P.extendedPsionProfile(c).manifesterLevel-6,discount:true}),/before/);
 }
});
