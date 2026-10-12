import {characterClasses,classCharacter,progressionTables} from './advancement.js';
import {powerPointProfile35,powerPointReserve35} from './manifesting35.js';
import {consistentCastingRow35,validCastingAdvancements35} from './castingPrerequisites35.js';

const positive=value=>Number.isSafeInteger(value)&&value>0;
export function lowerPowerPointPrerequisite35(clause){
  const kind=clause?.kind||clause?.type,text=String(clause?.text||clause?.description||'').trim().replace(/\.$/,'');
  const reserve=['psionics','manifesting'].includes(kind)&&text.match(/^(?:Must have a )?power point reserve of at least (\d+)(?: power points?)?$/i);
  const base=kind==='base_power_points/day'&&text.match(/^(\d+)\+ \(not including bonus power points\)$/i);
  const minimum=Number((reserve||base)?.[1]);
  return positive(minimum)?{kind:base?'base_power_points':'power_point_reserve',minimum}:null;
}

export function evaluatePowerPointPrerequisite35(clause,character){
  const kind=clause?.kind||clause?.type;
  const rule=['power_point_reserve','base_power_points'].includes(kind)?{...clause,kind}:lowerPowerPointPrerequisite35(clause);
  if(!rule)return undefined;
  if(!positive(rule.minimum))return null;
  const allRows=characterClasses(character),rows=allRows.filter(row=>row.edition==='3.5');
  if(character.ruleset!=='3.5'&&!(character.ruleset==='custom'&&(character.mechanics==='3.5'||rows.length)))return null;
  // The reserve consults definition.edition and row.name; validate both inputs,
  // including a legacy definition incorrectly labeled as a modern class row.
  if(allRows.some(row=>row.definition?.edition==='3.5'&&row.edition!=='3.5'))return null;
  if(!rows.length||!rows.every(row=>consistentCastingRow35(row)&&row.definition.edition==='3.5'&&row.name===row.definition.name)||new Set(rows.map(row=>row.catalogId)).size!==rows.length)return null;
  // Saved derived entries must still correspond to real prestige milestones.
  const advances=(character.castingAdvancements||[]).filter(entry=>entry?.kind==='psionic');
  if(validCastingAdvancements35(character,rows).filter(entry=>entry.kind==='psionic').length!==advances.length)return null;
  const reserve=powerPointReserve35(character);
  if(!Number.isFinite(reserve.base))return null;
  if(reserve.base>=rule.minimum)return true;
  let unknown=false;
  for(const row of rows){
    const profile=powerPointProfile35(classCharacter(character,row));
    if(!profile){
      // An incomplete psionic table is not evidence of zero capacity.
      if(progressionTables(row.definition).some(table=>table.slice(0,5).some(header=>header.some(value=>/power points|powers known|powers discovered/i.test(String(value))))))unknown=true;
      continue;
    }
    if(!Number.isFinite(profile.base))return null;
    if(rule.kind==='base_power_points')continue;
    if(!profile.ability||!Number.isFinite(character.abilities?.[profile.ability])||!Number.isFinite(character.abilityBonuses?.[profile.ability]??0))unknown=true;
  }
  if(rule.kind==='base_power_points')return unknown?null:false;
  if(character.powerPointBonus?.source&&!Number.isFinite(character.powerPointBonus.amount))unknown=true;
  if(unknown||!Number.isFinite(reserve.maximum))return null;
  return reserve.maximum>=rule.minimum;
}
