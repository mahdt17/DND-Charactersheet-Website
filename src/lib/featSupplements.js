// Source-reviewed mechanical summaries for feats outside the bundled SRD.
const abilityChoice={kind:'ability_choice',options:{choose:1,from:{options:['int','wis','cha'].map(index=>({ability_score:{index},minimum_score:13}))}}};
export const featSupplements=[
 ['Fey Touched','Gain +1 Intelligence, Wisdom, or Charisma; Misty Step and one level 1 Divination or Enchantment spell. Each spell has one free long-rest cast and can use spell slots.'],
 ['Shadow Touched','Gain +1 Intelligence, Wisdom, or Charisma; Invisibility and one level 1 Illusion or Necromancy spell. Each spell has one free long-rest cast and can use spell slots.'],
 ['Ritual Caster','Gain +1 Intelligence, Wisdom, or Charisma. Prepare proficiency-bonus level 1 rituals. Quick Ritual casts one prepared ritual at its normal casting time without a slot, once per long rest.'],
 ['Telekinetic','Gain +1 Intelligence, Wisdom, or Charisma. Learn invisible, component-free Mage Hand with 30 feet of extra range. As a bonus action, shove a visible creature within 30 feet by 5 feet on a failed Strength save.'],
 ['Telepathic','Gain +1 Intelligence, Wisdom, or Charisma. Speak telepathically to visible creatures within 60 feet that share a language. Detect Thoughts has one component-free, slot-free long-rest cast and can also use spell slots.']
].map(([name,description])=>{const index=name.toLowerCase().replaceAll(' ','-');return {name,index,catalogId:`2024:${index}`,edition:'2024',category:'feat',source:'Player’s Handbook (2024)',sourceUrl:`https://dnd2024.wikidot.com/feat:${index}`,description,prerequisites:[{kind:'level',minimum:4,text:'Character level 4 or higher'},...(name==='Ritual Caster'?[abilityChoice]:[])]};});
