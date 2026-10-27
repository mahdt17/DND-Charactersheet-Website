import {characterClasses} from './advancement.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {artisanTools} from './featMagic.js';
import {fighterSubclassRecords,battleMasterManeuvers,cavalierSkills} from '../data/fighterSubclasses.js';
export const superiorityId='2014:Fighter:battle-master:superiority';
export const cavalierMarkId='2014:Fighter:cavalier:mark';
export const cavalierWardId='2014:Fighter:cavalier:ward';
export const fighterResourceIds=[superiorityId,cavalierMarkId,cavalierWardId];
const count=x=>Math.max(0,Math.floor(Number(x)||0));
const names=s=>String(s||'').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
const mod=n=>Math.floor((Number(n??10)-10)/2);
const trainingOwner='fighter-subclass:2014';
const skillList=value=>(Array.isArray(value)?value:names(value)).map(n=>String(n?.name||n).replace(/^Skill: /,'').trim());
// Name-only older saves still have their background proficiencies. Only these
// backgrounds overlap the five Cavalier skill options.
const backgroundCavalierSkills={Acolyte:['Insight'],Entertainer:['Performance'],'Folk Hero':['Animal Handling'],'Guild Artisan':['Insight','Persuasion'],Noble:['History','Persuasion'],Sage:['History']};
function independentSkill(c,name,trainingGrants){
 return [...skillList(c.classSkills),...skillList(c.backgroundSkills),...skillList(c.backgroundDefinition?.skills),...skillList(c.backgroundDefinition?.skill_proficiencies),...skillList(c.bonusSkills),...skillList(c.skillExtras),...skillList(c.manualSkills),...(backgroundCavalierSkills[c.background]||[]),c.variantHuman?.skill].includes(name)||!!c.expertise?.[name]||trainingGrants.some(g=>g.proficiencies?.some(s=>s.kind==='skills'&&s.name===name));
}
function fighterRow(c){if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014')return null;return characterClasses(c).find(r=>r.name==='Fighter'&&r.edition==='2014'&&!r.definition?.homebrew&&r.definition?.source!=='Homebrew'&&!r.definition?.prestige);}
export function fighterProfile(c,abilities=effectiveAbilityScores(c)){
 const row=fighterRow(c),record=fighterSubclassRecords.find(s=>s.name===row?.subclass),level=count(row?.level);if(!record||level<3)return {active:false};
 const total=c.classLevels?.length?characterClasses(c).reduce((n,r)=>n+Number(r.level),0):Number(c.level||level)+Number(c.otherClassLevels||0),pb=2+Math.floor((Math.max(1,total)-1)/4),used=id=>count(c.resources?.find(r=>r.id===id)?.used),state=c.fighterSubclass||{},kind=record.index;
 if(kind==='battle-master'){const diceMax=level>=15?6:level>=7?5:4,die=level>=18?12:level>=10?10:8,knownMax=level>=15?9:level>=10?7:level>=7?5:3,known=(state.battleMaster?.maneuvers||[]).map(id=>battleMasterManeuvers.find(m=>m.id===id)).filter(Boolean);return {active:true,kind,row,record,level,pb,diceMax,die,knownMax,known,used:used(superiorityId),remaining:Math.max(0,diceMax-used(superiorityId)),dcAbility:state.battleMaster?.dcAbility==='dex'?'dex':'str',dc:8+pb+mod(abilities[state.battleMaster?.dcAbility==='dex'?'dex':'str']),complete:known.length===knownMax&&new Set(known.map(m=>m.id)).size===knownMax&&artisanTools.includes(state.battleMaster?.tool)};}
 const markMax=Math.max(1,mod(abilities.str)),wardMax=level>=7?Math.max(1,mod(abilities.con)):0;
 return {active:true,kind,row,record,level,pb,markMax,markRemaining:Math.max(0,markMax-used(cavalierMarkId)),wardMax,wardRemaining:Math.max(0,wardMax-used(cavalierWardId)),markDamage:Math.floor(level/2),chargerDC:8+pb+mod(abilities.str),complete:!!state.cavalier?.training};
}
export function fighterResources(c){const p=fighterProfile(c);if(!p.active)return [];const make=(id,name,max,reset)=>({id,classResourceKey:id,fighterManaged:true,className:'Fighter',sourceClassId:p.row.catalogId,sourceClassName:'Fighter',edition:'2014',name,max,used:count(c.resources?.find(r=>r.id===id)?.used),reset,shortRecovery:reset==='short'?'all':0,manual:false});return p.kind==='battle-master'?[make(superiorityId,'Superiority Dice',p.diceMax,'short')]:[make(cavalierMarkId,'Unwavering Mark special attack',p.markMax,'long'),...(p.wardMax?[make(cavalierWardId,'Warding Maneuver',p.wardMax,'long')]:[])];}
export function fighterActionBlock(c){if(!fighterProfile(c).active)return 'This character does not have this Fighter subclass.';if(Number(c.hp?.current)<=0)return 'You must be conscious to use this ability.';const conditions=(Array.isArray(c.conditions)?c.conditions:names(c.conditions)).map(s=>String(s?.name||s).toLowerCase());return conditions.some(s=>['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].includes(s))?'You cannot use this ability while incapacitated.':'';}
function spend(c,id){const blocked=fighterActionBlock(c);if(blocked)throw Error(blocked);const r=fighterResources(c).find(r=>r.id===id);if(!r||r.used>=r.max)throw Error('No uses remaining.');return {resources:[...(c.resources||[]).filter(x=>x.id!==id),{...r,used:r.used+1}]};}
export function spendManeuver(c,id){const p=fighterProfile(c);if(p.kind!=='battle-master'||!p.known.some(m=>m.id===id))throw Error('Choose a learned Battle Master maneuver.');return spend(c,superiorityId);}
export function maneuverExpression(c,id,{critical=false}={}){const p=fighterProfile(c),m=p.known?.find(m=>m.id===id);if(!m)throw Error('Choose a learned maneuver.');const extra=m.extraAbility?mod(effectiveAbilityScores(c)[m.extraAbility]):0;return `${critical&&m.damage?2:1}d${p.die}${extra?`${extra>=0?'+':''}${extra}`:''}`;}
export function fighterInitiative(c){const p=fighterProfile(c);if(p.kind!=='battle-master'||p.level<15||p.remaining)return {};const r=fighterResources(c)[0];return {resources:[...(c.resources||[]).filter(x=>x.id!==superiorityId),{...r,used:Math.max(0,r.max-1)}]};}
export function useCavalier(c,kind,{eligible=false}={}){const p=fighterProfile(c);if(p.kind!=='cavalier'||!eligible)throw Error('Confirm the feature’s trigger and requirements first.');return spend(c,kind==='mark'?cavalierMarkId:kind==='ward'?cavalierWardId:'unsupported');}
export function markCavalierTarget(c,target){const p=fighterProfile(c),blocked=fighterActionBlock(c);if(p.kind!=='cavalier'||blocked)throw Error(blocked||'Cavalier required.');target=String(target||'').trim();if(!target)throw Error('Enter the marked creature.');return {fighterSubclass:{...c.fighterSubclass,cavalier:{...c.fighterSubclass?.cavalier,marks:[...new Set([...(c.fighterSubclass?.cavalier?.marks||[]),target])]}}};}
export const clearCavalierMarks=c=>({fighterSubclass:{...c.fighterSubclass,cavalier:{...c.fighterSubclass?.cavalier,marks:[]}}});
export function fighterFeatureRows(c){const p=fighterProfile(c);return !p.active?[]:p.record.features.filter(f=>f.level<=p.level).map((f,i)=>({...f,index:`fighter-subclass:${p.kind}:${f.level}:${i}`,id:`fighter-subclass:${p.kind}:${f.level}:${i}`,fighterManaged:true,className:'Fighter',sourceClassName:'Fighter',sourceClassLevel:f.level,source:p.record.sourceBook,featureName:f.name}));}
export function reconcileFighterSubclass(c){
 const p=fighterProfile(c),retained=(c.grantedFeatures||[]).filter(f=>!f.fighterManaged),trainingGrants=(c.trainingGrants||[]).filter(g=>g.sourceFeatureId!==trainingOwner),state=c.fighterSubclass||{},skillProf={...c.skillProf};
 const trained=state.cavalier?.training;
 if(p.kind!=='cavalier'&&trained?.kind==='skills'&&trained.previous===false&&!trained.revoked&&!independentSkill(c,trained.name,trainingGrants))skillProf[trained.name]=false;
 if(p.kind==='battle-master'&&artisanTools.includes(state.battleMaster?.tool))trainingGrants.push({classId:p.row.catalogId,className:'Fighter',edition:'2014',sourceFeatureId:trainingOwner,proficiencies:[{kind:'tools',index:state.battleMaster.tool.toLowerCase().replace(/[^a-z]+/g,'-'),name:state.battleMaster.tool,source:'Student of War'}]});
 if(p.kind==='cavalier'&&trained?.kind==='skills'&&cavalierSkills.includes(trained.name)){skillProf[trained.name]=true;trainingGrants.push({classId:p.row.catalogId,className:'Fighter',edition:'2014',sourceFeatureId:trainingOwner,proficiencies:[{kind:'skills',index:'skill-'+trained.name.toLowerCase().replace(/ /g,'-'),name:trained.name,source:'Cavalier Bonus Proficiency'}]});}
 const nextState=trained?.kind==='skills'?{...state,cavalier:{...state.cavalier,training:{...trained,revoked:p.kind!=='cavalier'}}}:state;
 const cleared=nextState.cavalier?.marks?.length&&(p.kind!=='cavalier'||fighterActionBlock(c))?{...nextState,cavalier:{...nextState.cavalier,marks:[]}}:nextState;
 return {...c,fighterSubclass:cleared,skillProf,trainingGrants,grantedFeatures:[...retained,...fighterFeatureRows(c)]};
}
export function fighterChoicePlan(c,previous=null,picks={}){
 const p=fighterProfile(c),groups=[];if(!p.active)return {groups,patch:{},valid:true};
 const state={...c.fighterSubclass},bm={...state.battleMaster},cav={...state.cavalier};let valid=true;
 const add=(g,okay)=>{groups.push({...g,className:'Fighter',kind:g.kind||'source-choice',choiceKind:'option',level:p.level,count:g.required,valid:okay,sourceUrl:p.record.sourceUrl});valid&&=okay;};
 if(p.kind==='battle-master'){
  if(!p.complete||picks[`fighter:${p.row.catalogId}:${p.knownMax}:maneuvers`]){
   const id=`fighter:${p.row.catalogId}:${p.knownMax}:maneuvers`,selected=picks[id]||p.known.map(m=>m.name),old=previous?fighterProfile(previous):{known:[]},oldNames=old.kind==='battle-master'?(old.known||[]).map(m=>m.name):[],learning=old.kind==='battle-master'&&old.knownMax<p.knownMax;
   const options=battleMasterManeuvers.map(m=>m.name),replaced=oldNames.filter(n=>!selected.includes(n)).length,okay=selected.length===p.knownMax&&new Set(selected).size===selected.length&&selected.every(n=>options.includes(n))&&(!learning||replaced<=1);
   add({id,label:'Battle Master maneuvers',required:p.knownMax,options,selected,sourceText:`Choose ${p.knownMax} total maneuvers. ${learning?'You may replace at most one previously learned maneuver.':'Each attack can use only one maneuver.'}`,error:learning&&replaced>1?'Keep all but at most one previously learned maneuver.':''},okay);
   if(okay)bm.maneuvers=selected.map(n=>battleMasterManeuvers.find(m=>m.name===n).id);
  }
  if(!artisanTools.includes(bm.tool)){
   const id=`fighter:${p.row.catalogId}:student-of-war`,selected=picks[id]||[],okay=selected.length===1&&artisanTools.includes(selected[0]);add({id,label:'Student of War',required:1,options:artisanTools,selected,sourceText:'Choose proficiency with one type of artisan’s tools. This grants training, not a free tool kit.'},okay);if(okay)bm.tool=selected[0];
  }
  state.battleMaster=bm;
 }else if(!cav.training){
  const id=`fighter:${p.row.catalogId}:cavalier-training`,selected=picks[id]||[],[kind,name]=selected,okay=selected.length===2&&(kind==='skills'?cavalierSkills.includes(name)&&!c.skillProf?.[name]:kind==='languages'&&!!name?.trim()&&!names(c.languages).some(n=>n.toLowerCase()===name.trim().toLowerCase()));
  add({id,kind:'fighter-training',label:'Cavalier Bonus Proficiency',required:1,options:cavalierSkills.filter(n=>!c.skillProf?.[n]),selected,sourceText:'Choose one new listed skill, or one new language.'},okay);if(okay)cav.training={kind,name:name.trim(),previous:false};state.cavalier=cav;
 }
 const resolved=reconcileFighterSubclass({...c,fighterSubclass:state}),patch={fighterSubclass:state,trainingGrants:resolved.trainingGrants,skillProf:resolved.skillProf,grantedFeatures:resolved.grantedFeatures};
 if(p.kind==='cavalier'&&cav.training?.kind==='languages'){const known=names(c.languages);if(!known.some(n=>n.toLowerCase()===cav.training.name.toLowerCase()))known.push(cav.training.name);patch.languages=known.join(', ');}
 return {groups,patch,valid};
}
