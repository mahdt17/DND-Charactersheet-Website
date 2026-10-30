import {expandedSubclassRows} from './expandedSubclasses.js';
import {sourceFeature,assertAct,spendFeature,tempHP,healHP,featureState,putState,validRoll} from './subclassActionUtils.js';
const immediate=s=>!!s?.heal_at_slot_level&&!['false life','aid','goodberry','healing spirit','aura of vitality','vampiric touch','enervation'].includes(String(s.name).toLowerCase());
const domain=(c,name)=>expandedSubclassRows(c).find(p=>p.record.id===`2014:subclass:cleric:${name}`);
export function healingFeaturePlan(c,spell,plan,{slotLevel=spell.level,recipient,targetAtZero=false}={}){
 if(!immediate(spell)||slotLevel<1)return plan;const life=domain(c,'life'),grave=domain(c,'grave'),bonus=life?2+slotLevel:0,maximize=life?.row.level>=17||!!grave&&(recipient==='self'?c.hp.current===0:recipient==='other'&&targetAtZero);
 return {...plan,rolls:plan.rolls.map(r=>{if(!/healing/i.test(r.label))return r;let expression=r.expression;if(maximize){const terms=expression.replace(/(\d+)d(\d+)/gi,(_,n,d)=>String(Number(n)*Number(d))).match(/[+-]?\d+/g);if(!terms||!/^[\d+\-]+$/.test(expression.replace(/(\d+)d(\d+)/gi,'1')))throw Error('Use a supported healing expression.');expression=String(terms.reduce((n,v)=>n+Number(v),0));}if(bonus)expression=/^\d+$/.test(expression)?String(Number(expression)+bonus):`${expression}+${bonus}`;return {...r,expression};}),notes:[plan.notes,bonus?`Disciple of Life adds ${bonus} healing.`:'',maximize?'Healing dice use their maximum result.':''].filter(Boolean).join(' ')};
}
export function blessedHealerPatch(c,spell,{recipient,slotLevel,maxHP}={}){const life=domain(c,'life');return immediate(spell)&&slotLevel>=1&&recipient==='other'&&life?.row.level>=6?healHP(c,2+slotLevel,maxHP):{};}
const defs=[
 {key:'fighting-spirit',records:['fighter:samurai'],feature:'fighting-spirit',resource:'fighting-spirit'},
 {key:'survivor',records:['fighter:champion'],feature:'survivor',trigger:'Start of your turn, conscious, below half your maximum HP'},
 {key:'dark-ones-blessing',records:['warlock:fiend'],feature:'dark-ones-blessing',trigger:'You reduced a hostile creature to 0 HP'},
 {key:'touch-of-death',records:['monk:long-death'],feature:'touch-of-death',trigger:'You reduced a creature within 5 feet to 0 HP'},
 {key:'healing-light',records:['warlock:celestial'],feature:'healing-light',resource:'healing-light',variable:true,die:6},
 {key:'balm',records:['druid:dreams'],feature:'balm-of-the-summer-court',resource:'balm-dice',variable:true,die:6},
 {key:'bastion-of-law',records:['sorcerer:clockwork-soul','sorcerer:clockwork-soul-ua'],feature:'bastion-of-law',resource:'2014:Sorcerer:points',variable:true,die:8},
];
export function healingFeatures(c){return defs.flatMap(d=>{try{const p=sourceFeature(c,d.records,d.feature),max=d.key==='healing-light'?Math.max(1,p.context.cha):d.key==='balm'?Math.floor(p.row.level/2):5;return [{...d,p,max,expression:d.variable?`1d${d.die}`:null}];}catch{return [];}});}
export function useHealingFeature(c,key,{n=1,result,recipient='self',triggered=false,maxHP,replaceTemp=false}={}){
 assertAct(c);const d=healingFeatures(c).find(d=>d.key===key);if(!d)throw Error('This healing feature is not available.');const p=d.p;
 if((d.trigger||d.variable)&&!triggered)throw Error('Confirm the source trigger, range and requirements first.');if(d.variable&&(!Number.isInteger(n)||n<1||n>d.max))throw Error(`Choose 1 through ${d.max} dice.`);
 if(d.variable&&!['self','other'].includes(recipient))throw Error('Choose Self or Other.');const amount=d.variable?validRoll(result,{min:n,max:n*d.die}):0,spend=spendFeature(c,p,d.resource,d.variable?n:1);
 if(key==='fighting-spirit')return {...spend,...tempHP(c,p.row.level>=15?15:p.row.level>=10?10:5),...putState(c,featureState(c,p,key,{remainingSeconds:6,expires:'end-turn'}))};
 if(key==='survivor'){if(!(c.hp.current>0&&c.hp.current<maxHP/2))throw Error('Survivor requires positive HP below half maximum.');return healHP(c,5+p.context.con,maxHP);}
 if(key==='dark-ones-blessing'||key==='touch-of-death')return tempHP(c,p.row.level+(key==='dark-ones-blessing'?p.context.cha:p.context.wis),key,{replace:replaceTemp});
 if(key==='bastion-of-law')return {...spend,...putState(c,featureState(c,p,key,{dice:n,recipient,endsOnLongRest:true}))};
 const hp=recipient==='self'?healHP(c,amount,maxHP):{};return {...spend,...hp,...(key==='balm'&&recipient==='self'?tempHP({...c,...hp},n):{})};
}
