import levels from '../data/levels.json';
import spells from '../data/spells.json';
import classes from '../data/classes.json';
import features from '../data/features.json';
import subclasses from '../data/subclasses.json';
import equipment from '../data/equipment.json';
import {hasWeaponTraining,startingProficiencies} from './training.js';

export { classes, features, subclasses };
export const castingAbility = { Bard:'cha', Cleric:'wis', Druid:'wis', Paladin:'cha', Ranger:'wis', Sorcerer:'cha', Warlock:'cha', Wizard:'int' };
export const modifier = score => Math.floor((Number(score) - 10) / 2);
export const signed = value => value >= 0 ? `+${value}` : `${value}`;
export const spellLevel = spell => spell.level === 'Cantrip' ? 0 : parseInt(spell.level, 10) || 0;
export const spellCatalog = spells.map(s => ({ ...s, description:s.desc.join('\n\n'), school:s.school.name, classes:s.classes.map(c=>c.name) }));
export function classLevel(name, level) {
  return levels.find(l=>l.class.name===name && l.level===Number(level) && !l.subclass) || {};
}
export function slotsFor(name, level) {
  const casting = classLevel(name, level).spellcasting || {};
  return Array.from({length:9}, (_,i)=>Number(casting[`spell_slots_level_${i+1}`]||0));
}
export function maxSpellLevel(name, level) {
  const slots=slotsFor(name, level);
  return slots.reduce((max,n,i)=>n ? i+1 : max,0);
}
export function countsFor(name, level, abilityScore=10) {
  const progression = classLevel(name,level).spellcasting || {};
  const cantrips=progression.cantrips_known || 0;
  if(!castingAbility[name] || !maxSpellLevel(name,level)) return {cantrips,known:0,prepared:0,mode:'none'};
  if(name==='Wizard') return {cantrips,known:6+2*(level-1),prepared:Math.max(1,level+modifier(abilityScore)),mode:'spellbook'};
  if(['Cleric','Druid','Paladin'].includes(name)) return {cantrips,known:null,prepared:Math.max(1,(name==='Paladin'?Math.floor(level/2):level)+modifier(abilityScore)),mode:'prepared'};
  return {cantrips,known:progression.spells_known||0,prepared:null,mode:'known'};
}
export function grantedClassFeatures(char) {
  const base=levels.filter(l=>l.class.name===char.className && l.level<=char.level && (!l.subclass || l.subclass.name===char.subclass));
  return [...new Map(base.flatMap(l=>(l.features||[]).map(f=>[f.index,{...f,...features.find(x=>x.index===f.index),level:l.level}]))).values()];
}
export function rollDice(expression, mode='normal', random=Math.random) {
  const match=String(expression).replace(/\s/g,'').match(/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i);
  if(!match) throw new Error('Use a dice expression such as 1d20+5 or 2d6+3.');
  const [,quantity,sides,bonus='0']=match;
  if(+quantity<1 || +quantity>50 || +sides<2 || +sides>100) throw new Error('Use 1–50 dice with 2–100 sides.');
  const rolls=Array.from({length:+quantity},()=>Math.floor(random()*+sides)+1);
  if(+quantity===1 && +sides===20 && mode!=='normal') rolls.push(Math.floor(random()*20)+1);
  const subtotal=rolls.length===2 && +quantity===1 ? (mode==='advantage'?Math.max(...rolls):Math.min(...rolls)) : rolls.reduce((a,b)=>a+b,0);
  return {id:crypto.randomUUID(),expression,rolls,bonus:+bonus,total:subtotal+(+bonus),mode,time:new Date().toISOString()};
}
export function changeHP(hp, amount, healing=false) {
  amount=Math.max(0,Number(amount)||0);
  if(healing) return {...hp,current:Math.min(hp.max,hp.current+amount)};
  const absorbed=Math.min(hp.temp||0,amount);
  return {...hp,temp:(hp.temp||0)-absorbed,current:Math.max(0,hp.current-(amount-absorbed))};
}
export function armorFor(char, abilities) {
  const dex=modifier(abilities.dex),con=modifier(abilities.con),wis=modifier(abilities.wis);
  const worn=(char.inventory||[]).filter(i=>i.equipped).map(i=>equipment.find(e=>e.index===i.equipmentIndex)).filter(Boolean);
  const shield=worn.some(e=>e.index==='shield');
  const armor=worn.filter(e=>e.armor_class&&e.index!=='shield');
  if(armor.length){const e=armor[0];return e.armor_class.base+(e.armor_class.dex_bonus?Math.min(dex,e.armor_class.max_bonus??Infinity):0)+(shield?2:0);}
  const base=char.className==='Barbarian'?10+dex+con:char.className==='Monk'&&!shield?10+dex+wis:10+dex;
  return base+(shield?2:0);
}
export function weaponAttacks(char, abilities) {
  const proficiencies=startingProficiencies(char,classes.find(c=>c.name===(char.classLevels?.[0]?.name||char.className))?.proficiencies||[]);
  return (char.inventory||[]).filter(i=>i.equipped).map(i=>{
    const data=equipment.find(e=>e.index===i.equipmentIndex);
    if(!data?.damage?.damage_dice)return null;
    const dex=modifier(abilities.dex),str=modifier(abilities.str);
    const finesse=data.properties?.some(p=>p.index==='finesse');
    const ability=finesse?Math.max(dex,str):data.weapon_range==='Ranged'?dex:str;
    const trained=hasWeaponTraining(char,data,proficiencies);
    return {id:i.id,name:i.name,equipmentIndex:data.index,trained,attack:ability+(trained?2+Math.floor((char.level-1)/4):0),damage:`${data.damage.damage_dice}${signed(ability)}`,description:`${data.weapon_range} · ${data.damage.damage_type.name}${trained?'':' · no proficiency bonus'}`};
  }).filter(Boolean);
}
