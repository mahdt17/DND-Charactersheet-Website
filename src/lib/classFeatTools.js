import {characterClasses,contentKey} from './advancement.js';
import {campaignKind} from './archivistCampaign.js';
import {conversionFeatOwned} from './conversionFeatures.js';

export function classFeatTools(c){
 if((c.ruleset||'2014')!=='2014')return [];
 const classes=characterClasses(c).filter(r=>r.level>0&&r.edition==='2014'&&r.name!=='Entomancer').map(row=>({id:'class:'+contentKey(row.definition||row),kind:'class',name:row.name,level:row.level,adapter:campaignKind(row.definition||row),record:row}));
 const seen=new Map();
 const feats=(c.feats||[]).filter(f=>(f.edition||'2014')==='2014').map(f=>{const key=f.id||contentKey(f),count=seen.get(key)||0;seen.set(key,count+1);return {id:'feat:'+key+(count?':'+count:''),kind:'feat',name:f.name,adapter:conversionFeatOwned(c,f.name)?f.name:'',record:f};});
 return [...classes,...feats];
}
