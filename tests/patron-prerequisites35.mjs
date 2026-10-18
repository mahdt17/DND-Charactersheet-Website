import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {requirements} from '../src/lib/advancement.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {evaluatePatronPrerequisite35,lowerPatronPrerequisite35,patronDeityPatch35,patronDeityState35} from '../src/lib/patronDeity35.js';
import {legacyChoices} from '../src/lib/legacyCastingChoices.js';

const classes=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const base={ruleset:'3.5',classLevels:[],abilities:{},feats:[],skillRanks:{}};
const check=(id,text,c)=>{
 const record=classes.find(r=>r.sourceId===id);assert(record);
 const result=requirements(record,{...base,...c}).find(r=>r.text===text);assert(result,`${id}: ${text}`);
 return result.status;
};
assert.equal(check('classes/black-blood-hunter-658','Malar',{patronDeity35:'Malar'}),'met');
assert.equal(check('classes/black-blood-hunter-658','Malar',{patronDeity35:'Pelor'}),'unmet');
assert.equal(check('classes/black-blood-hunter-658','Malar',{}),'manual');
assert.equal(check('classes/black-blood-hunter-658','Malar',{patronDeity35:''}),'unmet');
assert.equal(check('classes/knight-of-the-blue-moon-303','Selûne or Mystra.',{patronDeity35:'selûne'}),'met');
assert.equal(check('classes/hathran-669','Chauntea, Mielikki, or Mystra.',{patronDeity35:'Mystra'}),'met');
assert.equal(check('classes/hathran-669','Chauntea, Mielikki, or Mystra.',{patronDeity35:'Pelor'}),'unmet');
assert.equal(check('classes/ordained-champion-230','Must worship Hextor or Heironeous.',{patronDeity35:'Heironeous'}),'met');
assert.equal(check('classes/exorcist-of-the-silver-flame-436','Worshiper of the Silver Flame.',{patronDeity35:'the Silver Flame'}),'met');
for(const [id,text] of [
 ['classes/glorious-servitor-541','Any from the Mulhorandi pantheon.'],
 ['classes/arboreal-guardian-522','Any but Nessek or Orcus'],
 ['classes/sanctified-one-233','Must worship chosen deity.'],
 ['classes/entropist-1054','Entropy (Tiamat).'],
 ['classes/triadic-knight-922','Ilmater, Torm, and/or Tyr.'],
 ['classes/fang-of-sseth-804','The candidate must worship Sseth and only Sseth.']
])assert.equal(check(id,text,{patronDeity35:text}),'manual',`${id} must retain unresolved source conditions`);
assert.equal(check('classes/black-blood-hunter-658','Malar',{ruleset:'2014',patronDeity35:'Malar'}),'manual');
for(const [id,text,name] of [
 ['classes/martyred-champion-of-ilmater-673','Illmater','Ilmater'],
 ['classes/elemental-archon-484','Akadi, Grumbar, Istishi, or Kossuth.','Istishia'],
 ['classes/slime-lord-681','Ghaunadar','Ghaunadaur']
])assert.equal(check(id,text,{patronDeity35:name}),'manual','unverified source spelling must not block a recorded patron');
assert.equal(evaluatePatronPrerequisite35({kind:'patron_deity',names:[['Malar']]},{...base,patronDeity35:'Malar'}),null,'malformed names remain unresolved');
const cleric=classes.find(r=>r.name==='Cleric'&&!r.prestige);
const clericRow={catalogId:cleric.catalogId,definition:cleric,name:cleric.name,edition:'3.5',level:5};
const existing={...base,classLevels:[clericRow],legacyCastingChoices:{[cleric.catalogId]:{deity:'Hextor',domains:['Evil','War']}}};
assert.equal(check('classes/ordained-champion-230','Must worship Hextor or Heironeous.',existing),'met','existing Cleric choice is reused');
assert.equal(check('classes/ordained-champion-230','Must worship Hextor or Heironeous.',{...existing,classLevels:[]}),'manual','removed class choices must not qualify');
const migrated=reconcileClassGrants(existing);
assert.equal(migrated.patronDeity35,'Hextor');
assert.equal(reconcileClassGrants(migrated).patronDeity35,'Hextor');
const same={...migrated,...patronDeityPatch35(migrated,' Hextor ')};
assert.deepEqual(same.legacyCastingChoices[cleric.catalogId].domains,['Evil','War'],'saving the same patron preserves domains');
const changed={...migrated,...patronDeityPatch35(migrated,'Heironeous')};
assert.equal(changed.patronDeity35,'Heironeous');
assert.deepEqual(changed.legacyCastingChoices[cleric.catalogId].domains,[],'deity change invalidates dependent domain choices');
assert.equal(legacyChoices({...changed,className:'Cleric',activeCastingClassId:cleric.catalogId}).deity,'Heironeous');
const cleared={...changed,...patronDeityPatch35(changed,'')};
assert.equal(reconcileClassGrants(cleared).patronDeity35,'');
const fighter=classes.find(r=>r.name==='Fighter'&&!r.prestige);
const mixed={...existing,classLevels:[clericRow,{catalogId:fighter.catalogId,definition:fighter,name:'Fighter',edition:'3.5',level:1}]};
assert.equal(removeClassProgression(mixed,cleric.catalogId).patronDeity35,'Hextor','removing Cleric does not erase the character patron');
const second={...clericRow,catalogId:'second-cleric',name:'Cloistered Cleric'};
const conflict={...existing,classLevels:[clericRow,second],legacyCastingChoices:{...existing.legacyCastingChoices,'second-cleric':{deity:'Pelor',domains:['Sun','Good']}}};
assert.equal(patronDeityState35(conflict).known,false);
assert.equal(check('classes/ordained-champion-230','Must worship Hextor or Heironeous.',conflict),'manual');
const resolved={...conflict,...patronDeityPatch35(conflict,'Heironeous')};
assert.equal(resolved.legacyCastingChoices['second-cleric'].deity,'Heironeous');
assert.equal(check('classes/ordained-champion-230','Must worship Hextor or Heironeous.',resolved),'met');
const crossEdition={...existing,ruleset:'custom',mechanics:'2014'};
assert.equal(patronDeityPatch35(crossEdition,'Pelor').patronDeity35,'Pelor','custom mixed-edition Cleric choices remain editable');
const covered=classes.filter(record=>record.prerequisites?.some(lowerPatronPrerequisite35));
assert.equal(covered.length,54,'exact-source patron cohort excludes three unverified source spellings');
for(const record of covered)for(const clause of record.prerequisites){
 const lowered=lowerPatronPrerequisite35(clause);if(!lowered)continue;
 for(const name of lowered.names)assert.equal(check(record.sourceId,clause.text,{patronDeity35:name}),'met',record.sourceId);
 assert.equal(check(record.sourceId,clause.text,{patronDeity35:'Unrelated Patron'}),'unmet',record.sourceId);
 assert.equal(check(record.sourceId,clause.text,{}),'manual',record.sourceId);
}
console.log('PASS patron prerequisites: exact names, alternatives, existing choices, unknown and narrative boundaries');
