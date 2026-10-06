import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
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
  {id:'classes/arcane-devotee-657',name:'Arcane Devotee',sourceBook:"Player's Guide to Faerûn"},
  {id:'classes/argent-savant-224',name:'Argent Savant',sourceBook:'Complete Arcane'},
  {id:'classes/cavestalker-426',name:'Cavestalker',sourceBook:'Drow of the Underdark'},
  {id:'classes/cipher-adept-688',name:'Cipher Adept',sourceBook:'Planar Handbook'},
  {id:'classes/cloud-anchorite-499',name:'Cloud Anchorite',sourceBook:'Frostburn'},
  {id:'classes/corrupt-avenger-530',name:'Corrupt Avenger',sourceBook:'Heroes of Horror'},
  {id:'classes/crimson-scourge-262',name:'Crimson Scourge',sourceBook:'CityScape'},
  {id:'classes/cultist-of-the-shattered-peak-540',name:'Cultist of the Shattered Peak',sourceBook:'Lost Empires of Faerûn'},
  {id:'classes/deaths-chosen-545',name:"Death's Chosen",sourceBook:'Libris Mortis: The Book of Undead'},
  {id:'classes/defiant-689',name:'Defiant',sourceBook:'Planar Handbook'},
  {id:'classes/disciple-of-thrym-501',name:'Disciple of Thrym',sourceBook:'Frostburn'},
  {id:'classes/divine-champion-661',name:'Divine Champion',sourceBook:"Player's Guide to Faerûn"},
  {id:'classes/dragon-devotee-714',name:'Dragon Devotee',sourceBook:'Races of the Dragon'},
  {id:'classes/dragon-lord-373',name:'Dragon Lord',sourceBook:'Dragon Magic'},
  {id:'classes/dread-fang-of-lolth-428',name:'Dread Fang of Lolth',sourceBook:'Drow of the Underdark'},
  {id:'classes/drunken-master-310',name:'Drunken Master',sourceBook:'Complete Warrior'},
  {id:'classes/dungeon-delver-183',name:'Dungeon Delver',sourceBook:'Complete Adventurer'},
  {id:'classes/dungeon-lord-918',name:'Dungeon Lord',sourceBook:'Dungeonscape'},
  {id:'classes/ebonmar-infiltrator-261',name:'Ebonmar Infiltrator',sourceBook:'CityScape'},
  {id:'classes/eldeen-ranger-435',name:'Eldeen Ranger',sourceBook:'Eberron Campaign Setting'},
  {id:'classes/elemental-master-404',name:'Elemental Master',sourceBook:'Draconomicon'},
  {id:'classes/elemental-warrior-691',name:'Elemental Warrior',sourceBook:'Planar Handbook'},
  {id:'classes/emissary-of-barachiel-143',name:'Emissary of Barachiel',sourceBook:'Book of Exalted Deeds'},
  {id:'classes/enlightened-fist-210',name:'Enlightened Fist',sourceBook:'Complete Arcane'},
  {id:'classes/escalation-mage-467',name:'Escalation Mage',sourceBook:'Faiths of Eberron'},
  {id:'classes/evangelist-240',name:'Evangelist',sourceBook:'Complete Divine'},
  {id:'classes/exemplar-184',name:'Exemplar',sourceBook:'Complete Adventurer'},
  {id:'classes/exorcist-of-the-silver-flame-436',name:'Exorcist of the Silver Flame',sourceBook:'Eberron Campaign Setting'},
  {id:'classes/exotic-weapon-master-311',name:'Exotic Weapon Master',sourceBook:'Complete Warrior'},
  {id:'classes/extreme-explorer-437',name:'Extreme Explorer',sourceBook:'Eberron Campaign Setting'},
  {id:'classes/eye-of-gruumsh-312',name:'Eye of Gruumsh',sourceBook:'Complete Warrior'},
  {id:'classes/eye-of-lolth-429',name:'Eye of Lolth',sourceBook:'Drow of the Underdark'},
  {id:'classes/fatemaker-692',name:'Fatemaker',sourceBook:'Planar Handbook'},
  {id:'classes/fatespinner-211',name:'Fatespinner',sourceBook:'Complete Arcane'},
  {id:'classes/fiend-blooded-533',name:'Fiend-blooded',sourceBook:'Heroes of Horror'},
  {id:'classes/fist-of-raziel-145',name:'Fist of Raziel',sourceBook:'Book of Exalted Deeds'},
  {id:'classes/fochlucan-lyrist-185',name:'Fochlucan Lyrist',sourceBook:'Complete Adventurer'},
  {id:'classes/forest-reeve-227',name:'Forest Reeve',sourceBook:'Complete Champion'},
  {id:'classes/fortunes-friend-293',name:"Fortune's Friend",sourceBook:'Complete Scoundrel'},
  {id:'classes/frost-mage-502',name:'Frost Mage',sourceBook:'Frostburn'},
  {id:'classes/frostrager-503',name:'Frostrager',sourceBook:'Frostburn'},
  {id:'classes/geometer-212',name:'Geometer',sourceBook:'Complete Arcane'},
  {id:'classes/glorious-servitor-541',name:'Glorious Servitor',sourceBook:'Lost Empires of Faerûn'},
  {id:'classes/gnome-giant-slayer-314',name:'Gnome Giant-slayer',sourceBook:'Complete Warrior'},
  {id:'classes/gray-guard-294',name:'Gray Guard',sourceBook:'Complete Scoundrel'},
  {id:'classes/great-sea-corsair-793',name:'Great Sea Corsair',sourceBook:'Shining South'},
  {id:'classes/justice-of-weald-and-woe-284',name:'Justice of Weald and Woe',sourceBook:'Champions of Ruin'},
  {id:'classes/knight-of-the-chalice-321',name:'Knight of the Chalice',sourceBook:'Complete Warrior'},
  {id:'classes/master-inquisitive-439',name:'Master Inquisitive',sourceBook:'Eberron Campaign Setting'},
  {id:'classes/nightcloak-971',name:'Nightcloak',sourceBook:'Complete Divine'},
  {id:'classes/stormtalon-746',name:'Stormtalon',sourceBook:'Races of the Wild'},
  {id:'classes/sword-of-righteousness-155',name:'Sword of Righteousness',sourceBook:'Book of Exalted Deeds'},
  {id:'classes/tactical-soldier-579',name:'Tactical Soldier',sourceBook:'Miniatures Handbook'},
  {id:'classes/thayan-gladiator-287',name:'Thayan Gladiator',sourceBook:'Champions of Ruin'},
  {id:'classes/thayan-knight-337',name:'Thayan Knight',sourceBook:'Complete Warrior'},
  {id:'classes/thief-of-life-469',name:'Thief of Life',sourceBook:'Faiths of Eberron'},
  {id:'classes/trapsmith-433',name:'Trapsmith',sourceBook:'Dungeonscape'},
  {id:'classes/urban-soul-711',name:'Urban Soul',sourceBook:'Races of Destiny'},
  {id:'classes/zhentarim-spy-684',name:'Zhentarim Spy',sourceBook:"Player's Guide to Faerûn"},
  {id:'classes/black-blood-cultist-283',name:'Black Blood Cultist',sourceBook:'Champions of Ruin'},
  {id:'classes/black-blood-hunter-658',name:'Black Blood Hunter',sourceBook:"Player's Guide to Faerûn"},
  {id:'classes/blade-bravo-726',name:'Blade Bravo',sourceBook:'Races of Stone'},
  {id:'classes/cyre-scout-414',name:'Cyre Scout',sourceBook:'Dragonmarked'}
];

const deferred=new Map([
  ['classes/cavestalker-426','Persistent exotic-combat-style choice is coupled to ranger combat style and conditional weapon proficiency.'],
  ['classes/corrupt-avenger-530','Depends on the taint/corruption subsystem and taint-driven spellcasting state.'],
  ['classes/defiant-689','Supports ex-cleric level exchange/replacement and threshold benefits that require substitution-state support.'],
  ['classes/dragon-devotee-714','Persistent combat-technique choices and draconic-template transformation belong to later choice/transformation work.'],
  ['classes/dragon-lord-373','Draconic aura selection is a persistent repeated choice with option-specific projected effects.'],
  ['classes/dungeon-delver-183','Skill Mastery requires persistent multi-skill selection and reconciliation.'],
  ['classes/eldeen-ranger-435','Persistent sect choice branches into option-specific features and favored-enemy interaction.'],
  ['classes/elemental-master-404','Elemental attunement and breath-weapon expenditure/recharge require shared-state mechanics.'],
  ['classes/elemental-warrior-691','Persistent elemental-affinity choice branches into option-specific resistance, movement, manifestation, and strike mechanics.']
]);

assert.equal(candidates.length,63,'wave 2 must keep the 63-record attempted candidate batch visible');
assert.equal(new Set(candidates.map(item=>item.id)).size,63,'wave 2 candidate IDs must be unique');
assert.equal(deferred.size,9,'initial source review should peel exactly the nine already-proven subsystem blockers');
const clean=candidates.filter(item=>!deferred.has(item.id));
assert.equal(clean.length,54,'the initial clean implementation target must remain above fifty classes');

for(const spec of candidates){
  const definition=exact(spec.id);
  assert(definition,`missing exact source record ${spec.id}`);
  assert.equal(definition.name,spec.name,`${spec.id} name drift`);
  assert.equal(definition.sourceId,spec.id,`${spec.name} source ID drift`);
  if(deferred.has(spec.id)){
    assert(deferred.get(spec.id).length>=30,`${spec.name} blocker needs an explicit durable reason`);
    assert.notEqual(definition.reviewBatch,REVIEW_BATCH,`${spec.name} is deferred from this wave and must not be silently counted complete`);
    continue;
  }

  assert.equal(definition.reviewBatch,REVIEW_BATCH,`${spec.name} must be published through the wave 2 reviewed overlay`);
  assert.equal(definition.referenceOnly,false,`${spec.name} must be source-verified`);
  assert.equal(definition.sourceBook,spec.sourceBook,`${spec.name} source book drift`);
  assert.equal(definition.sourceVersion,'D&D 3.5',`${spec.name} source version drift`);
  assert.equal(definition.proficiencyReview?.verified,true,`${spec.name} proficiency evidence must be reviewed`);
  assert.equal(definition.prerequisiteReview?.verified,true,`${spec.name} prerequisite evidence must be reviewed`);
  assert.equal(definition.classSkillReview?.verified,true,`${spec.name} class-skill evidence must be reviewed`);
  assert(Array.isArray(definition.classSkills),`${spec.name} must publish reviewed class skills`);
  assert(Array.isArray(definition.prerequisites),`${spec.name} must publish reviewed prerequisites`);
  assert(Array.isArray(definition.levelGrants)&&definition.levelGrants.length,`${spec.name} must publish reviewed level grants`);
  assert(definition.levelGrants.every(grant=>Number(grant.level)>0&&grant.name&&String(grant.description||'').trim().length>=12),`${spec.name} level grants need reviewed names, levels, and descriptions`);

  const level=Math.max(...definition.levelGrants.map(grant=>Number(grant.level)||0));
  const character=reconcileClassGrants(base(definition,level));
  const expectedFeatures=[...new Set(definition.levelGrants.filter(grant=>Number(grant.level)<=level).map(grant=>grant.name))].sort();
  const actualFeatures=character.grantedFeatures.filter(item=>item.sourceClassId===definition.catalogId).map(item=>item.name).sort();
  assert.deepEqual(actualFeatures,expectedFeatures,`${spec.name} feature reconciliation drift`);

  for(const grant of definition.levelGrants.filter(grant=>Number(grant.level)<=level)){
    if(grant.actionType)assert(character.actions.some(item=>item.sourceClassId===definition.catalogId&&item.name===grant.name&&item.type===grant.actionType),`${spec.name} missing ${grant.actionType} action ${grant.name}`);
    if(grant.resource)assert(character.resources.some(item=>item.sourceClassId===definition.catalogId&&item.name===grant.name),`${spec.name} missing resource ${grant.name}`);
    if(grant.featName)assert(sourceFeatNames(character,definition.catalogId).includes(grant.featName),`${spec.name} missing fixed feat ${grant.featName}`);
  }

  assert.equal(classAutomationReport(character).classes[0].descriptionComplete,true,`${spec.name} must use reviewed feature text`);
  assert.deepEqual(reconcileClassGrants(character),character,`${spec.name} reconciliation must be idempotent`);
  const survivor={catalogId:'test:survivor',name:'Surviving Class',edition:'3.5',level:1,definition:{name:'Surviving Class',edition:'3.5'}};
  const removed=removeClassProgression({...character,classLevels:[row(definition,level),survivor],level:level+1},definition.catalogId);
  assert(!removed.grantedFeatures.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source features survive removal`);
  assert(!removed.actions.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source actions survive removal`);
  assert(!removed.resources.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source resources survive removal`);
  assert(!removed.trainingGrants.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source training survives removal`);
  assert(!removed.feats.some(item=>item.sourceClassId===definition.catalogId),`${spec.name} source feats survive removal`);
  assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),`${spec.name} removal must preserve manual data`);
}

console.log(`PASS action/resource wave 2: ${candidates.length} attempted, ${clean.length} clean targets, ${deferred.size} explicit subsystem blockers.`);
