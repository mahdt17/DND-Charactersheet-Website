import levels from '../data/levels.json' with {type:'json'};
import {campaignIds} from '../data/archivistCampaign.js';
import {usesClassSpellRules} from './spellcastingPolicy.js';
const empty=()=>Array(10).fill(0);
const table=(name,level)=>{const value=levels.find(r=>r.class.name===name&&r.level===level&&!r.subclass)?.spellcasting||{};return [0,...Array.from({length:9},(_,i)=>Number(value[`spell_slots_level_${i+1}`]||0))];};
// The approved conversions use the ordinary 2014 multiclass caster table.
export function conversionSlotPool(c,singleSlots,{includeUnconverted=false}={}){
 if((c.ruleset||'2014')!=='2014')return null;
 const rows=c.classLevels?.length?c.classLevels:[{name:c.className,definition:c.classDefinition,level:c.level,edition:'2014'}];
 const kind=r=>Object.keys(campaignIds).find(k=>campaignIds[k]===(r.definition?.catalogId||r.catalogId));
 if(!includeUnconverted&&!rows.some(kind)||rows.some(r=>(r.edition||'2014')!=='2014'))return null;
 if(rows.some(r=>!usesClassSpellRules({ruleset:'2014',className:r.name,classDefinition:r.definition})))return {standard:empty(),pact:empty(),mode:'manual',reason:'This source requires its verified or manually configured spell slots.'};
 const full=r=>kind(r)==='archivist'||['Wizard','Cleric','Druid','Bard','Sorcerer'].includes(r.name);
 const half=r=>['Paladin','Ranger','Entomancer','Artificer'].includes(r.name);
 const third=r=>['Eldritch Knight','Arcane Trickster'].includes(r.subclass)&&r.level>=3;
 if(rows.some(r=>!kind(r)&&!full(r)&&!half(r)&&!['Barbarian','Fighter','Monk','Rogue','Warlock'].includes(r.name)))return {standard:empty(),pact:empty(),mode:'manual',reason:'This class combination needs source-based slot configuration.'};
 const casters=rows.filter(r=>full(r)||third(r)||half(r)&&r.level>=(r.name==='Artificer'?1:2));
 const casterLevel=casters.reduce((sum,r)=>sum+(full(r)?r.level:third(r)?Math.floor(r.level/3):r.name==='Artificer'?Math.ceil(r.level/2):Math.floor(r.level/2)),0);
 let standard=table('Wizard',Math.min(20,casterLevel));
 if(casters.length===1){const r=casters[0];standard=kind(r)==='archivist'?(c.archivistCampaign?.rulings?.slots||table('Wizard',r.level)):singleSlots?singleSlots({className:r.name,classDefinition:r.definition,subclass:r.subclass,level:r.level,ruleset:'2014'}):table(r.name,r.level);}
 const warlock=rows.find(r=>r.name==='Warlock');
 return {standard,pact:warlock?table('Warlock',warlock.level):empty(),mode:'automatic',casterLevel};
}
