import {characterClasses} from './advancement.js';
import {expandedSubclassRows,expandedFeatureUnlocked,expandedSubclassContext} from './expandedSubclasses.js';
import {retainsOwnFeatures} from './subclassState.js';
export function addDamageBonus(expression,bonus){const text=String(expression).replace(/\s/g,''),match=text.match(/^((?:\d+d\d+)(?:\+\d+d\d+)*)([+-]\d+)?$/i);if(match){const total=Number(match[2]||0)+bonus;return `${match[1]}${total?`${total>0?'+':''}${total}`:''}`;}if(/^\d+$/.test(text))return String(Number(text)+bonus);throw Error('Use a supported damage expression.');}
export const isPotentSpellcasting=(record,passive)=>record.startsWith('2014:subclass:cleric:')&&passive.feature==='Potent Spellcasting'&&passive.kind==='cantrip-damage-bonus';
export function applyPotentSpellcasting(c,spell,plan){
 if(!plan?.rolls||spell?.level!==0||spell.featGrantId||spell.featSpellGrant||!retainsOwnFeatures(c))return plan;
 const owner=spell.castingClassId||characterClasses(c)[0]?.catalogId;
 const p=expandedSubclassRows(c).find(p=>p.row.catalogId===owner&&p.row.name==='Cleric'&&(p.mechanics?.passives||[]).some(x=>isPotentSpellcasting(p.record.id,x)&&expandedFeatureUnlocked(p,x)));
 if(!p)return plan;const bonus=expandedSubclassContext(c,p.row).wis;
 return {...plan,rolls:plan.rolls.map(r=>!/damage/i.test(r.label)||!bonus?r:{...r,expression:addDamageBonus(r.expression,bonus)}),notes:[plan.notes,`Potent Spellcasting adds ${bonus} to Cleric cantrip damage.`].filter(Boolean).join(' ')};
}

// One bonus applies to one damage roll, even when an attack spell has multiple rays.
export function applyEmpoweredEvocation(character, spell, plan) {
  if (!plan?.rolls || plan.rolls.some(roll => roll.empoweredEvocation) || !retainsOwnFeatures(character)) return plan;
  const school = String(spell?.school?.name || spell?.school || '').toLowerCase();
  if (school !== 'evocation' || spell.featGrantId || spell.featSpellGrant || (spell.edition && spell.edition !== '2014')) return plan;

  const ownerId = spell.castingClassId || characterClasses(character)[0]?.catalogId;
  const evoker = expandedSubclassRows(character).find(profile =>
    profile.row.catalogId === ownerId &&
    profile.record.id === '2014:subclass:wizard:evocation' &&
    profile.record.features.some(feature =>
      feature.name === 'Empowered Evocation' && expandedFeatureUnlocked(profile, feature)
    )
  );
  const damageIndex = plan.rolls.findIndex(roll => /damage/i.test(roll.label));
  if (!evoker || damageIndex < 0) return plan;

  const bonus = Math.max(1, expandedSubclassContext(character, evoker.row).int);
  const rolls = [...plan.rolls];
  rolls[damageIndex] = {...rolls[damageIndex], oncePerCastBonus: bonus, empoweredEvocation: true};
  return {
    ...plan,
    rolls,
    notes: [plan.notes, 'Add this bonus to one damage roll of this Wizard evocation spell.'].filter(Boolean).join(' ')
  };
}
