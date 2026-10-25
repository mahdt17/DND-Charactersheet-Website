import {shadarKaiRaces} from '../data/shadarKai.js';
import {eladrinTranceOptions,tranceEquipment} from './eladrin.js';
const count=x=>Math.max(0,Math.floor(Number(x)||0));
const sourceIds=shadarKaiRaces.map(r=>r.catalogId);
export function shadarKaiRace(c){return c?.race==='Shadar-kai'&&c.raceDefinition?.edition==='2014'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014'?shadarKaiRaces.find(r=>r.catalogId===c.raceDefinition?.catalogId):undefined;}
export const isShadarKai=c=>!!shadarKaiRace(c);
export const isMultiverseShadarKai=c=>shadarKaiRace(c)?.version==='motm';
export function shadarKaiProfile(c){
 const race=shadarKaiRace(c);if(!race)return {active:false};
 const level=Math.max(1,Math.min(20,count(c.level)||1)),max=race.version==='mtf'?1:2+Math.floor((level-1)/4),id=`race:${race.index}:blessing`,used=count(c.resources?.find(r=>r.id===id)?.used),wardAvailable=level>=3;
 return {active:true,race,id,level,max,used,remaining:Math.max(0,max-used),wardAvailable,wardActive:wardAvailable&&c.shadarKai?.wardSource===race.catalogId,resistances:['necrotic']};
}
export function blessingResource(c){const p=shadarKaiProfile(c);return p.active?{id:p.id,classResourceKey:p.id,raceManaged:true,name:'Blessing of the Raven Queen',className:'Shadar-kai',max:p.max,used:p.used,reset:'long',shortRecovery:0,manual:false}:null;}
export const shadarKaiResourceIds=shadarKaiRaces.map(r=>`race:${r.index}:blessing`);
export function blessingBlocked(c){
 const p=shadarKaiProfile(c);if(!p.active)return 'This race source does not grant Blessing of the Raven Queen.';
 if(Number(c.hp?.current)<=0)return 'You must be conscious to teleport.';
 const conditions=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(value=>String(typeof value==='object'?value?.name:value).trim().toLowerCase());
 if(conditions.some(n=>['incapacitated','unconscious','paralyzed','stunned','petrified','dead'].includes(n)))return 'You cannot teleport while incapacitated.';
 return p.remaining?'':'No Blessing uses remaining.';
}
export function useBlessing(c){const blocked=blessingBlocked(c);if(blocked)throw Error(blocked);const p=shadarKaiProfile(c),resource=blessingResource(c);return {resources:[...(c.resources||[]).filter(r=>r.id!==resource.id),{...resource,used:resource.used+1}],shadarKai:{...c.shadarKai,wardSource:p.wardAvailable?p.race.catalogId:null}};}
export const endBlessingWard=c=>({shadarKai:{...c.shadarKai,wardSource:null}});
export const shadarKaiTranceOptions=c=>isMultiverseShadarKai(c)?eladrinTranceOptions(c):[];
export function finishShadarKaiTrance(c,{trance=[]}={}){
 if(!isMultiverseShadarKai(c))return {};
 if(!Array.isArray(trance)||trance.some(id=>!tranceEquipment.some(e=>e.index===id)))throw Error('Choose a PHB weapon or tool.');
 if(new Set(trance).size!==trance.length)throw Error('Choose different Trance proficiencies.');
 const allowed=shadarKaiTranceOptions(c);if(trance.some(id=>!allowed.some(e=>e.index===id)))throw Error('You already have that proficiency.');
 if(trance.length!==0&&trance.length!==2)throw Error('Choose two Trance proficiencies, or leave both empty.');
 return {shadarKai:{...c.shadarKai,trance}};
}
export const shadarKaiTraining=c=>isMultiverseShadarKai(c)?(c.shadarKai?.trance||[]).flatMap(id=>{const item=tranceEquipment.find(e=>e.index===id);return item?[{index:item.index,name:item.name,kind:item.kind,source:'Shadar-kai Trance'}]:[];}):[];
export function reconcileShadarKai(c){
 const race=shadarKaiRace(c),retained=(c.traits||[]).filter(t=>t.homebrew||!sourceIds.includes(t.raceGrantId));
 if(!race)return retained.length===(c.traits||[]).length?c:{...c,traits:retained};
 const traits=race.traits.map(t=>({...t,id:race.catalogId+':'+t.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),source:race.source}));
 return {...c,skillProf:{...c.skillProf,Perception:true},traits:[...retained,...traits]};
}
