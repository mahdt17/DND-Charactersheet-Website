import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices,skillNames} from '../src/lib/featureChoices.js';
import {featSpellAcquisitionProfile35,featSpellAcquisitionComplete35} from '../src/lib/featSpellAcquisition35.js';
const make=(edition,name,level,extra={})=>({ruleset:edition,className:name,level,classDefinition:{name,edition},skillProf:{Stealth:true,Arcana:true,Athletics:true,Perception:true},expertise:{},languages:'Common',...extra});
for(const edition of ['2014','2024']) {
 for(const cls of ['Rogue','Bard','Ranger','Wizard'])for(let level=1;level<=20;level++) {
  const c=make(edition,cls,level),old=level===1?null:make(edition,cls,level-1),plan=featureChoicePlan(c,old);
  const milestones=cls==='Rogue'?[1,6]:cls==='Bard'?(edition==='2014'?[3,10]:[2,9]):edition==='2024'?cls==='Ranger'?[2,9]:[2]:[];
  assert.equal(plan.groups.filter(g=>g.kind==='expertise').length,milestones.includes(level)?1:0,`${edition} ${cls} ${level}`);
 }
 const c=make(edition,'Rogue',1),plan=featureChoicePlan(c),id=plan.groups[0].id;
 assert.equal(plan.valid,false);assert.equal(plan.groups[0].options.includes('Thieves’ tools'),edition==='2014');
 assert.throws(()=>applyFeatureChoices(c,null,{[id]:['Stealth','Stealth']}),/Complete/);
 assert.throws(()=>applyFeatureChoices(c,null,{[id]:['Stealth','Deception']}),/Complete/);
 const chosen=applyFeatureChoices(c,null,{[id]:['Stealth',edition==='2014'?'Thieves’ tools':'Arcana']});
 assert.equal(chosen.expertise.Stealth,true);assert.equal(chosen.skillProf.Athletics,true);
 if(edition==='2014')assert.equal(chosen.toolExpertise['thieves-tools'],true);
 assert.equal(featureChoicePlan(chosen).groups.length,0,'recorded choices must not repeat');
 assert.deepEqual(featureChoicePlan(make(edition,'Rogue',2),make(edition,'Rogue',1)).groups,[],'do not invent historical choices');
 const expertise=featureChoicePlan(make(edition,'Rogue',6,{expertise:{Stealth:true}}),make(edition,'Rogue',5));assert(!expertise.groups[0].options.includes('Stealth'));
 const lore=make(edition,'Bard',3,{subclass:'College of Lore'}),before=make(edition,'Bard',2);
 let lp=featureChoicePlan(lore,before);assert.equal(lp.groups[0].kind,'skills');
 const picks={[lp.groups[0].id]:['Deception','History','Insight']};lp=featureChoicePlan(lore,before,picks);
 if(edition==='2014'){const expertise=lp.groups.find(g=>g.kind==='expertise');assert(expertise.options.includes('Deception'));picks[expertise.id]=['Deception','Stealth'];}
 const next=applyFeatureChoices(lore,before,picks);assert.equal(next.skillProf.Insight,true);assert.equal(next.skillProf.Arcana,true);
 assert.equal(featureChoicePlan(next,next).groups.length,0);
 assert.deepEqual(featureChoicePlan({...c,ruleset:'custom'}).groups,[]);
 assert.deepEqual(featureChoicePlan({...c,classDefinition:{name:'Rogue',edition,source:'Homebrew'}}).groups,[]);
}

const genericService=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const genericClasses=await genericService.load('3.5/classes');
const genericReference=[...genericClasses];
const genericExpert=annotateClassGrantKinds(genericClasses.find(record=>record.sourceId==='classes/expert2-124'),genericReference);
const genericWarrior=annotateClassGrantKinds(genericClasses.find(record=>record.sourceId==='classes/warrior2-135'),genericReference);
for(const [record,required] of [[genericExpert,2],[genericWarrior,1]]){
  const character=make('3.5',record.name,1,{
    classDefinition:record,
    classLevels:[{catalogId:record.catalogId,name:record.name,edition:'3.5',level:1,definition:record}],
    featureChoices:{}
  });
  const plan=featureChoicePlan(character,null);
  const saves=plan.groups.find(group=>group.label==='Base Save Bonuses');
  assert(saves,record.name+' exposes its generic base-save choice');
  assert.equal(saves.choiceKind,'source');
  assert.equal(saves.required,required);
  assert.deepEqual(saves.options,['Fortitude','Reflex','Will']);
  assert.equal(plan.groups.some(group=>group.label==='Class Skills'),false,record.name+' dynamic class-skill rule is not duplicated as a manual feature choice');
  assert.equal(plan.valid,false);
}
const expertChoiceCharacter=make('3.5','Expert',1,{
  classDefinition:genericExpert,
  classLevels:[{catalogId:genericExpert.catalogId,name:'Expert',edition:'3.5',level:1,definition:genericExpert}],
  featureChoices:{}
});
const expertChoicePlan=featureChoicePlan(expertChoiceCharacter,null);
const expertSaveGroup=expertChoicePlan.groups.find(group=>group.label==='Base Save Bonuses');
const expertPicks=Object.fromEntries(expertChoicePlan.groups.map(group=>{
  if(group.id===expertSaveGroup.id)return [group.id,['Fortitude','Reflex']];
  if((group.options||[]).length>=group.required)return [group.id,group.options.slice(0,group.required)];
  return [group.id,Array.from({length:group.required},(_,index)=>'Test choice '+(index+1))];
}));
const expertChosen=applyFeatureChoices(expertChoiceCharacter,null,expertPicks);
assert.deepEqual(
  Object.values(expertChosen.featureChoices).find(choice=>choice.feature==='Base Save Bonuses')?.choices,
  ['Fortitude','Reflex'],
  'generic save progression choice persists as exact source-owned feature state'
);
assert.equal(featureChoicePlan(expertChosen,null).groups.some(group=>group.label==='Base Save Bonuses'),false,'persisted generic save choice is not requested again');

const wizard=featureChoicePlan(make('2024','Wizard',2),make('2024','Wizard',1));assert.deepEqual(wizard.groups[0].options,['Arcana']);
const capped=featureChoicePlan(make('2024','Rogue',6,{skillProf:{Stealth:true},expertise:{Stealth:true}}),make('2024','Rogue',5));assert.equal(capped.groups[0].required,0);assert.equal(capped.valid,true);
const life=applyFeatureChoices(make('2014','Cleric',1,{subclass:'Life Domain'}),null,{});assert.equal(life.trainingGrants[0].proficiencies[0].index,'heavy-armor');assert.equal(applyFeatureChoices(life,null,{}).trainingGrants.length,1);
assert.equal(applyFeatureChoices(make('2024','Cleric',3,{subclass:'Life Domain'}),make('2024','Cleric',2),{}).trainingGrants.length,0);
const ranger=make('2024','Ranger',2),before=make('2024','Ranger',1),rp=featureChoicePlan(ranger,before),picks=Object.fromEntries(rp.groups.map(g=>[g.id,g.kind==='languages'?['Draconic','Elvish']:['Perception']]));
assert(!rp.groups.find(g=>g.kind==='languages').options.includes('Common'));const advanced=applyFeatureChoices(ranger,before,picks);assert.equal(advanced.languages,'Common, Draconic, Elvish');assert.equal(advanced.expertise.Perception,true);
const multi={...make('2024','Fighter',6),classLevels:[{name:'Fighter',edition:'2024',level:5},{name:'Rogue',edition:'2024',level:1}]},prior={...multi,classLevels:[multi.classLevels[0]]};
const mp=featureChoicePlan(multi,prior);assert.equal(mp.groups.filter(g=>g.kind==='expertise').length,1);assert.equal(mp.groups.find(g=>g.kind==='expertise').level,1);assert.match(mp.patch.languages,/Thieves' Cant/);
assert.deepEqual(featureChoicePlan({...multi,classLevels:[multi.classLevels[0],{...multi.classLevels[1],edition:'2014'}]},prior).groups,[]);
assert.equal(featureChoicePlan({...multi,classLevels:[multi.classLevels[0],{name:'Druid',edition:'2024',level:1}]},prior).patch.languages,'Common, Druidic');

const service35=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [choiceClasses35,choiceFeats35,choiceSpells35]=await Promise.all([service35.load('3.5/classes'),service35.load('3.5/feats'),service35.load('3.5/spells')]);
const choiceReference35=[...choiceClasses35,...choiceFeats35];
const druidCompanionClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/druid-92'),choiceReference35);
const companionChoiceBase=(definition,level)=>({ruleset:'3.5',mechanics:'3.5',className:definition.name,classDefinition:definition,classLevels:[{name:definition.name,edition:'3.5',catalogId:definition.catalogId,level,definition}],level,abilities:{str:10,dex:12,con:12,int:12,wis:16,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{}});
const druidCompanionLevel1=featureChoicePlan(companionChoiceBase(druidCompanionClass35,1),null);
const druidCompanionLevel1Group=druidCompanionLevel1.groups.find(group=>group.choiceKind==='animal-companion');
assert(druidCompanionLevel1Group,'Druid Animal Companion is a guided source choice');
assert(druidCompanionLevel1Group.options.includes('Wolf')&&druidCompanionLevel1Group.options.includes('Shark (Medium)'));
assert(!druidCompanionLevel1Group.options.includes('Ape')&&!druidCompanionLevel1Group.options.includes('Crocodile'));
assert.equal(featureChoicePlan(companionChoiceBase(druidCompanionClass35,1),null,{[druidCompanionLevel1Group.id]:['Ape']}).valid,false,'Druid cannot select a level-4 alternative at level 1');
const druidCompanionLevel4=featureChoicePlan(companionChoiceBase(druidCompanionClass35,4),null);
const druidCompanionLevel4Group=druidCompanionLevel4.groups.find(group=>group.choiceKind==='animal-companion');
assert(druidCompanionLevel4Group.options.includes('Ape')&&druidCompanionLevel4Group.options.includes('Crocodile'));
assert(!druidCompanionLevel4Group.options.includes('Dire Wolf'));
const druidCompanionLevel4Selected=featureChoicePlan(companionChoiceBase(druidCompanionClass35,4),null,{[druidCompanionLevel4Group.id]:['Ape']});
assert(Object.values(druidCompanionLevel4Selected.patch.featureChoices).some(choice=>choice.choiceKind==='animal-companion'&&choice.choices?.[0]==='Ape'),'Level-4 alternative companion selection persists in the source-choice patch');
const druidCompanionLevel1Selected=applyFeatureChoices(companionChoiceBase(druidCompanionClass35,1),null,{[druidCompanionLevel1Group.id]:['Wolf']});
assert(Object.values(druidCompanionLevel1Selected.featureChoices).some(choice=>choice.choiceKind==='animal-companion'&&choice.choices?.[0]==='Wolf'));
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(druidCompanionLevel1Selected)),null).groups.length,0,'Level-1 Animal Companion selection persists across save/reopen');

const healerCompanionClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/healer-77'),choiceReference35);
const healer11Choice35=companionChoiceBase(healerCompanionClass35,11),healer12Choice35=companionChoiceBase(healerCompanionClass35,12);
const healerAlternativePlan35=featureChoicePlan(healer12Choice35,healer11Choice35);
const healerAlternativeGroup35=healerAlternativePlan35.groups.find(group=>group.label==='Unicorn Companion'&&group.companionProfileId==='healer-companion');
assert(healerAlternativeGroup35,'Healer level 12 requests the source-defined optional companion replacement choice');
assert.deepEqual(healerAlternativeGroup35.options,['Unicorn','Lammasu','Gynosphinx','Water Naga','Androsphinx','Couatl']);
const healerLammasuChoice35=applyFeatureChoices(healer12Choice35,healer11Choice35,{[healerAlternativeGroup35.id]:['Lammasu']});
const healerLammasuRecorded35=Object.values(healerLammasuChoice35.featureChoices||{}).find(choice=>choice.companionProfileId==='healer-companion');
assert.equal(healerLammasuRecorded35?.baseCreatureId,'monsters/lammasu-355');
assert.equal(healerLammasuRecorded35?.levelAdjustment,4);
console.log('PASS Healer level-12 alternative companion selection is guided and source-locked');

for(const rangerSourceId of ['classes/ranger-96','classes/ranger-44','classes/ranger-68','classes/ranger-108']){
  const rangerDefinition35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId===rangerSourceId),choiceReference35);
  const rangerBeforeCompanion35=companionChoiceBase(rangerDefinition35,3);
  const rangerAtCompanion35=companionChoiceBase(rangerDefinition35,4);
  const rangerCompanionPlan35=featureChoicePlan(rangerAtCompanion35,rangerBeforeCompanion35);
  const rangerCompanionGroup35=rangerCompanionPlan35.groups.find(group=>group.choiceKind==='animal-companion');
  assert(rangerCompanionGroup35,rangerSourceId+' exposes its level-4 Animal Companion choice');
  assert.equal(rangerCompanionGroup35.companionProfileId,'ranger-animal-companion');
  assert.equal(rangerCompanionGroup35.effectiveCompanionLevel,2);
  assert(rangerCompanionGroup35.options.includes('Crocodile'),rangerSourceId+' includes source-defined aquatic Crocodile at Ranger 4');
  const rangerCrocodile35=applyFeatureChoices(rangerAtCompanion35,rangerBeforeCompanion35,{[rangerCompanionGroup35.id]:['Crocodile']});
  const rangerCrocodileChoice35=Object.values(rangerCrocodile35.featureChoices||{}).find(choice=>choice.companionProfileId==='ranger-animal-companion');
  assert.equal(rangerCrocodileChoice35?.baseCreatureId,'monsters/crocodile-544');
  assert.equal(rangerCrocodileChoice35?.levelAdjustment,0);
}
console.log('PASS all four source-equivalent Ranger records use the Ranger-specific source-locked companion profile');

const swCompanionRaw35=choiceClasses35.find(record=>record.sourceId==='classes/sorcererwizard-variant-957');
const swCompanionUnresolved35=annotateClassGrantKinds(swCompanionRaw35,choiceReference35);
assert.equal(swCompanionUnresolved35.inheritanceRequired,true);
assert.deepEqual(swCompanionUnresolved35.inheritanceOptions.map(option=>option.name).sort(),['Sorcerer','Wizard']);
const swCompanionSorcerer35=annotateClassGrantKinds({...swCompanionRaw35,inheritanceChoice:'Sorcerer'},choiceReference35);
const swCompanionLevel8=featureChoicePlan(companionChoiceBase(swCompanionSorcerer35,8),null);
const swCompanionLevel8Group=swCompanionLevel8.groups.find(group=>group.choiceKind==='animal-companion');
assert.equal(swCompanionLevel8Group?.effectiveDruidLevel,4);
assert(swCompanionLevel8Group.options.includes('Ape')&&!swCompanionLevel8Group.options.includes('Dire Wolf'));
const swCompanionSelected=applyFeatureChoices(companionChoiceBase(swCompanionSorcerer35,8),null,{[swCompanionLevel8Group.id]:['Ape']});
assert.equal(swCompanionSelected.grantedFeatures.find(feature=>feature.companionName==='Ape')?.companionEffectiveDruidLevel,1);


const rangerCompanionClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/ranger-96'),choiceReference35);
const rangerCompanionLevel4=featureChoicePlan(companionChoiceBase(rangerCompanionClass35,4),null);
const rangerCompanionLevel4Group=rangerCompanionLevel4.groups.find(group=>group.choiceKind==='animal-companion');
assert(rangerCompanionLevel4Group,'Ranger companion choices use the generic companion engine');
assert.equal(rangerCompanionLevel4Group.effectiveCompanionLevel,2,'Ranger level 4 contributes half level');
assert(rangerCompanionLevel4Group.options.includes('Wolf'));
assert(!rangerCompanionLevel4Group.options.includes('Ape'));
const rangerCompanionLevel8=featureChoicePlan(companionChoiceBase(rangerCompanionClass35,8),null);
const rangerCompanionLevel8Group=rangerCompanionLevel8.groups.find(group=>group.choiceKind==='animal-companion');
assert.equal(rangerCompanionLevel8Group?.effectiveCompanionLevel,4);
assert(rangerCompanionLevel8Group.options.includes('Ape')&&!rangerCompanionLevel8Group.options.includes('Dire Wolf'));

for(const [sourceId,minLevel] of [['classes/adept-917',2],['classes/sorcerer-98',1],['classes/wizard-99',1]]){
  const definition=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId===sourceId),choiceReference35);
  const plan=featureChoicePlan(companionChoiceBase(definition,minLevel),null);
  const familiar=plan.groups.find(group=>group.choiceKind==='familiar');
  assert(familiar,sourceId+' exposes a guided standard familiar choice');
  assert.equal(familiar.companionProfileId,'standard-familiar');
  assert(familiar.options.includes('Raven')&&familiar.options.includes('Bat'));
}
const hexbladeCompanionClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/hexblade-19'),choiceReference35);
const hexbladeCompanionLevel4=featureChoicePlan(companionChoiceBase(hexbladeCompanionClass35,4),null);
const hexbladeFamiliar=hexbladeCompanionLevel4.groups.find(group=>group.choiceKind==='familiar');
assert(hexbladeFamiliar,'Hexblade level 4 exposes its familiar');
assert.equal(hexbladeFamiliar.effectiveCompanionLevel,1,'Hexblade contributes class level minus three');

const dreadCompanionClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/dread-necromancer-75'),choiceReference35);
const dreadCompanionLevel7=featureChoicePlan(companionChoiceBase(dreadCompanionClass35,7),null);
const dreadFamiliarGroup=dreadCompanionLevel7.groups.find(group=>group.choiceKind==='familiar');
assert.deepEqual(dreadFamiliarGroup?.options,['Imp','Quasit','Vargouille','Ghostly Visage']);
assert.equal(dreadFamiliarGroup?.companionProfileId,'standard-familiar');

const thugChoiceClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/thug-132'),choiceReference35);
const thugChoiceBase=(level)=>({ruleset:'3.5',mechanics:'3.5',className:'Thug',classDefinition:thugChoiceClass35,classLevels:[{name:'Thug',edition:'3.5',catalogId:thugChoiceClass35.catalogId,level,definition:thugChoiceClass35}],level,abilities:{str:14,dex:14,con:14,int:12,wis:10,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{}});
assert.equal(featureChoicePlan(thugChoiceBase(1),null).groups.filter(group=>/^Bonus Feats?$/i.test(group.label)).length,0,'Thug has no level-1 Fighter bonus-feat choice');
const thugChoicePlan=featureChoicePlan(thugChoiceBase(2),thugChoiceBase(1));
const thugChoiceGroup=thugChoicePlan.groups.find(group=>/^Bonus Feats?$/i.test(group.label));
assert(thugChoiceGroup?.options.includes('Urban Tracking'),'Thug choice pool includes its exact source exception');
assert(thugChoiceGroup?.options.includes('Power Attack'),'Thug choice pool includes typed Fighter bonus feats');
assert(!thugChoiceGroup?.options.includes('Alertness'),'Thug choice pool excludes non-Fighter feats');
assert.equal(featureChoicePlan(thugChoiceBase(2),thugChoiceBase(1),{[thugChoiceGroup.id]:['Alertness']}).valid,false,'invalid Thug bonus-feat selections are rejected');
assert.equal(featureChoicePlan(thugChoiceBase(2),thugChoiceBase(1),{[thugChoiceGroup.id]:['Urban Tracking']}).valid,true,'Thug source-specific Urban Tracking selection is accepted');

const fighterSwap35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/fighter-variant-953'),choiceReference35);
const rogueSwap35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/rogue-variant-958'),choiceReference35);
const wizardSwap35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/wizard-variant-959'),choiceReference35);
const swapBase=(definition,level,featureChoices={})=>({ruleset:'3.5',mechanics:'3.5',className:definition.name,classDefinition:definition,classLevels:[{name:definition.name,edition:'3.5',catalogId:definition.catalogId,level,definition}],level,abilities:{str:14,dex:14,con:12,int:16,wis:10,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices});
assert.equal(featureChoicePlan(swapBase(fighterSwap35,20),null).groups.filter(group=>/^Bonus Feats?$/i.test(group.label)).length,0,'Fighter Variant never asks for removed Fighter bonus feats');

const rogueSwapPlan=featureChoicePlan(swapBase(rogueSwap35,2),null);
assert.deepEqual(rogueSwapPlan.groups.filter(group=>/^Bonus Feats?$/i.test(group.label)).map(group=>group.level),[1,2]);
for(const group of rogueSwapPlan.groups){assert(group.options.includes('Power Attack'));assert(!group.options.includes('Alertness'));}
const rogueBadPicks=Object.fromEntries(rogueSwapPlan.groups.map(group=>[group.id,['Alertness']]));
assert.equal(featureChoicePlan(swapBase(rogueSwap35,2),null,rogueBadPicks).valid,false);
const rogueGoodPicks=Object.fromEntries(rogueSwapPlan.groups.map((group,index)=>[group.id,[index?'Combat Expertise':'Power Attack']]));
const rogueSwapApplied=applyFeatureChoices(swapBase(rogueSwap35,2),null,rogueGoodPicks);
assert(rogueSwapApplied.feats.some(feat=>feat.name==='Power Attack'&&feat.sourceClassId===rogueSwap35.catalogId&&feat.sourceType==='class-choice'));
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(rogueSwapApplied)),null).groups.length,0,'Rogue Variant bonus-feat choices persist across save/reopen');

const wizardSwapPlan=featureChoicePlan(swapBase(wizardSwap35,5),null);
const wizardFeatGroups=wizardSwapPlan.groups.filter(group=>/^Bonus Feats?$/i.test(group.label));
assert.deepEqual(wizardFeatGroups.map(group=>group.level),[1,5]);
for(const group of wizardFeatGroups){assert(group.options.includes('Power Attack'));assert(!group.options.includes('Alertness'));}
assert(wizardSwapPlan.groups.some(group=>group.choiceKind==='familiar'),'Wizard Variant retains the inherited Wizard familiar choice');
const wizardGoodPicks=Object.fromEntries(wizardSwapPlan.groups.map(group=>{
  if(group.choiceKind==='familiar')return [group.id,['Raven']];
  const featIndex=wizardFeatGroups.indexOf(group);
  return [group.id,[featIndex===0?'Power Attack':'Combat Expertise']];
}));
const wizardSwapApplied=applyFeatureChoices(swapBase(wizardSwap35,5),null,wizardGoodPicks);
assert(!wizardSwapApplied.feats.some(feat=>feat.name==='Scribe Scroll'&&feat.sourceClassId===wizardSwap35.catalogId));
assert.equal(featureChoicePlan(JSON.parse(JSON.stringify(wizardSwapApplied)),null).groups.length,0,'Wizard Variant Fighter-list bonus feats persist across save/reopen');


const wildernessChoiceClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/wilderness-rogue-136'),choiceReference35);
const wildernessChoiceBase=(level,featureChoices={})=>({ruleset:'3.5',mechanics:'3.5',className:'Wilderness Rogue',classDefinition:wildernessChoiceClass35,classLevels:[{name:'Wilderness Rogue',edition:'3.5',catalogId:wildernessChoiceClass35.catalogId,level,definition:wildernessChoiceClass35}],level,abilities:{str:12,dex:16,con:12,int:14,wis:12,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices});
const wilderness10Plan=featureChoicePlan(wildernessChoiceBase(10),wildernessChoiceBase(9));
const wilderness10Choice=wilderness10Plan.groups.find(group=>group.level===10&&/^Special Abilit/i.test(group.label));
assert(wilderness10Choice?.options.includes('Woodland Stride')&&wilderness10Choice?.options.includes('Camouflage')&&wilderness10Choice?.options.includes('Hide in Plain Sight'));
const prematureHide=featureChoicePlan(wildernessChoiceBase(10),wildernessChoiceBase(9),{[wilderness10Choice.id]:['Hide in Plain Sight']});
assert.equal(prematureHide.valid,false,'Hide in Plain Sight is rejected before Camouflage');
assert(prematureHide.groups.find(group=>group.id===wilderness10Choice.id)?.unmetPrerequisites.includes('Camouflage'));

const wilderness16Plan=featureChoicePlan(wildernessChoiceBase(16),wildernessChoiceBase(9));
const wilderness19Plan=featureChoicePlan(wildernessChoiceBase(19),wildernessChoiceBase(9));
assert.deepEqual(wilderness19Plan.groups.filter(group=>/^Special Abilit/i.test(group.label)).map(group=>group.level),[10,13,16,19],'Wilderness Rogue retains all four source-defined Special Ability milestones');
const wildernessPicks={};
wildernessPicks[wilderness16Plan.groups.find(group=>group.level===10).id]=['Woodland Stride'];
wildernessPicks[wilderness16Plan.groups.find(group=>group.level===13).id]=['Camouflage'];
wildernessPicks[wilderness16Plan.groups.find(group=>group.level===16).id]=['Hide in Plain Sight'];
assert.equal(featureChoicePlan(wildernessChoiceBase(16),wildernessChoiceBase(9),wildernessPicks).valid,true,'Camouflage acquired at an earlier Special Ability unlock satisfies Hide in Plain Sight');
const wildernessApplied=applyFeatureChoices(wildernessChoiceBase(16),wildernessChoiceBase(9),wildernessPicks);
for(const name of ['Woodland Stride','Camouflage','Hide in Plain Sight'])assert(wildernessApplied.grantedFeatures.some(feature=>feature.name===name&&feature.selectedFromFeature==='Special Abilities'),'selected Wilderness Rogue mechanic is materialized: '+name);
const wildernessReopened=JSON.parse(JSON.stringify(wildernessApplied));
assert.equal(featureChoicePlan(wildernessReopened,null).groups.length,0,'saved Wilderness Rogue choices do not repeat after reopen');
const wildernessReconciled=(await import('../src/lib/classIntegration.js')).reconcileClassGrants(wildernessReopened);
for(const name of ['Woodland Stride','Camouflage','Hide in Plain Sight'])assert(wildernessReconciled.grantedFeatures.some(feature=>feature.name===name&&feature.selectedFromFeature==='Special Abilities'),'reopened Wilderness Rogue keeps selected mechanic: '+name);

const fighterReprintClass35={name:'Fighter',edition:'3.5',sourceId:'classes/fighter-41',catalogId:'dndtools:classes/fighter-41',sourceUrl:'https://new.dndtools.org/classes/fighter-41',progression:[['Class Level','Special'],['1st','Bonus feat'],['2nd','Bonus feat']]};
const fighterReprint35={ruleset:'3.5',mechanics:'3.5',className:'Fighter',classDefinition:fighterReprintClass35,classLevels:[{name:'Fighter',edition:'3.5',catalogId:fighterReprintClass35.catalogId,level:1,definition:fighterReprintClass35}],level:1,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{}};
const fighterReprintPlan=featureChoicePlan(fighterReprint35,null);
const fighterReprintBonus=fighterReprintPlan.groups.find(group=>/^Bonus Feats?$/i.test(group.label));
assert.equal(fighterReprintBonus?.choiceKind,'feat','verified Fighter reprints inherit canonical bonus-feat metadata');
const fighterReprintChosen=applyFeatureChoices(fighterReprint35,null,{[fighterReprintBonus.id]:['Power Attack']});
assert(fighterReprintChosen.feats.some(feat=>feat.name==='Power Attack'&&feat.sourceType==='class-choice'),'Fighter reprint choice materializes a feat');
const fighterReprintReconciled=(await import('../src/lib/classIntegration.js')).reconcileClassGrants(fighterReprintChosen);
assert(fighterReprintReconciled.feats.some(feat=>feat.name==='Power Attack'&&feat.sourceType==='class-choice'),'Fighter reprint class-choice feat survives reconciliation');

const legacyChoiceClass={name:'Choice Adept',edition:'3.5',catalogId:'dndtools:classes/choice-adept',sourceUrl:'https://example.invalid/choice-adept',sourceDescription:'Bonus Feat: Choose one feat for which you meet the prerequisites.',progression:[['Class Level','Special'],['1st','Bonus feat']]};
const legacyChoice={ruleset:'3.5',mechanics:'3.5',className:'Choice Adept',classDefinition:legacyChoiceClass,classLevels:[{name:'Choice Adept',edition:'3.5',catalogId:legacyChoiceClass.catalogId,level:1,definition:legacyChoiceClass}],level:1,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},actions:[],feats:[],resources:[],trainingGrants:[],featureChoices:{}};
const legacyPlan=featureChoicePlan(legacyChoice,null);
assert.equal(legacyPlan.groups.length,1);
assert.equal(legacyPlan.groups[0].kind,'source-choice');
assert.equal(legacyPlan.valid,false);
assert.match(legacyPlan.groups[0].sourceText,/Bonus feat/i);
assert.throws(()=>applyFeatureChoices(legacyChoice,null,{}),/Complete/);
const legacyPick={[legacyPlan.groups[0].id]:['Combat Casting']};
const legacyApplied=applyFeatureChoices(legacyChoice,null,legacyPick);
assert.equal(Object.values(legacyApplied.featureChoices)[0].choices[0],'Combat Casting');
assert.equal(featureChoicePlan(legacyApplied,null).groups.length,0,'recorded 3.5 source choices must not repeat');
const commonerClass35={name:'Commoner',edition:'3.5',sourceId:'classes/commoner-32',catalogId:'dndtools:classes/commoner-32',sourceUrl:'https://www.d20srd.org/srd/npcClasses/commoner.htm',progression:[['Class Level','Special'],['1st','']]};
const commonerChar35={...legacyChoice,className:'Commoner',classDefinition:commonerClass35,classLevels:[{name:'Commoner',edition:'3.5',catalogId:commonerClass35.catalogId,level:1,definition:commonerClass35}]};
const commonerPlan35=featureChoicePlan(commonerChar35,null);
const commonerWeapon35=commonerPlan35.groups.find(group=>group.choiceKind==='proficiency');
assert(commonerWeapon35,'Commoner requires its one simple-weapon proficiency choice');
assert.equal(commonerWeapon35.required,1);
assert(commonerWeapon35.options.includes('Club')&&commonerWeapon35.options.includes('Light crossbow'));
assert(!commonerWeapon35.options.includes('Longsword'),'Commoner choice excludes martial weapons');
assert.throws(()=>applyFeatureChoices(commonerChar35,null,{[commonerWeapon35.id]:['Longsword']}),/Complete/);
const commonerChosen35=applyFeatureChoices(commonerChar35,null,{[commonerWeapon35.id]:['Club']});
assert(Object.values(commonerChosen35.featureChoices).some(choice=>choice.sourceClassId===commonerClass35.catalogId&&choice.choices?.[0]==='Club'));
assert(commonerChosen35.trainingGrants.some(grant=>grant.sourceClassId===commonerClass35.catalogId&&grant.sourceChoiceId===commonerWeapon35.id&&grant.proficiencies.some(p=>p.index==='club')));
assert.equal(featureChoicePlan(commonerChosen35,null).groups.filter(group=>group.choiceKind==='proficiency').length,0,'saved Commoner weapon choice must not repeat');

const expertClass35={name:'Expert',edition:'3.5',sourceId:'classes/expert-33',catalogId:'dndtools:classes/expert-33',sourceUrl:'https://www.d20srd.org/srd/npcClasses/expert.htm',classSkills:['Appraise','Balance','Spot'],classSkillRule:{type:'choose_any',count:10,source:'The expert can choose any ten skills to be class skills.'},progression:[['Class Level','BAB','Fort Save','Ref Save','Will Save'],['1st','+0','+0','+0','+2']]};
const warriorClass35={name:'Warrior',edition:'3.5',sourceId:'classes/warrior-34',catalogId:'dndtools:classes/warrior-34',sourceUrl:'https://new.dndtools.org/classes/warrior-34',progression:[['Class Level','BAB','Fort Save','Ref Save','Will Save'],['1st','+1','+2','+0','+0']]};
const expertChar35={...legacyChoice,className:'Expert',classDefinition:expertClass35,classLevels:[{name:'Expert',edition:'3.5',catalogId:expertClass35.catalogId,level:1,definition:expertClass35},{name:'Warrior',edition:'3.5',catalogId:warriorClass35.catalogId,level:1,definition:warriorClass35}],level:2};
const expertPlan35=featureChoicePlan(expertChar35,null);
const expertSkills35=expertPlan35.groups.find(group=>group.choiceKind==='class-skill');
assert(expertSkills35,'Expert requires its ten class-skill choices');
assert.equal(expertSkills35.required,10);
assert.equal(expertSkills35.options.length,46);
assert(expertSkills35.options.includes('Appraise')&&expertSkills35.options.includes('Knowledge (the planes)')&&expertSkills35.options.includes('Truespeak'));
assert.throws(()=>applyFeatureChoices(expertChar35,null,{[expertSkills35.id]:expertSkills35.options.slice(0,9)}),/Complete/);
const expertChosenNames35=expertSkills35.options.slice(0,10);
const expertChosen35=applyFeatureChoices(expertChar35,null,{[expertSkills35.id]:expertChosenNames35});
assert.equal(Object.values(expertChosen35.featureChoices).find(choice=>choice.sourceClassId===expertClass35.catalogId&&choice.choiceKind==='class-skill')?.choices.length,10);
assert.equal(expertChosen35.classSkills35.filter(skill=>skill.sourceClassId===expertClass35.catalogId).length,10);
assert.equal(expertChosen35.classSkills35.some(skill=>skill.sourceClassId===expertClass35.catalogId&&skill.name==='Spot'),false,'eligible but unchosen Expert skills are not granted automatically');
const expertIntegration35=await import('../src/lib/classIntegration.js');
for(const skill of expertChosenNames35)assert.equal(expertIntegration35.legacyClassSkillStatus(expertChosen35,skill).classSkill,true,skill+' becomes an Expert class skill');
assert.equal(expertIntegration35.legacyClassSkillStatus(expertChosen35,'Spot').classSkill,false,'unchosen Expert skill remains cross-class');
const commonerMulticlass35=expertIntegration35.reconcileClassGrants({
  ...commonerChosen35,
  level:2,
  classLevels:[
    ...commonerChosen35.classLevels,
    {name:'Warrior',edition:'3.5',catalogId:warriorClass35.catalogId,level:1,definition:warriorClass35}
  ]
});
assert(commonerMulticlass35.trainingGrants.some(grant=>grant.sourceClassId===warriorClass35.catalogId),'Commoner multiclass fixture preserves Warrior training');
const commonerRemoved35=expertIntegration35.removeClassProgression(commonerMulticlass35,commonerClass35.catalogId);
assert.equal(Object.values(commonerRemoved35.featureChoices||{}).some(choice=>choice.sourceClassId===commonerClass35.catalogId),false,'removing Commoner cleans its selected weapon choice');
assert.equal(commonerRemoved35.trainingGrants.some(grant=>grant.sourceClassId===commonerClass35.catalogId),false,'removing Commoner cleans its chosen weapon training');
assert.equal(commonerRemoved35.classSkills35.some(skill=>skill.sourceClassId===commonerClass35.catalogId),false,'removing Commoner cleans its fixed class skills');
assert(commonerRemoved35.trainingGrants.some(grant=>grant.sourceClassId===warriorClass35.catalogId),'removing Commoner preserves Warrior training');
assert(commonerRemoved35.classSkills35.some(skill=>skill.sourceClassId===warriorClass35.catalogId),'removing Commoner preserves Warrior class skills');

const expertRemoved35=expertIntegration35.removeClassProgression(expertChosen35,expertClass35.catalogId);
assert.equal(expertRemoved35.classSkills35.some(skill=>skill.sourceClassId===expertClass35.catalogId),false,'removing Expert cleans up its chosen class skills');
assert.equal(Object.values(expertRemoved35.featureChoices||{}).some(choice=>choice.sourceClassId===expertClass35.catalogId),false,'removing Expert cleans up its class-skill choice');
assert(expertRemoved35.trainingGrants.some(grant=>grant.sourceClassId===warriorClass35.catalogId),'removing Expert preserves the other class training');

const dreadClass={name:'Dread Necromancer',edition:'3.5',sourceId:'classes/dread-necromancer-75',catalogId:'dndtools:classes/dread-necromancer-75',progression:[['Class Level','Special'],['1st','Charnel touch']]};
const dreadChar={...legacyChoice,className:'Dread Necromancer',classDefinition:dreadClass,classLevels:[{name:'Dread Necromancer',edition:'3.5',catalogId:dreadClass.catalogId,level:1,definition:dreadClass}]};
const dreadPlan=featureChoicePlan(dreadChar,null);
const weaponChoice=dreadPlan.groups.find(group=>group.choiceKind==='proficiency');
assert(weaponChoice,'Dread Necromancer must request its source-defined martial weapon choice');
assert.equal(weaponChoice.proficiencyKind,'weapons');
const dreadApplied=applyFeatureChoices(dreadChar,null,{[weaponChoice.id]:['Longsword']});
assert(dreadApplied.trainingGrants.some(grant=>grant.sourceClassId===dreadClass.catalogId&&grant.proficiencies.some(p=>p.index==='longsword')));
assert.equal(featureChoicePlan(dreadApplied,null).groups.filter(group=>group.choiceKind==='proficiency').length,0,'recorded proficiency choice must not repeat');

const monkClass={name:'Monk',edition:'3.5',sourceId:'classes/monk-94',catalogId:'dndtools:classes/monk-94',sourceUrl:'https://new.dndtools.org/classes/monk-94',progression:[['Class Level','Special'],['1st','Flurry of blows, unarmed strike, bonus feat'],['2nd','Evasion, bonus feat'],['6th','Bonus feat']]};
const monkChoice={...legacyChoice,className:'Monk',classDefinition:monkClass,classLevels:[{name:'Monk',edition:'3.5',catalogId:monkClass.catalogId,level:1,definition:monkClass}]};
const monkPlan=featureChoicePlan(monkChoice,null);
const monkBonus=monkPlan.groups.find(group=>group.label.toLowerCase()==='bonus feat');
assert(monkBonus,'Monk level 1 requests its reviewed bonus feat');
assert.equal(monkBonus.choiceKind,'feat');
assert.deepEqual(monkBonus.options,['Improved Grapple','Stunning Fist']);
const monkApplied=applyFeatureChoices(monkChoice,null,{[monkBonus.id]:['Stunning Fist']});
assert(monkApplied.feats.some(feat=>feat.name==='Stunning Fist'&&feat.sourceType==='class-choice'&&feat.sourceClassId===monkClass.catalogId));
const monkReconciled=(await import('../src/lib/classIntegration.js')).reconcileClassGrants(monkApplied);
assert(monkReconciled.feats.some(feat=>feat.name==='Improved Unarmed Strike'&&feat.sourceType==='class'),'Monk automatic feat survives beside selected bonus feat');
assert(monkReconciled.feats.some(feat=>feat.name==='Stunning Fist'&&feat.sourceType==='class-choice'),'selected Monk bonus feat survives reconciliation');
const monk2={...monkApplied,level:2,classLevels:[{...monkChoice.classLevels[0],level:2}]};
const monk2Plan=featureChoicePlan(monk2,monkApplied);
assert.deepEqual(monk2Plan.groups.find(group=>group.label.toLowerCase()==='bonus feat')?.options,['Combat Reflexes','Deflect Arrows']);

const rangerClass35={name:'Ranger',edition:'3.5',sourceId:'classes/ranger-96',catalogId:'dndtools:classes/ranger-96',sourceUrl:'https://new.dndtools.org/classes/ranger-96',progression:[['Class Level','Special'],['1st','Favored enemy, Track, wild empathy'],['2nd','Combat style']]};
const rangerChoice35={...legacyChoice,className:'Ranger',classDefinition:rangerClass35,classLevels:[{name:'Ranger',edition:'3.5',catalogId:rangerClass35.catalogId,level:2,definition:rangerClass35}],level:2};
const rangerBefore35={...rangerChoice35,classLevels:[{...rangerChoice35.classLevels[0],level:1}],level:1};
const rangerStylePlan=featureChoicePlan(rangerChoice35,rangerBefore35);
const rangerStyle=rangerStylePlan.groups.find(group=>group.label==='Combat Style');
assert(rangerStyle,'Ranger level 2 requests its reviewed combat-style choice');
assert.deepEqual(rangerStyle.options,['Archery','Two-Weapon Combat']);
assert.equal(rangerStyle.ignorePrerequisites,true);
const rangerStyled=applyFeatureChoices(rangerChoice35,rangerBefore35,{[rangerStyle.id]:['Archery']});
assert(Object.values(rangerStyled.featureChoices).some(choice=>choice.feature==='Combat Style'&&choice.choices?.[0]==='Archery'));

const rangerLevel1={...rangerChoice35,classLevels:[{...rangerChoice35.classLevels[0],level:1}],level:1};
const rangerCreatePlan=featureChoicePlan(rangerLevel1,null);
const rangerEnemy1=rangerCreatePlan.groups.find(group=>group.choiceKind==='favored-enemy');
assert(rangerEnemy1,'Ranger creation requests its 1st-level favored enemy');
assert(rangerEnemy1.options.includes('Dragon')&&rangerEnemy1.options.includes('Outsider (evil)'));
const rangerEnemyChosen=applyFeatureChoices(rangerLevel1,null,{[rangerEnemy1.id]:['Dragon']});
assert(Object.values(rangerEnemyChosen.featureChoices).some(choice=>choice.choiceKind==='favored-enemy'&&choice.choices?.[0]==='Dragon'));
const rangerLevel5={...rangerEnemyChosen,classLevels:[{...rangerEnemyChosen.classLevels[0],level:5}],level:5};
const rangerLevel5Plan=featureChoicePlan(rangerLevel5,rangerEnemyChosen);
const rangerEnemy5=rangerLevel5Plan.groups.find(group=>group.choiceKind==='favored-enemy');
const rangerBoost5=rangerLevel5Plan.groups.find(group=>group.choiceKind==='favored-enemy-boost');
assert(rangerEnemy5&&rangerBoost5,'Ranger level 5 requests a new favored enemy and a +2 bonus increase');
assert(!rangerEnemy5.options.includes('Dragon'),'Favored Enemy cannot select the same enemy twice');
assert.deepEqual(rangerBoost5.options,['Dragon'],'Before the new level-5 enemy is chosen, only existing favored enemies are valid boost targets');
const level5Picks={[rangerEnemy5.id]:['Giant'],[rangerBoost5.id]:['Dragon']};
const rangerLevel5Planned=featureChoicePlan(rangerLevel5,rangerEnemyChosen,level5Picks);
const plannedBoost=rangerLevel5Planned.groups.find(group=>group.choiceKind==='favored-enemy-boost');
assert(plannedBoost.options.includes('Dragon')&&plannedBoost.options.includes('Giant'),'The newly selected enemy can receive the same-level +2 increase');
assert.equal(Object.values(rangerLevel5Planned.patch.featureChoices).filter(choice=>choice.choiceKind==='favored-enemy').length,2);
assert(Object.values(rangerLevel5Planned.patch.featureChoices).some(choice=>choice.choiceKind==='favored-enemy-boost'&&choice.choices?.[0]==='Dragon'));

const spiritShamanClass35={name:'Spirit Shaman',edition:'3.5',sourceId:'classes/spirit-shaman-9',catalogId:'dndtools:classes/spirit-shaman-9',sourceUrl:'https://new.dndtools.org/classes/spirit-shaman-9',progression:[['Class Level','Special'],['1st','Spirit guide, wild empathy']]};
const spiritShamanChoice35={...legacyChoice,className:'Spirit Shaman',classDefinition:spiritShamanClass35,classLevels:[{name:'Spirit Shaman',edition:'3.5',catalogId:spiritShamanClass35.catalogId,level:1,definition:spiritShamanClass35}],level:1};
const spiritGuidePlan=featureChoicePlan(spiritShamanChoice35,null);
const spiritGuideChoice=spiritGuidePlan.groups.find(group=>group.label==='Spirit Guide');
assert(spiritGuideChoice,'Spirit Shaman requests its reviewed spirit-guide form');
assert(spiritGuideChoice.options.includes('Wolf')&&spiritGuideChoice.options.includes('Owl'));
const spiritGuided=applyFeatureChoices(spiritShamanChoice35,null,{[spiritGuideChoice.id]:['Wolf']});
assert(Object.values(spiritGuided.featureChoices).some(choice=>choice.feature==='Spirit Guide'&&choice.choices?.[0]==='Wolf'));

const psychicWarriorClass35={name:'Psychic Warrior',edition:'3.5',sourceId:'classes/psychic-warrior-138',catalogId:'dndtools:classes/psychic-warrior-138',sourceUrl:'https://new.dndtools.org/classes/psychic-warrior-138',progression:[['Class Level','Special'],['1st','Bonus feat'],['2nd','Bonus feat'],['5th','Bonus feat']]};
const psychicWarriorChoice35={...legacyChoice,className:'Psychic Warrior',classDefinition:psychicWarriorClass35,classLevels:[{name:'Psychic Warrior',edition:'3.5',catalogId:psychicWarriorClass35.catalogId,level:2,definition:psychicWarriorClass35}],level:2};
const psychicWarriorPlan=featureChoicePlan(psychicWarriorChoice35,null);
const psychicWarriorBonuses=psychicWarriorPlan.groups.filter(group=>group.label==='Bonus Feats');
assert.equal(psychicWarriorBonuses.length,2,'Psychic Warrior creation requests both level 1 and level 2 bonus feats');
assert(psychicWarriorBonuses.every(group=>group.choiceKind==='feat'));
const psychicWarriorPicks=Object.fromEntries(psychicWarriorBonuses.map((group,index)=>[group.id,[index?'Psionic Weapon':'Combat Casting']]));
const psychicWarriorChosen=applyFeatureChoices(psychicWarriorChoice35,null,psychicWarriorPicks);
assert.equal(psychicWarriorChosen.feats.filter(feat=>feat.sourceType==='class-choice'&&feat.sourceClassId===psychicWarriorClass35.catalogId).length,2);

const warlockClass35={name:'Warlock',edition:'3.5',sourceId:'classes/warlock-4',catalogId:'dndtools:classes/warlock-4',sourceUrl:'https://new.dndtools.org/classes/warlock-4',progression:[['Class Level','Special'],['10th','Energy resistance 5']]};
const warlockChoice35={...legacyChoice,className:'Warlock',classDefinition:warlockClass35,classLevels:[{name:'Warlock',edition:'3.5',catalogId:warlockClass35.catalogId,level:10,definition:warlockClass35}],level:10};
const warlockPlan=featureChoicePlan(warlockChoice35,null);
const warlockEnergy=warlockPlan.groups.find(group=>group.label==='Energy Resistance');
assert(warlockEnergy,'Warlock level 10 requests its two energy resistance choices');
assert.equal(warlockEnergy.required,2);
assert.equal(warlockEnergy.valid,false);
assert.throws(()=>applyFeatureChoices(warlockChoice35,null,{[warlockEnergy.id]:['Fire','Fire']}),/Complete/);
const warlockResistant=applyFeatureChoices(warlockChoice35,null,{[warlockEnergy.id]:['Fire','Cold']});
assert(Object.values(warlockResistant.featureChoices).some(choice=>choice.feature==='Energy Resistance'&&choice.choices?.length===2));

const dreadReviewedClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/dread-necromancer-75'),choiceReference35);
const dreadReviewed8={...legacyChoice,className:'Dread Necromancer',classDefinition:dreadReviewedClass35,classLevels:[{name:'Dread Necromancer',edition:'3.5',catalogId:dreadReviewedClass35.catalogId,level:8,definition:dreadReviewedClass35}],level:8};
const dreadReviewedBefore={...dreadReviewed8,classLevels:[{...dreadReviewed8.classLevels[0],level:7}],level:7};
const dreadAdvancePlan=featureChoicePlan(dreadReviewed8,dreadReviewedBefore,{}, {spells:choiceSpells35});
const dreadLearning=dreadAdvancePlan.groups.find(group=>group.label==='Advanced Learning');
assert(dreadLearning,'Dread Necromancer level 8 requests its next Advanced Learning spell');
assert.equal(dreadLearning.choiceKind,'spell-access');
assert(!dreadLearning.options.includes('Enervation'),'Dread Necromancer Advanced Learning excludes spells already on the native class list');
assert(dreadLearning.options.length>0,'Dread Necromancer Advanced Learning offers at least one eligible necromancy spell outside the native class list');
const dreadPick=dreadLearning.options[0],dreadPickRecord=choiceSpells35.find(spell=>spell.name===dreadPick);
assert(dreadPickRecord,'Advanced Learning option resolves to a verified catalog spell');
assert.match(String(dreadPickRecord.school?.name||dreadPickRecord.school||''),/Necromancy/i,'Advanced Learning option is a necromancy spell');
assert((dreadPickRecord.classes||[]).some(name=>['cleric','wizard'].includes(String(name).toLowerCase())),'Advanced Learning option belongs to the Cleric or Wizard list');
assert(!(dreadPickRecord.classes||[]).some(name=>String(name).toLowerCase()==='dread necromancer'),'Advanced Learning option is not already on the Dread Necromancer list');
const dreadLearned=applyFeatureChoices(dreadReviewed8,dreadReviewedBefore,{[dreadLearning.id]:[dreadPick]},{spells:choiceSpells35});
assert(Object.values(dreadLearned.featureChoices).some(choice=>choice.feature==='Advanced Learning'&&choice.choices?.[0]===dreadPick));
const dreadGrant=dreadLearned.spellAccessGrants?.find(grant=>grant.classId===dreadReviewedClass35.catalogId&&grant.spellName===dreadPick&&grant.sourceChoiceId===dreadLearning.id);
assert(dreadGrant,'Dread Necromancer Advanced Learning persists a class-scoped spell-access grant');
assert.equal(dreadGrant.spellReferenceOnly,!!dreadPickRecord.referenceOnly,'Advanced Learning grant preserves whether the chosen spell still has reference-only effect content');
const dreadFamiliarStart={...legacyChoice,className:'Dread Necromancer',classDefinition:dreadReviewedClass35,classLevels:[{name:'Dread Necromancer',edition:'3.5',catalogId:dreadReviewedClass35.catalogId,level:7,definition:dreadReviewedClass35}],level:7};
const dreadFamiliarPlan=featureChoicePlan(dreadFamiliarStart,null);
const dreadFamiliar=dreadFamiliarPlan.groups.find(group=>group.label==='Summon Familiar');
assert.deepEqual(dreadFamiliar?.options,['Imp','Quasit','Vargouille','Ghostly Visage']);

const scoutClass35={name:'Scout',edition:'3.5',sourceId:'classes/scout-2',catalogId:'dndtools:classes/scout-2',sourceUrl:'https://new.dndtools.org/classes/scout-2',progression:[['Class Level','Special'],['4th','Bonus Feat'],['8th','Bonus feat']]};
const scoutChoice35={...legacyChoice,className:'Scout',classDefinition:scoutClass35,classLevels:[{name:'Scout',edition:'3.5',catalogId:scoutClass35.catalogId,level:8,definition:scoutClass35}],level:8};
const scoutBefore35={...scoutChoice35,classLevels:[{...scoutChoice35.classLevels[0],level:7}],level:7};
const scoutPlan=featureChoicePlan(scoutChoice35,scoutBefore35);
const scoutBonus=scoutPlan.groups.find(group=>/^Bonus Feats?$/i.test(group.label));
assert(scoutBonus,'Scout level 8 requests its reviewed bonus feat');
assert(scoutBonus.options.includes('Track')&&scoutBonus.options.includes('Quick Reconnoiter'));
assert(!scoutBonus.options.includes('Power Attack'),'Scout bonus feat picker remains restricted to the source list');
const scoutChosen=applyFeatureChoices(scoutChoice35,scoutBefore35,{[scoutBonus.id]:['Track']});
assert(scoutChosen.feats.some(feat=>feat.name==='Track'&&feat.sourceType==='class-choice'&&feat.sourceClassId===scoutClass35.catalogId));

const hexbladeClass35={name:'Hexblade',edition:'3.5',sourceId:'classes/hexblade-19',catalogId:'dndtools:classes/hexblade-19',sourceUrl:'https://new.dndtools.org/classes/hexblade-19',progression:[['Class Level','Special'],['5th','Bonus feat'],['10th','Bonus feat']]};
const hexbladeChoice35={...legacyChoice,className:'Hexblade',classDefinition:hexbladeClass35,classLevels:[{name:'Hexblade',edition:'3.5',catalogId:hexbladeClass35.catalogId,level:10,definition:hexbladeClass35}],level:10};
const hexbladeBefore35={...hexbladeChoice35,classLevels:[{...hexbladeChoice35.classLevels[0],level:9}],level:9};
const hexbladePlan=featureChoicePlan(hexbladeChoice35,hexbladeBefore35);
const hexbladeBonus=hexbladePlan.groups.find(group=>group.label==='Bonus Feat');
assert(hexbladeBonus,'Hexblade level 10 requests a bonus feat');
assert(hexbladeBonus.options.includes('Spell Penetration'));
assert(!hexbladeBonus.options.includes('Power Attack'),'Hexblade bonus feat remains source-restricted');
const structuredSpellFeat={
  id:'reviewed:spell-penetration-teaching-test',catalogId:'reviewed:spell-penetration-teaching-test',name:'Spell Penetration',edition:'3.5',
  description:'Reviewed fixture feat with a mandatory learned-spell choice.',
  spellAcquisition35:{effect:'known-spell',count:1,required:true,affectsQuota:false}
};
const hexbladeChosen=applyFeatureChoices(hexbladeChoice35,hexbladeBefore35,{[hexbladeBonus.id]:['Spell Penetration']},{feats:[structuredSpellFeat]});
const chosenHexbladeFeat=hexbladeChosen.feats.find(feat=>feat.name==='Spell Penetration'&&feat.sourceType==='class-choice');
assert(chosenHexbladeFeat,'Hexblade class-feature feat choice materializes a feat');
assert.equal(chosenHexbladeFeat.catalogId,structuredSpellFeat.catalogId,'class-feature feat choice preserves canonical feat identity');
assert.equal(featSpellAcquisitionProfile35(chosenHexbladeFeat)?.effect,'known-spell','class-feature feat choice preserves structured spell-acquisition metadata');
assert.equal(featSpellAcquisitionComplete35(chosenHexbladeFeat,hexbladeChosen),false,'mandatory class-feature feat spell acquisition remains incomplete until resolved');

const marshalClass35={name:'Marshal',edition:'3.5',sourceId:'classes/marshal-78',catalogId:'dndtools:classes/marshal-78',sourceUrl:'https://new.dndtools.org/classes/marshal-78',progression:[['Level','Special'],['1st','Skill Focus (Diplomacy), minor aura'],['2nd','Major aura +1'],['3rd','—'],['4th','Grant move action 1/day'],['5th','—']]};
const marshal5={...legacyChoice,className:'Marshal',classDefinition:marshalClass35,classLevels:[{name:'Marshal',edition:'3.5',catalogId:marshalClass35.catalogId,level:5,definition:marshalClass35}],level:5};
const marshalPlan=featureChoicePlan(marshal5,null);
const marshalMinor=marshalPlan.groups.filter(group=>group.label==='Minor Aura');
const marshalMajor=marshalPlan.groups.filter(group=>group.label==='Major Aura');
assert.equal(marshalMinor.length,3,'Marshal level 5 knows three minor auras');
assert.equal(marshalMajor.length,2,'Marshal level 5 knows two major auras');
const duplicateAuraPicks={};
for(const group of marshalMinor)duplicateAuraPicks[group.id]=['Accurate Strike'];
for(const group of marshalMajor)duplicateAuraPicks[group.id]=['Hardy Soldiers'];
assert.throws(()=>applyFeatureChoices(marshal5,null,duplicateAuraPicks),/Complete/,'Marshal cannot learn the same aura repeatedly');
const distinctAuraPicks={
  [marshalMinor[0].id]:['Accurate Strike'],
  [marshalMinor[1].id]:['Art of War'],
  [marshalMinor[2].id]:['Demand Fortitude'],
  [marshalMajor[0].id]:['Hardy Soldiers'],
  [marshalMajor[1].id]:['Motivate Attack']
};
const marshalChosen=applyFeatureChoices(marshal5,null,distinctAuraPicks);
assert.equal(Object.values(marshalChosen.featureChoices).filter(choice=>choice.feature==='Minor Aura').length,3);
assert.equal(Object.values(marshalChosen.featureChoices).filter(choice=>choice.feature==='Major Aura').length,2);

const dragonShamanClass35={name:'Dragon Shaman',edition:'3.5',sourceId:'classes/dragon-shaman-101',catalogId:'dndtools:classes/dragon-shaman-101',sourceUrl:'https://new.dndtools.org/classes/dragon-shaman-101',progression:[['Level','Special'],['1st','Draconic aura +1, totem dragon'],['2nd','Skill Focus'],['3rd','Draconic adaptation'],['5th','Draconic aura +2']]};
const dragonShaman1={...legacyChoice,className:'Dragon Shaman',classDefinition:dragonShamanClass35,classLevels:[{name:'Dragon Shaman',edition:'3.5',catalogId:dragonShamanClass35.catalogId,level:1,definition:dragonShamanClass35}],level:1};
const dragonShamanPlan=featureChoicePlan(dragonShaman1,null);
const dragonAuras=dragonShamanPlan.groups.find(group=>group.label==='Draconic Aura');
const dragonTotem=dragonShamanPlan.groups.find(group=>group.label==='Totem Dragon');
assert.equal(dragonAuras?.required,3,'Dragon Shaman starts knowing three draconic auras');
assert(dragonAuras.options.includes('Vigor')&&dragonAuras.options.includes('Energy Shield'));
assert(dragonTotem?.options.includes('Gold')&&dragonTotem.options.includes('Red'));
assert.throws(()=>applyFeatureChoices(dragonShaman1,null,{[dragonAuras.id]:['Power','Power','Vigor'],[dragonTotem.id]:['Gold']}),/Complete/,'Dragon Shaman cannot duplicate starting auras');
const dragonShamanChosen=applyFeatureChoices(dragonShaman1,null,{[dragonAuras.id]:['Power','Presence','Vigor'],[dragonTotem.id]:['Gold']});
assert(Object.values(dragonShamanChosen.featureChoices).some(choice=>choice.feature==='Totem Dragon'&&choice.choices?.[0]==='Gold'));
assert(Object.values(dragonShamanChosen.featureChoices).some(choice=>choice.feature==='Draconic Aura'&&choice.choices?.length===3));

const dragonShaman5={...dragonShamanChosen,classLevels:[{...dragonShaman1.classLevels[0],level:5}],level:5};
const dragonShaman4={...dragonShamanChosen,classLevels:[{...dragonShaman1.classLevels[0],level:4}],level:4};
const dragonShaman5Plan=featureChoicePlan(dragonShaman5,dragonShaman4);
const nextAura=dragonShaman5Plan.groups.find(group=>group.label==='Draconic Aura');
assert.equal(nextAura?.required,1);
assert(!nextAura.options.includes('Power')&&!nextAura.options.includes('Presence')&&!nextAura.options.includes('Vigor'),'Known draconic auras are excluded from later choices');

const beguilerClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/beguiler-100'),choiceReference35);
const beguiler7=companionChoiceBase(beguilerClass35,7);
const beguiler6=companionChoiceBase(beguilerClass35,6);
const beguilerPlan=featureChoicePlan(beguiler7,beguiler6,{}, {spells:choiceSpells35});
const beguilerLearning=beguilerPlan.groups.find(group=>group.label==='Advanced Learning');
assert(beguilerLearning,'Beguiler level 7 requests its next Advanced Learning spell');
assert.equal(beguilerLearning.required,1);
assert.equal(beguilerLearning.choiceKind,'spell-access');
assert(beguilerLearning.options.length>0,'Beguiler Advanced Learning offers an eligible verified Wizard enchantment or illusion spell');
const beguilerPick=beguilerLearning.options[0],beguilerPickRecord=choiceSpells35.find(spell=>spell.name===beguilerPick);
assert(beguilerPickRecord,'Beguiler Advanced Learning option resolves to a catalog spell');
assert.match(String(beguilerPickRecord.school?.name||beguilerPickRecord.school||''),/Enchantment|Illusion/i);
assert((beguilerPickRecord.classes||[]).some(name=>String(name).toLowerCase()==='wizard'),'Beguiler Advanced Learning option comes from the Wizard list');
assert(!(beguilerPickRecord.classes||[]).some(name=>String(name).toLowerCase()==='beguiler'),'Beguiler Advanced Learning excludes spells already on its native list');
const learnedBeguiler=applyFeatureChoices(beguiler7,beguiler6,{[beguilerLearning.id]:[beguilerPick]},{spells:choiceSpells35});
const beguilerGrant=learnedBeguiler.spellAccessGrants?.find(grant=>grant.classId===beguilerClass35.catalogId&&grant.sourceChoiceId===beguilerLearning.id);
assert(beguilerGrant,'Beguiler Advanced Learning persists a class-scoped spell-access grant');
assert.equal(beguilerGrant.spellName,beguilerPick);
assert.equal(beguilerGrant.source,'Beguiler · Advanced Learning');

const favoredSoulClass35={name:'Favored Soul',edition:'3.5',sourceId:'classes/favored-soul-7',catalogId:'dndtools:classes/favored-soul-7',sourceUrl:'https://new.dndtools.org/classes/favored-soul-7',progression:[['Level','Special'],['3rd','Deity’s weapon focus'],['5th','Energy resistance (1st type)'],['10th','Energy resistance (2nd type)']]};
const favoredSoul3={...legacyChoice,className:'Favored Soul',classDefinition:favoredSoulClass35,classLevels:[{name:'Favored Soul',edition:'3.5',catalogId:favoredSoulClass35.catalogId,level:3,definition:favoredSoulClass35}],level:3};
const favoredSoul2={...favoredSoul3,classLevels:[{...favoredSoul3.classLevels[0],level:2}],level:2};
const favoredWeaponChoiceId='3.5:'+favoredSoulClass35.catalogId+':1:proficiency:deity-favored-weapon';
const favoredSoul3WithDeityWeapon={
  ...favoredSoul3,
  featureChoices:{
    ...(favoredSoul3.featureChoices||{}),
    [favoredWeaponChoiceId]:{
      className:'Favored Soul',classId:favoredSoulClass35.catalogId,sourceClassId:favoredSoulClass35.catalogId,
      edition:'3.5',level:1,feature:'Deity’s favored weapon',choices:['Longsword'],choiceKind:'proficiency'
    }
  }
};
const favoredSoul2WithDeityWeapon={...favoredSoul3WithDeityWeapon,classLevels:[{...favoredSoul3.classLevels[0],level:2}],level:2};
const favoredSoul3Plan=featureChoicePlan(favoredSoul3WithDeityWeapon,favoredSoul2WithDeityWeapon);
const deityFocus=favoredSoul3Plan.groups.find(group=>group.label==='Deity’s Weapon Focus');
assert.equal(deityFocus?.choiceKind,'feat');
assert.deepEqual(deityFocus?.options,['Weapon Focus (Longsword)'],'Favored Soul deity Weapon Focus is bound to the persisted favored weapon');
const focusedSoul=applyFeatureChoices(favoredSoul3WithDeityWeapon,favoredSoul2WithDeityWeapon,{[deityFocus.id]:['Weapon Focus (Longsword)']});
assert(focusedSoul.feats.some(feat=>feat.name==='Weapon Focus (Longsword)'&&feat.sourceType==='class-choice'));

const favoredSoul12={...focusedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:12}],level:12};
const favoredSoul11={...focusedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:11}],level:11};
const favoredSoul12Plan=featureChoicePlan(favoredSoul12,favoredSoul11);
const deitySpecialization=favoredSoul12Plan.groups.find(group=>group.label==='Deity’s Weapon Specialization');
assert.deepEqual(deitySpecialization?.options,['Weapon Specialization (Longsword)'],'Favored Soul deity Weapon Specialization uses the same persisted favored weapon');

const favoredSoulAlreadyFocused={
  ...favoredSoul3WithDeityWeapon,
  feats:[...(favoredSoul3WithDeityWeapon.feats||[]),{name:'Weapon Focus (Longsword)',edition:'3.5'}]
};
const favoredSoulAlreadyFocused2={...favoredSoulAlreadyFocused,classLevels:[{...favoredSoul3.classLevels[0],level:2}],level:2};
const duplicateFocusPlan=featureChoicePlan(favoredSoulAlreadyFocused,favoredSoulAlreadyFocused2);
const duplicateFocus=duplicateFocusPlan.groups.find(group=>group.label==='Deity’s Weapon Focus');
assert.deepEqual(duplicateFocus?.options,[],'already owning the deity Weapon Focus preserves the source exception to choose a different feat manually');

const favoredSoul5={...focusedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:5}],level:5};
const favoredSoul4={...focusedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:4}],level:4};
const favoredSoul5Plan=featureChoicePlan(favoredSoul5,favoredSoul4);
const firstResistance=favoredSoul5Plan.groups.find(group=>group.label==='Energy Resistance');
assert(firstResistance?.options.includes('Fire')&&firstResistance.options.includes('Cold'));
const resistedSoul=applyFeatureChoices(favoredSoul5,favoredSoul4,{[firstResistance.id]:['Fire']});

const favoredSoul10={...resistedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:10}],level:10};
const favoredSoul9={...resistedSoul,classLevels:[{...favoredSoul3.classLevels[0],level:9}],level:9};
const favoredSoul10Plan=featureChoicePlan(favoredSoul10,favoredSoul9);
const secondResistance=favoredSoul10Plan.groups.find(group=>group.label==='Energy Resistance');
assert(!secondResistance.options.includes('Fire'),'Favored Soul later energy resistance excludes an already chosen type');
assert(secondResistance.options.includes('Cold'));

const shugenjaClass35={name:'Shugenja',edition:'3.5',sourceId:'classes/shugenja-8',catalogId:'dndtools:classes/shugenja-8',sourceUrl:'https://new.dndtools.org/classes/shugenja-8',progression:[['Level','Special'],['1st','Elemental focus, sense elements']]};
const shugenja1={...legacyChoice,className:'Shugenja',classDefinition:shugenjaClass35,classLevels:[{name:'Shugenja',edition:'3.5',catalogId:shugenjaClass35.catalogId,level:1,definition:shugenjaClass35}],level:1};
const shugenjaPlan=featureChoicePlan(shugenja1,null);
const elementFocus=shugenjaPlan.groups.find(group=>group.label==='Element Focus');
assert.deepEqual(elementFocus?.options,['Air','Earth','Fire','Water']);
const fireShugenja=applyFeatureChoices(shugenja1,null,{[elementFocus.id]:['Fire']});
assert(Object.values(fireShugenja.featureChoices).some(choice=>choice.feature==='Element Focus'&&choice.choices?.[0]==='Fire'));

const wuJenClass35={name:'Wu Jen',edition:'3.5',sourceId:'classes/wu-jen-6',catalogId:'dndtools:classes/wu-jen-6',sourceUrl:'https://new.dndtools.org/classes/wu-jen-6',progression:[['Level','Special'],['1st','Watchful spirit, bonus feat'],['3rd','Spell secret'],['6th','Elemental mastery']]};
const wuJen1={...legacyChoice,className:'Wu Jen',classDefinition:wuJenClass35,classLevels:[{name:'Wu Jen',edition:'3.5',catalogId:wuJenClass35.catalogId,level:1,definition:wuJenClass35}],level:1};
const wuJenPlan=featureChoicePlan(wuJen1,null);
const wuJenFeat=wuJenPlan.groups.find(group=>group.label==='Bonus Feat');
const wuJenTaboo=wuJenPlan.groups.find(group=>group.label==='Taboos');
assert.equal(wuJenFeat?.choiceKind,'feat');
assert(wuJenTaboo?.options.includes('Cannot eat meat'));
const wuJenChosen=applyFeatureChoices(wuJen1,null,{[wuJenFeat.id]:['Empower Spell'],[wuJenTaboo.id]:['Cannot eat meat']});
assert(wuJenChosen.feats.some(feat=>feat.name==='Empower Spell'&&feat.sourceType==='class-choice'));

const wuJen3={...wuJenChosen,classLevels:[{...wuJen1.classLevels[0],level:3}],level:3};
const wuJen2={...wuJenChosen,classLevels:[{...wuJen1.classLevels[0],level:2}],level:2};
const wuJen3Plan=featureChoicePlan(wuJen3,wuJen2);
const spellSecret=wuJen3Plan.groups.find(group=>group.label==='Spell Secret');
const nextTaboo=wuJen3Plan.groups.find(group=>group.label==='Taboos');
assert(spellSecret,'Wu Jen level 3 requests a Spell Secret');
assert(!nextTaboo.options.includes('Cannot eat meat'),'Wu Jen later taboos exclude previously chosen taboos');

const wuJen6={...wuJenChosen,classLevels:[{...wuJen1.classLevels[0],level:6}],level:6};
const wuJen5={...wuJenChosen,classLevels:[{...wuJen1.classLevels[0],level:5}],level:5};
const wuJen6Plan=featureChoicePlan(wuJen6,wuJen5);
const mastery=wuJen6Plan.groups.find(group=>group.label==='Elemental Mastery');
assert.deepEqual(mastery?.options,['Earth','Fire','Metal','Water','Wood']);

const dragonfireClass35={name:'Dragonfire Adept',edition:'3.5',sourceId:'classes/dragonfire-adept-29',catalogId:'dndtools:classes/dragonfire-adept-29',sourceUrl:'https://new.dndtools.org/classes/dragonfire-adept-29',progression:[['Level','Special'],['1st','Breath weapon 1d6, Dragontouched, least invocations'],['2nd','Breath effect, scales +2'],['5th','Breath weapon 3d6, breath effect']]};
const dragonfire2={...legacyChoice,className:'Dragonfire Adept',classDefinition:dragonfireClass35,classLevels:[{name:'Dragonfire Adept',edition:'3.5',catalogId:dragonfireClass35.catalogId,level:2,definition:dragonfireClass35}],level:2};
const dragonfire1={...dragonfire2,classLevels:[{...dragonfire2.classLevels[0],level:1}],level:1};
const dragonfire2Plan=featureChoicePlan(dragonfire2,dragonfire1);
const firstBreathEffect=dragonfire2Plan.groups.find(group=>group.label==='Breath Effect');
assert.deepEqual(firstBreathEffect?.options,['Frost Breath','Lightning Breath','Sickening Breath']);
const frostyAdept=applyFeatureChoices(dragonfire2,dragonfire1,{[firstBreathEffect.id]:['Frost Breath']});

const dragonfire5={...frostyAdept,classLevels:[{...dragonfire2.classLevels[0],level:5}],level:5};
const dragonfire4={...frostyAdept,classLevels:[{...dragonfire2.classLevels[0],level:4}],level:4};
const dragonfire5Plan=featureChoicePlan(dragonfire5,dragonfire4);
const secondBreathEffect=dragonfire5Plan.groups.find(group=>group.label==='Breath Effect');
assert(!secondBreathEffect.options.includes('Frost Breath'),'Dragonfire Adept cannot learn the same breath effect twice');
assert(secondBreathEffect.options.includes('Acid Breath')&&secondBreathEffect.options.includes('Weakening Breath'));

const knightClass35={name:'Knight',edition:'3.5',sourceId:'classes/knight-103',catalogId:'dndtools:classes/knight-103',sourceUrl:'https://new.dndtools.org/classes/knight-103',progression:[['Level','Special'],['2nd','Mounted Combat, shield block +1'],['5th','Bonus feat, vigilant defender'],['10th','Bonus feat']]};
const knight10={...legacyChoice,className:'Knight',classDefinition:knightClass35,classLevels:[{name:'Knight',edition:'3.5',catalogId:knightClass35.catalogId,level:10,definition:knightClass35}],level:10};
const knight9={...knight10,classLevels:[{...knight10.classLevels[0],level:9}],level:9};
const knightPlan=featureChoicePlan(knight10,knight9);
const knightBonus=knightPlan.groups.find(group=>group.label==='Bonus Feat');
assert(knightBonus,'Knight level 10 requests its restricted bonus feat');
assert(knightBonus.options.includes('Spirited Charge')&&knightBonus.options.includes('Weapon Focus (Lance)'));
assert(!knightBonus.options.includes('Power Attack'),'Knight bonus feat picker remains source-restricted');
const knightChosen=applyFeatureChoices(knight10,knight9,{[knightBonus.id]:['Spirited Charge']});
assert(knightChosen.feats.some(feat=>feat.name==='Spirited Charge'&&feat.sourceType==='class-choice'));

const warmageClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/warmage-5'),choiceReference35);
const warmage11=companionChoiceBase(warmageClass35,11);
const warmage10=companionChoiceBase(warmageClass35,10);
const warmagePlan=featureChoicePlan(warmage11,warmage10,{}, {spells:choiceSpells35});
const warmageLearning=warmagePlan.groups.find(group=>group.label==='Advanced Learning');
assert(warmageLearning,'Warmage level 11 requests Advanced Learning');
assert.equal(warmageLearning.required,1);
assert.equal(warmageLearning.choiceKind,'spell-access');
assert(warmageLearning.options.length>0,'Advanced Learning offers verified eligible spells instead of a free-text ruling');
const warmagePick=warmageLearning.options[0];
const learnedWarmage=applyFeatureChoices(warmage11,warmage10,{[warmageLearning.id]:[warmagePick]},{spells:choiceSpells35});
const learnedGrant=learnedWarmage.spellAccessGrants?.find(grant=>grant.classId===warmageClass35.catalogId&&grant.sourceChoiceId===warmageLearning.id);
assert(learnedGrant,'Advanced Learning materializes a permanent source-owned spell-access grant');
assert.equal(learnedGrant.spellName,warmagePick);
assert.equal(learnedGrant.source,'Warmage · Advanced Learning');

assert.equal(skillNames.length,18);
console.log('PASS Expertise milestones and eligibility, Lore skill dependencies, Life training, class languages, 3.5 source-choice prompts, multiclass attribution, preserved choices, duplicates and manual combinations');


const shugenjaChoiceClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/shugenja-8'),choiceReference35);
const shugenjaChoice1=companionChoiceBase(shugenjaChoiceClass35,1);
const shugenjaChoicePlan=featureChoicePlan(shugenjaChoice1,null);
const shugenjaOrderGroup=shugenjaChoicePlan.groups.find(group=>group.label==='Shugenja Order');
const shugenjaElementGroup=shugenjaChoicePlan.groups.find(group=>group.label==='Element Focus');
assert(shugenjaOrderGroup&&shugenjaElementGroup,'Shugenja exposes Order and Element Focus as guided source choices');
const consumingPicks={[shugenjaOrderGroup.id]:['Order of the Consuming Flame']};
const consumingPlan=featureChoicePlan(shugenjaChoice1,null,consumingPicks);
const consumingElement=consumingPlan.groups.find(group=>group.label==='Element Focus');
assert.deepEqual(consumingElement.options,['Fire'],'Shugenja Order drives the legal favored element before spell acquisition');
const validShugenja=applyFeatureChoices(shugenjaChoice1,null,{...consumingPicks,[consumingElement.id]:['Fire']});
assert(Object.values(validShugenja.featureChoices).some(choice=>choice.feature==='Shugenja Order'&&choice.choices[0]==='Order of the Consuming Flame'));
assert.throws(()=>applyFeatureChoices(shugenjaChoice1,null,{...consumingPicks,[consumingElement.id]:['Water']}),/Complete/,'order-incompatible Shugenja elements are rejected');
const mysteryPlan=featureChoicePlan(shugenjaChoice1,null,{[shugenjaOrderGroup.id]:['Order of the Ineffable Mystery']});
assert.deepEqual(mysteryPlan.groups.find(group=>group.label==='Element Focus').options,['Air','Earth','Fire','Water']);

const wuJenChoiceClass35=annotateClassGrantKinds(choiceClasses35.find(record=>record.sourceId==='classes/wu-jen-6'),choiceReference35);
const wuJenChoice3=companionChoiceBase(wuJenChoiceClass35,3);
wuJenChoice3.spells=[
  {id:'wu-magic-missile',catalogId:'spell:magic-missile',name:'Magic Missile',level:1,castingClassId:wuJenChoiceClass35.catalogId},
  {id:'wu-fire-shuriken',catalogId:'spell:fire-shuriken',name:'Fire Shuriken',level:2,castingClassId:wuJenChoiceClass35.catalogId}
];
const wuJen3Plan=featureChoicePlan(wuJenChoice3,{...wuJenChoice3,level:2,classLevels:[{...wuJenChoice3.classLevels[0],level:2}]});
const spellSecretGroup=wuJen3Plan.groups.find(group=>group.label==='Spell Secret');
assert.equal(spellSecretGroup?.kind,'source-choice-parts');
assert.deepEqual(spellSecretGroup.choiceParts[0].options,['Fire Shuriken','Magic Missile']);
assert.deepEqual(spellSecretGroup.choiceParts[1].options,['Enlarge Spell','Extend Spell','Still Spell','Silent Spell']);
const wuJenSecretChosen=applyFeatureChoices(wuJenChoice3,{...wuJenChoice3,level:2,classLevels:[{...wuJenChoice3.classLevels[0],level:2}]},{[spellSecretGroup.id]:['Magic Missile','Silent Spell']});
assert(Object.values(wuJenSecretChosen.featureChoices).some(choice=>choice.feature==='Spell Secret'&&choice.choices.join('|')==='Magic Missile|Silent Spell'));
