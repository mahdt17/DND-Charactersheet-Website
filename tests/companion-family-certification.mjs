import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const names=['ArtificialMind','DancingItem','DruidCompanions','FungalZombie','ShadowHounds','SentinelRaven','Necromancy','Specter','EchoKnight','BeastMaster','Drakewarden','Lorehold'];
const modules={};for(const name of names)modules[name]=await server.ssrLoadModule('/src/lib/subclass'+name+'.js');
const {reconcileSubclassStates}=await server.ssrLoadModule('/src/lib/subclassState.js');
const {advanceEffectTime}=await server.ssrLoadModule('/src/lib/spellEffects.js');
await server.close();
const apply=(c,p)=>({...c,...p});
const make=(className,subclass,level)=>({ruleset:'2014',className,subclass,level:level+5,classDefinition:{name:className,index:className.toLowerCase(),edition:'2014'},classLevels:[{catalogId:'2014:'+className.toLowerCase(),name:className,edition:'2014',level,subclass},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:5}],abilities:{str:10,dex:10,con:10,int:16,wis:16,cha:16},hp:{current:20,max:20,temp:0},resources:[],slotsUsed:{},activeEffects:[{id:'manual',notes:'Keep me'}],inventory:[{id:'book',name:'Book',notes:'Manual inventory'}],subclassCompanions:[{id:'manual-companion',inventory:[{id:'old-item'}]}],thralls:[{id:'legacy-thrall'}],entomancer:{notes:'Preserve legacy'},spells:[],actions:[]});
const rows=[
 ['ArtificialMind','Artificer','Archivist (UA)',3,(l,c)=>l.createArtificialMind(c,{itemId:'book',material:'Plant',skills:['Arcana','History'],confirmed:true}),(l,c)=>l.artificialMind(c)],
 ...['Creation','Creation (UA)'].map(s=>['DancingItem','Bard',s,6,(l,c)=>l.animateDancingItem(c,{itemId:'book',confirmed:true}),(l,c)=>l.dancingItem(c)]),
 ...['Wildfire','Wildfire (UA)','Primeval (UA)'].map(s=>['DruidCompanions','Druid',s,2,(l,c)=>l.summonDruidCompanion(c,{placement:true}),(l,c)=>l.druidCompanion(c)]),
 ['FungalZombie','Druid','Spores',6,(l,c)=>l.animateFungalZombie(c,{triggered:true}),(l,c)=>l.fungalZombies(c)[0]],
 ...['Shadow Magic','Shadow (UA)'].map(s=>['ShadowHounds','Sorcerer',s,6,(l,c)=>l.summonShadowHound(c,{target:'Ogre',confirmed:true}),(l,c)=>l.shadowHounds(c)[0]]),
 ['SentinelRaven','Warlock','Raven Queen (UA)',1,(l,c)=>l.callSentinelRaven(c,{initial:true}),(l,c)=>l.sentinelRaven(c)],
 ['Necromancy','Wizard','Necromancy',6,(l,c)=>l.bindNecromancyUndead(c,{kind:'created',profileId:'zombie',confirmed:true}),(l,c)=>l.necromancyUndead(c)[0]],
 ['Specter','Warlock','Hexblade',6,(l,c)=>l.bindAccursedSpecter(c,{slainHumanoid:true}),(l,c)=>l.accursedSpecter(c)],
 ['EchoKnight','Fighter','Echo Knight',3,(l,c)=>l.manifestEcho(c,{confirmed:true}),(l,c)=>l.echoes(c)[0]],
 ...['original','land'].map(kind=>['BeastMaster','Ranger','Beast Master',5,(l,c)=>l.bondBeast(c,{kind,profileId:'wolf',confirmed:true}),(l,c)=>l.beastCompanion(c)]),
 ...['Drakewarden','Drakewarden (UA)'].map(s=>['Drakewarden','Ranger',s,7,(l,c)=>l.summonDrake(c,{confirmed:true,essence:'fire',movement:'swim'}),(l,c)=>l.drakeCompanion(c)]),
 ...['Bard','Warlock','Wizard'].map(name=>['Lorehold',name,'Mage of Lorehold (UA)',6,(l,c)=>l.bondAncientCompanion(c,{kind:'Sage',confirmed:true}),(l,c)=>l.ancientCompanion(c)])
];
for(const [module,className,subclass,level,create,profile] of rows)test(module+' '+subclass+' '+className+' preserves source identity and counters on reload, isolates other data and removes only its lost source',()=>{
 const l=modules[module];let c=make(className,subclass,level);const retained={inventory:c.inventory,subclassCompanions:c.subclassCompanions,thralls:c.thralls,entomancer:c.entomancer};c=apply(c,create(l,c));const before=profile(l,c);assert.ok(before?.id);assert.ok(before.sourceClassId);assert.ok(before.subclassRecordId);assert.ok(before.sourceFeatureId);const loaded=reconcileSubclassStates(JSON.parse(JSON.stringify(c)));assert.equal(profile(l,loaded).id,before.id);if(before.hp)assert.deepEqual(profile(l,loaded).hp,before.hp);assert.deepEqual(loaded.resources,c.resources);assert.equal(loaded.hp.current,20);
 for(const edition of ['2014','2024','3.5']){const changed={...loaded,ruleset:edition,subclass:'Removed source',classLevels:loaded.classLevels.map((r,i)=>i===0?{...r,subclass:'Removed source'}:r)};const cleaned=reconcileSubclassStates(changed);assert.equal(profile(l,cleaned)==null,true);assert.deepEqual(cleaned.activeEffects.map(e=>e.id),['manual']);for(const [key,value] of Object.entries(retained))assert.deepEqual(cleaned[key],value);}
});
test('multiclass sources use own class level and total proficiency in their distinct formulas',()=>{
 const d=modules.DancingItem;let c=make('Bard','Creation',6);c=apply(c,d.animateDancingItem(c,{itemId:'book',confirmed:true}));assert.equal(d.dancingItem(c).hp.max,40);assert.equal(d.dancingItem(c).attacks[0].toHit,7);assert.equal(d.dancingItem(c).attacks[0].damage[0].dice,'1d10+4');
 const m=modules.ArtificialMind;let a=make('Artificer','Archivist (UA)',3);a=apply(a,m.createArtificialMind(a,{itemId:'book',material:'Plant',skills:['Arcana','History'],confirmed:true}));a=apply(a,m.manifestArtificialMind(a,{placement:true}));assert.equal(m.informationOverloadPlan(a,{confirmed:true}).damage,'1d8');assert.equal(m.informationOverloadPlan(a,{confirmed:true}).dc,14);
 const n=modules.Necromancy;let w=make('Wizard','Necromancy',6);w=apply(w,n.bindNecromancyUndead(w,{kind:'created',profileId:'zombie',confirmed:true}));assert.equal(n.necromancyUndead(w)[0].hp.max,28);assert.equal(n.necromancyUndead(w)[0].weaponDamageBonus,4);
 const u=modules.DruidCompanions;for(const [subclass,attack,damage] of [['Wildfire',6,'1d6+3'],['Wildfire (UA)',5,'1d6+3'],['Primeval (UA)',5,'1d8+3']]){let v=make('Druid',subclass,2);v=apply(v,u.summonDruidCompanion(v,{placement:true}));assert.equal(u.druidCompanion(v).hp.max,15);assert.equal(u.druidCompanion(v).attacks[0].toHit,attack);assert.equal(u.druidCompanion(v).attacks[0].damage[0].dice,damage);}
});
test('published and UA animated items expire on their one-hour source clocks without refunding the creation use',()=>{for(const name of ['Creation','Creation (UA)']){const l=modules.DancingItem;let c=make('Bard',name,6);c=apply(c,l.animateDancingItem(c,{itemId:'book',confirmed:true}));c=apply(c,advanceEffectTime(c,{seconds:3600}));assert.equal(l.dancingItem(c),null);assert.throws(()=>l.animateDancingItem(c,{itemId:'book',confirmed:true}),/resource/i);}});
