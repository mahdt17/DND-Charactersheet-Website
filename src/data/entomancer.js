export const entomancerId='homebrew:dandwiki:entomancer-5e';
export const entomancerSource='https://www.dandwiki.com/wiki/Entomancer_(5e_Class)';
export const entomancerSpellLists=['Druid','Druid (Optional)'];
export const isEntomancerSpellListEntry=spell=>spell.edition==='2014'&&(spell.classes||[]).some(value=>entomancerSpellLists.includes(value?.name||value));
export const populationTable=[2,3,4,6,7,8,10,11,12,14,15,16,18,19,20,22,23,24,26,27];
export const entomancerSlots=[[0,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
export const entomancerSpecies=['Decomposers','Endo-Gotas','Exo-Gotas','Orthoptera'];
export const entomancerInstruments=['Bagpipes','Drum','Dulcimer','Flute','Lute','Lyre','Horn','Pan flute','Shawm','Viol'];
const ref=(index,name)=>({index,name});
const item=(index,name,count=1)=>({option_type:'counted_reference',count,of:ref(index,name)});
const category=(index,name)=>({option_type:'choice',choice:{desc:name,choose:1,from:{equipment_category:ref(index,name)}}});
const choice=(desc,options)=>({desc,choose:1,from:{options}});
export const entomancerFeatures=[
 [1,'Entomancy','Cast Animal Friendship at will on insects of CR 1/8 or lower.'],
 [1,'Population','Spend the shared Population reserve on pestilence, swarms, summons and temporary armor. Feeding is required for long-rest recovery.'],
 [1,'Species','Choose Decomposers, Endo-Gotas, Exo-Gotas or Orthoptera. Species abilities arrive at levels 1, 6, 10, 14 and 18.'],
 [1,'Cantrips','Know a number of Druid cantrips equal to proficiency bonus. Once per long rest, spend an hour to exchange one.'],
 [2,'Spellcasting','Use Constitution for Druid-list spells. Prepared spell capacity equals maximum Population. Once per long rest, spend an hour to exchange up to your Wisdom modifier in prepared spells. Your living swarm remains a focus even with no Population available.'],
 [3,'Adaptation','Choose Dry or Humid, and Hot or Cold. Matching environments grant Survival advantage and immunity to exhaustion from those extremes; opposite environments impose Survival disadvantage.'],
 ...[4,8,12,16,19].map(n=>[n,'Ability Score Improvement','Increase one ability by 2 or two by 1, to a maximum of 20, or choose a feat if your table permits.']),
 [5,'Crawling Sensation','On a melee attack action, invest Population in an infestation after a failed Constitution save. Bonus actions deal that many d8 necrotic damage within 60 feet. The victim has disadvantage on Constitution checks, Constitution saves and attacks. Lasts Wisdom modifier minutes; constructs and elementals are immune.'],
 [7,'Many-Eyed','Advantage on Perception and Insight. Detect the presence of hidden or invisible entities within 100 feet; an action and 1 Population locate detected entities.'],
 [11,'Exo Skeleton','Medium armor proficiency. Add half Wisdom modifier, rounded down, to AC without heavy armor. Reduce nonmagical bludgeoning, piercing and slashing damage by proficiency bonus.'],
 [11,'Adaptation Improvement','Dry grants Stealth proficiency, or expertise if already proficient. Humid permits unhindered underwater movement/attacks and walking on liquids. Hot grants fire resistance; Cold grants cold resistance.'],
 [13,'Hive Mind','Psychic resistance. React and spend 3 Population for advantage on a save against a psychic attack. A bonus action and 2 Population end one charm or fear effect on yourself.'],
 [15,'Hungry Mouths','Once per long rest in an adapted environment, forage for an hour. Commit all remaining Population and return twice the amount committed (or 1 when empty), capped at maximum. May coincide with a short rest; recharges after a long rest when the swarm is fed.'],
 [17,'Swarm Form','Once per long rest, transform as an action for 1 minute. Retain statistics and HP; equipment transforms. AC becomes 10 + Dexterity modifier + Wisdom modifier; resist physical damage. Reaching 0 HP in this form causes immediate death. End with a bonus action.'],
 [18,'Adaptation Improvement','Dry removes your need for water and grants burrowing at half speed. Humid doubles underwater movement, grants underwater attack advantage and water breathing. Opposite environments no longer impose Adaptation penalties.'],
 [20,'Apex Predator','An action and 3 Population grant non-concentration invisibility for Wisdom + Constitution modifier minutes, retained while attacking or casting. Gain all Adaptations. Once per long rest in Swarm Form, attack with Strength or Dexterity + Wisdom + proficiency and deal damage equal to current HP.']
].map(([level,name,description],i)=>({index:`entomancer-${i}`,level,name,description,desc:[description],sourceUrl:entomancerSource}));
export const speciesFeatures={
 Decomposers:[
  [1,'Half Alive','Necrotic resistance. Necrotic spell damage gains one d4 per damage die; Population abilities are not spells.'],
  [6,'Corpse Jacker','Touch a Medium humanoid corpse: action, 2 Population, animate a zombie. Control at most Wisdom modifier zombies (minimum 1) for that many days. A destroyed zombie’s corpse cannot be reused.'],
  [10,'Decomposition','Send all available Population to a corpse within 30 feet. Tiny/Small/Medium/Large takes 0/1/2/4 turns; return the committed Population plus turns spent. Larger corpses are ineligible.'],
  [14,'Dead Man Walking','You need no food, but the swarm still does. You evade life/undead detection. Once per long rest, spend 3 Population when reduced to 0 HP to remain at 1 HP.'],
  [18,'Corpse Eater','Decomposition also heals Constitution modifier + maximum Population. Corpse Jacker costs 1 and accepts Large corpses.']
 ],
 'Endo-Gotas':[
  [1,'Hemo Vamprisis','After a successful grapple, spend 1 Population to latch on. At your turn start deal Constitution modifier + proficiency damage and heal damage actually dealt. Ends with the grapple. Constructs, undead, elementals and oozes are immune.'],
  [6,'Vampiric Agility','Gain Athletics proficiency and add Constitution modifier to grapple checks.'],
  [10,'Living Tick','Advantage on grapple checks; the grappled opponent has disadvantage on Strength and Dexterity checks.'],
  [14,'Neuro Toxin','When using Hemo Vamprisis, a failed Constitution save paralyzes the victim. Repeat the save at the end of each victim turn. Hemo damage also occurs at the end of that turn.'],
  [18,'Pure Terror','While latched, spend 1 Population: visible hostile creatures make Wisdom saves or become frightened for 5 minutes. Hemo damage against a frightened grappled victim becomes Constitution + twice proficiency + Wisdom.']
 ],
 'Exo-Gotas':[
  [1,'Abnormal Size','Increase Small to Medium or Medium to Large, height by 18 inches and weight twofold. Advantage on attacks against constructs.'],
  [6,'Monstrous Strength','Gain Athletics proficiency, or expertise if already proficient. Double speed, jumping and carrying capacity. Spend 2 Population with a melee weapon attack for +2 on the next attack and its damage.'],
  [10,'Improved Reflexes','Survival advantage; advantage on Dexterity saves against visible effects.'],
  [14,'Enhanced Exoskeleton','Resist nonmagical slashing. Add Constitution modifier to unarmed attack rolls. React and spend 2 Population for +2 AC; duration uses the saved table ruling.'],
  [18,'Invicta Periplaneta','Resist slashing and bludgeoning; heavy armor proficiency. Add Constitution modifier to AC in armor; unarmored AC may equal Entomancer level. Spend 4 Population for 2 minutes of resistance to all damage except types to which you are vulnerable.']
 ],
 Orthoptera:[
  [1,'Natural Savant','Choose an instrument proficiency and add Wisdom modifier to checks with it.'],
  [6,'Harmonize','Use an action to sing. Allies within 30 feet add Wisdom modifier to saves. Until level 14, moving or taking another action ends the song. Damage requires a Constitution concentration check.'],
  [10,'Sonic Sonnet','While singing, hostile creatures starting their turns in range make Wisdom saves against your Constitution spell DC: Wisdom + Constitution + proficiency psychic damage, half on success.'],
  [14,'Walking Orchestra','Harmonize permits movement and other actions; its radius becomes 60 feet.'],
  [18,'Soothing Serenade','While singing, hearing allies with at least 1 HP recover Wisdom modifier HP at the start of their turns.']
 ]
};
export const entomancerClass={
 catalogId:entomancerId,index:'entomancer',name:'Entomancer',category:'class',edition:'2014',homebrew:true,source:'Dandwiki homebrew',sourceUrl:entomancerSource,reviewedAt:'2026-10-15',hit_die:8,
 description:'A homebrew Constitution spellcaster who hosts an insect swarm. Four species govern its evolution; one Population reserve powers swarm abilities.',
 saving_throws:[ref('con','Constitution'),ref('wis','Wisdom')],
 proficiencies:[ref('light-armor','Light armor'),ref('simple-weapons','Simple weapons'),ref('martial-weapons','Martial weapons')],
 proficiency_choices:[{desc:'Choose three skills',choose:3,from:{options:['Animal Handling','Arcana','Deception','Intimidation','Investigation','Medicine','Nature','Persuasion','Survival'].map(name=>({item:ref('skill-'+name.toLowerCase().replaceAll(' ','-'),'Skill: '+name)}))}}],
 starting_equipment:[{equipment:ref('leather-armor','Leather armor'),quantity:1}],
 starting_equipment_options:[choice('Martial melee weapon or shortbow and arrows',[category('martial-melee-weapons','Martial melee weapon'),{option_type:'multiple',items:[item('shortbow','Shortbow'),item('arrow','Arrows',20)]}]),choice('Simple weapon, shield or explorer’s pack',[category('simple-weapons','Simple weapon'),item('shield','Shield'),item('explorers-pack','Explorer’s pack')])],
 spellcastingAbility:'con',spellLists:entomancerSpellLists,
 multi_classing:{prerequisites:[{ability_score:ref('con','Constitution'),minimum_score:13},{ability_score:ref('wis','Wisdom'),minimum_score:13}],proficiencies:[ref('light-armor','Light armor'),ref('simple-weapons','Simple weapons'),ref('martial-weapons','Martial weapons')]},
 progression:[['Level','Features','Population',...['1st','2nd','3rd','4th','5th']],...populationTable.map((max,i)=>[String(i+1),entomancerFeatures.filter(f=>f.level===i+1).map(f=>f.name).join(', '),String(max),...entomancerSlots[i].map(String)])]
};
