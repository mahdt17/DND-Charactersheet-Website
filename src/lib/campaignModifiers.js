import {applyFeatAbilityIncrease} from './featMagic.js';
import {graftRecipes} from '../data/campaignExpansion.js';
import {conversionClassActive,conversionFeatActive,conversionStateActive} from './conversionFeatures.js';
export const campaignSourceActive=c=>conversionClassActive(c)||conversionFeatActive(c)||conversionStateActive(c);
export function graftModifiers(grafts=[]){
 const result={abilities:{},ac:0,speed:0,initiative:0,perception:0,acrobatics:0,healing:0,heart:false};
 for(const g of grafts){const rule={...graftRecipes.find(r=>r.id===g.recipeId),...g.effects};for(const [k,v] of Object.entries(rule.abilities||{}))result.abilities[k]=(result.abilities[k]||0)+Number(v||0);for(const k of ['ac','speed','initiative','perception','acrobatics','healing'])result[k]+=Number(rule[k]||0);result.heart ||=!!rule.heart;}
 return result;
}
export function campaignModifiers(c){
 if(!campaignSourceActive(c))return graftModifiers();
 const r=graftModifiers(c.archivistCampaign?.grafts),e=c.archivistCampaign?.empowerment;
 if(e?.rounds>0){for(const k of ['dex','int','wis'])r.abilities[k]=(r.abilities[k]||0)+Number(e.abilityBonus);r.ac+=Number(e.acBonus);r.conSave=Number(e.conSaveBonus);}
 return r;
}
export function campaignScores(c){const m=campaignModifiers(c);return Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,applyFeatAbilityIncrease(c,k,Number(c.abilities?.[k]??10)+Number(c.abilityBonuses?.[k]||0))+Number(m.abilities[k]||0)]));}
