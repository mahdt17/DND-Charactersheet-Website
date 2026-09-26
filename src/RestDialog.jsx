import {characterResources,restResources} from './lib/resources';
import React, {useState} from 'react';
import Modal from './Dialog';
import {mechanics,is35} from './lib/editions';
import {modifier,changeHP} from './lib/rules';
import {conditionEffects,conditionNames,exhaustionLevel} from './lib/play';
import {restSpellSlots} from './lib/multiclassCasting';
import {restFeatMagic} from './lib/featMagic';
import {hitDicePools,needsHitDiceReview,recoveryLimit,defaultRecovery,setSpentHitDice,spendHitDice,recoverHitDice} from './lib/hitDice';

function Count({label,value=0,max,onChange,disabled=false}) {
  return <label className="l-field"><span>{label}</span><input type="number" min="0" max={max} step="1" disabled={disabled} value={value} onChange={e=>onChange(Math.max(0,Math.min(max,Math.floor(Number(e.target.value)||0))))}/></label>;
}
export default function RestDialog({char,patch,roll,constitution,abilities,onClose}) {
  const [meditated,setMeditated]=useState(false),[restoreSorcery,setRestoreSorcery]=useState(false);
  const resources=characterResources(char,abilities);
  const [rest,setRest]=useState(is35(char)?'long':'short');
  const [spending,setSpending]=useState({}),[recovery,setRecovery]=useState(()=>defaultRecovery(char));
  const [recoverExhaustion,setRecoverExhaustion]=useState(false),[error,setError]=useState(''),[lastRoll,setLastRoll]=useState(null);
  const pools=hitDicePools(char),legacy=is35(char),revised=mechanics(char)==='2024',exhaustion=exhaustionLevel(char);
  const recoveryTotal=Object.values(recovery).reduce((n,v)=>n+v,0),limit=recoveryLimit(char);
  const excess=rest==='long'&&!revised&&recoveryTotal>limit;
  const needsReview=needsHitDiceReview(char);
  function spend(inline=false) {
    const results=[];
    const {healing,...counts}=spendHitDice(char,spending,modifier(constitution),(expression,label,options)=>{
      const result=roll(expression,label,{...options,inline});
      if(result)results.push({expression,label,total:result.total});
      return result;
    });
    if(inline)setLastRoll({healing,results});
    return {...counts,hp:changeHP(char.hp,healing,true),...(healing>0&&char.hp.current===0?{deathSaves:{success:0,failure:0}}:{})};
  }
  function rollSelected() {
    try {patch(spend(true));setSpending({});setError('');}catch(e){setError(e.message);}
  }
  function takeRest() {
    try {
      const conditions=conditionNames(char);
      if(legacy)patch({hp:changeHP(char.hp,char.level,true),slotsUsed:{},classSlotsUsed:{},...restFeatMagic(char,'long'),...restResources(char,'long',{},abilities),conditions:conditions.filter(c=>c!=='Fatigued'&&c!=='Exhausted')});
      else if(rest==='long')patch({
        ...(recoverExhaustion?{exhaustion:Math.max(0,exhaustion-1),conditions:conditions.filter(c=>c.toLowerCase()!=='exhaustion')}:{}),
        hp:{...char.hp,current:conditionEffects({...char,exhaustion:recoverExhaustion?Math.max(0,exhaustion-1):exhaustion}).maxHP,temp:0},
        ...restSpellSlots(char,'long'),...restFeatMagic(char,'long'),...recoverHitDice(char,recovery),
        concentration:null,deathSaves:{success:0,failure:0},
        ...restResources(char,'long',{meditated},abilities)
      });
      else patch({...spend(),...restSpellSlots(char,'short'),...restResources(char,'short',{meditated,restoreSorcery},abilities)});
      onClose();
    }catch(e){setError(e.message);}
  }
  function adjust(pool,value) {
    const values=setSpentHitDice(char,{[pool.key]:value});patch(values);
    setSpending({});setRecovery(defaultRecovery({...char,...values}));
  }
  return <Modal title="Take a rest" onClose={onClose}>
    <div className="l-toolbar">
      {!legacy&&<button className={`l-button ${rest==='short'?'primary':''}`} onClick={()=>{setRest('short');setError('');}}>Short rest</button>}
      <button className={`l-button ${rest==='long'?'primary':''}`} onClick={()=>{setRest('long');setRecovery(defaultRecovery(char));setError('');}}>Long rest</button>
    </div>
    <p>{legacy?'After a full night of qualifying rest, recover your level in hit points and reset prepared slots. Apply ability damage recovery and other specific rules manually.':rest==='long'?'After a qualifying long rest, restore HP and spell slots, recover hit dice according to your edition, and reset rest resources. Temporary HP and concentration are cleared.':'Spend available hit dice to heal. Pact Magic slots recover fully. Each resource recovers the amount shown on its counter.'}</p>
    {!legacy&&<>
      {resources.some(r=>r.meditation&&r.used>0)&&<label className="l-check"><input type="checkbox" checked={meditated} onChange={e=>setMeditated(e.target.checked)}/>Meditated for at least 30 minutes (recover Ki Points)</label>}
      {rest==='short'&&resources.some(r=>r.restoration&&r.used>0)&&<label className="l-check"><input type="checkbox" checked={restoreSorcery} disabled={!!char.sorcerousRestorationUsed} onChange={e=>setRestoreSorcery(e.target.checked)}/>Use Sorcerous Restoration{char.sorcerousRestorationUsed?' (already used until a long rest)':''}</label>}
      {needsReview&&<p className="l-notice">This older save recorded only a total of {char.hitDiceUsed} spent hit dice. They are provisionally assigned in class order. Review the spent dice below before resting.</p>}
      <details className="feature-detail" open={needsReview||undefined}>
        <summary>Review spent hit dice</summary>
        <p>Correct the spent count for each class if needed. Changes save immediately.</p>
        {pools.map(p=><Count key={p.key} label={`Spent hit dice — ${p.name} (${p.sides?`d${p.sides}`:'die unknown'})`} value={p.used} max={p.total} onChange={n=>adjust(p,n)}/>)}
        {needsReview&&<button className="l-button" onClick={()=>{patch(setSpentHitDice(char,{}));}}>Confirm spent dice</button>}
      </details>
      {rest==='short'?<>
        {pools.map(p=><Count key={p.key} label={`Hit dice to spend — ${p.name} (${p.sides?`d${p.sides}`:'die unknown'}; ${p.available} available)`} max={p.available} value={spending[p.key]||0} disabled={!p.sides} onChange={n=>setSpending({...spending,[p.key]:n})}/>)}
        {pools.some(p=>!p.sides)&&<p className="l-notice">A class hit die is missing. Record its source value before rolling that class’s dice.</p>}
        <button className="l-button" disabled={needsReview||!Object.values(spending).some(n=>n>0)} onClick={rollSelected}>Roll &amp; spend selected hit dice</button>
        {lastRoll&&<div role="status"><strong>Hit dice healing: {lastRoll.healing} HP</strong>{lastRoll.results.map((r,i)=><p key={i}>{r.label} · {r.expression}: {r.total} {modifier(constitution)<0?'−':'+'} {Math.abs(modifier(constitution))} Constitution = {Math.max(0,r.total+modifier(constitution))} HP</p>)}</div>}
        <p className="l-muted">Roll one at a time to decide whether to spend more. Each die adds your Constitution modifier (minimum 0 healing). Completing the rest also rolls any selected dice.</p>
      </>:<>
        {revised?<p>Recover all {pools.reduce((n,p)=>n+p.used,0)} spent hit dice.</p>:<>
          <p>Hit dice to recover: {recoveryTotal} / {limit} maximum.</p>
          {pools.map(p=><Count key={p.key} label={`Recover hit dice — ${p.name} (${p.sides?`d${p.sides}`:'die unknown'})`} value={recovery[p.key]||0} max={p.used} onChange={n=>setRecovery({...recovery,[p.key]:n})}/>)}
          {excess&&<p role="alert">Choose no more than {limit} hit dice in total.</p>}
        </>}
        {exhaustion>0&&<label className="spell-picker-toggle"><input type="checkbox" checked={recoverExhaustion} onChange={e=>setRecoverExhaustion(e.target.checked)}/> Reduce exhaustion by one (food and drink requirements met)</label>}
      </>}
    </>}
    {error&&<p role="alert">{error}</p>}
    <button className="l-button primary" disabled={!legacy&&(excess||needsReview)} onClick={takeRest}>Complete {rest} rest</button>
  </Modal>;
}
