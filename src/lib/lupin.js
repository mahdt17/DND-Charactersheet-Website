import {lupinId,lupinRace} from '../data/lupin.js';
import {backgrounds2014} from '../data/backgrounds2014.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {weaponAttacks,modifier,signed} from './rules.js';
import {entomancerSkillRank,entomancerProfile,entomancerActionBlockReason,entomancerRollTraits} from './entomancer.js';
import {applyEntomancerAction} from './entomancerActions.js';
import {campaignSkillBonus} from './archivistCampaign.js';
import {campaignModifiers} from './campaignModifiers.js';
import {campaignActionBlockReason} from './campaignActivity.js';
import {totemProfile} from './totemWarrior.js';
export const isLupin=c=>c?.race==='Lupin'&&c.raceDefinition?.catalogId===lupinId&&c.raceDefinition.edition==='2014'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';
const list=value=>(Array.isArray(value)?value:String(value||'').split(/[,;\n]/)).map(x=>String(x?.name||x).replace(/^Skill: /,'').trim()).filter(Boolean);
const pb=c=>2+Math.floor((Math.max(1,Math.min(20,Number(c.level)||1))-1)/4);
function independentRider(c){
 const background=[...list(c.backgroundSkills),...list(c.backgroundDefinition?.skills),...list(c.backgroundDefinition?.skill_proficiencies),...list(backgrounds2014[c.background]?.skills)].map(n=>n==='Animal Handling'&&c.lupin?.backgroundSkill?c.lupin.backgroundSkill:n);
 return [...list(c.classSkills),...background,...list(c.bonusSkills),...list(c.skillExtras),...list(c.manualSkills),c.variantHuman?.skill].includes('Animal Handling')||!!c.expertise?.['Animal Handling']||(c.trainingGrants||[]).some(g=>!g.lupinManaged&&g.proficiencies?.some(p=>p.kind==='skills'&&p.name==='Animal Handling'))||Object.values(c.featureChoices||{}).some(g=>(g.choices||[]).includes('Animal Handling'));
}
export function reconcileLupin(c){
 const active=isLupin(c),old=c.lupin?.skillGrant,skillProf={...c.skillProf},trainingGrants=(c.trainingGrants||[]).filter(g=>!g.lupinManaged),traits=(c.traits||[]).filter(t=>t.homebrew||t.raceGrantId!==lupinId);
 if(!active){
  const managed=old||(c.trainingGrants||[]).some(g=>g.lupinManaged)||(c.traits||[]).some(t=>!t.homebrew&&t.raceGrantId===lupinId);
  if(!managed)return c;
  if(old?.previous===false&&!independentRider(c))delete skillProf['Animal Handling'];
  return {...c,skillProf,trainingGrants,...(c.traits?{traits}:{}),...(old?{lupin:{...c.lupin,skillGrant:undefined}}:{})};
 }
 const skillGrant=old||{name:'Animal Handling',previous:!!skillProf['Animal Handling']};skillProf['Animal Handling']=true;
 trainingGrants.push({id:lupinId+':rider',classId:lupinId,sourceFeatureId:lupinId+':rider',sourceClassName:'Lupin',edition:'2014',lupinManaged:true,proficiencies:[{kind:'skills',name:'Animal Handling',index:'skill-animal-handling',source:'Lupin · Expert Rider'}]});
 return {...c,skillProf,trainingGrants,lupin:{...c.lupin,skillGrant},traits:[...traits,...lupinRace.traits.map(t=>({...t,id:lupinId+':'+t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),source:lupinRace.source}))]};
}
export const finishLupin=c=>isLupin(c)?reconcileLupin({...c,lupin:{...c.lupin,skillGrant:{name:'Animal Handling',previous:false}}}):c;
export function lupinActionBlock(c){
 if(!isLupin(c))return 'This character does not have the Lupin 5e conversion.';
 const conditions=list(c.conditions).map(n=>n.toLowerCase());
 return Number(c.hp?.current??1)<=0||conditions.some(n=>['incapacitated','unconscious','stunned','paralyzed','petrified','dead'].includes(n))?'You cannot use this ability while unconscious or incapacitated.':entomancerActionBlockReason(c)||campaignActionBlockReason(c)||'';
}
const assertLupin=c=>{const blocked=lupinActionBlock(c);if(blocked)throw Error(blocked);};
export function lupinSense(c,kind,wind='normal'){
 assertLupin(c);
 if(kind==='hearing'&&list(c.conditions).some(n=>n.toLowerCase()==='deafened'))throw Error('You cannot make a hearing-based check while Deafened.');
 const options={hearing:['Perception','Keen Hearing'],smell:['Perception','Keen Smell'],tracks:['Survival','Tracking'],lycanthrope:['Perception','Scent a lycanthrope'],hidden:['Perception','Locate a hidden creature'],disguise:['Perception','Recognize a familiar scent'],riding:['Animal Handling','Handle a mount']},choice=options[kind];
 if(!choice)throw Error('Choose a Lupin sense or riding check.');
 const [skill,name]=choice,rank=Math.max(entomancerSkillRank(c,skill),skill==='Animal Handling'?1:0),bonus=modifier(effectiveAbilityScores(c).wis)+rank*pb(c)+campaignSkillBonus(c,skill);
 const range=kind==='lycanthrope'?({normal:30,upwind:60,downwind:15}[wind]??30):['hidden','disguise'].includes(kind)?5:undefined;
 const dc=['lycanthrope','hidden'].includes(kind)?10:undefined;
 return {expression:`1d20${signed(bonus)}`,label:`${skill} · Lupin ${name}`,kind:'check',advantage:kind!=='riding',disadvantage:entomancerRollTraits(c,skill).disadvantage,range,dc,action:['lycanthrope','hidden','disguise'].includes(kind),note:kind==='hidden'?'Ask the DM what you locate. This does not grant sight or remove invisibility.':kind==='tracks'?'Follow physical tracks; smell supplies additional clues.':kind==='disguise'?'Only a familiar creature within 5 feet; the DM sets the DC.':'The DM resolves scent, hearing and target availability.'};
}
export function lupinOdorSave(c,ability='con'){
 if(!isLupin(c))throw Error('This character does not have the Lupin 5e conversion.');
 const conditions=list(c.conditions).map(n=>n.toLowerCase());if(conditions.includes('dead')||entomancerProfile(c).level&&c.entomancer?.dead)throw Error('A dead character cannot make this saving throw.');
 const names={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};if(!names[ability])throw Error('Choose a saving throw ability.');
 const swarm=entomancerProfile(c),bonus=modifier(effectiveAbilityScores(c)[ability])+(c.saveProf?.[ability]?pb(c):0)+(swarm.song?swarm.wis:0)+(ability==='con'?(campaignModifiers(c).conSave||0):0);
 const autoFail=['str','dex'].includes(ability)&&(Number(c.hp?.current??1)<=0||conditions.some(n=>['paralyzed','petrified','stunned','unconscious'].includes(n)));
 return {expression:`1d20${signed(bonus)}`,label:`${names[ability]} saving throw · Lupin odor sensitivity`,kind:'save',disadvantage:true,autoFail,note:autoFail?`Automatically fails ${names[ability]} saves in the current condition; no roll is needed.`:''};
}
function hunterDamage(expression){const match=String(expression).match(/^(\d+d\d+|\d+)([+-]\d+)?$/i);if(!match)throw Error('This weapon needs a manual damage roll.');if(!match[1].includes('d'))return String(Number(match[1])+Number(match[2]||0)+1);return match[1]+signed(Number(match[2]||0)+1);}
export function lupinHuntAttacks(c){
 if(!isLupin(c))return [];const abilities=effectiveAbilityScores(c),rage=totemProfile(c,abilities),str=modifier(abilities.str);
 const swarm=entomancerProfile(c,abilities),strike=swarm.species==='Exo-Gotas'&&swarm.level>=6&&c.entomancer?.strengthStrike?2:0,unarmedExtra=swarm.species==='Exo-Gotas'&&swarm.level>=14?swarm.con:0;
 const unarmed={id:'unarmed',name:'Unarmed strike',attack:str+pb(c)+unarmedExtra+strike,entomancerStrike:!!strike,damage:String(Math.max(0,1+str+strike+(rage.activeRage&&!rage.heavyArmor?rage.rageDamage:0))),description:'Melee · bludgeoning'};
 return [...weaponAttacks(c,abilities),unarmed].map(a=>({...a,attack:a.attack+1,damage:hunterDamage(a.damage)}));
}
export function lupinHuntAfterAttack(c,id){assertLupin(c);const attack=lupinHuntAttacks(c).find(a=>a.id===id);if(!attack)throw Error('Choose an available hunting weapon.');return attack.entomancerStrike?applyEntomancerAction(c,'consume-strike'):{};}
