import {sourceSubclassEffects} from './subclassState.js';
import equipment from '../data/equipment.json' with {type:'json'};
import classes from '../data/classes.json' with {type:'json'};
import {hasWeaponTraining,startingProficiencies} from './training.js';
import {expandedSubclassRows} from './expandedSubclasses.js';
import {sourceFeature,assertAct} from './subclassActionUtils.js';
const dataFor=i=>equipment.find(e=>e.index===i?.equipmentIndex);
const proficient=(c,d)=>expandedSubclassRows(c).some(p=>['2014:subclass:warlock:hexblade','2014:subclass:warlock:hexblade-ua'].includes(p.record.id))||hasWeaponTraining(c,d,startingProficiencies(c,classes.find(x=>x.name===c.className)?.proficiencies||[]));
function bindingPatch(c,p,key,value){return {subclassEquipment:{...c.subclassEquipment,[p.row.catalogId]:{...c.subclassEquipment?.[p.row.catalogId],[p.record.id]:{...c.subclassEquipment?.[p.row.catalogId]?.[p.record.id],[key]:value}}}};}
export function subclassEquipmentProfiles(c){return expandedSubclassRows(c).filter(p=>['warlock:hexblade','warlock:hexblade-ua','artificer:battle-smith','artificer:armorer','artificer:armorer-ua','monk:kensei','monk:kensei-ua'].includes(p.record.id.split(':').slice(-2).join(':'))).map(p=>({...p,binding:c.subclassEquipment?.[p.row.catalogId]?.[p.record.id]||{}}));}
export function bindSubclassEquipment(c,key,itemId,{confirmed=false,magic=false,pact=false,model}={}){
 assertAct(c);const item=c.inventory?.find(i=>i.id===itemId),d=dataFor(item);if(!item||!d)throw Error('Choose an actual inventory item.');let p;
 if(key==='hex-weapon'||key==='pact-weapon'){
  p=sourceFeature(c,['warlock:hexblade','warlock:hexblade-ua'],'hex-warrior');if(!d.damage)throw Error('Choose a weapon.');if(!proficient(c,d))throw Error('Choose a proficient weapon.');
  if(key==='hex-weapon'&&d.properties?.some(p=>p.index==='two-handed'))throw Error('Hex Warrior weapon must lack the Two-Handed property.');
  if(key==='hex-weapon'&&p.record.playtest&&d.weapon_range!=='Melee')throw Error('UA Hex Warrior applies only to melee weapons.');
  if(key==='pact-weapon'&&(p.record.playtest||p.row.level<3||!pact))throw Error('Confirm an actual Pact of the Blade weapon; published Hexblade only.');
  if(!confirmed)throw Error('Confirm touching this weapon at the end of your long rest.');return bindingPatch(c,p,key,itemId);
 }
 if(key==='magic-weapon'){p=sourceFeature(c,['artificer:battle-smith'],'battle-ready');if(!d.damage||!magic)throw Error('Confirm this weapon is magical before using Intelligence.');const old=c.subclassEquipment?.[p.row.catalogId]?.[p.record.id]?.[key]||[];return bindingPatch(c,p,key,[...new Set([...old,itemId])]);}
 if(key==='arcane-armor'){p=sourceFeature(c,['artificer:armorer','artificer:armorer-ua'],c.subclass?.includes('UA')?'power-armor':'arcane-armor');if(!item.equipped||!d.armor_class||d.index==='shield'||p.record.playtest&&d.armor_category!=='Heavy')throw Error('Wear eligible armor first.');if(!confirmed||!['Guardian','Infiltrator'].includes(model))throw Error('Confirm smith’s tools and choose an armor model.');return bindingPatch(c,p,key,{itemId,model});}
 throw Error('Unknown equipment binding.');
}
export function weaponSubclassAbility(c,item){
 const d=dataFor(item);if(!d)return null;for(const p of subclassEquipmentProfiles(c)){
  if(p.record.id==='2014:subclass:warlock:hexblade'&&(p.binding['hex-weapon']===item.id&&!d.properties?.some(p=>p.index==='two-handed')||p.row.level>=3&&p.binding['pact-weapon']===item.id))return 'cha';
  if(p.record.id==='2014:subclass:warlock:hexblade-ua'&&p.binding['hex-weapon']===item.id&&d.weapon_range==='Melee'&&!d.properties?.some(p=>p.index==='two-handed')&&proficient(c,d))return 'cha';
  if(p.record.id==='2014:subclass:artificer:battle-smith'&&p.row.level>=3&&p.binding['magic-weapon']?.includes(item.id))return 'int';
 }const k=kenseiWeaponProfile(c,item);if(k)return (Number(c.abilities?.dex)||10)>(Number(c.abilities?.str)||10)?'dex':'str';return null;
}
export function armorModelProfile(c){const p=subclassEquipmentProfiles(c).find(p=>p.record.id.includes(':armorer')),binding=p?.binding['arcane-armor'],item=c.inventory?.find(i=>i.id===binding?.itemId&&i.equipped);return p&&item?{...p,...binding,item}:null;}

export function kenseiWeaponProfile(c,item){const d=dataFor(item),p=subclassEquipmentProfiles(c).find(p=>p.record.id.includes(':kensei'));if(!d?.damage||!p)return null;const selected=Object.entries(p.state).filter(([k])=>k.includes('kensei')).flatMap(([,v])=>Array.isArray(v)?v:[]),known=selected.some(n=>String(n).toLowerCase()===d.name.toLowerCase())||p.record.playtest&&d.weapon_category==='Martial'&&proficient(c,d);return known?{...p,item,data:d}:null;}
export function weaponSubclassBonus(c,item){return kenseiWeaponProfile(c,item)?Math.max(0,...sourceSubclassEffects(c,{stateKey:'sharpen-blade'}).filter(e=>e.itemId===item.id).map(e=>Number(e.bonus)||0)):0;}
