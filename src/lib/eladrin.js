import {eladrinId,eladrinRace,eladrinSeasons,eladrinAbilities} from '../data/eladrin.js';
import equipment from '../data/equipment.json' with {type:'json'};
import classes from '../data/classes.json' with {type:'json'};
import {effectiveAbilityScores} from './abilityScores.js';

export const feyStepId='race:eladrin-motm:fey-step';
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const profName=x=>norm(x).replace(/^(land|water)vehicles$/,'vehicles$1');
const count=x=>Math.max(0,Math.floor(Number(x)||0));
export function isEladrin(c){return c?.race==='Eladrin'&&c.raceDefinition?.catalogId===eladrinId&&c.raceDefinition?.edition==='2014'&&(c.ruleset||'2014')!=='3.5'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';}
export function eladrinChoicesComplete(c){return !isEladrin(c)||eladrinSeasons.includes(c.eladrin?.season)&&Object.hasOwn(eladrinAbilities,c.eladrin?.ability);}
export function eladrinProfile(c,abilities=effectiveAbilityScores(c)){
 if(!isEladrin(c))return {active:false};
 const max=2+Math.floor((Math.max(1,Math.min(20,Number(c.level)||1))-1)/4),used=count(c.resources?.find(r=>r.id===feyStepId)?.used),season=c.eladrin?.season;
 const seasonal=c.level>=3,ability=c.eladrin?.ability,dc=8+max+Math.floor(((abilities[ability]??10)-10)/2);
 return {active:true,max,used,remaining:Math.max(0,max-used),season,ability,dc,seasonal,fireDamage:seasonal&&season==='Summer'?max:0,complete:eladrinChoicesComplete(c)};
}
export function eladrinResource(c){const p=eladrinProfile(c);return p.active?{id:feyStepId,classResourceKey:feyStepId,raceManaged:true,name:'Fey Step',className:'Eladrin',max:p.max,used:p.used,reset:'long',shortRecovery:0,manual:false}:null;}
export function feyStepBlocked(c){
 const p=eladrinProfile(c);if(!p.active)return 'This race does not grant this Fey Step.';
 if(!p.complete)return 'Choose your Eladrin season and Fey Step ability.';
 if(Number(c.hp?.current)<=0)return 'You must be conscious to use Fey Step.';
 const conditions=(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(norm);
 if(conditions.some(n=>['incapacitated','unconscious','paralyzed','stunned','petrified','dead'].includes(n)))return 'You cannot use Fey Step while incapacitated.';
 if(!p.remaining)return 'No Fey Step uses remaining.';
 return '';
}
export function useFeyStep(c){const blocked=feyStepBlocked(c);if(blocked)throw Error(blocked);const r=eladrinResource(c);return {resources:[...(c.resources||[]).filter(x=>x.id!==feyStepId),{...r,used:r.used+1}]};}
// The SRD catalog files four PHB tools under adventuring gear and omits two
// gaming sets and the vehicle proficiency categories. Include those explicitly.
const toolKits=['disguise-kit','forgery-kit','herbalism-kit','poisoners-kit'];
export const tranceEquipment=[...equipment.filter(e=>['weapon','tools'].includes(e.equipment_category?.index)||toolKits.includes(e.index)).map(e=>({...e,kind:e.equipment_category.index==='weapon'?'weapons':'tools'})),
 ...[['dragonchess-set','Dragonchess Set'],['three-dragon-ante-set','Three-Dragon Ante Set'],['vehicles-land','Vehicles (land)'],['vehicles-water','Vehicles (water)']].map(([index,name])=>({index,name,kind:'tools'}))];
export function eladrinTranceOptions(c){
 const definition=c.classLevels?.[0]?.definition||c.classDefinition,primary=definition?.proficiencies||(!definition?.homebrew?classes.find(x=>x.name===(c.classLevels?.[0]?.name||c.className))?.proficiencies:[])||[];
 const permanent=[...primary,...(c.trainingGrants||[]).flatMap(g=>g.proficiencies||[])];
 const indexes=permanent.map(p=>typeof p==='string'?p:p.index),names=[...String(c.toolProf||'').split(/[,;\n]/),...permanent.map(p=>p.name),...(c.feats||[]).flatMap(f=>f.magicChoices?.tool?[f.magicChoices.tool]:[])].map(profName);
 return tranceEquipment.filter(e=>!indexes.some(i=>i===e.index||i===e.index+'s'||e.kind==='weapons'&&i===e.weapon_category?.toLowerCase()+'-weapons')&&!names.includes(profName(e.name))&&!(e.kind==='weapons'&&c.weaponTrainingOverrides?.[e.index]===true));
}
export function finishEladrinTrance(c,choices={}){
 if(!isEladrin(c))return {};
 const season=choices.season||c.eladrin?.season,trance=choices.trance||[];
 if(!eladrinSeasons.includes(season))throw Error('Choose an Eladrin season.');
 if(!Array.isArray(trance)||trance.some(id=>!tranceEquipment.some(e=>e.index===id)))throw Error('Choose a PHB weapon or tool.');
 if(new Set(trance).size!==trance.length)throw Error('Choose different Trance proficiencies.');
 const allowed=eladrinTranceOptions(c);
 if(trance.some(id=>!allowed.some(e=>e.index===id)))throw Error('You already have that proficiency.');
 if(trance.length!==0&&trance.length!==2)throw Error('Choose two Trance proficiencies, or leave both empty.');
 return {eladrin:{...c.eladrin,season,trance}};
}
export function eladrinTraining(c){return isEladrin(c)?(c.eladrin?.trance||[]).flatMap(id=>{const e=tranceEquipment.find(x=>x.index===id);return e?[{index:e.index,name:e.name,kind:e.kind,source:'Eladrin Trance'}]:[];}):[];}
export function reconcileEladrin(c){
 if(!isEladrin(c))return c;
 const traits=[...(c.traits||[]).filter(t=>t.homebrew||!eladrinRace.traits.some(r=>r.name===t.name)),...eladrinRace.traits.map(t=>({...t,id:eladrinId+':'+norm(t.name),source:eladrinRace.source}))];
 return {...c,skillProf:{...c.skillProf,Perception:true},traits};
}
