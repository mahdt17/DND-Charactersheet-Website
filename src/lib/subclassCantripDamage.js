import {characterClasses} from './advancement.js';
import {expandedSubclassRows,expandedFeatureUnlocked,expandedSubclassContext} from './expandedSubclasses.js';
import {retainsOwnFeatures} from './subclassState.js';
function addDamageBonus(expression,bonus){const text=String(expression).replace(/\s/g,''),match=text.match(/^((?:\d+d\d+)(?:\+\d+d\d+)*)([+-]\d+)?$/i);if(match){const total=Number(match[2]||0)+bonus;return `${match[1]}${total?`${total>0?'+':''}${total}`:''}`;}if(/^\d+$/.test(text))return String(Number(text)+bonus);throw Error('Use a supported damage expression for Potent Spellcasting.');}
export const isPotentSpellcasting=(record,passive)=>record.startsWith('2014:subclass:cleric:')&&passive.feature==='Potent Spellcasting'&&passive.kind==='cantrip-damage-bonus';
export function applyPotentSpellcasting(c,spell,plan){
 if(!plan?.rolls||spell?.level!==0||spell.featGrantId||spell.featSpellGrant||!retainsOwnFeatures(c))return plan;
 const owner=spell.castingClassId||characterClasses(c)[0]?.catalogId;
 const p=expandedSubclassRows(c).find(p=>p.row.catalogId===owner&&p.row.name==='Cleric'&&(p.mechanics?.passives||[]).some(x=>isPotentSpellcasting(p.record.id,x)&&expandedFeatureUnlocked(p,x)));
 if(!p)return plan;const bonus=expandedSubclassContext(c,p.row).wis;
 return {...plan,rolls:plan.rolls.map(r=>!/damage/i.test(r.label)||!bonus?r:{...r,expression:addDamageBonus(r.expression,bonus)}),notes:[plan.notes,`Potent Spellcasting adds ${bonus} to Cleric cantrip damage.`].filter(Boolean).join(' ')};
}
