import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import classes from '../src/data/classes.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression,classAutomationReport,annotateClassGrantKinds,castingAdvancementPlan,castingAdvancementSelectionsValid,applyCastingAdvancementSelections,legacyClassSkillStatus} from '../src/lib/classIntegration.js';

const baseCharacter=(classLevels,ruleset='3.5')=>({
  id:'test-character',name:'Automation Test',ruleset,mechanics:ruleset,level:classLevels.reduce((n,row)=>n+row.level,0),
  className:classLevels[0].name,classDefinition:classLevels[0].definition,classLevels,
  abilities:{str:14,dex:14,con:14,int:16,wis:14,cha:12},hp:{current:30,max:30,temp:4},
  actions:[{id:'manual-action',name:'Table ruling',type:'Action',description:'Keep me.'}],
  feats:[{id:'manual-feat',name:'Manual Feat',description:'Keep me.'}],
  resources:[],spells:[],trainingGrants:[],featureChoices:{}
});

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes35,feats35]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference35=[...classes35,...feats35];
const integrated35=name=>annotateClassGrantKinds(classes35.find(record=>record.name===name),reference35);
const archivist=integrated35('Archivist');
assert(archivist,'Archivist must exist in the canonical 3.5 catalog');
assert(archivist.progression?.length||archivist.tables?.length,'Archivist must expose structured progression data');

const archivist1=baseCharacter([{catalogId:archivist.catalogId,name:'Archivist',edition:'3.5',level:1,definition:archivist}]);
const a1=reconcileClassGrants(archivist1);
assert(a1.grantedFeatures.some(feature=>feature.name==='Dark Knowledge'&&feature.sourceClassLevel===1));
assert(a1.actions.some(action=>action.name==='Dark Knowledge'&&action.sourceClassId===archivist.catalogId));
assert(a1.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===archivist.catalogId));
assert.equal(a1.resources.find(resource=>resource.name==='Dark Knowledge')?.max,3);
assert(a1.actions.some(action=>action.id==='manual-action'));
assert(a1.feats.some(feat=>feat.id==='manual-feat'));

const a4=reconcileClassGrants(baseCharacter([{catalogId:archivist.catalogId,name:'Archivist',edition:'3.5',level:4,definition:archivist}]));
for(const name of ['Dark Knowledge','Scribe Scroll','Lore Mastery','Still Mind'])assert(a4.grantedFeatures.some(feature=>feature.name===name),name);
assert.equal(a4.resources.find(resource=>resource.name==='Dark Knowledge')?.max,4);
assert(a4.grantedFeatures.every(feature=>feature.description&&['rule-text','progression'].includes(feature.descriptionSource)),'Every granted class feature needs a usable sourced description');
assert(!a4.grantedFeatures.some(feature=>feature.description.includes('See the class source for complete rules.')),'Progression text replaces vague description placeholders');
const exact35=sourceId=>annotateClassGrantKinds(classes35.find(record=>record.sourceId===sourceId),reference35);

const fighter35=exact35('classes/fighter-93');
const fighter6=reconcileClassGrants(baseCharacter([{catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:6,definition:fighter35}]));
const fighterBonus=fighter6.grantedFeatures.find(feature=>/^bonus feats?$/i.test(feature.name));
assert.equal(fighterBonus?.kind,'choice','Fighter bonus feats remain guided choices rather than fake concrete feats');
assert.equal(fighterBonus?.descriptionSource,'rule-text');
assert.match(fighterBonus?.description||'',/prerequisites/i);

const rogue35=exact35('classes/rogue-97');
const rogue10=reconcileClassGrants(baseCharacter([{catalogId:rogue35.catalogId,name:'Rogue',edition:'3.5',level:10,definition:rogue35}]));
const rogueSpecial=rogue10.grantedFeatures.find(feature=>/special abilit(?:y|ies)/i.test(feature.name));
assert.equal(rogueSpecial?.kind,'choice','Rogue Special Ability is recognized as a class choice');
assert.equal(rogueSpecial?.descriptionSource,'rule-text','singular progression label resolves plural source heading');
assert.match(rogueSpecial?.description||'',/Crippling Strike/i);
assert(rogue10.grantedFeatures.some(feature=>feature.name==='Sneak Attack'));

const barbarian35=exact35('classes/barbarian-89');
const barbarian4=reconcileClassGrants(baseCharacter([{catalogId:barbarian35.catalogId,name:'Barbarian',edition:'3.5',level:4,definition:barbarian35}]));
assert(barbarian4.actions.some(action=>action.name==='Rage'&&action.sourceClassId===barbarian35.catalogId));
assert.equal(barbarian4.resources.find(resource=>resource.name==='Rage')?.max,2);
assert.equal(barbarian4.grantedFeatures.find(feature=>feature.name==='Rage')?.descriptionSource,'rule-text');
const monk35=exact35('classes/monk-94');
const monk20=reconcileClassGrants(baseCharacter([{catalogId:monk35.catalogId,name:'Monk',edition:'3.5',level:20,definition:monk35}]));
assert(monk20.feats.some(feat=>feat.name==='Improved Unarmed Strike'&&feat.sourceClassId===monk35.catalogId),'Monk Unarmed Strike grants Improved Unarmed Strike');
const flurry=monk20.actions.find(action=>action.name.toLowerCase()==='flurry of blows');
assert.equal(flurry?.type,'Full-round action','Monk Flurry is exposed as a full-round action');
assert.equal(monk20.resources.find(resource=>resource.name.toLowerCase()==='wholeness of body')?.max,40,'Wholeness healing pool is twice monk level');
assert.equal(monk20.resources.find(resource=>resource.name.toLowerCase()==='abundant step')?.max,1,'Abundant Step is once per day');
const palm=monk20.resources.find(resource=>resource.name.toLowerCase()==='quivering palm');
assert.equal(palm?.max,1,'Quivering Palm is once per week');
assert.equal(palm?.reset,'none');
assert.match(palm?.recoveryText||'',/one week/i);
assert.equal(monk20.resources.find(resource=>resource.name.toLowerCase()==='empty body')?.max,20,'Empty Body tracks monk-level ethereal rounds');
const reviewedCleric35=exact35('classes/cleric-91');
const cleric1=reconcileClassGrants(baseCharacter([{catalogId:reviewedCleric35.catalogId,name:'Cleric',edition:'3.5',level:1,definition:reviewedCleric35}]));
assert.equal(cleric1.grantedFeatures.find(feature=>feature.name==='Spontaneous Casting')?.descriptionSource,'rule-text');
assert.match(cleric1.grantedFeatures.find(feature=>/Deity, Domains/i.test(feature.name))?.description||'',/two permitted domains/i);
assert.match(cleric1.grantedFeatures.find(feature=>/Turn or Rebuke Undead/i.test(feature.name))?.description||'',/3 \+ your Charisma modifier times per day/i);

const reviewedPaladin35=exact35('classes/paladin-95');
const paladin6=reconcileClassGrants(baseCharacter([{catalogId:reviewedPaladin35.catalogId,name:'Paladin',edition:'3.5',level:6,definition:reviewedPaladin35}]));
assert.equal(paladin6.grantedFeatures.find(feature=>feature.name==='Lay on Hands')?.descriptionSource,'rule-text');
assert.equal(paladin6.actions.find(action=>action.name==='Lay on Hands')?.type,'Standard action','Paladin Lay on Hands is exposed as a standard action');
assert.equal(paladin6.actions.find(action=>action.name==='Special Mount')?.type,'Full-round action','Paladin Special Mount calling is exposed as a full-round action');
assert.equal(paladin6.resources.find(resource=>resource.name==='Special Mount')?.max,1,'Paladin Special Mount tracks its once-per-day call');
assert.equal(paladin6.resources.find(resource=>resource.name==='Remove Disease')?.max,1,'Paladin Remove Disease begins at once per week');
assert.equal(paladin6.resources.find(resource=>resource.name==='Remove Disease')?.reset,'none','weekly Paladin resources do not reset on normal rests');
assert.match(paladin6.resources.find(resource=>resource.name==='Remove Disease')?.recoveryText||'',/one week/i);
const reviewedWizard35=exact35('classes/wizard-99');
const wizard1=reconcileClassGrants(baseCharacter([{catalogId:reviewedWizard35.catalogId,name:'Wizard',edition:'3.5',level:1,definition:reviewedWizard35}]));
assert.equal(wizard1.grantedFeatures.find(feature=>feature.name==='Spellbooks')?.descriptionSource,'rule-text');
assert(wizard1.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===reviewedWizard35.catalogId),'Wizard Scribe Scroll is a class-granted feat');
assert.match(wizard1.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Intelligence/i);

const reviewedSorcerer35=exact35('classes/sorcerer-98');
const sorcerer1=reconcileClassGrants(baseCharacter([{catalogId:reviewedSorcerer35.catalogId,name:'Sorcerer',edition:'3.5',level:1,definition:reviewedSorcerer35}]));
assert.equal(sorcerer1.grantedFeatures.find(feature=>feature.name==='Familiar')?.descriptionSource,'rule-text');
assert.match(sorcerer1.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/without preparing/i);
assert.match(sorcerer1.grantedFeatures.find(feature=>feature.name==='Familiar Basics')?.description||'',/Hit Dice/i);
const reviewedDruid35=exact35('classes/druid-92');
const druid5=reconcileClassGrants(baseCharacter([{catalogId:reviewedDruid35.catalogId,name:'Druid',edition:'3.5',level:5,definition:reviewedDruid35}]));
assert.equal(druid5.grantedFeatures.find(feature=>feature.name==='Wild Shape')?.descriptionSource,'rule-text');
assert.equal(druid5.actions.find(action=>action.name==='Wild Shape')?.type,'Standard action','Druid Wild Shape is exposed as a standard action');
assert.equal(druid5.resources.find(resource=>resource.name==='Wild Shape')?.max,1,'Druid Wild Shape begins at once per day');
assert.match(druid5.grantedFeatures.find(feature=>feature.name==='Spontaneous Casting')?.description||'',/summon nature/i);

const reviewedRanger35=exact35('classes/ranger-96');
const ranger3=reconcileClassGrants(baseCharacter([{catalogId:reviewedRanger35.catalogId,name:'Ranger',edition:'3.5',level:3,definition:reviewedRanger35}]));
assert(ranger3.feats.some(feat=>feat.name==='Track'&&feat.sourceClassId===reviewedRanger35.catalogId),'Ranger Track is a class-granted feat');
assert(ranger3.feats.some(feat=>feat.name==='Endurance'&&feat.sourceClassId===reviewedRanger35.catalogId),'Ranger Endurance is a class-granted feat');
assert.equal(ranger3.grantedFeatures.find(feature=>feature.name==='Combat Style')?.kind,'choice','Ranger combat style remains a guided class choice');
const reviewedFavoredSoul35=exact35('classes/favored-soul-7');
const favoredSoul5=reconcileClassGrants(baseCharacter([{catalogId:reviewedFavoredSoul35.catalogId,name:'Favored Soul',edition:'3.5',level:5,definition:reviewedFavoredSoul35}]));
assert.equal(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Spells')?.descriptionSource,'rule-text');
assert.match(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Charisma/i);
assert.equal(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.kind,'choice','Favored Soul energy resistance remains a source-defined choice');
assert(!favoredSoul5.feats.some(feat=>/^Weapon Focus$/i.test(feat.name)),'Favored Soul does not invent a deity weapon feat without a weapon');

const reviewedCloistered35=exact35('classes/cloistered-cleric-120');
const cloistered1=reconcileClassGrants(baseCharacter([{catalogId:reviewedCloistered35.catalogId,name:'Cloistered Cleric',edition:'3.5',level:1,definition:reviewedCloistered35}]));
assert.equal(cloistered1.grantedFeatures.find(feature=>feature.name==='Lore')?.descriptionSource,'rule-text');
assert.match(cloistered1.grantedFeatures.find(feature=>/Deity, Domains/i.test(feature.name))?.description||'',/Knowledge domain/i);
assert.match(cloistered1.grantedFeatures.find(feature=>feature.name==='Spellcasting')?.description||'',/additional source-listed spells/i);
const reviewedSpiritShaman35=exact35('classes/spirit-shaman-9');
const spiritShaman17=reconcileClassGrants(baseCharacter([{catalogId:reviewedSpiritShaman35.catalogId,name:'Spirit Shaman',edition:'3.5',level:17,definition:reviewedSpiritShaman35}]));
assert(spiritShaman17.feats.some(feat=>feat.name==='Alertness'&&feat.sourceClassId===reviewedSpiritShaman35.catalogId),'Spirit Guide grants Alertness');
assert.equal(spiritShaman17.grantedFeatures.find(feature=>feature.name==='Spirit Guide')?.kind,'choice','Spirit Guide form remains a guided source choice');
assert.equal(spiritShaman17.actions.find(action=>action.name==='Chastise Spirits')?.type,'Standard action');
assert.equal(spiritShaman17.actions.find(action=>action.name==='Guide Magic')?.type,'Free action');
assert.equal(spiritShaman17.actions.find(action=>action.name==='Exorcism')?.type,'Full-round action');
assert.equal(spiritShaman17.resources.find(resource=>resource.name==='Warding of the Spirits')?.max,1);
assert.equal(spiritShaman17.resources.find(resource=>resource.name==='Recall Spirit')?.max,1);
assert.equal(spiritShaman17.resources.find(resource=>resource.name==='Recall Spirit')?.reset,'none');
assert.equal(spiritShaman17.resources.find(resource=>resource.name==='Spirit Journey')?.max,1);
const reviewedPsychicWarriorFeatures35=exact35('classes/psychic-warrior-138');
const psychicWarrior8=reconcileClassGrants(baseCharacter([{catalogId:reviewedPsychicWarriorFeatures35.catalogId,name:'Psychic Warrior',edition:'3.5',level:8,definition:reviewedPsychicWarriorFeatures35}]));
const psychicWarriorBonus=psychicWarrior8.grantedFeatures.find(feature=>feature.name==='Bonus Feats');
assert.equal(psychicWarriorBonus?.kind,'choice','Psychic Warrior bonus feats remain guided choices');
assert.equal(psychicWarriorBonus?.progressionHistory?.filter(event=>/bonus feat/i.test(event.text||'')).length,4,'Psychic Warrior retains bonus-feat milestones through level 8');
assert.match(psychicWarrior8.grantedFeatures.find(feature=>feature.name==='Power Points/Day')?.description||'',/Wisdom/i);
assert.match(psychicWarrior8.grantedFeatures.find(feature=>feature.name==='Maximum Power Level Known')?.description||'',/6th-level powers at 16th level/i);

const reviewedWilderFeatures35=exact35('classes/wilder-140');
const wilder17=reconcileClassGrants(baseCharacter([{catalogId:reviewedWilderFeatures35.catalogId,name:'Wilder',edition:'3.5',level:17,definition:reviewedWilderFeatures35}]));
const wildSurge=wilder17.grantedFeatures.find(feature=>feature.name==='Wild Surge');
assert.equal(wildSurge?.descriptionSource,'rule-text');
assert.equal(wildSurge?.progressionHistory?.filter(event=>/wild surge/i.test(event.text||'')).length,5,'Wilder Wild Surge milestones coalesce into one reviewed feature through level 17');
assert.equal(wilder17.actions.find(action=>action.name==='Volatile Mind')?.type,'Standard action');
assert.match(wilder17.grantedFeatures.find(feature=>feature.name==='Psychic Enervation')?.description||'',/5%/);
assert.match(wilder17.grantedFeatures.find(feature=>feature.name==='Power Points/Day')?.description||'',/Charisma/i);
const reviewedWarlockFeatures35=exact35('classes/warlock-4');
const warlock12=reconcileClassGrants(baseCharacter([{catalogId:reviewedWarlockFeatures35.catalogId,name:'Warlock',edition:'3.5',level:12,definition:reviewedWarlockFeatures35}]));
assert.equal(warlock12.actions.find(action=>action.name==='Eldritch Blast')?.type,'Standard action');
assert.equal(warlock12.actions.find(action=>action.name==='Fiendish Resilience')?.type,'Free action');
assert.equal(warlock12.resources.find(resource=>resource.name==='Fiendish Resilience')?.max,1);
assert.equal(warlock12.resources.find(resource=>resource.name==='Fiendish Resilience')?.reset,'long');
assert.equal(warlock12.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.kind,'choice');
assert.equal(warlock12.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.choiceCount,2);
assert.match(warlock12.grantedFeatures.find(feature=>feature.name==='Invocations')?.description||'',/at will/i);
const reviewedDreadNecromancer35=exact35('classes/dread-necromancer-75');
const dread16=reconcileClassGrants(baseCharacter([{catalogId:reviewedDreadNecromancer35.catalogId,name:'Dread Necromancer',edition:'3.5',level:16,definition:reviewedDreadNecromancer35}]));
assert.equal(dread16.actions.find(action=>action.name==='Charnel Touch')?.type,'Standard action');
assert.equal(dread16.actions.find(action=>action.name==='Fear Aura')?.type,'Free action');
assert.equal(dread16.actions.find(action=>action.name==='Scabrous Touch')?.type,'Swift action');
assert.equal(dread16.resources.find(resource=>resource.name==='Negative Energy Burst')?.max,3);
assert.equal(dread16.resources.find(resource=>resource.name==='Scabrous Touch')?.max,3);
assert.equal(dread16.resources.find(resource=>resource.name==='Enervating Touch')?.max,8);
assert.equal(dread16.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.kind,'choice');
assert.equal(dread16.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.progressionHistory?.length,4);
assert.equal(dread16.grantedFeatures.find(feature=>feature.name==='Summon Familiar')?.kind,'choice');
const dread20=reconcileClassGrants(baseCharacter([{catalogId:reviewedDreadNecromancer35.catalogId,name:'Dread Necromancer',edition:'3.5',level:20,definition:reviewedDreadNecromancer35}]));
assert(dread20.feats.some(feat=>/Craft Wondrous Item/i.test(feat.name)&&feat.sourceClassId===reviewedDreadNecromancer35.catalogId),'Dread Necromancer gains Craft Wondrous Item from the level table');
assert.equal(dread20.grantedFeatures.find(feature=>feature.name==='Lich Transformation')?.descriptionSource,'rule-text');
const reviewedNinja35=exact35('classes/ninja-1');
const ninja8=reconcileClassGrants(baseCharacter([{catalogId:reviewedNinja35.catalogId,name:'Ninja',edition:'3.5',level:8,definition:reviewedNinja35}]));
assert.equal(ninja8.actions.find(action=>action.name==='Ghost Step')?.type,'Swift action');
assert.equal(ninja8.actions.find(action=>action.name==='Ki Dodge')?.type,'Swift action');
assert.equal(ninja8.actions.find(action=>action.name==='Ghost Strike')?.type,'Move action');
assert.match(ninja8.grantedFeatures.find(feature=>feature.name==='Ki Power')?.description||'',/shared pool/i);
assert.equal(ninja8.resources.find(resource=>resource.name==='Ki Power')?.max,6,'Ninja ki pool is half level plus Wisdom modifier');

const reviewedScout35=exact35('classes/scout-2');
const scout8=reconcileClassGrants(baseCharacter([{catalogId:reviewedScout35.catalogId,name:'Scout',edition:'3.5',level:8,definition:reviewedScout35}]));
assert.equal(scout8.grantedFeatures.find(feature=>feature.name==='Bonus Feats')?.kind,'choice');
assert.equal(scout8.grantedFeatures.find(feature=>feature.name==='Bonus Feats')?.progressionHistory?.filter(event=>/bonus feat/i.test(event.text||'')).length,2);
assert.match(scout8.grantedFeatures.find(feature=>feature.name==='Skirmish')?.description||'',/10 feet/i);

const reviewedSwashbuckler35=exact35('classes/swashbuckler-23');
const swash11=reconcileClassGrants(baseCharacter([{catalogId:reviewedSwashbuckler35.catalogId,name:'Swashbuckler',edition:'3.5',level:11,definition:reviewedSwashbuckler35}]));
assert(swash11.feats.some(feat=>feat.name==='Weapon Finesse'&&feat.sourceClassId===reviewedSwashbuckler35.catalogId),'Swashbuckler grants Weapon Finesse');
assert.equal(swash11.resources.find(resource=>resource.name==='Lucky')?.max,1);
assert.equal(swash11.resources.find(resource=>resource.name==='Lucky')?.reset,'long');
assert.match(swash11.grantedFeatures.find(feature=>feature.name==='Insightful Strike')?.description||'',/Intelligence bonus/i);
const reviewedHexblade35=exact35('classes/hexblade-19');
const hexblade20=reconcileClassGrants(baseCharacter([{catalogId:reviewedHexblade35.catalogId,name:'Hexblade',edition:'3.5',level:20,definition:reviewedHexblade35}]));
assert.equal(hexblade20.actions.find(action=>action.name==='Hexblade’s Curse')?.type,'Free action');
assert.equal(hexblade20.resources.find(resource=>resource.name==='Hexblade’s Curse')?.max,5);
assert.equal(hexblade20.actions.find(action=>action.name==='Aura of Unluck')?.type,'Free action');
assert.equal(hexblade20.resources.find(resource=>resource.name==='Aura of Unluck')?.max,3);
assert.equal(hexblade20.grantedFeatures.find(feature=>feature.name==='Bonus Feat')?.kind,'choice');
assert.match(hexblade20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/one-half hexblade level/i);

const reviewedMarshal35=exact35('classes/marshal-78');
const marshal20=reconcileClassGrants(baseCharacter([{catalogId:reviewedMarshal35.catalogId,name:'Marshal',edition:'3.5',level:20,definition:reviewedMarshal35}]));
assert.equal(marshal20.actions.find(action=>action.name==='Auras')?.type,'Swift action');
assert.equal(marshal20.actions.find(action=>action.name==='Grant Move Action')?.type,'Standard action');
assert.equal(marshal20.resources.find(resource=>resource.name==='Grant Move Action')?.max,5);
assert(marshal20.feats.some(feat=>feat.name==='Skill Focus (Diplomacy)'&&feat.sourceClassId===reviewedMarshal35.catalogId),'Marshal grants Skill Focus (Diplomacy)');
assert.equal(marshal20.grantedFeatures.find(feature=>feature.name==='Minor Aura')?.choiceLevels?.length,8);
assert.equal(marshal20.grantedFeatures.find(feature=>feature.name==='Major Aura')?.choiceLevels?.length,5);
const reviewedDragonShaman35=exact35('classes/dragon-shaman-101');
const dragonShaman14=reconcileClassGrants(baseCharacter([{catalogId:reviewedDragonShaman35.catalogId,name:'Dragon Shaman',edition:'3.5',level:14,definition:reviewedDragonShaman35}]));
assert.equal(dragonShaman14.actions.find(action=>/^Draconic Aura(?:\s|$)/i.test(action.name))?.type,'Swift action');
assert.equal(dragonShaman14.actions.find(action=>/^Breath Weapon(?:\s|$)/i.test(action.name))?.type,'Standard action');
assert.equal(dragonShaman14.actions.find(action=>/^Touch of Vitality(?:\s|$)/i.test(action.name))?.type,'Standard action');
assert.equal(dragonShaman14.resources.find(resource=>resource.name==='Touch of Vitality')?.max,28,'Dragon Shaman Touch of Vitality is 2 × level × Charisma modifier');
assert.equal(dragonShaman14.resources.find(resource=>resource.name==='Commune with Dragon Spirit')?.max,1);
assert.equal(dragonShaman14.resources.find(resource=>resource.name==='Commune with Dragon Spirit')?.reset,'none');
assert.match(dragonShaman14.resources.find(resource=>resource.name==='Commune with Dragon Spirit')?.recoveryText||'',/seven days/i);
assert.equal(dragonShaman14.grantedFeatures.find(feature=>feature.name==='Draconic Aura')?.choiceCountByLevel?.['1'],3);
const reviewedKnight35=exact35('classes/knight-103');
const knight20=reconcileClassGrants(baseCharacter([{catalogId:reviewedKnight35.catalogId,name:'Knight',edition:'3.5',level:20,definition:reviewedKnight35}]));
assert.equal(knight20.resources.find(resource=>resource.name==='Knight’s Challenge')?.max,11,'Knight Challenge pool is half level plus Charisma modifier');
assert.equal(knight20.actions.find(action=>action.name==='Fighting Challenge')?.type,'Swift action');
assert.equal(knight20.actions.find(action=>action.name==='Test of Mettle')?.type,'Swift action');
assert.equal(knight20.actions.find(action=>action.name==='Bond of Loyalty')?.type,'Free action');
assert.equal(knight20.actions.find(action=>action.name==='Shield Ally')?.type,'Immediate action');
assert(knight20.feats.some(feat=>feat.name==='Mounted Combat'&&feat.sourceClassId===reviewedKnight35.catalogId),'Knight grants Mounted Combat');
assert.equal(knight20.grantedFeatures.find(feature=>feature.name==='Bonus Feat')?.kind,'choice');
assert.equal(knight20.grantedFeatures.find(feature=>feature.name==='Fighting Challenge')?.descriptionSource,'rule-text');
assert.match(knight20.grantedFeatures.find(feature=>feature.name==='Knight’s Code')?.description||'',/flanking/i);
const reviewedDuskblade35=exact35('classes/duskblade-102');
const duskblade20=reconcileClassGrants(baseCharacter([{catalogId:reviewedDuskblade35.catalogId,name:'Duskblade',edition:'3.5',level:20,definition:reviewedDuskblade35}]));
assert.equal(duskblade20.resources.find(resource=>resource.name==='Arcane Attunement')?.max,6,'Duskblade Arcane Attunement is 3 + Intelligence modifier');
assert(duskblade20.feats.some(feat=>feat.name==='Combat Casting'&&feat.sourceClassId===reviewedDuskblade35.catalogId),'Duskblade grants Combat Casting');
assert.equal(duskblade20.actions.find(action=>/^Arcane Channeling(?:\s|$)/i.test(action.name))?.type,'Standard action');
assert.equal(duskblade20.actions.find(action=>/^Quick Cast(?:\s|$)/i.test(action.name))?.type,'Swift action');
assert.equal(duskblade20.resources.find(resource=>/^Quick Cast(?:\s|$)/i.test(resource.name))?.max,4);
assert.match(duskblade20.grantedFeatures.find(feature=>feature.name==='Spells Known')?.description||'',/odd-numbered levels/i);
const reviewedWarmage35=exact35('classes/warmage-5');
const warmage20=reconcileClassGrants(baseCharacter([{catalogId:reviewedWarmage35.catalogId,name:'Warmage',edition:'3.5',level:20,definition:reviewedWarmage35}]));
for(const featName of ['Sudden Empower','Sudden Enlarge','Sudden Widen','Sudden Maximize'])assert(warmage20.feats.some(feat=>feat.name===featName&&feat.sourceClassId===reviewedWarmage35.catalogId),`Warmage grants ${featName}`);
assert.equal(warmage20.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.kind,'choice');
assert.deepEqual(warmage20.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.choiceLevels,[3,6,11,16]);
assert.match(warmage20.grantedFeatures.find(feature=>feature.name==='Warmage Edge')?.description||'',/Intelligence bonus/i);
assert.match(warmage20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Charisma/i);
assert.equal(warmage20.grantedFeatures.find(feature=>feature.name==='Armored Mage')?.descriptionSource,'rule-text');
const reviewedBeguiler35=exact35('classes/beguiler-100');
const beguiler20=reconcileClassGrants(baseCharacter([{catalogId:reviewedBeguiler35.catalogId,name:'Beguiler',edition:'3.5',level:20,definition:reviewedBeguiler35}]));
assert(beguiler20.feats.some(feat=>feat.name==='Silent Spell'&&feat.sourceClassId===reviewedBeguiler35.catalogId),'Beguiler grants Silent Spell');
assert(beguiler20.feats.some(feat=>feat.name==='Still Spell'&&feat.sourceClassId===reviewedBeguiler35.catalogId),'Beguiler grants Still Spell');
assert.equal(beguiler20.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.kind,'choice');
assert.deepEqual(beguiler20.grantedFeatures.find(feature=>feature.name==='Advanced Learning')?.choiceLevels,[3,7,11,15,19]);
assert.match(beguiler20.grantedFeatures.find(feature=>feature.name==='Cloaked Casting')?.description||'',/automatically overcome/i);
assert.match(beguiler20.grantedFeatures.find(feature=>feature.name==='Surprise Casting')?.description||'',/move action/i);
assert.match(beguiler20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/automatically know every/i);
const reviewedFavoredSoul35=exact35('classes/favored-soul-7');
const favoredSoul20=reconcileClassGrants(baseCharacter([{catalogId:reviewedFavoredSoul35.catalogId,name:'Favored Soul',edition:'3.5',level:20,definition:reviewedFavoredSoul35}]));
assert.equal(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.kind,'choice');
assert.deepEqual(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.choiceLevels,[5,10,15]);
assert.equal(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Deity’s Weapon Focus')?.choiceKind,'feat');
assert.equal(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Deity’s Weapon Specialization')?.choiceKind,'feat');
assert.match(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Charisma determines spell access/i);
assert.match(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Wisdom determines/i);
assert.match(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Wings')?.description||'',/60-foot fly speed/i);
assert.match(favoredSoul20.grantedFeatures.find(feature=>feature.name==='Damage Reduction')?.description||'',/10\/silver/i);
const trainedSheet=reconcileClassGrants(archivist1);
const archivistTraining=trainedSheet.trainingGrants.find(grant=>grant.sourceClassId===archivist.catalogId);
assert(archivistTraining?.automatic,'verified 3.5 proficiency supplements become automatic class training');
assert.deepEqual(archivistTraining.proficiencies.map(item=>item.index),['light-armor','medium-armor','simple-weapons']);
const trainedAgain=reconcileClassGrants(trainedSheet);
assert.equal(trainedAgain.trainingGrants.filter(grant=>grant.sourceClassId===archivist.catalogId).length,1,'supplement-backed class training reconciliation is idempotent');
for(const [name,expected] of [
  ['Psychic Warrior',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Shugenja',['simple-weapons','shortsword']],
  ['Soulborn',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Spellthief',['light-armor','simple-weapons']],
  ['Swashbuckler',['light-armor','simple-weapons','martial-weapons']]
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${name} verified source training`);
}
for(const [name,expected] of [
  ['Swordsage',['light-armor','simple-weapons','martial-melee-weapons']],
  ['Totemist',['light-armor','shields-except-tower','simple-weapons']],
  ['Warblade',['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-melee-weapons']],
  ['Warlock',['light-armor','simple-weapons']],
  ['Wilder',['light-armor','shields-except-tower','simple-weapons']],
  ['Wu Jen',['simple-weapons']]
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${name} verified source training`);
}

for(const [name,sourceOnlyIndex] of [
  ['Psion','shortspear'],
  ['Psychic Rogue','sap'],
  ['Scout','throwing-axe'],
  ['Soulknife','mind-blade']
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  const sourceOnly=grant?.proficiencies.find(item=>item.index===sourceOnlyIndex);
  assert(sourceOnly?.sourceOnly,`${name} keeps unmapped source proficiency as source-only`);
  assert.equal(sourceOnly.sourceClassId,record.catalogId,`${name} source-only training keeps provenance`);
}

const deathMaster35=integrated35('Death Master');
const deathMasterSheet=reconcileClassGrants(baseCharacter([{catalogId:deathMaster35.catalogId,name:'Death Master',edition:'3.5',level:1,definition:deathMaster35}]));
const deathMasterTraining=deathMasterSheet.trainingGrants.find(item=>item.sourceClassId===deathMaster35.catalogId);
for(const index of ['scythe','staff'])assert(deathMasterTraining?.proficiencies.find(item=>item.index===index)?.sourceOnly,`Death Master ${index} remains source-only`);

for(const [name,expected] of [
  ['Barbarian',['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Cleric',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons']],
  ['Fighter',['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']],
  ['Paladin',['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Ranger',['light-armor','shields-except-tower','simple-weapons','martial-weapons']],
  ['Sorcerer',['simple-weapons']],
  ['Wizard',['club','dagger','crossbow-heavy','crossbow-light','quarterstaff']]
]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${name} PHB training`);
}
const druid35=integrated35('Druid'),druidTraining=reconcileClassGrants(baseCharacter([{catalogId:druid35.catalogId,name:'Druid',edition:'3.5',level:1,definition:druid35}])).trainingGrants.find(item=>item.sourceClassId===druid35.catalogId);
assert(druidTraining?.proficiencies.find(item=>item.index==='medium-armor')?.name.includes('nonmetal'),'Druid armor restriction remains visible');
assert(druidTraining?.proficiencies.find(item=>item.index==='shields-except-tower')?.name.includes('Wooden'),'Druid shield restriction remains visible');
for(const [name,index] of [['Monk','kama'],['Rogue','sap']]){
  const record=integrated35(name),sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level:1,definition:record}]));
  assert(sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId)?.proficiencies.find(item=>item.index===index)?.sourceOnly,`${name} unmatched named weapon stays source-only`);
}

const eberronBarbarian=annotateClassGrantKinds(classes35.find(record=>record.sourceId==='classes/barbarian-37'),reference35);
const eberronBarbarianSheet=reconcileClassGrants(baseCharacter([{catalogId:eberronBarbarian.catalogId,name:'Barbarian',edition:'3.5',level:1,definition:eberronBarbarian}]));
const inheritedTraining=eberronBarbarianSheet.trainingGrants.find(item=>item.sourceClassId===eberronBarbarian.catalogId);
assert.deepEqual(inheritedTraining?.proficiencies.map(item=>item.index),['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-weapons'],'linked Eberron Barbarian reuses verified PHB training');
assert.equal(eberronBarbarian.proficiencyProfileFrom,'classes/barbarian-89');
assert.match(inheritedTraining?.sourceUrl||'',/barbarian-89$/,'training provenance points at the verified profile source while retaining duplicate class identity');

for(const [id,expected] of [
  ['classes/expert-33',['light-armor','simple-weapons']],
  ['classes/warrior-34',['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']],
  ['classes/expert2-124',['light-armor','simple-weapons']],
  ['classes/warrior2-135',['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-weapons']]
]){
  const record=annotateClassGrantKinds(classes35.find(item=>item.sourceId===id),reference35);
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name:record.name,edition:'3.5',level:1,definition:record}]));
  const grant=sheet.trainingGrants.find(item=>item.sourceClassId===record.catalogId);
  assert.deepEqual(grant?.proficiencies.map(item=>item.index),expected,`${id} verified NPC/generic training`);
}
const warmage35=integrated35('Warmage');
const warmage1=reconcileClassGrants(baseCharacter([{catalogId:warmage35.catalogId,name:'Warmage',edition:'3.5',level:1,definition:warmage35}]));
assert(!warmage1.trainingGrants.flatMap(grant=>grant.proficiencies).some(item=>item.index==='medium-armor'),'Warmage medium armor is not a level-1 grant');
const warmage8=reconcileClassGrants(baseCharacter([{catalogId:warmage35.catalogId,name:'Warmage',edition:'3.5',level:8,definition:warmage35}]));
assert(warmage8.trainingGrants.some(grant=>grant.sourceClassLevel===8&&grant.proficiencies.some(item=>item.index==='medium-armor')),'Warmage gains medium-armor proficiency at level 8');


const skilledArchivist={...archivist,classSkills:['Concentration','Knowledge (religion)','Spellcraft']};
const skilledSheet=reconcileClassGrants(baseCharacter([{catalogId:skilledArchivist.catalogId,name:'Archivist',edition:'3.5',level:1,definition:skilledArchivist}]));
assert.deepEqual(skilledSheet.classSkills35.map(skill=>skill.name),['Concentration','Knowledge (religion)','Spellcraft']);
const dynamicSkillClass={name:'Adaptive Scholar',edition:'3.5',catalogId:'dndtools:classes/adaptive-scholar',classSkillRule:{mode:'choose_any',count:4,additional:['Craft']},progression:[['Class Level','Special'],['1st','Adaptive training']]};
const dynamicSkillSheet=reconcileClassGrants(baseCharacter([{catalogId:dynamicSkillClass.catalogId,name:dynamicSkillClass.name,edition:'3.5',level:1,definition:dynamicSkillClass}]));
assert.equal(dynamicSkillSheet.classSkillRules35[0].rule.mode,'choose_any');
assert.equal(reconcileClassGrants(dynamicSkillSheet).classSkillRules35.length,1,'dynamic class-skill rules reconcile idempotently');
assert.deepEqual(legacyClassSkillStatus(skilledSheet,'Spellcraft'),{classSkill:true,fixed:true,manual:false,dynamic:false,rankCap:4});
assert.deepEqual(legacyClassSkillStatus(skilledSheet,'Tumble'),{classSkill:false,fixed:false,manual:false,dynamic:false,rankCap:2});
const dynamicMarked={...dynamicSkillSheet,classSkillOverrides35:{tumble:true}};
assert.deepEqual(legacyClassSkillStatus(dynamicMarked,'Tumble'),{classSkill:true,fixed:false,manual:true,dynamic:true,rankCap:4});



assert.deepEqual(a4.classSpellSlots.find(profile=>profile.sourceClassId===archivist.catalogId)?.slots.slice(0,4),[4,4,3,0],'Archivist multi-row slot table');
const again=reconcileClassGrants(a4);
assert.equal(new Set(again.actions.map(x=>x.id)).size,again.actions.length);
assert.equal(new Set(again.feats.map(x=>x.id)).size,again.feats.length);
assert.equal(new Set(again.grantedFeatures.map(x=>x.id)).size,again.grantedFeatures.length);

// Recurring 3.5 progression families are retained generically instead of hard-coded per class.
for(const [name,level,expected] of [
  ['Psion',3,{'Power Points per Day':'11','Powers Known':'7','Maximum Power Level Known':'2nd'}],
  ['Warblade',3,{'Maneuvers Known':'5','Maneuvers Readied':'3','Stances Known':'1'}],
  ['Warlock',3,{'Invocations Known':'2'}],
  ['Incarnate',3,{'Soulmelds':'3','Essentia':'3','Chakra Binds':'1'}],
  ['Loremaster',3,{'Spells per Day':'+1 level of existing class'}]
]){
  const record=integrated35(name);
  assert(record,`${name} must exist in the canonical 3.5 catalog`);
  const reconciled=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level,definition:record}]));
  const tracks=Object.fromEntries((reconciled.classProgressionTracks||[]).map(track=>[track.name,track.value]));
  for(const [track,value] of Object.entries(expected))assert.equal(tracks[track],value,`${name} ${track}`);
  assert.equal(classAutomationReport(reconciled).classes[0].progressionComplete,true,`${name} progression`);
}

for(const [name,level,expected] of [
  ['Bard',5,[3,3,1,0]],
  ['Assassin',3,[0,2,0,0]],
  ['Dread Necromancer',4,[0,6,3,0]]
]){
  const record=integrated35(name);
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name,edition:'3.5',level,definition:record}]));
  assert.deepEqual(sheet.classSpellSlots.find(profile=>profile.sourceClassId===record.catalogId)?.slots.slice(0,4),expected,`${name} source-derived spell slots`);
}

// Every no-table variant can resolve through its audited inheritance pointer.
const fighterVariant=integrated35('Fighter Variant');
assert(fighterVariant?.inheritedFromClassId,'Fighter Variant should resolve canonical parent progression');
assert(fighterVariant.progression?.length,'Inherited Fighter progression must be available');
const variantSheet=reconcileClassGrants(baseCharacter([{catalogId:fighterVariant.catalogId,name:fighterVariant.name,edition:'3.5',level:2,definition:fighterVariant}]));
assert.equal(classAutomationReport(variantSheet).classes[0].progressionComplete,true);
assert((variantSheet.grantedFeatures||[]).every(feature=>feature.sourceClassId===fighterVariant.catalogId),'Inherited grants retain variant provenance');

const compoundRaw=classes35.find(record=>record.name==='Sorcerer/Wizard Variant');
const compound=annotateClassGrantKinds(compoundRaw,reference35);
assert.equal(compound.inheritanceRequired,true);
assert.deepEqual(compound.inheritanceOptions.map(option=>option.name).sort(),['Sorcerer','Wizard']);
for(const parent of ['Sorcerer','Wizard']){
  const resolved=annotateClassGrantKinds({...compoundRaw,inheritanceChoice:parent},reference35);
  assert.equal(resolved.inheritanceRequired,false,`${parent} variant choice resolves`);
  assert.equal(resolved.inheritanceChoice,parent);
  assert(resolved.progression?.length,`${parent} progression inherited`);
  assert(resolved.hit_die,`${parent} hit die inherited`);
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:resolved.catalogId,name:resolved.name,edition:'3.5',level:1,definition:resolved}]));
  assert.equal(classAutomationReport(sheet).classes[0].progressionComplete,true);
}

// Plural "Specials" is a real catalog shape and must be parsed as class features.
const planar=integrated35('Planar Vanguard');
assert(planar);
const planarSheet=reconcileClassGrants(baseCharacter([{catalogId:planar.catalogId,name:planar.name,edition:'3.5',level:1,definition:planar}]));
assert(planarSheet.grantedFeatures.length>0,'Specials column should produce class grants');

// NPC progressions without a Special column are still structurally valid progressions.
const aristocrat=integrated35('Aristocrat');
const aristocratSheet=reconcileClassGrants(baseCharacter([{catalogId:aristocrat.catalogId,name:aristocrat.name,edition:'3.5',level:3,definition:aristocrat}]));
assert.equal(classAutomationReport(aristocratSheet).classes[0].progressionComplete,true);

const fighterRecord={...classes.find(row=>row.name==='Fighter'),edition:'2014',catalogId:'2014:fighter'};
const wizardRecord={...classes.find(row=>row.name==='Wizard'),edition:'2014',catalogId:'2014:wizard'};
const multiclass=baseCharacter([
  {catalogId:fighterRecord.catalogId,name:'Fighter',edition:'2014',level:2,definition:fighterRecord},
  {catalogId:wizardRecord.catalogId,name:'Wizard',edition:'2014',level:1,definition:wizardRecord}
],'2014');
multiclass.spells=[{id:'wizard-spell',name:'Magic Missile',castingClassId:wizardRecord.catalogId},{id:'manual-spell',name:'Gift Spell'}];
multiclass.trainingGrants=[{classId:wizardRecord.catalogId,className:'Wizard',proficiencies:[]}];
const mixed=reconcileClassGrants(multiclass);
assert(mixed.grantedFeatures.some(feature=>feature.sourceClassId===fighterRecord.catalogId));
assert(mixed.grantedFeatures.some(feature=>feature.sourceClassId===wizardRecord.catalogId));
assert.equal(classAutomationReport(mixed).classes.length,2);

// Prestige advancement applies only to the chosen existing caster/manifesting progression.
const wizard35=integrated35('Wizard'),cleric35=integrated35('Cleric'),psion35=integrated35('Psion');
const wizardRow={catalogId:wizard35.catalogId,name:'Wizard',edition:'3.5',level:5,definition:wizard35};
const wizard5=reconcileClassGrants(baseCharacter([wizardRow]));
const loremaster=integrated35('Loremaster'),lorePlan=castingAdvancementPlan(wizard5,loremaster,1);
assert.equal(lorePlan.groups.length,1);
assert(lorePlan.groups[0].candidates.some(option=>option.classId===wizard35.catalogId));
const lorePicks={[lorePlan.groups[0].id]:wizard35.catalogId};
assert(castingAdvancementSelectionsValid(lorePlan,lorePicks));
const loreAdvanced=applyCastingAdvancementSelections({...wizard5,classLevels:[wizardRow,{catalogId:loremaster.catalogId,name:'Loremaster',edition:'3.5',level:1,definition:loremaster}],level:6},lorePlan,lorePicks);
const loreSheet=reconcileClassGrants(loreAdvanced),wizard6=reconcileClassGrants(baseCharacter([{...wizardRow,level:6}]));
assert.equal(loreSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,6);
assert.deepEqual(loreSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.slots,wizard6.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.slots);

const mystic=integrated35('Mystic Theurge');
const dualBase=reconcileClassGrants(baseCharacter([
  {...wizardRow,level:3},
  {catalogId:cleric35.catalogId,name:'Cleric',edition:'3.5',level:3,definition:cleric35}
]));
const mysticPlan=castingAdvancementPlan(dualBase,mystic,1);
assert.equal(mysticPlan.groups.length,2,'Mystic Theurge should advance two casting progressions');
const arcaneGroup=mysticPlan.groups.find(group=>group.kind==='arcane'),divineGroup=mysticPlan.groups.find(group=>group.kind==='divine');
assert(arcaneGroup&&divineGroup);
const mysticPicks={[arcaneGroup.id]:wizard35.catalogId,[divineGroup.id]:cleric35.catalogId};
assert(castingAdvancementSelectionsValid(mysticPlan,mysticPicks));
const mysticSheet=reconcileClassGrants(applyCastingAdvancementSelections({...dualBase,classLevels:[...dualBase.classLevels,{catalogId:mystic.catalogId,name:mystic.name,edition:'3.5',level:1,definition:mystic}],level:7},mysticPlan,mysticPicks));
assert.equal(mysticSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,4);
assert.equal(mysticSheet.classSpellSlots.find(profile=>profile.sourceClassId===cleric35.catalogId)?.effectiveClassLevel,4);

const cerebremancer=integrated35('Cerebremancer');
const psiBase=reconcileClassGrants(baseCharacter([
  {...wizardRow,level:3},
  {catalogId:psion35.catalogId,name:'Psion',edition:'3.5',level:3,definition:psion35}
]));
const cerePlan=castingAdvancementPlan(psiBase,cerebremancer,1);
assert(cerePlan.groups.some(group=>group.kind==='arcane'));
assert(cerePlan.groups.some(group=>group.kind==='psionic'));
const cerePicks=Object.fromEntries(cerePlan.groups.map(group=>[group.id,group.kind==='psionic'?psion35.catalogId:wizard35.catalogId]));
assert(castingAdvancementSelectionsValid(cerePlan,cerePicks));
const cereSheet=reconcileClassGrants(applyCastingAdvancementSelections({...psiBase,classLevels:[...psiBase.classLevels,{catalogId:cerebremancer.catalogId,name:cerebremancer.name,edition:'3.5',level:1,definition:cerebremancer}],level:7},cerePlan,cerePicks));
assert.equal(cereSheet.classSpellSlots.find(profile=>profile.sourceClassId===wizard35.catalogId)?.effectiveClassLevel,4);
assert.equal(cereSheet.classProgressionTracks.find(track=>track.sourceClassId===psion35.catalogId&&track.name==='Power Points per Day')?.effectiveClassLevel,4);

const prestige={
  id:'classes/test-prestige',catalogId:'dndtools:classes/test-prestige',name:'Test Prestige',edition:'3.5',prestige:true,hit_die:8,
  progression:[['Level','BAB','Fort','Ref','Will','Special'],['1st','+0','+0','+0','+2','Secret lore 1/day']],
  sourceDescription:'Secret Lore: Once per day, you can use a special action to recall a hidden truth.',
  mechanicsPresence:{classFeatures:true}
};
const prestiged=reconcileClassGrants({...a4,classLevels:[...a4.classLevels,{catalogId:prestige.catalogId,name:prestige.name,edition:'3.5',level:1,definition:prestige}],level:5});
assert(prestiged.grantedFeatures.some(feature=>feature.sourceClassId===prestige.catalogId));
assert(prestiged.resources.some(resource=>resource.sourceClassId===prestige.catalogId&&resource.max===1));

const removed=removeClassProgression(mixed,wizardRecord.catalogId);
assert.equal(removed.classLevels.length,1);
assert.equal(removed.classLevels[0].name,'Fighter');
assert(removed.actions.some(action=>action.id==='manual-action'));
assert(removed.feats.some(feat=>feat.id==='manual-feat'));
assert(removed.spells.some(spell=>spell.id==='manual-spell'));
assert(!removed.spells.some(spell=>spell.id==='wizard-spell'));
assert(!removed.trainingGrants.some(grant=>grant.classId===wizardRecord.catalogId));
assert(!removed.grantedFeatures.some(feature=>feature.sourceClassId===wizardRecord.catalogId));

console.log('PASS class reconciliation: Archivist, recurring 3.5 progression families, inherited variants, plural Specials, multiclassing, prestige, idempotence, and safe removal');
