import domains from '../data/domains35.json' with {type:'json'};
import {contentKey} from './advancement.js';
export const legacySchools=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
export {domains as legacyDomains};
const norm=s=>String(s||'').toLowerCase().replaceAll('’',"'").replace(/[^a-z0-9]+/g,' ').trim();
export const legacyChoiceKey=c=>c.activeCastingClassId||c.classLevels?.[0]?.catalogId||contentKey(c.classDefinition||{name:c.className,edition:c.ruleset});
export const legacyChoices=c=>c.legacyCastingChoices?.[legacyChoiceKey(c)]||{};
export const isDomainCaster=c=>['Cleric','Cloistered Cleric'].includes(c.className);
export function validLegacyChoices(c){
 const x=legacyChoices(c);
 if(isDomainCaster(c))return Array.isArray(x.domains)&&x.domains.length===2&&new Set(x.domains).size===2&&x.domains.every(name=>(c.className!=='Cloistered Cleric'||name!=='Knowledge')&&domains.some(d=>d.name===name)&&!(['Law','Chaos','Good','Evil'].includes(name)&&({Law:/chaotic/i,Chaos:/lawful/i,Good:/evil/i,Evil:/good/i}[name]).test(c.alignment||'')));
 if(c.className==='Wizard'&&x.school)return legacySchools.includes(x.school)&&Array.isArray(x.prohibited)&&x.prohibited.length===(x.school==='Divination'?1:2)&&new Set(x.prohibited).size===x.prohibited.length&&x.prohibited.every(s=>legacySchools.includes(s)&&s!==x.school&&s!=='Divination');
 return true;
}
export function domainSpell(c,s){
 if(!isDomainCaster(c)||!validLegacyChoices(c))return null;
 const selected=[...legacyChoices(c).domains,...(c.className==='Cloistered Cleric'?['Knowledge']:[])];
 return domains.filter(d=>selected.includes(d.name)).flatMap(d=>d.spells.map(s=>({...s,domain:d.name}))).find(x=>norm(x.name)===norm(s.name))||null;
}
export function prohibitedSpell(c,s){return c.className==='Wizard'&&legacyChoices(c).school&&(!validLegacyChoices(c)||legacyChoices(c).prohibited.some(x=>norm(x)===norm(s.school?.name||s.school).split(' ')[0]));}
export function restrictedCastingOptions(c,s,pools){
 if(!validLegacyChoices(c))return [];
 const id=legacyChoiceKey(c),x=legacyChoices(c),domain=domainSpell(c,s),result=[];
 for(const kind of ['domain','specialist']){
  const minimum=kind==='domain'?domain?.level:s.level;
  if(kind==='domain'&&!domain||kind==='specialist'&&!(c.className==='Wizard'&&x.school&&norm(s.school?.name||s.school).startsWith(norm(x.school))))continue;
  const totals=kind==='domain'?pools.restricted||[]:pools.standard.map(n=>n>0?1:0);
  for(let level=minimum;level<totals.length;level++){const remaining=(totals[level]||0)-(c.classRestrictedSlotsUsed?.[id]?.[kind]?.[level]||0);if(remaining>0)result.push({pool:kind,level,remaining});}
 }
 return result;
}
export function spendRestrictedSlot(c,s,option,pools){
 if(!restrictedCastingOptions(c,s,pools).some(x=>x.pool===option.pool&&x.level===option.level))throw Error('No eligible restricted slot remains.');
 const id=legacyChoiceKey(c),all=c.classRestrictedSlotsUsed||{},entry=all[id]||{},used=entry[option.pool]||{};
 return {classRestrictedSlotsUsed:{...all,[id]:{...entry,[option.pool]:{...used,[option.level]:(used[option.level]||0)+1}}}};
}
