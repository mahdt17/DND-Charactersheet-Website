import React,{useMemo,useState} from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';
import {recordSpellbookCampaignAcquisition35,spellbookCampaignSpellCandidates35,spellAcquisitionProfile35} from './lib/spellAcquisition35';

export default function WizardSpellbookAcquisition35({char,classId,spells=[],patch}){
  const [open,setOpen]=useState(false),[selectedKey,setSelectedKey]=useState(''),[origin,setOrigin]=useState('copied-spellbook'),[sourceNote,setSourceNote]=useState(''),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('');
  const profile=spellAcquisitionProfile35(classId),className=profile?.className||'Spellbook caster';
  const candidates=useMemo(()=>spellbookCampaignSpellCandidates35(char,classId,spells),[char,classId,spells]);
  const selected=candidates.find(spell=>keyOf(spell)===selectedKey)||null;
  if(!open)return <button type="button" className="l-button" onClick={()=>{setOpen(true);setError('');}}>Add spell to spellbook</button>;
  const save=()=>{
    try{
      const next=recordSpellbookCampaignAcquisition35(char,classId,selected,{
        origin,sourceNote,confirmed,
        campaignTimeNote:'Campaign study/transcription requirements confirmed by the user'
      });
      patch({
        spellAcquisition35:next.spellAcquisition35,
        spellAcquisition35Incomplete:next.spellAcquisition35Incomplete,
        spells:next.spells
      });
      setSelectedKey('');setSourceNote('');setConfirmed(false);setError('');setOpen(false);
    }catch(e){setError(e.message);}
  };
  return <section aria-label={`${className} campaign spellbook acquisition`} className="feature-detail">
    <div className="l-section-head"><h3>Add spell to spellbook</h3><button type="button" className="l-button" onClick={()=>setOpen(false)}>Cancel</button></div>
    <p className="l-notice">Record a spell this {className} acquired during play. Confirm the source, study/check, campaign time, and transcription requirements at your table. This does not automatically spend gold, consume a scroll, or advance campaign time.</p>
    <SpellPicker label="Spell to add to spellbook" spells={candidates} selected={selectedKey?[selectedKey]:[]} limit={1} onToggle={spell=>setSelectedKey(selectedKey===keyOf(spell)?'':keyOf(spell))}/>
    <label className="l-field"><span>Acquisition source</span><select aria-label="Acquisition source" value={origin} onChange={e=>setOrigin(e.target.value)}>
      <option value="copied-spellbook">Copied from another spellbook</option>
      <option value="copied-scroll">Copied from a scroll</option>
      <option value="independent-research">Independent research</option>
      <option value="manual-source">Other table-approved source</option>
    </select></label>
    <label className="l-field"><span>Spell source note</span><input aria-label="Spell source note" value={sourceNote} onChange={e=>setSourceNote(e.target.value)} placeholder="Where did this spell come from?"/></label>
    <label className="l-check"><input aria-label="Campaign requirements completed" type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> Campaign requirements completed</label>
    {error&&<p className="l-notice" role="alert">{error}</p>}
    <button type="button" className="l-button primary" disabled={!selected||!sourceNote.trim()||!confirmed} onClick={save}>Record spellbook acquisition</button>
  </section>;
}
