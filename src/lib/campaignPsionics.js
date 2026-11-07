import {previousManifestHistory} from './manifestHistory.js';
import {psicrystalProfile} from './campaignPsicrystal.js';
import {campaignProfile,legacyPreset,useCampaignPower} from './archivistCampaign.js';
import {assertCampaignCanAct} from './campaignActivity.js';
import {campaignPowers} from '../data/archivistCampaign.js';
import {psionKnown} from '../data/campaignExpansion.js';
import {whole,updateCreature,damageCreature} from './campaignCreatures.js';
const granted=[{id:'psionic-charm',name:'Psionic Charm',level:1,cost:1,save:'wis',minutes:60,gate:3},{id:'psionic-dominate',name:'Psionic Dominate',level:4,cost:7,save:'wis',minutes:1,gate:5}];
export function extendedPsionProfile(c){const p=campaignProfile(c),level=p.manifesterLevel;return {...p,maxPowerLevel:Math.min(9,Math.ceil(level/2)),knownLimit:psionKnown[level]||0,powers:[...(p.psion&&legacyPreset(c)?campaignPowers.map(x=>({...x,level:1,range:x.id==='inertial-armor'?'Self':'30 feet'})):[]),...(c.archivistCampaign?.knownPowers||[]).map(power=>{const base=campaignPowers.find(x=>x.id===power.id);return base?{...power,...base}:power;}),...granted.filter(x=>p.thrallherd>=x.gate)],bonusFeatLevels:[1,5,10,15,20].filter(l=>p.psion>=l),psicrystalLevel:p.psion};}
export function learnCampaignPower(c,power){const p=extendedPsionProfile(c);whole(power.level,'Power level',1,p.maxPowerLevel);if(!power.name?.trim()||p.scores.int<10+power.level)throw Error('Power name and sufficient Intelligence required.');if((c.archivistCampaign?.knownPowers||[]).length+(legacyPreset(c)?3:0)>=p.knownLimit)throw Error('Powers known limit reached.');if(p.powers.some(x=>x.name.toLowerCase()===power.name.trim().toLowerCase()))throw Error('Power already known.');if(power.damage&&!/^\d+d\d+(?:[+-]\d+)?$/i.test(power.damage))throw Error('Use a dice formula such as 3d6+2.');const base=campaignPowers.find(x=>x.name.toLowerCase()===power.name.trim().toLowerCase());const value={...(base?{range:base.id==='inertial-armor'?'Self':'30 feet'}:{}),...power,name:power.name.trim(),cost:2*power.level-1,id:campaignPowers.find(x=>x.name.toLowerCase()===power.name.trim().toLowerCase())?.id||crypto.randomUUID(),minutes:whole(Number(power.minutes||0),'Duration',0,100000),save:['str','dex','con','int','wis','cha'].includes(power.save)?power.save:''};return {...c,archivistCampaign:{...c.archivistCampaign,knownPowers:[...(c.archivistCampaign?.knownPowers||[]),value]}};}
export function manifestExtendedPower(c,id,{augmentation=0,discount=false,targetType='humanoid'}={}){
 assertCampaignCanAct(c);
 if(campaignPowers.some(power=>power.id===id))return useCampaignPower(c,id,{augmentation,discount});
 const p=extendedPsionProfile(c),power=p.powers.find(x=>x.id===id);if(!power||!p.psion)throw Error('Known Telepath power required.');whole(augmentation,'Augmentation',0,1000);if(p.scores.int<10+power.level)throw Error('Insufficient Intelligence for this power.');if(!power.gate&&power.level>p.maxPowerLevel)throw Error('Power tier exceeds current manifesting level.');
 const allowedTypes=id==='psionic-dominate'?['humanoid',...(p.thrallherd>=7?['beast','fey','giant','monstrosity']:[]),...(p.thrallherd>=9?['aberration','dragon','elemental','celestial','fiend']:[])]:['humanoid'];
 let typeCost=0;if(['psionic-charm','psionic-dominate'].includes(id)&&!allowedTypes.includes(targetType)){if(['beast','fey','giant','monstrosity'].includes(targetType))typeCost=2;else if(['aberration','dragon','elemental','celestial','fiend'].includes(targetType))typeCost=4;else throw Error('Unsupported mental target type.');}
 if(discount&&!granted.some(g=>g.id===id&&p.thrallherd>=g.gate))throw Error('No daily discount for this power.');
 if(discount&&c.archivistCampaign?.thrallDiscounts?.[id])throw Error('Daily discount already used.');
 if(power.cost+augmentation+typeCost>p.manifesterLevel)throw Error('Augmented power exceeds manifester level before the daily discount.');
 const cost=Math.max(1,power.cost+augmentation+typeCost-(discount?p.thrallherd:0));
 if(cost>p.manifesterLevel)throw Error('Power point cost exceeds manifester level.');if(p.ppUsed+cost>p.ppMax)throw Error('Not enough power points.');
 return {...c,powerPointsUsed:p.ppUsed+cost,archivistCampaign:{...c.archivistCampaign,psicrystal:{...c.archivistCampaign?.psicrystal,pendingTouch:null},thrallDiscounts:{...c.archivistCampaign?.thrallDiscounts,...(discount?{[id]:true}:{})},manifestHistory:previousManifestHistory(c.archivistCampaign),lastManifest:{id:crypto.randomUUID(),power,cost,augmentation,targetType,dc:p.dc,resolved:[]},powerEffects:{...c.archivistCampaign?.powerEffects,...(power.minutes>0?{[id]:{minutes:power.minutes}}:{})}}};
}
export function resolveExtendedPower(c,targetId,{save,damage=0,manifestId}={}){
 const state=c.archivistCampaign||{},cast=manifestId?previousManifestHistory(state).find(m=>m.id===manifestId):state.lastManifest;if(cast?.touchPending)throw Error('Deliver the Psicrystal touch first.');if(!cast||cast.resolved.length>=1)throw Error('Manifest a power first; this manifestation has one target.');
 const n=c.archivistCampaign?.creatures?.find(n=>n.id===targetId);if(!n||n.dead||n.soulDestroyed)throw Error('Living creature required.');
 if(['psionic-charm','psionic-dominate'].includes(cast.power.id)&&n.type!==cast.targetType)throw Error('Creature type differs from the paid augmentation.');
 if(['mindlink','inertial-armor'].includes(cast.power.id))throw Error('This power has no save resolution.');
 if(cast.power.save&&!Number.isFinite(save))throw Error('Enter the save total.');if(cast.power.damage)whole(damage,'Damage');const passed=!!cast.power.save&&save>=cast.dc;
 let next=updateCreature(c,targetId,n=>{if(passed)return n;if(cast.power.id==='psionic-dominate')return {...n,control:{spellId:cast.power.id,caster:c.id,dc:cast.dc,minutes:cast.power.minutes,refusedOrders:[]}};if(['psionic-charm','attraction'].includes(cast.power.id))return {...n,conditions:[...(n.conditions||[]),{name:cast.power.id==='attraction'?'Attracted':'Charmed',rounds:cast.power.minutes*10,...(cast.power.id==='attraction'?{attractionCaster:c.id,interactionBonus:4}:{})}]};if(cast.power.damage)return damageCreature(n,damage);return {...n,notes:(n.notes||'')+`\n${cast.power.name}: ${cast.power.description||'Resolve the configured effect.'}`};});
 return {...next,archivistCampaign:{...next.archivistCampaign,...(cast.id===state.lastManifest?.id?{lastManifest:{...cast,resolved:[...cast.resolved,targetId],lastResult:passed?'Save succeeded':'Effect applied'}}:{manifestHistory:(state.manifestHistory||[]).map(m=>m.id===cast.id?{...cast,resolved:[...cast.resolved,targetId],lastResult:passed?'Save succeeded':'Effect applied'}:m)})}};
}

export function attractionInteractionBonus(c,targetId,{relevant=false}={}){
 if(!relevant||!campaignProfile(c).psion)return 0;
 const target=c.archivistCampaign?.creatures?.find(n=>n.id===targetId);
 if(!target||target.dead||target.soulDestroyed)return 0;
 return (target.conditions||[]).some(e=>e.name==='Attracted'&&e.rounds>0&&e.attractionCaster===c.id&&e.interactionBonus===4)?4:0;
}

export function manifestationOptions(c,power){
 const p=extendedPsionProfile(c);
 const crystal=psicrystalProfile(c),distance=crystal.distance,near=crystal.alive&&crystal.nearby;
 const modes=[{id:'normal',label:'Normal'}];
 if(near&&distance<=5&&['Self','Personal'].includes(power?.range))modes.push({id:'share',label:'Share with Psicrystal within 5 feet'});
 if(near&&distance===0&&p.psion>=3&&power?.range==='Touch')modes.push({id:'touch',label:'Hold touch power through Psicrystal'});
 if(near&&p.psion>=15)modes.push({id:'channel',label:'Channel through Psicrystal'});
 const discountGate=power?.id==='psionic-charm'?3:power?.id==='psionic-dominate'?5:Infinity;
 const maxAdditional=Math.max(0,Math.min(p.manifesterLevel,p.ppMax-p.ppUsed)-Number(power?.cost||1));
 return {modes,discount:p.thrallherd>=discountGate,
  discountUsed:!!c.archivistCampaign?.thrallDiscounts?.[power?.id],
  targetTypes:power?.id==='psionic-dominate',
  augmentation:power?.id==='inertial-armor'?Math.floor(maxAdditional/2)*2:0,
  typeWaiver:power?.id==='psionic-dominate'?(p.thrallherd>=9?4:p.thrallherd>=7?2:0):0};
}

export function selectedPowerManifest(c,id){return previousManifestHistory(c.archivistCampaign).find(m=>m.power?.id===id)||null;}
