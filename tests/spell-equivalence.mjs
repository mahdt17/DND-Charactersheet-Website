import {ordinarySpellIdentity} from '../src/lib/spellIdentity.js';
import assert from 'node:assert/strict';import {test} from 'node:test';import {permittedSpells} from '../src/lib/editions.js';
const wizard={ruleset:'2014',className:'Wizard',level:6,classDefinition:{name:'Wizard',index:'wizard',edition:'2014'},abilities:{int:16},spells:[]};
test('eligible equivalent 2014 core and reference spell has one candidate',()=>{for(const name of ['Magic Missile','Mage Armor'])assert.equal(permittedSpells(wizard).filter(s=>s.name===name).length,1);});

test('filters class eligibility before choosing an equivalent representative',()=>{const mk=(id,classes)=>({id,catalogId:id,index:id,name:'Test Ward',edition:'2014',category:'spell',level:1,classes,school:'abjuration'});const entries=[mk('2014:test-ward',['Cleric']),mk('wikidot5e:spell:test-ward',['Wizard'])];const matches=permittedSpells(wizard,entries).filter(s=>s.name==='Test Ward');assert.equal(matches.length,1);assert.equal(matches[0].catalogId,'wikidot5e:spell:test-ward');});

test('retains eligible saved reference ID for the owner without changing saved spell settings',()=>{const saved={id:'saved-id',catalogId:'wikidot5e:spell:mage-armor',index:'wikidot5e:spell:mage-armor',edition:'2014',name:'Mage Armor',castingClassId:'2014:wizard',rollFormula:'2d6'};const c={...wizard,spells:[saved]};const matches=permittedSpells(c).filter(s=>s.name==='Mage Armor');assert.equal(matches.length,1);assert.equal(matches[0].catalogId,saved.catalogId);assert.equal(c.spells[0].id,'saved-id');assert.equal(c.spells[0].rollFormula,'2d6');});
test('keeps explicit variants and custom spells distinct',()=>{const mk=(id,extra={})=>({id,catalogId:id,index:id,name:'Test Ward',edition:'2014',category:'spell',level:1,classes:['Wizard'],school:'abjuration',...extra});const entries=[mk('2014:test-ward'),mk('wikidot5e:spell:test-ward'),mk('wikidot5e:spell:test-ward-ua',{sourceBook:'Unearthed Arcana'}),mk('custom:test-ward')];const matches=permittedSpells(wizard,entries).filter(s=>s.name==='Test Ward');assert.equal(matches.length,3);});

test('a different class owner does not select its saved representative for Wizard',()=>{const other={id:'sorcerer-mage',catalogId:'wikidot5e:spell:mage-armor',index:'wikidot5e:spell:mage-armor',edition:'2014',name:'Mage Armor',castingClassId:'2014:sorcerer'};const c={...wizard,spells:[other]};assert.equal(permittedSpells(c).find(s=>s.name==='Mage Armor').catalogId,'2014:mage-armor');assert.equal(c.spells[0].castingClassId,'2014:sorcerer');});

test('same named spells from distinct editions keep separate identities',()=>{assert.notEqual(ordinarySpellIdentity({name:'Mage Armor',edition:'2014',catalogId:'2014:mage-armor'}),ordinarySpellIdentity({name:'Mage Armor',edition:'2024',catalogId:'2024:mage-armor'}));});

test('Wizard optional-list Absorb Elements remains eligible',()=>{assert.equal(permittedSpells(wizard).filter(s=>s.name==='Absorb Elements').length,1);});

test('canonical representative retains its equivalent linked source provenance',()=>{const mage=permittedSpells(wizard).find(s=>s.name==='Mage Armor');assert.equal(mage.sourceUrl,'https://dnd5e.wikidot.com/spell:mage-armor');assert(mage.equivalentSources.some(x=>x.catalogId==='wikidot5e:spell:mage-armor'&&x.url===mage.sourceUrl));});
