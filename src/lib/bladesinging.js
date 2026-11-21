import {actorActionBlock,equippedForActiveBody} from './subclassState.js';
import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {characterClasses,totalLevel} from './advancement.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {activeEffects} from './spellEffects.js';
import equipment from '../data/equipment.json' with {type:'json'};

export const bladesongId='2014:Wizard:bladesong';
export const bladesongEffectId='subclass:bladesong';
const count=value=>Math.max(0,Math.floor(Number(value)||0));
const matchesResource=r=>r.id===bladesongId||r.classResourceKey===bladesongId;
const name=value=>String(value||'').trim().toLowerCase();
export const bladesingerWeaponOptions=equipment.filter(e=>e.weapon_range==='Melee'&&e.damage&&!e.properties?.some(p=>p.index==='two-handed')).map(e=>({name:e.name,index:e.index}));

function restriction(c){
 const worn=(c.inventory||[]).filter(i=>equippedForActiveBody(c,i)).map(i=>({...equipment.find(e=>e.index===i.equipmentIndex),...i}));
 if(worn.some(e=>e.equipmentIndex==='shield'||e.index==='shield'||e.shield||e.armor_category==='Shield'))return 'Bladesong cannot be used with a shield.';
 if(worn.some(e=>['Medium','Heavy'].includes(e.armor_category)))return 'Remove medium or heavy armor before using Bladesong.';
 const conditions=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(x=>name(x?.name||x));
 if(actorActionBlock(c))return actorActionBlock(c);
 if(conditions.some(x=>['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].includes(x)))return 'Bladesong ends while you are incapacitated.';
 return '';
}

export function bladesongProfile(c,abilities=effectiveAbilityScores(c)){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const row=characterClasses(c).find(r=>r.name==='Wizard'&&r.edition==='2014'&&!r.definition?.homebrew&&r.definition?.source!=='Homebrew'&&!r.definition?.prestige&&findExpandedSubclass(r.name,r.subclass)?.id==='2014:subclass:wizard:bladesinging');
 if(edition!=='2014'||!row||row.level<2)return {active:false,singing:false,acBonus:0,speedBonus:0,concentrationBonus:0,meleeWeaponDamageBonus:0,attacks:1};
 const level=count(row.level),pb=2+Math.floor((Math.max(1,totalLevel(c))-1)/4),blocked=restriction(c);
 const used=Math.max(0,...(c.resources||[]).filter(matchesResource).map(r=>count(r.used)));
 const singing=!blocked&&activeEffects(c).some(e=>e.id===bladesongEffectId);
 const intelligence=Math.max(1,Math.floor((Number(abilities.int??10)-10)/2));
 return {active:true,row,level,pb,max:pb,used,remaining:Math.max(0,pb-used),blocked,singing,acBonus:singing?intelligence:0,speedBonus:singing?10:0,concentrationBonus:singing?intelligence:0,acrobaticsAdvantage:singing,meleeWeaponDamageBonus:singing&&level>=14?intelligence:0,attacks:level>=6?2:1,cantripReplacement:level>=6,canSongOfDefense:level>=10,sourceBook:"Tasha's Cauldron of Everything"};
}

export function bladesongResources(c){
 const p=bladesongProfile(c);if(!p.active)return [];
 return [{id:bladesongId,classResourceKey:bladesongId,name:'Bladesong',max:p.max,used:p.used,reset:'long',shortRecovery:0,manual:false,bladesongManaged:true,className:'Wizard',sourceClassId:p.row.catalogId,sourceClassName:'Wizard',edition:'2014'}];
}

export function startBladesong(c){
 const p=bladesongProfile(c);
 if(!p.active)throw Error('Bladesinging requires Wizard level 2.');
 if(p.blocked)throw Error(p.blocked);
 if(!p.remaining)throw Error('No Bladesong uses remaining.');
 return {resources:[...(c.resources||[]).filter(r=>!matchesResource(r)),{...bladesongResources(c)[0],used:p.used+1}],activeEffects:[...(c.activeEffects||[]).filter(e=>e.id!==bladesongEffectId),{id:bladesongEffectId,timerInstance:crypto.randomUUID(),key:bladesongEffectId,name:'Bladesong',remainingSeconds:60,sourceClassId:p.row.catalogId,sourceFeature:'Bladesong'}]};
}
export const endBladesong=c=>({activeEffects:(c.activeEffects||[]).filter(e=>e.id!==bladesongEffectId)});
export function afterBladesingerAttack(c,{hands=1,weapon=true}={}){return weapon&&hands>=2?endBladesong(c):{};}
export function reconcileBladesinging(c){
 const p=bladesongProfile(c);
 return {...c,...(!p.active||p.blocked?endBladesong(c):{}),resources:p.active?c.resources||[]:(c.resources||[]).filter(r=>!matchesResource(r))};
}

// The caller supplies its already-calculated available slot choices. This keeps
// the feature independent of the spellbook/rules import cycle, like Second Wind.
export function useSongOfDefense(c,{slotLevel,slotPool='standard',availableSlots=[],triggered=false}={}){
 const p=bladesongProfile(c);
 if(!p.active||p.level<10)throw Error('Song of Defense requires Wizard level 10.');
 if(!p.singing)throw Error('Start Bladesong before using Song of Defense.');
 if(!triggered)throw Error('Confirm that you are taking damage and can use your reaction.');
 if(!['standard','pact'].includes(slotPool)||!Number.isInteger(slotLevel)||slotLevel<1||slotLevel>9||!availableSlots.some(s=>s.level===slotLevel&&(s.pool||'standard')===slotPool&&s.remaining>0))throw Error('Choose an available spell slot.');
 const key=slotPool==='pact'?'pactSlotsUsed':'slotsUsed';
 return {reduction:slotLevel*5,patch:{[key]:{...c[key],[slotLevel]:count(c[key]?.[slotLevel])+1}}};
}
