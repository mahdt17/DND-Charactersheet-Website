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
  spellAcquisitionPicksComplete35
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

