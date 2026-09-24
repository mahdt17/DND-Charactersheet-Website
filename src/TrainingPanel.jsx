import React from 'react';
import {recordedTraining} from './lib/training';
import {weaponAttacks} from './lib/rules';
import {is35} from './lib/editions';

export default function TrainingPanel({char,patch,abilities}) {
  const grants=recordedTraining(char),weapons=is35(char)?[]:weaponAttacks(char,abilities);
  const uniqueWeapons=[...new Map(weapons.map(w=>[w.equipmentIndex,w])).values()];
  return <section aria-label="Training and proficiencies">
    <h2>Training &amp; proficiencies</h2>
    {grants.length>0&&<><h3>Multiclass grants</h3>{[['armor','Armor'],['weapons','Weapons'],['tools','Tools'],['skills','Skills']].map(([kind,label])=>{
      const names=grants.filter(p=>p.kind===kind).map(p=>p.name);
      return names.length?<p key={kind}><strong>{label}:</strong> {names.join(', ')}</p>:null;
    })}</>}
    {uniqueWeapons.length>0&&<><h3>Equipped weapon training</h3><p>Class training applies automatically. Change a weapon below for additional training or a table ruling.</p>{uniqueWeapons.map(w=><label className="spell-picker-toggle" key={w.equipmentIndex}><input type="checkbox" checked={w.trained} onChange={e=>patch({weaponTrainingOverrides:{...char.weaponTrainingOverrides,[w.equipmentIndex]:e.target.checked}})}/>{w.name} proficiency</label>)}{Object.keys(char.weaponTrainingOverrides||{}).length>0&&<button className="l-button" onClick={()=>patch({weaponTrainingOverrides:{}})}>Use class weapon proficiencies</button>}</>}
    <details className="feature-detail"><summary>Additional training notes</summary>
      <p>Record armor, weapon and tool training here. Use the weapon controls above to change attack proficiency bonuses.</p>
      {[['armorProf','Armor training notes'],['weaponProf','Weapon training notes'],['toolProf','Tool training notes']].map(([key,label])=><label className="l-field" key={key}><span>{label}</span><textarea rows={2} value={char[key]||''} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    </details>
  </section>;
}
