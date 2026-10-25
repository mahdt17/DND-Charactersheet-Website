export const aasimarId='2014:aasimar-vgm';
export const aasimarSource="Volo's Guide to Monsters · pp. 104–105";
const trait=(name,description,extra={})=>({name,description,raceGrantId:aasimarId,...extra});
export const aasimarSubraces=[
 {id:'protector',name:'Protector Aasimar',ability:'wis',feature:'Radiant Soul',damageType:'radiant',description:'A celestial guardian whose transformation grants luminous wings.',rules:'From character level 3, use an action to transform for 1 minute; end early as a bonus action. Gain a flying speed of 30 feet. Once on each of your turns, when an attack or spell damages a target, add radiant damage equal to your character level. One transformation per long rest.'},
 {id:'scourge',name:'Scourge Aasimar',ability:'con',feature:'Radiant Consumption',damageType:'radiant',description:'Radiant power burns from within, illuminating and searing the surroundings.',rules:'From character level 3, use an action to transform for 1 minute; end early as a bonus action. Shed bright light for 10 feet and dim light for another 10 feet. At the end of each of your turns, you and every creature within 10 feet take radiant damage equal to half your character level, rounded up. Once on each of your turns, when an attack or spell damages a target, add radiant damage equal to your character level. One transformation per long rest.'},
 {id:'fallen',name:'Fallen Aasimar',ability:'str',feature:'Necrotic Shroud',damageType:'necrotic',description:'Shadowed celestial power manifests as skeletal, flightless wings.',rules:'From character level 3, use an action to transform for 1 minute; end early as a bonus action. On activation, other creatures within 10 feet that can see you make a Charisma save (DC 8 + proficiency bonus + Charisma modifier) or are frightened of you until the end of your next turn. Once on each of your turns, when an attack or spell damages a target, add necrotic damage equal to your character level. These wings do not grant flight. One transformation per long rest.'}
].map(v=>({...v,index:'aasimar-vgm-'+v.id,race:{name:'Aasimar'},ability_bonuses:[{ability_score:{index:v.ability},bonus:1}],racial_traits:[trait(v.feature,v.rules,{level:3})]}));
export const aasimarRace={
 index:'aasimar-vgm',catalogId:aasimarId,name:'Aasimar',edition:'2014',size:'Medium',type:'Humanoid',speed:30,
 source:aasimarSource,description:'Legacy 5e celestial descendants from Volo’s Guide to Monsters. Choose Protector, Scourge or Fallen.',bonuses:{cha:2},languages:[{name:'Common'},{name:'Celestial'}],
 traits:[
  trait('Celestial Heritage','Medium humanoid; walking speed 30 feet. Mature at a human rate and can live up to 160 years.'),
  trait('Darkvision','See dim light within 60 feet as bright light, and darkness as dim light. Colors in darkness appear as shades of gray.'),
  trait('Celestial Resistance','Resistance to radiant and necrotic damage.'),
  trait('Healing Hands','As an action, touch a creature to restore hit points equal to your character level. Once per long rest.'),
  trait('Light Bearer','Know the Light cantrip; Charisma is its spellcasting ability. This is additional to class cantrips.'),
  trait('Languages','Speak, read and write Common and Celestial.'),
  trait('Angelic Guide','An angelic guide can send dreams, visions and omens. Work with the DM on this optional roleplaying connection.')
 ]
};
