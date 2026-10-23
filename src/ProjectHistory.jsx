import React,{useState} from 'react';
import {cancelCampaignProject} from './lib/campaignDowntime';

export default function ProjectHistory({char,patch}){
 const [error,setError]=useState('');
 return <section aria-label="Recorded projects"><h2>Project history</h2><p>Paid work stays recorded when its class or feat is removed. Continue eligible work in its source tab, or cancel pending work here. Paid materials are consumed.</p>{error&&<p role="alert">{error}</p>}{(char.archivistCampaign?.projects||[]).map(job=><article className="feature-detail" key={job.id}><h3>{job.name}</h3><p>{job.kind==='graft'?'Graft Flesh: Silthilar':'Archivist'} · {job.status} · {job.worked}/{job.hours} hours · {job.cost} gp paid</p>{job.status==='active'&&<button type="button" className="l-button" onClick={()=>{try{patch(cancelCampaignProject(char,job.id));setError('');}catch(e){setError(e.message);}}}>Cancel {job.name}</button>}</article>)}</section>;
}
