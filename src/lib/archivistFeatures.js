// Per-character DM adjustments. Prayerbook casting is always retained.
export const adjustableArchivistFeatures=['Dark Knowledge','Lore Mastery','Still Mind','Scribe Scroll','Bonus feats','Arcane Recovery'];
export const archivistFeatureEnabled=(c,name)=>!(c.archivistCampaign?.disabledFeatures||[]).includes(name);
export const archivistBonusRemoved=(c,id)=>(c.archivistCampaign?.removedBonusSlots||[]).includes(id)||id?.startsWith('archivist:')&&!archivistFeatureEnabled(c,'Bonus feats');
export function setArchivistFeatureEnabled(c,name,enabled){
 if(!adjustableArchivistFeatures.includes(name))throw Error('Choose an Archivist feature.');
 const state=c.archivistCampaign||{},disabled=new Set(state.disabledFeatures||[]);enabled?disabled.delete(name):disabled.add(name);
 let feats=c.feats||[],archived=state.disabledBonusFeats||[];
 if(name==='Bonus feats'){
  if(enabled){feats=[...feats,...archived.filter(f=>!archivistBonusRemoved({...c,archivistCampaign:{...state,disabledFeatures:[...disabled]}},f.conversionBonusSlot)&&!feats.some(x=>(x.id||x.conversionBonusSlot)===(f.id||f.conversionBonusSlot)))];archived=[];}
  else {archived=[...archived,...feats.filter(f=>f.conversionBonusSlot?.startsWith('archivist:'))];feats=feats.filter(f=>!f.conversionBonusSlot?.startsWith('archivist:'));}
 }
 return {...c,feats,archivistCampaign:{...state,disabledFeatures:[...disabled],disabledBonusFeats:archived}};
}
export function removeConvertedFeat(c,feat){
 const state=c.archivistCampaign||{},removedBonusSlots=new Set(state.removedBonusSlots||[]),removedLegacyFeats=new Set(state.removedLegacyFeats||[]);
 if(feat.conversionBonusSlot)removedBonusSlots.add(feat.conversionBonusSlot);
 removedLegacyFeats.add(feat.name);
 return {...c,feats:(c.feats||[]).filter(f=>f!==feat&&(!feat.id||f.id!==feat.id)),archivistCampaign:{...state,removedBonusSlots:[...removedBonusSlots],removedLegacyFeats:[...removedLegacyFeats]}};
}
