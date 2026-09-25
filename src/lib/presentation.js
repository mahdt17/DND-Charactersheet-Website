export const diceStyles=[
  {id:'emberforge',name:'Emberforge',description:'Obsidian red · molten gold',body:'#922c28',edge:'#f9bd68',ink:'#fff3ce',glow:'#ed7337',pattern:'veins'},
  {id:'moonstone',name:'Moonstone',description:'Glacial blue · silver',body:'#b6d8ea',edge:'#effaff',ink:'#142d49',glow:'#91d8ff',pattern:'stars'},
  {id:'verdant',name:'Verdant',description:'Jade green · ancient brass',body:'#196d59',edge:'#e6c87e',ink:'#fff3cc',glow:'#59cfa4',pattern:'veins'},
  {id:'voidglass',name:'Voidglass',description:'Amethyst · astral teal',body:'#5f398e',edge:'#87e7e5',ink:'#f5ecff',glow:'#be87ff',pattern:'stars'},
  {id:'royal-ivory',name:'Royal Ivory',description:'Aged ivory · engraved gold',body:'#e7d4a9',edge:'#9c703b',ink:'#392b22',glow:'#e7bf76',pattern:'engraved'},
];
export const presentationDefaults={backgrounds:true,animation:true,diceStyle:'emberforge'};
export function normalizePresentation(value={}) {
  return {backgrounds:typeof value?.backgrounds==='boolean'?value.backgrounds:true,
    animation:typeof value?.animation==='boolean'?value.animation:true,
    diceStyle:diceStyles.some(s=>s.id===value?.diceStyle)?value.diceStyle:'emberforge'};
}
export function readPresentation() {
  try{return normalizePresentation(JSON.parse(localStorage.getItem('ledger-presentation')));}catch{return {...presentationDefaults};}
}
export function writePresentation(value) {
  try{localStorage.setItem('ledger-presentation',JSON.stringify(normalizePresentation(value)));}catch{/* Session preferences still work when storage is unavailable. */}
}

// The renderer consumes existing results; it never rolls or changes game dice.
export function visualDice(results,limit=18) {
  const dice=[];
  for(const result of results) {
    const sides=Number(String(result.expression).match(/d(\d+)/i)?.[1]);
    for(const [i,value] of result.rolls.entries()) {
      const base={id:`${result.id}:${i}`,sides,value,rollId:result.id};
      if(sides===100){const n=value%100;dice.push({...base,id:base.id+':tens',sides:10,percentile:'tens',value:Math.floor(n/10)},{...base,id:base.id+':units',sides:10,percentile:'units',value:n%10});}
      else dice.push(base);
    }
  }
  return {dice:dice.slice(0,limit),total:dice.length};
}
