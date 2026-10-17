#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,describeClassEffect35} from '../src/lib/classIntegration.js';
import {classEffectActive35,classEffectRequiresActivation35,classEffectModifier35,classEffectMovementBonus35} from '../src/lib/classEffects35.js';

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
      {id:'initiative',type:'modifier',target:'initiative',value:3,bonusType:'insight'},
      {id:'cold-resistance',type:'resistance',damageType:'cold',valueByLevel:{1:5,5:10}},
      {id:'fast-movement',type:'movement',movement:'land',operation:'add',value:10,unit:'ft.',condition:'while unarmored'},
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
  classEffects35:[{id:'manual-effect',name:'Manual reminder',type:'note',value:'keep me'}],classEffectToggles35:{},
  featureChoices:{},spells:[]
});

const one=reconcileClassGrants(base(effectClass,1));
assert(Array.isArray(one.classEffects35),'reconciliation must expose structured class effects');
const derivedOne=one.classEffects35.filter(effect=>effect.sourceClassId===effectClass.catalogId);
assert.equal(derivedOne.length,5);
assert.equal(derivedOne.find(effect=>effect.effectId==='fear-save')?.value,2);
assert.equal(derivedOne.find(effect=>effect.effectId==='initiative')?.value,3);
assert.equal(derivedOne.find(effect=>effect.effectId==='cold-resistance')?.value,5);
assert.equal(derivedOne.find(effect=>effect.effectId==='fast-movement')?.value,10);
assert.equal(derivedOne.find(effect=>effect.effectId==='fatigue-immunity')?.value,undefined);
assert.equal(one.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me','manual effects survive reconciliation');
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fear-save')),/\+2.*save.*fear/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='cold-resistance')),/cold.*5/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fast-movement')),/land.*\+10.*ft/i);
assert.match(describeClassEffect35(derivedOne.find(effect=>effect.effectId==='fatigue-immunity')),/immune.*fatigue/i);
const fearEffect=derivedOne.find(effect=>effect.effectId==='fear-save');
const movementEffect=derivedOne.find(effect=>effect.effectId==='fast-movement');
const immunityEffect=derivedOne.find(effect=>effect.effectId==='fatigue-immunity');
assert.equal(classEffectRequiresActivation35(fearEffect),true,'a conditional modifier requires explicit activation');
assert.equal(classEffectRequiresActivation35(movementEffect),true,'conditional movement requires explicit activation');
assert.equal(classEffectRequiresActivation35(immunityEffect),false,'immunity subject text is not an activation gate');
assert.equal(classEffectActive35(one,immunityEffect),true,'always-on immunity is active without a toggle');

assert.equal(classEffectModifier35(one,'initiative'),3,'unconditional numeric class modifiers apply automatically');
assert.equal(classEffectModifier35(one,'Fortitude save'),0,'conditional save modifiers fail closed until the user marks their condition active');
assert.equal(classEffectMovementBonus35(one,'land'),0,'conditional movement bonuses fail closed until their condition is active');
const activeOne={...one,classEffectToggles35:{[fearEffect.id]:true,[movementEffect.id]:true}};
assert.equal(classEffectModifier35(activeOne,'Fortitude save'),2,'general save effects can apply to a specific save when explicitly active');
assert.equal(classEffectModifier35(activeOne,'Reflex save'),2,'general save effects consistently cover all save types');
assert.equal(classEffectModifier35(activeOne,'initiative'),3,'unconditional modifiers remain active alongside conditional toggles');
assert.equal(classEffectMovementBonus35(activeOne,'land'),10,'explicitly active conditional land movement is operational');

const five=reconcileClassGrants({...base(effectClass,5),classEffectToggles35:activeOne.classEffectToggles35});
assert.equal(five.classEffects35.find(effect=>effect.effectId==='cold-resistance')?.value,10,'valueByLevel resolves the highest eligible class-level value');
assert.equal(classEffectModifier35(five,'initiative'),3);
assert.equal(classEffectMovementBonus35(five,'land'),10);
const twice=reconcileClassGrants(five);
assert.deepEqual(twice.classEffects35,five.classEffects35,'effect reconciliation is idempotent');
assert.deepEqual(twice.classEffectToggles35,five.classEffectToggles35,'active conditional effect state survives idempotent reconciliation');
const removed=removeClassProgression(five,effectClass.catalogId);
assert(!removed.classEffects35.some(effect=>effect.sourceClassId===effectClass.catalogId),'removing a class removes only its source-owned structured effects');
assert.equal(removed.classEffects35.find(effect=>effect.id==='manual-effect')?.value,'keep me','class removal preserves unrelated manual effects');
assert.deepEqual(removed.classEffectToggles35||{}, {},'removing the source class also removes stale conditional-effect activation state');

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
const arcaneSacred=arcane.classEffects35.find(effect=>effect.effectId==='sacred-defense-save');
assert.equal(arcaneSacred?.value,2,'Arcane Devotee Sacred Defense scales at 4th class level');
assert.equal(classEffectModifier35(arcane,'Will save'),0,'Arcane Devotee Sacred Defense remains conditional by default');
assert.equal(classEffectModifier35({...arcane,classEffectToggles35:{[arcaneSacred.id]:true}},'Will save'),2,'Arcane Devotee Sacred Defense becomes operational when its condition is explicitly active');
const cipher=reconcileClassGrants(base(exact('classes/cipher-adept-688'),10));
assert.equal(cipher.classEffects35.find(effect=>effect.effectId==='combat-instinct-initiative')?.value,3,'Cipher Adept Combat Instinct scales at 9th class level');
assert.equal(classEffectModifier35(cipher,'initiative'),3,'Cipher Adept Combat Instinct contributes to initiative automatically');
const cloud=reconcileClassGrants(base(exact('classes/cloud-anchorite-499'),10));
assert.equal(cloud.classEffects35.find(effect=>effect.effectId==='cold-resistance')?.value,10,'Cloud Anchorite cold resistance scales at 8th class level');
assert.equal(cloud.classEffects35.find(effect=>effect.effectId==='fast-movement')?.value,20,'Cloud Anchorite Fast Movement scales at 8th class level');
const cloudMovement=cloud.classEffects35.find(effect=>effect.effectId==='fast-movement');
assert.equal(classEffectMovementBonus35(cloud,'land'),0,'Cloud Anchorite conditional movement is not assumed active');
assert.equal(classEffectMovementBonus35({...cloud,classEffectToggles35:{[cloudMovement.id]:true}},'land'),20,'Cloud Anchorite Fast Movement applies after the source condition is explicitly enabled');
const crimson=reconcileClassGrants(base(exact('classes/crimson-scourge-262'),10));
assert.equal(classEffectModifier35(crimson,'initiative'),3,'Crimson Scourge Smell of Blood contributes its unconditional initiative bonus');
const dread=reconcileClassGrants(base(exact('classes/dread-fang-of-lolth-428'),10));
assert.match(describeClassEffect35(dread.classEffects35.find(effect=>effect.effectId==='lolths-will-save')),/set to 4.*will-save/i,'set-value effects must not be displayed as additive bonuses');
assert.equal(classEffectModifier35(dread,'Will save'),0,'set-value effects are never misapplied as additive modifiers');

console.log(`generic 3.5 class effect regression passed: ${reviewedExpected.size} exact reviewed classes, ${reviewedEffectCount} structured effects plus operational conditional modifiers`);
