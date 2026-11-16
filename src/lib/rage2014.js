import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {characterClasses} from './advancement.js';
import {sourceSubclassEffects,equippedForActiveBody,polymorphSheepEffect,retainsOwnFeatures,actorDeathBlock,actorBodyHP,consciousAtZero} from './subclassState.js';
import equipment from '../data/equipment.json' with {type:'json'};
export const rageId='2014:Barbarian:rage';
export function rageProfile(c){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const rows=c.classLevels?.length?c.classLevels:[{name:c.className,level:c.level,edition:c.classDefinition?.edition||edition,definition:c.classDefinition}];
 const row=edition==='2014'&&rows.find(r=>r.name==='Barbarian'&&(r.edition||edition)==='2014'&&!r.definition?.homebrew&&!r.homebrew),level=Number(row?.level)||0;
 const state=(c.activeEffects||[]).find(e=>e.stateKey==='rage'&&e.baseClassId===rageId&&(e.remainingSeconds==null||e.remainingSeconds>0));
 const legacy=level>=3&&/totem warrior/i.test(row?.subclass||c.subclass||'')&&c.totemWarrior?.activeRage;
 const heavy=(c.inventory||[]).some(i=>equippedForActiveBody(c,i)&&String(i.armor_category||equipment.find(e=>e.index===i.equipmentIndex)?.armor_category).toLowerCase()==='heavy');
 const max=level>=17?6:level>=12?5:level>=6?4:level>=3?3:2,used=Math.max(0,...(c.resources||[]).filter(r=>r.id===rageId||r.classResourceKey===rageId).map(r=>Number(r.used)||0));
 return {level,active:!!level&&!!(state||legacy),state,heavy,max,used,unlimited:level>=20,damage:level>=16?4:level>=9?3:2,persistent:level>=15};
}
export function mindlessRageActive(c){
 const names=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(n=>String(n?.name||n).trim().toLowerCase());
 if(!rageProfile(c).active||!retainsOwnFeatures(c)||actorDeathBlock(c)||names.includes('unconscious')||actorBodyHP(c)<=0&&!consciousAtZero(c))return false;
 return characterClasses(c).some(row=>row.name==='Barbarian'&&row.edition==='2014'&&row.level>=6&&!row.definition?.homebrew&&!row.homebrew&&findExpandedSubclass(row.name,row.subclass)?.id==='2014:subclass:barbarian:berserker');
}
export function reconcileMindlessRageConditions(previous,next){
 if(!mindlessRageActive(previous)||!mindlessRageActive(next))return next;
 const list=v=>Array.isArray(v)?v:String(v||'').split(',').map(s=>s.trim()).filter(Boolean),name=v=>String(v?.name||v).trim().toLowerCase(),prior=new Set(list(previous.conditions).map(name)),items=list(next.conditions),filtered=items.filter(v=>!['charmed','frightened'].includes(name(v))||prior.has(name(v)));
 return filtered.length===items.length?next:{...next,conditions:filtered};
}
export const rageCastingBlock=c=>rageProfile(c).active?'You cannot cast spells or rituals while raging. End Rage first.':'';
// Local spell materials are source text rather than structured cost metadata.
// Explicit cost/consumption markers disallow exemption; absence still requires
// the user's confirmation and never establishes eligibility by itself.
export function archdruidMaterialRestriction(spell){return /\d[\d,.]*\s*(?:cp|sp|ep|gp|pp)\b|\b(?:copper|silver|electrum|gold|platinum) pieces?\b|\bconsum(?:e[sd]?|ing|ption)\b/i.test(String(spell.material||''))?'Listed costly or consumed material components cannot be waived by Archdruid.':'';}
export function featureCastingBlock(c,spell){
 if(polymorphSheepEffect(c))return 'You cannot cast spells while polymorphed.';
 const form=sourceSubclassEffects(c,{stateKey:'moon-wild-shape'})[0];
 if(form){
  const level=characterClasses(c).find(r=>r.catalogId===form.sourceClassId)?.level||0;if(level<18)return 'You cannot cast spells while using Wild Shape.';
  const druid=spell.castingClassId?spell.castingClassId===form.sourceClassId:(spell.classes||[]).some(x=>(x.name||x)==='Druid');if(!druid)return 'Beast Spells permits Druid spells while using Wild Shape.';
  if((spell.components||[]).includes('M')){const restricted=archdruidMaterialRestriction(spell);if(restricted)return restricted;if(!(level>=20&&spell.archdruidMaterialEligible===true))return 'Resolve the material-component restriction for Wild Shape at the table.';}
 }
 if(sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic',stateKey:'wild-surge:49'}).length&&(spell.components||[]).includes('V'))return 'Wild Magic prevents speech; this spell requires a verbal component.';
 if(Number(spell.level)>0&&(c.activeEffects||[]).some(e=>e.stateKey==='arcane-deflection'&&e.remainingSeconds>0))return 'Arcane Deflection permits only cantrips until the end of your next turn.';return rageCastingBlock(c);
}
