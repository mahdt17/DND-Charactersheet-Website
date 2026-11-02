import {ravenKillerAdvantage} from './subclassSentinelRaven.js';
import {loreholdOwnerHPBonus,loreholdSageAura,loreholdSageLessons} from './subclassLorehold.js';
import {retainsOwnFeatures} from './subclassState.js';
import {artificialMind,artificialMindSkillBonus} from './subclassArtificialMind.js';
import {activeFormProfile} from './subclassActive.js';
import {armorModelProfile} from './subclassEquipment.js';
import {expandedSubclassRows,expandedSubclassContext,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {subclassValue} from './subclassFormulas.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {bladesongProfile} from './bladesinging.js';
import {actorActionBlock,sourceSubclassEffects} from './subclassState.js';
import {characterClasses} from './advancement.js';
import {subclassHitPointBonus} from './subclassHitPoints.js';
import {quantityProfile} from './subclassQuantities.js';
import equipment from '../data/equipment.json' with {type:'json'};

const id=(cls,sub)=>`2014:subclass:${cls}:${sub}`;
export function subclassNumericProfile(c,abilities=effectiveAbilityScores(c)){
 const result={acBases:[],acBonus:0,hpBonus:0,speedBonus:0,initiativeBonus:0,initiativeAdvantage:false,saveBonus:0,saveBonuses:{},skillBonuses:{},abilityCheckBonuses:{},skillAdvantages:[],saveAdvantages:[],concentrationBonus:0,meleeWeaponDamageBonus:0,attacks:1,criticalThreshold:20,rows:[]};
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c))return result;
 result.hpBonus=subclassHitPointBonus(c,characterClasses(c))+loreholdOwnerHPBonus(c);
 const worn=(c.inventory||[]).filter(i=>i.equipped).map(i=>({...equipment.find(e=>e.index===i.equipmentIndex),...i}));
 const shield=worn.some(e=>e.index==='shield'||e.equipmentIndex==='shield'||e.shield),heavy=worn.some(e=>e.armor_category==='Heavy');
 const armored=worn.some(e=>e.armor_class&&e.index!=='shield'),blocked=actorActionBlock(c),song=bladesongProfile(c,abilities);
 // Base Extra Attack counts share the maximum; multiclass counts never sum.
 for(const row of characterClasses(c))if(row.edition==='2014'&&!row.definition?.homebrew){if(row.name==='Fighter'&&row.level>=5)result.attacks=Math.max(result.attacks,row.level>=20?4:row.level>=11?3:2);else if(['Barbarian','Monk','Paladin','Ranger'].includes(row.name)&&row.level>=5)result.attacks=Math.max(result.attacks,2);}
 for(const p of expandedSubclassRows(c)){
  const context={...expandedSubclassContext(c,p.row),...Object.fromEntries(Object.entries(abilities).map(([k,v])=>[k,Math.floor((Number(v)-10)/2)]))};
  for(const passive of p.mechanics?.passives||[]){
   if(!expandedFeatureUnlocked(p,passive))continue;
   const source={...passive,sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceBook:p.record.sourceBook,sourceUrl:p.record.sourceUrl,status:'reference',applied:false};
   const record=p.record.id,condition=passive.condition||'',kind=passive.kind;
   const state=sourceSubclassEffects(c,{recordId:record,ownerId:p.row.catalogId,featureId:passive.featureId});
   const value=()=>subclassValue(passive.value,context);
   const apply=(field,amount)=>{result[field]+=amount;source.status='automated';source.applied=true;source.computedValue=amount;};
   // Every prose condition is closed by default. Only exact source-reviewed
   // cases below can open it; merely possessing a feature is never activation.
   if(['initiative','initiative-bonus'].includes(kind)&&(!condition||['paladin:watchers','paladin:watchers-ua'].map(x=>'2014:subclass:'+x).includes(record)&&!blocked))apply('initiativeBonus',value());
   else if(kind==='initiative-ability'&&record===id('wizard','lore-mastery-ua'))apply('initiativeBonus',Math.max(0,context.int-context.dex));
   else if(kind==='initiative-advantage'&&!condition){result.initiativeAdvantage=true;source.status='automated';source.applied=true;}
   else if(kind==='armor-class-bonus'&&record===id('cleric','forge')){source.status='automated';if(heavy)apply('acBonus',value());}
   else if(kind==='base-armor-class'&&record===id('paladin','redemption-ua')){source.status='automated';if(!armored&&!shield){result.acBases.push(value());source.applied=true;source.computedValue=value();}}
   else if(['persuasion-check-bonus','charisma-check-bonus'].includes(kind)&&!condition){const skills=kind==='persuasion-check-bonus'?['Persuasion']:['Deception','Intimidation','Performance','Persuasion'];for(const skill of skills)result.skillBonuses[skill]=(result.skillBonuses[skill]||0)+value();if(kind==='charisma-check-bonus')result.abilityCheckBonuses.cha=(result.abilityCheckBonuses.cha||0)+value();source.status='automated';source.applied=true;source.computedValue=value();}
   else if(kind==='physical-ability-check-bonus'&&record===id('fighter','champion')){for(const key of ['str','dex','con'])result.abilityCheckBonuses[key]=(result.abilityCheckBonuses[key]||0)+value();for(const skill of ['Athletics','Acrobatics','Sleight of Hand','Stealth'])if(!c.skillProf?.[skill]&&!c.expertise?.[skill])result.skillBonuses[skill]=(result.skillBonuses[skill]||0)+value();source.status='automated';source.applied=true;source.computedValue=value();}
   else if(kind==='hp-max-bonus'&&!condition&&(!p.record.flexibleFeatureSelection||Number(passive.level||1)<=p.record.entryLevel)){source.status='automated';source.applied=true;source.computedValue=value();}
   else if(kind==='ac'&&(['sorcerer:draconic-bloodline','sorcerer:aberrant-mind-ua'].map(x=>'2014:subclass:'+x).includes(record)||record===id('sorcerer','stone-sorcery-ua'))){
    source.status='automated';if(!armored&&(record!==id('sorcerer','stone-sorcery-ua')||!blocked&&state.some(e=>e.stateKey==='stone-skin'))){result.acBases.push(value());source.applied=true;source.computedValue=value();}
   }
   else if(['ac-bonus','armor-class-bonus','save-bonus'].includes(kind)&&record===id('wizard','war-magic')&&passive.feature==='Durable Magic'){source.status='automated';if(c.concentration)apply(kind==='save-bonus'?'saveBonus':'acBonus',value());}
   else if(['speed-bonus','walking-speed-bonus'].includes(kind)&&(record===id('rogue','scout')||record===id('paladin','glory')||!condition))apply('speedBonus',value());
   else if(kind==='speed-bonus'&&record===id('ranger','gloom-stalker')){source.status='automated';if(state.some(e=>e.stateKey==='dread-ambusher-first-turn'))apply('speedBonus',value());}
   else if(kind==='attack-count'&&['Attack action','Attack action on own turn','Attack action; may replace one attack with a cantrip'].includes(condition)){result.attacks=Math.max(result.attacks,value());source.status='automated';source.applied=true;source.computedValue=value();}
   else if(kind==='critical-range'&&record===id('fighter','champion')){result.criticalThreshold=Math.min(result.criticalThreshold,value());source.status='automated';source.applied=true;source.computedValue=value();}
   else if(record===id('wizard','bladesinging')){
    const field={'ac-bonus':'acBonus','speed-bonus':'speedBonus','concentration-save-bonus':'concentrationBonus','melee-weapon-damage-bonus':'meleeWeaponDamageBonus'}[kind];
    if(field){source.status='automated';if(song.singing)apply(field,song[field]);}
    else if(kind==='skill-advantage'){source.status='automated';source.applied=song.singing;if(song.singing)result.skillAdvantages.push('Acrobatics');}
   }
   // Training and style adapters already own these effects; don't duplicate them.
   if(['expertise'].includes(kind))source.status='training';
   if(record===id('bard','swords')&&['dueling-damage-bonus','offhand-ability-damage'].includes(kind))source.status='attack-context';
   result.rows.push(source);
  }
 }
 const active=activeFormProfile(c),armorModel=armorModelProfile(c);
 for(const e of sourceSubclassEffects(c))if(['elixir-swiftness','spirit-traveler'].includes(e.stateKey))result.speedBonus+=10;
 if(armorModel?.model==='Infiltrator')result.speedBonus+=5;
 if(active.frostBonus){result.saveBonuses.str=2;result.saveBonuses.con=2;result.abilityCheckBonuses.str=(result.abilityCheckBonuses.str||0)+2;result.abilityCheckBonuses.con=(result.abilityCheckBonuses.con||0)+2;result.skillBonuses.Athletics=(result.skillBonuses.Athletics||0)+2;}
 if(sourceSubclassEffects(c,{stateKey:'awaken-astral'}).length)result.acBonus+=2;
 if(sourceSubclassEffects(c).some(e=>['astral-arms','awaken-astral'].includes(e.stateKey))){const amount=Math.max(0,Math.floor((abilities.wis-10)/2)-Math.floor((abilities.str-10)/2));result.saveBonuses.str=(result.saveBonuses.str||0)+amount;result.abilityCheckBonuses.str=(result.abilityCheckBonuses.str||0)+amount;result.skillBonuses.Athletics=(result.skillBonuses.Athletics||0)+amount;}
 if(quantityProfile(c,'soul-trinkets')?.current>0)result.saveAdvantages.push('con','death');
 if(result.abilityCheckBonuses.dex&&!result.rows.some(r=>r.applied&&r.kind==='initiative-bonus'&&r.value==='pb')){const lore=result.rows.find(r=>r.applied&&r.kind==='initiative-ability');result.initiativeBonus+=Math.max(0,result.abilityCheckBonuses.dex-(lore?.computedValue||0));}
 if(loreholdSageLessons(c))result.skillAdvantages.push('Arcana','History','Nature','Religion');
 const aura=loreholdSageAura(c);if(aura){for(const key of ['int','wis'])result.abilityCheckBonuses[key]=(result.abilityCheckBonuses[key]||0)+aura;for(const name of ['Arcana','History','Investigation','Nature','Religion','Animal Handling','Insight','Medicine','Perception','Survival'])result.skillBonuses[name]=(result.skillBonuses[name]||0)+aura;}
 for(const name of artificialMind(c)?.skills||[]){const bonus=artificialMindSkillBonus(c,name);if(bonus)result.skillBonuses[name]=(result.skillBonuses[name]||0)+bonus;}
 return result;
}

export function subclassRollTraits(c,{kind='check',name='',concentration=false}={}){
 const p=subclassNumericProfile(c);
 name=name.replace(/ check$/i,'');
 const active=activeFormProfile(c),strength=/^(Strength|Athletics)\b/i.test(name),con=/^Constitution\b/i.test(name),dragon=active.star==='Dragon'&&(kind==='save'&&(concentration||/concentration/i.test(name))||kind==='check'&&['Intelligence','Wisdom','Arcana','History','Investigation','Nature','Religion','Animal Handling','Insight','Medicine','Perception','Survival'].includes(name));
 return {bonusDice:['attack','save'].includes(kind)&&active.states.some(e=>e.stateKey==='elixir-boldness')?['1d4']:[],minimumD20:dragon?10:0,bonus:kind==='save'?p.saveBonus+(concentration?p.concentrationBonus:0)+(strength?p.saveBonuses.str||0:con?p.saveBonuses.con||0:0):p.skillBonuses[name]||0,advantage:kind==='attack'&&ravenKillerAdvantage(c)||strength&&active.strengthAdvantage||kind==='save'&&(con&&p.saveAdvantages.includes('con')||/^Death\b/i.test(name)&&p.saveAdvantages.includes('death'))||kind==='check'&&(name==='Initiative'?p.initiativeAdvantage:p.skillAdvantages.includes(name)),sources:p.rows.filter(r=>r.applied)};
}

// Explicit, narrowly scoped states. Other source prose remains table-resolved.
const numericToggles=[
 {recordId:id('sorcerer','stone-sorcery-ua'),feature:'stones-durability',stateKey:'stone-skin',label:"Stone’s Durability: stone skin active",duration:'Action to activate; ends when dismissed or incapacitated'},
 {recordId:id('ranger','gloom-stalker'),feature:'dread-ambusher',stateKey:'dread-ambusher-first-turn',label:'Dread Ambusher: this is my first combat turn',duration:'Until next turn; at most 1 round',remainingSeconds:6,expires:'start-next-turn'},
];
export function subclassNumericToggles(c){if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014')return [];return numericToggles.flatMap(t=>expandedSubclassRows(c).filter(p=>p.record.id===t.recordId&&expandedFeatureUnlocked(p,{featureId:`${t.recordId}:${t.feature}`,level:p.record.features.find(f=>f.id===`${t.recordId}:${t.feature}`)?.level??99})).map(p=>({...t,subclassRecordId:t.recordId,sourceClassId:p.row.catalogId,sourceFeatureId:`${t.recordId}:${t.feature}`,active:sourceSubclassEffects(c,{recordId:t.recordId,ownerId:p.row.catalogId,stateKey:t.stateKey}).length>0})));}
export function setSubclassNumericToggle(c,key,active){
 const t=subclassNumericToggles(c).find(t=>t.stateKey===key);if(!t)throw Error('This feature is not available.');if(active&&actorActionBlock(c))throw Error(actorActionBlock(c));
 const effects=(c.activeEffects||[]).filter(e=>!(e.subclassRecordId===t.recordId&&e.sourceClassId===t.sourceClassId&&e.stateKey===key));
 return {activeEffects:active?[...effects,{id:`subclass:${t.sourceClassId}:${key}`,name:t.label,subclassRecordId:t.recordId,sourceClassId:t.sourceClassId,sourceFeatureId:t.sourceFeatureId,stateKey:key,endsOnIncapacitated:true,...(t.remainingSeconds?{remainingSeconds:t.remainingSeconds,expires:t.expires}:{})}]:effects};
}
