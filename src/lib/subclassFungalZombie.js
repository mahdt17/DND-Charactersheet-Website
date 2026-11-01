import {sourceFeature,assertAct,spendFeature} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';
import {localCreatureProfile} from './creatureProfiles.js';
const source=c=>sourceFeature(c,['druid:spores'],'fungal-infestation');
export function fungalZombies(c){
 let p;try{p=source(c);}catch{return [];}const profile=localCreatureProfile('zombie');
 return sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'fungal-zombie'}).map(e=>({...profile,...e,hp:{...e.hp,max:profile.hpMax}}));
}
export function animateFungalZombie(c,{triggered=false}={}){
 assertAct(c);const p=source(c);if(!triggered)throw Error('Confirm a Small or Medium beast or humanoid died within 10 feet.');const charge=spendFeature(c,p,'fungal-infestation');
 const entry={id:`fungal-zombie:${Date.now()}:${Math.random().toString(36).slice(2)}`,name:'Fungal Zombie',stateKey:'fungal-zombie',sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,profileId:'zombie',remainingSeconds:3600,canEnd:false,hp:{current:1}};
 return {...charge,activeEffects:[...(c.activeEffects||[]),entry]};
}
const requireZombie=(c,id)=>{const z=fungalZombies(c).find(x=>x.id===id);if(!z)throw Error('Zombie is not available.');return z;};
const update=(c,id,fn)=>({activeEffects:(c.activeEffects||[]).map(e=>e.id===id?fn(e):e)});
export function damageFungalZombie(c,id,amount){const z=requireZombie(c,id);if(!Number.isInteger(amount)||amount<0)throw Error('Enter nonnegative whole damage.');return update(c,id,e=>({...e,hp:{...e.hp,current:Math.max(0,z.hp.current-amount)}}));}
export function healFungalZombie(c,id,amount,{eligible=false}={}){const z=requireZombie(c,id);if(z.hp.current<=0)throw Error('Resolve zero HP first.');if(!eligible||!Number.isInteger(amount)||amount<0)throw Error('Confirm eligible healing and enter a valid amount.');return update(c,id,e=>({...e,hp:{...e.hp,current:Math.min(z.hp.max,z.hp.current+amount)}}));}
export function resolveFungalZombieZero(c,id,{survives=false,confirmed=false}={}){const z=requireZombie(c,id);if(z.hp.current!==0||!confirmed)throw Error('Confirm the zero-HP outcome at the table.');return survives?update(c,id,e=>({...e,hp:{...e.hp,current:1}})):{activeEffects:(c.activeEffects||[]).filter(e=>e.id!==id)};}
const conditionsAllowed=['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Prone','Restrained','Stunned','Unconscious'];
export function setFungalZombieConditions(c,id,conditions){requireZombie(c,id);if(!Array.isArray(conditions)||conditions.some(x=>!conditionsAllowed.includes(x)))throw Error('Invalid or immune condition.');return update(c,id,e=>({...e,conditions:[...new Set(conditions)]}));}
export function fungalZombieRollState(c,id){const z=requireZombie(c,id),conditions=z.conditions||[],has=(...names)=>names.some(n=>conditions.includes(n));return {attackDisadvantage:has('Blinded','Prone','Restrained'),dexSaveDisadvantage:has('Restrained'),strDexSaveFails:has('Paralyzed','Petrified','Stunned','Unconscious'),cannotAct:z.hp.current<=0||has('Incapacitated','Paralyzed','Petrified','Stunned','Unconscious')};}
