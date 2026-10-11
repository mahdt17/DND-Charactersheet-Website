import {characterClasses,classCharacter,contentKey,progressionTables} from './advancement.js';

const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const numeric=value=>{
  const match=String(value??'').replace(/,/g,'').match(/-?\d+/);
  return match?Number(match[0]):null;
};
const legacyTrack=track=>String(track?.edition||'').trim()==='3.5';
const kindOf=name=>{
  const key=norm(name);
  if(key==='power points'||key==='power points per day'||key==='pp')return 'powerPoints';
  if(key==='powers known'||key==='power known'||key==='powers discovered'||key==='power discovered')return 'powersKnown';
  if(key==='maximum power level known'||key==='max power level known'||key==='maximum power level')return 'maxPowerLevel';
  return null;
};
const effectiveLevel=tracks=>Math.max(0,...tracks.map(track=>Number(track?.effectiveClassLevel??track?.sourceClassLevel??track?.level)||0));
const unique=value=>[...new Set(value.filter(Boolean))];
const abilities={Psion:'int','Psychic Warrior':'wis',Wilder:'cha'};
export const sharedPowerPointsId35='manifesting35:shared:power-points';

// Read all scalar tracks using the same latest-at-or-below-level semantics as
// class progression. Bonus abilities remain limited to reviewed class rules.
export function powerPointProfile35(model){
  if((model.classDefinition?.edition||model.ruleset)!=='3.5')return null;
  const id=model.activeCastingClassId||contentKey(model.classDefinition||{name:model.className,edition:'3.5'});
  const extra=(model.castingAdvancements||[]).filter(x=>x.targetClassId===id&&x.kind==='psionic').reduce((n,x)=>n+(Number(x.amount)||0),0);
  const level=(Number(model.level)||0)+extra,values={};
  for(const table of progressionTables(model.classDefinition)){
    const h=table.slice(0,5).findIndex(row=>row.some(v=>/^(?:class |racial )?level$/i.test(String(v).trim())));
    if(h<0)continue;
    const header=table[h],index=header.findIndex(v=>/^(?:class |racial )?level$/i.test(String(v).trim()));
    for(const row of table.slice(h+1)){
      const at=parseInt(row[index]);
      if(row.length!==header.length||!Number.isFinite(at)||at<1||at>level)continue;
      header.forEach((name,i)=>{
        const kind=kindOf(name),value=numeric(row[i]);
        if(kind&&value!=null&&at>=(values[kind]?.level||0))values[kind]={level:at,value};
      });
    }
  }
  if(!values.powerPoints)return null;
  const ability=abilities[model.className],score=Number(model.abilities?.[ability]??10)+Number(model.abilityBonuses?.[ability]||0);
  const base=Math.max(0,values.powerPoints.value),bonus=ability?Math.floor(Math.max(0,Math.floor((score-10)/2))*level/2):0;
  return {id,ability,level,base,bonus,points:base+bonus,known:values.powersKnown?.value,maximum:values.maxPowerLevel?.value};
}

export function powerPointReserve35(character){
  const total=characterClasses(character).reduce((n,row)=>n+(powerPointProfile35(classCharacter(character,row))?.points||0),0);
  const bonus=character.powerPointBonus?.source?Math.max(0,Number(character.powerPointBonus.amount)||0):0;
  // An explicit canonical value, including zero, wins over serialized mirrors.
  const legacy=(character.resources||[]).filter(r=>r.manifesting35&&r.id!==sharedPowerPointsId35).reduce((n,r)=>n+Math.max(0,Number(r.used)||0),0);
  const used=Math.max(0,Number(character.powerPointsUsed??legacy)||0),maximum=total+bonus;
  return {maximum,used,remaining:Math.max(0,maximum-used)};
}

export function manifestingProfiles35(character){
  const groups=new Map();
  for(const track of character?.classProgressionTracks||[]){
    if(!legacyTrack(track))continue;
    const kind=kindOf(track.name);if(!kind||!track.sourceClassId)continue;
    const id=String(track.sourceClassId);
    if(!groups.has(id))groups.set(id,[]);
    groups.get(id).push({...track,manifestingKind:kind});
  }
  return [...groups.entries()].map(([sourceClassId,tracks])=>{
    const latest=kind=>tracks.filter(track=>track.manifestingKind===kind).sort((a,b)=>(Number(a.effectiveClassLevel??a.level)||0)-(Number(b.effectiveClassLevel??b.level)||0)).at(-1);
    const pp=latest('powerPoints'),known=latest('powersKnown'),maxLevel=latest('maxPowerLevel'),basis=pp||known||maxLevel||tracks[0];
    return {
      id:`manifesting35:${sourceClassId}`,
      sourceClassId,
      sourceClassName:basis?.sourceClassName||basis?.source||'',
      sourceUrl:basis?.sourceUrl||null,
      edition:'3.5',
      effectiveClassLevel:effectiveLevel(tracks),
      powerPointsMax:numeric(pp?.value),
      powersKnown:numeric(known?.value),
      maxPowerLevel:numeric(maxLevel?.value),
      advancedBy:unique(tracks.flatMap(track=>Array.isArray(track.advancedBy)?track.advancedBy:[])),
      trackIds:tracks.map(track=>track.id).filter(Boolean)
    };
  }).sort((a,b)=>String(a.sourceClassId).localeCompare(String(b.sourceClassId)));
}

export function reconcileManifesting35(character){
  const profiles=manifestingProfiles35(character);
  const existing=Array.isArray(character?.resources)?character.resources:[];
  const preserved=existing.filter(resource=>!resource?.manifesting35);
  const reserve=powerPointReserve35(character);
  const rows=characterClasses(character),sources=rows.filter(row=>powerPointProfile35(classCharacter(character,row)));
  const legacy=rows.some(row=>row.edition==='3.5')||character.ruleset==='3.5'||character.ruleset==='custom'&&character.mechanics==='3.5';
  const resources=legacy&&(sources.length||reserve.maximum>0)?[{
      id:sharedPowerPointsId35,
      name:'Power Points',
      max:reserve.maximum,
      used:reserve.used,
      unit:'PP',
      period:'day',
      reset:'long',
      shortRecovery:0,
      manifesting35:true,
      automatic:true,
      sourceType:'manifesting',
      sourceId:sharedPowerPointsId35,
      sourceClassIds:sources.map(row=>row.catalogId),
      sourceClassName:sources.map(row=>row.name).join(' / '),
      edition:'3.5'
    }]:[];
  const hasUsage=character.powerPointsUsed!=null||existing.some(r=>r.manifesting35)||sources.length>0;
  return {...character,...(hasUsage?{powerPointsUsed:reserve.used}:{}),manifesting35:profiles,resources:[...preserved,...resources]};
}
