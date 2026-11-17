import React from 'react';
import {arcaneArcherLevel,equippedImbueBows} from './lib/arcaneArcher';

export default function ArcaneArcherTools({char,patch}) {
  const level=arcaneArcherLevel(char);
  if(!level)return null;
  const state=char.arcaneArcher||{};
  return <section className="l-panel section-spaced" aria-label="Arcane Archer">
    <h3>Enhance Arrow</h3>
    <p>Mundane arrows are magical and gain +1 to attack and damage. Use the highest applicable bonus.</p>
    <label className="l-check"><input type="checkbox" checked={!!state.magicalAmmunition} onChange={event=>patch({arcaneArcher:{...state,magicalAmmunition:event.target.checked}})}/>Using magical ammunition</label>
    {equippedImbueBows(char).map(bow=><label key={bow.id} className="l-field">
      {bow.name} existing magic bonus
      <select value={state.bowBonuses?.[bow.id]??bow.magicBonus??0} onChange={event=>patch({arcaneArcher:{...state,bowBonuses:{...state.bowBonuses,[bow.id]:Number(event.target.value)}}})}>
        <option value={0}>None</option><option value={1}>+1</option><option value={2}>+2</option><option value={3}>+3</option>
      </select>
    </label>)}
    {level>=2&&<p>To use Imbue Arrow, open an eligible area spell in Spells and select Cast through an arrow.</p>}
  </section>;
}
