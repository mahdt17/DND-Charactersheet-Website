import React,{useState,useRef} from 'react';
import {B,F,Num,Target} from './CampaignControls';
import {campaignProfile} from './lib/archivistCampaign';
import {resolveCampaignSpell,spellRule} from './lib/campaignSpellEffects';
import ChainTargetList from './ChainTargetList';
export function CampaignEffectResolver({char,patch,roll}){
 const cast=char.archivistCampaign?.lastCast,rule=cast?.rule||spellRule(char,cast?.spellId||'');
 const [target,setTarget]=useState('self'),[save,setSave]=useState(''),[damage,setDamage]=useState(''),[secondary,setSecondary]=useState(false),[area,setArea]=useState(false),[blocked,setBlocked]=useState(false),[cystSave,setCystSave]=useState(''),[intRoll,setInt]=useState(''),[chaRoll,setCha]=useState(''),[language,setLanguage]=useState('Common'),[error,setError]=useState('');
 const resolution=useRef(null);
 const [distanceFromPrimary,setDistanceFromPrimary]=useState('');
 const [damaging,setDamaging]=useState(false);
 const ordinaryChain=cast?.chain&&!rule.effect;
 if(!cast?.id||!rule.effect&&!ordinaryChain)return null;
 const queued=cast.targets?.find(t=>t.targetId===target);
 const isSecondary=cast.chain&&!area?!!queued?.secondary:secondary;
 const chainDamage=isSecondary&&(rule.damageCap||ordinaryChain&&Number.isFinite(cast.primaryDamage));
 const dice=Math.min(cast?.casterLevel??campaignProfile(char).archivist,rule.damageCap||0);
 const r=(expression,label,put)=>{const result=roll(expression,label);if(result)put(result.total);};
 return <section className="l-panel" aria-label="Spell effect resolution"><h3>Resolve {cast.name}</h3>{cast.chain&&<ChainTargetList char={char} patch={patch} selected={target} onSelect={id=>{setTarget(id);setSave('');setDamage('');setBlocked(false);setError('');requestAnimationFrame(()=>resolution.current?.focus());}}/>}<div ref={resolution} tabIndex={-1} role="group" aria-label={queued?'Resolve target: '+queued.name:'Target resolution'}>{ordinaryChain?<><p>Resolve the primary effect normally at the table, then record the damage it took.</p><p>DC {isSecondary&&!chainDamage?cast.dc-4:cast.dc}{chainDamage?' Dexterity save for half the secondary damage.':isSecondary?' for the secondary target. Use the original save ability or confirm it at the table.':'.'}</p></>:<><p>{rule.description} Conversion values can be changed in Class tools / Settings. Confirm range, same-plane access, protection, and eligible targets at the table.</p><p>DC {cast.dc}{isSecondary&&!rule.damageCap?' - 4 for secondary target':''}. Cyst-bearing primary targets apply -2 to necromancy saves; secondary damage uses a DEX save.</p></>}{(!cast.chain||area)&&<Target char={char} value={target} onChange={setTarget} self/>}{queued&&<p>Resolving {queued.secondary?'secondary':'primary'}: {queued.name}.</p>}
 {!ordinaryChain&&(rule.save||isSecondary)&&<Num label={`Target ${isSecondary&&rule.damageCap?'DEX':(rule.save?.toUpperCase()||'')} save total (before cyst penalty)`} value={save} min={-20} onChange={setSave}/>}
 {rule.damageCap&&(isSecondary&&cast.primaryDamage!=null?<p>Primary damage {cast.primaryDamage}. Apply {Math.floor(cast.primaryDamage/2)} on a failed Dexterity save or {Math.floor(cast.primaryDamage/4)} on a success.</p>:<><Num label="Rolled primary necrotic damage" value={damage} onChange={setDamage}/><B onClick={()=>r(`${dice}d6`,cast.name+' damage',setDamage)}>Roll {dice}d6 necrotic damage</B></>)}
 {ordinaryChain&&!isSecondary&&<><label><input type="checkbox" checked={damaging} onChange={e=>setDamaging(e.target.checked)}/>This spell deals damage</label>{damaging&&<Num label="Damage dealt to the primary target" value={damage} onChange={setDamage}/>}</>}
 {ordinaryChain&&isSecondary&&<><Num label={chainDamage?'Target Dexterity save total':'Target save total'} value={save} onChange={setSave} min={-20}/>{chainDamage&&<p>Primary damage {cast.primaryDamage}. Apply {Math.floor(cast.primaryDamage/2)} on a failed save or {Math.floor(cast.primaryDamage/4)} on a success.</p>}</>}
 {cast.erupted&&<><label><input type="checkbox" checked={area} onChange={e=>setArea(e.target.checked)}/>Eruption splash target within 20 feet</label>{area&&<><Num label="Splash DEX save total" value={save} min={-20} onChange={setSave}/><Num label="Splash CON save against cyst" value={cystSave} min={-20} onChange={setCystSave}/></>}</>}
 {rule.effect==='awaken'&&<><Num label="Awakening 3d6 Intelligence" value={intRoll} min={3} max={18} onChange={setInt}/><B onClick={()=>r('3d6','Awakening Intelligence',setInt)}>Roll awakening Intelligence</B><Num label="Awakening 1d3 Charisma increase" value={chaRoll} min={1} max={3} onChange={setCha}/><B onClick={()=>r('1d3','Awakening Charisma',setCha)}>Roll awakening Charisma</B><F label="Awakened language"><input value={language} onChange={e=>setLanguage(e.target.value)}/></F></>}
 <label><input type="checkbox" checked={blocked} onChange={e=>setBlocked(e.target.checked)}/>Protection, immunity or blocked access prevents this effect</label>
 <B disabled={cast.chain&&!area&&(!queued||queued.status==='resolved'||isSecondary&&!cast.resolved?.length)} onClick={()=>{try{patch(resolveCampaignSpell(char,target,{save,damage,damaging,secondary:isSecondary,distanceFromPrimary:queued?.distanceFromPrimary??distanceFromPrimary,area,cystSave,blocked,intRoll,chaRoll,language}));setError('');setSave('');setDamage('');setBlocked(false);}catch(e){setError(e.message);}}}>Apply spell effect</B>
 {error&&<p role="alert">{error}</p>}{cast.lastResult&&<p role="status">{cast.lastResult}</p>}</div></section>;
}

