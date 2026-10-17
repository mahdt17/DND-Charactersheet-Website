import spells14 from '../data/spells.json' with {type:'json'};
import modern from '../data/srd2024.json' with {type:'json'};

const norm=s=>String(s?.name||s||'').trim().toLowerCase().replaceAll('’',"'");
export const featMagicKey=f=>f.id||f.catalogId||`${f.edition||'2014'}:${f.index||f.name}`;
const abilityFor={Bard:'cha',Cleric:'wis',Druid:'wis',Sorcerer:'cha',Warlock:'cha',Wizard:'int'};
export const artisanTools=["Alchemist’s supplies","Brewer’s supplies","Calligrapher’s supplies","Carpenter’s tools","Cartographer’s tools","Cobbler’s tools","Cook’s utensils","Glassblower’s tools","Jeweler’s tools","Leatherworker’s tools","Mason’s tools","Painter’s supplies","Potter’s tools","Smith’s tools","Tinker’s tools","Weaver’s tools","Woodcarver’s tools"];
const catalog=Object.fromEntries(Object.entries({2014:spells14,2024:modern.spells}).map(([edition,spells])=>[edition,spells.map(s=>({...s,edition,catalogId:`${edition}:${s.index}`,classes:(s.classes||[]).map(x=>x.name||x),school:s.school?.name||s.school,description:s.description||s.desc?.join('\n\n')||''}))]));
export function featMagicProfile(f,c={}){
 const edition=f.edition||c.ruleset||'2014',name=norm(f.name);
 if(!catalog[edition]||f.source==='Homebrew'||f.integrityIssues?.length)return null;
 const initiate=name.match(/^magic initiate(?: \((bard|cleric|druid|sorcerer|warlock|wizard)\))?$/);
 if(initiate)return {edition,kind:'initiate',lists:edition==='2024'?['Cleric','Druid','Wizard']:Object.keys(abilityFor),defaultList:initiate[1]?initiate[1][0].toUpperCase()+initiate[1].slice(1):'',cantrips:2,abilityIncrease:false,slotCasting:edition==='2024'};
 if(['fey touched','shadow touched'].includes(name))return {edition,kind:'touched',lists:[],cantrips:0,abilityIncrease:true,slotCasting:true,fixed:name==='fey touched'?'Misty Step':'Invisibility',schools:name==='fey touched'?['Divination','Enchantment']:['Illusion','Necromancy']};
 if(name==='artificer initiate'&&edition==='2014')return {edition,kind:'artificer',lists:['Artificer'],defaultList:'Artificer',cantrips:1,ability:'int',slotCasting:true,tools:true};
 if(name==='spell sniper'&&edition==='2014')return {edition,kind:'sniper',lists:Object.keys(abilityFor),cantrips:1,spellCount:0,attackOnly:true};
 if(name==='ritual caster')return {edition,kind:'ritual',lists:edition==='2014'?Object.keys(abilityFor):[],cantrips:0,spellCount:edition==='2014'?2:2+Math.floor((Math.max(1,c.level||1)-1)/4),ritualOnly:true,abilityIncrease:edition==='2024',slotCasting:edition==='2024'};
 if(name==='telekinetic'||name==='telepathic')return {edition,kind:name,lists:[],cantrips:0,spellCount:0,abilityIncrease:true,slotCasting:name==='telepathic',fixed:name==='telekinetic'?'Mage Hand':'Detect Thoughts'};
 return null;
}
export function featSpellCatalog(f,c={},extra=[]){
 const edition=f.edition||c.ruleset||'2014',base=catalog[edition]||[];
 // Persist only selected, complete published records so grants also work offline.
 const additional=[...Object.values(f.magicChoices?.entries||{}),...extra].filter(s=>s&&s.edition===edition&&s.catalogId&&s.category==='spell'&&s.source!=='Homebrew'&&!s.referenceOnly&&!s.integrityIssues?.length&&Number.isInteger(s.level)&&s.level>=0&&s.level<=9&&Array.isArray(s.classes)&&s.classes.every(x=>typeof (x?.name||x)==='string')&&typeof s.description==='string'&&s.description.trim()&&/^https:\/\//.test(s.sourceUrl||''));
 return [...new Map([...base,...additional].map(s=>[s.catalogId,{...s,classes:s.classes.map(x=>x.name||x),school:s.school?.name||s.school}])).values()];
}
export function featMagicOptions(f,c={},extra=[]){
 const p=featMagicProfile(f,c);if(!p)return {cantrips:[],spells:[]};
 const list=f.magicChoices?.list||p.defaultList;
 const spells=featSpellCatalog(f,c,extra).filter(s=>(!p.lists.length||p.lists.includes(list)&&s.classes.includes(list))&&(!p.schools||p.schools.includes(s.school))&&(!p.ritualOnly||s.ritual===true)&&(!p.attackOnly||s.attack_type||/\b(?:ranged|melee) spell attack\b/i.test(s.description)));
 return {cantrips:spells.filter(s=>s.level===0),spells:spells.filter(s=>s.level===1)};
}
export function featMagicState(f,c={}){
 const profile=featMagicProfile(f,c);if(!profile)return {supported:false,valid:true,spells:[]};
 const choices=f.magicChoices||{},options=featMagicOptions(f,c),list=choices.list||profile.defaultList;
 const ability=profile.ability||(profile.lists.length&&profile.edition==='2014'?abilityFor[list]:choices.ability);
 const cantripIds=Array.isArray(choices.cantrips)?choices.cantrips:[],cantrips=cantripIds.map(id=>options.cantrips.find(s=>s.catalogId===id));
 const wanted=profile.spellCount??1,ids=wanted===1?[choices.spell]:Array.isArray(choices.spells)?choices.spells:[],chosen=ids.map(id=>options.spells.find(s=>s.catalogId===id)),fixed=profile.fixed?catalog[profile.edition].find(s=>s.name===profile.fixed):null;
 const repeatedList=profile.kind==='initiate'&&profile.edition==='2024'&&(c.feats||[]).some(other=>featMagicKey(other)!==featMagicKey(f)&&featMagicProfile(other,c)?.kind==='initiate'&&(other.edition||c.ruleset||'2014')==='2024'&&(other.magicChoices?.list||featMagicProfile(other,c).defaultList)===list);
 const complete=chosen.length===wanted;
 const valid=!repeatedList&&(!f.requiredSpellList||list===f.requiredSpellList)&&cantrips.length===profile.cantrips&&cantrips.every(Boolean)&&new Set(cantripIds).size===cantrips.length&&(complete||profile.kind==='ritual'&&profile.edition==='2024'&&chosen.length>=2&&chosen.length<wanted)&&chosen.every(Boolean)&&new Set(ids).size===ids.length&&['int','wis','cha'].includes(ability)&&(!profile.fixed||Boolean(fixed))&&(!profile.tools||artisanTools.includes(choices.tool));
 const copied=profile.kind==='ritual'&&profile.edition==='2014'&&Array.isArray(choices.copiedRituals)?choices.copiedRituals.filter(s=>validCopiedRitual(f,c,s)):[];
 const spells=valid?[...cantrips,...chosen,...copied,...(fixed?[fixed]:[])].map(s=>({...s,featGrantId:featMagicKey(f),featAbility:ability,featSpellGrant:true,featUseKey:`${featMagicKey(f)}:${profile.kind==='ritual'?'quick':s===fixed?'fixed':'choice'}`,featSlotCasting:profile.slotCasting,featRitual:profile.kind==='ritual',featRitualOnly:profile.kind==='ritual'&&profile.edition==='2014',featSource:f.name,prepared:true,
 ...(profile.kind==='telekinetic'?{components:[],range:profile.edition==='2024'||(c.spells||[]).some(x=>x.name==='Mage Hand')?'60 feet':s.range,featNotes:'Invisible hand; no verbal or somatic components.'}:profile.kind==='telepathic'?{featNotes:'Free feat cast requires no spell components.'}:{})})):[];
 return {supported:true,valid,complete,profile,ability,list,spells};
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
export function changeFeatChoices(c,old,next,{correctionReason=''}={}){
 const before=featMagicState(old,c),after=featMagicState(next,{...c,feats:(c.feats||[]).map(f=>featMagicKey(f)===featMagicKey(old)?next:f)});
 if(!after.valid||!after.complete)throw Error('Complete valid feat choices before saving.');
 const previous=old.magicChoices||{},choice=next.magicChoices||{},level=Math.max(1,Number(c.level)||1);
 let allowed=!before.valid,changedLevel=previous.changedLevel??old.level??level;
 const sameIdentity=before.list===after.list&&before.ability===after.ability;
 if(before.profile?.kind==='initiate'&&before.profile.edition==='2024'&&sameIdentity&&level>changedLevel){
  const a=[...(previous.cantrips||[]),previous.spell],b=[...(choice.cantrips||[]),choice.spell];
  allowed=a.filter(x=>!b.includes(x)).length===1&&b.filter(x=>!a.includes(x)).length===1;
  if(allowed)changedLevel=level;
 }
 if(before.profile?.kind==='ritual'&&before.profile.edition==='2024'&&sameIdentity)allowed=(previous.spells||[]).every(id=>(choice.spells||[]).includes(id))&&(choice.spells||[]).length>=(previous.spells||[]).length;
 if(!allowed&&!correctionReason.trim())throw Error('This feat cannot replace these choices at the current level.');
 return {...next,magicChoices:{...choice,changedLevel:before.valid?changedLevel:level},...(correctionReason.trim()?{magicCorrections:[...(old.magicCorrections||[]),{level,reason:correctionReason.trim()}]}:{})};
}
export const restFeatMagic=(c,rest)=>rest==='long'?{featSpellUses:{}}:{};

export function validCopiedRitual(f,c,s){
 const p=featMagicProfile(f,c),list=f.magicChoices?.list;
 return p?.kind==='ritual'&&p.edition==='2014'&&typeof s?.copySource==='string'&&!!s.copySource.trim()&&s.ritual===true&&Number.isInteger(s.level)&&s.level>0&&s.level<=Math.ceil((c.level||1)/2)&&featSpellCatalog(f,c,[s]).some(x=>x.catalogId===s.catalogId&&x.ritual===true&&x.level===s.level&&x.classes.includes(list));
}
export function copyFeatRitual(f,c,s,source){
 const copied={...s,copySource:String(source||'').trim()},state=featMagicState(f,c);
 if(!state.valid||!validCopiedRitual(f,c,copied))throw Error('Choose an eligible ritual and record its written source.');
 if(state.spells.some(x=>x.catalogId===s.catalogId))throw Error('This ritual is already in your book.');
 return {...f,magicChoices:{...f.magicChoices,copiedRituals:[...(f.magicChoices.copiedRituals||[]),copied]}};
}
