import {necroticRules,thrallFeatures,psionPoints,psionKnown} from './campaignExpansion.js';
export const campaignSource='Adjustable 5e class conversions';
export const campaignIds={archivist:'homebrew:darkdonte:archivist',psion:'homebrew:darkdonte:telepath',thrallherd:'homebrew:darkdonte:thrallherd'};
export const campaignPPId='darkdonte:shared:power-points';
export const campaignDarkId='darkdonte:archivist:dark-knowledge';
const ref=(index,name)=>({index,name});
export const archivistFeatures=[
 [1,'Prayerbook','Intelligence-based divine casting using 5e Wizard slots. Begin with all Cleric cantrips and 3 + starting Intelligence modifier first-level Cleric spells. Gain two Cleric-list spells at each later Archivist level. Copy other divine spells from approved scrolls. Prepare character level + current Intelligence modifier spells. Rituals can be cast from the prayerbook.'],
 [1,'Arcane Recovery','Once per long-rest cycle, when completing a short rest, recover expended spell slots totaling half your Archivist level (rounded up). Only slots of levels 1–5 can be recovered.'],
 [1,'Scribe Scroll','Use Xanathar’s downtime, costs, Arcana proficiency, spell access and components. Scribing does not spend spell slots. Prayerbook copying costs 50 gp and 2 hours per spell level. Copying a scroll requires Intelligence (Arcana), DC 10 + spell level, and consumes the source. Own-book backup costs 10 gp and 1 hour per spell level.'],
 [1,'Dark Knowledge: Tactics','Knowledge check DC 15; +1 to allied attacks against the studied creatures, +2 at 25, +3 at 35. No Action, once per turn; within 60 feet for 1 minute. Identical effects refresh without stacking. Uses per day: 3 + one per 3 Archivist levels, maximum 9.'],
 [2,'Lore Mastery','Select a knowledge skill for +2. Additional selections at Archivist 7, 13 and 17. Skill mapping and stacking are adjustable conversion rulings.'],
 [4,'Still Mind','Advantage on saves against mind-altering spells and effects, including qualifying effects outside the Enchantment school.'],
 [5,'Dark Knowledge: Puissance','The same check thresholds grant allies +1/+2/+3 to saves against studied creatures.'],
 [7,'Lore Mastery'],[8,'Dark Knowledge: Foe','The same check thresholds grant allies +1d6/+2d6/+3d6 weapon damage against studied creatures.'],
 [10,'Bonus feat'],[11,'Dark Knowledge: Dread Secret','Default conversion: one target, 1 round. Check 15: disadvantage on attacks and sight-based Perception; 25: incapacitated; 35: stunned. These replace 3.5 dazzled/dazed/stunned in this conversion.'],
 [13,'Lore Mastery'],[14,'Dark Knowledge: Foreknowledge','The same check thresholds grant allies within 30 feet +1/+2/+3 AC against the studied creature.'],[17,'Lore Mastery'],[20,'Bonus feat']
];
export const campaignClasses=Object.entries(campaignIds).map(([kind,catalogId])=>({
 catalogId,index:'darkdonte-'+kind,name:{archivist:'Archivist',psion:'Psion (Telepath)',thrallherd:'Thrallherd'}[kind],category:'class',edition:'2014',homebrew:true,prestige:kind==='thrallherd',source:campaignSource,campaignKind:kind,hit_die:6,spellcastingAbility:kind==='thrallherd'?'':'int',spellLists:kind==='archivist'?['Cleric']:[],
 description:kind==='archivist'?'5e conversion: prayerbook scholar with Dark Knowledge. Editable conversion defaults.':kind==='psion'?'5e conversion: Telepath levels 1–20, chosen powers and bonus feats, and an Intelligence-based power point reserve.':'5e conversion: prestige progression 1–10, with manifesting advancement and follower roster. Requires level 5, Arcana and Religion proficiency, and Mindlink.',
 saving_throws:kind==='archivist'?[ref('con','Constitution'),ref('wis','Wisdom')]:[ref('int','Intelligence'),ref('wis','Wisdom')],
 proficiencies:kind==='archivist'?[ref('light-armor','Light armor'),ref('simple-weapons','Simple weapons')]:[ref('simple-weapons','Simple weapons')],
 proficiency_choices:[{choose:2,desc:'Choose two skills (conversion default)',from:{options:['Arcana','History','Medicine','Nature','Religion'].map(name=>({item:ref('skill-'+name.toLowerCase(),'Skill: '+name)}))}}],
 multiclassRequirement:'Intelligence 13',multi_classing:{proficiencies:kind==='archivist'?[ref('light-armor','Light armor')]:[]},starting_equipment:[],starting_equipment_options:[],supportedLevels:kind==='thrallherd'?10:20,
 progression:[['Level','Features'],...Array.from({length:kind==='thrallherd'?10:20},(_,i)=>[String(i+1),kind==='archivist'?archivistFeatures.filter(f=>f[0]===i+1).map(f=>f[1]).concat([4,8,12,16,19].includes(i+1)?['Ability Score Improvement']:[]).join(', '):kind==='psion'?`${psionPoints[i+1]} base PP; ${psionKnown[i+1]} powers; ${[1,5,10,15,20].includes(i+1)?'Bonus feat':''}${[4,8,12,16,19].includes(i+1)?'; Ability Score Improvement':''}`:thrallFeatures.filter(([level])=>level===i+1).map(([,name])=>name).concat(i>0&&i<9?['+1 manifesting level']:[],[4,8].includes(i+1)?['Ability Score Improvement']:[]).join(', ')])]
}));
export const featTimeline=[
 {name:'Mother Cyst',characterLevel:1,kind:'human',level:1,description:'Automatic access to the necrotic spell chain at total-character-level spell tiers (1, 3, 5, 7, 9, 11, 13, 15, 17). Discovery and copying are not required.'},
 {name:'Psicrystal Affinity',characterLevel:2,kind:'psion',level:1,description:'Sage Psicrystal; +3 Arcana while within one mile. An acquired Ring of Spell Storing can be assigned to the crystal for autonomous revival with a stored eligible spell.'},
 {name:'Reach Spell',characterLevel:5,kind:'archivist',level:4,description:'Eligible Touch spells become 30 feet; +2 adjusted slot levels.'},
 {name:'Draconic Archivist',characterLevel:10,kind:'archivist',level:8,description:'Dark Knowledge also applies to dragons and constructs, using Arcana.'},
 {name:'Chain Spell',characterLevel:12,kind:'archivist',level:10,description:'One primary target, secondary targets up to the higher of Archivist level or approved effective caster level (maximum 20), each within 30 feet of primary. +3 slot levels; nondamaging secondary save DC -4. Adjusted Archivist slot costs cap at 9. Damaging secondaries take half the primary damage, then Dexterity save for half again.'},
 {name:'Graft Flesh: Silthilar',characterLevel:14,kind:'archivist',level:12,description:'Use the Campaign workshop for compatible grafts. Proper materials, facilities and prerequisite spells allow automatic installation without attunement.'},
 {name:'Cooperative Spell',characterLevel:18,kind:'archivist',level:16,description:'Same spell and feat; highest participant DC +2 for first cooperator, +1 each additional. The lead uses normal casting and concentrates alone. Adjacent helpers each spend their own slot and reaction.'}
];
export const cystSpells=[['Necrotic Awareness',1],['Necrotic Cyst',2],['Necrotic Scrying',2],['Necrotic Bloat',3],['Necrotic Domination',4],['Necrotic Burst',5],['Necrotic Eruption',6],['Necrotic Tumor',7],['Necrotic Empowerment',8],['Necrotic Termination',9]].map(([name,level])=>({name,level,range:name==='Necrotic Cyst'?'Touch':name==='Necrotic Domination'?'25 feet':name==='Necrotic Tumor'?'100 feet':undefined,catalogId:'darkdonte:'+name.toLowerCase().replaceAll(' ','-'),edition:'2014',category:'spell',classes:['Archivist'],castingClassId:campaignIds.archivist,campaignCyst:true,...necroticRules[name.toLowerCase().replaceAll(' ','-')],description:necroticRules[name.toLowerCase().replaceAll(' ','-')].description}));
export const campaignPowers=[
 {id:'mindlink',name:'Mindlink',cost:1,description:'One action and 1 PP. Link a willing Intelligence 3+ target within close range (25 feet at ML 1) without a saving throw. Lasts 10 minutes per manifester level, with telepathic exchange on the same plane.'},
 {id:'inertial-armor',name:'Inertial Armor',cost:1,description:'Reaction when targeted before the attack roll. Spend 1 PP for a +4 armor bonus on the triggering attack and for 1 hour per manifester level, without concentration. Use the higher of worn armor or this bonus. Compatible shield, natural armor and Chitin bonuses still apply. Add +1 armor per additional 2 PP within the manifester-level limit.'},
 {id:'attraction',name:'Attraction',cost:1,description:'One action and 1 PP. Wisdom save against 8 + proficiency + Intelligence modifier. On failure, lasts 1 hour per manifester level and gives +4 to directly relevant interaction checks. It does not compel dangerous behavior.'}
];
const followers=[
 [1,0,0,0,0,0,0,0],[2,1,0,0,0,0,0,0],[3,2,0,0,0,0,0,0],[4,3,0,0,0,0,0,0],[5,3,0,0,0,0,0,0],[6,4,0,0,0,0,0,0],[7,5,0,0,0,0,0,0],[8,5,0,0,0,0,0,0],[9,6,0,0,0,0,0,0],[25,17,135,13,7,4,2,2],
 [10,7,5,0,0,0,0,0],[11,7,6,0,0,0,0,0],[12,8,8,0,0,0,0,0],[13,9,10,1,0,0,0,0],[14,10,15,1,0,0,0,0],[15,10,20,2,1,0,0,0],
 [16,11,25,2,1,0,0,0],[17,12,30,3,1,1,0,0],[18,12,35,3,1,1,0,0],[19,13,40,4,2,1,1,0],[20,14,50,5,3,2,1,0],
 [21,15,60,6,3,2,1,1],[22,15,75,7,4,2,2,1],[23,16,90,9,5,3,2,1],[24,17,110,11,6,3,2,1]
];
export const followerTable=Object.fromEntries(followers.map(([score,thrall,...believers])=>[score,{thrall,believers}]));

export const conversionFeats=featTimeline.map(({name,description})=>({name,description,catalogId:'homebrew:conversion-feat:'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),category:'feat',edition:'2014',source:campaignSource}));
