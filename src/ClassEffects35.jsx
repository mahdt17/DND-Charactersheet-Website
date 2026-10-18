import React from 'react';
import {describeClassEffect35} from './lib/classIntegration';

export default function ClassEffects35({char}){
  const effects=(char?.classEffects35||[]).filter(effect=>effect?.sourceType==='class'&&effect?.automatic);
  if(!effects.length)return null;
  return <section data-class-effects35="true" aria-label="Structured class effects">
    <h3>Structured class effects</h3>
    <p className="l-muted">Current source-reviewed passive and conditional effects. Conditions are shown explicitly rather than assumed to apply to every roll.</p>
    {effects.map(effect=><details className="feature-detail" key={effect.id}>
      <summary>{effect.sourceFeatureName||effect.name}<span>{effect.sourceClassName}{effect.effectiveClassLevel?` · level ${effect.effectiveClassLevel}`:''}</span></summary>
      <p>{describeClassEffect35(effect)}</p>
      {effect.sourceUrl&&<p><a href={effect.sourceUrl} target="_blank" rel="noreferrer">Read class source</a></p>}
    </details>)}
  </section>;
}
