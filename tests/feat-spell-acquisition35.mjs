import assert from 'node:assert/strict';
import {reconcileSpellAcquisition35} from '../src/lib/spellAcquisition35.js';

let featEngine;
try{
  featEngine=await import('../src/lib/featSpellAcquisition35.js');
}catch(error){
  assert.fail('3.5 feat spell acquisition engine must exist before these regressions can pass: '+error.message);
}
const {
  FEAT_SPELL_ACQUISITION35_VERSION,
  featSpellAcquisitionProfile35,
  featSpellAcquisitionPlan35,
  featSpellAcquisitionComplete35,
  setFeatSpellAcquisitionChoices35,
  autoResolveFeatSpellAcquisition35
}=featEngine;

assert.equal(FEAT_SPELL_ACQUISITION35_VERSION,1);

const spell=(catalogId,name,level,classes,school='Universal')=>({catalogId,name,level,classes,school,edition:'3.5',category:'spell'});
const acid=spell('dndtools:spells/acid-splash','Acid Splash',0,['Sorcerer','Wizard'],'Conjuration');
const detect=spell('dndtools:spells/detect-magic','Detect Magic',0,['Sorcerer','Wizard'],'Divination');
const magicMissile=spell('dndtools:spells/magic-missile','Magic Missile',1,['Sorcerer','Wizard'],'Evocation');
const mageArmor=spell('dndtools:spells/mage-armor','Mage Armor',1,['Sorcerer','Wizard'],'Conjuration');
const scorching=spell('dndtools:spells/scorching-ray','Scorching Ray',2,['Sorcerer','Wizard'],'Evocation');
const fireball=spell('dndtools:spells/fireball','Fireball',3,['Sorcerer','Wizard'],'Evocation');
const bless=spell('dndtools:spells/bless','Bless',1,['Cleric'],'Enchantment');
const allSpells=[acid,detect,magicMissile,mageArmor,scorching,fireball,bless];

const extraSpell={id:'feat-extra-1',catalogId:'dndtools:feats/extra-spell-1044',name:'Extra Spell',edition:'3.5'};
const extraProfile=featSpellAcquisitionProfile35(extraSpell);
assert(extraProfile);
assert.equal(extraProfile.effect,'learned-spell');
assert.equal(extraProfile.count,1);
assert.equal(extraProfile.affectsQuota,false);
assert.equal(extraProfile.repeatable,true);

const sorcererId='dndtools:classes/sorcerer-98';
const sorcerer={
  ruleset:'3.5',level:4,abilities:{str:10,dex:10,con:10,int:12,wis:10,cha:18},
  classLevels:[{catalogId:sorcererId,name:'Sorcerer',edition:'3.5',level:4}],
  feats:[],spells:[],
  spellAcquisition35:{
    [sorcererId]:{
      profileId:'sorcerer-35',classId:sorcererId,classLevel:4,active:true,orphaned:false,
      acquisitions:[
        {id:'s-acid',spellKey:acid.catalogId,spellName:acid.name,spellLevel:0,origin:'starting',active:true,affectsQuota:true,spell:acid},
        {id:'s-detect',spellKey:detect.catalogId,spellName:detect.name,spellLevel:0,origin:'starting',active:true,affectsQuota:true,spell:detect}
      ],replacements:[],campaignEntries:[]
    }
  }
};
const sorcPlan=featSpellAcquisitionPlan35(extraSpell,sorcerer,allSpells);
assert.equal(sorcPlan.supported,true);
assert.equal(sorcPlan.targetClasses.length,1);
assert.equal(sorcPlan.targetClasses[0].classId,sorcererId);
assert.equal(sorcPlan.effect,'known-spell');
assert.equal(sorcPlan.count,1);
assert.equal(sorcPlan.maxSpellLevel,1,'Extra Spell is capped one below Sorcerer 4 highest castable level');
assert(sorcPlan.options.some(s=>s.name==='Magic Missile'));
assert(sorcPlan.options.some(s=>s.name==='Mage Armor'));
assert(!sorcPlan.options.some(s=>s.name==='Scorching Ray'),'Extra Spell excludes the current highest spell level');
assert(!sorcPlan.options.some(s=>s.name==='Bless'),'Extra Spell stays on the target class spell list');
assert(!sorcPlan.options.some(s=>s.name==='Acid Splash'),'already known spell is not offered again');
assert.equal(featSpellAcquisitionComplete35(extraSpell,sorcerer),false);

const extraResolved=setFeatSpellAcquisitionChoices35(extraSpell,sorcerer,{
  targetClassId:sorcererId,spellIds:[magicMissile.catalogId]
},allSpells);
assert.equal(featSpellAcquisitionComplete35(extraResolved,sorcerer),true);
assert.equal(extraResolved.spellAcquisitionChoices35.entries[0].name,'Magic Missile');
assert.equal(extraResolved.spellAcquisitionChoices35.effect,'known-spell');

const sorcererWithFeat=reconcileSpellAcquisition35({...sorcerer,feats:[extraResolved]});
const sorcBucket=sorcererWithFeat.spellAcquisition35[sorcererId];
const featKnown=sorcBucket.acquisitions.find(a=>a.origin==='feat'&&a.sourceFeatInstanceId==='feat-extra-1');
assert(featKnown,'Extra Spell creates a source-owned acquisition');
assert.equal(featKnown.spellName,'Magic Missile');
assert.equal(featKnown.affectsQuota,false,'Extra Spell does not consume the ordinary Sorcerer spells-known quota');
assert(sorcererWithFeat.spells.some(s=>s.name==='Magic Missile'&&s.castingClassId===sorcererId));

const removedFeat=reconcileSpellAcquisition35({...sorcererWithFeat,feats:[]});
assert(!removedFeat.spellAcquisition35[sorcererId].acquisitions.some(a=>a.sourceFeatInstanceId==='feat-extra-1'),'removing the feat removes only its owned acquisition');
assert(!removedFeat.spells.some(s=>s.name==='Magic Missile'),'feat-only runtime ownership disappears with the feat');

const independentlyKnown={
  ...sorcerer,
  spellAcquisition35:{
    [sorcererId]:{
      ...sorcerer.spellAcquisition35[sorcererId],
      acquisitions:[...sorcerer.spellAcquisition35[sorcererId].acquisitions,
        {id:'s-mm',spellKey:magicMissile.catalogId,spellName:magicMissile.name,spellLevel:1,origin:'starting',active:true,affectsQuota:true,spell:magicMissile}]
    }
  }
};
const sharedOwnership=reconcileSpellAcquisition35({...independentlyKnown,feats:[extraResolved]});
assert.equal(sharedOwnership.spells.filter(s=>s.name==='Magic Missile'&&s.castingClassId===sorcererId).length,1,'independent + feat ownership coalesces to one runtime row');
const sharedAfterRemoval=reconcileSpellAcquisition35({...sharedOwnership,feats:[]});
assert(sharedAfterRemoval.spells.some(s=>s.name==='Magic Missile'),'removing feat preserves independent ownership');

const wizardId='dndtools:classes/wizard-99';
const wizard={
  ruleset:'3.5',level:5,abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:10},
  classLevels:[{catalogId:wizardId,name:'Wizard',edition:'3.5',level:5}],
  feats:[],spells:[],
  spellAcquisition35:{[wizardId]:{profileId:'wizard-35',classId:wizardId,classLevel:5,active:true,orphaned:false,acquisitions:[],replacements:[],campaignEntries:[]}}
};
const wizPlan=featSpellAcquisitionPlan35({...extraSpell,id:'feat-extra-wiz'},wizard,allSpells);
assert.equal(wizPlan.effect,'spellbook-entry');
assert.equal(wizPlan.maxSpellLevel,2,'Wizard 5 Extra Spell can learn up to 2nd level');
assert(wizPlan.options.some(s=>s.name==='Scorching Ray'));
assert(!wizPlan.options.some(s=>s.name==='Fireball'));

const wizResolved=setFeatSpellAcquisitionChoices35({...extraSpell,id:'feat-extra-wiz'},wizard,{targetClassId:wizardId,spellIds:[scorching.catalogId]},allSpells);
const wizardWithFeat=reconcileSpellAcquisition35({...wizard,feats:[wizResolved]});
const wizFeatAcq=wizardWithFeat.spellAcquisition35[wizardId].acquisitions.find(a=>a.sourceFeatInstanceId==='feat-extra-wiz');
assert.equal(wizFeatAcq.origin,'feat');
assert.equal(wizFeatAcq.spellName,'Scorching Ray');
assert.equal(wizardWithFeat.spells.find(s=>s.name==='Scorching Ray').prepared,false,'feat-added Wizard spell enters the spellbook, not prepared state');

const fixedFeat={
  id:'feat-fixed',catalogId:'reviewed:fixed-spellbook-feat',name:'Reviewed Fixed Spellbook Feat',edition:'3.5',
  spellAcquisition35:{effect:'spellbook-entry',count:1,fixedSpellIds:[magicMissile.catalogId],required:true,affectsQuota:false}
};
const fixedPlan=featSpellAcquisitionPlan35(fixedFeat,wizard,allSpells);
assert.equal(fixedPlan.fixed,true);
assert.equal(fixedPlan.requiresChoice,false);
const fixedResolved=autoResolveFeatSpellAcquisition35(fixedFeat,wizard,allSpells);
assert.equal(featSpellAcquisitionComplete35(fixedResolved,wizard),true);
assert.equal(fixedResolved.spellAcquisitionChoices35.entries[0].name,'Magic Missile');
const fixedChar=reconcileSpellAcquisition35({...wizard,feats:[fixedResolved]});
assert(fixedChar.spells.some(s=>s.name==='Magic Missile'),'fixed spellbook feat automatically materializes its named spell');

const accessOnly={id:'spell-reprieve',catalogId:'dndtools:feats/spell-reprieve-2709',name:'Spell Reprieve',edition:'3.5'};
const accessPlan=featSpellAcquisitionPlan35(accessOnly,wizard,allSpells);
assert.equal(accessPlan.supported,true);
assert.equal(accessPlan.effect,'access-only');
assert.equal(accessPlan.requiresAcquisition,false);
assert.equal(featSpellAcquisitionComplete35(accessOnly,wizard),true,'access-only feat does not block the acquisition subsystem');
const accessChar=reconcileSpellAcquisition35({...wizard,feats:[accessOnly]});
assert.equal(accessChar.spellAcquisition35[wizardId].acquisitions.length,0,'access-only feat does not become spellbook ownership');

const magicInitiate={id:'mi',catalogId:'2014:magic-initiate',name:'Magic Initiate',edition:'2014'};
assert.equal(featSpellAcquisitionProfile35(magicInitiate),null,'feat-casting subsystem feats do not become 3.5 class acquisitions');

const proseOnly={id:'prose',name:'Unstructured Test Feat',edition:'3.5',description:'You learn one additional spell.'};
assert.equal(featSpellAcquisitionProfile35(proseOnly),null,'arbitrary feat prose is never parsed into acquisition automation');

console.log('PASS immediate feat-driven 3.5 spell acquisition, fixed grants, access separation, quota isolation, and removal');
