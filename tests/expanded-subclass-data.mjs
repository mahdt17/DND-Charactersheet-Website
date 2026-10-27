import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';

const path=new URL('../src/data/expandedSubclasses.json',import.meta.url);
const records=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):[];
const manifestPath=new URL('../src/data/subclassManifest2014.json',import.meta.url);
const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):[];
const find=(cls,name)=>records.find(r=>r.class.name===cls&&r.name===name);

test('all 214 published and historical UA subclass choices have separate identities',()=>{
 assert.equal(records.length,214,'Complete the 13-class source inventory');
 assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 for(const item of manifest){const record=records.find(r=>r.class.name===item.className&&r.sourceUrl===item.sourceUrl);assert.ok(record,`${item.className}/${item.sourceUrl}`);assert.equal(record.entryLevel,item.entryLevel);assert.equal(record.sourceBook,item.sourceBook);assert.equal(record.playtest,item.playtest);}
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

test('source metadata separates random casts, expanded access, known spells and prayerbook-style additions',()=>{
 assert.equal(find('Ranger','Beast Master')?.features.find(f=>f.name==='Share Spells').level,15);
 assert.equal(find('Wizard','Invention (UA)')?.spellGrants.length,0,'Random Reckless Casting outcomes never grant learned or prepared spells');
 const stone=find('Sorcerer','Stone Sorcery (UA)').spellGrants.find(g=>g.name==='Compelled Duel');
 assert.equal(stone.acquisition,'expanded');assert.equal(stone.alwaysPrepared,false);
 const warlock=find('Warlock','Mage of Lorehold (UA)').spellGrants.find(g=>g.name==='Knock');
 assert.equal(warlock.acquisition,'known');assert.equal(warlock.alwaysPrepared,true);
 const wizard=find('Wizard','Mage of Lorehold (UA)').spellGrants.find(g=>g.name==='Knock');
 assert.equal(wizard.acquisition,'spellbook');assert.equal(wizard.alwaysPrepared,false);
 for(const name of ['Lunar Sorcery','Lunar Magic (UA)']){
  const grants=find('Sorcerer',name).spellGrants;assert.equal(grants.length,15,name);
  assert.ok(grants.every(g=>!g.choiceKey&&g.acquisition==='known'),name);
 }
 const genie=find('Warlock','Genie').spellGrants;
 assert.ok(genie.some(g=>g.choiceKey==='genie-kind'&&g.choice==='Dao'));
 assert.ok(genie.some(g=>g.name==='Phantasmal Force'&&!g.choiceKey));
});

test('fixed non-table spell grants retain acquisition levels, conditions and preparation rules',()=>{
 const stars=find('Druid','Stars').spellGrants;
 for(const name of ['Guidance','Guiding Bolt'])assert.ok(stars.some(g=>g.name===name&&g.classLevel===2&&g.condition==='holding-star-map'&&g.alwaysPrepared));
 for(const cls of ['Bard','Warlock','Wizard']){
  const r=find(cls,'Mage of Lorehold (UA)');
  assert.ok(r.spellGrants.some(g=>g.name==='Sacred Flame'&&g.acquisition==='known'&&g.classLevel===r.entryLevel));
  assert.ok(r.spellGrants.some(g=>g.name==='Comprehend Languages'&&g.acquisition===(cls==='Wizard'?'spellbook':'known')));
 }
 for(const cls of ['Druid','Warlock'])for(const name of ['Spare the Dying','Cure Wounds','Inflict Wounds'])assert.ok(find(cls,'Mage of Witherbloom (UA)').spellGrants.some(g=>g.name===name));
 for(const cls of ['Sorcerer','Wizard'])for(const name of ['Guidance','Guiding Bolt'])assert.ok(find(cls,'Mage of Quandrix (UA)').spellGrants.some(g=>g.name===name));
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

test('all fixed grants resolve to bundled spell metadata, including Modern Magic UA',()=>{
 const extraPath=new URL('../src/data/subclassSpellCatalog.json',import.meta.url);
 const extra=existsSync(extraPath)?JSON.parse(readFileSync(extraPath,'utf8')):[];
 const core=JSON.parse(readFileSync(new URL('../src/data/spells.json',import.meta.url),'utf8'));
 const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 const names=new Set([...core,...extra].map(s=>norm(s.name)));
 for(const r of records)for(const g of r.spellGrants)assert.ok(names.has(norm(g.name)),`${r.name}: ${g.name}`);
 assert.ok(extra.filter(s=>s.playtest).length>=14);
 for(const spell of extra){assert.ok(spell.casting_time&&spell.range&&spell.duration&&spell.description,spell.name);assert.ok(Number.isInteger(spell.level)&&spell.level>=0&&spell.level<=9);}
 assert.equal(extra.find(s=>s.name==='On/Off').level,0);
 assert.equal(extra.find(s=>s.name==='Arcane Hacking').level,2);
});
