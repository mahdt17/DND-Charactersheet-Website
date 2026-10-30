import equipment from '../data/equipment.json' with {type:'json'};
export const rageId='2014:Barbarian:rage';
export function rageProfile(c){
 const edition=(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const rows=c.classLevels?.length?c.classLevels:[{name:c.className,level:c.level,edition:c.classDefinition?.edition||edition,definition:c.classDefinition}];
 const row=edition==='2014'&&rows.find(r=>r.name==='Barbarian'&&(r.edition||edition)==='2014'&&!r.definition?.homebrew&&!r.homebrew),level=Number(row?.level)||0;
 const state=(c.activeEffects||[]).find(e=>e.stateKey==='rage'&&e.baseClassId===rageId&&(e.remainingSeconds==null||e.remainingSeconds>0));
 const legacy=level>=3&&/totem warrior/i.test(row?.subclass||c.subclass||'')&&c.totemWarrior?.activeRage;
 const heavy=(c.inventory||[]).some(i=>i.equipped&&String(i.armor_category||equipment.find(e=>e.index===i.equipmentIndex)?.armor_category).toLowerCase()==='heavy');
 const max=level>=17?6:level>=12?5:level>=6?4:level>=3?3:2,used=Math.max(0,...(c.resources||[]).filter(r=>r.id===rageId||r.classResourceKey===rageId).map(r=>Number(r.used)||0));
 return {level,active:!!level&&!!(state||legacy),state,heavy,max,used,unlimited:level>=20,damage:level>=16?4:level>=9?3:2,persistent:level>=15};
}
export const rageCastingBlock=c=>rageProfile(c).active?'You cannot cast spells or rituals while raging. End Rage first.':'';
export function featureCastingBlock(c,spell){if(Number(spell.level)>0&&(c.activeEffects||[]).some(e=>e.stateKey==='arcane-deflection'&&e.remainingSeconds>0))return 'Arcane Deflection permits only cantrips until the end of your next turn.';return rageCastingBlock(c);}
