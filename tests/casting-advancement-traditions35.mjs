import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,castingAdvancementPlan,castingAdvancementSelectionsValid,applyCastingAdvancementSelections,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const exact=id=>annotateClassGrantKinds(classes.find(record=>record.sourceId===id),classes);
const wizard=exact('classes/wizard-99'),cleric=exact('classes/cleric-91'),paladin=exact('classes/paladin-95');
const mystic=exact('classes/mystic-theurge-390');
assert(wizard&&cleric&&paladin&&mystic);
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
const character=classLevels=>({id:'casting-tradition-test',ruleset:'3.5',mechanics:'3.5',classLevels,level:classLevels.reduce((n,r)=>n+r.level,0),abilities:{str:12,dex:12,con:12,int:16,wis:16,cha:16},hp:{current:20,max:20},actions:[],feats:[],resources:[],spells:[],featureChoices:{}});
const base=character([row(wizard,3),row(cleric,3)]);
const plan=castingAdvancementPlan(base,mystic,1);
const arcane=plan.groups.find(group=>group.kind==='arcane'),divine=plan.groups.find(group=>group.kind==='divine');
assert.deepEqual(arcane.candidates.map(c=>c.classId),[wizard.catalogId],'arcane advancement must exclude divine casters');
assert.deepEqual(divine.candidates.map(c=>c.classId),[cleric.catalogId],'divine advancement must exclude arcane casters');
assert(!castingAdvancementSelectionsValid(plan,{[arcane.id]:cleric.catalogId,[divine.id]:wizard.catalogId}),'crossed traditions must be rejected');
assert.throws(()=>applyCastingAdvancementSelections(base,plan,{[arcane.id]:cleric.catalogId,[divine.id]:wizard.catalogId}),/valid existing class/);

const unknown={...wizard,id:'dndtools:classes/unreviewed-wizard',catalogId:'dndtools:classes/unreviewed-wizard',sourceId:'classes/unreviewed-wizard',index:'classes/unreviewed-wizard',proficiencyProfileFrom:null,inheritedFromClassId:null};
const unknownPlan=castingAdvancementPlan(character([row(unknown,5),row(cleric,3)]),mystic,1);
assert.equal(unknownPlan.groups.find(g=>g.kind==='arcane').candidates.length,0,'a same-name source with no reviewed casting tradition must not inherit Wizard eligibility');
assert.equal(unknownPlan.valid,false);

for(const level of [1,3,4]){
  const p=castingAdvancementPlan(character([row(wizard,3),row(paladin,level)]),mystic,1);
  assert.equal(p.groups.find(g=>g.kind==='divine').candidates.some(c=>c.classId===paladin.catalogId),level>=4,'Paladin must have reached its actual casting progression; printed zero slots still unlock casting');
}
const generic={...mystic,progression:[['Level','Spellcasting'],['1st','+1 level of existing spellcasting class']],tables:[],advancement:[]};
const genericPlan=castingAdvancementPlan(character([row(unknown,5),row(paladin,3)]),generic,1);
assert.deepEqual(genericPlan.groups[0].candidates.map(c=>c.classId),[unknown.catalogId],'unrestricted advancement needs current casting, but not an arcane/divine classification');

const martial={catalogId:'test:martial',id:'test:martial',name:'Martial Entry',edition:'3.5',progression:[['Level','Special'],['1st','Martial training']]};
const optionalCasting={catalogId:'test:optional-casting',id:'test:optional-casting',name:'Optional Existing Casting',edition:'3.5',castingAdvancementOptionalWhenUnavailable:true,progression:[['Level','Spellcasting'],['1st','+1 level of existing spellcasting class']]};
const martialCharacter=character([row(martial,8)]);
const optionalMartialPlan=castingAdvancementPlan(martialCharacter,optionalCasting,1);
assert.equal(optionalMartialPlan.groups.length,1);
assert.equal(optionalMartialPlan.groups[0].candidates.length,0);
assert.equal(optionalMartialPlan.valid,true,'a reviewed optional-when-unavailable advancement must not block a qualifying noncaster');
assert.equal(castingAdvancementSelectionsValid(optionalMartialPlan,{}),true);
assert.deepEqual(applyCastingAdvancementSelections(martialCharacter,optionalMartialPlan,{}),martialCharacter,'no phantom casting advancement is created for a noncaster');
const optionalCasterPlan=castingAdvancementPlan(character([row(wizard,5)]),optionalCasting,1);
assert.equal(optionalCasterPlan.groups[0].candidates.length,1);
assert.equal(optionalCasterPlan.valid,true);
assert.equal(castingAdvancementSelectionsValid(optionalCasterPlan,{}),false,'an available advancement still requires a target selection');
assert.equal(castingAdvancementSelectionsValid(optionalCasterPlan,{[optionalCasterPlan.groups[0].id]:wizard.catalogId}),true);

let advanced=base;
for(let level=1;level<=10;level++){
  const p=castingAdvancementPlan(advanced,mystic,level);
  const picks=Object.fromEntries(p.groups.map(g=>[g.id,g.kind==='arcane'?wizard.catalogId:cleric.catalogId]));
  advanced=reconcileClassGrants(applyCastingAdvancementSelections({...advanced,classLevels:[row(wizard,3),row(cleric,3),row(mystic,level)],level:6+level},p,picks));
  for(const target of [wizard,cleric])assert.equal(advanced.classSpellSlots.find(s=>s.sourceClassId===target.catalogId)?.effectiveClassLevel,3+level,'both Mystic Theurge tracks advance every level');
  const reopened=reconcileClassGrants(JSON.parse(JSON.stringify(advanced)));
  assert.deepEqual(reopened.castingAdvancements,advanced.castingAdvancements,'save/reopen preserves both choices');
}
const removed=removeClassProgression(advanced,mystic.catalogId);
assert.equal(removed.castingAdvancements.length,0);
assert.deepEqual(removed.classSpellSlots,reconcileClassGrants(base).classSpellSlots,'removal restores the original spell slots, levels, histories, and provenance for both classes');
console.log('Casting advancement tradition and lifecycle regressions passed.');
