import {featMagicState,applyFeatAbilityIncrease} from './featMagic.js';

export function featSpellNotes(c,s){
 const result=[];
 for(const f of c.feats||[]){
  const state=featMagicState(f,c);if(!state.valid)continue;
  if(state.profile?.kind==='sniper'&&(s.edition||c.ruleset)==='2014'&&(s.attack_type||/\b(?:ranged|melee) spell attack\b/i.test(s.description||s.desc?.join(' ')||''))){
   const feet=String(s.range||'').match(/^(\d+)\s+(?:feet|ft\.?)$/i);
   result.push(`Spell Sniper: ${feet?`${Number(feet[1])*2} feet range`:'double this attack spell’s range'}; ignore half and three-quarters cover.`);
  }
  if(state.profile?.kind==='artificer'&&(s.edition||c.ruleset)==='2014'&&(s.featAbility||c.castingAbility)==='int')result.push(`Artificer Initiate: ${f.magicChoices.tool} can be your focus for this Intelligence spell.`);
 }
 return [...new Set(result)];
}
export function featMagicActions(c,abilities){
 return (c.feats||[]).flatMap(f=>{
  const state=featMagicState(f,c);if(!state.valid)return [];
  if(state.profile?.kind==='telekinetic'){
   const score=abilities?.[state.ability]??applyFeatAbilityIncrease(c,state.ability,(Number(c.abilities?.[state.ability])||10)+(Number(c.abilityBonuses?.[state.ability])||0)),dc=8+2+Math.floor(((c.level||1)-1)/4)+Math.floor((score-10)/2);
   return [{name:'Telekinetic shove',description:`Bonus action: one visible creature within 30 feet makes a DC ${dc} Strength save or moves 5 feet toward or away from you. It can choose to fail. No feat spell use is spent.`}];
  }
  if(state.profile?.kind==='telepathic')return [{name:'Telepathic speech',description:'Speak mentally to a visible creature within 60 feet in a language you know. It must understand that language. This does not let it reply telepathically.'}];
  return [];
 });
}
