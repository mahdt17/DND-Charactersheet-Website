#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const trackerPath=args.find(arg=>!arg.startsWith('--'))||'docs/class-completion-tracker.json';
const json=args.includes('--json');
const tracker=JSON.parse(fs.readFileSync(trackerPath,'utf8'));
const entries=tracker.entries||[];

const PERSISTENT='persistent feature choices';
const textFor=entry=>[
  entry.name,
  entry.sourceBook,
  entry.nextAction,
  ...(entry.gaps||[]),
  ...(entry.dependencies||[]),
].filter(Boolean).join(' ').toLowerCase();

const subtypeRules=[
  ['companion/mount/cohort selection',entry=>entry.implementationCohorts?.includes('companions/mounts/cohorts'),/animal companion|\bcompanion\b|\bfamiliar\b|special mount|\bmount\b|\bcohort\b|\bfollowers?\b|vermin servant|tether hound/],
  ['domain/deity/patron selection',entry=>entry.implementationCohorts?.includes('domains/deity progression'),/\bdomains?\b|patron deity|deity-specific|deity progression/],
  ['spell/power/invocation selection',entry=>entry.implementationCohorts?.includes('special spell acquisition/preparation')||entry.implementationCohorts?.includes('psionics/manifesting'),/spellbook|spells? known|spell acquisition|advanced learning|learn(?:s|ed|ing)? (?:an? )?spell|spell replacement|expanded spell list|\bpowers? known\b|\bmanifest(?:ing|er)?\b|\binvocations?\b|mysteries known|utterances?/],
  ['caster/progression selection',entry=>entry.implementationCohorts?.includes('ordinary prestige spellcasting/selected caster advancement'),/selected caster|choose.*(?:casting|caster)|advance.*(?:casting|caster)|existing (?:arcane |divine )?spellcasting|caster advancement/],
  ['form/transformation selection',entry=>entry.implementationCohorts?.includes('transformations/wild-shape'),/wild shape|alternate form|shapechange|\bforms?\b|transform(?:ation|ing)?/],
  ['favored-enemy/target selection',entry=>entry.implementationCohorts?.includes('Favored Enemy variants'),/favou?red enemy|enemy type|chosen enemy|designated target/],
  ['weapon/item selection',entry=>entry.implementationCohorts?.includes('temporary/permanent weapon or item state'),/chosen weapon|select(?:ed)? weapon|weapon choice|bonded weapon|signature weapon|legendary weapon|chosen item|item choice|armor choice|anoint|imbue/],
  ['feat selection',()=>false,/bonus feat|\bfeat choice\b|choose.*\bfeat\b|select.*\bfeat\b|\bfeats? from\b|\bfeat list\b/],
  ['skill/proficiency/language selection',()=>false,/class skill|skill choice|choose.*\bskill\b|select.*\bskill\b|proficienc|language choice|choose.*language|select.*language|weapon familiarity/],
  ['energy/damage/resistance selection',()=>false,/energy type|damage type|energy resistance|resistance type|immunity type|acid.*cold.*electric|acid.*fire|choose.*(?:acid|cold|electricity|fire|sonic)/],
  ['school/order/path/allegiance selection',()=>false,/school specialization|specialist school|forbidden school|\border\b|\bpath\b|allegiance|philosophy|discipline choice|choose.*discipline/],
  ['resource/action mode selection',entry=>entry.implementationCohorts?.includes('class actions/resources and feature reconciliation')||entry.implementationCohorts?.includes('bardic music/performance resources'),/stance choice|mode choice|choose.*(?:ability|effect|benefit)|select.*(?:ability|effect|benefit)|performance choice|song choice|resource choice/],
  ['source-defined feature option',()=>false,/\bchoice\b|\bchoose\b|\bselect(?:ed|ion)?\b/],
];

function subtypes(entry){
  const text=textFor(entry),matches=[];
  for(const [name,cohortPredicate,re] of subtypeRules){
    if(cohortPredicate(entry)||re.test(text))matches.push(name);
  }
  return [...new Set(matches.length?matches:['other persistent source choice'])];
}

function primarySubtype(types){
  const precedence=[
    'companion/mount/cohort selection',
    'domain/deity/patron selection',
    'spell/power/invocation selection',
    'caster/progression selection',
    'form/transformation selection',
    'favored-enemy/target selection',
    'weapon/item selection',
    'feat selection',
    'skill/proficiency/language selection',
    'energy/damage/resistance selection',
    'school/order/path/allegiance selection',
    'resource/action mode selection',
    'source-defined feature option',
    'other persistent source choice',
  ];
  return precedence.find(type=>types.includes(type))||types[0];
}

if(entries.length!==1054)throw new Error(`Expected 1054 tracker records; found ${entries.length}`);
const sourceIds=new Set();
for(const entry of entries){
  if(sourceIds.has(entry.sourceId))throw new Error(`Duplicate sourceId: ${entry.sourceId}`);
  sourceIds.add(entry.sourceId);
}

const records=entries
  .filter(entry=>entry.status==='needs-review'&&(entry.implementationCohorts||[]).includes(PERSISTENT))
  .map(entry=>{
    const choiceSubtypes=subtypes(entry);
    return {
      sourceId:entry.sourceId,
      name:entry.name,
      sourceBook:entry.sourceBook,
      sourcePage:entry.sourcePage,
      trackerStatus:entry.status,
      priority:entry.priority,
      implementationCohort:entry.implementationCohort,
      implementationCohorts:entry.implementationCohorts,
      choiceSubtypes,
      primaryChoiceSubtype:primarySubtype(choiceSubtypes),
      nextAction:entry.nextAction||null,
    };
  })
  .sort((a,b)=>String(a.sourceId).localeCompare(String(b.sourceId)));

const subtypeCounts={};
const primarySubtypeCounts={};
for(const row of records){
  for(const subtype of row.choiceSubtypes)subtypeCounts[subtype]=(subtypeCounts[subtype]||0)+1;
  primarySubtypeCounts[row.primaryChoiceSubtype]=(primarySubtypeCounts[row.primaryChoiceSubtype]||0)+1;
}
const sortCounts=counts=>Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));
const report={
  schemaVersion:1,
  semantics:{
    purpose:'Read-only decomposition of needs-review classes whose implementation cohorts include persistent feature choices. This report is planning evidence, not completion evidence.',
    primaryChoiceSubtype:'Deterministic batching label selected from conservative subtype precedence; a record may also have secondary subtypes.',
    sourceDefinedFallback:'Generic choose/select wording remains source-defined until exact-source review proves a narrower reusable mechanic.',
  },
  totalTrackerRecords:entries.length,
  persistentChoiceRecords:records.length,
  subtypeCounts:sortCounts(subtypeCounts),
  primarySubtypeCounts:sortCounts(primarySubtypeCounts),
  mutatesTracker:false,
  certifiesClasses:false,
  records,
};

if(json)process.stdout.write(JSON.stringify(report,null,2)+'\n');
else{
  console.log(`Persistent-choice records: ${report.persistentChoiceRecords}`);
  for(const [subtype,count] of Object.entries(report.primarySubtypeCounts))console.log(`${subtype}: ${count}`);
}
