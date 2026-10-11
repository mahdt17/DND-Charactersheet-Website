import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';

const definition=(id,name,rows,edition='3.5')=>({
  id:'dndtools:'+id,
  catalogId:'dndtools:'+id,
  sourceId:id,
  index:id,
  name,
  edition,
  hit_die:4,
  progression:[
    ['Level','Power Points','Powers Known','Maximum Power Level Known'],
    ...rows
  ],
  mechanicsPresence:{classFeatures:true,ruleProse:true}
});
const psion=definition('classes/manifesting-test-psion','Manifesting Test Psion',[
  ['1st','2','3','1st'],
  ['2nd','6','5','1st'],
  ['3rd','11','7','2nd']
]);
const ardent=definition('classes/manifesting-test-ardent','Manifesting Test Ardent',[
  ['1st','2','2','1st'],
  ['2nd','5','3','1st']
]);
const row=(record,level)=>({catalogId:record.catalogId,name:record.name,edition:record.edition,level,definition:record});
const character=classLevels=>({
  id:'manifesting35-test',ruleset:'3.5',mechanics:'3.5',classLevels,
  level:classLevels.reduce((sum,item)=>sum+item.level,0),
  abilities:{str:10,dex:10,con:10,int:16,wis:16,cha:10},
  hp:{current:12,max:12},actions:[],feats:[],resources:[],spells:[],featureChoices:{}
});
const profileFor=(state,classId)=>(state.manifesting35||[]).find(profile=>profile.sourceClassId===classId);
const ppFor=(state,classId)=>(state.resources||[]).find(resource=>resource.manifesting35&&resource.sourceClassIds.includes(classId));

let state=reconcileClassGrants(character([row(psion,3)]));
let profile=profileFor(state,psion.catalogId),pool=ppFor(state,psion.catalogId);
assert(profile,'a 3.5 class with psionic progression tracks must derive a manifesting profile');
assert.equal(profile.powerPointsMax,11);
assert.equal(profile.powersKnown,7);
assert.equal(profile.maxPowerLevel,2);
assert.equal(profile.effectiveClassLevel,3);
assert(pool,'manifesting must expose a spendable power-point resource');
assert.equal(pool.max,11);
assert.equal(pool.used,0);
assert.equal(pool.unit,'PP');

// Spending is mutable state. Reconciliation must not refill the pool.
state={...state,powerPointsUsed:6};
state=reconcileClassGrants(state);
pool=ppFor(state,psion.catalogId);
assert.equal(pool.used,6,'reconcile must preserve spent power points');
assert.equal(profileFor(state,psion.catalogId).powerPointsMax,11);

// Losing effective levels recomputes progression without refunding expenditure.
state={...state,classLevels:[row(psion,2)],level:2,castingAdvancements:[]};
state=reconcileClassGrants(state);
profile=profileFor(state,psion.catalogId);pool=ppFor(state,psion.catalogId);
assert.equal(profile.powerPointsMax,6);
assert.equal(profile.powersKnown,5);
assert.equal(profile.maxPowerLevel,1);
assert.equal(pool.max,6);
assert.equal(pool.used,6);
state={...state,classLevels:[row(psion,1)],level:1};
state=reconcileClassGrants(state);
assert.equal(ppFor(state,psion.catalogId).used,6,'spent PP survives a reduced maximum');

// Existing prestige manifesting advancement must feed the same derived state.
state={...character([row(psion,2)]),castingAdvancements:[{
  id:'advance-psion',sourceClassId:'dndtools:classes/test-prestige',sourceClassLevel:1,
  targetClassId:psion.catalogId,targetClassName:psion.name,kind:'psionic',amount:1,
  automatic:true,sourceType:'class'
}]};
state=reconcileClassGrants(state);
profile=profileFor(state,psion.catalogId);
assert.equal(profile.effectiveClassLevel,3);
assert.equal(profile.powerPointsMax,11);
assert.equal(profile.powersKnown,7);
assert.equal(profile.maxPowerLevel,2);

// Multiclass manifesters retain distinct profiles but share their source contributions.
state=reconcileClassGrants(character([row(psion,2),row(ardent,2)]));
assert.equal((state.manifesting35||[]).length,2);
assert.equal(ppFor(state,psion.catalogId).max,11);
assert.equal(ppFor(state,ardent.catalogId).max,11);
assert.equal(state.resources.filter(r=>r.manifesting35).length,1);
const removed=removeClassProgression(state,ardent.catalogId);
assert(profileFor(removed,psion.catalogId));
assert(!profileFor(removed,ardent.catalogId));
assert(ppFor(removed,psion.catalogId));
assert(!ppFor(removed,ardent.catalogId));

// The subsystem is explicitly 3.5-only even if another edition has similarly named columns.
const modern=definition('classes/not-legacy-psion','Not Legacy Psion', [['1st','99','99','9th']],'2014');
const modernState=reconcileClassGrants({...character([row(modern,1)]),ruleset:'2014',mechanics:'2014'});
assert.equal((modernState.manifesting35||[]).length,0);
assert.equal((modernState.resources||[]).filter(resource=>resource.manifesting35).length,0);

// Exercise the same path against the exact published D&DTools Psion record.
const publishedClasses=JSON.parse(await fs.readFile(new URL('../public/catalogs/dndtools/classes.json',import.meta.url),'utf8'));
const publishedPsionRaw=publishedClasses.find(record=>record?.name==='Psion'&&!record?.prestige);
assert(publishedPsionRaw,'published D&DTools catalog must contain the base Psion class');
const publishedPsion=normalizeCatalogRecord(publishedPsionRaw,'dndtools','classes');
const publishedState=reconcileClassGrants(character([row(publishedPsion,1)]));
const publishedProfile=profileFor(publishedState,publishedPsion.catalogId);
const publishedPool=ppFor(publishedState,publishedPsion.catalogId);
assert(publishedProfile,'exact published Psion must derive a manifesting profile');
assert.equal(publishedProfile.powerPointsMax,2);
assert.equal(publishedProfile.powersKnown,3);
assert.equal(publishedProfile.maxPowerLevel,1);
assert(publishedPool,'exact published Psion must expose its PP resource');
assert.equal(publishedPool.max,3,'base PP plus the existing Intelligence bonus');
assert.equal(publishedPool.used,0);

console.log(`3.5 manifesting state and power-point lifecycle regressions passed, including exact ${publishedPsion.sourceId}.`);
