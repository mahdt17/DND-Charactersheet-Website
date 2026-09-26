import React,{useState} from 'react';
import FeatMagicChoices from './FeatMagicChoices';
import {featMagicState,changeFeatChoices} from './lib/featMagic';
import Dialog from './Dialog';
import CopyFeatRitual from './CopyFeatRitual';

export default function FeatMagicManager({feat,char,onChange}){
 const [draft,setDraft]=useState(null),[correction,setCorrection]=useState(false),[reason,setReason]=useState(''),[error,setError]=useState('');
 const state=featMagicState(feat,char);if(!state.supported)return null;
 const select=next=>{const s=featMagicState(next,char);onChange(s.valid&&s.complete?changeFeatChoices(char,feat,next):next);};
 if(!state.valid)return <FeatMagicChoices feat={feat} char={char} onChange={select}/>;
 const canReplace=state.profile.kind==='initiate'&&state.profile.edition==='2024'&&char.level>(feat.magicChoices?.changedLevel??feat.level??char.level);
 const moreRituals=state.profile.kind==='ritual'&&state.profile.edition==='2024'&&!state.complete;
 const open=correct=>{setDraft(structuredClone(feat));setCorrection(correct);setReason('');setError('');};
 function save(){try{onChange(changeFeatChoices(char,feat,draft,{correctionReason:correction?reason:''}));setDraft(null);}catch(e){setError(e.message);}}
 return <><p>{state.ability.toUpperCase()} · {state.spells.map(s=>s.name).join(', ')}</p>{canReplace&&<button className="l-button" onClick={()=>open(false)}>Replace one spell for this level</button>}{moreRituals&&<button className="l-button" onClick={()=>open(false)}>Choose newly unlocked rituals</button>}<CopyFeatRitual feat={feat} char={char} onChange={onChange}/><button className="l-button" onClick={()=>open(true)}>Correct feat setup</button>
 {draft&&<Dialog title={correction?'Correct feat setup':'Update feat spells'} onClose={()=>setDraft(null)}><FeatMagicChoices feat={draft} char={char} onChange={setDraft}/>{correction&&<label className="l-field"><span>Reason for this correction</span><input aria-label="Reason for this correction" value={reason} onChange={e=>setReason(e.target.value)}/><small>Records a setup correction without restoring spent casting uses.</small></label>}{error&&<p role="alert">{error}</p>}<button className="l-button primary" disabled={correction&&!reason.trim()} onClick={save}>Save feat choices</button></Dialog>}</>;
}
