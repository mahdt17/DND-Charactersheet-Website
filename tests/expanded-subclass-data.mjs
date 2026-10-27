import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';

const path=new URL('../src/data/expandedSubclasses.json',import.meta.url);
const records=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):[];
const find=(cls,name)=>records.find(r=>r.class.name===cls&&r.name===name);

test('all 214 published and historical UA subclass choices have separate identities',()=>{
 assert.equal(records.length,214,'Complete the 13-class source inventory');
 assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 const counts={Artificer:6,Bard:13,Cleric:23,Druid:13,Monk:15,Paladin:13,Ranger:14,Rogue:13,Sorcerer:22,Warlock:22,Wizard:26,Fighter:22,Barbarian:12};
 for(const [name,count] of Object.entries(counts))assert.equal(records.filter(r=>r.class.name===name).length,count,name);
 for(const r of records){
  assert.equal(r.edition,'2014');assert.ok(r.sourceBook&&r.sourceUrl&&r.sourceHash);
  assert.match(r.sourceUrl,/^https:\/\/dnd5e\.wikidot\.com\//);
  assert.equal(r.playtest,/Unearthed Arcana/i.test(r.sourceBook));
  assert.equal(r.name.includes('(UA)'),r.playtest,r.name);
  assert.equal(r.entryLevel,({Cleric:1,Sorcerer:1,Warlock:1,Druid:2,Wizard:2})[r.class.name]||3);
  assert.ok(r.features.length,r.name);
  assert.equal(new Set(r.features.map(f=>f.id)).size,r.features.length,r.name);
  for(const f of r.features){assert.ok(f.name&&f.description&&f.sourceUrl);assert.ok(Number.isInteger(f.level)&&f.level>=r.entryLevel&&f.level<=20,`${r.name}: ${f.name}@${f.level}`);assert.doesNotMatch(f.description,/Click here to edit|Wikidot\.com Terms|Notify administrators/);}
 }
 assert.ok(find('Wizard','Bladesinging'));
 assert.ok(find('Wizard','Order of Scribes'));
 assert.ok(find('Wizard','Order of Scribes (UA)'));
 assert.ok(find('Fighter','Arcane Archer (2016) (UA)'));
 assert.ok(find('Fighter','Arcane Archer (2017) (UA)'));
});

test('Bladesinging, Fighter and spell-grant progressions retain their actual levels',()=>{
 assert.deepEqual(find('Wizard','Bladesinging')?.features.map(f=>[f.name,f.level]),[['Training in War and Song',2],['Bladesong',2],['Extra Attack',6],['Song of Defense',10],['Song of Victory',14]]);
 assert.match(find('Wizard','Bladesinging')?.features.find(f=>f.name==='Bladesong').description||'',/proficiency bonus/);
 assert.deepEqual(find('Fighter','Rune Knight')?.features.map(f=>f.level),[3,3,3,7,10,15,18]);
 assert.equal(find('Druid','Wildfire (UA)')?.features.find(f=>f.name==='Flames of Life').level,10);
 const peace=find('Cleric','Peace');assert.ok(peace?.spellGrants.some(g=>g.name==='Warding Bond'&&g.classLevel===3&&g.alwaysPrepared));
 const hex=find('Warlock','Hexblade');assert.ok(hex?.spellGrants.some(g=>g.name==='Shield'&&g.classLevel===1&&!g.alwaysPrepared));
 const monk=find('Monk','Four Elements');assert.equal(monk?.disciplineOptions.length,17);assert.ok(monk.disciplineOptions.some(d=>d.name==='Fist of Unbroken Air'&&d.level===3));
});

test('Strixhaven UA records model selection rather than granting every optional feature',()=>{
 for(const r of records.filter(r=>/Mage of (Lorehold|Prismari|Quandrix|Silverquill|Witherbloom)/.test(r.name))){
  assert.equal(r.flexibleFeatureSelection,true,r.name);
  assert.ok(r.features.every(f=>f.level>=r.entryLevel));
  assert.ok(r.features.filter(f=>f.optional).length>=3);
 }
});
