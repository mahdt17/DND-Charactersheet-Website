import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import wave2 from '../src/data/class-reviewed-overrides-35-wave2.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression,classAutomationReport} from '../src/lib/classIntegration.js';

const REVIEW_BATCH='2026-10-05-actions-resources-wave2';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats];
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),reference);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const base=(definition,level)=>({id:'actions-resources-wave2-test',name:'Actions Resources Wave 2 Test',ruleset:'3.5',mechanics:'3.5',level,className:definition.name,classDefinition:definition,classLevels:[row(definition,level)],abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:60,max:60,temp:0},actions:[{id:'manual-action',name:'Manual action'}],feats:[{id:'manual-feat',name:'Manual feat'}],resources:[],spells:[],trainingGrants:[],featureChoices:{}});
const sourceFeatNames=(character,classId)=>(character.feats||[]).filter(item=>item.sourceClassId===classId).map(item=>item.name);

const candidates=[
  'classes/arcane-devotee-657','classes/argent-savant-224','classes/cavestalker-426','classes/cipher-adept-688','classes/cloud-anchorite-499','classes/corrupt-avenger-530','classes/crimson-scourge-262','classes/cultist-of-the-shattered-peak-540','classes/deaths-chosen-545','classes/defiant-689','classes/disciple-of-thrym-501','classes/divine-champion-661','classes/dragon-devotee-714','classes/dragon-lord-373','classes/dread-fang-of-lolth-428','classes/drunken-master-310','classes/dungeon-delver-183','classes/dungeon-lord-918','classes/ebonmar-infiltrator-261','classes/eldeen-ranger-435','classes/elemental-master-404','classes/elemental-warrior-691','classes/emissary-of-barachiel-143','classes/enlightened-fist-210','classes/escalation-mage-467','classes/evangelist-240','classes/exemplar-184','classes/exorcist-of-the-silver-flame-436','classes/exotic-weapon-master-311','classes/extreme-explorer-437','classes/eye-of-gruumsh-312','classes/eye-of-lolth-429','classes/fatemaker-692','classes/fatespinner-211','classes/fiend-blooded-533','classes/fist-of-raziel-145','classes/fochlucan-lyrist-185','classes/forest-reeve-227','classes/fortunes-friend-293','classes/frost-mage-502','classes/frostrager-503','classes/geometer-212','classes/glorious-servitor-541','classes/gnome-giant-slayer-314','classes/gray-guard-294','classes/great-sea-corsair-793','classes/justice-of-weald-and-woe-284','classes/knight-of-the-chalice-321','classes/master-inquisitive-439','classes/nightcloak-971','classes/stormtalon-746','classes/sword-of-righteousness-155','classes/tactical-soldier-579','classes/thayan-gladiator-287','classes/thayan-knight-337','classes/thief-of-life-469','classes/trapsmith-433','classes/urban-soul-711','classes/zhentarim-spy-684','classes/black-blood-cultist-283','classes/black-blood-hunter-658','classes/blade-bravo-726','classes/cyre-scout-414'
];

const deferred=new Map([
  ['classes/cavestalker-426','Persistent exotic-combat-style choice is coupled to ranger combat style and conditional weapon proficiency.'],
  ['classes/corrupt-avenger-530','Depends on the taint/corruption subsystem and taint-driven spellcasting state.'],
  ['classes/cultist-of-the-shattered-peak-540','Uses a dedicated source-specific arcane spell table and restricted spell list that need prestige-casting support before completion.'],
  ['classes/deaths-chosen-545','Class benefits depend on a persistent designated sentient-undead master bond that must reconcile cleanly.'],
  ['classes/defiant-689','Supports ex-cleric level exchange/replacement and threshold benefits that require substitution-state support.'],
  ['classes/disciple-of-thrym-501','Uses a dedicated source-specific divine spell table and class spell list that need prestige-casting support before completion.'],
  ['classes/dragon-devotee-714','Persistent combat-technique choices and draconic-template transformation belong to later choice/transformation work.'],
  ['classes/dragon-lord-373','Draconic aura selection is a persistent repeated choice with option-specific projected effects.'],
  ['classes/drunken-master-310','Alcohol consumable state drives ability-score choices and class actions, including expenditure by Breath of Flame.'],
  ['classes/dungeon-delver-183','Skill Mastery requires persistent multi-skill selection and reconciliation.'],
  ['classes/dungeon-lord-918','Class mechanics depend on a persistent designated dungeon and whether the character is currently inside it.'],
  ['classes/ebonmar-infiltrator-261','Uses a dedicated source-specific arcane spell table and spell list that need prestige-casting support before completion.'],
  ['classes/eldeen-ranger-435','Persistent sect choice branches into option-specific features and favored-enemy interaction.'],
  ['classes/elemental-master-404','Elemental attunement and breath-weapon expenditure/recharge require shared-state mechanics.'],
  ['classes/elemental-warrior-691','Persistent elemental-affinity choice branches into option-specific resistance, movement, manifestation, and strike mechanics.'],
  ['classes/emissary-of-barachiel-143','Uses a dedicated Charisma-based divine spells-known table and class spell list that need prestige-casting support.'],
  ['classes/enlightened-fist-210','Several abilities consume the shared Stunning Fist daily-attempt pool, which must reconcile across classes.'],
  ['classes/evangelist-240','Great Orator depends on bardic-performance state and Skill Mastery adds persistent selected-skill state.'],
  ['classes/exemplar-184','Repeated Skill Artistry and Skill Mastery selections plus the outsider transformation require persistent choice/transformation support.'],
  ['classes/exorcist-of-the-silver-flame-436','Multiple features depend on one persistent chosen weapon of the exorcist and its evolving properties.'],
  ['classes/exotic-weapon-master-311','Each class level grants one permanent unique exotic-weapon stunt with option-specific mechanics.'],
  ['classes/extreme-explorer-437','Core abilities spend and modify the Eberron action-point subsystem and include repeated bonus-feat choices.'],
  ['classes/eye-of-gruumsh-312','Rage uses and progression stack directly with barbarian Rage and require a shared rage resource/state.'],
  ['classes/fatemaker-692','Uses a dedicated spontaneous spell table with source-specific spells known and spell replacement.'],
  ['classes/fiend-blooded-533','Fiendish Companion and repeated Fiendish Sorcery spell acquisition require companion and spell-acquisition integration.'],
  ['classes/fochlucan-lyrist-185','Advances both arcane and divine casting while also advancing shared bardic-music uses and ability strength.'],
  ['classes/fortunes-friend-293','Extra Fortune and class actions depend on the shared luck-reroll pool plus repeated luck-feat choices.'],
  ['classes/frost-mage-502','Gain Knowledge adds source-specific spells and 10th level applies the cold subtype transformation.'],
  ['classes/frostrager-503','Most class features turn on only while raging and therefore require shared Rage state/resource integration.'],
  ['classes/geometer-212','Spellglyphs require persistent crafted-item state while Glyph features modify a spellbook.'],
  ['classes/glorious-servitor-541','Bestial Form depends on patron-deity-specific transformation and the class later changes creature type.'],
  ['classes/gray-guard-294','Debilitating and Devastating Touch consume shared Lay on Hands while smites share smite resources and conduct state.'],
  ['classes/great-sea-corsair-793','This is an adapted parent-class record with a persistent changeable patron designation and inherited mechanics.'],
  ['classes/justice-of-weald-and-woe-284','Uses a dedicated Wisdom-based spell table and class spell list that need prestige-casting support before completion.'],
  ['classes/knight-of-the-chalice-321','Uses a dedicated prepared divine spell table and class spell list that need prestige-casting support before completion.'],
  ['classes/master-inquisitive-439','Persistent NPC contacts, action-point spending, and repeated bonus-feat choices require additional state support.'],
  ['classes/tactical-soldier-579','Sidestep grants a different feat when already owned, requiring conditional feat-selection state rather than a fixed grant.'],
  ['classes/thayan-gladiator-287','Class progression depends on one persistent chosen natural weapon and later permanent magic-ability choices.'],
  ['classes/thief-of-life-469','Borrowed vitality and immortality persist beyond encounters and can interact with Incarnum essentia.'],
  ['classes/trapsmith-433','Booby-trap construction/state and its dedicated arcane casting table need separate trap/casting subsystem support.'],
  ['classes/urban-soul-711','Chosen-city/substitution state and Urban Skill Mastery require persistent location and skill-choice support.'],
  ['classes/zhentarim-spy-684','Cover identities, unlikely covers, and deep-cover identities are persistent character state with replacement rules.'],
  ['classes/black-blood-cultist-283','Feral Rage progression and most natural-attack benefits depend on shared Rage state.'],
  ['classes/black-blood-hunter-658','Lycanthrope forms, curse DC, form-change timing, and form-specific item behavior require transformation state.'],
  ['classes/cyre-scout-414','Dragonmark Conduit and Blindsense Mark spend shared dragonmark uses and the class also has a dedicated infusion subsystem.']
]);

assert.equal(candidates.length,63,'wave 2 must keep the 63-record attempted candidate batch visible');
assert.equal(new Set(candidates).size,63,'wave 2 candidate IDs must be unique');
assert.equal(deferred.size,45,'source review must preserve every proven subsystem blocker');
const clean=candidates.filter(id=>!deferred.has(id));
assert.equal(clean.length,18,'wave 2 must retain exactly the source-reviewed classes compatible with current mechanics');
assert.deepEqual(Object.keys(wave2.entries).sort(),clean.slice().sort(),'review manifest must contain exactly the clean wave targets');

for(const id of candidates){
  const definition=exact(id);
  assert(definition,`missing exact source record ${id}`);
  assert.equal(definition.sourceId,id,`${id} source ID drift`);
  if(deferred.has(id)){
    assert(deferred.get(id).length>=30,`${definition.name} blocker needs an explicit durable reason`);
    assert.notEqual(definition.reviewBatch,REVIEW_BATCH,`${definition.name} is deferred and must not be silently counted complete`);
    continue;
  }

  const spec=wave2.entries[id];
  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${definition.name} must be published through the wave 2 reviewed overlay`);
  assert.equal(definition.referenceOnly,false,`${definition.name} must be source-verified`);
  assert.equal(definition.sourceBook,spec.sourceBook,`${definition.name} source book drift`);
  assert.equal(definition.sourceVersion,'D&D 3.5',`${definition.name} source version drift`);
  assert.equal(definition.proficiencyReview?.verified,true,`${definition.name} proficiency evidence must be reviewed`);
  assert.equal(definition.prerequisiteReview?.verified,true,`${definition.name} prerequisite evidence must be reviewed`);
  assert.equal(definition.classSkillReview?.verified,true,`${definition.name} class-skill evidence must be reviewed`);
  assert(Array.isArray(definition.classSkills),`${definition.name} must publish reviewed class skills`);
  assert(Array.isArray(definition.prerequisites),`${definition.name} must publish reviewed prerequisites`);
  assert(Array.isArray(definition.levelGrants)&&definition.levelGrants.length,`${definition.name} must publish reviewed level grants`);
  assert(definition.levelGrants.every(grant=>Number(grant.level)>0&&grant.name&&String(grant.description||'').trim().length>=12),`${definition.name} level grants need reviewed names, levels, and descriptions`);

  const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
  const character=reconcileClassGrants(base(definition,level));
  const expectedFeatures=[...new Set(definition.levelGrants.filter(grant=>Number(grant.level)<=level).map(grant=>grant.name))].sort();
  const actualFeatures=character.grantedFeatures.filter(item=>item.sourceClassId===definition.catalogId).map(item=>item.name).sort();
  assert.deepEqual(actualFeatures,expectedFeatures,`${definition.name} feature reconciliation drift`);

  for(const grant of definition.levelGrants.filter(grant=>Number(grant.level)<=level)){
    if(grant.actionType)assert(character.actions.some(item=>item.sourceClassId===definition.catalogId&&item.name===grant.name&&item.type===grant.actionType),`${definition.name} missing ${grant.actionType} action ${grant.name}`);
    if(grant.resource)assert(character.resources.some(item=>item.sourceClassId===definition.catalogId&&item.name===grant.name),`${definition.name} missing resource ${grant.name}`);
    if(grant.featName)assert(sourceFeatNames(character,definition.catalogId).includes(grant.featName),`${definition.name} missing fixed feat ${grant.featName}`);
  }

  assert.equal(classAutomationReport(character).classes[0].descriptionComplete,true,`${definition.name} must use reviewed feature text`);
  assert.deepEqual(reconcileClassGrants(character),character,`${definition.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...character,classLevels:[row(definition,level),survivor],level:level+1},definition.catalogId);
  assert(!removed.grantedFeatures.some(item=>item.sourceClassId===definition.catalogId),`${definition.name} source features survive removal`);
  assert(!removed.actions.some(item=>item.sourceClassId===definition.catalogId),`${definition.name} source actions survive removal`);
  assert(!removed.resources.some(item=>item.sourceClassId===definition.catalogId),`${definition.name} source resources survive removal`);
  assert(!removed.trainingGrants.some(item=>item.sourceClassId===definition.catalogId),`${definition.name} source training survives removal`);
  assert(!removed.feats.some(item=>item.sourceClassId===definition.catalogId),`${definition.name} source feats survive removal`);
  assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),`${definition.name} removal must preserve manual data`);
}

console.log(`PASS action/resource wave 2: ${candidates.length} attempted, ${clean.length} clean targets, ${deferred.size} explicit subsystem blockers.`);
