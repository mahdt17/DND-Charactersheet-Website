import {resolveFeatSpell,featSpellUsesSlots} from './featMagic.js';
import {availableSlots,spendSpellSlot} from './play.js';

export function featCastOptions(c,spell){
 const s=resolveFeatSpell(c,spell);if(!s)return [];
 if(s.level===0)return [{pool:'cantrip',level:0,remaining:Infinity}];
 return [...(!(c.featSpellUses?.[s.featUseKey])?[{pool:'feat',level:s.level,remaining:1}]:[]),...(featSpellUsesSlots(c,s)?availableSlots(c,s).map(x=>({...x,pool:x.pool||'standard'})):[])];
}
export function spendFeatCast(c,spell,option){
 const s=resolveFeatSpell(c,spell);
 if(!s||!featCastOptions(c,s).some(x=>x.pool===option.pool&&x.level===option.level))throw Error('This feat spell or casting use is no longer available.');
 return option.pool==='cantrip'?{}:option.pool==='feat'?{featSpellUses:{...c.featSpellUses,[s.featUseKey]:1}}:spendSpellSlot(c,s,option.level,option.pool);
}
