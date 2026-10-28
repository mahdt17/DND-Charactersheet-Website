import records from '../data/expandedSubclasses.json' with {type:'json'};
export const subclassNameKey=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const aliases={Barbarian:{berserker:'Berserker','pathoftheberserker':'Berserker',pathofthetotemwarrior:'Totem Warrior'},Bard:{collegeoflore:'Lore'},Cleric:{lifedomain:'Life'},Druid:{circleoftheland:'Land'},Monk:{wayoftheopenhand:'Open Hand'},Paladin:{oathofdevotion:'Devotion'},Rogue:{thief:'Thief'},Sorcerer:{draconic:'Draconic Bloodline',draconicsorcery:'Draconic Bloodline'},Warlock:{thefiend:'Fiend',fiendpatron:'Fiend'},Wizard:{schoolofevocation:'Evocation'}};
export function subclassEntryLevel(className,edition='2014'){return edition==='2024'?3:edition==='2014'?({Cleric:1,Sorcerer:1,Warlock:1,Wizard:2,Druid:2}[className]||3):null;}
export function availableSubclasses(className,edition='2014'){return edition==='2014'?records.filter(r=>!className||r.class.name===className):[];}
export function findExpandedSubclass(className,value){const key=subclassNameKey(value),alias=aliases[className]?.[key];return records.find(r=>r.class.name===className&&(r.id===value||r.index===value||subclassNameKey(r.name)===key||alias===r.name))||null;}
export const subclassLabel=r=>`${r.name} · ${r.sourceBook}${r.playtest?' · Playtest':''}`;
export const legacySubclassName=r=>({'2014:subclass:barbarian:totem-warrior':'Path of the Totem Warrior'}[r.id]||r.name);
