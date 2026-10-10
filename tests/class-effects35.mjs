#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,describeClassEffect35} from '../src/lib/classIntegration.js';

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
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({
  id:'effect-test',name:'Effects',ruleset:'3.5',mechanics:'3.5',level:level+1,
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
  classLevels:[row(definition,level),row(anchorClass,1)],
  className:definition.name,classDefinition:definition,
  grantedFeatures:[],actions:[],feats:[],resources:[],trainingGrants:[],classSkills35:[],classSkillRules35:[],classProgressionTracks:[],classSpellSlots:[],
  classEffects35:[{id:'manual-effect',name:'Manual reminder',type:'note',value:'keep me'}],
  featureChoices:{},spells:[]
});

const one=reconcileClassGrants(base(effectClass,1));
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

const five=reconcileClassGrants(base(effectClass,5));
assert.equal(five.classEffects35.find(effect=>effect.effectId==='cold-resistance')?.value,10,'valueByLevel resolves the highest eligible class-level value');
const twice=reconcileClassGrants(five);
assert.deepEqual(twice.classEffects35,five.classEffects35,'effect reconciliation is idempotent');
const removed=removeClassProgression(five,effectClass.catalogId);
assert(!removed.classEffects35.some(effect=>effect.sourceClassId===effectClass.catalogId),'removing a class removes only its source-owned structured effects');
assert.equal(removed.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me','class removal preserves unrelated manual effects');

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const reviewedExpected=new Map([
  ['classes/arcane-devotee-657',1],
  ['classes/argent-savant-224',3],
  ['classes/cipher-adept-688',2],
  ['classes/cloud-anchorite-499',6],
  ['classes/crimson-scourge-262',4],
  ['classes/divine-champion-661',5],
  ['classes/dread-fang-of-lolth-428',4]
]);
let reviewedEffectCount=0;
for(const [sourceId,expected] of reviewedExpected){
  const definition=exact(sourceId);
  assert(definition,`missing exact reviewed effect class ${sourceId}`);
  assert.equal(definition.sourceId,sourceId,`${sourceId} source identity drift`);
  const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
  const character=reconcileClassGrants(base(definition,level));
  const effects=character.classEffects35.filter(effect=>effect.sourceClassId===definition.catalogId);
  assert.equal(effects.length,expected,`${definition.name} structured effect count drift`);
  assert(effects.every(effect=>effect.effectId&&effect.sourceFeatureName&&describeClassEffect35(effect)),`${definition.name} effects need stable IDs, feature ownership and readable summaries`);
  assert.deepEqual(reconcileClassGrants(character).classEffects35,character.classEffects35,`${definition.name} structured effects must reconcile idempotently`);
  const clean=removeClassProgression(character,definition.catalogId);
  assert(!clean.classEffects35.some(effect=>effect.sourceClassId===definition.catalogId),`${definition.name} structured effects survive source removal`);
  assert.equal(clean.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me',`${definition.name} cleanup must preserve manual effects`);
  reviewedEffectCount+=effects.length;
}
assert.equal(reviewedEffectCount,25,'reviewed structured effect batch must materialize 25 exact effects across seven classes');

const arcane=reconcileClassGrants(base(exact('classes/arcane-devotee-657'),5));
assert.equal(arcane.classEffects35.find(effect=>effect.effectId==='sacred-defense-save')?.value,2,'Arcane Devotee Sacred Defense scales at 4th class level');
const cipher=reconcileClassGrants(base(exact('classes/cipher-adept-688'),10));
assert.equal(cipher.classEffects35.find(effect=>effect.effectId==='combat-instinct-initiative')?.value,3,'Cipher Adept Combat Instinct scales at 9th class level');
const cloud=reconcileClassGrants(base(exact('classes/cloud-anchorite-499'),10));
assert.equal(cloud.classEffects35.find(effect=>effect.effectId==='cold-resistance')?.value,10,'Cloud Anchorite cold resistance scales at 8th class level');
assert.equal(cloud.classEffects35.find(effect=>effect.effectId==='fast-movement')?.value,20,'Cloud Anchorite Fast Movement scales at 8th class level');
const dread=reconcileClassGrants(base(exact('classes/dread-fang-of-lolth-428'),10));
assert.match(describeClassEffect35(dread.classEffects35.find(effect=>effect.effectId==='lolths-will-save')),/set to 4.*will-save/i,'set-value effects must not be displayed as additive bonuses');

console.log(`generic 3.5 class effect regression passed: ${reviewedExpected.size} exact reviewed classes, ${reviewedEffectCount} structured effects`);
