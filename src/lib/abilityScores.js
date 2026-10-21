import races from '../data/races.json' with {type:'json'};
import {applyFeatAbilityIncrease} from './featMagic.js';
import {campaignModifiers} from './campaignModifiers.js';

// Sheet displays and class actions must use the same final ability scores.
export function effectiveAbilityScores(c){
 const racial=races.find(r=>r.name===c.race)?.ability_bonuses||[],effects=campaignModifiers(c).abilities;
 return Object.fromEntries(['str','dex','con','int','wis','cha'].map(key=>{
  const bonus=c.abilityBonuses?Number(c.abilityBonuses[key]||0):Number(racial.find(b=>b.ability_score.index===key)?.bonus||0)+Number(c.ancestryBonuses?.[key]||0);
  return [key,applyFeatAbilityIncrease(c,key,Number(c.abilities?.[key]||0)+bonus)+Number(effects[key]||0)];
 }));
}
