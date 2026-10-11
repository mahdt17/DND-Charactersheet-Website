import reviewedProgressions35 from '../data/class-feature-progression-35.json' with {type:'json'};
import {classFeatureInventory35,featureIdentity35} from './classFeaturePrerequisites35.js';

const normalizeId=value=>String(value||'').replace(/^dndtools:/,'');
const normalizeName=value=>String(value||'').trim().replace(/[’]/g,"'").toLowerCase().replace(/\s+/g,' ');
const positiveInteger=value=>Number.isInteger(value)&&value>0;
const canonical=value=>featureIdentity35(value)||null;
const reviewedEntries=reviewedProgressions35.entries||{};

function classRows(character){
  if(Array.isArray(character?.classLevels)&&character.classLevels.length)return character.classLevels;
  const definition=character?.classDefinition;
  if(!definition)return [];
  return [{
    catalogId:definition.catalogId||definition.id||definition.sourceId,
    name:character.className||definition.name,
    edition:definition.edition||character.ruleset,
    level:Math.max(1,Math.floor(Number(character.level)||1)),
    definition
  }];
}

function rowId(row){
  return row?.catalogId||row?.definition?.catalogId||row?.definition?.id||row?.definition?.sourceId||null;
}

function rowSourceId(row){
  const candidates=[row?.definition?.sourceId,row?.catalogId,row?.definition?.catalogId,row?.definition?.id,row?.definition?.index];
  return candidates.map(normalizeId).find(value=>value.startsWith('classes/'))||null;
}

function attainedFeature(row,feature){
  const level=Math.max(0,Math.floor(Number(row?.level)||0));
  if(!row?.definition||level<1)return false;
  const inventory=classFeatureInventory35({classLevels:[{...row,level}]});
  return inventory.features.has(feature);
}

function reviewedDeclarations(row){
  const sourceId=rowSourceId(row),reviewed=sourceId?reviewedEntries[sourceId]:null;
  if(!reviewed?.verified||!Array.isArray(reviewed.advancements))return [];
  const level=Math.max(0,Math.floor(Number(row?.level)||0));
  return reviewed.advancements
    .filter(entry=>entry&&typeof entry==='object'&&positiveInteger(entry.sourceLevel??1)&&level>=(entry.sourceLevel??1))
    .map(entry=>({...entry,reviewed:true,reviewedSourceId:sourceId,reviewedSourceUrl:entry.sourceUrl||reviewed.sourceUrl||null}));
}

function rowDeclarations(row){
  const inline=Array.isArray(row?.definition?.featureProgressionAdvancement)
    ?row.definition.featureProgressionAdvancement.filter(entry=>entry&&typeof entry==='object'):[];
  return [...inline,...reviewedDeclarations(row)];
}

function normalizedDeclarations(row,feature){
  return rowDeclarations(row).filter(entry=>canonical(entry.feature)===feature);
}

function declaredFeatures(character){
  const features=new Set();
  for(const row of classRows(character)){
    for(const entry of rowDeclarations(row)){
      const feature=canonical(entry?.feature);
      if(feature)features.add(feature);
    }
  }
  return [...features].sort();
}

function levelCount(row,entry){
  const attained=Math.max(0,Math.floor(Number(row?.level)||0));
  if(attained<1)return 0;
  if(entry.levels==='all'||entry.levels==null)return attained;
  if(!Array.isArray(entry.levels)||entry.levels.some(level=>!positiveInteger(level)))return null;
  const unique=[...new Set(entry.levels)];
  return unique.filter(level=>level<=attained).length;
}

function declarationAmount(row,entry){
  const count=levelCount(row,entry);
  if(count==null)return null;
  const per=entry.amountPerLevel==null?1:Number(entry.amountPerLevel);
  const bonus=entry.bonus==null?0:Number(entry.bonus);
  if(!Number.isFinite(per)||per<=0||!Number.isFinite(bonus)||bonus<0)return null;
  const amount=count*per+bonus;
  return Number.isFinite(amount)&&amount>=0?amount:null;
}

function virtualTarget(feature,declarations,{targetClassId=null,targetClassName=null}={}){
  if(!declarations.length||!declarations.every(({entry})=>entry.standaloneWhenMissing===true))return null;
  return {row:null,feature,targetClassId,targetClassName,standalone:true};
}

function resolveTarget(rows,feature,declarations){
  const explicitIds=[...new Set(declarations.map(({entry})=>entry.targetClassId).filter(Boolean).map(normalizeId))];
  const explicitNames=[...new Set(declarations.map(({entry})=>entry.targetClassName).filter(Boolean).map(normalizeName))];
  if(explicitIds.length>1||explicitNames.length>1)return null;

  if(explicitIds.length===1){
    const target=rows.filter(row=>normalizeId(rowId(row))===explicitIds[0]);
    if(target.length===1&&attainedFeature(target[0],feature)){
      if(explicitNames.length&&normalizeName(target[0].name||target[0].definition?.name)!==explicitNames[0])return null;
      return {row:target[0],feature,targetClassId:rowId(target[0]),targetClassName:target[0].name||target[0].definition?.name||null,standalone:false};
    }
    if(target.length)return null;
    return virtualTarget(feature,declarations,{targetClassId:explicitIds[0],targetClassName:explicitNames[0]||null});
  }

  if(explicitNames.length===1){
    const target=rows.filter(row=>normalizeName(row.name||row.definition?.name)===explicitNames[0]&&attainedFeature(row,feature));
    if(target.length===1)return {row:target[0],feature,targetClassId:rowId(target[0]),targetClassName:target[0].name||target[0].definition?.name||null,standalone:false};
    if(target.length>1)return null;
    return virtualTarget(feature,declarations,{targetClassName:explicitNames[0]});
  }

  const native=rows.filter(row=>attainedFeature(row,feature));
  return native.length===1
    ?{row:native[0],feature,targetClassId:rowId(native[0]),targetClassName:native[0].name||native[0].definition?.name||null,standalone:false}
    :null;
}

function declarationTargetsResolution(entry,resolution){
  if(entry.targetClassId&&normalizeId(entry.targetClassId)!==normalizeId(resolution.targetClassId))return false;
  if(entry.targetClassName&&normalizeName(entry.targetClassName)!==normalizeName(resolution.targetClassName))return false;
  return true;
}

function ledger(character,featureName){
  const feature=canonical(featureName);
  if(!feature)return null;
  const rows=classRows(character);
  if(!rows.length)return null;
  const declarations=[];
  for(const row of rows){
    for(const entry of normalizedDeclarations(row,feature))declarations.push({row,entry});
  }
  if(!declarations.length)return null;
  const resolution=resolveTarget(rows,feature,declarations);
  if(!resolution)return null;

  const contributions=[];
  if(resolution.row){
    const baseAmount=Math.max(0,Math.floor(Number(resolution.row.level)||0));
    if(baseAmount<1)return null;
    contributions.push({
      feature,
      kind:'base',
      sourceClassId:rowId(resolution.row),
      targetClassId:rowId(resolution.row),
      targetClassName:resolution.targetClassName,
      amount:baseAmount
    });
  }

  for(const {row,entry} of declarations){
    if(!declarationTargetsResolution(entry,resolution))continue;
    const amount=declarationAmount(row,entry);
    if(amount==null)return null;
    if(amount===0)continue;
    contributions.push({
      feature,
      kind:'advancement',
      sourceClassId:rowId(row),
      targetClassId:resolution.targetClassId||null,
      targetClassName:resolution.targetClassName||null,
      amount,
      levels:entry.levels??'all',
      amountPerLevel:entry.amountPerLevel??1,
      bonus:entry.bonus??0,
      standaloneWhenMissing:entry.standaloneWhenMissing===true,
      reviewed:entry.reviewed===true,
      reviewedSourceId:entry.reviewedSourceId||null,
      reviewedSourceUrl:entry.reviewedSourceUrl||null,
      sourceFeature:entry.sourceFeature||null
    });
  }
  return contributions.length?contributions:null;
}

export function featureProgressionContributions35(character,featureName){
  return ledger(character,featureName)||[];
}

export function effectiveFeatureLevel35(character,featureName){
  const contributions=ledger(character,featureName);
  if(!contributions)return null;
  return contributions.reduce((total,item)=>total+item.amount,0);
}

export function reconcileFeatureProgressions35(character){
  const featureProgressions35=declaredFeatures(character).map(feature=>{
    const contributions=ledger(character,feature);
    return contributions
      ?{feature,effectiveLevel:contributions.reduce((total,item)=>total+item.amount,0),resolved:true,contributions}
      :{feature,effectiveLevel:null,resolved:false,contributions:[]};
  });
  return {...character,featureProgressions35};
}
