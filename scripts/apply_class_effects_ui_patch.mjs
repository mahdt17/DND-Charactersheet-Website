#!/usr/bin/env node
import fs from 'node:fs/promises';

const file='src/ModernLedger.jsx';
let source=await fs.readFile(file,'utf8');
function replaceOnce(oldText,newText,label){
  const first=source.indexOf(oldText);
  if(first<0)throw new Error(`Missing class-effects UI patch anchor: ${label}`);
  if(source.indexOf(oldText,first+oldText.length)>=0)throw new Error(`Ambiguous class-effects UI patch anchor: ${label}`);
  source=source.slice(0,first)+newText+source.slice(first+oldText.length);
}
if(source.includes("import ClassEffects35 from './ClassEffects35';")){
  console.log('class effects UI integration already applied');
  process.exit(0);
}
replaceOnce(
  "import Companions35 from './Companions35';",
  "import Companions35 from './Companions35';\nimport ClassEffects35 from './ClassEffects35';",
  'ClassEffects35 import'
);
replaceOnce(
  "}</>}{char.classAutomation?.incompleteClassIds?.length>0&&",
  "}</>}<ClassEffects35 char={char}/>{char.classAutomation?.incompleteClassIds?.length>0&&",
  'Features tab effect panel'
);
await fs.writeFile(file,source);
console.log('applied structured class effects UI integration patch');
