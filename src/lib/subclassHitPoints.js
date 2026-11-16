import mechanics from '../data/subclassMechanics2014.json' with {type:'json'};
import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {subclassValue} from './subclassFormulas.js';

const byId=new Map(mechanics.map(m=>[m.recordId,m]));
// The sheet and pure advancement share these unconditional entry-level grants.
// Callers provide normalized class rows: this module must not import advancement
// or the rules/editions graph, which itself depends on advancement.
export function subclassHitPointBonus(c,rows){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014')return 0;
 return rows.reduce((sum,row)=>{
  const record=row.edition==='2014'&&!row.definition?.homebrew?findExpandedSubclass(row.name,row.subclass):null;
  if(!record||row.level<record.entryLevel)return sum;
  return sum+(byId.get(record.id)?.passives||[]).filter(p=>p.kind==='hp-max-bonus'&&!p.condition&&Number(p.level||1)<=row.level&&(!record.flexibleFeatureSelection||Number(p.level||1)<=record.entryLevel)).reduce((n,p)=>n+subclassValue(p.value,{level:row.level}),0);
 },0);
}
