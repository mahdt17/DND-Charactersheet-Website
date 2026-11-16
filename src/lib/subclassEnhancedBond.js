import {retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
import {sourceFeature} from './subclassActionUtils.js';

// The d8 is a bonus to one spell roll, not another ray or an independent heal.
// Keeping its visible result separate also avoids multiplying it on critical hits.
export function enhancedBondPlan(c,spell,plan){
 if(!retainsOwnFeatures(c)||(spell.edition&&spell.edition!=='2014')||plan.rolls.some(r=>r.enhancedBond))return plan;
 let p;try{p=sourceFeature(c,['druid:wildfire','druid:wildlife-ua'],'enhanced-bond');}catch{return plan;}
 const spirit=sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'druid-companion'}).find(e=>e.hp?.current>0);
 if(!spirit)return plan;
 const healing=plan.rolls.find(r=>/healing/i.test(r.label)),fire=plan.rolls.find(r=>/fire/i.test(r.label)&&/damage/i.test(r.label));
 if(!healing&&!fire)return plan;
 const label=healing?'Enhanced Bond · Healing bonus':'Enhanced Bond · Fire damage bonus';
 return {...plan,rolls:[...plan.rolls,{expression:'1d8',label,enhancedBond:true,oncePerCast:true,critical:false}],notes:[plan.notes,'Enhanced Bond adds this d8 to one eligible spell roll. A spell with a range other than Self can originate from you or your wildfire spirit; confirm origin, range and targets at the table.'].filter(Boolean).join(' ')};
}
