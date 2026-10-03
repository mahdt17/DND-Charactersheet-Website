import assert from 'node:assert/strict';
import {
  dailySpellLikeProfile35,
  dailySpellLikePlan35,
  dailySpellLikeCandidates35,
  metamagicLevelAdjustment35,
  dailySpellLikeMetamagicOptions35,
  prepareDailySpellLike35,
  spendDailySpellLike35,
  restDailySpellLike35
} from '../src/lib/dailySpellLike35.js';

const factotumId='dndtools:classes/factotum-35';
const resourceId='class-grant:'+factotumId+':resource:inspiration';
const spell=(id,name,level,classes=['Wizard'],components=['V','S'])=>({
  id,catalogId:id,name,level,edition:'3.5',category:'spell',classes,classLevels:Object.fromEntries(classes.map(cls=>[cls,level])),
  components,school:'Evocation',description:name+' source text',sourceUrl:'https://new.dndtools.org/spells/'+id.replace(/^spells\//,'')
});
const feat=(name,effectSummary,extra={})=>({
  id:'feat:'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,edition:'3.5',category:'feat',featType:'Metamagic feat',
  effectSummary,...extra
});
const character=(level,extra={})=>({
  ruleset:'3.5',level,className:'Factotum',
  abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:10},
  classLevels:[{catalogId:factotumId,name:'Factotum',edition:'3.5',level}],
  resources:[{id:resourceId,classResourceKey:resourceId,name:'Inspiration',max:level>=8?5:level>=5?4:level>=2?3:2,used:0,reset:'encounter',sourceClassId:factotumId}],
  feats:[],spells:[],...extra
});

const profile=dailySpellLikeProfile35(factotumId);
assert.equal(profile?.id,'factotum-arcane-dilettante-35');
assert.equal(profile?.kind,'daily-limited-spell-like');
assert.deepEqual(profile?.spellLists,['Sorcerer','Wizard']);
assert.equal(profile?.ability,'int');
assert.equal(profile?.resourceName,'Inspiration');
assert.equal(profile?.resourceCost,1);

for(const [level,count,maxLevel] of [[1,0,-1],[2,1,0],[3,1,1],[4,2,1],[7,3,2],[9,4,3],[12,5,4],[14,6,5],[17,7,6],[20,8,7]]){
  const plan=dailySpellLikePlan35(character(level),factotumId);
  assert.equal(plan.count,count,'Factotum '+level+' daily Arcane Dilettante count');
  assert.equal(plan.maxLevel,maxLevel,'Factotum '+level+' Arcane Dilettante max spell level');
  assert.equal(plan.ready,count>0,'unprepared Factotum plan is ready only after Arcane Dilettante begins');
}

const detectMagic=spell('spells/detect-magic','Detect Magic',0,['Sorcerer','Wizard']);
const magicMissile=spell('spells/magic-missile','Magic Missile',1,['Sorcerer','Wizard']);
const fireball=spell('spells/fireball','Fireball',3,['Sorcerer','Wizard']);
const lightningBolt=spell('spells/lightning-bolt','Lightning Bolt',3,['Sorcerer','Wizard']);
const cureLight=spell('spells/cure-light-wounds','Cure Light Wounds',1,['Cleric']);
const wish=spell('spells/wish','Wish',9,['Sorcerer','Wizard'],['V','XP']);
const duplicateMagicMissile={...magicMissile,id:'spells/magic-missile-duplicate',catalogId:'spells/magic-missile-duplicate'};

const candidates=dailySpellLikeCandidates35(character(9),factotumId,[detectMagic,magicMissile,fireball,cureLight,wish]);
assert.deepEqual(candidates.map(row=>row.name),['Detect Magic','Magic Missile','Fireball']);
assert(!candidates.some(row=>row.name==='Cure Light Wounds'),'Cleric-only spells are excluded');
assert(!candidates.some(row=>row.name==='Wish'),'XP-cost spells are excluded');

const extend=feat('Extend Spell','An extended spell uses a slot one level higher than normal.');
const born=feat('Born of the Three Thunders','The modified spell uses a slot of its normal level.');
const heighten=feat('Heighten Spell','A heightened spell has a higher spell level than normal and is as difficult to prepare and cast as a spell of its effective level.');
const sudden=feat('Sudden Extend','Once per day, apply Extend Spell without increasing the level and without specially preparing it ahead of time.');
const unknown=feat('Mystery Metamagic','This metamagic changes the spell in a source-specific way.');

assert.equal(metamagicLevelAdjustment35(extend,{baseLevel:1}),1);
assert.equal(metamagicLevelAdjustment35(born,{baseLevel:1}),0);
assert.equal(metamagicLevelAdjustment35(heighten,{baseLevel:1,targetLevel:3}),2);
assert.equal(metamagicLevelAdjustment35(sudden,{baseLevel:1}),null,'Sudden feats are not preparation metamagic');
assert.equal(metamagicLevelAdjustment35(unknown,{baseLevel:1}),null,'unknown adjustments fail closed');

const metaCharacter=character(9,{feats:[extend,born,heighten,sudden,unknown]});
const metaOptions=dailySpellLikeMetamagicOptions35(metaCharacter,magicMissile,3);
assert(metaOptions.some(option=>option.name==='Extend Spell'&&option.adjustment===1));
assert(metaOptions.some(option=>option.name==='Born of the Three Thunders'&&option.adjustment===0));
assert(metaOptions.some(option=>option.name==='Heighten Spell'&&option.variable===true));
assert(!metaOptions.some(option=>option.name==='Sudden Extend'));
assert(!metaOptions.some(option=>option.name==='Mystery Metamagic'));

const prepared=prepareDailySpellLike35(metaCharacter,factotumId,[
  {spell:detectMagic,metamagic:[]},
  {spell:magicMissile,metamagic:[{name:'Extend Spell'}]},
  {spell:fireball,metamagic:[]},
  {spell:spell('spells/scorching-ray','Scorching Ray',2,['Sorcerer','Wizard']),metamagic:[]}
]);
const bucket=prepared.dailySpellLike35[factotumId];
assert.equal(bucket.ready,false);
assert.equal(bucket.selections.length,4);
assert.equal(bucket.selections.filter(row=>row.modifiedLevel===3).length,1,'only one prepared choice may occupy the maximum spell level');
assert.equal(prepared.spells.filter(row=>row.dailySpellLikeGrant&&row.castingClassId===factotumId).length,4);
assert(prepared.spells.every(row=>!row.dailySpellLikeGrant||row.spellLikeAbility===true));

assert.throws(()=>prepareDailySpellLike35(metaCharacter,factotumId,[
  {spell:magicMissile,metamagic:[]},
  {spell:duplicateMagicMissile,metamagic:[]},
  {spell:detectMagic,metamagic:[]},
  {spell:spell('spells/shield','Shield',1,['Wizard']),metamagic:[]}
]),/distinct/i,'same spell name cannot be prepared twice even with different catalog identity');

assert.throws(()=>prepareDailySpellLike35(metaCharacter,factotumId,[
  {spell:fireball,metamagic:[]},
  {spell:lightningBolt,metamagic:[]},
  {spell:detectMagic,metamagic:[]},
  {spell:magicMissile,metamagic:[]}
]),/maximum.*one/i,'only one selection can use the maximum effective level');

assert.throws(()=>prepareDailySpellLike35(metaCharacter,factotumId,[
  {spell:magicMissile,metamagic:[{name:'Extend Spell'},{name:'Heighten Spell',targetLevel:3}]},
  {spell:detectMagic,metamagic:[]},
  {spell:spell('spells/shield','Shield',1,['Wizard']),metamagic:[]},
  {spell:spell('spells/grease','Grease',1,['Wizard']),metamagic:[]}
]),/maximum spell level/i,'metamagic-adjusted level cannot exceed the Factotum maximum');

assert.throws(()=>prepareDailySpellLike35(character(9,{feats:[]}),factotumId,[
  {spell:magicMissile,metamagic:[{name:'Extend Spell'}]},
  {spell:detectMagic,metamagic:[]},
  {spell:spell('spells/shield','Shield',1,['Wizard']),metamagic:[]},
  {spell:spell('spells/grease','Grease',1,['Wizard']),metamagic:[]}
]),/metamagic feat/i,'Arcane Dilettante cannot apply a metamagic feat the character does not own');

const first=prepared.spells.find(row=>row.dailySpellLikeGrant&&row.name==='Magic Missile');
const spent=spendDailySpellLike35(prepared,factotumId,first.dailySpellLikeSelectionId);
assert.equal(spent.resources.find(row=>row.id===resourceId).used,1,'Arcane Dilettante spends one existing Inspiration point');
assert(spent.dailySpellLike35[factotumId].selections.find(row=>row.id===first.dailySpellLikeSelectionId).used);
assert.throws(()=>spendDailySpellLike35(spent,factotumId,first.dailySpellLikeSelectionId),/already.*used/i);

const noInspiration={...prepared,resources:prepared.resources.map(row=>row.id===resourceId?{...row,used:row.max}:row)};
assert.throws(()=>spendDailySpellLike35(noInspiration,factotumId,first.dailySpellLikeSelectionId),/Inspiration/i);

const shortRest=restDailySpellLike35(prepared,'short');
assert.equal(shortRest.dailySpellLike35[factotumId].ready,false,'short rest does not replace Arcane Dilettante spells');
assert.equal(shortRest.spells.filter(row=>row.dailySpellLikeGrant).length,4);
const longRest=restDailySpellLike35(prepared,'long');
assert.equal(longRest.dailySpellLike35[factotumId].ready,true);
assert.equal(longRest.dailySpellLike35[factotumId].selections.length,0);
assert.equal(longRest.spells.filter(row=>row.dailySpellLikeGrant).length,0,'8-hour/daily recovery retires the prior repertoire');

const roundTrip=JSON.parse(JSON.stringify(prepared));
assert.deepEqual(roundTrip.dailySpellLike35,prepared.dailySpellLike35,'daily repertoire state is serializable for save/reopen persistence');

console.log('PASS Factotum Arcane Dilettante daily repertoire, metamagic legality, Inspiration spending, rest and persistence');
