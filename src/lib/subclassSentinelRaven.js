import {sourceFeature,assertAct,featureState,putState} from './subclassActionUtils.js';
import {sourceSubclassEffects,actorDeathBlock} from './subclassState.js';
import {localCreatureProfile} from './creatureProfiles.js';
const source=c=>sourceFeature(c,['warlock:raven-queen-ua'],'sentinel-raven');
export function sentinelRaven(c){let p;try{p=source(c);}catch{return null;}const e=sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'sentinel-raven'})[0];if(!e)return null;return {...localCreatureProfile('raven'),...e,status:actorDeathBlock(c)?'gone':e.status,hp:{...e.hp,max:1}};}
export function callSentinelRaven(c,{restConfirmed=false,initial=false}={}){assertAct(c);const p=source(c);if(!restConfirmed&&!(initial&&!sentinelRaven(c)))throw Error('Confirm a completed short or long rest.');const state=featureState(c,p,'sentinel-raven',{canEnd:false,profileId:'raven',status:'present',perched:false,hp:{current:1},conditions:[]});return putState(c,state);}
const requireRaven=c=>{const r=sentinelRaven(c);if(!r||r.status!=='present')throw Error('The raven is not present.');return r;};
const update=(c,id,fn)=>({activeEffects:(c.activeEffects||[]).map(e=>e.id===id?fn(e):e)});
export function setRavenPerched(c,perched){const r=requireRaven(c);return update(c,r.id,e=>({...e,perched:!!perched}));}
export function damageSentinelRaven(c,amount){const r=requireRaven(c);if(r.perched)throw Error('The perched raven cannot take damage.');if(!Number.isInteger(amount)||amount<0)throw Error('Enter nonnegative whole damage.');return update(c,r.id,e=>({...e,hp:{current:Math.max(0,r.hp.current-amount)},...(amount>=r.hp.current?{status:'gone',perched:false,killerPending:true}:{})}));}
export function ravenPerceptionBonus(c){const r=sentinelRaven(c);if(!r||r.status!=='present'||!r.perched)return 0;const p=source(c);return p.context.cha;}
export function loseSentinelRaven(c,{separated=false}={}){const r=requireRaven(c);if(!separated)throw Error('Confirm separation beyond five miles.');return update(c,r.id,e=>({...e,status:'gone',perched:false}));}
const allowed=['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'];
export function setRavenConditions(c,conditions){const r=requireRaven(c);if(!Array.isArray(conditions)||conditions.some(x=>!allowed.includes(x)))throw Error('Invalid condition.');return update(c,r.id,e=>({...e,conditions:[...new Set(conditions)]}));}
export function healSentinelRaven(c,amount,{eligible=false,ownerSpell=false}={}){const r=requireRaven(c);if(r.perched&&!ownerSpell)throw Error('Only an owner spell can affect the perched raven.');if(!eligible||!Number.isInteger(amount)||amount<0)throw Error('Confirm eligible healing and enter an amount.');return update(c,r.id,e=>({...e,hp:{current:Math.min(1,r.hp.current+amount)}}));}

export function ravenKillers(c){return sourceSubclassEffects(c,{stateKey:'raven-killer'});}
export function markRavenKiller(c,{name='',confirmed=false}={}){const r=sentinelRaven(c),p=source(c);if(!r?.killerPending||!confirmed||!String(name).trim())throw Error('Confirm the creature that killed the raven.');const entry={id:`raven-killer:${Date.now()}:${Math.random().toString(36).slice(2)}`,stateKey:'raven-killer',sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,name:String(name).trim().slice(0,100),remainingSeconds:86400,selected:false,canEnd:false};return {activeEffects:[...(c.activeEffects||[]).map(e=>e.id===r.id?{...e,killerPending:false}:e),entry]};}
export function selectRavenKiller(c,{name,selected=false}={}){if(!ravenKillers(c).some(e=>e.name===name))throw Error('Choose a recorded killer.');return {activeEffects:(c.activeEffects||[]).map(e=>e.stateKey==='raven-killer'?{...e,selected:!!selected&&e.name===name}:e)};}
export function ravenKillerAdvantage(c){return !actorDeathBlock(c)&&ravenKillers(c).some(e=>e.selected);}
