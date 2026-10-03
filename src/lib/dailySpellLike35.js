import {adjustResource} from './resources.js';

const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const norm=value=>String(value||'').trim().toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const spellKey=spell=>String(spell?.catalogId||spell?.id||spell?.index||spell?.name||'');
const words={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9};

const profiles={
  'classes/factotum-35':{
    id:'factotum-arcane-dilettante-35',
    kind:'daily-limited-spell-like',
    className:'Factotum',
    spellLists:['Sorcerer','Wizard'],
    ability:'int',
    resourceName:'Inspiration',
    resourceCost:1,
    sourceUrl:'https://new.dndtools.org/classes/factotum-35',
    countByLevel:{2:1,4:2,7:3,9:4,12:5,14:6,17:7,20:8},
    maxLevelByLevel:{1:-1,2:0,3:1,4:1,5:2,6:2,7:2,8:3,9:3,10:4,11:4,12:4,13:5,14:5,15:6,16:6,17:6,18:7,19:7,20:7},
    maximumLevelChoices:1
  }
};

function profileFor(value){
  const id=cleanId(typeof value==='string'?value:value?.catalogId||value?.id||value?.sourceId);
  const profile=profiles[id];
  return profile?{...profile,classId:id}:null;
}
export function dailySpellLikeProfile35(value){return profileFor(value);}

function activeClassRow(character,classId){
  const wanted=cleanId(classId);
  return (character?.classLevels||[]).find(row=>cleanId(row?.catalogId||row?.definition?.catalogId||row?.definition?.id||row?.definition?.sourceId)===wanted)
    ||(cleanId(character?.classDefinition?.catalogId||character?.classDefinition?.id||character?.classDefinition?.sourceId)===wanted
      ?{catalogId:classId,name:character.className,level:character.level,edition:character.ruleset}:null);
}
function stepped(table,level,fallback=0){
  let value=fallback;
  for(const [at,next] of Object.entries(table||{}).map(([k,v])=>[Number(k),Number(v)]).filter(([k,v])=>Number.isFinite(k)&&Number.isFinite(v)).sort((a,b)=>a[0]-b[0])){
    if(at>level)break;
    value=next;
  }
  return value;
}
function stateEntry(character,classId){
  const state=character?.dailySpellLike35||{},wanted=cleanId(classId);
  const key=Object.keys(state).find(id=>cleanId(id)===wanted);
  return key?{key,bucket:state[key]}:{key:classId,bucket:null};
}
export function dailySpellLikePlan35(character,classId){
  const profile=profileFor(classId),row=profile&&activeClassRow(character,classId);
  if(!profile||!row)return {supported:false,count:0,maxLevel:-1,ready:false,classLevel:0,profile:null};
  const classLevel=Math.max(0,Number(row.level)||0);
  const count=stepped(profile.countByLevel,classLevel,0),maxLevel=stepped(profile.maxLevelByLevel,classLevel,-1);
  const {bucket}=stateEntry(character,classId);
  return {supported:true,profile,classId:row.catalogId||classId,classLevel,count,maxLevel,ready:count>0&&bucket?.ready!==false,selections:bucket?.selections||[]};
}

function spellListLevel(profile,spell){
  const levels=[];
  for(const list of profile?.spellLists||[]){
    const value=spell?.classLevels?.[list];
    if(Number.isInteger(Number(value)))levels.push(Number(value));
    else if((spell?.classes||[]).map(item=>String(item?.name||item)).includes(list)&&Number.isInteger(Number(spell?.level)))levels.push(Number(spell.level));
  }
  return levels.length?Math.min(...levels):null;
}
function hasXpCost(spell){
  return (Array.isArray(spell?.components)?spell.components:String(spell?.components||'').split(/[, ]+/)).some(component=>/^xp$/i.test(String(component).trim()));
}
function eligibleSpell(profile,spell,maxLevel){
  const level=spellListLevel(profile,spell);
  if(!Number.isInteger(level)||level<0||level>maxLevel)return null;
  if(spell?.edition&&!['3.5','3.5-reference'].includes(spell.edition))return null;
  if(hasXpCost(spell))return null;
  return {...spell,level,dailySpellLikeBaseLevel:level};
}
export function dailySpellLikeCandidates35(character,classId,spells=[]){
  const plan=dailySpellLikePlan35(character,classId);
  if(!plan.supported||plan.count<=0)return [];
  return (Array.isArray(spells)?spells:[]).map(spell=>eligibleSpell(plan.profile,spell,plan.maxLevel)).filter(Boolean);
}

function featText(feat){
  return [feat?.effectSummary,feat?.effect,feat?.normalRule,feat?.specialSummary,feat?.specialRule].filter(Boolean).join(' ');
}
function numberWord(value){
  const raw=String(value||'').toLowerCase();
  return Object.prototype.hasOwnProperty.call(words,raw)?words[raw]:Number(raw);
}
export function metamagicLevelAdjustment35(feat,{baseLevel=0,targetLevel=null}={}){
  if(!feat||!/metamagic/i.test(String(feat.featType||'')))return null;
  const name=String(feat.name||''),text=featText(feat);
  if(/^sudden\b/i.test(name)||/without (?:increasing|raising) (?:the )?(?:spell(?:'s)? )?level[^.]{0,80}without (?:specially )?prepar/i.test(text))return null;
  if(/^heighten spell$/i.test(name)){
    const target=Number(targetLevel),base=Math.max(0,Number(baseLevel)||0);
    if(!Number.isInteger(target)||target<=base||target>9)return null;
    return target-base;
  }
  let match=text.match(/(?:spell )?slot(?: of)?\s+(?:a|the)?\s*(zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s+levels?\s+higher/i)
    ||text.match(/(?:uses?|requires?)\s+(?:up )?(?:a|the)?\s*(?:spell )?slot\s+(zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s+levels?\s+higher/i);
  if(match){
    const value=numberWord(match[1]);
    return Number.isFinite(value)?value:null;
  }
  if(/(?:slot|spell slot)\s+(?:of |at )?(?:the |its )?(?:spell(?:'s)? )?normal level|uses? (?:a )?(?:spell )?slot of (?:the |its )?(?:spell(?:'s)? )?normal level|does not (?:increase|raise) (?:the )?(?:spell(?:'s)? )?level|without increasing (?:the )?(?:spell(?:'s)? )?level/i.test(text))return 0;
  return null;
}

function ownedMetamagic(character,name){
  const wanted=norm(name);
  return (character?.feats||[]).find(feat=>norm(feat?.name)===wanted&&/metamagic/i.test(String(feat?.featType||'')))||null;
}
export function dailySpellLikeMetamagicOptions35(character,spell,maxLevel){
  const base=Math.max(0,Number(spell?.dailySpellLikeBaseLevel??spell?.level)||0),out=[];
  for(const feat of character?.feats||[]){
    if(!/metamagic/i.test(String(feat?.featType||''))||/^sudden\b/i.test(String(feat?.name||'')))continue;
    if(/^heighten spell$/i.test(String(feat.name||''))){
      if(base<maxLevel)out.push({name:feat.name,variable:true,minTarget:base,maxTarget:maxLevel,source:feat});
      continue;
    }
    const adjustment=metamagicLevelAdjustment35(feat,{baseLevel:base});
    if(adjustment==null||base+adjustment>maxLevel)continue;
    out.push({name:feat.name,adjustment,variable:false,source:feat});
  }
  return out.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
}

function resolveMetamagic(character,spell,choices,maxLevel){
  const base=Math.max(0,Number(spell.dailySpellLikeBaseLevel??spell.level)||0),seen=new Set();
  let fixedAdjustment=0,heightenTarget=base;
  const resolved=[];
  for(const raw of Array.isArray(choices)?choices:[]){
    const name=String(raw?.name||raw||'').trim(),key=norm(name);
    if(!name||seen.has(key))throw Error('Choose distinct metamagic feats for an Arcane Dilettante spell.');
    seen.add(key);
    const feat=ownedMetamagic(character,name);
    if(!feat)throw Error('Arcane Dilettante can apply only a metamagic feat the character owns.');
    const targetLevel=raw?.targetLevel==null?null:Number(raw.targetLevel);
    const adjustment=metamagicLevelAdjustment35(feat,{baseLevel:base,targetLevel});
    if(adjustment==null)throw Error('This metamagic feat does not have a source-safe preparation level adjustment.');
    if(/^heighten spell$/i.test(feat.name))heightenTarget=Math.max(heightenTarget,targetLevel);
    else fixedAdjustment+=adjustment;
    resolved.push({name:feat.name,adjustment,...(/^heighten spell$/i.test(feat.name)?{targetLevel}:{})});
  }
  const preparedLevel=heightenTarget+fixedAdjustment,effectiveLevel=heightenTarget;
  if(preparedLevel>maxLevel)throw Error('The metamagic-adjusted Arcane Dilettante spell exceeds the maximum spell level.');
  return {metamagic:resolved,modifiedLevel:preparedLevel,effectiveLevel};
}
function selectionId(spell,metamagic,index){
  const suffix=(metamagic||[]).map(item=>norm(item.name)+(item.targetLevel!=null?'-'+item.targetLevel:'')).join('-')||'plain';
  return 'daily-spell-like:'+norm(spell?.name)+':'+suffix+':'+index;
}
function runtimeSpell(classId,selection){
  return {
    ...selection.spell,
    id:'daily-spell-like-runtime:'+cleanId(classId)+':'+selection.id,
    catalogId:selection.spell.catalogId||selection.spell.id,
    level:selection.baseLevel,
    castingClassId:classId,
    prepared:true,
    dailySpellLikeGrant:true,
    spellLikeAbility:true,
    dailySpellLikeClassId:classId,
    dailySpellLikeSelectionId:selection.id,
    dailySpellLikeModifiedLevel:selection.modifiedLevel,
    dailySpellLikeEffectiveLevel:selection.effectiveLevel,
    dailySpellLikeMetamagic:selection.metamagic,
    dailySpellLikeUsed:Boolean(selection.used)
  };
}

export function prepareDailySpellLike35(character,classId,selections=[]){
  const plan=dailySpellLikePlan35(character,classId);
  if(!plan.supported||plan.count<=0)throw Error('This class does not have a daily spell-like repertoire at the current level.');
  const existing=stateEntry(character,classId).bucket;
  if(existing?.ready===false)throw Error('This daily spell-like repertoire is already prepared; complete the required daily recovery before replacing it.');
  if(!Array.isArray(selections)||selections.length!==plan.count)throw Error('Choose exactly '+plan.count+' Arcane Dilettante spell'+(plan.count===1?'':'s')+'.');
  const names=new Set(),prepared=[];
  for(const [index,input] of selections.entries()){
    const spell=eligibleSpell(plan.profile,input?.spell,plan.maxLevel);
    if(!spell)throw Error('Choose an eligible Sorcerer/Wizard spell within the Factotum maximum spell level and without an XP cost.');
    const name=norm(spell.name);
    if(names.has(name))throw Error('Arcane Dilettante spells must be distinct; the same spell cannot be prepared multiple times.');
    names.add(name);
    const meta=resolveMetamagic(character,spell,input?.metamagic,plan.maxLevel);
    prepared.push({
      id:selectionId(spell,meta.metamagic,index),
      spellKey:spellKey(spell),spellName:spell.name,baseLevel:spell.level,
      modifiedLevel:meta.modifiedLevel,effectiveLevel:meta.effectiveLevel,metamagic:meta.metamagic,
      used:false,spell
    });
  }
  if(prepared.filter(row=>row.modifiedLevel===plan.maxLevel).length>Number(plan.profile.maximumLevelChoices||1)){
    throw Error('Arcane Dilettante can prepare a maximum of one spell at the current maximum spell level.');
  }
  const state={...(character.dailySpellLike35||{})};
  const prior=stateEntry(character,classId),key=prior.key||classId;
  state[key]={profileId:plan.profile.id,classId:key,classLevel:plan.classLevel,ready:false,selections:prepared};
  const preserved=(character.spells||[]).filter(spell=>!(spell.dailySpellLikeGrant&&cleanId(spell.dailySpellLikeClassId||spell.castingClassId)===cleanId(classId)));
  return {...character,dailySpellLike35:state,spells:[...preserved,...prepared.map(row=>runtimeSpell(key,row))]};
}

function inspirationResource(character,classId,profile){
  const wanted=cleanId(classId),name=norm(profile.resourceName);
  return (character.resources||[]).find(resource=>
    norm(resource?.name)===name&&(
      cleanId(resource?.sourceClassId)===wanted
      ||String(resource?.classResourceKey||'').includes(wanted)
      ||String(resource?.id||'').includes(wanted)
    )
  )||(character.resources||[]).find(resource=>norm(resource?.name)===name);
}
export function spendDailySpellLike35(character,classId,selectionIdValue){
  const plan=dailySpellLikePlan35(character,classId),entry=stateEntry(character,classId),bucket=entry.bucket;
  if(!plan.supported||!bucket||bucket.ready!==false)throw Error('Prepare the daily spell-like repertoire before using it.');
  const selection=(bucket.selections||[]).find(row=>row.id===selectionIdValue);
  if(!selection)throw Error('Choose a prepared daily spell-like ability.');
  if(selection.used)throw Error('This Arcane Dilettante spell has already been used today.');
  const resource=inspirationResource(character,classId,plan.profile);
  if(!resource)throw Error('Factotum Inspiration resource is unavailable.');
  let resourcePatch;
  try{resourcePatch=adjustResource(character,resource.id,Number(plan.profile.resourceCost)||1,character.abilities);}catch(error){
    throw Error(/Not enough/i.test(error.message)?'Not enough Inspiration remains to use Arcane Dilettante.':error.message);
  }
  const nextSelections=(bucket.selections||[]).map(row=>row.id===selection.id?{...row,used:true}:row);
  const state={...(character.dailySpellLike35||{}),[entry.key]:{...bucket,selections:nextSelections}};
  const spells=(character.spells||[]).map(spell=>spell.dailySpellLikeSelectionId===selection.id&&cleanId(spell.dailySpellLikeClassId||spell.castingClassId)===cleanId(classId)?{...spell,dailySpellLikeUsed:true}:spell);
  return {...character,...resourcePatch,dailySpellLike35:state,spells};
}
export function restDailySpellLike35(character,rest='long'){
  if(rest!=='long')return character;
  const state={...(character.dailySpellLike35||{})};
  const affected=new Set();
  for(const [key,bucket] of Object.entries(state)){
    if(bucket?.profileId!=='factotum-arcane-dilettante-35')continue;
    affected.add(cleanId(bucket.classId||key));
    state[key]={...bucket,ready:true,selections:[]};
  }
  if(!affected.size)return character;
  const spells=(character.spells||[]).filter(spell=>!(spell.dailySpellLikeGrant&&affected.has(cleanId(spell.dailySpellLikeClassId||spell.castingClassId))));
  return {...character,dailySpellLike35:state,spells};
}


export function reconcileDailySpellLike35(character){
  const state={...(character?.dailySpellLike35||{})},activeRows=character?.classLevels||[];
  const retired=new Set();
  for(const [key,bucket] of Object.entries(state)){
    const profile=Object.values(profiles).find(item=>item.id===bucket?.profileId);
    if(!profile)continue;
    const classId=bucket.classId||key,wanted=cleanId(classId);
    const row=activeRows.find(item=>cleanId(item?.catalogId||item?.definition?.catalogId||item?.definition?.id||item?.definition?.sourceId)===wanted);
    const classLevel=Math.max(0,Number(row?.level)||0),count=row?stepped(profile.countByLevel,classLevel,0):0,maxLevel=row?stepped(profile.maxLevelByLevel,classLevel,-1):-1;
    const selections=Array.isArray(bucket?.selections)?bucket.selections:[];
    const invalid=!row||count<=0||selections.length>count||selections.some(selection=>Number(selection?.modifiedLevel)>maxLevel);
    if(invalid){
      retired.add(wanted);
      delete state[key];
      continue;
    }
    state[key]={...bucket,classId:key};
  }
  const spells=(character?.spells||[]).filter(spell=>!(spell?.dailySpellLikeGrant&&retired.has(cleanId(spell.dailySpellLikeClassId||spell.castingClassId))));
  return {...character,dailySpellLike35:state,spells};
}
