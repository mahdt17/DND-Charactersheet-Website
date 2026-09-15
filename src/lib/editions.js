import modern from '../data/srd2024.json';
import legacy from '../data/srd35.json';
import { spellCatalog, classes, slotsFor, countsFor, classLevel, modifier, castingAbility } from './rules';
export { modern, legacy };
export const editions=[['2014','5e','2014 · SRD 5.1'],['2024','5.5e','Revised rules · SRD 5.2.1'],['3.5','3.5e','SRD 3.5 · base, prestige & psionic classes'],['custom','Custom','Mix editions and your homebrew']];
export const editionName=e=>editions.find(x=>x[0]===e)?.[1]||'5e';
export const mechanics=c=>c.ruleset==='custom'?(c.mechanics||'2014'):(c.ruleset||'2014');
export const is35=c=>mechanics(c)==='3.5';
export const keyOf=s=>s.catalogId||`${s.edition||'2014'}:${s.index||s.id||s.name}`;
const normalizeSpell=(s,edition)=>({...s,edition,source:edition==='2024'?'SRD 5.2.1':s.source||'SRD 5.1',description:s.description||s.desc?.join('\n\n')||'',school:typeof s.school==='object'?s.school.name:s.school||'Homebrew',classes:(s.classes||[]).map(c=>typeof c==='string'?c:c.name),higher_level:typeof s.higher_level==='string'?[s.higher_level]:s.higher_level||[],catalogId:`${edition}:${s.index}`});
export const allSpells=[...spellCatalog.map(s=>normalizeSpell(s,'2014')),...modern.spells.map(s=>normalizeSpell(s,'2024')),...legacy.spells.map(s=>({...s,catalogId:`3.5:${s.index}`}))];
export function catalogSpells(edition,homebrew=[]){return [...allSpells,...homebrew.filter(x=>x.category==='spell').map(s=>({...s,catalogId:s.catalogId||s.id,index:s.index||s.id}))].filter(s=>edition==='custom'||edition==='all'||s.edition===edition);}
export function resolveSpell(s,char){return allSpells.find(x=>keyOf(x)===keyOf(s))||(!s.edition&&!s.catalogId?allSpells.find(x=>x.edition===(char?.ruleset||'2014')&&x.name===s.name):null)||s;}
export function classRecord(c){return c.classDefinition|| (mechanics(c)==='2024'?modern.classes:is35(c)?legacy.classes:classes).find(x=>x.name===c.className);}
export function levelRecord(c,level=c.level){if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c))return {};return (mechanics(c)==='2024'?modern.levels:[]).find(l=>l.class.name===c.className&&l.level===level&&!l.subclass)|| (mechanics(c)==='2014'?classLevel(c.className,level):{});}
export function characterSlots(c){if(Array.isArray(c.slotOverride))return Array.from({length:10},(_,i)=>Math.max(0,Math.min(30,Number(c.slotOverride[i])||0)));
 if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c))return Array(10).fill(0);
 if(mechanics(c)==='2024'){const p=levelRecord(c).spellcasting||{};return [0,...Array.from({length:9},(_,i)=>p[`spell_slots_level_${i+1}`]||0)];}
 return [0,...slotsFor(c.className,c.level)];}
export const castingKey=c=>c.castingAbility||castingAbility[c.className]||'';
export function spellCounts(c,score=10){if(is35(c)||c.ruleset==='custom')return {cantrips:99,known:99,prepared:99,mode:'custom'};
 if(mechanics(c)==='2024'){const p=levelRecord(c).spellcasting||{};return {cantrips:p.cantrips_known||0,known:c.className==='Wizard'?6+2*(c.level-1):p.prepared_spells||0,prepared:p.prepared_spells||0,mode:c.className==='Wizard'?'spellbook':'prepared'};}
 return countsFor(c.className,c.level,score);}
export function permittedSpells(c,homebrew=[]){const slots=characterSlots(c),max=slots.reduce((m,n,i)=>n?i:m,0);return catalogSpells(c.ruleset||'2014',homebrew).map(s=>({...s,level:is35(c)?s.classLevels?.[c.className]??s.level:s.level})).filter(s=>c.ruleset==='custom'||((s.referenceOnly&&is35(c)||s.classes.includes(c.className))&&(is35(c)||s.level<=max)));}
export function classFeatures(c){if(is35(c)||c.ruleset==='custom'&&c.classDefinition?.edition!==mechanics(c))return [{index:'class-reference',name:c.className+' progression',level:c.level,desc:[classRecord(c)?.description||'Add class features below.']}];
 if(mechanics(c)==='2024')return modern.features.filter(f=>f.class?.name===c.className&&Number(f.level?.name?.match(/\d+$/)?.[0]||0)<=c.level&&(!f.subclass||f.subclass.name===c.subclass)).map(f=>({...f,level:Number(f.level?.name?.match(/\d+$/)?.[0]||0),desc:[f.description]}));
 return null;}
export function legacyProgression(c){const d=classRecord(c);for(const table of d?.tables||[]){const row=table.find(r=>/^\d+(st|nd|rd|th)$/.test(r[0]||'')&&parseInt(r[0])===c.level);if(row&&/^[+]\d/.test(row[1]||''))return {bab:parseInt(row[1]),fort:parseInt(row[2])||0,ref:parseInt(row[3])||0,will:parseInt(row[4])||0};}return {bab:0,fort:0,ref:0,will:0};}
export function validPack(value){const list=Array.isArray(value)?value:value?.entries;if(!Array.isArray(list)||!list.length||list.length>2000)throw Error('Use an array of 1–2,000 homebrew entries.');
 return list.map((e,i)=>{if(!e||!['class','race','spell','feat','trait'].includes(e.category)||typeof e.name!=='string'||!e.name.trim()||!editions.some(x=>x[0]===e.edition)||typeof e.description!=='string'||e.description.length>30000)throw Error(`Entry ${i+1}: provide category, name, edition and description.`);
 if(e.category==='spell'&&(!Number.isInteger(e.level)||e.level<0||e.level>9||!Array.isArray(e.classes)||e.classes.some(c=>typeof c!=='string')))throw Error(`Entry ${i+1}: spells need level 0–9 and a classes array.`);
 if(e.sourceUrl&&!/^https?:\/\//i.test(e.sourceUrl))throw Error(`Entry ${i+1}: sourceUrl must use https or http.`);
 if(e.hit_die!=null&&![4,6,8,10,12].includes(e.hit_die))throw Error(`Entry ${i+1}: hit_die must be 4, 6, 8, 10 or 12.`);
 if(e.speed!=null&&(!Number.isFinite(e.speed)||e.speed<0||e.speed>300))throw Error(`Entry ${i+1}: speed must be between 0 and 300.`);
 if(e.bonuses&&(typeof e.bonuses!=='object'||Object.entries(e.bonuses).some(([k,v])=>!['str','dex','con','int','wis','cha'].includes(k)||!Number.isFinite(v)||Math.abs(v)>30)))throw Error(`Entry ${i+1}: invalid ability bonuses.`);
 return {...e,id:crypto.randomUUID(),index:undefined,catalogId:undefined,referenceOnly:false,source:e.source||'Homebrew',description:e.description.trim(),name:e.name.trim()};});}
