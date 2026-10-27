export const lupinId='2014:lupin-conversion';
export const lupinSourceUrl='https://new.dndtools.org/races/lupin-32';
const trait=(name,description)=>({name,description,raceGrantId:lupinId});
export const lupinRace={catalogId:lupinId,index:'lupin-conversion',name:'Lupin',displayName:'Lupin (5e conversion)',edition:'2014',source:'Unofficial 5e conversion · Dragon Compendium p.18',sourceUrl:lupinSourceUrl,homebrewConversion:true,size:'Medium',type:'Humanoid',speed:30,bonuses:{wis:2,dex:1},languages:[{name:'Common'},{name:'Lupin'}],description:'Unofficial 5e adaptation of the dog-headed trackers and riders from Dragon Compendium: keen senses and a tradition of hunting werewolves.',traits:[
 trait('Lupin Heritage · 5e conversion','Medium Humanoid; Wisdom +2, Dexterity +1. Walking speed 30 feet. This is an unofficial adaptation of a 3.5 race.'),
 trait('Darkvision','See dim light within 60 feet as bright light, and darkness as dim light, in shades of gray.'),
 trait('Keen Hearing and Smell','Advantage on Wisdom (Perception) checks relying on hearing or smell.'),
 trait('Acute Smell','Action: DC 10 Wisdom (Perception) to scent a lycanthrope within 30 feet (60 upwind, 15 downwind), or locate a hidden creature within 5 feet. Locating does not negate invisibility.'),
 trait('Tracker','Advantage on Wisdom (Survival) checks to follow tracks.'),
 trait('Expert Rider','Proficiency in Animal Handling.'),
 trait('Odor Sensitivity','Disadvantage on saving throws against odor-based effects.'),
 trait('Werewolf Hunter','Against a confirmed werewolf, weapon attack and damage rolls gain +1. Use the dedicated hunting controls.'),
 trait('Languages','You know Common and Lupin.')
]};
