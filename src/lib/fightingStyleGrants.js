import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {characterClasses,contentKey} from './advancement.js';
import {fightingStyles} from '../data/fightingStyles.js';
const grantFields=['sourceClassId','sourceClassName','sourceClassLevel','edition'];
const styleFor=value=>fightingStyles.find(s=>[s.id,s.name,`${s.name} (${s.source})`].includes(typeof value==='object'?value?.id:value));
// Only completely metadata-free saves migrate by position: first Fighter 1,
// second Champion 10. Explicit ownership is never reassigned to another source.
export function fightingStyleGrants(c){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014',found=characterClasses(c).find(r=>r.name==='Fighter'&&r.edition==='2014'&&!r.homebrew&&!r.definition?.homebrew&&r.definition?.source!=='Homebrew'&&!r.definition?.prestige);
 if(edition!=='2014')return {active:false,row:null,fighterRow:null,max:0,styles:[]};
 const swords=characterClasses(c).find(r=>r.edition==='2014'&&!r.definition?.homebrew&&r.level>=3&&findExpandedSubclass(r.name,r.subclass)?.id==='2014:subclass:bard:swords');
 if(!found&&!swords)return {active:false,row:null,fighterRow:null,max:0,styles:[]};
 const owner=found||swords,row={...owner,catalogId:owner.catalogId||(owner.definition?contentKey({...owner.definition,edition:owner.edition}):`2014:${owner.name.toLowerCase()}`)},additional=!!found&&['2014:subclass:fighter:champion','2014:subclass:fighter:brute-ua'].includes(findExpandedSubclass(row.name,row.subclass)?.id)&&row.level>=10,max=found?(additional?2:1):0,styles=[],slots=new Set(),known=new Set();
 for(const [index,saved] of (found?c.fightingStyles?.choices||[]:[]).entries()){
  const style=styleFor(saved);if(!style)continue;
  const legacy=typeof saved!=='object'||!grantFields.some(key=>Object.hasOwn(saved||{},key)),level=legacy?(index===0?1:index===1?10:0):Number(saved.sourceClassLevel);
  if(level!==1&&!(level===10&&additional)||row.level<level||slots.has(level)||known.has(style.id))continue;
  if(!legacy&&(saved.sourceClassId!==row.catalogId||saved.sourceClassName!=='Fighter'||saved.edition!=='2014'))continue;
  if(saved?.source&&saved.source!==style.source)continue;
  styles.push({...style,sourceClassId:row.catalogId,sourceClassName:'Fighter',sourceClassLevel:level,edition:'2014'});slots.add(level);known.add(style.id);
 }
 styles.sort((a,b)=>a.sourceClassLevel-b.sourceClassLevel);
 if(swords){const selected=c.expandedSubclassChoices?.[swords.catalogId]?.['2014:subclass:bard:swords']?.['fighting-style'];const style=selected?.length===1&&['Dueling','Two-Weapon Fighting'].includes(selected[0])?styleFor(selected[0]):null;if(style&&!known.has(style.id))styles.push({...style,sourceClassId:swords.catalogId,sourceClassName:'Bard',sourceClassLevel:3,edition:'2014'});}
 return {active:true,row,fighterRow:found?row:null,max,styles};
}
