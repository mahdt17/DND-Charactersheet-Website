import {characterClasses} from './advancement.js';
import {subclassCasting} from './subclassCasting.js';

const fullCasters=new Set(['Bard','Cleric','Druid','Sorcerer','Wizard']);
const halfCasters=new Set(['Paladin','Ranger']);
const nonCasters=new Set(['Barbarian','Fighter','Monk','Rogue']);
const empty=()=>Array(10).fill(0);
export const slotArray=slots=>Array.from({length:10},(_,i)=>Math.max(0,Math.min(30,Math.trunc(Number(slots?.[i])||0))));

// The caller supplies edition-specific class tables. Custom/prestige/unsupported
// spellcasting is deliberately left for an explicit personal slot override.
export function multiclassPools(c,singleSlots) {
  const rows=characterClasses(c),edition=c.ruleset||'2014';
  const manual=reason=>({standard:empty(),pact:empty(),mode:'manual',reason});
  if(!['2014','2024'].includes(edition)||rows.some(r=>r.edition!==edition))return manual('Set slots from your table’s rules for this edition or cross-edition combination.');
  if(rows.some(r=>r.definition?.prestige||r.definition?.source==='Homebrew'||(!fullCasters.has(r.name)&&!halfCasters.has(r.name)&&!nonCasters.has(r.name)&&r.name!=='Warlock'&&!(edition==='2014'&&r.name==='Artificer'))))
    return manual('This class combination needs source-based slot configuration.');
  const model=r=>({className:r.name,classDefinition:r.definition,subclass:r.subclass,level:r.level,ruleset:edition});
  const third=r=>subclassCasting(model(r))?.active;
  const casters=rows.filter(r=>fullCasters.has(r.name)||r.name==='Artificer'||third(r)||(halfCasters.has(r.name)&&r.level>=(edition==='2024'?1:2)));
  const casterLevel=casters.reduce((n,r)=>n+(fullCasters.has(r.name)?r.level:third(r)?Math.floor(r.level/3):edition==='2024'||r.name==='Artificer'?Math.ceil(r.level/2):Math.floor(r.level/2)),0);
  const standard=casters.length===1?singleSlots(model(casters[0])):casters.length>1?singleSlots({className:'Wizard',level:casterLevel,ruleset:edition}):empty();
  const warlock=rows.find(r=>r.name==='Warlock');
  return {standard:slotArray(standard),pact:warlock?slotArray(singleSlots(model(warlock))):empty(),mode:'automatic',casterLevel};
}

export function restSpellSlots(c,rest) {
  if(rest==='long')return {slotsUsed:{},pactSlotsUsed:{}};
  const rows=characterClasses(c);
  const singleWarlock=rows.length===1&&rows[0].name==='Warlock'&&['2014','2024'].includes(c.ruleset||'2014');
  return {slotsUsed:singleWarlock?{}:c.slotsUsed,pactSlotsUsed:{}};
}
