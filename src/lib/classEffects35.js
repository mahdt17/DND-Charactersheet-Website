import reviewedClassEffects35 from '../data/class-effects-35.json' with {type:'json'};
import {characterClasses} from './advancement.js';
import {reconcileFeatureProgressions35} from './featureProgression35.js';

export const CLASS_EFFECTS35_VERSION=1;

const norm=value=>String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const slug=value=>norm(value).replace(/\s+/g,'-')||'effect';
const signed=value=>Number(value)>=0?`+${Number(value)}`:String(Number(value));
const title=value=>String(value||'').replace(/\b\w/g,character=>character.toUpperCase());
const exactSourceId=value=>String(value||'').replace(/^dndtools:/,'');
const targetKey=value=>norm(value).replace(/saving throws?/g,'save');

export function reviewedClassEffectSpecs35(sourceClassId,featureName){
  const entry=reviewedClassEffects35.entries?.[exactSourceId(sourceClassId)];
  if(!entry||!featureName)return [];
  if(Array.isArray(entry[featureName]))return entry[featureName];
  const matches=Object.entries(entry).filter(([name])=>norm(name)===norm(featureName));
  return matches.length===1&&Array.isArray(matches[0][1])?matches[0][1]:[];
}

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
    const amount=value==null||value===''?'':effect.operation==='set'?`set to ${value}`:Number.isFinite(Number(value))?signed(value):String(value).trim();
    const parts=[amount,target,subtype?`(${subtype})`:'',effect.bonusType?`${effect.bonusType} bonus`:'',condition].filter(Boolean);
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
  if(type==='damagereduction'){
    return `Damage reduction ${value??''}/${effect.bypass||'-'}${condition?` ${condition}`:''}`.trim();
  }
  const label=String(effect.name||effect.effectId||effect.id||type||'Class effect').trim();
  const detail=[value!=null&&value!==''?String(value):'',unit,condition].filter(Boolean).join(' ');
  return detail?`${label}: ${detail}`:label;
}

export function classEffectRequiresActivation35(effect){
  if(!effect||typeof effect!=='object')return false;
  if(effect.requiresActivation!=null)return effect.requiresActivation===true;
  const type=String(effect.type||'').toLowerCase();
  return Boolean(effect.condition)&&['modifier','movement','damagereduction'].includes(type);
}

export function classEffectActive35(character,effect){
  if(!classEffectRequiresActivation35(effect))return true;
  const toggles=character?.classEffectToggles35||{};
  if(Object.hasOwn(toggles,effect.id))return toggles[effect.id]===true;
  return effect?.defaultActive===true;
}

function effectTargetMatches35(effectTarget,requestedTarget){
  const effect=targetKey(effectTarget),requested=targetKey(requestedTarget);
  if(!effect||!requested)return false;
  if(effect===requested)return true;
  if(effect==='save')return /(?:^| )(?:fortitude |reflex |will )?save(?: |$)/.test(requested);
  if(effect==='attack')return requested==='attack'||requested.endsWith(' attack');
  if(effect==='damage')return requested==='damage'||requested.endsWith(' damage');
  if(effect==='check')return requested==='check'||requested.endsWith(' check');
  return false;
}

function stackModifierEffects35(effects){
  let total=0;
  const typed=new Map();
  for(const effect of effects){
    const value=Number(effect.value);
    if(!Number.isFinite(value))continue;
    const bonusType=norm(effect.bonusType);
    if(!bonusType||['dodge','circumstance'].includes(bonusType)){
      total+=value;
      continue;
    }
    const current=typed.get(bonusType);
    if(current==null)typed.set(bonusType,value);
    else if(value>=0&&current>=0)typed.set(bonusType,Math.max(current,value));
    else if(value<=0&&current<=0)typed.set(bonusType,Math.min(current,value));
    else typed.set(bonusType,current+value);
  }
  return total+[...typed.values()].reduce((sum,value)=>sum+value,0);
}

export function classEffectModifier35(character,target){
  const effects=(Array.isArray(character?.classEffects35)?character.classEffects35:[]).filter(effect=>
    String(effect?.type||'').toLowerCase()==='modifier'
    &&effect?.operation!=='set'
    &&effectTargetMatches35(effect?.target,target)
    &&classEffectActive35(character,effect)
  );
  return stackModifierEffects35(effects);
}

export function classEffectMovementBonus35(character,movement='land'){
  return (Array.isArray(character?.classEffects35)?character.classEffects35:[]).filter(effect=>
    String(effect?.type||'').toLowerCase()==='movement'
    &&String(effect?.operation||'').toLowerCase()==='add'
    &&norm(effect?.movement||effect?.target)===norm(movement)
    &&classEffectActive35(character,effect)
  ).reduce((sum,effect)=>sum+(Number(effect.value)||0),0);
}

export function classEffectMovementValue35(character,movement='land',baseValue=null){
  const effects=(Array.isArray(character?.classEffects35)?character.classEffects35:[]).filter(effect=>
    String(effect?.type||'').toLowerCase()==='movement'
    &&norm(effect?.movement||effect?.target)===norm(movement)
    &&classEffectActive35(character,effect)
  );
  const setValues=effects
    .filter(effect=>String(effect?.operation||'').toLowerCase()==='set')
    .map(effect=>Number(effect.value))
    .filter(Number.isFinite);
  const additive=effects
    .filter(effect=>String(effect?.operation||'').toLowerCase()==='add')
    .reduce((sum,effect)=>sum+(Number(effect.value)||0),0);
  const numericBase=Number(baseValue);
  let value=baseValue!=null&&Number.isFinite(numericBase)?numericBase:null;
  if(setValues.length)value=Math.max(...setValues);
  if(value==null)return additive!==0?additive:null;
  return value+additive;
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

function reconcileDerivedScalar35(character,{field,target,manualField,derivedField}){
  const priorDerived=Number(character?.[derivedField])||0;
  const hasPrior=character?.[derivedField]!=null;
  const current=Number(character?.[field])||0;
  const derived=classEffectModifier35(character,target);
  if(!hasPrior&&!derived)return character;
  const storedManual=Number(character?.[manualField]);
  const priorManual=character?.[manualField]!=null&&Number.isFinite(storedManual)?storedManual:current-priorDerived;
  const expected=priorManual+priorDerived;
  const manual=current===expected?priorManual:current-priorDerived;
  return {...character,[field]:manual+derived,[manualField]:manual,[derivedField]:derived};
}

function reconcileInitiative35(character){
  return reconcileDerivedScalar35(character,{
    field:'initiativeBonus',target:'initiative',manualField:'classEffectInitiativeManual35',derivedField:'classEffectInitiativeBonus35'
  });
}

function reconcileArmorClass35(character){
  return reconcileDerivedScalar35(character,{
    field:'ac',target:'AC',manualField:'classEffectArmorClassManual35',derivedField:'classEffectArmorClassBonus35'
  });
}

export function reconcileClassEffects35(character){
  character=reconcileFeatureProgressions35(character);
  const manual=(Array.isArray(character?.classEffects35)?character.classEffects35:[])
    .filter(effect=>!(effect?.sourceType==='class'&&effect?.automatic));
  const derived=[];
  for(const feature of character?.grantedFeatures||[]){
    const inline=Array.isArray(feature?.effects)?feature.effects:[];
    const reviewed=reviewedClassEffectSpecs35(feature?.sourceClassId,feature?.name);
    const effects=[...inline,...reviewed];
    effects.forEach((effect,index)=>{
      const materialized=materializeFeatureEffect35(character,feature,effect,index);
      if(materialized)derived.push(materialized);
    });
  }
  const unique=new Map();
  for(const effect of derived)unique.set(effect.id,effect);
  const derivedEffects=[...unique.values()];
  const conditionalIds=new Set(derivedEffects.filter(classEffectRequiresActivation35).map(effect=>effect.id));
  const classEffectToggles35=Object.fromEntries(Object.entries(character?.classEffectToggles35||{}).filter(([id,value])=>conditionalIds.has(id)&&typeof value==='boolean'));
  const withEffects={...character,classEffects35:[...manual,...derivedEffects],classEffectToggles35};
  return reconcileArmorClass35(reconcileInitiative35(withEffects));
}