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


const safeArray=value=>Array.isArray(value)?value:[];
const slug35=value=>norm(value).replace(/\s+/g,'-')||'companion';

function classLevelMap(character){
  return new Map(safeArray(character?.classLevels).map(row=>[row.catalogId||row.id||row.name,Math.max(0,Number(row.level)||0)]));
}
function relationshipKey(feature){
  const relation=feature.companionRelationshipType||'companion';
  const profile=feature.companionProfileId||'unknown';
  if(relation==='familiar'||relation==='animal-companion')return relation+':'+profile;
  return relation+':'+profile+':'+String(feature.sourceClassId||'class')+':'+String(feature.sourceFeatureId||feature.name||'feature');
}
function lifecycleRule(relationshipType){
  if(relationshipType==='familiar')return {replacementCondition:'year-and-a-day',restrictionText:'A dead or dismissed familiar cannot be replaced until a year and a day of campaign time has passed.',available:true};
  if(relationshipType==='animal-companion')return {replacementCondition:'24-hours-prayer',restrictionText:'A released or lost animal companion can be replaced after 24 uninterrupted hours of campaign-time prayer.',available:true};
  if(relationshipType==='special-mount')return {replacementCondition:'30-days-or-paladin-level',restrictionText:'A lost special mount is unavailable for 30 campaign days or until the paladin gains a level, whichever comes first.',available:true,called:false};
  return {replacementCondition:'source-defined',restrictionText:'Use the source-defined replacement condition for this companion.',available:true};
}
function baseCreatureFor(name,id){
  return companionCreature35(id)||companionCreature35(name);
}
function parseHitDieSides(hitDice){
  const match=String(hitDice||'').match(/(?:\d+|\d+\/\d+)d(\d+)/i);
  return match?Number(match[1]):null;
}
function derivedStats35(base,profileId,progression,character,exceptions={}){
  if(!base)return null;
  const abilities={...(base.abilities||{})};
  let type=base.type;
  if(profileId==='druid-animal-companion'){
    const adjustment=Number(progression.strDexAdjustment)||0;
    if(Number.isFinite(Number(abilities.str)))abilities.str=Number(abilities.str)+adjustment;
    if(Number.isFinite(Number(abilities.dex)))abilities.dex=Number(abilities.dex)+adjustment;
  }else if(profileId==='standard-familiar'){
    const intelligence=Number(progression.intelligence);
    if(Number.isFinite(intelligence))abilities.int=Math.max(Number(abilities.int)||0,intelligence);
    if(!exceptions.retainCreatureType)type='Magical Beast';
  }else if(profileId==='paladin-special-mount'){
    if(Number.isFinite(Number(abilities.str)))abilities.str=Number(abilities.str)+(Number(progression.strengthAdjustment)||0);
    const intelligence=Number(progression.intelligence);
    if(Number.isFinite(intelligence))abilities.int=Math.max(Number(abilities.int)||0,intelligence);
  }else if(profileId==='healer-companion'){
    const adjustment=Number(progression.strDexIntAdjustment)||0;
    for(const key of ['str','dex','int'])if(Number.isFinite(Number(abilities[key])))abilities[key]=Number(abilities[key])+adjustment;
  }
  const naturalArmorAdjustment=Number(progression.naturalArmorAdjustment)||0;
  const ac=base.ac?{
    total:Number(base.ac.total||0)+naturalArmorAdjustment,
    touch:Number(base.ac.touch||0),
    flatFooted:Number(base.ac.flatFooted||0)+naturalArmorAdjustment
  }:null;
  const bonusHD=Number(progression.bonusHD)||0;
  return {
    size:base.size,type,subtypes:[...(base.subtypes||[])],hitDice:base.hitDice,baseHitPoints:base.hp,
    bonusHD,hitDieSides:parseHitDieSides(base.hitDice),ac,abilities,speed:{...(base.speed||{})},
    baseAttack:base.baseAttack,grapple:base.grapple,attacks:[...(base.attacks||[])],saves:{...(base.saves||{})},
    specialAbilities:[...(base.specialAbilities||[])]
  };
}
function defaultHitPoints(base,profileId,character){
  if(profileId==='standard-familiar')return Math.max(1,Math.floor((Number(character?.hp?.max)||0)/2));
  return Math.max(1,Number(base?.hp)||1);
}

export function reconcileCompanions35(character){
  const features=safeArray(character?.grantedFeatures).filter(feature=>feature?.companionProfileId&&feature?.sourceClassId);
  const levels=classLevelMap(character);
  const existing=safeArray(character?.companions);
  const manual=existing.filter(item=>item?.automatic===false);
  const groups=new Map();
  for(const feature of features){
    const classLevel=levels.get(feature.sourceClassId);
    if(classLevel==null)continue;
    const key=relationshipKey(feature);
    if(!groups.has(key))groups.set(key,{key,features:[]});
    groups.get(key).features.push(feature);
  }
  const automatic=[];
  const incompleteReasons=[];
  for(const group of groups.values()){
    const primary=group.features[0],profileId=primary.companionProfileId,relationshipType=primary.companionRelationshipType||'companion';
    const sourceClassIds=[...new Set(group.features.map(feature=>feature.sourceClassId).filter(Boolean))];
    const sourceFeatureIds=[...new Set(group.features.map(feature=>feature.sourceFeatureId||feature.id||feature.name).filter(Boolean))];
    const old=existing.find(item=>item?.automatic!==false&&(item.groupKey===group.key||(item.relationshipType===relationshipType&&item.profileId===profileId)));
    const choices=Object.values(character?.featureChoices||{}).filter(choice=>choice?.companionProfileId===profileId&&sourceClassIds.includes(choice?.sourceClassId));
    const distinctSelections=[...new Set(choices.flatMap(choice=>choice?.choices||[]).map(String).filter(Boolean))];
    const chosen=choices.find(choice=>choice?.baseCreatureId)||choices[0]||null;
    const selectedName=String(chosen?.choices?.[0]||old?.sourceCreatureName||old?.name||'').trim();
    const defaultCreatureId=group.features.map(feature=>feature.companionDefaultCreatureId).find(Boolean)||null;
    const baseCreatureId=chosen?.baseCreatureId||defaultCreatureId||baseCreatureFor(selectedName,null)?.id||old?.baseCreatureId||null;
    if(!selectedName&&!baseCreatureId)continue;
    const base=baseCreatureFor(selectedName,baseCreatureId);
    const levelAdjustment=Math.max(0,Number(chosen?.levelAdjustment??old?.levelAdjustment)||0);
    const contributions=group.features.map(feature=>({
      ...(feature.companionContribution||{mode:'full'}),
      level:levels.get(feature.sourceClassId)||0,
      sourceClassId:feature.sourceClassId
    }));
    const effectiveMasterLevel=companionEffectiveLevel35(contributions,0);
    const effectiveCompanionLevel=companionEffectiveLevel35(contributions,levelAdjustment);
    let progression=companionProgression35(profileId,effectiveCompanionLevel);
    const exceptions=Object.assign({},...group.features.map(feature=>feature.companionExceptions||{}));
    if(Array.isArray(exceptions.omitAbilities)&&exceptions.omitAbilities.length){
      progression={...progression,specialAbilities:(progression.specialAbilities||[]).filter(name=>!exceptions.omitAbilities.includes(name))};
    }
    const derivedStats=derivedStats35(base,profileId,progression,character,exceptions);
    const maxHp=defaultHitPoints(base,profileId,character);
    const id=old?.id||'companion35:'+slug35(group.key);
    const incomplete=!base||distinctSelections.length>1;
    const incompleteReason=!base
      ?'Missing source-locked creature record for '+(selectedName||baseCreatureId||'selected companion')+'.'
      :distinctSelections.length>1?'Conflicting companion selections exist for one shared relationship.':'';
    if(incompleteReason)incompleteReasons.push(incompleteReason);
    const lifecycle={...lifecycleRule(relationshipType),...(old?.lifecycle||{})};
    automatic.push({
      id,groupKey:group.key,automatic:true,edition:'3.5',relationshipType,profileId,
      name:old?.name||selectedName||base?.name||'Companion',sourceCreatureName:selectedName||base?.name||'',
      baseCreatureId:base?.id||baseCreatureId,sourceUrl:base?.sourceUrl||primary.sourceUrl||null,
      sourceClassIds,sourceFeatureIds,contributions,effectiveMasterLevel,levelAdjustment,effectiveCompanionLevel,
      baseStats:base?{...base}:null,derivedStats,progression,
      specialAbilities:[...(progression.specialAbilities||[])],
      hp:{max:maxHp,current:Math.min(maxHp,Math.max(0,Number(old?.hp?.current)??maxHp))},
      status:old?.status||'active',lifecycle,notes:old?.notes||'',
      template:primary.companionTemplate||old?.template||null,
      exceptions,incomplete,incompleteReason:incompleteReason||null
    });
  }
  return {
    ...character,
    companions:[...manual,...automatic],
    companionAutomation:{version:COMPANION_ENGINE_VERSION,incompleteReasons}
  };
}

export function transitionCompanion35(character,companionId,event,options={}){
  const companions=safeArray(character?.companions).map(companion=>{
    if(companion?.id!==companionId)return companion;
    const baseLifecycle={...lifecycleRule(companion.relationshipType),...(companion.lifecycle||{})};
    if(event==='mark-dead')return {...companion,status:'dead',lifecycle:{...baseLifecycle,available:false,reason:'dead'}};
    if(event==='release')return {...companion,status:'released',lifecycle:{...baseLifecycle,available:false,reason:'released'}};
    if(event==='dismiss')return {...companion,status:'dismissed',lifecycle:{...baseLifecycle,available:false,reason:'dismissed'}};
    if(event==='confirm-replacement-available')return {...companion,lifecycle:{...baseLifecycle,available:true,reason:null}};
    if(event==='restore')return {...companion,status:'active',lifecycle:{...baseLifecycle,available:true,reason:null}};
    if(event==='call')return {...companion,status:'active',lifecycle:{...baseLifecycle,called:true}};
    if(event==='uncall')return {...companion,status:'uncalled',lifecycle:{...baseLifecycle,called:false}};
    return companion;
  });
  return {...character,companions};
}
