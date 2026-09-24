import React from 'react';

export default function ClassFeatureChoices({plan,picks,onChange}) {
  if(!plan.groups.length)return null;
  return <section aria-label="Class feature choices"><h3>Class feature choices</h3>
    {plan.groups.map(g=><fieldset className="feature-choice-group" key={g.id}><legend>{g.className} {g.level} · {g.label}</legend>
      <p>Choose {g.required}{g.kind==='expertise'?' eligible proficiencies to gain Expertise':g.kind==='languages'?' new languages':' new skill proficiencies'}. {g.selected.length} selected.</p>
      {g.required<g.count&&<p className="l-notice">Only {g.required} eligible options remain. Already learned training is preserved.</p>}
      <div className="skill-picker-grid">{g.options.map(name=><label className="spell-picker-toggle" key={name}><input type="checkbox" aria-label={`${g.className} ${g.level} ${g.label}: ${name}`} checked={g.selected.includes(name)} disabled={!g.selected.includes(name)&&g.selected.length>=g.required} onChange={()=>onChange({...picks,[g.id]:g.selected.includes(name)?g.selected.filter(s=>s!==name):[...g.selected,name]})}/>{name}</label>)}</div>
      {g.selected.some(n=>!g.options.includes(n))&&<p role="alert">A selected option is no longer eligible. <button className="l-button" type="button" onClick={()=>onChange({...picks,[g.id]:[]})}>Clear invalid choices</button></p>}
    </fieldset>)}
  </section>;
}
