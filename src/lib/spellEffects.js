import {healHP} from './subclassActionUtils.js';
import equipment from '../data/equipment.json' with {type:'json'};
import {blessedHealerPatch} from './subclassHealing.js';
import {quantityTurn} from './subclassQuantities.js';
import {wardCastPatch} from './subclassQuantities.js';
import {finishSubclassEffects,sourceSubclassEffects} from './subclassState.js';
const legacy=c=>c?.ruleset==='3.5'||c?.mechanics==='3.5';
const armored=c=>(c.inventory||[]).some(i=>i.equipped&&equipment.some(e=>e.index===i.equipmentIndex&&e.armor_class&&e.index!=='shield'));
const spellName=s=>String(s?.name||'').trim().toLowerCase();
const delayedHealing=new Set(['aura of vitality','goodberry','vampiric touch','healing spirit','enervation']);
const otherHpEffects=new Set(['false life','aid']);
export const temporaryHpSpell=s=>spellName(s)==='false life';
const recipientBuffs=new Set(['mage armor','shield of faith','haste','barkskin','warding bond']);
export function healingSpell(s,plan){return !delayedHealing.has(spellName(s))&&!otherHpEffects.has(spellName(s))&&(!!s?.heal_at_slot_level||!!plan?.rolls?.some(r=>/healing/i.test(r.label)));}
export function needsEffectRecipient(s,plan){return recipientBuffs.has(spellName(s))||healingSpell(s,plan);}
export function activeEffects(c){
 if(legacy(c))return [];
 return (c.activeEffects||[]).filter(e=>(e.remainingSeconds==null||e.remainingSeconds>0)&&(!e.concentration||e.concentration===c.concentration));
}
export function effectArmor(c,abilities,{armored=false,shield=false}={}){
 const effects=activeEffects(c).filter(e=>(!e.requiresUnarmored||!armored)&&(!e.forbidsShield||!shield));
 return {bonus:effects.reduce((n,e)=>n+(Number(e.acBonus)||0),0),minimum:Math.max(0,...effects.map(e=>Number(e.minimumAC)||0)),bases:effects.filter(e=>e.baseAC).map(e=>Number(e.baseAC.base)+(e.baseAC.ability?Math.floor(((Number(abilities[e.baseAC.ability])||10)-10)/2):0))};
}
export function reconcileEffects(c,previous=c){
 return legacy(c)?{}:{activeEffects:activeEffects(c).filter(e=>!(e.key==='mage armor'&&armored(c)&&!armored(previous)))};
}
export function castEffectPatch(c,spell,{recipient,rolls=[],plan,slotLevel=spell.level,maxHP=c.hp?.max}={}){
 if(legacy(c)||spell?.edition==='3.5')return {};
 if(needsEffectRecipient(spell,plan)&&!['self','other'].includes(recipient))throw Error('Choose a spell recipient: Self or another creature.');
 if(/^self(?:$|\s|\()/i.test(spell.range||'')&&recipient==='other')throw Error('This spell has a Self range and affects the caster.');
 if(spellName(spell)==='warding bond'&&recipient==='self')throw Error('Warding Bond requires another creature as its recipient.');
 if(spellName(spell)==='mage armor'&&recipient==='self'&&armored(c))throw Error('Remove worn armor before casting Mage Armor on yourself.');
 let effects=activeEffects(c).filter(e=>!e.breaksOnAttackOrCast&&!(e.stateKey==='wild-surge-max-damage'&&plan?.rolls?.some(r=>/damage/i.test(r.label)))&&!(e.stateKey==='wild-surge-save-disadvantage'&&plan?.save)),patch={};
 if(spell.concentration){effects=effects.filter(e=>!e.concentration);patch.concentration=spell.name;}
 if(temporaryHpSpell(spell)){
  const result=rolls.find(r=>/^temporary HP$/i.test(r.label));
  if(!result||!Number.isFinite(result.total)||result.total<0)throw Error('A valid temporary HP roll result is required before spending a slot.');
  patch.hp={...c.hp,temp:Math.max(Number(c.hp.temp)||0,result.total),...(result.total>Number(c.hp.temp||0)?{tempSource:null}:{})};
 }
 if(healingSpell(spell,plan)){
  const healing=rolls.filter(r=>/healing/i.test(r.label));
  if(!healing.length||healing.some(r=>!Number.isFinite(r.total)||r.total<0))throw Error('A valid healing roll result is required before spending a slot.');
  if(recipient==='self'){
   const amount=healing.reduce((n,r)=>n+r.total,0);
   Object.assign(patch,healHP(c,amount,Number(maxHP)));
  }
 }
 const name=spellName(spell);
 let effect=null;
 if(name==='shield')effect={key:name,name:spell.name,acBonus:5,expires:'start-next-turn',remainingSeconds:6};
 if(name==='mage armor'&&recipient==='self')effect={key:name,name:spell.name,baseAC:{base:13,ability:'dex'},requiresUnarmored:true,remainingSeconds:8*60*60};
 if(name==='shield of faith'&&recipient==='self')effect={key:name,name:spell.name,acBonus:2,remainingSeconds:600};
 if(name==='haste'&&recipient==='self')effect={key:name,name:spell.name,acBonus:2,remainingSeconds:60};
 if(name==='barkskin'&&recipient==='self')effect={key:name,name:spell.name,minimumAC:(spell.edition||c.mechanics||c.ruleset)==='2024'?17:16,remainingSeconds:3600};
 if(effect){effect={...effect,id:`spell:${name.replaceAll(' ','-')}`,...(spell.concentration?{concentration:spell.name}:{})};effects=[...effects.filter(e=>e.key!==effect.key),effect];}
 if(effect||spell.concentration||effects.length!==activeEffects(c).length)patch.activeEffects=effects;
 return {...wardCastPatch(c,spell,slotLevel),...patch,...blessedHealerPatch({...c,...patch},spell,{recipient,slotLevel,maxHP})};
}
// Durations follow elapsed game time, never the device clock. A turn boundary
// is explicit because the encounter tracker keeps independent combatants.
export function advanceEffectTime(c,{seconds=0,startTurn=false,endTurn=false,maxHP}={}){
 if(legacy(c))return {};
 if(!Number.isFinite(seconds)||seconds<0)throw Error('Elapsed game time must be nonnegative.');
 const before=activeEffects(c),healing=startTurn?before.reduce((n,e)=>n+(e.healAtTurnStart||0),0):0;
 if(healing&&!Number.isFinite(maxHP))throw Error('Supply the effective HP maximum for turn healing.');
 const after=before.filter(e=>!(startTurn&&e.expires==='start-next-turn')&&!(endTurn&&e.expires==='end-turn')).map(e=>startTurn&&e.expires==='end-next-turn'?{...e,expires:'end-turn'}:e).map(e=>startTurn&&e.stateKey==='lorehold-history-whims'?{...e,previousChoice:e.choice||e.previousChoice,choice:null}:e).map(e=>e.remainingSeconds==null?e:{...e,remainingSeconds:e.remainingSeconds-seconds}).filter(e=>e.remainingSeconds==null||e.remainingSeconds>0);
 const healed=healing?healHP(c,healing,maxHP):{};return {...healed,...(startTurn?{...quantityTurn(c),subclassTurnUsed:[]}:{}),...finishSubclassEffects({...c,...healed},after),...(before.some(e=>e.concentration===c.concentration)&&!after.some(e=>e.concentration===c.concentration)?{concentration:null}:{})};
}
// Also protects source states loaded from saves written before canEnd metadata.
export function canEndEffect(c,e){
 if(e.canEnd===false)return false;
 if(!sourceSubclassEffects(c).includes(e))return true;
 if(e.subclassRecordId==='2014:subclass:warlock:raven-queen-ua'&&e.stateKey==='sentinel-raven')return false;
 if(e.subclassRecordId==='2014:subclass:wizard:war-magic'&&e.stateKey==='arcane-deflection')return false;
 if(e.subclassRecordId==='2014:subclass:sorcerer:wild-magic'&&(e.stateKey?.startsWith('wild-surge:')||['wild-surge-max-damage','wild-surge-save-disadvantage'].includes(e.stateKey)))return false;
 return e.stateKey!=='rage-wild-surge';
}
export function endEffect(c,id){
 if(legacy(c))return {};
 const effect=activeEffects(c).find(e=>e.id===id);if(effect&&!canEndEffect(c,effect))throw Error('This source state cannot be ended manually; advance the clock or finish its source rest.');const concentration=effect?.concentration?null:c.concentration;
 const removed=effect?.stateKey==='rage'?['rage','rage-beyond-death','beast-weapon','storm-aura','rage-wild-surge']:[];
 return {concentration,...finishSubclassEffects(c,(c.activeEffects||[]).filter(e=>e.id!==id&&!removed.includes(e.stateKey))),...(effect?.stateKey==='rage'?{totemWarrior:{...c.totemWarrior,activeRage:false}}:{})};
}
export function restEffectPatch(c,kind){
 if(legacy(c))return {};
 const concentration=kind==='long'?null:c.concentration;
 const timed=advanceEffectTime({...c,concentration,activeEffects:kind==='short'?(c.activeEffects||[]).filter(e=>!e.endsOnRest):c.activeEffects},{seconds:kind==='long'?28800:3600});
 return {concentration,...timed,...(kind==='long'?{activeEffects:timed.activeEffects.filter(e=>!e.endsOnLongRest&&!e.endsOnRest),subclassSessionUsed:{}}:{})};
}
