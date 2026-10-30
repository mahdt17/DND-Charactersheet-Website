import {characterClasses} from './advancement.js';
import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {rageProfile} from './rage2014.js';

// Shared source-owned states live in activeEffects, using the existing game-time,
// concentration and rest lifecycle. These helpers never start a state implicitly.
const edition=c=>(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
const names=c=>(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(n=>String(n?.name||n).trim().toLowerCase());
export function sourceSubclassEffects(c,{recordId,ownerId,featureId,stateKey}={}){
 if(edition(c)!=='2014')return [];
 return (c.activeEffects||[]).filter(e=>e.subclassRecordId&&(!recordId||e.subclassRecordId===recordId)&&(!ownerId||e.sourceClassId===ownerId)&&(!featureId||e.sourceFeatureId===featureId)&&(!stateKey||e.stateKey===stateKey)&&(e.remainingSeconds==null||e.remainingSeconds>0)&&(!e.concentration||e.concentration===c.concentration)&&characterClasses(c).some(row=>{
  const record=row.edition==='2014'&&!row.definition?.homebrew&&findExpandedSubclass(row.name,row.subclass);
  return record&&record.id===e.subclassRecordId&&row.catalogId===e.sourceClassId&&record.features.some(f=>f.id===e.sourceFeatureId&&f.level<=row.level);
 }));
}
export function consciousAtZero(c){
 return sourceSubclassEffects(c).some(e=>e.subclassRecordId==='2014:subclass:barbarian:zealot'&&e.sourceFeatureId==='2014:subclass:barbarian:zealot:rage-beyond-death'&&e.stateKey==='rage-beyond-death'||e.subclassRecordId==='2014:subclass:fighter:samurai'&&e.sourceFeatureId==='2014:subclass:fighter:samurai:strength-before-death'&&e.stateKey==='strength-before-death');
}
export function actorActionBlock(c){
 if(edition(c)!=='2014')return '';
 const zealot=sourceSubclassEffects(c,{recordId:'2014:subclass:barbarian:zealot',featureId:'2014:subclass:barbarian:zealot:rage-beyond-death',stateKey:'rage-beyond-death'}).length>0;
 if(Number(c.hp?.current??1)<=0&&Number(c.deathSaves?.failure)>=3&&!zealot||Number(c.exhaustion)>=6||names(c).includes('dead')||c.dead||c.instantDeath)return 'A dead character must be revived before acting.';
 if(names(c).some(n=>['incapacitated','unconscious','stunned','paralyzed','petrified'].includes(n)))return 'You cannot act while incapacitated.';
 return Number(c.hp?.current??1)<=0&&!consciousAtZero(c)?'You must be conscious to use this ability.':'';
}
export function finishSubclassEffects(c,effects){
 const was=(c.activeEffects||[]).some(e=>e.stateKey==='rage-beyond-death');
 const samuraiDeath=(c.activeEffects||[]).some(e=>e.stateKey==='strength-before-death')&&Number(c.hp?.current)<=0&&Number(c.deathSaves?.failure)>=3;
 const postponedDeath=was&&!effects.some(e=>e.stateKey==='rage-beyond-death'&&(e.remainingSeconds==null||e.remainingSeconds>0))&&Number(c.hp?.current)<=0&&Number(c.deathSaves?.failure)>=3;
 return {activeEffects:effects,...((c.activeEffects||[]).some(e=>e.stateKey==='rage')&&!effects.some(e=>e.stateKey==='rage')?{totemWarrior:{...c.totemWarrior,activeRage:false}}:{}),...(postponedDeath||samuraiDeath?{dead:true}:{})};
}
export function reconcileSubclassStates(c){
 const valid=new Set(sourceSubclassEffects(c));
 const rage=rageProfile(c),unconscious=names(c).includes('unconscious')||Number(c.hp?.current)<=0&&!consciousAtZero(c);
 const effects=(c.activeEffects||[]).filter(e=>(!e.subclassRecordId||valid.has(e))&&!(e.endsOnIncapacitated&&actorActionBlock(c))&&!(e.requiresTempSource&&(c.hp?.tempSource!==e.requiresTempSource||!(c.hp.temp>0)))&&!(e.baseClassId&&(!rage.level||unconscious)));
 const hasRage=effects.some(e=>e.stateKey==='rage'&&(e.remainingSeconds==null||e.remainingSeconds>0));
 const live=new Set(effects.map(e=>e.id));
 const owners=characterClasses(c).flatMap(row=>{const record=row.edition==='2014'&&!row.definition?.homebrew&&findExpandedSubclass(row.name,row.subclass);return record?[{owner:row.catalogId,record:record.id}]:[];});
 const owned={};for(const key of ['subclassQuantities','subclassPortent','subclassEquipment','subclassPsionic'])if(c[key])owned[key]=Object.fromEntries(Object.entries(c[key]).flatMap(([owner,records])=>{const keep=Object.fromEntries(Object.entries(records).filter(([record])=>owners.some(p=>p.owner===owner&&p.record===record)));return Object.keys(keep).length?[[owner,keep]]:[];}));

 return {...c,...owned,spells:(c.spells||[]).filter(s=>!s.temporarySubclassSpell||live.has(s.sourceEffectId)),...finishSubclassEffects(c,effects.filter(e=>!['rage-beyond-death','beast-weapon','storm-aura'].includes(e.stateKey)||hasRage||!c.activeEffects.some(e=>e.stateKey==='rage')))};
}
