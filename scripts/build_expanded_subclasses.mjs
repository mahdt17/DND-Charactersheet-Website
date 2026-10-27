// Rebuild from saved source snapshots: node scripts/build_expanded_subclasses.mjs
// --source-dir <folder containing inventory.json and sources/*.md>.
// Snapshots are collected from the source URLs listed in subclassManifest2014.json.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const target=new URL('../src/data/expandedSubclasses.json',import.meta.url);
const manifestPath=new URL('../src/data/subclassManifest2014.json',import.meta.url);
const spellCatalogPath=new URL('../src/data/subclassSpellCatalog.json',import.meta.url);
const coveragePath=new URL('../docs/subclass-coverage.md',import.meta.url);
const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const plain=s=>s.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\\([\[\]*_])/g,'$1').replace(/\*\*|__|(?<!\w)_(?=\w)|(?<=\w)_(?!\w)/g,'').replace(/<br\s*\/?>/g,'; ').trim();
const sourceLevel=(body,entry)=>{
 const m=body.slice(0,650).match(/(?:\b|_)(?:Level\s+(\d+)\+|(\d+)(?:st|nd|rd|th)[ -]level)/i);
 return m?Math.max(entry,Number(m[1]||m[2])):null;
};
const fixedLevels={
 'druid:wildlife-ua:Flames of Life':10,
 'druid:land:Circle Spells':3,
 'wizard:theurgy-ua:Channel Arcana: Divine Arcana':2,
};
function acquisitionFor(row){
 if(row.slug==='sorcerer:stone-sorcery-ua')return 'expanded';
 if(/mage-of-(?:lorehold|quandrix)/.test(row.slug)&&row.className==='Wizard')return 'spellbook';
 if(/mage-of-/.test(row.slug)&&['Bard','Warlock','Sorcerer'].includes(row.className))return 'known';
 if(row.className==='Warlock')return 'expanded';
 return ['Sorcerer','Bard','Ranger'].includes(row.className)?'known':'prepared';
}
const grantMode=acquisition=>({acquisition,alwaysPrepared:['prepared','known'].includes(acquisition)});
function fixedSpellGrants(row){
 const list=[];
 const add=(name,level=row.entryLevel,acquisition=acquisitionFor(row),extra={})=>list.push({name,spellSlug:slug(name),classLevel:level,...grantMode(acquisition),...extra});
 if(/mage-of-lorehold/.test(row.slug)){add('Sacred Flame',row.entryLevel,'known');add('Comprehend Languages');}
 if(/mage-of-quandrix/.test(row.slug)){add('Guidance',row.entryLevel,'known');add('Guiding Bolt');}
 if(/mage-of-witherbloom/.test(row.slug)){add('Spare the Dying',row.entryLevel,'known');add('Cure Wounds');add('Inflict Wounds');}
 if(row.slug==='druid:stars'){add('Guidance',2,'known',{condition:'holding-star-map'});add('Guiding Bolt',2,'prepared',{condition:'holding-star-map'});}
 const known={
  'bard:spirits':[['Guidance',3]],'bard:spirits-ua':[['Guidance',3]],
  'cleric:grave':[['Spare the Dying',1]],'cleric:light':[['Light',1]],'cleric:city-ua':[['On/Off',1]],
  'druid:spores':[['Chill Touch',2]],'druid:wildlife-ua':[['Fire Bolt',2]],
  'ranger:drakewarden':[['Thaumaturgy',3]],'ranger:drakewarden-ua':[['Thaumaturgy',3]],
  'rogue:arcane-trickster':[['Mage Hand',3]],'sorcerer:shadow-magic':[['Darkness',3]],'sorcerer:shadow-ua':[['Darkness',3]],
  'warlock:celestial':[['Light',1],['Sacred Flame',1]],'warlock:celestial-ua':[['Light',1],['Sacred Flame',1]],
  'warlock:undying':[['Spare the Dying',1]],'warlock:ghost-in-the-machine-ua':[['On/Off',1]],
  'warlock:undying-light-ua':[['Light',1],['Sacred Flame',1]],
  'wizard:illusion':[['Minor Illusion',2]],'fighter:psychic-warrior-ua':[['Mage Hand',3]],
 };
 for(const [name,level] of known[row.slug]||[])add(name,level,'known');
 if(row.slug==='wizard:necromancy')add('Animate Dead',6,'spellbook');
 if(row.slug==='wizard:runecrafter-ua')add('Comprehend Languages',2,'prepared',{freeCasting:'at-will'});
 return list;
}
function spellTables(text,row){
 if(row.className==='Druid'&&row.label==='Land')return []; // Existing land-choice adapter owns these tables.
 const grants=[];let inTable=false,spellTable=false,headers=[];
 for(const line of text.split('\n')){
  if(!line.startsWith('|')){inTable=false;spellTable=false;headers=[];continue;}
  const cells=line.split('|').slice(1,-1).map(s=>s.trim());
  if(!inTable){inTable=true;spellTable=/spell/i.test(cells.join(' '));}
  if(/spell/i.test(cells.join(' '))&&!cells.some(c=>/\]\([^)]*spell:/.test(c)))spellTable=true;
  if(!spellTable)continue;
  if(/(?:class|cleric|paladin|druid|artificer|ranger|sorcerer|warlock|spell) level/i.test(cells[0]||'')){headers=cells;continue;}
  // A die-result table is never a grant list. Require an actual level header.
  if(!headers.length)continue;
  const level=cells[0]?.match(/^(\d+)(?:st|nd|rd|th)?$/i);if(!level)continue;
  const spellLevel=/^spell level$/i.test(headers[0]||'');
  const classLevel=spellLevel?Math.max(row.entryLevel,Number(level[1])*2-1):Math.max(row.entryLevel,Number(level[1]));
  if(classLevel>20)throw Error(`Invalid spell grant in ${row.slug}`);
  for(let i=1;i<cells.length;i++)for(const m of cells[i].matchAll(/\[([^\]]+)\]\(https?:\/\/dnd5e\.wikidot\.com\/spell:([^)]+)\)/g)){
   const genie=/^warlock:(?:the-genie|genie-ua)$/.test(row.slug);
   const choice=genie&&i>1?headers[i].replace(/ Spells$/i,''):undefined;
   grants.push({name:m[1],spellSlug:m[2],classLevel,...grantMode(acquisitionFor(row)),...(choice?{choiceKey:'genie-kind',choice}:{})});
  }
 }
 return [...new Map(grants.map(g=>[JSON.stringify(g),g])).values()];
}
function buildRecord(row,raw){
 const text=raw.split('Click here to edit contents')[0].trim();
 const id=`2014:subclass:${row.className.toLowerCase()}:${row.slug.split(':').slice(1).join(':')}`;
 const matches=[...text.matchAll(/^### ([^\n]+)\n/gm)],features=[];
 const flexible=/Using This Subclass/.test(text);
 for(let i=0;i<matches.length;i++){
  const name=plain(matches[i][1]);if(name==='Using This Subclass')continue;
  const body=text.slice(matches[i].index+matches[i][0].length,matches[i+1]?.index??text.length).trim();
  let level=fixedLevels[`${row.slug}:${name}`]??sourceLevel(body,row.entryLevel);
  if(level===null&&/Spells|Spell List|Tenets/.test(name))level=row.entryLevel;
  if(level===null){
   const startsAtEntry=/Expanded Spell List|Clockwork Magic|Lunar Embodiment|Wind Speaker|Shadow Sorcerer Quirks|Psionic Origin|Feywild Gifts|Fey Wanderer Magic|Slayer.s Mysticism|Arcane Shots?|Restriction:/.test(name);
   if(!startsAtEntry)throw Error(`Review feature level: ${row.slug}: ${name}`);
   level=row.entryLevel;
  }
  const feature={id:`${id}:${slug(name)}`,index:`expanded:${row.slug}:${slug(name)}`,name,level,description:plain(body),sourceUrl:row.sourceUrl};
  if(flexible&&level>row.entryLevel)feature.optional=true;
  if(/Tenets|Quirks|Origin|Gifts|Restriction:/.test(name))feature.role='reference';
  features.push(feature);
 }
 const name=row.label.replace(/\s*\(UA\)/g,'')+(row.playtest?' (UA)':'');
 const record={id,index:`expanded-${row.className.toLowerCase()}-${row.slug.split(':').slice(1).join('-')}`,name,class:{name:row.className,index:row.className.toLowerCase()},edition:'2014',sourceBook:row.sourceBook,sourceUrl:row.sourceUrl,sourceHash:createHash('sha256').update(raw).digest('hex'),playtest:row.playtest,entryLevel:row.entryLevel,features,spellGrants:[...fixedSpellGrants(row),...spellTables(text,row)]};
 if(flexible)record.flexibleFeatureSelection=true;
 return record;
}
function validate(records,manifest){
 if(records.length!==manifest.length||records.length!==214)throw Error('Incomplete subclass inventory');
 if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Duplicate subclass identity');
 for(const r of records){
  const entry=manifest.find(m=>m.className===r.class.name&&m.sourceUrl===r.sourceUrl);
  if(!entry||entry.entryLevel!==r.entryLevel||entry.sourceBook!==r.sourceBook||entry.playtest!==r.playtest)throw Error(`Inventory mismatch: ${r.id}`);
  if(!r.features.length||!r.sourceBook||!r.sourceHash)throw Error(`Incomplete ${r.name}`);
  if(new Set(r.features.map(f=>f.id)).size!==r.features.length)throw Error(`Duplicate feature ${r.name}`);
  for(const f of r.features)if(!Number.isInteger(f.level)||f.level<r.entryLevel||f.level>20||!f.description)throw Error(`Invalid feature ${r.name}/${f.name}`);
 }
}
function buildSpellMetadata(records,folder){
 const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 const core=JSON.parse(readFileSync(new URL('../src/data/spells.json',import.meta.url),'utf8'));
 const reference=JSON.parse(readFileSync(new URL('../public/catalogs/wikidot5e/spells.json',import.meta.url),'utf8'));
 const names=new Map(records.flatMap(r=>r.spellGrants).map(g=>[normalize(g.name),g]));
 const coreNames=new Set(core.map(s=>normalize(s.name)));
 const result=[];
 for(const [name,g] of names){
  if(coreNames.has(name))continue;
  const found=reference.find(s=>normalize(s.name)===name);
  if(found){result.push({...found,catalogId:found.id,index:found.id,description:found.description||found.effectSummary||found.generatedDescription||'',referenceOnly:false});continue;}
  const path=resolve(folder,'sources',`spell--${g.spellSlug}.md`);
  const text=readFileSync(path,'utf8').split('Click here to edit contents')[0];
  const heading=text.match(/_(?:(\d+)(?:st|nd|rd|th)-level (\w+)|(\w+) cantrip)(?:[^\n]*)_/i);
  if(!heading)throw Error(`Missing spell level ${g.name}`);
  const field=key=>text.match(new RegExp(`\\*\\*${key}:\\*\\* ([^\\n]+)`,'i'))?.[1]?.trim();
  const lists=text.match(/\*\*_Spell Lists\._\*\*([^\n]+)/)?.[1]||'';
  const description=text.slice(text.indexOf(field('Duration'))+field('Duration').length).split('**_Spell Lists._**')[0].trim();
  const id=`wikidot5e:spell:${g.spellSlug}`;
  result.push({id,catalogId:id,index:id,name:g.name,category:'spell',edition:'2014',source:'D&D 5e Wikidot',sourceBook:'Unearthed Arcana 7 - Modern Magic',sourceUrl:`https://dnd5e.wikidot.com/spell:${g.spellSlug}`,playtest:true,referenceOnly:false,level:Number(heading[1]||0),school:heading[2]||heading[3],casting_time:field('Casting Time'),range:field('Range'),components:(field('Components')||'').match(/\b[VSM]\b/g)||[],material:field('Components')?.match(/M \(([^)]+)\)/)?.[1],duration:field('Duration'),concentration:/concentration/i.test(field('Duration')||''),ritual:/ritual/i.test(heading[0]),classes:[...lists.matchAll(/\[([^\]]+)\]/g)].map(m=>m[1]),description:plain(description),enrichment:{validated:true,partial:false,source:'Unearthed Arcana 7 - Modern Magic'}});
 }
 return result;
}
if(process.argv.includes('--check')){
 const records=JSON.parse(readFileSync(target,'utf8')),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 validate(records,manifest);console.log(`PASS ${records.length} subclass source records`);
}else{
 const at=process.argv.indexOf('--source-dir');if(at<0)throw Error('Provide --source-dir containing inventory.json and sources/ snapshots.');
 const folder=resolve(process.argv[at+1]);
 const manifest=JSON.parse(readFileSync(resolve(folder,'inventory.json'),'utf8'));
 const records=manifest.map(row=>buildRecord(row,readFileSync(resolve(folder,'sources',row.slug.replaceAll(':','--')+'.md'),'utf8')));
 const monk=records.find(r=>r.class.name==='Monk'&&r.name==='Four Elements');
 const disciplines=readFileSync(resolve(folder,'sources','monk--four-elements--disciplines.md'),'utf8').split('Click here to edit contents')[0];
 monk.disciplineOptions=[...disciplines.matchAll(/^### ([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(m=>({name:plain(m[1]),description:plain(m[2]),level:Number(m[2].match(/Prerequisite: (\d+)(?:st|nd|rd|th)/)?.[1]||3),kiCost:Number(m[2].match(/spend (\d+) ki points?/i)?.[1]||0),...(m[2].match(/to cast \[([^\]]+)\]/)?{spellName:m[2].match(/to cast \[([^\]]+)\]/)[1]}:{})}));
 validate(records,manifest);
 const metadata=buildSpellMetadata(records,folder);
 writeFileSync(target,JSON.stringify(records,null,2)+'\n');writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');writeFileSync(spellCatalogPath,JSON.stringify(metadata,null,2)+'\n');
 const intro=readFileSync(coveragePath,'utf8').split('| Class |')[0];
 const rows=records.map(r=>`| ${r.class.name} | ${r.name} | ${r.playtest?'UA playtest':/Plane Shift|Amonkhet/.test(r.sourceBook)?'Digital supplement':'Published'} | ${[...new Set(r.features.map(f=>f.level))].sort((a,b)=>a-b).join(', ')} | [${r.sourceBook}](${r.sourceUrl}) |`);
 writeFileSync(coveragePath,intro+'| Class | Subclass | Material | Feature levels | Source |\n| --- | --- | --- | --- | --- |\n'+rows.join('\n')+'\n');
 console.log(`Built ${records.length} subclasses, ${records.reduce((n,r)=>n+r.features.length,0)} features`);
}
