import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {actorActionBlock,retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
const sources=['2014:subclass:cleric:twilight','2014:subclass:cleric:twilight-ua'];
export function vigilantBlessingProfiles(c){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c))return [];
 return expandedSubclassRows(c).flatMap(p=>{const f=p.record.features.find(f=>sources.includes(f.inheritedRecordId||p.record.id)&&f.name==='Vigilant Blessing'&&expandedFeatureUnlocked(p,f));return f?[{...p,feature:f}]:[];});
}
export function setVigilantBlessing(c,ownerId,{recipient,confirmed=false}={}){
 const blocked=actorActionBlock(c);if(blocked)throw Error(blocked);const p=vigilantBlessingProfiles(c).find(p=>p.row.catalogId===ownerId);if(!p)throw Error('Vigilant Blessing is unavailable.');if(!confirmed||!['self','other'].includes(recipient))throw Error('Confirm the action and touched creature.');
 const id=`subclass:${ownerId}:vigilant-blessing`,activeEffects=(c.activeEffects||[]).filter(e=>e.id!==id);if(recipient==='self')activeEffects.push({id,name:'Vigilant Blessing',stateKey:'vigilant-blessing',sourceClassId:ownerId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id,canEnd:false});
 return {activeEffects,...(recipient==='other'?{subclassLastResult:{feature:'Vigilant Blessing',instructions:'The touched creature gains advantage on its next initiative roll; resolve the roll at the table.'}}:{})};
}
export function vigilantBlessingActive(c){return vigilantBlessingProfiles(c).some(p=>sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,featureId:p.feature.id,stateKey:'vigilant-blessing'}).length>0);}
export function consumeVigilantBlessing(c){const profiles=vigilantBlessingProfiles(c),ids=new Set(profiles.flatMap(p=>sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,featureId:p.feature.id,stateKey:'vigilant-blessing'}).map(e=>e.id)));return {activeEffects:(c.activeEffects||[]).filter(e=>!ids.has(e.id))};}
