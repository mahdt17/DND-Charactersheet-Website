import {effectArmor} from './spellEffects.js';
import {spendSubclassSlot} from './subclassActive.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {moonFormOptions,localCreatureProfile} from './creatureProfiles.js';
import {sourceFeature,assertAct,spendFeature,featureState} from './subclassActionUtils.js';
import {sourceSubclassEffects,damageActiveBody} from './subclassState.js';

export function ownFormProfile(c){
 const effect=sourceSubclassEffects(c).find(e=>e.stateKey==='moon-wild-shape');if(!effect)return null;
 const profile=localCreatureProfile(effect.profileRef?.creatureId),state=c.profileState?.[effect.id];if(!profile||!state?.hp)return null;
  const mental=effectiveAbilityScores(c),abilities={...profile.abilities,int:mental.int,wis:mental.wis,cha:mental.cha},mod=n=>Math.floor((n-10)/2),pb=sourceFeature(c,['druid:moon'],'combat-wild-shape').context.pb;
 const skillAbility={Acrobatics:'dex','Animal Handling':'wis',Arcana:'int',Athletics:'str',Deception:'cha',History:'int',Insight:'wis',Intimidation:'cha',Investigation:'int',Medicine:'wis',Nature:'int',Perception:'wis',Performance:'cha',Persuasion:'cha',Religion:'int','Sleight of Hand':'dex',Stealth:'dex',Survival:'wis'};
 const skills=Object.fromEntries(Object.entries(skillAbility).map(([name,key])=>{const monster=profile.proficiencies.find(p=>p.name===`Skill: ${name}`),base=mod(abilities[key]),owner=base+(c.expertise?.[name]?2*pb:c.skillProf?.[name]?pb:0),creature=monster?base+monster.bonus-mod(profile.abilities[key]):-Infinity;return [name,Math.max(owner,creature)];}));
 const saves=Object.fromEntries(Object.keys(abilities).map(key=>{const label={str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'}[key],monster=profile.proficiencies.find(p=>p.name?.toUpperCase()===`SAVING THROW: ${label}`),base=mod(abilities[key]),owner=base+(c.saveProf?.[key]?pb:0),creature=monster?base+monster.bonus-mod(profile.abilities[key]):-Infinity;return [key,Math.max(owner,creature)];}));
 return {...profile,abilities,skills,saves,hp:{...state.hp},equipmentNotes:effect.equipmentNotes||'',wearingArmor:!!effect.wearingArmor,wearingShield:!!effect.wearingShield,baseAC:effect.formBaseAC??profile.ac,effectId:effect.id,magicalAttacks:effect.primalStrike===true&&profile.type==='beast'};
}
export function activateMoonForm(c,creatureId,{seen=false,equipmentResolved=false,equipmentNotes='',baseAC=null,wearingArmor=false,wearingShield=false}={}){
 assertAct(c);const elemental=['air-elemental','earth-elemental','fire-elemental','water-elemental'].includes(creatureId),p=sourceFeature(c,['druid:moon'],elemental?'elemental-wild-shape':'combat-wild-shape');
 if(sourceSubclassEffects(c).some(e=>e.stateKey==='moon-wild-shape'))throw Error('Wild Shape is already active.');
 const profile=moonFormOptions(p.row.level).find(x=>x.id===creatureId);if(!profile)throw Error('Choose an eligible Moon form.');if(!elemental&&!seen)throw Error('Confirm you have seen this beast.');if(!equipmentResolved)throw Error('Resolve equipment merging before changing form.');if(baseAC!=null&&(!Number.isInteger(baseAC)||baseAC<1||baseAC>99))throw Error('Enter a valid table-confirmed base AC.');
 const spend=spendFeature(c,p,'2014:Druid:wild-shape',elemental?2:1),state=featureState(c,p,'moon-wild-shape',{remainingSeconds:Math.floor(p.row.level/2)*3600,profileRef:{catalogId:'2014:creatures',creatureId,kind:elemental?'elemental':'beast'},primalStrike:p.row.level>=6,equipmentResolved,equipmentNotes:String(equipmentNotes).slice(0,1000),wearingArmor:!!wearingArmor,wearingShield:!!wearingShield,...(baseAC!=null?{formBaseAC:baseAC}:{})});
 return {...spend,activeEffects:[...(c.activeEffects||[]),state],profileState:{...c.profileState,[state.id]:{hp:{current:profile.hpMax,max:profile.hpMax}}}};
}
export function endOwnForm(c){const p=ownFormProfile(c);if(!p)throw Error('No active form.');const state={...c.profileState};delete state[p.effectId];return {activeEffects:(c.activeEffects||[]).filter(e=>e.id!==p.effectId),profileState:state};}
export function damageOwnForm(c,amount){const patch=damageActiveBody(c,amount);if(!patch)throw Error('No active form.');return patch;}
export function healMoonForm(c,{slotLevel,slotPool,result}={}){
 assertAct(c);const form=ownFormProfile(c);if(!form)throw Error('No active form.');if(!Number.isInteger(slotLevel)||slotLevel<1||!Number.isInteger(result?.total)||result.total<slotLevel||result.total>8*slotLevel)throw Error('A valid healing roll is required.');const spend=spendSubclassSlot(c,slotLevel,slotPool);return {...spend,profileState:{...c.profileState,[form.effectId]:{...c.profileState[form.effectId],hp:{...form.hp,current:Math.min(form.hp.max,form.hp.current+result.total)}}}};
}
export function healOwnForm(c,amount){const form=ownFormProfile(c);if(!form)throw Error('No active form.');if(!Number.isInteger(amount)||amount<0)throw Error('Enter a nonnegative whole healing amount.');return {profileState:{...c.profileState,[form.effectId]:{...c.profileState[form.effectId],hp:{...form.hp,current:Math.min(form.hp.max,form.hp.current+amount)}}}};}
export function ownFormArmor(c){const form=ownFormProfile(c);if(!form)return null;const effects=effectArmor(c,form.abilities,{armored:form.wearingArmor,shield:form.wearingShield});return Math.max(effects.minimum,Math.max(form.baseAC,...effects.bases,0)+effects.bonus);}
