import React from 'react';
import {elvenAccuracyAbilities,elvenAccuracyAbility,isElvenAccuracyFeat} from './lib/featAbilityIncrease';

export default function FeatAbilityChoices({feat,char,onChange}){
 if(!isElvenAccuracyFeat(feat,char))return null;
 const choices=feat.abilityChoices||{};
 const patch=values=>onChange({...feat,abilityChoices:{...choices,...values}});
 return <section aria-label="Elven Accuracy ability increase">
  <label className="l-field"><span>Elven Accuracy ability</span>
   <select aria-label="Elven Accuracy ability" value={elvenAccuracyAbility(feat)} onChange={e=>patch({ability:e.target.value})}>
    <option value="">Choose an ability</option>
    {Object.entries(elvenAccuracyAbilities).map(([key,name])=><option key={key} value={key}>{name}</option>)}
   </select>
  </label>
  <label className="l-check">
   <input type="checkbox" checked={choices.applyAbilityIncrease!==false} onChange={e=>patch({applyAbilityIncrease:e.target.checked})}/>
   Apply the feat’s +1 to the chosen ability (maximum 20). Turn off if already included in your base score.
  </label>
 </section>;
}
