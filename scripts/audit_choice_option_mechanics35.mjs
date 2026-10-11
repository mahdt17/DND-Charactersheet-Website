#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const json=args.includes('--json');
const sourcePath=args.find(arg=>!arg.startsWith('--'))||'src/data/class-feature-summaries-35.json';
const summaries=JSON.parse(fs.readFileSync(sourcePath,'utf8'));

const metadataKeys=['description','sourceUrl','name'];
const runtimeHandledKeys=['classSkills','actionType','resource','effects','acceptableAlignments'];
const consumerSpecificKeys=['minEffectiveLevel','levelAdjustment','spellElement','casterLevelBonus','saveBonus','saveBonusType'];
const dependentChoiceKeys=[...new Set(Object.values(summaries||{}).flatMap(features=>Array.isArray(features)?features:[])
  .map(feature=>String(feature?.choiceOptionsFromFeatureMechanic?.field||'').trim()).filter(Boolean))].sort();
const excluded=new Set([...metadataKeys,...runtimeHandledKeys,...consumerSpecificKeys,...dependentChoiceKeys]);
const keyCounts={},unhandledKeyCounts={},examples={};
let featuresWithChoiceOptionMechanics=0,choiceOptionsWithMechanics=0;

for(const [sourceId,features] of Object.entries(summaries||{})){
  if(!Array.isArray(features))continue;
  for(const feature of features){
    const mechanics=feature?.choiceOptionMechanics;
    if(!mechanics||typeof mechanics!=='object'||Array.isArray(mechanics))continue;
    featuresWithChoiceOptionMechanics++;
    for(const [optionName,raw] of Object.entries(mechanics)){
      if(!raw||typeof raw!=='object'||Array.isArray(raw))continue;
      choiceOptionsWithMechanics++;
      for(const key of Object.keys(raw)){
        keyCounts[key]=(keyCounts[key]||0)+1;
        if(excluded.has(key))continue;
        unhandledKeyCounts[key]=(unhandledKeyCounts[key]||0)+1;
        if(!examples[key])examples[key]={sourceId,feature:feature.name||null,option:optionName,value:raw[key]};
      }
    }
  }
}

const sortCounts=counts=>Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));
const report={
  schemaVersion:1,
  semantics:{
    purpose:'Read-only inventory of structured fields stored under reviewed 3.5 choiceOptionMechanics.',
    runtimeHandledKeys:'Fields directly materialized or enforced by the generic class integration/choice runtime for selected options.',
    consumerSpecificKeys:'Fields consumed by a specialized subsystem rather than the generic option materializer (for example companion level adjustment and Wu Jen spell modifiers).',
    dependentChoiceKeys:'Option-mechanic fields already consumed by a later choice through choiceOptionsFromFeatureMechanic.',
    unhandledKeyCounts:'Structured fields not directly materialized/enforced by the generic runtime, a named specialized consumer, or a dependent-choice consumer. These are candidates for reusable primitives, not proof that every occurrence needs automation.'
  },
  featuresWithChoiceOptionMechanics,
  choiceOptionsWithMechanics,
  keyCounts:sortCounts(keyCounts),
  metadataKeys,
  runtimeHandledKeys,
  consumerSpecificKeys,
  dependentChoiceKeys,
  unhandledKeyCounts:sortCounts(unhandledKeyCounts),
  examples,
  mutatesData:false,
  certifiesClasses:false
};

if(json)process.stdout.write(JSON.stringify(report,null,2)+'\n');
else{
  console.log(`Features with option mechanics: ${featuresWithChoiceOptionMechanics}`);
  console.log(`Choice options with mechanics: ${choiceOptionsWithMechanics}`);
  for(const [key,count] of Object.entries(report.unhandledKeyCounts))console.log(`${key}: ${count}`);
}
