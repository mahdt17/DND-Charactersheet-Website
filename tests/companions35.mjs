import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

let engine;
try {
  engine=await import('../src/lib/companions35.js');
} catch (error) {
  assert.fail('3.5 companion engine must exist before these regressions can pass: '+error.message);
}

const {
  COMPANION_ENGINE_VERSION,
  companionCreature35,
  companionChoiceOptions35,
  companionProgression35,
  companionEffectiveLevel35,
  reconcileCompanions35,
  transitionCompanion35
}=engine;

assert.equal(COMPANION_ENGINE_VERSION,1);

for (const [query,id] of [
  ['Wolf','monsters/wolf-596'],
  ['Ape','monsters/ape-531'],
  ['Raven','monsters/raven-575'],
  ['Imp','monsters/devil-imp-73'],
  ['Warhorse, Heavy','monsters/warhorse-heavy-555'],
  ['Unicorn','monsters/unicorn-500']
]) {
  const creature=companionCreature35(query);
  assert(creature,query+' must resolve from the source-locked 3.5 companion catalog');
  assert.equal(creature.id,id,query+' exact 3.5 source identity');
  assert.equal(creature.edition,'3.5');
  assert.match(creature.sourceUrl,/dndtools\.org\/monsters\//);
}
assert.equal(companionCreature35('Adult Red Dragon'),null,'unpopulated creatures fail closed');

const wolf=companionCreature35('Wolf');
assert.equal(wolf.hp,13);
assert.deepEqual(wolf.ac,{total:14,touch:12,flatFooted:12});
assert.deepEqual(wolf.abilities,{str:13,dex:15,con:15,int:2,wis:12,cha:6});

const ape=companionCreature35('Ape');
assert.equal(ape.hp,29);
assert.equal(ape.abilities.str,21);

const raven=companionCreature35('Raven');
assert.equal(raven.hp,1);
assert.equal(raven.size,'Tiny');

const imp=companionCreature35('Imp');
assert.equal(imp.type,'Outsider');
assert.equal(imp.ac.total,18);

const horse=companionCreature35('Warhorse, Heavy');
assert.equal(horse.hp,30);
assert.equal(horse.speed.land,50);

const unicorn=companionCreature35('Unicorn');
assert.equal(unicorn.hp,42);
assert.equal(unicorn.abilities.cha,24);

const animal1=companionProgression35('druid-animal-companion',1);
assert.deepEqual(
  {
    bonusHD:animal1.bonusHD,
    naturalArmorAdjustment:animal1.naturalArmorAdjustment,
    strDexAdjustment:animal1.strDexAdjustment,
    bonusTricks:animal1.bonusTricks,
    specialAbilities:animal1.specialAbilities
  },
  {bonusHD:0,naturalArmorAdjustment:0,strDexAdjustment:0,bonusTricks:1,specialAbilities:['Link','Share Spells']}
);
const animal4=companionProgression35('druid-animal-companion',4);
assert.equal(animal4.bonusHD,2);
assert.equal(animal4.naturalArmorAdjustment,2);
assert.equal(animal4.strDexAdjustment,1);
assert.equal(animal4.bonusTricks,2);
assert(animal4.specialAbilities.includes('Evasion'));

const animalOptions1=companionChoiceOptions35('druid-animal-companion',1);
assert(animalOptions1.some(x=>x.name==='Wolf'));
assert(animalOptions1.some(x=>x.name==='Shark (Medium)'));
assert(!animalOptions1.some(x=>x.name==='Ape'));
const animalOptions4=companionChoiceOptions35('druid-animal-companion',4);
assert(animalOptions4.some(x=>x.name==='Ape'&&x.levelAdjustment===3));
assert(animalOptions4.some(x=>x.name==='Crocodile'));
assert(!animalOptions4.some(x=>x.name==='Dire Wolf'));

const familiar1=companionProgression35('standard-familiar',1);
assert.equal(familiar1.naturalArmorAdjustment,1);
assert.equal(familiar1.intelligence,6);
for(const name of ['Alertness','Improved Evasion','Share Spells','Empathic Link'])assert(familiar1.specialAbilities.includes(name));
const familiar7=companionProgression35('standard-familiar',7);
assert.equal(familiar7.naturalArmorAdjustment,4);
assert.equal(familiar7.intelligence,9);
assert(familiar7.specialAbilities.includes('Speak with Animals of Its Kind'));

const mount5=companionProgression35('paladin-special-mount',5);
assert.equal(mount5.bonusHD,2);
assert.equal(mount5.naturalArmorAdjustment,4);
assert.equal(mount5.strengthAdjustment,1);
assert.equal(mount5.intelligence,6);
for(const name of ['Empathic Link','Improved Evasion','Share Spells','Share Saving Throws'])assert(mount5.specialAbilities.includes(name));

const healer8=companionProgression35('healer-companion',8);
assert.equal(healer8.bonusHD,0);
assert.equal(healer8.naturalArmorAdjustment,0);
assert.equal(healer8.strDexIntAdjustment,0);
for(const name of ['Empathic Link','Improved Evasion','Share Saving Throws','Share Spells'])assert(healer8.specialAbilities.includes(name));

assert.equal(companionEffectiveLevel35([{level:8,mode:'fraction',numerator:1,denominator:2}],3),1,'Ranger-style half level and alternative adjustment');
assert.equal(companionEffectiveLevel35([{level:6,mode:'full'},{level:4,mode:'minus',amount:3}]),7,'familiar-granting classes can contribute different formulas');
assert.equal(companionEffectiveLevel35([{mode:'fixed',amount:5}],0),5);
assert.equal(companionEffectiveLevel35([{level:2,mode:'minus',amount:3}],0),0,'contributions never go negative');

const sourceFeature=(sourceClassId,name,profileId,relationshipType,contribution,extra={})=>({
  id:'feature:'+sourceClassId+':'+name,sourceClassId,sourceFeatureId:name,sourceClassName:sourceClassId.split('/').at(-1),
  name,companionProfileId:profileId,companionRelationshipType:relationshipType,companionContribution:contribution,
  companionChoiceRequired:true,...extra
});
const choice=(sourceClassId,feature,name,profileId,baseCreatureId,levelAdjustment=0)=>({
  sourceClassId,feature,choices:[name],choiceKind:profileId==='standard-familiar'?'familiar':'animal-companion',
  companionProfileId:profileId,baseCreatureId,levelAdjustment
});
const animalCharacter={
  id:'animal-owner',ruleset:'3.5',level:4,hp:{current:30,max:30,temp:4},
  classLevels:[{catalogId:'dndtools:classes/druid-92',name:'Druid',edition:'3.5',level:4}],
  grantedFeatures:[sourceFeature('dndtools:classes/druid-92','Animal Companion','druid-animal-companion','animal-companion',{mode:'full'})],
  featureChoices:{animal:choice('dndtools:classes/druid-92','Animal Companion','Ape','druid-animal-companion','monsters/ape-531',3)},
  companions:[]
};
const animalState=reconcileCompanions35(animalCharacter);
assert.equal(animalState.companions.length,1);
const animal=animalState.companions[0];
assert.equal(animal.relationshipType,'animal-companion');
assert.equal(animal.baseCreatureId,'monsters/ape-531');
assert.equal(animal.effectiveMasterLevel,4);
assert.equal(animal.levelAdjustment,3);
assert.equal(animal.effectiveCompanionLevel,1);
assert.equal(animal.progression.bonusHD,0);
assert.equal(animal.derivedStats.ac.total,14);

const editedAnimal={...animalState,companions:[{...animal,name:'Koko',notes:'Keeps the silver collar.',hp:{...animal.hp,current:7},status:'active'}]};
const animalUp=reconcileCompanions35({...editedAnimal,level:8,classLevels:[{...editedAnimal.classLevels[0],level:8}]});
assert.equal(animalUp.companions[0].name,'Koko','nickname survives reconciliation');
assert.equal(animalUp.companions[0].notes,'Keeps the silver collar.','notes survive reconciliation');
assert.equal(animalUp.companions[0].hp.current,7,'current HP survives level-up recalculation');
assert.equal(animalUp.companions[0].effectiveMasterLevel,8);
assert.equal(animalUp.companions[0].effectiveCompanionLevel,5);
assert.equal(animalUp.companions[0].progression.bonusHD,2);

const familiarFeatures=[
  sourceFeature('dndtools:classes/wizard-99','Familiar','standard-familiar','familiar',{mode:'full'}),
  sourceFeature('dndtools:classes/sorcerer-98','Familiar','standard-familiar','familiar',{mode:'full'})
];
const familiarCharacter={
  id:'familiar-owner',ruleset:'3.5',level:5,hp:{current:22,max:22,temp:9},
  classLevels:[
    {catalogId:'dndtools:classes/wizard-99',name:'Wizard',edition:'3.5',level:3},
    {catalogId:'dndtools:classes/sorcerer-98',name:'Sorcerer',edition:'3.5',level:2}
  ],
  grantedFeatures:familiarFeatures,
  featureChoices:{familiar:choice('dndtools:classes/wizard-99','Familiar','Raven','standard-familiar','monsters/raven-575')},
  companions:[]
};
const familiarState=reconcileCompanions35(familiarCharacter);
assert.equal(familiarState.companions.length,1,'qualifying familiar classes share one familiar');
const familiar=familiarState.companions[0];
assert.equal(familiar.relationshipType,'familiar');
assert.deepEqual(familiar.sourceClassIds.sort(),['dndtools:classes/sorcerer-98','dndtools:classes/wizard-99'].sort());
assert.equal(familiar.effectiveMasterLevel,5,'familiar-granting class contributions stack');
assert.equal(familiar.hp.max,11,'familiar HP is half master total HP and ignores temporary HP');
assert.equal(familiar.derivedStats.abilities.int,8);
assert.equal(familiar.derivedStats.type,'Magical Beast');

const sorcererOnly=reconcileCompanions35({
  ...familiarState,level:2,
  classLevels:[{catalogId:'dndtools:classes/sorcerer-98',name:'Sorcerer',edition:'3.5',level:2}],
  grantedFeatures:[familiarFeatures[1]],featureChoices:{}
});
assert.equal(sorcererOnly.companions.length,1,'removing one familiar source retains the familiar while another source qualifies');
assert.equal(sorcererOnly.companions[0].baseCreatureId,'monsters/raven-575');
assert.equal(sorcererOnly.companions[0].effectiveMasterLevel,2);
assert.equal(reconcileCompanions35({...sorcererOnly,classLevels:[],grantedFeatures:[],featureChoices:{}}).companions.length,0,'removing the last source removes the automatic familiar');

const missing=reconcileCompanions35({
  ...animalCharacter,
  featureChoices:{animal:choice('dndtools:classes/druid-92','Animal Companion','Unknown Beast','druid-animal-companion','monsters/not-present')}
});
assert.equal(missing.companions.length,1,'unresolved source state remains visible rather than substituting another creature');
assert.equal(missing.companions[0].incomplete,true);
assert.match(missing.companionAutomation.incompleteReasons[0],/source-locked creature/i);

const dead=transitionCompanion35(familiarState,familiar.id,'mark-dead');
assert.equal(dead.companions[0].status,'dead');
assert.equal(dead.companions[0].lifecycle.replacementCondition,'year-and-a-day');
assert.equal(typeof dead.companions[0].lifecycle.available,'boolean');
const available=transitionCompanion35(dead,familiar.id,'confirm-replacement-available');
assert.equal(available.companions[0].lifecycle.available,true);
const released=transitionCompanion35(animalState,animal.id,'release');
assert.equal(released.companions[0].status,'released');
assert.equal(released.companions[0].lifecycle.replacementCondition,'24-hours-prayer');
assert(!JSON.stringify(released).match(/Date\.now|T\d{2}:\d{2}/),'campaign lifecycle does not persist wall-clock timestamps');

const moduleText=await fs.readFile(new URL('../src/lib/companions35.js',import.meta.url),'utf8');
assert(!moduleText.includes("from '../data/monsters.json'"),'3.5 companion engine must never import the 5e monster catalog');

console.log('PASS 3.5 companion catalog, legal options, progression profiles, and effective-level math');
