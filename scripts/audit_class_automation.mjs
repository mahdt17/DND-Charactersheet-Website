import fs from 'node:fs/promises';
import classes2014 from '../src/data/classes.json' with {type:'json'};
import modern from '../src/data/srd2024.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {classAutomationReport,annotateClassGrantKinds} from '../src/lib/classIntegration.js';
import {progressionTables} from '../src/lib/advancement.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const [classes35,feats35]=await Promise.all([service.load('3.5/classes'),service.load('3.5/feats')]);
const classReferenceIndex=[...classes35,...feats35];
const integrated35=classes35.map(record=>annotateClassGrantKinds(record,classReferenceIndex));

const maximumLevel=record=>{
  const levels=[];
  for(const table of progressionTables(record)){
    const header=table[0]||[],index=header.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
    if(index<0)continue;
    for(const data of table.slice(1)){const level=parseInt(data[index]);if(Number.isFinite(level)&&level>=1&&level<=30)levels.push(level);}
  }
  if(!levels.length&&Array.isArray(record.advancement))for(const data of record.advancement){const key=Object.keys(data).find(k=>/^(?:class |racial )?level$/i.test(k));const level=parseInt(data[key]);if(Number.isFinite(level)&&level>=1&&level<=30)levels.push(level);}
  return levels.length?Math.max(...levels):1;
};
const row=(record,edition,level)=>({
  catalogId:record.catalogId||`${edition}:${record.index||record.id||record.name}`,
  name:record.name,edition,level,definition:{...record,edition}
});
const character=classRow=>({
  id:'audit',name:'Audit',ruleset:classRow.edition,mechanics:classRow.edition,level:classRow.level,
  className:classRow.name,classDefinition:classRow.definition,classLevels:[classRow],
  abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},hp:{current:100,max:100,temp:0},
  actions:[],feats:[],resources:[],spells:[],trainingGrants:[],featureChoices:{}
});

const candidates=[
  ...classes2014.map(record=>row(record,'2014',20)),
  ...(modern.classes||[]).map(record=>row(record,'2024',20)),
  ...integrated35.map(record=>row(record,'3.5',maximumLevel(record)))
];
const classes=candidates.map(classRow=>classAutomationReport(character(classRow)).classes[0]);
const gapKey=item=>item.gaps.length?item.gaps.map(gap=>{
  if(gap.startsWith('Choose the variant base class'))return 'variant-choice-required';
  if(gap.startsWith('No structured level progression'))return 'no-progression';
  if(gap.startsWith('Canonical source record'))return 'reference-only';
  if(gap.startsWith('Class feature rules'))return 'class-feature-rules-absent';
  if(/lack structured rule text/.test(gap))return 'missing-feature-rule-text';
  return gap;
}).sort().join('+'):'complete';
const rawText=record=>[record.description,record.sourceDescription,record.effect,...progressionTables(record).flat(3)].filter(Boolean).join(' ').toLowerCase();
const familyFor=record=>{
  const text=rawText(record),families=[];
  const checks=[
    ['spellcasting',/spells? per day|spells? known|caster level|spellcasting/],
    ['psionics',/power points|powers? known|manifester level|psionic/],
    ['maneuvers',/maneuvers? known|maneuvers? readied|stances? known|initiator level/],
    ['invocations',/invocations? known|eldritch blast/],
    ['incarnum',/soulmeld|essentia|chakra bind/],
    ['binding',/vestiges?|soul binding|binder level/],
    ['mysteries',/mysteries? known|paths? known|shadowcaster/],
    ['auras',/auras? known|minor aura|major aura/],
    ['companions',/animal companion|special mount|familiar/],
    ['bonus-feats',/bonus feat/]
  ];
  for(const [name,re] of checks)if(re.test(text))families.push(name);
  return families.length?families:['ordinary'];
};
const parserShape=record=>{
  const tables=progressionTables(record);
  if(!tables.length)return 'no-tables';
  for(const table of tables){
    for(const row of table.slice(0,5)){
      const level=row?.some?.(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      const feature=row?.some?.(value=>/^(?:special|features?|class features?|abilities?)$/i.test(String(value).trim()));
      if(level&&feature)return 'level+feature-table';
    }
  }
  return 'table-without-feature-column';
};
const records35=new Map(integrated35.map(record=>[record.catalogId,record]));
const incomplete35=classes.filter(item=>item.edition==='3.5'&&!item.complete);
const gapCombinations=Object.entries(incomplete35.reduce((acc,item)=>(acc[gapKey(item)]=(acc[gapKey(item)]||0)+1,acc),{})).sort((a,b)=>b[1]-a[1]);
const parserShapes=Object.entries(incomplete35.reduce((acc,item)=>{const key=parserShape(records35.get(item.classId)||{});acc[key]=(acc[key]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]);
const mechanicFamilies=Object.entries(incomplete35.reduce((acc,item)=>{for(const family of familyFor(records35.get(item.classId)||{}))acc[family]=(acc[family]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]);
const group=edition=>{
  const list=classes.filter(item=>item.edition===edition);
  return {total:list.length,complete:list.filter(item=>item.complete).length,incomplete:list.filter(item=>!item.complete).length};
};
const report={
  generatedAt:new Date().toISOString(),
  total:classes.length,
  complete:classes.filter(item=>item.complete).length,
  incomplete:classes.filter(item=>!item.complete).length,
  byEdition:{'2014':group('2014'),'2024':group('2024'),'3.5':group('3.5')},
  mechanics:{
    features:classes.reduce((n,item)=>n+item.featureCount,0),
    actions:classes.reduce((n,item)=>n+item.actionCount,0),
    feats:classes.reduce((n,item)=>n+item.featCount,0),
    resources:classes.reduce((n,item)=>n+item.resourceCount,0),
    tracks:classes.reduce((n,item)=>n+(item.trackCount||0),0),
    choices:classes.reduce((n,item)=>n+item.choiceCount,0)
  },
  progressionCoverage:{
    total:classes.filter(item=>item.edition==='3.5').length,
    complete:classes.filter(item=>item.edition==='3.5'&&item.progressionComplete).length,
    conditional:integrated35.filter(record=>record.inheritanceRequired&&record.inheritanceOptions?.length>1).length,
    automatable:integrated35.filter(record=>{
      if(progressionTables(record).length)return true;
      if(!record.inheritanceRequired||!record.inheritanceOptions?.length)return false;
      return record.inheritanceOptions.every(option=>progressionTables(annotateClassGrantKinds({...record,inheritanceChoice:option.name||option},classReferenceIndex)).length>0);
    }).length,
    inherited:integrated35.filter(record=>record.inheritedFromClassId).length,
    descriptionsComplete:classes.filter(item=>item.edition==='3.5'&&item.descriptionComplete).length
  },
  representative:Object.fromEntries(['Fighter','Wizard','Sorcerer','Rogue','Archivist','Psion','Loremaster','Abjurant Champion'].map(name=>[name,classes.find(item=>item.name===name)||null])),
  gapCombinations:Object.fromEntries(gapCombinations),
  parserShapes:Object.fromEntries(parserShapes),
  mechanicFamilies:Object.fromEntries(mechanicFamilies),
  incompleteClasses:classes.filter(item=>!item.complete).map(item=>({classId:item.classId,name:item.name,edition:item.edition,level:item.level,prestige:item.prestige,gaps:item.gaps,
    parserShape:item.edition==='3.5'?parserShape(records35.get(item.classId)||{}):undefined,
    mechanicFamilies:item.edition==='3.5'?familyFor(records35.get(item.classId)||{}):undefined}))
};
await fs.mkdir('test-results',{recursive:true});
await fs.writeFile('test-results/class-automation-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(`CLASS AUTOMATION AUDIT: ${report.complete}/${report.total} classes have sufficient structured data for the current generic reconciler; ${report.incomplete} report explicit source-data gaps.`);
for(const [edition,counts] of Object.entries(report.byEdition))console.log(`${edition}: ${counts.complete}/${counts.total} complete`);
console.log(`3.5 PROGRESSION COVERAGE: ${report.progressionCoverage.complete}/${report.progressionCoverage.total} immediate + ${report.progressionCoverage.conditional} required parent choice; automatable ${report.progressionCoverage.automatable}/${report.progressionCoverage.total}; inherited progressions resolved: ${report.progressionCoverage.inherited}; local descriptions complete: ${report.progressionCoverage.descriptionsComplete}/${report.progressionCoverage.total}`);
console.log('3.5 GAP COMBINATIONS');
for(const [key,count] of gapCombinations.slice(0,15))console.log(`${count}\t${key}`);
console.log('3.5 PARSER SHAPES');
for(const [key,count] of parserShapes)console.log(`${count}\t${key}`);
console.log('3.5 MECHANIC FAMILIES');
for(const [key,count] of mechanicFamilies)console.log(`${count}\t${key}`);
