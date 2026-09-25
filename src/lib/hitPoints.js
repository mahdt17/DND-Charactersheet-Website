const integer=value=>Math.max(0,Math.min(99999,Math.floor(Number(value)||0)));
export function temporaryHP(hp,amount,mode='grant') {
  const value=integer(amount),current=integer(hp.temp);
  if(!['grant','set','reduce','clear'].includes(mode))throw Error('Unknown temporary HP operation.');
  return {...hp,temp:mode==='grant'?Math.max(current,value):mode==='reduce'?Math.max(0,current-value):mode==='clear'?0:value};
}
