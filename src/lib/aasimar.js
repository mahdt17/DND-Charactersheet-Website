import {actorActionBlock,healActiveBody} from './subclassState.js';
import {aasimarId,aasimarRace,aasimarSubraces} from '../data/aasimar.js';
import {effectiveAbilityScores} from './abilityScores.js';
import spells from '../data/spells.json' with {type:'json'};
export const aasimarHealingId='race:aasimar-vgm:healing-hands';
export const aasimarTransformationId='race:aasimar-vgm:transformation';
const count=x=>Math.max(0,Math.floor(Number(x)||0));
export const isAasimar=c=>c?.race==='Aasimar'&&c.raceDefinition?.catalogId===aasimarId&&c.raceDefinition?.edition==='2014'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';
export function aasimarProfile(c,abilities=effectiveAbilityScores(c)){
 if(!isAasimar(c))return {active:false};
 const variant=aasimarSubraces.find(v=>v.name===c.subrace),level=Math.max(1,Math.min(20,count(c.level)||1)),pb=2+Math.floor((level-1)/4),used=id=>count(c.resources?.find(r=>r.id===id)?.used);
 const canTransform=!!variant&&level>=3,formActive=canTransform&&c.aasimar?.transformation===variant.id,auraDamage=variant?.id==='scourge'?Math.ceil(level/2):0;
 const darkvision=Number.isInteger(c.aasimar?.darkvision)&&c.aasimar.darkvision>=0&&c.aasimar.darkvision<=300?c.aasimar.darkvision:60;
 const healingDice=c.aasimar?.healingMode==='proficiency-d4'?pb:0;
 return {active:true,variant,darkvision,healingDice,complete:!!variant,level,pb,dc:8+pb+Math.floor(((abilities.cha??10)-10)/2),healing:level,extraDamage:level,resistances:['radiant','necrotic'],canTransform,formActive,flyingSpeed:formActive&&variant.id==='protector'?30:0,damageType:variant?.damageType,auraDamage,selfAuraDamage:Math.floor(auraDamage/2),healingUsed:used(aasimarHealingId),healingRemaining:Math.max(0,1-used(aasimarHealingId)),transformationUsed:used(aasimarTransformationId),transformationRemaining:Math.max(0,1-used(aasimarTransformationId))};
}
export function aasimarResources(c){
 const p=aasimarProfile(c);if(!p.active)return [];
 const resource=(id,name,used)=>({id,classResourceKey:id,raceManaged:true,className:'Aasimar',name,max:1,used,reset:'long',shortRecovery:0,manual:false});
 return [resource(aasimarHealingId,'Healing Hands',p.healingUsed),...(p.canTransform||p.transformationUsed>0?[resource(aasimarTransformationId,p.variant?.feature||'Aasimar transformation',p.transformationUsed)]:[])];
}
export function aasimarActionBlock(c){
 if(!isAasimar(c))return 'This Aasimar source does not grant this ability.';
 if(actorActionBlock(c))return actorActionBlock(c);
 const conditions=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(v=>String(typeof v==='object'?v?.name:v).trim().toLowerCase());
 return conditions.some(v=>['dead','incapacitated','unconscious','paralyzed','stunned','petrified'].includes(v))?'You cannot use this ability while incapacitated.':'';
}
function spend(c,id){const r=aasimarResources(c).find(r=>r.id===id);if(!r||r.used>=r.max)throw Error('No ability uses remaining.');return {resources:[...(c.resources||[]).filter(x=>x.id!==id),{...r,used:r.used+1}]};}
export function healingHandsAmount(profile,random=Math.random){
 if(!profile.healingDice)return profile.healing;
 return Array.from({length:profile.healingDice},()=>1+Math.floor(random()*4)).reduce((sum,die)=>sum+die,0);
}
export function useHealingHands(c,{self=false,amount}={}){
 const blocked=aasimarActionBlock(c);if(blocked)throw Error(blocked);
 const result=spend(c,aasimarHealingId),profile=aasimarProfile(c);
 const healing=profile.healingDice?(amount??healingHandsAmount(profile)):profile.healing;
 if(!Number.isInteger(healing)||profile.healingDice&&(healing<profile.healingDice||healing>4*profile.healingDice))throw Error('Invalid Healing Hands roll.');
 return {...result,...(self?(healActiveBody(c,healing)||{hp:{...c.hp,current:Math.min(c.hp.max,c.hp.current+healing)}}):{})};
}
export function useAasimarTransformation(c){
 const blocked=aasimarActionBlock(c);if(blocked)throw Error(blocked);
 const p=aasimarProfile(c);if(!p.canTransform)throw Error('Choose a variant and reach character level 3 to transform.');
 return {...spend(c,aasimarTransformationId),aasimar:{...c.aasimar,transformation:p.variant.id}};
}
export const endAasimarTransformation=c=>({aasimar:{...c.aasimar,transformation:null}});
export function aasimarLightSpell(c){
 if(!isAasimar(c))return null;const spell=spells.find(s=>s.index==='light');
 return {...spell,id:'race:aasimar-vgm:light',catalogId:'2014:light',edition:'2014',level:0,source:'Aasimar · Light Bearer',description:spell.desc.join('\n\n'),racialAbility:'cha',raceGrantId:aasimarId,prepared:true};
}
export function reconcileAasimar(c){
 const retained=(c.traits||[]).filter(t=>t.homebrew||t.raceGrantId!==aasimarId);
 if(!isAasimar(c))return retained.length===(c.traits||[]).length?c:{...c,traits:retained};
 const variant=aasimarSubraces.find(v=>v.name===c.subrace),traits=[...aasimarRace.traits,...(variant?.racial_traits||[])].map(t=>({...t,id:aasimarId+':'+t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),source:aasimarRace.source}));
 const profile=aasimarProfile(c);
 for(const trait of traits){
  if(trait.name==='Darkvision'&&profile.darkvision!==60)trait.description=trait.description.replace('60 feet',profile.darkvision+' feet');
  if(trait.name==='Healing Hands'&&profile.healingDice)trait.description='As an action, touch a creature and restore a number of d4s of hit points equal to your proficiency bonus. Once per long rest.';
 }
 return {...c,traits:[...retained,...traits]};
}
