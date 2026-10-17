import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,classAutomationReport} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-05-actions-resources-dmg-core';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'actions-resources-test',name:'Actions Resources Test',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:14,dex:16,con:14,int:14,wis:12,cha:12},hp:{current:30,max:30,temp:0},actions:[{id:'manual-action',name:'Manual action'}],feats:[{id:'manual-feat',name:'Manual feat'}],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const trainingIndexes=character=>(character.trainingGrants||[]).flatMap(grant=>grant.proficiencies||[]).map(item=>item.index).sort();
const prerequisiteTexts=definition=>(definition.prerequisites||[]).map(item=>item.text||String(item)).sort();

const expected={
  'classes/arcane-archer-378':{
    name:'Arcane Archer',sourceBook:"Dungeon Master's Guide v.3.5",level:10,minBab:'6',
    features:['Enhance Arrow','Imbue Arrow','Seeker Arrow','Phase Arrow','Hail of Arrows','Arrow of Death'],
    skills:['Craft','Hide','Listen','Move Silently','Ride','Spot','Survival','Use Rope'],
    prerequisites:['Race:Elf or half-elf','Feats:Point Blank Shot','Feats:Precise Shot','Feats:Weapon Focus (longbow or shortbow)','Spells:Ability to cast 1st-level arcane spells'],
    training:['light-armor','martial-weapons','medium-armor','shields','simple-weapons'],
    resources:[['Seeker Arrow',1],['Phase Arrow',1],['Hail of Arrows',1]],
    actions:['Imbue Arrow','Seeker Arrow','Phase Arrow','Hail of Arrows']
  },
  'classes/dwarven-defender-385':{
    name:'Dwarven Defender',sourceBook:"Dungeon Master's Guide v.3.5",level:10,minBab:'7',
    features:['AC Bonus','Defensive Stance','Uncanny Dodge','Trap Sense','Damage Reduction','Improved Uncanny Dodge','Mobile Defense'],
    skills:['Craft','Listen','Sense Motive','Spot'],
    prerequisites:['Race:Dwarf','Alignment:Any lawful','Feats:Dodge','Feats:Endurance','Feats:Toughness'],
    training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons'],
    resources:[['Defensive Stance',5]],
    actions:['Defensive Stance']
  },
  'classes/duelist-384':{
    name:'Duelist',sourceBook:"Dungeon Master's Guide v.3.5",level:10,minBab:'6',
    features:['Canny Defense','Improved Reaction','Enhanced Mobility','Grace','Precise Strike','Acrobatic Charge','Elaborate Parry','Deflect Arrows'],
    skills:['Balance','Bluff','Escape Artist','Jump','Listen','Perform','Sense Motive','Spot','Tumble'],
    prerequisites:['Skills:Perform 3 ranks','Skills:Tumble 5 ranks','Feats:Dodge','Feats:Mobility','Feats:Weapon Finesse'],
    training:['martial-weapons','simple-weapons'],resources:[],actions:[]
  },
  'classes/dread-commando-527':{
    name:'Dread Commando',sourceBook:'Heroes of Battle',level:5,minBab:'5',
    features:['Sudden Strike','Team Initiative Bonus','Armored Ease','Stealthy Movement'],
    skills:['Climb','Craft','Disable Device','Disguise','Escape Artist','Hide','Jump','Knowledge (geography)','Listen','Move Silently','Open Lock','Profession','Search','Spot','Swim','Use Rope'],
    prerequisites:['Skills:Hide 6 ranks','Skills:Move Silently 6 ranks','Feats:Dodge','Feats:Mobility'],
    training:[],resources:[],actions:[]
  },
  'classes/ghost-faced-killer-186':{
    name:'Ghost-faced Killer',sourceBook:'Complete Adventurer',level:10,minBab:'5',
    features:['Ghost Step','Sudden Strike','Frightful Attack','Ghost Sight','Frightful Cleave'],
    skills:['Bluff','Climb','Concentration','Hide','Intimidate','Jump','Listen','Move Silently','Open Lock','Search','Spot','Swim','Tumble'],
    prerequisites:['Alignment:Any evil','Skills:Hide 6 ranks','Skills:Concentration 4 ranks','Skills:Intimidate 8 ranks','Skills:Move Silently 6 ranks','Feats:Improved Initiative','Feats:Power Attack'],
    training:['light-armor','martial-weapons','simple-weapons'],resources:[['Ghost Step',4],['Frightful Attack',3]],actions:['Ghost Step','Frightful Attack']
  },
  'classes/warchief-581':{
    name:'Warchief',sourceBook:'Miniatures Handbook',level:10,minBab:'3',
    features:['Tribal Frenzy','Ability Boost','Devoted Bodyguards'],
    skills:['Bluff','Climb','Craft','Diplomacy','Handle Animal','Intimidate','Jump','Ride','Sense Motive','Swim'],
    prerequisites:['Special:Must have led a tribe in battle.'],
    training:[],resources:[],actions:['Tribal Frenzy']
  }
};

for(const [id,spec] of Object.entries(expected)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.sourceId,id,`${spec.name} source ID drift`);
  assert.equal(definition.sourceBook,spec.sourceBook,`${spec.name} source book drift`);
  assert.equal(definition.sourceVersion,'D&D 3.5',`${spec.name} source version drift`);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must be published through the reviewed action/resource overlay`);
  assert.equal(definition.referenceOnly,false,`${spec.name} must be source-verified`);
  assert.equal(String(definition.minBab||definition.stats?.minBab||''),spec.minBab,`${spec.name} BAB prerequisite drift`);
  assert.deepEqual((definition.classSkills||[]).slice().sort(),spec.skills.slice().sort(),`${spec.name} class skills drift`);
  assert.deepEqual(prerequisiteTexts(definition),spec.prerequisites.slice().sort(),`${spec.name} prerequisite drift`);
  assert.equal(definition.proficiencyReview?.verified,true,`${spec.name} proficiency evidence must be reviewed`);

  const character=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(character.grantedFeatures.filter(item=>item.sourceClassId===definition.catalogId).map(item=>item.name).sort(),spec.features.slice().sort(),`${spec.name} feature set drift`);
  assert.deepEqual(trainingIndexes(character),spec.training.slice().sort(),`${spec.name} training drift`);
  for(const [name,max] of spec.resources)assert.equal(character.resources.find(item=>item.name===name)?.max,max,`${spec.name} ${name} resource maximum`);
  for(const name of spec.actions)assert(character.actions.some(item=>item.name===name&&item.sourceClassId===definition.catalogId),`${spec.name} missing action ${name}`);
  assert.equal(classAutomationReport(character).classes[0].descriptionComplete,true,`${spec.name} must use reviewed feature text`);
  assert.deepEqual(reconcileClassGrants(character),character,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...character,classLevels:[row(definition,spec.level),survivor],level:spec.level+1},definition.catalogId);
  assert(!removed.grantedFeatures.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source features survive removal`);
  assert(!removed.actions.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source actions survive removal`);
  assert(!removed.resources.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source resources survive removal`);
  assert(!removed.trainingGrants.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source training survives removal`);
  assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),`${spec.name} removal must preserve manual data`);
}

{
  const archer=exact('classes/arcane-archer-378');
  assert.deepEqual(archer.conditionalMechanics?.arrowOfDeath,{kind:'prepared-ammunition',craftingTimeDays:1,maxActive:1,durationYears:1,fortitudeSaveDC:20,onFailedSave:'slain immediately'});
  const level10=reconcileClassGrants(base(archer,10));
  assert.match(level10.grantedFeatures.find(item=>item.name==='Enhance Arrow')?.description||'',/\+5/);
  assert.equal(level10.actions.find(item=>item.name==='Seeker Arrow')?.type,'Standard action');
  assert.equal(level10.actions.find(item=>item.name==='Phase Arrow')?.type,'Standard action');
}

{
  const defender=exact('classes/dwarven-defender-385');
  assert.deepEqual(defender.conditionalMechanics?.defensiveStance?.bonuses,{strength:2,constitution:4,savesResistance:2,acDodge:4});
  assert.equal(defender.conditionalMechanics?.defensiveStance?.durationFormula,'3 + improved Constitution modifier rounds');
  const level6=reconcileClassGrants(base(defender,6));
  assert.equal(level6.resources.find(item=>item.name==='Defensive Stance')?.max,3);
  assert.match(level6.grantedFeatures.find(item=>item.name==='Damage Reduction')?.description||'',/3\/-/);
}

{
  const duelist=exact('classes/duelist-384');
  assert.deepEqual(duelist.conditionalMechanics?.cannyDefense,{requiresNoArmor:true,requiresNoShield:true,requiresMeleeWeapon:true,ability:'intelligence',maximumBonusFormula:'duelist class level'});
  assert.equal(duelist.conditionalMechanics?.preciseStrike?.damageAtLevel10,'2d6');
  assert.equal(duelist.conditionalMechanics?.elaborateParry?.dodgeBonusPerDuelistLevel,1);
  const level10=reconcileClassGrants(base(duelist,10));
  assert.match(level10.grantedFeatures.find(item=>item.name==='Improved Reaction')?.description||'',/\+4/);
}

{
  const commando=exact('classes/dread-commando-527');
  assert.equal(commando.proficiencyReview?.grantsNewProficiencies,false);
  assert.equal(commando.conditionalMechanics?.teamInitiativeBonus?.bonusFormula,'dread commando class level');
  assert.equal(commando.conditionalMechanics?.armoredEase?.reductionAtLevel4,4);
  const level5=reconcileClassGrants(base(commando,5));
  assert.match(level5.grantedFeatures.find(item=>item.name==='Sudden Strike')?.description||'',/3d6/);
}

{
  const killer=exact('classes/ghost-faced-killer-186');
  assert.equal(killer.conditionalMechanics?.frightfulAttack?.targetSaveDC,'10 + ghost-faced killer class level + Charisma modifier');
  assert.equal(killer.conditionalMechanics?.frightfulAttack?.minimumPowerAttackPenalty,1);
  assert.deepEqual(killer.conditionalMechanics?.ghostStep?.modesByLevel,{1:['invisible'],6:['invisible','ethereal']});
  const level10=reconcileClassGrants(base(killer,10));
  assert.equal(level10.actions.find(item=>item.name==='Ghost Step')?.type,'Swift action');
  assert.equal(level10.actions.find(item=>item.name==='Frightful Attack')?.type,'Special attack');
}

{
  const warchief=exact('classes/warchief-581');
  assert.equal(warchief.proficiencyReview?.grantsNewProficiencies,false);
  assert.deepEqual(warchief.conditionalMechanics?.tribalFrenzy?.strengthBonusByLevel,{1:2,3:4,5:6,7:8,9:10});
  assert.equal(warchief.conditionalMechanics?.tribalFrenzy?.affectedAllyDamagePerHitDiePerTurn,1);
  assert.equal(warchief.conditionalMechanics?.devotedBodyguards?.reflexSaveDC,15);
  const level10=reconcileClassGrants(base(warchief,10));
  assert.equal(level10.actions.find(item=>item.name==='Tribal Frenzy')?.type,'Standard action');
  assert.match(level10.grantedFeatures.find(item=>item.name==='Ability Boost')?.description||'',/\+6 Charisma/);
}

console.log('PASS action/resource core batch: 6 exact-source classes with reviewed mechanics, training, lifecycle, and conditional state.');
