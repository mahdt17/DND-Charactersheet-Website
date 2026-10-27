import {totemProfile} from './totemWarrior.js';
import {totemSubclassRecords} from '../data/totemWarrior.js';
import {fighterSubclassRecords} from '../data/fighterSubclasses.js';
import {campaignModifiers} from './campaignModifiers.js';
import {campaignProfile} from './archivistCampaign.js';
import levels from '../data/levels.json';
import spells from '../data/spells.json';
import classes from '../data/classes.json';
import features from '../data/features.json';
import subclasses14 from '../data/subclasses.json';
const subclasses=[...subclasses14,...fighterSubclassRecords,...totemSubclassRecords];
import equipment from '../data/equipment.json';
import {hasWeaponTraining,startingProficiencies} from './training.js';
import {entomancerArmor,entomancerProfile} from './entomancer.js';

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
  const match=String(expression).replace(/\s/g,'').match(/^(\d{1,2})d(\d{1,3})(dl1)?([+-]\d{1,3})?$/i);
  if(!match) throw new Error('Use a dice expression such as 1d20+5, 2d6+3 or 4d6dl1.');
  const [,quantity,sides,dropLowest,bonus='0']=match;
  if(+quantity<1 || +quantity>50 || +sides<2 || +sides>100) throw new Error('Use 1–50 dice with 2–100 sides.');
  if(dropLowest && +quantity<2) throw new Error('Dropping the lowest die requires at least two dice.');
  const rolls=Array.from({length:+quantity},()=>Math.floor(random()*+sides)+1);
  if(dropLowest){
    const droppedIndex=rolls.indexOf(Math.min(...rolls)),kept=rolls.filter((_,index)=>index!==droppedIndex),dropped=[rolls[droppedIndex]];
    return {id:crypto.randomUUID(),expression,rolls,kept,dropped,droppedIndices:[droppedIndex],bonus:+bonus,total:kept.reduce((a,b)=>a+b,0)+(+bonus),mode,time:new Date().toISOString()};
  }
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
const legacySourceId=row=>String(row?.definition?.sourceId||row?.definition?.id||row?.catalogId||'').replace(/^dndtools:/,'');
function legacyClassLevel(char,sourceId,fallbackName=''){
  const rows=Array.isArray(char?.classLevels)?char.classLevels:[];
  const exact=rows.filter(row=>legacySourceId(row)===sourceId).reduce((n,row)=>n+Math.max(0,Number(row.level)||0),0);
  if(exact)return exact;
  if(!rows.length&&char?.className===fallbackName)return Math.max(0,Number(char.level)||0);
  return 0;
}
export function armorFor(char, abilities) {
  const dex=modifier(abilities.dex),con=modifier(abilities.con),wis=modifier(abilities.wis);
  const worn=(char.inventory||[]).filter(i=>i.equipped).map(i=>equipment.find(e=>e.index===i.equipmentIndex)).filter(Boolean);
  const shield=worn.some(e=>e.index==='shield');
  const armor=worn.filter(e=>e.armor_class&&e.index!=='shield');
  if(armor.length){const e=armor[0];return entomancerArmor(char,e.armor_class.base+(e.armor_class.dex_bonus?Math.min(dex,e.armor_class.max_bonus??Infinity):0)+(shield?2:0)+campaignModifiers(char).ac,e.armor_category,abilities);}
  const legacy35=char?.ruleset==='3.5'||char?.mechanics==='3.5';
  if(legacy35){
    const monkLevel=legacyClassLevel(char,'classes/monk-94','Monk');
    const monkVariantLevel=legacyClassLevel(char,'classes/monk-variant-954','Monk Variant');
    const druidVariantLevel=legacyClassLevel(char,'classes/druid-variant-952','Druid Variant');
    if(!shield&&(monkLevel||monkVariantLevel||druidVariantLevel)){
      const classAcBonus=Math.min(4,Math.max(Math.floor(monkLevel/5),Math.floor(druidVariantLevel/5)));
      return 10+dex+wis+classAcBonus;
    }
    return 10+dex+(shield?2:0);
  }
  const base=char.className==='Barbarian'?10+dex+con:char.className==='Monk'&&!shield?10+dex+wis:10+dex;
  const campaign=campaignProfile(char),inertial=campaign.psion&&char.archivistCampaign?.powerEffects?.['inertial-armor']?.minutes>0?Number(campaign.rulings.inertialArmorBase??13)+dex:0;
  return entomancerArmor(char,Math.max(base,inertial)+(shield?2:0)+campaignModifiers(char).ac,'',abilities);
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
    const totem=totemProfile(char,abilities),rage=totem.activeRage&&!totem.heavyArmor&&data.weapon_range==='Melee'&&(!finesse||str>=dex)?totem.rageDamage:0;
    const p=entomancerProfile(char,abilities),strike=p.species==='Exo-Gotas'&&p.level>=6&&char.entomancer?.strengthStrike&&data.weapon_range==='Melee'?2:0;
    return {id:i.id,name:i.name,equipmentIndex:data.index,trained,entomancerStrike:!!strike,attack:ability+(trained?2+Math.floor((char.level-1)/4):0)+strike,damage:`${data.damage.damage_dice}${signed(ability+strike+rage)}`,description:`${data.weapon_range} · ${data.damage.damage_type.name}${trained?'':' · no proficiency bonus'}`};
  }).filter(Boolean);
}
