import {backgrounds2014} from '../data/backgrounds2014.js';
import modern from '../data/srd2024.json' with {type:'json'};
import {leoninId,leoninRace,leoninSkills} from '../data/leonin.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {totemProfile} from './totemWarrior.js';
export const leoninRoarId='race:leonin-mot:roar';
const count=value=>Math.max(0,Math.floor(Number(value)||0));
export const isLeonin=c=>c?.race==='Leonin'&&c.raceDefinition?.catalogId===leoninId&&c.raceDefinition.edition==='2014'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';
export const leoninChoicesComplete=(c,backgroundSkills=[])=>!isLeonin(c)||leoninSkills.includes(c.leonin?.skill)&&![...(c.classSkills||[]),...backgroundSkills].includes(c.leonin.skill);
export function leoninProfile(c,abilities=effectiveAbilityScores(c)){
 if(!isLeonin(c))return {active:false};
 const level=Math.max(1,Math.min(20,count(c.level)||1)),pb=2+Math.floor((level-1)/4),str=Math.floor(((abilities.str??10)-10)/2),con=Math.floor(((abilities.con??10)-10)/2),used=count(c.resources?.find(r=>r.id===leoninRoarId)?.used);
 const rage=totemProfile(c,abilities),damage=str+(rage.activeRage&&!rage.heavyArmor?rage.rageDamage:0);
 return {active:true,pb,attack:pb+str,damage:`1d4${damage>=0?'+':''}${damage}`,dc:8+pb+con,used,remaining:Math.max(0,1-used),roaring:!!c.leonin?.roaring};
}
export function leoninResource(c){const p=leoninProfile(c);return p.active?{id:leoninRoarId,classResourceKey:leoninRoarId,raceManaged:true,className:'Leonin',name:'Daunting Roar',max:1,used:p.used,reset:'short',shortRecovery:'all',manual:false}:null;}
export function leoninActionBlock(c){
 if(!isLeonin(c))return 'This race source does not grant Leonin abilities.';
 if(Number(c.hp?.current)<=0)return 'You must be conscious to use this ability.';
 const conditions=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(v=>String(typeof v==='object'?v?.name:v).trim().toLowerCase());
 return conditions.some(v=>['incapacitated','unconscious','paralyzed','stunned','petrified','dead'].includes(v))?'You cannot use this ability while incapacitated.':'';
}
export function useDauntingRoar(c){const blocked=leoninActionBlock(c);if(blocked)throw Error(blocked);const resource=leoninResource(c);if(resource.used>=1)throw Error('No Daunting Roar uses remaining.');return {leonin:{...c.leonin,roaring:true},resources:[...(c.resources||[]).filter(r=>r.id!==leoninRoarId),{...resource,used:resource.used+1}]};}
export const endDauntingRoar=c=>isLeonin(c)?{leonin:{...c.leonin,roaring:false}}:{};
function otherSkillSource(c,name){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const background=edition==='2024'?modern.backgrounds.find(b=>b.name===c.background):backgrounds2014[c.background];
 const backgroundSkills=typeof background?.skills==='string'?background.skills.split(',').map(s=>s.trim()):(background?.proficiencies||[]).filter(p=>p.index?.startsWith('skill-')).map(p=>p.name.replace(/^Skill: /,''));
 return (c.classSkills||[]).includes(name)||backgroundSkills.includes(name)||(c.trainingGrants||[]).some(g=>(g.proficiencies||[]).some(p=>p.kind==='skills'&&p.name===name))||Object.values(c.featureChoices||{}).some(g=>!/expertise/i.test(g.feature||'')&&(g.choices||[]).includes(name));
}
export function reconcileLeonin(c){
 const retained=(c.traits||[]).filter(t=>t.homebrew||t.raceGrantId!==leoninId),active=isLeonin(c),nextSkill=active&&leoninSkills.includes(c.leonin?.skill)?c.leonin.skill:null,old=c.leonin?.skillGrant,skillProf={...c.skillProf};
 if(old?.name&&old.name!==nextSkill&&!old.previous&&!otherSkillSource(c,old.name)&&skillProf[old.name]===true){if(Object.hasOwn(old,'previous'))skillProf[old.name]=old.previous;else delete skillProf[old.name];}
 if(!active){
  if(!old&&!c.leonin?.roaring)return retained.length===(c.traits||[]).length?c:{...c,traits:retained};
  return {...c,skillProf,traits:retained,leonin:{...c.leonin,skillGrant:undefined,roaring:false}};
 }
 const skillGrant=nextSkill?(old?.name===nextSkill?old:{name:nextSkill,previous:skillProf[nextSkill]??false}):undefined;
 if(nextSkill)skillProf[nextSkill]=true;
 const traits=leoninRace.traits.map(t=>({...t,id:leoninId+':'+t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),source:leoninRace.source}));
 return {...c,skillProf,leonin:{...c.leonin,skillGrant},traits:[...retained,...traits]};
}
// The creator validates that the racial choice is not already a class/background
// skill. Mark that contribution before normalization sees the combined skill map.
export const finishLeonin=c=>isLeonin(c)?reconcileLeonin({...c,leonin:{...c.leonin,skillGrant:leoninSkills.includes(c.leonin?.skill)?{name:c.leonin.skill,previous:false}:undefined}}):c;
