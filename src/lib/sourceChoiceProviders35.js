const norm=value=>String(value||'').trim().toLowerCase();
const uniqueSorted=values=>[...new Map(values.map(value=>[norm(value),String(value).trim()]).filter(([key,value])=>key&&value)).values()].sort((a,b)=>a.localeCompare(b));
const is35=value=>{
  const edition=norm(value?.edition);
  return !edition||edition==='3.5'||edition==='3.5-reference'||edition.startsWith('3.5');
};

export function sourceChoiceProviderOptions35(provider,{character=null,row=null,context={}}={}){
  if(!provider||typeof provider!=='object')return [];
  const kind=norm(provider.kind);
  if(kind==='weapons'||kind==='weapon'){
    const categories=new Set((Array.isArray(provider.categories)?provider.categories:provider.category?[provider.category]:[]).map(norm));
    return uniqueSorted((context.equipment||[])
      .filter(item=>is35(item)&&(norm(item?.kind)==='weapon'||norm(item?.itemType)==='weapon'))
      .filter(item=>!categories.size||categories.has(norm(item?.itemCategory||item?.bodySlot)))
      .map(item=>item?.name));
  }
  if(kind==='class-skills'||kind==='class-skill'){
    const sourceClassId=provider.sourceClassId||row?.catalogId||row?.sourceClassId||null;
    return uniqueSorted((character?.classSkills35||[])
      .filter(item=>!sourceClassId||item?.sourceClassId===sourceClassId)
      .map(item=>item?.name));
  }
  if(kind==='values')return uniqueSorted(Array.isArray(provider.values)?provider.values:[]);
  return [];
}
