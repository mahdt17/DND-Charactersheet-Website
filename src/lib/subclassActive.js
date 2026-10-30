import {resourceEvent} from './subclassQuantities.js';
import {rageProfile,rageId} from './rage2014.js';
import {sourceFeature,spendFeature,assertAct,featureState,putState,tempHP,validRoll} from './subclassActionUtils.js';
import {sourceSubclassEffects,finishSubclassEffects} from './subclassState.js';
export {rageProfile};
export function startRage(c,{weapon,ongoing=false}={}){
 assertAct(c);const p=rageProfile(c);if(!p.level)throw Error('2014 Barbarian Rage is not available.');if(p.active)throw Error('Rage is already active.');if(p.heavy)throw Error('Remove heavy armor before using Rage benefits.');
 const spend=spendFeature(c,null,rageId),state={id:'barbarian:rage',name:'Rage',stateKey:'rage',baseClassId:rageId,remainingSeconds:60,endsOnUnconscious:true};
 let next={...c,...spend,concentration:null,activeEffects:[...(c.activeEffects||[]).filter(e=>!e.concentration&&e.stateKey!=='rage'&&e.stateKey!=='rage-beyond-death'),state],totemWarrior:{...c.totemWarrior,activeRage:/totem warrior/i.test(c.subclass||c.classLevels?.find(r=>r.name==='Barbarian')?.subclass||''),fanaticalFocusUsed:false}};
 try{const z=sourceFeature(c,['barbarian:zealot'],'rage-beyond-death');next.activeEffects.push(featureState(c,z,'rage-beyond-death',{remainingSeconds:60}));}catch{}
 try{const b=sourceFeature(c,['barbarian:beast','barbarian:beast-ua'],'form-of-the-beast');if(!['Bite','Claws','Tail'].includes(weapon))throw Error('Choose Bite, Claws, or Tail before starting Rage.');next.activeEffects.push(featureState(c,b,'beast-weapon',{choice:weapon,remainingSeconds:60}));}catch(e){if(e.message.startsWith('Choose'))throw e;}
 return {resources:next.resources,concentration:null,activeEffects:next.activeEffects,totemWarrior:next.totemWarrior};
}
export function endRage(c){return {...finishSubclassEffects(c,(c.activeEffects||[]).filter(e=>!['rage','rage-beyond-death','beast-weapon','storm-aura'].includes(e.stateKey))),totemWarrior:{...c.totemWarrior,activeRage:false}};}
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
];
export function subclassForms(c){return forms.flatMap(d=>{try{let p;try{p=sourceFeature(c,d.records,d.feature);}catch(e){if(d.key!=='giants-might')throw e;p=sourceFeature(c,d.records,'Giant Might');}return [{...d,p,roll:d.roll?.(p),active:sourceSubclassEffects(c,{recordId:p.record.id,stateKey:d.key})[0]}];}catch{return [];}});}
export function activateSubclassForm(c,key,{choice,result,replaceTemp=false,useTrinket=false}={}){
 assertAct(c);const d=subclassForms(c).find(d=>d.key===key);if(!d)throw Error('This form is not available.');if(d.active)throw Error('This form is already active.');if(d.choices&&!d.choices.includes(choice))throw Error('Choose a legal form.');
 let hp={};if(key==='symbiotic-entity'){const amount=4*d.p.row.level;if(c.hp.temp>amount&&!replaceTemp)throw Error('Choose to replace your temporary HP to activate Symbiotic Entity.');hp=tempHP(c,amount,'symbiotic-entity',{replace:true});}if(d.roll)hp=tempHP(c,validRoll(result,{min:1+d.p.row.level,max:10+d.p.row.level}),'form-of-dread');
 return {...(key==='ghost-walk'&&useTrinket?resourceEvent(c,'destroy-trinket'):spendFeature(c,d.p,d.cost)),...hp,...putState(d.cost==='2014:Druid:wild-shape'&&key!=='symbiotic-entity'?{...c,activeEffects:(c.activeEffects||[]).filter(e=>e.stateKey!=='symbiotic-entity')}:c,featureState(c,d.p,key,{remainingSeconds:d.seconds,choice,endsOnIncapacitated:key==='starry-form',...(key==='symbiotic-entity'?{requiresTempSource:'symbiotic-entity'}:{})}))};
}
export function endSubclassForm(c,key){return finishSubclassEffects(c,(c.activeEffects||[]).filter(e=>e.stateKey!==key));}
export function activeFormProfile(c){
 const states=sourceSubclassEffects(c),star=states.find(e=>e.stateKey==='starry-form'),spores=states.find(e=>e.stateKey==='symbiotic-entity'&&c.hp.temp>0&&c.hp.tempSource==='symbiotic-entity'),giant=states.find(e=>e.stateKey==='giants-might');
 const result={states,symbiotic:!!spores,star:star?.choice,flyingSpeed:0,resistances:[],strengthAdvantage:!!giant,weaponAdvantage:states.some(e=>e.stateKey==='fighting-spirit'),frostBonus:states.some(e=>e.stateKey==='rune-frost'&&e.subclassRecordId==='2014:subclass:fighter:rune-knight')?2:0};
 if(star){const p=sourceFeature(c,['druid:stars','druid:stars-ua'],'starry-form');if(!p.record.playtest&&p.row.level>=10&&star.choice==='Dragon')result.flyingSpeed=20;if(!p.record.playtest&&p.row.level>=14)result.resistances.push('bludgeoning','piercing','slashing');}
 if(states.some(e=>e.stateKey==='wild-surge:71'))result.resistances.push('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder');
 if(states.some(e=>e.stateKey==='shadow-form')){result.resistances.push('acid','bludgeoning','cold','fire','lightning','necrotic','piercing','poison','psychic','slashing','thunder');if(states.some(e=>e.stateKey==='shadow-form'&&e.subclassRecordId.endsWith(':shadow-ua')))result.resistances.push('radiant');}
 if(states.some(e=>e.stateKey==='rune-hill'))result.resistances.push('bludgeoning','piercing','slashing');if(states.some(e=>e.stateKey==='ghost-walk'))result.flyingSpeed=Math.max(result.flyingSpeed,10);
 return result;
}
