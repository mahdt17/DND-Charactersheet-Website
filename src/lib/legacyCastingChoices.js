import domains from '../data/domains35.json' with {type:'json'};
import deities from '../data/deities35.json' with {type:'json'};
import {characterClasses,contentKey} from './advancement.js';
export const legacySchools=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
export {domains as legacyDomains,deities as legacyDeities};
const norm=s=>String(s||'').toLowerCase().replaceAll('’',"'").replace(/[^a-z0-9]+/g,' ').trim();
const slug=s=>norm(s).replace(/\s+/g,'-');
const knowledgeSkills=['Knowledge (arcana)','Knowledge (architecture and engineering)','Knowledge (dungeoneering)','Knowledge (geography)','Knowledge (history)','Knowledge (local)','Knowledge (nature)','Knowledge (nobility and royalty)','Knowledge (religion)','Knowledge (planes)'];
export const legacyChoiceKey=c=>c.activeCastingClassId||c.classLevels?.[0]?.catalogId||contentKey(c.classDefinition||{name:c.className,edition:c.ruleset});
export const legacyChoices=c=>c.legacyCastingChoices?.[legacyChoiceKey(c)]||{};
export const isDomainCaster=c=>['Cleric','Cloistered Cleric'].includes(c.className);
export const isWizardCaster=c=>c.className==='Wizard'||String(c.classDefinition?.inheritedFromClassId||'').replace(/^dndtools:/,'')==='classes/wizard-99';
export const specialistSchool=c=>String(c.classDefinition?.specialistSchool||legacyChoices(c).school||'');
const deityByName=name=>deities.find(d=>norm(d.name)===norm(name));
function alignmentAxes(value){
 const raw=String(value||'').trim(),short=raw.toUpperCase();
 const shortMap={LG:[1,1],LN:[1,0],LE:[1,-1],NG:[0,1],N:[0,0],TN:[0,0],NE:[0,-1],CG:[-1,1],CN:[-1,0],CE:[-1,-1]};
 if(shortMap[short])return shortMap[short];
 const key=norm(raw);
 if(!key)return null;
 return [key.includes('lawful')?1:key.includes('chaotic')?-1:0,key.includes('good')?1:key.includes('evil')?-1:0];
}
function alignmentDomainAllowed(name,alignment){
 const axes=alignmentAxes(alignment);if(!axes)return true;
 if(name==='Law')return axes[0]===1;if(name==='Chaos')return axes[0]===-1;if(name==='Good')return axes[1]===1;if(name==='Evil')return axes[1]===-1;
 return true;
}
export function deityAlignmentCompatible35(characterAlignment,deityAlignment){
 const a=alignmentAxes(characterAlignment),d=alignmentAxes(deityAlignment);
 return !a||!d||Math.abs(a[0]-d[0])+Math.abs(a[1]-d[1])<=1;
}
export function availableDomains35(c){
 if(!isDomainCaster(c))return [];
 const x=legacyChoices(c),deity=x.deity?deityByName(x.deity):null;
 if(x.deity&&!deity)return [];
 let result=deity?domains.filter(d=>deity.domains.includes(d.name)):[...domains];
 result=result.filter(d=>alignmentDomainAllowed(d.name,c.alignment));
 if(c.className==='Cloistered Cleric')result=result.filter(d=>d.name!=='Knowledge');
 return result;
}
export function selectedDomains35(c){
 if(!isDomainCaster(c))return [];
 const names=[...(legacyChoices(c).domains||[]),...(c.className==='Cloistered Cleric'?['Knowledge']:[])];
 return [...new Set(names)].map(name=>domains.find(d=>d.name===name)).filter(Boolean);
}
export function validLegacyChoices(c){
 const x=legacyChoices(c);
 if(isDomainCaster(c)){
  const chosen=Array.isArray(x.domains)?x.domains:[],available=new Set(availableDomains35(c).map(d=>d.name)),deity=x.deity?deityByName(x.deity):null;
  if(chosen.length!==2||new Set(chosen).size!==2||!chosen.every(name=>available.has(name)))return false;
  if(x.deity&&(!deity||!deityAlignmentCompatible35(c.alignment,deity.alignment)))return false;
  if(chosen.includes('War')&&!deity&&!String(x.favoredWeapon||'').trim())return false;
  return true;
 }
 const school=specialistSchool(c);
 if(isWizardCaster(c)&&school)return legacySchools.includes(school)&&Array.isArray(x.prohibited)&&x.prohibited.length===(school==='Divination'?1:2)&&new Set(x.prohibited).size===x.prohibited.length&&x.prohibited.every(s=>legacySchools.includes(s)&&s!==school&&s!=='Divination');
 return true;
}
export function domainSpell(c,s){
 if(!isDomainCaster(c)||!validLegacyChoices(c))return null;
 return selectedDomains35(c).flatMap(d=>d.spells.map(s=>({...s,domain:d.name}))).find(x=>norm(x.name)===norm(s.name))||null;
}
export function prohibitedSpell(c,s){return isWizardCaster(c)&&specialistSchool(c)&&(!validLegacyChoices(c)||legacyChoices(c).prohibited.some(x=>norm(x)===norm(s.school?.name||s.school).split(' ')[0]));}
export function restrictedCastingOptions(c,s,pools){
 if(!validLegacyChoices(c))return [];
 const id=legacyChoiceKey(c),domain=domainSpell(c,s),result=[];
 for(const kind of ['domain','specialist']){
  const minimum=kind==='domain'?domain?.level:s.level;
  const school=specialistSchool(c);
  if(kind==='domain'&&!domain||kind==='specialist'&&!(isWizardCaster(c)&&school&&c.classDefinition?.specialistBonusSlots!==false&&norm(s.school?.name||s.school).startsWith(norm(school))))continue;
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
const domainOwned=entry=>entry?.sourceType==='domain';
const sourceMeta=(row,domain)=>({sourceType:'domain',automatic:true,sourceClassId:row.catalogId,sourceClassName:row.name,sourceClassLevel:row.level,edition:'3.5',domain:domain.name,sourceUrl:domain.grantedPower?.sourceUrl||domain.sourceUrl});
const resourceMaximum=(resource,row,character)=>{
 if(!resource)return 0;
 if(resource.maxMode==='classLevel')return Math.max(0,Number(row.level)||0);
 if(resource.maxMode==='charisma')return Math.max(0,(Number(resource.base)||0)+Math.floor(((Number(character.abilities?.cha)||10)-10)/2));
 return Math.max(0,Number(resource.max)||0);
};
export function reconcileDomainGrants35(character){
 let grantedFeatures=(character.grantedFeatures||[]).filter(entry=>!domainOwned(entry));
 let actions=(character.actions||[]).filter(entry=>!domainOwned(entry));
 let feats=(character.feats||[]).filter(entry=>!domainOwned(entry));
 let trainingGrants=(character.trainingGrants||[]).filter(entry=>!domainOwned(entry));
 let classSkills35=(character.classSkills35||[]).filter(entry=>!domainOwned(entry));
 const priorResources=new Map((character.resources||[]).filter(domainOwned).map(entry=>[entry.id,entry]));
 let resources=(character.resources||[]).filter(entry=>!domainOwned(entry));
 for(const row of characterClasses(character).filter(row=>row.edition==='3.5'&&['Cleric','Cloistered Cleric'].includes(row.name))){
  const model={...character,className:row.name,classDefinition:row.definition,activeCastingClassId:row.catalogId};
  if(!validLegacyChoices(model))continue;
  const choice=legacyChoices(model),deity=choice.deity?deityByName(choice.deity):null,favoredWeapon=String(deity?.favoredWeapon||choice.favoredWeapon||'').trim();
  for(const domain of selectedDomains35(model)){
   const power=domain.grantedPower||{},meta=sourceMeta(row,domain),baseId='domain-grant:'+row.catalogId+':'+slug(domain.name);
   grantedFeatures.push({id:baseId+':feature',name:domain.name+' Domain Granted Power',description:power.description||'',...meta,...(power.casterLevelBonus?{casterLevelBonus:power.casterLevelBonus}:{}),...(power.effectiveWizardLevel?{effectiveWizardLevel:power.effectiveWizardLevel}:{})});
   if(power.action)actions.push({id:baseId+':action',name:power.action.name,type:power.action.type||'Special',description:power.description||'',...meta});
   if(power.resource){
    const id=baseId+':resource',max=resourceMaximum(power.resource,row,character),prior=priorResources.get(id);
    resources.push({id,name:power.resource.name,max,used:Math.max(0,Math.min(max,Number(prior?.used)||0)),reset:power.resource.reset||'long',...(power.resource.unit?{unit:power.resource.unit}:{}),description:power.description||'',...meta});
   }
   const skills=power.classSkills||[];
   for(const name of skills)classSkills35.push({id:baseId+':class-skill:'+slug(name),name,...meta});
   if(domain.name==='Knowledge'&&!skills.length)for(const name of knowledgeSkills)classSkills35.push({id:baseId+':class-skill:'+slug(name),name,...meta});
   if(power.favoredWeaponProficiency&&favoredWeapon){
    trainingGrants.push({classId:baseId+':training',id:baseId+':training',proficiencies:[{kind:'weapons',name:favoredWeapon,index:slug(favoredWeapon)}],...meta});
   }
   if(power.favoredWeaponFocus&&favoredWeapon){
    const name='Weapon Focus ('+favoredWeapon+')';
    if(!feats.some(feat=>norm(feat.name)===norm(name)))feats.push({id:baseId+':weapon-focus',name,description:'War domain grant for the favored weapon of '+(deity?.name||'the selected spiritual focus')+'.',...meta});
   }
  }
 }
 return {...character,grantedFeatures,actions,feats,resources,trainingGrants,classSkills35};
}
