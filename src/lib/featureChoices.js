import {characterClasses,requirements,qualified,contentKey} from './advancement.js';
import {recordedTraining} from './training.js';
import {reconcileClassGrants,spellSlotProgression} from './classIntegration.js';
import {companionChoiceOptions35,companionEffectiveLevel35} from './companions35.js';

export const skillNames=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const unsupported=r=>r?.homebrew||r?.source==='Homebrew'||r?.prestige||r?.stats?.prestige;
const norm=s=>String(s||'').trim().toLowerCase().replace(/[’']/g,'');
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const featureLanguages=['Common','Common Sign Language','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc','Abyssal','Celestial','Draconic','Deep Speech','Druidic','Infernal','Primordial','Sylvan',"Thieves' Cant",'Undercommon'];
const scholarSkills=['Arcana','History','Investigation','Medicine','Nature','Religion'];

function sourceChoicePlan(c,previous,picks={},context={}) {
  const current=reconcileClassGrants(c),before=previous?reconcileClassGrants(previous):null;
  const rows=characterClasses(current),oldRows=before?characterClasses(before):[];
  const patch={featureChoices:{...c.featureChoices},trainingGrants:[...(c.trainingGrants||[])],feats:[...(c.feats||[])],spellAccessGrants:[...(c.spellAccessGrants||[])]},groups=[];
  const addChoiceFeat=(id,row,feature,level,value)=>{
    const canonical=(context.feats||[]).find(feat=>(feat.edition||'3.5')==='3.5'&&norm(feat.name)===norm(value))||null;
    // Each selected feat shares a choice ID; preserve its siblings and saved state.
    if(patch.feats.some(feat=>feat.sourceChoiceId===id&&norm(feat.name)===norm(value)))return;
    patch.feats.push({
      ...(canonical||{}),
      id:`class-choice:${id}:${slug(value)}`,
      ...(canonical?.catalogId||canonical?.sourceId||canonical?.id?{catalogId:canonical.catalogId||canonical.sourceId||canonical.id}:{}),
      name:value,level,
      description:canonical?.description||`Chosen from ${row.name} · ${feature.name}.`,
      sourceType:'class-choice',automatic:true,sourceChoiceId:id,sourceClassId:row.catalogId,sourceClassName:row.name,sourceClassLevel:level,
      sourceFeatureId:feature.sourceFeatureId||feature.id||null,edition:'3.5',source:row.name,
      sourceUrl:canonical?.sourceUrl||feature.sourceUrl||row.definition?.sourceUrl||row.definition?.url||null
    });
  };
  for(const row of rows.filter(item=>item.edition==='3.5')) {
    const oldLevel=oldRows.find(item=>item.catalogId===row.catalogId)?.level||0;
    const sourceFeatures=(current.grantedFeatures||[]).filter(feature=>feature.sourceClassId===row.catalogId&&feature.kind==='choice');
    const features=[...sourceFeatures].sort((a,b)=>{
      const aDriver=norm(a?.choiceOptionsFromFeatureMechanic?.feature),bDriver=norm(b?.choiceOptionsFromFeatureMechanic?.feature);
      if(aDriver&&aDriver===norm(b?.name))return 1;
      if(bDriver&&bDriver===norm(a?.name))return -1;
      return Number(a?.sourceClassLevel||a?.level||0)-Number(b?.sourceClassLevel||b?.level||0);
    });
    for(const feature of features) {
      const events=(Array.isArray(feature.choiceLevels)&&feature.choiceLevels.length
        ?feature.choiceLevels.map(level=>({level,text:feature.name}))
        :(feature.progressionHistory||[{level:feature.sourceClassLevel||feature.level,text:feature.description}]))
        .filter(event=>Number(event.level)>oldLevel&&Number(event.level)<=row.level);
      for(const [index,event] of events.entries()) {
        const level=Number(event.level)||feature.sourceClassLevel||feature.level;
        const id=`3.5:${row.catalogId}:${level}:${feature.sourceFeatureId||feature.id}:${index}`;
        let options=(feature.choiceOptionsByLevel?.[String(level)]||feature.choiceOptions||[]).map(value=>String(value));
        if(feature.choiceOptionsFromFeatureMechanic&&typeof feature.choiceOptionsFromFeatureMechanic==='object'){
          const config=feature.choiceOptionsFromFeatureMechanic;
          const driverName=String(config.feature||'').trim(),field=String(config.field||'').trim();
          const driverFeature=features.find(item=>norm(item?.name)===norm(driverName));
          const driverChoice=Object.values(patch.featureChoices||{}).find(choice=>choice?.sourceClassId===row.catalogId&&norm(choice?.feature)===norm(driverName));
          const driverValue=String(driverChoice?.choices?.[0]||'').trim();
          const mechanicEntry=driverFeature&&driverValue?Object.entries(driverFeature.choiceOptionMechanics||{}).find(([name])=>norm(name)===norm(driverValue)):null;
          const mechanic=(mechanicEntry?.[1]&&typeof mechanicEntry[1]==='object')?mechanicEntry[1]:{};
          const values=Array.isArray(mechanic?.[field])?mechanic[field].map(value=>String(value||'').trim()).filter(Boolean):[];
          const prefix=String(config.prefix||'').trim();
          const format=value=>prefix?`${prefix} (${value})`:value;
          const owned=new Set((patch.feats||[]).map(feat=>norm(feat?.name)));
          options=values.map(format).filter(value=>!config.excludeOwned||!owned.has(norm(value)));
          if(!options.length&&config.fallback==='classSkills'){
            options=(current.classSkills35||[]).filter(item=>item?.sourceClassId===row.catalogId).map(item=>format(item.name)).filter(value=>!config.excludeOwned||!owned.has(norm(value)));
          }
        }
        if(feature.choiceFromProficiencyId&&feature.choiceFeatPrefix){
          const suffix=`:proficiency:${feature.choiceFromProficiencyId}`;
          const linkedChoice=Object.entries(patch.featureChoices||{}).find(([choiceId,choice])=>
            choice?.sourceClassId===row.catalogId&&choiceId.endsWith(suffix)
          )?.[1];
          const linkedValue=String(linkedChoice?.choices?.[0]||'').trim();
          const linkedFeat=linkedValue?`${feature.choiceFeatPrefix} (${linkedValue})`:'';
          const alreadyOwned=linkedFeat&&patch.feats.some(feat=>norm(feat?.name)===norm(linkedFeat));
          options=linkedFeat&&!alreadyOwned?[linkedFeat]:[];
        }
        if(feature.uniqueChoices){
          const already=new Set(Object.values(patch.featureChoices||{})
            .filter(choice=>choice?.sourceClassId===row.catalogId&&choice?.feature===feature.name)
            .flatMap(choice=>choice.choices||[])
            .map(norm));
          options=options.filter(value=>!already.has(norm(value)));
        }
        const choiceKind=feature.choiceKind||'source';
        if(choiceKind==='feat'&&feature.choiceFeatType){
          const requiredType=norm(feature.choiceFeatType),owned=new Set((patch.feats||[]).map(feat=>contentKey(feat)||norm(feat?.name)));
          const featContext=Array.isArray(context.feats)?context.feats:[];
          if(featContext.length){
            const typedAll=new Set(featContext
              .filter(feat=>(feat.edition||'3.5')==='3.5'&&norm(feat.featType)===requiredType)
              .map(feat=>norm(feat.name)));
            const explicitExceptions=options.filter(name=>!typedAll.has(norm(name)));
            const eligibleTyped=featContext
              .filter(feat=>(feat.edition||'3.5')==='3.5'&&norm(feat.featType)===requiredType)
              .filter(feat=>!owned.has(contentKey(feat))&&!owned.has(norm(feat?.name)))
              .filter(feat=>qualified(requirements(feat,current,feat.prerequisiteConfirmations||{})))
              .map(feat=>String(feat.name||'').trim()).filter(Boolean);
            options=[...new Set([...eligibleTyped,...explicitExceptions].filter(Boolean))]
              .filter(name=>!owned.has(norm(name)))
              .sort((a,b)=>a.localeCompare(b));
          }else{
            options=options.filter(name=>!owned.has(norm(name)));
          }
        }
        if(choiceKind==='feat'&&feature.choiceValidatePrerequisites){
          const featContext=Array.isArray(context.feats)?context.feats:[];
          const eligibilityCharacter={...current,feats:patch.feats};
          options=options.filter(name=>{
            const matching=featContext.filter(feat=>(feat.edition||'3.5')==='3.5'&&norm(feat.name)===norm(name));
            return matching.length>0&&matching.every(feat=>feature.ignorePrerequisites||qualified(requirements(feat,eligibilityCharacter,feat.prerequisiteConfirmations||{})));
          });
        }
        if(Array.isArray(feature.choiceExcludeOptions)){
          const excluded=feature.choiceExcludeOptions.map(norm);
          options=options.filter(name=>!excluded.some(value=>norm(name)===value||norm(name).startsWith(value+' (')));
        }
        if(Array.isArray(feature.choiceParts)&&feature.choiceParts.length){
          const existing=patch.featureChoices[id];
          if(existing)continue;
          const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
          const selected=raw.map(value=>String(value||'').trim());
          const choiceParts=feature.choiceParts.map(part=>{
            let partOptions=(part.options||[]).map(value=>String(value));
            if(part.source==='owned-class-spells'){
              partOptions=(current.spells||[])
                .filter(spell=>!spell?.auto&&(!spell?.castingClassId||spell.castingClassId===row.catalogId))
                .map(spell=>String(spell?.name||'').trim()).filter(Boolean)
                .filter((value,index,array)=>array.findIndex(other=>norm(other)===norm(value))===index)
                .sort((a,b)=>a.localeCompare(b));
            }
            return {...part,options:partOptions};
          });
          const priorCombinations=Object.values(patch.featureChoices||{})
            .filter(choice=>choice?.sourceClassId===row.catalogId&&norm(choice?.feature)===norm(feature.name))
            .map(choice=>(choice.choices||[]).map(value=>norm(value)).join('|'));
          const selectedKey=selected.map(value=>norm(value)).join('|');
          const valid=selected.length===choiceParts.length
            &&choiceParts.every((part,index)=>selected[index]&&part.options.includes(selected[index]))
            &&(!feature.uniqueChoiceCombination||!priorCombinations.includes(selectedKey));
          const detail=String(feature.description||'').trim();
          const sourceText=detail?(norm(detail).includes(norm(feature.name))?detail:`${feature.name}: ${detail}`):(event.text||feature.name);
          groups.push({id,level,kind:'source-choice-parts',choiceKind,count:choiceParts.length,required:choiceParts.length,label:feature.name,className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,sourceText,sourceUrl:feature.sourceUrl,choiceParts,selected,valid});
          if(valid)patch.featureChoices[id]={className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name,choices:[...selected],sourceText,choiceKind};
          continue;
        }
        if(feature.companionProfileId&&feature.companionChoiceRequired!==false){
          const contribution={...(feature.companionContribution||{mode:'full'}),level:row.level};
          const effectiveCompanionLevel=companionEffectiveLevel35([contribution],0);
          const engineOptions=companionChoiceOptions35(feature.companionProfileId,effectiveCompanionLevel);
          const sourceOverrides=Boolean(feature.companionExceptions?.choiceOptionsFromFeature);
          const sourceOptions=(feature.choiceOptionsByLevel?.[String(level)]||feature.choiceOptions||[]).map(value=>String(value));
          const optionRows=sourceOverrides
            ?sourceOptions.map(name=>({name,minEffectiveLevel:0,levelAdjustment:0,baseCreatureId:null}))
            :engineOptions;
          options=optionRows.map(option=>option.name);
          const existing=patch.featureChoices[id];
          if(existing)continue;
          const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
          const selected=raw.map(value=>String(value||'').trim()).filter(Boolean);
          const selectedOption=optionRows.find(option=>option.name===selected[0]);
          const valid=selected.length===1&&Boolean(selectedOption);
          const sourceText=String(feature.description||'').trim()||event.text||feature.name;
          const relationshipType=feature.companionRelationshipType||feature.choiceKind||'companion';
          const group={
            id,level,kind:'source-choice',choiceKind,relationshipType,companionProfileId:feature.companionProfileId,
            count:1,required:1,label:feature.name,className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,
            sourceText,sourceUrl:feature.sourceUrl,options,selected,valid,effectiveCompanionLevel,
            ...(feature.companionProfileId==='druid-animal-companion'?{effectiveDruidLevel:effectiveCompanionLevel}:{}),
            companionContribution:feature.companionContribution||{mode:'full'}
          };
          groups.push(group);
          if(valid){
            const levelAdjustment=Math.max(0,Number(selectedOption.levelAdjustment)||0);
            patch.featureChoices[id]={
              className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name,
              choices:[selected[0]],sourceText,choiceKind,relationshipType,companionProfileId:feature.companionProfileId,
              effectiveCompanionLevel,levelAdjustment,baseCreatureId:selectedOption.baseCreatureId||null,
              ...(feature.companionProfileId==='druid-animal-companion'?{effectiveDruidLevel:effectiveCompanionLevel}:{}),
              companionContribution:feature.companionContribution||{mode:'full'}
            };
          }
          continue;
        }
        if(choiceKind==='spell-access'){
          const profile=spellSlotProgression(row.definition,row.level>=level?level:row.level);
          const unlocked=(profile?.unlockedSpellLevels||profile?.history?.at(-1)?.unlockedSpellLevels||[]).map(Number).filter(Number.isFinite);
          const maxLevel=unlocked.length?Math.max(...unlocked):-1;
          const lists=(feature.spellLists||[]).map(norm),schools=(feature.spellSchools||[]).map(norm);
          const spellSchoolsFor=spell=>norm(spell.school?.name||spell.school).split(/[^a-z]+/).filter(Boolean);
          const spellLevelFor=spell=>{
            const levels=[];
            for(const list of lists){
              const exact=Object.entries(spell.classLevels||{}).find(([name])=>norm(name)===list);
              if(exact&&Number.isInteger(Number(exact[1])))levels.push(Number(exact[1]));
              else if((spell.classes||[]).some(name=>norm(name)===list)&&Number.isInteger(Number(spell.level)))levels.push(Number(spell.level));
            }
            return levels.length?Math.min(...levels):null;
          };
          const ordinaryForClass=spell=>Object.entries(spell.classLevels||{}).some(([name])=>norm(name)===norm(row.name))||(spell.classes||[]).some(name=>norm(name)===norm(row.name));
          const grantIdFor=spell=>spell.catalogId||`${spell.edition||'3.5'}:${spell.index||spell.id||spell.name}`;
          const already=new Set((patch.spellAccessGrants||[]).filter(grant=>grant.classId===row.catalogId).map(grant=>grant.spellId));
          const eligible=(context.spells||[]).filter(spell=>{
            const spellLevel=spellLevelFor(spell),integrityIssues=Array.isArray(spell.integrityIssues)?spell.integrityIssues:[];
            return (spell.edition||'3.5')==='3.5'&&integrityIssues.length===0&&String(spell.name||'').trim()&&spellLevel!==null&&spellLevel<=maxLevel&&
              (!schools.length||schools.some(school=>spellSchoolsFor(spell).includes(school)))&&!ordinaryForClass(spell)&&!already.has(grantIdFor(spell));
          }).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
          options=eligible.map(spell=>String(spell.name));
          const existing=patch.featureChoices[id];
          const addSpellGrant=(value,choice=existing)=>{
            const spell=eligible.find(item=>String(item.name)===String(value))||(context.spells||[]).find(item=>String(item.name)===String(value));
            if(!spell)return;
            const spellLevel=spellLevelFor(spell);
            if(spellLevel===null||spellLevel>maxLevel)return;
            const spellId=grantIdFor(spell);
            patch.spellAccessGrants=patch.spellAccessGrants.filter(grant=>grant.sourceChoiceId!==id);
            patch.spellAccessGrants.push({
              classId:row.catalogId,classLevel:level,spellId,spellName:spell.name,spellLevel,spellReferenceOnly:!!spell.referenceOnly,
              source:`${row.name} · ${feature.name}`,sourceChoiceId:id,sourceFeatureId:feature.sourceFeatureId||feature.id||null,
              sourceUrl:feature.sourceUrl||row.definition?.sourceUrl||row.definition?.url||null
            });
          };
          if(existing){
            if(!patch.spellAccessGrants.some(grant=>grant.sourceChoiceId===id))for(const value of existing.choices||[])addSpellGrant(value,existing);
            continue;
          }
          const raw=Array.isArray(picks[id])?picks[id]:picks[id]?[picks[id]]:[];
          const selected=raw.map(value=>String(value||'').trim()).filter(Boolean);
          const valid=selected.length===1&&options.includes(selected[0]);
          const detail=String(feature.description||'').trim();
          const sourceText=detail?(norm(detail).includes(norm(feature.name))?detail:`${feature.name}: ${detail}`):(event.text||feature.name);
          groups.push({id,level,kind:'source-choice',choiceKind:'spell-access',count:1,required:1,label:feature.name,className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,sourceText,sourceUrl:feature.sourceUrl,options,selected,valid,maxSpellLevel:maxLevel,spellLists:feature.spellLists||[],spellSchools:feature.spellSchools||[]});
          if(valid){
            patch.featureChoices[id]={className:row.name,classId:row.catalogId,sourceClassId:row.catalogId,edition:'3.5',level,feature:feature.name,choices:[selected[0]],sourceText,choiceKind:'spell-access'};
            addSpellGrant(selected[0]);
          }
          continue;
        }
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
          if(choiceKind==='feat')for(const value of existing.choices||[])addChoiceFeat(id,row,feature,level,value);
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
        const requiresResolvedOptions=Boolean(feature.choiceOptionsFromFeatureMechanic||feature.choiceFeatType||feature.choiceValidatePrerequisites||feature.choiceExcludeOptions?.length||feature.choiceOptions?.length||feature.choiceOptionsByLevel?.[String(level)]?.length); const valid=selected.length===required&&new Set(selected.map(norm)).size===required&&(!options.length?!requiresResolvedOptions:selected.every(value=>options.includes(value)))&&unmetPrerequisites.length===0;
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
export function featureChoicePlan(c,previous=null,picks={},context={}) {
  const edition=c.ruleset||'2014',rows=characterClasses(c),before=previous?characterClasses(previous):[];
  if(edition==='3.5'||rows.some(row=>row.edition==='3.5')&&!['2014','2024'].includes(edition))return sourceChoicePlan(c,previous,picks,context);
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
export function applyFeatureChoices(c,previous,picks,context={}) {
  const plan=featureChoicePlan(c,previous,picks,context);
  if(!plan.valid)throw Error('Complete the class feature choices before saving.');
  const next={...c,...plan.patch},edition=c.ruleset||'2014';
  return edition==='3.5'||characterClasses(next).some(row=>row.edition==='3.5')&&!['2014','2024'].includes(edition)?reconcileClassGrants(next):next;
}
