import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,legacyClassSkillStatus} from '../src/lib/classIntegration.js';
import {baseProgression,progressionRow} from '../src/lib/advancement.js';
const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const definitions=raw.map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const get=slug=>annotateClassGrantKinds(definitions.find(r=>r.sourceId==='classes/'+slug),definitions);
const sheet=(d,level)=>reconcileClassGrants({ruleset:'3.5',level,classLevels:[{catalogId:d.catalogId,name:d.name,edition:'3.5',level,definition:d}]});
const dmg=raw.filter(r=>r.sourceBook.endsWith("Dungeon Master's Guide v.3.5"));
assert.equal(dmg.length,32);
for(const source of dmg){
 const d=get(source.id.replace('classes/',''));
 assert.equal(d.sourceContentReview?.status,'partial',source.id+' field evidence');
 assert(d.sourceContentReview.remaining.length>0);
 assert.deepEqual(d.sourceContentReview.fields,Object.keys(d.sourceContentReview.fieldSources));
 for(const level of d.name.startsWith('Epic ')?[21,30]:[1,10]){
  const c=sheet(d,level);
  assert.equal(JSON.stringify(reconcileClassGrants(JSON.parse(JSON.stringify(c)))),JSON.stringify(c));
 }
 assert.equal(normalizeCatalogRecord({...source,name:'Unrelated class'},'dndtools','classes').sourceContentReview,undefined);
}
for(const [epic,parent] of [['epic-barbarian-991','barbarian-89'],['epic-bard-1012','bard'],['epic-cleric-1013','cleric-91'],['epic-druid-1014','druid-92'],['epic-fighter-1016','fighter-93'],['epic-monk-1017','monk-94'],['epic-paladin-1018','paladin-95'],['epic-ranger-1019','ranger-96'],['epic-rogue-1020','rogue-97'],['epic-sorcerer-1021','sorcerer-98'],['epic-wizard-1022','wizard-99']]){
 assert.deepEqual([...get(epic).classSkills].sort(),[...get(parent).classSkills].sort(),epic+' retains its class skill disciplines');
}
for(const [slug,yes,no] of [
 ['archmage-380',['Craft (alchemy)','Knowledge (psionics)'],['Craft','Craft (weaponsmithing)']],
 ['assassin-381',['Disable Device'],['Knowledge (arcana)']],
 ['blackguard-382',['Craft','Knowledge (religion)'],['Knowledge (arcana)']],
 ['hierophant-387',['Knowledge (arcana)','Knowledge (religion)'],['Knowledge (nature)']],
 ['horizon-walker-388',['Knowledge (geography)'],['Swim','Knowledge (arcana)']],
 ['loremaster-389',['Craft (alchemy)','Knowledge (psionics)'],['Craft','Tumble']],
 ['thaumaturgist-393',['Knowledge (religion)','Knowledge (the planes)'],['Knowledge (nature)']],
 ['aristocrat-31',['Knowledge (psionics)'],['Knowledge']],
 ['adept-917',['Knowledge (psionics)'],['Knowledge']],
 ['arcane-trickster-379',['Knowledge (psionics)','Disable Device'],['Perform']],
]){
 const c=sheet(get(slug),1);
 for(const s of yes)assert(legacyClassSkillStatus(c,s).classSkill,slug+' omitted '+s);
 for(const s of no)assert(!legacyClassSkillStatus(c,s).classSkill,slug+' leaked '+s);
}
const expert=sheet(get('expert-33'),1);
assert.equal(expert.classSkills35.length,0,'NPC Expert does not automatically grant all ten selected skills');
assert.equal(expert.classAutomation.classes[0].classSkillChoices[0].count,10);
const blackguard=get('blackguard-382');
assert.equal(blackguard.progression.length,11,'Blackguard uses ten class levels, not servant advancement');
for(let level=1;level<=10;level++)assert.deepEqual(baseProgression(blackguard,level),{bab:level,fort:2+Math.floor(level/2),ref:Math.floor(level/3),will:Math.floor(level/3)});
assert.match(progressionRow(blackguard,3).Special,/command undead/i);
assert.equal(progressionRow(blackguard,1)['1st'],'0');
assert.equal(progressionRow(blackguard,10)['4th'],'1');
assert(!sheet(blackguard,10).grantedFeatures.some(f=>/improved evasion|share saving throws|speak with blackguard/i.test(f.name)),'servant abilities cannot become character features');
assert.match(progressionRow(get('epic-bard-1012'),26).Special,/Inspire Courage \+5/i);
for(const [level,bonus] of [[21,7],[24,8],[27,9],[30,10]])assert.match(progressionRow(get('epic-rogue-1020'),level).Special,new RegExp('trap sense \\+'+bonus,'i'));
for(const slug of ['epic-bard-1012','epic-rogue-1020']){
 const original=raw.find(r=>r.id==='classes/'+slug);
 for(let level=21;level<=30;level++)assert.deepEqual(baseProgression(get(slug),level),baseProgression(original,level),'milestone repair must preserve existing epic numeric columns');
}
console.log('PASS 32 DMG partial source reviews: fixed and chosen skills, epic skill continuity, specialized Craft, source identity and Blackguard advancement.');
