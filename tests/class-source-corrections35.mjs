import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants,legacyClassSkillStatus} from '../src/lib/classIntegration.js';

const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const knowledge=['arcana','architecture and engineering','dungeoneering','geography','history','local','nature','nobility and royalty','religion','the planes'].map(x=>`Knowledge (${x})`);
const bard=['Appraise','Balance','Bluff','Climb','Concentration','Craft','Decipher Script','Diplomacy','Disguise','Escape Artist','Gather Information','Hide','Jump',...knowledge,'Listen','Move Silently','Perform','Profession','Sense Motive','Sleight of Hand','Speak Language','Spellcraft','Swim','Tumble','Use Magic Device'];
const cases=[
 ['bardic-sage-118',bard,'6 + Int',/Intelligence/],
 ['divine-bard-121',bard,'6 + Int',/Wisdom/],
 ['battle-sorcerer-119',['Concentration','Craft','Intimidate','Knowledge (arcana)','Profession','Spellcraft'],'2 + Int',/light armor/],
 ['domain-wizard-122',['Concentration','Craft','Decipher Script',...knowledge,'Profession','Spellcraft'],'2 + Int',/domain/],
];
for(const [slug,skills,points,summary] of cases){
 const source=raw.find(r=>r.id===`classes/${slug}`),before=JSON.stringify(source);
 const definition=normalizeCatalogRecord(source,'dndtools','classes');
 assert.deepEqual([...definition.classSkills].sort(),[...skills].sort(),`${source.name}: complete source class skill list`);
 assert.equal(definition.skillPoints,points);
 assert.deepEqual(definition.stats.classSkills,definition.classSkills);
 assert.equal(definition.stats.skillPoints,points);
 assert.match(definition.description,summary);
 assert.equal(definition.sourceContentReview.status,'partial','reviewed fields cannot certify an entire class');
 assert.deepEqual(definition.sourceContentReview.fields,Object.keys(definition.sourceContentReview.fieldSources));
 for(const urls of Object.values(definition.sourceContentReview.fieldSources))assert(urls.length&&urls.every(url=>url.startsWith('https://')));
 assert(definition.sourceContentReview.remaining.length>0);
 assert.equal(definition.reviewBatch,undefined);
 assert.equal(normalizeCatalogRecord({...source,enrichment:{validated:false}},'dndtools','classes').referenceOnly,true,'partial field corrections do not promote verification');
 assert.equal(JSON.stringify(source),before,'source import is not mutated');
 for(const level of [1,10,20]){
  const character=reconcileClassGrants({ruleset:'3.5',level,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}]});
  for(const skill of skills)assert(legacyClassSkillStatus(character,skill).classSkill,`${source.name}: sheet omitted ${skill}`);
  assert(!legacyClassSkillStatus(character,'Knowledge').classSkill,'generic Knowledge is not a skill');
  if(slug==='battle-sorcerer-119')for(const skill of ['Bluff','Knowledge (religion)'])assert(!legacyClassSkillStatus(character,skill).classSkill,`Battle Sorcerer wrongly grants ${skill}`);
  assert.deepEqual(reconcileClassGrants(JSON.parse(JSON.stringify(character))),character,'save/reload is stable');
 }
 for(const changed of [{id:'classes/other-source'},{name:'Different class'},{sourceBook:'Different book'}]){
  const other=normalizeCatalogRecord({...source,...changed},'dndtools','classes');
  assert.equal(other.sourceContentReview,undefined,'correction requires matching ID, name and book');
  assert.deepEqual(other.classSkills,source.classSkills);
 }
 const fifth=normalizeCatalogRecord(source,'wikidot5e','classes');
 assert.equal(fifth.sourceContentReview,undefined,'3.5 corrections do not apply to 5e');
}
const sage=normalizeCatalogRecord(raw.find(r=>r.id==='classes/bardic-sage-118'),'dndtools','classes');
assert.equal(sage.prerequisites.find(p=>p.kind==='alignment').text,'Neutral good, neutral, or neutral evil');
assert.match(sage.description,/retains.*abilities/i);
console.log('PASS four UA source corrections: full skill lists, skill points, alignment, sheet lifecycle and exact-source isolation.');
