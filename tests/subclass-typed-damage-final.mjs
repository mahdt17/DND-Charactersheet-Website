import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const form=await server.ssrLoadModule('/src/lib/subclassOwnForm.js');
const table=await server.ssrLoadModule('/src/lib/subclassTables.js');
const time=await server.ssrLoadModule('/src/lib/spellEffects.js');
const ward=await server.ssrLoadModule('/src/lib/subclassQuantities.js');
const healing=await server.ssrLoadModule('/src/lib/subclassHealing.js');
await server.close();
const make=()=>({ruleset:'2014',className:'Sorcerer',subclass:'Wild Magic',level:6,classDefinition:{name:'Sorcerer',index:'sorcerer',edition:'2014'},race:'Tiefling',raceDefinition:{index:'tiefling',edition:'2014'},abilities:{str:10,dex:14,con:12,int:14,wis:12,cha:16},hp:{current:50,max:50,temp:0},resources:[],activeEffects:[],inventory:[],spells:[],actions:[]});
const apply=(c,p)=>({...c,...p});
const sheep=c=>{c=apply(c,table.applySubclassTable(c,'sorcerer-wild-magic',{total:77},{triggered:true,rolls:[{total:2}]}));return apply(c,form.bindWildSheep(c,'goat',{confirmed:true}));};
test('automatic self Fireball applies known racial fire resistance after its own save once',()=>{
 for(const [save,hp] of [[1,35],[30,43]]){const c=make(),p=table.applySubclassTable(c,'sorcerer-wild-magic',{total:7},{triggered:true,rolls:[{total:31},{total:save}]});assert.equal(p.hp.current,hp);}
});
test('racial resistance applies to typed restored-body overflow only after sheep HP is exhausted',()=>{
 let c=sheep(make());assert.equal(form.ownFormDamageAmount(c,11,{type:'fire'}),11);c=apply(c,form.damageOwnForm(c,11,{type:'fire'}));assert.equal(c.hp.current,47);assert.equal(form.ownFormProfile(c),null);
});
test('Polymorph retains ongoing spell AC using creature Dexterity and each spell expiry',()=>{
 let c=make();c=apply(c,time.castEffectPatch(c,{name:'Mage Armor',level:1},{recipient:'self'}));c=apply(c,time.castEffectPatch(c,{name:'Shield',level:1},{}));c=sheep(c);assert.equal(form.ownFormArmor(c),18);c=apply(c,time.advanceEffectTime(c,{startTurn:true}));assert.equal(form.ownFormArmor(c),13);
});
test('ongoing spell AC under Polymorph excludes retained class and racial AC states',()=>{
 let c=sheep(make());c.activeEffects.push({id:'class-ac',subclassRecordId:'2014:subclass:barbarian:wild-magic',acBonus:2},{id:'shield',key:'shield',acBonus:5});assert.equal(form.ownFormArmor(c),15);
});

test('typed Arcane Ward remainder observes racial resistance after absorption',()=>{
 let c=make();c.classLevels=[{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass:'Wild Magic'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Abjuration'}];c=apply(c,ward.wardCastPatch(c,{school:'Abjuration'},1));c=apply(c,ward.absorbWard(c,{amount:4,rawDamage:15,damageType:'fire'}).patch);assert.equal(c.hp.current,45);
});
test('typed Bastion remainder observes racial resistance after reduction',()=>{
 let c=make();c.subclass='Clockwork Soul';c=apply(c,healing.useHealingFeature(c,'bastion-of-law',{n:1,recipient:'self',triggered:true}));c=apply(c,healing.consumeBastion(c,{n:1,result:{total:4},rawDamage:15,damageType:'fire',triggered:true}).patch);assert.equal(c.hp.current,45);
});
test('Moon retains racial fire resistance and elemental immunity takes precedence',()=>{
 for(const [creature,hp] of [['brown-bear',19],['fire-elemental',102]]){let c=make();c.level=16;c.classLevels=[{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass:'Wild Magic'},{catalogId:'2014:druid',name:'Druid',edition:'2014',level:10,subclass:'Moon'}];c=apply(c,form.activateMoonForm(c,creature,{seen:true,equipmentResolved:true}));c=apply(c,table.applySubclassTable(c,'sorcerer-wild-magic',{total:7},{triggered:true,rolls:[{total:31},{total:1}]}));assert.equal(form.ownFormProfile(c).hp.current,hp);assert.equal(c.hp.current,50);}
});
test('same-type resistances never stack and vulnerability is applied after resistance',()=>{
 let c=make();c=apply(c,table.applySubclassTable(c,'sorcerer-wild-magic',{total:71},{triggered:true}));assert.equal(form.normalBodyOverflowAmount(c,31,'fire',{extraResistance:true}),15);assert.equal(form.normalBodyOverflowAmount({...c,activeEffects:[]},31,'fire'),15);
 c=apply(c,table.applySubclassTable(c,'sorcerer-wild-magic',{total:95},{triggered:true}));assert.equal(form.normalBodyOverflowAmount(c,31,'piercing'),30);
});
test('Wild Magic self Fireball is spell damage for Abjuration resistance',()=>{let c=make();c.race='Human';c.raceDefinition={index:'human',edition:'2014'};c.level=15;c.classLevels=[{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:14,subclass:'Abjuration'}];const p=table.applySubclassTable(c,'sorcerer-wild-magic',{total:7},{triggered:true,rolls:[{total:31},{total:1}]});assert.equal(p.hp.current,35);});
