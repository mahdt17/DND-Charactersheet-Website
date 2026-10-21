// Build a small, offline rules snapshot for every 2014 Druid spell Entomancers
// can learn. Descriptions are the catalog's already reviewed source summaries.
import {readFileSync,writeFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const source=read('public/catalogs/wikidot5e/spells.json');
const srd=read('src/data/spells.json');
const slots=(base,count,sides,step=1,interval=1)=>Object.fromEntries(Array.from({length:10-base},(_,i)=>[base+i,`${count+Math.floor(i/interval)*step}d${sides}`]));
const damage=(type,table,character=false,extra={})=>({damage_type:{name:type},[character?'damage_at_character_level':'damage_at_slot_level']:table,...extra});
const cantrip=(type,sides)=>({damage:[damage(type,{1:`1d${sides}`,5:`2d${sides}`,11:`3d${sides}`,17:`4d${sides}`},true)]});
const save=(name,success='none')=>({dc:{dc_type:{name},dc_success:success}});
// These formulas are transcribed from the source summaries below, not inferred
// at runtime. Conditional, weapon and summoned-creature effects remain manual.
const repairs={
 'create-bonfire':{...cantrip('Fire',8),...save('Dexterity')},
 frostbite:{...cantrip('Cold',6),...save('Constitution')},
 infestation:{...cantrip('Poison',6),...save('Constitution')},
 'primal-savagery':{...cantrip('Acid',10),attack_type:'melee'},
 'thorn-whip':{...cantrip('Piercing',6),attack_type:'melee'},
 thunderclap:{...cantrip('Thunder',6),...save('Constitution')},
 'dust-devil':{damage:[damage('Bludgeoning',slots(2,1,8))],...save('Strength','half'),rollNotes:'Damage occurs when a creature ends its turn within 5 feet; resolve the push only on a failed save.'},
 'earth-tremor':{damage:[damage('Bludgeoning',slots(1,1,6))],...save('Dexterity')},
 'erupting-earth':{damage:[damage('Bludgeoning',slots(3,3,12))],...save('Dexterity','half')},
 'healing-spirit':{heal_at_slot_level:slots(2,1,6),rollNotes:'Healing is per eligible entry or turn start, not immediate healing on casting. Total uses: 1 + your spellcasting modifier (minimum 2).'},
 'ice-knife':{attack_type:'ranged',damage:[damage('Piercing',{1:'1d10'},false,{label:'Piercing damage on hit'}),damage('Cold',slots(1,2,6),false,{critical:false,label:'Cold damage · explosion, Dexterity save negates'})],...save('Dexterity'),saveNotes:'The Dexterity save negates only the cold explosion; it does not negate piercing hit damage.',rollNotes:'The explosion occurs hit or miss. Only the piercing hit can critically hit; each creature within 5 feet separately saves against the cold damage.'},
 maelstrom:{damage:[damage('Bludgeoning',{5:'6d6'})],...save('Strength'),rollNotes:'Resolve damage and the pull when a creature starts its turn in the area.'},
 'tidal-wave':{damage:[damage('Bludgeoning',{3:'4d8'})],...save('Dexterity','half')},
 'wither-and-bloom':{damage:[damage('Necrotic',slots(2,2,6))],...save('Constitution','half'),rollNotes:'Healing is optional: one creature spends and rolls its own Hit Dice (1 at level 2, +1 per higher slot), then adds your spellcasting modifier once. No fixed healing die is assumed.'},
 'wall-of-fire':{damage:[damage('Fire',slots(4,5,8))],...save('Dexterity','half'),rollNotes:'The initial wall allows a Dexterity save for half; later entry and end-of-turn damage has no save. Resolve each trigger separately.'}
};
Object.assign(repairs,{
 'call-lightning':{rollNotes:'Damage is per bolt. An existing outdoor storm adds 1d10; on later turns another bolt requires your action.'},
 'flaming-sphere':{rollNotes:'Damage triggers on a creature’s turn end within 5 feet or when you ram it with a bonus action; not automatically when the sphere appears.'},
 'heat-metal':{saveNotes:'The Constitution save determines whether a held or worn object is dropped. It does not reduce or negate the fire damage.'},
 moonbeam:{rollNotes:'Damage triggers when a creature enters for the first time on a turn or starts its turn in the beam; moving the beam onto it is not itself a damage trigger.'}
});
const saves={
 'call-lightning':['Dexterity','half'],'charm-monster':['Wisdom'],
 'control-winds':['Strength'],'earthbind':['Strength'],'elemental-bane':['Constitution'],
 'flaming-sphere':['Dexterity','half'],'grasping-vine':['Dexterity'],gust:['Strength'],
 'sleet-storm':['Dexterity or Constitution'],'snare':['Dexterity'],
 'summon-draconic-spirit':['Dexterity'],'summon-draconic-spirit-ua':['Dexterity'],
 'transmute-rock':['Strength or Dexterity'],'wall-of-stone':['Dexterity'],
 'watery-sphere':['Strength'],'wrath-of-nature':['Dexterity or Strength']
};
const abilityNames={STR:'Strength',DEX:'Dexterity',CON:'Constitution',INT:'Intelligence',WIS:'Wisdom',CHA:'Charisma'};
const descriptionRepairs={
 'beast-sense':{
  description:'Touch a willing beast. For up to 1 hour while concentrating, use an action to perceive through its eyes and ears until you use another action to return to your own senses. While linked this way, you benefit from the beast’s special senses, but you are blinded and deafened to your own surroundings.',
  sourceUrl:'https://media.wizards.com/2014/downloads/dnd/HoardDragonQueen_Supplement1_PF.pdf',
  reason:'The catalog’s upstream Wikidot page omits the special-senses benefit and the blinded/deafened limitation. Verified against the official 2014 adventure supplement.'
 },
 'locate-object':{
  append:' To locate one specific object, you must have seen it up close, within 30 feet, at least once.',
  sourceUrl:'https://dnd5e.wikidot.com/spell:locate-object',
  reason:'Restore the specific-object familiarity requirement present in the source and local SRD.'
 }
};
const manual={
 'absorb-elements':'Casting grants resistance. Roll the extra 1d6 per slot level only on your first melee hit on your next turn, using the triggering damage type.',
 'control-water':'Choose a water effect. Only Whirlpool causes 2d8 bludgeoning, with a Strength save for half on eligible entry or turn-start triggers. Other modes do not deal this damage.',
 'elemental-bane':'The extra 2d6 of the chosen type triggers only the first time each turn the affected target takes that type. Resolve it with that triggering damage.',
 'enhance-ability':'Choose one enhancement. Only Bear’s Endurance grants 2d6 temporary HP; other choices do not. These are not healing or damage.',
 'flame-arrows':'No damage on casting. A hit with affected ammunition adds 1d6 fire damage. Higher slots increase ammunition count, not damage dice.',
 'flame-blade':'Casting creates the blade. A later action makes a melee spell attack for 3d6 fire; add 1d6 for each two slot levels above 2nd.',
 geas:'The 5d10 psychic damage occurs only when the charmed creature acts against the command, at most once per day; none is dealt on casting.',
 'guardian-of-nature':'Choose Primal Beast or Great Tree. Only Primal Beast adds 1d6 force to melee weapon hits; Great Tree grants 10 temporary HP instead.',
 'magic-stone':'Casting only enchants up to three pebbles. A later ranged spell attack deals 1d6 + your spellcasting modifier bludgeoning per stone. Damage does not scale with character level.',
 'produce-flame':'Choose to hold the light or hurl it. Hurling uses a ranged spell attack for 1d8 fire (2d8 at character level 5, 3d8 at 11, 4d8 at 17) and ends the spell. Creating light alone makes no attack.',
 'meld-into-stone':'No damage on casting. Forced expulsion deals 6d6 bludgeoning for partial destruction, or 50 for complete destruction or transmutation, to you.',
 shillelagh:'Casting enchants a held club or quarterstaff. Its later weapon attacks use a d8 damage die and may use your spellcasting ability for attack and damage; do not make a spell attack on casting.',
 'spike-growth':'Damage is 2d4 piercing per 5 feet the creature moves into or within the spikes, with no damage save. Creating the spikes under a stationary creature does not deal this damage.',
 'summon-draconic-spirit':'Use the spirit’s stat block for its own turns: Rend is 1d6 + 4 + slot level piercing; its breath is 2d6 of a chosen resisted type (Dexterity save for half). These are not damage dealt on casting.',
 'summon-draconic-spirit-ua':'Use this UA spirit’s own stat block and turns. Bite and Claw deal 1d6 + 4 + slot level piercing per hit; breath deals 2d6 of a chosen resisted type (Dexterity save for half).',
 'transmute-rock':'Choose a transformation. Only falling ceiling mud deals 4d8 bludgeoning (Dexterity save for half); ground transformations restrain instead.',
 'wrath-of-nature':'Resolve separate environmental effects: trees deal 4d6 slashing on failed Dexterity saves at your turn start; a bonus-action rock makes a ranged spell attack for 3d8 bludgeoning. Neither happens simply from casting.'
};
const fields=['damage','heal_at_slot_level','dc','attack_type','higher_level','area_of_effect'];
const entries={},srdPatches={};
for(const row of source.filter(s=>s.classes?.includes('Druid')&&s.level<=5)){
 const slug=row.id.replace('wikidot5e:spell:','');
 const core=srd.find(s=>s.name.toLowerCase()===row.name.toLowerCase());
 const description=row.effectSummary||row.description||row.effect;
 if(!description||!row.enrichment?.validated||row.enrichment?.partial)throw Error('Unreviewed spell: '+row.name);
 const mechanics=Object.fromEntries(fields.filter(k=>core?.[k]!=null).map(k=>[k,core[k]]));
 const notes=manual[slug];
 entries[row.id]={catalogId:row.id,index:row.id,name:row.name,category:'spell',edition:'2014',source:row.source,sourceBook:row.sourceBook,sourceUrl:row.sourceUrl,sourceDigest:row.sourceEvidence?.sourceDigest,referenceOnly:false,level:row.level,school:row.school.replace(/ cantrip$/i,''),casting_time:row.casting_time,range:row.range,duration:row.duration,components:row.components,concentration:row.concentration,ritual:row.ritual,classes:row.classes,description,sourceDescription:description,descriptionOrigin:'source',...mechanics,...repairs[slug],...(notes?{rollResolution:'description',rollNotes:notes}:{})};
 const entry=entries[row.id];
 if(descriptionRepairs[slug]){
  const correction=descriptionRepairs[slug];
  entry.description=correction.description||entry.description+correction.append;
  entry.sourceDescription=entry.description;
  entry.descriptionReview={reviewedAt:'2026-10-21',sourceUrl:correction.sourceUrl,reason:correction.reason};
 }
 if(saves[slug])Object.assign(entry,save(saves[slug][0],saves[slug][1]||'other'));
 if(entry.dc?.dc_type?.name)entry.dc={...entry.dc,dc_type:{...entry.dc.dc_type,name:abilityNames[entry.dc.dc_type.name]||entry.dc.dc_type.name}};
 if(core)srdPatches[`2014:${core.index}`]=Object.fromEntries([...fields,'rollResolution','rollNotes','saveNotes'].filter(k=>entry[k]!=null).map(k=>[k,entry[k]]));
}
const output=JSON.stringify({reviewedAt:'2026-10-21',scope:'All 123 catalog Druid spells of levels 0–5 usable by the 2014 Entomancer; existing reviewed summaries with explicit roll formulas. Matching SRD identities share mechanics corrections while retaining their own content and provenance.',entries,srdPatches},null,2)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync('src/data/entomancer-spell-details.json','utf8').replace(/\r\n/g,'\n')!==output)throw Error('Entomancer spell snapshot is stale. Review changes and run this generator.');
}else writeFileSync('src/data/entomancer-spell-details.json',output);
console.log(`Built ${Object.keys(entries).length} reviewed Entomancer spell records.`);
