import {sourceFeature,assertAct} from './subclassActionUtils.js';
import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {actorDeathBlock} from './subclassState.js';
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
 return {...entry,name:'Steel Defender',size:'Medium',type:'construct',ac:p.row.level>=15?17:15,hp:{current:Math.min(entry.hp.current,hpMax),max:hpMax},speed:40,saves:{dex:1+pb,con:2+pb},skills:{athletics:2+pb,perception:2*pb},spellAttack:pb+p.context.int,saveDC:8+pb+p.context.int,damage:`1d8+${pb}`,darkvision:60,repairUsed:entry.repairUsed||0};
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
 const {p,entry}=requireEntry(c,id),pb=p.context.pb;if(!confirmed||!['self','other'].includes(recipient))throw Error('Confirm the eligible construct or object within 5 feet.');if(entry.hp.current<=0)throw Error('A destroyed defender cannot use Repair.');if((entry.repairUsed||0)>=3)throw Error('No Repair uses remain today.');if(!Number.isInteger(result?.total)||result.total<2+pb||result.total>16+pb)throw Error('A valid Repair roll is required.');
 return save(c,{...entry,repairUsed:(entry.repairUsed||0)+1,hp:recipient==='self'?{...entry.hp,current:Math.min(maxHP(p),entry.hp.current+result.total)}:entry.hp});
}
export function recoverSteelDefenderRepair(c,id,{confirmed=false}={}){
 const {entry}=requireEntry(c,id);if(!confirmed)throw Error('Confirm the defender completed a long rest.');
 return save(c,{...entry,repairUsed:0});
}
export function reviveSteelDefender(c,id,{withinHour=false,withinFiveFeet=false,smithTools=false,slotLevel,slotPool}={}){
 assertAct(c);const {p,entry}=requireEntry(c,id);if(entry.hp.current>0||!withinHour||!withinFiveFeet||!smithTools)throw Error('Confirm the defender died within an hour, is within 5 feet, and smith’s tools are available.');const cost=spendSubclassSlot(c,slotLevel,slotPool);return {...cost,...save(c,{...entry,hp:{...entry.hp,current:maxHP(p)}})};
}

export function reconcileCompanions(c){
 if(!Array.isArray(c.subclassCompanions))return c;
 const owners=expandedSubclassRows(c);
 return {...c,subclassCompanions:c.subclassCompanions.filter(entry=>!entry.managedSubclassCompanion||(!(entry.endsOnOwnerDeath&&actorDeathBlock(c))&&owners.some(p=>p.row.catalogId===entry.sourceClassId&&p.record.id===entry.subclassRecordId&&p.record.features.some(f=>f.id===entry.sourceFeatureId&&expandedFeatureUnlocked(p,f))))) };
}


export function companionLongRest(c){return {subclassCompanionRest:Number(c.subclassCompanionRest||0)+1};}
