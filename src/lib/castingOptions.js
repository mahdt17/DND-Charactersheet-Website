export function castingSlotChoices(c,pools,minimum=1,pool='standard'){
 return (pools?.[pool]||[]).flatMap((count,level)=>level>=Math.max(1,minimum)&&count>0?[{level,remaining:Math.max(0,count-Number(c[pool==='pact'?'pactSlotsUsed':'slotsUsed']?.[level]||0))}]:[]);
}
export function selectedCastingSlot(c,pools,minimum,requested={}){
 const available=pool=>castingSlotChoices(c,pools,minimum,pool).filter(x=>x.remaining>0);
 const pool=requested.pool||(['standard','pact'].find(kind=>available(kind).length)||'standard');
 const choices=castingSlotChoices(c,pools,minimum,pool),valid=choices.filter(x=>x.remaining>0);
 const slot=valid.some(x=>x.level===requested.slot)?requested.slot:valid[0]?.level??'';
 return {pool,slot,choices};
}
