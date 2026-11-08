import {applyPotentSpellcasting} from './subclassCantripDamage.js';
import {typedOwnDamageAmount,ownFormOverflowAdjuster} from './subclassOwnForm.js';
import {enhancedBondPlan} from './subclassEnhancedBond.js';
import {loreholdHealerActive,retainsOwnFeatures,actorBodyHP} from './subclassState.js';
import {damageActiveBody} from './subclassState.js';
import {subclassRoll} from './subclassFormulas.js';
import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {sourceFeature,assertAct,assertZeroHPTrigger,spendFeature,tempHP,healHP,featureState,putState,validRoll} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';
const immediate=s=>!!s?.heal_at_slot_level&&!['false life','aid','goodberry','healing spirit','aura of vitality','vampiric touch','enervation'].includes(String(s.name).toLowerCase());
const domain=(c,name,feature)=>retainsOwnFeatures(c)&&expandedSubclassRows(c).find(p=>p.record.features.some(f=>(p.record.id===`2014:subclass:cleric:${name}`||f.inheritedRecordId===`2014:subclass:cleric:${name}`)&&f.name===feature&&expandedFeatureUnlocked(p,f)));
export function healingFeaturePlan(c,spell,plan,{slotLevel=spell.level,recipient,targetAtZero=false}={}){
 plan=enhancedBondPlan(c,spell,applyPotentSpellcasting(c,spell,plan));
 if(!immediate(spell)||slotLevel<1)return plan;const life=domain(c,'life','Disciple of Life'),grave=domain(c,'grave','Circle of Mortality'),bonus=life?2+slotLevel:0,maximize=!!domain(c,'life','Supreme Healing')||!!grave&&(recipient==='self'?actorBodyHP(c)===0:recipient==='other'&&targetAtZero);
 return {...plan,rolls:plan.rolls.map(r=>{if(!/healing/i.test(r.label))return r;let expression=r.expression;if(maximize){const terms=expression.replace(/(\d+)d(\d+)/gi,(_,n,d)=>String(Number(n)*Number(d))).match(/[+-]?\d+/g);if(!terms||!/^[\d+\-]+$/.test(expression.replace(/(\d+)d(\d+)/gi,'1')))throw Error('Use a supported healing expression.');expression=String(terms.reduce((n,v)=>n+Number(v),0));}if(bonus&&!r.enhancedBond)expression=/^\d+$/.test(expression)?String(Number(expression)+bonus):subclassRoll(`${expression}+${bonus}`);if(!r.enhancedBond&&recipient==='self'&&loreholdHealerActive(c)){const m=expression.match(/^(.*?)([+-]\d+)?$/);expression=/^\d+$/.test(expression)?`1d8+${expression}`:`${m[1]}+1d8${m[2]||''}`;}return {...r,expression};}),notes:[plan.notes,bonus?`Disciple of Life adds ${bonus} healing.`:'',maximize?'Healing dice use their maximum result.':''].filter(Boolean).join(' ')};
}
export function blessedHealerPatch(c,spell,{recipient,slotLevel,maxHP}={}){const life=domain(c,'life','Blessed Healer');return immediate(spell)&&slotLevel>=1&&recipient==='other'&&life?healHP(c,2+slotLevel,maxHP):{};}
const defs=[
 {key:'fighting-spirit',records:['fighter:samurai'],feature:'fighting-spirit',resource:'fighting-spirit'},
 {key:'survivor',records:['fighter:champion'],feature:'survivor',trigger:'Start of your turn, conscious, below half your maximum HP'},
 {key:'dark-ones-blessing',records:['warlock:fiend'],feature:'dark-ones-blessing',trigger:'You reduced a hostile creature to 0 HP'},
 {key:'touch-of-death',records:['monk:long-death'],feature:'touch-of-death',trigger:'You reduced a creature within 5 feet to 0 HP'},
 {key:'healing-light',records:['warlock:celestial'],feature:'healing-light',resource:'healing-light',variable:true,die:6},
 {key:'balm',records:['druid:dreams'],feature:'balm-of-the-summer-court',resource:'balm-dice',variable:true,die:6},
 {key:'searing-vengeance',records:['warlock:celestial'],feature:'searing-vengeance',resource:'searing-vengeance',zeroTrigger:true,roll:p=>`2d8+${p.context.cha}`,trigger:'Instead of a death save at the start of your turn; regain half maximum HP; chosen creatures within30ft take radiant damage and are blinded until turn end'},
 {key:'defy-death',records:['warlock:undying'],feature:'defy-death',resource:'defy-death',zeroTrigger:true,roll:p=>`1d8+${p.context.con}`,trigger:'Successful death save OR stabilize another creature with Spare the Dying'},
 {key:'indestructible-life',records:['warlock:undying'],feature:'indestructible-life',resource:'indestructible-life',roll:p=>`1d8+${p.row.level}`,trigger:'Bonus action on your turn; reattach a severed body part placed back in position'},
 {key:'bastion-of-law',records:['sorcerer:clockwork-soul','sorcerer:clockwork-soul-ua'],feature:'bastion-of-law',resource:'2014:Sorcerer:points',variable:true},
 {key:'healing-hands',records:['monk:tranquility-ua'],feature:'healing-hands',resource:'healing-hands',points:true,trigger:'Action or replace one Flurry of Blows strike; touch a creature other than undead/construct. Spend points for healing, or5points per poison/disease cured.'},
];
export function healingFeatures(c){return defs.flatMap(d=>{try{const p=sourceFeature(c,d.records,d.feature),max=d.key==='healing-light'?Math.max(1,p.context.cha):d.key==='balm'?Math.floor(p.row.level/2):5;return [{...d,p,max,roll:d.roll?.(p),expression:d.variable?`1d${d.die}`:null}];}catch{return [];}});}
export function useHealingFeature(c,key,{n=1,result,recipient='self',triggered=false,maxHP,replaceTemp=false,targetType,removePoison=false}={}){
 const d=healingFeatures(c).find(d=>d.key===key);if(!d)throw Error('This healing feature is not available.');if(d.zeroTrigger&&c.hp.current===0)assertZeroHPTrigger(c,{passive:true});else assertAct(c);const p=d.p;
 if((d.trigger||d.variable)&&!triggered)throw Error('Confirm the source trigger, range and requirements first.');if(d.variable&&(!Number.isInteger(n)||n<1||n>d.max))throw Error(`Choose 1 through ${d.max} dice.`);
 if(d.points){if(['undead','construct'].includes(targetType))throw Error('Healing Hands cannot affect undead or constructs.');if(!Number.isInteger(n)||n<1||n>p.row.level*10||removePoison&&n%5)throw Error('Choose available healing points; curing poison/disease costs5each.');if(!['self','other'].includes(recipient))throw Error('Choose Self or Other.');const spend=spendFeature(c,p,d.resource,n);return {...spend,...(recipient==='self'?(removePoison?{conditions:(c.conditions||[]).filter(v=>String(v).toLowerCase()!=='poisoned')}:healHP(c,n,maxHP)):{}),subclassLastResult:{feature:'Healing Hands',instructions:removePoison?`Cure ${n/5} confirmed poison/disease effects; resolve diseases at the table.`:`Restore ${n} HP to the confirmed recipient.`}};}
 if(d.variable&&!['self','other'].includes(recipient))throw Error('Choose Self or Other.');const amount=d.variable&&d.die?validRoll(result,{min:n,max:n*d.die}):0,spend=spendFeature(c,p,d.resource,d.variable?n:1);
 if(d.roll)validRoll(result);
 if(key==='searing-vengeance'){if(c.hp.current!==0)throw Error('Searing Vengeance replaces a death save at 0 HP.');return {...spend,...healHP(c,Math.floor(maxHP/2),maxHP),subclassLastResult:{feature:d.feature,total:result.total,instructions:`Chosen creatures within30ft take ${result.total} radiant damage and are blinded until end of turn. You can stand if you choose.`}};}
 if(['defy-death','indestructible-life'].includes(key))return {...spend,...healHP(c,Math.max(1,result.total),maxHP)};
 if(key==='fighting-spirit')return {...spend,...tempHP(c,p.row.level>=15?15:p.row.level>=10?10:5),...putState(c,featureState(c,p,key,{remainingSeconds:6,expires:'end-turn'}))};
 if(key==='survivor'){if(!(c.hp.current>0&&c.hp.current<maxHP/2))throw Error('Survivor requires positive HP below half maximum.');return healHP(c,5+p.context.con,maxHP);}
 if(key==='dark-ones-blessing'||key==='touch-of-death')return tempHP(c,p.row.level+(key==='dark-ones-blessing'?p.context.cha:p.context.wis),key,{replace:replaceTemp});
 if(key==='bastion-of-law')return {...spend,...putState(c,featureState(c,p,key,{dice:n,recipient,endsOnLongRest:true}))};
 const hp=recipient==='self'?healHP(c,amount,maxHP):{};return {...spend,...hp,...(key==='balm'&&recipient==='self'?tempHP({...c,...hp},n):{})};
}
export function consumeBastion(c,{n,result,rawDamage,triggered=false,resistant=false,damageType=''}={}){
 const state=sourceSubclassEffects(c,{stateKey:'bastion-of-law'})[0];if(!state)throw Error('Create a Bastion of Law ward first.');if(!triggered)throw Error('Confirm the warded creature takes damage and spends its reaction.');if(state.recipient==='self')assertAct(c);
 if(!Number.isInteger(n)||n<1||n>state.dice)throw Error('Choose available ward dice.');const reduction=validRoll(result,{min:n,max:n*8});if(!Number.isInteger(rawDamage)||rawDamage<0)throw Error('Enter raw damage before the ward and resistance.');const remaining=Math.max(0,rawDamage-reduction),damage=state.recipient==='self'?typedOwnDamageAmount(c,remaining,{type:damageType,resistant}):(resistant?Math.floor(remaining/2):remaining),temp=Math.min(c.hp.temp||0,damage);
 const effects=(c.activeEffects||[]).flatMap(e=>e.id!==state.id?[e]:state.dice>n?[{...e,dice:state.dice-n}]:[]);
 return {reduction,remaining,patch:{activeEffects:effects,...(state.recipient==='self'?(damageActiveBody({...c,activeEffects:effects},damage,{adjustOverflow:ownFormOverflowAdjuster(c,damageType)})||{hp:{...c.hp,temp:Number(c.hp.temp||0)-temp,current:Math.max(0,c.hp.current-(damage-temp))}}):{})}};
}
