import data from '../data/spell-acquisition35.json' with {type:'json'};

export const FEAT_SPELL_ACQUISITION35_VERSION=1;

const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const norm=value=>String(value?.name||value||'').trim().toLowerCase().replaceAll('’',"'");
const keyOf=spell=>String(spell?.catalogId||spell?.spellKey||spell?.id||spell?.index||spell?.name||'').trim();
const classNames=spell=>{
  const values=[...(Array.isArray(spell?.classes)?spell.classes:[])];
  for(const name of Object.keys(spell?.classLevels||{}))values.push(name);
  return values.map(x=>norm(x?.name||x)).filter(Boolean);
};
const mapping={
  'feats/extra-spell-1044':{effect:'learned-spell',count:1,affectsQuota:false,required:true,repeatable:true,maxBelowHighest:1},
  'feats/extra-spell-1045':{effect:'learned-spell',count:1,affectsQuota:false,required:true,repeatable:true,maxBelowHighest:1},
  'feats/spell-reprieve-2709':{effect:'access-only',count:0,affectsQuota:false,required:false,repeatable:false}
};
const sourceKey=feat=>cleanId(feat?.catalogId||feat?.sourceId||feat?.id||'');
const profileForClassId=classId=>{
  const source=cleanId(classId),profileId=data.sourceMappings?.[source],profile=data.profiles?.[profileId];
  return profile?{id:profileId,...profile}:null;
};
const activeRows=character=>Array.isArray(character?.classLevels)?character.classLevels:[];
const ownedKeys=(character,classId)=>{
  const state=character?.spellAcquisition35||{},normalized=cleanId(classId);
  const key=Object.keys(state).find(candidate=>cleanId(candidate)===normalized);
  return new Set((key?state[key]?.acquisitions:[]||[]).filter(item=>item?.active!==false).map(item=>String(item.spellKey||'')));
};
const targetRows=(character,rawProfile)=>{
  const requested=cleanId(rawProfile?.targetClassId||'');
  return activeRows(character).flatMap(row=>{
    const classId=String(row.catalogId||row.definition?.catalogId||row.definition?.id||row.definition?.sourceId||'');
    if(!classId||requested&&cleanId(classId)!==requested)return [];
    const profile=profileForClassId(classId);
    if(!profile)return [];
    return [{classId,name:row.name||profile.className,level:Math.max(1,Number(row.level)||1),profileId:profile.id,kind:profile.kind,profile}];
  });
};
const resolvedEffect=(base,target)=>{
  if(base==='access-only')return 'access-only';
  if(base==='known-spell'||base==='spellbook-entry')return base;
  if(base==='learned-spell')return target?.kind==='spellbook'?'spellbook-entry':'known-spell';
  return base||'';
};
const maxLevelFor=(rawProfile,target)=>{
  if(!target)return null;
  const highest=Math.max(0,Number(target.profile?.maxSpellLevelByClassLevel?.[String(target.level)])||0);
  if(Number.isInteger(Number(rawProfile?.maxSpellLevel)))return Math.max(0,Number(rawProfile.maxSpellLevel));
  if(Number.isInteger(Number(rawProfile?.maxBelowHighest)))return Math.max(0,highest-Number(rawProfile.maxBelowHighest));
  return highest;
};
const candidateMatchesClass=(spell,target)=>{
  if(!target)return false;
  const names=classNames(spell);
  return !names.length||names.includes(norm(target.name||target.profile?.className));
};
const directProfile=feat=>{
  if(!feat?.spellAcquisition35||typeof feat.spellAcquisition35!=='object')return null;
  const p=feat.spellAcquisition35;
  if(!['known-spell','spellbook-entry','access-only','learned-spell'].includes(p.effect))return null;
  return {
    effect:p.effect,
    count:Math.max(0,Number(p.count??(p.fixedSpellIds?.length||1))||0),
    fixedSpellIds:Array.isArray(p.fixedSpellIds)?p.fixedSpellIds.map(String):[],
    allowedSpellIds:Array.isArray(p.allowedSpellIds)?p.allowedSpellIds.map(String):[],
    allowedLevels:Array.isArray(p.allowedLevels)?p.allowedLevels.map(Number).filter(Number.isInteger):[],
    targetClassId:p.targetClassId||'',
    affectsQuota:p.affectsQuota===true,
    required:p.required!==false,
    repeatable:Boolean(p.repeatable),
    maxSpellLevel:Number.isInteger(Number(p.maxSpellLevel))?Number(p.maxSpellLevel):undefined,
    maxBelowHighest:Number.isInteger(Number(p.maxBelowHighest))?Number(p.maxBelowHighest):undefined
  };
};

export function featSpellAcquisitionProfile35(feat){
  if(!feat||feat.edition!=='3.5')return null;
  const direct=directProfile(feat);
  if(direct)return direct;
  const mapped=mapping[sourceKey(feat)];
  return mapped?{...mapped}:null;
}

export function featSpellAcquisitionPlan35(feat,character,spells=[]){
  const raw=featSpellAcquisitionProfile35(feat);
  if(!raw)return {supported:false,complete:true,requiresAcquisition:false,targetClasses:[],options:[],fixedSpells:[]};
  const targets=targetRows(character,raw);
  const selectedTargetId=String(feat?.spellAcquisitionChoices35?.targetClassId||raw.targetClassId||'');
  const target=targets.find(item=>cleanId(item.classId)===cleanId(selectedTargetId))||(targets.length===1?targets[0]:null);
  const effect=resolvedEffect(raw.effect,target);
  if(effect==='access-only')return {
    supported:true,profile:raw,effect,targetClasses:targets,targetClass:target,count:0,required:false,
    requiresAcquisition:false,requiresChoice:false,fixed:false,complete:true,options:[],fixedSpells:[]
  };
  const maxSpellLevel=maxLevelFor(raw,target),owned=target?ownedKeys(character,target.classId):new Set();
  const fixedSet=new Set(raw.fixedSpellIds||[]),allowedSet=new Set(raw.allowedSpellIds||[]);
  const eligible=(Array.isArray(spells)?spells:[]).filter(spell=>{
    const key=keyOf(spell),level=Number(spell?.level);
    if(!key||spell?.edition&&spell.edition!=='3.5'||!Number.isInteger(level)||level<0)return false;
    if(target&&!candidateMatchesClass(spell,target))return false;
    if(Number.isInteger(maxSpellLevel)&&level>maxSpellLevel)return false;
    if(raw.allowedLevels?.length&&!raw.allowedLevels.includes(level))return false;
    if(allowedSet.size&&!allowedSet.has(key))return false;
    if(owned.has(key))return false;
    return true;
  });
  const fixedSpells=(raw.fixedSpellIds||[]).map(id=>(Array.isArray(spells)?spells:[]).find(spell=>keyOf(spell)===id)).filter(Boolean);
  const fixed=Boolean(raw.fixedSpellIds?.length);
  const requiresChoice=!fixed&&raw.required!==false&&Number(raw.count)>0;
  const entries=Array.isArray(feat?.spellAcquisitionChoices35?.entries)?feat.spellAcquisitionChoices35.entries:[];
  const complete=raw.required===false||fixed
    ?(fixed?Boolean(target&&fixedSpells.length===raw.fixedSpellIds.length&&entries.length===fixedSpells.length):true)
    :Boolean(target&&entries.length===Number(raw.count)&&entries.every(entry=>entry?.catalogId||entry?.spellKey||entry?.id));
  return {
    supported:true,profile:raw,effect,targetClasses:targets,targetClass:target,count:Number(raw.count)||0,
    affectsQuota:Boolean(raw.affectsQuota),required:raw.required!==false,repeatable:Boolean(raw.repeatable),
    maxSpellLevel,options:eligible,fixedSpells,fixed,requiresAcquisition:true,requiresChoice,complete
  };
}

export function featSpellAcquisitionComplete35(feat,character){
  const profile=featSpellAcquisitionProfile35(feat);
  if(!profile||profile.effect==='access-only'||profile.required===false)return true;
  const choices=feat?.spellAcquisitionChoices35;
  if(!choices)return false;
  const count=Math.max(0,Number(profile.count??(profile.fixedSpellIds?.length||1))||0);
  return Boolean(choices.targetClassId&&Array.isArray(choices.entries)&&choices.entries.length===count&&choices.entries.every(entry=>entry?.catalogId||entry?.spellKey||entry?.id));
}

export function setFeatSpellAcquisitionChoices35(feat,character,{targetClassId,spellIds=[]}={},spells=[]){
  const raw=featSpellAcquisitionProfile35(feat);
  if(!raw||raw.effect==='access-only')return feat;
  const provisional={...feat,spellAcquisitionChoices35:{targetClassId:String(targetClassId||''),entries:[]}};
  const plan=featSpellAcquisitionPlan35(provisional,character,spells);
  const target=plan.targetClasses.find(item=>cleanId(item.classId)===cleanId(targetClassId));
  if(!target)throw Error('Choose an active supported spellcasting class for this feat.');
  const ids=Array.isArray(spellIds)?spellIds.map(String).filter(Boolean):[];
  if(ids.length!==Number(plan.count||0)||new Set(ids).size!==ids.length)throw Error('Choose exactly '+Number(plan.count||0)+' spell'+(Number(plan.count||0)===1?'':'s')+' for this feat.');
  const byId=new Map(plan.options.map(spell=>[keyOf(spell),spell]));
  const entries=ids.map(id=>byId.get(id));
  if(entries.some(entry=>!entry))throw Error('Choose only legal spells for this feat.');
  return {...feat,spellAcquisitionChoices35:{
    targetClassId:target.classId,effect:plan.effect,affectsQuota:Boolean(plan.affectsQuota),
    entries:entries.map(spell=>({...spell}))
  }};
}

export function autoResolveFeatSpellAcquisition35(feat,character,spells=[]){
  const raw=featSpellAcquisitionProfile35(feat);
  if(!raw||raw.effect==='access-only'||!raw.fixedSpellIds?.length)return feat;
  const targets=targetRows(character,raw);
  const targetId=raw.targetClassId||feat?.spellAcquisitionChoices35?.targetClassId||(targets.length===1?targets[0].classId:'');
  if(!targetId)return feat;
  const all=Array.isArray(spells)?spells:[];
  const fixed=raw.fixedSpellIds.map(id=>all.find(spell=>keyOf(spell)===id)).filter(Boolean);
  if(fixed.length!==raw.fixedSpellIds.length)return feat;
  const target=targets.find(item=>cleanId(item.classId)===cleanId(targetId));
  if(!target)return feat;
  return {...feat,spellAcquisitionChoices35:{
    targetClassId:target.classId,effect:resolvedEffect(raw.effect,target),affectsQuota:Boolean(raw.affectsQuota),
    entries:fixed.map(spell=>({...spell}))
  }};
}

export function featSpellAcquisitionRecords35(feat,character){
  const raw=featSpellAcquisitionProfile35(feat);
  if(!raw||raw.effect==='access-only')return [];
  const choices=feat?.spellAcquisitionChoices35;
  if(!choices?.targetClassId||!Array.isArray(choices.entries))return [];
  const target=targetRows(character,{...raw,targetClassId:choices.targetClassId})[0];
  if(!target||choices.entries.length!==Number(raw.count||0))return [];
  const instanceId=String(feat.id||feat.catalogId||feat.sourceId||feat.name||'feat');
  return choices.entries.map((spell,index)=>({
    classId:target.classId,profileId:target.profileId,
    acquisition:{
      id:['feat',instanceId,keyOf(spell),index].join(':'),
      spellKey:keyOf(spell),spellName:String(spell.name||''),spellLevel:Number(spell.level),
      acquiredAtClassLevel:target.level,origin:'feat',sourceEventId:'feat:'+instanceId,
      sourceFeatInstanceId:instanceId,sourceFeatId:String(feat.catalogId||feat.sourceId||''),sourceFeatName:String(feat.name||'Feat'),
      acquisitionEffect:choices.effect||resolvedEffect(raw.effect,target),active:true,
      affectsQuota:Boolean(choices.affectsQuota??raw.affectsQuota),spell:{...spell}
    }
  }));
}
