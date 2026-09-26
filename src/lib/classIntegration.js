import levels2014 from '../data/levels.json' with {type:'json'};
import features2014 from '../data/features.json' with {type:'json'};
import modern from '../data/srd2024.json' with {type:'json'};
import proficiencySupplements35 from '../data/class-proficiencies35.json' with {type:'json'};
import {characterClasses,contentKey,progressionTables} from './advancement.js';
import {normalizeEdition} from './content.js';

export const CLASS_INTEGRATION_VERSION=1;
const proficiencySupplements=proficiencySupplements35.entries||{};
function withProficiencySupplement(record){
  if(!record||normalizeEdition(record.edition)!=='3.5'||Array.isArray(record.proficiencies)&&record.proficiencies.length)return record;
  const sourceId=record.sourceId||String(record.catalogId||'').replace(/^dndtools:/,'')||record.index||record.id;
  const supplement=proficiencySupplements[sourceId];
  if(!supplement||supplement.name!==record.name||!supplement.verified)return record;
  return {...record,proficiencies:supplement.proficiencies,proficiencyText:supplement.proficiencyText,proficiencyParseIncomplete:false,proficiencySupplementVerified:true,proficiencySourceUrl:supplement.sourceUrl};
}
const norm=value=>String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const slug=value=>norm(value).replace(/\s+/g,'-')||'grant';
const title=value=>String(value||'').replace(/\b\w/g,c=>c.toUpperCase());
const words={once:1,one:1,twice:2,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};

function sourceInfo(row,level,featureId){
  const record=row.definition||{};
  return {
    sourceType:'class',
    sourceId:featureId||record.id||record.catalogId||contentKey(record),
    sourceClassId:row.catalogId||contentKey(record),
    sourceClassLevel:level,
    sourceFeatureId:featureId||null,
    edition:normalizeEdition(row.edition||record.edition),
    automatic:true,
    sourceClassName:row.name,
    source:row.name,
    sourceUrl:record.sourceUrl||record.url||null
  };
}

function featureLevel(feature){
  const raw=feature?.level?.name?.match?.(/\d+$/)?.[0]??feature?.level;
  return Math.max(0,Number(raw)||0);
}
function textDescription(feature){
  if(!feature)return '';
  if(typeof feature.description==='string')return feature.description;
  if(Array.isArray(feature.desc))return feature.desc.join('\n\n');
  if(typeof feature.desc==='string')return feature.desc;
  return '';
}
function sourceFeatureDescription(record,name){
  const source=String(record?.sourceDescription||record?.description||record?.effect||'');
  if(!source||!name)return '';
  const candidates=[name,String(name).replace(/\s*\([^)]*\)\s*$/,'')].filter(Boolean);
  for(const candidate of [...new Set(candidates)]){
    const escaped=candidate.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const heading=new RegExp('(?:^|\\n)\\s*(?:\\*\\*)?'+escaped+'(?:\\s*\\([^\\n)]*\\))?(?:\\*\\*)?\\s*:\\s*','i');
    const match=heading.exec(source);
    if(match){
      const rest=source.slice(match.index+match[0].length);
      const next=rest.search(/\n\s*(?:\*\*)?[A-Z][A-Za-z0-9 ’'()\/+-]{1,80}(?:\*\*)?\s*:/);
      const value=(next>=0?rest.slice(0,next):rest).trim();
      if(value)return value;
    }
    const paragraph=source.split(/\n\s*\n/).find(p=>norm(p).includes(norm(candidate)));
    if(paragraph&&paragraph.length<=5000)return paragraph.replace(/^\s*(?:\*\*)?[^:]{1,100}(?:\*\*)?\s*:\s*/,'').trim();
  }
  return '';
}

function tableFeatureCells(record,maximum){
  const grants=[];
  for(const table of progressionTables(record)){
    if(!Array.isArray(table)||!table.length)continue;
    let headerIndex=-1,levelIndex=-1,featureIndexes=[];
    for(let i=0;i<Math.min(5,table.length);i++){
      const row=table[i]||[];
      const candidate=row.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      if(candidate<0)continue;
      const indexes=row.map((value,index)=>/^(?:specials?|features?|class features?|abilities?)$/i.test(String(value).trim())?index:-1).filter(index=>index>=0);
      if(indexes.length){headerIndex=i;levelIndex=candidate;featureIndexes=indexes;break;}
    }
    if(headerIndex<0)continue;
    for(const data of table.slice(headerIndex+1)){
      const level=parseInt(data?.[levelIndex]);
      if(!Number.isFinite(level)||level<1||level>maximum)continue;
      for(const index of featureIndexes){
        for(const raw of splitFeatureCell(data?.[index],record.featureNames||[])){
          grants.push({level,name:raw.name,progressionText:raw.text,sourceFeatureId:raw.id||null});
        }
      }
    }
  }
  if(!grants.length&&Array.isArray(record?.advancement)){
    for(const data of record.advancement){
      const levelKey=Object.keys(data).find(k=>/^(?:class |racial )?level$/i.test(k));
      const level=parseInt(data[levelKey]);
      if(!Number.isFinite(level)||level<1||level>maximum)continue;
      for(const [key,value] of Object.entries(data)){
        if(!/^(?:specials?|features?|class features?|abilities?)$/i.test(key))continue;
        for(const raw of splitFeatureCell(value,record.featureNames||[]))grants.push({level,name:raw.name,progressionText:raw.text,sourceFeatureId:raw.id||null});
      }
    }
  }
  return grants;
}

function spellSlotProgression(record,maximum){
  const spellLevel=value=>{
    const text=String(value||'').trim().toLowerCase();
    if(text==='0'||text==='0th')return 0;
    const match=text.match(/^([1-9])(?:st|nd|rd|th)$/);
    return match?Number(match[1]):null;
  };
  let best=null;
  for(const table of progressionTables(record)){
    if(!Array.isArray(table)||!table.length)continue;
    let headerIndex=-1,levelIndex=-1,header=[];
    for(let i=0;i<Math.min(5,table.length);i++){
      const row=table[i]||[];
      const candidate=row.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      if(candidate>=0){headerIndex=i;levelIndex=candidate;header=row;break;}
    }
    if(headerIndex<0)continue;
    let mappings=header.map((value,index)=>({spellLevel:spellLevel(value),index})).filter(item=>item.spellLevel!=null);
    let dataStart=headerIndex+1;
    if(mappings.length<2){
      const umbrella=header.findIndex(value=>/spellcasting|spells? per day/i.test(String(value)));
      for(let i=headerIndex+1;umbrella>=0&&i<Math.min(headerIndex+4,table.length);i++){
        const sub=(table[i]||[]).map(spellLevel);
        const levels=sub.map((level,index)=>({spellLevel:level,index:umbrella+index})).filter(item=>item.spellLevel!=null);
        if(levels.length>=2){mappings=levels;dataStart=i+1;break;}
      }
    }
    if(mappings.length<2)continue;
    const history=[];
    for(const row of table.slice(dataStart)){
      const level=parseInt(row?.[levelIndex]);
      if(!Number.isFinite(level)||level<1||level>maximum)continue;
      const slots=Array(10).fill(0);
      for(const {spellLevel:levelNumber,index} of mappings){
        const raw=String(row?.[index]??'').trim();
        const count=/^\d+$/.test(raw)?Number(raw):0;
        slots[levelNumber]=Math.max(0,Math.min(30,count));
      }
      history.push({level,slots});
    }
    if(!history.length)continue;
    const latest=history.at(-1),candidate={level:latest.level,slots:latest.slots,history,spellLevels:mappings.map(item=>item.spellLevel)};
    if(!best||candidate.spellLevels.length>best.spellLevels.length)best=candidate;
  }
  return best;
}

function castingAdvancementGrants(record,classLevel){
  const grants=[];
  for(const table of progressionTables(record)){
    if(!Array.isArray(table)||!table.length)continue;
    let headerIndex=-1,levelIndex=-1,header=[];
    for(let i=0;i<Math.min(5,table.length);i++){
      const row=table[i]||[];
      const candidate=row.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      if(candidate>=0){headerIndex=i;levelIndex=candidate;header=row;break;}
    }
    if(headerIndex<0)continue;
    const indexes=header.map((value,index)=>/spellcasting|spells? per day|spells? known|manifesting|powers? known/i.test(String(value))?index:-1).filter(index=>index>=0);
    const row=table.slice(headerIndex+1).find(data=>parseInt(data?.[levelIndex])===classLevel);
    if(!row)continue;
    for(const index of indexes){
      const value=String(row[index]??'').trim();
      if(!/\+\s*1\s+level/i.test(value))continue;
      const lower=value.toLowerCase(),kinds=[];
      if(/arcane/.test(lower))kinds.push('arcane');
      if(/divine/.test(lower))kinds.push('divine');
      if(/manifest|power/.test(lower))kinds.push('psionic');
      if(!kinds.length)kinds.push('spellcasting');
      for(const kind of [...new Set(kinds)])grants.push({id:slug(String(header[index])+'-'+index+'-'+kind),kind,label:value,sourceColumn:String(header[index]),value});
    }
  }
  return grants;
}

function supportsPsionicAdvancement(row){
  return progressionTracks(row.definition||{},Math.max(30,row.level||1)).some(track=>/power points|powers? known|powers? discovered|maximum power level/i.test(track.name));
}
function supportsSpellcastingAdvancement(row){
  return Boolean(spellSlotProgression(row.definition||{},Math.max(30,row.level||1)));
}

export function castingAdvancementPlan(character,record,nextClassLevel){
  if(!record)return {groups:[],valid:true};
  const sourceId=contentKey(record),rows=characterClasses(character).filter(row=>row.catalogId!==sourceId);
  const groups=castingAdvancementGrants(record,nextClassLevel).map((grant,index)=>{
    const candidates=rows.filter(row=>grant.kind==='psionic'?supportsPsionicAdvancement(row):supportsSpellcastingAdvancement(row)).map(row=>({classId:row.catalogId,name:row.name,edition:row.edition}));
    return {...grant,id:'casting-advance-'+index+'-'+grant.id,candidates};
  });
  return {sourceClassId:sourceId,sourceClassLevel:nextClassLevel,groups,valid:groups.every(group=>group.candidates.length>0)};
}

export function castingAdvancementSelectionsValid(plan,picks={}){
  if(!plan?.groups?.length)return true;
  const selected=[];
  for(const group of plan.groups){
    const value=picks[group.id];
    if(!group.candidates.some(candidate=>candidate.classId===value))return false;
    selected.push(value);
  }
  return new Set(selected).size===selected.length;
}

export function applyCastingAdvancementSelections(character,plan,picks={}){
  if(!plan?.groups?.length)return character;
  if(!castingAdvancementSelectionsValid(plan,picks))throw new Error('Choose a valid existing class for each spellcasting or manifesting advancement.');
  const existing=new Map((character.castingAdvancements||[]).map(entry=>[entry.id,entry]));
  for(const group of plan.groups){
    const target=group.candidates.find(candidate=>candidate.classId===picks[group.id]);
    const id='class-advance:'+plan.sourceClassId+':'+plan.sourceClassLevel+':'+group.id;
    existing.set(id,{id,sourceClassId:plan.sourceClassId,sourceClassLevel:plan.sourceClassLevel,targetClassId:target.classId,targetClassName:target.name,kind:group.kind,amount:1,label:group.label,automatic:true,sourceType:'class'});
  }
  return {...character,castingAdvancements:[...existing.values()]};
}

function progressionTracks(record,maximum){
  const tracks=new Map();
  const trackHeader=/^(?:power points(?: per day)?|pp|powers? known|powers? discovered|maximum power level known|maneuvers? known|maneuvers? readied|stances? known|invocations? known|soulmelds?|essentia|chakra binds?|vestiges? bound|spells? per day(?:\/spells? known|\/powers? known)?|spells? known|manifesting)$/i;
  for(const table of progressionTables(record)){
    if(!Array.isArray(table)||!table.length)continue;
    let headerIndex=-1,levelIndex=-1,header=[];
    for(let i=0;i<Math.min(5,table.length);i++){
      const row=table[i]||[];
      const candidate=row.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      if(candidate>=0){headerIndex=i;levelIndex=candidate;header=row;break;}
    }
    if(headerIndex<0)continue;
    const data=table.slice(headerIndex+1);
    // Merged multi-column headers (for example Archivist spell slots) are not
    // one-to-one tracks; do not pretend the umbrella heading is a scalar value.
    const aligned=data.filter(row=>Array.isArray(row)&&row.length===header.length);
    if(!aligned.length)continue;
    const indexes=header.map((value,index)=>trackHeader.test(String(value).trim())?index:-1).filter(index=>index>=0);
    for(const row of aligned){
      const level=parseInt(row[levelIndex]);
      if(!Number.isFinite(level)||level<1||level>maximum)continue;
      for(const index of indexes){
        const value=String(row[index]??'').trim();
        if(!value||/^(?:—|-|none)$/i.test(value))continue;
        const name=String(header[index]).trim(),key=norm(name);
        if(!tracks.has(key))tracks.set(key,{name,history:[]});
        tracks.get(key).history.push({level,value});
      }
    }
  }
  return [...tracks.values()].map(track=>{
    const history=track.history.sort((a,b)=>a.level-b.level),latest=history.at(-1);
    return {...track,level:latest.level,value:latest.value};
  });
}

function inheritedParentNames(record,entries=[]){
  if(record?.inheritanceChoice)return [record.inheritanceChoice];
  if(Array.isArray(record?.inheritsFromOptions)&&record.inheritsFromOptions.length)return record.inheritsFromOptions;
  if(record?.inheritsFrom){
    const exact=(entries||[]).some(entry=>
      normalizeEdition(entry?.edition)==='3.5' &&
      (entry?.contentType==='class'||entry?.category==='class') &&
      norm(entry.name)===norm(record.inheritsFrom)
    );
    if(exact)return [record.inheritsFrom];
  }
  const variant=String(record?.name||'').match(/^(.+?)\s+Variant$/i);
  if(variant&&variant[1].includes('/'))return variant[1].split('/').map(name=>name.trim()).filter(Boolean);
  return [];
}

function resolveInheritedClass(record,entries=[],seen=new Set()){
  record=withProficiencySupplement(record);
  if(!record||progressionTables(record).length)return record;
  const identity=record.catalogId||record.id||record.name;
  if(seen.has(identity))return record;
  const nextSeen=new Set(seen);nextSeen.add(identity);
  const names=inheritedParentNames(record,entries);
  const parents=names.map(name=>(entries||[]).find(entry=>
    normalizeEdition(entry?.edition)==='3.5' &&
    (entry?.contentType==='class'||entry?.category==='class') &&
    norm(entry.name)===norm(name) &&
    (entry.catalogId||entry.id)!==identity
  )).filter(Boolean);
  if(!parents.length)return record;
  if(parents.length>1&&!record.inheritanceChoice){
    return {
      ...record,
      inheritanceRequired:true,
      inheritanceOptions:parents.map(parent=>({name:parent.name,classId:parent.catalogId||parent.id}))
    };
  }
  const parent=parents.find(item=>norm(item.name)===norm(record.inheritanceChoice))||parents[0];
  const resolved=resolveInheritedClass(parent,entries,nextSeen),filled={...record};
  for(const key of ['progression','advancement','featureNames','hit_die','skillPoints','classSkills','classSkillRule','proficiencies','proficiencyText','proficiencyParseIncomplete']){
    if(filled[key]==null||filled[key]===''||(Array.isArray(filled[key])&&!filled[key].length))filled[key]=resolved[key];
  }
  filled.mechanicsPresence={
    ...(resolved.mechanicsPresence||{}),
    ...(record.mechanicsPresence||{}),
    classFeatures:Boolean(record.mechanicsPresence?.classFeatures||resolved.mechanicsPresence?.classFeatures),
    ruleProse:Boolean(record.mechanicsPresence?.ruleProse||resolved.mechanicsPresence?.ruleProse)
  };
  filled.inheritanceRequired=false;
  filled.inheritanceChoice=parent.name;
  filled.inheritanceOptions=(record.inheritsFromOptions||names).map(name=>({name,classId:(entries||[]).find(entry=>norm(entry.name)===norm(name))?.catalogId||null}));
  filled.inheritedFromClassId=resolved.catalogId||resolved.id||null;
  return filled;
}

function splitFeatureCell(value,known=[]){
  const text=String(value||'').trim();
  if(!text||/^(?:—|-|none)$/i.test(text))return [];
  const chunks=text.split(/\s*;\s*|\s*,\s*(?![^()]*\))/).map(x=>x.trim()).filter(Boolean);
  const result=[];
  for(const chunk of chunks){
    const matches=known.filter(name=>norm(chunk).includes(norm(name)));
    if(matches.length){
      for(const name of matches)result.push({name,text:chunk,id:slug(name)});
      continue;
    }
    let name=chunk
      .replace(/\s+\d+\s*\/\s*(?:day|rest)\b.*$/i,'')
      .replace(/\s+\d+\s+times?\s+per\s+(?:day|rest)\b.*$/i,'')
      .replace(/\s+\+?\d+(?:d\d+)?(?:\s*\/\s*[^,;]+)?$/i,'')
      .replace(/\s+\d+\/—$/i,'')
      .trim();
    if(/\([^)]*\)/.test(name)&&/^dark knowledge\b/i.test(name))name=name.replace(/\s*\([^)]*\)\s*$/,'');
    result.push({name:title(name||chunk),text:chunk,id:slug(name||chunk)});
  }
  return result;
}

export function annotateClassGrantKinds(record,entries=[]){
  if(!record||normalizeEdition(record.edition)!=='3.5')return record;
  const resolved=resolveInheritedClass(record,entries);
  if(resolved.levelGrants||resolved.grants)return resolved;
  const feats=entries.filter(entry=>entry?.contentType==='feat'||entry?.category==='feat');
  const byName=new Map(feats.map(feat=>[norm(feat.name),feat]));
  const parsed=tableFeatureCells(resolved,30);
  if(!parsed.length)return resolved;
  const levelGrants=parsed.map(grant=>{
    const exact=byName.get(norm(grant.name))||byName.get(norm(grant.name.replace(/\s*\([^)]*\)\s*$/,'')));
    if(!exact)return {...grant,kind:'feature',description:sourceFeatureDescription(resolved,grant.name)};
    return {...grant,kind:'feat',featId:exact.catalogId||exact.id,description:exact.description||exact.effectSummary||exact.effect||sourceFeatureDescription(resolved,grant.name),sourceUrl:exact.sourceUrl||resolved.sourceUrl};
  });
  return {...resolved,levelGrants};
}

function explicitLevelGrants(record,maximum){
  const result=[];
  const add=(grant,level)=>{
    const n=Math.max(1,Number(level??grant?.level)||1);
    if(n>maximum||!grant)return;
    const name=grant.name||grant.label||grant.feature||grant.id;
    if(!name)return;
    result.push({...grant,level:n,name:String(name),progressionText:grant.progressionText||grant.text||''});
  };
  if(Array.isArray(record?.grants))for(const grant of record.grants)add(grant,grant.level);
  if(Array.isArray(record?.levelGrants))for(const grant of record.levelGrants)add(grant,grant.level);
  if(record?.levelGrants&&!Array.isArray(record.levelGrants)&&typeof record.levelGrants==='object'){
    for(const [level,grants] of Object.entries(record.levelGrants))for(const grant of Array.isArray(grants)?grants:[grants])add(grant,level);
  }
  return result;
}

function rawClassFeatures(row){
  const record=row.definition||{},edition=normalizeEdition(row.edition||record.edition),maximum=row.level;
  const explicit=explicitLevelGrants(record,maximum);
  if(explicit.length)return explicit.map(grant=>({...grant,description:grant.description||grant.effect||''}));
  if(edition==='2014'){
    return levels2014
      .filter(level=>level.class?.name===row.name&&!level.subclass&&level.level<=maximum)
      .flatMap(level=>(level.features||[]).map(ref=>{
        const feature=features2014.find(item=>item.index===ref.index)||ref;
        return {level:level.level,name:feature.name||ref.name,description:textDescription(feature),sourceFeatureId:feature.index||ref.index,kind:feature.kind};
      }));
  }
  if(edition==='2024'){
    return (modern.features||[])
      .filter(feature=>feature.class?.name===row.name&&featureLevel(feature)<=maximum&&(!feature.subclass||feature.subclass.name===row.subclass))
      .map(feature=>({level:featureLevel(feature),name:feature.name,description:textDescription(feature),sourceFeatureId:feature.index||feature.id,kind:feature.kind}));
  }
  return tableFeatureCells(record,maximum).map(grant=>({...grant,description:sourceFeatureDescription(record,grant.name)}));
}

function coalesceFeatures(row){
  const map=new Map();
  for(const feature of rawClassFeatures(row)){
    const name=String(feature.name||'').trim();
    if(!name)continue;
    const key=norm(name.replace(/\s*\([^)]*\)\s*$/,''));
    const current=map.get(key);
    const description=feature.description||sourceFeatureDescription(row.definition||{},name);
    const history={level:feature.level,text:feature.progressionText||name};
    if(!current){
      map.set(key,{...feature,name:name.replace(/\s*\([^)]*\)\s*$/,''),level:feature.level,description,history:[history]});
    }else{
      current.level=Math.min(current.level,feature.level);
      current.latestLevel=Math.max(current.latestLevel||current.level,feature.level);
      current.history.push(history);
      if(description&&description.length>(current.description||'').length)current.description=description;
      if(feature.progressionText)current.progressionText=feature.progressionText;
    }
  }
  return [...map.values()].sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
}

function featureRuleText(feature){
  return [feature.description,...(feature.history||[]).map(item=>item.text)].filter(Boolean).join(' ');
}
function actionType(feature,edition){
  const text=featureRuleText(feature);
  if(/bonus action/i.test(text))return 'Bonus action';
  if(/\breaction\b|immediate action/i.test(text))return edition==='3.5'?'Immediate action':'Reaction';
  if(/swift action/i.test(text))return 'Swift action';
  if(/full[- ]round action/i.test(text))return 'Full-round action';
  if(/standard action/i.test(text))return 'Standard action';
  if(/as an action|use your action|take an action/i.test(text))return 'Action';
  return '';
}
function usageFromText(text){
  const value=String(text||'');
  const numeric=[...value.matchAll(/\b(\d+)\s*\/\s*(day|rest)\b/gi)].map(match=>({max:Number(match[1]),period:match[2].toLowerCase()}));
  if(numeric.length)return numeric.at(-1);
  const spelled=value.match(/\b(once|one|twice|two|three|four|five|six|seven|eight|nine|ten)(?:\s+times?)?\s+per\s+(day|short rest|long rest|rest)\b/i);
  if(spelled)return {max:words[spelled[1].toLowerCase()],period:spelled[2].toLowerCase()};
  return null;
}
function latestUsage(feature){
  for(const item of [...(feature.history||[])].sort((a,b)=>b.level-a.level)){
    const usage=usageFromText(item.text);
    if(usage)return usage;
  }
  return usageFromText(feature.description);
}
function isConcreteFeat(feature){
  if(feature.kind==='feat')return true;
  if(/^bonus feat$|^fighter feat$|^wild feat$/i.test(feature.name))return false;
  const description=featureRuleText(feature);
  const escaped=feature.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return /\b(?:gain|gains|gained|receive|receives)\b[^.]{0,160}\bas (?:a )?bonus feat\b/i.test(description)
    ||new RegExp('\\b'+escaped+'\\b[^.]{0,120}\\bbonus feat\\b','i').test(description);
}
function needsChoice(feature){
  if(feature.kind==='choice')return true;
  if(/^bonus feat$|^fighter feat$|^wild feat$/i.test(feature.name))return true;
  return /\bchoose\b|\bselect\b|\bchoice\b/i.test(featureRuleText(feature));
}

function derivedForRow(row){
  const edition=normalizeEdition(row.edition||row.definition?.edition),features=coalesceFeatures(row);
  const derivedFeatures=[],actions=[],feats=[],resources=[],tracks=[],spellSlots=[];
  for(const feature of features){
    const featureId=feature.sourceFeatureId||slug(feature.name),meta=sourceInfo(row,feature.level,featureId);
    const id='class-grant:'+meta.sourceClassId+':feature:'+slug(feature.name);
    const history=(feature.history||[]).sort((a,b)=>a.level-b.level);
    const localRuleText=String(feature.description||'').trim();
    const progressionSummary=String(history.at(-1)?.text||feature.progressionText||feature.name).trim();
    const description=localRuleText||row.name+' progression: '+progressionSummary+'.';
    const descriptionSource=localRuleText?'rule-text':'progression';
    const choice=needsChoice(feature);
    const base={id,index:id,name:feature.name,level:feature.level,latestLevel:feature.latestLevel||feature.level,kind:choice?'choice':'feature',description,descriptionSource,desc:[description],progressionHistory:history,...meta};
    derivedFeatures.push(base);
    const concreteFeat=isConcreteFeat(feature);
    if(concreteFeat){
      feats.push({id:'class-grant:'+meta.sourceClassId+':feat:'+slug(feature.name),name:feature.name,level:feature.level,description,catalogId:feature.featId||undefined,...meta});
    }
    const usage=latestUsage(feature);
    const type=actionType(feature,edition);
    if(!concreteFeat&&(type||usage)){
      actions.push({id:'class-grant:'+meta.sourceClassId+':action:'+slug(feature.name),name:feature.name,type:type||'Special action',description,notes:history.at(-1)?.text||'',...meta});
    }
    if(edition==='3.5'&&usage&&usage.max>0){
      const reset=usage.period==='short rest'?'short':usage.period==='rest'?'long':usage.period==='day'||usage.period==='long rest'?'long':'none';
      resources.push({id:'class-grant:'+meta.sourceClassId+':resource:'+slug(feature.name),classResourceKey:'class-grant:'+meta.sourceClassId+':resource:'+slug(feature.name),name:feature.name,max:usage.max,used:0,reset,shortRecovery:reset==='short'?'all':0,...meta});
    }
  }
  const record=withProficiencySupplement(row.definition||{});
  for(const track of progressionTracks(record,row.level)){
    const meta=sourceInfo(row,track.level,'track:'+slug(track.name));
    tracks.push({id:'class-grant:'+meta.sourceClassId+':track:'+slug(track.name),name:track.name,value:track.value,level:track.level,history:track.history,...meta});
  }
  const slotProfile=spellSlotProgression(record,row.level);
  if(slotProfile){
    const meta=sourceInfo(row,slotProfile.level,'spell-slots');
    spellSlots.push({id:'class-grant:'+meta.sourceClassId+':spell-slots',slots:slotProfile.slots,history:slotProfile.history,spellLevels:slotProfile.spellLevels,level:slotProfile.level,...meta});
  }
  const hasProgression=progressionTables(record).length>0||rawClassFeatures(row).length>0;
  const gaps=[],warnings=[];
  if(record.inheritanceRequired)gaps.push('Choose the variant base class before applying progression.');
  else if(!hasProgression)gaps.push('No structured level progression is available.');
  if(record.referenceOnly)gaps.push('Canonical source record is still marked reference-only.');
  if(record.mechanicsPresence?.classFeatures===false)gaps.push('Class feature rules are not present in structured source data.');
  const descriptive=derivedFeatures.filter(feature=>feature.descriptionSource==='progression').length;
  if(descriptive)warnings.push(`${descriptive} granted feature${descriptive===1?'':'s'} use concise progression-table summaries because full local rule text is unavailable; source links remain authoritative.`);
  const unresolvedChoices=derivedFeatures.filter(feature=>feature.kind==='choice').length;
  return {
    row,features:derivedFeatures,actions,feats,resources,tracks,spellSlots,training:edition==='3.5'&&Array.isArray(record.proficiencies)&&record.proficiencies.length?[{id:'class-grant:'+row.catalogId+':training',classId:row.catalogId,sourceClassId:row.catalogId,className:row.name,sourceClassName:row.name,edition:'3.5',sourceType:'class',automatic:true,sourceUrl:record.sourceUrl||null,proficiencies:record.proficiencies.map(item=>({...item,sourceClassId:row.catalogId,sourceClassName:row.name,automatic:true}))}]:[],
    classSkills:edition==='3.5'&&Array.isArray(record.classSkills)?record.classSkills.map(name=>({id:'class-grant:'+row.catalogId+':class-skill:'+slug(name),name,sourceType:'class',automatic:true,sourceClassId:row.catalogId,sourceClassName:row.name,sourceUrl:record.sourceUrl||null,edition:'3.5'})):[],
    classSkillRules:edition==='3.5'&&record.classSkillRule?[{id:'class-grant:'+row.catalogId+':class-skill-rule',rule:record.classSkillRule,sourceType:'class',automatic:true,sourceClassId:row.catalogId,sourceClassName:row.name,sourceUrl:record.sourceUrl||null,edition:'3.5'}]:[],
    report:{classId:row.catalogId,name:row.name,edition,level:row.level,prestige:Boolean(record.prestige||record.stats?.prestige),hasProgression,inheritanceRequired:Boolean(record.inheritanceRequired),inheritanceOptions:record.inheritanceOptions||[],progressionComplete:hasProgression,featureCount:derivedFeatures.length,actionCount:actions.length,featCount:feats.length,resourceCount:resources.length,trainingGrantCount:edition==='3.5'&&Array.isArray(record.proficiencies)&&record.proficiencies.length?1:0,classSkillCount:edition==='3.5'&&Array.isArray(record.classSkills)?record.classSkills.length:0,classSkillRule:Boolean(edition==='3.5'&&record.classSkillRule),trackCount:tracks.length,spellSlotProfile:Boolean(slotProfile),choiceCount:unresolvedChoices,gaps,warnings,descriptionComplete:descriptive===0,descriptionReady:derivedFeatures.every(feature=>Boolean(feature.description)),progressionSummaryCount:descriptive,integrationComplete:gaps.length===0,complete:gaps.length===0}
  };
}

function isOldClassFeature(entry){
  return Boolean(entry?.sourceType==='class'&&entry?.automatic)||String(entry?.id||'').startsWith('class:');
}
function mergeDerived(existing,derived,{resource=false}={}){
  const list=Array.isArray(existing)?existing:[];
  const manual=list.filter(entry=>!isOldClassFeature(entry));
  if(!resource)return [...manual,...derived];
  const old=new Map(list.filter(isOldClassFeature).map(entry=>[entry.id,entry]));
  return [...manual,...derived.map(entry=>({...entry,used:Math.max(0,Math.min(Number(entry.max)||0,Number(old.get(entry.id)?.used)||0))}))];
}

export function reconcileClassGrants(character){
  const rows=characterClasses(character),derived=rows.map(derivedForRow);
  const features=derived.flatMap(x=>x.features),actions=derived.flatMap(x=>x.actions),feats=derived.flatMap(x=>x.feats),resources=derived.flatMap(x=>x.resources),training=derived.flatMap(x=>x.training||[]),classSkills35=derived.flatMap(x=>x.classSkills||[]),classSkillRules35=derived.flatMap(x=>x.classSkillRules||[]);
  let tracks=derived.flatMap(x=>x.tracks),spellSlots=derived.flatMap(x=>x.spellSlots);
  const advancements=Array.isArray(character.castingAdvancements)?character.castingAdvancements:[];
  for(const row of rows){
    const applied=advancements.filter(entry=>entry.targetClassId===row.catalogId),extra=applied.reduce((sum,entry)=>sum+(Number(entry.amount)||0),0);
    if(!extra)continue;
    const effectiveLevel=row.level+extra,metaIds=applied.map(entry=>entry.id);
    tracks=tracks.filter(track=>track.sourceClassId!==row.catalogId);
    for(const track of progressionTracks(row.definition||{},effectiveLevel)){
      const meta=sourceInfo(row,track.level,'track:'+slug(track.name));
      tracks.push({id:'class-grant:'+meta.sourceClassId+':track:'+slug(track.name),name:track.name,value:track.value,level:track.level,history:track.history,effectiveClassLevel:effectiveLevel,advancedBy:metaIds,...meta});
    }
    spellSlots=spellSlots.filter(profile=>profile.sourceClassId!==row.catalogId);
    const profile=spellSlotProgression(row.definition||{},effectiveLevel);
    if(profile){
      const meta=sourceInfo(row,profile.level,'spell-slots');
      spellSlots.push({id:'class-grant:'+meta.sourceClassId+':spell-slots',slots:profile.slots,history:profile.history,spellLevels:profile.spellLevels,level:profile.level,effectiveClassLevel:effectiveLevel,advancedBy:metaIds,...meta});
    }
  }
  return {
    ...character,
    grantedFeatures:mergeDerived(character.grantedFeatures,features),
    actions:mergeDerived(character.actions,actions),
    feats:mergeDerived(character.feats,feats),
    resources:mergeDerived(character.resources,resources,{resource:true}),
    trainingGrants:mergeDerived(character.trainingGrants,training),
    classSkills35:mergeDerived(character.classSkills35,classSkills35),
    classSkillRules35:mergeDerived(character.classSkillRules35,classSkillRules35),
    classProgressionTracks:mergeDerived(character.classProgressionTracks,tracks),
    classSpellSlots:mergeDerived(character.classSpellSlots,spellSlots),
    classAutomation:{version:CLASS_INTEGRATION_VERSION,classes:derived.map(x=>x.report),incompleteClassIds:derived.filter(x=>!x.report.integrationComplete).map(x=>x.report.classId)}
  };
}

export function classAutomationReport(character){
  return reconcileClassGrants(character).classAutomation;
}

export function legacyClassSkillStatus(character,name){
  const key=norm(name);
  const fixed=(character.classSkills35||[]).some(entry=>norm(entry.name)===key);
  const manual=character.classSkillOverrides35?.[key]===true;
  const dynamic=(character.classSkillRules35||[]).length>0;
  const classSkill=fixed||manual;
  const maximum=(Number(character.level)||1)+3;
  return {classSkill,fixed,manual,dynamic,rankCap:classSkill?maximum:maximum/2};
}

export function removeClassProgression(character,classId){
  const removed=characterClasses(character).find(row=>row.catalogId===classId);
  const rows=characterClasses(character).filter(row=>row.catalogId!==classId);
  if(!rows.length)throw new Error('A character must retain at least one class.');
  const primary=rows[0],removedName=removed?.name;
  const trainingGrants=(character.trainingGrants||[]).filter(grant=>grant.classId!==classId&&grant.sourceClassId!==classId);
  const spells=(character.spells||[]).filter(spell=>spell.castingClassId!==classId);
  const featureChoices=Object.fromEntries(Object.entries(character.featureChoices||{}).filter(([key,value])=>value?.classId!==classId&&value?.sourceClassId!==classId&&value?.className!==removedName&&!key.includes(':'+removedName+':')));
  const castingAdvancements=(character.castingAdvancements||[]).filter(entry=>entry.sourceClassId!==classId&&entry.targetClassId!==classId);
  return reconcileClassGrants({
    ...character,
    classLevels:rows,
    level:rows.reduce((sum,row)=>sum+row.level,0),
    className:primary.name,
    classDefinition:primary.definition,
    subclass:primary.subclass||'',
    trainingGrants,
    spells,
    featureChoices,
    castingAdvancements
  });
}
