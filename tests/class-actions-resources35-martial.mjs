import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,classAutomationReport} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-05-actions-resources-martial';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'martial-wave-test',name:'Martial Wave Test',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:16,dex:16,con:16,int:14,wis:12,cha:12},hp:{current:50,max:50,temp:0},actions:[{id:'manual-action',name:'Manual action'}],feats:[{id:'manual-feat',name:'Manual feat'}],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const trainingIndexes=character=>(character.trainingGrants||[]).flatMap(grant=>grant.proficiencies||[]).map(item=>item.index).sort();
const prerequisiteTexts=definition=>(definition.prerequisites||[]).map(item=>item.text||String(item)).sort();
const sourceFeatNames=(character,classId)=>(character.feats||[]).filter(item=>item.sourceClassId===classId).map(item=>item.name).sort();

const expected={
  'classes/dervish-309':{
    name:'Dervish',sourceBook:'Complete Warrior',level:10,minBab:'5',
    features:['AC Bonus','Dervish Dance','Movement Mastery','Slashing Blades','Fast Movement','Spring Attack','Dance of Death','Improved Reaction','Elaborate Parry','Tireless Dance','A Thousand Cuts'],
    skills:['Balance','Craft','Escape Artist','Jump','Listen','Perform','Profession','Swim','Tumble'],
    prerequisites:['Skills:Perform (dance) 3 ranks','Skills:Tumble 3 ranks','Feats:Combat Expertise','Feats:Dodge','Feats:Mobility','Feats:Weapon Focus (any slashing melee weapon)'],
    training:[],resources:[['Dervish Dance',5],['A Thousand Cuts',1]],actions:['Dervish Dance','A Thousand Cuts'],feats:['Spring Attack']
  },
  'classes/frenzied-berserker-313':{
    name:'Frenzied Berserker',sourceBook:'Complete Warrior',level:10,minBab:'6',
    features:['Frenzy','Diehard','Supreme Cleave','Deathless Frenzy','Improved Power Attack','Inspire Frenzy','Greater Frenzy','Supreme Power Attack','Tireless Frenzy'],
    skills:['Climb','Intimidate','Jump','Ride','Swim'],
    prerequisites:['Alignment:Any nonlawful','Feats:Cleave','Feats:Destructive Rage','Feats:Intimidating Rage','Feats:Power Attack'],
    training:[],resources:[['Frenzy',5],['Inspire Frenzy',3]],actions:['Frenzy','Inspire Frenzy'],feats:['Diehard']
  },
  'classes/great-rift-deep-defender-792':{
    name:'Great Rift Deep Defender',sourceBook:'Shining South',level:5,minBab:'7',
    features:['AC Bonus','Hold the Line','Uncanny Dodge','Uncanny Stability','Improved Uncanny Dodge','Subterranean Bulwark'],
    skills:['Craft','Listen','Sense Motive','Spot'],
    prerequisites:['Alignment:Any lawful','Feats:Dodge','Feats:Endurance','Feats:Toughness','Race:Gold dwarf','Region:The Great Rift'],
    training:['heavy-armor','light-armor','martial-weapons','medium-armor','shields','simple-weapons'],resources:[],actions:[],feats:['Hold the Line']
  },
  'classes/dragonstalker-403':{
    name:'Dragonstalker',sourceBook:'Draconomicon',level:10,minBab:'5',
    features:['Hunting Bonus','Sneak Attack (Dragon)','Ignore Natural Armor','Hide Scent','Foil Blindsense','Dragonstrike'],
    skills:['Bluff','Climb','Craft','Diplomacy','Disguise','Gather Information','Hide','Jump','Knowledge (arcana)','Knowledge (local)','Listen','Move Silently','Search','Spot','Survival'],
    prerequisites:['Skills:Gather Information 4 ranks','Skills:Hide 6 ranks','Skills:Knowledge (arcana) 4 ranks','Skills:Move Silently 6 ranks','Skills:Search 6 ranks','Feats:Blind-Fight','Feats:Track','Language:Draconic'],
    training:['light-armor','longbow','longspear','net','shields','shortbow','simple-weapons'],resources:[['Ignore Natural Armor',2],['Foil Blindsense',1]],actions:['Ignore Natural Armor','Foil Blindsense'],feats:[]
  }
};

for(const [id,spec] of Object.entries(expected)){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.name,spec.name);
  assert.equal(definition.sourceId,id,`${spec.name} source ID drift`);
  assert.equal(definition.sourceBook,spec.sourceBook,`${spec.name} source book drift`);
  assert.equal(definition.sourceVersion,'D&D 3.5',`${spec.name} source version drift`);
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must use the reviewed martial overlay`);
  assert.equal(definition.referenceOnly,false,`${spec.name} must be source-verified`);
  assert.equal(String(definition.minBab||definition.stats?.minBab||''),spec.minBab,`${spec.name} BAB prerequisite drift`);
  assert.deepEqual((definition.classSkills||[]).slice().sort(),spec.skills.slice().sort(),`${spec.name} class skills drift`);
  assert.deepEqual(prerequisiteTexts(definition),spec.prerequisites.slice().sort(),`${spec.name} prerequisite drift`);
  assert.equal(definition.proficiencyReview?.verified,true,`${spec.name} proficiency evidence must be reviewed`);

  const character=reconcileClassGrants(base(definition,spec.level));
  assert.deepEqual(character.grantedFeatures.filter(item=>item.sourceClassId===definition.catalogId).map(item=>item.name).sort(),spec.features.slice().sort(),`${spec.name} feature set drift`);
  assert.deepEqual(trainingIndexes(character),spec.training.slice().sort(),`${spec.name} training drift`);
  assert.deepEqual(sourceFeatNames(character,definition.catalogId),spec.feats.slice().sort(),`${spec.name} fixed feat grants drift`);
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
  assert(!removed.feats.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source feats survive removal`);
  assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),`${spec.name} removal must preserve manual data`);
}

{
  const dervish=exact('classes/dervish-309');
  assert.equal(dervish.conditionalMechanics?.dervishDance?.oncePerEncounter,true);
  assert.equal(dervish.conditionalMechanics?.dervishDance?.durationFormula,'1 round per 2 ranks of Perform (dance)');
  assert.equal(dervish.conditionalMechanics?.dervishDance?.requiresSlashingWeapon,true);
  const level10=reconcileClassGrants(base(dervish,10));
  assert.match(level10.grantedFeatures.find(item=>item.name==='Fast Movement')?.description||'',/\+15 feet/);
}

{
  const berserker=exact('classes/frenzied-berserker-313');
  assert.equal(berserker.conditionalMechanics?.frenzy?.greaterStrengthBonusAtLevel8,10);
  assert.equal(berserker.conditionalMechanics?.frenzy?.armorClassPenalty,-4);
  assert.equal(berserker.conditionalMechanics?.frenzy?.nonlethalDamagePerRound,2);
  assert.equal(berserker.conditionalMechanics?.frenzy?.earlyEndWillSaveDC,20);
  const level10=reconcileClassGrants(base(berserker,10));
  assert.equal(level10.actions.find(item=>item.name==='Frenzy')?.type,'Free action');
  assert.match(level10.grantedFeatures.find(item=>item.name==='Supreme Power Attack')?.description||'',/\+4 damage/);
}

{
  const defender=exact('classes/great-rift-deep-defender-792');
  assert.equal(defender.conditionalMechanics?.subterraneanBulwark?.damageReduction,'3/-');
  assert.equal(defender.conditionalMechanics?.subterraneanBulwark?.requiresNarrowOrLowSpace,true);
  assert.equal(defender.conditionalMechanics?.uncannyStability?.narrowOrLowSpaceBonus,4);
}

{
  const stalker=exact('classes/dragonstalker-403');
  assert.equal(stalker.conditionalMechanics?.huntingBonus?.bonusFormula,'dragonstalker class level');
  assert.equal(stalker.conditionalMechanics?.hideScent?.disguisePenalty,-10);
  assert.equal(stalker.conditionalMechanics?.foilBlindsense?.durationMinutes,10);
  const level10=reconcileClassGrants(base(stalker,10));
  assert.equal(level10.actions.find(item=>item.name==='Foil Blindsense')?.type,'Standard action');
  assert.match(level10.grantedFeatures.find(item=>item.name==='Sneak Attack (Dragon)')?.description||'',/10d6/);
}

console.log('PASS martial action/resource wave: 4 exact-source classes with fixed feats, resources, conditional mechanics, and lifecycle coverage.');
