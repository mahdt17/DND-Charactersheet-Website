import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {characterClasses,contentKey} from './advancement.js';
import {fightingStyles} from '../data/fightingStyles.js';

const grantFields=['sourceClassId','sourceClassName','sourceClassLevel','edition'];
const nativeClass=row=>row.edition==='2014'&&!row.homebrew&&!row.definition?.homebrew&&row.definition?.source!=='Homebrew'&&!row.definition?.prestige;
const withOwner=row=>row?{...row,catalogId:row.catalogId||(row.definition?contentKey({...row.definition,edition:row.edition}):`2014:${row.name.toLowerCase()}`)}:null;
export const styleLabel=style=>`${style.name} (${style.source})`;
const styleFor=value=>fightingStyles.find(s=>[s.id,s.name,styleLabel(s)].includes(typeof value==='object'?value?.id:value));
export const rangerFightingStyleSource='https://www.dndbeyond.com/classes/5-ranger';
export const rangerFightingStyles=fightingStyles.filter(s=>['archery','defense','dueling','two-weapon-fighting'].includes(s.id));
export function ownedFightingStyle(style,row,level){
 return {...style,...(row.name==='Ranger'?{sourceUrl:rangerFightingStyleSource}:{}),sourceClassId:row.catalogId,sourceClassName:row.name,sourceClassLevel:level,edition:'2014'};
}
const matchesOwner=(saved,row,level)=>saved?.sourceClassId===row.catalogId&&saved.sourceClassName===row.name&&Number(saved.sourceClassLevel)===level&&saved.edition==='2014';

// Only completely metadata-free saves migrate by position: first Fighter 1,
// second Champion 10. Explicit ownership is never reassigned to another source.
export function fightingStyleGrants(c){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 if(edition!=='2014')return {active:false,row:null,fighterRow:null,rangerRow:null,max:0,styles:[]};
 const rows=characterClasses(c);
 const fighterRow=withOwner(rows.find(r=>r.name==='Fighter'&&nativeClass(r)));
 const rangerRow=withOwner(rows.find(r=>r.name==='Ranger'&&r.level>=2&&nativeClass(r)));
 const swords=withOwner(rows.find(r=>r.edition==='2014'&&!r.definition?.homebrew&&r.level>=3&&findExpandedSubclass(r.name,r.subclass)?.id==='2014:subclass:bard:swords'));
 const row=fighterRow||rangerRow||swords;
 if(!row)return {active:false,row:null,fighterRow:null,rangerRow:null,max:0,styles:[]};
 const additional=fighterRow?.level>=10&&['2014:subclass:fighter:champion','2014:subclass:fighter:brute-ua'].includes(findExpandedSubclass(fighterRow.name,fighterRow.subclass)?.id);
 const max=fighterRow?(additional?2:1):0,styles=[],slots=new Set(),known=new Set(),savedChoices=c.fightingStyles?.choices||[];
 if(fighterRow){
  for(const [index,saved] of savedChoices.filter(value=>value?.sourceClassName!=='Ranger').entries()){
   const style=styleFor(saved);if(!style)continue;
   const legacy=typeof saved!=='object'||!grantFields.some(key=>Object.hasOwn(saved||{},key));
   const level=legacy?(index===0?1:index===1?10:0):Number(saved.sourceClassLevel);
   if(level!==1&&!(level===10&&additional)||fighterRow.level<level||slots.has(level)||known.has(style.id))continue;
   if(!legacy&&!matchesOwner(saved,fighterRow,level))continue;
   if(saved?.source&&saved.source!==style.source)continue;
   styles.push(ownedFightingStyle(style,fighterRow,level));slots.add(level);known.add(style.id);
  }
  styles.sort((a,b)=>a.sourceClassLevel-b.sourceClassLevel);
 }
 if(rangerRow){
  for(const saved of savedChoices.filter(value=>matchesOwner(value,rangerRow,2))){
   const style=styleFor(saved);
   if(!rangerFightingStyles.includes(style)||known.has(style.id)||saved.source&&saved.source!==style.source)continue;
   styles.push(ownedFightingStyle(style,rangerRow,2));known.add(style.id);break;
  }
 }
 if(swords){
  const selected=c.expandedSubclassChoices?.[swords.catalogId]?.['2014:subclass:bard:swords']?.['fighting-style'];
  const style=selected?.length===1&&['Dueling','Two-Weapon Fighting'].includes(selected[0])?styleFor(selected[0]):null;
  if(style&&!known.has(style.id))styles.push(ownedFightingStyle(style,swords,3));
 }
 return {active:true,row,fighterRow,rangerRow,max,styles};
}
