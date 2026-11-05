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

const priorConversionRules=new Set(["Automatic access to the necrotic spell chain at total-character-level spell tiers (1, 3, 5, 7, 9, 11, 13, 15, 17). Discovery and copying are not required.", "Sage Psicrystal; +3 Arcana while within one mile. An acquired Ring of Spell Storing can be assigned to the crystal for autonomous revival with a stored eligible spell.", "Eligible Touch spells become 30 feet; +2 adjusted slot levels.", "Dark Knowledge also applies to dragons and constructs, using Arcana.", "One primary target, secondary targets up to the higher of Archivist level or approved effective caster level (maximum 20), each within 30 feet of primary. +3 slot levels; nondamaging secondary save DC -4. Adjusted Archivist slot costs cap at 9. Damaging secondaries take half the primary damage, then Dexterity save for half again.", "Use the Campaign workshop for compatible grafts. Proper materials, facilities and prerequisite spells allow automatic installation without attunement.", "Same spell and feat; highest participant DC +2 for first cooperator, +1 each additional. The lead uses normal casting and concentrates alone. Adjacent helpers each spend their own slot and reaction.", "No autonomous casting or revival is assumed.", "Selected class level only"]);
export function refreshConversionFeatDescriptions(c){
 if((c.ruleset||'2014')!=='2014')return c;
 let changed=false;
 const feats=(c.feats||[]).map(feat=>{
  const canonical=conversionFeats.find(rule=>rule.name===feat.name&&
   (feat.edition||'2014')==='2014'&&(!feat.catalogId||feat.catalogId===rule.catalogId));
  if(!canonical||feat.description===canonical.description)return feat;
  changed=true;
  const previous=String(feat.description||'').trim(),oldRules=priorConversionRules.has(previous)||/autonomous.*(?:not assumed|isn.t assumed)|no autonomous/i.test(previous);
  const notes=previous&&!oldRules?[...new Set([feat.notes,previous].filter(Boolean))].join('\n\n'):feat.notes;
  return {...feat,description:canonical.description,...(notes?{notes}:{}),...(previous?{previousDescription:previous}: {})};
 });
 return changed?{...c,feats}:c;
}
