import {rageProfile} from './rage2014.js';
import {bladesongProfile} from './bladesinging.js';
import {actorActionBlock,healActiveBody,equippedForActiveBody} from './subclassState.js';
import {fightingStyleGrants} from './fightingStyleGrants.js';
import {totemProfile} from './totemWarrior.js';
import {totalLevel} from './advancement.js';
import {effectiveAbilityScores} from './abilityScores.js';
import equipment from '../data/equipment.json' with {type:'json'};
import {fightingStyles} from '../data/fightingStyles.js';
import {battleMasterManeuvers} from '../data/fighterSubclasses.js';
import {fighterProfile} from './fighterSubclasses.js';
export const secondWindId='2014:Fighter:second-wind';
export const techniqueId='2014:Fighter:superior-technique';
const conditionNames=c=>(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(n=>String(n).trim());
const count=n=>Math.max(0,Math.floor(Number(n)||0));
const mod=n=>Math.floor((Number(n??10)-10)/2);
const signed=n=>n>=0?`+${n}`:String(n);
const label=s=>`${s.name} (${s.source})`;
const findStyle=value=>fightingStyles.find(s=>[s.id,s.name,label(s)].includes(typeof value==='object'?value?.id:value));
export function fightingStyleProfile(c,abilities=effectiveAbilityScores(c)){
 const {active,row,fighterRow,max,styles}=fightingStyleGrants(c);
 if(!active)return {active:false,styles:[],ac:0};
 const has=id=>styles.some(s=>s.id===id),worn=(c.inventory||[]).filter(i=>equippedForActiveBody(c,i)).map(i=>equipment.find(e=>e.index===i.equipmentIndex)).filter(Boolean),armored=worn.some(e=>e.armor_class&&e.index!=='shield'),shield=worn.some(e=>e.index==='shield'),heavy=worn.some(e=>e.armor_category==='Heavy'),mariner=has('mariner')&&!shield&&!heavy,pb=2+Math.floor((totalLevel(c)-1)/4);
 return {active:true,row,fighterRow,level:row.level,pb,styles,has,armored,shield,heavy,mariner,ac:(has('defense')&&armored?1:0)+(mariner?1:0),max,dc:8+pb+mod(abilities[c.fightingStyles?.dcAbility==='dex'?'dex':'str'])};
}
export function styleChoicePlan(c,previous=null,picks={}, {configure=false}={}){
 const p=fightingStyleProfile(c);if(!p.fighterRow)return {groups:[],patch:{},valid:true};
 const state={...c.fightingStyles},groups=[],selected=Array.from({length:p.max},(_,i)=>p.styles.find(s=>s.sourceClassLevel===(i?10:1))),before=previous?fightingStyleProfile(previous):null;let valid=true;
 for(let i=0;i<p.max;i++){
  const level=i?10:1,id=`2014:Fighter:fighting-style:${level}`,required=configure||Object.hasOwn(picks,id)||!selected[i]&&(p.level===1||p.max===2||previous&&!before?.active||i===1);
  if(!required)continue;
  const options=fightingStyles.filter(s=>!p.styles.some(other=>other.sourceClassName!=='Fighter'&&other.id===s.id)&&!selected.some((other,n)=>n!==i&&other?.id===s.id)).map(label),values=picks[id]||(selected[i]?[label(selected[i])]:[]),okay=values.length===1&&options.includes(values[0]);
  groups.push({id,className:'Fighter',level,kind:'source-choice',choiceKind:'option',label:i?'Additional Fighting Style':'Fighting Style',required:1,options,selected:values,valid:okay,sourceText:'Choose one style. You cannot choose the same Fighting Style twice. PHB: Player’s Handbook; TCE: Tasha’s Cauldron of Everything; UA: Unearthed Arcana playtest.',sourceUrl:'https://dnd5e.wikidot.com/fighter'});valid&&=okay;
  if(okay)selected[i]=findStyle(values[0]);
 }
 state.choices=selected.flatMap((s,i)=>s?[{...s,sourceClassId:p.row.catalogId,sourceClassName:'Fighter',sourceClassLevel:i?10:1,edition:'2014'}]:[]);
 if(selected.some(s=>s?.id==='superior-technique')){
  const id='2014:Fighter:superior-technique:maneuver',existing=battleMasterManeuvers.find(m=>m.id===state.maneuver),values=picks[id]||(existing?[existing.name]:[]),okay=values.length===1&&battleMasterManeuvers.some(m=>m.name===values[0]);
  if(configure||!existing||Object.hasOwn(picks,id))groups.push({id,className:'Fighter',level:1,kind:'source-choice',choiceKind:'option',label:'Superior Technique maneuver',required:1,options:battleMasterManeuvers.map(m=>m.name),selected:values,valid:okay,sourceText:'Learn one maneuver and gain one separate d6 superiority die per short or long rest. This never replaces Battle Master training or dice.'});
  valid&&=okay;if(okay)state.maneuver=battleMasterManeuvers.find(m=>m.name===values[0]).id;
 }
 return {groups,patch:{fightingStyles:state},valid};
}
export function styleWeaponModifiers(c,item,data){
 const p=fightingStyleProfile(c),state=c.fightingStyles?.attackModes?.[item.id]||{},thrown=state.mode==='thrown'&&data.properties?.some(x=>x.index==='thrown'),ranged=data.weapon_range==='Ranged'||thrown,melee=data.weapon_range==='Melee'&&!thrown,offhand=(state.offhand||state.mode==='offhand')&&data.weapon_range==='Melee',two=state.grip==='two'||data.properties?.some(x=>x.index==='two-handed'),has=id=>p.active&&p.has(id),qualifies=melee&&two&&data.properties?.some(x=>['two-handed','versatile'].includes(x.index));
 return {ranged,thrown,melee,offhand,two,attack:(has('archery')&&data.weapon_range==='Ranged'?2:0)+(has('close-quarters-shooter')&&ranged?1:0),damage:(has('thrown-weapon-fighting')&&thrown?2:0)+(has('dueling')&&data.weapon_range==='Melee'&&!offhand&&state.grip==='one'&&state.soleWeapon?2:0),offhandAbility:has('two-weapon-fighting'),dice:two&&data.two_handed_damage?.damage_dice||data.damage?.damage_dice,greatWeaponFighting:has('great-weapon-fighting')&&qualifies};
}
export function unarmedStyle(c,abilities=effectiveAbilityScores(c)){
 const p=fightingStyleProfile(c);if(!p.active||!p.has('unarmed-fighting'))return null;
 const rp=rageProfile(c),rage=rp.active&&!rp.heavy?rp.damage:0;
 return {attack:mod(abilities.str)+p.pb,damage:`1d${c.fightingStyles?.unarmedNoWeapons&&!p.shield?8:6}${signed(mod(abilities.str)+rage+bladesongProfile(c,abilities).meleeWeaponDamageBonus)}`};
}
export function greatWeaponReroll(original,replacements){
 let at=0;const kept=original.rolls.map(n=>n<=2?replacements.rolls[at++]:n);
 if(kept.some(n=>!Number.isFinite(n)))throw Error('Roll one replacement per weapon die showing 1 or 2.');
 return {kept,total:kept.reduce((n,x)=>n+x,0)+(original.bonus||0)};
}
export function fighterStyleActionBlock(c){if(!fightingStyleProfile(c).fighterRow)return '2014 Fighter levels are required.';if(actorActionBlock(c))return actorActionBlock(c);return conditionNames(c).some(s=>['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].includes(s.toLowerCase()))?'You cannot use this ability while incapacitated.':'';}
const resourceHasKey=(r,id)=>r?.id===id||r?.classResourceKey===id;
export const isTechniqueResource=r=>resourceHasKey(r,techniqueId);
const used=(c,id)=>Math.max(0,...(c.resources||[]).filter(r=>resourceHasKey(r,id)).map(r=>count(r.used)));
export function styleResources(c){const p=fightingStyleProfile(c);return p.active&&p.has('superior-technique')?[{id:techniqueId,classResourceKey:techniqueId,styleManaged:true,className:'Fighter',sourceClassId:p.row.catalogId,sourceClassName:'Fighter',edition:'2014',name:'Superior Technique d6',max:1,used:used(c,techniqueId),reset:'short',shortRecovery:'all',manual:false}]:[];}
export const secondWindExpression=c=>`1d10+${fightingStyleProfile(c).fighterRow?.level||0}`;
export function secondWindBlock(c){return fighterStyleActionBlock(c)||(used(c,secondWindId)>=1?'No Second Wind uses remaining.':'');}
export function useSecondWind(c,result,{maxHP}={}){const blocked=secondWindBlock(c);if(blocked)throw Error(blocked);if(!Number.isFinite(maxHP)||maxHP<1)throw Error('Supply the effective HP maximum.');if(!Number.isFinite(result?.total)||result.total<0)throw Error('Roll Second Wind healing first.');return {...(healActiveBody(c,result.total)||{...(result.total>0&&c.hp.current===0?{deathSaves:{success:0,failure:0}}:{}),hp:{...c.hp,current:Math.min(maxHP,Number(c.hp.current)+result.total)}}),resources:[...(c.resources||[]).filter(r=>r.id!==secondWindId&&r.classResourceKey!==secondWindId),{id:secondWindId,classResourceKey:secondWindId,name:'Second Wind',className:'Fighter',edition:'2014',max:1,used:1,reset:'short',shortRecovery:'all'}]};}
export function techniqueManeuvers(c){const p=fightingStyleProfile(c);if(!p.active||!p.has('superior-technique'))return [];const bm=fighterProfile(c);return [...new Map([battleMasterManeuvers.find(m=>m.id===c.fightingStyles?.maneuver),...(bm.kind==='battle-master'?bm.known:[])].filter(Boolean).map(m=>[m.id,m])).values()];}
export function techniqueExpression(c,id,{critical=false}={}){const m=techniqueManeuvers(c).find(m=>m.id===id);if(!m)throw Error('Choose a learned maneuver.');const extra=m.extraAbility?mod(effectiveAbilityScores(c)[m.extraAbility]):0;return `${critical&&m.damage?2:1}d6${extra?signed(extra):''}`;}
export function spendTechnique(c,id){const blocked=fighterStyleActionBlock(c);if(blocked)throw Error(blocked);if(!techniqueManeuvers(c).some(m=>m.id===id))throw Error('Choose a learned maneuver.');const r=styleResources(c)[0];if(!r||r.used>=1)throw Error('No Superior Technique dice remaining.');return {resources:[...(c.resources||[]).filter(r=>!isTechniqueResource(r)),{...r,used:1}]};}
export function styleReaction(c,id,{trigger=false,equipment=false}={}){const p=fightingStyleProfile(c),blocked=fighterStyleActionBlock(c);if(blocked)throw Error(blocked);if(!['protection','interception'].includes(id)||!p.has(id)||!trigger||!equipment)throw Error('Confirm the reaction trigger and required wielded equipment first.');return id==='interception'?{expression:`1d10+${p.pb}`,guidance:'Reduce the other target’s damage by this amount, to a minimum of 0; resolve the target’s HP at the table.'}:{guidance:'Impose disadvantage on this attack against the other target. This uses your reaction.'};}

export function styleSpellAttackBonus(c,spell){const p=fightingStyleProfile(c);return p.active&&p.has('close-quarters-shooter')&&(/ranged/i.test(spell?.attack_type||'')||/ranged spell attack/i.test(spell?.description||spell?.desc?.join(' ')||''))?1:0;}
