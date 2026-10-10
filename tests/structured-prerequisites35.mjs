import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {requirements} from '../src/lib/advancement.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {prerequisiteCoverage35} from '../scripts/audit_prerequisite_coverage35.mjs';

const character={ruleset:'3.5',level:8,abilities:{str:16},feats:[
  {catalogId:'feat:a',name:'Extend Spell',featType:'Metamagic feat'},
  {catalogId:'feat:reprint',name:'Extend Spell',featType:'Metamagic'},
  {catalogId:'feat:b',name:'Empower Spell',featType:'Metamagic'},
  {catalogId:'feat:focus',name:'Weapon Focus (Rapier)',featTemplateName:'Weapon Focus',featTemplateId:'feat:focus',featSubject:'Rapier'},
  {name:'Two-Weapon Fighting'}, {name:'Iron Will'}
],skillRanks:{Bluff:8,Hide:8,' hide ':8,Spot:7},trainingGrants:[{proficiencies:[{kind:'weapons',name:'Rapier',index:'rapier'},{kind:'armor',name:'Heavy armor',index:'heavy-armor'},{kind:'weapons',name:'Longsword',index:'longsword',sourceOnly:true}]}]};
const status=(node,c=character,options={})=>requirements({edition:'3.5',name:'Gate',prerequisites:[node]},c,{},options)[0].status;
const yes={kind:'ability',ability:'str',minimum:13},no={kind:'ability',ability:'str',minimum:18},unknown={kind:'unreviewed',text:'Ask the guild'};
assert.equal(status({kind:'all',requirements:[yes,{kind:'any',requirements:[no,yes]}]}),'met','nested all/any must evaluate real clauses');
for(const [node,want] of [
  [{kind:'all',requirements:[no,unknown]},'unmet'],[{kind:'all',requirements:[yes,unknown]},'manual'],
  [{kind:'any',requirements:[yes,unknown]},'met'],[{kind:'any',requirements:[no,unknown]},'manual'],
  [{kind:'count',minimum:2,requirements:[yes,yes,unknown]},'met'],[{kind:'count',minimum:2,requirements:[yes,no,unknown]},'manual'],
  [{kind:'count',minimum:2,requirements:[no,no,unknown]},'unmet'],
  [{kind:'all',requirements:[]},'manual'],[{kind:'any',requirements:[null]},'manual'],
  [{kind:'count',minimum:0,requirements:[yes]},'manual'],[{kind:'count',minimum:1.5,requirements:[yes,yes]},'manual']
])assert.equal(status(node),want,JSON.stringify(node));
assert.equal(status({kind:'feat_count',featType:'metamagic',minimum:2}),'met');
assert.equal(status({kind:'feat_count',featTypes:['metamagic','item creation'],minimum:3}),'unmet','reprints must not inflate feat counts');
assert.equal(status({kind:'feat_count',featType:'metamagic',minimum:2},{...character,feats:[
  {name:'School Metamagic (Evocation)',featType:'Metamagic',featTemplateName:'School Metamagic',featSubject:'Evocation'},
  {name:'School Metamagic (Evocation)',featType:'Metamagic'}
]}),'unmet','legacy display-only and structured copies of one subject count once');
assert.equal(status({kind:'skill_count',minimum:3,ranks:8}),'unmet','duplicate normalized skill keys count once');
assert.equal(status({kind:'skill_count',minimum:2,ranks:8}),'met');
assert.equal(status({kind:'feats',text:'Any two metamagic feats.'}),'met');
assert.equal(status({kind:'skills',text:'Any three skills 8 ranks each.'}),'unmet');
assert.equal(status({kind:'skills',text:'8 ranks in any two skills.'}),'met');
assert.equal(status({kind:'feats',text:'Great Fortitude or Iron Will or Lightning Reflexes'}),'met');
assert.equal(status({kind:'feats',text:'Alertness or Iron Will'}),'met','closed named alternatives are generic');
assert.equal(status({kind:'feats',text:'Alertness, Endurance, or Iron Will'}),'met');
assert.equal(status({kind:'feats',text:'Alertness, Endurance or Iron Will'}),'manual','mixed comma-AND and OR scope remains unresolved');
assert.equal(status({kind:'feat',name:'Iron Will'}),'met','bare structured names must work through requirements');
assert.equal(status({kind:'feats',text:'Skill Focus (Bluff) , Skill Focus (Diplomacy) , or Skill Focus (Intimidate)'},{...character,feats:[{name:'Skill Focus (Diplomacy)'}]}),'met');
assert.equal(status({kind:'skills',text:'Intuit Direction 2 ranks; Knowledge (Silverymoon local) or Knowledge (the North local) 4 ranks; Ride 4 ranks; Spot 4 ranks'},{...character,skillRanks:{'Intuit Direction':2,'Knowledge (the North local)':4,Ride:4,Spot:4}}),'met');
assert.equal(status({kind:'feats',text:'Two-Weapon Fighting, Iron Will'}),'met');
for(const text of ['Improved Unarmed Strike or mind blade class feature','Any one other exalted feat.','Either A, B, or C plus a special condition'])assert.equal(status({kind:'feats',text}),'manual');
assert.equal(status({kind:'skills',text:'Any skill 9 ranks, OR'}),'manual');
assert.equal(status({kind:'feat',name:'Weapon Focus',featId:'feat:focus',subject:'Rapier'}),'met');
assert.equal(status({kind:'feat',name:'Weapon Focus',featId:'feat:wrong',subject:'Rapier'}),'unmet');
assert.equal(status({kind:'feat',name:'Weapon Focus',subject:'Longsword'}),'unmet');
assert.equal(status({kind:'feat',name:'Weapon Focus',subject:'$subject'},character,{subject:'Rapier'}),'met');
assert.equal(status({kind:'feat',name:'Weapon Focus',subject:'$subject'}),'manual');
assert.equal(status({kind:'feats',text:'Weapon Focus'}),'met','a named feat prerequisite accepts an owned parameterized feat');
assert.equal(status({kind:'proficiency',proficiencyKind:'weapons',name:'$subject'},character,{subject:'Rapier'}),'met');
assert.equal(status({kind:'proficiency',proficiencyKind:'weapons',index:'longsword'}),'unmet','source-only text is not a grant');
assert.equal(status({kind:'proficiency',proficiencyKind:'armor',index:'heavy-armor'}),'met');
assert.equal(status({kind:'feats',text:'Armor Proficiency (heavy)'}),'unmet','training does not imply owning a named feat');
const record={edition:'3.5',name:'Scoped',featSubject:'Rapier',prerequisites:[{kind:'text',text:'Proficiency with selected weapon.'}]};
assert.equal(requirements(record,character)[0].status,'met','closed subject prerequisite must use feat subject');
assert.equal(requirements({...record,featSubject:'Longsword'},character)[0].status,'unmet');
assert.equal(requirements({...record,featSubject:undefined},character)[0].status,'manual');
const old={edition:'3.5',name:'Gate',prerequisites:[unknown]},check=requirements(old,character)[0];
assert.equal(requirements(old,character,{[check.id]:true})[0].status,'confirmed');
assert.equal(check.id,'3.5:Gate:unreviewed:Ask the guild','text check identities remain stable');
const distinct={edition:'3.5',name:'Distinct',prerequisites:[{kind:'all',requirements:[unknown]},{kind:'all',requirements:[{kind:'unreviewed',text:'Ask the order'}]}]};
const distinctChecks=requirements(distinct,character);
assert.notEqual(distinctChecks[0].id,distinctChecks[1].id,'confirming one structured gate must not confirm a different gate');
assert.equal(requirements(distinct,character,{[distinctChecks[0].id]:true})[1].status,'manual');
assert.equal(status(null),'manual','malformed array members must not throw');
assert.equal(status({kind:'feat',name:'Weapon Focus',subject:'Rapier'},{...character,feats:[{name:'Weapon Focus (Rapier)'}]}),'met','legacy exact subject names remain usable');
assert.equal(status({kind:'feat',name:'Weapon Focus',subject:'Rapier'},{...character,feats:[{name:'Weapon Focus (Rapier)',featSubject:'Longsword'}]}),'unmet','conflicting explicit subjects must not be inferred away');
const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const impact=prerequisiteCoverage35(classes);
assert.equal(impact.uniqueAffectedCount,33,'closed catalog grammar has 33 exact source records, without claiming full class completion');
assert.deepEqual(impact.clusters.map(({kind,count})=>({kind,count})),[
  {kind:'named-feat-alternatives',count:2},{kind:'ranked-skill-alternatives',count:1},{kind:'ranked-skill-count',count:5},{kind:'two-weapon-name',count:3},{kind:'typed-feat-count',count:23}
]);
assert.deepEqual(impact.clusters.find(group=>group.kind==='two-weapon-name').records.map(record=>record.sourceId),['classes/mirumoto-niten-master-639','classes/tempest-198','classes/whisperknife-747']);
const real=classes.find(record=>record.sourceId==='classes/olin-gisir-543');
assert.equal(requirements(real,character).find(check=>check.text==='Any two metamagic feats.').status,'met','real normalized source counts use owned feat metadata');
console.log('PASS structured prerequisites: three-state groups, unique counts, closed text, subject identity, training, and confirmation compatibility');

const aliasRecord={name:'Alias gates',edition:'3.5',prerequisites:[
  {type:'all',text:'Special prerequisite',requirements:[{kind:'special',text:'Join guild A'}]},
  {type:'all',text:'Special prerequisite',requirements:[{kind:'special',text:'Join guild B'}]}
]};
const aliases=requirements(aliasRecord,character);
assert.notEqual(aliases[0].id,aliases[1].id,'aliased structured gates must not share confirmations');
assert.deepEqual(requirements(aliasRecord,character,{[aliases[0].id]:true}).map(check=>check.status),['confirmed','manual']);

const martial={...character,trainingGrants:[{proficiencies:[{kind:'weapons',name:'Martial weapons',index:'martial-weapons'}]}]};
const equipment=[{name:'Rapier',index:'rapier',edition:'3.5-reference',kind:'weapon',itemCategory:'martial'}];
const weaponGate={kind:'proficiency',proficiencyKind:'weapons',name:'Rapier'};
assert.equal(status(weaponGate,{...character,weaponTrainingOverrides:{rapier:false}}),'unmet','explicit training table rulings override an automatic or manual grant');
assert.equal(status(weaponGate,{...character,trainingGrants:[],weaponTrainingOverrides:{rapier:true}}),'met','explicit positive training rulings qualify');
assert.equal(status(weaponGate,martial,{equipment}),'met','canonical weapon categories must qualify through existing training');
assert.equal(status(weaponGate,martial),'manual','unresolved category membership must not become a hard denial');
assert.equal(status(weaponGate,{...martial,trainingGrants:[{proficiencies:[{kind:'weapons',name:'Simple weapons',index:'simple-weapons'}]}]},{equipment}),'unmet');
assert.equal(status(weaponGate,{...martial,trainingGrants:[{sourceOnly:true,proficiencies:[{kind:'weapons',name:'Martial weapons',index:'martial-weapons'}]}]},{equipment}),'unmet');
assert.equal(status(weaponGate,{...martial,trainingGrants:[],classDefinition:{proficiencies:[{index:'martial-weapons',name:'Martial weapons'}]}},{equipment}),'met','starting training also qualifies');
assert.equal(status(weaponGate,martial,{equipment:[{...equipment[0],edition:'2024'}]}),'manual','another edition cannot supply weapon category evidence');
const unresolvedSubject={name:'Subject feat',catalogId:'test:subject-feat',edition:'3.5',prerequisites:[{kind:'text',text:'Proficiency with selected weapon.'}]};
const rapierCheck=requirements({...unresolvedSubject,featSubject:'Rapier'},martial)[0];
assert.equal(requirements({...unresolvedSubject,featSubject:'Longsword'},martial,{[rapierCheck.id]:true})[0].status,'manual','manual verification of one subject cannot qualify a different subject');
