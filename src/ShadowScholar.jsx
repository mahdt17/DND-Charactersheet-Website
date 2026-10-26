import React from 'react';
import {shadowScholarBackground,shadowScholarItems,shadowScholarStory} from './data/shadowScholar';
import {isShadowScholar,shadowScholarLanguage} from './lib/shadowScholar';

export default function ShadowScholar({char,patch}){
 if(!isShadowScholar(char))return null;
 return <section className="l-panel section-spaced" aria-label="Shadow Scholar background">
  <h3>Shadow Scholar</h3><p className="l-muted">Custom background · 2014 rules · Researcher from Sage</p><p>{shadowScholarBackground.blurb}</p>
  <p><strong>Skills:</strong> Stealth, Arcana</p><p><strong>Tool proficiency:</strong> Thieves' Tools</p>
  <label className="l-field"><span>Background language</span><select aria-label="Background language" value={shadowScholarLanguage(char)} onChange={e=>patch({shadowScholar:{...char.shadowScholar,language:e.target.value}})}><option>Draconic</option><option>Undercommon</option></select></label>
  <p className="l-muted">Draconic suits ancient magical texts; Undercommon emphasizes the shadow-hunter theme. Your racial languages are separate.</p>
  <h4>Researcher</h4><p>{shadowScholarBackground.feature[1]}</p>
  <details className="feature-detail"><summary>Starting equipment · 10 gp</summary><ul>{shadowScholarItems.map(item=><li key={item.name}>{item.name}</li>)}</ul><p>{shadowScholarItems.find(item=>item.name==='Mysterious letter').description}</p></details>
  <details className="feature-detail"><summary>Suggested personality</summary><p><strong>Personality trait:</strong> {shadowScholarStory.trait}</p><p><strong>Ideal — Knowledge:</strong> {shadowScholarStory.ideal}</p><p><strong>Bond:</strong> {shadowScholarStory.bond}</p><p><strong>Flaw:</strong> {shadowScholarStory.flaw}</p><p className="l-muted">These suggestions start in your editable character notes.</p></details>
 </section>;
}
