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
  const previous=new Map(existing.filter(resource=>resource?.manifesting35).map(resource=>[resource.id,resource]));
  const preserved=existing.filter(resource=>!resource?.manifesting35);
  const resources=[];
  for(const profile of profiles){
    if(profile.powerPointsMax==null)continue;
    const id=`manifesting35:${profile.sourceClassId}:power-points`,prior=previous.get(id),max=Math.max(0,Number(profile.powerPointsMax)||0);
    const used=Math.min(max,Math.max(0,Number(prior?.used)||0));
    resources.push({
      id,
      name:'Power Points',
      max,
      used,
      unit:'PP',
      period:'day',
      reset:'long',
      shortRecovery:0,
      manifesting35:true,
      automatic:true,
      sourceType:'manifesting',
      sourceId:id,
      sourceClassId:profile.sourceClassId,
      sourceClassName:profile.sourceClassName,
      source:profile.sourceClassName,
      sourceUrl:profile.sourceUrl,
      edition:'3.5'
    });
  }
  return {...character,manifesting35:profiles,resources:[...preserved,...resources]};
}
