import {legacyChoiceKey,legacyChoices,validLegacyChoices,domainSpell} from './legacyCastingChoices.js';

const preparedClasses=new Set(['Wizard','Cleric','Cloistered Cleric','Druid','Paladin','Ranger','Magewright']);
const norm=value=>String(value?.name||value||'').trim().toLowerCase();
export const usesLegacyPreparation=c=>(c.classDefinition?.edition||c.mechanics||c.ruleset)==='3.5'&&preparedClasses.has(c.className);
export const preparationKey=slot=>`${slot.pool}:${slot.level}:${slot.index}`;
const count=value=>Math.max(0,Math.min(30,Math.trunc(Number(value)||0)));

export function spontaneousConversion(c,spell){
 const name=norm(spell.name).replaceAll('’',"'");
 if(c.className==='Druid')return /^summon nature's ally (?:i|ii|iii|iv|v|vi|vii|viii|ix)$/.test(name);
 if(!['Cleric','Cloistered Cleric'].includes(c.className))return false;
 const kind=legacyChoices(c).spontaneous;
 if(!['cure','inflict'].includes(kind)||kind==='cure'&&/evil/i.test(c.alignment||'')||kind==='inflict'&&/good/i.test(c.alignment||''))return false;
 return new RegExp(`^(?:mass )?${kind} (?:minor|light|moderate|serious|critical) wounds(?:, mass)?$`).test(name);
}

function convertibleSlot(c,spell,slot,accessFor){
 const access=accessFor(spell),source=(c.spells||[]).find(s=>s.id===slot.spellId);
 return spontaneousConversion(c,spell)&&access.allowed&&Number.isInteger(access.level)&&access.level<=slot.level&&slot.pool==='standard'&&!slot.spent&&source&&source.id!==spell.id&&canPrepareInSlot(c,source,slot,accessFor(source));
}

export function preparationSlots(c,pools){
 if(!usesLegacyPreparation(c))return [];
 const specialist=c.className==='Wizard'&&legacyChoices(c).school&&validLegacyChoices(c);
 const totals={standard:pools.standard||[],domain:pools.restricted||[],specialist:specialist?(pools.standard||[]).map(n=>n>0?1:0):[]};
 return Object.entries(totals).flatMap(([pool,levels])=>levels.slice(0,10).flatMap((n,level)=>Array.from({length:count(n)},(_,index)=>({pool,level,index,key:`${pool}:${level}:${index}`}))));
}

export function preparationState(c,pools){
 const id=legacyChoiceKey(c),saved=c.legacyPreparation?.[id];
 return preparationSlots(c,pools).map(slot=>{
  const entry=saved?.slots?.[slot.key];
  // Old saves have aggregate expenditure only. Preserve that expenditure;
  // prepared=true never implies an unlimited number of prepared copies.
  const used=slot.pool==='standard'?(c.classSlotsUsed?.[id]??c.slotsUsed)?.[slot.level]:c.classRestrictedSlotsUsed?.[id]?.[slot.pool]?.[slot.level];
  return {...slot,spellId:typeof entry?.spellId==='string'?entry.spellId:'',spent:saved?entry?.spent===true:slot.index<count(used)};
 });
}

export function canPrepareInSlot(c,spell,slot,access){
 if(!spell?.id||spell.auto||spell.isManeuver||!access?.allowed)return false;
 let level=access.level;
 if(slot.pool==='domain')level=domainSpell(c,spell)?.level;
 if(slot.pool==='standard'&&access.domainOnly)return false;
 if(slot.pool==='specialist'&&!(validLegacyChoices(c)&&legacyChoices(c).school&&norm(spell.school).startsWith(norm(legacyChoices(c).school))))return false;
 return Number.isInteger(level)&&level>=0&&level<=slot.level;
}

function statePatch(c,slots){
 const id=legacyChoiceKey(c),standard={},restricted={domain:{},specialist:{}};
 for(const slot of slots)if(slot.spent){const used=slot.pool==='standard'?standard:restricted[slot.pool];used[slot.level]=(used[slot.level]||0)+1;}
 return {legacyPreparation:{...c.legacyPreparation,[id]:{slots:Object.fromEntries(slots.map(slot=>[slot.key,{spellId:slot.spellId,spent:slot.spent}]))}},
  classSlotsUsed:{...c.classSlotsUsed,[id]:standard},classRestrictedSlotsUsed:{...c.classRestrictedSlotsUsed,[id]:restricted}};
}

export function prepareLegacySpells(c,pools,choices,spells,accessFor,{daily=false}={}){
 if(!usesLegacyPreparation(c))throw Error('This class does not prepare individual spell slots.');
 const saved=preparationState(c,pools),known=new Map(spells.map(s=>[s.id,s]));
 const slots=saved.map(slot=>{
  const value=choices[slot.key]??(slot.spent?'spent':slot.spellId),spellId=value==='spent'?'':value;
  if(!daily&&(slot.spent||slot.spellId)&&value!==(slot.spent?'spent':slot.spellId))throw Error('Only open, unused slots can be filled outside daily preparation.');
  if(value==='spent')return {...slot,spellId:'',spent:true};
  if(spellId&&!canPrepareInSlot(c,known.get(spellId),slot,accessFor(known.get(spellId)||{})))throw Error('Choose an eligible spell for each preparation slot.');
  return {...slot,spellId,spent:false};
 });
 return statePatch(c,slots);
}

export function preparedCastOptions(c,spell,pools,accessFor){
 const groups=new Map();
 for(const slot of preparationState(c,pools)){
  const direct=!slot.spent&&slot.spellId===spell.id&&canPrepareInSlot(c,spell,slot,accessFor(spell)),conversion=!direct&&convertibleSlot(c,spell,slot,accessFor);
  if(!direct&&!conversion)continue;
  const pool=conversion?`conversion-${slot.index}`:slot.pool,key=`${pool}:${slot.level}`,option=groups.get(key)||{pool,level:slot.level,remaining:0,...(conversion?{sourceName:(c.spells||[]).find(s=>s.id===slot.spellId)?.name,sourceIndex:slot.index+1}:{})};
  option.remaining++;groups.set(key,option);
 }
 return [...groups.values()];
}

export function spendPreparedSpell(c,spell,pools,option,accessFor){
 const slots=preparationState(c,pools),chosen=slots.find(slot=>slot.level===option.level&&(option.pool===`conversion-${slot.index}`?convertibleSlot(c,spell,slot,accessFor):slot.pool===option.pool&&!slot.spent&&slot.spellId===spell.id&&canPrepareInSlot(c,spell,slot,accessFor(spell))));
 if(!chosen)throw Error('No eligible prepared copy remains in that slot.');
 return statePatch(c,slots.map(slot=>slot.key===chosen.key?{...slot,spent:true}:slot));
}
