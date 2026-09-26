import subclasses14 from '../data/subclasses.json' with {type:'json'};
import spells14 from '../data/spells.json' with {type:'json'};
import modern from '../data/srd2024.json' with {type:'json'};
import {characterClasses,contentKey} from './advancement.js';
import {subclassCasting} from './subclassCasting.js';

// Reviewed against the 2014 Basic Rules and 2024 Free Rules class tables:
// https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes
// https://www.dndbeyond.com/sources/dnd/free-rules/character-classes
// Keep expanded lists distinct from always-prepared spells: 2014 Fiend spells
// still require a known-spell choice, while 2024 Fiend spells do not.
const norm=s=>String(s||'').toLowerCase().replaceAll('’',"'").trim();
const aliases={Cleric:['life','life domain'],Paladin:['devotion','oath of devotion'],Warlock:['fiend','the fiend','fiend patron'],Sorcerer:['draconic','draconic sorcery'],Druid:['land','circle of the land']};
const tables24={
 Cleric:{3:['Aid','Bless','Cure Wounds','Lesser Restoration'],5:['Mass Healing Word','Revivify'],7:['Aura of Life','Death Ward'],9:['Greater Restoration','Mass Cure Wounds']},
 Paladin:{3:['Protection from Evil and Good','Shield of Faith'],5:['Aid','Zone of Truth'],9:['Beacon of Hope','Dispel Magic'],13:['Freedom of Movement','Guardian of Faith'],17:['Commune','Flame Strike']},
 Sorcerer:{3:['Alter Self','Chromatic Orb','Command',"Dragon's Breath"],5:['Fear','Fly'],7:['Arcane Eye','Charm Monster'],9:['Legend Lore','Summon Dragon']},
 Warlock:{3:['Burning Hands','Command','Scorching Ray','Suggestion'],5:['Fireball','Stinking Cloud'],7:['Fire Shield','Wall of Fire'],9:['Geas','Insect Plague']}
};
const lands24={
 arid:{3:['Blur','Burning Hands','Fire Bolt'],5:['Fireball'],7:['Blight'],9:['Wall of Stone']},
 polar:{3:['Fog Cloud','Hold Person','Ray of Frost'],5:['Sleet Storm'],7:['Ice Storm'],9:['Cone of Cold']},
 temperate:{3:['Misty Step','Shocking Grasp','Sleep'],5:['Lightning Bolt'],7:['Freedom of Movement'],9:['Tree Stride']},
 tropical:{3:['Acid Splash','Ray of Sickness','Web'],5:['Stinking Cloud'],7:['Polymorph'],9:['Insect Plague']}
};
const underdark14={3:['Spider Climb','Web'],5:['Gaseous Form','Stinking Cloud'],7:['Greater Invisibility','Stone Shape'],9:['Cloudkill','Insect Plague']};
const entries=table=>Object.entries(table||{}).flatMap(([level,names])=>names.map(name=>({name,classLevel:Number(level)})));
const idFor=c=>c.activeCastingClassId||characterClasses(c)[0]?.catalogId||contentKey(c.classDefinition||{name:c.className,edition:c.ruleset});
export function subclassLandOptions(c){
 if(c.className!=='Druid'||!aliases.Druid.includes(norm(c.subclass)))return [];
 const edition=c.classDefinition?.edition||c.ruleset||'2014';
 return edition==='2024'?Object.keys(lands24):edition==='2014'?['arctic','coast','desert','forest','grassland','mountain','swamp','underdark']:[];
}
export function subclassSpellGrants(c){
 const edition=c.classDefinition?.edition||c.ruleset||'2014';
 const casting=subclassCasting(c);
 if(casting?.fixedCantrip)return [{name:casting.fixedCantrip,classLevel:3,edition,alwaysPrepared:true,source:c.subclass}];
 if(!['2014','2024'].includes(edition)||!aliases[c.className]?.includes(norm(c.subclass)))return [];
 const land=norm(c.subclassSpellChoices?.[idFor(c)]?.land);
 let grants=[];
 if(edition==='2024')grants=entries(c.className==='Druid'?lands24[land]:tables24[c.className]);
 else {
  const record=subclasses14.find(s=>s.class.name===c.className&&aliases[c.className].includes(norm(s.name)));
  grants=(record?.spells||[]).flatMap(entry=>{
   const requirements=entry.prerequisites||[];
   if(requirements.some(p=>p.type==='feature'&&p.index!==`circle-of-the-land-${land}`))return [];
   const level=requirements.find(p=>p.type==='level')?.name?.match(/(\d+)$/)?.[1];
   return level?[{name:entry.spell.name,classLevel:Number(level)}]:[];
  });
  // The imported 2014 SRD subset omits these published table entries.
  if(c.className==='Cleric')grants.push({name:'Guardian of Faith',classLevel:7});
  if(c.className==='Druid'&&land==='underdark')grants=entries(underdark14);
 }
 return grants.filter(g=>g.classLevel<=c.level).map(g=>({...g,edition,alwaysPrepared:edition==='2024'||c.className!=='Warlock',source:`${c.subclass}${land?` (${land})`:''}`}));
}
export function subclassSpellAccess(c,spell){
 if((spell.edition||'2014')!==(c.classDefinition?.edition||c.ruleset||'2014'))return null;
 return subclassSpellGrants(c).find(g=>norm(g.name)===norm(spell.name))||null;
}
const catalog={2014:spells14,2024:modern.spells};
export function reconcileSubclassSpells(c){
 const rows=characterClasses(c),spells=(c.spells||[]).filter(s=>!s.classSpellGrant);
 for(const row of rows){
  const model={...c,className:row.name,classDefinition:row.definition,subclass:row.subclass,level:row.level,ruleset:row.edition,activeCastingClassId:row.catalogId};
  for(const grant of subclassSpellGrants(model).filter(g=>g.alwaysPrepared)){
   const data=catalog[row.edition]?.find(s=>norm(s.name)===norm(grant.name));
   if(!data)continue;
   if(spells.some(s=>(s.castingClassId||rows[0].catalogId)===row.catalogId&&(s.edition||'2014')===row.edition&&norm(s.name)===norm(data.name)))continue;
   const id=`subclass-spell:${row.catalogId}:${data.index}`,previous=(c.spells||[]).find(s=>s.classSpellGrant&&s.id===id);
   spells.push({...data,...(previous?.rollFormula!=null?{rollFormula:previous.rollFormula}:{}),...(previous?.rollAttack!=null?{rollAttack:previous.rollAttack}:{}),edition:row.edition,catalogId:`${row.edition}:${data.index}`,id,castingClassId:row.catalogId,classSpellGrant:true,prepared:true,source:grant.source,description:data.description||data.desc?.join('\n\n')||'',school:typeof data.school==='object'?data.school.name:data.school});
  }
 }
 return spells;
}
