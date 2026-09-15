import races from '../data/races.json';

export const standard14=['Common','Dwarvish','Elvish','Giant','Gnomish','Goblin','Halfling','Orc'];
export const exotic14=['Abyssal','Celestial','Draconic','Deep Speech','Infernal','Primordial','Sylvan','Undercommon'];
export const standard24=[...standard14,'Common Sign Language','Draconic'];
export const rare24=[...exotic14.filter(n=>n!=='Draconic'),'Druidic',"Thieves' Cant"];
const all35=['Common','Abyssal','Aquan','Auran','Celestial','Draconic','Dwarven','Elven','Giant','Gnoll','Gnome','Goblin','Halfling','Ignan','Infernal','Orc','Sylvan','Terran','Undercommon'];
const racial35={
  Human:[['Common'],all35],
  Dwarf:[['Common','Dwarven'],['Giant','Gnome','Goblin','Orc','Terran','Undercommon']],
  Elf:[['Common','Elven'],['Draconic','Gnoll','Gnome','Goblin','Orc','Sylvan']],
  Gnome:[['Common','Gnome'],['Draconic','Dwarven','Elven','Giant','Goblin','Orc']],
  'Half-Elf':[['Common','Elven'],all35],
  'Half-Orc':[['Common','Orc'],['Draconic','Giant','Gnoll','Goblin','Abyssal']],
  Halfling:[['Common','Halfling'],['Dwarven','Elven','Gnome','Goblin','Orc']],
};
const bgCounts={Acolyte:2,'Guild Artisan':1,Hermit:1,Noble:1,Outlander:1,Sage:2};

// Each choice retains its granting feature, so a race/background change cannot
// carry an ineligible language into the finished character.
export function languagePlan(c,intelligence=10) {
  const edition=c.ruleset||'2014', automatic=[],groups=[];
  const grant=(names,source)=>names.forEach(name=>{if(!automatic.some(x=>x.name===name))automatic.push({name,source});});
  const choice=(id,source,count,options)=>{if(count>0)groups.push({id,source,count,options:[...new Set(options)]});};
  if(edition==='custom'||c.raceDefinition?.referenceOnly||c.raceDefinition?.category==='race')return {automatic,groups,manual:true};
  if(edition==='2024'){
    grant(['Common'],'Starting language');choice('origin','Origin',2,standard24);
    if(c.className==='Rogue'){grant(["Thieves' Cant"],'Rogue');choice('rogue','Thieves’ Cant feature',1,[...standard24,...rare24]);}
  } else if(edition==='3.5'){
    const race=racial35[c.race];if(!race)return {automatic,groups,manual:true};
    grant(race[0],c.race);
    const extra=c.className==='Cleric'?['Abyssal','Celestial','Infernal']:c.className==='Druid'?['Sylvan']:c.className==='Wizard'?['Draconic']:[];
    choice('intelligence',`${c.race} / Intelligence`,Math.max(0,Math.floor((intelligence-10)/2)),[...race[1],...extra]);
  } else {
    const race=races.find(r=>r.name===c.race);if(!race)return {automatic,groups,manual:true};
    grant((race.languages||[]).map(x=>x.name),c.race);
    const options=c.allowExoticLanguages?[...standard14,...exotic14,'Druidic',"Thieves' Cant"]:standard14;
    choice('race',c.race,race.language_options?.choose||0,options);
    if(c.subrace==='High Elf')choice('subrace','High Elf',1,options);
    choice('background',c.background,bgCounts[c.background]||0,options);
    if(c.className==='Rogue')grant(["Thieves' Cant"],'Rogue');
    if(c.className==='Sorcerer'&&/draconic/i.test(c.subclass||''))grant(['Draconic'],'Draconic Bloodline');
  }
  if(c.className==='Druid')grant(['Druidic'],'Druid');
  return {automatic,groups,manual:false};
}

export function chosenLanguages(plan,choices={}) {
  const known=new Set(plan.automatic.map(x=>x.name)),valid={};
  for(const group of plan.groups){valid[group.id]=Array.from({length:group.count},(_,i)=>{const name=choices[group.id]?.[i];if(!group.options.includes(name)||known.has(name))return '';known.add(name);return name;});}
  return {choices:valid,names:[...known],complete:plan.groups.every(g=>valid[g.id].every(Boolean))};
}
