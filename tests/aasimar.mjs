import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
let server,setup,api,data,resources,languages;
before(async()=>{
 server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
 setup=await server.ssrLoadModule('/src/GuidedSetup.jsx');
 resources=await server.ssrLoadModule('/src/lib/resources.js');languages=await server.ssrLoadModule('/src/lib/languages.js');
 if(existsSync('src/lib/aasimar.js'))api=await server.ssrLoadModule('/src/lib/aasimar.js');
 if(existsSync('src/data/aasimar.js'))data=await server.ssrLoadModule('/src/data/aasimar.js');
});
after(async()=>server?.close());
const make=(level=1,subrace='Protector Aasimar')=>({name:'Celestial traveler',ruleset:'2014',race:'Aasimar',subrace,raceDefinition:data?.aasimarRace,className:'Fighter',level,abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:14},abilityBonuses:{cha:2,wis:1},hp:{current:2,max:25,temp:3},conditions:[],resources:[],spells:[],inventory:[],traits:[]});
test('supplied Aasimar source and all three fixed-bonus variants are available in 5e and isolated from other editions',()=>{
 const race=setup.raceOptions('2014').find(r=>r.catalogId==='2014:aasimar-vgm');assert(race,'the supplied Aasimar must be selectable');
 assert.equal(race.name,'Aasimar');assert.equal(race.speed,30);assert.equal(race.size,'Medium');assert.deepEqual(race.bonuses,{cha:2});
 assert.deepEqual(data.aasimarSubraces.map(s=>[s.name,s.ability_bonuses[0].ability_score.index,s.ability_bonuses[0].bonus]),[['Protector Aasimar','wis',1],['Scourge Aasimar','con',1],['Fallen Aasimar','str',1]]);
 assert(setup.raceOptions('custom').some(r=>r.catalogId===race.catalogId));
 for(const edition of ['2024','3.5'])assert(!setup.raceOptions(edition).some(r=>r.catalogId===race.catalogId));
});
test('fixed Common and Celestial coexist with background language choices',()=>{
 assert(api);const plan=languages.languagePlan({...make(),background:'Sage'},18);
 assert.equal(plan.manual,false);assert.deepEqual(plan.automatic.map(x=>x.name),['Common','Celestial']);
 assert.deepEqual(plan.groups.map(g=>[g.id,g.count]),[['background',2]]);
 assert(languages.chosenLanguages(plan,{background:['Elvish','Dwarvish']}).complete);
});
test('level gates, full-level healing/damage, Charisma DC and Scourge rounding follow the supplied rules at levels 1–20',()=>{
 assert(api);
 for(let n=1;n<=20;n++){
  for(const variant of ['Protector Aasimar','Scourge Aasimar','Fallen Aasimar']){
   const p=api.aasimarProfile(make(n,variant));assert.equal(p.healing,n);assert.equal(p.extraDamage,n);assert.equal(p.canTransform,n>=3);
   assert.equal(p.dc,8+2+Math.floor((n-1)/4)+3);assert.deepEqual(p.resistances,['radiant','necrotic']);
   if(variant==='Scourge Aasimar'){assert.equal(p.auraDamage,Math.ceil(n/2));assert.equal(p.selfAuraDamage,Math.floor(Math.ceil(n/2)/2));}
  }
 }
 for(const [variant,flight,type] of [['Protector Aasimar',30,'radiant'],['Scourge Aasimar',0,'radiant'],['Fallen Aasimar',0,'necrotic']]){
  const c=make(3,variant),active={...c,...api.useAasimarTransformation(c)};assert.equal(api.aasimarProfile(active).flyingSpeed,flight);assert.equal(api.aasimarProfile(active).damageType,type);
 }
 assert.equal(api.aasimarProfile({...make(),raceDefinition:{catalogId:'other:aasimar',edition:'2014'}}).active,false);
 assert.equal(api.aasimarProfile({...make(),ruleset:'3.5'}).active,false);
 assert.equal(api.aasimarProfile({...make(),ruleset:'2024'}).active,false);
 assert.equal(api.aasimarProfile({...make(),ruleset:'custom',mechanics:'2014'}).active,true);
 assert.equal(api.aasimarProfile(make(5,'Missing variant')).canTransform,false);
});
test('Healing Hands uses one canonical long-rest charge and self-healing caps HP without touching temporary HP or class spells',()=>{
 assert(api);let c=make(5);c={...c,...api.useHealingHands(c,{self:true})};
 assert.deepEqual(c.hp,{current:7,max:25,temp:3});assert.equal(api.aasimarProfile(c).healingRemaining,0);assert.throws(()=>api.useHealingHands(c),/remaining/i);
 const other=api.useHealingHands(make(5),{self:false});assert.equal(other.hp,undefined);
 assert.equal(api.useHealingHands({...make(20),hp:{current:24,max:25,temp:3}},{self:true}).hp.current,25);
 assert.equal(resources.characterResources(c).find(r=>r.id===api.aasimarHealingId).used,1);
 c={...c,...resources.restResources(c,'short')};assert.equal(api.aasimarProfile(c).healingRemaining,0);
 c={...c,...resources.restResources(c,'long')};assert.equal(api.aasimarProfile(c).healingRemaining,1);assert.deepEqual(c.spells,[]);
});
test('transformations unlock at 3, share the tracker, survive save/reopen and do not recharge on ending or short rest',()=>{
 assert(api);assert.throws(()=>api.useAasimarTransformation(make(2)),/3/);
 let c=make(3,'Fallen Aasimar');c={...c,...api.useAasimarTransformation(c)};assert(api.aasimarProfile(c).formActive);
 assert.equal(resources.characterResources(c).find(r=>r.id===api.aasimarTransformationId).used,1);
 c=JSON.parse(JSON.stringify(c));assert.equal(api.aasimarProfile(c).transformationRemaining,0);assert.throws(()=>api.useAasimarTransformation(c),/remaining/i);
 c={...c,...api.endAasimarTransformation(c)};assert(!api.aasimarProfile(c).formActive);assert.equal(api.aasimarProfile(c).transformationRemaining,0);
 c={...c,...resources.restResources(c,'short')};assert.equal(api.aasimarProfile(c).transformationRemaining,0);
 c={...c,...resources.restResources(c,'long')};assert.equal(api.aasimarProfile(c).transformationRemaining,1);
 c={...c,...resources.adjustResource(c,api.aasimarTransformationId,1)};assert.equal(api.aasimarProfile(c).transformationRemaining,0);
 assert.throws(()=>resources.adjustResource(c,api.aasimarTransformationId,1),/remaining/i);
 const active=make(5);const transformed={...active,...api.useAasimarTransformation(active)};
 assert.equal(resources.restResources(transformed,'short').aasimar.transformation,null);
 assert.equal(api.aasimarProfile({...transformed,subrace:'Scourge Aasimar'}).formActive,false);
});
test('activation guards reject incapacitation, 0 HP and unrelated sources without changing their saved state',()=>{
 assert(api);
 for(const condition of ['Incapacitated','Unconscious','Paralyzed','Stunned','Petrified','Dead']){
  const c={...make(3),conditions:[condition]};assert.throws(()=>api.useHealingHands(c),/incapacitated/i);assert.throws(()=>api.useAasimarTransformation(c),/incapacitated/i);
 }
 assert.throws(()=>api.useHealingHands({...make(),hp:{current:0,max:10}}),/conscious/i);
 assert.throws(()=>api.useHealingHands({...make(),race:'Human'}),/Aasimar/i);
 const altered={...make(5),resources:[{id:api.aasimarHealingId,max:99,used:1,manual:true,reset:'short'}]};assert.equal(resources.characterResources(altered).find(r=>r.id===api.aasimarHealingId).max,1);
});
test('temporarily missing variants or lower levels preserve spent transformation uses through resource normalization',()=>{
 assert(api);const c=make(5),spent={...c,...api.useAasimarTransformation(c)};
 for(const unavailable of [{...spent,subrace:''},{...spent,level:2}]){
  const normalized={...unavailable,resources:resources.characterResources(unavailable)};
  assert.throws(()=>api.useAasimarTransformation(normalized),/3/);
  const restored={...normalized,level:5,subrace:'Fallen Aasimar'};restored.resources=resources.characterResources(restored);
  assert.equal(api.aasimarProfile(restored).transformationRemaining,0,'unavailable features must retain expenditure');
  assert.throws(()=>api.useAasimarTransformation(restored),/remaining/i);
  const rested={...restored,...resources.restResources(restored,'long')};assert.equal(api.aasimarProfile(rested).transformationRemaining,1);
 }
});
test('trait reconciliation replaces source-owned variants, preserves homebrew and is idempotent',()=>{
 assert(api);const custom={id:'custom-resistance',name:'Celestial Resistance',description:'Personal ruling',homebrew:true};
 const c=api.reconcileAasimar({...make(),traits:[custom]});assert(c.traits.some(t=>t.name==='Radiant Soul'));assert(c.traits.some(t=>t.id===custom.id));
 assert.equal(api.reconcileAasimar(c).traits.length,c.traits.length);
 const fallen=api.reconcileAasimar({...c,subrace:'Fallen Aasimar'});assert(fallen.traits.some(t=>t.name==='Necrotic Shroud'));assert(!fallen.traits.some(t=>t.name==='Radiant Soul'));
 const light=api.aasimarLightSpell({...make(),className:'Wizard'});assert.equal(light.name,'Light');assert.equal(light.level,0);assert.equal(light.racialAbility,'cha');assert.equal(light.raceGrantId,'2014:aasimar-vgm');
});
