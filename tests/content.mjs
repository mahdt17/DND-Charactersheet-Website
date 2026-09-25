import assert from 'node:assert/strict';
import {normalizeContentEntry,auditContent,normalizeEdition,contentType} from '../src/lib/content.js';

assert.equal(normalizeEdition('3.5-reference'),'3.5');
assert.equal(normalizeEdition('5e'),'2014');
assert.equal(normalizeEdition('5.5e'),'2024');
assert.equal(contentType('classes'),'class');
assert.equal(contentType('equipment'),'item');

const spell=normalizeContentEntry({
  index:'fireball',
  name:'Fireball',
  edition:'2014',
  category:'spell',
  source:'SRD 5.1',
  desc:['A bright streak flashes toward a point you choose.'],
  level:3,
  school:{name:'Evocation'},
  casting_time:'1 action',
  range:'150 feet',
  duration:'Instantaneous',
  components:['V','S','M'],
  classes:[{name:'Wizard'},{name:'Sorcerer'}]
});
assert.equal(spell.contentType,'spell');
assert.equal(spell.stats.level,3);
assert.equal(spell.stats.school,'Evocation');
assert.deepEqual(spell.stats.classes,['Wizard','Sorcerer']);
assert.equal(spell.completeness.hasDescription,true);
assert.equal(spell.completeness.hasStats,true);
assert.equal(spell.completeness.hasSource,true);

const legacyClass=normalizeContentEntry({
  index:'duelist',
  name:'Duelist',
  edition:'3.5',
  category:'class',
  source:'SRD 3.5',
  description:'A prestige class for agile melee combatants.',
  hit_die:10,
  prestige:true,
  prerequisites:['Base Attack Bonus +6','Perform 3 ranks'],
  tables:[[['Level','BAB'],['1st','+1']]]
});
assert.equal(legacyClass.stats.hitDie,10);
assert.equal(legacyClass.stats.prestige,true);
assert.equal(legacyClass.prerequisites.length,2);
assert.equal(legacyClass.completeness.complete,true);

const reference=normalizeContentEntry({
  id:'dndtools:classes/example-1',
  name:'Example Prestige Class',
  edition:'3.5-reference',
  category:'classes',
  source:'DnD Tools',
  url:'https://new.dndtools.org/classes/example-1',
  referenceOnly:true
});
assert.equal(reference.edition,'3.5');
assert.equal(reference.contentType,'class');
assert.equal(reference.completeness.complete,false);
assert(reference.completeness.missing.includes('description'));
assert(reference.completeness.missing.includes('progression'));

const item=normalizeContentEntry({
  name:'Longsword',
  edition:'2014',
  category:'equipment',
  source:'SRD 5.1',
  description:'A martial melee weapon.',
  equipment_category:{name:'Weapon'},
  weight:3,
  damage:{damage_dice:'1d8'}
});
assert.equal(item.contentType,'item');
assert.equal(item.stats.itemType,'Weapon');
assert.equal(item.stats.weight,3);

const audit=auditContent([spell,legacyClass,reference,item]);
assert.equal(audit.total,4);
assert.equal(audit.incomplete,1);
assert.equal(audit.missing.description,1);
assert.equal(audit.byType.class.total,2);

console.log('PASS canonical content normalization, completeness flags, source metadata and audit counts');
