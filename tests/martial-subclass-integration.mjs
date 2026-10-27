import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const r=await server.ssrLoadModule('/src/lib/rules.js'),res=await server.ssrLoadModule('/src/lib/resources.js'),t=await server.ssrLoadModule('/src/lib/totemWarrior.js');
 const c={ruleset:'2014',className:'Barbarian',classDefinition:{name:'Barbarian',index:'barbarian',edition:'2014'},subclass:'Path of the Totem Warrior',level:3,abilities:{str:16,dex:20,con:14,int:10,wis:12,cha:8},abilityBonuses:{},resources:[{id:t.totemRageId,classResourceKey:t.totemRageId,totemManaged:true,used:1}],totemWarrior:{spirit:'Eagle',activeRage:true},hp:{current:30,max:30,temp:0},inventory:[{id:'sword',name:'Longsword',equipmentIndex:'longsword',equipped:true}],feats:[]};
 assert.equal(r.weaponAttacks(c,c.abilities)[0].damage,'1d8+5','Strength melee attacks include Rage damage');
 assert(t.totemDamageResistance(c,'slashing'),'ordinary Rage physical resistance applies to non-Bear spirits');assert(!t.totemDamageResistance(c,'fire'));
 const heavy={...c,inventory:[...c.inventory,{id:'armor',name:'Plate',equipmentIndex:'plate-armor',equipped:true,armor_category:'Heavy'}]};assert.equal(r.weaponAttacks(heavy,heavy.abilities)[0].damage,'1d8+3');assert(!t.totemDamageResistance(heavy,'slashing'));
 const finesse={...c,inventory:[{id:'rapier',name:'Rapier',equipmentIndex:'rapier',equipped:true}]};assert.equal(r.weaponAttacks(finesse,finesse.abilities)[0].damage,'1d8+5','Dexterity melee attacks do not receive Rage damage');
 const pools=res.characterResources(c,c.abilities);assert.equal(pools.filter(r=>r.classResourceKey===t.totemRageId).length,1);assert.equal(pools.find(r=>r.id===t.totemRageId).used,1);
 const changed={...c,subclass:'Berserker'},native=res.characterResources(changed,changed.abilities);assert.equal(native.filter(r=>r.classResourceKey===t.totemRageId).length,1);assert.equal(native.find(r=>r.id===t.totemRageId).used,1,'switching subclass must not refill the shared Rage pool');
 const rested={...c,...res.restResources(c,'short')};assert(!rested.totemWarrior.activeRage);assert.equal(rested.resources.find(r=>r.id===t.totemRageId).used,1);assert.equal(res.restResources(c,'long').resources.find(r=>r.id===t.totemRageId).used,0);
 const magic=await server.ssrLoadModule('/src/lib/featMagic.js'),casting=await server.ssrLoadModule('/src/lib/featCasting.js');
 const caster={...c,feats:[{id:'initiate',name:'Magic Initiate',edition:'2014',magicChoices:{list:'Wizard',cantrips:['2014:mage-hand','2014:minor-illusion'],spell:'2014:shield'}},{id:'ritual',name:'Ritual Caster',edition:'2014',magicChoices:{list:'Wizard',spells:['2014:detect-magic','2014:find-familiar']}}]};
 const calm={...caster,totemWarrior:{...caster.totemWarrior,activeRage:false}},granted=magic.featMagicSpells(caster);assert.equal(granted.length,5);
 for(const spell of granted){const option=casting.featCastOptions(calm,spell)[0];assert(option);assert.throws(()=>casting.spendFeatCast(caster,spell,option),/raging/,'Rage blocks cantrips, feat uses, rituals and concentration alike');assert.deepEqual(casting.featCastOptions(caster,spell),[]);assert.doesNotThrow(()=>casting.spendFeatCast(calm,spell,option));}
 console.log('PASS martial subclass integration: Rage damage, heavy armor, Dexterity weapon exclusion, physical resistance, one shared counter, source changes and rests');
}finally{await server.close();}
