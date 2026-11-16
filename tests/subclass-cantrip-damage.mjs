import assert from 'node:assert/strict';import {test} from 'node:test';import {healingFeaturePlan} from '../src/lib/subclassHealing.js';
const make=()=>({ruleset:'2014',className:'Cleric',subclass:'Light',level:8,classDefinition:{name:'Cleric',index:'cleric',edition:'2014'},abilities:{str:10,dex:10,con:10,int:10,wis:16,cha:10},hp:{current:20,max:20,temp:0},spells:[],resources:[],activeEffects:[],inventory:[],actions:[]});const spell={name:'Sacred Flame',level:0,castingClassId:'2014:cleric'},plan={rolls:[{label:'Radiant damage',expression:'2d8'}]};
test('Potent Spellcasting adds actual Wisdom to damage from an owned Cleric cantrip',()=>{const c=make();assert.equal(healingFeaturePlan(c,spell,plan).rolls[0].expression,'2d8+3');assert.equal(healingFeaturePlan({...c,level:7},spell,plan).rolls[0].expression,'2d8');assert.equal(healingFeaturePlan({...c,abilities:{...c.abilities,wis:8}},spell,plan).rolls[0].expression,'2d8-1');});
test('Potent Spellcasting preserves another class ownership and leveled spell rolls',()=>{const c=make();c.level=10;c.classLevels=[{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:8,subclass:'Light'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Evocation'}];assert.equal(healingFeaturePlan(c,{...spell,castingClassId:'2014:wizard'},plan).rolls[0].expression,'2d8');assert.equal(healingFeaturePlan(c,{...spell,level:1},plan).rolls[0].expression,'2d8');});

test('Potent Spellcasting is lost in Polymorph but returns afterward',()=>{const c=make();c.level=14;c.classLevels=[{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:8,subclass:'Light'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass:'Wild Magic'}];c.activeEffects=[{id:'sheep',sourceClassId:'2014:sorcerer',subclassRecordId:'2014:subclass:sorcerer:wild-magic',sourceFeatureId:'2014:subclass:sorcerer:wild-magic:wild-magic-surge',stateKey:'wild-surge:77',saveSucceeded:false,remainingSeconds:60}];assert.equal(healingFeaturePlan(c,spell,plan).rolls[0].expression,'2d8');assert.equal(healingFeaturePlan({...c,activeEffects:[]},spell,plan).rolls[0].expression,'2d8+3');});

test('Potent Spellcasting keeps multi-die formulas valid',()=>{const c=make(),mixed={rolls:[{label:'Radiant damage',expression:'1d8+1d6+2'}]};assert.equal(healingFeaturePlan(c,spell,mixed).rolls[0].expression,'1d8+1d6+5');});
test('Empowered Evocation adds Intelligence once to eligible Wizard evocation damage',()=>{
 const c={...make(),className:'Wizard',subclass:'Evocation',level:10,classDefinition:{name:'Wizard',index:'wizard',edition:'2014'},abilities:{str:10,dex:10,con:10,int:16,wis:10,cha:10}};
 const s={name:'Scorching Ray',school:'Evocation',edition:'2014',level:2,castingClassId:'2014:wizard'};
 const p={rolls:[{label:'Fire damage',expression:'2d6'},{label:'Secondary damage',expression:'1d6'}]};
 const result=healingFeaturePlan(c,s,p);
 assert.equal(result.rolls[0].oncePerCastBonus,3);
 assert.equal(result.rolls[1].oncePerCastBonus,undefined);
 assert.deepEqual(healingFeaturePlan(c,s,result),result);
 assert.equal(healingFeaturePlan({...c,level:9},s,p),p);
 assert.equal(healingFeaturePlan(c,{...s,school:'Conjuration'},p),p);
 assert.equal(healingFeaturePlan(c,{...s,castingClassId:'2014:cleric'},p),p);
 assert.equal(healingFeaturePlan(c,{...s,featSpellGrant:true},p),p);
 assert.equal(healingFeaturePlan(c,{...s,edition:'2024'},p),p);
 assert.equal(healingFeaturePlan({...c,abilities:{...c.abilities,int:8}},s,p).rolls[0].oncePerCastBonus,1);
});
