import ClassFeatureChoices from './ClassFeatureChoices';
import {featureChoicePlan,applyFeatureChoices} from './lib/featureChoices';
import React,{useState} from 'react';
import {LevelUpWizard,effectiveAbilities} from './CharacterManager';
import EditionLevelUp from './EditionLevelUp';
import {classOptions} from './GuidedSetup';
import {useReferenceIndex} from './lib/referenceIndex';
import {characterClasses,contentKey,eligibleClass,advanceClass,prestige,spellsForClass} from './lib/advancement';
import {editionName} from './lib/editions';
import Requirements from './Requirements';
import Dialog from './Dialog';
import {multiclassTrainingPlan,trainingChoicesValid} from './lib/training';
import {annotateClassGrantKinds} from './lib/classIntegration';

export default function LevelUp({char,homebrew=[],onFinish,onCancel}) {
  const [flow,setFlow]=useState('existing'),[selected,setSelected]=useState(''),[query,setQuery]=useState(''),[confirmations,setConfirmations]=useState({}),[proceed,setProceed]=useState(false),[reviewed,setReviewed]=useState(false);
  const [trainingChoices,setTrainingChoices]=useState({}),[pending,setPending]=useState(null),[featurePicks,setFeaturePicks]=useState({}),[inheritanceChoice,setInheritanceChoice]=useState('');
  const featurePlan=pending?featureChoicePlan(pending,char,featurePicks):null;
  const catalog=useReferenceIndex(['classes','feats'],char.ruleset||'2014'),rows=characterClasses(char);
  const all=classOptions(char.ruleset||'2014',[...homebrew,...catalog.entries]);
  const options=flow==='existing'?rows.map(r=>({...r.definition,name:r.name,catalogId:r.catalogId,edition:r.edition})):all.filter(c=>(flow==='prestige')===prestige(c)&&!rows.some(r=>r.catalogId===contentKey(c)||(r.name===c.name&&r.edition===c.edition)));
  const record=options.find(c=>contentKey(c)===selected)||(flow==='existing'?options[0]:null),row=rows.find(r=>r.catalogId===contentKey(record||{}));
  const rawCandidate=record&&(all.find(x=>contentKey(x)===contentKey(record))||record);
  const candidate=rawCandidate&&annotateClassGrantKinds({...rawCandidate,...(inheritanceChoice?{inheritanceChoice}:{})},catalog.entries);
  const eligibilityCharacter={...char,classLevels:rows.map(r=>({...r,definition:all.find(x=>contentKey(x)===r.catalogId)||all.find(x=>x.name===r.name&&x.edition===r.edition)||r.definition}))};
  const result=candidate?eligibleClass(eligibilityCharacter,candidate,prestige(candidate)?'prestige':'normal',confirmations):{checks:[],allowed:false};
  const training=multiclassTrainingPlan(eligibilityCharacter,candidate);
  function changeFlow(value){setFlow(value);setSelected('');setConfirmations({});setReviewed(false);setTrainingChoices({});setInheritanceChoice('');}
  function finish(classResult) {
    const previousLevel=row?.level||0,oldMod=Math.floor((effectiveAbilities(char).con-10)/2),newMod=Math.floor((effectiveAbilities(classResult).con-10)/2);
    const delta=classResult.hp.max-char.hp.max+(newMod-oldMod)*(char.level-previousLevel);
    const advanced=advanceClass(eligibilityCharacter,candidate,{flow:prestige(candidate)?'prestige':'normal',confirmations,hpGain:delta,subclass:classResult.subclass,trainingChoices});
    const next={...char,...classResult,...advanced,abilities:classResult.abilities,spells:classResult.spells,feats:classResult.feats,notes:classResult.notes,
      classDefinition:advanced.classLevels[0].definition,subclass:advanced.classLevels[0].subclass,
      advancementNotes:[...(char.advancementNotes||[]),{level:advanced.level,classId:contentKey(candidate),reviewed,trainingMode:training.mode,notes:'Review feature choices, resources, and any manual spellcasting conversions in the source.'}]};
    const plan=featureChoicePlan(next,char);
    if(plan.groups.length){setPending(next);setFeaturePicks({});}else onFinish(applyFeatureChoices(next,char,{}));
  }
  if(proceed&&candidate) {
    const draft={...char,classLevels:undefined,className:candidate.name,classDefinition:candidate,subclass:row?.subclass||'',level:row?.level||0,castingAbility:row?.castingAbility||(row?.catalogId===rows[0]?.catalogId?char.castingAbility:undefined),hitDie:`d${candidate.hit_die||8}`,ruleset:char.ruleset==='custom'?'custom':candidate.edition,
      spells:spellsForClass(char,contentKey(candidate))};
    const existingSpells=new Set(draft.spells);
    const done=next=>finish({...next,spells:[...(char.spells||[]).filter(s=>!existingSpells.has(s)),...next.spells.map(s=>({...s,castingClassId:contentKey(candidate)}))]});
    return <><div hidden={!!pending}>{draft.ruleset==='2014'&&candidate.name!=='Artificer'?<LevelUpWizard char={draft} characterLevel={char.level+1} homebrew={homebrew} onCancel={()=>setProceed(false)} onFinish={done}/>:<EditionLevelUp char={draft} characterLevel={char.level+1} homebrew={homebrew} onCancel={()=>setProceed(false)} onFinish={done}/>}</div>{pending&&<Dialog title="Complete class feature choices" wide onClose={()=>setPending(null)}><ClassFeatureChoices plan={featurePlan} picks={featurePicks} onChange={setFeaturePicks}/><p>These choices apply when you save the level-up.</p><div className="l-toolbar"><button className="l-button" onClick={()=>setPending(null)}>Back to level review</button><button className="l-button primary" disabled={!featurePlan.valid} onClick={()=>onFinish(applyFeatureChoices(pending,char,featurePicks))}>Save level and choices</button></div></Dialog>}</>;

  }
  return <Dialog title="Choose how to level up" wide onClose={onCancel}>
    <p>Character level {char.level} → {char.level+1}</p><p>{rows.map(r=>`${r.name} ${r.level}`).join(' · ')}</p>
    <label className="l-field"><span>Advancement path</span><select value={flow} onChange={e=>changeFlow(e.target.value)}><option value="existing">Continue existing class</option><option value="normal">Add another class</option><option value="prestige">Enter qualifying prestige class</option></select></label>
    {flow!=='existing'&&<label className="l-field"><span>Search level-up classes</span><input value={query} onChange={e=>setQuery(e.target.value)}/></label>}
    {catalog.loading&&<p role="status">Loading class catalog…</p>}{catalog.error&&<p role="alert">{catalog.error}<button className="l-button" onClick={catalog.retry}>Retry catalog</button></p>}
    <label className="l-field"><span>Class to advance</span><select value={record?contentKey(record):''} onChange={e=>{setSelected(e.target.value);setConfirmations({});setReviewed(false);setTrainingChoices({});setInheritanceChoice('');}}><option value="">Choose a class</option>{options.filter(c=>!query||flow==='existing'||c.name.toLowerCase().includes(query.toLowerCase())).map(c=><option key={contentKey(c)} value={contentKey(c)}>{c.name} · {editionName(c.edition)} · {c.sourceBook||c.source||'SRD'}{rows.find(r=>r.catalogId===contentKey(c))?` · level ${rows.find(r=>r.catalogId===contentKey(c)).level}`:''}</option>)}</select></label>
    {candidate&&<><h3>{candidate.name} {(row?.level||0)+1}</h3>{candidate.inheritanceOptions?.length>1&&<label className="l-field"><span>Variant base class</span><select value={candidate.inheritanceChoice||inheritanceChoice} onChange={e=>setInheritanceChoice(e.target.value)}><option value="">Choose the base progression</option>{candidate.inheritanceOptions.map(option=>{const name=option.name||option;return <option key={name} value={name}>{name}</option>;})}</select></label>}<p>{candidate.description}</p>{candidate.sourceUrl&&<p><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Read class source and requirements</a></p>}<Requirements checks={result.checks} confirmations={confirmations} onConfirm={setConfirmations}/>
    {training.mode==='automatic'&&<section aria-label="Multiclass proficiencies"><h3>Multiclass proficiencies</h3><p>{training.grants.length?`Added on level-up: ${training.grants.map(p=>p.name).join(', ')}.`:'This class grants no fixed multiclass proficiencies.'}</p>{training.choices.map(choice=>{const selected=Array.isArray(trainingChoices[choice.id])?trainingChoices[choice.id]:trainingChoices[choice.id]?[trainingChoices[choice.id]]:[];return choice.required?<div className="creation-section" key={choice.id}><strong>{choice.label} · choose {choice.count||1}</strong><div className="skill-picker-grid">{choice.options.map(name=><button type="button" key={name} className={`skill-pill ${selected.includes(name)?'is-selected':''}`} onClick={()=>{const next=selected.includes(name)?selected.filter(x=>x!==name):selected.length<(choice.count||1)?[...selected,name]:selected;setTrainingChoices({...trainingChoices,[choice.id]:(choice.count||1)===1?(next[0]||''):next});}}>{selected.includes(name)?'✓ ':''}{name}</button>)}</div></div>:<p key={choice.id}>You already have every listed {choice.kind==='skills'?'skill':'proficiency'} option. No additional choice is available.</p>;})}</section>}
    {training.mode==='manual'&&<p className="l-notice">Review and record multiclass proficiencies from the source for this class combination.</p>}
    {(!row||rows.length>1)&&<label className="l-check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> I reviewed the class’s feature choices, resources and spellcasting rules. I will record any remaining choices or conversions on my sheet.</label>}
    <p>Gain this class’s hit die. Total level and individual class levels are tracked separately. Class features follow the level gained; existing starting equipment and saving-throw proficiencies are retained.</p></>}
    <div className="l-toolbar"><button className="l-button" onClick={onCancel}>Cancel</button><button className="l-button primary" disabled={!result.allowed||candidate?.inheritanceRequired||!trainingChoicesValid(training,trainingChoices)||((!row||rows.length>1)&&!reviewed)||catalog.loading} onClick={()=>setProceed(true)}>Continue to level choices</button></div>
  </Dialog>;
}
