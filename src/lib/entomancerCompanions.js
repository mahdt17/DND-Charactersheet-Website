import monsters from '../data/monsters.json' with {type:'json'};
import {entomancerLevel} from './entomancer.js';
const abilityNames={str:'strength',dex:'dexterity',con:'constitution',int:'intelligence',wis:'wisdom',cha:'charisma'};
export function entomancerCompanion(summon){
 const record=monsters.find(m=>m.index===(summon.kind==='swarm'?'swarm-of-insects':'zombie'));
 const attack=record.actions[0],half=summon.kind==='swarm'&&summon.hp<=summon.maxHP/2;
 return {name:record.name,ac:summon.stats?.ac??record.armor_class[0].value,attack:summon.stats?.attack??attack.attack_bonus,damage:summon.stats?.damage||(half?'2d4':attack.damage[0].damage_dice),damageType:attack.damage[0].damage_type.name,
  saves:Object.fromEntries(Object.entries(abilityNames).map(([key,name])=>[key,record.proficiencies.find(p=>p.proficiency.index==='saving-throw-'+key)?.value??Math.floor((record[name]-10)/2)])),
  speed:record.speed,senses:record.senses,resistances:record.damage_resistances,immunities:record.damage_immunities,conditionImmunities:record.condition_immunities.map(c=>c.name),features:record.special_abilities};
}
export function damageEntomancerCompanion(c,id,amount,{type='',critical=false}={}){
 if(!entomancerLevel(c))throw Error('No supported Entomancer class.');
 if(!Number.isInteger(amount)||amount<0)throw Error('Enter whole nonnegative damage.');
 const summon=c.entomancer?.summons?.find(s=>s.id===id);if(!summon)throw Error('Summon not found.');
 const p=entomancerCompanion(summon),damage=p.immunities.includes(type)?0:p.resistances.includes(type)?Math.floor(amount/2):amount;
 const hp=Math.max(0,summon.hp-damage),fortitudeDC=summon.kind==='zombie'&&summon.hp>0&&hp===0&&type!=='radiant'&&!critical?5+damage:null;
 return {...c,entomancer:{...c.entomancer,summons:c.entomancer.summons.map(s=>s.id===id?{...s,hp,fortitudeDC}:s)}};
}
