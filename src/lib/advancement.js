import {normalizeEdition} from './content.js';
import {setSpentHitDice} from './hitDice.js';
import {applyMulticlassTraining} from './training.js';
import {applyFeatAbilityIncrease} from './featMagic.js';
export const contentKey=r=>r.catalogId||`${normalizeEdition(r.edition)}:${r.index||r.id||r.name}`;
export const prestige=r=>Boolean(r?.prestige||r?.stats?.prestige);
const norm=s=>String(s||'').trim().replace(/[’]/g,"'").toLowerCase();
const scores={strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha',str:'str',dex:'dex',con:'con',int:'int',wis:'wis',cha:'cha'};
export function characterClasses(c) {
  if(Array.isArray(c.classLevels)&&c.classLevels.length)return c.classLevels.map((row,i)=>({...row,subclass:row.subclass??(i===0?c.subclass||'':''),level:Math.max(1,Math.floor(Number(row.level)||1)),edition:normalizeEdition(row.edition||c.ruleset)}));
  if(!c.className)return [];
  const definition=c.classDefinition||{name:c.className,index:c.className,edition:c.ruleset==='custom'?c.mechanics:c.ruleset,hit_die:Number(String(c.hitDie||'d8').slice(1))};
  return [{catalogId:contentKey(definition),name:c.className,edition:normalizeEdition(definition.edition||c.ruleset),level:Math.max(1,Number(c.level)||1),definition,subclass:c.subclass||''}];
}
export const totalLevel=c=>characterClasses(c).reduce((n,x)=>n+x.level,0)||Number(c.level)||1;
export function spellsForClass(c,catalogId) {
  const primary=characterClasses(c)[0]?.catalogId;
  return (c.spells||[]).filter(s=>(s.castingClassId||primary)===catalogId);
}
export function normalizeAdvancement(c) {
  const classLevels=characterClasses(c);
  return {...c,classLevels,subclass:classLevels[0]?.subclass||'',level:classLevels.reduce((n,x)=>n+x.level,0)||c.level||1};
}
export function classCharacter(c,row) {return {...c,classLevels:undefined,className:row.name,classDefinition:row.definition,activeCastingClassId:row.catalogId,spells:spellsForClass(c,row.catalogId),otherClassLevels:characterClasses(c).filter(r=>r.catalogId!==row.catalogId).reduce((n,r)=>n+r.level,0),level:row.level,subclass:row.subclass||'',ruleset:row.edition,slotOverride:undefined,castingAbility:row.castingAbility||(characterClasses(c)[0]?.catalogId===row.catalogId?c.castingAbility:undefined)};}
export function progressionTables(record) {
  const p=record?.progression;
  if(Array.isArray(p)&&p.length&&Array.isArray(p[0])&&!Array.isArray(p[0][0]))return [p];
  if(record?.tables?.length)return record.tables;
  if(record?.advancement?.length){const keys=Object.keys(record.advancement[0]);return [ [keys,...record.advancement.map(r=>keys.map(k=>r[k]??''))] ];}
  return [];
}
export function progressionRow(record,level) {
  for(const t of progressionTables(record)) {
    const i=t[0]?.findIndex(v=>/^(?:class )?level$/i.test(String(v).trim()));
    if(i<0)continue;
    const r=t.slice(1).find(r=>parseInt(r[i])===level);
    if(r)return Object.fromEntries(t[0].map((k,j)=>[k,r[j]]));
  }
  return {};
}
export function baseProgression(record,level) {
  if(level===0)return {bab:0,fort:0,ref:0,will:0};
  const r=progressionRow(record,level),get=pattern=>{const key=Object.keys(r).find(k=>pattern.test(k));return key==null?null:parseInt(r[key]);};
  return {bab:get(/^BAB$|Base Attack/i),fort:get(/^Fort/i),ref:get(/^Ref/i),will:get(/^Will/i)};
}
function evaluateOne(p,c) {
  const text=String(p.text||p.description||p.name||'').trim(),kind=p.kind||p.type||'text';
  const score=k=>applyFeatAbilityIncrease(c,k,Number(c.abilities?.[k]||0)+Number(c.abilityBonuses?.[k]||0));
  if(kind==='level'&&Number.isInteger(p.minimum)&&p.minimum>0)return totalLevel(c)>=p.minimum;
  if(kind==='ability_choice') {
    const options=p.options?.from?.options,choose=p.options?.choose;
    if(Number.isInteger(choose)&&choose>0&&Array.isArray(options)&&options.length>=choose&&options.every(o=>scores[o.ability_score?.index]&&Number.isFinite(o.minimum_score)))
      return options.filter(o=>score(o.ability_score.index)>=o.minimum_score).length>=choose;
    return null;
  }
  if(p.ability_score?.index&&Number.isFinite(p.minimum_score))return score(p.ability_score.index)>=p.minimum_score;
  if(kind==='ability'&&scores[norm(p.ability)]&&Number.isFinite(p.minimum))return score(scores[norm(p.ability)])>=p.minimum;
  if((kind==='base_attack_bonus'||kind==='bab')&&/^\+?\s*\d+\.?$/.test(text))return Number(c.bab||0)>=parseInt(text.replace(/\s/g,''));
  if((kind==='skills'||kind==='skill')&&!/\bor\b/i.test(text)) {
    const parts=text.split(/\s*;\s*|,\s*(?![^()]*\))/),matches=parts.map(t=>t.match(/^([\w ()'-]+?)\s+(\d+)\s+ranks?\.?$/i));
    if(matches.every(Boolean))return matches.every(m=>Number(Object.entries(c.skillRanks||{}).find(([k])=>norm(k)===norm(m[1]))?.[1]||0)>=+m[2]);
  }
  if(['feat','feats'].includes(kind)&&!/\b(or|any|one|two|three|choose)\b/i.test(text)) {
    const names=text.replace(/\.$/,'').split(/\s*;\s*|,\s*(?![^()]*\))/);
    if(names.every(n=>/^[\w ()'-]+$/.test(n)))return names.every(n=>(c.feats||[]).some(f=>norm(f.name)===norm(n)));
  }
  if(kind==='race'&&/^[\w -]+\.?$/.test(text)&&!/\b(or|any|not|except)\b/i.test(text))return norm(c.race)===norm(text.replace(/\.$/,''));
  if(kind==='alignment') {
    const a=norm(c.alignment),t=norm(text.replace(/\.$/,''));
    if(!a)return null;
    if(/^(lawful|neutral|chaotic) (good|neutral|evil)$/.test(t))return a===t;
    if(/^any (lawful|chaotic|good|evil)$/.test(t))return a.includes(t.slice(4));
    if(/^any non[- ]?(lawful|chaotic|good|evil)$/.test(t))return !a.includes(t.replace(/^any non[- ]?/,''));
  }
  if(/base.*save|saving_throws/.test(kind)) {
    const m=text.match(/^(?:Base )?(Fortitude|Reflex|Will)(?: Save)?\s*\+(\d+)\.?$/i);
    if(m)return Number(c.save35?.[{fortitude:'fort',reflex:'ref',will:'will'}[m[1].toLowerCase()]]||0)>=+m[2];
  }
  if(kind==='caster_level'&&/^\d+$/.test(text)&&Number.isFinite(c.casterLevel))return c.casterLevel>=+text;
  const ability=text.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\s+(\d+)(?: or higher)?\.?$/i);
  if(ability)return score(scores[ability[1].toLowerCase()])>=+ability[2];
  // Compound casting, features, special conditions, alternatives and unrecognized text
  // stay visible and unresolved; a partial match must never imply qualification.
  return null;
}
export function requirements(record,c,confirmations={}, {multiclass=false}={}) {
  const prerequisites=record?.prerequisites;
  let source=Array.isArray(prerequisites)?[...prerequisites]:prerequisites&&typeof prerequisites==='object'
    ?prerequisites.kind||prerequisites.type||prerequisites.ability_score?[prerequisites]:Object.entries(prerequisites).map(([kind,value])=>kind==='minimum_level'
      ?{kind:'level',minimum:value,text:`Character level ${value} or higher`}
      :{kind,text:kind==='feature_named'?`Requires the ${value} feature`:JSON.stringify({[kind]:value})})
    :prerequisites?[{kind:'text',text:String(prerequisites)}]:[];
  if(record?.prerequisite_options)source.push({kind:'ability_choice',text:record.prerequisite_options.desc||'Review the prerequisite choices in the source.',options:record.prerequisite_options});
  source=source.filter(p=>multiclass||p.kind!=='multiclass');
  if(record?.minBab)source=[{kind:'base_attack_bonus',text:record.minBab,label:'Base attack bonus'},...source];
  if(multiclass&&record?.multi_classing) {
    const m=record.multi_classing;
    source=[...source,...(m.prerequisites||[])];
    if(m.prerequisite_options)source.push({kind:'ability_choice',text:m.prerequisite_options.desc||`Meet ${m.prerequisite_options.choose||1} of: ${(m.prerequisite_options.from?.options||[]).map(o=>`${o.ability_score?.name||'Ability'} ${o.minimum_score??'?'}`).join(', ')}`,options:m.prerequisite_options});
  }
  if(multiclass&&record?.multiclassRequirement&&!source.some(p=>p.kind==='multiclass'))source.push({kind:'multiclass',text:record.multiclassRequirement});
  if(multiclass&&normalizeEdition(record?.edition)!=='3.5'&&!source.length)source.push({kind:'text',text:'Multiclass entry and exit requirements are not structured. Verify the source requirements.'});
  if(prestige(record)&&!source.length)source.push({kind:'text',text:'Entry requirements are not structured. Verify every requirement in the source.'});
  return source.map(raw=>{
    const p=typeof raw==='string'?{kind:'text',text:raw}:raw;
    const text=p.text||p.description||p.name||(p.ability_score?`${p.ability_score.name} ${p.minimum_score}`:'Requirement needs source review');
    const id=`${contentKey(record)}:${p.kind||'structured'}:${text}`;
    let result=evaluateOne({...p,text},c);
    if(p.kind==='multiclass') {
      const names=[...text.matchAll(/Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma/gi)].map(x=>scores[x[0].toLowerCase()]);
      // Only the closed published ability-threshold sentence is automated.
      const residue=text.replace(/Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|scores?|of|13|or higher|and|or|an?|,/gi,'').trim();
      if(names.length&&/13/.test(text)&&!residue){const ok=names.map(k=>applyFeatAbilityIncrease(c,k,Number(c.abilities?.[k]||0)+Number(c.abilityBonuses?.[k]||0))>=13);result=/\bor\b/i.test(text.replace(/or higher/gi,''))?ok.some(Boolean):ok.every(Boolean);}
    }
    return {id,text,label:p.label||p.kind||'Prerequisite',status:result===true?'met':result===false?'unmet':confirmations[id]?'confirmed':'manual'};
  });
}
export const qualified=checks=>checks.every(x=>['met','confirmed'].includes(x.status));
export function eligibleClass(c,record,flow,confirmations={}) {
  const rows=characterClasses(c),edition=normalizeEdition(record.edition||c.ruleset),existing=rows.find(r=>r.catalogId===contentKey(record));
  const checks=[];
  if(c.ruleset!=='custom'&&edition!==normalizeEdition(c.ruleset))checks.push({id:'edition',text:'Choose a class from this character’s edition.',status:'unmet'});
  if(flow==='normal'&&prestige(record))checks.push({id:'prestige-flow',text:'Use Enter qualifying prestige class.',status:'unmet'});
  if(flow==='prestige'&&!prestige(record))checks.push({id:'normal-flow',text:'This is a normal class.',status:'unmet'});
  if(!existing) {
    checks.push(...requirements(record,c,confirmations,{multiclass:edition!=='3.5'}));
    if(edition!=='3.5')for(const r of rows.filter(r=>r.edition!=='3.5'))checks.push(...requirements(r.definition||{},c,confirmations,{multiclass:true}));
  }
  if(!Number.isFinite(Number(record.hit_die))||Number(record.hit_die)<=0)checks.push({id:'hit-die',text:'Record the class hit die from its source before advancing.',status:'manual'});
  const maximum=progressionTables(record).flatMap(t=>t.slice(1).map(r=>parseInt(r[0]))).filter(Number.isFinite);
  if(existing&&maximum.length&&existing.level>=Math.max(...maximum))checks.push({id:'class-cap',text:'This class has no further levels in its progression.',status:'unmet'});
  return {checks,allowed:qualified(checks)};
}
export function advanceClass(c,record,{flow='normal',confirmations={},hpGain=1,subclass,trainingChoices={}}={}) {
  if(totalLevel(c)>=20)throw Error('The supported character-level limit is 20.');
  const eligibility=eligibleClass(c,record,flow,confirmations);
  if(!eligibility.allowed)throw Error('Resolve all class prerequisites before leveling up.');
  const rows=characterClasses(c),key=contentKey(record),old=rows.find(r=>r.catalogId===key),nextLevel=(old?.level||0)+1;
  const row={...old,catalogId:key,name:record.name,edition:normalizeEdition(record.edition||c.ruleset),definition:structuredClone(record),level:nextLevel,subclass:subclass??old?.subclass??''};
  const classLevels=old?rows.map(r=>r.catalogId===key?row:r):[...rows,row];
  const gain=Math.trunc(Number(hpGain));if(!Number.isFinite(gain))throw Error('HP gain must be a finite number.');
  const max=Math.max(1,c.hp.max+gain);
  const next={...c,...applyMulticlassTraining(c,record,trainingChoices),classLevels,level:classLevels.reduce((n,r)=>n+r.level,0),hp:{...c.hp,max,current:Math.min(max,Math.max(0,c.hp.current+gain))},prerequisiteConfirmations:{...c.prerequisiteConfirmations,...confirmations}};
  // Preserve already assigned expenditure when gaining a die or a new class.
  // Ambiguous old multiclass totals remain for explicit review in the rest UI.
  if((c.ruleset==='custom'?c.mechanics:c.ruleset)!=='3.5'&&(rows.length===1||c.hitDiceUsedByClass))Object.assign(next,setSpentHitDice(c,{}));
  // Single-class Warlock saves previously tracked Pact Magic in slotsUsed.
  // Move, rather than replenish, that expenditure when a second class is added.
  if(rows.length===1&&classLevels.length===2&&rows[0].name==='Warlock'&&['2014','2024'].includes(c.ruleset||'2014')&&!Array.isArray(c.slotOverride)) {
    next.pactSlotsUsed={...c.slotsUsed,...c.pactSlotsUsed};next.slotsUsed={};
  }
  if(row.edition==='3.5'&&(c.ruleset==='3.5'||c.mechanics==='3.5')) {
    const before=baseProgression(record,old?.level||0),after=baseProgression(record,nextLevel);
    if([before.bab,after.bab].every(Number.isFinite))next.bab=Number(c.bab||0)+after.bab-before.bab;
    next.save35={...c.save35};for(const k of ['fort','ref','will'])if([before[k],after[k]].every(Number.isFinite))next.save35[k]=Number(c.save35?.[k]||0)+after[k]-before[k];
  }
  return next;
}
