export const eladrinId='2014:eladrin-motm';
export const eladrinSeasons=['Autumn','Winter','Spring','Summer'];
export const eladrinAbilities={int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
export const eladrinRace={
 index:'eladrin-motm',catalogId:eladrinId,name:'Eladrin',edition:'2014',size:'Medium',type:'Humanoid',speed:30,
 source:'Mordenkainen Presents: Monsters of the Multiverse',sourceUrl:'https://dnd5e.wikidot.com/lineage:eladrin',
 description:'Monsters of the Multiverse. A seasonal elf from the Feywild, with Fey Step and adaptable Trance training.',
 bonuses:{},flexibleAbilities:true,
 traits:[
  {name:'Darkvision',description:'60 feet; darkness appears gray.'},
  {name:'Fey Ancestry',description:'Advantage on saves to avoid or end being charmed. Humanoid; counts as an elf.'},
  {name:'Fey Step',description:'Bonus action: teleport up to 30 feet to visible, unoccupied space. Uses equal proficiency bonus; long-rest recovery. Seasonal effects begin at character level 3.'},
  {name:'Keen Senses',description:'Perception proficiency.'},
  {name:'Trance',description:'Immune to magical sleep. A conscious 4-hour Trance completes a long rest; then change season and optionally gain two PHB weapon/tool proficiencies until the next long rest.'}
 ]
};
