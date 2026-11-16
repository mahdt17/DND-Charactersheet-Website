import {mindNetworkBonus} from './subclassArtificialMind.js';
import {subclassRoll} from './subclassFormulas.js';
import {sourceSubclassEffects} from './subclassState.js';
import {enhancedBondPlan} from './subclassEnhancedBond.js';
export function subclassSpellModifiers(c,spell,plan){
 plan=enhancedBondPlan(c,spell,plan);
 const states=sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic'}),maximum=states.some(e=>e.stateKey==='wild-surge-max-damage'),bonus=mindNetworkBonus(c,spell);
 const rolls=maximum?plan.rolls.map(r=>/damage/i.test(r.label)?{...r,expression:String(r.expression).replace(/(\d+)d(\d+)/g,(_,n,d)=>String(Number(n)*Number(d))).split(/(?=[+-])/).reduce((sum,v)=>sum+Number(v),0).toString()}:r):plan.rolls;return {...plan,rolls:bonus?rolls.map(r=>/psychic/i.test(r.label)&&/damage/i.test(r.label)?{...r,expression:/^\d+$/.test(r.expression)?String(Number(r.expression)+bonus):subclassRoll(`${r.expression}+${bonus}`)}:r):rolls,notes:[plan.notes,plan.save&&states.some(e=>e.stateKey==='wild-surge-save-disadvantage')?'Wild Magic: targets have disadvantage on saving throws against this spell.':''].filter(Boolean).join(' ')};
}
