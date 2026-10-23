import {conversionFeats,campaignIds} from '../data/archivistCampaign.js';

export const conversionRows=c=>c.classLevels?.length?c.classLevels:[{name:c.className,definition:c.classDefinition,level:c.level,edition:c.ruleset||'2014'}];
export function conversionFeatOwned(c,name){
 if((c.ruleset||'2014')!=='2014')return false;
 const canonical=conversionFeats.find(f=>f.name===name);
 return !!canonical&&(c.feats||[]).some(f=>(f.edition||'2014')==='2014'&&f.name===name&&(!f.catalogId||f.catalogId===canonical.catalogId));
}
export const conversionFeatActive=c=>conversionFeats.some(f=>conversionFeatOwned(c,f.name));
export function conversionStateActive(c){
 if((c.ruleset||'2014')!=='2014'||conversionRows(c).some(r=>(r.edition||'2014')!=='2014'||r.definition?.edition&&r.definition.edition!=='2014'))return false;
 const s=c.archivistCampaign||{};
 return !!(s.grafts?.length||s.creatures?.length||s.followers?.length||s.projects?.length||s.empowerment?.rounds>0||s.sensing?.minutes>0||Object.values(s.powerEffects||{}).some(e=>e.minutes>0));
}
export const conversionClassActive=c=>(c.ruleset||'2014')==='2014'&&conversionRows(c).some(r=>(r.edition||'2014')==='2014'&&Number(r.level)>0&&Object.values(campaignIds).includes(r.definition?.catalogId||r.catalogId));
