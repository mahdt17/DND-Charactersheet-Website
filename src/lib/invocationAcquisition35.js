import catalogData from '../data/invocations35.json' with {type:'json'};
import profileData from '../data/invocation-acquisition35.json' with {type:'json'};

const grades=['least','lesser','greater','dark'];
const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const norm=value=>String(value||'').trim().toLowerCase();
const gradeIndex=value=>grades.indexOf(norm(value));
const keyOf=row=>String(row?.catalogId||row?.id||'');
const profileFor=classId=>profileData.profiles?.[cleanId(classId)]||null;
const classRows=character=>Array.isArray(character?.classLevels)?character.classLevels:[];
const activeRow=(character,classId)=>classRows(character).find(row=>cleanId(row?.catalogId||row?.definition?.catalogId||row?.definition?.id||row?.definition?.sourceId)===cleanId(classId));
const bucketFor=(character,classId)=>{
 const state=character?.invocationAcquisition35||{};
 if(state[classId])return state[classId];
 const key=Object.keys(state).find(candidate=>cleanId(candidate)===cleanId(classId));
 return key?state[key]:null;
};
const eventId=(classId,level,kind,suffix='all')=>`invocation35:${cleanId(classId)}:${level}:${kind}:${suffix}`;
const acquisitionKey=item=>String(item?.invocationKey||item?.catalogId||'');
function cloneBucket(bucket={}){return {...bucket,acquisitions:(bucket.acquisitions||[]).map(x=>({...x,invocation:x.invocation?{...x.invocation}:x.invocation})),replacements:(bucket.replacements||[]).map(x=>({...x}))};}
function activeRows(bucket){return bucket?.active===false?[]:(bucket?.acquisitions||[]).filter(item=>item.active!==false);}
function eventApplied(character,classId,id){return (bucketFor(character,classId)?.acquisitions||[]).some(item=>item.sourceEventId===id);}
function replacementApplied(character,classId,id){return (bucketFor(character,classId)?.replacements||[]).some(item=>item.eventId===id);}
function abilityScore(character,ability){return Number(character?.abilities?.[ability]||10)+Number(character?.abilityBonuses?.[ability]||0);}
function mod(score){return Math.floor((Number(score)||10)/2)-5;}

export function invocationProfile35(classId){
 const profile=profileFor(classId);return profile?JSON.parse(JSON.stringify(profile)):null;
}
export function invocationCatalog35(classId){
 const exact=cleanId(classId);
 return (catalogData.entries||[]).filter(row=>cleanId(row.classId)===exact).map(row=>({...row}));
}
export function activeInvocations35(character,classId){
 return activeRows(bucketFor(character,classId)).map(item=>({...item}));
}
export function invocationSaveDc35(character,classId,invocation){
 const profile=profileFor(classId);if(!profile)return null;
 return 10+Math.max(0,Number(invocation?.equivalentLevel??invocation?.level)||0)+mod(abilityScore(character,profile.ability||'cha'));
}
export function invocationEvents35(character,{classId,previousClassLevel=0,targetClassLevel}={}){
 const profile=profileFor(classId);if(!profile)return [];
 classId=activeRow(character,classId)?.catalogId||classId;
 const target=Math.max(0,Number(targetClassLevel??activeRow(character,classId)?.level)||0),previous=Math.max(0,Number(previousClassLevel)||0);
 const events=[];
 for(let level=previous+1;level<=target;level++){
  if(level<=Number(bucketFor(character,classId)?.legacyBaselineLevel||0))continue;
  const before=Number(profile.knownByLevel?.[String(level-1)]||0),now=Number(profile.knownByLevel?.[String(level)]||0),count=Math.max(0,now-before);
  if(!count)continue;
  const chooseId=eventId(classId,level,'choose-invocations');
  if(!eventApplied(character,classId,chooseId))events.push({id:chooseId,eventId:chooseId,kind:'choose-invocations',classId,profileId:profile.id,classLevel:level,count,maxGrade:profile.maxGradeByLevel?.[String(level)]||'least',required:true});
  if(before>0){
   const replaceId=eventId(classId,level,'optional-invocation-replacement');
   if(!replacementApplied(character,classId,replaceId))events.push({id:replaceId,eventId:replaceId,kind:'optional-invocation-replacement',classId,profileId:profile.id,classLevel:level,count:1,maxGrade:profile.maxGradeByLevel?.[String(level)]||'least',required:false});
  }
 }
 return events;
}
export function invocationPicksComplete35(events,picks={},legalIds=null){
 return (events||[]).every(event=>{
  if(event.kind==='optional-invocation-replacement'){
   const value=picks[event.eventId||event.id];if(!value||value.skip===true)return true;
   return Boolean(value.removedInvocationKey&&value.addedInvocationKey&&(!legalIds||legalIds.has(value.addedInvocationKey)));
  }
  const ids=Array.isArray(picks[event.eventId||event.id])?picks[event.eventId||event.id].filter(Boolean):[];
  return ids.length===Number(event.count||0)&&new Set(ids).size===ids.length&&(!legalIds||ids.every(id=>legalIds.has(id)));
 });
}
function validateInvocation(event,profile,row){
 if(!row||cleanId(row.classId)!==cleanId(event.classId))throw Error('Choose an invocation from this class invocation list.');
 const canonical=invocationCatalog35(event.classId).find(item=>keyOf(item)===keyOf(row));
 if(!canonical||canonical.grade!==row.grade||canonical.equivalentLevel!==row.equivalentLevel)throw Error('Choose an unmodified invocation from the class catalog.');
 const max=gradeIndex(event.maxGrade),actual=gradeIndex(row.grade);
 if(actual<0||actual>max)throw Error('Choose an invocation from an unlocked grade.');
 if(profile&&cleanId(profile.classId)!==cleanId(row.classId))throw Error('Choose an invocation owned by this class.');
}
function runtimeFrom(item,classId,profile){
 const row=item.invocation||{};
 return {...item.legacySpell,...row,id:`invocation-grant:${cleanId(classId)}:${item.invocationKey}`,catalogId:row.catalogId||item.invocationKey,
  edition:'3.5',category:'invocation',castingClassId:classId,invocationGrant:true,invocationAcquisitionId:item.id,
  invocationGrade:row.grade,invocationType:row.invocationType,level:Number(row.equivalentLevel??row.level)||0,prepared:true,
  description:item.legacySpell?.description||'Source-linked 3.5 invocation. Use the linked source for the full effect text.',sourceUrl:row.sourceUrl,
  classes:[profile.className],classLevels:{[profile.className]:Number(row.equivalentLevel??row.level)||0}};
}
export function validateInvocationReplacement35(character,event,{removedInvocationKey,addedInvocation}={}){
 if(event?.kind!=='optional-invocation-replacement')return {valid:false,reason:'This is not an invocation replacement event.'};
 const profile=profileFor(event.classId),bucket=bucketFor(character,event.classId),active=activeRows(bucket);
 const removed=active.find(item=>acquisitionKey(item)===String(removedInvocationKey||''));
 if(!removed)return {valid:false,reason:'Choose an active invocation to replace.'};
 if(Number(removed.acquiredAtClassLevel)>=Number(event.classLevel))return {valid:false,reason:'Choose an invocation you already knew at an earlier class level.'};
 if(!addedInvocation)return {valid:false,reason:'Choose a replacement invocation.'};
 try{validateInvocation(event,profile,addedInvocation);}catch(error){return {valid:false,reason:error.message};}
 const addKey=keyOf(addedInvocation);if(!addKey)return {valid:false,reason:'Replacement invocation has no stable identity.'};
 if(active.some(item=>acquisitionKey(item)===addKey))return {valid:false,reason:'This class already knows that invocation.'};
 if(gradeIndex(addedInvocation.grade)>gradeIndex(removed.invocation?.grade))return {valid:false,reason:'The replacement invocation must be the same or a lower grade than the invocation being replaced.'};
 return {valid:true,removed,addedInvocationKey:addKey};
}
export function applyInvocationEvent35(character,event,selection){
 const profile=profileFor(event?.classId);if(!profile)throw Error('Unsupported invocation class.');
 if(event.kind==='optional-invocation-replacement'&&replacementApplied(character,event.classId,event.eventId||event.id))throw Error('This invocation replacement opportunity is already resolved.');
 const state={...(character?.invocationAcquisition35||{})},stateKey=Object.keys(state).find(k=>cleanId(k)===cleanId(event.classId))||event.classId;
 const bucket=cloneBucket(state[stateKey]||{profileId:profile.id,classId:event.classId,classLevel:event.classLevel,active:true,orphaned:false,acquisitions:[],replacements:[]});
 if(event.kind==='choose-invocations'){
  const rows=Array.isArray(selection)?selection.filter(Boolean):[];
  if(rows.length!==Number(event.count||0)||new Set(rows.map(keyOf)).size!==rows.length)throw Error('Choose the exact number of distinct invocations.');
  const owned=new Set(activeRows(bucket).map(acquisitionKey));
  for(const row of rows){validateInvocation(event,profile,row);if(owned.has(keyOf(row)))throw Error('This class already knows that invocation.');}
  const id=event.eventId||event.id;
  bucket.acquisitions=(bucket.acquisitions||[]).filter(item=>item.sourceEventId!==id);
  rows.forEach((row,index)=>bucket.acquisitions.push({id:`${id}:${index}:${keyOf(row)}`,sourceEventId:id,invocationKey:keyOf(row),invocationName:row.name,grade:row.grade,equivalentLevel:row.equivalentLevel,origin:event.classLevel===1?'starting':'level-up',acquiredAtClassLevel:event.classLevel,active:true,invocation:{...row}}));
 }else if(event.kind==='optional-invocation-replacement'){
  if(!selection||selection.skip===true){bucket.replacements=[...(bucket.replacements||[]),{eventId:event.eventId||event.id,skipped:true,classLevel:event.classLevel}];state[stateKey]=bucket;return reconcileInvocationAcquisition35({...character,invocationAcquisition35:state});}
  const result=validateInvocationReplacement35({...character,invocationAcquisition35:{...state,[stateKey]:bucket}},event,selection);
  if(!result.valid)throw Error(result.reason);
  bucket.acquisitions=bucket.acquisitions.map(item=>item===result.removed?{...item,active:false,replacedAtClassLevel:event.classLevel}:item);
  const row=selection.addedInvocation,id=event.eventId||event.id;
  bucket.acquisitions.push({id:`${id}:replacement:${keyOf(row)}`,sourceEventId:id,invocationKey:keyOf(row),invocationName:row.name,grade:row.grade,equivalentLevel:row.equivalentLevel,origin:'replacement',acquiredAtClassLevel:event.classLevel,active:true,invocation:{...row}});
  bucket.replacements=[...(bucket.replacements||[]),{eventId:id,classLevel:event.classLevel,removedInvocationKey:selection.removedInvocationKey,addedInvocationKey:keyOf(row)}];
 }else throw Error('Unsupported invocation acquisition event.');
 bucket.classLevel=Math.max(Number(bucket.classLevel)||0,Number(event.classLevel)||0);bucket.active=true;bucket.orphaned=false;state[stateKey]=bucket;
 return reconcileInvocationAcquisition35({...character,invocationAcquisition35:state});
}
export function reconcileInvocationAcquisition35(character){
 const state=Object.fromEntries(Object.entries(character?.invocationAcquisition35||{}).map(([k,v])=>[k,cloneBucket(v)]));
 const rows=classRows(character),incomplete=[];
 for(const [key,bucket] of Object.entries(state)){
  const profile=profileFor(bucket.classId||key);if(!profile)continue;
  const row=rows.find(r=>cleanId(r.catalogId||r.definition?.catalogId||r.definition?.id||r.definition?.sourceId)===cleanId(profile.classId));
  if(!row){state[key]={...bucket,active:false,orphaned:true};continue;}
  const level=Math.max(1,Number(row.level)||1),limit=Number(profile.knownByLevel?.[String(level)]||0),max=gradeIndex(profile.maxGradeByLevel?.[String(level)]||'least'),active=activeRows({...bucket,active:true}),reasons=[],seen=new Set();
  if(active.length>limit)reasons.push(`Invocation known limit exceeded: ${active.length} owned, ${limit} allowed.`);
  const legal=new Map(invocationCatalog35(profile.classId).map(row=>[row.catalogId,row]));
  for(const item of active){
   if(seen.has(item.invocationKey))reasons.push('Duplicate invocation: '+item.invocationKey);seen.add(item.invocationKey);
   const rowData=legal.get(item.invocationKey);if(!rowData)reasons.push((item.invocationName||item.invocationKey)+' is not on this class invocation list.');
   else if(gradeIndex(rowData.grade)>max)reasons.push((rowData.name||item.invocationKey)+' is above the unlocked invocation grade.');
  }
  state[key]={...bucket,profileId:profile.id,classId:row.catalogId||key,classLevel:level,active:true,orphaned:false,incompleteReasons:[...new Set(reasons)]};
  if(reasons.length)incomplete.push({classId:cleanId(profile.classId),reasons:[...new Set(reasons)]});
 }
 const existing=Array.isArray(character?.spells)?character.spells:[],runtime=[];
 for(const [key,bucket] of Object.entries(state)){
  if(bucket.active===false)continue;const profile=profileFor(bucket.classId||key);if(!profile)continue;
  const legal=new Map(invocationCatalog35(profile.classId).map(row=>[row.catalogId,row])),seen=new Set(),max=gradeIndex(profile.maxGradeByLevel[bucket.classLevel]);
  for(const item of activeRows(bucket)){
   const canonical=legal.get(item.invocationKey);
   if(!canonical||gradeIndex(canonical.grade)>max||seen.has(item.invocationKey)||Number(item.acquiredAtClassLevel)>bucket.classLevel||seen.size>=Number(profile.knownByLevel[bucket.classLevel]||0))continue;
   seen.add(item.invocationKey);runtime.push(runtimeFrom({...item,invocation:canonical},bucket.classId||key,profile));
  }
 }
 const preserved=existing.filter(spell=>!spell?.invocationGrant);
 return {...character,invocationAcquisition35:state,invocationAcquisition35Incomplete:incomplete,spells:[...preserved,...runtime]};
}

// Creation, advancement and recovery of missing choices use the same atomic adapter.
export function applyInvocationChoices35(character,events,picks={}){
 let result=character;
 for(const event of events||[]){
  const pick=picks[event.eventId||event.id],catalog=invocationCatalog35(event.classId);
  if(event.kind==='choose-invocations'){
   const ids=Array.isArray(pick)?pick:[];
   const selected=ids.map(id=>catalog.find(row=>row.catalogId===id));
   if(selected.some(row=>!row))throw Error('Choose invocations from the class catalog.');
   result=applyInvocationEvent35(result,event,selected);
  }else{
   result=applyInvocationEvent35(result,event,!pick||pick.skip!==false?{skip:true}:{removedInvocationKey:pick.removedInvocationKey,addedInvocation:catalog.find(row=>row.catalogId===pick.addedInvocationKey)});
  }
 }
 return result;
}
export function invocationChoicesComplete35(character,events,picks={}){
 try{applyInvocationChoices35(character,events,picks);return true;}catch{return false;}
}

// Older saves know their repertoire but not when each invocation was learned.
// Record that conservative baseline without inventing historical choices.
export function prepareInvocationAdvancement35(character,classId,previousClassLevel){
 const profile=profileFor(classId),level=Math.max(0,Number(previousClassLevel)||0);
 if(!profile||!level||bucketFor(character,classId))return character;
 const primary=classRows(character)[0]?.catalogId||character.classDefinition?.catalogId;
 const catalog=invocationCatalog35(classId),adopted=new Set(),acquisitions=[];
 for(const spell of character.spells||[]){
  if(spell.invocationGrant||spell.auto||cleanId(spell.castingClassId||primary)!==cleanId(classId))continue;
  if(spell.category!=='invocation'&&!/invocation/i.test(spell.school||''))continue;
  const matches=catalog.filter(row=>row.catalogId===spell.catalogId||norm(row.name)===norm(spell.name));
  if(matches.length!==1)continue;
  const row=matches[0];adopted.add(spell);
  if(acquisitions.some(item=>item.invocationKey===row.catalogId))continue;
  acquisitions.push({id:`legacy-invocation35:${cleanId(classId)}:${row.catalogId}`,sourceEventId:`legacy-invocation35:${cleanId(classId)}`,invocationKey:row.catalogId,invocationName:row.name,grade:row.grade,equivalentLevel:row.equivalentLevel,origin:'legacy',acquiredAtClassLevel:level,active:true,invocation:row,legacySpell:{...spell}});
 }
 const bucket={profileId:profile.id,classId,classLevel:level,legacyBaselineLevel:level,active:true,acquisitions,replacements:[]};
 const spells=(character.spells||[]).filter(spell=>!adopted.has(spell)).map(spell=>!spell.castingClassId&&cleanId(primary)===cleanId(classId)?{...spell,castingClassId:classId}:spell);
 return reconcileInvocationAcquisition35({...character,spells,invocationAcquisition35:{...(character.invocationAcquisition35||{}),[classId]:bucket}});
}

const breathEffects={
 'Frost Breath':{name:'Frost Breath',minLevel:2,area:'cone',damageType:'cold',replacesDamageType:true},
 'Lightning Breath':{name:'Lightning Breath',minLevel:2,area:'line',damageType:'electricity',replacesDamageType:true},
 'Sickening Breath':{name:'Sickening Breath',minLevel:2,area:'cone',replacesDamage:true,condition:'sickened',save:'Fortitude',durationRounds:2,saveDurationRounds:1},
 'Acid Breath':{name:'Acid Breath',minLevel:5,damageType:'acid',replacesDamageType:true},
 'Shaped Breath':{name:'Shaped Breath',minLevel:5,safeSquares:4,canCombine:true},
 'Slow Breath':{name:'Slow Breath',minLevel:5,area:'cone',replacesDamage:true,condition:'slowed',save:'Fortitude',durationRounds:2,saveDurationRounds:1},
 'Weakening Breath':{name:'Weakening Breath',minLevel:5,area:'cone',replacesDamage:true,save:'Fortitude',strengthPenalty:-6,durationRounds:4,saveDurationRounds:2},
 'Cloud Breath':{name:'Cloud Breath',minLevel:10,area:'20-foot-radius cloud',replacesArea:true,canCombine:true},
 'Enduring Breath':{name:'Enduring Breath',minLevel:10,nextRoundDamageMultiplier:0.5,noSecondSave:true,canCombine:true},
 'Sleep Breath':{name:'Sleep Breath',minLevel:10,area:'cone',replacesDamage:true,condition:'sleep',save:'Will',durationRounds:1},
 'Thunder Breath':{name:'Thunder Breath',minLevel:10,area:'cone',damageType:'sonic',save:'Fortitude',replacesDamageType:true},
 'Discorporating Breath of Bahamut':{name:'Discorporating Breath of Bahamut',minLevel:15,area:'line',damageMultiplier:2,disintegrates:true},
 'Force Breath':{name:'Force Breath',minLevel:15,area:'line',damageType:'force',replacesDamageType:true},
 'Paralyzing Breath':{name:'Paralyzing Breath',minLevel:15,area:'cone',replacesDamage:true,condition:'paralyzed',durationRounds:1},
 'Fivefold Breath of Tiamat':{name:'Fivefold Breath of Tiamat',minLevel:15,specialCombination:true}
};
export function breathEffectMechanics35(name){const row=breathEffects[name];return row?{...row}:null;}
export function dragonfireBreathEffects35(){return Object.values(breathEffects).map(row=>({...row}));}
