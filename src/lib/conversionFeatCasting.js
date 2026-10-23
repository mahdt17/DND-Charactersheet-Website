import levels from '../data/levels.json' with {type:'json'};
import {campaignIds} from '../data/archivistCampaign.js';
import {conversionRows} from './conversionFeatures.js';
import {conversionSlotPool} from './conversionSlots.js';
import {subclassCasting} from './subclassCasting.js';
import {usesClassSpellRules} from './spellcastingPolicy.js';

const standardAbilities={Bard:'cha',Cleric:'wis',Druid:'wis',Sorcerer:'cha',Warlock:'cha',Wizard:'int',Paladin:'cha',Ranger:'wis',Artificer:'int',Entomancer:'wis'};
const normalized=value=>({strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha',str:'str',dex:'dex',con:'con',int:'int',wis:'wis',cha:'cha'}[String(value?.index||value?.name||value||'').toLowerCase()]||'');
export function conversionSingleSlots(c){
 if(!usesClassSpellRules(c))return Array(10).fill(0);
 const subclass=subclassCasting(c);if(subclass)return subclass.slots;
 const name=c.classDefinition?.catalogId===campaignIds.archivist||c.className==='Artificer'?'Wizard':c.className,level=c.className==='Artificer'?Math.ceil(c.level/2):c.level;
 const entry=levels.find(r=>r.class.name===name&&r.level===level&&!r.subclass)?.spellcasting||{};
 return [0,...Array.from({length:9},(_,i)=>Number(entry[`spell_slots_level_${i+1}`]||0))];
}
export function conversionFeatSlots(c){
 const pools=conversionSlotPool(c,conversionSingleSlots,{includeUnconverted:true});
 if(Array.isArray(c.slotOverride)&&pools?.mode==='manual')return {...pools,standard:c.slotOverride};
 // Single Warlocks use the existing slotsUsed store and short-rest recovery.
 const rows=conversionRows(c);
 return rows.length===1&&rows[0].name==='Warlock'?{...pools,standard:pools.pact,pact:Array(10).fill(0)}:pools;
}
export function conversionFeatCasters(c){
 return conversionRows(c).flatMap((r,i)=>{
  if((r.edition||'2014')!=='2014')return [];
  const model={className:r.name,classDefinition:r.definition,subclass:r.subclass,level:r.level,ruleset:'2014'};
  const ability=normalized(r.castingAbility||(i===0?c.castingAbility:null)||r.definition?.spellcastingAbility)||subclassCasting(model)?.ability||standardAbilities[r.name];
  if(!ability||!conversionSingleSlots(model).some(Boolean)&&!(Array.isArray(c.slotOverride)&&!Object.values(campaignIds).includes(r.definition?.catalogId)&&r.definition?.spellcastingAbility))return [];
  return [{id:r.catalogId||r.definition?.catalogId||r.name,name:r.name,level:r.level,ability}];
 });
}
export function conversionFeatCaster(c){
 const casters=conversionFeatCasters(c),selected=c.archivistCampaign?.featCastingClassId;
 return selected?casters.find(r=>r.id===selected)||null:casters.find(r=>r.id===campaignIds.archivist)||casters[0]||null;
}
