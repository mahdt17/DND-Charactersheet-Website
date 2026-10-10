import {sourceChoiceProviderOptions35} from './sourceChoiceProviders35.js';

// Exact reviewed feat templates; subjects come from finite source metadata or reviewed providers.
const norm=value=>String(value||'').trim().toLowerCase();
export function sourceFeatTemplateOptions35(feature,contextOrFeats=[],scope={}){
  const context=Array.isArray(contextOrFeats)?{feats:contextOrFeats}:contextOrFeats||{};
  const feats=Array.isArray(context.feats)?context.feats:[];
  const candidates=[];
  for(const template of Array.isArray(feature?.choiceFeatTemplates)?feature.choiceFeatTemplates:[]){
    if(!template?.featId)continue;
    const matches=feats.filter(feat=>(feat.edition||'3.5')==='3.5'&&(feat.catalogId||feat.sourceId||feat.id)===template.featId);
    if(matches.length!==1||!String(matches[0].name||'').trim())continue;
    const canonical=matches[0];
    const subjects=Array.isArray(template.subjects)?template.subjects:sourceChoiceProviderOptions35(template.subjectProvider,{...scope,context});
    for(const raw of subjects){
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
