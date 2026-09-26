import fs from 'node:fs/promises';
import classes2014 from '../src/data/classes.json' with {type:'json'};
import modern from '../src/data/srd2024.json' with {type:'json'};
import {createCatalogService} from '../src/lib/catalog.js';
import {classAutomationReport} from '../src/lib/classIntegration.js';
import {progressionTables} from '../src/lib/advancement.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes35=await service.load('3.5/classes');

const maximumLevel=record=>{
  const numbers=progressionTables(record).flatMap(table=>table.slice(1).flatMap(row=>row.map(value=>/\d/.test(String(value))?parseInt(value):NaN))).filter(Number.isFinite);
  const plausible=numbers.filter(n=>n>=1&&n<=30);
  return plausible.length?Math.max(...plausible):1;
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
  ...classes35.map(record=>row(record,'3.5',maximumLevel(record)))
];
const classes=candidates.map(classRow=>classAutomationReport(character(classRow)).classes[0]);
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
    choices:classes.reduce((n,item)=>n+item.choiceCount,0)
  },
  representative:Object.fromEntries(['Fighter','Wizard','Sorcerer','Rogue','Archivist','Psion','Loremaster','Abjurant Champion'].map(name=>[name,classes.find(item=>item.name===name)||null])),
  incompleteClasses:classes.filter(item=>!item.complete).map(item=>({classId:item.classId,name:item.name,edition:item.edition,level:item.level,prestige:item.prestige,gaps:item.gaps}))
};
await fs.mkdir('test-results',{recursive:true});
await fs.writeFile('test-results/class-automation-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(`CLASS AUTOMATION AUDIT: ${report.complete}/${report.total} classes have sufficient structured data for the current generic reconciler; ${report.incomplete} report explicit source-data gaps.`);
for(const [edition,counts] of Object.entries(report.byEdition))console.log(`${edition}: ${counts.complete}/${counts.total} complete`);
