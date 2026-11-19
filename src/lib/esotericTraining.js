import {supportsInstitute} from './instituteAccess.js';
import {ordinarySpellIdentity} from './spellIdentity.js';

export const ranks = [
  {fame:0, level:2, name:'Initiate', reward:'Basic institute resources'},
  {fame:5, level:5, name:'Apprentice', reward:'+1 Wizard casting', wizard:1},
  {fame:10, level:7, name:'Scholar', reward:'Restricted archives', wizard:1},
  {fame:15, level:10, name:'Senior Scholar', reward:'+2 Wizard casting', wizard:2},
  {fame:25, level:13, name:'Arcane Researcher', reward:'Advanced research', wizard:2},
  {fame:35, level:15, name:'Esoteric Master', reward:'+3 Wizard and +1 Ranger casting', wizard:3, ranger:1},
  {fame:45, level:19, name:'Grandmaster', reward:'Eligible for the Ascension quest', wizard:3, ranger:1},
];
export const assignments = {1:'Minor assignment',2:'Research project',3:'Dangerous expedition',5:'Major mission',10:'Legendary discovery'};
export const subjects = ['Arcana','History','Investigation','Nature','Religion'];
export const educationDC = level => 16 + Math.floor((level-5)/4);
export const characterLevel = c => Math.min(20, Number(c.level||0) + Number(c.otherClassLevels||0));

export function createInstitute(level) {
  return {id:crypto.randomUUID(),name:'Arcane Institute',type:'Institute',training:{joinedLevel:level,events:[],approvedFame:null}};
}
export function trainingStatus(c) {
  const training=supportsInstitute(c)?c.affiliations?.find(g=>g.training)?.training:undefined;
  const fame=(training?.events||[]).reduce((sum,e)=>sum+(Number(e.amount)||0),0);
  const eligible=training?ranks.filter(r=>r.level<=characterLevel(c)&&r.fame<=fame):[];
  const rank=training?.approvedFame!=null?eligible.filter(r=>r.fame<=training.approvedFame).at(-1):null;
  const ascended=rank?.fame===45 && Boolean(training.ascensionQuest?.trim());
  return {fame,eligible,rank,training,ascended,wizardBonus:ascended?4:rank?.wizard||0,rangerBonus:ascended?0:rank?.ranger||0};
}
export function castingLevel(c,name=c.className,level=c.level) {
  if(!c.affiliations?.length || !['Wizard','Ranger'].includes(name) || level<(name==='Ranger'?2:1))return level;
  const status=trainingStatus(c);
  return Math.min(characterLevel(c),level+(name==='Wizard'?status.wizardBonus:status.rangerBonus));
}
export function recordFame(g,level,event) {
  const t=g.training,events=t.events||[];
  if(!event.id || events.some(e=>e.id===event.id))throw Error('This award is already recorded.');
  const note=String(event.note||'').trim();
  let amount,details={};
  if(event.kind==='education'){
    if(level<5||level<=t.joinedLevel||events.filter(e=>e.kind==='education'&&e.level===level).length>=3)throw Error('No education checks remain at this level.');
    if(!subjects.includes(event.subject)||!Number.isInteger(event.total))throw Error('Enter the subject and the final check total.');
    const dc=educationDC(level);
    amount=Number(event.total>=dc);details={subject:event.subject,total:event.total,dc};
  }else if(event.kind==='prior'){
    if(level<5||events.some(e=>e.kind==='prior'))throw Error('Prior training can be credited once from level 5.');
    amount=5;
  }else if(event.kind==='quest'){
    if(!Object.hasOwn(assignments,event.amount)||!note)throw Error('Choose an assignment and name the completed quest.');
    if(events.some(e=>e.kind==='quest'&&String(e.note||'').toLowerCase()===note.toLowerCase()))throw Error('That quest already earned Fame.');
    amount=Number(event.amount);
  }else throw Error('Unknown Fame award.');
  return {...g,training:{...t,events:[...events,{id:event.id,kind:event.kind,level,note,amount,...details}]}};
}
export function studyLevels(c,wizardLevel) {
  if(!wizardLevel||!trainingStatus(c).training?.bookAwards)return [];
  const effective=castingLevel(c,'Wizard',wizardLevel);
  return Array.from({length:Math.max(0,effective-wizardLevel)},(_,i)=>wizardLevel+i+1)
    .filter(level=>!c.instituteSpellAwards?.[level]);
}
export function claimStudy(c,row,level,spells) {
  if(row?.name!=='Wizard'||row.edition!=='2014'||!studyLevels(c,row.level).includes(level))throw Error('This study award is unavailable.');
  const owned=new Set((c.spells||[]).filter(s=>(s.castingClassId||c.classLevels?.[0]?.catalogId||row.catalogId)===row.catalogId).map(ordinarySpellIdentity));
  if(spells.length!==2)throw Error('Choose two Wizard spells.');
  for(const s of spells){
    const key=ordinarySpellIdentity(s);
    if(owned.has(key)||s.edition!=='2014'||!s.classes?.some(x=>(x.name||x)==='Wizard')||!(s.level>=1&&s.level<=Math.ceil(level/2)))throw Error('Choose distinct, eligible Wizard spells you do not own.');
    owned.add(key);
  }
  return {instituteSpellAwards:{...c.instituteSpellAwards,[level]:spells.map(s=>s.name)},spells:[...(c.spells||[]),...spells.map(s=>({...s,id:crypto.randomUUID(),castingClassId:row.catalogId,prepared:false,studyLevel:level}))]};
}

