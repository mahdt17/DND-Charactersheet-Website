#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const fighter=exact('classes/fighter-93'),cipher=exact('classes/cipher-adept-688'),dread=exact('classes/dread-fang-of-lolth-428');
assert(fighter&&cipher&&dread,'exact Fighter, Cipher Adept and Dread Fang records must exist');
const base=(definition,level,ac=16)=>({
  id:'ac-effects-test',name:'AC Effects',ruleset:'3.5',mechanics:'3.5',level:level+1,
  className:'Fighter',classDefinition:fighter,
  classLevels:[
    {catalogId:fighter.catalogId,name:fighter.name,edition:'3.5',level:1,definition:fighter},
    {catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}
  ],
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},hp:{current:30,max:30,temp:0},ac,
  grantedFeatures:[],actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{},spells:[],classEffectToggles35:{}
});

const cipherSheet=reconcileClassGrants(base(cipher,10));
assert.equal(cipherSheet.classEffects35.find(effect=>effect.effectId==='combat-instinct-ac')?.value,3,'Cipher Adept Combat Instinct resolves to +3 AC at 9th level');
assert.equal(cipherSheet.classEffectArmorClassBonus35,3,'unconditional class AC is tracked as derived state');
assert.equal(cipherSheet.classEffectArmorClassManual35,16,'underlying AC is preserved separately');
assert.equal(cipherSheet.ac,19,'Cipher Adept Combat Instinct raises live AC from 16 to 19');
assert.equal(reconcileClassGrants(cipherSheet).ac,19,'AC reconciliation is idempotent');
const cipherRemoved=removeClassProgression(cipherSheet,cipher.catalogId);
assert.equal(cipherRemoved.ac,16,'removing Cipher Adept restores the underlying AC');
assert.equal(cipherRemoved.classEffectArmorClassBonus35,0);
assert.equal(cipherRemoved.classEffectArmorClassManual35,16);

const dreadSheet=reconcileClassGrants(base(dread,10));
const teamDefense=dreadSheet.classEffects35.find(effect=>effect.effectId==='team-defense-ac');
assert(teamDefense,'Dread Fang Team Defense structured AC effect must materialize');
assert.equal(teamDefense.value,2);
assert.equal(dreadSheet.ac,16,'conditional Team Defense does not apply without explicit activation');
const dreadActive=reconcileClassGrants({...dreadSheet,classEffectToggles35:{[teamDefense.id]:true}});
assert.equal(dreadActive.classEffectArmorClassBonus35,2);
assert.equal(dreadActive.classEffectArmorClassManual35,16);
assert.equal(dreadActive.ac,18,'activating Team Defense raises live AC from 16 to 18');
assert.equal(reconcileClassGrants(dreadActive).ac,18,'active conditional AC stays idempotent');
const dreadOff=reconcileClassGrants({...dreadActive,classEffectToggles35:{}});
assert.equal(dreadOff.ac,16,'deactivating Team Defense removes only its derived AC');
const dreadEdited=reconcileClassGrants({...dreadActive,ac:20});
assert.equal(dreadEdited.classEffectArmorClassManual35,18,'editing combined AC while Team Defense is active updates the underlying manual/base AC');
assert.equal(dreadEdited.classEffectArmorClassBonus35,2);
assert.equal(dreadEdited.ac,20);
const dreadRemoved=removeClassProgression(dreadEdited,dread.catalogId);
assert.equal(dreadRemoved.ac,18,'source removal preserves the user-edited underlying AC');
assert.equal(dreadRemoved.classEffectArmorClassBonus35,0);
assert.equal(dreadRemoved.classEffectArmorClassManual35,18);

console.log('structured class AC reconciliation regression passed');
