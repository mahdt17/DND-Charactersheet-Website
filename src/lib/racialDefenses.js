import races from '../data/races.json' with {type:'json'};
import {retainsOwnFeatures} from './subclassState.js';
import {aasimarProfile} from './aasimar.js';
import {shadarKaiProfile} from './shadarKai.js';
// Exact known traits and explicit saved typed defenses; freeform prose is not parsed as a rule.
export function racialDamageResistance(c,type){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c)||!type)return false;
 const damageType=String(type).toLowerCase(),saved=c.raceDefinition||{},canonical=races.find(r=>r.index===saved.index||r.name===c.race),traits=[...(canonical?.traits||[]),...(saved.traits||[])].map(t=>String(t.index||t.name||t).toLowerCase()),explicit=[...(saved.damage_resistances||[]),...(c.subraceDefinition?.damage_resistances||[])].map(t=>String(t).toLowerCase());
 const aasimar=aasimarProfile(c),shadar=shadarKaiProfile(c);
 return explicit.includes(damageType)||aasimar.active&&aasimar.resistances.includes(damageType)||shadar.active&&(shadar.wardActive||shadar.resistances.includes(damageType))||damageType==='fire'&&traits.some(t=>['hellish-resistance','hellish resistance'].includes(t))||damageType==='poison'&&(traits.some(t=>['dwarven-resilience','dwarven resilience','stout-resilience','stout resilience'].includes(t))||c.race==='Halfling'&&c.subrace==='Stout');
}
