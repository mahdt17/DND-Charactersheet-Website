import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import classes from '../src/data/classes.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';
import {validLegacyChoices,prohibitedSpell,restrictedCastingOptions} from '../src/lib/legacyCastingChoices.js';
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

const thug35=exact35('classes/thug-132');
const thug1=reconcileClassGrants(baseCharacter([{catalogId:thug35.catalogId,name:'Thug',edition:'3.5',level:1,definition:thug35}]));
assert.deepEqual(thug1.trainingGrants.find(item=>item.sourceClassId===thug35.catalogId)?.proficiencies.map(item=>item.index),['light-armor','simple-weapons','martial-weapons'],'Thug receives only source-listed training');
assert(!thug1.grantedFeatures.some(feature=>/^bonus feats?$/i.test(feature.name)),'Thug suppresses Fighter bonus feat at level 1');
for(const skill of ['Bluff','Gather Information','Knowledge (local)','Sleight of Hand'])assert.equal(legacyClassSkillStatus(thug1,skill).classSkill,true,'Thug class skill: '+skill);
assert.equal(legacyClassSkillStatus(thug1,'Spot').classSkill,false,'Thug does not inherit unrelated Fighter/Rogue skills');

const thug2=reconcileClassGrants(baseCharacter([{catalogId:thug35.catalogId,name:'Thug',edition:'3.5',level:2,definition:thug35}]));
const thugBonus=thug2.grantedFeatures.find(feature=>/^bonus feats?$/i.test(feature.name));
assert.equal(thugBonus?.kind,'choice','Thug level 2 exposes its inherited Fighter bonus feat as a guided choice');
assert.equal(thugBonus?.level,2,'Thug first bonus feat is level 2');
assert(thugBonus?.choiceOptions?.includes('Urban Tracking'),'Thug explicitly adds Urban Tracking to its Fighter bonus-feat choices');
assert(thugBonus?.choiceOptions?.includes('Power Attack'),'Thug retains ordinary Fighter bonus-feat options');
assert(!thugBonus?.choiceOptions?.includes('Alertness'),'Thug bonus-feat pool rejects unrelated feats');

const thug20=reconcileClassGrants(baseCharacter([{catalogId:thug35.catalogId,name:'Thug',edition:'3.5',level:20,definition:thug35}]));
const thugHistory=thug20.grantedFeatures.find(feature=>/^bonus feats?$/i.test(feature.name))?.progressionHistory||[];
assert.deepEqual(thugHistory.map(event=>event.level),[2,4,6,8,10,12,14,16,18,20],'Thug retains Fighter bonus-feat progression after suppressing level 1');
assert.equal(classAutomationReport(thug20).classes[0].descriptionComplete,true,'Thug inherited progression has self-contained reviewed rule text');

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
const monkVariant35=exact35('classes/monk-variant-954');
const monkVariant20=reconcileClassGrants(baseCharacter([{catalogId:monkVariant35.catalogId,name:'Monk Variant',edition:'3.5',level:20,definition:monkVariant35}]));
assert.equal(monkVariant35.inheritedFromClassId,'dndtools:classes/monk-94','Monk Variant binds the exact reviewed Monk source');
assert(!monkVariant20.grantedFeatures.some(feature=>feature.name==='Fast Movement'),'Monk Variant removes the Monk enhancement speed feature');
const monkVariantAC=monkVariant20.grantedFeatures.find(feature=>feature.name==='AC Bonus');
assert.equal(monkVariantAC?.descriptionSource,'rule-text');
assert.match(monkVariantAC?.description||'',/Wisdom bonus/i);
assert.match(monkVariantAC?.description||'',/does not gain the additional \+1 class AC bonus at 5th level/i);
const monkVariantDR=monkVariant20.grantedFeatures.find(feature=>feature.name==='Damage Reduction');
assert.equal(monkVariantDR?.descriptionSource,'rule-text');
assert.deepEqual(monkVariantDR?.progressionHistory?.map(event=>event.level),[7,10,13,16,19]);
assert.match(monkVariantDR?.description||'',/5\/- at 19th(?: level)?/i);
assert.match(monkVariantDR?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/barbarian/i);
assert(monkVariant20.grantedFeatures.some(feature=>feature.name==='Perfect Self'),'Monk Variant retains Perfect Self');
assert(monkVariant20.feats.some(feat=>feat.name==='Improved Unarmed Strike'&&feat.sourceClassId===monkVariant35.catalogId),'Monk Variant retains Monk automatic feats');
for(const proficiency of ['club','crossbow-light','crossbow-heavy','dagger','handaxe','javelin','kama','nunchaku','quarterstaff','sai','shuriken','siangham','sling'])assert(monkVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Monk Variant retains Monk training: '+proficiency);
assert.equal(classAutomationReport(monkVariant20).classes[0].descriptionComplete,true,'Monk Variant retained and replacement mechanics are fully described');
const monkVariantMulti=reconcileClassGrants({...monkVariant20,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:monkVariant35.catalogId,name:'Monk Variant',edition:'3.5',level:20,definition:monkVariant35}
],level:21,className:'Fighter',classDefinition:fighter35});
const monkVariantRemoved=removeClassProgression(monkVariantMulti,monkVariant35.catalogId);
assert(!monkVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===monkVariant35.catalogId),'Removing Monk Variant removes its source-owned features');
assert(monkVariantRemoved.actions.some(action=>action.id==='manual-action')&&monkVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Monk Variant preserves unrelated manual data');

const barbarianVariant35=exact35('classes/barbarian-variant-950');
const barbarianVariant20Base=baseCharacter([{catalogId:barbarianVariant35.catalogId,name:'Barbarian Variant',edition:'3.5',level:20,definition:barbarianVariant35}]);
const barbarianVariant20=reconcileClassGrants(barbarianVariant20Base);
assert.equal(barbarianVariant35.inheritedFromClassId,'dndtools:classes/barbarian-89','Barbarian Variant binds the exact reviewed Barbarian source');
for(const removed of ['Rage','Greater Rage','Indomitable Will','Tireless Rage','Mighty Rage'])assert(!barbarianVariant20.grantedFeatures.some(feature=>feature.name===removed),'Barbarian Variant removes '+removed);
for(const retained of ['Fast Movement','Trap Sense','Damage Reduction'])assert(barbarianVariant20.grantedFeatures.some(feature=>feature.name===retained),'Barbarian Variant retains '+retained);
const barbarianVariantEnemy=barbarianVariant20.grantedFeatures.find(feature=>feature.name==='Favored Enemy');
assert.equal(barbarianVariantEnemy?.choiceKind,'favored-enemy');
assert(barbarianVariantEnemy?.choiceOptions?.includes('Animal')&&barbarianVariantEnemy?.choiceOptions?.includes('Outsider (evil)'));
for(const [name,rule] of [['Combat Style','Rapid Shot'],['Improved Combat Style','Manyshot'],['Combat Style Mastery','Improved Precise Shot']]){
  const feature=barbarianVariant20.grantedFeatures.find(item=>item.name===name);
  assert.match(feature?.description||'',new RegExp(rule,'i'),'Barbarian Variant materializes '+name+' Archery mechanics');
  assert.match(feature?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/ranger/i);
  assert(barbarianVariant20.feats.some(feat=>feat.name===rule&&feat.sourceClassId===barbarianVariant35.catalogId),'Barbarian Variant materializes '+rule+' as a class-granted feat');
}
for(const proficiency of ['light-armor','medium-armor','shields-except-tower','simple-weapons','martial-weapons'])assert(barbarianVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Barbarian Variant retains Barbarian training: '+proficiency);
const barbarianVariant1={...barbarianVariant20Base,classLevels:[{...barbarianVariant20Base.classLevels[0],level:1}],level:1};
const barbarianVariant1Plan=featureChoicePlan(barbarianVariant1,null);
const barbarianVariantEnemy1=barbarianVariant1Plan.groups.find(group=>group.choiceKind==='favored-enemy');
assert(barbarianVariantEnemy1?.options.includes('Animal'),'Barbarian Variant receives the unrestricted Ranger favored-enemy list');
const barbarianVariant1Chosen=applyFeatureChoices(barbarianVariant1,null,{[barbarianVariantEnemy1.id]:['Animal']});
assert(Object.values(barbarianVariant1Chosen.featureChoices).some(choice=>choice.choiceKind==='favored-enemy'&&choice.choices?.[0]==='Animal'));
assert.equal(classAutomationReport(barbarianVariant20).classes[0].descriptionComplete,true,'Barbarian Variant retained and replacement mechanics are fully described');
const barbarianVariantMulti=reconcileClassGrants({...barbarianVariant1Chosen,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:barbarianVariant35.catalogId,name:'Barbarian Variant',edition:'3.5',level:1,definition:barbarianVariant35}
],level:2,className:'Fighter',classDefinition:fighter35});
const barbarianVariantRemoved=removeClassProgression(barbarianVariantMulti,barbarianVariant35.catalogId);
assert(!barbarianVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===barbarianVariant35.catalogId),'Removing Barbarian Variant removes its source-owned features');
assert(!Object.values(barbarianVariantRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===barbarianVariant35.catalogId),'Removing Barbarian Variant removes its Favored Enemy selections');
assert(barbarianVariantRemoved.actions.some(action=>action.id==='manual-action')&&barbarianVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Barbarian Variant preserves unrelated manual data');

const paladinVariant35=exact35('classes/paladin-variant-955');
const paladinVariant20Base=baseCharacter([{catalogId:paladinVariant35.catalogId,name:'Paladin Variant',edition:'3.5',level:20,definition:paladinVariant35}]);
const paladinVariant20=reconcileClassGrants(paladinVariant20Base);
assert.equal(paladinVariant35.inheritedFromClassId,'dndtools:classes/paladin-95','Paladin Variant binds the exact reviewed Paladin source');
for(const removed of ['Lay on Hands','Turn Undead','Remove Disease'])assert(!paladinVariant20.grantedFeatures.some(feature=>feature.name===removed),'Paladin Variant removes '+removed);
for(const retained of ['Smite Evil','Divine Grace','Special Mount'])assert(paladinVariant20.grantedFeatures.some(feature=>feature.name===retained),'Paladin Variant retains '+retained);
const paladinVariantEnemy=paladinVariant20.grantedFeatures.find(feature=>feature.name==='Favored Enemy');
assert.equal(paladinVariantEnemy?.choiceKind,'favored-enemy');
assert.deepEqual(paladinVariantEnemy?.choiceLevels,[1,5,10,15,20]);
assert.deepEqual(paladinVariantEnemy?.choiceOptions,['Aberration','Dragon','Giant','Monstrous Humanoid','Outsider (evil)','Undead']);
assert.match(paladinVariantEnemy?.description||'',/aberrations, dragons, giants, monstrous humanoids, evil outsiders, or undead/i);
assert.match(paladinVariantEnemy?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/ranger/i);
for(const proficiency of ['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons','martial-weapons'])assert(paladinVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Paladin Variant retains Paladin training: '+proficiency);
const paladinVariant1={...paladinVariant20Base,classLevels:[{...paladinVariant20Base.classLevels[0],level:1}],level:1};
const paladinVariant1Plan=featureChoicePlan(paladinVariant1,null);
const paladinVariantEnemy1=paladinVariant1Plan.groups.find(group=>group.choiceKind==='favored-enemy');
assert(paladinVariantEnemy1,'Paladin Variant requests a restricted favored enemy at 1st level');
assert(paladinVariantEnemy1.options.includes('Dragon')&&!paladinVariantEnemy1.options.includes('Animal'));
const paladinVariant1Chosen=applyFeatureChoices(paladinVariant1,null,{[paladinVariantEnemy1.id]:['Dragon']});
const paladinVariant5={...paladinVariant1Chosen,classLevels:[{...paladinVariant1Chosen.classLevels[0],level:5}],level:5};
const paladinVariant5Plan=featureChoicePlan(paladinVariant5,paladinVariant1Chosen);
const paladinVariantEnemy5=paladinVariant5Plan.groups.find(group=>group.choiceKind==='favored-enemy');
const paladinVariantBoost5=paladinVariant5Plan.groups.find(group=>group.choiceKind==='favored-enemy-boost');
assert(paladinVariantEnemy5&&!paladinVariantEnemy5.options.includes('Dragon')&&paladinVariantBoost5?.options.includes('Dragon'),'Paladin Variant enforces new-enemy and boost choices');
const paladinVariant5Chosen=applyFeatureChoices(paladinVariant5,paladinVariant1Chosen,{[paladinVariantEnemy5.id]:['Undead'],[paladinVariantBoost5.id]:['Undead']});
assert(Object.values(paladinVariant5Chosen.featureChoices).some(choice=>choice.choiceKind==='favored-enemy-boost'&&choice.choices?.[0]==='Undead'));
assert.equal(classAutomationReport(paladinVariant20).classes[0].descriptionComplete,true,'Paladin Variant retained and replacement mechanics are fully described');
const paladinVariantMulti=reconcileClassGrants({...paladinVariant5Chosen,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:paladinVariant35.catalogId,name:'Paladin Variant',edition:'3.5',level:5,definition:paladinVariant35}
],level:6,className:'Fighter',classDefinition:fighter35});
const paladinVariantRemoved=removeClassProgression(paladinVariantMulti,paladinVariant35.catalogId);
assert(!paladinVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===paladinVariant35.catalogId),'Removing Paladin Variant removes its source-owned features');
assert(!Object.values(paladinVariantRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===paladinVariant35.catalogId),'Removing Paladin Variant removes its Favored Enemy selections');
assert(paladinVariantRemoved.actions.some(action=>action.id==='manual-action')&&paladinVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Paladin Variant preserves unrelated manual data');

const druidVariant35=exact35('classes/druid-variant-952');
const druidVariant20Base=baseCharacter([{catalogId:druidVariant35.catalogId,name:'Druid Variant',edition:'3.5',level:20,definition:druidVariant35}]);
const druidVariant20=reconcileClassGrants(druidVariant20Base);
assert.equal(druidVariant35.inheritedFromClassId,'dndtools:classes/druid-92','Druid Variant binds the exact reviewed Druid source');
assert(!druidVariant20.grantedFeatures.some(feature=>feature.name==='Wild Shape'),'Druid Variant removes all Wild Shape progression');
for(const retained of ['Spells','Animal Companion','Woodland Stride'])assert(druidVariant20.grantedFeatures.some(feature=>feature.name===retained),'Druid Variant retains '+retained);
const druidVariantAC=druidVariant20.grantedFeatures.find(feature=>feature.name==='AC Bonus');
assert.equal(druidVariantAC?.descriptionSource,'rule-text');
assert.match(druidVariantAC?.description||'',/\+4 at 20th/i);
const druidVariantFast=druidVariant20.grantedFeatures.find(feature=>feature.name==='Fast Movement');
assert.deepEqual(druidVariantFast?.progressionHistory?.map(event=>event.level),[3,6,9,12,15,18]);
assert.match(druidVariantFast?.description||'',/\+60 at 18th/i);
const druidVariantEnemy=druidVariant20.grantedFeatures.find(feature=>feature.name==='Favored Enemy');
assert.equal(druidVariantEnemy?.choiceKind,'favored-enemy');
assert(druidVariantEnemy?.choiceOptions?.includes('Animal')&&druidVariantEnemy?.choiceOptions?.includes('Undead'));
assert(druidVariant20.grantedFeatures.some(feature=>feature.name==='Swift Tracker'),'Druid Variant gains Ranger Swift Tracker');
assert(druidVariant20.feats.some(feat=>feat.name==='Track'&&feat.sourceClassId===druidVariant35.catalogId),'Druid Variant gains Track as a class feat');
const druidVariantTraining=druidVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]);
for(const weapon of ['club','dagger','quarterstaff','scimitar','sickle','sling','spear'])assert(druidVariantTraining.some(item=>item.index===weapon),'Druid Variant retains Druid weapon training: '+weapon);
for(const removedTraining of ['light-armor','medium-armor','shields-except-tower'])assert(!druidVariantTraining.some(item=>item.index===removedTraining),'Druid Variant removes '+removedTraining+' proficiency');
const druidVariant1={...druidVariant20Base,classLevels:[{...druidVariant20Base.classLevels[0],level:1}],level:1};
const druidVariant1Plan=featureChoicePlan(druidVariant1,null);
const druidVariantEnemy1=druidVariant1Plan.groups.find(group=>group.choiceKind==='favored-enemy');
const druidVariantCompanion1=druidVariant1Plan.groups.find(group=>group.choiceKind==='animal-companion');
assert(druidVariantEnemy1?.options.includes('Animal'),'Druid Variant receives the full Ranger favored-enemy list');
assert(druidVariantCompanion1?.options.includes('Wolf')&&!druidVariantCompanion1?.options.includes('Ape'),'Druid Variant level 1 receives only legal starting companions');
const druidVariant1Chosen=applyFeatureChoices(druidVariant1,null,{
  [druidVariantEnemy1.id]:['Animal'],
  [druidVariantCompanion1.id]:['Wolf']
});
assert(Object.values(druidVariant1Chosen.featureChoices||{}).some(choice=>choice.choiceKind==='favored-enemy'&&choice.choices?.[0]==='Animal'),'Druid Variant persists Favored Enemy');
assert(Object.values(druidVariant1Chosen.featureChoices||{}).some(choice=>choice.choiceKind==='animal-companion'&&choice.choices?.[0]==='Wolf'),'Druid Variant persists Animal Companion');
assert.equal(druidVariant1Chosen.grantedFeatures.find(feature=>feature.companionName==='Wolf')?.companionEffectiveDruidLevel,1,'Druid Variant companion scales at full class level');
assert.equal(classAutomationReport(druidVariant20).classes[0].descriptionComplete,true,'Druid Variant retained and replacement mechanics are fully described');
const druidVariantMulti=reconcileClassGrants({...druidVariant1Chosen,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:druidVariant35.catalogId,name:'Druid Variant',edition:'3.5',level:1,definition:druidVariant35}
],level:2,className:'Fighter',classDefinition:fighter35});
const druidVariantRemoved=removeClassProgression(druidVariantMulti,druidVariant35.catalogId);
assert(!druidVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===druidVariant35.catalogId),'Removing Druid Variant removes its source-owned features');
assert(!Object.values(druidVariantRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===druidVariant35.catalogId),'Removing Druid Variant removes its Favored Enemy selections');
assert(druidVariantRemoved.actions.some(action=>action.id==='manual-action')&&druidVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Druid Variant preserves unrelated manual data');

const reviewedCleric35=exact35('classes/cleric-91');
const cleric1=reconcileClassGrants(baseCharacter([{catalogId:reviewedCleric35.catalogId,name:'Cleric',edition:'3.5',level:1,definition:reviewedCleric35}]));
assert.equal(cleric1.grantedFeatures.find(feature=>feature.name==='Spontaneous Casting')?.descriptionSource,'rule-text');
assert.match(cleric1.grantedFeatures.find(feature=>/Deity, Domains/i.test(feature.name))?.description||'',/two permitted domains/i);
assert.match(cleric1.grantedFeatures.find(feature=>/Turn or Rebuke Undead/i.test(feature.name))?.description||'',/3 \+ your Charisma modifier times per day/i);

const clericVariant35=exact35('classes/cleric-variant-972');
const clericVariant20Base=baseCharacter([{catalogId:clericVariant35.catalogId,name:'Cleric Variant',edition:'3.5',level:20,definition:clericVariant35}]);
const clericVariant20=reconcileClassGrants(clericVariant20Base);
assert.equal(clericVariant35.inheritedFromClassId,'dndtools:classes/cleric-91','Cleric Variant binds the exact PHB Cleric source');
assert(!clericVariant20.grantedFeatures.some(feature=>/Turn or Rebuke Undead/i.test(feature.name)),'Cleric Variant removes Turn/Rebuke Undead');
for(const retained of ['Spells','Deity, Domains, and Domain Spells','Spontaneous Casting'])assert(clericVariant20.grantedFeatures.some(feature=>feature.name===retained),'Cleric Variant retains '+retained);
assert(clericVariant20.grantedFeatures.some(feature=>feature.name==='Aura of Courage'),'Cleric Variant gains Aura of Courage');
for(const proficiency of ['light-armor','medium-armor','heavy-armor','shields-except-tower','simple-weapons'])assert(clericVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Cleric Variant retains Cleric training: '+proficiency);
const clericVariant1={...clericVariant20Base,classLevels:[{...clericVariant20Base.classLevels[0],level:1}],level:1};
const clericVariant1Plan=featureChoicePlan(clericVariant1,null);
const clericEnergy=clericVariant1Plan.groups.find(group=>group.choiceKind==='cleric-energy');
const clericDomains=clericVariant1Plan.groups.find(group=>/Deity, Domains, and Domain Spells/i.test(group.label));
assert(clericEnergy,'Cleric Variant requires the source-defined positive/negative-energy polarity');
assert.deepEqual(clericEnergy.options,['Positive energy','Negative energy']);
assert(clericDomains,'Cleric Variant retains the Cleric deity/domain source choice');
const clericPositive=applyFeatureChoices(clericVariant1,null,{
  [clericEnergy.id]:['Positive energy'],
  [clericDomains.id]:['Pelor; Good, Healing']
});
assert(Object.values(clericPositive.featureChoices||{}).some(choice=>choice.choiceKind==='cleric-energy'&&choice.choices?.[0]==='Positive energy'));
assert(clericPositive.actions.some(action=>action.name==='Smite Evil'&&action.type==='Melee attack'),'Positive-energy Cleric Variant gains Smite Evil action');
assert(!clericPositive.actions.some(action=>action.name==='Smite Good'),'Positive-energy Cleric Variant does not gain Smite Good');
assert.equal(clericPositive.resources.find(resource=>resource.name==='Smite Evil')?.max,1,'Smite Evil starts at 1/day');
const clericPositive5=reconcileClassGrants({...clericPositive,classLevels:[{...clericPositive.classLevels[0],level:5}],level:5});
assert.equal(clericPositive5.resources.find(resource=>resource.name==='Smite Evil')?.max,2,'Smite Evil scales to 2/day at 5th level');
assert(clericPositive5.grantedFeatures.some(feature=>feature.name==='Aura of Courage'),'Aura of Courage is present by 3rd level');
assert.match(clericPositive5.grantedFeatures.find(feature=>feature.name==='Aura of Courage')?.description||'',/all(?:y|ies) within 10 feet|each ally within 10 feet/i);
const clericNegative=applyFeatureChoices(clericVariant1,null,{
  [clericEnergy.id]:['Negative energy'],
  [clericDomains.id]:['Nerull; Death, Evil']
});
assert(clericNegative.actions.some(action=>action.name==='Smite Good'),'Negative-energy Cleric Variant gains Smite Good');
assert(!clericNegative.actions.some(action=>action.name==='Smite Evil'),'Negative-energy Cleric Variant does not gain Smite Evil');
assert.equal(clericNegative.resources.find(resource=>resource.name==='Smite Good')?.max,1,'Smite Good starts at 1/day');
assert.equal(classAutomationReport(clericVariant20).classes[0].descriptionComplete,true,'Cleric Variant retained and replacement mechanics are fully described');
const clericVariantMulti=reconcileClassGrants({...clericPositive5,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:clericVariant35.catalogId,name:'Cleric Variant',edition:'3.5',level:5,definition:clericVariant35}
],level:6,className:'Fighter',classDefinition:fighter35});
const clericVariantRemoved=removeClassProgression(clericVariantMulti,clericVariant35.catalogId);
assert(!clericVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===clericVariant35.catalogId),'Removing Cleric Variant removes its source-owned features');
assert(!clericVariantRemoved.actions.some(action=>action.sourceClassId===clericVariant35.catalogId),'Removing Cleric Variant removes selected Smite action');
assert(!clericVariantRemoved.resources.some(resource=>resource.sourceClassId===clericVariant35.catalogId),'Removing Cleric Variant removes selected Smite resource');
assert(!Object.values(clericVariantRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===clericVariant35.catalogId),'Removing Cleric Variant removes its energy choice');
assert(clericVariantRemoved.actions.some(action=>action.id==='manual-action')&&clericVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Cleric Variant preserves unrelated manual data');

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

const abjurerVariant35=exact35('classes/abjurer-variant-960');
assert.equal(abjurerVariant35.inheritedFromClassId,'dndtools:classes/wizard-99','Abjurer Variant binds exact PHB Wizard');
assert.equal(abjurerVariant35.specialistSchool,'Abjuration');
assert.equal(abjurerVariant35.specialistBonusSlots,false);
const abjurer1Base=baseCharacter([{catalogId:abjurerVariant35.catalogId,name:'Abjurer Variant',edition:'3.5',level:1,definition:abjurerVariant35}]);
const abjurer1={...abjurer1Base,legacyCastingChoices:{[abjurerVariant35.catalogId]:{prohibited:['Evocation','Necromancy']}}};
assert.equal(validLegacyChoices(abjurer1),true,'Fixed Abjuration specialization requires two legal prohibited schools');
assert.equal(validLegacyChoices({...abjurer1,legacyCastingChoices:{[abjurerVariant35.catalogId]:{prohibited:['Evocation']}}}),false,'Abjurer fails closed until both prohibited schools are chosen');
assert.equal(prohibitedSpell(abjurer1,{school:'Evocation'}),true);
assert.equal(prohibitedSpell(abjurer1,{school:'Abjuration'}),false);
assert.equal(restrictedCastingOptions(abjurer1,{level:1,school:'Abjuration'},{standard:[0,2,0],restricted:[0,0,0]}).some(option=>option.pool==='specialist'),false,'Spontaneous Dispelling exchange removes normal specialist bonus slots');
const abjurer20=reconcileClassGrants({...abjurer1,classLevels:[{...abjurer1.classLevels[0],level:20}],level:20});
assert(!abjurer20.grantedFeatures.some(feature=>feature.name==='Familiar'),'Abjurer Variant removes Familiar');
assert(abjurer20.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===abjurerVariant35.catalogId),'Abjurer Variant retains Scribe Scroll');
assert(!abjurer20.grantedFeatures.some(feature=>/^Bonus Feat$/i.test(feature.name)),'Abjurer Variant removes later Wizard bonus feats');
for(const name of ['Resistance to Energy','Aura of Protection','Spontaneous Dispelling'])assert(abjurer20.grantedFeatures.some(feature=>feature.name===name),'Abjurer Variant gains '+name);
assert.equal(abjurer20.actions.find(action=>action.name==='Resistance to Energy')?.type,'Standard action');
assert.equal(abjurer20.resources.find(resource=>resource.name==='Resistance to Energy')?.max,1);
assert.equal(abjurer20.resources.find(resource=>resource.name==='Aura of Protection')?.max,4,'Aura of Protection scales to 4/day at 20th');
assert.equal(abjurer20.actions.find(action=>action.name==='Spontaneous Dispelling')?.type,'As spell or readied action');
for(const proficiency of ['club','dagger','crossbow-heavy','crossbow-light','quarterstaff'])assert(abjurer20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Abjurer Variant retains Wizard training: '+proficiency);
assert.equal(classAutomationReport(abjurer20).classes[0].descriptionComplete,true);
const abjurerMulti=reconcileClassGrants({...abjurer20,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:abjurerVariant35.catalogId,name:'Abjurer Variant',edition:'3.5',level:20,definition:abjurerVariant35}
],level:21,className:'Fighter',classDefinition:fighter35});
const abjurerRemoved=removeClassProgression(abjurerMulti,abjurerVariant35.catalogId);
assert(!abjurerRemoved.grantedFeatures.some(feature=>feature.sourceClassId===abjurerVariant35.catalogId));
assert(!abjurerRemoved.actions.some(action=>action.sourceClassId===abjurerVariant35.catalogId));
assert(!abjurerRemoved.resources.some(resource=>resource.sourceClassId===abjurerVariant35.catalogId));
assert(abjurerRemoved.actions.some(action=>action.id==='manual-action')&&abjurerRemoved.feats.some(feat=>feat.id==='manual-feat'));

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

const druid1Base=baseCharacter([{catalogId:reviewedDruid35.catalogId,name:'Druid',edition:'3.5',level:1,definition:reviewedDruid35}]);
const druid1Plan=featureChoicePlan(druid1Base,null);
const druidCompanion1=druid1Plan.groups.find(group=>group.choiceKind==='animal-companion');
assert(druidCompanion1,'Druid creation requests an Animal Companion');
assert(druidCompanion1.options.includes('Wolf')&&druidCompanion1.options.includes('Shark (Medium)'),'Druid starting companion list includes standard and aquatic source options');
assert(!druidCompanion1.options.includes('Ape')&&!druidCompanion1.options.includes('Crocodile'),'Druid level 1 excludes level-4 alternative companions');
const druidWolf=applyFeatureChoices(druid1Base,null,{[druidCompanion1.id]:['Wolf']});
const druidWolfFeature=druidWolf.grantedFeatures.find(feature=>feature.companionName==='Wolf');
assert.equal(druidWolfFeature?.baseEffectiveDruidLevel,1);
assert.equal(druidWolfFeature?.companionEffectiveDruidLevel,1);
assert.equal(druidWolfFeature?.companionProgression?.bonusHD,0);
assert.deepEqual(druidWolfFeature?.companionProgression?.specialAbilities,['Link','Share Spells']);
const druidWolfTrack=druidWolf.classProgressionTracks.find(track=>track.name==='Animal Companion'&&track.sourceClassId===reviewedDruid35.catalogId);
assert.equal(druidWolfTrack?.companionName,'Wolf');
assert.equal(druidWolfTrack?.bonusTricks,1);

const druid4Base=baseCharacter([{catalogId:reviewedDruid35.catalogId,name:'Druid',edition:'3.5',level:4,definition:reviewedDruid35}]);
const druid4Plan=featureChoicePlan(druid4Base,null);
const druidCompanion4=druid4Plan.groups.find(group=>group.choiceKind==='animal-companion');
assert(druidCompanion4?.options.includes('Ape')&&druidCompanion4?.options.includes('Crocodile'),'Druid level 4 unlocks -3 alternative companions');
assert(!druidCompanion4?.options.includes('Dire Wolf'),'Druid level 4 does not unlock level-7 alternatives');
const druidApePlan=featureChoicePlan(druid4Base,null,{[druidCompanion4.id]:['Ape']});
assert(Object.values(druidApePlan.patch.featureChoices||{}).some(choice=>choice.choiceKind==='animal-companion'&&choice.choices?.[0]==='Ape'),'The level-4 alternative companion selection is persisted independently of any other historical choices');
const druidApe=reconcileClassGrants({...druid4Base,...druidApePlan.patch});
const druidApeFeature=druidApe.grantedFeatures.find(feature=>feature.companionName==='Ape');
assert.equal(druidApeFeature?.baseEffectiveDruidLevel,4);
assert.equal(druidApeFeature?.companionLevelAdjustment,3);
assert.equal(druidApeFeature?.companionEffectiveDruidLevel,1,'Alternative companion penalty reduces effective companion level');

const reviewedBard35=exact35('classes/bard');
const bard20=reconcileClassGrants(baseCharacter([{catalogId:reviewedBard35.catalogId,name:'Bard',edition:'3.5',level:20,definition:reviewedBard35}]));
assert.equal(bard20.resources.find(resource=>resource.name==='Bardic Music')?.max,20,'Bardic Music tracks one use per Bard level');
assert(!bard20.resources.some(resource=>resource.name==='Bardic Knowledge'),'Bardic Knowledge has no invented daily-use resource');
for(const name of ['Countersong','Fascinate','Inspire Courage','Inspire Competence','Suggestion','Inspire Greatness','Song of Freedom','Inspire Heroics','Mass Suggestion'])assert(bard20.actions.some(action=>action.name===name),'Bard action automation: '+name);
assert.equal(bard20.actions.find(action=>action.name==='Song of Freedom')?.type,'1 minute');
for(const proficiency of ['light-armor','shields-except-tower','simple-weapons','longsword','rapier','sap','shortsword','shortbow','whip'])assert(bard20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Bard source training: '+proficiency);
assert.equal(classAutomationReport(bard20).classes[0].descriptionComplete,true,'Reviewed Bard features have self-contained source descriptions');

const bardVariant35=exact35('classes/bard-variant-951');
const bardVariant20Base=baseCharacter([{catalogId:bardVariant35.catalogId,name:'Bard Variant',edition:'3.5',level:20,definition:bardVariant35}]);
const bardVariant20=reconcileClassGrants(bardVariant20Base);
assert.equal(bardVariant35.inheritedFromClassId,'dndtools:classes/bard','Bard Variant binds the exact reviewed Bard source');
for(const removed of ['Bardic Knowledge','Inspire Courage','Inspire Competence','Inspire Greatness','Inspire Heroics'])assert(!bardVariant20.grantedFeatures.some(feature=>feature.name===removed),'Bard Variant removes '+removed);
for(const retained of ['Bardic Music','Countersong','Fascinate','Suggestion','Song of Freedom','Mass Suggestion'])assert(bardVariant20.grantedFeatures.some(feature=>feature.name===retained),'Bard Variant retains '+retained);
for(const gained of ['Animal Companion','Nature Sense','Wild Empathy','Resist Nature’s Lure'])assert(bardVariant20.grantedFeatures.some(feature=>feature.name===gained),'Bard Variant gains '+gained);
assert.equal(bardVariant20.resources.find(resource=>resource.name==='Bardic Music')?.max,20,'Bard Variant retains Bardic Music uses');
const bardVariant1={...bardVariant20Base,classLevels:[{...bardVariant20Base.classLevels[0],level:1}],level:1};
const bardVariant1Plan=featureChoicePlan(bardVariant1,null);
const bardVariantCompanion=bardVariant1Plan.groups.find(group=>group.choiceKind==='animal-companion');
assert(bardVariantCompanion?.options.includes('Wolf')&&!bardVariantCompanion.options.includes('Ape'),'Bard Variant receives full-level Druid companion eligibility');
const bardVariantWolf=applyFeatureChoices(bardVariant1,null,{[bardVariantCompanion.id]:['Wolf']});
assert.equal(bardVariantWolf.grantedFeatures.find(feature=>feature.companionName==='Wolf')?.companionEffectiveDruidLevel,1);
const bardVariantMulti=reconcileClassGrants({...bardVariantWolf,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:bardVariant35.catalogId,name:'Bard Variant',edition:'3.5',level:1,definition:bardVariant35}
],level:2,className:'Fighter',classDefinition:fighter35});
const bardVariantRemoved=removeClassProgression(bardVariantMulti,bardVariant35.catalogId);
assert(!Object.values(bardVariantRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===bardVariant35.catalogId),'Removing Bard Variant removes its companion choice');
assert(!bardVariantRemoved.classProgressionTracks.some(track=>track.sourceClassId===bardVariant35.catalogId),'Removing Bard Variant removes its companion track');
assert(bardVariantRemoved.actions.some(action=>action.id==='manual-action')&&bardVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Bard Variant preserves manual data');

const swVariantRaw=classes35.find(record=>record.sourceId==='classes/sorcererwizard-variant-957');
const swVariantUnresolved=annotateClassGrantKinds(swVariantRaw,reference35);
assert.equal(swVariantUnresolved.inheritanceRequired,true,'Sorcerer/Wizard Variant fails closed until its parent is chosen');
assert.deepEqual(swVariantUnresolved.inheritanceOptions.map(option=>option.name).sort(),['Sorcerer','Wizard']);
const swSorcerer35=annotateClassGrantKinds({...swVariantRaw,inheritanceChoice:'Sorcerer'},reference35);
const swWizard35=annotateClassGrantKinds({...swVariantRaw,inheritanceChoice:'Wizard'},reference35);
assert.equal(swSorcerer35.inheritedFromClassId,'dndtools:classes/sorcerer-98');
assert.equal(swWizard35.inheritedFromClassId,'dndtools:classes/wizard-99');
const swSorcerer8Base=baseCharacter([{catalogId:swSorcerer35.catalogId,name:'Sorcerer/Wizard Variant',edition:'3.5',level:8,definition:swSorcerer35}]);
const swSorcerer8=reconcileClassGrants(swSorcerer8Base);
assert(swSorcerer8.grantedFeatures.some(feature=>feature.name==='Spells'),'Sorcerer-parent variant retains Sorcerer spellcasting');
assert(!swSorcerer8.grantedFeatures.some(feature=>/^Familiar(?: Basics| Ability Descriptions)?$/.test(feature.name)),'Sorcerer-parent variant removes Familiar mechanics');
assert(swSorcerer8.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index==='simple-weapons'),'Sorcerer-parent variant retains Sorcerer training');
const swSorcerer8Plan=featureChoicePlan(swSorcerer8Base,null);
const swSorcererCompanion=swSorcerer8Plan.groups.find(group=>group.choiceKind==='animal-companion');
assert.equal(swSorcererCompanion?.effectiveDruidLevel,4,'Sorcerer/Wizard companion uses half class level');
assert(swSorcererCompanion?.options.includes('Ape')&&!swSorcererCompanion.options.includes('Dire Wolf'),'Half-level companion eligibility uses effective Druid level');
const swSorcererApe=applyFeatureChoices(swSorcerer8Base,null,{[swSorcererCompanion.id]:['Ape']});
const swApeFeature=swSorcererApe.grantedFeatures.find(feature=>feature.companionName==='Ape');
assert.equal(swApeFeature?.baseEffectiveDruidLevel,4);
assert.equal(swApeFeature?.companionLevelAdjustment,3);
assert.equal(swApeFeature?.companionEffectiveDruidLevel,1);

const swWizard8Base=baseCharacter([{catalogId:swWizard35.catalogId,name:'Sorcerer/Wizard Variant',edition:'3.5',level:8,definition:swWizard35}]);
const swWizard8=reconcileClassGrants(swWizard8Base);
assert(swWizard8.grantedFeatures.some(feature=>feature.name==='Spellbooks'),'Wizard-parent variant retains Wizard spellbook mechanics');
assert(swWizard8.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===swWizard35.catalogId),'Wizard-parent variant retains Scribe Scroll');
assert(!swWizard8.grantedFeatures.some(feature=>/^Familiar(?: Basics| Ability Descriptions)?$/.test(feature.name)),'Wizard-parent variant removes Familiar mechanics');
for(const proficiency of ['club','dagger','crossbow-heavy','crossbow-light','quarterstaff'])assert(swWizard8.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Wizard-parent variant retains Wizard training: '+proficiency);
const swWizard8Plan=featureChoicePlan(swWizard8Base,null);
const swWizardCompanion=swWizard8Plan.groups.find(group=>group.choiceKind==='animal-companion');
const swWizardWolfPlan=featureChoicePlan(swWizard8Base,null,{[swWizardCompanion.id]:['Wolf']});
assert(Object.values(swWizardWolfPlan.patch.featureChoices||{}).some(choice=>choice.choiceKind==='animal-companion'&&choice.choices?.[0]==='Wolf'),'Wizard-parent companion choice persists alongside any inherited Wizard choices');
const swWizardWolf=reconcileClassGrants({...swWizard8Base,...swWizardWolfPlan.patch});
assert.equal(swWizardWolf.grantedFeatures.find(feature=>feature.companionName==='Wolf')?.baseEffectiveDruidLevel,4);
assert.equal(swWizardWolf.grantedFeatures.find(feature=>feature.companionName==='Wolf')?.companionEffectiveDruidLevel,4);
assert.equal(swWizardWolf.grantedFeatures.find(feature=>feature.companionName==='Wolf')?.companionProgression?.bonusHD,2);
const swWizardMulti=reconcileClassGrants({...swWizardWolf,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:swWizard35.catalogId,name:'Sorcerer/Wizard Variant',edition:'3.5',level:8,definition:swWizard35}
],level:9,className:'Fighter',classDefinition:fighter35});
const swWizardRemoved=removeClassProgression(swWizardMulti,swWizard35.catalogId);
assert(!Object.values(swWizardRemoved.featureChoices||{}).some(choice=>choice.sourceClassId===swWizard35.catalogId),'Removing Sorcerer/Wizard Variant removes its companion choice');
assert(!swWizardRemoved.classProgressionTracks.some(track=>track.sourceClassId===swWizard35.catalogId),'Removing Sorcerer/Wizard Variant removes companion progression');

const reviewedRanger35=exact35('classes/ranger-96');
const ranger3=reconcileClassGrants(baseCharacter([{catalogId:reviewedRanger35.catalogId,name:'Ranger',edition:'3.5',level:3,definition:reviewedRanger35}]));
assert(ranger3.feats.some(feat=>feat.name==='Track'&&feat.sourceClassId===reviewedRanger35.catalogId),'Ranger Track is a class-granted feat');
assert(ranger3.feats.some(feat=>feat.name==='Endurance'&&feat.sourceClassId===reviewedRanger35.catalogId),'Ranger Endurance is a class-granted feat');
assert.equal(ranger3.grantedFeatures.find(feature=>feature.name==='Combat Style')?.kind,'choice','Ranger combat style remains a guided class choice');
const fighterVariant35=exact35('classes/fighter-variant-953');
const fighterVariant20=reconcileClassGrants(baseCharacter([{catalogId:fighterVariant35.catalogId,name:'Fighter Variant',edition:'3.5',level:20,definition:fighterVariant35}]));
assert.equal(fighterVariant35.inheritedFromClassId,'dndtools:classes/fighter-93','Fighter Variant binds the exact reviewed Fighter source rather than a same-name record');
assert(!fighterVariant20.grantedFeatures.some(feature=>/^Bonus Feats?$/i.test(feature.name)),'Fighter Variant removes Fighter bonus feats');
const fighterVariantSneak=fighterVariant20.grantedFeatures.find(feature=>feature.name==='Sneak Attack');
assert.equal(fighterVariantSneak?.descriptionSource,'rule-text');
assert.deepEqual(fighterVariantSneak?.progressionHistory?.map(event=>event.level),[1,3,5,7,9,11,13,15,17,19]);
assert.match(fighterVariantSneak?.description||'',/reaching \+10d6 at 19th level/i);
assert(!/\bas rogue\b/i.test(fighterVariantSneak?.description||''),'Fighter Variant Sneak Attack description is standalone');
assert.match(fighterVariantSneak?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/rogue/i);
for(const proficiency of ['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons'])assert(fighterVariant20.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Fighter Variant retains Fighter training: '+proficiency);

const rogueVariant35=exact35('classes/rogue-variant-958');
const rogueVariant20=reconcileClassGrants(baseCharacter([{catalogId:rogueVariant35.catalogId,name:'Rogue Variant',edition:'3.5',level:20,definition:rogueVariant35}]));
assert.equal(rogueVariant35.inheritedFromClassId,'dndtools:classes/rogue-97','Rogue Variant binds the exact reviewed Rogue source rather than a same-name record');
assert(!rogueVariant20.grantedFeatures.some(feature=>feature.name==='Sneak Attack'),'Rogue Variant removes Rogue sneak attack');
const rogueVariantBonus=rogueVariant20.grantedFeatures.find(feature=>/^Bonus Feats?$/i.test(feature.name));
assert.equal(rogueVariantBonus?.kind,'choice');
assert.deepEqual(rogueVariantBonus?.progressionHistory?.map(event=>event.level),[1,2,4,6,8,10,12,14,16,18,20]);
assert(rogueVariantBonus?.choiceOptions?.includes('Power Attack'));
assert(!rogueVariantBonus?.choiceOptions?.includes('Alertness'));
assert.match(rogueVariantBonus?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/fighter/i);
assert(!/\bas fighter\b/i.test(rogueVariantBonus?.description||''),'Rogue Variant bonus-feat description is standalone');

const wizardVariant35=exact35('classes/wizard-variant-959');
const wizardVariant20=reconcileClassGrants(baseCharacter([{catalogId:wizardVariant35.catalogId,name:'Wizard Variant',edition:'3.5',level:20,definition:wizardVariant35}]));
assert.equal(wizardVariant35.inheritedFromClassId,'dndtools:classes/wizard-99','Wizard Variant binds the exact reviewed Wizard source rather than a same-name record');
assert(!wizardVariant20.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===wizardVariant35.catalogId),'Wizard Variant removes Scribe Scroll');
const wizardVariantBonus=wizardVariant20.grantedFeatures.find(feature=>/^Bonus Feats?$/i.test(feature.name));
assert.equal(wizardVariantBonus?.kind,'choice');
assert.deepEqual(wizardVariantBonus?.progressionHistory?.map(event=>event.level),[1,5,10,15,20]);
assert(wizardVariantBonus?.choiceOptions?.includes('Power Attack'));
assert(!wizardVariantBonus?.choiceOptions?.includes('Alertness'));
assert.match(wizardVariantBonus?.description||'',/1st level.*5th.*10th.*15th.*20th/i);
assert(!/\bas fighter\b/i.test(wizardVariantBonus?.description||''),'Wizard Variant bonus-feat description is standalone');
assert(wizardVariant20.grantedFeatures.some(feature=>feature.name==='Spells'),'Wizard Variant retains Wizard spellcasting');
assert(wizardVariant20.grantedFeatures.some(feature=>feature.name==='Familiar'),'Wizard Variant retains Familiar');

const fighterVariantMulti=reconcileClassGrants({...fighterVariant20,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:fighterVariant35.catalogId,name:'Fighter Variant',edition:'3.5',level:20,definition:fighterVariant35}
],level:21,className:'Fighter',classDefinition:fighter35});
const fighterVariantRemoved=removeClassProgression(fighterVariantMulti,fighterVariant35.catalogId);
assert(!fighterVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===fighterVariant35.catalogId),'Removing Fighter Variant removes its source-owned Sneak Attack progression');
assert(fighterVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===fighter35.catalogId),'Removing Fighter Variant preserves the unrelated Fighter class');
assert(fighterVariantRemoved.actions.some(action=>action.id==='manual-action')&&fighterVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Fighter Variant preserves manual data');

const rogueVariantBase=baseCharacter([{catalogId:rogueVariant35.catalogId,name:'Rogue Variant',edition:'3.5',level:2,definition:rogueVariant35}]);
const rogueVariantPlan=featureChoicePlan(rogueVariantBase,null);
const rogueVariantPicks=Object.fromEntries(rogueVariantPlan.groups.map((group,index)=>[group.id,[index?'Combat Expertise':'Power Attack']]));
const rogueVariantChosen=applyFeatureChoices(rogueVariantBase,null,rogueVariantPicks);
const rogueVariantMulti=reconcileClassGrants({...rogueVariantChosen,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:rogueVariant35.catalogId,name:'Rogue Variant',edition:'3.5',level:2,definition:rogueVariant35}
],level:3,className:'Fighter',classDefinition:fighter35});
const rogueVariantRemoved=removeClassProgression(rogueVariantMulti,rogueVariant35.catalogId);
assert(!rogueVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===rogueVariant35.catalogId),'Removing Rogue Variant removes its source-owned replacement progression');
assert(!rogueVariantRemoved.feats.some(feat=>feat.sourceType==='class-choice'&&feat.sourceClassId===rogueVariant35.catalogId),'Removing Rogue Variant removes its selected Fighter-list bonus feats');
assert(rogueVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Rogue Variant preserves manual feats');

const wizardVariantBase=baseCharacter([{catalogId:wizardVariant35.catalogId,name:'Wizard Variant',edition:'3.5',level:5,definition:wizardVariant35}]);
const wizardVariantPlan=featureChoicePlan(wizardVariantBase,null);
assert(wizardVariantPlan.groups.some(group=>group.choiceKind==='familiar'),'Wizard Variant retains the inherited Wizard familiar');
const wizardVariantPicks=Object.fromEntries(wizardVariantPlan.groups.map((group,index)=>[group.id,[group.choiceKind==='familiar'?'Raven':index?'Combat Expertise':'Power Attack']]));
const wizardVariantChosen=applyFeatureChoices(wizardVariantBase,null,wizardVariantPicks);
const wizardVariantMulti=reconcileClassGrants({...wizardVariantChosen,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:wizardVariant35.catalogId,name:'Wizard Variant',edition:'3.5',level:5,definition:wizardVariant35}
],level:6,className:'Fighter',classDefinition:fighter35});
const wizardVariantRemoved=removeClassProgression(wizardVariantMulti,wizardVariant35.catalogId);
assert(!wizardVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===wizardVariant35.catalogId),'Removing Wizard Variant removes its source-owned replacement progression');
assert(!wizardVariantRemoved.feats.some(feat=>feat.sourceType==='class-choice'&&feat.sourceClassId===wizardVariant35.catalogId),'Removing Wizard Variant removes its selected Fighter-list bonus feats');
assert(wizardVariantRemoved.actions.some(action=>action.id==='manual-action'),'Removing Wizard Variant preserves manual actions');

const rangerVariant35=exact35('classes/ranger-variant-956');
const rangerVariant18=reconcileClassGrants(baseCharacter([{catalogId:rangerVariant35.catalogId,name:'Ranger Variant',edition:'3.5',level:18,definition:rangerVariant35}]));
assert.equal(rangerVariant35.inheritedFromClassId,'dndtools:classes/ranger-96','Ranger Variant binds the exact reviewed Ranger source');
for(const removed of ['Combat Style','Improved Combat Style','Combat Style Mastery'])assert(!rangerVariant18.grantedFeatures.some(feature=>feature.name===removed),'Ranger Variant removes '+removed);
for(const retained of ['Favored Enemy','Track','Endurance'])assert(rangerVariant18.grantedFeatures.some(feature=>feature.name===retained)||rangerVariant18.feats.some(feat=>feat.name===retained),'Ranger Variant retains Ranger mechanic: '+retained);
const rangerVariantFast=rangerVariant18.grantedFeatures.find(feature=>feature.name==='Fast Movement');
assert.equal(rangerVariantFast?.descriptionSource,'rule-text');
assert.match(rangerVariantFast?.description||'',/land speed increases by 10 feet/i);
assert.match(rangerVariantFast?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/barbarian/i);
const rangerVariantWild=rangerVariant18.grantedFeatures.find(feature=>feature.name==='Wild Shape');
assert.equal(rangerVariantWild?.descriptionSource,'rule-text');
assert.deepEqual(rangerVariantWild?.progressionHistory?.map(event=>event.level),[5,6,7,10,14,18]);
assert.match(rangerVariantWild?.description||'',/Small or Medium animal/i);
assert.match(rangerVariantWild?.description||'',/do not gain.*Large.*Tiny.*Huge.*plant.*elemental/i);
assert.match(rangerVariantWild?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/druid/i);
assert.equal(rangerVariant18.actions.find(action=>action.name==='Wild Shape')?.type,'Standard action');
assert.equal(rangerVariant18.resources.find(resource=>resource.name==='Wild Shape')?.max,6);
const rangerVariant5=reconcileClassGrants(baseCharacter([{catalogId:rangerVariant35.catalogId,name:'Ranger Variant',edition:'3.5',level:5,definition:rangerVariant35}]));
assert.equal(rangerVariant5.resources.find(resource=>resource.name==='Wild Shape')?.max,1);
const rangerVariant10=reconcileClassGrants(baseCharacter([{catalogId:rangerVariant35.catalogId,name:'Ranger Variant',edition:'3.5',level:10,definition:rangerVariant35}]));
assert.equal(rangerVariant10.resources.find(resource=>resource.name==='Wild Shape')?.max,4);
for(const proficiency of ['light-armor','shields-except-tower','simple-weapons','martial-weapons'])assert(rangerVariant18.trainingGrants.flatMap(grant=>grant.proficiencies||[]).some(item=>item.index===proficiency),'Ranger Variant retains Ranger training: '+proficiency);
assert.equal(classAutomationReport(rangerVariant18).classes[0].descriptionComplete,true,'Ranger Variant retained and replacement mechanics are fully described');
const rangerVariantMulti=reconcileClassGrants({...rangerVariant18,classLevels:[
  {catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35},
  {catalogId:rangerVariant35.catalogId,name:'Ranger Variant',edition:'3.5',level:18,definition:rangerVariant35}
],level:19,className:'Fighter',classDefinition:fighter35});
const rangerVariantRemoved=removeClassProgression(rangerVariantMulti,rangerVariant35.catalogId);
assert(!rangerVariantRemoved.grantedFeatures.some(feature=>feature.sourceClassId===rangerVariant35.catalogId),'Removing Ranger Variant removes its Fast Movement and Wild Shape features');
assert(!rangerVariantRemoved.actions.some(action=>action.sourceClassId===rangerVariant35.catalogId),'Removing Ranger Variant removes its Wild Shape action');
assert(!rangerVariantRemoved.resources.some(resource=>resource.sourceClassId===rangerVariant35.catalogId),'Removing Ranger Variant removes its Wild Shape resource');
assert(rangerVariantRemoved.actions.some(action=>action.id==='manual-action')&&rangerVariantRemoved.feats.some(feat=>feat.id==='manual-feat'),'Removing Ranger Variant preserves unrelated manual data');

const wildernessRogue35=exact35('classes/wilderness-rogue-136');
const wildernessRogue16Base=baseCharacter([{catalogId:wildernessRogue35.catalogId,name:'Wilderness Rogue',edition:'3.5',level:16,definition:wildernessRogue35}]);
const wildernessRogue16=reconcileClassGrants({
  ...wildernessRogue16Base,
  featureChoices:{
    'wr-10':{sourceClassId:wildernessRogue35.catalogId,classId:wildernessRogue35.catalogId,className:'Wilderness Rogue',edition:'3.5',level:10,feature:'Special Abilities',choices:['Woodland Stride'],choiceKind:'source'},
    'wr-13':{sourceClassId:wildernessRogue35.catalogId,classId:wildernessRogue35.catalogId,className:'Wilderness Rogue',edition:'3.5',level:13,feature:'Special Abilities',choices:['Camouflage'],choiceKind:'source'},
    'wr-16':{sourceClassId:wildernessRogue35.catalogId,classId:wildernessRogue35.catalogId,className:'Wilderness Rogue',edition:'3.5',level:16,feature:'Special Abilities',choices:['Hide in Plain Sight'],choiceKind:'source'}
  }
});
for(const skill of ['Handle Animal','Knowledge (geography)','Knowledge (nature)','Ride','Survival'])assert.equal(legacyClassSkillStatus(wildernessRogue16,skill).classSkill,true,'Wilderness Rogue adds '+skill);
for(const skill of ['Appraise','Diplomacy','Decipher Script','Forgery','Gather Information'])assert.equal(legacyClassSkillStatus(wildernessRogue16,skill).classSkill,false,'Wilderness Rogue removes '+skill);
const wildernessTraining=wildernessRogue16.trainingGrants.find(item=>item.sourceClassId===wildernessRogue35.catalogId)?.proficiencies.map(item=>item.index)||[];
for(const proficiency of ['light-armor','simple-weapons','crossbow-hand','rapier','sap','shortbow','shortsword'])assert(wildernessTraining.includes(proficiency),'Wilderness Rogue retains Rogue training: '+proficiency);
const wildernessSpecial=wildernessRogue16.grantedFeatures.find(feature=>/^Special Abilit(?:y|ies)$/i.test(feature.name));
assert.equal(wildernessSpecial?.kind,'choice');
for(const option of ['Crippling Strike','Woodland Stride','Camouflage','Hide in Plain Sight'])assert(wildernessSpecial?.choiceOptions?.includes(option),'Wilderness Rogue Special Abilities includes '+option);
const woodland=wildernessRogue16.grantedFeatures.find(feature=>feature.name==='Woodland Stride'&&feature.selectedFromFeature==='Special Abilities');
const camouflage=wildernessRogue16.grantedFeatures.find(feature=>feature.name==='Camouflage'&&feature.selectedFromFeature==='Special Abilities');
const hidePlain=wildernessRogue16.grantedFeatures.find(feature=>feature.name==='Hide in Plain Sight'&&feature.selectedFromFeature==='Special Abilities');
assert.match(woodland?.description||'',/natural undergrowth/i);
assert.match(camouflage?.description||'',/cover or concealment/i);
assert.match(hidePlain?.description||'',/while being observed/i);
assert.match(hidePlain?.referencedSourceUrl||'',/d20srd\.org\/srd\/classes\/ranger/i);
const wildernessWithFighter={...wildernessRogue16,classLevels:[...wildernessRogue16.classLevels,{catalogId:fighter35.catalogId,name:'Fighter',edition:'3.5',level:1,definition:fighter35}],level:17,grantedFeatures:[...(wildernessRogue16.grantedFeatures||[]),{id:'manual-feature',name:'Manual Feature',description:'Keep me.'}]};
const wildernessRemoved=removeClassProgression(wildernessWithFighter,wildernessRogue35.catalogId);
assert(!wildernessRemoved.grantedFeatures.some(feature=>feature.sourceClassId===wildernessRogue35.catalogId),'Removing Wilderness Rogue removes its selected option mechanics');
assert(wildernessRemoved.grantedFeatures.some(feature=>feature.id==='manual-feature'),'Removing Wilderness Rogue preserves unrelated manual features');
const reviewedFavoredSoulBaseline35=exact35('classes/favored-soul-7');
const favoredSoul5=reconcileClassGrants(baseCharacter([{catalogId:reviewedFavoredSoulBaseline35.catalogId,name:'Favored Soul',edition:'3.5',level:5,definition:reviewedFavoredSoulBaseline35}]));
assert.equal(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Spells')?.descriptionSource,'rule-text');
assert.match(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Charisma/i);
assert.equal(favoredSoul5.grantedFeatures.find(feature=>feature.name==='Energy Resistance')?.kind,'choice','Favored Soul energy resistance remains a source-defined choice');
assert(!favoredSoul5.feats.some(feat=>/^Weapon Focus$/i.test(feat.name)),'Favored Soul does not invent a deity weapon feat without a weapon');

const reviewedCloistered35=exact35('classes/cloistered-cleric-120');
const cloistered1=reconcileClassGrants(baseCharacter([{catalogId:reviewedCloistered35.catalogId,name:'Cloistered Cleric',edition:'3.5',level:1,definition:reviewedCloistered35}]));
assert.equal(cloistered1.grantedFeatures.find(feature=>feature.name==='Lore')?.descriptionSource,'rule-text');
assert.match(cloistered1.grantedFeatures.find(feature=>/Deity, Domains/i.test(feature.name))?.description||'',/Knowledge domain/i);
assert.match(cloistered1.grantedFeatures.find(feature=>feature.name==='Spellcasting')?.description||'',/additional source-listed spells/i);
const cloisteredTraining=cloistered1.trainingGrants.find(grant=>grant.sourceClassId===reviewedCloistered35.catalogId);
assert.deepEqual((cloisteredTraining?.proficiencies||[]).map(item=>item.index).sort(),['light-armor','simple-weapons'],'Cloistered Cleric keeps only source-verified simple weapons and light armor');
assert.equal(cloisteredTraining?.sourceUrl,'https://new.dndtools.org/classes/cloistered-cleric-120','Cloistered Cleric training retains exact source provenance');
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

const binder35=exact35('classes/binder-112');
const binder1=reconcileClassGrants(baseCharacter([{catalogId:binder35.catalogId,name:'Binder',edition:'3.5',level:1,definition:binder35}]));
assert.deepEqual(binder1.trainingGrants.find(item=>item.sourceClassId===binder35.catalogId)?.proficiencies.map(item=>item.index).sort(),['light-armor','simple-weapons'],'Binder receives exact Tome of Magic starting training');
for(const skill of ['Bluff','Concentration','Decipher Script','Knowledge (arcana)','Knowledge (religion)','Knowledge (the planes)','Sense Motive'])assert.equal(legacyClassSkillStatus(binder1,skill).classSkill,true,'Binder class skill: '+skill);
assert.equal(classAutomationReport(binder1).classes[0].descriptionComplete,false,'Binder remains explicitly incomplete until binding/vestige mechanics receive reviewed structured automation');
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
const reviewedHealer35=exact35('classes/healer-77');
const healer20=reconcileClassGrants(baseCharacter([{catalogId:reviewedHealer35.catalogId,name:'Healer',edition:'3.5',level:20,definition:reviewedHealer35}]));
assert(healer20.feats.some(feat=>feat.name==='Skill Focus (Heal)'&&feat.sourceClassId===reviewedHealer35.catalogId),'Healer grants Skill Focus (Heal)');
for(const name of ['Cleanse Paralysis','Cleanse Disease','Cleanse Fear','Cleanse Poison','Cleanse Blindness','Cleanse Spirit','Cleanse Petrification','New Limb'])assert.equal(healer20.resources.find(resource=>resource.name===name)?.max,1,`Healer tracks ${name} once per day`);
assert.equal(healer20.actions.find(action=>action.name==='Unicorn Companion')?.type,'Full-round action');
assert.equal(healer20.resources.find(resource=>resource.name==='Unicorn Companion')?.max,1);
assert.equal(healer20.resources.find(resource=>resource.name==='New Life')?.max,1);
assert.equal(healer20.resources.find(resource=>resource.name==='New Life')?.reset,'none');
assert.match(healer20.resources.find(resource=>resource.name==='New Life')?.recoveryText||'',/once per week/i);
assert.match(healer20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Prepare divine spells/i);
assert.match(healer20.grantedFeatures.find(feature=>feature.name==='Healing Hands')?.description||'',/Charisma modifier/i);
const reviewedShugenja35=exact35('classes/shugenja-8');
const shugenja20=reconcileClassGrants(baseCharacter([{catalogId:reviewedShugenja35.catalogId,name:'Shugenja',edition:'3.5',level:20,definition:reviewedShugenja35}]));
assert.equal(shugenja20.grantedFeatures.find(feature=>feature.name==='Element Focus')?.kind,'choice');
assert.equal(shugenja20.actions.find(action=>action.name==='Sense Elements')?.type,'Full-round action');
assert.equal(shugenja20.resources.find(resource=>resource.name==='Sense Elements')?.max,7);
assert.match(shugenja20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Charisma/i);
assert.match(shugenja20.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/cannot use Quicken Spell/i);
const reviewedWuJen35=exact35('classes/wu-jen-6');
const wuJen18=reconcileClassGrants(baseCharacter([{catalogId:reviewedWuJen35.catalogId,name:'Wu Jen',edition:'3.5',level:18,definition:reviewedWuJen35}]));
assert.equal(wuJen18.resources.find(resource=>resource.name==='Watchful Spirit')?.max,1);
assert.equal(wuJen18.grantedFeatures.find(feature=>feature.name==='Bonus Feat')?.choiceKind,'feat');
assert.deepEqual(wuJen18.grantedFeatures.find(feature=>feature.name==='Spell Secret')?.choiceLevels,[3,9,12,15,18]);
assert.deepEqual(wuJen18.grantedFeatures.find(feature=>feature.name==='Taboos')?.choiceLevels,[1,3,9,12,15,18]);
assert.deepEqual(wuJen18.grantedFeatures.find(feature=>feature.name==='Elemental Mastery')?.choiceOptionsByLevel?.['6'],['Earth','Fire','Metal','Water','Wood']);
assert.match(wuJen18.grantedFeatures.find(feature=>feature.name==='Spellbooks')?.description||'',/two spells/i);
assert.match(wuJen18.grantedFeatures.find(feature=>feature.name==='Spells')?.description||'',/Intelligence/i);
const reviewedFactotum35=exact35('classes/factotum-35');
const factotum20=reconcileClassGrants(baseCharacter([{catalogId:reviewedFactotum35.catalogId,name:'Factotum',edition:'3.5',level:20,definition:reviewedFactotum35}]));
assert.equal(factotum20.resources.find(resource=>resource.name==='Inspiration')?.max,10);
assert.equal(factotum20.resources.find(resource=>resource.name==='Inspiration')?.reset,'encounter');
assert.equal(factotum20.actions.find(action=>action.name==='Cunning Defense')?.type,'Free action');
assert.equal(factotum20.actions.find(action=>action.name==='Cunning Breach')?.type,'Free action');
assert.equal(factotum20.actions.find(action=>action.name==='Cunning Dodge')?.type,'Immediate action');
assert.equal(factotum20.resources.find(resource=>resource.name==='Cunning Dodge')?.max,1);
assert.equal(factotum20.resources.find(resource=>resource.name==='Opportunistic Piety')?.max,8,'Factotum Opportunistic Piety is base uses plus positive Wisdom bonus');
assert.equal(factotum20.resources.find(resource=>resource.name==='Cunning Brilliance')?.max,3);
assert.match(factotum20.grantedFeatures.find(feature=>feature.name==='Arcane Dilettante')?.description||'',/distinct sorcerer\/wizard spells/i);

const lowWisFactotum={...baseCharacter([{catalogId:reviewedFactotum35.catalogId,name:'Factotum',edition:'3.5',level:5,definition:reviewedFactotum35}]),abilities:{str:14,dex:14,con:14,int:16,wis:8,cha:12}};
const lowWisFactotum5=reconcileClassGrants(lowWisFactotum);
assert.equal(lowWisFactotum5.resources.find(resource=>resource.name==='Opportunistic Piety')?.max,3,'negative Wisdom does not reduce Opportunistic Piety base uses');
const reviewedDragonfireAdept35=exact35('classes/dragonfire-adept-29');
const dragonfire20=reconcileClassGrants(baseCharacter([{catalogId:reviewedDragonfireAdept35.catalogId,name:'Dragonfire Adept',edition:'3.5',level:20,definition:reviewedDragonfireAdept35}]));
assert.equal(dragonfire20.actions.find(action=>action.name==='Breath Weapon')?.type,'Standard action');
assert(dragonfire20.feats.some(feat=>feat.name==='Dragontouched'&&feat.sourceClassId===reviewedDragonfireAdept35.catalogId),'Dragonfire Adept grants Dragontouched');
assert.equal(dragonfire20.grantedFeatures.find(feature=>feature.name==='Breath Effect')?.kind,'choice');
assert.deepEqual(dragonfire20.grantedFeatures.find(feature=>feature.name==='Breath Effect')?.choiceLevels,[2,5,10,12,15,20]);
assert.match(dragonfire20.grantedFeatures.find(feature=>feature.name==='Invocations')?.description||'',/at will/i);
assert.match(dragonfire20.grantedFeatures.find(feature=>feature.name==='Invocations')?.description||'',/dark at 16th/i);
assert.match(dragonfire20.grantedFeatures.find(feature=>feature.name==='Damage Reduction')?.description||'',/5\/magic/i);
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
// Source-equivalent campaign-setting reprints reuse already-verified base-class mechanics.
// Keep this as a batch invariant: no reprint may silently drift from its reviewed profile.
const sourceEquivalent35Profiles=[
  ['classes/barbarian-37','classes/barbarian-89'],
  ['classes/barbarian-61','classes/barbarian-89'],
  ['classes/barbarian-104','classes/barbarian-89'],
  ['classes/fighter-41','classes/fighter-93'],
  ['classes/fighter-65','classes/fighter-93'],
  ['classes/ranger-44','classes/ranger-96'],
  ['classes/ranger-68','classes/ranger-96'],
  ['classes/ranger-108','classes/ranger-96'],
  ['classes/cleric-39','classes/cleric-91'],
  ['classes/cleric-63','classes/cleric-91'],
  ['classes/cleric-105','classes/cleric-91'],
  ['classes/druid-40','classes/druid-92'],
  ['classes/druid-64','classes/druid-92'],
  ['classes/druid-106','classes/druid-92'],
  ['classes/monk-42','classes/monk-94'],
  ['classes/monk-66','classes/monk-94'],
  ['classes/paladin-43','classes/paladin-95'],
  ['classes/paladin-67','classes/paladin-95'],
  ['classes/paladin-107','classes/paladin-95'],
  ['classes/rogue-45','classes/rogue-97'],
  ['classes/rogue-69','classes/rogue-97'],
  ['classes/sorcerer-46','classes/sorcerer-98'],
  ['classes/sorcerer-70','classes/sorcerer-98'],
  ['classes/sorcerer-109','classes/sorcerer-98'],
  ['classes/wizard-47','classes/wizard-99'],
  ['classes/wizard-71','classes/wizard-99'],
  ['classes/wizard-110','classes/wizard-99'],
  ['classes/favored-soul-76','classes/favored-soul-7'],
  ['classes/warmage-79','classes/warmage-5']
];
const mechanicsSnapshot35=sheet=>({
  features:(sheet.grantedFeatures||[]).map(item=>item.name).sort(),
  actions:(sheet.actions||[]).map(item=>item.name).sort(),
  feats:(sheet.feats||[]).map(item=>item.name).sort(),
  resources:(sheet.resources||[]).map(item=>[item.name,item.max]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),
  tracks:(sheet.classProgressionTracks||[]).map(item=>[item.name,String(item.value)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),
  slots:(sheet.classSpellSlots||[]).map(item=>item.slots),
  training:(sheet.trainingGrants||[]).flatMap(grant=>grant.proficiencies||[]).map(item=>item.index).sort()
});
for(const [sourceId,profileId] of sourceEquivalent35Profiles){
  const record=annotateClassGrantKinds(classes35.find(item=>item.sourceId===sourceId),reference35);
  const profile=annotateClassGrantKinds(classes35.find(item=>item.sourceId===profileId),reference35);
  assert(record,sourceId+' exists');
  assert(profile,profileId+' exists');
  assert.equal(record.proficiencyProfileFrom,profileId,sourceId+' keeps verified profile provenance');
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name:record.name,edition:'3.5',level:20,definition:record}]));
  const profileSheet=reconcileClassGrants(baseCharacter([{catalogId:profile.catalogId,name:profile.name,edition:'3.5',level:20,definition:profile}]));
  assert.deepEqual(mechanicsSnapshot35(sheet),mechanicsSnapshot35(profileSheet),sourceId+' reconciles identically to '+profileId);
  const report=classAutomationReport(sheet).classes[0];
  assert.equal(report.progressionComplete,true,sourceId+' has complete inherited progression');
  assert.equal(report.descriptionReady,true,sourceId+' has descriptions for all granted features');
  assert.equal(report.descriptionComplete,true,sourceId+' uses reviewed rule text rather than progression summaries: '+(sheet.grantedFeatures||[]).filter(item=>item.descriptionSource==='progression').map(item=>item.name).join(', '));
  assert.equal(report.complete,true,sourceId+' has no structural automation gap');
}

// Straightforward reviewed NPC/campaign classes: rule text, training, choices, and structural completeness.
for(const sourceId of ['classes/adept-917','classes/magewright-1029','classes/expert2-124','classes/warrior2-135']){
  const record=annotateClassGrantKinds(classes35.find(item=>item.sourceId===sourceId),reference35);
  assert(record,sourceId+' exists');
  const sheet=reconcileClassGrants(baseCharacter([{catalogId:record.catalogId,name:record.name,edition:'3.5',level:20,definition:record}]));
  const report=classAutomationReport(sheet).classes[0];
  assert.equal(report.progressionComplete,true,sourceId+' progression complete');
  assert.equal(report.descriptionReady,true,sourceId+' descriptions ready');
  assert.equal(report.descriptionComplete,true,sourceId+' uses reviewed descriptions: '+(sheet.grantedFeatures||[]).filter(item=>item.descriptionSource==='progression').map(item=>item.name).join(', '));
  assert.equal(report.complete,true,sourceId+' has no structural automation gap');
}
const genericExpert=annotateClassGrantKinds(classes35.find(item=>item.sourceId==='classes/expert2-124'),reference35);
const genericExpertSheet=reconcileClassGrants(baseCharacter([{catalogId:genericExpert.catalogId,name:genericExpert.name,edition:'3.5',level:20,definition:genericExpert}]));
assert(genericExpertSheet.classSkillRules35.length===1,'generic Expert preserves dynamic class-skill rule');
assert.equal(genericExpertSheet.classAutomation.classes[0].proficiencyChoices.length,1,'generic Expert requires its one martial-weapon proficiency choice');
const genericWarrior=annotateClassGrantKinds(classes35.find(item=>item.sourceId==='classes/warrior2-135'),reference35);
const genericWarriorSheet=reconcileClassGrants(baseCharacter([{catalogId:genericWarrior.catalogId,name:genericWarrior.name,edition:'3.5',level:20,definition:genericWarrior}]));
assert(genericWarriorSheet.classSkillRules35.length===1,'generic Warrior preserves dynamic class-skill rule');

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

// Source-reviewed XPH Soulknife and Complete Warrior Samurai.
const soulknife35=exact35('classes/soulknife-139'),samurai35=exact35('classes/samurai-22');
const classSheet=(definition,level)=>reconcileClassGrants(baseCharacter([{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}]));
for(let level=1;level<=20;level++){
  const soulknife=classSheet(soulknife35,level),samurai=classSheet(samurai35,level);
  assert.equal(soulknife.actions.find(action=>action.name==='Mind Blade')?.type,level<5?'Move action':'Free action',`Soulknife ${level} creation timing`);
  assert.equal(soulknife.grantedFeatures.filter(feature=>feature.name==='Mind Blade').length,1,'enhancement prefixes coalesce into the original Mind Blade');
  assert(!soulknife.grantedFeatures.some(feature=>/^\+\d+ Mind Blade$/i.test(feature.name)),'no duplicate enhancement-only features');
  assert.equal(soulknife.grantedFeatures.find(feature=>feature.name==='Mind Blade')?.progressionHistory.length,1+Math.floor(level/4));
  for(const [name,threshold] of [['Weapon Focus (mind blade)',1],['Wild Talent',1],['Speed of Thought',6],['Greater Weapon Focus (mind blade)',9]]){
    assert.equal(soulknife.feats.filter(feat=>feat.name===name&&feat.sourceClassId===soulknife35.catalogId).length,Number(level>=threshold),`${name} unlocks at ${threshold}`);
  }
  for(const [name,threshold,type] of [['Throw Mind Blade',2,'Ranged attack'],['Psychic Strike',3,'Move action'],['Shape Mind Blade',5,'Full-round action'],['Bladewind',9,'Full-round action']]){
    assert.equal(soulknife.actions.find(action=>action.name===name)?.type,level>=threshold?type:undefined,`${name} timing at ${level}`);
  }
  assert.equal(soulknife.resources.length,0,'at-will blade abilities do not invent daily counters');
  const smite=samurai.resources.find(resource=>resource.name==='Kiai Smite');
  assert.equal(smite?.max,level<3?undefined:level<7?1:level<12?2:level<17?3:4,`Kiai Smite uses at ${level}`);
  assert.equal(samurai.actions.find(action=>action.name==='Kiai Smite')?.type,level>=3?'Free action':undefined);
  for(const [name,threshold] of [['Staredown',6],['Mass Staredown',10]]){
    assert.equal(samurai.actions.find(action=>action.name===name)?.type,level<threshold?undefined:level<14?'Standard action':'Move action',`${name} timing at ${level}`);
  }
  assert(samurai.feats.some(feat=>feat.name==='Exotic Weapon Proficiency (bastard sword)'));
  assert.equal(samurai.feats.some(feat=>feat.name==='Improved Initiative'),level>=8);
  assert(!samurai.feats.some(feat=>/Two-Weapon Fighting|Quick Draw/.test(feat.name)),'weapon-restricted benefits do not become unrestricted feats');
  const samuraiTraining=samurai.trainingGrants.find(grant=>grant.sourceClassId===samurai35.catalogId);
  assert.deepEqual((samuraiTraining?.proficiencies||[]).map(item=>item.index).sort(),['heavy-armor','light-armor','martial-weapons','medium-armor','simple-weapons'],'Samurai receives all armor plus simple/martial weapons and no shield proficiency');
  assert.equal(samuraiTraining?.sourceUrl,'https://new.dndtools.org/classes/samurai-22','Samurai training retains exact source provenance');
  assert(samurai.grantedFeatures.filter(feature=>feature.sourceClassId===samurai35.catalogId).every(feature=>feature.sourceUrl===(feature.name==='Kiai Smite'?'https://new.dndtools.org/classes/samurai-22':'https://dndtools.net/classes/samurai/')),'reviewed Samurai rules link to their intact source');
  assert(!samurai.grantedFeatures.some(feature=>/^[–—-]$/.test(feature.name)),'empty progression cells never become features');
  assert.deepEqual(reconcileClassGrants(soulknife),soulknife,'Soulknife reconciliation is idempotent');
  assert.deepEqual(reconcileClassGrants(samurai),samurai,'Samurai reconciliation is idempotent');
}
const soulknife20=classSheet(soulknife35,20),samurai20=classSheet(samurai35,20);
assert.match(soulknife20.grantedFeatures.find(feature=>feature.name==='Mind Blade Enhancement').description,/8 hours/);
assert.match(soulknife20.grantedFeatures.find(feature=>feature.name==='Knife to the Soul').description,/when charging/);
assert.match(samurai20.grantedFeatures.find(feature=>feature.name==='Frightful Presence').description,/24 hours/);
const spentSamurai={...samurai20,resources:samurai20.resources.map(resource=>({...resource,used:2}))};
assert.equal(reconcileClassGrants(JSON.parse(JSON.stringify(spentSamurai))).resources.find(resource=>resource.name==='Kiai Smite').used,2,'save/reconcile retains spent smites');
const downleveled=classSheet(samurai35,13);
assert.equal(downleveled.actions.find(action=>action.name==='Mass Staredown').type,'Standard action');
const dualClass=reconcileClassGrants(baseCharacter([
  {catalogId:soulknife35.catalogId,name:'Soulknife',edition:'3.5',level:4,definition:soulknife35},
  {catalogId:samurai35.catalogId,name:'Samurai',edition:'3.5',level:14,definition:samurai35}
]));
assert.equal(dualClass.actions.find(action=>action.name==='Mind Blade').type,'Move action','timing uses own class level');
assert.equal(dualClass.resources.find(resource=>resource.name==='Kiai Smite').max,3,'uses own Samurai level');
for(const definition of [soulknife35,samurai35]){
  const without=removeClassProgression(dualClass,definition.catalogId);
  for(const field of ['grantedFeatures','actions','feats','resources'])assert(!without[field].some(item=>item.sourceClassId===definition.catalogId),`${field} cleans up on class removal`);
  assert(without.actions.some(action=>action.id==='manual-action'));
  assert(without.feats.some(feat=>feat.id==='manual-feat'));
}
const orientalSamurai=classSheet(exact35('classes/samurai-84'),20);
assert(!orientalSamurai.grantedFeatures.some(feature=>feature.name==='Kiai Smite'),'same-name Oriental Adventures class does not inherit Complete Warrior mechanics');
for(const sourceId of ['classes/wizard-99','classes/wizard-110','classes/cleric-91','classes/druid-92','classes/dragon-shaman-101','classes/wu-jen-6']){
  const optionalLanguages=classSheet(exact35(sourceId),1);
  assert(!featureChoicePlan(optionalLanguages).groups.some(group=>group.label==='Bonus Languages'),`${sourceId} optional language availability does not block creation`);
  assert.equal(optionalLanguages.grantedFeatures.find(feature=>feature.name==='Bonus Languages').kind,'feature','the language rule stays visible');
}
assert(featureChoicePlan(classSheet(exact35('classes/fighter-93'),1)).groups.some(group=>/Bonus Feat/.test(group.label)&&!group.valid),'required bonus feat choices still block creation');
// Source-reviewed DMG NPC classes. Their training packages were verified separately;
// these summaries keep the visible feature text source-locked without duplicating
// proficiency/class-skill choice UI in the generic feature-choice system.
for(const [sourceId,pattern] of [
  ['classes/aristocrat-31',/simple and martial weapons.*armor.*shields/i],
  ['classes/commoner-32',/one chosen simple weapon/i],
  ['classes/expert-33',/ten skills to be class skills/i],
  ['classes/warrior-34',/simple and martial weapons.*armor.*shields/i]
]){
  const definition=exact35(sourceId),sheet=classSheet(definition,1);
  const feature=sheet.grantedFeatures.find(item=>item.name==='Weapon and Armor Proficiency'&&item.sourceClassId===definition.catalogId);
  assert(feature,sourceId+' has its reviewed proficiency feature');
  assert.equal(feature.descriptionSource,'rule-text',sourceId+' uses reviewed rule text');
  assert.match(feature.description,pattern,sourceId+' preserves its source-specific rule');
  assert.equal(feature.kind,'feature',sourceId+' does not duplicate training choices as a feature choice');
  assert(!sheet.actions.some(item=>item.sourceClassId===definition.catalogId),sourceId+' does not invent actions');
  assert(!sheet.resources.some(item=>item.sourceClassId===definition.catalogId),sourceId+' does not invent resources');
}


const npcFixedSkillSets35=[
  ['classes/aristocrat-31',[
    'Appraise','Bluff','Diplomacy','Disguise','Forgery','Gather Information','Handle Animal','Intimidate',
    'Knowledge (arcana)','Knowledge (architecture and engineering)','Knowledge (dungeoneering)','Knowledge (geography)',
    'Knowledge (history)','Knowledge (local)','Knowledge (nature)','Knowledge (nobility and royalty)',
    'Knowledge (religion)','Knowledge (the planes)','Listen','Perform','Ride','Sense Motive','Speak Language','Spot','Swim','Survival'
  ]],
  ['classes/commoner-32',['Climb','Craft','Handle Animal','Jump','Listen','Profession','Ride','Spot','Swim','Use Rope']],
  ['classes/warrior-34',['Climb','Handle Animal','Intimidate','Jump','Ride','Swim']]
];
for(const [sourceId,expectedSkills] of npcFixedSkillSets35){
  const definition=exact35(sourceId);
  for(const level of [1,20]){
    const sheet=classSheet(definition,level);
    const owned=sheet.classSkills35.filter(skill=>skill.sourceClassId===definition.catalogId).map(skill=>skill.name).sort();
    assert.deepEqual(owned,[...expectedSkills].sort(),sourceId+' level '+level+' exact fixed class skills');
    assert.equal(sheet.classSkillRules35.some(rule=>rule.sourceClassId===definition.catalogId),false,sourceId+' verified fixed skills suppress stale dynamic class-skill rules');
    for(const skill of expectedSkills){
      const status=legacyClassSkillStatus(sheet,skill);
      assert.equal(status.classSkill,true,sourceId+' '+skill+' is a class skill');
      assert.equal(status.rankCap,level+3,sourceId+' '+skill+' uses the class-skill rank cap at level '+level);
    }
  }
}
const aristocrat35=exact35('classes/aristocrat-31'),warriorNpc35=exact35('classes/warrior-34');
const aristocrat1=classSheet(aristocrat35,1);
assert(!aristocrat1.classSkills35.some(skill=>skill.sourceClassId===aristocrat35.catalogId&&skill.name==='Knowledge'),'Aristocrat must not collapse all Knowledge skills to one generic entry');
for(const skill of ['Knowledge (arcana)','Knowledge (history)','Knowledge (local)','Knowledge (religion)','Knowledge (the planes)']){
  assert.equal(legacyClassSkillStatus(aristocrat1,skill).classSkill,true,'Aristocrat expands '+skill+' individually');
}
for(const [definition,expectedTraining] of [
  [aristocrat35,['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']],
  [warriorNpc35,['light-armor','medium-armor','heavy-armor','shields','simple-weapons','martial-weapons']]
]){
  for(const level of [1,20]){
    const sheet=classSheet(definition,level);
    const grant=sheet.trainingGrants.find(item=>item.sourceClassId===definition.catalogId);
    assert.deepEqual(grant?.proficiencies.map(item=>item.index),expectedTraining,definition.sourceId+' level '+level+' exact training package');
  }
}
const npcDual35=reconcileClassGrants(baseCharacter([
  {catalogId:aristocrat35.catalogId,name:aristocrat35.name,edition:'3.5',level:1,definition:aristocrat35},
  {catalogId:warriorNpc35.catalogId,name:warriorNpc35.name,edition:'3.5',level:1,definition:warriorNpc35}
]));
for(const [removedDefinition,remainingDefinition] of [[aristocrat35,warriorNpc35],[warriorNpc35,aristocrat35]]){
  const without=removeClassProgression(npcDual35,removedDefinition.catalogId);
  assert(!without.classSkills35.some(skill=>skill.sourceClassId===removedDefinition.catalogId),removedDefinition.sourceId+' removal cleans only its class skills');
  assert(!without.trainingGrants.some(grant=>grant.sourceClassId===removedDefinition.catalogId),removedDefinition.sourceId+' removal cleans only its training');
  assert(without.classSkills35.some(skill=>skill.sourceClassId===remainingDefinition.catalogId),remainingDefinition.sourceId+' class skills survive other-class removal');
  assert(without.trainingGrants.some(grant=>grant.sourceClassId===remainingDefinition.catalogId),remainingDefinition.sourceId+' training survives other-class removal');
  assert(without.actions.some(action=>action.id==='manual-action'),'manual actions survive NPC class removal');
  assert(without.feats.some(feat=>feat.id==='manual-feat'),'manual feats survive NPC class removal');
}


// Large safe batch: exact-source martial and noncasting classes with reviewed rule text and verified training.
const largeSafeBatch35=[
  'classes/barbarian-89',
  'classes/fighter-93',
  'classes/knight-103',
  'classes/monk-94',
  'classes/ninja-1',
  'classes/rogue-97',
  'classes/scout-2',
  'classes/soulknife-139',
  'classes/swashbuckler-23'
];
for(const sourceId of largeSafeBatch35){
  const definition=exact35(sourceId);
  assert(definition,sourceId+' exact class exists');
  const sheet=classSheet(definition,20);
  const report=classAutomationReport(sheet).classes[0];
  assert.equal(report.progressionComplete,true,sourceId+' has complete structured progression');
  assert.equal(report.descriptionReady,true,sourceId+' has descriptions for every granted feature');
  assert.equal(report.descriptionComplete,true,sourceId+' uses reviewed source-owned rule text rather than progression placeholders: '+sheet.grantedFeatures.filter(item=>item.descriptionSource==='progression').map(item=>item.name).join(', '));
  assert.equal(report.complete,true,sourceId+' has no structural class-automation gap');
  assert(sheet.trainingGrants.some(grant=>grant.sourceClassId===definition.catalogId),sourceId+' has verified source-owned starting training');
  assert.deepEqual(reconcileClassGrants(sheet),sheet,sourceId+' reconciliation is idempotent');
  const anchorDefinition=sourceId==='classes/fighter-93'?exact35('classes/rogue-97'):exact35('classes/fighter-93');
  const dual=reconcileClassGrants(baseCharacter([
    {catalogId:anchorDefinition.catalogId,name:anchorDefinition.name,edition:'3.5',level:1,definition:anchorDefinition},
    {catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:20,definition}
  ]));
  const removed=removeClassProgression(dual,definition.catalogId);
  assert(!removed.grantedFeatures.some(item=>item.sourceClassId===definition.catalogId),sourceId+' removal clears source-owned features');
  assert(!removed.actions.some(item=>item.sourceClassId===definition.catalogId),sourceId+' removal clears source-owned actions');
  assert(!removed.resources.some(item=>item.sourceClassId===definition.catalogId),sourceId+' removal clears source-owned resources');
  assert(!removed.trainingGrants.some(item=>item.sourceClassId===definition.catalogId),sourceId+' removal clears source-owned training');
  assert(removed.actions.some(item=>item.id==='manual-action')&&removed.feats.some(item=>item.id==='manual-feat'),sourceId+' removal preserves unrelated manual data');
}
console.log('PASS large 9-class exact-source batch: completeness, reviewed descriptions, training, idempotence and source removal');

console.log('PASS class reconciliation: reviewed features, level-scaled actions, multiclassing, source isolation, idempotence, and safe removal');
