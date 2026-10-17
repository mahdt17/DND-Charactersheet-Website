import {characterClasses} from './advancement.js';

const clean=value=>String(value||'').normalize('NFC').replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
const norm=value=>clean(value).toLowerCase();
const legacy=character=>character.ruleset==='3.5'||character.ruleset==='custom'&&(character.mechanics==='3.5'||characterClasses(character).some(row=>row.edition==='3.5'));
const clerics=character=>characterClasses(character).filter(row=>row.edition==='3.5'&&['Cleric','Cloistered Cleric'].includes(row.name));
// These catalog spellings need source review; never turn them into an entry rejection.
const unresolvedNames=new Set(['illmater','istishi','ghaunadar']);
const properName=value=>typeof value==='string'&&!unresolvedNames.has(norm(value))&&/^(?:the )?[\p{Lu}][\p{L}'-]*(?: (?:of|the|[\p{Lu}][\p{L}'-]*)){0,5}$/u.test(value)
  &&! /\b(?:a|an|any|one|chosen|deity|deities|pantheon|must|only|except|but|and|or|worship|worshiper)\b/i.test(value);

export function lowerPatronPrerequisite35(clause){
  const kind=clause?.kind||clause?.type,text=clean(clause?.text||clause?.description).replace(/\.$/,'').trim();
  const prefixed=text.match(/^(?:Must worship|Worshiper of) (.+)$/i);
  if(!['patron','patron_deity','deity'].includes(kind)&&!(kind==='special'&&prefixed))return null;
  const value=prefixed?prefixed[1]:text;
  let names=[value];
  if(/\bor\b/.test(value)){
    // Only an unambiguous final 'or' list; mixed conjunctions stay manual.
    if(!/^(?:[^,]+ or [^,]+|[^,]+(?:, [^,]+)*, or [^,]+)$/.test(value))return null;
    names=value.split(/, or | or |, /);
  }
  return names.every(properName)?{kind:'patron_deity',names}:null;
}

export function patronDeityState35(character){
  if(!legacy(character))return {known:false,name:''};
  if(typeof character.patronDeity35==='string')return {known:true,name:clean(character.patronDeity35)};
  const names=clerics(character).flatMap(row=>{
    const choice=character.legacyCastingChoices?.[row.catalogId];
    return typeof choice?.deity==='string'?[clean(choice.deity)]:[];
  });
  if(!names.length)return {known:false,name:''};
  if(new Set(names.map(norm)).size>1)return {known:false,name:'',conflict:true};
  return {known:true,name:names[0]};
}

export function migratePatronDeity35(character){
  const patron=patronDeityState35(character);
  return patron.known&&typeof character.patronDeity35!=='string'?{...character,patronDeity35:patron.name}:character;
}

export function patronDeityPatch35(character,value){
  if(!legacy(character)||typeof value!=='string')throw new Error('Record a patron deity for a 3.5 character.');
  const name=clean(value),choices={...character.legacyCastingChoices};
  for(const row of clerics(character)){
    const previous=choices[row.catalogId]||{};
    choices[row.catalogId]={...previous,deity:name,...(norm(previous.deity)!==norm(name)?{domains:[],favoredWeapon:''}:{})};
  }
  return {patronDeity35:name,legacyCastingChoices:choices};
}

export function evaluatePatronPrerequisite35(clause,character){
  const rule=clause?.kind==='patron_deity'&&Array.isArray(clause.names)?clause:lowerPatronPrerequisite35(clause);
  if(!rule)return undefined;
  if(!rule.names.length||!rule.names.every(properName))return null;
  const patron=patronDeityState35(character);
  return patron.known?rule.names.some(name=>norm(name)===norm(patron.name)):null;
}
