import spells14 from '../data/spells.json' with {type:'json'};
import modern from '../data/srd2024.json' with {type:'json'};

const norm=s=>String(s?.name||s||'').trim().toLowerCase().replaceAll('’',"'");
export const featMagicKey=f=>f.id||f.catalogId||`${f.edition||'2014'}:${f.index||f.name}`;
const abilityFor={Bard:'cha',Cleric:'wis',Druid:'wis',Sorcerer:'cha',Warlock:'cha',Wizard:'int'};
const catalog=Object.fromEntries(Object.entries({2014:spells14,2024:modern.spells}).map(([edition,spells])=>[edition,spells.map(s=>({...s,edition,catalogId:`${edition}:${s.index}`,classes:(s.classes||[]).map(x=>x.name||x),school:s.school?.name||s.school,description:s.description||s.desc?.join('\n\n')||''}))]));
export function featMagicProfile(f,c={}){
 const edition=f.edition||c.ruleset||'2014',name=norm(f.name);
 if(!catalog[edition]||f.source==='Homebrew'||f.integrityIssues?.length)return null;
 const initiate=name.match(/^magic initiate(?: \((bard|cleric|druid|sorcerer|warlock|wizard)\))?$/);
 if(initiate)return {edition,kind:'initiate',lists:edition==='2024'?['Cleric','Druid','Wizard']:Object.keys(abilityFor),defaultList:initiate[1]?initiate[1][0].toUpperCase()+initiate[1].slice(1):'',cantrips:2,abilityIncrease:false,slotCasting:edition==='2024'};
 if(['fey touched','shadow touched'].includes(name))return {edition,kind:'touched',lists:[],cantrips:0,abilityIncrease:true,slotCasting:true,fixed:name==='fey touched'?'Misty Step':'Invisibility',schools:name==='fey touched'?['Divination','Enchantment']:['Illusion','Necromancy']};
 return null;
}
export function featMagicOptions(f,c={}){
 const p=featMagicProfile(f,c);if(!p)return {cantrips:[],spells:[]};
 const list=f.magicChoices?.list||p.defaultList;
 const spells=catalog[p.edition].filter(s=>p.kind==='initiate'?p.lists.includes(list)&&s.classes.includes(list):p.schools.includes(s.school));
 return {cantrips:spells.filter(s=>s.level===0),spells:spells.filter(s=>s.level===1)};
}
export function featMagicState(f,c={}){
 const profile=featMagicProfile(f,c);if(!profile)return {supported:false,valid:true,spells:[]};
 const choices=f.magicChoices||{},options=featMagicOptions(f,c),list=choices.list||profile.defaultList;
 const ability=profile.kind==='initiate'&&profile.edition==='2014'?abilityFor[list]:choices.ability;
 const cantrips=Array.from(choices.cantrips||[]).map(id=>options.cantrips.find(s=>s.catalogId===id));
 const spell=options.spells.find(s=>s.catalogId===choices.spell),fixed=profile.fixed?catalog[profile.edition].find(s=>s.name===profile.fixed):null;
 const repeatedList=profile.kind==='initiate'&&profile.edition==='2024'&&(c.feats||[]).some(other=>featMagicKey(other)!==featMagicKey(f)&&featMagicProfile(other,c)?.kind==='initiate'&&(other.edition||c.ruleset||'2014')==='2024'&&(other.magicChoices?.list||featMagicProfile(other,c).defaultList)===list);
 const valid=!repeatedList&&cantrips.length===profile.cantrips&&cantrips.every(Boolean)&&new Set(choices.cantrips).size===cantrips.length&&Boolean(spell)&&['int','wis','cha'].includes(ability)&&(!profile.fixed||Boolean(fixed));
 const spells=valid?[...cantrips,spell,...(fixed?[fixed]:[])].map(s=>({...s,featGrantId:featMagicKey(f),featAbility:ability,featSpellGrant:true,featUseKey:`${featMagicKey(f)}:${s===fixed?'fixed':'choice'}`,featSlotCasting:profile.slotCasting,featSource:f.name,prepared:true})):[];
 return {supported:true,valid,profile,ability,list,spells};
}
export function featMagicSpells(c){return (c.feats||[]).flatMap(f=>featMagicState(f,c).spells);}
export function resolveFeatSpell(c,s){return featMagicSpells(c).find(x=>x.featGrantId===s.featGrantId&&x.catalogId===s.catalogId)||null;}
export function featAbilityIncrease(c,key){return (c.feats||[]).reduce((n,f)=>{const state=featMagicState(f,c);return n+(state.valid&&state.profile?.abilityIncrease&&state.ability===key&&f.magicChoices?.applyAbilityIncrease!==false?1:0);},0);}
export function applyFeatAbilityIncrease(c,key,base){return base+Math.max(0,Math.min(featAbilityIncrease(c,key),20-base));}
export function featSpellUsesSlots(c,s){
 if(s.featSlotCasting)return true;
 const f=(c.feats||[]).find(f=>featMagicKey(f)===s.featGrantId),state=f&&featMagicState(f,c);
 if(!state?.valid||state.profile.kind!=='initiate')return false;
 // 2014 Magic Initiate does not itself grant general slot casting. A matching
 // Spellcasting class can use its own rules (prepared/book classes must prepare).
 const rows=c.classLevels?.length?c.classLevels:[{name:c.className,edition:c.ruleset||'2014'}];
 const row=rows.find(r=>r.name===state.list&&(r.edition||c.ruleset||'2014')==='2014');
 if(!row)return false;
 if(['Bard','Sorcerer','Warlock'].includes(row.name))return true;
 return (c.spells||[]).some(x=>x.name===s.name&&x.prepared&&!x.auto&&(x.castingClassId||rows[0].catalogId)===row.catalogId);
}
export const restFeatMagic=(c,rest)=>rest==='long'?{featSpellUses:{}}:{};
