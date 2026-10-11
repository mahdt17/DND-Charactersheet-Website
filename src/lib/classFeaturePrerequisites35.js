// Shared 3.5 class-feature identity and prerequisite support. This module is
// intentionally dependency-free so qualification and future feature-stacking
// code can share the same identities without creating advancement/integration
// import cycles.
const norm=value=>String(value||'').trim().replace(/[’]/g,"'").toLowerCase().replace(/[^a-z0-9+'/-]+/g,' ').trim();
const clean=value=>String(value||'').trim().replace(/[’]/g,"'").replace(/\s+/g,' ');

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
  if(!['special','class_feature','feature','features','text'].includes(kind))return null;
  const text=clean(prerequisite?.text||prerequisite?.description||prerequisite?.name).replace(/\.$/,'');
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
  if(!FEATURE_FAMILIES.some(([key])=>key===node.feature)||node.minimumDice!=null&&(!Number.isInteger(node.minimumDice)||node.minimumDice<1))return null;
  const inventory=classFeatureInventory35(character),evidence=inventory.features.get(node.feature);
  if(evidence&&node.minimumDice==null)return true;
  if(evidence&&Number(evidence.dice||0)>=Number(node.minimumDice||0))return true;
  return inventory.complete?false:null;
}
