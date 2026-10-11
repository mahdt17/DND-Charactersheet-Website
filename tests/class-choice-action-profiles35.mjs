#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {featureChoicePlan} from '../src/lib/featureChoices.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const dragonShaman=classes.find(record=>record.sourceId==='classes/dragon-shaman-101');
assert(dragonShaman,'exact Dragon Shaman source record must exist');

const character={
  id:'dragon-shaman-action-profile',ruleset:'3.5',mechanics:'3.5',alignment:'Lawful Good',level:4,
  classLevels:[{catalogId:dragonShaman.catalogId,name:dragonShaman.name,edition:'3.5',level:4,definition:dragonShaman}],
  abilities:{str:12,dex:12,con:16,int:10,wis:12,cha:14},
  feats:[],actions:[],resources:[],spells:[],featureChoices:{},trainingGrants:[]
};

const initial=featureChoicePlan(character,null,{},{});
const totem=initial.groups.find(group=>group.label==='Totem Dragon');
assert(totem,'Dragon Shaman must expose its Totem Dragon choice');
assert(totem.options.includes('Gold'),'Lawful Good Dragon Shaman must be able to select Gold');

const selected=featureChoicePlan(character,null,{[totem.id]:['Gold']},{});
assert.equal(selected.groups.find(group=>group.id===totem.id)?.valid,true,'Gold totem selection must be valid');
const reconciled=reconcileClassGrants({...character,...selected.patch});
const breathAction=(reconciled.actions||[]).find(action=>/^Breath Weapon/i.test(action.name||''));
assert(breathAction,'Dragon Shaman must materialize its Breath Weapon action');
assert.equal(breathAction.shape,'cone','selected Gold totem must configure the Breath Weapon action shape');
assert.equal(breathAction.energy,'fire','selected Gold totem must configure the Breath Weapon action energy');
assert.deepEqual(breathAction.breathWeapon,{shape:'cone',energy:'fire'},'the action must retain the selected structured breath-weapon profile');

console.log('PASS selected class choice mechanics configure structured action profiles.');
