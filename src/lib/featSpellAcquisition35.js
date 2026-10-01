import rules from '../data/feat-spell-acquisition35.json' with {type:'json'};
import {characterClasses} from './advancement.js';
import {spellAcquisitionProfile35,activeAcquiredSpells35} from './spellAcquisition35.js';

export const FEAT_SPELL_ACQUISITION35_VERSION=1;

const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const norm=value=>String(value?.name||value||'').trim().toLowerCase().replaceAll('’',"'");
const spellKey=spell=>String(spell?.catalogId||spell?.spellKey||spell?.id||spell?.index||spell?.name||'').trim();
const featCatalogId=feat=>cleanId(feat?.catalogId||feat?.sourceId||feat?.definition?.catalogId||'');
const clone=value=>value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value;
const classListNames=spell=>{
  const names=new Set((Array.isArray(spell?.classes)?spell.classes:[]).map(norm));
  for(const name of Object.keys(spell?.classLevels||{}))names.add(norm(name));
  return names;
};
const abilityScore=(character,key)=>(Number(character?.abilities?.[key])||0)+(Number(character?.abilityBonuses?.[key])||0);

function rawProfile(feat){
  if(!feat||typeof feat!=='object'||(feat.edition&&feat.edition!=='3.5'))return null;
  if(feat.spellAcquisition35&&typeof feat.spellAcquisition35==='object')return {...feat.spellAcquisition35,embedded:true};
  const config=rules.feats?.[featCatalogId(feat)];
  return config?{...config}:null;
}

export function featSpellAcquisitionProfile35(feat){
  const profile=rawProfile(feat);
  if(!profile)return null;
  return {
    effect:String(profile.effect||''),
    count:Math.max(0,Math.floor(Number(profile.count)||0)),
    required:profile.required!==false,
    affectsQuota:profile.affectsQuota===true,
    repeatable:profile.repeatable===true,
    fixedSpellIds:Array.isArray(profile.fixedSpellIds)?profile.fixedSpellIds.map(String):[],
    allowedLists:Array.isArray(profile.allowedLists)?profile.allowedLists.map(String):[],
    allowedLevels:Array.isArray(profile.allowedLevels)?profile.allowedLevels.map(Number).filter(Number.isInteger):[],
    maxSpellLevelOffset:Number.isFinite(Number(profile.maxSpellLevelOffset))?Number(profile.maxSpellLevelOffset):null,
    listRule:profile.listRule||null,
    target:profile.target||'acquisition-class',
    sourceUrl:profile.sourceUrl||feat.sourceUrl||null,
    embedded:Boolean(profile.embedded)
  };
}

function supportedTargets(character){
  return characterClasses(character).map(row=>{
    const classId=row.catalogId||row.definition?.catalogId||row.definition?.id||row.definition?.sourceId||'';
    const profile=spellAcquisitionProfile35(classId||row.definition);
    return profile?{classId,name:row.name,level:Math.max(1,Number(row.level)||1),profile}:null;
  }).filter(Boolean);
}

function prohibitedSchools(character,classId){
  const all=character?.legacyCastingChoices||{};
  const exact=all[classId]||all[Object.keys(all).find(key=>cleanId(key)===cleanId(classId))]||{};
  return new Set((exact.prohibited||[]).map(norm));
}

function legalForTarget(spell,target,profile,character){
  const key=spellKey(spell);
  if(!key||spell?.edition&&spell.edition!=='3.5')return false;
  const level=Number(spell?.level);
  if(!Number.isInteger(level)||level<0||level>9)return false;
  if(profile.allowedLevels.length&&!profile.allowedLevels.includes(level))return false;
  if(Number.isInteger(profile.maxSpellLevel)&&level>profile.maxSpellLevel)return false;
  const lists=classListNames(spell);
  if(profile.allowedLists.length&&!profile.allowedLists.some(name=>lists.has(norm(name))))return false;
  if(profile.listRule==='target-class-list'&&!lists.has(norm(target.name)))return false;
  if(target.profile.id==='wizard-35'&&prohibitedSchools(character,target.classId).has(norm(spell.school)))return false;
  const owned=new Set(activeAcquiredSpells35(character,target.classId).map(item=>String(item.spellKey||'')));
  return !owned.has(key);
}

export function featSpellAcquisitionPlan35(feat,character,spells=[]){
  const profile=featSpellAcquisitionProfile35(feat);
  if(!profile)return {supported:false,effect:null,requiresAcquisition:false,requiresChoice:false,complete:true,targetClasses:[],options:[]};
  if(profile.effect==='access-only')return {
    supported:true,effect:'access-only',requiresAcquisition:false,requiresChoice:false,complete:true,
    count:profile.count,required:false,affectsQuota:false,repeatable:profile.repeatable,targetClasses:[],options:[]
  };

  const targets=supportedTargets(character).map(target=>{
    const highest=Math.max(0,Number(target.profile.maxSpellLevelByClassLevel?.[String(target.level)])||0);
    const maxSpellLevel=profile.maxSpellLevelOffset==null?highest:Math.max(0,highest+profile.maxSpellLevelOffset);
    return {...target,maxSpellLevel};
  });
  const selectedTargetId=feat?.spellAcquisitionChoices35?.targetClassId;
  const target=targets.find(item=>item.classId===selectedTargetId)||(targets.length===1?targets[0]:null);
  const effect=target?.profile.kind==='spellbook'?'spellbook-entry':target?.profile.kind==='known-table'?'known-spell':profile.effect;
  const fixedIds=profile.fixedSpellIds;
  const fixedEntries=fixedIds.map(id=>(Array.isArray(spells)?spells:[]).find(spell=>spellKey(spell)===id)).filter(Boolean);
  const effectiveProfile={...profile,maxSpellLevel:target?.maxSpellLevel};
  const options=target?(Array.isArray(spells)?spells:[]).filter(spell=>legalForTarget(spell,target,effectiveProfile,character)):[];
  const fixed=fixedIds.length>0;
  return {
    supported:true,
    profile,
    effect,
    count:profile.count,
    required:profile.required,
    affectsQuota:profile.affectsQuota,
    repeatable:profile.repeatable,
    targetClasses:targets.map(({classId,name,level,maxSpellLevel,profile:p})=>({classId,name,level,maxSpellLevel,profileId:p.id})),
    targetClassId:target?.classId||'',
    maxSpellLevel:target?.maxSpellLevel??null,
    fixed,
    fixedEntries,
    requiresAcquisition:true,
    requiresChoice:!fixed&&(targets.length!==1||profile.count>0),
    options
  };
}

function choiceEntriesValid(feat,character,plan){
  const choices=feat?.spellAcquisitionChoices35;
  if(!choices||choices.effect!==plan.effect||!choices.targetClassId)return false;
  if(!plan.targetClasses.some(target=>target.classId===choices.targetClassId))return false;
  const entries=Array.isArray(choices.entries)?choices.entries:[];
  if(entries.length!==Number(plan.count||0))return false;
  const target=plan.targetClasses.find(item=>item.classId===choices.targetClassId);
  const sourceTarget=supportedTargets(character).find(item=>item.classId===choices.targetClassId);
  if(!target||!sourceTarget)return false;
  const effective={...plan.profile,maxSpellLevel:target.maxSpellLevel};
  return entries.every(entry=>legalForTarget(entry,sourceTarget,effective,{...character,spellAcquisition35:character.spellAcquisition35||{}})||
    activeAcquiredSpells35(character,choices.targetClassId).some(item=>item.spellKey===spellKey(entry)&&item.origin==='feat'&&item.sourceFeatInstanceId===feat.id));
}

export function featSpellAcquisitionComplete35(feat,character){
  const plan=featSpellAcquisitionPlan35(feat,character,feat?.spellAcquisitionChoices35?.entries||[]);
  if(!plan.supported||!plan.requiresAcquisition)return true;
  return choiceEntriesValid(feat,character,plan);
}

export function setFeatSpellAcquisitionChoices35(feat,character,{targetClassId='',spellIds=[]}={},spells=[]){
  const basePlan=featSpellAcquisitionPlan35({...feat,spellAcquisitionChoices35:{...(feat.spellAcquisitionChoices35||{}),targetClassId}},character,spells);
  if(!basePlan.supported||!basePlan.requiresAcquisition)throw Error('This feat does not create a spell acquisition.');
  const actualTarget=targetClassId||(basePlan.targetClasses.length===1?basePlan.targetClasses[0].classId:'');
  const target=basePlan.targetClasses.find(item=>item.classId===actualTarget);
  if(!target)throw Error('Choose which supported class receives this feat spell.');
  const targetRow=supportedTargets(character).find(item=>item.classId===actualTarget);
  const effective={...basePlan.profile,maxSpellLevel:target.maxSpellLevel};
  const ids=Array.isArray(spellIds)?spellIds.map(String):[];
  if(ids.length!==basePlan.count||new Set(ids).size!==ids.length)throw Error('Choose exactly '+basePlan.count+' spell'+(basePlan.count===1?'':'s')+' for this feat.');
  const entries=ids.map(id=>(Array.isArray(spells)?spells:[]).find(spell=>spellKey(spell)===id));
  if(entries.some(entry=>!entry))throw Error('One or more selected feat spells are unavailable.');
  if(entries.some(entry=>!legalForTarget(entry,targetRow,effective,character)))throw Error('Choose only legal spells for this feat and target class.');
  const effect=targetRow.profile.kind==='spellbook'?'spellbook-entry':'known-spell';
  return {
    ...feat,
    spellAcquisitionChoices35:{
      sourceFeatCatalogId:featCatalogId(feat),
      targetClassId:actualTarget,
      effect,
      affectsQuota:basePlan.affectsQuota,
      entries:entries.map(clone)
    }
  };
}

export function autoResolveFeatSpellAcquisition35(feat,character,spells=[]){
  const plan=featSpellAcquisitionPlan35(feat,character,spells);
  if(!plan.supported||!plan.requiresAcquisition||!plan.fixed)return feat;
  const targetClassId=feat?.spellAcquisitionChoices35?.targetClassId||(plan.targetClasses.length===1?plan.targetClasses[0].classId:'');
  if(!targetClassId)return feat;
  if(plan.fixedEntries.length!==plan.count)return feat;
  return setFeatSpellAcquisitionChoices35(feat,character,{targetClassId,spellIds:plan.fixedEntries.map(spellKey)},spells);
}
