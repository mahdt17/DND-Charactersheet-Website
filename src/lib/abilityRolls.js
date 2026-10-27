export const abilityRollKeys=['str','dex','con','int','wis','cha'];
const slot=index=>Number.isInteger(index)&&index>=0&&index<6;
const validRoll=result=>result?.expression==='4d6dl1'&&result.rolls?.length===4&&result.rolls.every(n=>Number.isInteger(n)&&n>=1&&n<=6)&&result.total===result.rolls.reduce((sum,n)=>sum+n,0)-Math.min(...result.rolls);

export function abilityRollSetup(pool=[],assignments={}){
 const abilityRollPool=Array.from({length:6},(_,i)=>pool[i]||null),abilityRollAssignments={},abilityRolls={},abilities={},used=new Set();
 for(const key of abilityRollKeys){
  const index=assignments[key];
  if(slot(index)&&validRoll(abilityRollPool[index])&&!used.has(index)){
   used.add(index);abilityRollAssignments[key]=index;abilityRolls[key]=abilityRollPool[index];
  }
  abilities[key]=abilityRolls[key]?.total||0;
 }
 return {patch:{abilityRollPool,abilityRollAssignments,abilityRolls,abilities}};
}
export function recordAbilityRoll(draft,index,result){
 if(!slot(index)||!validRoll(result))throw Error('Roll four d6 and drop the lowest die for a score slot from 1 to 6.');
 const pool=Array.from({length:6},(_,i)=>draft.abilityRollPool?.[i]||null);pool[index]=result;
 return abilityRollSetup(pool,draft.abilityRollAssignments).patch;
}
export function assignAbilityRoll(draft,index,ability){
 if(!slot(index)||!validRoll(draft.abilityRollPool?.[index]))throw Error('Roll this score before assigning it.');
 if(ability&&!abilityRollKeys.includes(ability))throw Error('Choose a valid ability.');
 const assignments={...draft.abilityRollAssignments},previous=abilityRollKeys.find(key=>assignments[key]===index),displaced=assignments[ability];
 if(previous)delete assignments[previous];
 if(ability){assignments[ability]=index;if(previous&&previous!==ability&&slot(displaced))assignments[previous]=displaced;}
 return abilityRollSetup(draft.abilityRollPool,assignments).patch;
}
export function abilityRollsComplete(draft){
 const indices=abilityRollKeys.map(key=>draft.abilityRollAssignments?.[key]);
 return indices.every(slot)&&new Set(indices).size===6&&abilityRollKeys.every(key=>{
  const result=draft.abilityRollPool?.[draft.abilityRollAssignments[key]];
  return validRoll(result)&&draft.abilities?.[key]===result.total&&draft.abilityRolls?.[key]?.total===result.total;
 });
}
