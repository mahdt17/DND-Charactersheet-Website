import React from 'react';
import {languagePlan,chosenLanguages} from './lib/languages';

export default function LanguageChoices({draft,intelligence,patch}) {
  const plan=languagePlan(draft,intelligence),selected=chosenLanguages(plan,draft.languageChoices);
  return <section className="language-choices" aria-label="Starting languages"><h3>Languages you know</h3>
    {plan.manual?<><p>Use your race and class source to confirm automatic languages and any allowed choices. Record the agreed languages here.</p><label className="l-field"><span>Languages from your source or DM ruling</span><input value={draft.manualLanguages||''} onChange={e=>patch({manualLanguages:e.target.value})} placeholder="Separate languages with commas"/></label></>:<>
      <p>Automatically known: {plan.automatic.map(x=>`${x.name} (${x.source})`).join(' · ')||'None'}</p>
      {(draft.ruleset||'2014')==='2014'&&<label className="l-check"><input type="checkbox" checked={!!draft.allowExoticLanguages} onChange={e=>patch({allowExoticLanguages:e.target.checked})}/> My DM permits exotic or secret language choices</label>}
      {plan.groups.map(g=><div key={g.id}><p><strong>{g.source}</strong> grants {g.count} additional {g.count===1?'language':'languages'}. Choose each once.</p><div className="form-grid">{Array.from({length:g.count},(_,i)=><label className="l-field" key={i}><span>{g.source} language {i+1}</span><select aria-label={`${g.source} language ${i+1}`} value={selected.choices[g.id][i]} onChange={e=>{const values=[...selected.choices[g.id]];values[i]=e.target.value;patch({languageChoices:{...selected.choices,[g.id]:values}});}}><option value="">Choose an allowed language</option>{g.options.filter(n=>!selected.names.includes(n)||selected.choices[g.id][i]===n).sort().map(n=><option key={n}>{n}</option>)}</select></label>)}</div></div>)}
      {!plan.groups.length&&<p>Your starting features do not grant additional language choices.</p>}
      {draft.ruleset==='3.5'&&<p className="l-muted">Bonus choices use your starting Intelligence modifier and your race’s allowed list. A Barbarian begins unable to read or write unless another class or skill training grants literacy.</p>}
      <p role="status">{selected.complete?'All language choices complete.':'Choose the remaining languages to continue.'}</p>
    </>}
  </section>;
}
