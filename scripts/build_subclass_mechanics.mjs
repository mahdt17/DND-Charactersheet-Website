// Compile the two source-audit artifacts into data consumed by the sheet.
// Usage: node scripts/build_subclass_mechanics.mjs --audit-dir <snapshot folder>
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {subclassValue} from '../src/lib/subclassFormulas.js';
const catalog=JSON.parse(readFileSync(new URL('../src/data/expandedSubclasses.json',import.meta.url),'utf8'));
const equipment=JSON.parse(readFileSync(new URL('../src/data/equipment.json',import.meta.url),'utf8'));
const target=new URL('../src/data/subclassMechanics2014.json',import.meta.url);
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const skills=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const languages=['Common','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Abyssal','Celestial','Draconic','Deep Speech','Infernal','Primordial','Sylvan','Undercommon'];
const damageTypes=['Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Psychic','Radiant','Slashing','Thunder'];
const tools=equipment.filter(e=>e.equipment_category?.name==='Tools');
const artisans=tools.filter(e=>/artisan/i.test(e.tool_category||''));
const weapons=equipment.filter(e=>e.equipment_category?.name==='Weapon');
const adapters={
 '2014:subclass:fighter:battle-master':'battle-master',
 '2014:subclass:fighter:cavalier':'cavalier',
 '2014:subclass:barbarian:totem-warrior':'totem-warrior',
 '2014:subclass:wizard:bladesinging':'bladesinging',
};
const externalPools=new Set(['base:channel-divinity','base:ki','base:bardic-inspiration','base:bardic-inspiration-die-held','base:wild-shape','base:sorcery-points','base:rage','base:spell-slot','spell-slot','hit-die','hit-dice']);
function scope(kind,key){
 if(key==='session-spell')return 'activation';
 if(kind==='optional-feature-replacement')return 'replacement';
 if(kind==='temporary-spell'||/^on-|^per-(?!rest$)|random-result-dependent/.test(kind))return 'activation';
 if(/rest|^after-/.test(kind))return 'rest';
 return 'advancement';
}
function choice(raw,record,training){
 const c={...raw,scope:scope(raw.kind,raw.key),countMode:raw.countMode||'cumulative'};
 if(c.options&&!Array.isArray(c.options)){
  c.optionsByChoice=c.options;c.options=Object.values(c.optionsByChoice).flat();
  if(c.key==='advisor-skills'){c.dependsOn='mind-material';c.scope='rest';}
 }
 c.optionDetails=(c.options||[]).filter(o=>o&&typeof o==='object');
 c.options=(c.options||[]).map(o=>typeof o==='string'?o:o.name);
 const text=c.options.join(' '),lower=text.toLowerCase();
 if(['spell','cantrip','temporary-spell'].includes(c.kind)){
  const placeholder=c.kind==='temporary-spell'||c.options.some(s=>/\bany\b|\b(?:wizard|druid)\s+(?:cantrip|level)/i.test(s));
  if(placeholder){
   const filter={type:'spell'};
   const classes=['Artificer','Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Warlock','Wizard'].filter(n=>new RegExp(`\\b${n}\\b`,'i').test(text));
   if(classes.length)filter.classes=classes;
   const fixedLevel=text.match(/level\s+(\d)/i);
   if(c.kind==='cantrip')filter.levels=[0];else if(fixedLevel)filter.levels=[Number(fixedLevel[1])];else filter.maxByClass=true;
   if(c.kind==='temporary-spell'){filter.levels=[1,2,3,4,5,6,7,8,9];c.temporary=true;c.temporaryDuration='psionic-talent-hours';}
   const schools=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'].filter(n=>new RegExp(n,'i').test(text));
   if(schools.length)filter.schools=schools;
   c.filter=filter;c.options=[];
  }
 }else if(c.kind==='domain'){
  c.options=catalog.filter(r=>r.class.name==='Cleric').map(r=>r.name);
  c.filter={type:'subclass',className:'Cleric'};
 }else if(c.kind==='weapon-proficiency'&&c.options.some(s=>!weapons.some(e=>norm(e.name)===norm(s)))){
  let allowed=weapons;
  if(/one-handed/i.test(text))allowed=allowed.filter(e=>e.weapon_range==='Melee'&&!e.properties?.some(p=>p.index==='two-handed'));
  else{
   if(/martial/.test(lower)&&!/simple/.test(lower))allowed=allowed.filter(e=>e.weapon_category==='Martial');
   if(/melee/.test(lower)&&!/ranged/.test(lower))allowed=allowed.filter(e=>e.weapon_range==='Melee');
   if(/ranged/.test(lower)&&!/melee/.test(lower))allowed=allowed.filter(e=>e.weapon_range==='Ranged');
   if(/kensei/.test(record.id)&&!record.playtest)allowed=allowed.filter(e=>e.index==='longbow'||!e.properties?.some(p=>['heavy','special'].includes(p.index)));
  }
  c.options=allowed.map(e=>e.name);
 }else if(/language/.test(c.kind)&&/any.*language/i.test(text)){
  c.options=c.options.filter(s=>!/any.*language/i.test(s));
  if(c.kind==='language'){c.options=[...languages];c.freeText=true;}
  else c.options.push(...languages.map(n=>'Language: '+n));
 }else if(/tool|skill|rest/.test(c.kind)||c.kind==='per-use'){
  const expanded=[];
  for(const option of c.options){
   if(/any.*artisan/i.test(option))expanded.push(...artisans.map(e=>e.name));
   else if(/any.*gaming/i.test(option))expanded.push('Dice set','Playing card set','Dragonchess set','Three-Dragon Ante set');
   else if(/any.*skill.*tool|any.*tool.*skill/i.test(option))expanded.push(...skills,...tools.map(e=>e.name));
   else if(/any.*skill/i.test(option))expanded.push(...skills);
   else if(/any.*tool/i.test(option))expanded.push(...tools.map(e=>e.name));
   else if(/any.*damage type/i.test(option))expanded.push(...damageTypes);
   else expanded.push(option);
  }
  c.options=expanded;
 }
 if(c.key==='duplicate-tool'){
  const fixed=training.find(t=>t.feature===c.feature&&t.kind==='tool-proficiency');
  if(fixed)c.when={alreadyProficient:fixed.value,kind:'tools'};
 }
 if(c.key==='minor-illusion-fallback')c.when={alreadyKnownSpell:'Minor Illusion'};
 if(c.key==='giant-language')c.when={alreadyKnownLanguage:'Giant'};
 if(c.key==='draconic-language')c.when={alreadyKnownLanguage:'Draconic'};
 if(['iron-mind-save','courtier-save-fallback','tireless-save-fallback'].includes(c.key))c.when={alreadyProficient:'wis',kind:'saves'};
 if(c.key==='royal-envoy-fallback')c.when={alreadyProficient:'Persuasion',kind:'skills'};
 if(c.key==='monster-hunter-training'){c.quotas=[{kind:'tools',max:1}];c.optionKinds=Object.fromEntries(c.options.map(n=>[n,skills.includes(n)?'skills':'tools']));}
 if(c.key==='runes-known'&&record.id==='2014:subclass:fighter:rune-knight')c.optionDetails=c.options.map(n=>({name:n,minimumClassLevel:['Hill','Storm'].includes(n)?7:3}));
 if(c.key==='session-spell'){c.filter.maxBy='pb';c.filter.maxByInput='participants';c.inputs=[{key:'participants',label:'Ritual participants',min:1,max:'pb',default:1}];c.temporary=true;c.temporaryDuration='until-long-rest';}
 if(record.id==='2014:subclass:ranger:beast-master'){
  if(c.key==='beast-type'){c.scope='activation';c.options=[];c.filter={type:'creature',creatureType:'beast',maxCR:0.25,maxSize:'Medium'};c.when={choice:'companion-implementation',equals:"Ranger's Companion"};}
  if(c.key==='primal-profile'){c.scope='activation';c.when={choice:'companion-implementation',equals:'Primal Companion'};}
 }
 if(c.key==='divine-affinity')c.spellsByOption=Object.fromEntries(c.options.map(s=>[s,[{name:s.slice(s.indexOf(':')+1),acquisition:'known',alwaysPrepared:true}]]));
 c.options=[...new Set(c.options)];
 return c;
}
function sourceChoices(facts,record){
 return (facts.choices||[]).flatMap(c=>{
  if(record.flexibleFeatureSelection&&['feature','subclass-feature'].includes(c.kind))return [];
  if(record.id==='2014:subclass:bard:satire-ua'&&c.key==='duplicate-proficiencies')return [
   {...c,key:'duplicate-skill-proficiency',count:1,when:{alreadyProficient:'Sleight of Hand',kind:'skills'}},
   {...c,key:'duplicate-tool-proficiency',count:1,when:{alreadyProficient:"Thieves' Tools",kind:'tools'}},
  ];
  if(record.id==='2014:subclass:fighter:knight-ua'&&c.key==='noble-training')return [
   {...c,key:'noble-training-kind',kind:'permanent',count:1,options:['Skills','Language'],notes:'Choose either two listed skill proficiencies or one language.'},
   {...c,kind:'skill',count:2,options:c.options.filter(n=>skills.includes(n)),when:{choice:'noble-training-kind',equals:'Skills'}},
   {...c,key:'noble-language',kind:'language',count:1,options:['any language'],when:{choice:'noble-training-kind',equals:'Language'}},
  ];
  if(record.id==='2014:subclass:monk:kensei'&&c.key==='initial-kensei-weapons'){
   const allowed=weapons.filter(e=>e.index==='longbow'||!e.properties?.some(p=>['heavy','special'].includes(p.index)));
   return ['Melee','Ranged'].map(type=>({...c,key:`initial-kensei-${type.toLowerCase()}`,count:1,options:allowed.filter(e=>e.weapon_range===type).map(e=>e.name),excludeDuplicatesAcross:['initial-kensei-melee','initial-kensei-ranged','later-kensei-weapons']}));
  }
  if(record.id==='2014:subclass:monk:kensei'&&c.key==='later-kensei-weapons')return [{...c,excludeDuplicatesAcross:['initial-kensei-melee','initial-kensei-ranged','later-kensei-weapons']}];
  return [c];
 });
}
function reference(item,record){
 const feature=record.features.find(f=>norm(f.name)===norm(item.feature));
 const value={...item,level:Math.max(record.entryLevel,Number(item.level)||record.entryLevel),...(feature?{featureId:feature.id}:{})};
 // The feature catalog already owns complete rule text. Retain concise extra
 // notes and conditions, but avoid shipping another copy of the same paragraphs.
 const normalized=s=>norm(String(s||'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1'));
 const note=normalized(value.notes),body=normalized(feature?.description);
 if(note.length>180&&body.includes(note)){delete value.notes;value.rulesFromFeature=true;}
 if(value.reset==='none'&&value.sourceReset&&normalized(value.recoveryText)===note)value.recoveryText='Recovery: '+value.sourceReset.replaceAll('-',' ');
 return value;
}
function compile(facts,record){
 const training=(facts.training||[]).map(t=>reference(t,record));
 const saveFallback=(facts.choices||[]).find(c=>['iron-mind-save','courtier-save-fallback','tireless-save-fallback'].includes(c.key));
 if(saveFallback)training.push(reference({feature:saveFallback.feature,level:saveFallback.level,sourceEvidence:saveFallback.sourceEvidence,kind:'save-proficiency',value:'wis'},record));
 const envoy=(facts.choices||[]).find(c=>c.key==='royal-envoy-fallback');
 if(envoy)for(const kind of ['skill-proficiency','expertise'])training.push(reference({feature:envoy.feature,level:envoy.level,sourceEvidence:envoy.sourceEvidence,kind,value:'Persuasion'},record));
 const choices=sourceChoices(facts,record).map(c=>reference(choice(c,record,training),record));
 const resources=(facts.resources||[]).map(r=>{
  const reset=/^short(?:-or-long)?-rest$/.test(r.reset)?'short':r.reset==='long-rest'?'long':'none';
  const result=reference({...r,sourceReset:r.reset,reset,...(reset==='none'?{recoveryText:r.notes||`Recovery: ${r.reset}`}:{})},record);
  if(record.id==='2014:subclass:fighter:rune-knight'&&/^rune-/.test(r.key)){
   const name=r.key.slice(5);result.when={choice:'runes-known',equals:name[0].toUpperCase()+name.slice(1)};
   if(['hill','storm'].includes(name))result.level=7;
  }
  return result;
 });
 const keys=new Set(resources.map(r=>r.key));
 const actions=(facts.actions||[]).map(a=>{
  const result=reference({...a,...(a.resourceKey&&!keys.has(a.resourceKey)&&!externalPools.has(a.resourceKey)?{referenceOnly:true}:{} )},record);
  if(record.id==='2014:subclass:fighter:rune-knight'&&/^rune-/.test(a.resourceKey)){
   const name=a.resourceKey.slice(5);result.when={choice:'runes-known',equals:name[0].toUpperCase()+name.slice(1)};
   if(['hill','storm'].includes(name))result.level=7;
  }
  return result;
 });
 const passives=(facts.passives||[]).filter(p=>!['source-rule','source-feature'].includes(p.kind)).map(p=>reference(p,record));
 return {recordId:record.id,...(adapters[record.id]?{adapter:adapters[record.id]}:{}),choices,resources,actions,passives,training,spellNotes:facts.spellNotes||[],companions:facts.companions||[],unresolved:facts.unresolved||[]};
}
function validate(records){
 if(records.length!==214||new Set(records.map(r=>r.recordId)).size!==214)throw Error('Incomplete mechanics inventory.');
 const values={level:20,pb:6,str:3,dex:3,con:3,int:3,wis:3,cha:3};
 for(const r of records){
  for(const type of ['choices','resources','actions'])if(new Set(r[type].map(x=>x.key)).size!==r[type].length)throw Error(`Duplicate ${type}: ${r.recordId}`);
  for(const item of [...r.choices,...r.resources,...r.actions,...r.passives,...r.training])if(!item.sourceEvidence)throw Error(`Missing source evidence: ${r.recordId}/${item.key||item.feature}`);
  for(const c of r.choices)for(const value of c.options)if(typeof value!=='string'||value.length>200||value.includes('\n')||/Click here|Wikidot/.test(value))throw Error(`Invalid choice label: ${r.recordId}/${c.key}`);
  for(const c of r.choices)if(c.count!=null)subclassValue(c.count,values);
  for(const p of r.resources)subclassValue(p.max,values);
 }
}
if(process.argv.includes('--check')){const records=JSON.parse(readFileSync(target,'utf8'));validate(records);console.log(`PASS ${records.length} subclass mechanics records`);}
else{
 const at=process.argv.indexOf('--audit-dir');if(at<0)throw Error('Provide --audit-dir containing mechanics-audit-a/b.json');
 const folder=resolve(process.argv[at+1]);
 const facts=['a','b'].flatMap(s=>JSON.parse(readFileSync(resolve(folder,`mechanics-audit-${s}.json`),'utf8')));
 const records=catalog.map(record=>{const data=facts.find(f=>f.recordId===record.id);if(!data)throw Error(`Missing ${record.id}`);return compile(data,record);});
 validate(records);if(process.argv.includes('--verify')){if(readFileSync(target,'utf8')!==JSON.stringify(records,null,2)+'\n')throw Error('Generated mechanics differ');console.log('PASS generated mechanics match');}else writeFileSync(target,JSON.stringify(records,null,2)+'\n');
 console.log(`${process.argv.includes('--verify')?'Verified':'Built'} ${records.length} mechanics records; ${records.reduce((n,r)=>n+r.passives.length,0)} typed passives`);
}
