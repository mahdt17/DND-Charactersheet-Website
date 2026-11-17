import assert from 'node:assert/strict';
import test from 'node:test';
import {rollDice,weaponAttacks} from '../src/lib/rules.js';
import {attackRollMode,sharpshooterAttack} from '../src/lib/attackFeats.js';

test('Elven Accuracy chooses the highest of three d20s only after advantage and disadvantage resolve',()=>{
  const accuracy={elvenAccuracy:true};
  const random=values=>()=>values.shift();
  assert.equal(attackRollMode(accuracy,'advantage'),'elven-accuracy');
  assert.equal(attackRollMode({...accuracy,disadvantage:true},'advantage'),'normal');
  assert.equal(attackRollMode({...accuracy,advantage:true},'disadvantage'),'normal');
  assert.equal(attackRollMode(accuracy,'normal'),'normal');
  assert.equal(attackRollMode({},'advantage'),'advantage');
  const roll=rollDice('1d20+5','elven-accuracy',random([.1,.2,.95]));
  assert.deepEqual(roll.rolls,[3,5,20]);
  assert.deepEqual(roll.kept,[20]);
  assert.equal(roll.total,25);
  assert.equal(rollDice('1d20+5','advantage',random([.1,.2,.95])).total,10);
});

test('Sharpshooter modifies only proficient ranged-weapon attacks and keeps critical damage flat',()=>{
  const bow={attack:11,damage:'1d8+5',rangedWeapon:true,trained:true,attackAbility:'dex'};
  const feat={name:'Sharpshooter',edition:'2014',catalogId:'wikidot5e:feat:sharpshooter'};
  const c={ruleset:'2014',feats:[feat]};
  assert.equal(sharpshooterAttack(c,bow,false),bow);
  assert.deepEqual(sharpshooterAttack(c,bow,true),{...bow,attack:6,damage:'1d8+15',sharpshooter:true});
  assert.equal(sharpshooterAttack(c,{...bow,trained:false},true).attack,11);
  assert.equal(sharpshooterAttack(c,{...bow,rangedWeapon:false},true).attack,11);
  assert.equal(sharpshooterAttack({...c,ruleset:'2024'},bow,true).attack,11);
  assert.equal(sharpshooterAttack({...c,feats:[]},bow,true).attack,11);

  const fighter={...c,className:'Fighter',level:1,inventory:[
    {id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true},
    {id:'sword',name:'Longsword',equipmentIndex:'longsword',equipped:true},
    {id:'dagger',name:'Dagger',equipmentIndex:'dagger',equipped:true}
  ],fightingStyles:{attackModes:{dagger:{mode:'thrown'}}}};
  const rows=weaponAttacks(fighter,{str:12,dex:20});
  assert.deepEqual(rows.map(row=>[row.attackAbility,row.rangedWeapon]),[['dex',true],['str',false],['dex',false]]);
});
