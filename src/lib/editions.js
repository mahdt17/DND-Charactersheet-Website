import {characterClasses,classCharacter,baseProgression,progressionRow} from './advancement';
import {multiclassPools,slotArray} from './multiclassCasting';
import {spellSlotProgression} from './classIntegration.js';
import {spellAccessForClass} from './spellAccess.js';
import {subclassCasting} from './subclassCasting.js';
import {resolveFeatSpell} from './featMagic.js';
import modern from '../data/srd2024.json';
import legacy from '../data/srd35.json';
import { spellCatalog, classes, slotsFor, countsFor, classLevel, modifier, castingAbility, grantedClassFeatures } from './rules';
export { modern, legacy };
export const editions=[['2014','5e','2014 · SRD 5.1'],['2024','5.5e','Revised rules · SRD 5.2.1'],['3.5','3.5e','SRD 3.5 · base, prestige & psionic classes'],['custom','Custom','Mix editions and your homebrew']];
export const editionName=e=>editions.find(x=>x[0]===e)?.[1]||'5e';
export const mechanics=c=>c.ruleset==='custom'?(c.mechanics||'2014'):(c.ruleset||'2014');
export const is35=c=>mechanics(c)==='3.5';
export const keyOf=s=>s.catalogId||`${s.edition||'2014'}:${s.index||s.id||s.name}`;
const normalizeSpell=(s,edition)=>({...s,edition,source:edition==='2024'?'SRD 5.2.1':s.source||'SRD 5.1',description:s.description||s.desc?.join('\n\n')||'',school:typeof s.school==='object'?s.school.name:s.school||'Homebrew',classes:(s.classes||[]).map(c=>typeof c==='string'?c:c.name),higher_level:typeof s.higher_level==='string'?[s.higher_level]:s.higher_level||[],catalogId:`${edition}:${s.index}`});
export const allSpells=[...spellCatalog.map(s=>normalizeSpell(s,'2014')),...modern.spells.map(s=>normalizeSpell(s,'2024')),...legacy.spells.map(s=>({...s,catalogId:`3.5:${s.index}`}))];
export function catalogSpells(edition,homebrew=[]){return [...allSpells,...homebrew.filter(x=>x.category==='spell'&&!x.integrityIssues?.length).map(s=>({...s,catalogId:s.catalogId||s.id,index:s.index||s.id}))].filter(s=>edition==='custom'||edition==='all'||s.edition===edition);}
export function resolveSpell(s,char){return allSpells.find(x=>keyOf(x)===keyOf(s))||(!s.edition&&!s.catalogId?allSpells.find(x=>x.edition===(char?.ruleset||'2014')&&x.name===s.name):null)||s;}
export function classRecord(c){return c.classDefinition|| (mechanics(c)==='2024'?modern.classes:is35(c)?legacy.classes:classes).find(x=>x.name===c.className);}
export function levelRecord(c,level=c.level){if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c))return {};return (mechanics(c)==='2024'?modern.levels:[]).find(l=>l.class.name===c.className&&l.level===level&&!l.subclass)|| (mechanics(c)==='2014'?classLevel(c.className,level):{});}
function legacySlotProfile(c){
 const classId=c.classDefinition?.catalogId||c.classDefinition?.id;
 const saved=(c.classSpellSlots||[]).find(profile=>profile.sourceClassId===classId)||(c.classSpellSlots||[]).find(profile=>profile.sourceClassName===c.className);
 // Re-evaluate the target level during creation and level-up; cached sheet
 // profiles describe the last committed level, not the pending choice.
 const extra=(c.castingAdvancements||[]).filter(entry=>entry.targetClassId===(c.activeCastingClassId||classId)).reduce((n,entry)=>n+(Number(entry.amount)||0),0);
 return spellSlotProgression(classRecord(c),c.level+extra)||saved;
}
function singleClassSlots(c){
 const subclass=subclassCasting(c);if(subclass)return subclass.slots;
 if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c)){
  const profile=legacySlotProfile(c),slots=slotArray(profile?.slots);
  const bonusAbility={Wizard:'int',Cleric:'wis',Druid:'wis',Paladin:'wis',Ranger:'wis',Sorcerer:'cha',Bard:'cha',Archivist:'wis','Cloistered Cleric':'wis','Favored Soul':'cha','Spirit Shaman':'wis'}[c.className];
  const score=Number(c.abilities?.[bonusAbility])+Number(c.abilityBonuses?.[bonusAbility]||0),bonus=modifier(score);
  // Only source tables with explicit unlocked levels receive inferred bonuses;
  // old cached/manual totals may already include them.
  return slots.map((count,level)=>level>0&&profile?.unlockedSpellLevels?.includes(level)&&Number.isFinite(bonus)&&bonus>=level?count+1+Math.floor((bonus-level)/4):count);
 }
 if(c.className==='Artificer'&&mechanics(c)==='2014')return slotArray(spellSlotProgression(classRecord(c),c.level)?.slots);
 if(mechanics(c)==='2024'){const p=levelRecord(c).spellcasting||{};return [0,...Array.from({length:9},(_,i)=>p[`spell_slots_level_${i+1}`]||0)];}
 return [0,...slotsFor(c.className,c.level)];}
export function spellSlotPools(c){
 if(Array.isArray(c.slotOverride))return {standard:slotArray(c.slotOverride),pact:Array(10).fill(0),mode:'override',reason:'Personal slot totals are active.'};
 if(characterClasses(c).length>1)return multiclassPools(c,singleClassSlots);
 const legacyProfile=is35(c)?legacySlotProfile(c):null;
 return {standard:singleClassSlots(c),pact:Array(10).fill(0),restricted:slotArray(legacyProfile?.restrictedSlots),mode:is35(c)||c.ruleset==='custom'?(legacyProfile?'automatic':'manual'):'automatic',reason:is35(c)&&!legacyProfile?'No explicit spell-slot matrix is present in this class progression.':undefined};
}
export const characterSlots=c=>spellSlotPools(c).standard;
export const castingKey=c=>c.castingAbility||subclassCasting(c)?.ability||(is35(c)?{Paladin:'wis',Ranger:'wis',Archivist:'int','Cloistered Cleric':'wis','Favored Soul':'wis','Spirit Shaman':'cha',Artificer:'int',Psion:'int','Psychic Warrior':'wis',Wilder:'cha'}[c.className]:c.className==='Artificer'?'int':null)||castingAbility[c.className]||'';
export function spellCounts(c,score=10){if(is35(c)||c.ruleset==='custom')return {cantrips:99,known:99,prepared:99,mode:'custom'};
 const subclass=subclassCasting(c);if(subclass)return subclass;
 if(c.className==='Artificer'&&mechanics(c)==='2014'){const row=progressionRow(classRecord(c),c.level);return {cantrips:Number(row['Cantrips Known'])||0,known:null,prepared:Math.max(1,Math.floor(c.level/2)+modifier(score)),mode:'prepared'};}
 if(mechanics(c)==='2024'){const p=levelRecord(c).spellcasting||{};return {cantrips:p.cantrips_known||0,known:c.className==='Wizard'?6+2*(c.level-1):p.prepared_spells||0,prepared:p.prepared_spells||0,mode:c.className==='Wizard'?'spellbook':'prepared'};}
 return countsFor(c.className,c.level,score);}
export function spellAccess(c,s){
 if(s.featGrantId){const granted=resolveFeatSpell(c,s);return granted?{allowed:true,level:granted.level,alwaysPrepared:true,ability:granted.featAbility}:{allowed:false,level:s.level,reason:'This feat no longer grants the spell.'};}
 const rows=characterClasses(c);
 if(s.castingClassId&&!rows.some(row=>row.catalogId===s.castingClassId)&&s.castingClassId!==c.activeCastingClassId)return {allowed:false,level:s.level,reason:'The class that granted this spell is no longer present.'};
 if(rows.length>1){
  const owner=s.castingClassId?rows.find(row=>row.catalogId===s.castingClassId):null;
  if(s.castingClassId&&!owner)return {allowed:false,level:s.level,reason:'The class that granted this spell is no longer present.'};
  const results=(owner?[owner]:rows).map(row=>spellAccess(classCharacter(c,row),s));
  return results.find(result=>result.allowed)||results[0];
 }
 const slots=singleClassSlots(c),counts=spellCounts(c);
 return spellAccessForClass({...c,activeCastingClassId:c.activeCastingClassId||rows[0]?.catalogId,castingAbility:castingKey(c)},s,{maxLevel:slots.reduce((m,n,i)=>n?i:m,-1),cantrips:counts.cantrips,legacyProfile:is35(c)?legacySlotProfile(c):null});
}
export function permittedSpells(c,homebrew=[]){
 return [...new Map(catalogSpells(c.ruleset||'2014',homebrew).map(s=>[keyOf(s),s])).values()]
  .flatMap(s=>{const access=spellAccess(c,s);return access.allowed?[{...s,level:access.level}]:[];});
}
export function classFeatures(c){if(characterClasses(c).length>1)return characterClasses(c).flatMap(row=>{const model=classCharacter(c,row);return (classFeatures(model)||grantedClassFeatures(model)).map(f=>({...f,index:row.catalogId+':'+f.index,name:row.name+' · '+f.name}));});if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c)){const record=classRecord(c);if(record?.progression?.length)return Array.from({length:c.level},(_,i)=>{const row=progressionRow(record,i+1);const name=row.Special||row.Features||row['Class Features'];return name&&name!=='—'?{index:'class-'+(i+1),name,level:i+1,desc:[`See ${record.sourceBook||record.source||'the class source'} for feature choices and full rules.`]}:null;}).filter(Boolean);return [{index:'class-reference',name:c.className+' progression',level:c.level,desc:[classRecord(c)?.description||'Add class features below.']}];}
 if(mechanics(c)==='2024')return modern.features.filter(f=>f.class?.name===c.className&&Number(f.level?.name?.match(/\d+$/)?.[0]||0)<=c.level&&(!f.subclass||f.subclass.name===c.subclass)).map(f=>({...f,level:Number(f.level?.name?.match(/\d+$/)?.[0]||0),desc:[f.description]}));
 return null;}
export function legacyProgression(c){const d=classRecord(c),r=baseProgression(d,c.level);return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Number.isFinite(v)?v:0]));}
export function validPack(value){const list=Array.isArray(value)?value:value?.entries;if(!Array.isArray(list)||!list.length||list.length>2000)throw Error('Use an array of 1–2,000 homebrew entries.');
 return list.map((e,i)=>{if(!e||!['class','race','spell','feat','trait'].includes(e.category)||typeof e.name!=='string'||!e.name.trim()||!editions.some(x=>x[0]===e.edition)||typeof e.description!=='string'||e.description.length>30000)throw Error(`Entry ${i+1}: provide category, name, edition and description.`);
 if(e.category==='spell'&&(!Number.isInteger(e.level)||e.level<0||e.level>9||!Array.isArray(e.classes)||e.classes.some(c=>typeof c!=='string')))throw Error(`Entry ${i+1}: spells need level 0–9 and a classes array.`);
 if(e.sourceUrl&&!/^https?:\/\//i.test(e.sourceUrl))throw Error(`Entry ${i+1}: sourceUrl must use https or http.`);
 if(e.hit_die!=null&&![4,6,8,10,12].includes(e.hit_die))throw Error(`Entry ${i+1}: hit_die must be 4, 6, 8, 10 or 12.`);
 if(e.speed!=null&&(!Number.isFinite(e.speed)||e.speed<0||e.speed>300))throw Error(`Entry ${i+1}: speed must be between 0 and 300.`);
 if(e.bonuses&&(typeof e.bonuses!=='object'||Object.entries(e.bonuses).some(([k,v])=>!['str','dex','con','int','wis','cha'].includes(k)||!Number.isFinite(v)||Math.abs(v)>30)))throw Error(`Entry ${i+1}: invalid ability bonuses.`);
 return {...e,id:crypto.randomUUID(),index:undefined,catalogId:undefined,referenceOnly:false,source:e.source||'Homebrew',description:e.description.trim(),name:e.name.trim()};});}
