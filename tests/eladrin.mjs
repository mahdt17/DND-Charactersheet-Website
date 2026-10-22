import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
let server,race,api,setup,resources,training,adv;
before(async()=>{
 server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
 setup=await server.ssrLoadModule('/src/GuidedSetup.jsx');
 if(existsSync('src/lib/eladrin.js'))api=await server.ssrLoadModule('/src/lib/eladrin.js');
 resources=await server.ssrLoadModule('/src/lib/resources.js');training=await server.ssrLoadModule('/src/lib/training.js');adv=await server.ssrLoadModule('/src/lib/advancement.js');
 race=setup.raceOptions('2014').find(r=>r.catalogId==='2014:eladrin-motm');
});
after(async()=>server?.close());
const make=(level=1,season='Summer')=>({name:'Season walker',ruleset:'2014',race:'Eladrin',raceDefinition:race,className:'Wizard',level,abilities:{str:10,dex:14,con:12,int:18,wis:12,cha:8},abilityBonuses:{},hp:{current:10,max:10},eladrin:{season,ability:'int',trance:[]},resources:[],spells:[],inventory:[],skillProf:{}});
test('Monsters of the Multiverse Eladrin is a complete 5e creation option, isolated from other editions',()=>{
 assert(race,'Eladrin must be selectable in 5e creation');
 assert.equal(race.speed,30);assert.equal(race.size,'Medium');assert.equal(race.type,'Humanoid');
 assert.equal(race.traits.length,5);
 assert(setup.raceOptions('custom').some(r=>r.catalogId===race.catalogId));
 assert(!setup.raceOptions('2024').some(r=>r.catalogId===race.catalogId));
});
test('Fey Step uses total level proficiency, selected mental ability and only gains seasonal effects at level 3',()=>{
 assert(api,'Eladrin mechanics must exist');
 for(let level=1;level<=20;level++){
  const p=api.eladrinProfile(make(level));assert.equal(p.max,2+Math.floor((level-1)/4));assert.equal(p.dc,8+p.max+4);
  assert.equal(p.seasonal,level>=3);assert.equal(p.fireDamage,level>=3?p.max:0);
 }
 assert.equal(api.eladrinProfile({...make(5),eladrin:{season:'Winter',ability:'wis'}}).dc,12);
 assert.equal(api.eladrinProfile({...make(),raceDefinition:{name:'Eladrin',edition:'2014',catalogId:'homebrew:eladrin'}}).active,false);
});
test('Fey Step and the shared tracker spend one canonical use, survive reload and cannot overspend',()=>{
 assert(api);let c=make(3);
 c={...c,...api.useFeyStep(c)};assert.equal(resources.characterResources(c).find(r=>r.id===api.feyStepId).used,1);
 c={...c,...resources.adjustResource(c,api.feyStepId,1)};assert.equal(api.eladrinProfile(c).remaining,0);
 assert.throws(()=>api.useFeyStep(JSON.parse(JSON.stringify(c))),/remaining/i);
 assert.throws(()=>api.useFeyStep({...make(),conditions:['Incapacitated']}),/incapacitated/i);
 assert.throws(()=>api.useFeyStep({...make(),hp:{current:0,max:10}}),/conscious/i);
 const altered={...make(),resources:[{id:api.feyStepId,max:99,used:1,manual:true,reset:'short',raceManaged:true}]};
 assert.equal(resources.characterResources(altered).find(r=>r.id===api.feyStepId).max,2);
});
test('only long rests recover Fey Step and replace Trance choices without granting permanent training',()=>{
 assert(api);let c={...make(5),...api.useFeyStep(make(5))};
 c={...c,...resources.restResources(c,'short')};assert.equal(api.eladrinProfile(c).used,1);
 c={...c,...resources.restResources(c,'long',{eladrin:{season:'Winter',trance:['longsword','lute']}})};
 assert.equal(api.eladrinProfile(c).used,0);assert.equal(c.eladrin.season,'Winter');assert.equal(c.eladrin.ability,'int');
 assert(training.hasWeaponTraining(c,{index:'longsword',weapon_category:'Martial'}));
 assert(training.recordedTraining(c).some(p=>p.kind==='tools'&&p.name==='Lute'));
 c={...c,...resources.restResources(c,'long',{eladrin:{season:'Spring',trance:[]}})};
 assert(!training.recordedTraining(c).some(p=>p.index==='longsword'||p.index==='lute'));
 assert.throws(()=>api.finishEladrinTrance(c,{season:'Winter',trance:['longsword','longsword']}),/different/i);
 assert.throws(()=>api.finishEladrinTrance(c,{season:'Winter',trance:['made-up-tool']}),/weapon or tool/i);
 assert.throws(()=>api.finishEladrinTrance({...c,toolProf:'Lute'},{season:'Winter',trance:['lute']}),/already/i);
});
test('Eladrin is considered an elf for prerequisites without affecting unrelated races',()=>{
 assert(api);const feat={name:'Elf fixture',prerequisites:[{kind:'race',text:'Elf'}]};
 assert(adv.qualified(adv.requirements(feat,make())));
 assert(!adv.qualified(adv.requirements(feat,{...make(),race:'Human',raceDefinition:null})));
});
test('Trance includes the full PHB tool list, including kits, gaming sets and vehicles',()=>{
 assert(api);
 for(const index of ['disguise-kit','forgery-kit','herbalism-kit','poisoners-kit','dragonchess-set','three-dragon-ante-set','vehicles-land','vehicles-water'])assert(api.tranceEquipment.some(e=>e.index===index),index);
 const sailor={...make(),toolProf:"Navigator's tools, water vehicles"};
 assert(!api.eladrinTranceOptions(sailor).some(e=>e.index==='vehicles-water'),'existing water vehicle proficiency');
});
test('race trait reconciliation preserves unrelated homebrew even when its title matches',()=>{
 const custom={id:'custom-darkvision',name:'Darkvision',homebrew:true,description:'Personal source ruling'};
 const c=api.reconcileEladrin({...make(),traits:[custom]});
 assert(c.traits.some(t=>t.id===custom.id&&t.description===custom.description));
 assert.equal(api.reconcileEladrin(c).traits.length,c.traits.length);
});
