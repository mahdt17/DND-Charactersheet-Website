import {subclassNumericProfile} from './subclassNumerics.js';
import {fightingStyleProfile} from './fightingStyles.js';
import {effectArmor} from './spellEffects.js';
import {spendSubclassSlot,activeFormProfile} from './subclassActive.js';
import {rageProfile} from './rage2014.js';
import {totemDamageResistance} from './totemWarrior.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {moonFormOptions,localCreatureProfile} from './creatureProfiles.js';
import {sourceFeature,assertAct,spendFeature,featureState} from './subclassActionUtils.js';
import {sourceSubclassEffects,damageActiveBody} from './subclassState.js';
import {conditionEffects} from './play.js';

export function ownFormProfile(c){
 const effect=sourceSubclassEffects(c).find(e=>e.stateKey==='moon-wild-shape');if(!effect)return null;
 const profile=localCreatureProfile(effect.profileRef?.creatureId),state=c.profileState?.[effect.id];if(!profile||!state?.hp)return null;
 const owner=sourceFeature(c,['druid:moon'],'combat-wild-shape'),mental=effectiveAbilityScores(c),abilities={...profile.abilities,int:mental.int,wis:mental.wis,cha:mental.cha},mod=n=>Math.floor((n-10)/2),pb=owner.context.pb;
 const skillAbility={Acrobatics:'dex','Animal Handling':'wis',Arcana:'int',Athletics:'str',Deception:'cha',History:'int',Insight:'wis',Intimidation:'cha',Investigation:'int',Medicine:'wis',Nature:'int',Perception:'wis',Performance:'cha',Persuasion:'cha',Religion:'int','Sleight of Hand':'dex',Stealth:'dex',Survival:'wis'};
 const skills=Object.fromEntries(Object.entries(skillAbility).map(([name,key])=>{const monster=profile.proficiencies.find(p=>p.name===`Skill: ${name}`),base=mod(abilities[key]),owner=base+(c.expertise?.[name]?2*pb:c.skillProf?.[name]?pb:0),creature=monster?base+monster.bonus-mod(profile.abilities[key]):-Infinity;return [name,Math.max(owner,creature)];}));
 const saves=Object.fromEntries(Object.keys(abilities).map(key=>{const label={str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'}[key],monster=profile.proficiencies.find(p=>p.name?.toUpperCase()===`SAVING THROW: ${label}`),base=mod(abilities[key]),owner=base+(c.saveProf?.[key]?pb:0),creature=monster?base+monster.bonus-mod(profile.abilities[key]):-Infinity;return [key,Math.max(owner,creature)];}));
 return {...profile,abilities,skills,saves,hp:{...state.hp},equipmentNotes:effect.equipmentNotes||'',wearingArmor:!!effect.wearingArmor,wearingShield:!!effect.wearingShield,wornItemIds:effect.wornItemIds||[],baseAC:effect.formBaseAC??profile.ac,effectId:effect.id,magicalAttacks:owner.row.level>=6&&profile.type==='beast'};
}
export function activateMoonForm(c,creatureId,{seen=false,equipmentResolved=false,equipmentNotes='',baseAC=null,wearingArmor=false,wearingShield=false,wornItemIds=[]}={}){
 assertAct(c);const elemental=['air-elemental','earth-elemental','fire-elemental','water-elemental'].includes(creatureId),p=sourceFeature(c,['druid:moon'],elemental?'elemental-wild-shape':'combat-wild-shape');
 if(sourceSubclassEffects(c).some(e=>e.stateKey==='moon-wild-shape'))throw Error('Wild Shape is already active.');
 const profile=moonFormOptions(p.row.level).find(x=>x.id===creatureId);if(!profile)throw Error('Choose an eligible Moon form.');if(!elemental&&!seen)throw Error('Confirm you have seen this beast.');if(!equipmentResolved)throw Error('Resolve equipment merging before changing form.');if(!Array.isArray(wornItemIds)||wornItemIds.some(id=>!(c.inventory||[]).some(i=>i.id===id&&i.equipped)))throw Error('Choose only currently equipped items.');if((wearingArmor||wearingShield)&&baseAC==null)throw Error('Confirm the form’s base AC with worn equipment.');if(baseAC!=null&&(!Number.isInteger(baseAC)||baseAC<1||baseAC>99))throw Error('Enter a valid table-confirmed base AC.');
 const spend=spendFeature(c,p,'2014:Druid:wild-shape',elemental?2:1),state=featureState(c,p,'moon-wild-shape',{remainingSeconds:Math.floor(p.row.level/2)*3600,profileRef:{catalogId:'2014:creatures',creatureId,kind:elemental?'elemental':'beast'},primalStrike:p.row.level>=6,equipmentResolved,equipmentNotes:String(equipmentNotes).slice(0,1000),wearingArmor:!!wearingArmor,wearingShield:!!wearingShield,wornItemIds:[...new Set(wornItemIds)],...(baseAC!=null?{formBaseAC:baseAC}:{})});
 return {...spend,activeEffects:[...(c.activeEffects||[]),state],profileState:{...c.profileState,[state.id]:{hp:{current:profile.hpMax,max:profile.hpMax}}}};
}
export function endOwnForm(c){const p=ownFormProfile(c);if(!p)throw Error('No active form.');const state={...c.profileState};delete state[p.effectId];return {activeEffects:(c.activeEffects||[]).filter(e=>e.id!==p.effectId),profileState:state};}
export function damageOwnForm(c,amount){const patch=damageActiveBody(c,amount);if(!patch)throw Error('No active form.');return patch;}
export function ownFormWalkingSpeed(c){
 const form=ownFormProfile(c);if(!form)return null;
 const projected={...c,speed:parseInt(form.speeds.walk,10)||0,hp:{...c.hp,current:form.hp.current},inventory:(c.inventory||[]).map(i=>({...i,equipped:i.equipped&&form.wornItemIds.includes(i.id)}))};
 return conditionEffects(projected).speed;
}
export function ownFormDamageAmount(c,amount,{type='',magical=false,weapon=false,vulnerable=false}={}){
 const form=ownFormProfile(c);if(!form)throw Error('No active form.');
 const damageType=String(type).toLowerCase(),physical=['bludgeoning','piercing','slashing'].includes(damageType),projected={...c,hp:{...c.hp,current:form.hp.current},inventory:(c.inventory||[]).map(i=>({...i,equipped:i.equipped&&form.wornItemIds.includes(i.id)}))},retained=activeFormProfile(projected),rage=rageProfile(projected);
 const immune=damageType&&(form.damageImmunities.some(x=>x.toLowerCase()===damageType)||retained.damageImmunities.includes(damageType));
 const resistant=damageType&&(form.damageResistances.some(x=>x.toLowerCase()===damageType||physical&&weapon&&!magical&&x.toLowerCase()==='bludgeoning, piercing, and slashing from nonmagical weapons')||retained.resistances.includes(damageType)||totemDamageResistance(projected,damageType)||rage.active&&!rage.heavy&&physical);
 const doubled=vulnerable||damageType&&(form.damageVulnerabilities.some(x=>x.toLowerCase()===damageType)||retained.vulnerabilities.includes(damageType)||retained.vulnerabilities.includes('all'));
 return immune?0:(resistant?Math.floor(amount/2):amount)*(doubled?2:1);
}
export function healMoonForm(c,{slotLevel,slotPool,result}={}){
 assertAct(c);const form=ownFormProfile(c);if(!form)throw Error('No active form.');if(!Number.isInteger(slotLevel)||slotLevel<1||!Number.isInteger(result?.total)||result.total<slotLevel||result.total>8*slotLevel)throw Error('A valid healing roll is required.');const spend=spendSubclassSlot(c,slotLevel,slotPool);return {...spend,profileState:{...c.profileState,[form.effectId]:{...c.profileState[form.effectId],hp:{...form.hp,current:Math.min(form.hp.max,form.hp.current+result.total)}}}};
}
export function healOwnForm(c,amount){const form=ownFormProfile(c);if(!form)throw Error('No active form.');if(!Number.isInteger(amount)||amount<0)throw Error('Enter a nonnegative whole healing amount.');return {profileState:{...c.profileState,[form.effectId]:{...c.profileState[form.effectId],hp:{...form.hp,current:Math.min(form.hp.max,form.hp.current+amount)}}}};}
export function ownFormArmor(c){const form=ownFormProfile(c);if(!form)return null;const projected={...c,inventory:(c.inventory||[]).map(i=>({...i,equipped:i.equipped&&form.wornItemIds.includes(i.id)}))},effects=effectArmor(projected,form.abilities,{armored:form.wearingArmor,shield:form.wearingShield}),numeric=subclassNumericProfile(projected,form.abilities),style=fightingStyleProfile(projected,form.abilities);return Math.max(effects.minimum,Math.max(form.baseAC,...effects.bases,...numeric.acBases,0)+effects.bonus+numeric.acBonus+style.ac);}
