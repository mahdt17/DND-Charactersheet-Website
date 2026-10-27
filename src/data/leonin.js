export const leoninId='2014:leonin-mot';
export const leoninSkills=['Athletics','Intimidation','Perception','Survival'];
const trait=(name,description)=>({name,description,raceGrantId:leoninId});
export const leoninRace={catalogId:leoninId,index:'leonin-mot',name:'Leonin',edition:'2014',source:'Mythic Odysseys of Theros',sourceUrl:'https://dnd5e.wikidot.com/lineage:leonin',size:'Medium',type:'Humanoid',speed:35,bonuses:{str:1,con:2},languages:[{name:'Common'},{name:'Leonin'}],description:'Lionlike humanoids of Oreskos, with keen instincts, natural claws and a frightening roar.',traits:[
 trait('Leonin Heritage','Medium humanoid. Strength +1, Constitution +2; walking speed 35 feet. Maturity and lifespan resemble those of humans.'),
 trait('Darkvision','Within 60 feet, treat dim light as bright and darkness as dim. Darkness reveals shades of gray rather than colors.'),
 trait('Claws','Your natural claws can make unarmed strikes for 1d4 + Strength modifier slashing damage.'),
 trait("Hunter's Instincts",'Choose proficiency in Athletics, Intimidation, Perception or Survival.'),
 trait('Daunting Roar','Bonus action: choose creatures within 10 feet that can hear you. They make a Wisdom save against DC 8 + proficiency bonus + Constitution modifier; failure frightens them of you through the end of your next turn. One use, recovered after a short or long rest.'),
 trait('Languages','You know Common and Leonin.')
]};
