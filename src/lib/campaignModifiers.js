import {applyFeatAbilityIncrease} from './featMagic.js';
import {graftRecipes} from '../data/campaignExpansion.js';
import {conversionClassActive,conversionFeatActive,conversionStateActive} from './conversionFeatures.js';
export const campaignSourceActive=c=>conversionClassActive(c)||conversionFeatActive(c)||conversionStateActive(c);
export function graftModifiers(grafts=[]){
 const result={abilities:{},ac:0,speed:0,initiative:0,perception:0,acrobatics:0,healing:0,heart:false};
 let chitinBonus=0;
 const applied=new Set();
 for(const graft of grafts){
  const base=graftRecipes.find(recipe=>recipe.id===graft.recipeId);
  const rule={...base,...graft.effects};
  if(base?.id==='chitin'||base?.id.startsWith('chitin-')){
   chitinBonus=Math.max(chitinBonus,Math.max(1,Math.min(5,Number(rule.ac)||base.ac)));
   continue;
  }
  if(graft.recipeId&&applied.has(graft.recipeId))continue;
  applied.add(graft.recipeId);
  for(const [key,value] of Object.entries(rule.abilities||{}))result.abilities[key]=(result.abilities[key]||0)+Number(value||0);
  for(const key of ['ac','speed','initiative','perception','acrobatics','healing'])result[key]+=Number(rule[key]||0);
  result.heart ||=!!rule.heart;
 }
 result.ac+=chitinBonus;
 return result;
}
export function campaignModifiers(c,abilityBonuses=c.abilityBonuses){
 if(!campaignSourceActive(c))return graftModifiers();
 const r=graftModifiers(c.archivistCampaign?.grafts),e=c.archivistCampaign?.empowerment;
 for(const [key,bonus] of Object.entries(r.abilities)){
  const score=applyFeatAbilityIncrease(c,key,Number(c.abilities?.[key]??10)+Number(abilityBonuses?.[key]||0));
  r.abilities[key]=applyGraftAbilityBonus(score,bonus)-score;
 }
 if(e?.rounds>0){for(const k of ['dex','int','wis'])r.abilities[k]=(r.abilities[k]||0)+Number(e.abilityBonus);r.ac+=Number(e.acBonus);r.conSave=Number(e.conSaveBonus);}
 return r;
}
export function applyGraftAbilityBonus(score,bonus=0){
 return score+(bonus>0?Math.min(bonus,Math.max(0,20-score)):bonus);
}
export function campaignScores(c){
 const m=campaignModifiers(c);
 return Object.fromEntries(['str','dex','con','int','wis','cha'].map(key=>[key,applyFeatAbilityIncrease(c,key,Number(c.abilities?.[key]??10)+Number(c.abilityBonuses?.[key]||0))+Number(m.abilities[key]||0)]));
}
