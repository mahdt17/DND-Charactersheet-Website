// PHB tables, reviewed for both editions. See the class verification document.
// Class level determines learned spells independently of shared multiclass slots.
export const castingSubclassNames={Fighter:'Eldritch Knight',Rogue:'Arcane Trickster'};
const known=[0,0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13];
export function subclassCasting(c){
 const edition=c.classDefinition?.edition||c.ruleset||'2014';
 if(!['2014','2024'].includes(edition)||String(c.subclass||'').trim().toLowerCase()!==castingSubclassNames[c.className]?.toLowerCase())return null;
 const level=Math.max(0,Math.min(20,Math.trunc(Number(c.level)||0))),active=level>=3;
 const slots=[0,...(level>=19?[4,3,3,1]:level>=16?[4,3,3]:level>=13?[4,3,2]:level>=10?[4,3]:level>=7?[4,2]:level>=4?[3]:active?[2]:[])];
 while(slots.length<10)slots.push(0);
 return {edition,active,ability:'int',list:'Wizard',slots,cantrips:active?(level>=10?3:2):0,known:known[level],prepared:known[level],mode:edition==='2014'?'known':'prepared',
  fixedCantrip:active&&c.className==='Rogue'?'Mage Hand':null,
  schools:edition==='2014'?(c.className==='Fighter'?['Abjuration','Evocation']:['Enchantment','Illusion']):[],
  unrestrictedChoices:edition==='2014'?[3,8,14,20].filter(n=>level>=n).length:Infinity};
}
export function outsideSubclassSchools(profile,spell){return parseInt(spell.level)>0&&profile.schools.length>0&&!profile.schools.some(n=>n.toLowerCase()===String(spell.school?.name||spell.school||'').toLowerCase());}
export function subclassSchoolAccess(c,spell){
 const profile=subclassCasting(c);
 if(!profile||!outsideSubclassSchools(profile,spell))return true;
 const key=s=>String(s.name||s.catalogId||s.index||'').toLowerCase();
 const others=(c.spells||[]).filter(s=>!s.auto&&!s.featSpellGrant&&key(s)!==key(spell)&&outsideSubclassSchools(profile,s));
 return others.length<profile.unrestrictedChoices;
}
