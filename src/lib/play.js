import { mechanics, is35, spellSlotPools } from './editions';
export const conditionNames=c=>Array.isArray(c.conditions)?c.conditions.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean):String(c.conditions||'').split(',').map(s=>s.trim()).filter(Boolean);
export const exhaustionLevel=c=>Math.max(0,Math.min(6,Math.floor(Number(c.exhaustion??(conditionNames(c).some(n=>n.toLowerCase()==='exhaustion')?1:0))||0)));
export function conditionEffects(c){const e=exhaustionLevel(c),names=conditionNames(c).map(n=>n[0].toUpperCase()+n.slice(1).toLowerCase()),modern=mechanics(c)==='2024';
 return {exhaustion:e,penalty:modern?-2*e:0,checkDisadvantage:!is35(c)&&((!modern&&e>=1)||names.includes('Poisoned')),attackDisadvantage:!is35(c)&&((!modern&&e>=3)||['Poisoned','Blinded','Prone','Restrained'].some(n=>names.includes(n))),saveDisadvantage:!is35(c)&&!modern&&e>=3,speed:['Grappled','Restrained','Paralyzed','Stunned','Unconscious','Petrified'].some(n=>names.includes(n))?0:modern?Math.max(0,c.speed-5*e):!is35(c)&&e>=5?0:!is35(c)&&e>=2?Math.floor(c.speed/2):c.speed,maxHP:!is35(c)&&!modern&&e>=4?Math.max(1,Math.floor(c.hp.max/2)):c.hp.max,dead:!is35(c)&&e>=6};}
export const criticalDice=s=>s.replace(/(\d+)d(\d+)/gi,(_,n,d)=>`${Number(n)*2}d${d}`);
export function rollMode(preferred,disadvantage=false){return disadvantage?(preferred==='advantage'?'normal':'disadvantage'):preferred;}
const pick=(map,level)=>{const k=Object.keys(map||{}).map(Number).filter(n=>n<=level).sort((a,b)=>b-a)[0];return k==null?'':map[k];};
export function spellPlan(s,c,slot,mod){
 const level=Number(s.level)||0,description=s.description||s.desc?.join('\n')||'',revised=s.edition==='2024';
 const result={attack:!!s.attack_type||/ranged spell attack|melee spell attack|ranged touch attack|melee touch attack/i.test(description),rolls:[],count:1,save:s.dc?.dc_type?.name||'',notes:''};
 if(s.edition==='3.5'||s.referenceOnly){result.notes='3.5 spells scale with caster level, not slot level. Confirm damage and metamagic below.';return result;}
 if(s.name==='Magic Missile'){result.rolls=[{expression:`${slot+2}d4+${slot+2}`,label:'Force damage · all darts (split between targets)'}];return result;}
 if(s.name==='Scorching Ray')result.count=slot+1;
 if(s.name==='Eldritch Blast')result.count=1+[5,11,17].filter(n=>c.level>=n).length;
 const healing=s.heal_at_slot_level;
 if(healing)result.rolls.push({expression:pick(healing,slot).replace(/MOD/g,String(mod)).replace(/\s/g,'').replaceAll('+-','-'),label:'Healing'});
 if(revised&&!healing&&['Cure Wounds','Healing Word','Mass Cure Wounds','Mass Healing Word'].includes(s.name)){
  const mass=s.name.startsWith('Mass'),base=mass?s.name==='Mass Cure Wounds'?5:3:1;
  const qty=mass?s.name==='Mass Cure Wounds'?5:2:2;
  result.rolls.push({expression:`${qty+(slot-base)*(mass?1:2)}d${s.name.includes('Cure')?8:4}${mod>=0?'+':''}${mod}`,label:'Healing per target'});
 }
 const damage=Array.isArray(s.damage)?s.damage:s.damage?[s.damage]:[];
 for(const d of damage){let expression=pick(d.damage_at_character_level,c.level)||pick(d.damage_at_slot_level,slot);if(!expression)continue;
  if(revised&&!d.damage_at_character_level&&level===0&&s.name!=='Eldritch Blast')expression=expression.replace(/^(\d+)d/,(m,n)=>`${Number(n)*(1+[5,11,17].filter(x=>c.level>=x).length)}d`);
  if(revised&&slot>level){const higher=Array.isArray(s.higher_level)?s.higher_level.join(' '):s.higher_level||'';const inc=(higher+' '+description).match(/(?:increases|increase).*?(\d+)d(\d+).*?(?:each|per) spell slot/i);if(inc&&!d.damage_at_slot_level?.[slot])expression=expression.replace(/^(\d+)d(\d+)/,(m,n,sides)=>+sides===+inc[2]?`${+n+(slot-level)*+inc[1]}d${sides}`:m);}
  result.rolls.push({expression:expression.replace(/MOD/g,String(mod)).replace(/\s/g,'').replaceAll('+-','-'),label:`${d.damage_type?.name||''} damage${result.attack?' on hit':' per target'}`});
 }
 if(!result.rolls.length)result.notes='This spell has no automatic damage formula. Resolve its effects from the description, or enter a roll below.';
 return result;
}
export function availableSlots(c,s){
 const level=Number(s.level)||0,{standard,pact}=spellSlotPools(c);
 return [...standard.map((total,i)=>({level:i,remaining:Math.max(0,total-(c.slotsUsed?.[i]||0))})),
  ...pact.map((total,i)=>({level:i,remaining:Math.max(0,total-(c.pactSlotsUsed?.[i]||0)),pool:'pact'}))]
  .filter(x=>x.remaining>0&&(is35(c)?x.level===level:x.level>=Math.max(1,level)));
}
export function spendSpellSlot(c,s,level,pool='standard') {
 if(!availableSlots(c,s).some(x=>x.level===level&&(x.pool||'standard')===pool))throw Error('Choose an available slot for this spell.');
 const key=pool==='pact'?'pactSlotsUsed':'slotsUsed';
 return {[key]:{...c[key],[level]:(c[key]?.[level]||0)+1}};
}
