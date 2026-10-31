import {damageActiveBody} from './subclassState.js';
import tables from '../data/subclassTables2014.json' with {type:'json'};
import {sourceFeature,assertAct,spendFeature,featureState,putState,tempHP,healHP,validRoll} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';
import {subclassRollTraits} from './subclassNumerics.js';
import {abilityName} from './subclassRolls.js';
import {characterResources} from './resources.js';
const definitions={
 'sorcerer-wild-magic':{records:['sorcerer:wild-magic'],feature:'wild-magic-surge',die:100},
 'barbarian-wild-magic':{records:['barbarian:wild-magic'],feature:'wild-surge',die:8},
 'barbarian-wild-soul-ua':{records:['barbarian:wild-soul-ua'],feature:'wild-surge',die:8},
 'spirit-tales':{records:['bard:spirits','bard:spirits-ua'],feature:'tales-from-beyond'},
};
export function subclassTableProfiles(c){return Object.entries(definitions).flatMap(([key,d])=>{try{const p=sourceFeature(c,d.records,d.feature);return [{...d,key,p,die:d.die|| (p.row.level>=15?12:p.row.level>=10?10:p.row.level>=5?8:6)}];}catch{return [];}});}
export function tableOutcome(c,key,result){const d=subclassTableProfiles(c).find(d=>d.key===key);if(!d)throw Error('This source table is not available.');const number=validRoll(result,{min:1,max:d.die});if(!Number.isInteger(number))throw Error('Use a whole table die result.');const outcome=tables[key].outcomes.find(o=>number>=o.min&&number<=o.max);if(!outcome)throw Error('No source outcome matches this roll.');return {...d,outcome,number};}
export function tableExtraRolls(c,key,result){const d=tableOutcome(c,key,result),n=d.outcome.min;
 const raw=expression=>({expression,kind:'raw'}),damage=expression=>({expression,kind:'damage'}),save=ability=>{const bonus=d.p.context[ability]+(c.saveProf?.[ability]?d.p.context.pb:0)+subclassRollTraits(c,{kind:'save',name:abilityName(ability)}).bonus;return {expression:`1d20${bonus>=0?'+':''}${bonus}`,kind:'save',ability};};
 if(key==='barbarian-wild-magic')return (n===1?['1d12','1d12']:[3,5,8].includes(n)?['1d6']:[]).map(raw);
 if(key==='barbarian-wild-soul-ua')return (n===1?['1d10']:n===3?['1d4','2d8']:n===8?['2d8']:[]).map(raw);
 if(key==='spirit-tales')return [];
 return ({7:[damage('8d6'),save('dex')],9:[damage('7d4+7')],11:[raw('1d10')],35:[raw('1d10')],37:[raw('1d6')],39:[damage('2d10')],53:[raw('5d6')],65:[damage('4d10')],73:[raw('1d4')],77:[save('wis')],83:[damage('1d10')]})[n]||[];
}
export function applySubclassTable(c,key,result,{triggered=false,rolls=[],maxHP=c.hp.max,damageDealt,recipient,itemId}={}){
 assertAct(c);if(!triggered)throw Error('Confirm the source table trigger first.');const d=tableOutcome(c,key,result),{p,outcome}=d,n=outcome.min,expressions=tableExtraRolls(c,key,result);if(rolls.length!==expressions.length)throw Error('Resolve the visible outcome rolls first.');rolls.forEach((r,i)=>validRoll(r,{min:['save','attack'].includes(expressions[i].kind)?-Infinity:0}));let patch={},state=null;
 if(key==='spirit-tales'){patch=spendFeature(c,p,'2014:Bard:inspiration');state=featureState(c,p,'held-spirit-tale',{tableResult:n,tableInstructions:outcome.description,endsOnRest:true});}
 else if(key.startsWith('barbarian-')){const ua=key.endsWith('-ua');if(n===(ua?7:4)&&!(c.inventory||[]).some(i=>i.id===itemId&&i.equipped&&i.equipmentIndex))throw Error('Choose the actual held weapon for this surge.');state=featureState(c,p,'rage-wild-surge',{remainingSeconds:60,canEnd:false,tableResult:n,tableInstructions:outcome.description,...(n===(ua?7:4)?{itemId,weaponDamageType:ua?'psychic':'force'}:{}),...(n===(ua?4:6)?{acBonus:ua?2:1}:{})});if(n===1){if(ua){if(!Number.isFinite(damageDealt)||damageDealt<0)throw Error('Confirm total necrotic damage actually dealt before granting UA temporary HP.');patch=tempHP(c,damageDealt,'wild-surge');}else patch=tempHP(c,rolls[1].total,'wild-surge');}}
 else {
  const extra={remainingSeconds:60,tableResult:n,tableInstructions:outcome.description,canEnd:false};
  if(n===51)extra.acBonus=2;
  if([45,87].includes(n))extra.remainingSeconds=600;
  if(n===63)extra.remainingSeconds=3600;
  if(n===85)extra.mirrorImages=3;
  if(n===87&&!['self','other'].includes(recipient))throw Error('Confirm whether the randomly chosen target is Self or Other recipient.');
  if(n===87&&recipient==='other')extra.externalTarget=true;
  if(n===77){extra.remainingSeconds=3600;const failed=rolls[0].total<8+p.context.pb+p.context.cha;extra.saveSucceeded=!failed;if(failed)extra.profileRef={catalogId:'2014:creatures',creatureId:'sheep',kind:'shape-result'};}
  if(n===41)extra.profileRef={catalogId:'2014:objects',creatureId:'potted-plant',kind:'shape-result'};
  if(n===15)extra.healAtTurnStart=5;
  if(n===41){extra.expires='start-next-turn';extra.blocksActions=true;extra.endsAtZero=true;}
  if(n===49)extra.preventsVerbal=true;
  if(n===53)extra.remainingSeconds=rolls[0].total*86400;
  if(n===31)extra.expires='end-next-turn';
  if(n===89||n===69)extra.breaksOnAttackOrCast=true;
  if([17,23,55].includes(n))delete extra.remainingSeconds;
  state=featureState(c,p,n===33?'wild-surge-max-damage':n===21?'wild-surge-save-disadvantage':`wild-surge:${n}`,extra);
  if(n===39)patch=healHP(c,rolls[0].total,maxHP);
  if(n===7){const saved=rolls[1].total>=8+p.context.pb+p.context.cha,amount=saved?Math.floor(rolls[0].total/2):rolls[0].total,temp=Math.min(c.hp.temp||0,amount);patch=damageActiveBody(c,amount)||{hp:{...c.hp,temp:Number(c.hp.temp||0)-temp,current:Math.max(0,c.hp.current-(amount-temp))}};}
  if(n===59){const pools=['slotsUsed','pactSlotsUsed'],choices=pools.flatMap(pool=>Object.entries(c[pool]||{}).filter(([level,used])=>Number(level)>0&&used>0).map(([level])=>({pool,level:Number(level)}))).sort((a,b)=>a.level-b.level);if(choices.length){const {pool,level}=choices[0];patch={[pool]:{...c[pool],[level]:c[pool][level]-1}};}}
  if(n===99){const resources=characterResources(c);patch={resources:resources.map(r=>r.id==='2014:Sorcerer:points'||r.classResourceKey==='2014:Sorcerer:points'?{...r,used:0}:r)};}
  if(n===83){if(!Number.isFinite(damageDealt)||damageDealt<0)throw Error('Confirm actual total necrotic damage dealt before healing.');patch=healHP(c,damageDealt,maxHP);}
 }
 return {...patch,...(state?putState({...c,...patch},state):{}),subclassLastResult:{feature:p.feature.name,rolls:[d.number,...rolls.map(r=>r.total)],instructions:outcome.description}};
}
export function spiritTalePlan(c){const p=sourceFeature(c,['bard:spirits','bard:spirits-ua'],'tales-from-beyond'),held=sourceSubclassEffects(c,{recordId:p.record.id,stateKey:'held-spirit-tale'})[0];if(!held)throw Error('Roll a tale before bestowing it.');const die=p.row.level>=15?12:p.row.level>=10?10:p.row.level>=5?8:6,n=held.tableResult,bonus=n===6?p.row.level:p.context.cha,rolls=({2:[`1d20+${p.context.pb+p.context.cha}`,`2d${die}+${p.context.cha}`],3:[`1d${die}+${bonus}`],5:[`1d${die}`],6:[`1d${die}+${bonus}`],7:[`2d${die}`],8:[`1d${die}`],9:[`3d${die}`],10:[`4d${die}`],11:[`2d${die}+${bonus}`],12:[`3d${die}`]})[n]||[];return {p,held,n,rolls:rolls.map((expression,i)=>({expression,kind:n===2&&i===0?'attack':n===5||n===8?'raw':'damage',...(n===2&&i===0?{ability:'cha'}:{})}))};}
export function bestowSpiritTale(c,{triggered=false,recipient,rolls=[],maxHP=c.hp.max,condition}={}){
 assertAct(c);const d=spiritTalePlan(c);if(!triggered||!['self','other'].includes(recipient))throw Error('Confirm a visible target within30ft and choose Self or Other.');if(rolls.length!==d.rolls.length)throw Error('Resolve every visible tale roll first.');rolls.forEach((r,i)=>validRoll(r,{min:['save','attack'].includes(d.rolls[i].kind)?-Infinity:0}));let next={...c,activeEffects:(c.activeEffects||[]).filter(e=>e.id!==d.held.id)},patch={};
 if(recipient==='self'){
  if([3,6].includes(d.n))patch=tempHP(c,rolls[0].total,d.n===6?'spirit-traveler':null);
  if(d.n===6&&patch.hp.tempSource==='spirit-traveler'){const state=featureState(c,d.p,'spirit-traveler',{requiresTempSource:'spirit-traveler',acBonus:1,speedBonus:10,endsOnRest:true});next={...next,...putState(next,state)};}
  if(d.n===11){patch=healHP(c,rolls[0].total,maxHP);const removable=['blinded','deafened','paralyzed','petrified','poisoned'];if(condition&&!removable.includes(condition.toLowerCase()))throw Error('Choose a condition allowed by Tale of the Angel.');if(condition)patch.conditions=(c.conditions||[]).filter(n=>String(n).toLowerCase()!==condition.toLowerCase());}
  if([1,5,8].includes(d.n))next={...next,...putState(next,featureState(c,d.p,`spirit-tale:${d.n}`,{remainingSeconds:d.n===1?600:d.n===5?60:6,...(d.n===8?{breaksOnAttackOrCast:true,expires:'end-next-turn'}:{})}))};
 }
 return {...patch,activeEffects:next.activeEffects,subclassLastResult:{feature:`Spirit Tale ${d.n}`,rolls:rolls.map(r=>r.total),instructions:d.held.tableInstructions}};
}
export const elixirNames=['Healing','Swiftness','Resilience','Boldness','Flight','Transformation'];
export function createElixir(c,{result,confirmed=false,slotLevel,slotPool='standard',effect,availableSlots=[]}={}){
 assertAct(c);const p=sourceFeature(c,['artificer:alchemist'],'experimental-elixir');if(!confirmed)throw Error('Confirm a flask, alchemist’s supplies, and source creation timing.');let patch={},number;
 if(slotLevel!=null){if(!Number.isInteger(slotLevel)||slotLevel<1||!['slotsUsed','pactSlotsUsed'].includes(slotPool==='pact'?'pactSlotsUsed':slotPool==='standard'?'slotsUsed':slotPool))throw Error('Choose a valid spell slot.');const resources=availableSlots;if(!resources.some(s=>s.level===slotLevel&&(s.pool||'standard')===slotPool&&s.remaining>0))throw Error('Choose an available slot.');const key=slotPool==='pact'?'pactSlotsUsed':'slotsUsed';patch={[key]:{...c[key],[slotLevel]:Number(c[key]?.[slotLevel]||0)+1}};number=elixirNames.indexOf(effect)+1;if(number<1)throw Error('Choose an elixir effect.');}
 else {number=validRoll(result,{min:1,max:6});if(!Number.isInteger(number))throw Error('Roll a visible d6.');patch=spendFeature(c,p,'elixir');}
 return {...patch,subclassElixirs:[...(c.subclassElixirs||[]),{id:crypto.randomUUID(),sourceClassId:p.row.catalogId,subclassRecordId:p.record.id,effect:number}]};
}
export function elixirDrinkPlan(c,id){const p=sourceFeature(c,['artificer:alchemist'],'experimental-elixir'),elixir=c.subclassElixirs?.find(e=>e.id===id&&e.sourceClassId===p.row.catalogId&&e.subclassRecordId===p.record.id);if(!elixir)throw Error('Create an elixir before drinking it.');return {p,elixir,rolls:[...(elixir.effect===1?[`2d4+${p.context.int}`]:[]),...(p.row.level>=9?[`2d6+${p.context.int}`]:[])]};}
export function drinkElixir(c,id,{confirmed=false,recipient,rolls=[],maxHP=c.hp.max}={}){
 assertAct(c);const {p,elixir,rolls:expressions}=elixirDrinkPlan(c,id);if(!confirmed||!['self','other'].includes(recipient))throw Error('Confirm an action to drink/administer and choose Self or Other.');if(rolls.length!==expressions.length)throw Error('Resolve each visible elixir roll first.');rolls.forEach(r=>validRoll(r));let patch={subclassElixirs:c.subclassElixirs.filter(e=>e.id!==id)};
 if(recipient==='self'){if(elixir.effect===1)patch={...patch,...healHP(c,rolls[0].total,maxHP)};const state=featureState(c,p,`elixir-${elixirNames[elixir.effect-1].toLowerCase()}`,{remainingSeconds:elixir.effect===2||elixir.effect===6?3600:elixir.effect===4?60:600,...(elixir.effect===2?{speedBonus:10}:{}),...(elixir.effect===3?{acBonus:1}:{}),...(elixir.effect===5?{flyingSpeed:10}:{})});if(elixir.effect!==1)patch={...patch,...putState(c,state)};if(p.row.level>=9)patch={...patch,...tempHP({...c,...patch},rolls.at(-1).total)};}
 return {...patch,subclassLastResult:{feature:`${elixirNames[elixir.effect-1]} elixir`,rolls:rolls.map(r=>r.total),instructions:recipient==='other'?'Apply the elixir effect and any Restorative Reagents temporary HP to the other creature.':'Elixir effect applied; Boldness adds a visible1d4 to attacks/saves; Transformation uses your chosen Alter Self option.'}};
}
