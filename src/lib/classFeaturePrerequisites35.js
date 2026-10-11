// Shared closed 3.5 prerequisite identity support. This module is intentionally
// dependency-free so qualification and future feature-stacking code can share
// identities without creating advancement/integration import cycles.
const norm=value=>String(value||'').trim().replace(/[’]/g,"'").toLowerCase().replace(/[^a-z0-9+'/-]+/g,' ').trim();
const clean=value=>String(value||'').trim().replace(/[’]/g,"'").replace(/\s+/g,' ');
const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const quantity=value=>words[norm(value)]||Number(value);

const FEATURE_FAMILIES=[
  ['sneak attack',/^sneak attack\b/i],
  ['skirmish',/^skirmish\b/i],
  ['sudden strike',/^sudden strike\b/i],
  ['rage',/^(?:(?:greater|mighty|tireless) )?rage\b/i],
  ['frenzy',/^(?:(?:greater|deathless) )?frenzy\b/i],
  ['wild shape',/^wild shape\b/i],
  ['evasion',/^(?:improved )?evasion\b/i],
  ['uncanny dodge',/^(?:improved )?uncanny dodge\b/i],
  ['turn undead',/^(?:turn undead|turn or rebuke undead)\b/i],
  ['rebuke undead',/^(?:rebuke undead|turn or rebuke undead)\b/i],
  ['bardic music',/^bardic music\b/i],
  ['bardic knowledge',/^bardic knowledge\b/i],
  ['favored enemy',/^favou?red enemy\b/i],
  ['wild empathy',/^wild empathy\b/i],
  ['flurry of blows',/^flurry of blows\b/i],
  ['smite',/^smite(?: evil| good)?\b/i],
  ['lay on hands',/^lay on hands\b/i],
  ['animal companion',/^animal companion\b/i],
  ['familiar',/^(?:summon )?familiar\b/i],
  ['special mount',/^special mount\b/i]
];

const ALIGNMENTS=new Set([
  'lawful good','neutral good','chaotic good',
  'lawful neutral','true neutral','chaotic neutral',
  'lawful evil','neutral evil','chaotic evil'
]);

function closedAlternativeNames(value,{race=false}={}){
  const text=clean(value).replace(/^must be\s+/i,'').replace(/\.$/,'').trim();
  if(!/\bor\b/i.test(text))return null;
  const names=text.split(/\s*,\s*or\s+|\s+or\s+|\s*,\s*/i).map(clean).filter(Boolean);
  if(names.length<2)return null;
  if(race){
    const valid=name=>/^[A-Za-z][A-Za-z'’ -]{0,40}$/.test(name)
      &&! /\b(?:any|but|other|except|must|character|creature|race|region|descen(?:t|ded|dant))\b/i.test(name);
    return names.every(valid)?names:null;
  }
  return names.every(name=>ALIGNMENTS.has(norm(name)))?names:null;
}

function closedWeaponTraining(value){
  const text=clean(value).replace(/\.$/,'');
  const amount='(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]\\d*)';
  const category='(martial|simple|exotic)';
  const prefix='(?:Must be proficient with|Proficiency with) at least ';
  const all=new RegExp('^'+prefix+amount+' '+category+' weapons? and '+amount+' '+category+' weapons?$','i').exec(text);
  if(all)return {kind:'weapon_training_all',requirements:[
    {kind:'weapon_training_count',minimum:quantity(all[1]),categories:[all[2].toLowerCase()]},
    {kind:'weapon_training_count',minimum:quantity(all[3]),categories:[all[4].toLowerCase()]}
  ]};
  const any=new RegExp('^'+prefix+amount+' '+category+'(?: or '+category+')? weapons?$','i').exec(text);
  if(any)return {kind:'weapon_training_count',minimum:quantity(any[1]),categories:[any[2],any[3]].filter(Boolean).map(value=>value.toLowerCase())};
  return null;
}

function closedMultiSave(kind,value){
  if(!/^(?:base_save_bonus|base_save_bonuses|saving_throws|base_saves?)$/i.test(kind))return null;
  const parts=clean(value).replace(/\.$/,'').split(/\s*[,;]\s*/).filter(Boolean);
  if(parts.length<2)return null;
  const map={fort:'fort',fortitude:'fort',ref:'ref',reflex:'ref',will:'will'},requirements=[];
  for(const part of parts){
    const match=part.match(/^(Fort(?:itude)?|Ref(?:lex)?|Will)(?: Save)?\s*\+(\d+)$/i);
    if(!match)return null;
    requirements.push({save:map[match[1].toLowerCase()],minimum:Number(match[2])});
  }
  return {kind:'save_all',requirements};
}

function trainingEntries(character){
  const grants=(character?.trainingGrants||[]).filter(grant=>!grant?.sourceOnly).flatMap(grant=>grant?.proficiencies||[]).filter(entry=>!entry?.sourceOnly);
  const definitions=[character?.classDefinition,...(character?.classLevels||[]).map(row=>row?.definition)].filter(Boolean);
  return [...grants,...definitions.flatMap(definition=>definition?.proficiencies||[])];
}

function hasBroadWeaponCategory(character,category){
  const patterns={
    martial:/^martial(?:-(?:melee|ranged))?-weapons?$/,
    simple:/^simple(?:-(?:melee|ranged))?-weapons?$/,
    exotic:/^exotic(?:-(?:melee|ranged))?-weapons?$/
  };
  const pattern=patterns[category];
  if(!pattern)return false;
  return trainingEntries(character).some(entry=>{
    const raw=typeof entry==='string'?entry:entry?.index||entry?.name||'';
    return pattern.test(norm(raw).replace(/\s+/g,'-'));
  });
}

function featureColumns(table){
  if(!Array.isArray(table)||!table.length)return null;
  for(let i=0;i<Math.min(5,table.length);i++){
    const header=table[i];
    if(!Array.isArray(header))continue;
    const levelIndex=header.findIndex(value=>/^(?:class |racial )?level$/i.test(clean(value)));
    if(levelIndex<0)continue;
    const columns=header.map((value,index)=>/^(?:specials?|features?|class features?|abilities?)$/i.test(clean(value))?index:-1).filter(index=>index>=0);
    if(columns.length)return {headerIndex:i,levelIndex,columns};
  }
  return null;
}

function tables(record){
  if(Array.isArray(record?.progression)&&record.progression.length&&Array.isArray(record.progression[0])&&!Array.isArray(record.progression[0][0]))return [record.progression];
  if(Array.isArray(record?.tables)&&record.tables.length)return record.tables.filter(Array.isArray);
  if(Array.isArray(record?.advancement)&&record.advancement.length){
    const keys=Object.keys(record.advancement[0]||{});
    return [[keys,...record.advancement.map(row=>keys.map(key=>row?.[key]??''))]];
  }
  return [];
}

function chunks(value){
  const text=clean(value);
  if(!text||/^(?:—|–|-|none)$/i.test(text))return [];
  return text.split(/\s*;\s*|\s*,\s*(?![^()]*\))/).map(clean).filter(Boolean);
}

function evidenceFromChunk(value){
  const text=clean(value),out=[];
  for(const [key,re] of FEATURE_FAMILIES){
    if(!re.test(text))continue;
    const dice=/\+(\d+)d6\b/i.exec(text);
    out.push({key,dice:dice?Number(dice[1]):null,text});
  }
  return out;
}

export function featureIdentity35(value){
  const text=clean(value);
  return FEATURE_FAMILIES.find(([,re])=>re.test(text))?.[0]||null;
}

export function classFeatureInventory35(character){
  const rows=Array.isArray(character?.classLevels)&&character.classLevels.length
    ?character.classLevels
    :character?.classDefinition?[{catalogId:character.classDefinition.catalogId||character.classDefinition.id,name:character.className||character.classDefinition.name,edition:character.classDefinition.edition||character.ruleset,level:Math.max(1,Number(character.level)||1),definition:character.classDefinition}]:[];
  const features=new Map();
  let complete=rows.length>0;
  for(const row of rows){
    const record=row?.definition;
    const maximum=Math.max(0,Math.floor(Number(row?.level)||0));
    let rowComplete=false;
    for(const table of tables(record)){
      const layout=featureColumns(table);
      if(!layout)continue;
      rowComplete=true;
      for(const data of table.slice(layout.headerIndex+1)){
        const level=parseInt(data?.[layout.levelIndex]);
        if(!Number.isFinite(level)||level<1||level>maximum)continue;
        for(const index of layout.columns){
          for(const chunk of chunks(data?.[index])){
            for(const item of evidenceFromChunk(chunk)){
              const previous=features.get(item.key);
              if(!previous||Number(item.dice||0)>Number(previous.dice||0))features.set(item.key,{...item,sourceClassId:row.catalogId||record?.catalogId||record?.sourceId||null,sourceClassLevel:level});
            }
          }
        }
      }
    }
    if(!rowComplete)complete=false;
  }
  return {features,complete};
}

export function lowerClassFeaturePrerequisite35(prerequisite){
  const kind=prerequisite?.kind||prerequisite?.type||'text';
  const raw=clean(prerequisite?.text||prerequisite?.description||prerequisite?.name);
  const saves=closedMultiSave(kind,raw);
  if(saves)return saves;
  const training=closedWeaponTraining(raw);
  if(training)return training;
  if(['race','races'].includes(kind)){
    const options=closedAlternativeNames(raw,{race:true});
    if(options)return {kind:'race_any',options};
  }
  if(kind==='alignment'){
    const options=closedAlternativeNames(raw);
    if(options)return {kind:'alignment_any',options};
  }
  if(!['special','class_feature','feature','features','text'].includes(kind))return null;
  const text=raw.replace(/\.$/,'');
  if(!text)return null;

  const quantified=text.match(/^(Sneak attack|Skirmish|Sudden strike)\s*\+(\d+)d6$/i);
  if(quantified)return {kind:'class_feature',feature:featureIdentity35(quantified[1]),minimumDice:Number(quantified[2])};

  const closed=[
    [/^(?:Ability to|Able to|Must be able to) rage$/i,'rage'],
    [/^Rage(?: class feature| ability)?$/i,'rage'],
    [/^(?:Ability to|Able to|Must be able to) frenzy$/i,'frenzy'],
    [/^Frenzy(?: class feature| ability)?$/i,'frenzy'],
    [/^Wild shape(?: class feature| ability)?$/i,'wild shape'],
    [/^(?:Improved )?Evasion(?: class feature| ability)?$/i,'evasion'],
    [/^(?:Improved )?Uncanny dodge(?: class feature| ability)?$/i,'uncanny dodge'],
    [/^(?:Ability to|Able to|Must be able to) turn undead$/i,'turn undead'],
    [/^(?:Ability to|Able to|Must be able to) rebuke undead$/i,'rebuke undead'],
    [/^(?:Ability to|Able to|Must be able to) turn or rebuke undead$/i,'turn undead'],
    [/^Bardic music(?: class feature| ability)?$/i,'bardic music'],
    [/^Bardic knowledge(?: class feature| ability)?$/i,'bardic knowledge'],
    [/^Favou?red enemy(?: class feature| ability)?$/i,'favored enemy'],
    [/^Wild empathy(?: class feature| ability)?$/i,'wild empathy'],
    [/^Flurry of blows(?: class feature| ability)?$/i,'flurry of blows'],
    [/^Lay on hands(?: class feature| ability)?$/i,'lay on hands'],
    [/^Animal companion(?: class feature| ability)?$/i,'animal companion'],
    [/^Familiar(?: class feature| ability)?$/i,'familiar'],
    [/^Special mount(?: class feature| ability)?$/i,'special mount']
  ];
  for(const [pattern,feature] of closed)if(pattern.test(text))return {kind:'class_feature',feature};
  return null;
}

export function evaluateClassFeaturePrerequisite35(prerequisite,character){
  const node=prerequisite?.kind==='class_feature'&&prerequisite.feature?prerequisite:lowerClassFeaturePrerequisite35(prerequisite);
  if(!node)return undefined;
  if(node.kind==='race_any'){
    if(!character?.race)return null;
    return node.options.some(value=>norm(value)===norm(character.race));
  }
  if(node.kind==='alignment_any'){
    if(!character?.alignment)return null;
    return node.options.some(value=>norm(value)===norm(character.alignment));
  }
  if(node.kind==='save_all'){
    if(!character?.save35||node.requirements.some(item=>!Number.isFinite(Number(character.save35?.[item.save]))))return null;
    return node.requirements.every(item=>Number(character.save35[item.save])>=item.minimum);
  }
  if(node.kind==='weapon_training_count'){
    if(!Number.isInteger(node.minimum)||node.minimum<1||!Array.isArray(node.categories)||!node.categories.length)return null;
    return node.categories.some(category=>hasBroadWeaponCategory(character,category))?true:null;
  }
  if(node.kind==='weapon_training_all'){
    const values=node.requirements.map(item=>evaluateClassFeaturePrerequisite35(item,character));
    return values.every(value=>value===true)?true:null;
  }
  if(!FEATURE_FAMILIES.some(([key])=>key===node.feature)||node.minimumDice!=null&&(!Number.isInteger(node.minimumDice)||node.minimumDice<1))return null;
  const inventory=classFeatureInventory35(character),evidence=inventory.features.get(node.feature);
  if(evidence&&node.minimumDice==null)return true;
  if(evidence&&Number(evidence.dice||0)>=Number(node.minimumDice||0))return true;
  return inventory.complete?false:null;
}
