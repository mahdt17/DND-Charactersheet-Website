import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
let server,setup,api,resources,training,languages,adv;
before(async()=>{
 server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
 setup=await server.ssrLoadModule('/src/GuidedSetup.jsx');
 if(existsSync('src/lib/shadarKai.js'))api=await server.ssrLoadModule('/src/lib/shadarKai.js');
 resources=await server.ssrLoadModule('/src/lib/resources.js');training=await server.ssrLoadModule('/src/lib/training.js');languages=await server.ssrLoadModule('/src/lib/languages.js');adv=await server.ssrLoadModule('/src/lib/advancement.js');
});
after(async()=>server?.close());
const race=version=>setup.raceOptions('2014').find(r=>r.catalogId===`2014:shadar-kai-${version}`);
const make=(version='motm',level=1)=>({name:'Shadow traveler',ruleset:'2014',race:'Shadar-kai',raceDefinition:race(version),className:'Wizard',level,abilities:{str:10,dex:14,con:12,int:16,wis:12,cha:8},abilityBonuses:{},hp:{current:10,max:10},resources:[],spells:[],traits:[],inventory:[],skillProf:{},shadarKai:{trance:[]}});
test('both clearly labelled Shadar-kai sources are 5e options with separate bonuses and source identities',()=>{
 for(const [version,year] of [['mtf',2018],['motm',2022]]){const r=race(version);assert(r,`Missing ${version} Shadar-kai`);assert.equal(r.name,'Shadar-kai');assert.match(r.displayName,new RegExp(String(year)));assert.equal(r.speed,30);assert.equal(r.size,'Medium');assert(setup.raceOptions('custom').some(x=>x.catalogId===r.catalogId));for(const edition of ['2024','3.5'])assert(!setup.raceOptions(edition).some(x=>x.catalogId===r.catalogId));}
 assert.deepEqual(race('mtf').bonuses,{dex:2,con:1});assert.equal(race('motm').flexibleAbilities,true);
});
test('total character levels 1–20 scale only MotM charges, with the same level-3 ward gate',()=>{
 assert(api);for(const version of ['mtf','motm'])for(let level=1;level<=20;level++){
  const c=make(version,level),p=api.shadarKaiProfile(c);assert(p.active);assert.equal(p.max,version==='mtf'?1:2+Math.floor((level-1)/4));assert.equal(p.wardAvailable,level>=3);assert.equal(p.wardActive,false);assert.deepEqual(p.resistances,['necrotic']);
  const used={...c,...api.useBlessing(c)};assert.equal(api.shadarKaiProfile(used).remaining,p.max-1);assert.equal(api.shadarKaiProfile(used).wardActive,level>=3);
 }
});
test('actions enforce exact source/edition, consciousness, incapacity and canonical resource limits',()=>{
 assert(api);for(const version of ['mtf','motm']){
  const c=make(version,5),id=api.blessingResource(c).id;assert.equal(api.shadarKaiProfile({...c,ruleset:'custom',mechanics:'2014'}).active,true);
  for(const change of [{race:'Human'},{raceDefinition:null},{raceDefinition:{...c.raceDefinition,catalogId:'homebrew:shadar-kai'}},{ruleset:'2024'},{ruleset:'3.5'},{ruleset:'custom',mechanics:'2024'}]){assert.equal(api.shadarKaiProfile({...c,...change}).active,false);assert.throws(()=>api.useBlessing({...c,...change}),/grant/i);}
  for(const conditions of [['Stunned'],[{name:'Unconscious'}],'Paralyzed','Dead'])assert.throws(()=>api.useBlessing({...c,conditions}),/incapacitated/i);
  assert.throws(()=>api.useBlessing({...c,hp:{current:0,max:10}}),/conscious/i);
  const altered={...c,resources:[{id,max:99,used:6,manual:true,reset:'short'}]};assert.equal(resources.characterResources(altered).find(r=>r.id===id).max,version==='mtf'?1:3);assert.throws(()=>api.useBlessing(altered),/remaining/i);
 }
});
test('the turn reminder, short rest and save/reopen never refund a teleport; long rest restores it',()=>{
 assert(api);for(const version of ['mtf','motm']){
  let c=make(version,5);c={...c,...api.useBlessing(c)};c=JSON.parse(JSON.stringify(c));const before=api.shadarKaiProfile(c).remaining;assert(api.shadarKaiProfile(c).wardActive);
  c={...c,...api.endBlessingWard(c)};assert.equal(api.shadarKaiProfile(c).wardActive,false);assert.equal(api.shadarKaiProfile(c).remaining,before);
  c={...c,...resources.restResources(c,'short')};assert.equal(api.shadarKaiProfile(c).remaining,before);assert.equal(api.shadarKaiProfile(c).wardActive,false);
  c={...c,...resources.restResources(c,'long')};assert.equal(api.shadarKaiProfile(c).remaining,api.shadarKaiProfile(c).max);
  const id=api.blessingResource(c).id;while(api.shadarKaiProfile(c).remaining)c={...c,...resources.adjustResource(c,id,1)};assert.throws(()=>api.useBlessing(c),/remaining/i);assert.throws(()=>resources.adjustResource(c,id,1),/remaining/i);
 }
 const used={...make('motm',17),...api.useBlessing(make('motm',17))},lowered={...used,level:1};assert.equal(api.shadarKaiProfile(lowered).used,1);assert.equal(api.shadarKaiProfile(lowered).wardActive,false);assert.equal(api.shadarKaiProfile({...lowered,level:17}).remaining,5);
});
test('MotM training affects real proficiency, replaces only on long rest, and is absent from legacy',()=>{
 assert(api);let c=make('motm',5);c={...c,...api.finishShadarKaiTrance(c,{trance:['longsword','lute']})};assert(training.hasWeaponTraining(c,{index:'longsword',weapon_category:'Martial'}));assert(training.recordedTraining(c).some(p=>p.name==='Lute'));
 c={...c,...resources.restResources(c,'short')};assert.deepEqual(c.shadarKai.trance,['longsword','lute']);
 c={...c,...resources.restResources(c,'long',{shadarKai:{trance:['battleaxe','herbalism-kit']}})};assert(!training.hasWeaponTraining(c,{index:'longsword',weapon_category:'Martial'}));assert(training.hasWeaponTraining(c,{index:'battleaxe',weapon_category:'Martial'}));
 c={...c,...resources.restResources(c,'long')};assert.deepEqual(c.shadarKai.trance,[]);
 for(const picks of [['lute'],['lute','lute'],['made-up','lute']])assert.throws(()=>api.finishShadarKaiTrance(c,{trance:picks}),/two|different|PHB/i);
 assert.throws(()=>api.finishShadarKaiTrance({...c,toolProf:'Lute'},{trance:['lute','longsword']}),/already/i);
 const legacy={...c,raceDefinition:race('mtf'),shadarKai:{trance:['longsword','lute'],wardSource:race('motm').catalogId}};assert.deepEqual(api.shadarKaiTraining(legacy),[]);assert.equal(api.shadarKaiProfile(legacy).wardActive,false);assert.deepEqual(api.finishShadarKaiTrance(legacy,{trance:['lute']}),{});
});
test('each source grants Perception, preserves homebrew traits, and qualifies as an elf',()=>{
 assert(api);const feat={name:'Elf fixture',prerequisites:[{kind:'race',text:'Elf'}]};for(const version of ['mtf','motm']){
  const custom={id:'custom',name:'Darkvision',homebrew:true,description:'Personal ruling'},c=api.reconcileShadarKai({...make(version),traits:[custom]});assert(c.skillProf.Perception);assert(c.traits.some(t=>t===custom));assert.equal(c.traits.length,api.reconcileShadarKai(c).traits.length);assert(adv.qualified(adv.requirements(feat,c)));
  const other=api.reconcileShadarKai({...c,race:'Human',raceDefinition:null});assert.deepEqual(other.traits,[custom]);assert.equal(api.shadarKaiProfile(other).active,false);
 }
 assert(!adv.qualified(adv.requirements(feat,{...make(),race:'Human',raceDefinition:null})));
});
test('legacy languages are fixed while MotM language choices retain their separate background grant',()=>{
 assert(api);const legacy=languages.languagePlan({...make('mtf'),background:'Sage'});assert.deepEqual(legacy.automatic.map(x=>x.name),['Common','Elvish']);assert.deepEqual(legacy.groups.map(g=>[g.id,g.count]),[['background',2]]);
 const modern=languages.languagePlan({...make('motm'),background:'Sage'});assert.equal(modern.manual,false);assert.deepEqual(modern.automatic.map(x=>x.name),['Common']);assert.deepEqual(modern.groups.map(g=>[g.id,g.count]),[['race',1],['background',2]]);assert(languages.chosenLanguages(modern,{race:['Elvish'],background:['Giant','Dwarvish']}).complete);
});
