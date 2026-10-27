import {totemAnimals,totemBenefits,totemFeatures,totemFeatureNames,totemSourceUrl,totemTigerSkills} from '../data/totemWarrior.js';
import {effectiveAbilityScores} from './abilityScores.js';
import equipment from '../data/equipment.json' with {type:'json'};
import spells from '../data/spells.json' with {type:'json'};

export const totemRageId='2014:Barbarian:rage';
const count=n=>Math.max(0,Math.floor(Number(n)||0));
const norm=n=>String(n||'').trim().toLowerCase();
const rows=c=>c.classLevels?.length?c.classLevels:[{name:c.className,definition:c.classDefinition,edition:c.classDefinition?.edition||(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014',level:c.level,subclass:c.subclass}];
const sourceRow=(r,c)=>{
 const d=r.definition||r,edition=r.edition||d.edition||(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
 const id=d.catalogId||d.id||r.catalogId||'';
 const known=d.index==='barbarian'||['2014:barbarian','wikidot5e:barbarian'].includes(norm(id))||(!id&&!d.index&&norm(d.name||r.name)==='barbarian');
 return edition==='2014'&&norm(r.name||d.name)==='barbarian'&&known&&!d.homebrew&&!r.homebrew&&!d.prestige&&norm(d.source)!=='homebrew';
};
const totemRow=c=>((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014'?rows(c).find((r,i)=>sourceRow(r,c)&&['totem warrior','path of the totem warrior'].includes(norm(r.subclass??(i===0?c.subclass:'')))):null;
const conditions=c=>(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(n=>norm(typeof n==='object'?n?.name:n));
const incapacitated=c=>Number(c.hp?.current??1)<=0||conditions(c).some(n=>['dead','incapacitated','unconscious','paralyzed','stunned','petrified'].includes(n));
const rageEnded=c=>Number(c.hp?.current??1)<=0||conditions(c).some(n=>['dead','unconscious'].includes(n));
export function totemActionBlockReason(c){return !totemRow(c)?'This character does not have the 2014 Totem Warrior path.':incapacitated(c)?'You cannot act while unconscious or incapacitated.':'';}
export const totemHeavyArmor=c=>(c.inventory||[]).some(i=>i.equipped&&norm(i.armor_category||equipment.find(e=>e.index===i.equipmentIndex)?.armor_category)==='heavy');
export function totemProfile(c,abilities,walkingSpeed){
 const row=totemRow(c),level=row?Math.min(20,count(row.level)):0,s=c.totemWarrior||{};
 const total=rows(c).reduce((n,r)=>n+count(r.level),0)+(c.classLevels?.length?0:count(c.otherClassLevels));
 const pb=2+Math.floor((Math.max(1,total)-1)/4),str=Math.floor((Number((abilities||effectiveAbilityScores(c)).str??10)-10)/2);
 const choice=(key,min)=>level>=min&&totemAnimals.includes(s[key])?s[key]:'';
 const spirit=choice('spirit',3),aspect=choice('aspect',6),attunement=choice('attunement',14),activeRage=level>=3&&!!s.activeRage&&!rageEnded(c),heavyArmor=totemHeavyArmor(c);
 const movementBonus=activeRage&&spirit==='Elk'&&!heavyArmor?15:0;
 const speed=walkingSpeed==null?Math.max(0,Number(c.speed)||0)+movementBonus:Math.max(0,Number(walkingSpeed)||0);
 const max=level>=17?6:level>=12?5:level>=6?4:level>=3?3:0,unlimited=level>=20;
 const resource=(c.resources||[]).find(r=>r.classResourceKey===totemRageId||r.id===totemRageId),used=count(resource?.used);
 return {level,classId:row?.catalogId||'2014:barbarian',spirit,aspect,attunement,pb,str,activeRage,heavyArmor,movementBonus,walkingSpeed:speed,flyingSpeed:activeRage&&attunement==='Eagle'?speed:0,flightNote:attunement==='Eagle'?'Short bursts only: fall at turn end unless another effect holds you aloft.':'',max,used,remaining:unlimited?Infinity:Math.max(0,max-used),unlimited,rageDamage:level>=16?4:level>=9?3:2,elkDC:8+pb+str,elkDamage:`1d12${str>=0?'+':''}${str}`,longJumpBonus:activeRage&&spirit==='Tiger'?10:0,highJumpBonus:activeRage&&spirit==='Tiger'?3:0,carryingMultiplier:aspect==='Bear'?2:1,travelPaceMultiplier:aspect==='Elk'&&!incapacitated(c)?2:1};
}
export function totemFeatureRows(c){
 const p=totemProfile(c);if(p.level<3)return [];
 return totemFeatures.filter(f=>f.level<=p.level).map(f=>{const animal=({3:p.spirit,6:p.aspect,14:p.attunement})[f.level];if(f.name!==totemFeatureNames[f.level]||!animal)return {...f,totemManaged:true};const description=totemBenefits[f.level][animal];return {...f,name:`${f.name} · ${animal}`,description,desc:[description],totemManaged:true};});
}
export function totemRageResource(c){const p=totemProfile(c);return p.level>=3?{id:totemRageId,classResourceKey:totemRageId,name:'Rage',className:'Barbarian',edition:'2014',max:p.max,used:p.used,unlimited:p.unlimited,reset:'long',shortRecovery:0,totemManaged:true,recoveryText:p.unlimited?'Unlimited Rage uses (Barbarian 20).':'Recover all uses on a long rest.'}:null;}
export function startTotemRage(c){
 const blocked=totemActionBlockReason(c);if(blocked)throw Error(blocked);
 const p=totemProfile(c);if(p.level<3)throw Error('Reach Barbarian level 3 before using Totem Warrior.');if(p.activeRage)throw Error('Rage is already active.');if(!p.unlimited&&!p.remaining)throw Error('No Rage uses remaining.');
 return {totemWarrior:{...c.totemWarrior,activeRage:true},concentration:'',resources:[...(c.resources||[]).filter(r=>r.id!==totemRageId&&r.classResourceKey!==totemRageId),{...totemRageResource(c),used:p.unlimited?p.used:p.used+1}]};
}
export const endTotemRage=c=>({totemWarrior:{...c.totemWarrior,activeRage:false}});
export const totemCastingBlockReason=c=>totemProfile(c).activeRage?'You cannot cast spells or rituals while raging. End Rage first.':'';
const damageTypes=['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','radiant','slashing','thunder'];
export function totemDamageResistance(c,type){const p=totemProfile(c);return p.activeRage&&(p.spirit==='Bear'&&damageTypes.includes(norm(type))||!p.heavyArmor&&['bludgeoning','piercing','slashing'].includes(norm(type))); }
const beastSense={index:'beast-sense',name:'Beast Sense',level:2,casting_time:'1 action',range:'Touch',components:['S'],duration:'Concentration, up to 1 hour',concentration:true,description:'Touch a willing beast. Spend an action to perceive through its sight and hearing; spend another action to return to your own senses. See the linked spell source for the full effect.'};
export function totemRituals(c){const p=totemProfile(c);return p.level<3?[]:['beast-sense','speak-with-animals',...(p.level>=10?['commune-with-nature']:[])].map(index=>{const spell=spells.find(s=>s.index===index)||beastSense;return {...spell,edition:'2014',catalogId:`2014:${index}`,totemRitual:true,ritual:true,sourceUrl:`https://dnd5e.wikidot.com/spell:${index}`,description:spell.description||spell.desc?.join('\n\n')||''};});}
export function castTotemRitual(c,name){const blocked=totemActionBlockReason(c)||totemCastingBlockReason(c);if(blocked)throw Error(blocked);const spell=totemRituals(c).find(s=>norm(s.name)===norm(name));if(!spell)throw Error('This Totem Warrior ritual is not available.');return spell.concentration?{concentration:spell.name}:{};}

const skillList=value=>(Array.isArray(value)?value:String(value||'').split(/[,;\n]/)).map(n=>String(n?.name||n).replace(/^Skill: /,'').trim()).filter(Boolean);
// Older saves retain only the background name. Preserve its overlapping Tiger
// skills when removing a subclass grant, as well as explicit modern grants.
const backgroundTigerSkills={Criminal:['Stealth'],Entertainer:['Acrobatics'],'Folk Hero':['Survival'],Outlander:['Athletics','Survival'],Sailor:['Athletics'],Soldier:['Athletics'],Urchin:['Stealth'],'Shadow Scholar':['Stealth']};
function independentSkill(c,name){
 return [...skillList(c.classSkills),...skillList(c.backgroundSkills),...skillList(c.backgroundDefinition?.skills),...skillList(c.backgroundDefinition?.skill_proficiencies),...skillList(c.bonusSkills),...skillList(c.skillExtras),...skillList(c.manualSkills),...(backgroundTigerSkills[c.background]||[]),c.variantHuman?.skill].includes(name)||!!c.expertise?.[name]||(c.trainingGrants||[]).some(g=>!g.totemManaged&&(g.proficiencies||[]).some(p=>p.kind==='skills'&&p.name===name));
}
export function reconcileTotemWarrior(c){
 const p=totemProfile(c),s=c.totemWarrior||{},oldOwned=Array.isArray(s.ownedSkills)?s.ownedSkills:[];
 const trainingGrants=(c.trainingGrants||[]).filter(g=>!g.totemManaged),skillProf={...c.skillProf};
 const wanted=p.aspect==='Tiger'?[...new Set((s.tigerSkills||[]).filter(n=>totemTigerSkills.includes(n)))].slice(0,2):[];
 for(const name of oldOwned)if(!wanted.includes(name)&&!independentSkill(c,name))delete skillProf[name];
 const ownedSkills=[];
 for(const name of wanted){if(!skillProf[name]||oldOwned.includes(name))ownedSkills.push(name);skillProf[name]=true;}
 if(wanted.length)trainingGrants.push({id:'totem-warrior:tiger-training',classId:'totem-warrior:tiger-training',sourceClassId:p.classId,className:'Barbarian · Totem Warrior',edition:'2014',totemManaged:true,proficiencies:wanted.map(name=>({kind:'skills',name,index:`skill-${norm(name).replace(/ /g,'-')}`}))});
 const grantedFeatures=[...(c.grantedFeatures||[]).filter(f=>!f.totemManaged),...totemFeatureRows(c).map(f=>({...f,id:`totem-warrior:${f.index}`,sourceType:'subclass-grant',sourceClassId:p.classId,sourceClassName:'Barbarian',edition:'2014',sourceUrl:totemSourceUrl}))];
 return {...c,totemWarrior:{...s,ownedSkills,...(!p.level||rageEnded(c)?{activeRage:false}:{})},skillProf,trainingGrants,grantedFeatures};
}
export function totemChoicePlan(c,previous=null,picks={}){
 const p=totemProfile(c);if(p.level<3)return {groups:[],patch:{},valid:true};
 const state={...c.totemWarrior},groups=[];
 const add=(id,level,label,options,selected,count=1)=>{
  const raw=Object.hasOwn(picks,id)?picks[id]:selected,chosen=Array.isArray(raw)?raw:raw?[raw]:[],required=Math.min(count,options.length);
  const valid=chosen.length===required&&new Set(chosen).size===chosen.length&&chosen.every(n=>options.includes(n));
  groups.push({id,className:'Barbarian',level,label,kind:'source-choice',choiceKind:'option',options,required,count,selected:chosen,valid,sourceText:level===6&&id.endsWith('skills')?'Choose two skills you do not already know. Only remaining eligible skills can be granted.':`${label}: choose any animal independently. ${Object.entries(totemBenefits[level]).map(([n,text])=>`${n}: ${text}`).join('\n')}`,sourceUrl:totemSourceUrl});
  return {chosen,valid};
 };
 for(const [level,key] of [[3,'spirit'],[6,'aspect'],[14,'attunement']]){
  if(p.level<level)continue;const id=`totem-warrior:${level}`;
  if(!totemAnimals.includes(state[key])){const result=add(id,level,totemFeatureNames[level],totemAnimals,state[key]);if(result.valid)state[key]=result.chosen[0];}
 }
 if(p.level>=6&&state.aspect==='Tiger'){
  const owned=c.totemWarrior?.ownedSkills||[];
  const options=totemTigerSkills.filter(n=>!independentSkill(c,n)&&(!c.skillProf?.[n]||owned.includes(n)));
  const id='totem-warrior:6:skills';
  const saved=Array.isArray(state.tigerSkills)?state.tigerSkills:[],savedValid=saved.length===Math.min(2,options.length)&&new Set(saved).size===saved.length&&saved.every(n=>totemTigerSkills.includes(n));
  if(!savedValid){const result=add(id,6,'Tiger skill proficiencies',options,saved,2);if(result.valid)state.tigerSkills=result.chosen;}
 }
 const next=reconcileTotemWarrior({...c,totemWarrior:state});
 return {groups,patch:{totemWarrior:next.totemWarrior,skillProf:next.skillProf,trainingGrants:next.trainingGrants,grantedFeatures:next.grantedFeatures},valid:groups.every(g=>g.valid)};
}
