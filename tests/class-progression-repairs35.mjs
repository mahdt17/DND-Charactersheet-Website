import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {progressionRow} from '../src/lib/advancement.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';
const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
for(const [id,maxLevel,expected] of [['classes/black-dog-412',5,'Poison Use'],['classes/elemental-archon-484',10,'Mephit Underlings']]){
 const source=raw.find(r=>r.id===id),before=JSON.stringify(source),definition=normalizeCatalogRecord(source,'dndtools','classes');
 assert(/^(?:Class )?Level$/.test(definition.progression[0][0]),id+' must use character advancement, not an auxiliary source table');
 assert.equal(definition.progression.length,maxLevel+1);
 assert.equal(progressionRow(definition,maxLevel).BAB,id==='classes/black-dog-412'?'+3':'+7');
 assert.deepEqual(definition.sourceAuxiliaryTables.at(-1).table,source.progression,'auxiliary information is preserved outside class advancement');
 assert.equal(definition.sourceBook,source.sourceBook);
 assert.equal(definition.sourceId,id);
 assert.equal(definition.reviewBatch,undefined,'table recovery cannot certify full class integration');
 const character=reconcileClassGrants({ruleset:'3.5',mechanics:'3.5',level:1,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level:1,definition}],actions:[],feats:[],resources:[],spells:[],featureChoices:{}});
 assert(character.grantedFeatures.some(f=>f.name.toLowerCase()===expected.toLowerCase()));
 assert(!character.grantedFeatures.some(f=>/sycophantic|slavish sacrifice/i.test(f.name)),'companion benefits must not become character grants');
 assert.deepEqual(reconcileClassGrants(character),character);
 assert.equal(JSON.stringify(source),before,'catalog normalization must not mutate imported source records');
 const other=normalizeCatalogRecord({...source,id:'test:other-source'},'dndtools','classes');
 assert.deepEqual(other.progression,source.progression,'same-name different source does not inherit repair');
 const wrongBook=normalizeCatalogRecord({...source,sourceBook:'Different source'},'dndtools','classes');
 assert.deepEqual(wrongBook.progression,source.progression,'book mismatch does not inherit repair');
 const custom=[['Level','Special'],['1st','Custom preserved']];
 assert.deepEqual(normalizeCatalogRecord({...source,progression:custom},'dndtools','classes').progression,custom,'repairs only match the known damaged table');
}
console.log('PASS exact-source progression repairs: real class advancement, preserved auxiliary tables, and source isolation.');
