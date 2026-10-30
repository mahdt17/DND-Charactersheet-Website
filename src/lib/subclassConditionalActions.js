import {sourceFeature,assertAct,spendFeature,featureState,putState,healHP,validRoll} from './subclassActionUtils.js';
import {sourceSubclassEffects} from './subclassState.js';
import {conditionEffects} from './play.js';
const source=(c,ids,f)=>{try{return sourceFeature(c,ids,f);}catch{return null;}};
export function conditionalActions(c){
 const list=[],add=(p,key,name,requires,extra={})=>{if(p)list.push({p,key,name,requires,rolls:[],conditional:true,...extra});};
 const beast=source(c,['barbarian:beast','barbarian:beast-ua'],'form-of-the-beast');
 add(beast,'beast-bite-heal','Beast Bite healing','After damaging a creature with your active Bite on your turn; once per turn. Published: below half maximum HP when you hit.');
 let giant=source(c,['fighter:rune-knight','fighter:rune-knight-ua'],'giants-might')||source(c,['fighter:rune-knight-ua'],'Giant Might');
 add(giant,'giant-damage','Giant Might damage','Active Giant Might; after an eligible hit. Published: weapon or unarmed hit, once on your turn. UA: each weapon attack hit.');
 const undead=source(c,['warlock:undead','warlock:undead-ua'],'spirit-projection');
 add(undead,'projection-heal','Spirit Projection healing','Projection and Form of Dread active; once on your turn after necrotic damage. Enter actual necrotic damage dealt; regain half.');
 const elements=source(c,['monk:four-elements'],'disciple-of-the-elements');
 if(elements){for(const [key,name,cost,requires] of [
  ['fist-unbroken-air','Fist of Unbroken Air',2,'Action; target within30ft; Strength save halves damage and prevents push/prone. Failed save: push up to20ft and knock prone. Each extra ki adds1d10; spell ki cap does not apply.'],
  ['water-whip','Water Whip',2,'Action; visible target within30ft; Dexterity save halves damage and prevents movement/prone. Failed save: prone or pull up to25ft. Each extra ki adds1d10; spell ki cap does not apply.'],
  ['fangs-fire-snake','Fangs of the Fire Snake',1,'Attack action on your turn; unarmed reach increases10ft and damage becomes fire through turn end.'],
  ['fangs-fire-hit','Fire Snake hit damage',1,'After hitting with an active Fire Snake unarmed strike; spend1additional ki for1d10 fire.'],
  ['shape-flowing-river','Shape the Flowing River',1,'Action; ice/water within120ft, area at most30ft per side. Source size restrictions apply; cannot trap or injure a creature.'],
  ['elemental-attunement','Elemental Attunement',0,'Action; harmless elemental effect within30ft. Choose the source effect at the table.'],
 ])if(key==='elemental-attunement'||elements.state.disciplines?.includes(key==='fangs-fire-hit'?'Fangs of the Fire Snake':name))add(elements,key,name,requires,{resource:cost?'2014:Monk:points':null,cost,variable:['fist-unbroken-air','water-whip'].includes(key)});}
 return list;
}
export function conditionalActionPlan(c,key,input={}){
 const d=conditionalActions(c).find(d=>d.key===key);if(!d)throw Error('This source action is not available; choose a known discipline.');let rolls=[];
 if(d.variable){const n=input.n??2;if(!Number.isInteger(n)||n<2||n>d.p.row.level)throw Error(`Choose 2 through ${d.p.row.level} ki.`);rolls=[`${n+1}d10`];d.cost=n;}
 if(key==='fangs-fire-hit')rolls=['1d10'];
 if(key==='giant-damage')rolls=[`1d${d.p.record.playtest?d.p.row.level>=10?8:6:d.p.row.level>=18?10:d.p.row.level>=10?8:6}`];
 return {...d,rolls};
}
export function executeConditionalAction(c,key,input={}){
 const d=conditionalActionPlan(c,key,input),{p}=d;assertAct(c);if(!input.triggered)throw Error('Confirm the source trigger and timing first.');const active=k=>sourceSubclassEffects(c,{recordId:p.record.id,stateKey:k})[0],used=`${p.record.id}:${key}`,once=key==='beast-bite-heal'||key==='projection-heal'||key==='giant-damage'&&!p.record.playtest;
 if(once&&c.subclassTurnUsed?.includes(used))throw Error('This feature was already used this turn.');
 if(key==='giant-damage'&&!active('giants-might'))throw Error('Giant Might must be active.');
 if(key==='beast-bite-heal'){if(active('beast-weapon')?.choice!=='Bite')throw Error('Beast Bite must be active.');if(!p.record.playtest&&c.hp.current>=conditionEffects(c).maxHP/2)throw Error('Published Bite requires HP below half maximum when you hit.');}
 if(key==='projection-heal'&&(!active('spirit-projection')||!active('form-of-dread')))throw Error('Spirit Projection and Form of Dread must be active.');
 if(key==='projection-heal'&&(!Number.isInteger(input.damageDealt)||input.damageDealt<0))throw Error('Enter actual necrotic damage dealt.');
 if(key==='fangs-fire-hit'&&!active('fangs-fire-snake'))throw Error('Fire Snake must be active.');
 const results=input.rolls||[];if(results.length!==d.rolls.length)throw Error('Resolve each visible feature roll first.');d.rolls.forEach((e,i)=>{const [,n,sides]=e.match(/^(\d+)d(\d+)$/);validRoll(results[i],{min:Number(n),max:Number(n)*Number(sides)});});
 let patch=spendFeature(c,p,d.resource,d.cost);
 if(key==='beast-bite-heal')patch={...patch,...healHP(c,p.record.playtest?Math.max(1,p.context.con):p.context.pb,conditionEffects(c).maxHP)};
 if(key==='projection-heal')patch={...patch,...healHP(c,Math.floor(input.damageDealt/2),conditionEffects(c).maxHP)};
 if(key==='fangs-fire-snake')patch={...patch,...putState(c,featureState(c,p,key,{expires:'end-turn',remainingSeconds:6}))};
 return {...patch,...(once?{subclassTurnUsed:[...(c.subclassTurnUsed||[]),used]}:{}),subclassLastResult:{feature:d.name,rolls:results.map(r=>r.total),instructions:`${d.requires}${d.variable?` Save DC ${8+p.context.pb+p.context.wis}; resolve the target’s save and movement at the table.`:''}`}};
}
