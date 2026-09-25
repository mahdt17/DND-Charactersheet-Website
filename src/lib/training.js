// Core multiclass grants: 2014 Basic Rules customization table and 2024 class
// descriptions. Class skill lists differ from several imported API choice lists.
const skills=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const rangerSkills=['Animal Handling','Athletics','Insight','Investigation','Nature','Perception','Stealth','Survival'];
const rogueSkills=['Acrobatics','Athletics','Deception','Insight','Intimidation','Investigation','Perception','Performance','Persuasion','Sleight of Hand','Stealth'];
const instruments=['Bagpipes','Drum','Dulcimer','Flute','Lute','Lyre','Horn','Pan flute','Shawm','Viol'];
const labels={'light-armor':'Light armor','medium-armor':'Medium armor','shields':'Shields','simple-weapons':'Simple weapons','martial-weapons':'Martial weapons','shortswords':'Shortswords','thieves-tools':"Thieves’ tools"};
const common=['light-armor','medium-armor','shields'];
const legacy={Barbarian:['shields','simple-weapons','martial-weapons'],Bard:['light-armor'],Cleric:common,Druid:common,Fighter:[...common,'simple-weapons','martial-weapons'],Monk:['simple-weapons','shortswords'],Paladin:[...common,'simple-weapons','martial-weapons'],Ranger:[...common,'simple-weapons','martial-weapons'],Rogue:['light-armor','thieves-tools'],Sorcerer:[],Warlock:['light-armor','simple-weapons'],Wizard:[]};
const revised={...legacy,Barbarian:['shields','martial-weapons'],Druid:['light-armor','shields'],Fighter:[...common,'martial-weapons'],Monk:[],Paladin:[...common,'martial-weapons'],Ranger:[...common,'martial-weapons'],Warlock:['light-armor']};
const normalize=s=>String(s||'').toLowerCase().replace(/[’']/g,'').trim();
const slug=s=>normalize(s).replace(/\s+/g,'-');
const editionOf=c=>c.ruleset||'2014';
const unsupported=r=>r?.prestige||r?.stats?.prestige||r?.homebrew||r?.source==='Homebrew';
const entry=index=>({index,name:labels[index],kind:index==='thieves-tools'?'tools':index.includes('armor')||index==='shields'?'armor':'weapons'});

export function coreMulticlassGrants(name,edition) {
  const table=edition==='2024'?revised:edition==='2014'?legacy:{};
  const indexes=Object.hasOwn(table,name)?table[name]:null;
  return indexes?.map(entry)??null;
}
export function coreClassSkillOptions(record) {
  if(unsupported(record)||!['2014','2024'].includes(record?.edition))return null;
  const options=record.name==='Bard'?skills:record.name==='Ranger'?rangerSkills:record.name==='Rogue'?rogueSkills.filter(s=>record.edition==='2014'||s!=='Performance'):null;
  return options?[...options]:null;
}
export function multiclassTrainingPlan(c,record) {
  const edition=editionOf(c),rows=c.classLevels?.length?c.classLevels:[{name:c.className,edition}];
  if(!record||rows.some(r=>r.name===record.name&&(r.edition||edition)===(record.edition||edition)))return {mode:'none',grants:[],choices:[]};
  const grants=coreMulticlassGrants(record.name,edition);
  if(!grants||record.edition!==edition||!['2014','2024'].includes(edition)||rows.some(r=>(r.edition||edition)!==edition)||unsupported(record))return {mode:'manual',grants:[],choices:[]};
  const choices=[];
  if(['Bard','Ranger','Rogue'].includes(record.name)) {
    const all=coreClassSkillOptions(record);
    const options=all.filter(s=>!c.skillProf?.[s]&&!c.expertise?.[s]);
    choices.push({id:'skill',label:'Multiclass skill',kind:'skills',options,required:options.length>0});
  }
  if(record.name==='Bard') {
    const known=[...String(c.toolProf||'').split(/[,;\n]/),...(c.trainingGrants||[]).flatMap(g=>(g.proficiencies||[]).filter(p=>p.kind==='tools').map(p=>p.name))].map(normalize);
    const options=instruments.filter(n=>!known.includes(normalize(n)));
    choices.push({id:'instrument',label:'Multiclass musical instrument',kind:'tools',options,required:options.length>0});
  }
  return {mode:'automatic',grants,choices};
}
export function trainingChoicesValid(plan,picks={}) {
  return plan.choices.every(c=>c.required?c.options.includes(picks[c.id]):!picks[c.id]);
}
export function applyMulticlassTraining(c,record,picks={}) {
  const plan=multiclassTrainingPlan(c,record);
  if(plan.mode!=='automatic')return {};
  if(!trainingChoicesValid(plan,picks)||Object.keys(picks).some(k=>!plan.choices.some(c=>c.id===k)))throw Error('Complete the multiclass proficiency choices before leveling up.');
  const proficiencies=[...plan.grants,...plan.choices.filter(c=>picks[c.id]).map(c=>({kind:c.kind,name:picks[c.id],index:(c.kind==='skills'?'skill-':'')+slug(picks[c.id])}))];
  return {skillProf:{...c.skillProf,...Object.fromEntries(proficiencies.filter(p=>p.kind==='skills').map(p=>[p.name,true]))},
    trainingGrants:[...(c.trainingGrants||[]),{classId:record.catalogId||`${record.edition}:${record.index||record.name}`,className:record.name,edition:record.edition,proficiencies}]};
}
export function recordedTraining(c) {
  const entries=(c.trainingGrants||[]).flatMap(g=>g.proficiencies||[]);
  // Fixed grants can be recovered for older core multiclass saves. Skill and
  // instrument choices are never inferred.
  if(['2014','2024'].includes(editionOf(c)))for(const row of (c.classLevels||[]).slice(1)) {
    if(row.edition===editionOf(c)&&!unsupported(row.definition))entries.push(...coreMulticlassGrants(row.name,row.edition)||[]);
  }
  return [...new Map(entries.map(p=>[p.index,p])).values()];
}
export function startingProficiencies(c,fallback=[]) {
  const primary=c.classLevels?.[0]?.definition||c.classDefinition;
  const list=primary?.proficiencies;
  if(Array.isArray(list)&&list.every(p=>typeof p?.index==='string'))return list;
  // Published source catalogs sometimes store grouped prose instead of API
  // identifiers. Use the core SRD fallback; never infer a Homebrew package.
  return unsupported(primary)?[]:fallback;
}
export function hasWeaponTraining(c,weapon,starting=[]) {
  const override=c.weaponTrainingOverrides?.[weapon.index];
  if(typeof override==='boolean')return override;
  let primary=starting.map(p=>typeof p==='string'?p:p.index);
  // Revised weapon traits are category/property rules, not the 2014 list.
  const first=c.classLevels?.[0],edition=first?.edition||c.classDefinition?.edition||(c.ruleset==='custom'?c.mechanics:editionOf(c)),name=first?.name||c.className;
  if(edition==='2024'&&!unsupported(first?.definition||c.classDefinition)&&Object.hasOwn(revised,name)) {
    primary=['simple-weapons'];
    if(['Barbarian','Fighter','Paladin','Ranger'].includes(name))primary.push('martial-weapons');
    if(weapon.weapon_category==='Martial'&&((name==='Monk'&&weapon.properties?.some(p=>p.index==='light'))||(name==='Rogue'&&weapon.properties?.some(p=>['light','finesse'].includes(p.index)))))primary.push(weapon.index);
  }
  const proficiencies=[...primary,...recordedTraining(c).filter(p=>p.kind==='weapons').map(p=>p.index)];
  return proficiencies.includes(`${weapon.weapon_category?.toLowerCase()}-weapons`)||proficiencies.some(p=>p===`${weapon.index}s`||p===weapon.index||p===weapon.index.split('-').reverse().join('-')+'s');
}
