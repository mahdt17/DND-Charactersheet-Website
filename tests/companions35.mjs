import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

let engine;
try {
  engine=await import('../src/lib/companions35.js');
} catch (error) {
  assert.fail('3.5 companion engine must exist before these regressions can pass: '+error.message);
}

const {
  COMPANION_ENGINE_VERSION,
  companionCreature35,
  companionChoiceOptions35,
  companionProgression35,
  companionEffectiveLevel35
}=engine;

assert.equal(COMPANION_ENGINE_VERSION,1);

for (const [query,id] of [
  ['Wolf','monsters/wolf-596'],
  ['Ape','monsters/ape-531'],
  ['Raven','monsters/raven-575'],
  ['Imp','monsters/devil-imp-73'],
  ['Warhorse, Heavy','monsters/warhorse-heavy-555'],
  ['Unicorn','monsters/unicorn-500']
]) {
  const creature=companionCreature35(query);
  assert(creature,query+' must resolve from the source-locked 3.5 companion catalog');
  assert.equal(creature.id,id,query+' exact 3.5 source identity');
  assert.equal(creature.edition,'3.5');
  assert.match(creature.sourceUrl,/dndtools\.org\/monsters\//);
}
assert.equal(companionCreature35('Adult Red Dragon'),null,'unpopulated creatures fail closed');

const wolf=companionCreature35('Wolf');
assert.equal(wolf.hp,13);
assert.deepEqual(wolf.ac,{total:14,touch:12,flatFooted:12});
assert.deepEqual(wolf.abilities,{str:13,dex:15,con:15,int:2,wis:12,cha:6});

const ape=companionCreature35('Ape');
assert.equal(ape.hp,29);
assert.equal(ape.abilities.str,21);

const raven=companionCreature35('Raven');
assert.equal(raven.hp,1);
assert.equal(raven.size,'Tiny');

const imp=companionCreature35('Imp');
assert.equal(imp.type,'Outsider');
assert.equal(imp.ac.total,18);

const horse=companionCreature35('Warhorse, Heavy');
assert.equal(horse.hp,30);
assert.equal(horse.speed.land,50);

const unicorn=companionCreature35('Unicorn');
assert.equal(unicorn.hp,42);
assert.equal(unicorn.abilities.cha,24);

const animal1=companionProgression35('druid-animal-companion',1);
assert.deepEqual(
  {
    bonusHD:animal1.bonusHD,
    naturalArmorAdjustment:animal1.naturalArmorAdjustment,
    strDexAdjustment:animal1.strDexAdjustment,
    bonusTricks:animal1.bonusTricks,
    specialAbilities:animal1.specialAbilities
  },
  {bonusHD:0,naturalArmorAdjustment:0,strDexAdjustment:0,bonusTricks:1,specialAbilities:['Link','Share Spells']}
);
const animal4=companionProgression35('druid-animal-companion',4);
assert.equal(animal4.bonusHD,2);
assert.equal(animal4.naturalArmorAdjustment,2);
assert.equal(animal4.strDexAdjustment,1);
assert.equal(animal4.bonusTricks,2);
assert(animal4.specialAbilities.includes('Evasion'));

const animalOptions1=companionChoiceOptions35('druid-animal-companion',1);
assert(animalOptions1.some(x=>x.name==='Wolf'));
assert(animalOptions1.some(x=>x.name==='Shark (Medium)'));
assert(!animalOptions1.some(x=>x.name==='Ape'));
const animalOptions4=companionChoiceOptions35('druid-animal-companion',4);
assert(animalOptions4.some(x=>x.name==='Ape'&&x.levelAdjustment===3));
assert(animalOptions4.some(x=>x.name==='Crocodile'));
assert(!animalOptions4.some(x=>x.name==='Dire Wolf'));

const familiar1=companionProgression35('standard-familiar',1);
assert.equal(familiar1.naturalArmorAdjustment,1);
assert.equal(familiar1.intelligence,6);
for(const name of ['Alertness','Improved Evasion','Share Spells','Empathic Link'])assert(familiar1.specialAbilities.includes(name));
const familiar7=companionProgression35('standard-familiar',7);
assert.equal(familiar7.naturalArmorAdjustment,4);
assert.equal(familiar7.intelligence,9);
assert(familiar7.specialAbilities.includes('Speak with Animals of Its Kind'));

const mount5=companionProgression35('paladin-special-mount',5);
assert.equal(mount5.bonusHD,2);
assert.equal(mount5.naturalArmorAdjustment,4);
assert.equal(mount5.strengthAdjustment,1);
assert.equal(mount5.intelligence,6);
for(const name of ['Empathic Link','Improved Evasion','Share Spells','Share Saving Throws'])assert(mount5.specialAbilities.includes(name));

const healer8=companionProgression35('healer-companion',8);
assert.equal(healer8.bonusHD,0);
assert.equal(healer8.naturalArmorAdjustment,0);
assert.equal(healer8.strDexIntAdjustment,0);
for(const name of ['Empathic Link','Improved Evasion','Share Saving Throws','Share Spells'])assert(healer8.specialAbilities.includes(name));

assert.equal(companionEffectiveLevel35([{level:8,mode:'fraction',numerator:1,denominator:2}],3),1,'Ranger-style half level and alternative adjustment');
assert.equal(companionEffectiveLevel35([{level:6,mode:'full'},{level:4,mode:'minus',amount:3}]),7,'familiar-granting classes can contribute different formulas');
assert.equal(companionEffectiveLevel35([{mode:'fixed',amount:5}],0),5);
assert.equal(companionEffectiveLevel35([{level:2,mode:'minus',amount:3}],0),0,'contributions never go negative');

const moduleText=await fs.readFile(new URL('../src/lib/companions35.js',import.meta.url),'utf8');
assert(!moduleText.includes("from '../data/monsters.json'"),'3.5 companion engine must never import the 5e monster catalog');

console.log('PASS 3.5 companion catalog, legal options, progression profiles, and effective-level math');
