import races from '../data/races.json' with {type:'json'};
import {applyFeatAbilityIncrease,featMagicState} from './featMagic.js';
import {campaignModifiers} from './campaignModifiers.js';

const keys=['str','dex','con','int','wis','cha'];
export function recordedAbilityBonuses(c){
 const racial=races.find(r=>r.name===c.race)?.ability_bonuses||[];
 return Object.fromEntries(keys.map(key=>[key,c.abilityBonuses?Number(c.abilityBonuses[key]||0):Number(racial.find(b=>b.ability_score.index===key)?.bonus||0)+Number(c.ancestryBonuses?.[key]||0)]));
}
function calculate(c,key,bonuses,effects){
 const base=Number(c.abilities?.[key]||0),bonus=bonuses[key],featBonus=applyFeatAbilityIncrease(c,key,base+bonus)-(base+bonus),effectBonus=Number(effects[key]||0),total=base+bonus+featBonus+effectBonus;
 return {base,bonus,featBonus,effectBonus,total,modifier:Math.floor((total-10)/2)};
}
// The popup and all existing sheet consumers share this calculation.
export function effectiveAbilityScores(c){const bonuses=recordedAbilityBonuses(c),effects=campaignModifiers(c).abilities;return Object.fromEntries(keys.map(key=>[key,calculate(c,key,bonuses,effects).total]));}
export function abilityScoreBreakdown(c,key){
 if(!keys.includes(key))throw new Error('Choose an ability score.');
 const result=calculate(c,key,recordedAbilityBonuses(c),campaignModifiers(c).abilities),edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const featSources=[];let remaining=result.featBonus;
 for(const feat of c.feats||[]){const state=featMagicState(feat,c);if(state.valid&&state.profile?.abilityIncrease&&state.ability===key&&feat.magicChoices?.applyAbilityIncrease!==false){const bonus=Math.min(1,remaining);featSources.push({name:feat.name,bonus,capped:bonus===0});remaining-=bonus;}}
 const origin=edition==='2024'?(c.background||'Background'):([c.race,c.subrace].filter(Boolean).join(' · ')||'Species');
 return {...result,featSources,bonusSource:c.abilityBonuses?`${origin} · ${edition==='2024'?'background':'species'} or manual adjustments`:`${origin} · catalog and ancestry bonus`};
}
export function abilityScoreEdit(c,key,{base,bonus}){
 const integer=(value,label,min,max)=>{if(String(value??'').trim()===''||!Number.isInteger(Number(value))||Number(value)<min||Number(value)>max)throw new Error(`${label} must be a whole number from ${min} to ${max}.`);return Number(value);};
 if(!keys.includes(key))throw new Error('Choose an ability score.');
 base=integer(base,'Base score',1,99);bonus=integer(bonus,'Recorded bonus',-99,99);
 const bonuses=recordedAbilityBonuses(c),patch={abilities:{...c.abilities,[key]:base},...(bonus!==bonuses[key]?{abilityBonuses:{...bonuses,[key]:bonus}}:{})},total=abilityScoreBreakdown({...c,...patch},key).total;
 if(!Number.isInteger(total)||total<1||total>99)throw new Error('Total score must be a whole number from 1 to 99.');
 return patch;
}
