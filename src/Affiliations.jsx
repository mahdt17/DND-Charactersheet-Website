import React,{useState} from 'react';
import {characterClasses,classCharacter} from './lib/advancement';
import {permittedSpells,spellSlotPools,keyOf} from './lib/editions';
import {ordinarySpellIdentity} from './lib/spellIdentity';
import {ranks,assignments,subjects,educationDC,trainingStatus,createInstitute,recordFame,castingLevel,studyLevels,claimStudy} from './lib/esotericTraining';
import {shadowArcherRoadmap} from './lib/shadowArcherPlan';
import {supportsInstitute} from './lib/instituteAccess.js';
import SpellPicker from './EditionSpellPicker';

function Field({label,children}) {
  return <label className="l-field"><span>{label}</span>{children}</label>;
}

function Roadmap({char}) {
  return <details><summary>Shadow Archer progression · levels 1–20</summary>
    <table><thead><tr><th>Level</th><th>Class taken</th><th>Milestone</th></tr></thead>
    <tbody>{shadowArcherRoadmap.map(([name,choice],i)=><tr key={i} aria-current={char.level===i+1?'step':undefined}><td>{i+1}</td><td>{name}</td><td>{choice}</td></tr>)}</tbody></table>
    <p>Start as a Fighter for Strength and Constitution saves. The two d8 prestige levels require DM approval. The entry score uses Fighter + Ranger + half Wizard levels, rounded down. Confirm Imbue Arrow targeting and the six-shot opening turn with your DM.</p>
  </details>;
}

function StudyAward({char,row,level,patch}) {
  const [picks,setPicks]=useState([]),[error,setError]=useState('');
  const model=classCharacter(char,row),owned=new Set(model.spells.map(ordinarySpellIdentity));
  const choices=permittedSpells(model).filter(s=>s.classes?.includes('Wizard')&&s.level>0&&s.level<=Math.ceil(level/2)&&!owned.has(ordinarySpellIdentity(s)));
  function save(){
    try {patch(claimStudy(char,row,level,picks));setPicks([]);setError('');}
    catch(e){setError(e.message);}
  }
  return <details><summary>Choose two spellbook additions · effective Wizard {level}</summary>
    <SpellPicker spells={choices} selected={picks.map(keyOf)} limit={2} label="Institute spellbook additions"
      onToggle={s=>setPicks(list=>list.some(p=>keyOf(p)===keyOf(s))?list.filter(p=>keyOf(p)!==keyOf(s)):[...list,s])}/>
    <button className="l-button" disabled={picks.length!==2} onClick={save}>Add both spells to spellbook</button>
    {error&&<p role="alert">{error}</p>}
  </details>;
}

function Institute({char,guild,save,patch}) {
  const t=guild.training,status=trainingStatus(char),events=t.events||[];
  const [kind,setKind]=useState('education'),[subject,setSubject]=useState('Arcana'),[total,setTotal]=useState('');
  const [note,setNote]=useState(''),[award,setAward]=useState('1'),[quest,setQuest]=useState(''),[error,setError]=useState('');
  const rows=characterClasses(char),wizard=rows.find(r=>r.name==='Wizard'&&r.edition==='2014'),ranger=rows.find(r=>r.name==='Ranger'&&r.edition==='2014');
  const checks=events.filter(e=>e.kind==='education'&&e.level===char.level).length;
  const remaining=char.level>=5&&char.level>t.joinedLevel?3-checks:0;
  const pools=spellSlotPools(char);
  function settings(values){save({...guild,training:{...t,...values}});}
  function record(event){
    try {save(recordFame(guild,char.level,{...event,id:crypto.randomUUID()}));setError('');setNote('');setTotal('');}
    catch(e){setError(e.message);}
  }
  return <section aria-label="Esoteric training">
    <h3>Esoteric training</h3><p><strong>{status.fame} Fame</strong> · {status.rank?.name||'Unranked'}{status.ascended?' · Arcane Ascension':''}</p>
    <Field label="Highest rank approved by your DM"><select value={t.approvedFame??''} onChange={e=>settings({approvedFame:e.target.value===''?null:Number(e.target.value)})}>
      <option value="">Membership only</option>{status.eligible.map(r=><option key={r.fame} value={r.fame}>{r.name}</option>)}</select></Field>
    <details><summary>Fame, ranks and casting rules</summary><table><thead><tr><th>Fame</th><th>Min. level</th><th>Rank</th><th>Reward</th></tr></thead><tbody>{ranks.map(r=><tr key={r.fame}><td>{r.fame}</td><td>{r.level}</td><td>{r.name}</td><td>{r.reward}</td></tr>)}</tbody></table>
      <p>Each rank replaces the previous reward. Training advances spell slots, learnable and copyable spell levels, and preparation limits. Class features, cantrips, hit dice and Arcane Recovery follow actual levels. Training requires DM approval under the proposed 2014 conversion.</p>
      <p>At Grandmaster, completing an approved Ascension quest replaces +3 Wizard / +1 Ranger with +4 Wizard / +0 Ranger.</p></details>
    <p>{wizard&&<>Wizard {wizard.level} → effective {castingLevel(char,'Wizard',wizard.level)}. </>}{ranger&&<>Ranger {ranger.level} → effective {castingLevel(char,'Ranger',ranger.level)}. </>}
    Highest pooled slot: {pools.standard.reduce((n,v,i)=>v?i:n,0)}.</p>
    <label className="l-check"><input type="checkbox" checked={!!t.bookAwards} onChange={e=>settings({bookAwards:e.target.checked})}/>DM approves two spellbook additions per new effective Wizard level</label>
    <label className="l-check"><input type="checkbox" checked={!!t.rangerKnown} onChange={e=>settings({rangerKnown:e.target.checked})}/>DM approves effective Ranger spells known</label>
    {wizard&&studyLevels(char,wizard.level).map(level=><StudyAward key={level} char={char} row={wizard} level={level} patch={patch}/>)}
    {Object.entries(char.instituteSpellAwards||{}).map(([level,names])=><p key={level}>Wizard {level} study · {names.join(', ')}</p>)}
    {status.rank?.fame===45&&<div>{t.ascensionQuest?<p>Completed Ascension quest · {t.ascensionQuest} <button className="l-button" onClick={()=>settings({ascensionQuest:''})}>Revoke Ascension</button></p>:<>
      <Field label="Completed Ascension quest"><input value={quest} onChange={e=>setQuest(e.target.value)}/></Field>
      <button className="l-button" disabled={!quest.trim()} onClick={()=>settings({ascensionQuest:quest.trim()})}>Record DM-approved Ascension</button></>}</div>}
    <h4>Earn Fame</h4>
    <Field label="Award type"><select value={kind} onChange={e=>{setKind(e.target.value);setError('');}}>
      <option value="education">Education check</option><option value="quest">Guild quest</option><option value="prior">Prior training</option></select></Field>
    {kind==='education'&&<><p>{remaining} of 3 checks available at level {char.level}. {remaining>0&&<>DC {educationDC(char.level)}. </>}A success earns 1 Fame. A failure uses one attempt. Checks begin on a level-up after joining, from level 5.</p>
      <Field label="DM-selected subject"><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></Field>
      <Field label="Check total including modifiers"><input type="number" value={total} onChange={e=>setTotal(e.target.value)}/></Field>
      <button className="l-button" disabled={remaining<=0||!total.trim()} onClick={()=>record({kind,subject,total:Number(total)})}>Record education check</button></>}
    {kind==='quest'&&<><Field label="Completed assignment"><input value={note} onChange={e=>setNote(e.target.value)}/></Field>
      <Field label="Quest award"><select value={award} onChange={e=>setAward(e.target.value)}>{Object.entries(assignments).map(([n,title])=><option key={n} value={n}>{title} (+{n})</option>)}</select></Field>
      <button className="l-button" disabled={!note.trim()} onClick={()=>record({kind,note,amount:award})}>Record completed quest</button></>}
    {kind==='prior'&&<><p>With DM approval, credit 5 Fame once for training before the campaign.</p><button className="l-button" disabled={char.level<5||events.some(e=>e.kind==='prior')} onClick={()=>record({kind})}>Credit prior training</button></>}
    {error&&<p role="alert">{error}</p>}
    {events.length>0&&<details><summary>Fame history ({events.length})</summary><ul>{events.slice().reverse().map(e=><li key={e.id}>Level {e.level} · {e.kind==='education'?e.subject+' '+e.total+' vs DC '+e.dc:e.kind==='prior'?'Prior training':e.note} · +{e.amount} Fame</li>)}</ul></details>}
  </section>;
}

export default function Affiliations({char,patch}) {
  const list=char.affiliations||[],allowed=supportsInstitute(char);
  const [deleting,setDeleting]=useState(null);
  function remove(id){
    patch(current=>({affiliations:(current.affiliations||[]).filter(g=>g.id!==id)}));
    setDeleting(null);
  }
  const [name,setName]=useState(''),[type,setType]=useState('Guild');
  const save=guild=>patch({affiliations:list.map(g=>g.id===guild.id?guild:g)});
  function add(){
    const guild={id:crypto.randomUUID(),name:name.trim(),type};
    patch({affiliations:[...list,guild]});setName('');
  }
  return <section aria-label="Character affiliations"><h2>Affiliations</h2>
    {allowed&&<><label className="l-check"><input type="checkbox" checked={!!char.shadowArcherPlan} onChange={e=>patch({shadowArcherPlan:e.target.checked})}/>Use the Shadow Archer roadmap and converted prestige entry score</label>{char.shadowArcherPlan&&<Roadmap char={char}/>}</>}
    {list.map(g=><article className="l-panel" key={g.id}><h3>{g.name}</h3>
      {deleting===g.id?<div role="group" aria-label={'Confirm deletion of '+g.name}>
        <p>Delete {g.name} from this sheet?{g.training?' This clears its Fame, rank and active training benefits.':''}</p>
        <button className="l-button" onClick={()=>remove(g.id)}>Confirm deletion</button>
        <button className="l-button" onClick={()=>setDeleting(null)}>Cancel</button>
      </div>:<button className="l-button" aria-label={'Delete affiliation: '+g.name} onClick={()=>setDeleting(g.id)}>Delete affiliation</button>}
      {g.training&&!allowed?<p>Inactive institute membership</p>:<details><summary>{g.type} membership details</summary>
        <Field label="Organization name"><input value={g.name} onChange={e=>save({...g,name:e.target.value})}/></Field>
        {!g.training&&<Field label="Rank or title"><input value={g.rank||''} onChange={e=>save({...g,rank:e.target.value})}/></Field>}
        <Field label="Contact or mentor"><input value={g.contact||''} onChange={e=>save({...g,contact:e.target.value})}/></Field>
        <Field label="Location, duties, dues and benefits"><textarea value={g.notes||''} onChange={e=>save({...g,notes:e.target.value})}/></Field>
      </details>}
      {g.training&&allowed&&<Institute char={char} guild={g} save={save} patch={patch}/>}</article>)}
    {allowed&&!list.some(g=>g.training)&&<button className="l-button" onClick={()=>patch({affiliations:[...list,createInstitute(char.level)]})}>Join an arcane institute</button>}
    <details><summary>Add another affiliation</summary>
      <Field label="Guild or institution name"><input value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field label="Organization type"><select value={type} onChange={e=>setType(e.target.value)}>{['Guild','Institute','Academy','Order','Faction','Other'].map(s=><option key={s}>{s}</option>)}</select></Field>
      <button className="l-button" disabled={!name.trim()} onClick={add}>Add membership</button></details>
  </section>;
}
