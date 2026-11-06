import {creatureProfile,damageCreature,updateCreature} from './campaignCreatures.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {campaignModifiers} from './campaignModifiers.js';
import {entomancerProfile} from './entomancer.js';
import {resolveCampaignSpell} from './campaignSpellEffects.js';
import {findSpellCast,replaceSpellCast,recordSpellCast} from './spellCastHistory.js';
export {findSpellCast,replaceSpellCast,recordSpellCast};
const abilities=['str','dex','con','int','wis','cha'];
export const supportedConditions=['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'];
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const number=(v,label)=>{if(!Number.isFinite(v))throw Error('Enter '+label+'.');return v;};
const integer=(v,label)=>{number(v,label);if(!Number.isInteger(v)||v<0)throw Error(label+' must be a nonnegative whole number.');return v;};
const creature=(c,id)=>id==='self'?c:c.archivistCampaign?.creatures?.find(n=>n.id===id);
const normalizeAbility=value=>{const key=String(value||'').toLowerCase().slice(0,3);return abilities.includes(key)?key:'';};
const saveBasisKeys=['targetId','ability','modifier','adjustment','cystAdjustment','dc','mode'];
export const saveBasisMatches=(plan,proof)=>!!proof&&saveBasisKeys.every(key=>same(plan?.[key],proof[key]));
export function spellSaveMetadata(cast){
 const s=cast.spell||{},r=cast.rule||{},damage=Array.isArray(s.damage)?s.damage:s.damage?[s.damage]:[];
 const pick=(map,level)=>map?.[Object.keys(map||{}).map(Number).filter(n=>n<=level).sort((a,b)=>b-a)[0]];
 return {ability:normalizeAbility(r.save||s.dc?.dc_type?.index||s.dc?.dc_type?.name||cast.plan?.save),success:s.dc?.dc_success,damaging:!!r.damageCap||damage.length>0,rolls:r.damageCap?[{expression:Math.min(cast.casterLevel||1,r.damageCap)+'d6',label:'Necrotic damage'}]:damage.map(d=>({expression:pick(d.damage_at_character_level,cast.characterLevel||cast.casterLevel||1)||pick(d.damage_at_slot_level,cast.effectLevel??s.level),label:(d.damage_type?.name||'')+' damage'})).filter(d=>d.expression),necromancy:/necromancy/i.test(typeof s.school==='object'?s.school?.name:s.school||'')||String(cast.spellId).startsWith('darkdonte:necrotic-')};
}
export function targetSavePlan(c,castId,targetId,input={}){
 const cast=findSpellCast(c,castId);if(!cast)throw Error('Cast no longer exists.');
 if(cast.edition&&cast.edition!=='2014')throw Error('Target automation is only available for 2014 casts.');
 const m=spellSaveMetadata(cast),queued=cast.targets?.find(t=>t.targetId===targetId),secondary=!!cast.chain&&!input.area&&!!queued?.secondary;
 const chainDamage=secondary&&(m.damaging||Number.isFinite(cast.primaryDamage)),n=creature(c,targetId),ability=input.area?'dex':chainDamage?'dex':normalizeAbility(input.ability)||m.ability;
 const selfSave=()=>{const score=effectiveAbilityScores(c)[ability],pb=2+Math.floor((Math.max(1,Number(c.level)||1)-1)/4),swarm=entomancerProfile(c);return Math.floor((score-10)/2)+(c.saveProf?.[ability]?pb:0)+(swarm.song?swarm.wis:0)+(ability==='con'?(campaignModifiers(c).conSave||0):0);};
 const base=targetId==='self'&&ability?selfSave():n&&ability?creatureProfile(n).saves[ability]:0;
 const modifier=input.modifier==null||input.modifier===''?base:number(input.modifier,'target save modifier'),adjustment=input.adjustment==null||input.adjustment===''?0:number(input.adjustment,'additional save adjustment');
 const cystAdjustment=m.necromancy&&ability&&!input.area&&!chainDamage&&(n?.cyst||input.cystConfirmed)?-2:0;
 return {targetId,name:queued?.name||n?.name||input.name||cast.results?.find(r=>r.targetId===targetId)?.name||targetId.replace(/^table:/,''),ability,needsSave:!!ability||secondary||!!input.area,secondary,chainDamage,dc:cast.dc-(secondary&&!chainDamage?4:0),modifier,adjustment,cystAdjustment,modifierSource:input.modifier!=null&&input.modifier!==''?'override':targetId==='self'?'character save':n?'creatureProfile.saves':'entered',mode:input.mode||'normal',expression:'1d20'+(modifier+adjustment+cystAdjustment>=0?'+':'')+(modifier+adjustment+cystAdjustment)};
}
export function saveResult(plan,rolled){
 const faces=rolled.rolls||[],mode=plan.mode||'normal';
 if(faces.some(n=>!Number.isInteger(n)||n<1||n>20)||!faces.length)throw Error('A visible d20 result is required.');
 const face=mode==='advantage'?Math.max(...faces):mode==='disadvantage'?Math.min(...faces):faces[0],total=face+plan.modifier+plan.adjustment+plan.cystAdjustment;
 return {...plan,faces:[...faces],face,total,passed:total>=plan.dc,method:'rolled'};
}
export function rollTargetSave(c,castId,targetId,input,roll){
 const p=targetSavePlan(c,castId,targetId,input);if(!p.ability)throw Error('Choose the target save ability.');
 const r=roll(p.expression,p.name+' '+p.ability.toUpperCase()+' target save',{mode:p.mode,ignoreCharacterEffects:true,kind:'save',inline:true});
 return r?saveResult(p,r):null;
}
export function recordTargetSaveRoll(c,castId,targetId,input,roll){
 const proof=rollTargetSave(c,castId,targetId,input,roll);if(!proof)return c;
 const cast=findSpellCast(c,castId);
 return replaceSpellCast(c,{...cast,saveDrafts:{...cast.saveDrafts,[targetId]:{proof,input:clone(input)}}});
}
export function clearTargetSaveRoll(c,castId,targetId){
 const cast=findSpellCast(c,castId);if(!cast?.saveDrafts?.[targetId])return c;
 const saveDrafts={...cast.saveDrafts};delete saveDrafts[targetId];return replaceSpellCast(c,{...cast,saveDrafts});
}
export function reconcileSaveDrafts(c,castId){
 const cast=findSpellCast(c,castId);if(!cast?.saveDrafts)return c;
 let changed=false;const saveDrafts={};for(const [targetId,draft] of Object.entries(cast.saveDrafts)){
  let valid=false;try{valid=saveBasisMatches(targetSavePlan(c,castId,targetId,draft.input),draft.proof);}catch{}
  if(valid)saveDrafts[targetId]=draft;else changed=true;
 }
 return changed?replaceSpellCast(c,{...cast,saveDrafts}):c;
}
// Only fields this resolution changed are journaled. Identity lookup avoids array-index rollback.
function fieldChanges(before,after,path=[],out=[]){
 for(const k of new Set([...Object.keys(before||{}),...Object.keys(after||{})])){
  const a=before?.[k],b=after?.[k];if(same(a,b))continue;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))fieldChanges(a,b,[...path,k],out);
  else out.push({path:[...path,k],before:clone(a),after:clone(b),hadBefore:a!==undefined,hadAfter:b!==undefined});
 }return out;
}
const at=(object,path)=>path.reduce((n,k)=>n?.[k],object);
function put(object,path,value,exists){let n=object;for(const k of path.slice(0,-1))n=n[k]??={};if(exists)n[path.at(-1)]=clone(value);else delete n[path.at(-1)];}
function journal(before,after,targetId){
 const a=creature(before,targetId),b=creature(after,targetId),changes=a&&b?fieldChanges(targetId==='self'?{hp:a.hp,conditions:a.conditions,dead:a.dead,concentration:a.concentration}:{...a},targetId==='self'?{hp:b.hp,conditions:b.conditions,dead:b.dead,concentration:b.concentration}:{...b}):[];
 const globals=fieldChanges({empowerment:before.archivistCampaign?.empowerment,sensing:before.archivistCampaign?.sensing},{empowerment:after.archivistCampaign?.empowerment,sensing:after.archivistCampaign?.sensing});
 const beforeIds=(before.archivistCampaign?.creatures||[]).map(n=>n.id),spawned=(after.archivistCampaign?.creatures||[]).some(n=>!beforeIds.includes(n.id));
 const selfZeroHP=targetId==='self'&&Number(before.hp?.current)>0&&Number(after.hp?.current)===0;
 return {targetId,changes,globals,manualOnly:spawned||selfZeroHP};
}
function undo(c,entry){
 if(!entry)return c;if(entry.manualOnly)throw Error('Correction conflict: spawned or zero-HP side effects require record-only correction and manual application.');
 const n=creature(c,entry.targetId);
 for(const change of entry.changes)if(!n||!same(at(n,change.path),change.after))throw Error('Correction conflict: target '+change.path.join('.')+' changed. Use record-only correction and reconcile at the table.');
 for(const change of entry.globals)if(!same(at(c.archivistCampaign,change.path),change.after))throw Error('Correction conflict: campaign effect changed. Use record-only correction.');
 const next=clone(c),target=creature(next,entry.targetId);for(const change of entry.changes)put(target,change.path,change.before,change.hadBefore);for(const change of entry.globals)put(next.archivistCampaign,change.path,change.before,change.hadBefore);return next;
}
export function resolveSpellTarget(c,castId,targetId,input={}){
 const original=findSpellCast(c,castId);if(!original)throw Error('Cast no longer exists.');
 const previous=original.results?.find(r=>r.targetId===targetId);
 if(previous&&!input.correct||!previous&&original.resolved?.includes(targetId))throw Error('This target is already resolved. Reopen its result to correct it.');
 if(input.correct&&!previous)throw Error('No recorded result to correct.');
 if(previous?.recordOnly&&!input.recordOnly)throw Error('Manual reconciliation required: continue with record-only corrections.');
 let next=previous&&!input.recordOnly?undo(c,previous.journal):c,cast={...original};
 const queued=cast.targets?.find(t=>t.targetId===targetId),plan=targetSavePlan(next,castId,targetId,input),meta=spellSaveMetadata(cast),rule=cast.rule||{};
 if(!String(targetId||'').trim()||targetId==='table:')throw Error('Choose a creature or enter a target name.');
 if(!creature(next,targetId)&&!targetId.startsWith('table:')&&!input.recordOnly)throw Error('Target is no longer tracked; use record-only correction.');
 if(cast.chain&&!input.area){
  if(!queued)throw Error('Add the target to the Chain target list.');
  if(plan.secondary){if(!cast.resolved?.length)throw Error('Resolve the primary target first.');if(!Number.isFinite(queued.distanceFromPrimary)||queued.distanceFromPrimary<0||queued.distanceFromPrimary>30)throw Error('Each secondary must be within 30 feet.');if(!previous&&(cast.secondaryResolved||0)>=cast.secondaryTargets)throw Error('No secondary Chain targets remaining.');}
 }
 let proof={...plan,faces:[],total:null,passed:null,method:input.blocked?'blocked':'manual'};
 if(plan.needsSave&&!input.blocked){
  if(previous&&(previous.ability!==plan.ability||previous.dc!==plan.dc)&&!input.rolled&&!input.freshSaveConfirmed)throw Error('The save ability or DC changed. Roll again or explicitly enter a fresh manual save total.');
  if(input.rolled){if(!saveBasisMatches(plan,input.rolled))throw Error('Save inputs changed; roll again or enter a manual total.');proof=saveResult(plan,{rolls:input.rolled.faces});}
  else{const total=number(input.save,'the target save total')+plan.cystAdjustment;proof={...proof,total,passed:total>=plan.dc};}
 }
 let amount=null,instruction='',condition=null;
 if(input.blocked)instruction='Blocked: no effect';
 else if(rule.effect&&!input.recordOnly){
  if((cast.spell?.concentration||rule.concentration)&&(next.concentration!==cast.name||next.archivistCampaign?.concentrationCastId!==cast.id))throw Error('The source cast is no longer the active concentration; use record-only manual resolution.');
  // Legacy campaign rules remain authoritative; pass a total before their own cyst adjustment.
  const prepared={...cast,resolved:previous&&!plan.secondary&&!input.area?[]:(cast.resolved||[]).filter(id=>id!==targetId),secondaryResolved:Math.max(0,(cast.secondaryResolved||0)-(previous&&plan.secondary?1:0)),targets:[...(cast.targets||[]).map(t=>t.targetId===targetId?{...t,status:'queued'}:t),...(!queued&&targetId.startsWith('table:')?[{targetId,name:plan.name,status:'queued'}]:[])]};
  const live=next.archivistCampaign?.lastCast;
  const withCast={...next,archivistCampaign:{...next.archivistCampaign,lastCast:prepared}};
  const target=creature(next,targetId),legacyPenalty=target?.cyst&&String(cast.spellId).startsWith('darkdonte:necrotic-')&&rule.save&&!input.area&&!plan.chainDamage?-2:0;
  const applied=resolveCampaignSpell(withCast,targetId,{...input,secondary:plan.secondary,save:proof.total==null?input.save:proof.total-legacyPenalty});
  cast=applied.archivistCampaign.lastCast;instruction=cast.lastResult;amount=rule.damageCap?(plan.secondary?Math.floor(cast.primaryDamage/(proof.passed?4:2)):cast.primaryDamage??input.damage):null;
  next={...applied,archivistCampaign:{...applied.archivistCampaign,lastCast:live}};
 }else if(!input.blocked){
  const damaging=meta.damaging||input.damaging||plan.chainDamage;
  if(damaging){
   if(plan.chainDamage){if(!Number.isFinite(cast.primaryDamage))throw Error('Resolve primary damage first.');amount=Math.floor(Math.floor(cast.primaryDamage/2)/(proof.passed?2:1));}
   else {amount=integer(input.damage,'Damage');if(proof.passed){if((input.successOnSave||meta.success)==='half')amount=Math.floor(amount/2);else if((input.successOnSave||meta.success)==='none')amount=0;else if(plan.needsSave&&(input.successOnSave||meta.success)!=='full')amount=null;}}
  }
  if(input.condition){if(!supportedConditions.includes(input.condition)||!input.eligibilityConfirmed)throw Error('Confirm the source, target eligibility and condition before applying.');integer(input.rounds,'Condition rounds');if(input.rounds<1)throw Error('Enter a positive condition duration.');if(proof.passed!==true){if(!input.recordOnly&&cast.spell?.concentration&&(next.concentration!==cast.name||next.archivistCampaign?.concentrationCastId!==cast.id))throw Error('The source cast is no longer the active concentration; apply the condition manually at the table.');condition={id:cast.id+':'+targetId,castId:cast.id,sourceCaster:c.id,name:input.condition,rounds:input.rounds,concentration:!!cast.spell?.concentration,sourceSpell:cast.name};}}
  const n=creature(next,targetId),tracked=!!n;
  instruction=[amount!=null?amount+' damage':null,condition?condition.name+' for '+condition.rounds+' rounds':null].filter(Boolean).join('; ');
  if(!instruction)instruction=proof.passed?'Save succeeded; resolve any remaining effect at the table':'Apply the spell effect at the table';
  if(!tracked)instruction+='; apply to '+plan.name+' at the table';
  if(tracked&&!input.recordOnly){
   const apply=n=>{let result=amount!=null?damageCreature(n,amount):n;
    // Self sheets still use string conditions; explicitly use table application there.
    if(condition&&targetId!=='self')result={...result,conditions:[...(result.conditions||[]),condition]};return result;};
   next=targetId==='self'?apply(next):updateCreature(next,targetId,apply);
   if(condition&&targetId==='self')instruction+='; apply condition to self at the table';
  }
 }
 if(!plan.secondary&&!input.area&&cast.chain){if(meta.damaging||input.damaging||rule.damageCap)cast.primaryDamage=input.blocked?0:amount;else delete cast.primaryDamage;}
 const appliedJournal=input.recordOnly?null:journal(previous?undoForJournal(c,previous,input.recordOnly):c,next,targetId);
 const record={...proof,castId,targetId,name:plan.name,damage:amount,condition,blocked:!!input.blocked,instruction:input.recordOnly?'Record-only correction; statistics unchanged. Manually reconcile the previous effect and '+(instruction||'apply the corrected spell outcome at the table'):instruction,recordOnly:!!input.recordOnly,journal:appliedJournal,input:clone({...input,correct:undefined,recordOnly:undefined}),needsCorrection:false,revisions:[...(previous?.revisions||[]),...(previous?[{...previous,revisions:undefined}]:[])],recordedAt:new Date().toISOString()};
 const changedPrimary=previous&&!plan.secondary&&cast.chain&&original.primaryDamage!==cast.primaryDamage;
 const saveDrafts={...original.saveDrafts};delete saveDrafts[targetId];
 cast={...cast,saveDrafts,results:previous?(original.results||[]).map(r=>r.targetId===targetId?record:changedPrimary&&r.secondary?{...r,needsCorrection:true}:r):[...(original.results||[]),record],resolved:[...new Set([...(original.resolved||[]),targetId])],secondaryResolved:(original.secondaryResolved||0)+(!previous&&plan.secondary?1:0),lastResult:record.instruction,targets:cast.targets?.map(t=>t.targetId===targetId?{...t,status:'resolved',result:record.instruction}:t)};
 return replaceSpellCast(next,cast);
}
function undoForJournal(c,previous,recordOnly){return recordOnly?c:undo(c,previous.journal);}
