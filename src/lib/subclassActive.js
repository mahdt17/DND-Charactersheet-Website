import {resourceEvent} from './subclassQuantities.js';
import {rageProfile,rageId} from './rage2014.js';
import {sourceFeature,spendFeature,assertAct,featureState,putState,tempHP,validRoll} from './subclassActionUtils.js';
import {sourceSubclassEffects,finishSubclassEffects} from './subclassState.js';
import {availableSlots} from './play.js';
import {subclassTableProfiles,applySubclassTable,tableOutcome} from './subclassTables.js';
export {rageProfile};
export function startRage(c,{weapon,ongoing=false,surgeResult,surgeRolls=[],surgeChoices,damageDealt,itemId}={}){
 assertAct(c);const p=rageProfile(c);if(!p.level)throw Error('2014 Barbarian Rage is not available.');if(p.active)throw Error('Rage is already active.');if(p.heavy)throw Error('Remove heavy armor before using Rage benefits.');
 const spend=spendFeature(c,null,rageId),state={id:'barbarian:rage',name:'Rage',stateKey:'rage',baseClassId:rageId,remainingSeconds:60,endsOnUnconscious:true};
 let next={...c,...spend,concentration:null,activeEffects:[...(c.activeEffects||[]).filter(e=>!e.concentration&&e.stateKey!=='rage'&&e.stateKey!=='rage-beyond-death'),state],totemWarrior:{...c.totemWarrior,activeRage:/totem warrior/i.test(c.subclass||c.classLevels?.find(r=>r.name==='Barbarian')?.subclass||''),fanaticalFocusUsed:false}};
 try{const z=sourceFeature(c,['barbarian:zealot'],'rage-beyond-death');next.activeEffects.push(featureState(c,z,'rage-beyond-death',{remainingSeconds:60}));}catch{}
 try{const b=sourceFeature(c,['barbarian:beast','barbarian:beast-ua'],'form-of-the-beast');if(!['Bite','Claws','Tail'].includes(weapon))throw Error('Choose Bite, Claws, or Tail before starting Rage.');next.activeEffects.push(featureState(c,b,'beast-weapon',{choice:weapon,remainingSeconds:60}));}catch(e){if(e.message.startsWith('Choose'))throw e;}
 const surge=rageSurgeProfile(c);if(surge){tableOutcome(c,surge.key,surgeResult);if(surge.controlled){if(surgeChoices?.length!==2)throw Error('Roll two visible Wild Surge results before choosing.');surgeChoices.forEach(r=>tableOutcome(c,surge.key,r));if(surgeChoices[0].total!==surgeChoices[1].total&&!surgeChoices.some(r=>r.total===surgeResult.total))throw Error('Choose one of the two rolled surge results.');}next={...next,...applySubclassTable(next,surge.key,surgeResult,{triggered:true,rolls:surgeRolls,damageDealt,itemId})};}
 return {resources:next.resources,concentration:null,activeEffects:next.activeEffects,totemWarrior:next.totemWarrior,...(next.hp!==c.hp?{hp:next.hp}:{}),...(surge?{subclassLastResult:next.subclassLastResult}:{})};
}
export function rageSurgeProfile(c){const d=subclassTableProfiles(c).find(d=>d.key.startsWith('barbarian-'));return d?{...d,controlled:!d.p.record.playtest&&d.p.row.level>=14}:null;}
export function endRage(c){return {...finishSubclassEffects(c,(c.activeEffects||[]).filter(e=>!['rage','rage-beyond-death','beast-weapon','storm-aura','rage-wild-surge'].includes(e.stateKey))),totemWarrior:{...c.totemWarrior,activeRage:false}};}
export function rageTurn(c,{attacked=false,tookDamage=false}={}){const p=rageProfile(c);return p.active&&!p.persistent&&!attacked&&!tookDamage?endRage(c):{};}
export function startStrengthBeforeDeath(c,{triggered=false}={}){
 const p=sourceFeature(c,['fighter:samurai'],'strength-before-death');if(!triggered||c.hp.current!==0)throw Error('Confirm damage reduced you to 0 HP without killing you.');assertAct({...c,hp:{...c.hp,current:1}});if(sourceSubclassEffects(c,{stateKey:'strength-before-death'}).length)throw Error('Extra turn already active.');
 return {...spendFeature(c,p,'strength-before-death'),...putState(c,featureState(c,p,'strength-before-death',{remainingSeconds:6,expires:'end-extra-turn'}))};
}
const forms=[
 {key:'starry-form',records:['druid:stars','druid:stars-ua'],feature:'starry-form',cost:'2014:Druid:wild-shape',seconds:600,choices:['Archer','Chalice','Dragon']},
 {key:'symbiotic-entity',records:['druid:spores','druid:spores-ua'],feature:'symbiotic-entity',cost:'2014:Druid:wild-shape',seconds:600},
 {key:'form-of-dread',records:['warlock:undead','warlock:undead-ua'],feature:'form-of-dread',cost:'form-of-dread',seconds:60,roll:p=>`1d10+${p.row.level}`},
 {key:'giants-might',records:['fighter:rune-knight','fighter:rune-knight-ua'],feature:'giants-might',cost:'giants-might',seconds:60},
 {key:'scuttling-eyes',records:['ranger:swarmkeeper-ua'],feature:'scuttling-eyes',cost:'scuttling-eyes',seconds:3600},
 {key:'ghost-walk',records:['rogue:phantom','rogue:phantom-ua'],feature:'ghost-walk',cost:'ghost-walk',seconds:600},
 {key:'spirit-projection',records:['warlock:undead','warlock:undead-ua'],feature:'spirit-projection',cost:'spirit-projection',seconds:3600},
];
export function subclassForms(c){return forms.flatMap(d=>{try{let p;try{p=sourceFeature(c,d.records,d.feature);}catch(e){if(d.key!=='giants-might')throw e;p=sourceFeature(c,d.records,'Giant Might');}return [{...d,p,roll:d.roll?.(p),active:sourceSubclassEffects(c,{recordId:p.record.id,stateKey:d.key})[0]}];}catch{return [];}});}
export function activateSubclassForm(c,key,{choice,result,replaceTemp=false,useTrinket=false,slotLevel,slotPool='standard'}={}){
 assertAct(c);const d=subclassForms(c).find(d=>d.key===key);if(!d)throw Error('This form is not available.');if(d.active)throw Error('This form is already active.');if(d.choices&&!d.choices.includes(choice))throw Error('Choose a legal form.');
 let hp={};if(key==='symbiotic-entity'){const amount=4*d.p.row.level;if(c.hp.temp>amount&&!replaceTemp)throw Error('Choose to replace your temporary HP to activate Symbiotic Entity.');hp=tempHP(c,amount,'symbiotic-entity',{replace:true});}if(d.roll)hp=tempHP(c,validRoll(result,{min:1+d.p.row.level,max:10+d.p.row.level}),'form-of-dread');
 let spend=key==='ghost-walk'&&useTrinket?resourceEvent(c,'destroy-trinket'):slotLevel!=null&&key==='scuttling-eyes'?spendSubclassSlot(c,slotLevel,slotPool,3):spendFeature(c,d.p,d.cost);
 if(slotLevel!=null&&key!=='scuttling-eyes')throw Error('This form has no spell slot alternative.');
 const projection=key==='spirit-projection',concentration=projection?'Spirit Projection':c.concentration;
 if(projection&&rageProfile(c).active)throw Error('Rage prevents concentrating on Spirit Projection.');
 const state=featureState(c,d.p,key,{remainingSeconds:d.seconds,choice,endsOnIncapacitated:['starry-form','spirit-projection'].includes(key),...(projection?{concentration}:{}),...(key==='symbiotic-entity'?{requiresTempSource:'symbiotic-entity'}:{})});
 const next={...c,activeEffects:(c.activeEffects||[]).filter(e=>!(projection&&e.concentration)&&!(d.cost==='2014:Druid:wild-shape'&&(e.stateKey==='druid-companion'&&e.kind==='wildfire-ua'||key!=='symbiotic-entity'&&e.stateKey==='symbiotic-entity')))};
 return {...spend,...hp,...putState(next,state),...(projection?{concentration}:{})};
}
export function spendSubclassSlot(c,level,pool='standard',minimum=1){if(!Number.isInteger(level)||level<minimum||!['standard','pact'].includes(pool)||!availableSlots(c,{level:minimum}).some(s=>s.level===level&&(s.pool||'standard')===pool))throw Error(`Choose an available spell slot of level ${minimum} or higher.`);const key=pool==='pact'?'pactSlotsUsed':'slotsUsed';return {[key]:{...c[key],[level]:Number(c[key]?.[level]||0)+1}};}
export function endSubclassForm(c,key){const removed=sourceSubclassEffects(c,{stateKey:key});return {...finishSubclassEffects(c,(c.activeEffects||[]).filter(e=>e.stateKey!==key)),...(removed.some(e=>e.concentration===c.concentration)&&c.concentration?{concentration:null}:{})};}
export function switchStarryForm(c,choice,{startTurn=false}={}){assertAct(c);const d=subclassForms(c).find(d=>d.key==='starry-form');if(!d?.active||d.p.record.playtest||d.p.row.level<10)throw Error('Constellation switching is not available.');if(!startTurn)throw Error('Confirm the start of your turn.');if(!d.choices.includes(choice))throw Error('Choose a legal constellation.');return putState(c,{...d.active,choice});}
export function activeFormProfile(c){
 const states=sourceSubclassEffects(c),star=states.find(e=>e.stateKey==='starry-form'),spores=states.find(e=>e.stateKey==='symbiotic-entity'&&c.hp.temp>0&&c.hp.tempSource==='symbiotic-entity'),giant=states.find(e=>e.stateKey==='giants-might');
 const result={states,symbiotic:!!spores,star:star?.choice,flyingSpeed:0,resistances:[],damageImmunities:[],conditionImmunities:[],vulnerabilities:[],incomingAttackDisadvantage:states.some(e=>e.stateKey==='ghost-walk'),strengthAdvantage:!!giant,weaponAdvantage:states.some(e=>e.stateKey==='fighting-spirit'),frostBonus:states.some(e=>e.stateKey==='rune-frost'&&e.subclassRecordId==='2014:subclass:fighter:rune-knight')?2:0};
 const dread=states.find(e=>e.stateKey==='form-of-dread');if(dread)result.conditionImmunities.push('frightened');try{const p=sourceFeature(c,['warlock:undead','warlock:undead-ua'],'grave-touched');if(p.row.level>=10)(dread?result.damageImmunities:result.resistances).push('necrotic');}catch{}
 result.flyingSpeed=Math.max(0,...states.filter(e=>e.stateKey==='elixir-flight').map(e=>Number(e.flyingSpeed)||0));
 result.flyingSpeed=Math.max(0,...states.filter(e=>e.stateKey==='elixir-flight').map(e=>Number(e.flyingSpeed)||0));
 if(states.some(e=>e.stateKey==='wild-surge:87'&&!e.externalTarget))result.flyingSpeed=60;
 if(states.some(e=>e.stateKey==='wild-surge:95'))result.vulnerabilities.push('piercing');
 if(states.some(e=>e.stateKey==='wild-surge:41'))result.vulnerabilities.push('all');
 if(star){const p=sourceFeature(c,['druid:stars','druid:stars-ua'],'starry-form');if(!p.record.playtest&&p.row.level>=10&&star.choice==='Dragon')result.flyingSpeed=20;if(p.row.level>=(p.record.playtest?10:14))result.resistances.push('bludgeoning','piercing','slashing');}
 if(states.some(e=>e.stateKey==='spirit-projection')){result.resistances.push('bludgeoning','piercing','slashing');result.flyingSpeed=Math.max(result.flyingSpeed,Number(c.speed)||30);}
 if(states.some(e=>e.stateKey==='wild-surge:71'))result.resistances.push('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder');
 if(states.some(e=>e.stateKey==='shadow-form')){result.resistances.push('acid','bludgeoning','cold','fire','lightning','necrotic','piercing','poison','psychic','slashing','thunder');if(states.some(e=>e.stateKey==='shadow-form'&&e.subclassRecordId.endsWith(':shadow-ua')))result.resistances.push('radiant');}
 if(states.some(e=>e.stateKey==='rune-hill'))result.resistances.push('bludgeoning','piercing','slashing');if(states.some(e=>e.stateKey==='ghost-walk'))result.flyingSpeed=Math.max(result.flyingSpeed,10);
 return result;
}
