import assert from 'node:assert/strict';
import * as inv from '../src/lib/invocationAcquisition35.js';
import * as special from '../src/lib/legacySpecialCasting.js';
{
  const {
    invocationProfile35,invocationCatalog35,invocationEvents35,invocationPicksComplete35,
    applyInvocationEvent35,reconcileInvocationAcquisition35,activeInvocations35,
    validateInvocationReplacement35,invocationSaveDc35,breathEffectMechanics35
  }=inv;

  const gradeCounts=(rows)=>Object.fromEntries(['least','lesser','greater','dark'].map(g=>[g,rows.filter(x=>x.grade===g).length]));
  const warlockCatalog=invocationCatalog35('dndtools:classes/warlock-4');
  const dragonCatalog=invocationCatalog35('dndtools:classes/dragonfire-adept-29');
  assert.equal(warlockCatalog.length,86);
  assert.deepEqual(gradeCounts(warlockCatalog),{least:26,lesser:29,greater:20,dark:11});
  assert.equal(dragonCatalog.length,30);
  assert.deepEqual(gradeCounts(dragonCatalog),{least:10,lesser:9,greater:7,dark:4});
  assert(warlockCatalog.every(row=>row.name&&row.sourceCode&&row.sourceUrl&&Number.isInteger(row.equivalentLevel)));
  assert(dragonCatalog.every(row=>row.name&&row.sourceCode==='DrM'&&row.sourceUrl&&Number.isInteger(row.equivalentLevel)));
  assert.equal(new Set(warlockCatalog.map(row=>row.catalogId)).size,86);
  assert.equal(new Set(dragonCatalog.map(row=>row.catalogId)).size,30);

  const warlockId='dndtools:classes/warlock-4',dragonId='dndtools:classes/dragonfire-adept-29';
  const make=(classId,name,level)=>({
    ruleset:'3.5',level,className:name,abilities:{cha:16},
    classLevels:[{catalogId:classId,name,edition:'3.5',level}],spells:[],invocationAcquisition35:{}
  });
  const wp=invocationProfile35(warlockId),dp=invocationProfile35(dragonId);
  assert.deepEqual([wp.knownByLevel[1],wp.knownByLevel[6],wp.knownByLevel[11],wp.knownByLevel[16],wp.knownByLevel[20]],[1,4,7,10,12]);
  assert.deepEqual([dp.knownByLevel[1],dp.knownByLevel[6],dp.knownByLevel[11],dp.knownByLevel[16],dp.knownByLevel[20]],[1,3,5,7,8]);
  assert.deepEqual([wp.maxGradeByLevel[1],wp.maxGradeByLevel[6],wp.maxGradeByLevel[11],wp.maxGradeByLevel[16]],['least','lesser','greater','dark']);
  assert.deepEqual([dp.maxGradeByLevel[1],dp.maxGradeByLevel[6],dp.maxGradeByLevel[11],dp.maxGradeByLevel[16]],['least','lesser','greater','dark']);

  const w1=make(warlockId,'Warlock',1);
  const start=invocationEvents35(w1,{classId:warlockId,previousClassLevel:0,targetClassLevel:1});
  assert.deepEqual(start.map(e=>[e.kind,e.count,e.maxGrade]),[['choose-invocations',1,'least']]);
  const least=warlockCatalog.find(x=>x.name==='Baleful Utterance');
  assert(invocationPicksComplete35(start,{[start[0].eventId]:[least.catalogId]},new Set(warlockCatalog.map(x=>x.catalogId))));
  const w1Applied=applyInvocationEvent35(w1,start[0],[least]);
  assert.equal(activeInvocations35(w1Applied,warlockId).length,1);
  assert(w1Applied.spells.some(x=>x.invocationGrant&&x.name==='Baleful Utterance'&&x.castingClassId===warlockId));
  assert.equal(invocationSaveDc35(w1Applied,warlockId,least),15);

  const w2={...w1Applied,level:2,classLevels:[{...w1Applied.classLevels[0],level:2}]};
  const w2Events=invocationEvents35(w2,{classId:warlockId,previousClassLevel:1,targetClassLevel:2});
  assert.equal(w2Events.filter(e=>e.kind==='choose-invocations').length,1);
  assert.equal(w2Events.filter(e=>e.kind==='optional-invocation-replacement').length,1);
  const second=warlockCatalog.find(x=>x.name==='Beguiling Influence');
  const w2Applied=applyInvocationEvent35(w2,w2Events.find(e=>e.kind==='choose-invocations'),[second]);
  assert.equal(activeInvocations35(w2Applied,warlockId).length,2);

  const w6={...w2Applied,level:6,classLevels:[{...w2Applied.classLevels[0],level:6}]};
  const w6Events=invocationEvents35(w6,{classId:warlockId,previousClassLevel:5,targetClassLevel:6});
  assert.equal(w6Events.find(e=>e.kind==='choose-invocations')?.maxGrade,'lesser');
  const replacement=w6Events.find(e=>e.kind==='optional-invocation-replacement');
  assert(replacement);
  const lesser=warlockCatalog.find(x=>x.grade==='lesser'&&!['Baleful Utterance','Beguiling Influence'].includes(x.name));
  assert.equal(validateInvocationReplacement35(w6,replacement,{removedInvocationKey:least.catalogId,addedInvocation:lesser}).valid,false,'least invocation cannot be replaced by a higher-grade lesser invocation');
  const otherLeast=warlockCatalog.find(x=>x.grade==='least'&&!['Baleful Utterance','Beguiling Influence'].includes(x.name));
  assert.equal(validateInvocationReplacement35(w6,replacement,{removedInvocationKey:least.catalogId,addedInvocation:otherLeast}).valid,true);

  assert.equal(invocationEvents35(make(warlockId,'Warlock',3),{classId:warlockId,previousClassLevel:2,targetClassLevel:3}).length,0);
  const d2=make(dragonId,'Dragonfire Adept',2);
  assert.equal(invocationEvents35(d2,{classId:dragonId,previousClassLevel:1,targetClassLevel:2}).length,0);
  const d3=make(dragonId,'Dragonfire Adept',3);
  assert.deepEqual(invocationEvents35(d3,{classId:dragonId,previousClassLevel:2,targetClassLevel:3}).filter(e=>e.kind==='choose-invocations').map(e=>[e.count,e.maxGrade]),[[1,'least']]);
  const d6=make(dragonId,'Dragonfire Adept',6);
  assert.equal(invocationEvents35(d6,{classId:dragonId,previousClassLevel:5,targetClassLevel:6}).find(e=>e.kind==='choose-invocations')?.maxGrade,'lesser');
  assert.equal(special.specialCastingProfile(d6)?.kind,'invocation','Dragonfire Adept reuses the shared invocation casting profile');

  const removed={...w2Applied,classLevels:[]};
  const reconciled=reconcileInvocationAcquisition35(removed);
  assert.equal(reconciled.invocationAcquisition35[warlockId].active,false);
  assert(!reconciled.spells.some(x=>x.invocationGrant&&x.castingClassId===warlockId));

  const replace2=w2Events.find(e=>e.kind==='optional-invocation-replacement');
  const replaced=applyInvocationEvent35(w2Applied,replace2,{removedInvocationKey:least.catalogId,addedInvocation:otherLeast});
  assert.equal(activeInvocations35(replaced,warlockId).length,2);
  assert(!replaced.spells.some(x=>x.catalogId===least.catalogId));
  assert(!invocationEvents35(replaced,{classId:warlockId,targetClassLevel:2}).some(e=>e.kind==='choose-invocations'),'Replacing a starting invocation must not reopen its acquisition event');
  assert.throws(()=>applyInvocationEvent35(replaced,replace2,{removedInvocationKey:otherLeast.catalogId,addedInvocation:least}),/already|resolved/i,'Each replacement opportunity is usable once');
  assert.throws(()=>applyInvocationEvent35(w1,start[0],[{...lesser,grade:'least'}]),/grade|catalog/i,'A forged grade must not bypass catalog legality');
  assert.equal(activeInvocations35(reconciled,warlockId).length,0,'Removed classes have no active invocation repertoire');
  const restored=reconcileInvocationAcquisition35({...JSON.parse(JSON.stringify(reconciled)),classLevels:w2Applied.classLevels});
  assert.equal(activeInvocations35(restored,warlockId).length,2);
  assert.deepEqual(reconcileInvocationAcquisition35(restored),restored,'Reconciliation is idempotent');
  const invalid=JSON.parse(JSON.stringify(w1Applied));
  invalid.invocationAcquisition35[warlockId].acquisitions[0].invocationKey=lesser.catalogId;
  invalid.invocationAcquisition35[warlockId].acquisitions[0].invocation=lesser;
  const invalidResult=reconcileInvocationAcquisition35(invalid);
  assert(invalidResult.invocationAcquisition35Incomplete.length);
  assert(!invalidResult.spells.some(x=>x.invocationGrant),'Illegal persisted invocations cannot become castable');
  const duplicate=JSON.parse(JSON.stringify(w1Applied));
  duplicate.invocationAcquisition35[warlockId].acquisitions.push({...duplicate.invocationAcquisition35[warlockId].acquisitions[0],id:'duplicate'});
  const duplicateResult=reconcileInvocationAcquisition35({...duplicate,level:2,classLevels:w2Applied.classLevels});
  assert(duplicateResult.invocationAcquisition35Incomplete.some(x=>x.reasons.some(r=>/duplicate/i.test(r))));
  assert.equal(duplicateResult.spells.filter(x=>x.invocationGrant).length,1);
  const reduced=reconcileInvocationAcquisition35({...w2Applied,level:1,classLevels:w1.classLevels});
  assert.deepEqual(reduced.spells.filter(s=>s.invocationGrant).map(s=>s.name),['Baleful Utterance'],'Level reduction retires later invocation acquisitions');
  const lostState=reconcileInvocationAcquisition35({...w2Applied,classLevels:[],invocationAcquisition35:{}});
  assert(!lostState.spells.some(s=>s.invocationGrant),'Generated invocations require an active owning acquisition');

  const effects=['Frost Breath','Lightning Breath','Sickening Breath','Acid Breath','Shaped Breath','Slow Breath','Weakening Breath','Cloud Breath','Enduring Breath','Sleep Breath','Thunder Breath','Discorporating Breath of Bahamut','Force Breath','Paralyzing Breath','Fivefold Breath of Tiamat'];
  assert.deepEqual(effects.map(name=>breathEffectMechanics35(name)?.name),effects);
  assert.equal(breathEffectMechanics35('Frost Breath').damageType,'cold');
  assert.equal(breathEffectMechanics35('Lightning Breath').area,'line');
  assert.equal(breathEffectMechanics35('Sickening Breath').condition,'sickened');
  assert.equal(breathEffectMechanics35('Slow Breath').save,'Fortitude');
  assert.equal(breathEffectMechanics35('Weakening Breath').strengthPenalty,-6);
  assert.equal(breathEffectMechanics35('Enduring Breath').nextRoundDamageMultiplier,0.5);
  assert.equal(breathEffectMechanics35('Thunder Breath').damageType,'sonic');
  assert.equal(breathEffectMechanics35('Paralyzing Breath').condition,'paralyzed');
  assert.equal(breathEffectMechanics35('Fivefold Breath of Tiamat').specialCombination,true);

  console.log('PASS shared Warlock/Dragonfire Adept invocation catalogs, progression, replacements, runtime ownership, save DCs and Dragonfire breath mechanics');
}
