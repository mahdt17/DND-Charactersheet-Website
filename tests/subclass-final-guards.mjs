import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const [aasimar,shadar,eladrin,leonin,lupin,tables,rules,state]=await Promise.all(['aasimar','shadarKai','eladrin','leonin','lupin','subclassTables','rules','subclassState'].map(n=>server.ssrLoadModule(`/src/lib/${n}.js`)));
const {aasimarId}=await server.ssrLoadModule('/src/data/aasimar.js');
const {shadarKaiRaces}=await server.ssrLoadModule('/src/data/shadarKai.js');
const {eladrinId}=await server.ssrLoadModule('/src/data/eladrin.js');
const {leoninId}=await server.ssrLoadModule('/src/data/leonin.js');
const {lupinId}=await server.ssrLoadModule('/src/data/lupin.js');
const campaign=await server.ssrLoadModule('/src/lib/campaignActivity.js');
const entomancer=await server.ssrLoadModule('/src/lib/entomancer.js');
const totem=await server.ssrLoadModule('/src/lib/totemWarrior.js');
const {entomancerId}=await server.ssrLoadModule('/src/data/entomancer.js');
await server.close();
const make=()=>({ruleset:'2014',className:'Fighter',subclass:'Samurai',level:18,classDefinition:{name:'Fighter',index:'fighter',edition:'2014'},abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:1},hp:{current:0,max:40,temp:0},resources:[],inventory:[],conditions:[],activeEffects:[{id:'samurai',sourceClassId:'2014:fighter',subclassRecordId:'2014:subclass:fighter:samurai',sourceFeatureId:'2014:subclass:fighter:samurai:strength-before-death',stateKey:'strength-before-death',remainingSeconds:6}],deathSaves:{failure:0}});
const races=[['Aasimar',aasimarId,aasimar.aasimarActionBlock],['Shadar-kai',shadarKaiRaces[0].catalogId,shadar.blessingBlocked],['Eladrin',eladrinId,eladrin.feyStepBlocked],['Leonin',leoninId,leonin.leoninActionBlock],['Lupin',lupinId,lupin.lupinActionBlock]];
for(const [race,catalogId,guard] of races)test(`${race} uses shared conscious-at-zero, death, incapacity and feature retention`,()=>{
 const c={...make(),race,raceDefinition:{catalogId,edition:'2014'},eladrin:{season:'Summer',ability:'cha'}};
 assert.equal(state.actorActionBlock(c),'');assert.equal(guard(c),'');
 assert.ok(guard({...c,activeEffects:[]}));assert.ok(guard({...c,activeEffects:c.activeEffects.map(e=>({...e,remainingSeconds:0}))}));
 assert.ok(guard({...c,conditions:['Stunned']}));assert.ok(guard({...c,deathSaves:{failure:3}}));
 const sheep={...c,hp:{...c.hp,current:20},classLevels:[{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass:'Wild Magic'}],activeEffects:[{id:'sheep',sourceClassId:'2014:sorcerer',subclassRecordId:'2014:subclass:sorcerer:wild-magic',sourceFeatureId:'2014:subclass:sorcerer:wild-magic:wild-magic-surge',stateKey:'wild-surge:77',saveSucceeded:false,remainingSeconds:60}]};
 assert.equal(state.retainsOwnFeatures(sheep),false);assert.ok(guard(sheep));
});
test('Aasimar Healing Hands actually heals conscious Samurai at zero and spends its single use',()=>{const c={...make(),race:'Aasimar',raceDefinition:{catalogId:aasimarId,edition:'2014'}};const p=aasimar.useHealingHands(c,{self:true});assert.equal(p.hp.current,18);assert.equal(p.resources.find(r=>r.id===aasimar.aasimarHealingId).used,1);});
test('campaign, converted class and Totem callers share the actor contract',()=>{
 const c=make(),fighter={catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:18,subclass:'Samurai'};
 for(const [actor,guard] of [[{...c,archivistCampaign:{grafts:[{recipeId:'test'}]}},campaign.campaignActionBlockReason],[{...c,classLevels:[fighter,{catalogId:entomancerId,name:'Entomancer',edition:'2014',level:1}]},entomancer.entomancerActionBlockReason],[{...c,classLevels:[fighter,{catalogId:'2014:barbarian',name:'Barbarian',edition:'2014',level:3,subclass:'Totem Warrior'}]},totem.totemActionBlockReason]]){
  assert.equal(guard(actor),'');assert.ok(guard({...actor,deathSaves:{failure:3}}));assert.ok(guard({...actor,conditions:['Stunned']}));assert.ok(guard({...actor,activeEffects:[]}));
 }
 const l={...c,race:'Lupin',raceDefinition:{catalogId:lupinId,edition:'2014'}};assert.equal(lupin.lupinOdorSave(l,'dex').autoFail,false);assert.equal(lupin.lupinOdorSave({...l,activeEffects:[]},'dex').autoFail,true);
});
test('Spirit Tale low Charisma expressions run through the real dice engine and consume the held tale',()=>{
 const c={...make(),className:'Bard',subclass:'Spirits',classDefinition:{name:'Bard',index:'bard',edition:'2014'},level:3,hp:{current:20,max:40,temp:0},activeEffects:[{id:'tale',sourceClassId:'2014:bard',subclassRecordId:'2014:subclass:bard:spirits',sourceFeatureId:'2014:subclass:bard:spirits:tales-from-beyond',stateKey:'held-spirit-tale',tableResult:2}]};
 const p=tables.spiritTalePlan(c);assert.equal(p.rolls[0].expression,'1d20-3');assert.equal(p.rolls[1].expression,'2d6-5');
 const old=Math.random;try{Math.random=()=>0.99;const rolls=p.rolls.map(r=>rules.rollDice(r.expression));const patch=tables.bestowSpiritTale(c,{triggered:true,recipient:'other',rolls});assert.equal(patch.activeEffects.length,0);}finally{Math.random=old;}
});
