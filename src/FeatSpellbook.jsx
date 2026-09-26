import React,{useState} from 'react';
import {featMagicState,featMagicSpells,featMagicKey,resolveFeatSpell} from './lib/featMagic';
import {featCastOptions,spendFeatCast} from './lib/featCasting';
import {spellPlan,criticalDice} from './lib/play';
import {effectiveAbilities} from './CharacterManager';
import {modifier,signed,rollDice} from './lib/rules';
import FeatMagicChoices from './FeatMagicChoices';
import Dialog from './Dialog';

export default function FeatSpellbook({char,patch,show,roll}){
 const [cast,setCast]=useState(null),[choice,setChoice]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const feats=(char.feats||[]).filter(f=>featMagicState(f,char).supported),spells=featMagicSpells(char);
 if(!feats.length)return null;
 const options=cast?featCastOptions(char,cast):[],option=options.find(o=>`${o.pool}:${o.level}`===choice)||options[0];
 const mod=cast?modifier(effectiveAbilities(char)[cast.featAbility]):0,pb=2+Math.floor((char.level-1)/4),plan=cast?spellPlan(cast,char,option?.level||cast.level,mod):null;
 function open(s){setCast(s);const first=featCastOptions(char,s)[0];setChoice(first?`${first.pool}:${first.level}`:'');setError('');}
 function perform(){try{
  const canonical=resolveFeatSpell(char,cast);if(!canonical)throw Error('The feat no longer grants this spell.');
  const values=spendFeatCast(char,canonical,option||{});
  const rolls=(plan?.rolls||[]).filter(r=>!/^\d+$/.test(r.expression));for(const r of rolls){rollDice(r.expression,'normal',()=>0);if(plan?.attack&&/damage/i.test(r.label))rollDice(criticalDice(r.expression),'normal',()=>0);}
  for(let n=0;n<(plan?.attack?plan.count:1);n++){const hit=plan?.attack?roll(`1d20${signed(pb+mod)}`,`${cast.name} · feat spell attack`,{kind:'attack'}):null;for(const r of rolls)roll(hit&&hit.total-hit.bonus===20&&/damage/i.test(r.label)?criticalDice(r.expression):r.expression,`${cast.name} · ${r.label}`,{kind:'damage'});}
  patch({...values,...(cast.concentration?{concentration:cast.name}:{})});setNotice(`${cast.name} cast${option.pool==='feat'?' using its feat use':option.pool==='cantrip'?'':` using a level ${option.level} ${option.pool==='pact'?'Pact Magic ':''}slot`}.`);setCast(null);
 }catch(e){setError(e.message);}}
 return <section aria-label="Feat spells"><h2>Feat spells</h2><p>Feat uses recover on a Long Rest. Class spell slots remain separate.</p>
 {feats.map(f=><details className="feature-detail" key={featMagicKey(f)} open={!featMagicState(f,char).valid}><summary>{f.name} · spell choices</summary><FeatMagicChoices feat={f} char={char} onChange={next=>patch({feats:char.feats.map(x=>x===f?next:x)})}/></details>)}
 {notice&&<p role="status">{notice}</p>}<div className="spell-table">{spells.map(s=>{const ability=modifier(effectiveAbilities(char)[s.featAbility]);return <div className="spell-item" key={`${s.featGrantId}:${s.catalogId}`}><button className="spell-name" onClick={()=>show(s)}><strong>{s.name}</strong><small>{s.featSource} · {s.featAbility.toUpperCase()} · DC {8+pb+ability} · Attack {signed(pb+ability)}{s.level>0?` · Feat use ${char.featSpellUses?.[s.featUseKey]?0:1}/1`:' · Cantrip'}</small></button><button className="l-button" disabled={!featCastOptions(char,s).length} onClick={()=>open(s)}>Cast feat spell</button></div>;})}</div>
 {cast&&<Dialog title={`Cast ${cast.name} from ${cast.featSource}`} onClose={()=>setCast(null)}><label className="l-field"><span>Casting resource</span><select aria-label="Casting resource" value={option?`${option.pool}:${option.level}`:''} onChange={e=>setChoice(e.target.value)}>{options.map(o=><option key={`${o.pool}:${o.level}`} value={`${o.pool}:${o.level}`}>{o.pool==='cantrip'?'Cantrip · no resource':o.pool==='feat'?'Feat use · 1 available':`${o.pool==='pact'?'Pact Magic':'Spell slot'} level ${o.level} · ${o.remaining} available`}</option>)}</select></label><p>{plan?.notes}</p>{error&&<p role="alert">{error}</p>}<button className="l-button primary" disabled={!option} onClick={perform}>Cast using selected resource</button><button className="l-button" onClick={()=>setCast(null)}>Cancel casting</button></Dialog>}
 </section>;
}
