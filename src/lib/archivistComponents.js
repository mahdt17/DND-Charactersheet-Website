export function archivistMaterial(s){
 const text=String(s.material||''),hasMaterial=(s.components||[]).includes('M')||!!text;
 const costs=[...text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)\b/gi)].map(m=>Number(m[1].replaceAll(',',''))*({cp:.01,sp:.1,ep:.5,gp:1,pp:10}[m[2].toLowerCase()]));
 const consumed=/\bconsum(?:e[sd]?|ing)\b/i.test(text)&&!/(?:not|never) consumed/i.test(text),cost=Math.max(0,...costs);
 return {text,hasMaterial,consumed,cost,required:hasMaterial&&(consumed||cost>0)};
}
export function supplyArchivistComponents(c,s,{componentsConfirmed=false,componentItemId='',fromScroll=false}={}){
 const material=archivistMaterial(s);if(fromScroll||!material.required)return c;
 if(!componentsConfirmed)throw Error('Confirm the required material components, including their stated value. A focus cannot replace costly or consumed components.');
 if(!componentItemId)return c; // Explicitly confirmed supplies tracked at the table.
 const item=c.inventory?.find(i=>i.id===componentItemId);
 if(!item||!Number.isInteger(Number(item.qty))||Number(item.qty)<1)throw Error('Choose an available inventory component bundle.');
 return material.consumed?{...c,inventory:c.inventory.map(i=>i.id===item.id?{...i,qty:Number(i.qty)-1}:i)}:c;
}
