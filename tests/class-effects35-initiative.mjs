#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const cipher=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/cipher-adept-688'),reference);
const fighter=annotateClassGrantKinds(classes.find(record=>record.sourceId==='classes/fighter-93'),reference);
assert(cipher&&fighter,'exact reviewed Cipher Adept and Fighter records must exist');
const base=manual=>({
  id:'initiative-effects-test',name:'Initiative Effects',ruleset:'3.5',mechanics:'3.5',level:11,
  className:'Fighter',classDefinition:fighter,
  classLevels:[
    {catalogId:fighter.catalogId,name:fighter.name,edition:'3.5',level:1,definition:fighter},
    {catalogId:cipher.catalogId,name:cipher.name,edition:'3.5',level:10,definition:cipher}
  ],
  abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},hp:{current:30,max:30,temp:0},
  initiativeBonus:manual,grantedFeatures:[],actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{},spells:[]
});

const automatic=reconcileClassGrants(base(0));
assert.equal(automatic.classEffectInitiativeBonus35,3,'Cipher Adept Combat Instinct is tracked as a +3 derived initiative bonus');
assert.equal(automatic.classEffectInitiativeManual35,0,'zero manual initiative remains distinguishable from the derived class bonus');
assert.equal(automatic.initiativeBonus,3,'derived initiative is materialized into the existing sheet initiative field');
const automaticTwice=reconcileClassGrants(automatic);
assert.equal(automaticTwice.initiativeBonus,3,'reconciliation never double-applies the class-derived initiative bonus');
assert.equal(automaticTwice.classEffectInitiativeBonus35,3);
const automaticRemoved=removeClassProgression(automaticTwice,cipher.catalogId);
assert.equal(automaticRemoved.initiativeBonus,0,'removing Cipher Adept removes only its derived initiative contribution');
assert.equal(automaticRemoved.classEffectInitiativeBonus35,0);
assert.equal(automaticRemoved.classEffectInitiativeManual35,0);

const manual=reconcileClassGrants(base(2));
assert.equal(manual.classEffectInitiativeManual35,2,'pre-existing manual initiative is preserved separately');
assert.equal(manual.classEffectInitiativeBonus35,3);
assert.equal(manual.initiativeBonus,5,'manual and derived initiative contributions combine once');
const manualTwice=reconcileClassGrants(manual);
assert.equal(manualTwice.initiativeBonus,5,'manual plus derived initiative stays idempotent');
const edited=reconcileClassGrants({...manualTwice,initiativeBonus:7});
assert.equal(edited.classEffectInitiativeManual35,4,'a user edit to the combined initiative field is reinterpreted as the new manual component');
assert.equal(edited.classEffectInitiativeBonus35,3);
assert.equal(edited.initiativeBonus,7);
const editedRemoved=removeClassProgression(edited,cipher.catalogId);
assert.equal(editedRemoved.initiativeBonus,4,'source removal preserves the user-edited manual initiative component');
assert.equal(editedRemoved.classEffectInitiativeBonus35,0);
assert.equal(editedRemoved.classEffectInitiativeManual35,4);

console.log('structured class initiative reconciliation regression passed');
