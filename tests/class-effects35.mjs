#!/usr/bin/env node
import assert from 'node:assert/strict';
import {reconcileClassGrants,removeClassProgression,describeClassEffect35} from '../src/lib/classIntegration.js';

const effectClass={
  catalogId:'dndtools:classes/effect-fixture-999',
  sourceId:'classes/effect-fixture-999',
  name:'Effect Fixture',
  edition:'3.5',
  category:'class',
  contentType:'class',
  levelGrants:[{
    level:1,
    name:'Battle Adaptation',
    description:'A synthetic source-reviewed feature used only to verify generic effect materialization.',
    effects:[
      {id:'fear-save',type:'modifier',target:'save',subtype:'fear',value:2,bonusType:'morale',condition:'against fear effects'},
      {id:'cold-resistance',type:'resistance',damageType:'cold',valueByLevel:{1:5,5:10}},
      {id:'fast-movement',type:'movement',movement:'land',operation:'add',value:10,unit:'ft.'},
      {id:'fatigue-immunity',type:'immunity',condition:'fatigue'}
    ]
  }]
};
const anchorClass={catalogId:'dndtools:classes/anchor-998',sourceId:'classes/anchor-998',name:'Anchor',edition:'3.5',category:'class',contentType:'class',levelGrants:[{level:1,name:'Anchor Feature',description:'Keeps the character multiclassed for removal coverage.'}]};
const base=level=>({
  id:'effect-test',name:'Effects',ruleset:'3.5',level:level+1,
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
  classLevels:[
    {catalogId:effectClass.catalogId,name:effectClass.name,edition:'3.5',level,definition:effectClass},
    {catalogId:anchorClass.catalogId,name:anchorClass.name,edition:'3.5',level:1,definition:anchorClass}
  ],
  className:effectClass.name,classDefinition:effectClass,
  grantedFeatures:[],actions:[],feats:[],resources:[],trainingGrants:[],classSkills35:[],classSkillRules35:[],classProgressionTracks:[],classSpellSlots:[],
  classEffects35:[{id:'manual-effect',name:'Manual reminder',type:'note',value:'keep me'}],
  featureChoices:{},spells:[]
});

const one=reconcileClassGrants(base(1));
assert(Array.isArray(one.classEffects35),'reconciliation must expose structured class effects');
const derivedOne=one.classEffects35.filter(effect=>effect.sourceClassId===effectClass.catalogId);
assert.equal(derivedOne.length,4);
assert.equal(derivedOne.find(effect=>effect.effectId==='fear-save')?.value,2);
assert.equal(derivedOne.find(effect=>effect.effectId==='cold-resistance')?.value,5);
assert.equal(derivedOne.find(effect=>effect.effectId==='fast-movement')?.value,10);
assert.equal(derivedOne.find(effect=>effect.effectId==='fatigue-immunity')?.value,undefined);
assert.equal(one.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me','manual effects survive reconciliation');
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fear-save')),/\+2.*save.*fear/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='cold-resistance')),/cold.*5/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fast-movement')),/land.*\+10.*ft/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fatigue-immunity')),/immune.*fatigue/i);

const five=reconcileClassGrants(base(5));
assert.equal(five.classEffects35.find(effect=>effect.effectId==='cold-resistance')?.value,10,'valueByLevel resolves the highest eligible class-level value');
const twice=reconcileClassGrants(five);
assert.deepEqual(twice.classEffects35,five.classEffects35,'effect reconciliation is idempotent');

const removed=removeClassProgression(five,effectClass.catalogId);
assert(!removed.classEffects35.some(effect=>effect.sourceClassId===effectClass.catalogId),'removing a class removes only its source-owned structured effects');
assert.equal(removed.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me','class removal preserves unrelated manual effects');

console.log('generic 3.5 class effect materialization regression passed');
