import levels from '../data/levels.json' with {type:'json'};
import {campaignProfile} from './archivistCampaign.js';
import {graftModifiers} from './campaignModifiers.js';
import {followerMemberLost} from './campaignFollowers.js';
const mod=n=>Math.floor((Number(n)-10)/2);
export function whole(n,label,min=0,max=999999){if(!Number.isInteger(n)||n<min||n>max)throw Error(`${label} must be a whole number from ${min} to ${max} (nonnegative).`);return n;}
const incapacitated=n=>n.dead||n.soulDestroyed||n.hp.current<=0||(Array.isArray(n.conditions)?n.conditions:String(n.conditions||'').split(',')).some(value=>['dead','incapacitated','unconscious','paralyzed','stunned','petrified'].includes(String(typeof value==='object'?value?.name:value).trim().toLowerCase()));
const normalizeActivity=n=>incapacitated(n)?{...n,concentration:null}:n;
export function updateCreature(c,id,fn){const list=c.archivistCampaign?.creatures||[];if(!list.some(n=>n.id===id))throw Error('Creature not found.');return {...c,archivistCampaign:{...c.archivistCampaign,creatures:list.map(n=>n.id===id?normalizeActivity(fn(n)):n)}};}
export function damageCreature(n,amount){whole(amount,'Damage');const temp=Math.max(0,Number(n.hp.temp||0)-amount),current=Math.max(0,n.hp.current-Math.max(0,amount-Number(n.hp.temp||0)));return normalizeActivity({...n,hp:{...n.hp,temp,current}});}
export function creatureProfile(n){const m=graftModifiers(n.grafts),scores=Object.fromEntries(Object.entries(n.abilities).map(([k,v])=>[k,v+(m.abilities[k]||0)])),pb=2+Math.floor((n.level-1)/4);return {...n,abilities:scores,pb,ac:n.ac+m.ac,speed:n.speed+m.speed,initiative:mod(scores.dex)+m.initiative,dc:8+pb+mod(scores.int),attack:pb+mod(scores[n.attackAbility||'str']),saves:Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,mod(v)+(n.saveProf?.[k]?pb:0)])),modifiers:m};}
export function creatureTemplate({name,role='warrior',level=1,type='humanoid',abilities={},...extra}){
 if(!String(name||'').trim())throw Error('Name is required.');whole(level,'Creature level',1,20);
 if(!['warrior','scout','scholar','caster'].includes(role))throw Error('Choose a creature role.');
 const scores={str:role==='warrior'?14:10,dex:role==='scout'?14:10,con:12,int:['caster','scholar'].includes(role)?14:10,wis:12,cha:10,...abilities};
 for(const v of Object.values(scores))whole(v,'Ability score',1,30);
 const die=role==='warrior'?10:role==='scout'?8:6,max=die+mod(scores.con)+(level-1)*(Math.floor(die/2)+1+mod(scores.con));
 const table=levels.find(r=>r.class.name==='Wizard'&&r.level===level&&!r.subclass)?.spellcasting||{};
 return {id:crypto.randomUUID(),name:name.trim(),role,level,type,abilities:scores,hitDie:die,hitDice:level,hp:{max,current:max,temp:0},ac:role==='warrior'?16:12,speed:30,attackAbility:role==='scout'?'dex':role==='caster'?'int':'str',damage:role==='caster'?'1d10':'1d6',saveProf:{},conditions:[],grafts:[],spells:[],slots:role==='caster'?[0,...Array.from({length:9},(_,i)=>table['spell_slots_level_'+(i+1)]||0)]:Array(10).fill(0),slotsUsed:{},inventory:[],currency:{cp:0,sp:0,ep:0,gp:0,pp:0},notes:'Adjustable campaign NPC template; not an official sidekick class.',...extra};
}
export function addCampaignCreature(c,options){if(!campaignProfile(c).active)throw Error('Campaign class required.');return {...c,archivistCampaign:{...c.archivistCampaign,creatures:[...c.archivistCampaign?.creatures||[],creatureTemplate(options)]}};}
export function createFollowerSheets(c,id,role='warrior'){
 const f=c.archivistCampaign?.followers?.find(f=>f.id===id);if(!f||f.lost)throw Error('Active follower record required.');
 if(c.archivistCampaign?.creatures?.some(n=>n.followerId===id))throw Error('This group already has combat sheets.');
 let result=c;for(let i=0;i<f.quantity;i++)result=addCampaignCreature(result,{name:f.quantity>1?`${f.name} ${i+1}`:f.name,role,level:f.level,followerId:id,member:i});return result;
}
export function changeCreatureHP(c,id,amount,heal=false){whole(amount,'HP adjustment');return updateCreature(c,id,n=>{if(heal&&(n.dead||n.soulDestroyed))throw Error('Restore life explicitly before healing this creature.');return heal?{...n,hp:{...n.hp,current:Math.min(n.hp.max,n.hp.current+amount)}}:damageCreature(n,amount);});}
export function creatureCanAct(c,n){const follower=c.archivistCampaign?.followers?.find(f=>f.id===n?.followerId);return !!n&&!incapacitated(n)&&!(n.emergesInRounds>0||n.followerLost||follower?.lost||follower?.arrivalHours>0||followerMemberLost(follower,n.member)||n.followerId&&!campaignProfile(c).thrallherd);}
export function assertCreatureCanAct(c,n){if(!creatureCanAct(c,n))throw Error('Creature is unavailable, lost, not arrived or unable to act.');}
export function castCreatureSpell(c,id,spellId,slot){return updateCreature(c,id,n=>{assertCreatureCanAct(c,n);const s=n.spells.find(s=>s.id===spellId);if(!s||!s.prepared)throw Error('Prepared creature spell required.');whole(slot,'Slot',s.level,9);if(!n.slots[slot]||(n.slotsUsed[slot]||0)>=n.slots[slot])throw Error('No creature slot remaining.');return {...n,slotsUsed:{...n.slotsUsed,[slot]:(n.slotsUsed[slot]||0)+1},...(s.concentration?{concentration:s.name}:{})};});}
export function restCreature(c,id){return updateCreature(c,id,n=>({...n,hp:{...n.hp,current:n.dead||n.soulDestroyed?0:n.hp.max,temp:0},slotsUsed:{},reactionUsed:false,concentration:null}));}
