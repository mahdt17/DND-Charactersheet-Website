import {campaignProfile,campaignFeats,campaignCystSpells,castCampaignSpell} from './archivistCampaign.js';
import {necroticRules} from '../data/campaignExpansion.js';
import {updateCreature,whole,creatureProfile,castCreatureSpell,creatureTemplate,damageCreature as damage} from './campaignCreatures.js';
import {campaignModifiers} from './campaignModifiers.js';
import {tickCampaign} from './campaignTime.js';
export const spellRule=(c,id)=>({...necroticRules[id.replace('darkdonte:','')],...c.archivistCampaign?.rulings?.spellRules?.[id.replace('darkdonte:','')]});
const activeControl=n=>n.control&&(n.control.minutes===null||n.control.minutes>0);
export function resolveCampaignSpell(c,targetId,{save,damage:rolledDamage,secondary=false,area=false,cystSave,blocked=false,intRoll,chaRoll,language='Common',order='Reasonable suggestion'}={}){
 const p=campaignProfile(c),state=c.archivistCampaign||{},cast={...state.lastCast},rule=cast?.rule||spellRule(c,cast?.spellId||'');
 if(!cast?.id||!rule.effect)throw Error('Cast a campaign effect first.');
 if(cast.resolved?.includes(targetId))throw Error('This cast already affected that target.');
 if(secondary&&(!cast.chain||!cast.resolved?.length||cast.resolved.length>cast.secondaryTargets))throw Error('No secondary Chain targets remaining.');
 if(area&&(!cast.erupted||rule.effect!=='eruption'))throw Error('No primary eruption to resolve.');
 if(!secondary&&!area&&cast.resolved?.length)throw Error('Primary target already resolved.');
 if(secondary&&area)throw Error('Choose Chain or eruption splash.');
 let next=c,result='Applied',dc=cast.dc-(secondary&&!rule.damageCap?4:0),effectiveSave=save;
 const n=targetId==='self'?null:state.creatures?.find(n=>n.id===targetId);
 if(!['sense','empower'].includes(rule.effect)&&!n)throw Error('Choose a recorded creature.');
 if(n&&(n.dead||n.soulDestroyed))throw Error('Choose a living target.');
 if(n?.cyst&&cast.spellId.startsWith('darkdonte:necrotic-')&&rule.save&&!area&&!(secondary&&rule.damageCap))effectiveSave=Number(save)-2;
 if(rule.requiresCyst&&!area&&!n?.cyst)throw Error('Target must bear a necrotic cyst.');
 if((rule.save||area||secondary&&rule.damageCap)&&!Number.isFinite(save))throw Error('Enter the target save total.');
 const passed=!!(rule.save||area||secondary&&rule.damageCap)&&effectiveSave>=dc;
 let amount=0;
 if(rule.damageCap){whole(rolledDamage,'Damage',0,Math.min(cast.casterLevel??p.archivist,rule.damageCap)*6);amount=rolledDamage;if(secondary||area&&passed)amount=Math.floor(amount/2);if(secondary&&passed)amount=Math.floor(amount/2);}
 if(blocked){result='Blocked: no effect';
 }else if(rule.effect==='empower'){
  if(targetId!=='self')throw Error('Empowerment affects the caster.');
  const temp=Number(rule.tempHP??100);whole(temp,'Temporary HP');
  next={...c,hp:{...c.hp,temp:Math.max(c.hp.temp||0,temp),...((c.hp.temp||0)<temp?{tempSource:'campaign-empowerment'}:{})},archivistCampaign:{...state,empowerment:{rounds:cast.casterLevel??p.archivist,abilityBonus:Number(rule.abilityBonus??8),acBonus:Number(rule.acBonus??8),conSaveBonus:Number(rule.conSaveBonus??5)}}};
 }else if(rule.effect==='sense'){
  next={...c,archivistCampaign:{...state,sensing:{minutes:rule.minutes,stage:1}}};result='Cyst detection active; advance rounds to reveal count and location.';
 }else if(rule.effect==='awaken'){
  if(!String(p.rulings.awakenTypes||'beast,monstrosity').split(',').map(t=>t.trim().toLowerCase()).includes(n.type.toLowerCase())||n.abilities.int>3||n.awakened)throw Error('Awakening requires an eligible living type with INT 3 or lower, not already awakened.');
  whole(intRoll,'3d6 Intelligence',3,18);whole(chaRoll,'1d3 Charisma',1,3);
  const gain=2*Math.max(1,Math.floor(n.hitDie/2)+1+Math.floor((creatureProfile(n).abilities.con-10)/2));
  next=updateCreature(c,targetId,n=>({...n,awakened:true,abilities:{...n.abilities,int:intRoll,cha:Math.min(30,n.abilities.cha+chaRoll)},hitDice:n.hitDice+2,hp:{...n.hp,max:n.hp.max+gain,current:n.hp.current+gain},languages:[...new Set([...(n.languages||[]),language])]}));result='Awakened; no control granted';
 }else if(rule.effect==='scry'){
  next=updateCreature(c,targetId,n=>({...n,sensor:{minutes:rule.minutes,castId:cast.id}}));
 }else if(rule.effect==='cyst'){
  if(['undead','construct'].includes(n.type.toLowerCase()))throw Error('Cyst requires a living creature.');
  if(!passed)next=updateCreature(c,targetId,n=>({...n,cyst:{caster:c.id,castId:cast.id}}));result=passed?'Save succeeded':'Cyst implanted';
 }else if(rule.effect==='control'){
  const tumor=cast.spellId==='darkdonte:necrotic-tumor';
  if(!passed||tumor)next=updateCreature(c,targetId,n=>({...n,control:{spellId:cast.spellId,caster:c.id,dc,minutes:passed?Number(rule.suggestionMinutes??1440):rule.minutes??null,suggestion:passed?order:null,refusedOrders:[]}}));result=passed?(tumor?'Suggestion only':'Save succeeded'):'Control established';
 }else if(rule.damageCap){
  const lethal=['burst','eruption','termination'].includes(rule.effect)&&!passed&&!secondary&&!area;
  next=updateCreature(c,targetId,n=>lethal?{...n,dead:true,soulDestroyed:rule.effect==='termination',hp:{...n.hp,current:0,temp:0}}:damage(n,amount));
  if(lethal){const cyst=creatureTemplate({name:`Free cyst from ${n.name}`,role:'scout',level:3,type:'undead',emergesInRounds:1,notes:'Free-willed enemy; editable 5e combat conversion.'});next={...next,archivistCampaign:{...next.archivistCampaign,creatures:[...next.archivistCampaign.creatures,cyst]}};}
  if(area&&amount>0){if(!Number.isFinite(cystSave))throw Error('Enter the secondary CON save against implantation.');if(cystSave<cast.dc&&!['undead','construct'].includes(n.type))next=updateCreature(next,targetId,n=>({...n,cyst:{caster:c.id,castId:cast.id}}));}
  result=lethal?'Target killed':`${amount} necrotic damage`;
  if(lethal&&rule.effect==='eruption')cast.erupted=true;
 }
 return {...next,archivistCampaign:{...next.archivistCampaign,lastCast:{...cast,resolved:[...(cast.resolved||[]),targetId],lastResult:result}}};
}
export function refuseCampaignOrder(c,id,order,save){
 if(!String(order||'').trim()||!Number.isFinite(save))throw Error('Enter the specific order and save total.');
 return updateCreature(c,id,n=>{if(!activeControl(n)||n.control.spellId!=='darkdonte:monstrous-thrall')throw Error('Permanent Monstrous Thrall control required.');const key=order.trim().toLowerCase(),known=n.control.refusedOrders.includes(key),success=save-(known?0:4)>=n.control.dc;return {...n,control:{...n.control,lastOrder:{order,success,penalty:known?0:4},refusedOrders:success?[...new Set([...n.control.refusedOrders,key])]:n.control.refusedOrders}};});
}
export function removeCampaignCyst(c,id,check){if(!Number.isFinite(check))throw Error('Enter the Medicine result.');let next=updateCreature(c,id,n=>{if(!n.cyst)throw Error('No cyst present.');if(check>=Number(c.archivistCampaign?.rulings?.surgeryDC??20))return {...n,cyst:null,control:n.control?.spellId?.startsWith('darkdonte:necrotic')?null:n.control};return c.archivistCampaign?.rulings?.surgeryFatal===false?damage(n,10):{...n,dead:true,hp:{...n.hp,current:0,temp:0}};});return tickCampaign(next,60);}
export function advanceCampaignRound(c){let next=tickCampaign(c,0.1);const state=next.archivistCampaign,m=campaignModifiers(next);if(next.hp.current>0&&m.healing)next={...next,hp:{...next.hp,current:Math.min(next.hp.max,next.hp.current+m.healing)}};return {...next,archivistCampaign:{...state,sensing:state.sensing?.minutes>0?{...state.sensing,stage:Math.min(3,state.sensing.stage+1)}:state.sensing,creatures:(state.creatures||[]).map(n=>({...n,reactionUsed:false,hp:{...n.hp,current:n.dead?0:n.hp.current>0?Math.min(n.hp.max,n.hp.current+creatureProfile(n).modifiers.healing):0}}))}};}
export function castCooperativeSpell(c,id,options,participants=[]){
 if(!participants.length)return castCampaignSpell(c,id,options);
 if(!campaignFeats(c).some(f=>f.name==='Cooperative Spell')||!options.formationConfirmed)throw Error('Cooperative feat and confirmed formation/Ready timing required.');
 if(new Set(participants.map(x=>x.creatureId)).size!==participants.length)throw Error('Duplicate cooperator.');
 let next=c,dc=castCampaignSpell(c,id,options).archivistCampaign.lastCast.dc;
 for(const entry of participants){const n=next.archivistCampaign?.creatures?.find(n=>n.id===entry.creatureId),s=n?.spells?.find(s=>s.id===entry.spellId);const source=[...c.spells||[],...campaignCystSpells(c)].find(s=>s.catalogId===id);if(!n?.cooperative||n.reactionUsed||s?.name!==source?.name)throw Error('Each cooperator needs the feat, same prepared spell and unused reaction.');next=castCreatureSpell(next,n.id,s.id,entry.slot);next=updateCreature(next,n.id,n=>({...n,reactionUsed:true}));dc=Math.max(dc,creatureProfile(n).dc);}
 next=castCampaignSpell(next,id,options);const combinedDC=dc+participants.length+1;return {...next,archivistCampaign:{...next.archivistCampaign,lastCast:{...next.archivistCampaign.lastCast,dc:combinedDC,secondaryDC:next.archivistCampaign.lastCast.chain?combinedDC-4:null,cooperators:participants.map(p=>p.creatureId)}}};
}
