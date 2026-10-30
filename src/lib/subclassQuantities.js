import {expandedSubclassRows,expandedSubclassContext} from './expandedSubclasses.js';
import {sourceFeature,assertAct,validRoll} from './subclassActionUtils.js';
const specs={
 'arcane-ward-hp':{records:['wizard:abjuration'],feature:'arcane-ward',max:p=>Math.max(0,2*p.row.level+p.context.int),initial:0},
 'soul-trinkets':{records:['rogue:phantom','rogue:phantom-ua'],feature:'tokens-of-the-departed',max:p=>p.context.pb,initial:0},
 'power-surges':{records:['wizard:war-magic'],feature:'power-surge',max:p=>Math.max(1,p.context.int),initial:1},
};
export function quantityProfile(c,key){const d=specs[key];if(!d)return null;try{const p=sourceFeature(c,d.records,d.feature),max=d.max(p),saved=c.subclassQuantities?.[p.row.catalogId]?.[p.record.id]?.[key];return {...p,key,max,current:Math.min(max,Math.max(0,Number(saved?.current??d.initial))),saved:saved||{}};}catch{return null;}}
export function quantityPatch(c,p,value,extra={}){return {subclassQuantities:{...c.subclassQuantities,[p.row.catalogId]:{...c.subclassQuantities?.[p.row.catalogId],[p.record.id]:{...c.subclassQuantities?.[p.row.catalogId]?.[p.record.id],[p.key]:{...p.saved,current:Math.max(0,Math.min(p.max,value)),...extra}}}}};}
export function wardCastPatch(c,spell,slotLevel){
 const p=quantityProfile(c,'arcane-ward-hp');if(!p||slotLevel<1||String(spell.school?.name||spell.school).toLowerCase()!=='abjuration')return {};
 return quantityPatch(c,p,p.saved.created?p.current+2*slotLevel:p.max,{created:true});
}
export function absorbWard(c,{amount,rawDamage,project=false,resistant=false,vulnerable=false,immune=false}={}){
 if(project)assertAct(c);
 const p=quantityProfile(c,'arcane-ward-hp');if(!p||!p.saved.created)throw Error('Create the ward with a level 1+ abjuration spell first.');if(project&&p.row.level<6)throw Error('Projected Ward requires Wizard 6.');
 if(!Number.isInteger(amount)||amount<0||!project&&(!Number.isInteger(rawDamage)||rawDamage<0))throw Error('Enter nonnegative whole raw damage and absorption amounts.');
 const absorbed=Math.min(amount,p.current,project?Infinity:rawDamage),remaining=project?0:rawDamage-absorbed,adjusted=immune?0:Math.floor(remaining*(resistant?.5:1))*(vulnerable?2:1),temp=Math.min(Number(c.hp.temp)||0,adjusted),loss=adjusted-temp;
 return {absorbed,remaining,concentrationDC:adjusted>0?Math.max(10,Math.floor(adjusted/2)):null,patch:{...quantityPatch(c,p,p.current-absorbed),...(!project?{hp:{...c.hp,temp:Number(c.hp.temp||0)-temp,current:Math.max(0,c.hp.current-loss)}}:{})}};
}
export function resourceEvent(c,event,input={}){
 assertAct(c);
 if(['collect-trinket','destroy-trinket'].includes(event)){const p=quantityProfile(c,'soul-trinkets');if(!p)throw Error('Soul trinkets are not available.');if(event==='collect-trinket'){if(!input.visibleDeath||!input.within30||!input.freeHand)throw Error('Confirm visible death within 30 feet and a free hand.');if(p.current>=p.max)throw Error('Soul trinket capacity reached.');return quantityPatch(c,p,p.current+1);}if(!p.current)throw Error('No soul trinkets remain.');return quantityPatch(c,p,p.current-1);}
 if(['gain-surge','spend-surge'].includes(event)){const p=quantityProfile(c,'power-surges');if(!p)throw Error('Power Surge is not available.');if(event==='gain-surge'){if(!input.successfulCounterspell&&!input.successfulDispel)throw Error('Confirm a successful Counterspell or Dispel Magic.');return quantityPatch(c,p,p.current+1);}if(!input.ownTurn||!input.wizardSpellDamage)throw Error('Confirm damage from your Wizard spell on your turn.');if(!p.current||p.saved.turnUsed)throw Error('No surge remains or already used this turn.');return quantityPatch(c,p,p.current-1,{turnUsed:true});}
 throw Error('Unknown resource event.');
}
export function portentProfile(c){try{const p=sourceFeature(c,['wizard:divination'],'portent');return {...p,count:p.row.level>=14?3:2,values:c.subclassPortent?.[p.row.catalogId]?.[p.record.id]?.values||[],rolled:!!c.subclassPortent?.[p.row.catalogId]?.[p.record.id]?.rolled};}catch{return null;}}
function portentPatch(c,p,values,rolled){return {subclassPortent:{...c.subclassPortent,[p.row.catalogId]:{...c.subclassPortent?.[p.row.catalogId],[p.record.id]:{values,rolled}}}};}
export function rollPortent(c,results){const p=portentProfile(c);if(!p)throw Error('Portent is not available.');if(p.rolled)throw Error('Portent was already rolled this long-rest cycle.');if(results.length!==p.count)throw Error(`Roll ${p.count} visible d20 results first.`);const values=results.map(r=>validRoll(r,{min:1,max:20}));if(values.some(v=>!Number.isInteger(v)))throw Error('Portent needs whole d20 results.');return portentPatch(c,p,values,true);}
export function usePortent(c,index,{triggered=false}={}){assertAct(c);const p=portentProfile(c);if(!triggered)throw Error('Confirm a visible attack, save or ability check before its roll.');if(!p||!Number.isInteger(index)||p.values[index]==null||p.values[index]<1)throw Error('This Portent is unavailable or spent.');const values=[...p.values];values[index]=null;return portentPatch(c,p,values,true);}
export function quantityRest(c,kind){
 let next=c;
 for(const key of Object.keys(specs)){const p=quantityProfile(next,key);if(!p)continue;let amount=p.current,extra={};if(key==='arcane-ward-hp'&&kind==='long'){amount=0;extra.created=false;}if(key==='power-surges'){if(kind==='long')amount=1;else if(!amount)amount=1;extra.turnUsed=false;}if(key==='soul-trinkets'&&kind==='long'&&p.record.id==='2014:subclass:rogue:phantom'&&p.row.level>=17&&!amount)amount=1;next={...next,...quantityPatch(next,p,amount,extra)};}
 const portent=portentProfile(c);if(portent&&kind==='long')next={...next,...portentPatch(next,portent,[],false)};
 const cooldowns=Object.fromEntries(Object.entries(c.subclassCooldowns||{}).map(([key,n])=>[key,kind==='long'?Math.max(0,n-1):n]));
 return {...(next.subclassQuantities?{subclassQuantities:next.subclassQuantities}:{}),...(next.subclassPortent?{subclassPortent:next.subclassPortent}:{}),...(c.subclassCooldowns?{subclassCooldowns:cooldowns}:{})};
}
export function quantityTurn(c){let next=c;const p=quantityProfile(c,'power-surges');if(p)next={...next,...quantityPatch(next,p,p.current,{turnUsed:false})};return next.subclassQuantities?{subclassQuantities:next.subclassQuantities}:{};}
export function startLongRestSubclassPatch(c){return {subclassRestStarted:true};}
