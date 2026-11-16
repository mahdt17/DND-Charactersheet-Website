import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
export function stormbornProfile(c,ownerId){
 if(!retainsOwnFeatures(c))return null;
 for(const p of expandedSubclassRows(c)){
  if(ownerId&&p.row.catalogId!==ownerId)continue;
  const feature=p.record.features.find(f=>(f.inheritedRecordId||p.record.id)==='2014:subclass:cleric:tempest'&&f.name==='Stormborn'&&expandedFeatureUnlocked(p,f));
  if(feature)return {...p,feature,active:sourceSubclassEffects(c,{ownerId:p.row.catalogId,stateKey:'stormborn-outdoors'}).some(e=>e.sourceFeatureId===feature.id)};
 }
 return null;
}
export function setStormbornEnvironment(c,ownerId,outdoors){
 const p=stormbornProfile(c,ownerId);if(!p)throw Error('Stormborn is unavailable.');
 const id=`subclass:${p.row.catalogId}:stormborn-outdoors`,effects=(c.activeEffects||[]).filter(e=>e.id!==id);
 if(outdoors)effects.push({id,name:'Stormborn: outdoors',stateKey:'stormborn-outdoors',sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceFeatureId:p.feature.id});
 return {activeEffects:effects};
}
