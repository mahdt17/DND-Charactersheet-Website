import assert from 'node:assert/strict';
import test from 'node:test';
import classes from '../src/data/classes.json' with {type:'json'};
import {arcaneArcherClass,arcaneArcherFeatures,imbueArrowSpell,imbueArrowOrigin} from '../src/lib/arcaneArcher.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';
import {eligibleClass,advanceClass} from '../src/lib/advancement.js';
import {spellSlotPools} from '../src/lib/editions.js';
import {weaponAttacks} from '../src/lib/rules.js';

const classLevels=[['Fighter',2,''],['Wizard',6,'Bladesinging'],['Ranger',3,'Gloom Stalker']].map(([name,level,subclass])=>{
  const catalogId='2014:'+name.toLowerCase();
  const definition={...classes.find(c=>c.name===name),edition:'2014',catalogId};
  return {name,level,subclass,edition:'2014',catalogId,definition};
});
const longbow={id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true};
const base={
  ruleset:'2014',className:'Fighter',classDefinition:classLevels[0].definition,classLevels,level:11,
  race:'Shadar-kai',raceDefinition:{catalogId:'2014:shadar-kai-motm',edition:'2014'},
  abilities:{str:10,dex:20,con:15,int:18,wis:15,cha:13},hp:{current:65,max:65,temp:0},
  inventory:[longbow],spells:[],fightingStyles:{choices:['Archery']},
  feats:[{name:'Sharpshooter',edition:'2014',catalogId:'wikidot5e:feat:sharpshooter'}],
};
const take=c=>advanceClass(c,arcaneArcherClass,{flow:'prestige',hpGain:7});

test('the 2014 prestige class admits the Shadow Archer and stops after two levels',()=>{
  assert.equal(eligibleClass(base,arcaneArcherClass,'prestige').allowed,true);
  assert.equal(eligibleClass({...base,feats:[]},arcaneArcherClass,'prestige').allowed,false);
  const rangerArchery={...base,fightingStyles:{}};
  const unconfirmed=eligibleClass(rangerArchery,arcaneArcherClass,'prestige');
  assert.equal(unconfirmed.allowed,false);
  const styleCheck=unconfirmed.checks.find(check=>check.text==='Confirm Archery is your Ranger Fighting Style');
  assert.equal(styleCheck.status,'manual');
  assert.equal(eligibleClass(rangerArchery,arcaneArcherClass,'prestige',{[styleCheck.id]:true}).allowed,true);
  assert.equal(eligibleClass({...base,ruleset:'2024'},arcaneArcherClass,'prestige').allowed,false);
  assert.equal(eligibleClass(base,arcaneArcherClass,'normal').allowed,false);
  const first=take(base);
  assert.equal(first.level,12);
  assert.deepEqual(arcaneArcherFeatures(first).map(f=>f.name),['Enhance Arrow']);
  const second=take(first);
  assert.equal(second.level,13);
  assert.deepEqual(arcaneArcherFeatures(second).map(f=>f.name),['Enhance Arrow','Imbue Arrow']);
  const reconciled=reconcileClassGrants(second);
  const archerGrants=reconciled.grantedFeatures.filter(feature=>feature.sourceClassId===arcaneArcherClass.catalogId);
  assert.deepEqual(archerGrants.map(feature=>feature.name),['Enhance Arrow','Imbue Arrow']);
  assert.match(archerGrants[1].description,/normal spell slot/);
  assert.throws(()=>take(second),/prerequisites/i);
  assert.deepEqual(spellSlotPools(second).standard.slice(1,6),[4,3,3,1,0]);
  assert.equal(spellSlotPools(second).casterLevel,7);
});

test('Enhance Arrow adds one to bow attack and damage without stacking its bonus',()=>{
  const first=take(base);
  assert.equal(weaponAttacks(base,base.abilities)[0].attack,11);
  assert.equal(weaponAttacks(first,base.abilities)[0].attack,12);
  assert.equal(weaponAttacks(first,base.abilities)[0].damage,'1d8+6');
  assert.equal(weaponAttacks({...first,arcaneArcher:{magicalAmmunition:true}},base.abilities)[0].attack,11);
  const magic={...first,inventory:[{...longbow,name:'Longbow +2',magicBonus:2}]};
  assert.equal(weaponAttacks(magic,base.abilities)[0].attack,13);
  assert.equal(weaponAttacks(magic,base.abilities)[0].damage,'1d8+7');
});

test('Imbue Arrow requires level 2, an area action spell and a landing point within bow range',()=>{
  const first=take(base),second=take(first);
  const spell={name:'Fireball',edition:'2014',level:3,casting_time:'1 action',area_of_effect:{type:'sphere',size:20}};
  const landing={bowId:'bow',distance:'600',point:'Center of the courtyard'};
  assert.equal(imbueArrowSpell(spell),true);
  assert.equal(imbueArrowSpell({...spell,name:'Hypnotic Pattern',area_of_effect:null}),true);
  assert.equal(imbueArrowSpell({...spell,name:'Shield',area_of_effect:null}),false);
  assert.equal(imbueArrowSpell({...spell,casting_time:'1 minute'}),false);
  assert.equal(imbueArrowSpell({...spell,name:'Forcecage'}),false);
  assert.equal(imbueArrowSpell({...spell,name:'Fire Shield',range:'Self'}),false);
  assert.equal(imbueArrowSpell({...spell,name:'Burning Hands',range:'Self',area_of_effect:{type:'cone'}}),true);
  assert.throws(()=>imbueArrowOrigin(first,spell,landing),/level 2/);
  assert.throws(()=>imbueArrowOrigin(second,spell,{...landing,distance:'601'}),/600/);
  assert.throws(()=>imbueArrowOrigin(second,spell,{...landing,point:''}),/landing point/);
  assert.throws(()=>imbueArrowOrigin({...second,inventory:[]},spell,landing),/equipped bow/);
  assert.deepEqual(imbueArrowOrigin(second,spell,landing),{bowId:'bow',bowName:'Longbow',distance:600,point:landing.point});
});
