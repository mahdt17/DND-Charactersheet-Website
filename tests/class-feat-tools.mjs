import assert from 'node:assert/strict';
import test from 'node:test';
import {campaignCystSpells,campaignProfile,castCampaignSpell} from '../src/lib/archivistCampaign.js';
import {conversionFeats} from '../src/data/archivistCampaign.js';
import {addCampaignCreature} from '../src/lib/campaignCreatures.js';
import {resolveCampaignSpell,castCooperativeSpell} from '../src/lib/campaignSpellEffects.js';
import {startCampaignProject,workCampaignProject,finishCampaignProject} from '../src/lib/campaignDowntime.js';
import {conversionFeatCasters} from '../src/lib/conversionFeatCasting.js';

const feat=name=>({...conversionFeats.find(f=>f.name===name),id:name});
const row=(name,level)=>({name,level,edition:'2014',catalogId:'2014:'+name.toLowerCase(),definition:{name,edition:'2014',catalogId:'2014:'+name.toLowerCase()}});
const build=(rows=[row('Cleric',5)])=>({name:'Independent feats',ruleset:'2014',className:rows[0].name,classDefinition:rows[0].definition,classLevels:rows,level:rows.reduce((n,r)=>n+r.level,0),abilities:{str:10,dex:10,con:10,int:12,wis:18,cha:16},hp:{current:30,max:30,temp:0},feats:[feat('Mother Cyst')],spells:[],inventory:[],currency:{gp:1000},archivistCampaign:{independentChoices:true}});

test('Mother Cyst automatically grants the total-level spell chain without Archivist',()=>{
 for(let level=1;level<=20;level++){
  const c=build([row('Cleric',1),...(level>1?[row('Fighter',level-1)]:[])]);
  const names=campaignCystSpells(c).map(s=>s.name);
  const tiers=[['Necrotic Awareness',1],['Necrotic Cyst',3],['Necrotic Scrying',3],['Necrotic Bloat',5],['Necrotic Domination',7],['Necrotic Burst',9],['Necrotic Eruption',11],['Necrotic Tumor',13],['Necrotic Empowerment',15],['Necrotic Termination',17]];
  assert.deepEqual(names,tiers.filter(([,at])=>level>=at).map(([name])=>name),'character level '+level);
  assert.deepEqual(campaignCystSpells(JSON.parse(JSON.stringify(c))).map(s=>s.name),names);
  assert.equal(campaignProfile(c).archivist,0);
  assert.equal(c.spells.length,0,'derived grants never consume class choices');
 }
});

test('a non-Archivist cyst cast uses its own ability and real shared slots',()=>{
 const c=build();
 const cast=castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:2,confirmed:true});
 assert.equal(cast.slotsUsed[2],1);
 assert.equal(cast.archivistCampaign.lastCast.dc,15,'Cleric Wisdom, not Archivist Intelligence');
 assert.equal(cast.archivistCampaign.lastCast.casterLevel,5);
 assert.throws(()=>castCampaignSpell({...c,slotsUsed:{2:3}},'darkdonte:necrotic-cyst',{slot:2,confirmed:true}),/slot/i);
 const lowCaster=build([row('Cleric',1),row('Fighter',16)]);
 assert.equal(campaignCystSpells(lowCaster).length,10);
 assert.throws(()=>castCampaignSpell(lowCaster,'darkdonte:necrotic-termination',{slot:9,confirmed:true}),/slot/i,'unlocked spells do not grant high slots');
 assert.throws(()=>castCampaignSpell({...c,conditions:['Stunned']},'darkdonte:necrotic-cyst',{slot:2,confirmed:true}),/cannot act/i);
});

test('source removal and other-edition lookalikes do not grant cyst magic',()=>{
 const c=build();
 for(const f of [[],[{...feat('Mother Cyst'),edition:'3.5'}],[{...feat('Mother Cyst'),catalogId:'3.5:mother-cyst'}]]){
  const invalid={...c,feats:f};
  assert.equal(campaignCystSpells(invalid).length,0);
  assert.throws(()=>castCampaignSpell(invalid,'darkdonte:necrotic-cyst',{slot:2,confirmed:true}));
 }
 assert.equal(campaignCystSpells({...c,ruleset:'3.5'}).length,0);
});

test('cyst spell damage and empowerment scale without an Archivist level',()=>{
 let c=addCampaignCreature(build([row('Cleric',15)]),{name:'Victim',level:20,type:'humanoid'});
 const id=c.archivistCampaign.creatures[0].id;
 c={...c,archivistCampaign:{...c.archivistCampaign,creatures:c.archivistCampaign.creatures.map(n=>({...n,cyst:{source:'recorded'}}))}};
 const cast=castCampaignSpell(c,'darkdonte:necrotic-bloat',{slot:3,confirmed:true});
 const hit=resolveCampaignSpell(cast,id,{save:0,damage:30});
 assert.equal(hit.archivistCampaign.creatures[0].hp.current, c.archivistCampaign.creatures[0].hp.current-30);
 const empower=resolveCampaignSpell(castCampaignSpell(c,'darkdonte:necrotic-empowerment',{slot:8,confirmed:true}),'self');
 assert.equal(empower.archivistCampaign.empowerment.rounds,15);
});

test('Graft Flesh projects depend on the feat, not Archivist, including completion',()=>{
 const c={...build(),feats:[feat('Graft Flesh: Silthilar')],currency:{gp:100000}};
 let working=startCampaignProject(c,{kind:'graft',recipeId:'bones',materialsConfirmed:true});
 const job=working.archivistCampaign.projects[0];
 assert.throws(()=>workCampaignProject({...working,feats:[]},job.id,1),/feat/i);
 working=workCampaignProject(working,job.id,job.hours);
 assert.throws(()=>finishCampaignProject({...working,feats:[]},job.id,{medicine:30}),/feat/i);
 const completed=finishCampaignProject(working,job.id,{medicine:30});assert.equal(completed.archivistCampaign.grafts.length,1);
 assert.equal(campaignProfile({...completed,feats:[]}).scores.con,12,'installed grafts survive removing their crafting feat');
});

test('Mother Cyst uses the selected ability and Pact pool across caster combinations',()=>{
 for(const name of ['Wizard','Cleric','Druid','Bard','Sorcerer','Paladin','Ranger','Artificer','Warlock']){
  const c=build([row(name,5),row('Fighter',1)]),options={slot:name==='Warlock'?3:2,pool:name==='Warlock'?'pact':'standard',confirmed:true};
  const cast=castCampaignSpell(c,'darkdonte:necrotic-cyst',options);
  assert.equal(cast[name==='Warlock'?'pactSlotsUsed':'slotsUsed'][options.slot],1,name);
  assert.equal(cast.archivistCampaign.lastCast.casterLevel,6,name);
 }
 const c=build([row('Wizard',5),row('Cleric',3)]),casters=conversionFeatCasters(c);
 assert.equal(casters.length,2);
 for(const [id,dc] of [['2014:wizard',12],['2014:cleric',15]]){
  const selected={...c,archivistCampaign:{...c.archivistCampaign,featCastingClassId:id}};
  assert.equal(castCampaignSpell(selected,'darkdonte:necrotic-cyst',{slot:2,confirmed:true}).archivistCampaign.lastCast.dc,dc);
 }
 assert.throws(()=>castCampaignSpell({...c,archivistCampaign:{featCastingClassId:'removed:class'}},'darkdonte:necrotic-cyst',{slot:2,confirmed:true}),/class/i);
 const purePact=castCampaignSpell(build([row('Warlock',5)]),'darkdonte:necrotic-cyst',{slot:3,confirmed:true});
 assert.equal(purePact.slotsUsed[3],1,'single Warlock retains its existing short-rest slot store');
});

test('Cooperative Cyst uses the selected caster DC before helper bonuses',()=>{
 let c=addCampaignCreature({...build(),feats:[feat('Mother Cyst'),feat('Cooperative Spell')]},{name:'Helper',role:'caster',level:3});
 const helper=c.archivistCampaign.creatures[0];helper.cooperative=true;helper.spells=[{id:'helper-cyst',name:'Necrotic Cyst',level:2,prepared:true}];
 const cast=castCooperativeSpell(c,'darkdonte:necrotic-cyst',{slot:2,confirmed:true,formationConfirmed:true},[{creatureId:helper.id,spellId:'helper-cyst',slot:2}]);
 assert.equal(cast.archivistCampaign.lastCast.dc,17);
});

test('feat casting honors primary ability overrides and ignores stale automatic slot overrides',()=>{
 const c={...build(),castingAbility:'cha'};
 assert.equal(castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:2,confirmed:true}).archivistCampaign.lastCast.dc,14);
 const wizard={...build([row('Wizard',17)]),slotOverride:[0,4,3,3,3,3,2,2,2,20],slotsUsed:{9:1}};
 assert.throws(()=>castCampaignSpell(wizard,'darkdonte:necrotic-termination',{slot:9,confirmed:true}),/slot/i);
});

test('a feat cannot manufacture a Wizard slot table for a homebrew lookalike',()=>{
 const r=row('Wizard',5);r.definition={...r.definition,catalogId:'homebrew:custom-wizard',homebrew:true,source:'Homebrew',spellcastingAbility:'int'};r.catalogId=r.definition.catalogId;
 const c=build([r]);
 assert.throws(()=>castCampaignSpell(c,'darkdonte:necrotic-cyst',{slot:2,confirmed:true}),/class|slot/i);
 const configured={...c,slotOverride:[0,2,1]};
 assert.equal(castCampaignSpell(configured,'darkdonte:necrotic-cyst',{slot:2,confirmed:true}).slotsUsed[2],1,'explicit manual source slots remain usable');
});
