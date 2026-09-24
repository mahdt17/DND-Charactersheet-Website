import {characterClasses} from './advancement.js';

const count=n=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;
const hasPools=c=>c.hitDiceUsedByClass&&typeof c.hitDiceUsedByClass==='object'&&!Array.isArray(c.hitDiceUsedByClass);
const dieSize=n=>{const value=Number(String(n??'').replace(/^d/i,''));return Number.isInteger(value)&&value>=2&&value<=100?value:null;};

export function hitDicePools(c) {
  let legacy=count(c.hitDiceUsed);
  return characterClasses(c).map((row,i)=>{
    const total=count(row.level),key=row.catalogId;
    const used=Math.min(total,hasPools(c)?count(c.hitDiceUsedByClass[key]):legacy);
    if(!hasPools(c))legacy-=used;
    // Only the primary class may use the old sheet-wide die as a fallback.
    const sides=dieSize(row.definition?.hit_die??row.definition?.stats?.hitDie??(i===0?c.hitDie:null));
    return {key,name:row.name,sides,total,used,available:total-used};
  });
}
export const needsHitDiceReview=c=>!hasPools(c)&&count(c.hitDiceUsed)>0&&new Set(hitDicePools(c).map(p=>p.sides)).size>1;
export const recoveryLimit=c=>{
  const total=hitDicePools(c).reduce((n,p)=>n+p.total,0);
  return (c.ruleset==='custom'?c.mechanics:c.ruleset)==='2024'?total:Math.max(1,Math.floor(total/2));
};
export function defaultRecovery(c) {
  let left=recoveryLimit(c);
  return Object.fromEntries(hitDicePools(c).map(p=>{const n=Math.min(left,p.used);left-=n;return [p.key,n];}));
}
function validate(pools,selection,limitKey) {
  if(!selection||typeof selection!=='object'||Array.isArray(selection))throw Error('Choose hit dice from the listed classes.');
  for(const [key,n] of Object.entries(selection)) {
    const pool=pools.find(p=>p.key===key);
    if(!pool||!Number.isInteger(n)||n<0||n>pool[limitKey])throw Error('Choose whole hit dice within each class’s available total.');
  }
}
function savedCounts(pools) {
  return {hitDiceUsedByClass:Object.fromEntries(pools.map(p=>[p.key,p.used])),hitDiceUsed:pools.reduce((n,p)=>n+p.used,0)};
}
export function setSpentHitDice(c,selection) {
  const pools=hitDicePools(c);validate(pools,selection,'total');
  return savedCounts(pools.map(p=>({...p,used:selection[p.key]??p.used})));
}
export function spendHitDice(c,selection,conModifier,roll) {
  if(needsHitDiceReview(c))throw Error('Review the older save’s spent hit dice before resting.');
  const pools=hitDicePools(c);validate(pools,selection,'available');
  if(pools.some(p=>selection[p.key]>0&&!p.sides))throw Error('Record the class hit die from its source before spending it.');
  if(!Number.isFinite(conModifier))throw Error('Constitution modifier must be a number.');
  let healing=0;
  const spent=pools.map(p=>{
    let used=p.used;
    for(let i=0;i<(selection[p.key]||0);i++) {
      const result=roll(`1d${p.sides}`,`Short rest · ${p.name} hit die`,{kind:'healing'});
      if(!result||!Number.isFinite(result.total))continue; // Never consume a failed roll.
      healing+=Math.max(0,result.total+conModifier);used++;
    }
    return {...p,used};
  });
  return {healing,...savedCounts(spent)};
}
export function recoverHitDice(c,selection=defaultRecovery(c)) {
  if(needsHitDiceReview(c))throw Error('Review the older save’s spent hit dice before resting.');
  const pools=hitDicePools(c);
  if((c.ruleset==='custom'?c.mechanics:c.ruleset)==='2024')return savedCounts(pools.map(p=>({...p,used:0})));
  validate(pools,selection,'used');
  if(Object.values(selection).reduce((n,v)=>n+v,0)>recoveryLimit(c))throw Error('Too many hit dice selected for this long rest.');
  return savedCounts(pools.map(p=>({...p,used:p.used-(selection[p.key]||0)})));
}
