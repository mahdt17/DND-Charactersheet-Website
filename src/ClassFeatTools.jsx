import React,{useState} from 'react';
import {classFeatTools} from './lib/classFeatTools';
import {classCharacter} from './lib/advancement';
import {classFeatures} from './lib/editions';
import ResourceTracker from './ResourceTracker';
import {characterResources} from './lib/resources';
import {featMagicState} from './lib/featMagic';
import {grantedClassFeatures} from './lib/rules';
import {campaignProfile} from './lib/archivistCampaign';
import ArchivistCampaign from './ArchivistCampaign';
import CampaignWorkshop,{Psicrystal} from './CampaignWorkshop';
import FeatMagicManager from './FeatMagicManager';
import ProjectHistory from './ProjectHistory';

const domId=t=>'class-tool-'+encodeURIComponent(t.id);
const Button=({children,...props})=><button type="button" className="l-button" {...props}>{children}</button>;
export default function ClassFeatTools({char,patch,roll,show,onRest,onSpells,homebrew=[]}){
 const entries=[...classFeatTools(char),...(char.archivistCampaign?.projects?.length?[{id:'project-history',kind:'history',name:'Project history'}]:[])],[selected,setSelected]=useState('');
 const active=entries.find(x=>x.id===selected)||entries[0],p=campaignProfile(char),encounter=selected==='encounter'&&p.active;
 const chooseClass=kind=>setSelected(entries.find(t=>t.kind==='class'&&t.adapter===kind)?.id||'encounter');
 function navigate(e){if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;const buttons=[...e.currentTarget.querySelectorAll('[role=tab]')],index=buttons.indexOf(document.activeElement);if(index<0)return;e.preventDefault();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].click();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].focus();}
 return <section aria-label="Class and feat tools"><nav role="tablist" aria-label="Classes and feats" className="class-owner-tabs" onKeyDown={navigate}>{entries.map(t=><button type="button" key={t.id} role="tab" aria-label={t.name} aria-selected={!encounter&&active?.id===t.id} tabIndex={!encounter&&active?.id===t.id?0:-1} id={domId(t)} aria-controls={domId(t)+'-panel'} onClick={()=>setSelected(t.id)}>{t.name}<small>{t.kind==='class'?`Level ${t.level}`:t.kind==='history'?'Past & pending':'Feat'}</small></button>)}{p.active&&<button type="button" id="class-tool-encounter" aria-controls="class-tool-encounter-panel" role="tab" aria-label="Encounter" aria-selected={encounter} tabIndex={encounter?0:-1} onClick={()=>setSelected('encounter')}>Encounter<small>Targets &amp; time</small></button>}</nav>
 {entries.map(t=><div className="class-owner-panel" key={t.id} id={domId(t)+'-panel'} role="tabpanel" aria-labelledby={domId(t)} hidden={encounter||active?.id!==t.id}>
 {t.kind==='class'&&<ClassMilestone tool={t}/>}
 {t.kind==='history'?<ProjectHistory char={char} patch={patch}/>:t.kind==='class'?(t.adapter?<ArchivistCampaign char={char} patch={patch} roll={roll} show={show} onRest={onRest} owner={t.adapter} homebrew={homebrew}/>:<GenericClass char={char} tool={t} patch={patch} roll={roll} show={show} homebrew={homebrew} onSpells={onSpells}/>):<>{<><header className="class-tools-heading"><div><span className="l-eyebrow">FEAT TOOLS</span><h2>{t.name}</h2></div></header><p className="preserve-lines class-ability-rules">{t.record.description||'Review this feat’s recorded rules in Feats.'}</p></>}
 {t.adapter==='Mother Cyst'?<article className="class-ability"><h3>Mother Cyst spells</h3><p>Your level-appropriate spells appear automatically in Spells. Cast them there using an eligible class and your existing spell slots.</p><Button onClick={onSpells}>Open Spells</Button></article>:t.adapter==='Psicrystal Affinity'?(p.psion?<Psicrystal char={char} patch={patch}/>:<p role="status">Psion levels are required for these Psicrystal abilities.</p>):t.adapter==='Graft Flesh: Silthilar'?<CampaignWorkshop char={char} patch={patch} roll={roll} section="projects" owner="graft"/>:['Reach Spell','Chain Spell','Cooperative Spell'].includes(t.adapter)?<article className="class-ability"><h3>{t.name}</h3><p>Choose a spell in Spells, then open its metamagic and cooperative casting options. Adjusted casts use the same saved spell slots.</p><Button onClick={onSpells}>Open Spells</Button></article>:t.adapter==='Draconic Archivist'?<><p>Uses Archivist Dark Knowledge against dragons and constructs. Its uses and effect tiers follow Archivist level.</p>{p.archivist?<Button onClick={()=>chooseClass('archivist')}>Use Dark Knowledge</Button>:<p role="status">Gain Archivist Dark Knowledge to use this feat’s benefit.</p>}</>:<article className="class-ability"><FeatMagicManager feat={t.record} char={char} onChange={next=>patch({feats:char.feats.map(f=>f===t.record?next:f)})}/>{featMagicState(t.record,char).supported&&<Button onClick={onSpells}>Open Spells</Button>}</article>}</>}
 </div>)}
 {p.active&&<div className="class-owner-panel" hidden={!encounter} id="class-tool-encounter-panel" role="tabpanel" aria-labelledby="class-tool-encounter"><h2>Encounter</h2><p>Record targets here, then resolve spells and powers in their source tab. Time is shared by every class and feat.</p><CampaignWorkshop char={char} patch={patch} roll={roll} section="companions" owner="encounter"/><CampaignWorkshop char={char} patch={patch} roll={roll} section="abilities" owner="clock"/></div>}
 </section>;
}
function GenericClass({char,tool,patch,onSpells}){
 const model=classCharacter(char,tool.record),features=classFeatures(model)||grantedClassFeatures(model)||[],[chosen,setChosen]=useState(0),active=features[chosen]||features[0];
 return <section aria-label={tool.name+' class tools'}><h2>{tool.name} · Level {tool.level}</h2><div className="class-ability-picker" role="group" aria-label="Choose a class ability">{features.map((f,i)=><Button key={f.id||f.index||i} aria-pressed={active===f} onClick={()=>setChosen(i)}><strong>{f.featureName||f.name}</strong><small>Level {f.sourceClassLevel||f.level}</small></Button>)}</div>{active&&<article className="class-ability"><h3>{active.featureName||active.name}</h3><p className="preserve-lines">{active.description||active.desc?.join('\n\n')||'See this class’s recorded feature rules.'}</p>{active.sourceUrl&&<a href={active.sourceUrl} target="_blank" rel="noreferrer">Read class source</a>}</article>}<ResourceTracker char={char} patch={patch} onlyIds={characterResources(char).filter(r=>r.sourceClassId===tool.record.catalogId||r.sourceClassName===tool.name||r.className===tool.name).map(r=>r.id)}/><p>Class and feat spells are prepared and cast in Spells.</p><Button onClick={onSpells}>Open Spells</Button></section>;
}

function ClassMilestone({tool}){const next=tool.record.definition?.progression?.find(row=>Number(row[0])>tool.level&&String(row[1]||'').trim());return next?<p className="l-muted">Next at {tool.name} level {next[0]}: {next[1]}</p>:null;}
