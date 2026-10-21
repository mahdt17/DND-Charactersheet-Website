import {entomancerProfile} from './entomancer.js';
import {entomancerId,isEntomancerSpellListEntry} from '../data/entomancer.js';
const key=s=>s.catalogId||`${s.edition||'2014'}:${s.index||s.name}`;
export function prepareEntomancerSpells(c,classId,selection,{hour=false}={}){
 const p=entomancerProfile(c);if(!p.level||classId!==entomancerId)throw Error('No supported Entomancer spellcasting class.');
 const primary=c.classLevels?.[0]?.catalogId||c.classDefinition?.catalogId;
 const owned=s=>(s.castingClassId||primary)===classId&&!s.auto&&!s.featGrantId;
 const current=(c.spells||[]).filter(owned),maxLevel=p.slots.reduce((m,n,i)=>n?i:m,0),daily={...c.entomancer?.daily};
 if(new Set(selection.map(key)).size!==selection.length)throw Error('Choose each spell only once.');
 for(const s of selection){if(!isEntomancerSpellListEntry(s))throw Error('Choose spells from the 2014 Druid list.');if(!Number.isInteger(s.level)||s.level<0||s.level>maxLevel)throw Error('This spell level is not available to your Entomancer class.');}
 for(const cantrip of [true,false]){
  const old=current.filter(s=>(s.level===0)===cantrip),next=selection.filter(s=>(s.level===0)===cantrip),limit=cantrip?p.cantrips:p.prepared;
  if(next.length>limit)throw Error(`Choose no more than ${limit} ${cantrip?'cantrips':'prepared spells'}.`);
  const removed=old.filter(s=>!next.some(n=>key(n)===key(s))).length,flag=cantrip?'cantripSwap':'preparedSwap';
  if(removed){if(!hour)throw Error('Confirm one hour of study to exchange spells.');if(daily[flag])throw Error('This spell exchange was already used before your next long rest.');if(removed>(cantrip?1:Math.max(0,p.wis)))throw Error('Too many spells exchanged for this class feature.');daily[flag]=true;}
 }
 return {...c,entomancer:{...c.entomancer,daily},spells:[...(c.spells||[]).filter(s=>!owned(s)),...selection.map(s=>({...s,id:current.find(x=>key(x)===key(s))?.id||crypto.randomUUID(),castingClassId:classId,prepared:true}))]};
}
