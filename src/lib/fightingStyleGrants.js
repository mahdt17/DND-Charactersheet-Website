import {characterClasses,contentKey} from './advancement.js';
import {fightingStyles} from '../data/fightingStyles.js';
const grantFields=['sourceClassId','sourceClassName','sourceClassLevel','edition'];
const styleFor=value=>fightingStyles.find(s=>[s.id,s.name,`${s.name} (${s.source})`].includes(typeof value==='object'?value?.id:value));
// Only completely metadata-free saves migrate by position: first Fighter 1,
// second Champion 10. Explicit ownership is never reassigned to another source.
export function fightingStyleGrants(c){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014',found=characterClasses(c).find(r=>r.name==='Fighter'&&r.edition==='2014'&&!r.homebrew&&!r.definition?.homebrew&&r.definition?.source!=='Homebrew'&&!r.definition?.prestige);
 if(edition!=='2014'||!found)return {active:false,row:null,max:0,styles:[]};
 const row={...found,catalogId:found.catalogId||(found.definition?contentKey({...found.definition,edition:found.edition}):'2014:fighter')},additional=row.subclass==='Champion'&&row.level>=10,max=additional?2:1,styles=[],slots=new Set(),known=new Set();
 for(const [index,saved] of (c.fightingStyles?.choices||[]).entries()){
  const style=styleFor(saved);if(!style)continue;
  const legacy=typeof saved!=='object'||!grantFields.some(key=>Object.hasOwn(saved||{},key)),level=legacy?(index===0?1:index===1?10:0):Number(saved.sourceClassLevel);
  if(level!==1&&!(level===10&&additional)||row.level<level||slots.has(level)||known.has(style.id))continue;
  if(!legacy&&(saved.sourceClassId!==row.catalogId||saved.sourceClassName!=='Fighter'||saved.edition!=='2014'))continue;
  if(saved?.source&&saved.source!==style.source)continue;
  styles.push({...style,sourceClassId:row.catalogId,sourceClassName:'Fighter',sourceClassLevel:level,edition:'2014'});slots.add(level);known.add(style.id);
 }
 styles.sort((a,b)=>a.sourceClassLevel-b.sourceClassLevel);
 return {active:true,row,max,styles};
}
