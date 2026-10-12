import {classCharacter,progressionTables} from './advancement.js';
import {powerPointProfile35} from './manifesting35.js';
import {specialCastingAccess} from './legacySpecialCasting.js';
import {psionicPrerequisiteRows35,evaluatePowerPointPrerequisite35} from './powerPointPrerequisites35.js';

// Exact Expanded Psionics Handbook sources. Other class tables do not prove
// their manifester-level rule or their power-access ability.
const reviewed={
  'classes/psion-137':{name:'Psion',ability:'int'},
  'classes/psychic-warrior-138':{name:'Psychic Warrior',ability:'wis'},
  'classes/wilder-140':{name:'Wilder',ability:'cha'}
};
const positive=value=>Number.isSafeInteger(value)&&value>0;
const namedManifester=value=>Object.values(reviewed).some(r=>r.name.toLowerCase()===String(value||'').trim().toLowerCase());
// A recorded modifier is uncertainty, never fabricated class advancement.
const hasUnreviewedLevelBonus=character=>Array.isArray(character.feats)&&character.feats.some(feat=>
  [feat?.name,feat?.featTemplateName].some(name=>/^practiced manifester(?:\s*\([^)]*\))?$/i.test(String(name||'').trim()))
);
export function lowerManifestingPrerequisite35(clause){
  if(!['psionics','manifesting','powers','special'].includes(clause?.kind||clause?.type))return null;
  const text=String(clause.text||clause.description||'').trim().replace(/\.$/,'');
  const level=text.match(/^Manifester level (\d+)(?:st|nd|rd|th)$/i);
  if(level&&positive(Number(level[1])))return {kind:'manifester_level',minimum:Number(level[1])};
  const power=text.match(/^(?:Ability to|Able to|Must be able to) manifest (?:(?:a|one|any|at least one) )?([1-9])(?:st|nd|rd|th)[- ]level (?:psionic )?powers?(?: or higher)?$/i);
  return power?{kind:'manifesting',minimum:Number(power[1])}:null;
}

const hasIndependentPowerTable=definition=>progressionTables(definition).some(table=>{
  const h=table.slice(0,5).findIndex(row=>row.some(v=>/^(?:class |racial )?level$/i.test(String(v).trim())));
  if(h<0)return false;
  const header=table[h];
  if(header.some(v=>/power points|^pp$/i.test(String(v))))return true;
  // Prestige '+1 level of existing manifesting class' is advancement, not a
  // second independent manifester. Scalar powers-known data remains evidence.
  const indexes=header.flatMap((v,i)=>/powers? known|powers? discovered|maximum power level/i.test(String(v))?[i]:[]);
  return table.slice(h+1).some(row=>indexes.some(i=>/^\d+(?:st|nd|rd|th)?\*?$/.test(String(row[i]).trim())));
});

export function evaluateManifestingPrerequisite35(clause,character){
  const kind=clause?.kind||clause?.type;
  const rule=kind==='manifester_level'||kind==='manifesting'&&clause.minimum!=null?{...clause,kind}:lowerManifestingPrerequisite35(clause);
  if(!rule)return undefined;
  if(!positive(rule.minimum)||rule.kind==='manifesting'&&rule.minimum>9)return null;
  const rows=psionicPrerequisiteRows35(character);if(!rows)return null;
  let unknown=rule.kind==='manifester_level'&&hasUnreviewedLevelBonus(character);
  for(const row of rows){
    const source=String(row.definition.sourceId||row.catalogId).replace(/^dndtools:/,''),review=reviewed[source];
    if(!review||review.name!==row.name){
      if(hasIndependentPowerTable(row.definition)||namedManifester(row.name)||namedManifester(row.definition.inheritsFrom))unknown=true;
      continue;
    }
    const model=classCharacter(character,row),profile=powerPointProfile35(model);
    if(!profile||!positive(profile.level)){unknown=true;continue;}
    if(rule.kind==='manifester_level'){if(profile.level>=rule.minimum)return true;continue;}
    if(!positive(profile.maximum)||profile.maximum>9||!positive(profile.known)){unknown=true;continue;}
    if(profile.maximum<rule.minimum||profile.level<rule.minimum*2-1)continue;
    const ability=character.abilities?.[review.ability],bonus=character.abilityBonuses?.[review.ability]??0;
    if(!Number.isFinite(ability)||!Number.isFinite(bonus)){unknown=true;continue;}
    if(ability+bonus<10+rule.minimum)continue;
    const reserve=evaluatePowerPointPrerequisite35({kind:'power_point_reserve',minimum:rule.minimum*2-1},character);
    if(reserve===false)continue;
    if(reserve==null){unknown=true;continue;}
    for(const power of model.spells||[]){
      const access=specialCastingAccess(model,power);
      if(!access?.allowed||access.level<rule.minimum||profile.level<access.level*2-1)continue;
      if(evaluatePowerPointPrerequisite35({kind:'power_point_reserve',minimum:access.level*2-1},character)===true)return true;
    }
    // A saved power list may be incomplete. Do not infer powers from a table
    // ceiling or reject an unrecorded selection as though it never existed.
    unknown=true;
  }
  return unknown?null:false;
}
