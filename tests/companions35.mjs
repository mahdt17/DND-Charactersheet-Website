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
  transitionCompanion35,
  companionMasterEffects35
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


const standardFamiliarOptions=companionChoiceOptions35('standard-familiar',1);
assert.deepEqual(standardFamiliarOptions.map(option=>option.name),['Bat','Cat','Hawk','Lizard','Owl','Rat','Raven','Snake','Toad','Weasel']);
for(const option of standardFamiliarOptions){
  assert(option.baseCreatureId,option.name+' familiar must point to an exact 3.5 creature record');
  const base=companionCreature35(option.baseCreatureId);
  assert(base,option.name+' familiar base creature must be source-locked');
  assert.equal(base.edition,'3.5');
}
console.log('PASS every standard familiar choice has a source-locked creature record');

for(const [name,id,type] of [
  ['Imp','monsters/devil-imp-73','Outsider'],
  ['Quasit','monsters/demon-quasit-59','Outsider'],
  ['Vargouille','monsters/vargouille-505','Outsider'],
  ['Ghostly Visage','monsters/ghostly-visage-heroes-of-horror','Undead']
]){
  const base=companionCreature35(name);
  assert(base,name+' Dread Necromancer familiar must have a source-locked creature record');
  assert.equal(base.id,id);
  assert.equal(base.type,type);
}


const familiarBenefitExpectations={
  Bat:{type:'skill',skill:'Listen',bonus:3},
  Cat:{type:'skill',skill:'Move Silently',bonus:3},
  Hawk:{type:'skill',skill:'Spot',bonus:3,condition:'bright light'},
  Lizard:{type:'skill',skill:'Climb',bonus:3},
  Owl:{type:'skill',skill:'Spot',bonus:3,condition:'shadows'},
  Rat:{type:'save',save:'fort',bonus:2},
  Raven:{type:'skill',skill:'Appraise',bonus:3},
  Snake:{type:'skill',skill:'Bluff',bonus:3},
  Toad:{type:'hp',bonus:3},
  Weasel:{type:'save',save:'ref',bonus:2}
};
for(const [name,expected] of Object.entries(familiarBenefitExpectations)){
  const base=companionCreature35(name);
  assert(base?.familiarMasterBenefit,name+' familiar must define its master benefit');
  assert.deepEqual(base.familiarMasterBenefit,expected,name+' master benefit matches the 3.5 familiar table');
}
assert.equal(companionCreature35('Raven')?.familiarLanguageChoice,true,'Raven familiar can speak one language chosen by its master');
console.log('PASS familiar species benefits are structured');

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
assert.equal(animalUp.companions[0].derivedStats.totalHitDice,6,'bonus HD increases total companion HD');
assert.equal(animalUp.companions[0].hp.max,42,'bonus HD increases companion maximum HP using d8 average plus Constitution modifier');
assert.equal(animalUp.companions[0].derivedStats.baseAttack,4,'animal companion BAB advances as a druid of total HD');
assert.deepEqual(animalUp.companions[0].derivedStats.saves,{fort:7,ref:8,will:3},'animal companion good Fort/Ref and poor Will saves advance with total HD');
assert.deepEqual(animalUp.companions[0].derivedStats.ac,{total:17,touch:12,flatFooted:14},'Dex progression and natural armor both affect AC correctly');
console.log('PASS bonus HD increases deterministic derived combat statistics');

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
  companions:[],bab:2,save35:{fort:1,ref:1,will:6}
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
assert.equal(familiar.derivedStats.baseAttack,2,'familiar uses the master BAB when it is better than its normal BAB');
assert.deepEqual(familiar.derivedStats.saves,{fort:2,ref:4,will:8},'familiar uses the better master base saves with its own ability modifiers');


const familiarMasterEffects=companionMasterEffects35(familiarState);
assert.equal(familiarMasterEffects.skillBonuses.Appraise,3,'Raven grants +3 Appraise while active and in range');
assert.equal(familiarMasterEffects.hpBonus,0);
assert.equal(familiarMasterEffects.saveBonuses.fort,0);
assert.equal(familiarMasterEffects.languageChoices.length,1,'Raven exposes its one spoken-language choice');
assert.equal(familiarMasterEffects.languageChoices[0].companionId,familiar.id);

const toadState=reconcileCompanions35({...familiarCharacter,featureChoices:{familiar:choice('dndtools:classes/wizard-99','Familiar','Toad','standard-familiar','monsters/toad-591')}});
assert.equal(companionMasterEffects35(toadState).hpBonus,3,'Toad grants +3 master hit points');

const ratState=reconcileCompanions35({...familiarCharacter,featureChoices:{familiar:choice('dndtools:classes/wizard-99','Familiar','Rat','standard-familiar','monsters/rat-574')}});
assert.equal(companionMasterEffects35(ratState).saveBonuses.fort,2,'Rat grants +2 Fortitude');

const hawkState=reconcileCompanions35({...familiarCharacter,featureChoices:{familiar:choice('dndtools:classes/wizard-99','Familiar','Hawk','standard-familiar','monsters/hawk-552')}});
assert.deepEqual(companionMasterEffects35(hawkState).conditionalSkillBonuses.Spot,[{id:hawkState.companions[0].id+':Spot:bright light',companionId:hawkState.companions[0].id,bonus:3,condition:'bright light'}]);

const deadRat=transitionCompanion35(ratState,ratState.companions[0].id,'mark-dead');
assert.equal(companionMasterEffects35(deadRat).saveBonuses.fort,0,'inactive familiar benefits do not apply');
console.log('PASS familiar master effects aggregate without mutating base character values');

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


const dreadFeature=sourceFeature('dndtools:classes/dread-necromancer-75','Summon Familiar','standard-familiar','familiar',{mode:'full'},{
  companionExceptions:{choiceOptionsFromFeature:true,retainCreatureType:true,omitAbilities:['Speak with Animals of Its Kind'],deliverTouchAbilities:true}
});
for(const [name,baseCreatureId] of [
  ['Imp','monsters/devil-imp-73'],
  ['Quasit','monsters/demon-quasit-59'],
  ['Vargouille','monsters/vargouille-505'],
  ['Ghostly Visage','monsters/ghostly-visage-heroes-of-horror']
]){
  const dreadState=reconcileCompanions35({
    id:'dread-'+name,ruleset:'3.5',level:7,hp:{current:40,max:40,temp:0},
    classLevels:[{catalogId:'dndtools:classes/dread-necromancer-75',name:'Dread Necromancer',edition:'3.5',level:7}],
    grantedFeatures:[dreadFeature],
    featureChoices:{familiar:choice('dndtools:classes/dread-necromancer-75','Summon Familiar',name,'standard-familiar',baseCreatureId)},
    companions:[]
  });
  const dread=dreadState.companions[0];
  assert(dread,name+' Dread familiar materializes');
  assert.equal(dread.incomplete,false,name+' Dread familiar has complete base creature state');
  assert.equal(dread.derivedStats.type,companionCreature35(baseCreatureId).type,'Dread familiar preserves its original creature type');
  assert(!dread.specialAbilities.includes('Speak with Animals of Its Kind'),'Dread familiar omits speak-with-kind');
  assert(dread.specialAbilities.includes('Deliver Dread Necromancer Touch Abilities'),'Dread familiar exposes its touch-delivery exception');
}

const paladinFeature=sourceFeature('dndtools:classes/paladin-95','Special Mount','paladin-special-mount','special-mount',{mode:'full'},{
  companionChoiceRequired:false,companionDefaultCreatureId:'monsters/warhorse-heavy-555'
});
const paladinState=reconcileCompanions35({
  id:'paladin-owner',ruleset:'3.5',level:5,hp:{current:42,max:42,temp:0},
  classLevels:[{catalogId:'dndtools:classes/paladin-95',name:'Paladin',edition:'3.5',level:5}],
  grantedFeatures:[paladinFeature],featureChoices:{},companions:[]
});
assert.equal(paladinState.companions[0]?.baseCreatureId,'monsters/warhorse-heavy-555');
assert.equal(paladinState.companions[0]?.effectiveCompanionLevel,5);
assert.equal(paladinState.companions[0]?.progression.bonusHD,2);
assert.equal(paladinState.companions[0]?.lifecycle.replacementCondition,'30-days-or-paladin-level');


const smallPaladinFeature=sourceFeature('dndtools:classes/paladin-95','Special Mount','paladin-special-mount','special-mount',{mode:'full'},{
  companionChoiceRequired:false,
  companionDefaultCreatureId:'monsters/warhorse-heavy-555',
  companionDefaultCreatureByMasterSize:{Small:'monsters/pony-war-571',Medium:'monsters/warhorse-heavy-555'}
});
const smallPaladinState=reconcileCompanions35({
  id:'small-paladin-owner',ruleset:'3.5',level:5,hp:{current:38,max:38,temp:0},
  race:'Halfling',raceDefinition:{name:'Halfling',size:'Small'},
  classLevels:[{catalogId:'dndtools:classes/paladin-95',name:'Paladin',edition:'3.5',level:5}],
  grantedFeatures:[smallPaladinFeature],featureChoices:{},companions:[]
});
assert.equal(smallPaladinState.companions[0]?.baseCreatureId,'monsters/pony-war-571','Small paladin defaults to a warpony');
assert.equal(smallPaladinState.companions[0]?.sourceCreatureName,'Warpony');

const healerFeature=sourceFeature('dndtools:classes/healer-77','Unicorn Companion','healer-companion','class-companion',{mode:'full'},{
  companionChoiceRequired:false,companionDefaultCreatureId:'monsters/unicorn-500',companionTemplate:'celestial'
});
const healerState=reconcileCompanions35({
  id:'healer-owner',ruleset:'3.5',level:8,hp:{current:30,max:30,temp:0},
  classLevels:[{catalogId:'dndtools:classes/healer-77',name:'Healer',edition:'3.5',level:8}],
  grantedFeatures:[healerFeature],featureChoices:{},companions:[]
});
assert.equal(healerState.companions[0]?.baseCreatureId,'monsters/unicorn-500');
assert.equal(healerState.companions[0]?.template,'celestial');
assert.equal(healerState.companions[0]?.progression.bonusHD,0);

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
