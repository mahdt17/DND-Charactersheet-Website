import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const lib=existsSync('src/lib/gloomStalker.js')?await server.ssrLoadModule('/src/lib/gloomStalker.js'):{};
const [numeric,effects,rules,expanded]=await Promise.all(['subclassNumerics','spellEffects','rules','expandedSubclasses'].map(n=>server.ssrLoadModule(`/src/lib/${n}.js`)));await server.close();
const make=(level=15)=>({ruleset:'2014',className:'Ranger',subclass:'Gloom Stalker',level,classDefinition:{name:'Ranger',index:'ranger',edition:'2014'},abilities:{str:10,dex:18,con:14,int:10,wis:16,cha:10},race:'Human',hp:{current:30,max:50,temp:0},speed:30,inventory:[{id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true,qty:1}],activeEffects:[],resources:[],spells:[],conditions:[]});
const apply=(c,p)=>({...c,...p});
const first=c=>apply(c,numeric.setSubclassNumericToggle(c,'dread-ambusher-first-turn',true));
test('Dread Ambusher speed ends at end of first turn, never lasts through other turns',()=>{const c=first(make());assert.equal(numeric.subclassNumericProfile(c).speedBonus,10);assert.equal(numeric.subclassNumericProfile(apply(c,effects.advanceEffectTime(c,{endTurn:true}))).speedBonus,0);});
test('old first-turn saves also expire on End turn and skipping to next turn cannot retain the bonus',()=>{const c=first(make());const old={...c,activeEffects:c.activeEffects.map(e=>({...e,expires:'start-next-turn'}))};assert.equal(numeric.subclassNumericProfile(apply(old,effects.advanceEffectTime(old,{endTurn:true}))).speedBonus,0);assert.equal(numeric.subclassNumericProfile(apply(c,effects.advanceEffectTime(c,{startTurn:true}))).speedBonus,0);});
test('Dread Ambusher grants exactly one real weapon attack per confirmed first-turn Attack action',()=>{
 assert.equal(typeof lib.beginDreadAttackAction,'function');let c=first(make());const weapon=rules.weaponAttacks(c,c.abilities)[0];
 assert.throws(()=>lib.gloomAttackPlan(c,weapon.id,'dread',{confirmed:true}),/Attack action/);
 c=apply(c,lib.beginDreadAttackAction(c,{confirmed:true}));const plan=lib.gloomAttackPlan(c,weapon.id,'dread',{confirmed:true});assert.equal(plan.weapon.damage,'1d8+4');assert.equal(plan.weapon.extraWeaponDice,'1d8');assert.equal(plan.weapon.attack,weapon.attack);assert.equal(rules.weaponAttacks(c,c.abilities)[0].damage,'1d8+4');
 c=apply(c,plan.patch);assert.throws(()=>lib.gloomAttackPlan(c,weapon.id,'dread',{confirmed:true}),/used|Attack action/);
 c=apply(c,lib.beginDreadAttackAction(c,{confirmed:true}));assert.equal(lib.gloomAttackPlan(c,weapon.id,'dread',{confirmed:true}).weapon.extraWeaponDice,'1d8');
 c=apply(c,effects.advanceEffectTime(c,{endTurn:true}));assert.throws(()=>lib.beginDreadAttackAction(c,{confirmed:true}),/first turn/);
});
test('Flurry requires own-turn weapon miss and is separate from Dread with start-turn recovery',()=>{
 assert.equal(typeof lib.gloomAttackPlan,'function');let c=make(11);assert.throws(()=>lib.gloomAttackPlan(c,'bow','flurry',{}),/confirm/i);assert.throws(()=>lib.gloomAttackPlan(make(10),'bow','flurry',{confirmed:true}),/available/);
 const plan=lib.gloomAttackPlan(c,'bow','flurry',{confirmed:true});assert.equal(plan.weapon.damage,'1d8+4');c=apply(c,plan.patch);assert.throws(()=>lib.gloomAttackPlan(c,'bow','flurry',{confirmed:true}),/used/);c=apply(c,effects.advanceEffectTime(c,{endTurn:true}));assert.throws(()=>lib.gloomAttackPlan(c,'bow','flurry',{confirmed:true}),/used/);c=apply(c,effects.advanceEffectTime(c,{startTurn:true}));assert.doesNotThrow(()=>lib.gloomAttackPlan(c,'bow','flurry',{confirmed:true}));
});
test('Shadowy Dodge validates source level and the pre-outcome no-advantage reaction, with source cleanup',()=>{
 assert.equal(typeof lib.useShadowyDodge,'function');let c=make();assert.throws(()=>lib.useShadowyDodge(c),/confirm/i);assert.throws(()=>lib.useShadowyDodge(make(14),{confirmed:true}),/available/);c=apply(c,lib.useShadowyDodge(c,{confirmed:true}));assert.match(c.subclassLastResult.instructions,/disadvantage/);assert.throws(()=>lib.useShadowyDodge(c,{confirmed:true}),/reaction/);c=apply(c,effects.advanceEffectTime(c,{startTurn:true}));assert.doesNotThrow(()=>lib.useShadowyDodge(c,{confirmed:true}));assert.equal(lib.gloomStalkerProfile({...c,subclass:'Hunter'}),null);
});
test('Gloom own-level training, darkvision, spell grants and multiclass ownership stay distinct',()=>{
 assert.equal(typeof lib.gloomStalkerProfile,'function');let c=make(7);assert.equal(lib.gloomStalkerProfile({...c,race:'Elf'}).darkvision,90);assert.equal(lib.gloomStalkerProfile({...c,race:'Human'}).darkvision,60);assert.equal(lib.gloomStalkerProfile({...c,gloomStalker:{racialDarkvision:120}}).darkvision,150);
 c=expanded.reconcileExpandedSubclasses(c);assert.equal(c.saveProf.wis,true);assert.equal(expanded.expandedSubclassChoicePlan(c,null,{},{}).groups.filter(g=>g.choiceKey==='iron-mind-save').length,0);
 const existing=make(7);existing.saveProf={wis:true};const group=expanded.expandedSubclassChoicePlan(existing).groups.find(g=>g.choiceKey==='iron-mind-save');assert.deepEqual(group.options,['Intelligence','Charisma']);
 const multi={...make(),classLevels:[{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:12,subclass:'Battle Master'},{catalogId:'2014:ranger',name:'Ranger',edition:'2014',level:3,subclass:'Gloom Stalker'}]};assert.equal(lib.gloomStalkerProfile(multi).level,3);assert.throws(()=>lib.gloomAttackPlan(multi,'bow','flurry',{confirmed:true}),/available/);assert.deepEqual(expanded.expandedSubclassSpellGrants(multi).map(s=>s.name),['Disguise Self']);
});
test('Gloom controls reject lost features, other editions and unavailable weapons',()=>{
 for(const ruleset of ['2024','3.5'])assert.equal(lib.gloomStalkerProfile({...make(),ruleset}),null);
 assert.throws(()=>lib.gloomAttackPlan({...make(),conditions:['Stunned']},'bow','flurry',{confirmed:true}),/incapacitated/);
 assert.throws(()=>lib.gloomAttackPlan({...make(),inventory:[]},'bow','flurry',{confirmed:true}),/weapon/);
 const c={...make(),classLevels:[{catalogId:'2014:ranger',name:'Ranger',edition:'2014',level:15,subclass:'Gloom Stalker'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}],activeEffects:[{id:'sheep',sourceClassId:'2014:sorcerer',subclassRecordId:'2014:subclass:sorcerer:wild-magic',sourceFeatureId:'2014:subclass:sorcerer:wild-magic:wild-magic-surge',stateKey:'wild-surge:77',saveSucceeded:false}]};assert.equal(lib.gloomStalkerProfile(c),null);assert.throws(()=>lib.gloomAttackPlan(c,'bow','flurry',{confirmed:true}),/profile|polymorph/i);
});
test('a saved minimal racial definition retains canonical racial darkvision',()=>{assert.equal(lib.gloomStalkerProfile({...make(),race:'Elf',raceDefinition:{name:'Elf',index:'elf',edition:'2014'}}).darkvision,90);});
