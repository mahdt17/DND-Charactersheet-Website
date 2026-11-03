import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const [companion,play,effects,rules,healing]=await Promise.all(['subclassDruidCompanions','play','spellEffects','rules','subclassHealing'].map(n=>server.ssrLoadModule(`/src/lib/${n}.js`)));await server.close();
const make=(subclass='Wildfire',level=6)=>({ruleset:'2014',className:'Druid',subclass,level,classDefinition:{name:'Druid',index:'druid',edition:'2014'},abilities:{str:10,dex:10,con:10,int:10,wis:16,cha:10},hp:{current:3,max:20,temp:0},resources:[],activeEffects:[],inventory:[],spells:[],actions:[]});
const cure={name:'Cure Wounds',level:1,range:'Touch',heal_at_slot_level:{1:'1d8+MOD'}};
const fire={name:'Scorching Ray',level:2,attack_type:'ranged',damage:{damage_type:{name:'Fire'},damage_at_slot_level:{2:'2d6'}}};
const summon=c=>({...c,...companion.summonDruidCompanion(c,{placement:true})});
for(const subclass of ['Wildfire','Wildfire (UA)'])test(`${subclass} adds one visible d8 and reuses its healing total once with a cap`,()=>{
 const c=summon(make(subclass));const plan=healing.healingFeaturePlan(c,cure,play.spellPlan(cure,c,1,3),{slotLevel:1,recipient:'self'});
 assert.equal(plan.rolls.length,2);assert.deepEqual(plan.rolls.map(r=>r.expression),['1d8+3','1d8']);assert.equal(plan.rolls[1].oncePerCast,true);
 const rolls=plan.rolls.map(r=>({...r,...rules.rollDice(r.expression,'normal',()=>0.99)}));
 assert.equal(effects.castEffectPatch(c,cure,{plan,rolls,recipient:'self',slotLevel:1,maxHP:20}).hp.current,20);
 assert.equal(effects.castEffectPatch(c,cure,{plan,rolls,recipient:'other',slotLevel:1,maxHP:20}).hp,undefined);
 const rays=play.spellPlan(fire,c,2,3);assert.equal(rays.count,3);assert.equal(rays.rolls.filter(r=>r.oncePerCast).length,1);assert.match(rays.rolls.at(-1).label,/fire.*damage/i);
});
test('Enhanced Bond requires its level and a live summoned owned spirit, with retained features',()=>{
 for(const c of [make(),summon(make('Wildfire',5)),{...summon(make()),subclass:'Dreams'},{...summon(make()),ruleset:'2024'}])assert.equal(play.spellPlan(cure,c,1,3).rolls.length,1);
 const c=summon(make());for(const update of [{remainingSeconds:0},{hp:{current:0}}])assert.equal(play.spellPlan(cure,{...c,activeEffects:c.activeEffects.map(e=>({...e,...update}))},1,3).rolls.length,1);
 const polymorph={...c,classLevels:[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:6,subclass:'Wildfire'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}],activeEffects:[...c.activeEffects,{id:'sheep',sourceClassId:'2014:sorcerer',subclassRecordId:'2014:subclass:sorcerer:wild-magic',sourceFeatureId:'2014:subclass:sorcerer:wild-magic:wild-magic-surge',stateKey:'wild-surge:77',saveSucceeded:false}]};assert.equal(play.spellPlan(cure,polymorph,1,3).rolls.length,1);
 assert.equal(play.spellPlan({...fire,damage:{damage_type:{name:'Cold'},damage_at_slot_level:{2:'2d6'}}},c,2,3).rolls.length,1);
});
