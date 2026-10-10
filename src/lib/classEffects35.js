import {characterClasses} from './advancement.js';

export const CLASS_EFFECTS35_VERSION=1;

const norm=value=>String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const slug=value=>norm(value).replace(/\s+/g,'-')||'effect';
const signed=value=>Number(value)>=0?`+${Number(value)}`:String(Number(value));
const title=value=>String(value||'').replace(/\b\w/g,character=>character.toUpperCase());

export function resolvedClassEffectValue35(effect,classLevel){
  if(!effect||typeof effect!=='object')return undefined;
  const values=effect.valueByLevel;
  if(values&&typeof values==='object'&&!Array.isArray(values)){
    const eligible=Object.entries(values)
      .map(([level,value])=>[Number(level),value])
      .filter(([level])=>Number.isFinite(level)&&level<=Math.max(0,Number(classLevel)||0))
      .sort((a,b)=>a[0]-b[0]);
    if(eligible.length)return eligible.at(-1)[1];
  }
  return effect.value;
}

export function describeClassEffect35(effect){
  if(!effect||typeof effect!=='object')return '';
  const type=String(effect.type||'').toLowerCase();
  const target=String(effect.target||'').trim();
  const subtype=String(effect.subtype||'').trim();
  const condition=String(effect.condition||'').trim();
  const unit=String(effect.unit||'').trim();
  const value=effect.value;
  if(type==='modifier'){
    const parts=[Number.isFinite(Number(value))?signed(value):String(value??'').trim(),target,subtype?`(${subtype})`:'',effect.bonusType?`${effect.bonusType} bonus`:'',condition].filter(Boolean);
    return parts.join(' ');
  }
  if(type==='resistance'){
    const damage=title(effect.damageType||subtype||target||'damage');
    return `${damage} resistance${value!=null&&value!==''?` ${value}`:''}${condition?` ${condition}`:''}`.trim();
  }
  if(type==='immunity'){
    const subject=condition||effect.damageType||subtype||target||effect.name||'specified effect';
    return `Immune to ${subject}`;
  }
  if(type==='movement'){
    const movement=title(effect.movement||target||'movement');
    const amount=value!=null&&value!==''?(effect.operation==='add'?signed(value):String(value)):'';
    return `${movement} movement${amount?` ${amount}`:''}${unit?` ${unit}`:''}${condition?` ${condition}`:''}`.trim();
  }
  const label=String(effect.name||effect.effectId||effect.id||type||'Class effect').trim();
  const detail=[value!=null&&value!==''?String(value):'',unit,condition].filter(Boolean).join(' ');
  return detail?`${label}: ${detail}`:label;
}

function effectClassLevel(character,sourceClassId,fallback=0){
  const row=characterClasses(character).find(item=>item.catalogId===sourceClassId);
  return Math.max(0,Number(row?.level)||Number(fallback)||0);
}

function materializeFeatureEffect35(character,feature,effect,index){
  if(!effect||typeof effect!=='object')return null;
  const sourceClassId=feature.sourceClassId;
  if(!sourceClassId)return null;
  const classLevel=effectClassLevel(character,sourceClassId,feature.sourceClassLevel);
  const minimumLevel=Math.max(1,Number(effect.level)||Number(feature.level)||Number(feature.sourceClassLevel)||1);
  if(minimumLevel>classLevel)return null;
  const effectId=String(effect.id||effect.name||effect.type||`effect-${index+1}`).trim()||`effect-${index+1}`;
  const value=resolvedClassEffectValue35(effect,classLevel);
  const featureKey=feature.sourceFeatureId||feature.name||'feature';
  const id=`class-grant:${sourceClassId}:effect:${slug(featureKey)}:${slug(effectId)}`;
  return {
    ...effect,
    ...(value===undefined?{}:{value}),
    id,
    effectId,
    name:String(effect.name||feature.name||effectId),
    sourceType:'class',
    automatic:true,
    sourceClassId,
    sourceClassName:feature.sourceClassName||feature.source||'',
    sourceClassLevel:minimumLevel,
    effectiveClassLevel:classLevel,
    sourceFeatureId:feature.sourceFeatureId||null,
    sourceFeatureName:feature.name||'',
    sourceUrl:effect.sourceUrl||feature.sourceUrl||null,
    edition:feature.edition||'3.5'
  };
}

export function reconcileClassEffects35(character){
  const manual=(Array.isArray(character?.classEffects35)?character.classEffects35:[])
    .filter(effect=>!(effect?.sourceType==='class'&&effect?.automatic));
  const derived=[];
  for(const feature of character?.grantedFeatures||[]){
    const effects=Array.isArray(feature?.effects)?feature.effects:[];
    effects.forEach((effect,index)=>{
      const materialized=materializeFeatureEffect35(character,feature,effect,index);
      if(materialized)derived.push(materialized);
    });
  }
  const unique=new Map();
  for(const effect of derived)unique.set(effect.id,effect);
  return {...character,classEffects35:[...manual,...unique.values()]};
}
