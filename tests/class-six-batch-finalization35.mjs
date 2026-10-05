import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-05-six-class';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level,abilities={str:14,dex:16,con:14,int:14,wis:12,cha:12})=>({
  id:'six-class-finalization-test',name:'Six Class Finalization',ruleset:'3.5',mechanics:'3.5',level,
  className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities,
  hp:{current:30,max:30,temp:0},actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}
});
const managedNames=(character,key)=>character[key].filter(entry=>entry.sourceType==='class'&&entry.automatic).map(entry=>entry.name).sort();
const trainingIndexes=character=>(character.trainingGrants||[]).flatMap(grant=>grant.proficiencies||[]).map(item=>item.index).sort();
const prerequisiteTexts=definition=>(definition.prerequisites||[]).map(item=>item.text||String(item)).sort();

const expected={
  'classes/battlesmith-725':{
    name:'Battlesmith',level:5,
    features:['Flesh of My Flesh','Forged in Fire','One with the Hammer','Secrets of the Forge','Tempered in Blood'],
    feats:['Craft Magic Arms and Armor'],training:[],minBab:'5',
    skills:['Appraise','Concentration','Craft','Intimidate','Knowledge (religion)'],
    prerequisites:['Feats:Armor Proficiency (heavy)','Feats:Endurance','Feats:Weapon Focus (warhammer)','Race:Dwarf','Skills:Craft (armorsmithing) 10 ranks or Craft (weaponsmithing) 10 ranks','Special:Must have created a dwarvencraft weapon and used it in battle']
  },
  'classes/duelist-768':{
    name:'Duelist',level:10,
    features:['Acrobatic Attack','Canny Defense','Deflect Arrows','Elaborate Parry','Enhanced Mobility','Grace','Improved Reaction','Precise Strike'],
    feats:[],training:['buckler','martial-weapons','simple-weapons'],minBab:'6',
    skills:['Balance','Bluff','Escape Artist','Innuendo','Jump','Listen','Perform','Sense Motive','Spot','Tumble'],
    prerequisites:['Feats:Ambidexterity','Feats:Dodge','Feats:Mobility','Feats:Weapon Proficiency (rapier)','Skills:Perform 3 ranks','Skills:Tumble 5 ranks']
  },
  'classes/goliath-liberator-732':{
    name:'Goliath Liberator',level:5,
    features:['Avoid Reach','Avoid Thrown Weapons','Equal Footing','Favored Enemy'],
    feats:['Improved Trip'],training:['light-armor','martial-weapons','medium-armor'],minBab:'7',
    skills:['Climb','Craft','Heal','Hide','Jump','Listen','Move Silently','Search','Spot','Survival','Use Rope'],
    prerequisites:['Feats:Track','Race:Goliath','Skills:Hide 5 ranks','Skills:Move Silently 5 ranks','Special:Must have participated in the successful rescue of captives held by giants, or have been imprisoned by giants and escaped']
  },
  'classes/ghost-slayer-525':{
    name:'Ghost Slayer',level:5,
    features:['Detect Ghost','Ghost Bane Fires','Ghost Touch Aura','Protected Vessel','Silver Aura','Untainted Spirit'],
    feats:[],training:[],minBab:'4',
    skills:['Bluff','Climb','Craft','Diplomacy','Disguise','Forgery','Gather Information','Hide','Knowledge (ghost lore)','Listen','Profession','Sense Motive','Spot'],
    prerequisites:['Feats:Alertness','Feats:Incorporeal Target Fighting or Incorporeal Spell Targeting','Skills:Bluff 4 ranks','Skills:Gather Information 4 ranks','Skills:Knowledge (ghost lore) 5 ranks','Skills:Spot 5 ranks','Special:Must have been knocked unconscious by or failed a saving throw against an attack from a ghost; a character who is a ghost cannot take this class']
  },
  'classes/gladiator-771':{
    name:'Gladiator',level:10,
    features:['Exhaust Opponent','Improved Coup de Grace','Improved Feint','Make Them Bleed','Poison Use','Roar of the Crowd','Study Opponent','The Crowd Goes Wild'],
    feats:[],training:[],minBab:'5',
    skills:['Bluff','Climb','Craft','Handle Animal','Intimidate','Jump','Perform','Ride','Tumble'],
    prerequisites:['Feats:At least two feats from the fighter bonus feat list','Skills:Perform 4 ranks or Intimidate 4 ranks']
  },
  'classes/knight-protector-322':{
    name:'Knight Protector',level:10,
    features:['Best Effort','Defensive Stance','Iron Will','No Mercy','Retributive Attack','Shining Beacon','Supreme Cleave'],
    feats:['Iron Will'],training:['tower-shield'],minBab:'5',
    skills:['Diplomacy','Intimidate','Knowledge (nobility and royalty)','Ride','Spot'],
    prerequisites:['Alignment:Lawful neutral or lawful good','Feats:Armor Proficiency (heavy)','Feats:Cleave','Feats:Great Cleave','Feats:Mounted Combat','Feats:Power Attack','Skills:Diplomacy 6 ranks','Skills:Knowledge (nobility and royalty) 4 ranks','Skills:Ride 6 ranks']
  }
};

let featureTotal=0;
for(const [id,spec] of Object.entries(expected)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must be published through the reviewed six-class overlay`);
  assert.equal(definition.referenceOnly,false,`${spec.name} must be a verified reviewed record`);
  assert.equal(String(definition.minBab||definition.stats?.minBab||''),spec.minBab,`${spec.name} BAB prerequisite drift`);
  assert.deepEqual((definition.classSkills||[]).slice().sort(),spec.skills.slice().sort(),`${spec.name} class skills drift`);
  assert.deepEqual(prerequisiteTexts(definition),spec.prerequisites.slice().sort(),`${spec.name} prerequisites drift`);
  assert.equal(definition.proficiencyReview?.verified,true,`${spec.name} training evidence must be explicitly reviewed`);

  const character=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(managedNames(character,'grantedFeatures'),spec.features.slice().sort(),`${spec.name} feature set drift`);
  assert.deepEqual(managedNames(character,'feats'),spec.feats.slice().sort(),`${spec.name} fixed feat grants drift`);
  assert.deepEqual(trainingIndexes(character),spec.training.slice().sort(),`${spec.name} training profile drift`);
  assert.deepEqual(reconcileClassGrants(character),character,`${spec.name} reconciliation must be idempotent`);
  featureTotal+=spec.features.length;
}
assert.equal(featureTotal,38,'the reviewed six-class batch must contain exactly 38 coalesced features');

// Gladiator has no Weapon and Armor Proficiency class feature in Sword & Fist p. 21.
// Do not infer fighter/barbarian training from descriptive text about common entrants.
{
  const definition=exact('classes/gladiator-771');
  assert.deepEqual(definition.proficiencies,[]);
  assert.equal(definition.proficiencyReview.noNewProficiencies,true);
  assert.match(definition.proficiencyReview.note,/no Weapon and Armor Proficiency/i);
}

// Ghost Bane Fires is class level + Charisma modifier per day, with no source minimum.
// Detect Ghost and Ghost Touch Aura are at-will and therefore must not create resource pools.
{
  const definition=exact('classes/ghost-slayer-525');
  const normal=reconcileClassGrants(base(definition,5,{str:10,dex:10,con:10,int:10,wis:10,cha:12}));
  const bane=normal.resources.find(resource=>resource.name==='Ghost Bane Fires');
  assert.equal(bane?.max,6);
  assert.equal(bane?.reset,'long');
  assert.equal(normal.actions.find(action=>action.name==='Ghost Bane Fires')?.type,'Free action');
  assert(!normal.resources.some(resource=>resource.name==='Detect Ghost'));
  assert(!normal.resources.some(resource=>resource.name==='Ghost Touch Aura'));

  const zero=reconcileClassGrants(base(definition,5,{str:10,dex:10,con:10,int:10,wis:10,cha:1}));
  assert(!zero.resources.some(resource=>resource.name==='Ghost Bane Fires'),'Ghost Bane Fires must not invent a minimum use when the source formula yields zero');
  assert.equal(zero.actions.find(action=>action.name==='Ghost Bane Fires')?.type,'Free action');
}

// Retributive Attack is Charisma bonus/day, minimum one, and never more than once per round.
{
  const definition=exact('classes/knight-protector-322');
  const low=reconcileClassGrants(base(definition,10,{str:10,dex:10,con:10,int:10,wis:10,cha:8}));
  const lowPool=low.resources.find(resource=>resource.name==='Retributive Attack');
  assert.equal(lowPool?.max,1);
  assert.match(lowPool?.recoveryText||'',/one retributive attack per round/i);
  const high=reconcileClassGrants(base(definition,10,{str:10,dex:10,con:10,int:10,wis:10,cha:18}));
  assert.equal(high.resources.find(resource=>resource.name==='Retributive Attack')?.max,4);
}

// Source-dependent conditions that cannot be inferred from static character data stay machine-readable
// instead of being silently approximated.
{
  const battlesmith=exact('classes/battlesmith-725');
  assert.deepEqual(battlesmith.conditionalMechanics?.secretsOfTheForge,{
    kind:'effective-caster-level',classLevelMultiplier:3,stacksWithOtherCasterLevels:true,
    scope:'magic arms and armor',otherPrerequisitesStillRequired:true
  });
  assert.equal(battlesmith.conditionalMechanics?.oneWithTheHammer?.requiresSelfCraftedWarhammer,true);
  assert.equal(battlesmith.conditionalMechanics?.fleshOfMyFlesh?.requiresSelfCraftedHeavyArmor,true);

  const knight=exact('classes/knight-protector-322');
  assert.equal(knight.classStateRules?.codeOfConduct?.blocksAdvancement,true);
  assert.deepEqual(knight.classStateRules?.codeOfConduct?.suppressesFeatures.slice().sort(),['Retributive Attack','Shining Beacon']);
}

console.log('six-class finalization regression passed');
