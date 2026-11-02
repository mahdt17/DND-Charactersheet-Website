import {sourceFeature,assertAct,spendFeature} from './subclassActionUtils.js';
import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {actorDeathBlock,sourceSubclassEffects} from './subclassState.js';
import {spendSubclassSlot} from './subclassActive.js';

const record='2014:subclass:artificer:battle-smith';
const source=c=>sourceFeature(c,['artificer:battle-smith'],'steel-defender');
const list=c=>Array.isArray(c.subclassCompanions)?c.subclassCompanions:[];
const owned=(c,p)=>list(c).find(x=>x.managedSubclassCompanion&&x.sourceClassId===p.row.catalogId&&x.subclassRecordId===record&&x.profileId==='steel-defender');
const save=(c,entry)=>({subclassCompanions:[...list(c).filter(x=>x.id!==entry.id),entry]});
const requireEntry=(c,id)=>{const p=source(c),entry=owned(c,p);if(!entry||entry.id!==id)throw Error('Steel Defender is not available.');return {p,entry};};
const maxHP=p=>Math.max(1,2+p.context.int+5*p.row.level);
export function steelDefenderProfile(c){
 let p;try{p=source(c);}catch{return null;}const entry=owned(c,p);if(!entry)return null;
 const hpMax=maxHP(p),pb=p.context.pb;
 return {...entry,name:'Steel Defender',size:'Medium',type:'construct',hitDice:`${p.row.level}d8`,ac:p.row.level>=15?17:15,hp:{current:Math.min(entry.hp.current,hpMax),max:hpMax},speed:40,abilities:{str:14,dex:12,con:14,int:4,wis:10,cha:6},saves:{str:2,dex:1+pb,con:2+pb,int:-3,wis:0,cha:-2},skills:{athletics:2+pb,perception:2*pb},spellAttack:pb+p.context.int,saveDC:8+pb+p.context.int,damage:`1d8+${pb}`,darkvision:60,repairUsed:entry.repairUsed||0};
}
export function createSteelDefender(c,{initial=false,smithTools=false}={}){
 assertAct(c);const p=source(c),old=owned(c,p),key=`${p.row.catalogId}:${record}`,history=c.subclassCompanionHistory||{};
 if(old||Object.hasOwn(history,key)){if(!smithTools||Number(c.subclassCompanionRest||0)<=Number(history[key]||0))throw Error('Complete a long rest and confirm smith’s tools to create a replacement.');}
 else if(!initial)throw Error('Confirm initial creation.');
 const legacyId=`expanded:${p.row.catalogId}:${record}:resource:defender-repair`,legacy=(c.resources||[]).filter(r=>r.id===legacyId||r.classResourceKey===legacyId);
 const repairUsed=old||Object.hasOwn(history,key)?0:Math.min(3,Math.max(0,...legacy.map(r=>Number(r.used)||0)));
 const entry={id:`steel-defender:${Date.now()}:${Math.random().toString(36).slice(2)}`,managedSubclassCompanion:true,sourceClassId:p.row.catalogId,subclassRecordId:record,sourceFeatureId:p.feature.id,profileId:'steel-defender',endsOnOwnerDeath:true,hp:{current:maxHP(p)},repairUsed};
 return {subclassCompanions:[...list(c).filter(x=>x!==old),entry],subclassCompanionHistory:{...history,[key]:Number(c.subclassCompanionRest||0)},...(legacy.length?{resources:(c.resources||[]).filter(r=>!legacy.includes(r))}:{})};
}
export function adjustCompanionHP(c,id,delta){
 const {p,entry}=requireEntry(c,id);if(!Number.isInteger(delta))throw Error('Enter a whole number of hit points.');if(entry.hp.current<=0&&delta>0)throw Error('A destroyed defender must be revived.');const current=Math.min(maxHP(p),Math.max(0,entry.hp.current+delta));return save(c,{...entry,hp:{...entry.hp,current}});
}
export function repairSteelDefender(c,id,result,{recipient,confirmed=false}={}){
 const {p,entry}=requireEntry(c,id),pb=p.context.pb;if(!confirmed||!['self','other'].includes(recipient))throw Error('Confirm the eligible construct or object within 5 feet.');if(entry.hp.current<=0||steelDefenderRollState(c,id).cannotAct)throw Error('The defender cannot use Repair.');if((entry.repairUsed||0)>=3)throw Error('No Repair uses remain today.');if(!Number.isInteger(result?.total)||result.total<2+pb||result.total>16+pb)throw Error('A valid Repair roll is required.');
 return save(c,{...entry,repairUsed:(entry.repairUsed||0)+1,hp:recipient==='self'?{...entry.hp,current:Math.min(maxHP(p),entry.hp.current+result.total)}:entry.hp});
}
const defenderConditions=['Blinded','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Prone','Restrained','Stunned','Unconscious'];
export function setSteelDefenderConditions(c,id,conditions){
 const {entry}=requireEntry(c,id);if(!Array.isArray(conditions)||conditions.some(x=>!defenderConditions.includes(x)))throw Error('Invalid or immune condition.');
 return save(c,{...entry,conditions:[...new Set(conditions)]});
}
export function steelDefenderRollState(c,id){
 const {entry}=requireEntry(c,id),conditions=entry.conditions||[],has=(...names)=>names.some(n=>conditions.includes(n));
 return {attackDisadvantage:has('Blinded','Prone','Restrained'),dexSaveDisadvantage:has('Restrained'),strDexSaveFails:has('Paralyzed','Petrified','Stunned','Unconscious'),cannotAct:entry.hp.current<=0||has('Incapacitated','Paralyzed','Petrified','Stunned','Unconscious')};
}
export function mendSteelDefender(c,id,result,{confirmed=false}={}){
 if(!confirmed)throw Error('Confirm Mending was cast on the defender.');if(!Number.isInteger(result?.total)||result.total<2||result.total>12)throw Error('A valid Mending roll is required.');
 return adjustCompanionHP(c,id,result.total);
}
export function recoverSteelDefenderRepair(c,id,{confirmed=false}={}){
 const {entry}=requireEntry(c,id);if(!confirmed)throw Error('Confirm the defender completed a long rest.');if(entry.hp.current<=0)throw Error('A destroyed defender cannot complete a long rest.');
 return save(c,{...entry,repairUsed:0});
}
export function reviveSteelDefender(c,id,{withinHour=false,withinFiveFeet=false,smithTools=false,slotLevel,slotPool}={}){
 assertAct(c);const {p,entry}=requireEntry(c,id);if(entry.hp.current>0||!withinHour||!withinFiveFeet||!smithTools)throw Error('Confirm the defender died within an hour, is within 5 feet, and smith’s tools are available.');const cost=spendSubclassSlot(c,slotLevel,slotPool);return {...cost,...save(c,{...entry,hp:{...entry.hp,current:maxHP(p)}})};
}

export function reconcileCompanions(c){
 if(!Array.isArray(c.subclassCompanions))return c;
 const owners=expandedSubclassRows(c);
 return {...c,subclassCompanions:c.subclassCompanions.filter(entry=>!entry.managedSubclassCompanion||((!(entry.endsOnOwnerDeath&&actorDeathBlock(c))||entry.profileId==='steel-defender')&&owners.some(p=>p.row.catalogId===entry.sourceClassId&&p.record.id===entry.subclassRecordId&&p.record.features.some(f=>f.id===entry.sourceFeatureId&&expandedFeatureUnlocked(p,f))))).map(entry=>entry.profileId==='steel-defender'&&entry.endsOnOwnerDeath&&actorDeathBlock(c)?{...entry,hp:{...entry.hp,current:0}}:entry) };
}


export function companionLongRest(c){return {subclassCompanionRest:Number(c.subclassCompanionRest||0)+1};}

const cannonSource=c=>sourceFeature(c,['artificer:artillerist'],'eldritch-cannon');
export function eldritchCannons(c){
 let p;try{p=cannonSource(c);}catch{return [];}
 return sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'eldritch-cannon'}).map(e=>({...e,ac:18,hp:{...e.hp,current:Math.min(e.hp.current,5*p.row.level),max:5*p.row.level},spellAttack:p.context.pb+p.context.int,saveDC:8+p.context.pb+p.context.int,damageDice:p.row.level>=9?'3d8':'2d8',intModifier:p.context.int}));
}
export function createEldritchCannon(c,{type,size,legs=false,tools=false,cost,slotLevel,slotPool}={}){
 assertAct(c);const p=cannonSource(c),active=eldritchCannons(c);
 if(active.length>=(p.row.level>=15?2:1))throw Error('Cannon capacity reached.');
 if(!['Flamethrower','Force Ballista','Protector'].includes(type)||!['Small','Tiny'].includes(size)||!tools)throw Error('Choose a cannon, size and confirm tools and placement.');
 const charge=cost==='free'?spendFeature(c,p,'cannon-create'):cost==='slot'?spendSubclassSlot(c,slotLevel,slotPool):null;if(!charge)throw Error('Choose the free use or a spell slot.');
 const id=`cannon:${Date.now()}:${Math.random().toString(36).slice(2)}`,entry={id,name:`${type} cannon`,stateKey:'eldritch-cannon',sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,type,size,legs,remainingSeconds:3600,canEnd:false,hp:{current:5*p.row.level,temp:0}};
 return {...charge,activeEffects:[...(c.activeEffects||[]),entry]};
}
function cannonEntry(c,id){const p=cannonSource(c),entry=eldritchCannons(c).find(x=>x.id===id);if(!entry)throw Error('Cannon is not available.');return {p,entry};}
function saveCannon(c,entry){return {activeEffects:(c.activeEffects||[]).map(e=>e.id===entry.id?entry:e)};}
export function activateProtectorCannon(c,id,result,{within60=false}={}){
 assertAct(c);const {p,entry}=cannonEntry(c,id);if(entry.type!=='Protector'||!within60)throw Error('Confirm the Protector cannon is within 60 feet.');
 const mod=Math.max(1,p.context.int);if(!Number.isInteger(result?.total)||result.total<1+mod||result.total>8+mod)throw Error('A valid Protector roll is required.');
 return saveCannon(c,{...entry,hp:{...entry.hp,temp:Math.max(entry.hp.temp||0,result.total)}});
}
export function damageEldritchCannon(c,id,amount){
 const {entry}=cannonEntry(c,id);if(!Number.isInteger(amount)||amount<0)throw Error('Enter nonnegative whole damage.');const absorbed=Math.min(entry.hp.temp||0,amount),current=Math.max(0,entry.hp.current-(amount-absorbed));
 return current?saveCannon(c,{...entry,hp:{...entry.hp,current,temp:(entry.hp.temp||0)-absorbed}}):{activeEffects:(c.activeEffects||[]).filter(e=>e.id!==id)};
}
export function mendEldritchCannon(c,id,result,{confirmed=false}={}){
 const {entry}=cannonEntry(c,id);if(!confirmed)throw Error('Confirm Mending was cast on the cannon.');if(!Number.isInteger(result?.total)||result.total<2||result.total>12)throw Error('A valid Mending roll is required.');
 return saveCannon(c,{...entry,hp:{...entry.hp,current:Math.min(entry.hp.max,entry.hp.current+result.total)}});
}
export function dismissEldritchCannon(c,id){assertAct(c);cannonEntry(c,id);return {activeEffects:(c.activeEffects||[]).filter(e=>e.id!==id)};}
export function detonateEldritchCannon(c,id,{within60=false}={}){assertAct(c);const {p}=cannonEntry(c,id);if(p.row.level<9)throw Error('Explosive Cannon requires Artificer level 9.');if(!within60)throw Error('Confirm the cannon is within 60 feet.');return {activeEffects:(c.activeEffects||[]).filter(e=>e.id!==id)};}
