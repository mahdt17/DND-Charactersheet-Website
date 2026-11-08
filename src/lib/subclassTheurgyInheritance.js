import mechanics from '../data/subclassMechanics2014.json' with {type:'json'};
import {findExpandedSubclass} from './expandedSubclassCatalog.js';
const id='2014:subclass:wizard:theurgy-ua';
const milestone=level=>({1:6,2:2,6:10,17:14})[level];
// Inherited benefits keep their printed Cleric/Wisdom formulas. Only acquisition
// milestones and Channel pool/DC belong to Wizard. No domain spell table grant.
export function theurgyDomainProjection(record,state={}){
 if(record?.id!==id)return {record};
 const domain=findExpandedSubclass('Cleric',state['divine-domain']?.[0]);if(!domain)return {record};
 const prefix=`domain:${domain.index}:`,fid=value=>`${id}:${prefix}${value.split(':').at(-1)}`;
 const features=domain.features.filter(f=>milestone(f.level)&&!/^Bonus Proficiency$/.test(f.name)).map(f=>({...f,id:fid(f.id),level:milestone(f.level),inheritedRecordId:domain.id,inheritedFeatureId:f.id,sourceDomain:domain.name}));
 const ids=new Set(features.map(f=>f.inheritedFeatureId)),data=mechanics.find(m=>m.recordId===domain.id),extra={};
 for(const kind of ['actions','resources','passives','training','choices'])extra[kind]=(data?.[kind]||[]).filter(x=>ids.has(x.featureId)&&!(kind==='training'&&['armor-proficiency','weapon-proficiency','armor','weapon'].includes(x.kind))).map(x=>({...x,level:milestone(x.level),featureId:fid(x.featureId),inheritedRecordId:domain.id,inheritedFeatureId:x.featureId,inheritedLevel:x.level,sourceDomain:domain.name,...(x.key?{key:prefix+x.key}:{}),...(x.resourceKey?{resourceKey:x.resourceKey==='base:channel-divinity'?'channel-arcana':prefix+x.resourceKey}:{}),...(x.dependsOn?{dependsOn:prefix+x.dependsOn}:{}),...(x.when?.choice?{when:{...x.when,choice:prefix+x.when.choice}}:{}),...(x.excludeDuplicatesAcross?{excludeDuplicatesAcross:x.excludeDuplicatesAcross.map(k=>prefix+k)}:{})}));
 return {record:{...record,features:[...record.features,...features]},domain,extra};
}
export const inheritedContext=(context,item)=>item?.inheritedRecordId?{...context,level:context.clericlevel||0}:context;
