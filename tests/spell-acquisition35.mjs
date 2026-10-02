import assert from 'node:assert/strict';

let engine;
try {
  engine = await import('../src/lib/spellAcquisition35.js');
} catch (error) {
  assert.fail('3.5 spell acquisition engine must exist before these regressions can pass: ' + error.message);
}

const {
  SPELL_ACQUISITION35_VERSION,
  spellAcquisitionProfile35,
  spellKnownLimits35,
  spellAcquisitionEvents35,
  validateSpellReplacement35,
  reconcileSpellAcquisition35,
  applySpellAcquisitionEvent35,
  activeAcquiredSpells35,
  spellAcquisitionPicksComplete35,
  wizardCampaignSpellCandidates35,
  recordWizardCampaignAcquisition35,
  restSpellAcquisition35,
  spellAcquisitionCandidates35,
  spellbookCampaignSpellCandidates35,
  recordSpellbookCampaignAcquisition35
} = engine;

assert.equal(SPELL_ACQUISITION35_VERSION, 1);

for (const id of [
  'classes/sorcerer-98',
  'classes/sorcerer-46',
  'classes/sorcerer-70',
  'classes/sorcerer-109',
  'dndtools:classes/sorcerer-98'
]) {
  const profile = spellAcquisitionProfile35(id);
  assert(profile, id + ' must resolve an acquisition profile');
  assert.equal(profile.id, 'sorcerer-35');
  assert.equal(profile.kind, 'known-table');
}

for (const id of ['classes/wizard-99', 'classes/wizard-47', 'classes/wizard-71', 'classes/wizard-110']) {
  const profile = spellAcquisitionProfile35({ sourceId: id, name: 'Wizard' });
  assert(profile, id + ' must resolve an acquisition profile');
  assert.equal(profile.id, 'wizard-35');
  assert.equal(profile.kind, 'spellbook');
}

assert.equal(spellAcquisitionProfile35('classes/hexblade-19')?.id, 'hexblade-35');
assert.equal(spellAcquisitionProfile35('classes/fighter-90'), null);

assert.deepEqual(spellKnownLimits35('sorcerer-35', 1), { 0: 4, 1: 2 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 4), { 0: 6, 1: 3, 2: 1 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 10), { 0: 9, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 });
assert.deepEqual(spellKnownLimits35('sorcerer-35', 20), { 0: 9, 1: 5, 2: 5, 3: 4, 4: 4, 5: 4, 6: 3, 7: 3, 8: 3, 9: 3 });

assert.deepEqual(spellKnownLimits35('hexblade-35', 1), {});
assert.deepEqual(spellKnownLimits35('hexblade-35', 3), {});
assert.deepEqual(spellKnownLimits35('hexblade-35', 4), { 1: 2 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 8), { 1: 4, 2: 2 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 12), { 1: 4, 2: 4, 3: 3 });
assert.deepEqual(spellKnownLimits35('hexblade-35', 20), { 1: 5, 2: 5, 3: 5, 4: 5 });

const baseCharacter = (classId, name, level, cha = 18) => ({
  ruleset: '3.5',
  level,
  abilities: { str: 10, dex: 10, con: 10, int: 18, wis: 10, cha },
  classLevels: [{ catalogId: 'dndtools:' + classId, name, edition: '3.5', level }],
  spellAcquisition35: {}
});

const sorcerer = baseCharacter('classes/sorcerer-98', 'Sorcerer', 4, 18);
const sorcEvents = spellAcquisitionEvents35(sorcerer, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 3,
  targetClassLevel: 4
});
assert.deepEqual(
  sorcEvents.filter(e => e.kind === 'choose-known-spells').map(e => [e.spellLevel, e.count]),
  [[0, 1], [2, 1]],
  'Sorcerer level 4 gains only the per-spell-level table deltas'
);

const sorcReplace = sorcEvents.find(e => e.kind === 'optional-replacement');
assert(sorcReplace, 'Sorcerer level 4 offers one optional replacement');
assert.equal(sorcReplace.count, 1);
assert.equal(sorcReplace.maxReplacementSpellLevel, 0);

const sorc5 = baseCharacter('classes/sorcerer-98', 'Sorcerer', 5, 18);
assert(!spellAcquisitionEvents35(sorc5, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 4,
  targetClassLevel: 5
}).some(e => e.kind === 'optional-replacement'));

const sorc6 = baseCharacter('classes/sorcerer-98', 'Sorcerer', 6, 18);
assert(spellAcquisitionEvents35(sorc6, {
  classId: 'dndtools:classes/sorcerer-98',
  previousClassLevel: 5,
  targetClassLevel: 6
}).some(e => e.kind === 'optional-replacement'));

const lowChaHex = baseCharacter('classes/hexblade-19', 'Hexblade', 4, 11);
const highChaHex = baseCharacter('classes/hexblade-19', 'Hexblade', 4, 12);
assert.equal(
  spellAcquisitionEvents35(lowChaHex, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: 3,
    targetClassLevel: 4
  }).filter(e => e.kind === 'choose-known-spells').length,
  0,
  'Hexblade level 4 first-level known spells require enough Charisma for a bonus 1st-level spell'
);

const highHexEvents = spellAcquisitionEvents35(highChaHex, {
  classId: 'dndtools:classes/hexblade-19',
  previousClassLevel: 3,
  targetClassLevel: 4
});
assert.deepEqual(highHexEvents.filter(e => e.kind === 'choose-known-spells').map(e => [e.spellLevel, e.count]), [[1, 2]]);
assert.equal(highHexEvents.find(e => e.kind === 'choose-known-spells')?.conditionalAccess, true);

for (const level of [12, 15, 18]) {
  const c = baseCharacter('classes/hexblade-19', 'Hexblade', level, 18);
  assert(spellAcquisitionEvents35(c, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: level - 1,
    targetClassLevel: level
  }).some(e => e.kind === 'optional-replacement'), 'Hexblade ' + level + ' offers replacement');
}

for (const level of [11, 13, 14, 16, 17, 19, 20]) {
  const c = baseCharacter('classes/hexblade-19', 'Hexblade', level, 18);
  assert(!spellAcquisitionEvents35(c, {
    classId: 'dndtools:classes/hexblade-19',
    previousClassLevel: level - 1,
    targetClassLevel: level
  }).some(e => e.kind === 'optional-replacement'), 'Hexblade ' + level + ' does not offer replacement');
}

const wizard = baseCharacter('classes/wizard-99', 'Wizard', 1, 10);
const wizStart = spellAcquisitionEvents35(wizard, {
  classId: 'dndtools:classes/wizard-99',
  previousClassLevel: 0,
  targetClassLevel: 1
});
assert.equal(wizStart.length, 1);
assert.equal(wizStart[0].kind, 'wizard-starting-spellbook');
assert.equal(wizStart[0].firstLevelChoices, 7, 'INT 18 means 3 + 4 starting first-level choices');
assert.equal(wizStart[0].automaticCantrips, true);

const wiz2 = baseCharacter('classes/wizard-99', 'Wizard', 2, 10);
const wizLevel2 = spellAcquisitionEvents35(wiz2, {
  classId: 'dndtools:classes/wizard-99',
  previousClassLevel: 1,
  targetClassLevel: 2
});
assert.equal(wizLevel2.length, 1);
assert.equal(wizLevel2[0].kind, 'wizard-free-spellbook-additions');
assert.equal(wizLevel2[0].count, 2);
assert.equal(wizLevel2[0].maxSpellLevel, 1);

const replacementCharacter = {
  ...sorcerer,
  spellAcquisition35: {
    'dndtools:classes/sorcerer-98': {
      profileId: 'sorcerer-35',
      acquisitions: [
        { id: 'known-0', spellKey: 'spell:detect-magic', spellName: 'Detect Magic', spellLevel: 0, active: true, affectsQuota: true },
        { id: 'known-1', spellKey: 'spell:magic-missile', spellName: 'Magic Missile', spellLevel: 1, active: true, affectsQuota: true }
      ]
    }
  }
};

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:light', name: 'Light', level: 0, classes: ['Sorcerer'] }
}).valid, true);

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:mage-armor', name: 'Mage Armor', level: 1, classes: ['Sorcerer'] }
}).valid, false, 'replacement must be the same spell level');

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:magic-missile',
  addedSpell: { catalogId: 'spell:shield', name: 'Shield', level: 1, classes: ['Sorcerer'] }
}).valid, false, 'replacement level must be at least two below the highest castable level');

assert.equal(validateSpellReplacement35(replacementCharacter, sorcReplace, {
  removedSpellKey: 'spell:detect-magic',
  addedSpell: { catalogId: 'spell:detect-magic', name: 'Detect Magic', level: 0, classes: ['Sorcerer'] }
}).valid, false, 'replacement cannot duplicate a spell already known through the same class');

console.log('PASS 3.5 spell acquisition profiles, known tables, events, and replacement rules');


const spell = (catalogId,name,level,classes,school='Evocation') => ({
  catalogId,name,level,classes,school,edition:'3.5',category:'spell',
  description:name+' test spell.'
});

const sorcerer2=baseCharacter('classes/sorcerer-98','Sorcerer',2,18);
const sorcerer2Event=spellAcquisitionEvents35(sorcerer2,{
  classId:'dndtools:classes/sorcerer-98',
  previousClassLevel:1,
  targetClassLevel:2
}).find(event=>event.kind==='choose-known-spells'&&event.spellLevel===0);
assert(sorcerer2Event&&sorcerer2Event.count===1);

const learnedDetect=applySpellAcquisitionEvent35(sorcerer2,sorcerer2Event,[
  spell('dndtools:spells/detect-magic','Detect Magic',0,['Sorcerer'],'Divination')
]);
const learnedBucket=learnedDetect.spellAcquisition35['dndtools:classes/sorcerer-98'];
assert.equal(learnedBucket.profileId,'sorcerer-35');
assert.equal(learnedBucket.classLevel,2);
assert.equal(learnedBucket.acquisitions.length,1);
assert.equal(learnedBucket.acquisitions[0].origin,'level-up');
assert.equal(learnedBucket.acquisitions[0].sourceEventId,sorcerer2Event.eventId);
assert.equal(learnedBucket.acquisitions[0].spellLevel,0);
assert.equal(learnedBucket.acquisitions[0].affectsQuota,true);

const reconciledKnown=reconcileSpellAcquisition35(learnedDetect);
assert.equal(reconciledKnown.spells.length,1);
assert.equal(reconciledKnown.spells[0].name,'Detect Magic');
assert.equal(reconciledKnown.spells[0].castingClassId,'dndtools:classes/sorcerer-98');
assert.deepEqual(reconciledKnown.spells[0].spellAcquisitionIds,[learnedBucket.acquisitions[0].id]);
assert.equal(reconciledKnown.spells[0].prepared,true,'known-table spells are castable without preparation');
const reconciledAgain=reconcileSpellAcquisition35(reconciledKnown);
assert.deepEqual(reconciledAgain.spells,reconciledKnown.spells,'reconciliation is idempotent');

const preparedWizardSpell=spell('dndtools:spells/magic-missile','Magic Missile',1,['Wizard'],'Evocation');
const wizardId='dndtools:classes/wizard-99';
const wizardOwnership={
  ruleset:'3.5',level:3,abilities:{int:18,cha:10,wis:10},
  classLevels:[{catalogId:wizardId,name:'Wizard',edition:'3.5',level:3}],
  spells:[{...preparedWizardSpell,id:'runtime-mm',castingClassId:wizardId,prepared:true}],
  spellAcquisition35:{
    [wizardId]:{
      profileId:'wizard-35',classLevel:3,active:true,orphaned:false,
      acquisitions:[{
        id:'wizard-mm',spellKey:preparedWizardSpell.catalogId,spellName:preparedWizardSpell.name,spellLevel:1,
        acquiredAtClassLevel:1,origin:'starting',sourceEventId:'wizard-start',active:true,affectsQuota:false,spell:preparedWizardSpell
      }],
      replacements:[],campaignEntries:[]
    }
  }
};
const wizardReconciled=reconcileSpellAcquisition35(wizardOwnership);
assert.equal(wizardReconciled.spells.length,1,'legacy runtime row is adopted instead of duplicated');
assert.equal(wizardReconciled.spells[0].id,'runtime-mm');
assert.equal(wizardReconciled.spells[0].prepared,true,'prepared flag survives reconciliation');
assert.deepEqual(wizardReconciled.spells[0].spellAcquisitionIds,['wizard-mm']);

const sharedSpell=spell('dndtools:spells/arcane-mark','Arcane Mark',0,['Sorcerer','Wizard'],'Universal');
const multi={
  ruleset:'3.5',level:4,abilities:{int:18,cha:18,wis:10},
  classLevels:[
    {catalogId:'dndtools:classes/sorcerer-98',name:'Sorcerer',edition:'3.5',level:2},
    {catalogId:wizardId,name:'Wizard',edition:'3.5',level:2}
  ],
  spells:[],
  spellAcquisition35:{
    'dndtools:classes/sorcerer-98':{
      profileId:'sorcerer-35',classLevel:2,active:true,orphaned:false,
      acquisitions:[{id:'sorc-mark',spellKey:sharedSpell.catalogId,spellName:sharedSpell.name,spellLevel:0,acquiredAtClassLevel:1,origin:'starting',sourceEventId:'sorc-start',active:true,affectsQuota:true,spell:sharedSpell}]
    },
    [wizardId]:{
      profileId:'wizard-35',classLevel:2,active:true,orphaned:false,
      acquisitions:[{id:'wiz-mark',spellKey:sharedSpell.catalogId,spellName:sharedSpell.name,spellLevel:0,acquiredAtClassLevel:1,origin:'starting',sourceEventId:'wiz-start',active:true,affectsQuota:false,spell:sharedSpell}]
    }
  }
};
const multiReconciled=reconcileSpellAcquisition35(multi);
assert.equal(multiReconciled.spells.filter(row=>row.name==='Arcane Mark').length,2,'two classes preserve independent runtime ownership');
assert.equal(activeAcquiredSpells35(multiReconciled,wizardId).length,1);
assert.equal(activeAcquiredSpells35(multiReconciled,'dndtools:classes/sorcerer-98').length,1);

const sameClassDuplicate={
  ...wizardOwnership,
  spells:[],
  spellAcquisition35:{
    [wizardId]:{
      ...wizardOwnership.spellAcquisition35[wizardId],
      acquisitions:[
        wizardOwnership.spellAcquisition35[wizardId].acquisitions[0],
        {...wizardOwnership.spellAcquisition35[wizardId].acquisitions[0],id:'wizard-mm-feat',origin:'feat',sourceFeatId:'feat:test',affectsQuota:false}
      ]
    }
  }
};
const sameClassReconciled=reconcileSpellAcquisition35(sameClassDuplicate);
assert.equal(sameClassReconciled.spells.length,1,'same class + same spell coalesces to one runtime row');
assert.deepEqual(new Set(sameClassReconciled.spells[0].spellAcquisitionIds),new Set(['wizard-mm','wizard-mm-feat']));

const unrelated=spell('dndtools:spells/bless','Bless',1,['Cleric'],'Enchantment');
const withUnrelated=reconcileSpellAcquisition35({...wizardOwnership,spells:[
  ...wizardOwnership.spells,
  {...unrelated,id:'domain-bless',castingClassId:'dndtools:classes/cleric-91',auto:true,source:'Healing Domain'}
]});
assert(withUnrelated.spells.some(row=>row.id==='domain-bless'),'unrelated domain/feature spell survives reconciliation');

const removedWizard=reconcileSpellAcquisition35({...wizardOwnership,classLevels:[
  {catalogId:'dndtools:classes/fighter-90',name:'Fighter',edition:'3.5',level:3}
]});
assert.equal(removedWizard.spellAcquisition35[wizardId].active,false);
assert.equal(removedWizard.spellAcquisition35[wizardId].orphaned,true);
assert.equal(removedWizard.spells.some(row=>row.castingClassId===wizardId),false,'orphaned Wizard runtime spells leave active casting views');
assert.equal(removedWizard.spellAcquisition35[wizardId].acquisitions.length,1,'Wizard acquisition history is archived, not deleted');

const readdedWizard=reconcileSpellAcquisition35({...removedWizard,classLevels:[
  {catalogId:wizardId,name:'Wizard',edition:'3.5',level:3}
]});
assert.equal(readdedWizard.spellAcquisition35[wizardId].active,true);
assert.equal(readdedWizard.spellAcquisition35[wizardId].orphaned,false);
assert(readdedWizard.spells.some(row=>row.name==='Magic Missile'),'same exact Wizard source can reactivate compatible archived history');

const enchantmentSpell=spell('dndtools:spells/charm-person','Charm Person',1,['Wizard'],'Enchantment');
const archivedEnchantment={
  ...removedWizard,
  spellAcquisition35:{
    [wizardId]:{
      ...removedWizard.spellAcquisition35[wizardId],
      acquisitions:[{id:'wizard-charm',spellKey:enchantmentSpell.catalogId,spellName:enchantmentSpell.name,spellLevel:1,acquiredAtClassLevel:1,origin:'starting',sourceEventId:'wizard-start',active:true,affectsQuota:false,spell:enchantmentSpell}]
    }
  },
  legacyCastingChoices:{[wizardId]:{school:'Evocation',prohibited:['Enchantment','Necromancy']}}
};
const prohibitedReadd=reconcileSpellAcquisition35({...archivedEnchantment,classLevels:[
  {catalogId:wizardId,name:'Wizard',edition:'3.5',level:3}
]});
assert.equal(prohibitedReadd.spells.some(row=>row.name==='Charm Person'),false,'prohibited archived spell is not silently reactivated');
assert(prohibitedReadd.spellAcquisition35Incomplete.some(entry=>entry.classId===wizardId&&entry.reasons.some(reason=>/prohibited/i.test(reason))));

const excess={
  ...sorcerer2,
  spells:[],
  spellAcquisition35:{
    'dndtools:classes/sorcerer-98':{
      profileId:'sorcerer-35',classLevel:2,active:true,orphaned:false,
      acquisitions:Array.from({length:6},(_,i)=>({
        id:'extra-'+i,spellKey:'spell:extra-'+i,spellName:'Extra '+i,spellLevel:0,acquiredAtClassLevel:1,
        origin:'starting',sourceEventId:'start',active:true,affectsQuota:true,
        spell:spell('spell:extra-'+i,'Extra '+i,0,['Sorcerer'],'Universal')
      }))
    }
  }
};
const excessReconciled=reconcileSpellAcquisition35(excess);
assert(excessReconciled.spellAcquisition35Incomplete.some(entry=>entry.classId==='dndtools:classes/sorcerer-98'&&entry.reasons.some(reason=>/quota exceeded/i.test(reason))));

console.log('PASS persisted 3.5 spell acquisition reconciliation, multiclass ownership, archival, and runtime synchronization');


const sorcerer1=baseCharacter('classes/sorcerer-98','Sorcerer',1,18);
const sorcererStartEvents=spellAcquisitionEvents35(sorcerer1,{
  classId:'dndtools:classes/sorcerer-98',previousClassLevel:0,targetClassLevel:1
});
assert.deepEqual(
  sorcererStartEvents.filter(event=>event.kind==='choose-known-spells').map(event=>[event.spellLevel,event.count]),
  [[0,4],[1,2]],
  'Level-1 Sorcerer setup requires exact source-table known-spell counts'
);
assert.equal(spellAcquisitionPicksComplete35(sorcererStartEvents,{}),false);
const sorcStartPicks=Object.fromEntries(sorcererStartEvents.map(event=>[
  event.eventId,
  Array.from({length:event.count},(_,i)=>'spell-'+event.spellLevel+'-'+i)
]));
assert.equal(spellAcquisitionPicksComplete35(sorcererStartEvents,sorcStartPicks),true);
assert.equal(
  spellAcquisitionPicksComplete35(sorcererStartEvents,sorcStartPicks,new Set(['spell-0-0','spell-0-1','spell-0-2','spell-0-3','spell-1-0'])),
  false,
  'stale spell picks become incomplete when legality changes'
);

const wizardStartEvents=spellAcquisitionEvents35(wizardOwnership,{
  classId:wizardId,previousClassLevel:0,targetClassLevel:1
});
assert.equal(wizardStartEvents.length,1);
assert.equal(spellAcquisitionPicksComplete35(wizardStartEvents,{}),false);
assert.equal(spellAcquisitionPicksComplete35(wizardStartEvents,{
  [wizardStartEvents[0].eventId]:{firstLevel:Array.from({length:wizardStartEvents[0].firstLevelChoices},(_,i)=>'wizard-first-'+i)}
}),true);

const hexblade1=baseCharacter('classes/hexblade-19','Hexblade',1,18);
assert.deepEqual(spellAcquisitionEvents35(hexblade1,{
  classId:'dndtools:classes/hexblade-19',previousClassLevel:0,targetClassLevel:1
}),[],'Hexblade level 1 has no spell acquisition');

const wizardStartEvent=wizardStartEvents[0];
const legalCantrip=spell('dndtools:spells/acid-splash','Acid Splash',0,['Wizard'],'Conjuration');
const legalFirst=spell('dndtools:spells/magic-missile','Magic Missile',1,['Wizard'],'Evocation');
const illegalFirst=spell('dndtools:spells/charm-person','Charm Person',1,['Wizard'],'Enchantment');
const wizardWithProhibition={
  ...wizardOwnership,
  classLevels:[{catalogId:wizardId,name:'Wizard',edition:'3.5',level:1}],
  level:1,
  spells:[],
  spellAcquisition35:{},
  legacyCastingChoices:{[wizardId]:{school:'Evocation',prohibited:['Enchantment','Necromancy']}}
};
assert.throws(()=>applySpellAcquisitionEvent35(wizardWithProhibition,wizardStartEvent,{
  cantrips:[legalCantrip],
  firstLevel:[
    illegalFirst,
    ...Array.from({length:wizardStartEvent.firstLevelChoices-1},(_,i)=>spell('spell:legal-'+i,'Legal '+i,1,['Wizard'],'Evocation'))
  ]
}),/prohibited/i,'engine rejects prohibited Wizard starting spells even if malformed UI submits one');

console.log('PASS 3.5 guided setup acquisition requirements and prohibited-school validation');

const wizardLevel3Character={
  ...wizardOwnership,
  level:3,
  classLevels:[{catalogId:wizardId,name:'Wizard',edition:'3.5',level:3}],
  spellAcquisition35:wizardOwnership.spellAcquisition35
};
const wizardLevel3Free=spellAcquisitionEvents35(wizardLevel3Character,{
  classId:wizardId,previousClassLevel:2,targetClassLevel:3
}).find(event=>event.kind==='wizard-free-spellbook-additions');
assert(wizardLevel3Free);
assert.equal(wizardLevel3Free.maxSpellLevel,2);
const wizardFreeApplied=applySpellAcquisitionEvent35(wizardLevel3Character,wizardLevel3Free,[
  spell('dndtools:spells/scorching-ray','Scorching Ray',2,['Wizard'],'Evocation'),
  spell('dndtools:spells/web','Web',2,['Wizard'],'Conjuration')
]);
assert.equal(
  wizardFreeApplied.spellAcquisition35[wizardId].acquisitions.filter(x=>x.origin==='wizard-free-level-up'&&x.acquiredAtClassLevel===3).length,
  2,
  'Wizard free level-up additions accept mixed legal spell levels up to the event maximum'
);
console.log('PASS Wizard free spellbook additions are not incorrectly constrained to level 0');

const sorcererLevel4Events=spellAcquisitionEvents35(baseCharacter('classes/sorcerer-98','Sorcerer',4,18),{
  classId:'dndtools:classes/sorcerer-98',previousClassLevel:3,targetClassLevel:4
});
const optionalLevel4=sorcererLevel4Events.find(event=>event.kind==='optional-replacement');
assert(optionalLevel4);
const requiredLevel4=sorcererLevel4Events.filter(event=>event.required!==false);
const requiredPicks=Object.fromEntries(requiredLevel4.map(event=>[
  event.eventId,Array.from({length:event.count},(_,i)=>'legal-'+event.spellLevel+'-'+i)
]));
const legalLevel4Ids=new Set([
  ...Object.values(requiredPicks).flat(),
  'spell:ray-of-frost'
]);
assert.equal(
  spellAcquisitionPicksComplete35(sorcererLevel4Events,requiredPicks,legalLevel4Ids),
  true,
  'optional replacement picks are skippable'
);
assert.equal(
  spellAcquisitionPicksComplete35(sorcererLevel4Events,{
    ...requiredPicks,
    [optionalLevel4.eventId]:{enabled:true}
  },legalLevel4Ids),
  false,
  'opting into replacement requires both replacement fields'
);
assert.equal(
  spellAcquisitionPicksComplete35(sorcererLevel4Events,{
    ...requiredPicks,
    [optionalLevel4.eventId]:{enabled:true,removedSpellKey:'spell:acid-splash',addedSpellId:'spell:ray-of-frost'}
  },legalLevel4Ids),
  true,
  'enabled optional replacement is complete with a legal replacement selection'
);
console.log('PASS optional replacement picks are skippable but complete when enabled');

const lowChaHexMissed=baseCharacter('classes/hexblade-19','Hexblade',5,11);
assert.equal(spellAcquisitionEvents35(lowChaHexMissed,{
  classId:'dndtools:classes/hexblade-19',previousClassLevel:4,targetClassLevel:5
}).filter(event=>event.kind==='choose-known-spells').length,0,'still-insufficient Charisma does not create the footnoted Hexblade spells');

const raisedChaHex={
  ...lowChaHexMissed,
  abilities:{...lowChaHexMissed.abilities,cha:12},
  spellAcquisition35:{
    'dndtools:classes/hexblade-19':{profileId:'hexblade-35',classLevel:4,active:true,orphaned:false,acquisitions:[]}
  }
};
const raisedChaEvents=spellAcquisitionEvents35(raisedChaHex,{
  classId:'dndtools:classes/hexblade-19',previousClassLevel:4,targetClassLevel:5
});
assert.deepEqual(
  raisedChaEvents.filter(event=>event.kind==='choose-known-spells').map(event=>[event.spellLevel,event.count]),
  [[1,2]],
  'raising Charisma later backfills a newly legal missing Hexblade known-spell quota'
);

const partialHex={
  ...raisedChaHex,
  spellAcquisition35:{
    'dndtools:classes/hexblade-19':{
      profileId:'hexblade-35',classLevel:4,active:true,orphaned:false,
      acquisitions:[{id:'hex-known-one',spellKey:'spell:one',spellName:'One',spellLevel:1,active:true,affectsQuota:true,origin:'level-up'}]
    }
  }
};
assert.deepEqual(
  spellAcquisitionEvents35(partialHex,{
    classId:'dndtools:classes/hexblade-19',previousClassLevel:4,targetClassLevel:5
  }).filter(event=>event.kind==='choose-known-spells').map(event=>[event.spellLevel,event.count]),
  [[1,1]],
  'backfill events request only the still-missing quota'
);
console.log('PASS known-table acquisition events backfill a newly legal missing quota');

const campaignWizard={
  ...wizardOwnership,
  level:3,
  currency:{gp:100},
  inventory:[{id:'scroll-1',name:'Scroll of Fireball'}],
  classLevels:[{catalogId:wizardId,name:'Wizard',edition:'3.5',level:3}],
  legacyCastingChoices:{[wizardId]:{school:'Evocation',prohibited:['Enchantment','Necromancy']}}
};
const fireball=spell('dndtools:spells/fireball','Fireball',3,['Wizard'],'Evocation');
const haste=spell('dndtools:spells/haste','Haste',3,['Wizard'],'Transmutation');
const charm=spell('dndtools:spells/charm-person-campaign','Charm Person',1,['Wizard'],'Enchantment');
const clericOnly=spell('dndtools:spells/cure-light','Cure Light Wounds',1,['Cleric'],'Conjuration');

assert.throws(()=>recordWizardCampaignAcquisition35(campaignWizard,wizardId,fireball,{
  origin:'copied-scroll',sourceNote:'Recovered scroll',confirmed:false
}),/confirm/i,'campaign acquisition requires explicit completion confirmation');
assert.throws(()=>recordWizardCampaignAcquisition35(campaignWizard,wizardId,fireball,{
  origin:'copied-scroll',sourceNote:'',confirmed:true
}),/source note/i,'campaign acquisition records where the spell came from');
assert.throws(()=>recordWizardCampaignAcquisition35(campaignWizard,wizardId,charm,{
  origin:'copied-spellbook',sourceNote:'Enemy spellbook',confirmed:true
}),/prohibited/i,'Wizard cannot copy a prohibited-school spell');
assert.throws(()=>recordWizardCampaignAcquisition35(campaignWizard,wizardId,clericOnly,{
  origin:'copied-scroll',sourceNote:'Cleric scroll',confirmed:true
}),/Wizard spell list/i,'campaign acquisition must be a legal Wizard spell');

const campaignCandidates=wizardCampaignSpellCandidates35(campaignWizard,wizardId,[
  fireball,haste,charm,clericOnly,preparedWizardSpell
]);
assert(campaignCandidates.some(x=>x.catalogId===fireball.catalogId),'Wizard may record a source-valid spellbook copy even before the spell level is castable');
assert(!campaignCandidates.some(x=>x.catalogId===charm.catalogId),'prohibited schools are excluded from campaign candidates');
assert(!campaignCandidates.some(x=>x.catalogId===clericOnly.catalogId),'non-Wizard spells are excluded');
assert(!campaignCandidates.some(x=>x.catalogId===preparedWizardSpell.catalogId),'already-owned spellbook entries are excluded');

const copied=recordWizardCampaignAcquisition35(campaignWizard,wizardId,fireball,{
  origin:'copied-scroll',
  sourceNote:'Recovered from the Ash Tower vault',
  confirmed:true,
  spellcraftOutcome:'passed',
  campaignCostNote:'Paid transcription materials at the table',
  campaignTimeNote:'One day study + 24 hours writing confirmed'
});
const copiedBucket=copied.spellAcquisition35[wizardId];
const copiedAcquisition=copiedBucket.acquisitions.find(x=>x.spellKey===fireball.catalogId);
assert.equal(copiedAcquisition.origin,'copied-scroll');
assert.equal(copiedAcquisition.affectsQuota,false);
assert.equal(copiedAcquisition.active,true);
assert(copied.spells.some(x=>x.name==='Fireball'&&x.castingClassId===wizardId));
assert.equal(copiedBucket.campaignEntries.length,1);
assert.equal(copiedBucket.campaignEntries[0].confirmed,true);
assert.equal(copiedBucket.campaignEntries[0].sourceNote,'Recovered from the Ash Tower vault');
assert.equal(copiedBucket.campaignEntries[0].spellcraftOutcome,'passed');
assert.deepEqual(copied.currency,campaignWizard.currency,'recording campaign acquisition does not deduct currency automatically');
assert.deepEqual(copied.inventory,campaignWizard.inventory,'recording a copied scroll does not consume inventory automatically');
assert.throws(()=>recordWizardCampaignAcquisition35(copied,wizardId,fireball,{
  origin:'copied-scroll',sourceNote:'Duplicate scroll',confirmed:true
}),/already.*spellbook/i,'same Wizard profile cannot acquire the same spell twice');

const researched=recordWizardCampaignAcquisition35(copied,wizardId,haste,{
  origin:'independent-research',sourceNote:'Downtime research project',confirmed:true
});
assert.equal(researched.spellAcquisition35[wizardId].acquisitions.find(x=>x.spellKey===haste.catalogId)?.origin,'independent-research');
assert.equal(
  researched.spellAcquisition35[wizardId].acquisitions.filter(x=>x.origin==='wizard-free-level-up').length,
  copied.spellAcquisition35[wizardId].acquisitions.filter(x=>x.origin==='wizard-free-level-up').length,
  'campaign spellbook additions never consume the two-free-spells-per-level quota'
);
console.log('PASS Wizard campaign spellbook acquisition provenance and legality');

const duskbladeId='dndtools:classes/duskblade-102';
const duskbladeProfile=spellAcquisitionProfile35(duskbladeId);
assert(duskbladeProfile,'Duskblade must resolve an acquisition profile');
assert.equal(duskbladeProfile.id,'duskblade-35');
assert.equal(duskbladeProfile.kind,'flex-known');

const duskblade1={
  ...baseCharacter('classes/duskblade-102','Duskblade',1,10),
  abilities:{str:10,dex:10,con:10,int:16,wis:10,cha:10}
};
const duskbladeStart=spellAcquisitionEvents35(duskblade1,{
  classId:duskbladeId,previousClassLevel:0,targetClassLevel:1
});
assert.deepEqual(
  duskbladeStart.filter(event=>event.kind==='choose-known-spells').map(event=>[event.spellLevel,event.count]),
  [[0,5],[1,2]],
  'Duskblade 1 learns two cantrips plus INT bonus cantrips and two 1st-level spells'
);
assert.equal(spellAcquisitionPicksComplete35(duskbladeStart,{}),false);

const duskblade2={
  ...duskblade1,
  level:2,
  classLevels:[{catalogId:duskbladeId,name:'Duskblade',edition:'3.5',level:2}]
};
const duskblade2Events=spellAcquisitionEvents35(duskblade2,{
  classId:duskbladeId,previousClassLevel:1,targetClassLevel:2
});
const duskblade2Learn=duskblade2Events.find(event=>event.kind==='choose-flex-known-spells');
assert(duskblade2Learn,'Duskblade gains one flexible known spell at every class level after 1st');
assert.equal(duskblade2Learn.count,1);
assert.equal(duskblade2Learn.maxSpellLevel,1);
assert.equal(spellAcquisitionPicksComplete35(duskblade2Events,{
  [duskblade2Learn.eventId]:['spell:swift-expeditious-retreat']
},new Set(['spell:swift-expeditious-retreat'])),true);

const duskblade5={
  ...duskblade1,
  level:5,
  classLevels:[{catalogId:duskbladeId,name:'Duskblade',edition:'3.5',level:5}]
};
const duskblade5Events=spellAcquisitionEvents35(duskblade5,{
  classId:duskbladeId,previousClassLevel:4,targetClassLevel:5
});
assert.equal(duskblade5Events.find(event=>event.kind==='choose-flex-known-spells')?.maxSpellLevel,2);
const duskblade5Replace=duskblade5Events.find(event=>event.kind==='optional-replacement');
assert(duskblade5Replace,'Duskblade 5 offers its first optional replacement');
assert.equal(duskblade5Replace.maxReplacementSpellLevel,0);

const duskblade6={
  ...duskblade5,
  level:6,
  classLevels:[{catalogId:duskbladeId,name:'Duskblade',edition:'3.5',level:6}]
};
assert(!spellAcquisitionEvents35(duskblade6,{
  classId:duskbladeId,previousClassLevel:5,targetClassLevel:6
}).some(event=>event.kind==='optional-replacement'),'even Duskblade levels do not offer replacement');

const duskblade9={
  ...duskblade5,
  level:9,
  classLevels:[{catalogId:duskbladeId,name:'Duskblade',edition:'3.5',level:9}]
};
const duskblade9Replace=spellAcquisitionEvents35(duskblade9,{
  classId:duskbladeId,previousClassLevel:8,targetClassLevel:9
}).find(event=>event.kind==='optional-replacement');
assert(duskblade9Replace);
assert.equal(duskblade9Replace.highestCastableSpellLevel,3);
assert.equal(duskblade9Replace.maxReplacementSpellLevel,1);

assert.throws(()=>applySpellAcquisitionEvent35(duskblade2,duskblade2Learn,[
  spell('spell:duskblade-too-high','Too High',2,['Duskblade'],'Evocation')
]),/not available/i,'flexible Duskblade acquisition rejects spells above the current maximum');

const duskbladeLearned=applySpellAcquisitionEvent35(duskblade2,duskblade2Learn,[
  spell('spell:swift-expeditious-retreat','Swift Expeditious Retreat',1,['Duskblade'],'Transmutation')
]);
assert.equal(duskbladeLearned.spellAcquisition35[duskbladeId].profileId,'duskblade-35');
assert.equal(duskbladeLearned.spellAcquisition35[duskbladeId].acquisitions.length,1);
assert.equal(duskbladeLearned.spells.find(row=>row.name==='Swift Expeditious Retreat')?.prepared,true,'Duskblade known spells are castable without preparation');
assert.equal(spellAcquisitionEvents35(duskbladeLearned,{
  classId:duskbladeId,previousClassLevel:1,targetClassLevel:2
}).some(event=>event.kind==='choose-flex-known-spells'),false,'completed Duskblade acquisition events are not offered again');

const duskbladeReplacementBase={
  ...duskblade5,
  spellAcquisition35:{
    [duskbladeId]:{
      profileId:'duskblade-35',classId:duskbladeId,classLevel:5,active:true,orphaned:false,
      acquisitions:[
        {id:'dusk-cantrip',spellKey:'spell:acid-splash',spellName:'Acid Splash',spellLevel:0,acquiredAtClassLevel:1,origin:'starting',sourceEventId:duskbladeId+':1:choose-known-spells:0',active:true,affectsQuota:true,spell:spell('spell:acid-splash','Acid Splash',0,['Duskblade'],'Conjuration')},
        {id:'dusk-first',spellKey:'spell:true-strike',spellName:'True Strike',spellLevel:1,acquiredAtClassLevel:1,origin:'starting',sourceEventId:duskbladeId+':1:choose-known-spells:1',active:true,affectsQuota:true,spell:spell('spell:true-strike','True Strike',1,['Duskblade'],'Divination')}
      ],
      replacements:[],campaignEntries:[]
    }
  }
};
assert.equal(validateSpellReplacement35(duskbladeReplacementBase,duskblade5Replace,{
  removedSpellKey:'spell:acid-splash',
  addedSpell:spell('spell:ray-of-frost','Ray of Frost',0,['Duskblade'],'Evocation')
}).valid,true);
assert.equal(validateSpellReplacement35(duskbladeReplacementBase,duskblade5Replace,{
  removedSpellKey:'spell:true-strike',
  addedSpell:spell('spell:magic-weapon','Magic Weapon',1,['Duskblade'],'Transmutation')
}).valid,false,'Duskblade replacement must be at least two levels below the highest castable spell level');

const duskbladeRemoved=reconcileSpellAcquisition35({
  ...duskbladeLearned,
  classLevels:[{catalogId:'dndtools:classes/fighter-90',name:'Fighter',edition:'3.5',level:2}]
});
assert.equal(duskbladeRemoved.spells.some(row=>row.castingClassId===duskbladeId),false,'removed Duskblade spells leave active casting views');
assert.equal(duskbladeRemoved.spellAcquisition35[duskbladeId]?.orphaned,true,'Duskblade acquisition history is archived when its source class is removed');
const duskbladeReadded=reconcileSpellAcquisition35({
  ...duskbladeRemoved,
  classLevels:[{catalogId:duskbladeId,name:'Duskblade',edition:'3.5',level:2}]
});
assert(duskbladeReadded.spells.some(row=>row.name==='Swift Expeditious Retreat'),'re-adding the same Duskblade source restores compatible acquisition history');

console.log('PASS Duskblade flexible known-spell acquisition, replacement timing, persistence, and archival');

const magewrightId='dndtools:classes/magewright-1029';
const magewrightProfile=spellAcquisitionProfile35(magewrightId);
assert(magewrightProfile,'Magewright must resolve an acquisition profile');
assert.equal(magewrightProfile.id,'magewright-35');
assert.equal(magewrightProfile.kind,'mastered-repertoire');

const magewright1={
  ...baseCharacter('classes/magewright-1029','Magewright',1,10),
  abilities:{str:10,dex:10,con:10,int:15,wis:10,cha:10}
};
const magewrightStart=spellAcquisitionEvents35(magewright1,{
  classId:magewrightId,previousClassLevel:0,targetClassLevel:1
});
assert.equal(magewrightStart.length,1);
assert.equal(magewrightStart[0].kind,'magewright-spell-mastery');
assert.equal(magewrightStart[0].count,2,'Magewright 1 masters spells equal to current INT modifier');
assert.equal(magewrightStart[0].bonusCantripCount,0);
assert.equal(magewrightStart[0].maxSpellLevel,1);
assert.equal(spellAcquisitionPicksComplete35(magewrightStart,{}),false);
assert.equal(spellAcquisitionPicksComplete35(magewrightStart,{
  [magewrightStart[0].eventId]:{mastered:['spell:mending','spell:identify'],bonusCantrips:[]}
},new Set(['spell:mending','spell:identify'])),true);

const magewright2={...magewright1,level:2,classLevels:[{catalogId:magewrightId,name:'Magewright',edition:'3.5',level:2}]};
assert.deepEqual(spellAcquisitionEvents35(magewright2,{
  classId:magewrightId,previousClassLevel:1,targetClassLevel:2
}),[],'Magewright does not gain Spell Mastery at class level 2');

const magewright4={
  ...magewright1,
  level:4,
  abilities:{...magewright1.abilities,int:16},
  classLevels:[{catalogId:magewrightId,name:'Magewright',edition:'3.5',level:4}]
};
const magewright4Event=spellAcquisitionEvents35(magewright4,{
  classId:magewrightId,previousClassLevel:3,targetClassLevel:4
})[0];
assert(magewright4Event);
assert.equal(magewright4Event.kind,'magewright-spell-mastery');
assert.equal(magewright4Event.count,3);
assert.equal(magewright4Event.bonusCantripCount,1,'new spell-level access also grants one additional 0-level spell');
assert.equal(magewright4Event.maxSpellLevel,2);

for(const [level,maxSpellLevel] of [[8,3],[12,4],[16,5],[20,5]]){
  const c={...magewright1,level,abilities:{...magewright1.abilities,int:18},classLevels:[{catalogId:magewrightId,name:'Magewright',edition:'3.5',level}]};
  const event=spellAcquisitionEvents35(c,{classId:magewrightId,previousClassLevel:level-1,targetClassLevel:level})[0];
  assert(event,'Magewright '+level+' gains a Spell Mastery event');
  assert.equal(event.count,4);
  assert.equal(event.bonusCantripCount,1);
  assert.equal(event.maxSpellLevel,maxSpellLevel);
}

const mageMending=spell('spell:mage-mending','Mending',0,['Magewright'],'Transmutation');
const mageIdentify=spell('spell:mage-identify','Identify',1,['Magewright'],'Divination');
const mageStartApplied=applySpellAcquisitionEvent35(magewright1,magewrightStart[0],{
  mastered:[mageMending,mageIdentify],
  bonusCantrips:[]
});
const mageStartBucket=mageStartApplied.spellAcquisition35[magewrightId];
assert.equal(mageStartBucket.acquisitions.length,2);
assert(mageStartBucket.acquisitions.every(x=>x.origin==='starting'));
assert(mageStartApplied.spells.every(x=>x.castingClassId===magewrightId&&x.prepared===false),'Magewright repertoire is available to preparation but is not spontaneously castable');
assert.equal(spellAcquisitionEvents35(mageStartApplied,{
  classId:magewrightId,previousClassLevel:0,targetClassLevel:1
}).length,0,'completed Magewright Spell Mastery event is not offered again');

const mageMakeWhole=spell('spell:mage-make-whole','Make Whole',2,['Magewright'],'Transmutation');
const mageArcaneLock=spell('spell:mage-arcane-lock','Arcane Lock',2,['Magewright'],'Abjuration');
const mageUnseen=spell('spell:mage-unseen-servant','Unseen Servant',1,['Magewright'],'Conjuration');
const mageDetect=spell('spell:mage-detect-magic','Detect Magic',0,['Magewright'],'Divination');
const mageAt4={...mageStartApplied,level:4,abilities:{...mageStartApplied.abilities,int:16},classLevels:[{catalogId:magewrightId,name:'Magewright',edition:'3.5',level:4}]};
const mage4Applied=applySpellAcquisitionEvent35(mageAt4,magewright4Event,{
  mastered:[mageMakeWhole,mageArcaneLock,mageUnseen],
  bonusCantrips:[mageDetect]
});
assert.equal(mage4Applied.spellAcquisition35[magewrightId].acquisitions.filter(x=>x.acquiredAtClassLevel===4&&x.active!==false).length,4);
assert.equal(mage4Applied.spellAcquisition35[magewrightId].acquisitions.filter(x=>x.acquiredAtClassLevel===4&&x.spellLevel===0&&x.active!==false).length,1);
assert.throws(()=>applySpellAcquisitionEvent35(mageAt4,magewright4Event,{
  mastered:[
    spell('spell:mage-too-high','Too High',3,['Magewright'],'Evocation'),
    mageArcaneLock,
    mageUnseen
  ],
  bonusCantrips:[mageDetect]
}),/not available/i,'Magewright mastery cannot select a spell above its newly accessible level');
assert.throws(()=>applySpellAcquisitionEvent35(mageAt4,magewright4Event,{
  mastered:[mageMakeWhole,mageArcaneLock,mageDetect],
  bonusCantrips:[mageDetect]
}),/distinct/i,'the bonus 0-level mastery cannot duplicate another spell selected in the same event');

const mageRemoved=reconcileSpellAcquisition35({...mageStartApplied,classLevels:[
  {catalogId:'dndtools:classes/fighter-90',name:'Fighter',edition:'3.5',level:1}
]});
assert.equal(mageRemoved.spells.some(x=>x.castingClassId===magewrightId),false);
assert.equal(mageRemoved.spellAcquisition35[magewrightId]?.orphaned,true,'Magewright repertoire history is archived with its source class');
const mageReadded=reconcileSpellAcquisition35({...mageRemoved,classLevels:[
  {catalogId:magewrightId,name:'Magewright',edition:'3.5',level:1}
]});
assert(mageReadded.spells.some(x=>x.name==='Mending'),'re-adding the exact Magewright source restores its mastered repertoire');

console.log('PASS Magewright mastered repertoire acquisition, trigger levels, legality, persistence and archival');



const favoredSoulIds=[
  'dndtools:classes/favored-soul-7',
  'dndtools:classes/favored-soul-76'
];
for(const id of favoredSoulIds){
  const profile=spellAcquisitionProfile35(id);
  assert(profile,id+' must resolve the reviewed Favored Soul acquisition profile');
  assert.equal(profile.id,'favored-soul-35');
  assert.equal(profile.kind,'known-table');
}
assert.deepEqual(spellKnownLimits35('favored-soul-35',1),{0:4,1:3});
assert.deepEqual(spellKnownLimits35('favored-soul-35',4),{0:6,1:4,2:3});
assert.deepEqual(spellKnownLimits35('favored-soul-35',10),{0:9,1:6,2:6,3:5,4:4,5:3});
assert.deepEqual(spellKnownLimits35('favored-soul-35',20),{0:9,1:6,2:6,3:6,4:6,5:6,6:6,7:6,8:5,9:4});

const favoredSoulId=favoredSoulIds[0];
const favoredSoul4={
  ...baseCharacter('classes/favored-soul-7','Favored Soul',4,18),
  abilities:{str:10,dex:10,con:10,int:10,wis:16,cha:18}
};
const favoredSoul4Events=spellAcquisitionEvents35(favoredSoul4,{
  classId:favoredSoulId,previousClassLevel:3,targetClassLevel:4
});
assert.deepEqual(
  favoredSoul4Events.filter(event=>event.kind==='choose-known-spells').map(event=>[event.spellLevel,event.count]),
  [[0,1],[2,3]],
  'Favored Soul level 4 gains only its source table deltas'
);
const favoredSoul4Replace=favoredSoul4Events.find(event=>event.kind==='optional-replacement');
assert(favoredSoul4Replace,'Favored Soul level 4 offers its optional known-spell swap');
assert.equal(favoredSoul4Replace.maxReplacementSpellLevel,0);
const favoredSoul6={...favoredSoul4,level:6,classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:6}]};
const favoredSoul6Replace=spellAcquisitionEvents35(favoredSoul6,{
  classId:favoredSoulId,previousClassLevel:5,targetClassLevel:6
}).find(event=>event.kind==='optional-replacement');
assert(favoredSoul6Replace,'Favored Soul level 6 offers its optional known-spell swap');
assert.equal(favoredSoul6Replace.maxReplacementSpellLevel,1);
const favoredSoul5={...favoredSoul4,level:5,classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:5}]};
assert(!spellAcquisitionEvents35(favoredSoul5,{
  classId:favoredSoulId,previousClassLevel:4,targetClassLevel:5
}).some(event=>event.kind==='optional-replacement'),'odd Favored Soul levels do not offer replacement');

const favoredSoulStart=spellAcquisitionEvents35({
  ...favoredSoul4,level:1,classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:1}]
},{
  classId:favoredSoulId,previousClassLevel:0,targetClassLevel:1
});
const fsCantripEvent=favoredSoulStart.find(event=>event.kind==='choose-known-spells'&&event.spellLevel===0);
const fsFirstEvent=favoredSoulStart.find(event=>event.kind==='choose-known-spells'&&event.spellLevel===1);
assert.equal(fsCantripEvent?.count,4);
assert.equal(fsFirstEvent?.count,3);

const clericCantrips=[
  spell('spell:guidance','Guidance',0,['Cleric'],'Divination'),
  spell('spell:light','Light',0,['Cleric'],'Evocation'),
  spell('spell:resistance','Resistance',0,['Cleric'],'Abjuration'),
  spell('spell:virtue','Virtue',0,['Cleric'],'Transmutation')
];
const clericFirsts=[
  spell('spell:bless','Bless',1,['Cleric'],'Enchantment'),
  spell('spell:cure-light-wounds','Cure Light Wounds',1,['Cleric'],'Conjuration'),
  spell('spell:divine-favor','Divine Favor',1,['Cleric'],'Evocation')
];
let favoredSoulApplied=applySpellAcquisitionEvent35({
  ...favoredSoul4,level:1,classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:1}]
},fsCantripEvent,clericCantrips);
favoredSoulApplied=applySpellAcquisitionEvent35(favoredSoulApplied,fsFirstEvent,clericFirsts);
assert.equal(activeAcquiredSpells35(favoredSoulApplied,favoredSoulId).length,7);
assert(favoredSoulApplied.spells.every(row=>row.castingClassId===favoredSoulId&&row.prepared===true),'Favored Soul known spells are spontaneously castable');
assert.throws(()=>applySpellAcquisitionEvent35({
  ...favoredSoul4,level:1,classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:1}]
},fsFirstEvent,[
  spell('spell:magic-missile','Magic Missile',1,['Wizard'],'Evocation'),
  clericFirsts[1],
  clericFirsts[2]
]),/spell list/i,'Favored Soul acquisition rejects spells that are not on the Cleric list');

const favoredSoulRemoved=reconcileSpellAcquisition35({
  ...favoredSoulApplied,
  classLevels:[{catalogId:'dndtools:classes/fighter-90',name:'Fighter',edition:'3.5',level:1}]
});
assert.equal(favoredSoulRemoved.spells.some(row=>row.castingClassId===favoredSoulId),false);
assert.equal(favoredSoulRemoved.spellAcquisition35[favoredSoulId]?.orphaned,true,'Favored Soul acquisition history archives with its exact source class');
const favoredSoulReadded=reconcileSpellAcquisition35({
  ...favoredSoulRemoved,
  classLevels:[{catalogId:favoredSoulId,name:'Favored Soul',edition:'3.5',level:1}]
});
assert(favoredSoulReadded.spells.some(row=>row.name==='Bless'),'re-adding the exact Favored Soul source restores compatible known spells');

console.log('PASS Favored Soul source-equivalent known-spell acquisition, Cleric-list eligibility, replacement timing, and archival');


// Shared Complete Divine / Complete Arcane acquisition cohort.
const shugenjaId='dndtools:classes/shugenja-8';
const shugenjaProfile=spellAcquisitionProfile35(shugenjaId);
assert.equal(shugenjaProfile?.kind,'partitioned-known','Shugenja uses the shared partitioned-known acquisition mode');
assert.deepEqual(shugenjaProfile?.requiredFeatureChoices,['Element Focus','Shugenja Order']);

const shugenja1={
  ...baseCharacter('classes/shugenja-8','Shugenja',1,18),
  featureChoices:{
    focus:{sourceClassId:shugenjaId,feature:'Element Focus',choiceKind:'source',choices:['Fire'],level:1},
    order:{sourceClassId:shugenjaId,feature:'Shugenja Order',choiceKind:'source',choices:['Order of the Consuming Flame'],level:1}
  }
};
const shugenjaStart=spellAcquisitionEvents35(shugenja1,{classId:shugenjaId,previousClassLevel:0,targetClassLevel:1});
assert.deepEqual(
  shugenjaStart.filter(event=>event.kind==='choose-partitioned-known-spells').map(event=>[
    event.spellLevel,event.favoredCount,event.unrestrictedCount,event.orderSpellName
  ]),
  [[0,2,2,'Flare'],[1,1,1,'Burning Hands']],
  'Shugenja level 1 separates fixed order, favored-element and unrestricted known-spell picks'
);
const sh0=shugenjaStart.find(event=>event.kind==='choose-partitioned-known-spells'&&event.spellLevel===0);
const shFire=[
  spell('spell:dancing-lights','Dancing Lights',0,['Shugenja']),
  spell('spell:disrupt-undead','Disrupt Undead',0,['Shugenja'])
];
const shOpen=[
  spell('spell:detect-magic','Detect Magic',0,['Shugenja'],'Divination'),
  spell('spell:guidance','Guidance',0,['Shugenja'],'Divination')
];
const shOrder=spell('spell:flare','Flare',0,['Shugenja']);
const shApplied=applySpellAcquisitionEvent35(shugenja1,sh0,{favored:shFire,unrestricted:shOpen,orderSpell:shOrder});
assert.equal(activeAcquiredSpells35(shApplied,shugenjaId).length,5);
assert.equal(activeAcquiredSpells35(shApplied,shugenjaId).filter(x=>x.origin==='order-spell').length,1);
assert.throws(()=>applySpellAcquisitionEvent35(shugenja1,sh0,{
  favored:shFire,
  unrestricted:[spell('spell:create-water','Create Water',0,['Shugenja']),shOpen[0]],
  orderSpell:shOrder
}),/prohibited element/i,'Fire-focused Shugenja cannot learn Water spells even in unrestricted picks');

const spiritId='dndtools:classes/spirit-shaman-9';
const spiritProfile=spellAcquisitionProfile35(spiritId);
assert.equal(spiritProfile?.kind,'daily-retrieval','Spirit Shaman uses the shared daily-retrieval mode');
const spirit1={
  ...baseCharacter('classes/spirit-shaman-9','Spirit Shaman',1,18),
  abilities:{str:10,dex:10,con:10,int:10,wis:18,cha:16}
};
const spiritStart=spellAcquisitionEvents35(spirit1,{classId:spiritId,previousClassLevel:0,targetClassLevel:1});
const retrieve=spiritStart.find(event=>event.kind==='retrieve-daily-spells');
assert.deepEqual(retrieve?.limits,{0:3,1:1});
const druidRetrieved={
  0:[
    spell('spell:detect-magic-druid','Detect Magic',0,['Druid'],'Divination'),
    spell('spell:guidance-druid','Guidance',0,['Druid'],'Divination'),
    spell('spell:light-druid','Light',0,['Druid'])
  ],
  1:[spell('spell:entangle','Entangle',1,['Druid'],'Transmutation')]
};
const spiritApplied=applySpellAcquisitionEvent35(spirit1,retrieve,{byLevel:druidRetrieved});
assert.equal(activeAcquiredSpells35(spiritApplied,spiritId).length,4);
assert.equal(spiritApplied.spellAcquisition35[spiritId].dailyRetrievalReady,false);
const spiritRested=restSpellAcquisition35(spiritApplied,'long');
assert.equal(spiritRested.spellAcquisition35[spiritId].dailyRetrievalReady,true);
assert.equal(activeAcquiredSpells35(spiritRested,spiritId).length,0,'daily recovery clears yesterday’s retrieved repertoire');
assert.equal(
  spellAcquisitionEvents35(spiritRested,{classId:spiritId,previousClassLevel:1,targetClassLevel:1})
    .filter(event=>event.kind==='retrieve-daily-spells').length,
  1,
  'after daily recovery Spirit Shaman can retrieve a fresh repertoire'
);

const wuJenId='dndtools:classes/wu-jen-6';
const wuJenProfile=spellAcquisitionProfile35(wuJenId);
assert.equal(wuJenProfile?.kind,'spellbook','Wu Jen reuses the generic spellbook acquisition mode');
const wuJen1={
  ...baseCharacter('classes/wu-jen-6','Wu Jen',1,10),
  abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:10}
};
const wuJenStart=spellAcquisitionEvents35(wuJen1,{classId:wuJenId,previousClassLevel:0,targetClassLevel:1});
assert.equal(wuJenStart.length,1);
assert.equal(wuJenStart[0].kind,'wizard-starting-spellbook');
assert.equal(wuJenStart[0].firstLevelChoices,7,'Wu Jen starts with 3 + Intelligence bonus first-level spells');
assert.equal(wuJenStart[0].automaticCantrips,true);
const wuJen2={...wuJen1,level:2,classLevels:[{catalogId:wuJenId,name:'Wu Jen',edition:'3.5',level:2}]};
assert.deepEqual(
  spellAcquisitionEvents35(wuJen2,{classId:wuJenId,previousClassLevel:1,targetClassLevel:2})
    .filter(event=>event.kind==='wizard-free-spellbook-additions').map(event=>event.count),
  [2],
  'Wu Jen gains two free spellbook additions at each new Wu Jen level'
);

console.log('PASS Shugenja partitioned known spells, Spirit Shaman daily retrieval, and Wu Jen shared spellbook acquisition');


const shugenjaCandidatePool=[
  spell('spell:sh-fire','Dancing Lights',0,['Shugenja']),
  spell('spell:order-fireball','Fireball',4,['Wizard']),
  spell('spell:unrelated','Magic Missile',1,['Wizard'])
];
const shugenjaCandidateCharacter={
  ...shugenja1,
  featureChoices:{
    ...shugenja1.featureChoices,
    order:{sourceClassId:shugenjaId,feature:'Shugenja Order',choices:['Order of the Consuming Flame'],level:1}
  }
};
const shugenjaCandidates=spellAcquisitionCandidates35(shugenjaCandidateCharacter,shugenjaId,shugenjaCandidatePool);
assert(shugenjaCandidates.some(row=>row.name==='Fireball'),'fixed Shugenja Order spells are legal acquisition candidates even when outside the native Shugenja list');
assert(!shugenjaCandidates.some(row=>row.name==='Magic Missile'),'unrelated off-list spells remain excluded');

const wuJenCampaignSpell=spell('spell:wu-campaign','Magic Weapon',1,['Wu Jen'],'Transmutation');
assert(spellbookCampaignSpellCandidates35(wuJen1,wuJenId,[wuJenCampaignSpell]).some(row=>row.name==='Magic Weapon'));
const wuJenCampaignAdded=recordSpellbookCampaignAcquisition35(wuJen1,wuJenId,wuJenCampaignSpell,{
  confirmed:true,origin:'copied-spellbook',sourceNote:'Copied from a recovered spellbook'
});
assert(activeAcquiredSpells35(wuJenCampaignAdded,wuJenId).some(row=>row.spellName==='Magic Weapon'),'Wu Jen campaign spellbook additions persist through the generic spellbook path');
assert.throws(()=>recordSpellbookCampaignAcquisition35(wuJenCampaignAdded,wuJenId,wuJenCampaignSpell,{
  confirmed:true,origin:'copied-spellbook',sourceNote:'Duplicate copy'
}),/already.*spellbook/i);
