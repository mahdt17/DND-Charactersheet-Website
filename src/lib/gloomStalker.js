import races from '../data/races.json' with {type:'json'};
import subraces from '../data/subraces.json' with {type:'json'};
import traits from '../data/traits.json' with {type:'json'};
import {sourceFeature,assertAct,featureState,putState} from './subclassActionUtils.js';
import {retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
import {weaponAttacks} from './rules.js';
import {effectiveAbilityScores} from './abilityScores.js';

const record='2014:subclass:ranger:gloom-stalker';
function racialDarkvision(c){
 const override=c.gloomStalker?.racialDarkvision;if(Number.isInteger(override)&&override>=0&&override<=1000)return override;
 const known=(definition,name,catalog)=>({...(!definition?.homebrew&&definition?.source!=='Homebrew'?catalog.find(r=>r.name===name||r.index===definition?.index):{}),...definition});
 const race=known(c.raceDefinition,c.race,races),sub=known(c.subraceDefinition,c.subrace,subraces);
 return Math.max(0,...[...(race?.traits||[]),...(sub?.racial_traits||sub?.traits||[]),...(c.traits||[]).filter(t=>t.raceGrantId)].filter(t=>/darkvision/i.test(t.name||'')).map(t=>{const full=t.description||t.desc?.join(' ')||traits.find(r=>r.index===t.index)?.desc?.join(' ')||'';return Number(full.match(/(\d+)\s*(?:feet|ft)/i)?.[1]||0);}));
}
export function gloomStalkerProfile(c){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c))return null;let p;try{p=sourceFeature(c,['ranger:gloom-stalker'],'dread-ambusher');}catch{return null;}
 const effects=sourceSubclassEffects(c,{recordId:record,ownerId:p.row.catalogId}),first=effects.find(e=>e.stateKey==='dread-ambusher-first-turn'),vision=racialDarkvision(c);
 return {...p,level:p.row.level,first,ambushAvailable:!!first?.attackActionReady,flurryUsed:effects.some(e=>e.stateKey==='gloom-flurry-used'),reactionUsed:effects.some(e=>e.stateKey==='gloom-dodge-used'),racialDarkvision:vision,darkvision:vision?vision+30:60};
}
const requireProfile=c=>{assertAct(c);const p=gloomStalkerProfile(c);if(!p)throw Error('Gloom Stalker is not available.');return p;};
export function beginDreadAttackAction(c,{confirmed=false}={}){
 const p=requireProfile(c);if(!p.first)throw Error('This must be your first turn of this combat.');if(!confirmed)throw Error('Confirm you are beginning a new Attack action on your first combat turn.');
 return {activeEffects:(c.activeEffects||[]).map(e=>e.id===p.first.id?{...e,attackActionReady:true,expires:'end-turn'}:e)};
}
export function gloomAttackPlan(c,weaponId,kind,{confirmed=false}={}){
 const p=requireProfile(c);if(!['dread','flurry'].includes(kind)||kind==='flurry'&&p.level<11)throw Error('This Gloom Stalker attack is not available.');
 if(!confirmed)throw Error(kind==='flurry'?'Confirm it is your turn and you missed with a weapon attack.':'Confirm this is the extra attack of your current Attack action.');
 const weapon=weaponAttacks(c,effectiveAbilityScores(c)).find(w=>w.id===weaponId);if(!weapon)throw Error('Choose an available weapon attack.');
 if(kind==='dread'){
  if(!p.first?.attackActionReady)throw Error('Begin an Attack action on your first turn; its extra attack may already be used.');
  // Separate visible dice preserve the weapon's own Great Weapon Fighting rerolls.
  return {weapon:{...weapon,name:`${weapon.name} · Dread Ambusher`,extraWeaponDice:'1d8'},patch:{activeEffects:(c.activeEffects||[]).map(e=>e.id===p.first.id?{...e,attackActionReady:false}:e)}};
 }
 if(p.flurryUsed)throw Error("Stalker's Flurry was already used this turn.");
 const owner=sourceFeature(c,['ranger:gloom-stalker'],'stalkers-flurry');
 return {weapon:{...weapon,name:`${weapon.name} · Stalker's Flurry`},patch:putState(c,featureState(c,owner,'gloom-flurry-used',{canEnd:false,expires:'start-next-turn'}))};
}
export function useShadowyDodge(c,{confirmed=false}={}){
 const p=requireProfile(c);if(p.level<15)throw Error('Shadowy Dodge is not available.');if(!confirmed)throw Error('Confirm an attack against you without advantage, its outcome not yet known, and your reaction available.');if(p.reactionUsed)throw Error('Your Shadowy Dodge reaction was already used before your next turn.');
 const owner=sourceFeature(c,['ranger:gloom-stalker'],'shadowy-dodge');return {...putState(c,featureState(c,owner,'gloom-dodge-used',{canEnd:false,expires:'start-next-turn'})),subclassLastResult:{feature:'Shadowy Dodge',instructions:'Reaction used: the triggering attack against you has disadvantage. Resolve that attack at the table; this affects only that attack.'}};
}
