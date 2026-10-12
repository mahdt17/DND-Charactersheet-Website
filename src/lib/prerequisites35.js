import {hasWeaponTraining,startingProficiencies} from './training.js';
import {evaluateClassFeaturePrerequisite35} from './classFeaturePrerequisites35.js';
import {evaluatePatronPrerequisite35} from './patronDeity35.js';
import {evaluatePowerPointPrerequisite35} from './powerPointPrerequisites35.js';
import {evaluateManifestingPrerequisite35} from './manifestingPrerequisites35.js';

// Closed prerequisite predicates. Undefined means the legacy evaluator owns the
// clause; null means recognized but unresolved. No narrative substring matching.
const norm=value=>String(value||'').trim().replace(/[’]/g,"'").replace(/\s+/g,' ').toLowerCase();
const positive=value=>Number.isInteger(value)&&value>0;
const quantity=value=>({one:1,two:2,three:3,four:4}[norm(value)]||Number(value));
const typeName=value=>norm(value).replace(/\s+feats?$/,'');
const scoped=(value,subject)=>value==='$subject'?subject:value;
const languageName=value=>/^[A-Z][A-Za-z'’\-]*(?:\s+[A-Z][A-Za-z'’\-]*){0,2}$/.test(String(value||'').trim());

function knownLanguages35(character){
  const raw=Array.isArray(character?.languages)?character.languages:String(character?.languages||'').split(/[,;\n]/);
  return new Set(raw.map(value=>norm(value?.name??value)).filter(Boolean));
}

function namedLanguageAlternatives(text){
  const cleaned=String(text||'').replace(/\.$/,'').trim();
  if(!/\bor\b/i.test(cleaned))return null;
  const names=cleaned.split(/\s*,\s*or\s+|\s+or\s+|\s*,\s*/i).map(value=>value.trim()).filter(Boolean);
  return names.length>1&&names.every(languageName)?names:null;
}

function namedFeatAlternatives(text){
  const names=[],separators=[];
  let depth=0,start=0;
  for(let i=0;i<text.length;i++){
    if(text[i]==='('){depth++;continue;}
    if(text[i]===')'){if(--depth<0)return null;continue;}
    if(depth)continue;
    const separator=text.slice(i).match(/^(,\s*or\s+|\s+or\s+|,\s*)/i);
    if(separator){names.push(text.slice(start,i).trim());separators.push(/\bor\b/i.test(separator[0])?'or':',');i+=separator[0].length-1;start=i+1;}
  }
  names.push(text.slice(start).trim());
  if(depth||names.length<2||separators.at(-1)!=='or')return null;
  if(separators.includes(',')&&(!/,\s*or\s+/i.test(text)||separators.slice(0,-1).some(value=>value!==',')))return null;
  const valid=name=>/^[A-Z][A-Za-z0-9'’ -]*(?:\([A-Za-z0-9'’ -]+\))?$/.test(name)
    &&! /\b(or|and|any|one|two|three|four|other|either|both|must|plus|with|requires?|class|feature|feats?)\b/i.test(name.replace(/Two-Weapon/gi,'DualWeapon'));
  return names.every(valid)?{kind:'any',requirements:names.map(name=>({kind:'feat',name}))}:null;
}

export function ownsPrerequisiteFeat35(character,{name,featId,subject}={}){
  if(!name&&!featId)return null;
  return (character.feats||[]).some(feat=>{
    if(featId&&![feat.catalogId,feat.sourceId,feat.featTemplateId].includes(featId))return false;
    const exactSubjectName=name&&subject!=null&&norm(feat.name)===norm(`${name} (${subject})`);
    if(name&&![feat.name,feat.featTemplateName].some(value=>norm(value)===norm(name))&&!exactSubjectName)return false;
    return subject==null||(feat.featSubject!=null?norm(feat.featSubject)===norm(subject):exactSubjectName);
  });
}

export function prerequisiteDescription35(p){
  if(!p||typeof p!=='object')return 'Requirement needs source review';
  if(p.text||p.description||p.name)return p.text||p.description||p.name;
  const kind=p.kind||p.type;
  if(kind==='spellcasting'&&p.minimum!=null)return `Cast ${p.minimum}-level or higher ${p.tradition?p.tradition+' ':''}spells`;
  if(kind==='power_point_reserve')return `Power point reserve of at least ${p.minimum}`;
  if(kind==='base_power_points')return `Base power points per day of at least ${p.minimum} (excluding bonuses)`;
  if(kind==='manifester_level')return `Manifester level ${p.minimum} or higher`;
  if(kind==='manifesting'&&p.minimum!=null)return `Manifest a power of level ${p.minimum} or higher`;
  if(['all','any','count'].includes(kind)&&Array.isArray(p.requirements))return `${kind==='all'?'All':kind==='any'?'At least one':`At least ${p.minimum}`} of: ${p.requirements.map(prerequisiteDescription35).join('; ')}`;
  if(kind==='skill_list'&&Array.isArray(p.requirements))return `All of: ${p.requirements.map(prerequisiteDescription35).join('; ')}`;
  if(kind==='feat_count')return `At least ${p.minimum} distinct ${p.featType||(p.featTypes||[]).join(' or ')} feats`;
  if(kind==='skill_count')return `At least ${p.minimum} distinct skills with ${p.ranks} ranks`;
  if(kind==='language_count')return `Speak at least ${p.minimum} languages`;
  if(kind==='language')return `Speak ${p.name}`;
  if(kind==='class_feature')return `Class feature: ${p.feature}`;
  if(kind==='save')return `${({fort:'Fortitude',ref:'Reflex',will:'Will'}[p.save]||'Save')} +${p.minimum}`;
  if(kind==='proficiency')return `${p.proficiencyKind||'Proficiency'}: ${p.index||'selected subject'}`;
  if(kind==='feat'&&p.featId)return `Feat ${p.featId}`;
  return 'Requirement needs source review';
}

export function lowerPrerequisiteText35(p){
  const text=String(p.text||p.description||'').trim(),kind=p.kind||p.type||'text';
  if(kind==='text'){
    const prefixed=text.match(/^(Feats?|Skills?|Race|Alignment)\s*:\s*(.+)$/i);
    if(prefixed){
      const target={feat:'feats',feats:'feats',skill:'skills',skills:'skills',race:'race',alignment:'alignment'}[prefixed[1].toLowerCase()];
      if(target)return {kind:target,text:prefixed[2].trim()};
    }
  }
  if(['feat','feats'].includes(kind)){
    const typed=text.match(/^(?:any\s+)?(?:(one|two|three|[1-9]\d*)\s+)?(metamagic|item creation|metabreath|psionic|luck|shifter|exalted) feats?\.?$/i);
    if(typed)return {kind:'feat_count',minimum:typed[1]?quantity(typed[1]):1,featType:typed[2]};
    const alternatives=namedFeatAlternatives(text.replace(/\.$/,''));
    if(alternatives)return alternatives;
  }
  if(['skill','skills'].includes(kind)){
    const forward=text.match(/^Any (?:(one|two|three|four|[1-9]\d*) )?skills? (\d+) ranks?(?: each)?\.?$/i);
    const reverse=text.match(/^(\d+) ranks in any (one|two|three|four|[1-9]\d*) skills\.?$/i);
    if(forward)return {kind:'skill_count',minimum:forward[1]?quantity(forward[1]):1,ranks:Number(forward[2])};
    if(reverse)return {kind:'skill_count',minimum:quantity(reverse[2]),ranks:Number(reverse[1])};
    const explicit=text.replace(/\.$/,'').split(/\s*,\s*(?![^()]*\))/).map(value=>value.trim());
    if(explicit.length>1&&explicit.every(clause=>/^[\w ()'-]+?\s+\d+\s+ranks?$/i.test(clause)&&! /\b(or|any|other)\b/i.test(clause)))
      return {kind:'skill_list',requirements:explicit.map(clause=>({kind:'skill',text:clause}))};
    const clauses=text.replace(/\.$/,'').split(/\s*;\s*/);
    if(clauses.length>1&&clauses.some(clause=>/\bor\b/i.test(clause))){
      const nodes=clauses.map(clause=>{
        const alternate=clause.match(/^(Knowledge \([\w '-]+\)) or (Knowledge \([\w '-]+\)) (\d+) ranks?$/i);
        if(alternate)return {kind:'any',requirements:alternate.slice(1,3).map(name=>({kind:'skill',text:`${name} ${alternate[3]} ranks`}))};
        return /^[\w ()'-]+ \d+ ranks?$/i.test(clause)&&! /\b(or|any|other)\b/i.test(clause)?{kind:'skill',text:clause}:null;
      });
      if(nodes.every(Boolean))return {kind:'all',requirements:nodes};
    }
  }
  if(['language','languages'].includes(kind)||/^Must speak\b/i.test(text)){
    const count=text.match(/^Must speak at least (one|two|three|four|[1-9]\d*) languages?\.?$/i);
    if(count)return {kind:'language_count',minimum:quantity(count[1])};
    const spoken=text.match(/^Must speak (.+)$/i)?.[1]?.replace(/\.$/,'').trim();
    const value=spoken||text.replace(/\.$/,'').trim();
    const alternatives=namedLanguageAlternatives(value);
    if(alternatives)return {kind:'any',requirements:alternatives.map(name=>({kind:'language',name}))};
    if(languageName(value))return {kind:'language',name:value};
  }
  const specificSave={base_fortitude_save:'fort',base_reflex_save:'ref',base_will_save:'will'}[kind];
  if(specificSave){
    const match=text.match(/^\+?\s*(\d+)\.?$/);
    if(match)return {kind:'save',save:specificSave,minimum:Number(match[1])};
  }
  if(/base.*save|saving_throws/.test(kind)){
    const match=text.match(/^(?:Base )?(Fortitude|Fort|Reflex|Ref|Will)(?: Save)?\s*\+(\d+)\.?$/i);
    if(match)return {kind:'save',save:{fortitude:'fort',fort:'fort',reflex:'ref',ref:'ref',will:'will'}[match[1].toLowerCase()],minimum:Number(match[2])};
  }
  if(/^Proficiency with selected weapon\.?$/i.test(text))return {kind:'proficiency',proficiencyKind:'weapons',name:'$subject'};
  return null;
}

export function evaluatePrerequisite35(p,c,{subject,equipment=[],evaluate}={}){
  if(!p||typeof p!=='object'||Array.isArray(p))return null;
  const patron=evaluatePatronPrerequisite35(p,c);
  if(patron!==undefined)return patron;
  const powerPoints=evaluatePowerPointPrerequisite35(p,c);
  if(powerPoints!==undefined)return powerPoints;
  const manifesting=evaluateManifestingPrerequisite35(p,c);
  if(manifesting!==undefined)return manifesting;
  const kind=p.kind||p.type;
  if(['all','any','count'].includes(kind)){
    const nodes=p.requirements;
    if(!Array.isArray(nodes)||!nodes.length||nodes.some(node=>!node||typeof node!=='object'||Array.isArray(node)))return null;
    if(kind==='count'&&(!positive(p.minimum)||p.minimum>nodes.length))return null;
    const values=nodes.map(evaluate),yes=values.filter(value=>value===true).length,unknown=values.filter(value=>value==null).length;
    if(kind==='all')return values.includes(false)?false:unknown?null:true;
    if(kind==='any')return yes?true:unknown?null:false;
    return yes>=p.minimum?true:yes+unknown<p.minimum?false:null;
  }
  if(kind==='skill_list'){
    const nodes=p.requirements;
    if(!Array.isArray(nodes)||!nodes.length||nodes.some(node=>!node||typeof node!=='object'||Array.isArray(node)))return null;
    const values=nodes.map(evaluate);
    return values.includes(false)?false:values.some(value=>value==null)?null:true;
  }
  if(kind==='feat_count'){
    const types=Array.isArray(p.featTypes)?p.featTypes:p.featType?[p.featType]:[];
    if(!positive(p.minimum)||!types.length||types.some(type=>typeof type!=='string'||!type.trim()))return null;
    const wanted=new Set(types.map(typeName)),owned=new Set();
    for(const feat of c.feats||[]){
      if(!feat?.name||!wanted.has(typeName(feat.featType)))continue;
      const displaySubject=String(feat.name).match(/^(.*?)\s+\((.*)\)$/);
      owned.add(norm(feat.featTemplateName||displaySubject?.[1]||feat.name)+'|'+norm(feat.featSubject??displaySubject?.[2]));
    }
    return owned.size>=p.minimum;
  }
  if(kind==='skill_count'){
    if(!positive(p.minimum)||!positive(p.ranks))return null;
    const skills=new Set(Object.entries(c.skillRanks||{}).filter(([name,ranks])=>norm(name)&&Number.isFinite(Number(ranks))&&Number(ranks)>=p.ranks).map(([name])=>norm(name)));
    return skills.size>=p.minimum;
  }
  if(kind==='language_count'){
    if(!positive(p.minimum))return null;
    return knownLanguages35(c).size>=p.minimum;
  }
  if(kind==='language'&&p.name!=null){
    if(!languageName(p.name))return null;
    return knownLanguages35(c).has(norm(p.name));
  }
  if(kind==='save'){
    if(!['fort','ref','will'].includes(p.save)||!Number.isInteger(p.minimum)||p.minimum<0)return null;
    return Number(c.save35?.[p.save]??0)>=p.minimum;
  }
  if(kind==='feat'&&(p.featId||p.name&&!p.text||p.subject!=null)){
    const target=scoped(p.subject,subject);
    if(p.subject==='$subject'&&!target)return null;
    return ownsPrerequisiteFeat35(c,{name:p.name,featId:p.featId,subject:target});
  }
  if(kind==='proficiency'&&(p.proficiencyKind||p.index||p.name)){
    const name=scoped(p.name,subject);
    if(!p.proficiencyKind||(!name&&!p.index))return null;
    const weaponIndex=String(p.index||norm(name).replace(/[^a-z0-9]+/g,'-'));
    const override=c.weaponTrainingOverrides?.[weaponIndex];
    if(norm(p.proficiencyKind)==='weapons'&&typeof override==='boolean')return override;
    const trainingGrants=(c.trainingGrants||[]).filter(grant=>!grant.sourceOnly);
    const entries=trainingGrants.flatMap(grant=>grant.proficiencies||[]).filter(entry=>!entry.sourceOnly);
    if(entries.some(entry=>norm(entry.kind)===norm(p.proficiencyKind)&&(!name||norm(entry.name)===norm(name))&&(!p.index||norm(entry.index)===norm(p.index))))return true;
    if(norm(p.proficiencyKind)!=='weapons')return false;
    const starting=startingProficiencies(c).filter(entry=>!entry?.sourceOnly);
    const candidates=(Array.isArray(equipment)?equipment:[]).filter(item=>
      /^3\.5(?:-reference)?$/.test(item.edition||'3.5')&&
      [item.kind,item.itemType].some(kind=>norm(kind)==='weapon')&&
      (!name||norm(item.name)===norm(name))&&(!p.index||String(item.index||item.id||'').split('/').at(-1)===p.index));
    const categories=new Set(candidates.map(item=>norm(item.itemCategory||item.weapon_category||item.bodySlot)).filter(Boolean));
    const category=categories.size===1?[...categories][0]:null;
    const weapon={index:weaponIndex,weapon_category:category?category[0].toUpperCase()+category.slice(1):undefined,weapon_range:candidates.length===1?candidates[0].weapon_range:undefined};
    if(hasWeaponTraining({...c,trainingGrants},weapon,starting))return true;
    const grouped=[...entries,...starting].some(entry=>/(?:^|-)weapons$/.test(typeof entry==='string'?entry:entry.index||''));
    if(grouped&&(!category||[...entries,...starting].some(entry=>(entry.index||entry)==='martial-melee-weapons')&&!weapon.weapon_range))return null;
    return false;
  }
  const feature=evaluateClassFeaturePrerequisite35(p,c);
  if(feature!==undefined)return feature;
  const lowered=lowerPrerequisiteText35(p);
  return lowered?evaluate(lowered):undefined;
}
