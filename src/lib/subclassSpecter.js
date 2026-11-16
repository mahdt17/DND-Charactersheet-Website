import {sourceFeature,assertAct,spendFeature} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';
import {localCreatureProfile} from './creatureProfiles.js';

const specterSource=c=>sourceFeature(c,['warlock:hexblade'],'accursed-specter');
export function accursedSpecter(c){
 let p;try{p=specterSource(c);}catch{return null;}const e=sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'accursed-specter'})[0];if(!e)return null;
 const profile=localCreatureProfile('specter');return {...profile,...e,hp:{...e.hp,max:profile.hpMax},attacks:profile.attacks.map(a=>({...a,toHit:a.toHit+Math.max(0,p.context.cha)}))};
}
export function bindAccursedSpecter(c,{slainHumanoid=false}={}){
 assertAct(c);const p=specterSource(c);if(!slainHumanoid)throw Error('Confirm you slew a humanoid.');if(accursedSpecter(c))throw Error('The bound specter is already present.');const charge=spendFeature(c,p,'accursed-specter'),profile=localCreatureProfile('specter');
 const entry={id:`specter:${Date.now()}:${Math.random().toString(36).slice(2)}`,name:'Accursed Specter',stateKey:'accursed-specter',sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,profileId:'specter',endsOnLongRest:true,canEnd:false,hp:{current:profile.hpMax,temp:Math.floor(p.row.level/2)}};
 return {...charge,activeEffects:[...(c.activeEffects||[]),entry]};
}
export function damageAccursedSpecter(c,id,amount){
 const s=accursedSpecter(c);if(!s||s.id!==id)throw Error('Specter is not available.');if(!Number.isInteger(amount)||amount<0)throw Error('Enter nonnegative whole damage.');const absorbed=Math.min(s.hp.temp||0,amount),current=Math.max(0,s.hp.current-(amount-absorbed));
 return current?{activeEffects:(c.activeEffects||[]).map(e=>e.id===id?{...e,hp:{...e.hp,current,temp:(s.hp.temp||0)-absorbed}}:e)}:{activeEffects:(c.activeEffects||[]).filter(e=>e.id!==id)};
}
export function healAccursedSpecter(c,id,amount,{eligible=false}={}){
 const s=accursedSpecter(c);if(!s||s.id!==id)throw Error('Specter is not available.');if(!eligible||!Number.isInteger(amount)||amount<0)throw Error('Confirm eligible healing and enter a nonnegative whole amount.');
 return {activeEffects:(c.activeEffects||[]).map(e=>e.id===id?{...e,hp:{...e.hp,current:Math.min(s.hp.max,s.hp.current+amount)}}:e)};
}
const conditionsAllowed=['Blinded','Deafened','Frightened','Incapacitated','Invisible','Stunned'];
export function setSpecterConditions(c,id,conditions){
 const s=accursedSpecter(c);if(!s||s.id!==id)throw Error('Specter is not available.');if(!Array.isArray(conditions)||conditions.some(x=>!conditionsAllowed.includes(x)))throw Error('Invalid or immune condition.');
 return {activeEffects:(c.activeEffects||[]).map(e=>e.id===id?{...e,conditions:[...new Set(conditions)]}:e)};
}
export function specterRollState(c,id,{sunlight=false}={}){
 const s=accursedSpecter(c);if(!s||s.id!==id)throw Error('Specter is not available.');const conditions=s.conditions||[];
 return {attackDisadvantage:sunlight||conditions.includes('Blinded'),cannotAct:conditions.some(x=>['Incapacitated','Stunned'].includes(x)),strDexSaveFails:conditions.includes('Stunned')};
}
