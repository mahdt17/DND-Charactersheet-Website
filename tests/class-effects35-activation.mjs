#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants} from '../src/lib/classIntegration.js';
import {classEffectActive35} from '../src/lib/classEffects35.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const definition=exact('classes/cloud-anchorite-499');
assert(definition,'exact Cloud Anchorite record must exist');
const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
const base={
  id:'class-effect-activation',name:'Activation semantics',ruleset:'3.5',mechanics:'3.5',level,
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
  className:definition.name,classDefinition:definition,
  classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],
  grantedFeatures:[],actions:[],feats:[],resources:[],trainingGrants:[],classSkills35:[],classSkillRules35:[],classProgressionTracks:[],classSpellSlots:[],
  classEffects35:[],classEffectToggles35:{},featureChoices:{},spells:[]
};

const character=reconcileClassGrants(base);
const climb=character.classEffects35.find(effect=>effect.effectId==='climb-speed');
const fast=character.classEffects35.find(effect=>effect.effectId==='fast-movement');
assert(climb,'Cloud Anchorite climb-speed effect must materialize');
assert(fast,'Cloud Anchorite Fast Movement effect must materialize');
assert.equal(climb.defaultActive,true,'the reviewed climb speed exists by default and is lost only under its listed armor/load restriction');
assert.equal(classEffectActive35(character,climb),true,'default-active conditional effects are active when no explicit override exists');
assert.equal(classEffectActive35(character,fast),false,'ordinary positive conditional effects remain fail-closed by default');

const suppressed=reconcileClassGrants({...character,classEffectToggles35:{...character.classEffectToggles35,[climb.id]:false}});
const suppressedClimb=suppressed.classEffects35.find(effect=>effect.effectId==='climb-speed');
assert.equal(suppressed.classEffectToggles35[climb.id],false,'an explicit false override must survive reconciliation for a default-active effect');
assert.equal(classEffectActive35(suppressed,suppressedClimb),false,'explicit false suppresses a default-active effect');

const restored=reconcileClassGrants({...suppressed,classEffectToggles35:{...suppressed.classEffectToggles35,[climb.id]:true}});
const restoredClimb=restored.classEffects35.find(effect=>effect.effectId==='climb-speed');
assert.equal(restored.classEffectToggles35[climb.id],true,'an explicit true override remains supported');
assert.equal(classEffectActive35(restored,restoredClimb),true,'explicit true re-enables the default-active effect');

console.log('default-active 3.5 class effect activation regression passed');
