import {sourceSubclassEffects} from './subclassState.js';
export function subclassSpellModifiers(c,spell,plan){
 const states=sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic'}),maximum=states.some(e=>e.stateKey==='wild-surge-max-damage');
 return {...plan,rolls:maximum?plan.rolls.map(r=>/damage/i.test(r.label)?{...r,expression:String(r.expression).replace(/(\d+)d(\d+)/g,(_,n,d)=>String(Number(n)*Number(d))).split(/(?=[+-])/).reduce((sum,v)=>sum+Number(v),0).toString()}:r):plan.rolls,notes:[plan.notes,plan.save&&states.some(e=>e.stateKey==='wild-surge-save-disadvantage')?'Wild Magic: targets have disadvantage on saving throws against this spell.':''].filter(Boolean).join(' ')};
}
