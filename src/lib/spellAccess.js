import {contentKey, progressionRow} from './advancement.js';
import {classSpellLists35} from './classSpellLists35.js';
import {subclassSpellAccess} from './subclassSpells.js';
import {subclassCasting,subclassSchoolAccess} from './subclassCasting.js';

const norm=value=>String(value?.name||value||'').trim().toLowerCase();
const validLevel=value=>Number.isInteger(value)&&value>=0&&value<=9;

// List membership is independent of slot capacity. Reference-only records and
// personal slot overrides must never confer access to another class's list.
export function spellAccessForClass(c,spell,{maxLevel=-1,cantrips=0,legacyProfile=null}={}) {
  const edition=c.classDefinition?.edition||c.ruleset||'2014';
  const legacy=edition==='3.5';
  const deny=reason=>({allowed:false,reason,level:spell.level});
  if(c.ruleset==='custom'&&c.unrestrictedSpellAccess===true)
    return {allowed:true,level:spell.level,reason:'Table-approved custom spell access'};
  if(spell.edition&&spell.edition!==edition)return deny('This spell belongs to a different edition.');
  const subclassGrant=subclassSpellAccess(c,spell);
  if(subclassGrant&&validLevel(spell.level))return {allowed:true,level:spell.level,alwaysPrepared:subclassGrant.alwaysPrepared,reason:`Granted by ${subclassGrant.source}`};
  const classId=c.activeCastingClassId||contentKey(c.classDefinition||{name:c.className,edition});
  const grants=(c.spellAccessGrants||[]).filter(g=>g.classId===classId&&Number(g.classLevel||1)<=c.level&&
    (g.spellId===(spell.catalogId||`${spell.edition||'2014'}:${spell.index||spell.id||spell.name}`))&&g.source);
  if(grants.length){const level=grants[0].spellLevel??spell.level;return validLevel(level)?{allowed:true,level,reason:`Granted by ${grants[0].source}`} : deny('Set a valid level for this granted spell.');}
  const profile=legacy?classSpellLists35[c.className]:null;
  const subclass=subclassCasting(c);
  const names=new Set([c.className,...(subclass?.active?[subclass.list]:[]),...(Array.isArray(c.classDefinition?.spellLists)?c.classDefinition.spellLists:[]),...(profile?.lists||[])].map(norm));
  const memberships=(spell.classes||[]).map(norm);
  const classLevels=Object.entries(spell.classLevels||{}).filter(([name,level])=>names.has(norm(name))&&validLevel(level));
  const addedLevel=profile?.spells?.[norm(spell.name).replaceAll('’',"'")];
  if(!memberships.some(name=>names.has(name))&&!classLevels.length&&!validLevel(addedLevel))return deny(`Not on the ${c.className} spell list. Record a specific source grant if a feature allows it.`);
  const level=validLevel(addedLevel)?addedLevel:legacy&&classLevels.length?Math.min(...classLevels.map(([,level])=>level)):spell.level;
  if(!validLevel(level))return deny('This spell needs a verified class spell level.');
  if(legacy){
    if(spell.isManeuver){
      const initiatorLevel=c.level+Math.floor(Number(c.otherClassLevels||0)/2);
      return level<=Math.min(9,Math.ceil(initiatorLevel/2))?{allowed:true,level}:deny('This maneuver requires a higher initiator level.');
    }
    if(legacyProfile){
      const unlocked=legacyProfile.unlockedSpellLevels||legacyProfile.history?.at(-1)?.unlockedSpellLevels||legacyProfile.slots.flatMap((count,i)=>count?[i]:[]);
      if(!unlocked.includes(level))return deny('Your class progression has not unlocked this spell level.');
    } else {
      const row=progressionRow(c.classDefinition,c.level);
      const power=Object.entries(row).find(([name])=>/maximum power level known/i.test(name));
      if(power&&level>parseInt(power[1]))return deny('Your class has not unlocked this power level.');
      if(!power||!Number.isFinite(parseInt(power[1])))return deny('This class has no verified spell-level progression. Record a spell-specific source grant after checking its rules.');
    }
    const ability=profile?.minimumAbility||c.castingAbility||({Cleric:'wis',Druid:'wis',Ranger:'wis',Paladin:'wis',Wizard:'int',Archivist:'int',Sorcerer:'cha',Bard:'cha'}[c.className]);
    const score=Number(c.abilities?.[ability])+Number(c.abilityBonuses?.[ability]||0);
    if(Number.isFinite(score)&&score<10+level)return deny(`Casting this spell requires ${ability.toUpperCase()} ${10+level}.`);
  } else if(level===0?cantrips<=0:level>maxLevel)return deny('Your class level has not unlocked this spell level.');
  if(!subclassSchoolAccess(c,spell))return deny('All unrestricted-school choices are used. Choose a spell from your subclass schools or replace an existing unrestricted choice.');
  return {allowed:true,level};
}
