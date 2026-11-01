import monsters from '../data/monsters.json' with {type:'json'};

const byId=new Map(monsters.map(monster=>[monster.index,monster]));
const sizes=['Tiny','Small','Medium','Large','Huge','Gargantuan'];
const elementals=new Set(['air-elemental','earth-elemental','fire-elemental','water-elemental']);

// Only project fields already present in the local stat block. Prose remains
// source text; it is never evaluated as a formula or an action.
export function localCreatureProfile(id){
 const m=byId.get(id); if(!m)return null;
 const abilities=Object.fromEntries([['str','strength'],['dex','dexterity'],['con','constitution'],['int','intelligence'],['wis','wisdom'],['cha','charisma']].map(([key,source])=>[key,m[source]]));
 return {id:m.index,name:m.name,size:m.size,type:m.type,cr:m.challenge_rating,ac:m.armor_class?.[0]?.value,hpMax:m.hit_points,hitDice:m.hit_dice,speeds:{...m.speed},abilities,proficiencies:(m.proficiencies||[]).map(p=>({name:p.proficiency?.name,bonus:p.value})),senses:{...m.senses},damageVulnerabilities:[...m.damage_vulnerabilities||[]],damageResistances:[...m.damage_resistances||[]],damageImmunities:[...m.damage_immunities||[]],conditionImmunities:(m.condition_immunities||[]).map(c=>typeof c==='string'?c:c.name).filter(Boolean),traits:(m.special_abilities||[]).map(a=>({...a})),attacks:(m.actions||[]).filter(a=>Number.isFinite(a.attack_bonus)).map(a=>({...a,name:a.name,toHit:a.attack_bonus,description:a.desc,damage:(a.damage||[]).map(d=>({...d,dice:d.damage_dice,type:d.damage_type?.name}))})),actions:(m.actions||[]).map(a=>({...a})),sourceUrl:m.url};
}
export function moonFormOptions(druidLevel){
 const level=Number(druidLevel); if(!Number.isInteger(level)||level<2)return [];
 const maxCR=level<6?1:Math.floor(level/3);
 return monsters.filter(m=>m.type==='beast'&&Number.isFinite(m.challenge_rating)&&m.challenge_rating<=maxCR&&(level>=4||!m.speed?.swim)&&(level>=8||!m.speed?.fly)||level>=10&&elementals.has(m.index)).map(m=>localCreatureProfile(m.index));
}
export function isEligibleMoonProfile(id,druidLevel){
 const m=byId.get(id),level=Number(druidLevel);if(!m||!Number.isInteger(level)||level<2)return false;
 return m.type==='beast'&&Number.isFinite(m.challenge_rating)&&m.challenge_rating<=(level<6?1:Math.floor(level/3))&&(level>=4||!m.speed?.swim)&&(level>=8||!m.speed?.fly)||level>=10&&elementals.has(id);
}
export function rangerBeastOptions(){
 return monsters.filter(m=>m.type==='beast'&&Number.isFinite(m.challenge_rating)&&m.challenge_rating<=0.25&&sizes.indexOf(m.size)>=0&&sizes.indexOf(m.size)<=2).map(m=>localCreatureProfile(m.index));
}
export function localUndeadOptions(){return monsters.filter(m=>m.type==='undead').map(m=>localCreatureProfile(m.index));}
