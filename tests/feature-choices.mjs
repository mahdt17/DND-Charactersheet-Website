import assert from 'node:assert/strict';
import {featureChoicePlan,applyFeatureChoices,skillNames} from '../src/lib/featureChoices.js';
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

const dreadReviewedClass35={name:'Dread Necromancer',edition:'3.5',sourceId:'classes/dread-necromancer-75',catalogId:'dndtools:classes/dread-necromancer-75',sourceUrl:'https://new.dndtools.org/classes/dread-necromancer-75',progression:[['Class Level','Special'],['4th','Advanced learning'],['7th','Summon familiar'],['8th','Advanced learning']]};
const dreadReviewed8={...legacyChoice,className:'Dread Necromancer',classDefinition:dreadReviewedClass35,classLevels:[{name:'Dread Necromancer',edition:'3.5',catalogId:dreadReviewedClass35.catalogId,level:8,definition:dreadReviewedClass35}],level:8};
const dreadReviewedBefore={...dreadReviewed8,classLevels:[{...dreadReviewed8.classLevels[0],level:7}],level:7};
const dreadAdvancePlan=featureChoicePlan(dreadReviewed8,dreadReviewedBefore);
const dreadLearning=dreadAdvancePlan.groups.find(group=>group.label==='Advanced Learning');
assert(dreadLearning,'Dread Necromancer level 8 requests its next Advanced Learning spell');
const dreadLearned=applyFeatureChoices(dreadReviewed8,dreadReviewedBefore,{[dreadLearning.id]:['Enervation']});
assert(Object.values(dreadLearned.featureChoices).some(choice=>choice.feature==='Advanced Learning'&&choice.choices?.[0]==='Enervation'));
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
const hexbladeChosen=applyFeatureChoices(hexbladeChoice35,hexbladeBefore35,{[hexbladeBonus.id]:['Spell Penetration']});
assert(hexbladeChosen.feats.some(feat=>feat.name==='Spell Penetration'&&feat.sourceType==='class-choice'));

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

const beguilerClass35={name:'Beguiler',edition:'3.5',sourceId:'classes/beguiler-100',catalogId:'dndtools:classes/beguiler-100',sourceUrl:'https://new.dndtools.org/classes/beguiler-100',progression:[['Level','Special'],['3rd','Advanced learning'],['7th','Advanced learning']]};
const beguiler7={...legacyChoice,className:'Beguiler',classDefinition:beguilerClass35,classLevels:[{name:'Beguiler',edition:'3.5',catalogId:beguilerClass35.catalogId,level:7,definition:beguilerClass35}],level:7};
const beguiler6={...beguiler7,classLevels:[{...beguiler7.classLevels[0],level:6}],level:6};
const beguilerPlan=featureChoicePlan(beguiler7,beguiler6);
const beguilerLearning=beguilerPlan.groups.find(group=>group.label==='Advanced Learning');
assert(beguilerLearning,'Beguiler level 7 requests its next Advanced Learning spell');
assert.equal(beguilerLearning.required,1);

const favoredSoulClass35={name:'Favored Soul',edition:'3.5',sourceId:'classes/favored-soul-7',catalogId:'dndtools:classes/favored-soul-7',sourceUrl:'https://new.dndtools.org/classes/favored-soul-7',progression:[['Level','Special'],['3rd','Deity’s weapon focus'],['5th','Energy resistance (1st type)'],['10th','Energy resistance (2nd type)']]};
const favoredSoul3={...legacyChoice,className:'Favored Soul',classDefinition:favoredSoulClass35,classLevels:[{name:'Favored Soul',edition:'3.5',catalogId:favoredSoulClass35.catalogId,level:3,definition:favoredSoulClass35}],level:3};
const favoredSoul2={...favoredSoul3,classLevels:[{...favoredSoul3.classLevels[0],level:2}],level:2};
const favoredSoul3Plan=featureChoicePlan(favoredSoul3,favoredSoul2);
const deityFocus=favoredSoul3Plan.groups.find(group=>group.label==='Deity’s Weapon Focus');
assert.equal(deityFocus?.choiceKind,'feat');
const focusedSoul=applyFeatureChoices(favoredSoul3,favoredSoul2,{[deityFocus.id]:['Weapon Focus (Longsword)']});
assert(focusedSoul.feats.some(feat=>feat.name==='Weapon Focus (Longsword)'&&feat.sourceType==='class-choice'));

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

const warmageClass35={name:'Warmage',edition:'3.5',sourceId:'classes/warmage-5',catalogId:'dndtools:classes/warmage-5',sourceUrl:'https://new.dndtools.org/classes/warmage-5',progression:[['Level','Special'],['3rd','Advanced learning'],['6th','Advanced learning'],['11th','Advanced learning'],['16th','Advanced learning']]};
const warmage11={...legacyChoice,className:'Warmage',classDefinition:warmageClass35,classLevels:[{name:'Warmage',edition:'3.5',catalogId:warmageClass35.catalogId,level:11,definition:warmageClass35}],level:11};
const warmage10={...warmage11,classLevels:[{...warmage11.classLevels[0],level:10}],level:10};
const warmagePlan=featureChoicePlan(warmage11,warmage10);
const warmageLearning=warmagePlan.groups.find(group=>group.label==='Advanced Learning');
assert(warmageLearning,'Warmage level 11 requests Advanced Learning');
assert.equal(warmageLearning.required,1);
assert.equal(warmageLearning.choiceKind,'source');

assert.equal(skillNames.length,18);
console.log('PASS Expertise milestones and eligibility, Lore skill dependencies, Life training, class languages, 3.5 source-choice prompts, multiclass attribution, preserved choices, duplicates and manual combinations');
