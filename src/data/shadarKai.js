const commonTraits=[
 {name:'Elf Heritage',description:'Medium humanoid elf; walking speed 30 feet.'},
 {name:'Darkvision',description:'Darkvision extends 60 feet; darkness is perceived in gray.'},
 {name:'Keen Senses',description:'You gain proficiency in Perception.'},
 {name:'Necrotic Resistance',description:'You have resistance to necrotic damage.'}
];
export const shadarKaiRaces=[
 {index:'shadar-kai-mtf',catalogId:'2014:shadar-kai-mtf',displayName:'Shadar-kai · Tome of Foes (2018)',version:'mtf',source:"Mordenkainen’s Tome of Foes (2018)",sourceUrl:'https://dnd5e.wikidot.com/lineage:shadar-kai-mtf',description:'Tome of Foes (2018). Dexterity +2, Constitution +1; one teleport per long rest.',bonuses:{dex:2,con:1},languages:[{name:'Common'},{name:'Elvish'}],traits:[
  ...commonTraits,
  {name:'Fey Ancestry',description:'Advantage on saves against being charmed; magical sleep cannot affect you.'},
  {name:'Trance',description:'Four hours of semiconscious meditation provides the benefit of eight hours of human sleep.'},
  {name:'Blessing of the Raven Queen',description:'Bonus action: teleport up to 30 feet to visible, empty space, once per long rest. From character level 3, resist all damage until your next turn starts.'}
 ]},
 {index:'shadar-kai-motm',catalogId:'2014:shadar-kai-motm',displayName:'Shadar-kai · Multiverse (2022)',version:'motm',source:'Mordenkainen Presents: Monsters of the Multiverse (2022)',sourceUrl:'https://dnd5e.wikidot.com/lineage:shadar-kai-mpmm',description:'Monsters of the Multiverse (2022). Flexible ability bonuses; proficiency-bonus teleports per long rest.',bonuses:{},flexibleAbilities:true,languages:[{name:'Common'}],language_options:{choose:1},traits:[
  ...commonTraits,
  {name:'Fey Ancestry',description:'Advantage on saves to avoid or end the charmed condition on yourself.'},
  {name:'Trance',description:'Magical sleep cannot affect you. Four hours of conscious meditation completes a long rest. Afterward, optionally gain two new PHB weapon/tool proficiencies until your next long rest.'},
  {name:'Blessing of the Raven Queen',description:'Bonus action: teleport up to 30 feet to visible, empty space. Uses equal proficiency bonus; recover on a long rest. From character level 3, resist all damage until your next turn starts.'}
 ]}
].map(race=>({...race,name:'Shadar-kai',edition:'2014',size:'Medium',type:'Humanoid',speed:30,traits:race.traits.map(trait=>({...trait,raceGrantId:race.catalogId}))}));
