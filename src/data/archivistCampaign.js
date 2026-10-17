export const campaignSource='Archivist campaign codex (user supplied, October 2026)';
export const campaignIds={archivist:'homebrew:darkdonte:archivist',psion:'homebrew:darkdonte:telepath',thrallherd:'homebrew:darkdonte:thrallherd'};
export const campaignPPId='darkdonte:shared:power-points';
export const campaignDarkId='darkdonte:archivist:dark-knowledge';
const ref=(index,name)=>({index,name});
export const archivistFeatures=[
 [1,'Prayerbook','Intelligence-based divine casting. Record two Cleric-list spells per Archivist level. Outside spells require an approved source; Mother Cyst access is separate. Rituals can be cast from the prayerbook.'],
 [1,'Scribe Scroll','Preserve and transfer recorded spell knowledge. Scroll crafting costs and time require a table ruling.'],
 [1,'Dark Knowledge: Tactics','Knowledge check DC 15; +1 to allied attacks against the studied creatures, +2 at 25, +3 at 35. Default conversion: action, 60 feet, 1 minute.'],
 [2,'Lore Mastery','Select a knowledge skill for +2. Additional selections at Archivist 7, 13 and 17. Skill mapping and stacking are adjustable conversion rulings.'],
 [4,'Still Mind','Default conversion: +2 on saves against enchantment effects; apply only when the triggering effect qualifies.'],
 [5,'Dark Knowledge: Puissance','The same check thresholds grant allies +1/+2/+3 to saves against studied creatures.'],
 [7,'Lore Mastery'],[8,'Dark Knowledge: Foe','The same check thresholds grant allies +1d6/+2d6/+3d6 weapon damage against studied creatures.'],
 [10,'Bonus feat: Chain Spell'],[11,'Dark Knowledge: Dread Secret','Default conversion: one target, 1 round. Check 15: disadvantage on attacks and sight-based Perception; 25: incapacitated; 35: stunned. These replace 3.5 dazzled/dazed/stunned for this campaign.'],
 [13,'Lore Mastery'],[14,'Dark Knowledge: Foreknowledge','The same check thresholds grant allies within 30 feet +1/+2/+3 AC against the studied creature.'],[17,'Lore Mastery'],[20,'Bonus feat']
];
export const campaignClasses=Object.entries(campaignIds).map(([kind,catalogId])=>({
 catalogId,index:'darkdonte-'+kind,name:{archivist:'Archivist',psion:'Psion (Telepath)',thrallherd:'Thrallherd'}[kind],category:'class',edition:'2014',homebrew:true,prestige:kind==='thrallherd',source:campaignSource,campaignKind:kind,hit_die:6,spellcastingAbility:kind==='thrallherd'?'':'int',spellLists:kind==='archivist'?['Cleric']:[],
 description:kind==='archivist'?'Campaign 5e conversion: prayerbook scholar with Dark Knowledge. Editable conversion defaults.':kind==='psion'?'Campaign 5e conversion: one-level Telepath dip, three power points and a Sage Psicrystal.':'Campaign 5e conversion: one-level prestige dip at character level 6, with thrall and believer roster.',
 saving_throws:kind==='archivist'?[ref('con','Constitution'),ref('wis','Wisdom')]:[ref('int','Intelligence'),ref('wis','Wisdom')],
 proficiencies:kind==='archivist'?[ref('light-armor','Light armor'),ref('simple-weapons','Simple weapons')]:[ref('simple-weapons','Simple weapons')],
 proficiency_choices:[{choose:2,desc:'Choose two skills (conversion default)',from:{options:['Arcana','History','Medicine','Nature','Religion'].map(name=>({item:ref('skill-'+name.toLowerCase(),'Skill: '+name)}))}}],
 starting_equipment:[],starting_equipment_options:[],supportedLevels:kind==='archivist'?20:1,
 progression:[['Level','Features'],...Array.from({length:kind==='archivist'?20:1},(_,i)=>[String(i+1),kind==='archivist'?archivistFeatures.filter(f=>f[0]===i+1).map(f=>f[1]).concat([4,8,12,16,19].includes(i+1)?['Campaign feat slot']:[]).join(', '):kind==='psion'?'Telepathy, three powers, Psicrystal Affinity':'Thrallherd score, thrall and believers'])]
}));
export const featTimeline=[
 {name:'Mother Cyst',characterLevel:1,kind:'human',level:1,description:'Automatic access to the necrotic spell chain at unlocked Archivist spell tiers. Discovery and copying are not required.'},
 {name:'Psicrystal Affinity',characterLevel:2,kind:'psion',level:1,description:'Sage Psicrystal; +3 Arcana while within one mile. No autonomous casting or revival is assumed.'},
 {name:'Reach Spell',characterLevel:5,kind:'archivist',level:4,description:'Eligible Touch spells become 30 feet; +2 adjusted slot levels.'},
 {name:'Draconic Archivist',characterLevel:10,kind:'archivist',level:8,description:'Dark Knowledge also applies to dragons and constructs, using Arcana.'},
 {name:'Chain Spell',characterLevel:12,kind:'archivist',level:10,description:'One primary target, up to Archivist level secondary targets (maximum 20), each within 30 feet of primary. +3 slot levels; nondamaging secondary save DC -4. High-end slot cap remains a table ruling.'},
 {name:'Graft Flesh: Silthilar',characterLevel:14,kind:'archivist',level:12,description:'Medicine replaces Heal. Graft cost, time, materials and recipient limits remain open rulings.'},
 {name:'Cooperative Spell',characterLevel:18,kind:'archivist',level:16,description:'Working rule: same spell and feat; highest participant DC +2 for first cooperator, +1 each additional. Ready/reaction timing requires final table approval.'}
];
export const cystSpells=[['Necrotic Awareness',1],['Necrotic Cyst',2],['Necrotic Scrying',2],['Necrotic Bloat',3],['Necrotic Domination',4],['Necrotic Burst',5],['Necrotic Eruption',6],['Necrotic Tumor',7],['Necrotic Empowerment',8],['Necrotic Termination',9]].map(([name,level])=>({name,level,range:name==='Necrotic Cyst'?'Touch':name==='Necrotic Domination'?'25 feet':name==='Necrotic Tumor'?'100 feet':undefined,catalogId:'darkdonte:'+name.toLowerCase().replaceAll(' ','-'),edition:'2014',category:'spell',classes:['Archivist'],castingClassId:campaignIds.archivist,campaignCyst:true,description:name==='Necrotic Domination'?'Campaign rule: cyst-bearing target, 25 feet, Wisdom save; temporary control for one day.':name==='Necrotic Tumor'?'Campaign rule: cyst-bearing target, 100 feet, Constitution save; permanent control on failure.':'Mother Cyst grants access. Full spell-effect conversion is not specified in the guide; confirm the effect with the DM. These are access records, not fabricated 5e spell descriptions.'}));
export const campaignPowers=[
 {id:'mindlink',name:'Mindlink',cost:1,description:'Telepathic communication. Retained source baseline: willing creatures, 30 feet, 10 minutes at Psion 1; no shared language required. Range/duration are editable conversion defaults.'},
 {id:'inertial-armor',name:'Inertial Armor',cost:1,description:'Conversion default: unarmored AC 13 + Dexterity modifier for one hour; no concentration. Adjust the armor base or duration in rulings.'},
 {id:'attraction',name:'Attraction',cost:1,description:'Conversion default: Wisdom save against Intelligence DC, 25 feet, one hour. Creates attraction toward a named creature/object, not control or compelled dangerous behavior.'}
];
const followers=[
 [10,7,5,0,0,0,0,0],[11,7,6,0,0,0,0,0],[12,8,8,0,0,0,0,0],[13,9,10,1,0,0,0,0],[14,10,15,1,0,0,0,0],[15,10,20,2,1,0,0,0],
 [16,11,25,2,1,0,0,0],[17,12,30,3,1,1,0,0],[18,12,35,3,1,1,0,0],[19,13,40,4,2,1,1,0],[20,14,50,5,3,2,1,0],
 [21,15,60,6,3,2,1,1],[22,15,75,7,4,2,2,1],[23,16,90,9,5,3,2,1],[24,17,110,11,6,3,2,1]
];
export const followerTable=Object.fromEntries(followers.map(([score,thrall,...believers])=>[score,{thrall,believers}]));
