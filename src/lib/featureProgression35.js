import {classFeatureInventory35,featureIdentity35} from './classFeaturePrerequisites35.js';

const normalizeId=value=>String(value||'').replace(/^dndtools:/,'');
const positiveInteger=value=>Number.isInteger(value)&&value>0;
const canonical=value=>featureIdentity35(value)||null;

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

function attainedFeature(row,feature){
  const level=Math.max(0,Math.floor(Number(row?.level)||0));
  if(!row?.definition||level<1)return false;
  const inventory=classFeatureInventory35({classLevels:[{...row,level}]});
  return inventory.features.has(feature);
}

function normalizedDeclarations(row,feature){
  const source=Array.isArray(row?.definition?.featureProgressionAdvancement)
    ?row.definition.featureProgressionAdvancement:[];
  return source.filter(entry=>entry&&typeof entry==='object'&&canonical(entry.feature)===feature);
}

function declaredFeatures(character){
  const features=new Set();
  for(const row of classRows(character)){
    for(const entry of row?.definition?.featureProgressionAdvancement||[]){
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

function resolveTarget(rows,feature,declarations){
  const explicit=[...new Set(declarations.map(({entry})=>entry.targetClassId).filter(Boolean).map(normalizeId))];
  if(explicit.length>1)return null;
  if(explicit.length===1){
    const target=rows.filter(row=>normalizeId(rowId(row))===explicit[0]);
    if(target.length!==1||!attainedFeature(target[0],feature))return null;
    return target[0];
  }
  const native=rows.filter(row=>attainedFeature(row,feature));
  return native.length===1?native[0]:null;
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
  const target=resolveTarget(rows,feature,declarations);
  if(!target)return null;
  const targetId=normalizeId(rowId(target));
  const baseAmount=Math.max(0,Math.floor(Number(target.level)||0));
  if(baseAmount<1)return null;
  const contributions=[{
    feature,
    kind:'base',
    sourceClassId:rowId(target),
    targetClassId:rowId(target),
    amount:baseAmount
  }];
  for(const {row,entry} of declarations){
    if(entry.targetClassId&&normalizeId(entry.targetClassId)!==targetId)continue;
    const amount=declarationAmount(row,entry);
    if(amount==null)return null;
    if(amount===0)continue;
    contributions.push({
      feature,
      kind:'advancement',
      sourceClassId:rowId(row),
      targetClassId:rowId(target),
      amount,
      levels:entry.levels??'all',
      amountPerLevel:entry.amountPerLevel??1,
      bonus:entry.bonus??0
    });
  }
  return contributions;
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
