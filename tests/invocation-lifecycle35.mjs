import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as inv from '../src/lib/invocationAcquisition35.js';
import {reconcileClassGrants,annotateClassGrantKinds} from '../src/lib/classIntegration.js';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
const classes=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json')).map(c=>normalizeCatalogRecord(c,'dndtools','classes'));
for(const [id,name,first,second] of [
 ['classes/warlock-4','Warlock','Baleful Utterance','Beguiling Influence'],
 ['classes/dragonfire-adept-29','Dragonfire Adept','Beguiling Influence','Draconic Knowledge']
]){
 const key='dndtools:'+id,definition=annotateClassGrantKinds(classes.find(c=>c.catalogId===key),classes);
 const row={catalogId:key,name,edition:'3.5',level:1,definition};
 const c={ruleset:'3.5',className:name,classDefinition:definition,classLevels:[row],level:1,abilities:{cha:16},spells:[],features:[],actions:[],resources:[]};
 const catalog=inv.invocationCatalog35(key),a=catalog.find(x=>x.name===first),b=catalog.find(x=>x.name===second);
 const events=inv.invocationEvents35(c,{classId:key,targetClassLevel:1});
 assert.equal(typeof inv.applyInvocationChoices35,'function','Setup and advancement must share one validated invocation selection adapter');
 assert.throws(()=>inv.applyInvocationChoices35(c,events,{}),/choose|complete/i);
 assert.throws(()=>inv.applyInvocationChoices35(c,events,{[events[0].eventId]:['forged-id']}),/choose|catalog/i);
 const created=inv.applyInvocationChoices35(c,events,{[events[0].eventId]:[a.catalogId]});
 assert.equal(created.spells.filter(s=>s.invocationGrant&&s.castingClassId===key).length,1);
 const nextLevel=name==='Warlock'?2:3,next={...created,level:nextLevel,classLevels:[{...row,level:nextLevel}]};
 const gains=inv.invocationEvents35(next,{classId:key,previousClassLevel:nextLevel-1,targetClassLevel:nextLevel}),choose=gains.find(e=>e.required);
 const advanced=inv.applyInvocationChoices35(next,gains,{[choose.eventId]:[b.catalogId]});
 assert.equal(advanced.spells.filter(s=>s.invocationGrant).length,2);
 assert.equal(inv.invocationEvents35(advanced,{classId:key,previousClassLevel:nextLevel-1,targetClassLevel:nextLevel}).length,0,'Declining replacement closes that opportunity');
 const saved=JSON.parse(JSON.stringify(advanced));
 assert.equal(reconcileClassGrants(saved).spells.filter(s=>s.invocationGrant).length,2);
 const removed=reconcileClassGrants({...saved,classLevels:[],className:'',classDefinition:null});
 assert(!removed.spells.some(s=>s.invocationGrant),'Class reconciliation removes invocation grants');
 assert.equal(reconcileClassGrants({...removed,classLevels:saved.classLevels,className:name,classDefinition:definition}).spells.filter(s=>s.invocationGrant).length,2);
 const replace=gains.find(e=>!e.required),other=catalog.find(x=>x.grade==='least'&&![a.catalogId,b.catalogId].includes(x.catalogId));
 assert.throws(()=>inv.applyInvocationChoices35(next,gains,{[choose.eventId]:[b.catalogId],[replace.eventId]:{skip:false,removedInvocationKey:b.catalogId,addedInvocationKey:other.catalogId}}),/previous|earlier|already knew/i,'The just-learned invocation cannot also be replaced');
}
console.log('PASS shared invocation setup/advancement selections, skipped replacements, persistence and class removal/restoration');
