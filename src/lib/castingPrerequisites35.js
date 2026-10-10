import {characterClasses,contentKey} from './advancement.js';
import {spellSlotProgression,reviewedSpellcasting35,castingAdvancementPlan,castingAdvancementSelectionsValid} from './classIntegration.js';
import {applyFeatAbilityIncrease} from './featMagic.js';

const abilityKey=value=>({int:'int',intelligence:'int',wis:'wis',wisdom:'wis',cha:'cha',charisma:'cha'}[String(value||'').toLowerCase()]||null);
const score=(c,key)=>{
  if(!key||!Number.isFinite(c.abilities?.[key]))return null;
  const bonus=c.abilityBonuses?.[key]??0;
  if(!Number.isFinite(bonus))return null;
  const value=applyFeatAbilityIncrease(c,key,c.abilities[key]+bonus);
  return Number.isFinite(value)?value:null;
};
const consistentRow=row=>{
  if(!row?.definition||!Number.isInteger(row.level)||row.level<1||contentKey(row.definition)!==row.catalogId)return false;
  const ids=[row.definition.sourceId,row.definition.id,row.definition.catalogId].filter(Boolean).map(id=>String(id).replace(/^dndtools:/,''));
  return new Set(ids.filter(id=>id.startsWith('classes/'))).size<=1;
};

export function castingTextSafe35(record){
  const clauses=(Array.isArray(record?.prerequisites)?record.prerequisites:[]).map(p=>String(p?.text||p?.description||''));
  return !clauses.some(text=>/(?:,\s*OR\.?$|one of the (?:three|following) requirements)/i.test(text))
    &&new Set(clauses.flatMap(text=>[...text.matchAll(/qualify to become a (\d+)(?:st|nd|rd|th)-level/gi)].map(m=>m[1]))).size<2;
}

export function lowerCastingPrerequisite35(p){
  if(!['spells','spellcasting','special','spell'].includes(p.kind||p.type))return null;
  const text=String(p.text||p.description||'').trim().replace(/\.$/,'');
  const start=text.match(/^(?:Ability|Able) to cast (.+)$/i);
  if(!start)return null;
  const clause=start[1];
  const direct=clause.match(/^([0-9])(?:st|nd|rd|th)?[- ]level (?:(arcane|divine)(?: (and|or) (arcane|divine))? )?spells(?: \(cantrips\))?$/i);
  const reversed=clause.match(/^(?:(arcane|divine) )?spells of ([0-9])(?:st|nd|rd|th) level(?: or higher)?$/i);
  const anyLevel=clause.match(/^(arcane|divine)(?: (and|or) (arcane|divine))? spells$/i);
  const repeated=clause.match(/^([0-9])(?:st|nd|rd|th)[- ]level (arcane|divine) spells (and|or) ([0-9])(?:st|nd|rd|th)[- ]level (arcane|divine) spells$/i);
  const node=(minimum,tradition)=>({kind:'spellcasting',minimum:Number(minimum),...(tradition?{tradition:tradition.toLowerCase()}:{})});
  const group=(a,op,b)=>({kind:op.toLowerCase()==='and'?'all':'any',requirements:[a,b]});
  if(direct)return direct[3]?group(node(direct[1],direct[2]),direct[3],node(direct[1],direct[4])):node(direct[1],direct[2]);
  if(reversed)return node(reversed[2],reversed[1]);
  if(anyLevel)return anyLevel[2]?group(node(0,anyLevel[1]),anyLevel[2],node(0,anyLevel[3])):node(0,anyLevel[1]);
  if(repeated)return group(node(repeated[1],repeated[2]),repeated[3],node(repeated[4],repeated[5]));
  return null;
}

function validAdvancements(c,rows){
  const groups=new Map(),all=Array.isArray(c.castingAdvancements)?c.castingAdvancements:[];
  for(const entry of all){
    if(!entry||entry.automatic!==true||entry.sourceType!=='class'||entry.amount!==1||!Number.isInteger(entry.sourceClassLevel)||entry.sourceClassLevel<1)continue;
    const source=rows.find(row=>row.catalogId===entry.sourceClassId);
    if(!consistentRow(source)||entry.sourceClassLevel>source.level)continue;
    const key=JSON.stringify([source.catalogId,entry.sourceClassLevel]);
    if(!groups.has(key))groups.set(key,{source,level:entry.sourceClassLevel,entries:[]});
    groups.get(key).entries.push(entry);
  }
  const valid=[];
  for(const {source,level,entries} of groups.values()){
    const plan=castingAdvancementPlan(c,source.definition,level),picks={},matched=[];
    for(const group of plan.groups){
      const id=`class-advance:${source.catalogId}:${level}:${group.id}`;
      const copies=entries.filter(e=>e.id===id&&e.kind===group.kind);
      const targets=new Set(copies.map(e=>e.targetClassId));
      if(targets.size!==1)continue;
      picks[group.id]=copies[0].targetClassId;
      matched.push(copies[0]);
    }
    if(castingAdvancementSelectionsValid(plan,picks))valid.push(...matched);
  }
  return valid;
}

export function evaluateCastingPrerequisite35(p,c){
  if(!Number.isInteger(p.minimum)||p.minimum<0||p.minimum>9||p.tradition&&!['arcane','divine'].includes(p.tradition))return null;
  if((c.ruleset==='custom'?c.mechanics:c.ruleset)!=='3.5')return null;
  const rows=characterClasses(c).filter(row=>row.edition==='3.5'),advancements=validAdvancements(c,rows);
  let unknown=false;
  for(const row of rows){
    if(!consistentRow(row)){unknown=true;continue;}
    const extra=advancements.filter(e=>e.targetClassId===row.catalogId&&e.kind!=='psionic').length;
    const profile=spellSlotProgression(row.definition,row.level+extra);
    const reviewed=reviewedSpellcasting35(row.definition,row.level);
    if(!profile){if(reviewed.traditions.length)unknown=true;continue;}
    const levels=profile.unlockedSpellLevels.filter(level=>level>=p.minimum);
    if(!levels.length)continue;
    if(!reviewed.traditions.length){unknown=true;continue;}
    if(p.tradition&&!reviewed.traditions.includes(p.tradition))continue;
    const access=score(c,abilityKey(reviewed.ability)),bonus=score(c,abilityKey(reviewed.bonusAbility));
    if(access==null){unknown=true;continue;}
    for(const level of levels){
      if(access<10+level)continue;
      if(profile.slots[level]>0)return true;
      if(level>0){
        if(bonus==null)unknown=true;
        else if(Math.floor((bonus-10)/2)>=level)return true;
      }
    }
  }
  return unknown?null:false;
}
