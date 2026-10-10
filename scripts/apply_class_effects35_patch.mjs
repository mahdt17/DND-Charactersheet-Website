#!/usr/bin/env node
import fs from 'node:fs/promises';

const file='src/lib/classIntegration.js';
let source=await fs.readFile(file,'utf8');

function replaceOnce(oldText,newText,label){
  const first=source.indexOf(oldText);
  if(first<0)throw new Error(`Missing class-effects patch anchor: ${label}`);
  if(source.indexOf(oldText,first+oldText.length)>=0)throw new Error(`Ambiguous class-effects patch anchor: ${label}`);
  source=source.slice(0,first)+newText+source.slice(first+oldText.length);
}

if(source.includes("from './classEffects35.js'")){
  console.log('class effects integration already applied');
  process.exit(0);
}

replaceOnce(
  "import {reconcileDomainGrants35} from './legacyCastingChoices.js';",
  "import {reconcileDomainGrants35} from './legacyCastingChoices.js';\nimport {reconcileClassEffects35,describeClassEffect35} from './classEffects35.js';\nexport {describeClassEffect35};",
  'class effects import'
);
replaceOnce(
  "'spellLists','spellSchools','actionType','actionTypeByLevel','resource'])",
  "'spellLists','spellSchools','actionType','actionTypeByLevel','resource','effects'])",
  'reviewed feature metadata fields'
);
replaceOnce(
  "'spellLists','spellSchools','actionType','actionTypeByLevel','resource','reviewedSourceUrl'])",
  "'spellLists','spellSchools','actionType','actionTypeByLevel','resource','effects','reviewedSourceUrl'])",
  'coalesced feature metadata fields'
);
replaceOnce(
  "spellLists:feature.spellLists||undefined,spellSchools:feature.spellSchools||undefined,description,descriptionSource,desc:[description],progressionHistory:history,...meta",
  "spellLists:feature.spellLists||undefined,spellSchools:feature.spellSchools||undefined,effects:Array.isArray(feature.effects)?feature.effects:undefined,description,descriptionSource,desc:[description],progressionHistory:history,...meta",
  'derived feature effects field'
);
replaceOnce(
  "return reconcileInvocationAcquisition35(reconcileDailySpellLike35(reconcileSpellAcquisition35(reconcileCompanions35(reconcileDomainGrants35(reconciled)))));",
  "return reconcileInvocationAcquisition35(reconcileDailySpellLike35(reconcileSpellAcquisition35(reconcileCompanions35(reconcileDomainGrants35(reconcileClassEffects35(reconciled))))));",
  'reconciliation chain'
);

await fs.writeFile(file,source);
console.log('applied structured class effects integration patch');
