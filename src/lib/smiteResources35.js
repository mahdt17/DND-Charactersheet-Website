import {applyFeatAbilityIncrease} from './featMagic.js';

const PALADIN='classes/paladin-95',ARGENT='classes/argent-fist-468',MONK='classes/monk-94';
const sources={[PALADIN]:['Paladin',20],[ARGENT]:['Argent Fist',10],[MONK]:['Monk',20]};
const sourceId=value=>String(value||'').replace(/^dndtools:/,'');
const resourceId=id=>'class-grant:dndtools:'+id+':resource:smite-evil';
const spent=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
const identities=row=>[row.catalogId,row.definition?.sourceId,row.definition?.catalogId,row.definition?.id,row.definition?.index].filter(Boolean).map(sourceId);
const claims=(row,id)=>identities(row).includes(id);
function exact(row,id){
 const [name,max]=sources[id],ids=identities(row);
 return row.edition==='3.5'&&row.definition?.edition==='3.5'
  &&row.name===name&&row.definition.name===name&&ids.length>0&&ids.every(value=>value===id)
  &&Number.isInteger(row.level)&&row.level>0&&row.level<=max;
}
function classRows(character){
 return Array.isArray(character.classLevels)&&character.classLevels.length?character.classLevels
  :character.classDefinition?[{catalogId:character.classDefinition.catalogId,name:character.className,edition:character.classDefinition.edition||character.ruleset,level:character.level,definition:character.classDefinition}]:[];
}
function profile(character){
 const rows=classRows(character);
 if(new Set(rows.map(row=>sourceId(row.catalogId||row.definition?.catalogId||row.definition?.id))).size!==rows.length)return null;
 for(const id of [PALADIN,ARGENT])if(rows.some(row=>claims(row,id)&&!exact(row,id)))return null;
 const paladin=rows.find(row=>exact(row,PALADIN)),argent=rows.find(row=>exact(row,ARGENT));
 if(!paladin)return null;
 const monks=rows.filter(row=>claims(row,MONK)||row.name==='Monk'||row.definition?.name==='Monk');
 const monkKnown=monks.every(row=>exact(row,MONK))&&monks.length<=1;
 const base=Number(character.abilities?.cha),bonus=Number(character.abilityBonuses?.cha??0);
 const score=Number.isFinite(base)&&Number.isFinite(bonus)?applyFeatAbilityIncrease(character,'cha',base+bonus):null;
 // PHB Paladin uses and Faiths of Eberron p.70 Ascetic Knight are separate rules:
 // https://www.d20srd.org/srd/classes/paladin.htm
 // https://new.dndtools.org/classes/argent-fist-468
 const extraUses=argent?(argent.level>=4?1:0)+(argent.level>=9?1:0):0;
 return {
  max:1+Math.floor(paladin.level/5)+extraUses,
  extraUses,
  damageBonus:argent&&!monkKnown?null:paladin.level+(argent?argent.level+(monks[0]?.level||0):0),
  attackBonus:score==null?null:Math.max(0,Math.floor((score-10)/2)),
  target:'evil',attackType:'melee',
  sourceClassNames:argent?['Paladin','Argent Fist']:['Paladin']
 };
}
const managed=(resource,id)=>resource?.id===resourceId(id)
 &&sourceId(resource.sourceClassId)===id&&resource.sourceFeatureId==='smite-evil'
 &&resource.sourceType==='class'&&resource.automatic===true&&!resource.manual;

function holdUnassigned(character,resources,previous){
 const argentRows=classRows(character).filter(row=>exact(row,ARGENT));
 if(argentRows.length!==1||resources.some(resource=>resource.id===resourceId(ARGENT)&&resource.manual))return resources;
 const current=resources.find(resource=>managed(resource,ARGENT));
 const oldArgent=previous.find(resource=>managed(resource,ARGENT));
 const oldNative=previous.find(resource=>managed(resource,PALADIN));
 const nativeRemains=resources.some(resource=>resource.id===resourceId(PALADIN));
 const used=spent(oldArgent?.used)+(nativeRemains?0:spent(oldNative?.used));
 const held={
  ...(current||{id:resourceId(ARGENT),classResourceKey:resourceId(ARGENT),name:'Smite Evil',period:'day',reset:'long',shortRecovery:0,
   sourceType:'class',sourceId:'smite-evil',sourceFeatureId:'smite-evil',sourceClassId:'dndtools:'+ARGENT,
   sourceClassLevel:1,edition:'3.5',automatic:true,sourceClassName:'Argent Fist',source:'Argent Fist',
   sourceUrl:'https://new.dndtools.org/classes/argent-fist-468'}),
  max:0,used,smite35:{resolved:false}
 };
 return [...resources.filter(resource=>!managed(resource,ARGENT)),held];
}

// Keep the existing Paladin counter as the sole spending record. This runs at
// grant reconciliation, with the original saved resources supplied for migration.
export function reconcileSmiteResources35(character,derivedResources){
 const previous=Array.isArray(character.resources)?character.resources:[];
 const ids=[resourceId(PALADIN),resourceId(ARGENT)];
 const manual=previous.filter(resource=>ids.includes(resource.id)&&resource.manual);
 let resources=derivedResources.map(resource=>{
  const original=manual.find(saved=>saved.id===resource.id);
  const {smite35,...clean}=original||resource;
  return clean;
 });
 for(const original of manual)if(!resources.some(resource=>resource.id===original.id)){
  const {smite35,...clean}=original;resources.push(clean);
 }
 if(manual.length)return holdUnassigned(character,resources,previous);
 const rule=profile(character),native=resources.find(resource=>managed(resource,PALADIN));
 if(!rule||!native)return holdUnassigned(character,resources,previous);
 if(rule.extraUses>0&&resources.some(resource=>resource.name==='Smite Evil'
  &&resource.sourceType==='class'&&resource.automatic&&!ids.includes(resource.id)))return holdUnassigned(character,resources,previous);
 const retired=previous.find(resource=>managed(resource,ARGENT));
 const used=spent(native.used)+spent(retired?.used);
 resources=resources.filter(resource=>!managed(resource,ARGENT)).map(resource=>resource.id===native.id
  ?{...resource,max:rule.max,used,smite35:rule}:resource);
 return resources;
}
