import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
import {subclassValue} from '../src/lib/subclassFormulas.js';
const file=new URL('../src/data/subclassMechanics2014.json',import.meta.url);
const records=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):[];
const catalog=JSON.parse(readFileSync(new URL('../src/data/expandedSubclasses.json',import.meta.url),'utf8'));
const ids=new Set(catalog.map(r=>r.id));
const context={level:20,pb:6,str:3,dex:3,con:3,int:3,wis:3,cha:3};
const knownPools=new Set(['base:channel-divinity','base:ki','base:bardic-inspiration','base:bardic-inspiration-die-held','base:wild-shape','base:sorcery-points','base:rage','base:spell-slot','spell-slot','hit-die','hit-dice']);
const get=tail=>records.find(r=>r.recordId===`2014:subclass:${tail}`);

test('every subclass has separate structured mechanics with source evidence',()=>{
 assert.equal(records.length,214);
 assert.equal(new Set(records.map(r=>r.recordId)).size,214);
 for(const r of records){
  assert.ok(ids.has(r.recordId));
  for(const key of ['choices','resources','actions'])assert.equal(new Set(r[key].map(x=>x.key)).size,r[key].length,`${r.recordId}/${key}`);
  for(const item of [...r.choices,...r.resources,...r.actions,...r.passives,...r.training])assert.ok(item.sourceEvidence,`${r.recordId}/${item.key||item.feature}`);
  assert.ok(r.passives.every(p=>!['source-rule','source-feature'].includes(p.kind)));
  for(const choice of r.choices){
   assert.ok(['advancement','rest','activation','replacement'].includes(choice.scope));
   assert.ok(choice.options.length||choice.filter||choice.freeText,`${r.recordId}/${choice.key}`);
   for(const value of choice.options){assert.equal(typeof value,'string');assert.ok(value.length<200&&!value.includes('\n'));assert.doesNotMatch(value,/Click here|Wikidot|^any (?:skill|tool|language|wizard|class spell)\b/i);}
   if(choice.count!=null)assert.ok(Number.isFinite(subclassValue(choice.count,context)),`${r.recordId}/${choice.key}`);
  }
 }
});

test('flexible Strixhaven progression has one canonical choice system and rune prerequisites stay version-specific',()=>{
 for(const source of catalog.filter(r=>r.flexibleFeatureSelection))assert.ok(get(source.id.replace('2014:subclass:','')).choices.every(c=>!['feature','subclass-feature'].includes(c.kind)),source.id);
 const published=get('fighter:rune-knight'),choice=published.choices.find(c=>c.key==='runes-known');
 for(const name of ['Hill','Storm']){
  assert.equal(choice.optionDetails.find(o=>o.name===name)?.minimumClassLevel,7);
  const pool=published.resources.find(r=>r.key===`rune-${name.toLowerCase()}`);assert.equal(pool.level,7);assert.deepEqual(pool.when,{choice:'runes-known',equals:name});
 }
 assert.ok(get('fighter:rune-knight-ua').choices.find(c=>/runes/.test(c.key)).optionDetails.every(o=>!o.minimumClassLevel||o.minimumClassLevel===3));
});

test('conditional fallback training and mixed-choice quotas encode their actual eligibility',()=>{
 for(const [tail,key] of [['ranger:gloom-stalker','iron-mind-save'],['fighter:samurai','courtier-save-fallback'],['fighter:samurai-ua','tireless-save-fallback']]){
  const r=get(tail);assert.deepEqual(r.choices.find(c=>c.key===key).when,{alreadyProficient:'wis',kind:'saves'});assert.ok(r.training.some(t=>t.kind==='save-proficiency'&&t.value==='wis'));
 }
 assert.deepEqual(get('fighter:banneret').choices.find(c=>c.key==='royal-envoy-fallback').when,{alreadyProficient:'Persuasion',kind:'skills'});
 const k=get('monk:kensei');
 assert.ok(k.choices.find(c=>c.key==='initial-kensei-melee').options.includes('Longsword'));
 assert.ok(!k.choices.find(c=>c.key==='initial-kensei-melee').options.includes('Longbow'));
 assert.ok(k.choices.find(c=>c.key==='initial-kensei-ranged').options.includes('Longbow'));
 assert.deepEqual(get('fighter:monster-hunter-ua').choices.find(c=>c.key==='monster-hunter-training').quotas,[{kind:'tools',max:1}]);
 const knight=get('fighter:knight-ua');assert.deepEqual(knight.choices.find(c=>c.key==='noble-training-kind').options,['Skills','Language']);
 assert.equal(knight.choices.find(c=>c.key==='noble-training').count,2);assert.equal(knight.choices.find(c=>c.key==='noble-language').count,1);
});

test('event choices and temporary spell bounds cannot turn into permanent advancement requirements',()=>{
 const psionic=get('sorcerer:psionic-soul-ua').choices.find(c=>c.key==='psionic-discovery');
 assert.equal(psionic.scope,'activation');assert.equal(psionic.temporary,true);assert.deepEqual(psionic.filter.classes,['Sorcerer']);assert.deepEqual(psionic.filter.schools,['Divination','Enchantment']);assert.equal(psionic.options.length,0);
 assert.equal(get('wizard:lore-mastery-ua').choices.find(c=>c.key==='initiative-ability').scope,'activation');
 for(const r of records)for(const c of r.choices)if(['per-turn','on-initiative','on-brew-creation','temporary-spell'].includes(c.kind))assert.equal(c.scope,'activation');
 for(const tail of ['bard:spirits','bard:spirits-ua']){
  const c=get(tail).choices.find(c=>c.key==='session-spell');assert.equal(c.filter.maxBy,'pb');assert.equal(c.filter.maxByInput,'participants');assert.equal(c.inputs[0].max,'pb');
 }
 const satire=get('bard:satire-ua').choices;assert.ok(satire.some(c=>c.when?.alreadyProficient==='Sleight of Hand'));assert.ok(satire.some(c=>c.when?.alreadyProficient==="Thieves' Tools"));
});

test('resource limits are calculable and actions cannot spend nonexistent pools',()=>{
 for(const r of records){
  const pools=new Set(r.resources.map(p=>p.key));
  for(const p of r.resources){assert.ok(Number.isFinite(subclassValue(p.max,context)),`${r.recordId}/${p.key}`);assert.ok(['short','long','none'].includes(p.reset));}
  for(const a of r.actions)if(!a.referenceOnly&&a.resourceKey)assert.ok(pools.has(a.resourceKey)||knownPools.has(a.resourceKey),`${r.recordId}/${a.key}/${a.resourceKey}`);
  for(const item of [...r.resources,...r.actions])if(item.when?.choice){const c=r.choices.find(c=>c.key===item.when.choice);assert.ok(c?.options.includes(item.when.equals),`${r.recordId}/${item.key}: invalid choice gate ${item.when.equals}`);}
 }
});

test('spell and training filters retain actual source restrictions instead of placeholder options',()=>{
 const bladesinger=records.find(r=>r.recordId==='2014:subclass:wizard:bladesinging');
 assert.equal(bladesinger.adapter,'bladesinging');
 assert.ok(bladesinger.choices.find(c=>c.key==='bladesinger-weapon').options.includes('Rapier'));
 const arcana=records.find(r=>r.recordId==='2014:subclass:cleric:arcana');
 assert.deepEqual(arcana.choices.find(c=>c.key==='wizard-cantrips').filter,{type:'spell',classes:['Wizard'],levels:[0]});
 assert.deepEqual(arcana.choices.find(c=>c.key==='wizard-spell-9').filter,{type:'spell',classes:['Wizard'],levels:[9]});
 const armorer=records.find(r=>r.recordId==='2014:subclass:artificer:armorer');
 assert.ok(armorer.choices.find(c=>c.key==='duplicate-tool').when.alreadyProficient);
 assert.equal(armorer.choices.find(c=>c.key==='armor-model').scope,'rest');
 const monk=records.find(r=>r.recordId==='2014:subclass:monk:four-elements').choices.find(c=>c.key==='disciplines');
 assert.equal(monk.options.length,16);assert.equal(monk.countMode,'gained');assert.equal(monk.optionDetails.find(o=>o.name==='Breath of Winter').minimumClassLevel,17);
});
