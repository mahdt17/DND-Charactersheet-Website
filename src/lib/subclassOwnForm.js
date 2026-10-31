import {spendSubclassSlot} from './subclassActive.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {moonFormOptions,localCreatureProfile} from './creatureProfiles.js';
import {sourceFeature,assertAct,spendFeature,featureState} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';

export function ownFormProfile(c){
 const effect=sourceSubclassEffects(c).find(e=>e.stateKey==='moon-wild-shape');if(!effect)return null;
 const profile=localCreatureProfile(effect.profileRef?.creatureId),state=c.profileState?.[effect.id];if(!profile||!state?.hp)return null;
 const mental=effectiveAbilityScores(c);return {...profile,abilities:{...profile.abilities,int:mental.int,wis:mental.wis,cha:mental.cha},hp:{...state.hp},effectId:effect.id,magicalAttacks:effect.primalStrike===true};
}
export function activateMoonForm(c,creatureId,{seen=false,equipmentResolved=false}={}){
 assertAct(c);const elemental=['air-elemental','earth-elemental','fire-elemental','water-elemental'].includes(creatureId),p=sourceFeature(c,['druid:moon'],elemental?'elemental-wild-shape':'combat-wild-shape');
 if(sourceSubclassEffects(c).some(e=>e.stateKey==='moon-wild-shape'))throw Error('Wild Shape is already active.');
 const profile=moonFormOptions(p.row.level).find(x=>x.id===creatureId);if(!profile)throw Error('Choose an eligible Moon form.');if(!elemental&&!seen)throw Error('Confirm you have seen this beast.');if(!equipmentResolved)throw Error('Resolve equipment merging before changing form.');
 const spend=spendFeature(c,p,'2014:Druid:wild-shape',elemental?2:1),state=featureState(c,p,'moon-wild-shape',{remainingSeconds:Math.floor(p.row.level/2)*3600,profileRef:{catalogId:'2014:creatures',creatureId,kind:elemental?'elemental':'beast'},primalStrike:p.row.level>=6,equipmentResolved});
 return {...spend,activeEffects:[...(c.activeEffects||[]),state],profileState:{...c.profileState,[state.id]:{hp:{current:profile.hpMax,max:profile.hpMax}}}};
}
export function endOwnForm(c){const p=ownFormProfile(c);if(!p)throw Error('No active form.');const state={...c.profileState};delete state[p.effectId];return {activeEffects:(c.activeEffects||[]).filter(e=>e.id!==p.effectId),profileState:state};}
export function damageOwnForm(c,amount){
 const p=ownFormProfile(c);if(!p)throw Error('No active form.');if(!Number.isInteger(amount)||amount<0)throw Error('Enter a nonnegative whole damage amount.');const temp=Math.max(0,Number(c.hp?.temp)||0),absorbed=Math.min(temp,amount),damage=amount-absorbed,remaining=Math.max(0,p.hp.current-damage),overflow=Math.max(0,damage-p.hp.current),hp={...c.hp,temp:temp-absorbed,current:Math.max(0,c.hp.current-overflow)};
 return remaining?{hp,profileState:{...c.profileState,[p.effectId]:{...c.profileState[p.effectId],hp:{...p.hp,current:remaining}}}}:{hp,...endOwnForm(c)};
}
export function healMoonForm(c,{slotLevel,slotPool,result}={}){
 assertAct(c);const form=ownFormProfile(c);if(!form)throw Error('No active form.');if(!Number.isInteger(slotLevel)||slotLevel<1||!Number.isInteger(result?.total)||result.total<slotLevel||result.total>8*slotLevel)throw Error('A valid healing roll is required.');const spend=spendSubclassSlot(c,slotLevel,slotPool);return {...spend,profileState:{...c.profileState,[form.effectId]:{...c.profileState[form.effectId],hp:{...form.hp,current:Math.min(form.hp.max,form.hp.current+result.total)}}}};
}
