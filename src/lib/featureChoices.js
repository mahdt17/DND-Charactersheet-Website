import {characterClasses} from './advancement.js';
import {recordedTraining} from './training.js';
import {reconcileClassGrants} from './classIntegration.js';

export const skillNames=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const unsupported=r=>r?.homebrew||r?.source==='Homebrew'||r?.prestige||r?.stats?.prestige;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[’']/g,'');
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const featureLanguages=['Common','Common Sign Language','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Abyssal','Celestial','Draconic','Deep Speech','Druidic','Infernal','Primordial','Sylvan',"Thieves' Cant",'Undercommon'];
const scholarSkills=['Arcana','History','Investigation','Medicine','Nature','Religion'];

function sourceChoicePlan(c,previous,picks={}) {
  const current=reconcileClassGrants(c),before=previous?reconcileClassGrants(previous):null;
  const rows=characterClasses(current),oldRows=before?characterClasses(before):[];
  const patch={featureChoices:{...c.featureChoices},trainingGrants:[...(c.trainingGrants||[])],feats:[...(c.feats||[])]},groups=[];
  const addChoiceFeat=(id,row,feature,level,value)=>{
    patch.feats=patch.feats.filter(feat=>feat.sourceChoiceId!==id);
    patch.feats.push({id:`class-choice:${id}:${slug(value)}`,name:value,level,description:`Chosen from ${row.name} · ${feature.name}.`,sourceType:'class-choice',automatic:true,sourceChoiceId:id,sourceClassId:row.catalogId,sourceClassName:row.name,sourceClassLevel:level,sourceFeatureId:feature.sourceFeatureId||feature.id||null,edition:'3.5',source:row.name,sourceUrl:feature.sourceUrl||row.definition?.sourceUrl||row.definition?.url||null});
  };
  for(const row of rows.filter(item=>item.edition==='3.5')) {
    const oldLevel=oldRows.find(item=>item.catalogId===row.catalogId)?.level||0;
    const features=(current.grantedFeatures||[]).filter(feature=>feature.sourceClassId===row.catalogId&&feature.kind==='choice');
    for(const feature of features) {
      const events=(Array.isArray(feature.choiceLevels)&&feature.choiceLevels.length
        ?feature.choiceLevels.map(level=>({level,text:feature.name}))
        :(feature.progressionHistory||[{level:feature.sourceClassLevel||feature.level,text:feature.description}]))
        .filter(event=>Number(event.level)>oldLevel&&Number(event.level)<=row.level);
      for(const [index,event] of events.entries()) {
        const level=Number(event.level)||feature.sourceClassLevel||feature.level;
        const id=`3.5:${row.catalogId}:${level}:${feature.sourceFeatureId||feature.id}:${index}`;
        let options=(feature.choiceOptionsByLevel?.[String(level)]||feature.choiceOptions||[]).map(value=>String(value));
        if(feature.uniqueChoices){
          const already=new Set(Object.values(patch.featureChoices||{})
            .filter(choice=>choice?.sourceClassId===row.catalogId&&choice?.feature===feature.name)
            .flatMap(choice=>choice.choices||[])
            .map(norm));
          options=options.filter(value=>!already.has(norm(value)));
        }
        const choiceKind=feature.choiceKind||'source';
        if(choiceKind==='favored-enemy'){
          const sourceText=String(feature.description||'').trim()||event.text||feature.name;
          const enemyId=id+':enemy',boostId=id+':boost';
          const existingEnemy=patch.featureChoices[enemyId];
          if(!existingEnemy){
            const rawEnemy=Array.isArray(picks[enemyId])?picks[enemyId]:picks[enemyId]?[picks[enemyId]]:[];
            const selectedEnemy=rawEnemy.map(value=>String(value||'').trim()).filter(Boolean);
            const validEnemy=selectedEnemy.length===1&&options.includes(selectedEnemy[0]);
            groups.push({id:enemyId,level,kind:'source-choice',choiceKind:'favored-enemy',count:1,required:1,label:feature.name,className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,sourceText,sourceUrl:feature.sourceUrl,options,selected:selectedEnemy,valid:validEnemy});
            if(validEnemy)patch.featureChoices[enemyId]={className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name,choices:[selectedEnemy[0]],sourceText,choiceKind:'favored-enemy'};
          }
          const firstLevel=Math.min(...(Array.isArray(feature.choiceLevels)&&feature.choiceLevels.length?feature.choiceLevels:[feature.level||1]).map(Number).filter(Number.isFinite));
          if(level>firstLevel){
            const selectedEnemies=[...new Set(Object.values(patch.featureChoices||{})
              .filter(choice=>choice?.sourceClassId===row.catalogId&&choice?.choiceKind==='favored-enemy'&&norm(choice?.feature)===norm(feature.name))
              .flatMap(choice=>choice?.choices||[])
              .map(value=>String(value))
              .filter(Boolean))];
            if(!patch.featureChoices[boostId]){
              const rawBoost=Array.isArray(picks[boostId])?picks[boostId]:picks[boostId]?[picks[boostId]]:[];
              const selectedBoost=rawBoost.map(value=>String(value||'').trim()).filter(Boolean);
              const validBoost=selectedBoost.length===1&&selectedEnemies.includes(selectedBoost[0]);
              groups.push({id:boostId,level,kind:'source-choice',choiceKind:'favored-enemy-boost',count:1,required:1,label:feature.name+' Bonus Increase',className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,sourceText:'Increase one existing favored-enemy bonus by +2; the enemy selected at this level is eligible.',sourceUrl:feature.sourceUrl,options:selectedEnemies,selected:selectedBoost,valid:validBoost});
              if(validBoost)patch.featureChoices[boostId]={className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name+' Bonus Increase',choices:[selectedBoost[0]],sourceText:'Increase one existing favored-enemy bonus by +2; the enemy selected at this level is eligible.',choiceKind:'favored-enemy-boost'};
            }
          }
          continue;
        }
        const existing=patch.featureChoices[id];
        if(existing){
          if(choiceKind==='feat'&&!patch.feats.some(feat=>feat.sourceChoiceId===id))for(const value of existing.choices||[])addChoiceFeat(id,row,feature,level,value);
          continue;
        }
        const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
        const selected=raw.map(value=>String(value||'').trim()).filter(Boolean),required=Math.max(1,Number(feature.choiceCountByLevel?.[String(level)]??feature.choiceCount)||1);
        const optionPrerequisites=feature.choiceOptionPrerequisites&&typeof feature.choiceOptionPrerequisites==='object'?feature.choiceOptionPrerequisites:{};
        const priorSelections=Object.values(patch.featureChoices||{})
          .filter(choice=>choice?.sourceClassId===row.catalogId&&norm(choice?.feature)===norm(feature.name))
          .flatMap(choice=>choice?.choices||[])
          .map(value=>String(value));
        const requirementsFor=value=>{
          const match=Object.entries(optionPrerequisites).find(([name])=>norm(name)===norm(value));
          const requirements=match?.[1];
          return Array.isArray(requirements)?requirements.map(String):requirements?[String(requirements)]:[];
        };
        const unmetPrerequisites=selected.flatMap(value=>requirementsFor(value).filter(requiredName=>!priorSelections.some(existing=>norm(existing)===norm(requiredName))));
        const valid=selected.length===required&&new Set(selected.map(norm)).size===required&&(!options.length||selected.every(value=>options.includes(value)))&&unmetPrerequisites.length===0;
        const detail=String(feature.description||'').trim();
        const sourceText=detail?(norm(detail).includes(norm(feature.name))?detail:`${feature.name}: ${detail}`):(event.text||feature.name);
        const group={id,level,kind:'source-choice',choiceKind,count:required,required,label:feature.name,className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,sourceText,sourceUrl:feature.sourceUrl,options,selected,valid,ignorePrerequisites:!!feature.ignorePrerequisites,optionPrerequisites,unmetPrerequisites};
        groups.push(group);
        if(valid){
          patch.featureChoices[id]={className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name,choices:[...selected],sourceText:group.sourceText,choiceKind};
          if(choiceKind==='feat')for(const value of selected)addChoiceFeat(id,row,feature,level,value);
        }
      }
    }
  }

  for(const report of current.classAutomation?.classes||[]) {
    if(report.edition!=='3.5')continue;
    const oldLevel=oldRows.find(item=>item.catalogId===report.classId)?.level||0;
    for(const choice of report.proficiencyChoices||[]) {
      const level=Math.max(1,Number(choice.level)||1);
      if(report.level<level||oldLevel>=level)continue;
      const id=`3.5:${report.classId}:${level}:proficiency:${choice.id||slug(choice.label)}`;
      if(patch.featureChoices[id])continue;
      const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
      const selected=raw.map(value=>String(value||'').trim()).filter(Boolean);
      const options=(Array.isArray(choice.options)?choice.options:[]).map(value=>String(value));
      const required=Math.max(1,Number(choice.count)||1),valid=selected.length===required&&new Set(selected.map(norm)).size===required&&(!options.length||selected.every(value=>options.includes(value)));
      const group={id,level,kind:'source-choice',choiceKind:'proficiency',proficiencyKind:choice.kind||'weapons',count:required,required,label:choice.label||'Class proficiency choice',className:report.name,classId:report.classId,sourceClassId:report.classId,sourceText:choice.sourceText||'Choose the source-defined proficiency.',sourceUrl:choice.optionsSourceUrl||null,options,selected,valid};
      groups.push(group);
      if(valid){
        patch.featureChoices[id]={className:report.name,classId:report.classId,sourceClassId:report.classId,edition:'3.5',level,feature:group.label,choices:[...selected],sourceText:group.sourceText};
        const trainingId=`class-choice:${report.classId}:${choice.id||slug(group.label)}`;
        patch.trainingGrants=patch.trainingGrants.filter(grant=>grant.sourceChoiceId!==id);
        patch.trainingGrants.push({classId:trainingId,sourceClassId:report.classId,sourceChoiceId:id,className:report.name,edition:'3.5',proficiencies:selected.map(name=>({kind:group.proficiencyKind,name,index:slug(name)}))});
      }
    }
    for(const choice of report.classSkillChoices||[]) {
      const level=Math.max(1,Number(choice.level)||1);
      if(report.level<level||oldLevel>=level)continue;
      const id=`3.5:${report.classId}:${level}:class-skill:${choice.id||slug(choice.label)}`;
      if(patch.featureChoices[id])continue;
      const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
      const selected=raw.map(value=>String(value||'').trim()).filter(Boolean);
      const options=(Array.isArray(choice.options)?choice.options:[]).map(value=>String(value));
      const required=Math.max(1,Number(choice.count)||1);
      const valid=selected.length===required&&new Set(selected.map(norm)).size===required&&selected.every(value=>options.includes(value));
      const group={id,level,kind:'source-choice',choiceKind:'class-skill',count:required,required,label:choice.label||'Class skills',className:report.name,classId:report.classId,sourceClassId:report.classId,sourceText:choice.sourceText||'Choose the source-defined class skills.',sourceUrl:choice.sourceUrl||choice.optionsSourceUrl||null,options,selected,valid};
      groups.push(group);
      if(valid)patch.featureChoices[id]={className:report.name,classId:report.classId,sourceClassId:report.classId,edition:'3.5',level,feature:group.label,choices:[...selected],sourceText:group.sourceText,choiceKind:'class-skill'};
    }
  }
  return {groups,patch,valid:groups.every(group=>group.valid)};
}

// Choices are collected only for features gained in this creation/advancement.
// Existing characters never have historical selections silently invented.
export function featureChoicePlan(c,previous=null,picks={}) {
  const edition=c.ruleset||'2014',rows=characterClasses(c),before=previous?characterClasses(previous):[];
  if(edition==='3.5'||rows.some(row=>row.edition==='3.5')&&!['2014','2024'].includes(edition))return sourceChoicePlan(c,previous,picks);
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
  const next={...c,...plan.patch},edition=c.ruleset||'2014';
  return edition==='3.5'||characterClasses(next).some(row=>row.edition==='3.5')&&!['2014','2024'].includes(edition)?reconcileClassGrants(next):next;
}
