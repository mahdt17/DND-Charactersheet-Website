import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {annotateClassGrantKinds,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {progressionTables} from '../src/lib/advancement.js';
const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes,feats]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const reference=[...classes,...feats],failures=[];let cases=0;
for(const original of classes){
 const resolved=annotateClassGrantKinds(original,reference);
 const variants=resolved.inheritanceRequired?resolved.inheritanceOptions.map(option=>annotateClassGrantKinds({...original,inheritanceChoice:option.name},reference)):[resolved];
 for(const definition of variants){
  const levels=[...new Set(progressionTables(definition).flatMap(table=>{const i=table[0]?.findIndex(x=>/^(?:class |racial )?level$/i.test(x));return i>=0?table.slice(1).map(row=>/^\d+(?:st|nd|rd|th)?$/i.test(row[i])?parseInt(row[i]):0).filter(n=>n>0&&n<=30):[];}))];
  for(const level of [...new Set([1,Math.max(1,...levels)])]){
   cases++;
   const row={catalogId:definition.catalogId,name:definition.name,level,edition:'3.5',definition};
   const character={classLevels:[row],className:row.name,classDefinition:definition,level,ruleset:'3.5',abilities:{str:16,dex:16,con:16,int:18,wis:18,cha:18},actions:[{id:'manual',name:'Personal action'}],feats:[],resources:[],spells:[],trainingGrants:[]};
   try{
    const once=reconcileClassGrants(character),twice=reconcileClassGrants(once);
    assert(JSON.stringify(once)===JSON.stringify(twice),'reopening changes derived character state');
    assert(once.actions.some(a=>a.id==='manual'),'manual action lost');
    for(const key of ['grantedFeatures','actions','feats','resources','classSpellSlots','classProgressionTracks'])assert.equal(new Set((once[key]||[]).map(x=>x.id)).size,(once[key]||[]).length,`${key} duplicate grants`);
    const backup={catalogId:'test:surviving-class',name:'Surviving class',edition:'3.5',level:1,definition:{name:'Surviving class',edition:'3.5'}};
    const removed=removeClassProgression({...once,classLevels:[row,backup],spells:[{id:'legacy-spell',name:'Original class spell'},{id:'racial',name:'Racial spell',auto:true}],spellAccessGrants:[{classId:row.catalogId,spellId:'test',source:'Feature'}]},row.catalogId);
    assert(!removed.spells.some(s=>s.id==='legacy-spell'),'unattributed primary spell moved to surviving class');
    assert(removed.spells.some(s=>s.id==='racial'),'independent racial spell lost');
    assert.equal(removed.spellAccessGrants.length,0,'removed class retained spell grants');
    assert(!(removed.grantedFeatures||[]).some(f=>f.sourceClassId===row.catalogId),'removed class retained features');
   }catch(error){failures.push({classId:row.catalogId,name:row.name,level,message:error.message});}
  }
 }
}
await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/class-lifecycle-audit.json',JSON.stringify({scope:'Lifecycle invariants, not verification of every source mechanic',classes:classes.length,cases,failures},null,2));
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,20)));
console.log(`PASS all ${classes.length} catalog classes: ${cases} starting/final-level cases, variants, idempotence, unique grants, manual preservation, class removal and spell ownership.`);
