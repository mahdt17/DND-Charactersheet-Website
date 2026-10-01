import data from '../data/spell-acquisition35.json' with {type:'json'};

export const SPELL_ACQUISITION35_VERSION=1;

const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const classSourceId=input=>{
  if(typeof input==='string')return cleanId(input);
  if(!input||typeof input!=='object')return '';
  return cleanId(input.sourceId||input.catalogId||input.id||input.definition?.sourceId||input.definition?.id||input.definition?.catalogId||'');
};
const profileData=id=>data.profiles?.[id]||null;
const abilityScore=(character,key)=>Math.max(0,Number(character?.abilities?.[key])||0)+(Number(character?.abilityBonuses?.[key])||0);
const modifier=score=>Math.floor((Number(score)-10)/2);
const eventId=(classId,classLevel,kind,spellLevel)=>[classId,classLevel,kind,spellLevel??'all'].join(':');
const spellKey=spell=>String(spell?.catalogId||spell?.spellKey||spell?.id||spell?.index||spell?.name||'').trim();
const classNames=spell=>(Array.isArray(spell?.classes)?spell.classes:[]).map(x=>String(x?.name||x||'').trim().toLowerCase());

export function spellAcquisitionProfile35(classIdOrDefinition){
  const sourceId=classSourceId(classIdOrDefinition);
  const id=data.sourceMappings?.[sourceId];
  const profile=profileData(id);
  return profile?{id,...profile,sourceId}:null;
}

export function spellKnownLimits35(profileId,classLevel){
  const profile=profileData(profileId);
  const level=Math.max(0,Math.floor(Number(classLevel)||0));
  const row=profile?.knownTable?.[String(level)]||{};
  return Object.fromEntries(Object.entries(row).filter(([,count])=>Number(count)>0).map(([spellLevel,count])=>[Number(spellLevel),Number(count)]));
}

function replacementAvailable(profile,classLevel){
  const rule=profile?.replacement;
  if(!rule)return false;
  if(rule.mode==='even-from')return classLevel>=Number(rule.startLevel||0)&&classLevel%2===0;
  if(rule.mode==='levels')return (rule.levels||[]).includes(classLevel);
  return false;
}

function hexbladeConditionalAccess(character,profile,classLevel,spellLevel){
  const conditional=(profile?.conditionalKnownAccess?.[String(classLevel)]||[]).map(Number).includes(Number(spellLevel));
  if(!conditional)return {conditional:false,allowed:true};
  const minimum=10+2*Number(spellLevel);
  return {conditional:true,allowed:abilityScore(character,'cha')>=minimum,minimumAbilityScore:minimum};
}

function knownEventsForLevel(character,classId,profileId,profile,classLevel){
  const previous=spellKnownLimits35(profileId,classLevel-1);
  const current=spellKnownLimits35(profileId,classLevel);
  const events=[];
  for(const spellLevel of Object.keys(current).map(Number).sort((a,b)=>a-b)){
    const count=Math.max(0,(current[spellLevel]||0)-(previous[spellLevel]||0));
    if(!count)continue;
    const gate=profileId==='hexblade-35'?hexbladeConditionalAccess(character,profile,classLevel,spellLevel):{conditional:false,allowed:true};
    if(!gate.allowed)continue;
    events.push({
      id:eventId(classId,classLevel,'choose-known-spells',spellLevel),
      eventId:eventId(classId,classLevel,'choose-known-spells',spellLevel),
      kind:'choose-known-spells',
      classId,
      profileId,
      classLevel,
      spellLevel,
      count,
      required:true,
      conditionalAccess:Boolean(gate.conditional),
      minimumAbilityScore:gate.minimumAbilityScore
    });
  }
  if(replacementAvailable(profile,classLevel)){
    const highest=Math.max(0,Number(profile.maxSpellLevelByClassLevel?.[String(classLevel)])||0);
    events.push({
      id:eventId(classId,classLevel,'optional-replacement','one'),
      eventId:eventId(classId,classLevel,'optional-replacement','one'),
      kind:'optional-replacement',
      classId,
      profileId,
      classLevel,
      count:Number(profile.replacement?.count)||1,
      required:false,
      highestCastableSpellLevel:highest,
      maxReplacementSpellLevel:highest-2
    });
  }
  return events;
}

export function spellAcquisitionEvents35(character,{classId,previousClassLevel=0,targetClassLevel}={}){
  const exactClassId=String(classId||'').trim();
  const profile=spellAcquisitionProfile35(exactClassId);
  if(!profile)return [];
  const previous=Math.max(0,Math.floor(Number(previousClassLevel)||0));
  const target=Math.max(previous,Math.floor(Number(targetClassLevel)||0));
  const events=[];
  for(let classLevel=previous+1;classLevel<=target;classLevel++){
    if(profile.kind==='known-table'){
      events.push(...knownEventsForLevel(character,exactClassId,profile.id,profile,classLevel));
      continue;
    }
    if(profile.kind==='spellbook'&&classLevel===1){
      const intBonus=Math.max(0,modifier(abilityScore(character,'int')));
      events.push({
        id:eventId(exactClassId,classLevel,'wizard-starting-spellbook','all'),
        eventId:eventId(exactClassId,classLevel,'wizard-starting-spellbook','all'),
        kind:'wizard-starting-spellbook',
        classId:exactClassId,
        profileId:profile.id,
        classLevel,
        required:true,
        automaticCantrips:Boolean(profile.startingSpellbook?.automaticCantrips),
        firstLevelChoices:Math.max(0,Number(profile.startingSpellbook?.firstLevelBaseChoices)||0)+(profile.startingSpellbook?.intelligenceBonusChoices?intBonus:0),
        maxSpellLevel:1
      });
    }else if(profile.kind==='spellbook'&&classLevel>1){
      events.push({
        id:eventId(exactClassId,classLevel,'wizard-free-spellbook-additions','all'),
        eventId:eventId(exactClassId,classLevel,'wizard-free-spellbook-additions','all'),
        kind:'wizard-free-spellbook-additions',
        classId:exactClassId,
        profileId:profile.id,
        classLevel,
        required:true,
        count:Math.max(0,Number(profile.freeLevelUpSpells)||0),
        maxSpellLevel:Math.max(0,Number(profile.maxSpellLevelByClassLevel?.[String(classLevel)])||0)
      });
    }
  }
  return events;
}

function acquisitionBucket(character,classId){
  const state=character?.spellAcquisition35||{};
  if(state[classId])return state[classId];
  const normalized=cleanId(classId);
  const key=Object.keys(state).find(candidate=>cleanId(candidate)===normalized);
  return key?state[key]:null;
}

export function validateSpellReplacement35(character,event,{removedSpellKey,addedSpell}={}){
  if(event?.kind!=='optional-replacement')return {valid:false,reason:'This is not a spell replacement event.'};
  const bucket=acquisitionBucket(character,event.classId);
  const acquisitions=Array.isArray(bucket?.acquisitions)?bucket.acquisitions:[];
  const removed=acquisitions.find(item=>item?.active!==false&&String(item.spellKey||'')===String(removedSpellKey||''));
  if(!removed)return {valid:false,reason:'Choose an active spell known by this class to replace.'};
  const addedKey=spellKey(addedSpell);
  if(!addedKey)return {valid:false,reason:'Choose a replacement spell.'};
  const addedLevel=Number(addedSpell?.level);
  if(!Number.isInteger(addedLevel)||addedLevel<0)return {valid:false,reason:'The replacement spell level is unknown.'};
  if(addedLevel!==Number(removed.spellLevel))return {valid:false,reason:'The replacement spell must be the same spell level.'};
  if(addedLevel>Number(event.maxReplacementSpellLevel))return {valid:false,reason:'The replacement spell level is too high for this class-level swap.'};
  const profile=profileData(event.profileId);
  if(profile?.className&&!classNames(addedSpell).includes(String(profile.className).toLowerCase()))return {valid:false,reason:'The replacement spell is not on this class spell list.'};
  if(acquisitions.some(item=>item?.active!==false&&String(item.spellKey||'')===addedKey))return {valid:false,reason:'This class already knows that spell.'};
  return {valid:true,removed,addedSpellKey:addedKey,spellLevel:addedLevel};
}


const copyRecord=value=>value&&typeof value==='object'?{...value}:value;
const activeClassRows=character=>{
  if(Array.isArray(character?.classLevels)&&character.classLevels.length)return character.classLevels;
  if(!character?.className)return [];
  const definition=character.classDefinition||{};
  const catalogId=definition.catalogId||definition.id||definition.sourceId||'';
  return [{catalogId,name:character.className,edition:definition.edition||character.ruleset,level:Math.max(1,Number(character.level)||1),definition}];
};
const exactStateKey=(state,classId)=>{
  if(state[classId])return classId;
  const normalized=cleanId(classId);
  return Object.keys(state).find(candidate=>cleanId(candidate)===normalized)||classId;
};
const runtimeSpellKey=spell=>String(spell?.catalogId||spell?.spellKey||spell?.index||spell?.name||spell?.id||'').trim();
const norm=value=>String(value?.name||value||'').trim().toLowerCase().replaceAll('’',"'");
const cloneBucket=bucket=>({
  ...(bucket||{}),
  acquisitions:Array.isArray(bucket?.acquisitions)?bucket.acquisitions.map(item=>({...item,spell:item?.spell?{...item.spell}:item?.spell})):[],
  replacements:Array.isArray(bucket?.replacements)?bucket.replacements.map(copyRecord):[],
  campaignEntries:Array.isArray(bucket?.campaignEntries)?bucket.campaignEntries.map(copyRecord):[]
});
function legacyChoiceFor(character,classId){
  const all=character?.legacyCastingChoices||{};
  if(all[classId])return all[classId];
  const normalized=cleanId(classId);
  const key=Object.keys(all).find(candidate=>cleanId(candidate)===normalized);
  return key?all[key]:{};
}
function acquisitionIdFor(event,spell,ordinal=0){
  return [event.eventId||event.id||'spell-acquisition',spellKey(spell)||'spell',ordinal].join(':');
}
function acquisitionFromSpell(event,spell,{origin,affectsQuota=true,ordinal=0}={}){
  return {
    id:acquisitionIdFor(event,spell,ordinal),
    spellKey:spellKey(spell),
    spellName:String(spell?.name||''),
    spellLevel:Number(spell?.level),
    acquiredAtClassLevel:Number(event.classLevel)||0,
    origin,
    sourceEventId:event.eventId||event.id||null,
    active:true,
    affectsQuota,
    spell:{...spell}
  };
}
function profileBucket(character,event){
  const state={...(character?.spellAcquisition35||{})};
  const key=exactStateKey(state,event.classId);
  const existing=cloneBucket(state[key]);
  const profile=profileData(event.profileId)||spellAcquisitionProfile35(event.classId);
  state[key]={
    profileId:event.profileId||profile?.id||existing.profileId,
    classId:event.classId,
    classLevel:Number(event.classLevel)||Number(existing.classLevel)||0,
    active:true,
    orphaned:false,
    acquisitions:existing.acquisitions||[],
    replacements:existing.replacements||[],
    campaignEntries:existing.campaignEntries||[],
    ...existing,
    profileId:event.profileId||profile?.id||existing.profileId,
    classId:event.classId,
    classLevel:Number(event.classLevel)||Number(existing.classLevel)||0,
    active:true,
    orphaned:false
  };
  return {state,key,bucket:state[key],profile};
}
function validateEventSpells(event,spells,profile,{count=event.count,exactLevel=event.spellLevel,maxLevel=event.maxSpellLevel}={}){
  if(!Array.isArray(spells)||spells.length!==Number(count||0))throw Error('Choose exactly '+Number(count||0)+' spells for this acquisition.');
  const seen=new Set();
  for(const spell of spells){
    const key=spellKey(spell);
    if(!key)throw Error('Each acquired spell needs a stable catalog identity.');
    if(seen.has(key))throw Error('Choose distinct spells for this acquisition.');
    seen.add(key);
    const level=Number(spell?.level);
    if(!Number.isInteger(level)||level<0||level>9)throw Error('Each acquired spell needs a verified spell level.');
    if(Number.isInteger(Number(exactLevel))&&level!==Number(exactLevel))throw Error('Choose spells of the required spell level.');
    if(Number.isInteger(Number(maxLevel))&&level>Number(maxLevel))throw Error('This spell level is not available for this acquisition.');
    if(profile?.className&&classNames(spell).length&&!classNames(spell).includes(String(profile.className).toLowerCase()))throw Error('Choose spells from the '+profile.className+' spell list.');
  }
}
export function applySpellAcquisitionEvent35(character,event,selection){
  if(!event?.classId||!event?.profileId)throw Error('This spell acquisition event is missing source ownership.');
  const {state,key,bucket,profile}=profileBucket(character,event);
  if(!profile)throw Error('This spell acquisition profile is not supported.');

  if(event.kind==='optional-replacement'){
    const result=validateSpellReplacement35({...character,spellAcquisition35:state},event,selection||{});
    if(!result.valid)throw Error(result.reason);
    const added=selection.addedSpell,addedKey=spellKey(added);
    bucket.acquisitions=bucket.acquisitions.map(item=>String(item.spellKey||'')===String(selection.removedSpellKey||'')&&item.active!==false
      ?{...item,active:false,replacedAtClassLevel:event.classLevel,replacedBySpellKey:addedKey}
      :item);
    const replacement=acquisitionFromSpell(event,added,{origin:'replacement',affectsQuota:true});
    bucket.acquisitions.push(replacement);
    bucket.replacements=[...(bucket.replacements||[]),{
      id:event.eventId||event.id,classLevel:event.classLevel,removedSpellKey:selection.removedSpellKey,
      addedSpellKey:addedKey,spellLevel:Number(added.level)
    }];
    state[key]=bucket;
    return reconcileSpellAcquisition35({...character,spellAcquisition35:state});
  }

  let spells=[],origin='level-up',affectsQuota=profile.kind==='known-table';
  if(event.kind==='choose-known-spells'){
    spells=Array.isArray(selection)?selection:[];
    validateEventSpells(event,spells,profile);
    origin=Number(event.classLevel)===1?'starting':'level-up';
  }else if(event.kind==='wizard-free-spellbook-additions'){
    spells=Array.isArray(selection)?selection:[];
    validateEventSpells(event,spells,profile,{count:event.count,exactLevel:null,maxLevel:event.maxSpellLevel});
    origin='wizard-free-level-up';
    affectsQuota=false;
  }else if(event.kind==='wizard-starting-spellbook'){
    const cantrips=Array.isArray(selection?.cantrips)?selection.cantrips:[];
    const firstLevel=Array.isArray(selection?.firstLevel)?selection.firstLevel:[];
    if(firstLevel.length!==Number(event.firstLevelChoices||0))throw Error('Choose the required starting 1st-level Wizard spells.');
    if(firstLevel.some(spell=>Number(spell?.level)!==1)||cantrips.some(spell=>Number(spell?.level)!==0))throw Error('Wizard starting spellbook selections have invalid spell levels.');
    spells=[...cantrips,...firstLevel];
    if(new Set(spells.map(spellKey)).size!==spells.length)throw Error('Wizard starting spellbook entries must be distinct.');
    origin='starting';
    affectsQuota=false;
  }else throw Error('Unsupported spell acquisition event.');

  const eventKey=event.eventId||event.id;
  bucket.acquisitions=(bucket.acquisitions||[]).filter(item=>item.sourceEventId!==eventKey);
  for(const [index,spell] of spells.entries()){
    const keyValue=spellKey(spell);
    if(bucket.acquisitions.some(item=>item.active!==false&&item.spellKey===keyValue))throw Error('This class already owns that spell.');
    bucket.acquisitions.push(acquisitionFromSpell(event,spell,{origin,affectsQuota,ordinal:index}));
  }
  state[key]=bucket;
  return reconcileSpellAcquisition35({...character,spellAcquisition35:state});
}

export function activeAcquiredSpells35(character,classId){
  const state=character?.spellAcquisition35||{};
  const key=exactStateKey(state,classId);
  const bucket=state[key];
  if(!bucket||bucket.active===false)return [];
  return (bucket.acquisitions||[]).filter(item=>item?.active!==false).map(item=>({...item,spell:item?.spell?{...item.spell}:item?.spell}));
}

function isProhibitedWizardSpell(character,classId,acquisition){
  const prohibited=new Set((legacyChoiceFor(character,classId)?.prohibited||[]).map(norm));
  const school=norm(acquisition?.spell?.school);
  return Boolean(school&&prohibited.has(school));
}
function currentClassMap(character){
  return new Map(activeClassRows(character).map(row=>[cleanId(row.catalogId||row.definition?.catalogId||row.definition?.id||row.definition?.sourceId||''),row]));
}
function runtimeGroupKey(classId,key){return cleanId(classId)+'|'+String(key||'');}
function managedRuntime(spell){return Boolean(spell?.spellAcquisitionClassId||spell?.spellAcquisitionId||Array.isArray(spell?.spellAcquisitionIds));}
function minimalSpell(acquisition){
  return acquisition?.spell?{...acquisition.spell}:{
    catalogId:acquisition?.spellKey||undefined,
    name:acquisition?.spellName||'Acquired spell',
    level:Number(acquisition?.spellLevel)||0,
    edition:'3.5',
    category:'spell'
  };
}

export function reconcileSpellAcquisition35(character){
  const originalState=character?.spellAcquisition35||{};
  const state=Object.fromEntries(Object.entries(originalState).map(([key,bucket])=>[key,cloneBucket(bucket)]));
  const activeClasses=currentClassMap(character);
  const retiredPairs=new Set();
  const incomplete=[];

  for(const row of activeClassRows(character)){
    const exactClassId=String(row.catalogId||row.definition?.catalogId||row.definition?.id||row.definition?.sourceId||'');
    const profile=spellAcquisitionProfile35(exactClassId||row.definition);
    if(!profile||!exactClassId)continue;
    const key=exactStateKey(state,exactClassId);
    const existing=cloneBucket(state[key]);
    state[key]={
      profileId:profile.id,classId:exactClassId,classLevel:Math.max(1,Number(row.level)||1),
      active:true,orphaned:false,
      acquisitions:existing.acquisitions||[],replacements:existing.replacements||[],campaignEntries:existing.campaignEntries||[],
      ...existing,
      profileId:profile.id,classId:exactClassId,classLevel:Math.max(1,Number(row.level)||1),active:true,orphaned:false
    };
  }

  for(const [key,rawBucket] of Object.entries({...state})){
    const bucket=cloneBucket(rawBucket),classId=bucket.classId||key,profile=profileData(bucket.profileId)||spellAcquisitionProfile35(classId);
    if(!profile)continue;
    const row=activeClasses.get(cleanId(classId));
    if(!row){
      for(const acquisition of bucket.acquisitions||[])retiredPairs.add(runtimeGroupKey(classId,acquisition.spellKey));
      if(profile.kind==='spellbook'){
        state[key]={...bucket,classId,active:false,orphaned:true};
      }else delete state[key];
      continue;
    }

    const reasons=[];
    let acquisitions=bucket.acquisitions||[];
    if(profile.kind==='spellbook'){
      acquisitions=acquisitions.map(acquisition=>{
        const prohibited=isProhibitedWizardSpell(character,classId,acquisition);
        if(prohibited&&(acquisition.active!==false||acquisition.suspendedByRule==='prohibited-school')){
          retiredPairs.add(runtimeGroupKey(classId,acquisition.spellKey));
          reasons.push((acquisition.spellName||acquisition.spellKey)+' is from a prohibited Wizard school.');
          return {...acquisition,active:false,suspendedByRule:'prohibited-school',invalidReason:'Prohibited Wizard school'};
        }
        if(!prohibited&&acquisition.suspendedByRule==='prohibited-school'){
          const next={...acquisition,active:true};
          delete next.suspendedByRule;delete next.invalidReason;
          return next;
        }
        return acquisition;
      });
    }
    if(profile.kind==='known-table'){
      const limits=spellKnownLimits35(profile.id,Math.max(1,Number(row.level)||1));
      const counts={};
      for(const acquisition of acquisitions.filter(item=>item.active!==false&&item.affectsQuota!==false)){
        const level=Number(acquisition.spellLevel);
        counts[level]=(counts[level]||0)+1;
        if(!Object.prototype.hasOwnProperty.call(limits,level))reasons.push((acquisition.spellName||acquisition.spellKey)+' is not a legal known-spell level at class level '+row.level+'.');
      }
      for(const [level,count] of Object.entries(counts)){
        const limit=Number(limits[level]||0);
        if(count>limit)reasons.push('Known-spell quota exceeded at spell level '+level+': '+count+' owned, '+limit+' allowed.');
      }
    }
    for(const acquisition of acquisitions){
      if(!acquisition.spellKey)reasons.push('An acquisition is missing a stable spell identity.');
      if(!acquisition.spell&&acquisition.active!==false)reasons.push((acquisition.spellName||acquisition.spellKey||'A spell')+' is missing its persisted spell record.');
    }
    state[key]={...bucket,classId,profileId:profile.id,classLevel:Math.max(1,Number(row.level)||1),active:true,orphaned:false,acquisitions,incompleteReasons:[...new Set(reasons)]};
    if(reasons.length)incomplete.push({classId,reasons:[...new Set(reasons)]});
  }

  const groups=new Map();
  for(const [stateKey,bucket] of Object.entries(state)){
    if(bucket?.active===false)continue;
    const classId=bucket.classId||stateKey;
    for(const acquisition of bucket.acquisitions||[]){
      if(acquisition?.active===false)continue;
      const keyValue=String(acquisition.spellKey||'');
      if(!keyValue)continue;
      const groupKey=runtimeGroupKey(classId,keyValue);
      if(!groups.has(groupKey))groups.set(groupKey,{classId,spellKey:keyValue,profileId:bucket.profileId,acquisitions:[]});
      groups.get(groupKey).acquisitions.push(acquisition);
    }
  }

  const existing=Array.isArray(character?.spells)?character.spells:[];
  const used=new Set(),runtime=[];
  for(const group of groups.values()){
    const acquisition=group.acquisitions[0],snapshot=minimalSpell(acquisition);
    let index=existing.findIndex((spell,i)=>!used.has(i)&&managedRuntime(spell)&&cleanId(spell.spellAcquisitionClassId||spell.castingClassId)===cleanId(group.classId)&&runtimeSpellKey(spell)===group.spellKey);
    if(index<0)index=existing.findIndex((spell,i)=>!used.has(i)&&!managedRuntime(spell)&&!spell.auto&&!spell.featSpellGrant&&cleanId(spell.castingClassId||'')===cleanId(group.classId)&&runtimeSpellKey(spell)===group.spellKey);
    const old=index>=0?existing[index]:null;
    if(index>=0)used.add(index);
    const profile=profileData(group.profileId);
    runtime.push({
      ...snapshot,
      ...(old||{}),
      id:old?.id||('spell-acquisition:'+group.classId+':'+group.spellKey),
      castingClassId:group.classId,
      spellAcquisitionClassId:group.classId,
      spellAcquisitionIds:group.acquisitions.map(item=>item.id).filter(Boolean).sort(),
      spellAcquisitionOrigins:[...new Set(group.acquisitions.map(item=>item.origin).filter(Boolean))],
      prepared:old?.prepared??(profile?.kind==='known-table')
    });
  }

  const preserved=existing.filter((spell,index)=>{
    if(used.has(index)||managedRuntime(spell))return false;
    const classId=spell.castingClassId;
    if(!classId)return true;
    const pair=runtimeGroupKey(classId,runtimeSpellKey(spell));
    return !retiredPairs.has(pair);
  });

  return {...character,spellAcquisition35:state,spellAcquisition35Incomplete:incomplete,spells:[...preserved,...runtime]};
}
