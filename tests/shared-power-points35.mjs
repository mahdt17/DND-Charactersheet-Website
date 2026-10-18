import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';
import {classCharacter} from '../src/lib/advancement.js';
import {powerPointReserve,spendPower,specialCastingProfile} from '../src/lib/legacySpecialCasting.js';
import {characterResources,adjustResource,restResources} from '../src/lib/resources.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const row=(name,level)=>{const definition=catalog.find(r=>r.name===name&&!r.prestige);return {name,level,definition,catalogId:definition.catalogId,edition:'3.5'};};
const psion=row('Psion',3),warrior=row('Psychic Warrior',2),fighter=row('Fighter',1);
const make=classLevels=>({ruleset:'3.5',classLevels,level:classLevels.reduce((n,r)=>n+r.level,0),abilities:{int:18,wis:16,cha:16},resources:[],spells:[],actions:[],feats:[],featureChoices:{}});
const pool=c=>characterResources(c).filter(r=>r.manifesting35);
let c=reconcileClassGrants(make([psion,warrior]));
assert.equal(pool(c).length,1,'multiclass manifesters must expose one shared reserve');
assert.equal(pool(c)[0].max,21,'11+6 Psion PP and 1+3 Psychic Warrior PP');
assert.equal(powerPointReserve(c).maximum,21);
c={...c,...adjustResource(c,pool(c)[0].id,3)};
assert.equal(c.powerPointsUsed,3,'tracker spending writes canonical expenditure');
const power={name:'Test power',edition:'3.5',level:1,school:'Psychokinesis',classes:['Psion'],classLevels:{Psion:1}};
c={...c,...spendPower(c,classCharacter(c,psion),power,3)};
assert.equal(pool(c)[0].used,6,'manifestation updates the tracker without stale counter usage');
assert.equal(powerPointReserve(c).remaining,15);
assert.throws(()=>adjustResource(c,pool(c)[0].id,16),/Not enough/);
c=reconcileClassGrants(JSON.parse(JSON.stringify(c)));
assert.equal(c.powerPointsUsed,6);
assert.equal(pool(c)[0].used,6);
c={...c,...adjustResource(c,pool(c)[0].id,-2)};
assert.equal(powerPointReserve(c).remaining,17);
assert.equal(restResources(c,'short').powerPointsUsed,undefined);
c={...c,...restResources(c,'long')};
assert.equal(c.powerPointsUsed,0);
assert.equal(pool(c)[0].used,0);

const legacy=[{id:'old-psion',manifesting35:true,used:3},{id:'old-warrior',manifesting35:true,used:2}];
const custom={id:'custom',name:'Personal PP notes',max:7,used:2,manual:true};
c=reconcileClassGrants({...make([psion,warrior]),resources:[...legacy,custom]});
assert.equal(c.powerPointsUsed,5,'old per-class usage migrates when canonical usage is absent');
assert.equal(reconcileClassGrants(c).powerPointsUsed,5,'migration is idempotent');
assert.deepEqual(c.resources.find(r=>r.id==='custom'),custom);
for(const operation of [save=>adjustResource(save,'custom',1),save=>restResources(save,'short')]){
 const legacySave={...make([psion,warrior]),resources:[...legacy,custom]};
 const updated={...legacySave,...operation(legacySave)};
 assert.equal(powerPointReserve(updated).used,5,'resource operations must preserve migration before normalization');
 assert.equal(reconcileClassGrants(updated).powerPointsUsed,5);
}
const removedLegacy={...make([fighter]),resources:legacy};
assert.equal(reconcileClassGrants({...removedLegacy,...restResources(removedLegacy,'short')}).powerPointsUsed,5,'migration survives removal of the last manifester');
for(const used of [0,4]){
 const canonical=reconcileClassGrants({...make([psion]),powerPointsUsed:used,resources:legacy});
 assert.equal(canonical.powerPointsUsed,used,'explicit canonical spending takes precedence');
 assert.equal(pool(canonical)[0].used,used);
}
c=reconcileClassGrants({...make([psion,warrior,fighter]),powerPointsUsed:20});
c=removeClassProgression(c,warrior.catalogId);
assert.equal(pool(c)[0].max,17);
assert.equal(c.powerPointsUsed,20,'class removal must not refund expenditure');
assert.equal(powerPointReserve(c).remaining,0);
c=removeClassProgression(c,psion.catalogId);
assert.equal(pool(c).length,0);
assert.equal(c.powerPointsUsed,20);

const advanced={...make([row('Psion',2)]),castingAdvancements:[{id:'advance',sourceClassId:'test-prestige',targetClassId:psion.catalogId,kind:'psionic',amount:1}]};
c=reconcileClassGrants(advanced);
assert.equal(c.manifesting35[0].powerPointsMax,11);
assert.equal(pool(c)[0].max,17,'prestige advancement contributes base and bonus PP exactly once');
assert.equal(specialCastingProfile(classCharacter(c,c.classLevels[0])).points,17);
c=reconcileClassGrants({...c,powerPointBonus:{amount:4,source:'Reviewed bonus'},abilityBonuses:{int:2}});
assert.equal(pool(c)[0].max,22,'ability and sourced additional bonuses feed the same reserve');
assert.equal(powerPointReserve(c).maximum,22);
assert.equal(powerPointReserve({...c,powerPointBonus:{amount:100}}).maximum,18,'unsourced bonuses do not apply');
const modern={...make([{...psion,edition:'2014',definition:{...psion.definition,edition:'2014'}}]),ruleset:'2014'};
assert.equal(pool(reconcileClassGrants(modern)).length,0);
assert.equal(powerPointReserve(modern).maximum,0);
assert.equal(pool({...modern,powerPointBonus:{amount:5,source:'Old bonus'}}).length,0,'bonus-only state must not expose a legacy pool in another edition');
console.log('PASS shared PP: pooling, bonus, spending, migration, persistence, rest, prestige and removal');
