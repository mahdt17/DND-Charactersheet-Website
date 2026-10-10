import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createCatalogService} from '../../src/lib/catalog.js';
import {requirements} from '../../src/lib/advancement.js';
import {annotateClassGrantKinds,removeClassProgression} from '../../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../../src/lib/featureChoices.js';
import ClassFeatureChoices from '../../src/ClassFeatureChoices.jsx';
import Requirements from '../../src/Requirements.jsx';
const classes=await createCatalogService({baseUrl:import.meta.env.BASE_URL}).load('3.5/classes');
const wizard=annotateClassGrantKinds(classes.find(c=>c.sourceId==='classes/wizard-99'),classes);
const grant={catalogId:'test:casting-feat-source',name:'Casting Feat Source',edition:'3.5',levelGrants:[{level:1,name:'Bonus Feat',choiceKind:'feat',choiceCount:1,choiceFeatType:'General'}]};
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',definition,level});
const base={ruleset:'3.5',classLevels:[row(wizard,3),row(grant,1)],abilities:{int:18},spells:[],feats:[],resources:[],actions:[],featureChoices:{}};
const gate={catalogId:'test:casting-gate',edition:'3.5',prerequisites:[{kind:'spells',text:'Ability to cast 3rd-level arcane spells.'}]};
const context={feats:[{catalogId:'test:advanced-magic',name:'Advanced Magic',edition:'3.5',featType:'General',prerequisites:gate.prerequisites}]};
function Harness(){
  const [character,setCharacter]=useState(()=>JSON.parse(localStorage.getItem('casting-entry-regression')||'null')||base),[picks,setPicks]=useState({});
  const previous={...character,classLevels:character.classLevels.filter(row=>row.catalogId===wizard.catalogId)};
  const plan=featureChoicePlan(character,previous,picks,context);
  const save=next=>{localStorage.setItem('casting-entry-regression',JSON.stringify(next));setCharacter(next);setPicks({});};
  return <main><h1>Casting entry regression</h1>
    <Requirements checks={requirements(gate,character)}/>
    <ClassFeatureChoices plan={plan} picks={picks} onChange={setPicks}/>
    <button onClick={()=>save({...character,classLevels:character.classLevels.map(r=>r.catalogId===wizard.catalogId?{...r,level:5}:r)})}>Advance Wizard to 5</button>
    <button disabled={!plan.valid} onClick={()=>save(applyFeatureChoices(character,previous,picks,context))}>Save feat</button>
    <button onClick={()=>save(removeClassProgression(character,wizard.catalogId))}>Remove Wizard</button>
    <ul aria-label="Owned feats">{character.feats.map(f=><li key={f.id}>{f.name}</li>)}</ul>
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
