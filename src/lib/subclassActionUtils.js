import {expandedSubclassRows,expandedFeatureUnlocked,expandedChoiceId,expandedSubclassContext} from './expandedSubclasses.js';
import {characterResources} from './resources.js';
import {actorActionBlock,actorDeathBlock,healActiveBody} from './subclassState.js';
export {expandedSubclassContext};
export function sourceFeature(c,records,feature){
 const p=expandedSubclassRows(c).find(p=>records.includes(p.record.id.split(':').slice(-2).join(':')));
 const f=p?.record.features.find(f=>f.id===`${p.record.id}:${feature}`||f.name===feature);
 if(!p||!f||!expandedFeatureUnlocked(p,f))throw Error('This source feature is not available.');return {...p,feature:f,context:expandedSubclassContext(c,p.row)};
}
export function assertAct(c){const why=actorActionBlock(c);if(why)throw Error(why);}
// Zero-HP source triggers validate death on the original sheet. Passive triggers
// need no action; reaction triggers still respect independent incapacitation.
export function assertZeroHPTrigger(c,{passive=false}={}){const why=actorDeathBlock(c,{allowPostponedDeath:false})||(!passive&&actorActionBlock(c,{allowZeroHP:true}));if(why)throw Error(why);}
export function spendFeature(c,p,key,amount=1){
 if(!key||!amount)return {};
 const id=key.startsWith('2014:')?key:expandedChoiceId(p.row,p.record,`resource:${key}`),resources=characterResources(c),r=resources.find(r=>r.id===id||r.classResourceKey===id);
 if(!Number.isInteger(amount)||amount<1||!r||!r.unlimited&&r.max-r.used<amount)throw Error('Not enough resource uses remaining.');
 return {resources:resources.map(x=>x===r?{...x,used:x.unlimited?x.used:x.used+amount}:x)};
}
export function featureState(c,p,key,extra={}){return {id:`subclass:${p.row.catalogId}:${key}`,name:p.feature.name,sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,stateKey:key,...extra};}
export function putState(c,state){return {activeEffects:[...(c.activeEffects||[]).filter(e=>e.id!==state.id),state]};}
export function validRoll(result,{min=0,max=Infinity}={}){if(!Number.isFinite(result?.total)||result.total<min||result.total>max)throw Error('A valid visible roll result is required.');return result.total;}
export function tempHP(c,amount,source=null,{replace=false}={}){if(!Number.isFinite(amount)||amount<0)throw Error('Invalid temporary HP.');return {hp:amount>Number(c.hp.temp||0)||replace?{...c.hp,temp:amount,tempSource:source}:{...c.hp}};}
export function healHP(c,amount,maxHP){if(!Number.isFinite(amount)||amount<0||!Number.isFinite(maxHP))throw Error('Invalid healing.');const body=healActiveBody(c,amount);if(body)return body;return {hp:{...c.hp,current:Math.min(maxHP,Number(c.hp.current)+amount)},...(amount>0&&c.hp.current===0?{deathSaves:{success:0,failure:0}}:{})};}
