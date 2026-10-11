#!/usr/bin/env node
import fs from 'node:fs/promises';
import reviewedFeatureProgressions35 from '../src/data/class-feature-progression-35.json' with {type:'json'};
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {lowerPrerequisiteText35} from '../src/lib/prerequisites35.js';
import {lowerCastingPrerequisite35} from '../src/lib/castingPrerequisites35.js';
import {lowerClassFeaturePrerequisite35} from '../src/lib/classFeaturePrerequisites35.js';

const TOTAL=1054;
const norm=value=>String(value||'').trim().replace(/[’]/g,"'").replace(/\s+/g,' ');
const lower=value=>norm(value).toLowerCase();

function supportedPrerequisiteShape(p){
  if(!p||typeof p!=='object'||Array.isArray(p))return false;
  const kind=p.kind||p.type||'text';
  const text=norm(p.text||p.description||p.name);
  if(['all','any','count'].includes(kind)){
    if(!Array.isArray(p.requirements)||!p.requirements.length)return false;
    if(kind==='count'&&(!Number.isInteger(p.minimum)||p.minimum<1||p.minimum>p.requirements.length))return false;
    return p.requirements.every(supportedPrerequisiteShape);
  }
  if(kind==='spellcasting'&&Number.isInteger(p.minimum)&&p.minimum>=0&&p.minimum<=9)return !p.tradition||['arcane','divine'].includes(lower(p.tradition));
  if(lowerCastingPrerequisite35(p)||lowerClassFeaturePrerequisite35(p)||lowerPrerequisiteText35(p))return true;
  if(kind==='level'&&Number.isInteger(p.minimum)&&p.minimum>0)return true;
  if(kind==='ability_choice'){
    const options=p.options?.from?.options,choose=p.options?.choose;
    return Number.isInteger(choose)&&choose>0&&Array.isArray(options)&&options.length>=choose&&options.every(option=>option?.ability_score?.index&&Number.isFinite(option.minimum_score));
  }
  if(p.ability_score?.index&&Number.isFinite(p.minimum_score))return true;
  if(kind==='ability'&&/^(?:strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)$/i.test(String(p.ability||''))&&Number.isFinite(p.minimum))return true;
  if((kind==='base_attack_bonus'||kind==='bab')&&/^\+?\s*\d+\.?$/.test(text))return true;
  if((kind==='skills'||kind==='skill')&&!/\bor\b/i.test(text)){
    const parts=text.split(/\s*;\s*|,\s*(?![^()]*\))/);
    if(parts.length&&parts.every(part=>/^[\w ()'-]+?\s+\d+\s+ranks?\.?$/i.test(part)))return true;
  }
  if(['feat','feats'].includes(kind)&&!/\b(or|any|one|two|three|choose)\b/i.test(text.replace(/Two-Weapon/gi,'DualWeapon'))){
    const names=text.replace(/\.$/,'').split(/\s*;\s*|,\s*(?![^()]*\))/);
    if(names.length&&names.every(name=>/^[\w ()'-]+$/.test(name)))return true;
  }
  if(kind==='race'&&/^[\w -]+\.?$/.test(text)&&!/\b(or|any|not|except)\b/i.test(text))return true;
  if(kind==='alignment'){
    const value=lower(text.replace(/\.$/,''));
    if(/^(lawful|neutral|chaotic) (good|neutral|evil)$/.test(value)||/^any (?:lawful|chaotic|good|evil)$/.test(value)||/^any non[- ]?(?:lawful|chaotic|good|evil)$/.test(value))return true;
  }
  if(/base.*save|saving_throws/.test(kind)&&/^(?:Base )?(?:Fortitude|Reflex|Will)(?: Save)?\s*\+\d+\.?$/i.test(text))return true;
  if(kind==='caster_level'&&/^\d+$/.test(text))return true;
  if(/^(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\s+\d+(?: or higher)?\.?$/i.test(text))return true;
  return false;
}

const FEATURE_REQUIREMENTS=[
  ['companion/familiar/mount',/\b(?:animal companion|familiar|special mount)\b/i],
  ['turn/rebuke',/\b(?:turn|rebuke)(?:ing)?(?:\s+undead)?\b/i],
  ['sneak-attack/skirmish/sudden-strike',/\b(?:sneak attack|skirmish|sudden strike)\b/i],
  ['rage/frenzy',/\b(?:rage|frenzy)\b/i],
  ['wild-shape',/\bwild shape\b/i],
  ['smite/lay-on-hands',/\b(?:smite|lay on hands)\b/i],
  ['bardic/performance',/\b(?:bardic music|bardic knowledge|inspire courage|performance)\b/i],
  ['favored-enemy/wild-empathy',/\b(?:favou?red enemy|wild empathy)\b/i],
  ['evasion/uncanny-dodge',/\b(?:evasion|uncanny dodge)\b/i],
  ['maneuver/stance',/\b(?:maneuver|stance)\b/i],
  ['invocation/eldritch-blast',/\b(?:invocation|eldritch blast)\b/i],
  ['psionic-feature',/\b(?:mind blade|psionic focus|wild surge)\b/i],
  ['dragonmark',/\bdragonmark\b/i],
  ['trackless-step',/\btrackless step\b/i]
];

function compoundPrerequisiteKind(p,text){
  if(!/\b(?:or|either|one of|any of)\b/i.test(text))return null;
  const kind=p?.kind||p?.type||'text';
  if(/\b(?:class feature|rage|frenzy|wild shape|evasion|uncanny dodge|sneak attack|skirmish|sudden strike|turn|rebuke|bardic|favou?red enemy|wild empathy|mind blade|psionic focus|wild surge)\b/i.test(text)&&/\bfeat\b/i.test(text))return 'compound:feature-or-feat';
  if(/\b(?:cast|spell|manifest|power|invocation|infusion|caster|manifester)\b/i.test(text))return 'compound:magic-access';
  if(/\bproficien(?:t|cy|cies)\b/i.test(text))return 'compound:proficiency';
  if(['race','races'].includes(kind))return 'compound:race';
  if(kind==='alignment')return 'compound:alignment';
  if(['feat','feats'].includes(kind))return 'compound:feat';
  if(['skill','skills'].includes(kind))return 'compound:skill';
  if(/\b(?:deity|patron|church|organization|guild|region|regional|nation|homeland)\b/i.test(text))return 'compound:affiliation';
  return 'compound:other';
}

function magicAccessKind(p,text){
  const value=norm(text);
  if(/\binfusions?\b/i.test(value)&&/\b(?:cast|spells?|arcane|divine)\b/i.test(value))return 'magic:spell-or-infusion';
  if(/\b(?:manifest|manifester|psionic powers?|power points?)\b/i.test(value)&&/\b(?:cast|spells?|arcane|divine)\b/i.test(value))return 'magic:spell-or-psionic';
  if(/\b(?:invocations?|eldritch blast)\b/i.test(value)&&/\b(?:cast|spells?|arcane|divine)\b/i.test(value))return 'magic:spell-or-invocation';
  if(/\b(?:fly speed|spell-like ability|supernatural ability|breath weapon|wild shape|turn undead|rebuke undead)\b/i.test(value)&&/\b(?:cast|spells?)\b/i.test(value))return 'magic:casting-or-noncasting-ability';
  if(/\b(?:arcane|divine)\b/i.test(value)&&/\bor\b/i.test(value)&&/(?:\barcane\b.*\bor\b.*\bdivine\b|\bdivine\b.*\bor\b.*\barcane\b)/i.test(value))return 'magic:arcane-or-divine';
  if(/\b(?:summoning|divination|abjuration|conjuration|enchantment|evocation|illusion|necromancy|transmutation|fire|cold|acid|electricity|sonic|mind-affecting|teleportation)\b/i.test(value)||/\b(?:cast|know)\s+[a-z][a-z' -]{1,40}(?:,|\s+or\s+)/i.test(value))return 'magic:specific-spell-school-or-descriptor';
  if(/\b(?:spell|power)s? of \d|\b\d(?:st|nd|rd|th)[- ]level\b/i.test(value))return 'magic:level-access-other';
  return 'magic:other';
}

function unsupportedPrerequisiteKind(p){
  const text=norm(p?.text||p?.description||p?.name);
  const compound=compoundPrerequisiteKind(p,text);
  if(compound)return compound;
  for(const [kind,re] of FEATURE_REQUIREMENTS)if(re.test(text))return `class-feature:${kind}`;
  if(/\blanguages?\b/i.test(text)||['language','languages'].includes(p?.kind||p?.type))return 'language';
  if(/\b(?:deity|patron|church|organization|guild|region|regional|nation|homeland)\b/i.test(text))return 'affiliation/region/deity';
  if(/\b(?:special ability|class feature|ability to|must have|must possess)\b/i.test(text))return 'other-feature/special-ability';
  return `other:${p?.kind||p?.type||'text'}`;
}

const STACK_FAMILIES=[
  ['companion/familiar/mount',/\b(?:animal companion|familiar|special mount|mount)\b/i],
  ['smite/lay-on-hands',/\b(?:smite|lay on hands)\b/i],
  ['turn/rebuke',/\b(?:turn|rebuke)(?:ing)?\b/i],
  ['monk/unarmed/flurry',/\b(?:monk|unarmed|flurry)\b/i],
  ['sneak-attack/skirmish/sudden-strike',/\b(?:sneak attack|skirmish|sudden strike)\b/i],
  ['bardic/performance',/\b(?:bardic music|bardic knowledge|performance|inspire courage)\b/i],
  ['favored-enemy/wild-empathy',/\b(?:favou?red enemy|wild empathy)\b/i],
  ['rage/frenzy',/\b(?:rage|frenzy)\b/i],
  ['wild-shape',/\bwild shape\b/i],
  ['dragonmark',/\bdragonmark\b/i],
  ['other-feature-level',/\b(?:class feature|feature level|effective .* level)\b/i]
];
const STACK_SIGNAL=/\b(?:stack(?:s|ing|ed)?|effective\s+(?:class\s+)?level|counts?\s+as\s+(?:\w+\s+){0,3}levels?|advance(?:s|d|ment)?|progress(?:es|ion)?|levels?\s+stack)\b/i;
const GENERIC_FEATURE_PROGRESSION_SIGNAL=/\b(?:animal companion|familiar|special mount|smite(?: evil| good)?|lay on hands|turn undead|rebuke undead|turn or rebuke undead|flurry of blows|unarmed strike|sneak attack|skirmish|sudden strike|bardic music|bardic knowledge|favou?red enemy|wild empathy|rage|frenzy|wild shape|dragonmark)\b/i;

function addCluster(map,kind,record,text){
  if(!map.has(kind))map.set(kind,new Map());
  const id=record.sourceId||record.id||record.catalogId;
  if(!map.get(kind).has(id))map.get(kind).set(id,{sourceId:id,name:record.name||null,sourceBook:record.sourceBook||null,examples:[]});
  const row=map.get(kind).get(id);
  if(text&&row.examples.length<2)row.examples.push(text);
}
function clusterRows(map){
  return [...map].map(([kind,records])=>({kind,count:records.size,examples:[...records.values()].slice(0,5)})).sort((a,b)=>b.count-a.count||a.kind.localeCompare(b.kind));
}
function filteredClusterRows(map,allowedIds){
  return [...map].map(([kind,records])=>{
    const selected=[...records.entries()].filter(([id])=>allowedIds.has(id)).map(([,record])=>record);
    return {kind,count:selected.length,examples:selected.slice(0,5)};
  }).filter(row=>row.count>0).sort((a,b)=>b.count-a.count||a.kind.localeCompare(b.kind));
}
function trackerExample(entry,text){
  return {sourceId:entry.sourceId,name:entry.name||null,sourceBook:entry.sourceBook||null,example:text.slice(0,500)};
}

const catalogRaw=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8'));
const catalog=catalogRaw.map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const tracker=JSON.parse(await fs.readFile('docs/class-completion-tracker.json','utf8'));
const entries=tracker.entries||[];
if(catalog.length!==TOTAL)throw new Error(`Expected ${TOTAL} class catalog records; found ${catalog.length}`);
if(entries.length!==TOTAL)throw new Error(`Expected ${TOTAL} tracker records; found ${entries.length}`);

const prerequisiteClusters=new Map(),magicAccessClusters=new Map(),unsupportedPrerequisiteIds=new Set();
for(const record of catalog){
  for(const clause of record.prerequisites||[]){
    if(supportedPrerequisiteShape(clause))continue;
    const id=record.sourceId||record.id||record.catalogId;
    unsupportedPrerequisiteIds.add(id);
    const text=norm(clause.text||clause.description||clause.name),kind=unsupportedPrerequisiteKind(clause);
    addCluster(prerequisiteClusters,kind,record,text);
    if(kind==='compound:magic-access')addCluster(magicAccessClusters,magicAccessKind(clause,text),record,text);
  }
}

const stackingClusters=new Map(),stackingIds=new Set(),genericStackingIds=new Set(),stackingEvidence=new Map();
for(const entry of entries){
  if(entry.status==='complete')continue;
  const text=[...(entry.gaps||[]),...(entry.dependencies||[]),entry.nextAction,...(entry.nextActions||[])].filter(Boolean).join(' ');
  if(!STACK_SIGNAL.test(text))continue;
  let matched=false;
  for(const [kind,re] of STACK_FAMILIES){
    if(!re.test(text))continue;
    matched=true;
    stackingIds.add(entry.sourceId);
    addCluster(stackingClusters,kind,entry,text.slice(0,500));
  }
  if(!matched)continue;
  stackingEvidence.set(entry.sourceId,trackerExample(entry,text));
  if(GENERIC_FEATURE_PROGRESSION_SIGNAL.test(text))genericStackingIds.add(entry.sourceId);
}

const specializedStackingIds=new Set([...stackingIds].filter(id=>!genericStackingIds.has(id)));
const allReviewedFeatureProgressionSourceIds=Object.entries(reviewedFeatureProgressions35.entries||{})
  .filter(([,entry])=>entry?.verified===true&&Array.isArray(entry.advancements)&&entry.advancements.length>0)
  .map(([id])=>id)
  .sort();
const reviewedGenericCandidateSourceIds=allReviewedFeatureProgressionSourceIds.filter(id=>genericStackingIds.has(id));
const reviewedGenericCandidateIds=new Set(reviewedGenericCandidateSourceIds);
const remainingGenericMetadataIds=new Set([...genericStackingIds].filter(id=>!reviewedGenericCandidateIds.has(id)));
const examplesFor=ids=>[...ids].slice(0,5).map(id=>stackingEvidence.get(id)).filter(Boolean);
const prerequisiteRows=clusterRows(prerequisiteClusters);
const stackingRows=clusterRows(stackingClusters);
const report={
  total:TOTAL,
  mutatesSource:false,
  semantics:'Read-only planning audit. Counts identify exact source records whose current data exposes unsupported prerequisite shapes or tracker language indicating reusable feature-level stacking. Counts are not completion/certification claims and clusters may overlap.',
  prerequisites:{
    unsupportedClassCount:unsupportedPrerequisiteIds.size,
    clusters:prerequisiteRows,
    magicAccessBreakdown:clusterRows(magicAccessClusters)
  },
  featureStacking:{
    candidateClassCount:stackingIds.size,
    genericFeatureProgressionCandidateCount:genericStackingIds.size,
    specializedOrUnresolvedCandidateCount:specializedStackingIds.size,
    genericFeatureProgressionExamples:examplesFor(genericStackingIds),
    specializedOrUnresolvedExamples:examplesFor(specializedStackingIds),
    reviewedFeatureProgressionClassCount:allReviewedFeatureProgressionSourceIds.length,
    reviewedFeatureProgressionSourceIds:allReviewedFeatureProgressionSourceIds,
    reviewedGenericCandidateClassCount:reviewedGenericCandidateSourceIds.length,
    reviewedGenericCandidateSourceIds,
    remainingGenericMetadataCandidateCount:remainingGenericMetadataIds.size,
    remainingGenericMetadataExamples:examplesFor(remainingGenericMetadataIds),
    remainingGenericMetadataClusters:filteredClusterRows(stackingClusters,remainingGenericMetadataIds),
    clusters:stackingRows
  },
  recommendedNext:unsupportedPrerequisiteIds.size>=stackingIds.size?'prerequisites':'feature-stacking'
};

process.stdout.write(JSON.stringify(report,null,2)+'\n');