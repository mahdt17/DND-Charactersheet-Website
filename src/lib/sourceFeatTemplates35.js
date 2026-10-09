// Exact reviewed feat templates; subjects are supplied by source metadata.
const norm=value=>String(value||'').trim().toLowerCase();
export function sourceFeatTemplateOptions35(feature,feats=[]){
  const candidates=[];
  for(const template of Array.isArray(feature?.choiceFeatTemplates)?feature.choiceFeatTemplates:[]){
    if(!template?.featId||!Array.isArray(template.subjects))continue;
    const matches=feats.filter(feat=>(feat.edition||'3.5')==='3.5'&&(feat.catalogId||feat.sourceId||feat.id)===template.featId);
    if(matches.length!==1||!String(matches[0].name||'').trim())continue;
    const canonical=matches[0];
    for(const raw of template.subjects){
      if(typeof raw!=='string'||!raw.trim())continue;
      const subject=raw.trim(),name=canonical.name+' ('+subject+')';
      candidates.push({name,feat:{...canonical,catalogId:template.featId,name,featTemplateId:template.featId,featTemplateName:canonical.name,featSubject:subject}});
    }
  }
  const byName=new Map();
  for(const option of candidates){
    const key=norm(option.name),existing=byName.get(key);
    if(!byName.has(key))byName.set(key,option);
    else if(existing?.feat.featTemplateId!==option.feat.featTemplateId)byName.set(key,null);
  }
  return [...byName.values()].filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
}
