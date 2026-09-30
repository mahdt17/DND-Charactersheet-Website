import catalog from '../data/companions35.json' with {type:'json'};

export const COMPANION_ENGINE_VERSION=1;

const norm=value=>String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const creatures=Array.isArray(catalog.creatures)?catalog.creatures:[];
const profiles=catalog.profiles||{};

export function companionCreature35(idOrName){
  const key=String(idOrName||'').trim();
  if(!key)return null;
  const normalized=norm(key);
  return creatures.find(creature=>
    creature.id===key||
    norm(creature.name)===normalized||
    norm(creature.sourceName)===normalized||
    (creature.aliases||[]).some(alias=>norm(alias)===normalized)
  )||null;
}

export function companionChoiceOptions35(profileId,effectiveLevel){
  const profile=profiles[profileId];
  if(!profile||!Array.isArray(profile.choices))return [];
  const level=Math.max(0,Math.floor(Number(effectiveLevel)||0));
  return profile.choices
    .map(([name,minEffectiveLevel=1,levelAdjustment=0,baseCreatureId=null])=>({name,minEffectiveLevel,levelAdjustment,baseCreatureId}))
    .filter(option=>level>=Math.max(0,Number(option.minEffectiveLevel)||0));
}

export function companionProgression35(profileId,effectiveLevel){
  const profile=profiles[profileId];
  const level=Math.max(0,Math.floor(Number(effectiveLevel)||0));
  if(!profile||!Array.isArray(profile.progression))return {profileId,effectiveLevel:level,specialAbilities:[]};
  const band=[...profile.progression]
    .filter(item=>level>=Math.max(0,Number(item.minLevel)||0))
    .sort((a,b)=>Number(a.minLevel)-Number(b.minLevel))
    .at(-1);
  return {profileId,effectiveLevel:level,...(band||{}),specialAbilities:[...(band?.specialAbilities||[])]};
}

function contributionValue(entry){
  if(!entry||typeof entry!=='object')return 0;
  const mode=entry.mode||'full';
  const level=Math.max(0,Number(entry.level)||0);
  if(mode==='fixed')return Math.max(0,Number(entry.amount)||0);
  if(mode==='minus')return Math.max(0,level-Math.max(0,Number(entry.amount)||0));
  if(mode==='fraction'){
    const numerator=Number(entry.numerator)||1,denominator=Math.max(1,Number(entry.denominator)||1);
    return Math.max(0,Math.floor(level*numerator/denominator));
  }
  return Math.max(0,Math.floor(level));
}

export function companionEffectiveLevel35(contributions,levelAdjustment=0){
  const total=(Array.isArray(contributions)?contributions:[]).reduce((sum,entry)=>sum+contributionValue(entry),0);
  return Math.max(0,Math.floor(total)-Math.max(0,Math.floor(Number(levelAdjustment)||0)));
}

export function companionProfile35(profileId){
  return profiles[profileId]||null;
}
