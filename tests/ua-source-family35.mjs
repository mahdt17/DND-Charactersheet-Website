import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,legacyClassSkillStatus} from '../src/lib/classIntegration.js';
import {requirements} from '../src/lib/advancement.js';

const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const definitions=raw.map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const get=slug=>annotateClassGrantKinds(definitions.find(d=>d.sourceId==='classes/'+slug),definitions);
const sheet=(d,level=1)=>reconcileClassGrants({ruleset:'3.5',classLevels:[{catalogId:d.catalogId,name:d.name,edition:'3.5',level,definition:d}]});
const ua=raw.filter(r=>/Unearthed Arcana/.test(r.sourceBook));
assert.equal(ua.length,50);
for(const source of ua){
 const d=get(source.id.replace('classes/',''));
 assert.equal(d.sourceContentReview?.status,'partial',source.id+' needs field evidence');
 assert(d.sourceContentReview.remaining.length>0);
 assert.deepEqual(d.sourceContentReview.fields,Object.keys(d.sourceContentReview.fieldSources));
 for(const urls of Object.values(d.sourceContentReview.fieldSources))assert(urls.length&&urls.every(u=>u.startsWith('https://')));
 for(const level of [1,10,20]){
  const c=sheet(d,level);
  assert.equal(JSON.stringify(reconcileClassGrants(JSON.parse(JSON.stringify(c)))),JSON.stringify(c),source.id+' reload');
 }
 assert.equal(normalizeCatalogRecord({...source,sourceBook:'Other source'},'dndtools','classes').sourceContentReview,undefined);
}

// Exchange variants retain the baseline skill list even when their features change.
for(const [variant,parent] of [['barbarian-variant-950','barbarian-89'],['cleric-variant-972','cleric-91'],['druid-variant-952','druid-92'],['fighter-variant-953','fighter-93'],['monk-variant-954','monk-94'],['monk-variant-fighting-styles-949','monk-94'],['paladin-variant-955','paladin-95'],['ranger-variant-956','ranger-96'],['rogue-variant-958','rogue-97'],['totem-barbarian-133','barbarian-89']]){
 const d=get(variant),p=get(parent),c=sheet(d);
 assert.deepEqual([...d.classSkills].sort(),[...p.classSkills].sort(),variant+' baseline skills');
 for(const skill of p.classSkills)assert(legacyClassSkillStatus(c,skill).classSkill,variant+' missing '+skill);
 assert(!legacyClassSkillStatus(c,'Knowledge').classSkill,variant+' generic Knowledge');
}
for(const [slug,school] of [['abjurer-variant-960','Abjuration'],['conjurer-variant-961','Conjuration'],['diviner-variant-962','Divination'],['enchanter-variant-963','Enchantment'],['evoker-variant-964','Evocation'],['illusionist-variant-965','Illusion'],['necromancer-variant-966','Necromancy'],['transmuter-variant-967','Transmutation'],['wizard-variant-959',null]]){
 const d=get(slug),c=sheet(d);
 assert.equal(d.inheritanceSourceId,'classes/wizard-99');
 if(school)assert.equal(d.specialistSchool,school);
 assert.deepEqual([...d.classSkills].sort(),[...get('wizard-99').classSkills].sort());
 for(const skill of ['Heal','Scry','Sense Motive','Hide','Bluff','Intimidate'])assert(!legacyClassSkillStatus(c,skill).classSkill,slug+' optional skill leaked: '+skill);
}
const planar=sheet(get('planar-ranger-128'));
assert(legacyClassSkillStatus(planar,'Knowledge (the planes)').classSkill);
for(const skill of ['Knowledge (nature)','Knowledge (dungeoneering)','Speak Language'])assert(!legacyClassSkillStatus(planar,skill).classSkill);
assert.match(get('planar-ranger-128').classSkillRule.text,/Abyssal/);
for(const [slug,skills] of [['expert2-124',['Craft','Profession']],['warrior2-135',['Craft']]]){
 const c=sheet(get(slug));
 assert.deepEqual(c.classSkills35.map(s=>s.name).sort(),skills);
 assert.equal(c.classSkillRules35.length,1,'existing choice rule preserved');
}
assert(!legacyClassSkillStatus(sheet(get('swift-scion-880')),'Knowledge (arcana)').classSkill);
for(const slug of ['dwarf-paragon-1001','elf-paragon-1002'])assert(!legacyClassSkillStatus(sheet(get(slug)),'Search').classSkill);
const prereqs=slug=>JSON.stringify(get(slug).prerequisites);
assert.match(prereqs('prestige-ranger-878'),/Rapid Shot or Two-Weapon Fighting/);
assert.match(prereqs('prestige-paladin-877'),/Mounted Combat/);
assert.match(prereqs('prestige-bard-876'),/Knowledge \(any one\) 4 ranks/);
assert.match(prereqs('tainted-sorcerer-881'),/Concentration 8 ranks/);
const bardSkills=get('prestige-bard-876').prerequisites.find(p=>p.label==='Skills');
assert.equal(requirements({edition:'3.5',prerequisites:[bardSkills]},{ruleset:'3.5',skillRanks:{'Knowledge (arcana)':4,'Perform (sing)':8}})[0].status,'manual','unsupported any-one specialization needs confirmation, not a false rejection');
const dwarfRace=get('dwarf-paragon-1001').prerequisites.find(p=>p.kind==='race');
for(const race of ['Dwarf','Shield Dwarf','Gold Dwarf'])assert.notEqual(requirements({edition:'3.5',prerequisites:[dwarfRace]},{ruleset:'3.5',race})[0].status,'unmet','eligible dwarf subraces cannot be rejected by exact-name matching');
console.log('PASS 50 UA field reviews: sheet lifecycle, baseline skills, exact parents, conditional skill isolation and restored prerequisites.');
