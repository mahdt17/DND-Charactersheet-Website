import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,legacyClassSkillStatus} from '../src/lib/classIntegration.js';
const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const knowledge=['arcana','architecture and engineering','dungeoneering','geography','history','local','nature','nobility and royalty','religion','the planes','psionics'].map(n=>'Knowledge ('+n+')');
const specs=[
 ['cleric-91',8,2,['Concentration','Craft','Diplomacy','Heal','Knowledge (arcana)','Knowledge (history)','Knowledge (religion)','Knowledge (the planes)','Profession','Spellcraft'],['Ride','Knowledge (nature)','Bluff']],
 ['barbarian-89',12,4,['Climb','Craft','Handle Animal','Intimidate','Jump','Listen','Ride','Survival','Swim'],[]],
 ['druid-92',8,4,['Concentration','Craft','Diplomacy','Handle Animal','Heal','Knowledge (nature)','Listen','Profession','Ride','Spellcraft','Spot','Survival','Swim'],['Knowledge (arcana)']],
 ['fighter-93',10,2,['Climb','Craft','Handle Animal','Intimidate','Jump','Ride','Swim'],[]],
 ['monk-94',8,4,['Balance','Climb','Concentration','Craft','Diplomacy','Escape Artist','Hide','Jump','Knowledge (arcana)','Knowledge (religion)','Listen','Move Silently','Perform','Profession','Sense Motive','Spot','Swim','Tumble'],['Heal']],
 ['paladin-95',10,2,['Concentration','Craft','Diplomacy','Handle Animal','Heal','Knowledge (nobility and royalty)','Knowledge (religion)','Profession','Ride','Sense Motive'],['Knowledge (arcana)']],
 ['ranger-96',8,6,['Climb','Concentration','Craft','Handle Animal','Heal','Hide','Jump','Knowledge (dungeoneering)','Knowledge (geography)','Knowledge (nature)','Listen','Move Silently','Profession','Ride','Search','Spot','Survival','Swim','Use Rope'],['Bluff','Sense Motive']],
 ['rogue-97',6,8,['Appraise','Balance','Bluff','Climb','Craft','Decipher Script','Diplomacy','Disable Device','Disguise','Escape Artist','Forgery','Gather Information','Hide','Intimidate','Jump','Knowledge (local)','Listen','Move Silently','Open Lock','Perform','Profession','Search','Sense Motive','Sleight of Hand','Spot','Swim','Tumble','Use Magic Device','Use Rope'],['Knowledge (arcana)']],
 ['sorcerer-98',4,2,['Bluff','Concentration','Craft','Knowledge (arcana)','Profession','Spellcraft'],['Scry','Heal','Decipher Script']],
 ['wizard-99',4,2,['Concentration','Craft','Decipher Script',...knowledge,'Profession','Spellcraft'],['Heal','Scry']],
];
for(const [slug,hd,points,skills,excluded] of specs){
 const source=raw.find(r=>r.id==='classes/'+slug),d=normalizeCatalogRecord(source,'dndtools','classes');
 assert.deepEqual([...d.classSkills].sort(),[...skills].sort(),slug+' fixed class skill list');
 assert.equal(d.hit_die,hd);assert.equal(d.skillPoints,points+' + Int');
 assert.equal(d.sourceContentReview.status,'partial');
 const definition=annotateClassGrantKinds(d,[]),sheet=reconcileClassGrants({ruleset:'3.5',classLevels:[{catalogId:d.catalogId,name:d.name,edition:'3.5',level:1,definition}]});
 for(const skill of skills)assert(legacyClassSkillStatus(sheet,skill).classSkill,slug+' omitted '+skill);
 for(const skill of ['Knowledge',...excluded])assert(!legacyClassSkillStatus(sheet,skill).classSkill,slug+' incorrectly grants '+skill);
}
console.log('PASS ten exact PHB base-class skills: specific Knowledge disciplines, domain isolation and removed extraction noise.');
