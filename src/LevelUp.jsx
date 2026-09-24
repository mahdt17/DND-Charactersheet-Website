import React,{useState} from 'react';
import {LevelUpWizard,effectiveAbilities} from './CharacterManager';
import EditionLevelUp from './EditionLevelUp';
import {classOptions} from './GuidedSetup';
import {useReferenceIndex} from './lib/referenceIndex';
import {characterClasses,contentKey,eligibleClass,advanceClass,prestige,spellsForClass} from './lib/advancement';
import {editionName} from './lib/editions';
import Requirements from './Requirements';
import Dialog from './Dialog';

export default function LevelUp({char,homebrew=[],onFinish,onCancel}) {
  const [flow,setFlow]=useState('existing'),[selected,setSelected]=useState(''),[query,setQuery]=useState(''),[confirmations,setConfirmations]=useState({}),[proceed,setProceed]=useState(false),[reviewed,setReviewed]=useState(false);
  const catalog=useReferenceIndex(['classes'],char.ruleset||'2014'),rows=characterClasses(char);
  const all=classOptions(char.ruleset||'2014',[...homebrew,...catalog.entries]);
  const options=flow==='existing'?rows.map(r=>({...r.definition,name:r.name,catalogId:r.catalogId,edition:r.edition})):all.filter(c=>(flow==='prestige')===prestige(c)&&!rows.some(r=>r.catalogId===contentKey(c)||(r.name===c.name&&r.edition===c.edition)));
  const record=options.find(c=>contentKey(c)===selected)||(flow==='existing'?options[0]:null),row=rows.find(r=>r.catalogId===contentKey(record||{}));
  const candidate=record&&(all.find(x=>contentKey(x)===contentKey(record))||record);
  const eligibilityCharacter={...char,classLevels:rows.map(r=>({...r,definition:all.find(x=>contentKey(x)===r.catalogId)||all.find(x=>x.name===r.name&&x.edition===r.edition)||r.definition}))};
  const result=candidate?eligibleClass(eligibilityCharacter,candidate,prestige(candidate)?'prestige':'normal',confirmations):{checks:[],allowed:false};
  function changeFlow(value){setFlow(value);setSelected('');setConfirmations({});setReviewed(false);}
  function finish(classResult) {
    const previousLevel=row?.level||0,oldMod=Math.floor((effectiveAbilities(char).con-10)/2),newMod=Math.floor((effectiveAbilities(classResult).con-10)/2);
    const delta=classResult.hp.max-char.hp.max+(newMod-oldMod)*(char.level-previousLevel);
    const advanced=advanceClass(eligibilityCharacter,candidate,{flow:prestige(candidate)?'prestige':'normal',confirmations,hpGain:delta,subclass:classResult.subclass});
    onFinish({...char,...classResult,...advanced,abilities:classResult.abilities,spells:classResult.spells,feats:classResult.feats,notes:classResult.notes,
      classDefinition:advanced.classLevels[0].definition,subclass:advanced.classLevels[0].subclass,
      advancementNotes:[...(char.advancementNotes||[]),{level:advanced.level,classId:contentKey(candidate),reviewed,notes:'Review class-specific proficiencies, resources, and spellcasting in the source.'}]});
  }
  if(proceed&&candidate) {
    const draft={...char,classLevels:undefined,className:candidate.name,classDefinition:candidate,subclass:row?.subclass||'',level:row?.level||0,castingAbility:row?.castingAbility||(row?.catalogId===rows[0]?.catalogId?char.castingAbility:undefined),hitDie:`d${candidate.hit_die||8}`,ruleset:char.ruleset==='custom'?'custom':candidate.edition,
      spells:spellsForClass(char,contentKey(candidate))};
    const existingSpells=new Set(draft.spells);
    const done=next=>finish({...next,spells:[...(char.spells||[]).filter(s=>!existingSpells.has(s)),...next.spells.map(s=>({...s,castingClassId:contentKey(candidate)}))]});
    return draft.ruleset==='2014'&&candidate.name!=='Artificer'?<LevelUpWizard char={draft} onCancel={()=>setProceed(false)} onFinish={done}/>:<EditionLevelUp char={draft} homebrew={homebrew} onCancel={()=>setProceed(false)} onFinish={done}/>;
  }
  return <Dialog title="Choose how to level up" wide onClose={onCancel}>
    <p>Character level {char.level} → {char.level+1}</p><p>{rows.map(r=>`${r.name} ${r.level}`).join(' · ')}</p>
    <label className="l-field"><span>Advancement path</span><select value={flow} onChange={e=>changeFlow(e.target.value)}><option value="existing">Continue existing class</option><option value="normal">Add another class</option><option value="prestige">Enter qualifying prestige class</option></select></label>
    {flow!=='existing'&&<label className="l-field"><span>Search level-up classes</span><input value={query} onChange={e=>setQuery(e.target.value)}/></label>}
    {catalog.loading&&<p role="status">Loading class catalog…</p>}{catalog.error&&<p role="alert">{catalog.error}<button className="l-button" onClick={catalog.retry}>Retry catalog</button></p>}
    <label className="l-field"><span>Class to advance</span><select value={record?contentKey(record):''} onChange={e=>{setSelected(e.target.value);setConfirmations({});setReviewed(false);}}><option value="">Choose a class</option>{options.filter(c=>!query||flow==='existing'||c.name.toLowerCase().includes(query.toLowerCase())).map(c=><option key={contentKey(c)} value={contentKey(c)}>{c.name} · {editionName(c.edition)} · {c.sourceBook||c.source||'SRD'}{rows.find(r=>r.catalogId===contentKey(c))?` · level ${rows.find(r=>r.catalogId===contentKey(c)).level}`:''}</option>)}</select></label>
    {candidate&&<><h3>{candidate.name} {(row?.level||0)+1}</h3><p>{candidate.description}</p>{candidate.sourceUrl&&<p><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Read class source and requirements</a></p>}<Requirements checks={result.checks} confirmations={confirmations} onConfirm={setConfirmations}/>
    {(!row||rows.length>1)&&<label className="l-check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I reviewed the class’s multiclass proficiencies, resources and spellcasting rules. I will record choices and any required slot conversion on my sheet.</label>}
    <p>Gain this class’s hit die. Total level and individual class levels are tracked separately. Class features follow the level gained; existing starting equipment and saving-throw proficiencies are retained.</p></>}
    <div className="l-toolbar"><button className="l-button" onClick={onCancel}>Cancel</button><button className="l-button primary" disabled={!result.allowed||((!row||rows.length>1)&&!reviewed)||catalog.loading} onClick={()=>setProceed(true)}>Continue to level choices</button></div>
  </Dialog>;
}
