import React,{useId} from 'react';
import {languagePlan,chosenLanguages} from './lib/languages';

export default function LanguageChoices({draft,intelligence,patch}) {
  const plan=languagePlan(draft,intelligence),selected=chosenLanguages(plan,draft.languageChoices);
  const listPrefix=useId(),edition=draft.ruleset==='custom'?(draft.mechanics||'2014'):(draft.ruleset||'2014');
  return <section className="language-choices" aria-label="Starting languages"><h3>Languages you know</h3>
    {plan.manual?<><p>Use your race and class source to confirm automatic languages and any allowed choices. Record the agreed languages here.</p><label className="l-field"><span>Languages from your source or DM ruling</span><input value={draft.manualLanguages||''} onChange={e=>patch({manualLanguages:e.target.value})} placeholder="Separate languages with commas"/></label></>:<>
      <p>Automatically known: {plan.automatic.map(x=>`${x.name} (${x.source})`).join(' · ')||'None'}</p>
      {edition==='2014'&&<label className="l-check"><input type="checkbox" checked={!!draft.allowExoticLanguages} onChange={e=>patch({allowExoticLanguages:e.target.checked})}/> My DM permits exotic or secret language choices</label>}
      {plan.groups.map(g=><div key={g.id}><p><strong>{g.source}</strong> grants {g.count} additional {g.count===1?'language':'languages'}. Type to search; choose each once.</p><div className="form-grid">{Array.from({length:g.count},(_,i)=>{
        const listId=`${listPrefix}-${g.id}-${i}`,value=draft.languageChoices?.[g.id]?.[i]||'',invalid=!!value&&!selected.choices[g.id][i];
        return <label className="l-field" key={i}><span>{g.source} language {i+1}</span><input aria-label={`${g.source} language ${i+1}`} list={listId} autoComplete="off" placeholder="Search or choose a language" value={value} aria-invalid={invalid} aria-describedby={invalid?`${listId}-error`:undefined} onChange={e=>{const values=[...(draft.languageChoices?.[g.id]||[])];values[i]=e.target.value;patch({languageChoices:{...draft.languageChoices,[g.id]:values}});}}/><datalist id={listId}>{g.options.filter(n=>!selected.names.includes(n)||selected.choices[g.id][i]===n).sort().map(n=><option key={n} value={n}/>)}</datalist>{invalid&&<small id={`${listId}-error`}>Choose an allowed language that you do not already know.</small>}</label>;
      })}</div></div>)}
      {!plan.groups.length&&<p>Your starting features do not grant additional language choices.</p>}
      {edition==='3.5'&&<p className="l-muted">Bonus choices use your starting Intelligence modifier and your race’s allowed list. A Barbarian begins unable to read or write unless another class or skill training grants literacy.</p>}
      <p role="status">{selected.complete?'All language choices complete.':'Choose the remaining languages to continue.'}</p>
    </>}
  </section>;
}
