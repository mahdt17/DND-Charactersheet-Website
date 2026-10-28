import mechanics from '../data/subclassMechanics2014.json' with {type:'json'};
import spells from '../data/spells.json' with {type:'json'};
import extraSpells from '../data/subclassSpellCatalog.json' with {type:'json'};
import choiceSpells from '../data/subclassChoiceSpellCatalog.json' with {type:'json'};
import {characterClasses} from './advancement.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {subclassValue,subclassRoll} from './subclassFormulas.js';
import {availableSubclasses,findExpandedSubclass,subclassNameKey,legacySubclassName} from './expandedSubclassCatalog.js';
export {availableSubclasses,findExpandedSubclass,subclassEntryLevel,subclassLabel} from './expandedSubclassCatalog.js';
const skillNames=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const saveKey=name=>({strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha'}[String(name).toLowerCase()]||name);
const norm=subclassNameKey, list=v=>Array.isArray(v)?v:String(v||'').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
const mechanicsById=new Map(mechanics.map(m=>[m.recordId,m]));
const specialized=new Set(['battle-master','cavalier','totem-warrior']);
const milestones={Bard:[3,6,14],Druid:[2,6,10,14],Sorcerer:[1,6,14,18],Warlock:[1,6,10,14],Wizard:[2,6,10,14]};
export const subclassSpellOptions=[...spells,...extraSpells,...choiceSpells];
export function expandedSubclassRows(c){return characterClasses(c).map(row=>c.activeCastingClassId&&!c.classLevels?{...row,catalogId:c.activeCastingClassId}:row).flatMap(row=>{const record=row.edition==='2014'&&!row.definition?.homebrew?findExpandedSubclass(row.name,row.subclass):null;return record&&row.level>=record.entryLevel?[{row,record,mechanics:mechanicsById.get(record.id),state:c.expandedSubclassChoices?.[row.catalogId]?.[record.id]||{}}]:[];});}
export function expandedSubclassContext(c,row){const scores=effectiveAbilityScores(c),total=characterClasses(c).reduce((n,r)=>n+r.level,0)+Number(c.otherClassLevels||0);return {level:row.level,pb:2+Math.floor((total-1)/4),...Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,Math.floor(((scores[k]??10)-10)/2)]))};}
export function expandedChoiceId(row,record,key){return `expanded:${row.catalogId}:${record.id}:${key}`;}
export function expandedSelectedFeatures(profile){if(!profile.record.flexibleFeatureSelection)return [];const selected=[];for(const level of milestones[profile.row.name]||[]){if(level<=profile.record.entryLevel||level>profile.row.level)continue;const values=profile.state[`later-subclass-feature:${level}`]||[];if(values.length===1&&!selected.includes(values[0])&&profile.record.features.some(f=>f.name===values[0]&&f.level<=level))selected.push(values[0]);}return selected;}
export function expandedFeatureUnlocked(profile,item){return Number(item.level||1)<=profile.row.level&&(!profile.record.flexibleFeatureSelection||Number(item.level||1)<=profile.record.entryLevel||expandedSelectedFeatures(profile).includes(item.feature||item.name));}
export function expandedSubclassFeatures(c){return expandedSubclassRows(c).flatMap(p=>p.record.features.filter(f=>expandedFeatureUnlocked(p,f)).map(f=>({...f,index:`${p.row.catalogId}:${f.index}`,sourceClassId:p.row.catalogId,sourceClassName:p.row.name,sourceClassLevel:f.level,subclassRecordId:p.record.id,expandedSubclassManaged:true,featureName:f.name,desc:[f.description],source:p.record.sourceBook})));}
function independentTraining(c,kind,name){
 const explicit=(c.trainingGrants||[]).filter(g=>!g.expandedSubclassManaged).some(g=>g.proficiencies?.some(p=>norm(p.name)===norm(name)&&(kind==='expertise'?p.kind==='expertise'||p.expertise===true:kind==='skills'?['skills','skill','expertise'].includes(p.kind):kind==='saves'?['saves','save-proficiency','saving-throw'].includes(p.kind):false)));
 if(explicit)return true;
 const expertise=Object.entries(c.featureChoices||{}).some(([id,choice])=>/:expertise:/.test(id)&&list(choice.choices).includes(name));
 if(kind==='expertise')return expertise;
 return kind==='skills'&&(expertise||[...list(c.classSkills),...list(c.backgroundSkills),...list(c.backgroundDefinition?.skills),...list(c.bonusSkills),...list(c.manualSkills),c.variantHuman?.skill].includes(name));
}
// Transfer only the old published Lore record; retain its history and mark it
// consumed so switching away cannot silently restore an obsolete selection.
function migrateLegacySubclassChoices(c){
 const key='2014:Bard:3:lore-skills',legacy=c.featureChoices?.[key];
 if(!legacy||legacy.expandedSubclassMigratedTo||legacy.className!=='Bard'||legacy.edition!=='2014'||legacy.level!==3||!Array.isArray(legacy.choices)||legacy.choices.length!==3||new Set(legacy.choices).size!==3||!legacy.choices.every(name=>skillNames.includes(name)))return c;
 const profile=expandedSubclassRows(c).find(p=>p.record.id==='2014:subclass:bard:lore'&&(!legacy.sourceClassId||legacy.sourceClassId===p.row.catalogId));
 if(!profile||profile.state['bonus-skills'])return c;
 const {row,record}=profile,previous=c.expandedSubclassTraining?.previous||{},skills={...previous.skills};
 for(const name of legacy.choices)if(!(name in skills))skills[name]=independentTraining(c,'skills',name);
 return {...c,featureChoices:{...c.featureChoices,[key]:{...legacy,expandedSubclassMigratedTo:{classId:row.catalogId,recordId:record.id}}},expandedSubclassChoices:{...c.expandedSubclassChoices,[row.catalogId]:{...c.expandedSubclassChoices?.[row.catalogId],[record.id]:{...profile.state,'bonus-skills':[...legacy.choices]}}},expandedSubclassTraining:{...c.expandedSubclassTraining,previous:{...previous,skills}}};
}
function independent(c){const skillProf={...c.skillProf},expertise={...c.expertise},saveProf={...c.saveProf};const other=(c.trainingGrants||[]).filter(g=>!g.expandedSubclassManaged);for(const [kind,values] of Object.entries(c.expandedSubclassTraining?.previous||{}))for(const [name,prior] of Object.entries(values)){const map={skills:skillProf,expertise,saves:saveProf}[kind];if(map){const still=independentTraining(c,kind,name);map[name]=prior||still;}}
 const own=new Set((c.languageGrants||[]).filter(g=>g.expandedSubclassManaged).map(g=>norm(g.name))),otherLang=(c.languageGrants||[]).filter(g=>!g.expandedSubclassManaged);
 return {...c,skillProf,expertise,saveProf,trainingGrants:other,languageGrants:otherLang,languages:list(c.languages).filter(n=>!own.has(norm(n))||otherLang.some(g=>norm(g.name)===norm(n))).join(', ')};
}
function hasTraining(c,name){return Object.entries(c.skillProf||{}).some(([n,v])=>v&&norm(n)===norm(name))||list(c.toolProf).some(n=>norm(n)===norm(name))||(c.trainingGrants||[]).some(g=>g.proficiencies?.some(p=>norm(p.name)===norm(name)));}
function whenChoice(c,p,q){const w=q.when;if(!w)return true;if(w.choice)return (p.state[w.choice]||[]).includes(w.equals);if(w.alreadyProficient)return w.kind==='saves'?!!c.saveProf?.[saveKey(w.alreadyProficient)]:hasTraining(c,w.alreadyProficient);if(w.alreadyKnownSpell)return (c.spells||[]).some(s=>!s.expandedSubclassManaged&&norm(s.name)===norm(w.alreadyKnownSpell));if(w.alreadyKnownLanguage)return list(c.languages).some(n=>norm(n)===norm(w.alreadyKnownLanguage));return true;}
function countChoice(q,level){if(q.count?.skills)return q.count.skills;return q.countMode==='gained'&&typeof q.count==='object'?Object.entries(q.count).reduce((n,[l,v])=>n+(+l<=level?Number(v):0),0):Math.max(1,subclassValue(q.count||1,{level}));}
function optionsFor(c,p,q,context){let options=q.optionsByChoice?q.optionsByChoice[p.state[q.dependsOn]?.[0]]||[]:q.options||[];const f=q.filter;
 if(f?.type==='spell'){const catalog=[...subclassSpellOptions,...context.spells||[]],formula=expandedSubclassContext(c,p.row),inputs=p.state[`${q.key}:inputs`]||{};const maxLevel=Math.min(f.maxByClass?Math.min(9,Math.ceil(p.row.level/2)):9,f.maxBy?subclassValue(f.maxBy,formula):9,f.maxByInput?Number(inputs[f.maxByInput]??q.inputs?.find(i=>i.key===f.maxByInput)?.default??1):9);options=[...new Set(catalog.filter(s=>(s.edition||'2014')==='2014'&&(!f.classes||f.classes.some(cls=>(s.classes||[]).some(v=>(v.name||v)===cls)))&&(!f.levels||f.levels.includes(s.level))&&(!f.schools||f.schools.includes(s.school?.name||s.school))&&s.level<=maxLevel).map(s=>s.name))];}
 if(f?.type==='subclass')options=availableSubclasses(f.className).map(s=>s.name);
 if(f?.type==='creature'){const sizes=['Tiny','Small','Medium','Large','Huge','Gargantuan'];options=(context.creatures||[]).filter(s=>(s.type?.name||s.type)===f.creatureType&&Number(s.challenge_rating??s.cr)<=f.maxCR&&sizes.indexOf(s.size)<=sizes.indexOf(f.maxSize)).map(s=>s.name);}
 options=options.filter(n=>!(q.excludeDuplicatesAcross||[]).filter(key=>key!==q.key).some(key=>(p.state[key]||[]).includes(n)));
 options=options.filter(n=>!q.optionDetails?.some(d=>d.name===n&&d.minimumClassLevel>p.row.level));
 if(['skill','skill-expertise'].includes(q.kind))options=options.filter(n=>!c.skillProf?.[n]||q.kind==='skill-expertise'||p.state[q.key]?.includes(n));
 if(q.kind==='tool')options=options.filter(n=>!hasTraining(c,n));
 if(q.kind==='language')options=options.filter(n=>!list(c.languages).some(v=>norm(v)===norm(n)));
 if(q.kind==='skill-or-language')options=options.filter(n=>n.startsWith('Language: ')?!list(c.languages).some(v=>norm(v)===norm(n.slice(10))):!c.skillProf?.[n]);
 if(q.kind==='skill-or-tool')options=options.filter(n=>!hasTraining(c,n));
 if(q.kind==='cantrip')options=options.filter(n=>!(c.spells||[]).some(s=>!s.expandedSubclassManaged&&norm(s.name)===norm(n)));
 return [...new Set(options)];
}
export function expandedSubclassChoicePlan(c,previous=null,picks={},context={}){
 c=migrateLegacySubclassChoices(c);
 const base=independent(c),state=JSON.parse(JSON.stringify(c.expandedSubclassChoices||{})),groups=[];const scopes=context.scopes||['advancement'];
 for(const profile of expandedSubclassRows({...c,expandedSubclassChoices:state})){
  if(specialized.has(profile.mechanics?.adapter))continue;
  const {row,record}=profile;state[row.catalogId]||={};state[row.catalogId][record.id]||={};profile.state=state[row.catalogId][record.id];
  const definitions=[...(profile.mechanics?.choices||[])];if(record.flexibleFeatureSelection&&!definitions.some(q=>q.key==='later-subclass-feature'))definitions.unshift({key:'later-subclass-feature',feature:'Later subclass feature',level:record.entryLevel,kind:'feature',scope:'advancement',count:1,options:record.features.filter(f=>f.level>record.entryLevel).map(f=>f.name)});
  for(const original of definitions){
   if(['2014:subclass:fighter:champion','2014:subclass:fighter:brute-ua'].includes(record.id)&&original.key==='additional-fighting-style')continue;
   const flexible=original.key==='later-subclass-feature'&&record.flexibleFeatureSelection;
   const choices=flexible?(milestones[row.name]||[]).filter(l=>l>record.entryLevel&&l<=row.level).map(level=>({...original,key:`later-subclass-feature:${level}`,level,options:original.options.filter(n=>record.features.some(f=>f.name===n&&f.level<=level))})):[original];
   for(const q of choices){if(!scopes.includes(q.scope||'advancement')||q.level>row.level||!whenChoice(base,profile,q)||!flexible&&!expandedFeatureUnlocked(profile,q))continue;
    const id=expandedChoiceId(row,record,q.key),selected=list(picks[id]??profile.state[q.key]??[]);const inputs=(q.inputs||[]).map(input=>({...input,id:`${id}:input:${input.key}`,min:subclassValue(input.min??0,expandedSubclassContext(c,row)),max:subclassValue(input.max??99,expandedSubclassContext(c,row)),value:Number(picks[`${id}:input:${input.key}`]??profile.state[`${q.key}:inputs`]?.[input.key]??input.default??1)}));const inputsValid=inputs.every(input=>Number.isInteger(input.value)&&input.value>=input.min&&input.value<=input.max);if(inputs.length)profile.state[`${q.key}:inputs`]=Object.fromEntries(inputs.map(input=>[input.key,input.value]));let options=optionsFor(base,profile,q,context);
    if(flexible){const prior=(milestones[row.name]||[]).filter(l=>l<q.level).flatMap(l=>profile.state[`later-subclass-feature:${l}`]||[]);options=options.filter(n=>!prior.includes(n));}
    const count=countChoice(q,row.level),required=q.count?.languageAlternative&&selected.some(n=>n.startsWith('Language: '))?q.count.languageAlternative:['skill','tool','language','cantrip'].includes(q.kind)&&!q.freeText?Math.min(count,options.length):count;
    const quotaValid=(q.quotas||[]).every(quota=>selected.filter(n=>q.optionKinds?.[n]===quota.kind).length<=(quota.max??Infinity));
    const categoryValid=quotaValid&&(!q.count?.languageAlternative||!selected.some(n=>n.startsWith('Language: '))||selected.every(n=>n.startsWith('Language: ')))&&(q.kind!=='skill-or-tool'||selected.filter(n=>!skillNames.includes(n)).length<=1);
    const freeText=!!q.freeText,valid=inputsValid&&categoryValid&&selected.length===required&&new Set(selected.map(norm)).size===required&&selected.every(n=>options.includes(n)||freeText&&!!n.trim());
    const saved=profile.state[q.key]||[];if(valid)profile.state[q.key]=selected;
    if(context.includeSaved||!valid||picks[id]!==undefined||saved.length!==required)groups.push({id,choiceKey:q.key,kind:'expanded-choice',choiceKind:q.kind,scope:q.scope||'advancement',className:row.name,classId:row.catalogId,level:q.level,label:q.feature,count,required,options,freeText,selected,valid,inputs,sourceText:record.features.find(f=>f.id===q.featureId)?.description||q.notes||'',notes:q.notes,sourceUrl:record.sourceUrl});
   }
  }
 }
 const next=reconcileExpandedSubclasses({...c,expandedSubclassChoices:state});
 return {groups,valid:groups.every(g=>g.valid),patch:{...(next.featureChoices?{featureChoices:next.featureChoices}:{}),expandedSubclassChoices:next.expandedSubclassChoices,expandedSubclassTraining:next.expandedSubclassTraining,trainingGrants:next.trainingGrants,skillProf:next.skillProf,expertise:next.expertise,saveProf:next.saveProf,languages:next.languages,languageGrants:next.languageGrants}};
}
const trainingKind=kind=>({'skill-proficiency':'skills',skill:'skills','skill-expertise':'expertise',expertise:'expertise','tool-proficiency':'tools',tool:'tools','armor-proficiency':'armor',armor:'armor','weapon-proficiency':'weapons',weapon:'weapons','vehicle-proficiency':'vehicles','save-proficiency':'saves','saving-throw':'saves',language:'languages'}[kind]);
export function reconcileExpandedSubclasses(c){
 c=migrateLegacySubclassChoices(c);
 const base=independent(c),trainingGrants=[...base.trainingGrants],languageGrants=[...base.languageGrants],skillProf={...base.skillProf},expertise={...base.expertise},saveProf={...base.saveProf},previous={};let languages=list(base.languages);const state={};
 const add=(p,kind,name,key)=>{if(!kind||!name)return;if(kind==='saves')name=saveKey(name);const meta={expandedSubclassManaged:true,sourceClassId:p.row.catalogId,sourceClassName:p.row.name,subclassRecordId:p.record.id,sourceFeatureId:key};
  if(kind==='languages'){if(!languages.some(n=>norm(n)===norm(name))){languages.push(name);languageGrants.push({...meta,id:`expanded-language:${p.row.catalogId}:${key}:${norm(name)}`,name});}return;}
  const map={skills:skillProf,expertise,saves:saveProf}[kind];if(map){previous[kind]||={};if(!(name in previous[kind]))previous[kind][name]=!!base[{skills:'skillProf',expertise:'expertise',saves:'saveProf'}[kind]]?.[name];map[name]=true;if(kind==='expertise'){previous.skills||={};if(!(name in previous.skills))previous.skills[name]=!!base.skillProf[name];skillProf[name]=true;}}
  trainingGrants.push({...meta,classId:`expanded-training:${p.row.catalogId}:${key}:${norm(name)}`,className:p.row.name,edition:'2014',proficiencies:[{kind:kind==='expertise'?'skills':kind,name,index:norm(name)}]});
 };
 for(const p of expandedSubclassRows(c)){state[p.row.catalogId]={[p.record.id]:p.state};if(specialized.has(p.mechanics?.adapter))continue;
  for(const t of p.mechanics?.training||[])if(expandedFeatureUnlocked(p,t)&&whenChoice(base,p,t)&&t.kind!=='source-training')for(const name of list(t.value??t.values))add(p,trainingKind(t.kind),name,t.featureId||t.feature);
  for(const q of p.mechanics?.choices||[]){if(q.scope!=='advancement'||!expandedFeatureUnlocked(p,q)||!whenChoice(base,p,q))continue;const selected=p.state[q.key]||[];const options=optionsFor(base,p,q,{});for(const name of selected.filter(n=>options.includes(n)||q.freeText)){const language=q.kind==='skill-or-language'&&name.startsWith('Language: '),kind=language?'languages':q.kind==='skill-or-language'?'skills':q.kind==='skill-or-tool'?(skillNames.includes(name)?'skills':'tools'):trainingKind(q.kind);add(p,kind,language?name.slice(10):name,q.featureId||q.key);}}
 }
 const rows=characterClasses(c).map(row=>{const r=row.edition==='2014'?findExpandedSubclass(row.name,row.subclass):null;return r?{...row,subclass:legacySubclassName(r),subclassId:r.id}:Object.fromEntries(Object.entries(row).filter(([key])=>key!=='subclassId'));});
 return {...c,...(c.classLevels?.length?{classLevels:rows,subclass:rows[0]?.subclass||''}:{}),expandedSubclassChoices:state,expandedSubclassTraining:{previous},skillProf,expertise,saveProf,trainingGrants,languageGrants,languages:languages.join(', ')};
}
export function expandedSubclassResources(c){return expandedSubclassRows(c).flatMap(p=>{if(specialized.has(p.mechanics?.adapter)||p.mechanics?.adapter==='bladesinging')return [];return (p.mechanics?.resources||[]).filter(r=>expandedFeatureUnlocked(p,r)&&whenChoice(c,p,r)&&!r.key.startsWith('base:')).flatMap(r=>{let max;try{max=Math.max(0,Math.floor(subclassValue(r.max,expandedSubclassContext(c,p.row))));}catch{return [];}
 const id=expandedChoiceId(p.row,p.record,`resource:${r.key}`),saved=(c.resources||[]).filter(x=>x.id===id||x.classResourceKey===id),used=Math.max(0,...saved.map(x=>Number(x.used)||0));return [{...r,id,classResourceKey:id,expandedSubclassManaged:true,subclassRecordId:p.record.id,sourceClassId:p.row.catalogId,sourceClassName:p.row.name,className:p.row.name,edition:'2014',name:r.name+(r.key!==norm(r.name)?` · ${r.key.replaceAll('-',' ')}`:''),max,used,reset:r.reset,shortRecovery:r.reset==='short'?'all':0,manual:false,description:p.record.features.find(f=>f.id===r.featureId)?.description||r.notes||''}];});});}
const baseResource={'base:channel-divinity':'2014:channel-divinity','base:ki':'2014:Monk:points','base:bardic-inspiration':'2014:Bard:inspiration','base:wild-shape':'2014:Druid:wild-shape','base:sorcery-points':'2014:Sorcerer:points','base:rage':'2014:Barbarian:rage'};
export function expandedSubclassActions(c){return expandedSubclassRows(c).flatMap(p=>{if(specialized.has(p.mechanics?.adapter)||p.mechanics?.adapter==='bladesinging')return [];const actions=(p.mechanics?.actions||[]).filter(a=>expandedFeatureUnlocked(p,a)&&whenChoice(c,p,a));
 for(const cast of p.record.spellCasts||[])if(cast.classLevel<=p.row.level)actions.push({key:`spell-cast:${cast.spellSlug.toLowerCase()}`,name:cast.name,level:cast.classLevel,resourceKey:Object.keys(baseResource).find(key=>baseResource[key]===cast.resourceId),cost:cast.cost,requires:cast.sourceFeature,description:p.record.features.find(f=>f.name===cast.sourceFeature)?.description||'',rolls:[],timing:'spell-cast'});
 for(const d of p.record.disciplineOptions||[])if(d.name==='Elemental Attunement'||p.state.disciplines?.includes(d.name))actions.push({key:`discipline:${d.name}`,name:d.name,level:d.level,resourceKey:d.kiCost?'base:ki':null,cost:d.kiCost,requires:d.description,description:d.description,rolls:[],timing:'action'});
 return actions.map(a=>{const resourceId=a.resourceKey?(baseResource[a.resourceKey]||expandedChoiceId(p.row,p.record,`resource:${a.resourceKey}`)):null,resourceKnown=!a.resourceKey||!!baseResource[a.resourceKey]||p.mechanics.resources.some(r=>r.key===a.resourceKey);const context=expandedSubclassContext(c,p.row);const rolls=(a.rolls||[]).flatMap(r=>{try{return [{...r,expression:subclassRoll(r.expression,context)}];}catch{return [];}});let cost=0;try{cost=a.cost==null?0:subclassValue(a.cost,context);}catch{cost=null;}
 return {...a,id:expandedChoiceId(p.row,p.record,`action:${a.key}`),sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,resourceId,cost,rolls,supported:!a.referenceOnly&&resourceKnown&&cost!==null,description:a.description||p.record.features.find(f=>f.id===a.featureId)?.description||a.requires||a.notes||''};});});}
export function useExpandedSubclassAction(c,id,{eligible=false}={}){const action=expandedSubclassActions(c).find(a=>a.id===id);if(!action?.supported)throw Error('This feature requires its source-specific controls.');if(!eligible)throw Error('Confirm the source trigger and requirements first.');if(Number(c.hp?.current)<=0||list(c.conditions).some(n=>['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].includes(String(n?.name||n).toLowerCase())))throw Error('You must be conscious and able to act.');
 if(!action.resourceId||!action.cost)return {};
 const defs=expandedSubclassResources(c),resource=defs.find(r=>r.id===action.resourceId)||(c.resources||[]).find(r=>r.id===action.resourceId||r.classResourceKey===action.resourceId);if(!resource||!resource.unlimited&&resource.max-resource.used<action.cost)throw Error('Not enough resource uses remaining.');return {resources:[...(c.resources||[]).filter(r=>r.id!==resource.id&&r.classResourceKey!==resource.classResourceKey),{...resource,used:resource.unlimited?resource.used:resource.used+action.cost}]};
}
export function expandedSubclassSpellGrants(c){return expandedSubclassRows(c).flatMap(p=>{
 const ability=({Artificer:'int',Bard:'cha',Cleric:'wis',Druid:'wis',Paladin:'cha',Ranger:'wis',Sorcerer:'cha',Warlock:'cha',Wizard:'int',Monk:'wis',Barbarian:'wis',Fighter:'int',Rogue:'int'})[p.row.name];
 const grants=(p.record.spellGrants||[]).filter(g=>(!g.condition||p.state[g.condition]?.includes('yes'))&&g.classLevel<=p.row.level&&(!g.choiceKey||(p.state[g.choiceKey]||[]).some(n=>norm(n)===norm(g.choice)))&&(!g.requiresFeatureSelection||expandedSelectedFeatures(p).includes(g.feature)));
 if(p.record.flexibleFeatureSelection&&expandedSelectedFeatures(p).includes('Inky Shroud'))grants.push({name:'Darkness',classLevel:6,acquisition:'known'});
 if(p.record.id==='2014:subclass:druid:land')grants.length=0;// Existing terrain adapter owns its table.
 for(const q of p.mechanics?.choices||[]){if(q.scope!=='advancement'||!expandedFeatureUnlocked(p,q))continue;const selected=p.state[q.key]||[];
  if(q.spellsByOption)for(const option of selected)for(const spell of list(q.spellsByOption[option]))grants.push({...(typeof spell==='object'?spell:{name:spell}),classLevel:q.level,acquisition:'known',alwaysPrepared:false});
  if(['cantrip','spell'].includes(q.kind))for(const name of selected){const acquisition=q.feature==='Arcane Mastery'?'prepared':'known';grants.push({name,classLevel:q.level,acquisition,alwaysPrepared:acquisition==='prepared'});}
  if(q.kind==='domain'&&p.record.id==='2014:subclass:sorcerer:favored-soul-ua'){const domain=findExpandedSubclass('Cleric',selected[0]);for(const g of domain?.spellGrants||[])if(g.classLevel<=p.row.level)grants.push({...g,acquisition:'known',alwaysPrepared:false});}
 }
 return grants.map(g=>({...g,alwaysPrepared:g.acquisition==='prepared',edition:'2014',ability,sourceAbility:ability,source:p.record.name,sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,expandedSubclassManaged:true,bonusKnown:g.acquisition==='known'}));
});}
