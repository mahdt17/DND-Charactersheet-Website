// Pure helpers shared by casting UI and regression tests.
export function availableCastSlots(spellLevel, slots, used = {}) {
  return slots.flatMap((count, index) => index + 1 >= spellLevel && count > (used[index + 1] || 0)
    ? [{ level:index + 1, remaining:count - (used[index + 1] || 0) }] : []);
}
function scaledValue(table, level) {
  if (!table) return null;
  const key = Object.keys(table).map(Number).filter(n => n <= level).sort((a,b) => b-a)[0];
  return key == null ? null : table[key];
}
export function diceExpression(value, modifier = 0) {
  if (typeof value !== 'string') return null;
  const expression = value.replace(/MOD/g, String(modifier)).replace(/\s/g, '').replace(/\+-/g, '-');
  return /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i.test(expression) ? expression : null;
}
export function criticalDice(expression) {
  return expression.replace(/^(\d+)d/i, (_, count) => `${Number(count)*2}d`);
}
export function spellRollPlan(spell, slotLevel, characterLevel, modifier = 0) {
  const damages = Array.isArray(spell.damage) ? spell.damage : spell.damage ? [spell.damage] : [];
  const damage = damages.map(d => ({
    expression:diceExpression(scaledValue(d.damage_at_slot_level,slotLevel) ?? scaledValue(d.damage_at_character_level,characterLevel),modifier),
    label:d.damage_type?.name || 'damage'
  })).filter(d => d.expression);
  const healing = diceExpression(scaledValue(spell.heal_at_slot_level,slotLevel),modifier);
  let attacks = spell.attack_type ? 1 : 0;
  if (spell.index === 'eldritch-blast') attacks = 1 + [5,11,17].filter(n => characterLevel >= n).length;
  if (spell.index === 'scorching-ray') attacks = Math.max(3,slotLevel+1);
  return { attacks, damage, healing };
}
export function exhaustionLevel(character) {
  const conditions = Array.isArray(character.conditions) ? character.conditions : String(character.conditions || '').split(',').map(c=>c.trim());
  const legacy = conditions.some(c=>c.toLowerCase() === 'exhaustion') ? 1 : 0;
  return Math.max(0,Math.min(6,Math.floor(Number(character.exhaustion) || legacy)));
}
export const exhaustionEffects2014 = [
  'Disadvantage on ability checks.',
  'Speed is halved.',
  'Disadvantage on attack rolls and saving throws.',
  'Hit point maximum is halved.',
  'Speed becomes 0.',
  'Death.'
];
