import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const e=await server.ssrLoadModule('/src/lib/editions.js'),s=await server.ssrLoadModule('/src/lib/legacySpecialCasting.js'),a=await server.ssrLoadModule('/src/lib/advancement.js'),m=await server.ssrLoadModule('/src/lib/multiclassCasting.js'),{normalizeCatalogRecord}=await server.ssrLoadModule('/src/lib/catalog.js');
 const classes=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json')).map(c=>normalizeCatalogRecord(c,'dndtools','classes'));
 const row=(name,level)=>{const definition=classes.find(c=>c.name===name);return {definition,name,level,edition:'3.5',catalogId:definition.catalogId};};
 const character=rows=>({ruleset:'3.5',classLevels:rows,className:rows[0].name,classDefinition:rows[0].definition,level:rows.reduce((n,r)=>n+r.level,0),abilities:{int:18,wis:16,cha:16},spells:[]});
 const c=character([row('Psion',3),row('Psychic Warrior',2)]),psion=a.classCharacter(c,c.classLevels[0]),warrior=a.classCharacter(c,c.classLevels[1]);
 assert.equal(s.specialCastingProfile(psion).points,17);assert.equal(s.specialCastingProfile(warrior).points,4);assert.equal(s.powerPointReserve(c).maximum,21);
 const power={name:'Sample power',edition:'3.5',catalogId:'sample-power',level:1,school:'Psychokinesis',classes:['Psion'],classLevels:{Psion:1}};
 assert(e.spellAccess(psion,power).allowed);assert(!e.spellAccess(warrior,power).allowed);assert(!e.spellAccess(psion,{...power,level:3,classLevels:{Psion:3}}).allowed);assert(!e.spellAccess(psion,{...power,school:'Evocation'}).allowed);
 assert.equal(s.spendPower(c,psion,power,3).powerPointsUsed,3);assert.throws(()=>s.spendPower(c,psion,power,4));assert.throws(()=>s.spendPower({...c,powerPointsUsed:21},psion,power,1));assert.throws(()=>s.spendPower(c,psion,power,1.5));
 const disciplinePower={...power,classes:['Kineticist'],classLevels:{Kineticist:1}};assert(!e.spellAccess(psion,disciplinePower).allowed);assert(e.spellAccess({...psion,legacyCastingChoices:{[psion.activeCastingClassId]:{discipline:'Psychokinesis'}}},disciplinePower).allowed);
 for(const level of [1,5,6,10,11,15,16,20]){const w=character([row('Warlock',level)]),profile=s.specialCastingProfile(w);assert(profile.known>0);for(const [grade,name] of ['Least','Lesser','Greater','Dark'].entries()){const invocation={name:'Invocation',edition:'3.5',level:1,school:name+' Invocation',classes:['Warlock']};assert.equal(e.spellAccess(w,invocation).allowed,grade<=profile.grade);}}
 for(const definition of classes.filter(x=>x.name==='Sorcerer')){const sorcerer={...character([row('Sorcerer',1)]),classLevels:undefined,classDefinition:definition};assert.equal(e.characterSlots(sorcerer)[0],5);assert.equal(e.characterSlots(sorcerer)[1],4);assert.deepEqual(a.baseProgression(definition,1),{bab:0,fort:0,ref:0,will:2});assert.equal(e.characterSlots({...sorcerer,level:20})[9],6);}
 const mixed={ruleset:'custom',classLevels:[{name:'Warlock',edition:'2014',catalogId:'w',level:3},{name:'Wizard',edition:'3.5',catalogId:'z',level:3}],classSlotsUsed:{w:{2:1},z:{1:2}},classRestrictedSlotsUsed:{z:{specialist:{1:1}}},powerPointsUsed:3};
 const short=m.restSpellSlots(mixed,'short');assert.deepEqual(short.classSlotsUsed.w,{});assert.deepEqual(short.classSlotsUsed.z,{1:2});assert.equal(short.powerPointsUsed,undefined);const long=m.restSpellSlots(mixed,'long');assert.deepEqual(long.classRestrictedSlotsUsed,{});assert.equal(long.powerPointsUsed,0);
 console.log('PASS shared psionic reserve, class/discipline/level/ability access, manifester spending caps, invocation grades/counts, four Sorcerer repairs and mixed-edition recovery');
}finally{await server.close();}
