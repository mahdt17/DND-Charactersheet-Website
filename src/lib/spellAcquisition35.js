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
