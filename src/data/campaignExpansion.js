// Homebrew 5e conversions. PDF constraints override the legacy source baselines.
export const necroticRules={
 'necrotic-awareness':{range:'60 feet',minutes:10,concentration:true,effect:'sense',description:'Concentrate on a 60-foot cone: presence, count, then location of cyst-bearers over three rounds.'},
 'necrotic-cyst':{range:'Touch',save:'con',effect:'cyst',description:'Living target; CON negates implantation. A cyst gives -2 against necromancy and +1d6 damage from undead natural attacks. Protection against evil blocks initial implantation. Surgery: one hour, Medicine DC 20; failure is fatal by default.'},
 'necrotic-scrying':{range:'Unlimited',minutes:10,concentration:true,effect:'scry',requiresCyst:true,description:'See/hear through one same-plane cyst-bearer. Lead, antimagic and divination protection block the sensor. Default duration 10 minutes.'},
 'necrotic-bloat':{range:'100 feet',effect:'damage',requiresCyst:true,damageCap:10,description:'An existing cyst deals 1d6 necrotic damage per total character level, maximum 10d6. Conversion default replaces legacy vile damage with necrotic damage.'},
 'necrotic-domination':{range:'25 feet',save:'wis',minutes:1440,effect:'control',requiresCyst:true,description:'Cyst-bearing creature; WIS negates. Telepathic control for one day, as fixed by the guide. Commands and target eligibility remain player-confirmed.'},
 'necrotic-burst':{range:'100 feet',save:'con',effect:'burst',requiresCyst:true,damageCap:15,description:'CON success: up to 15d6 necrotic damage, one die per total character level. Failure kills the cyst-bearer. A free-willed cyst emerges next round; it is not your follower.'},
 'necrotic-eruption':{range:'100 feet',save:'con',effect:'eruption',requiresCyst:true,damageCap:15,description:'As Burst; failed primary save also exposes creatures within 20 feet to the same damage, DEX half. Damaged creatures make CON saves against cyst implantation.'},
 'necrotic-tumor':{range:'100 feet',save:'con',effect:'control',requiresCyst:true,description:'CON failure: permanent control of the cyst-bearer. Success: a reasonable suggestion for one day (adjustable conversion).'},
 'necrotic-empowerment':{range:'Self',effect:'empower',description:'One round per total character level: +8 DEX/INT/WIS, +8 AC, +5 CON saves, 100 temporary HP. Other Mother Cyst spells are unavailable while active. Strong legacy-derived default; all bonuses are editable.'},
 'necrotic-termination':{range:'100 feet',save:'con',effect:'termination',requiresCyst:true,damageCap:25,cost:1000,description:'CON success: up to 25d6 necrotic damage. Failure kills and prevents resurrection until explicitly overturned by the table. Default XP replacement: 1,000 gp, adjustable.'},
 'monstrous-thrall':{range:'100 feet',save:'wis',effect:'control',cost:1000,description:'Permanent control on failed WIS save. Against-nature orders allow WIS -4; successful refusal applies to that order only. Default range 100 feet and consumed materials 1,000 gp are adjustable.'},
 'awaken-magical-beast':{range:'Touch',effect:'awaken',cost:1000,description:'Living beast/monstrosity, INT 3 or lower (editable eligible types): set INT to 3d6, add 1d3 CHA and two hit dice, grant a language. No control. Default material cost 1,000 gp.'}
};
export const outsideCampaignSpells=['monstrous-thrall','awaken-magical-beast'].map(id=>({catalogId:'darkdonte:'+id,index:id,name:id.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),level:9,edition:'2014',category:'spell',classes:['Archivist'],source:'Campaign conversion defaults',...necroticRules[id]}));
export const graftRecipes=[
 ...[250,750,2000,4500,9000].map((cost,index)=>({
  id:index===0?'chitin':`chitin-${index+1}`,name:`Chitin Plating +${index+1}`,cost,ac:index+1,prerequisites:[],
  description:'Additive AC bonus. Only the highest Chitin Plating bonus applies.'
 })),
 {id:'spine',name:'Flexible Spine',cost:2000,initiative:4,acrobatics:4,prerequisites:['Regenerate (7th level)'],description:'+4 initiative and Acrobatics.'},
 {id:'legs',name:'Extended Legs',cost:500,speed:5,prerequisites:['Longstrider (1st level)'],description:'+5 feet walking speed.'},
 {id:'blood',name:'Healing Blood',cost:12000,healing:2,prerequisites:['Regenerate (7th level)'],description:'Regain 2 HP at the start of each turn while alive, including at 0 HP.'},
 {id:'eyes',name:'Rudimentary Eyespots',cost:1000,perception:4,prerequisites:['Regenerate (7th level)'],description:'+4 Perception. The table’s flanking rule cannot flank the recipient.'},
 {id:'bones',name:'Silthilar Bones',cost:5000,abilities:{con:2},prerequisites:['Enhance Ability: Bear’s Endurance (Constitution)'],description:'+2 CON, to a maximum of 20. Maximum HP increases by hit dice when the modifier increases.'},
 {id:'muscles',name:'Silthilar Muscles',cost:5000,abilities:{str:2},prerequisites:['Enhance Ability: Bull’s Strength (Strength)'],description:'+2 STR, to a maximum of 20.'},
 {id:'tendons',name:'Silthilar Tendons',cost:5000,abilities:{dex:2},prerequisites:['Enhance Ability: Cat’s Grace (Dexterity)'],description:'+2 DEX, to a maximum of 20.'},
 {id:'heart',name:'Silthilar Heart',cost:2500,heart:true,prerequisites:['Cure Wounds cast at 3rd level','Contingency (6th level)'],description:'At 0 HP while alive, restore 4d8 + 20 HP once per 24 hours.'}
];
export const scrollScribingCosts=[
 {days:1,cost:15},{days:1,cost:25},{days:3,cost:250},{days:5,cost:500},
 {days:10,cost:2500},{days:20,cost:5000},{days:40,cost:15000},
 {days:80,cost:25000},{days:160,cost:50000},{days:240,cost:250000}
];
export const psionPoints=[0,2,6,11,17,25,35,46,58,72,88,106,126,147,170,195,221,250,280,311,343];
export const psionKnown=[0,3,5,7,9,11,13,15,17,19,21,22,24,25,27,28,30,31,33,34,36];
export const thrallFeatures=[[1,'Thrallherd'],[3,'Psionic Charm'],[5,'Psionic Dominate'],[7,'Greater Dominate'],[9,'Superior Dominate'],[10,'Twofold Master']];
