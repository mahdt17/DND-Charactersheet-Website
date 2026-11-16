import {expandedSubclassRows} from './expandedSubclasses.js';
// Rest-only data patches stay independent of spell planning and the rules graph.
export function specialRecoveryRest(c,kind){
 if(kind!=='long')return {};
 const p=expandedSubclassRows(c).find(p=>['2014:subclass:fighter:psi-knight-ua','2014:subclass:rogue:soulknife-revisited-ua','2014:subclass:sorcerer:psionic-soul-ua'].includes(p.record.id)),patch={...(c.subclassElixirs?{subclassElixirs:[]}: {})};
 if(p)patch.subclassPsionic={...c.subclassPsionic,[p.row.catalogId]:{...c.subclassPsionic?.[p.row.catalogId],[p.record.id]:{sides:p.row.level>=17?12:p.row.level>=11?10:p.row.level>=5?8:6}}};
 if(c.subclassCooldowns)patch.subclassCooldowns=Object.fromEntries(Object.entries(c.subclassCooldowns).map(([k,n])=>[k,Math.max(0,n-1)]));return patch;
}
export function featureCastingRest(c,kind){return kind==='long'?{subclassEquipment:Object.fromEntries(Object.entries(c.subclassEquipment||{}).map(([owner,records])=>[owner,Object.fromEntries(Object.entries(records).map(([record,v])=>[record,record==='2014:subclass:warlock:hexblade'?{...v,'hex-weapon':null}:v]))])),subclassArcanum:Object.fromEntries(Object.entries(c.subclassArcanum||{}).map(([owner,levels])=>[owner,Object.fromEntries(Object.entries(levels).map(([level,v])=>[level,{...v,used:false}]))]))}:{};}
