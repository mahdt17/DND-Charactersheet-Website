import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import ClassFeatureChoices from '../../src/ClassFeatureChoices.jsx';
import Requirements from '../../src/Requirements.jsx';
import {requirements} from '../../src/lib/advancement.js';
import {featureChoicePlan,applyFeatureChoices} from '../../src/lib/featureChoices.js';
import {removeClassProgression} from '../../src/lib/classIntegration.js';

const definition={catalogId:'test:sequential-feats',name:'Sequential Feats',edition:'3.5',levelGrants:[
  {level:1,name:'Bonus Feat',choiceKind:'feat',choiceCount:1,choiceLevels:[1,3],choiceFeatType:'Metamagic',description:'Choose a qualified metamagic feat at each milestone.'}
]};
const base={ruleset:'3.5',mechanics:'3.5',level:3,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:3,definition}],abilities:{str:10},feats:[{id:'manual',name:'Manual feat'}],actions:[],resources:[],featureChoices:{}};
const context={feats:[
  {catalogId:'test:foundation',name:'Foundation',edition:'3.5',featType:'Metamagic',prerequisites:[]},
  {catalogId:'test:advanced',name:'Advanced',edition:'3.5',featType:'Metamagic',prerequisites:[{kind:'feat',text:'Foundation'}]}
]};
const gate={name:'Two metamagic feats',edition:'3.5',prerequisites:[{kind:'feats',text:'Any two metamagic feats.'}]};
const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
function Harness(){
  const [character,setCharacter]=useState(()=>JSON.parse(localStorage.getItem('source-choice-regression')||'null')||base);
  const [picks,setPicks]=useState({});
  const plan=featureChoicePlan(character,null,picks,context);
  const save=next=>{localStorage.setItem('source-choice-regression',JSON.stringify(next));setCharacter(next);setPicks({});};
  return <main>
    <ClassFeatureChoices plan={plan} picks={picks} onChange={setPicks}/>
    <button disabled={!plan.valid} onClick={()=>save(applyFeatureChoices(character,null,picks,context))}>Save choices</button>
    <Requirements checks={requirements(gate,character)}/>
    <ul aria-label="Owned feats">{character.feats.map(feat=><li key={feat.id}>{feat.name}</li>)}</ul>
    <button onClick={()=>save(removeClassProgression({...character,level:4,classLevels:[...character.classLevels,survivor]},definition.catalogId))}>Remove source class</button>
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
