import {characterClasses} from './advancement.js';
import {recordedTraining} from './training.js';

export const skillNames=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const unsupported=r=>r?.homebrew||r?.source==='Homebrew'||r?.prestige||r?.stats?.prestige;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[’']/g,'');
const featureLanguages=['Common','Common Sign Language','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Abyssal','Celestial','Draconic','Deep Speech','Druidic','Infernal','Primordial','Sylvan',"Thieves' Cant",'Undercommon'];
const scholarSkills=['Arcana','History','Investigation','Medicine','Nature','Religion'];

// Choices are collected only for features gained in this creation/advancement.
// Existing characters never have historical selections silently invented.
export function featureChoicePlan(c,previous=null,picks={}) {
  const edition=c.ruleset||'2014',rows=characterClasses(c),before=previous?characterClasses(previous):[];
  const patch={skillProf:{...c.skillProf},expertise:{...c.expertise},toolExpertise:{...c.toolExpertise},featureChoices:{...c.featureChoices},trainingGrants:[...c.trainingGrants||[]]};
  if(!['2014','2024'].includes(edition)||rows.some(r=>r.edition!==edition||unsupported(r)||unsupported(r.definition)))return {groups:[],patch:{},valid:true};
  const grants=[],groups=[];
  const knownLanguages=(Array.isArray(c.languages)?c.languages.map(x=>x.name||x):String(c.languages||'').split(/[,;\n]/)).map(s=>s.trim()).filter(Boolean);
  const grantLanguage=name=>{if(!knownLanguages.some(s=>norm(s)===norm(name)))knownLanguages.push(name);};
  for(const row of rows) {
    const old=before.find(r=>r.name===row.name&&r.edition===row.edition),oldLevel=old?.level||0;
    const add=(level,kind,count,label,options=skillNames,tools=false)=>{
      const id=`${edition}:${row.name}:${level}:${kind}:${label}`;
      if(row.level>=level&&oldLevel<level&&!patch.featureChoices[id])grants.push({id,level,kind,count,label,className:row.name,options,tools});
    };
    if(row.name==='Rogue')for(const level of [1,6])add(level,'expertise',2,'Expertise',skillNames,edition==='2014');
    if(row.name==='Bard')for(const level of edition==='2014'?[3,10]:[2,9])add(level,'expertise',2,'Expertise');
    if(edition==='2024'&&row.name==='Ranger'){add(2,'expertise',1,'Deft Explorer');add(2,'languages',2,'Deft Explorer languages',featureLanguages);add(9,'expertise',2,'Expertise');}
    if(previous&&oldLevel<1){
      if(row.name==='Druid')grantLanguage('Druidic');
      if(row.name==='Rogue'){grantLanguage("Thieves' Cant");if(edition==='2024')add(1,'languages',1,'Thieves’ Cant language',featureLanguages);}
    }
    if(edition==='2024'&&row.name==='Wizard')add(2,'expertise',1,'Scholar',scholarSkills);
    const subclass=norm(row.subclass);
    if(previous&&edition==='2014'&&row.name==='Sorcerer'&&subclass==='draconic bloodline'&&norm(old?.subclass)!==subclass)grantLanguage('Draconic');
    if(row.name==='Bard'&&['lore','college of lore'].includes(subclass)&&row.level>=3&&(oldLevel<3||norm(old?.subclass)!==subclass)) {
      const id=`${edition}:Bard:3:lore-skills`;
      if(!patch.featureChoices[id])grants.push({id,level:3,kind:'skills',count:3,label:'College of Lore bonus skills',className:'Bard',options:skillNames});
    }
    if(edition==='2014'&&row.name==='Cleric'&&['life','life domain'].includes(subclass)&&row.level>=1&&(oldLevel<1||norm(old?.subclass)!==subclass)) {
      const classId='2014:Cleric:life-training';
      if(!patch.trainingGrants.some(g=>g.classId===classId))patch.trainingGrants.push({classId,className:'Cleric · Life Domain',edition,proficiencies:[{index:'heavy-armor',name:'Heavy armor',kind:'armor'}]});
    }
  }
  // Newly granted skills must be available for same-level Expertise choices.
  grants.sort((a,b)=>(a.kind==='skills'?0:1)-(b.kind==='skills'?0:1)||a.level-b.level);
  let valid=true;
  const thiefTrained=rows.some(r=>r.name==='Rogue')||recordedTraining(c).some(p=>p.index==='thieves-tools')||/thieves[’']? tools/i.test(c.toolProf||'');
  for(const grant of grants) {
    const options=grant.options.filter(s=>grant.kind==='languages'?!knownLanguages.some(n=>norm(n)===norm(s)):grant.kind==='skills'?!patch.skillProf[s]&&!patch.expertise[s]:patch.skillProf[s]&&!patch.expertise[s]);
    if(grant.tools&&thiefTrained&&!patch.toolExpertise['thieves-tools'])options.push('Thieves’ tools');
    const selected=Array.isArray(picks[grant.id])?picks[grant.id]:[];
    const required=Math.min(grant.count,options.length),okay=selected.length===required&&new Set(selected).size===selected.length&&selected.every(s=>options.includes(s));
    groups.push({...grant,options,selected,required,valid:okay});valid=valid&&okay;
    // Valid individual selections can supply options to a later group even
    // while this group still needs another choice. Invalid picks never grant.
    for(const name of new Set(selected.filter(s=>options.includes(s)))) {
      if(grant.kind==='languages')grantLanguage(name);
      else if(name==='Thieves’ tools')patch.toolExpertise['thieves-tools']=true;
      else {patch.skillProf[name]=true;if(grant.kind==='expertise')patch.expertise[name]=true;}
    }
    if(okay)patch.featureChoices[grant.id]={className:grant.className,edition,level:grant.level,feature:grant.label,choices:[...selected]};
  }
  if(knownLanguages.length)patch.languages=knownLanguages.join(', ');
  return {groups,patch,valid};
}
export function applyFeatureChoices(c,previous,picks) {
  const plan=featureChoicePlan(c,previous,picks);
  if(!plan.valid)throw Error('Complete the class feature choices before saving.');
  return {...c,...plan.patch};
}
