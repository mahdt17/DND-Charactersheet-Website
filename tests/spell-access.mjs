import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try {
 const e=await server.ssrLoadModule('/src/lib/editions.js');
 const a=await server.ssrLoadModule('/src/lib/advancement.js');
 const integration=await server.ssrLoadModule('/src/lib/classIntegration.js');
 const {createCatalogService}=await server.ssrLoadModule('/src/lib/catalog.js');
 const svc=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
 const [classes35,spells35,classes14,spells14]=await Promise.all([svc.load('3.5/classes'),svc.load('3.5/spells'),svc.load('2014/classes'),svc.load('2014/spells')]);
 const core14=JSON.parse(await fs.readFile('src/data/classes.json','utf8'));
 const make=(name,edition='2014',level=1)=>({className:name,ruleset:edition,level,abilities:{str:16,dex:16,con:16,int:18,wis:18,cha:18},classDefinition:{...(edition==='3.5'?classes35:edition==='2024'?e.modern.classes:classes14).find(c=>c.name===name),edition},spells:[]});
 const named=(name,edition='2014')=>e.allSpells.find(s=>s.name===name&&s.edition===edition);
 let checked=0;
 for(const edition of ['2014','2024'])for(const cls of edition==='2014'?core14:e.modern.classes)for(const level of Array.from({length:20},(_,i)=>i+1)){
  const char=make(cls.name,edition,level),choices=e.permittedSpells(char,edition==='2014'?spells14:[]);
  for(const s of choices){assert(s.classes.includes(cls.name),`${edition} ${cls.name} must not see ${s.name}`);assert.equal(s.edition,edition);assert(e.spellAccess(char,s).allowed);}
  if(['Fighter','Rogue','Barbarian','Monk'].includes(cls.name))assert.equal(choices.length,0);
  checked++;
 }
 for(const edition of ['2014','2024','3.5']){
  const cleric=make('Cleric',edition,3),extras=edition==='3.5'?spells35:[];
  const options=e.permittedSpells(cleric,extras);
  assert(options.length>0,`${edition} cleric has spells`);
  assert(!options.some(s=>s.name==='Magic Missile'));
  assert(!e.spellAccess({...cleric,slotOverride:Array(10).fill(20)},named('Fireball',edition)).allowed);
  const fake={name:'Unverified wizard spell',catalogId:'bad',category:'spell',edition,classes:['Wizard'],level:1,referenceOnly:true};
  assert(!e.permittedSpells(cleric,[fake]).some(s=>s.catalogId==='bad'));
 }
 const cleric=make('Cleric','2014',1),wizard=make('Wizard','2014',5);
 const rows=[cleric,wizard].map(c=>({catalogId:a.contentKey(c.classDefinition),name:c.className,edition:c.ruleset,level:c.level,definition:c.classDefinition}));
 const multi={...cleric,classLevels:rows,level:6};
 assert(e.spellAccess(multi,named('Fireball')).allowed);
 assert(!e.spellAccess(a.classCharacter(multi,rows[0]),named('Fireball')).allowed);
 assert(!e.spellAccess(a.classCharacter(multi,rows[0]),named('Aid')).allowed);
 assert(e.spellAccess({...multi,classLevels:[rows[0]],level:1}, {...named('Magic Missile'),castingClassId:rows[1].catalogId}).allowed===false);
 const grants={...cleric,spellAccessGrants:[{classId:rows[0].catalogId,spellId:e.keyOf(named('Magic Missile')),source:'Test subclass',classLevel:1}]};
 assert(e.spellAccess(grants,named('Magic Missile')).allowed);assert(!e.spellAccess(grants,named('Fireball')).allowed);
 assert(!e.spellAccess({...grants,spellAccessGrants:[]},named('Magic Missile')).allowed);
 assert(!e.spellAccess({...cleric,ruleset:'custom'},named('Magic Missile')).allowed);
 assert(e.spellAccess({...cleric,ruleset:'custom',unrestrictedSpellAccess:true},named('Magic Missile','2024')).allowed);
 const c35=make('Cleric','3.5',1),profile=integration.spellSlotProgression(c35.classDefinition,1);
 assert.equal(profile.slots[1],1);assert.equal(profile.restrictedSlots[1],1);assert.deepEqual(profile.unlockedSpellLevels,[0,1]);
 assert.equal(e.characterSlots(c35)[1],2,'Wisdom adds a bonus slot, separately from the domain slot');
 assert.equal(e.characterSlots({...c35,abilities:{wis:22}})[1],3);
 assert.equal(e.characterSlots({...c35,abilities:{wis:22}})[2],0,'Ability bonuses cannot unlock new spell levels');
 const test={name:'Variable level',edition:'3.5',classes:['Cleric','Wizard'],classLevels:{Cleric:2,Wizard:1},level:1};
 assert(!e.spellAccess(c35,test).allowed);assert.equal(e.spellAccess({...c35,level:3},test).level,2);
 assert(e.permittedSpells(make('Archivist','3.5',1),spells35).some(s=>s.classes.includes('Cleric')));
 assert(e.permittedSpells(make('Favored Soul','3.5',1),spells35).some(s=>s.classes.includes('Cleric')));
 assert(e.permittedSpells(make('Spirit Shaman','3.5',1),spells35).some(s=>s.classes.includes('Druid')));
 assert(!e.spellAccess({...make('Favored Soul','3.5',1),abilities:{cha:10,wis:18}},named('Bless','3.5')).allowed);
 const cloistered={...make('Cloistered Cleric','3.5',1),classDefinition:integration.annotateClassGrantKinds(classes35.find(c=>c.name==='Cloistered Cleric'),classes35)};
 assert(e.spellAccess(cloistered,named('Message','3.5')).allowed);
 assert(!e.spellAccess(cloistered,named('Magic Missile','3.5')).allowed);
 assert(!e.permittedSpells(make('Warblade','3.5',1),spells35).some(s=>s.isManeuver&&s.level>1));
 const arti=make('Artificer','2014',1);assert.equal(e.characterSlots(arti)[1],2);assert.equal(e.spellCounts(arti,18).cantrips,2);assert.equal(e.castingKey(arti),'int');assert(e.permittedSpells(arti,spells14).length>0);
 // Every 3.5 source record is checked, without interpreting a non-empty
 // progression table as proof that all class mechanics have been implemented.
 let noMembership=0;
 for(const record of classes35){
  const c={...make(record.name,'3.5',20),classDefinition:record};
  const sentinel={...test,name:'Other class only',classLevels:{},classes:['Not a real class']};
  assert(!e.spellAccess(c,sentinel).allowed,record.name);
  if(!spells35.some(s=>(s.classes||[]).includes(record.name)))noMembership++;
 }
 console.log(`PASS ${checked} core class/level combinations, all ${classes35.length} legacy classes reject unrelated spells, multiclass, grants, custom opt-in, Artificer and 3.5 slot parsing. ${noMembership} legacy classes have no directly named spell list (includes noncasters and prestige classes).`);
} finally {await server.close();}
