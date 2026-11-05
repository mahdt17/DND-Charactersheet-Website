export function previousManifestHistory(state={}){
 const records=[],seen=new Set();
 for(const manifest of [state.lastManifest,...(state.manifestHistory||[])]){
  if(!manifest?.id||seen.has(manifest.id))continue;
  seen.add(manifest.id);records.push(manifest);
 }
 return records;
}
