import {entomancerId,populationTable,entomancerSlots,entomancerFeatures,speciesFeatures,entomancerSource} from '../data/entomancer.js';
export const populationId='2014:Entomancer:population';
const mod=n=>Math.floor((Number(n??10)-10)/2);
export const isEntomancerRecord=r=>r?.edition==='2014'&&(r.catalogId===entomancerId||r.id===entomancerId);
export function entomancerLevel(c){
 if((c.ruleset||'2014')!=='2014')return 0;
 const rows=c.classLevels?.length?c.classLevels:[{definition:c.classDefinition,level:c.level,edition:c.ruleset||'2014'}];
 return Math.min(20,rows.filter(r=>(r.edition||'2014')==='2014'&&isEntomancerRecord(r.definition||r)).reduce((n,r)=>n+Math.max(0,Math.floor(Number(r.level)||0)),0));
}
export function entomancerProfile(c,abilities){
 const level=entomancerLevel(c),s=c.entomancer||{},settings=s.settings||{},effects=s.effects||{};
 const scores=abilities||Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,Number(c.abilities?.[k]??10)+Number(c.abilityBonuses?.[k]||0)]));
 const wis=mod(scores.wis),con=mod(scores.con),dex=mod(scores.dex),str=mod(scores.str);
 const total=c.classLevels?.length?c.classLevels.reduce((n,r)=>n+Number(r.level||0),0):Number(c.level||1)+Number(c.otherClassLevels||0),pb=2+Math.floor((Math.max(1,total)-1)/4);
 const species=level&&Object.hasOwn(speciesFeatures,s.species)?s.species:'';
 const has=name=>level>=3&&(level>=20||s.moisture===name||s.temperature===name);
 const active=key=>!!(level&&effects[key]?.remaining>0);
 const form=level>=17&&active('swarmForm'),song=species==='Orthoptera'&&level>=6&&!!s.song;
 const resistances=[];
 if(species==='Decomposers')resistances.push('necrotic');
 if(level>=11&&has('Hot'))resistances.push('fire');if(level>=11&&has('Cold'))resistances.push('cold');
 if(level>=13)resistances.push('psychic');
 if(form)resistances.push('bludgeoning','piercing','slashing');
 if(species==='Exo-Gotas'&&level>=18)resistances.push('slashing','bludgeoning');
 const max=level?populationTable[level-1]:0,used=Math.max(0,Number((c.resources||[]).find(r=>r.classResourceKey===populationId||r.id===populationId)?.used)||0);
 const moistureKnown=['Dry','Humid'].includes(s.moisture)&&['Dry','Humid'].includes(s.environmentMoisture);
 const temperatureKnown=['Hot','Cold'].includes(s.temperature)&&['Hot','Cold'].includes(s.environmentTemperature);
 const moistureMatch=moistureKnown&&s.environmentMoisture===s.moisture,temperatureMatch=temperatureKnown&&s.environmentTemperature===s.temperature;
 const forageEnvironment=level>=3&&(level>=20||moistureMatch||temperatureMatch);
 const adapted=level>=3&&(level>=20||moistureMatch&&temperatureMatch);
 const opposite=level>=3&&level<18&&moistureKnown&&temperatureKnown&&!moistureMatch&&!temperatureMatch;
 return {level,species,max,used,remaining:Math.max(0,max-used),pb,wis,con,dex,str,slots:[0,...(entomancerSlots[level-1]||[0,0,0,0,0]),0,0,0,0],cantrips:level?pb:0,prepared:level>=2?max:0,spellDC:8+pb+con,populationDC:8+pb+wis,
  uncertainDC:Math.max(1,Number(settings.saveDC)||8+pb+(settings.saveAbility==='con'?con:wis)),settings,
  resistances:[...new Set(resistances)],form,song,songRange:song?(level>=14?60:30):0,
  dry:has('Dry'),humid:has('Humid'),adapted,forageEnvironment,opposite,waterBreathing:level>=18&&has('Humid'),noWater:level>=18&&has('Dry'),
  speedMultiplier:species==='Exo-Gotas'&&level>=6?2:1,waterMultiplier:level>=18&&has('Humid')?2:1,
  burrow:level>=18&&has('Dry')?Math.floor(Number(c.speed||0)*(species==='Exo-Gotas'?2:1)/2):0,
  allResistance:species==='Exo-Gotas'&&level>=18&&active('invicta'),nonmagicalSlashing:species==='Exo-Gotas'&&level>=14,
  physicalReduction:level>=11?pb:0,invisible:level>=20&&active('invisible'),reflexArmor:species==='Exo-Gotas'&&level>=14&&active('reflexArmor'),
  size:species==='Exo-Gotas'?({Small:'Medium',Medium:'Large'}[c.raceDefinition?.size||c.size||'Medium']||c.size||'Medium'):(c.raceDefinition?.size||c.size||'Medium')};
}
export function entomancerResource(c){const p=entomancerProfile(c);return p.level?{id:populationId,classResourceKey:populationId,name:'Population',max:p.max,used:p.used,reset:'none',shortRecovery:0,className:'Entomancer',edition:'2014',recoveryText:'Fed long rest: all; short rest: half maximum (rounded down), subject to saved feeding rule'}:null;}
export function entomancerSkillRank(c,name){
 const p=entomancerProfile(c),base=c.expertise?.[name]?2:c.skillProf?.[name]?1:0;
 const upgrade=name==='Stealth'&&p.level>=11&&p.dry||name==='Athletics'&&p.level>=6&&p.species==='Exo-Gotas';
 return upgrade?Math.min(2,base+1):name==='Athletics'&&p.level>=6&&p.species==='Endo-Gotas'?Math.max(1,base):base;
}
export function entomancerArmor(c,base,armor='',abilities){const p=entomancerProfile(c,abilities);if(!p.level)return base;if(p.form)return 10+p.wis+p.dex;
 const bonus=p.level>=11&&armor!=='Heavy'?Math.floor(p.wis/2):0,react=p.reflexArmor?2:0;
 if(p.species==='Exo-Gotas'&&p.level>=18)return (armor?base+bonus+p.con:Math.max(base+bonus,p.level))+react;
 return base+bonus+react;
}
export function entomancerTraining(c){const p=entomancerProfile(c),result=[];if(p.level>=11)result.push({index:'medium-armor',name:'Medium armor',kind:'armor'});if(p.species==='Exo-Gotas'&&p.level>=18)result.push({index:'heavy-armor',name:'Heavy armor',kind:'armor'});
 if(p.level&&c.entomancer?.tool)result.push({index:'entomancer-tool',name:c.entomancer.tool,kind:'tools'});
 if(p.species==='Orthoptera'&&c.entomancer?.instrument)result.push({index:'entomancer-instrument',name:c.entomancer.instrument,kind:'tools'});return result;
}
export function entomancerFeatureRows(c){const p=entomancerProfile(c);return !p.level?[]:[...entomancerFeatures,...(speciesFeatures[p.species]||[]).map(([level,name,description],i)=>({index:`entomancer-species-${i}`,level,name,description,desc:[description],sourceUrl:entomancerSource}))].filter(f=>f.level<=p.level);}
export function entomancerRollTraits(c,label){const p=entomancerProfile(c),s=c.entomancer||{},survival=/^Survival$/i.test(label),grapple=/grapple/i.test(label);
 return {advantage:!!(p.level&&(p.level>=7&&/^(Perception|Insight)$/.test(label)||survival&&(p.adapted||p.species==='Exo-Gotas'&&p.level>=10)||grapple&&p.species==='Endo-Gotas'&&p.level>=10||p.species==='Exo-Gotas'&&p.level>=10&&/Dexterity saving throw/.test(label)&&s.visibleEffect||p.species==='Exo-Gotas'&&s.targetConstruct&&/attack/i.test(label)||p.level>=18&&p.humid&&s.underwater&&/attack/i.test(label))),disadvantage:!!(survival&&p.opposite)};
}
