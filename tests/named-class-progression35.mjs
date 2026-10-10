import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {progressionTables,progressionRow} from '../src/lib/advancement.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const fixtures=[
 ['classes/elven-high-mage-697','Seed affinity'],
 ['classes/guardian-paramount-457','uncanny dodge enabler'],
 ['classes/legendary-dreadnought-459','Unstoppable']
];
const character=(definition,level)=>({ruleset:'3.5',mechanics:'3.5',level,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},feats:[],actions:[{id:'manual',name:'Manual'}],resources:[],spells:[],featureChoices:{}});
for(const [id,expected] of fixtures){
 const definition=normalizeCatalogRecord(raw.find(r=>r.id===id),'dndtools','classes'),original=JSON.stringify(definition);
 assert.equal(progressionTables(definition)[0][0][0],'Level',id+' named class-level header must be usable by generic progression consumers');
 assert.equal(progressionRow(definition,10).Level,'10th');
 const first=reconcileClassGrants(character(definition,1));
 assert(first.grantedFeatures.some(f=>f.name.toLowerCase().includes(expected.toLowerCase())),id+' must expose its level-one grants');
 const last=reconcileClassGrants(character(definition,10));
 assert(last.grantedFeatures.length>0);
 assert.deepEqual(reconcileClassGrants(last),last);
 const survivor={catalogId:'test:survivor',name:'Survivor',edition:'3.5',level:1,definition:{name:'Survivor',edition:'3.5'}};
 const removed=removeClassProgression({...last,level:11,classLevels:[...last.classLevels,survivor]},definition.catalogId);
 assert(!removed.grantedFeatures.some(f=>f.sourceClassId===definition.catalogId));
 assert(removed.actions.some(a=>a.id==='manual'));
 assert.equal(JSON.stringify(definition),original,'parser must not mutate canonical source data');
}
for(const id of ['classes/death-master-974','classes/drow-judicator-898','classes/elemental-archon-484','classes/skylord-151']){
 const definition=raw.find(r=>r.id===id);
 assert.equal(progressionTables(definition)[0][0][0],definition.progression[0][0],id+' companion table must not be interpreted as class progression');
}
const table=[['Sentinel Level','Special'],['1st','First benefit'],['2nd','Second benefit']];
assert.equal(progressionTables({name:'Other Class',progression:table})[0][0][0],'Sentinel Level','name mismatch cannot normalize another class table');
assert.equal(progressionTables({name:'Sentinel',progression:[table[0],['1—2','Shared benefit']]})[0][0][0],'Sentinel Level','level ranges remain unclaimed');
console.log('PASS named class-level tables: feature unlocks, source immutability, lifecycle, and companion-table exclusion.');
