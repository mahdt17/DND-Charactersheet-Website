const units={round:6,second:1,minute:60,hour:3600,day:86400};
export function durationSeconds(duration){
  const match=String(duration||'').trim().match(/^(?:concentration,?\s*)?(?:up to\s+)?(\d+)\s+(round|second|minute|hour|day)s?\.?$/i);
  return match?Number(match[1])*units[match[2].toLowerCase()]:null;
}
export function durationLabel(effect){
  const boundary={'start-next-turn':'Until the start of your next turn','end-next-turn':'Until the end of your next turn','end-turn':'Until the end of your turn'};
  if(boundary[effect.expires])return boundary[effect.expires];
  if(effect.remainingSeconds==null)return 'Until ended';
  const seconds=Math.ceil(effect.remainingSeconds);
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' · '+Math.ceil(seconds/6)+(seconds<=6?' round':' rounds');
}
