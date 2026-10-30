import {expandedSubclassRows,subclassSpellOptions,expandedSubclassContext} from './expandedSubclasses.js';
import {sourceFeature,assertAct,spendFeature,featureState,putState,validRoll} from './subclassActionUtils.js';
import {characterClasses} from './advancement.js';
import {rageCastingBlock,featureCastingBlock} from './rage2014.js';
import {spellPlan,conditionEffects} from './play.js';
import {castEffectPatch} from './spellEffects.js';
import {healingFeaturePlan} from './subclassHealing.js';
const spellNamed=name=>subclassSpellOptions.find(s=>s.name.toLowerCase()===String(name).toLowerCase());
const spellList=(s,cls)=>(s.classes||[]).some(v=>(v.name||v)===cls);
const materialize=s=>({...s,edition:'2014',description:s.description||s.desc?.join('\n\n')||'',school:s.school?.name||s.school});
export function featureCastingOptions(c){
 const list=[];for(const p of expandedSubclassRows(c)){
  for(const d of p.record.disciplineOptions||[])if(d.spellName&&d.level<=p.row.level&&p.state.disciplines?.includes(d.name))list.push({key:`discipline:${d.name}`,name:`${d.name} · ${d.spellName}`,spellNames:[d.spellName],p,ki:d.kiCost,maxKi:p.row.level>=17?6:p.row.level>=13?5:p.row.level>=9?4:p.row.level>=5?3:d.kiCost});
  if(['druid:stars','druid:stars-ua'].some(id=>p.record.id.endsWith(id)))list.push({key:'star-map',name:'Star Map free casting',spellNames:p.record.playtest?['Guiding Bolt','Augury']:['Guiding Bolt'],p});
  if(['sorcerer:shadow-magic','sorcerer:shadow-ua'].some(id=>p.record.id.endsWith(id))&&p.row.level>=(p.record.playtest?1:3))list.push({key:'shadow-darkness',name:'Eyes of the Dark · Darkness',spellNames:['Darkness'],p});
  if(p.record.id==='2014:subclass:mage:silverquill-ua'||p.record.id.endsWith(':mage-of-silverquill-ua'))try{sourceFeature(c,[p.record.id.split(':').slice(-2).join(':')],'inky-shroud');list.push({key:'inky-shroud',name:'Inky Shroud',spellNames:['Darkness'],p});}catch{}
 }
 for(const row of characterClasses(c))if(row.name==='Warlock'&&row.edition==='2014'&&!row.definition?.homebrew)for(const [level,unlock] of [[6,11],[7,13],[8,15],[9,17]])if(row.level>=unlock){const genie=expandedSubclassRows(c).some(p=>p.row.catalogId===row.catalogId&&p.record.id==='2014:subclass:warlock:the-genie');list.push({key:`arcanum:${level}`,name:`Mystic Arcanum ${level}`,row,spellNames:subclassSpellOptions.filter(s=>s.level===level&&(spellList(s,'Warlock')||level===9&&genie&&s.name==='Wish')).map(s=>s.name)});}
 return list;
}
export function featureCastPlan(c,key,{ki,name,recipient,targetAtZero}={}){
 assertAct(c);const blocked=rageCastingBlock(c);if(blocked)throw Error(blocked);const d=featureCastingOptions(c).find(d=>d.key===key);if(!d)throw Error('This feature cast is not available.');name=name||d.spellNames[0];if(!d.spellNames.includes(name))throw Error('Choose an eligible feature spell.');const raw=spellNamed(name);if(!raw)throw Error('The chosen spell is unavailable.');if(featureCastingBlock(c,raw))throw Error(featureCastingBlock(c,raw));const p=d.p,ability=key.startsWith('discipline:')?'wis':key.startsWith('arcanum:')?'cha':({Druid:'wis',Sorcerer:'cha',Warlock:'cha'})[p?.row.name]||'int';let cost=1,resource=null,slotLevel=raw.level;
 if(key.startsWith('discipline:')){cost=ki??d.ki;if(!Number.isInteger(cost)||cost<d.ki||cost>d.maxKi)throw Error(`Choose ki from ${d.ki} to the maximum ${d.maxKi}.`);if(cost>d.ki&&(d.p.row.level<5||!raw.higher_level?.length))throw Error('This discipline cannot be upgraded at this level.');slotLevel+=cost-d.ki;resource='2014:Monk:points';}
 if(key==='star-map'){if(!p.state['holding-star-map']?.includes('yes'))throw Error('Hold your Star Map before casting.');resource='star-map-casts';}
 if(key==='shadow-darkness'){resource='2014:Sorcerer:points';cost=p.record.playtest?1:2;}
 if(key==='inky-shroud')resource='inky-shroud';
 const spell=materialize(raw),context=p?.context||expandedSubclassContext(c,p?.row||d.row),mod=context[ability];return {...d,spell,ability,mod,dc:8+context.pb+mod,slotLevel,cost,resource,plan:healingFeaturePlan(c,spell,spellPlan(spell,c,slotLevel,mod),{slotLevel,recipient,targetAtZero})};
}
export function executeFeatureCast(c,key,input={}){
 const d=featureCastPlan(c,key,input);if(!input.confirmed)throw Error('Confirm required components, equipment, targets, and casting time.');
 const results=input.rolls||[];for(const r of d.plan.rolls)if(!results.some(v=>v.label===r.label&&Number.isFinite(v.total)&&v.total>=0))throw Error('Resolve each visible spell roll before spending.');
 let spend={};if(key.startsWith('arcanum:')){const level=Number(key.split(':')[1]),owner=d.row.catalogId,saved=c.subclassArcanum?.[owner]?.[level];if(saved?.name&&saved.name!==d.spell.name)throw Error('Use your selected Mystic Arcanum; replace choices at advancement.');if(saved?.used)throw Error('This Mystic Arcanum was already used; finish a long rest.');spend={subclassArcanum:{...c.subclassArcanum,[owner]:{...c.subclassArcanum?.[owner],[level]:{name:d.spell.name,used:true}}}};}else spend=spendFeature(c,d.p,d.resource,d.cost);
 return {...spend,...castEffectPatch(c,d.spell,{recipient:input.recipient,rolls:results,plan:d.plan,slotLevel:d.slotLevel,maxHP:conditionEffects(c).maxHP})};
}
export function temporarySpellOptions(c,key,{participants=1}={}){
 const p=key==='spirit-session'?sourceFeature(c,['bard:spirits','bard:spirits-ua'],'spirit-session'):sourceFeature(c,['sorcerer:psionic-soul-ua'],'psionic-talent');
 const schools=key==='spirit-session'?['Divination','Necromancy']:['Divination','Enchantment'],max=Math.min(Math.ceil(p.row.level/2),key==='spirit-session'?participants:9);
 return {p,spells:subclassSpellOptions.filter(s=>s.level>=1&&s.level<=max&&schools.includes(s.school?.name||s.school)&&(key==='spirit-session'||spellList(s,'Sorcerer'))&&!(c.spells||[]).some(v=>v.name===s.name&&(v.castingClassId||p.row.catalogId)===p.row.catalogId))};
}
export function acquireTemporarySpell(c,key,{name,participants=1,confirmed=false,result}={}){
 assertAct(c);const {p,spells}=temporarySpellOptions(c,key,{participants});if(!confirmed)throw Error('Confirm completing the source ritual/meditation with its required focus.');if(key==='spirit-session'&&(!Number.isInteger(participants)||participants<1||participants>p.context.pb))throw Error('Choose participants from 1 through your proficiency bonus.');if(key==='spirit-session'&&c.subclassSessionUsed?.[p.row.catalogId])throw Error('Spirit Session is already used until you start a long rest.');const s=spells.find(s=>s.name===name);if(!s)throw Error('Choose a legal temporary spell.');const duration=key==='spirit-session'?null:validRoll(result,{min:1,max:12})*3600,state=featureState(c,p,key,{temporarySpell:name,endsOnLongRest:key==='spirit-session',...(duration?{remainingSeconds:duration}:{})}),patch=putState(c,state);
 const spell={...materialize(s),id:`temporary:${state.id}`,castingClassId:p.row.catalogId,sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,sourceEffectId:state.id,classSpellGrant:true,expandedSubclassManaged:true,temporarySubclassSpell:true,acquisition:'known',bonusKnown:true,prepared:true,sourceAbility:p.row.name==='Bard'?'cha':'cha'};
 return {...patch,spells:[...(c.spells||[]).filter(v=>v.id!==spell.id),spell],...(key==='spirit-session'?{subclassSessionUsed:{...c.subclassSessionUsed,[p.row.catalogId]:true}}:{})};
}
export function startSubclassLongRest(c){return {activeEffects:(c.activeEffects||[]).filter(e=>!e.endsOnLongRest),spells:(c.spells||[]).filter(s=>!s.temporarySubclassSpell||!(c.activeEffects||[]).some(e=>e.id===s.sourceEffectId&&e.endsOnLongRest)),subclassSessionUsed:{}};}
export {featureCastingRest} from './subclassRest.js';
