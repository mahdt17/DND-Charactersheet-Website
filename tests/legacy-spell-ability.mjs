import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
let server,e,definitions;
before(async()=>{
 server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
 e=await server.ssrLoadModule('/src/lib/editions.js');
 const {normalizeCatalogRecord}=await server.ssrLoadModule('/src/lib/catalog.js');
 const {annotateClassGrantKinds}=await server.ssrLoadModule('/src/lib/classIntegration.js');
 const records=JSON.parse(readFileSync('public/catalogs/dndtools/classes.json','utf8')).map(c=>normalizeCatalogRecord(c,'dndtools','classes'));
 definitions=records.map(c=>annotateClassGrantKinds(c,records));
});
after(async()=>server?.close());
const make=(id,level,abilities={})=>{const definition=definitions.find(c=>c.sourceId===`classes/${id}`);assert(definition,id);return {ruleset:'3.5',level,className:definition.name,classDefinition:definition,abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10,...abilities}};};
test('reviewed non-core casters receive source ability bonus slots, including printed zero slots',()=>{
 assert.equal(e.characterSlots(make('beguiler-100',1,{int:18}))[1],4);
 assert.equal(e.characterSlots(make('hexblade-19',4,{cha:18}))[1],1);
});
test('minimum casting ability uses source access ability and retains separate DC ability',()=>{
 const beguiler=make('beguiler-100',1,{int:9,cha:18});
 const spell={name:'Source-list fixture',edition:'3.5',level:1,classes:['Beguiler']};
 assert.equal(e.spellAccess(beguiler,spell).allowed,false);
 assert.equal(e.spellAccess({...beguiler,abilities:{...beguiler.abilities,int:11}},spell).allowed,true);
 for(const [id,access,dc] of [['favored-soul-7','cha','wis'],['spirit-shaman-9','wis','cha']]){
  const c=make(id,1,{[access]:18,[dc]:9});
  assert.equal(e.castingKey(c),dc);
  assert.equal(e.spellAccess(c,{...spell,classes:[c.className]}).allowed,true);
  assert.equal(e.spellAccess({...c,abilities:{...c.abilities,[access]:9,[dc]:18}},{...spell,classes:[c.className]}).allowed,false);
 }
});
test('Archivist bonus slots use Wisdom while spell access uses Intelligence',()=>{
 const c=make('archivist-74',1,{int:18,wis:10});
 assert.equal(e.characterSlots({...c,abilities:{...c.abilities,wis:18}})[1],e.characterSlots(c)[1]+1);
 assert.equal(e.spellAccess(c,{name:'Source-list fixture',edition:'3.5',level:1,classes:['Archivist']}).allowed,true);
});
test('newly recognized daily spell and infusion tables include their source ability bonuses',()=>{
 for(const [id,ability,base] of [['artificer-36','int',2],['cultist-of-the-shattered-peak-540','int',0],['ocular-adept-490','wis',1],['shaman-85','wis',1]]){
  const c=make(id,1,{[ability]:18});
  assert.equal(e.characterSlots(c)[1],base+1,id+' bonus first-level slot');
  const spell={name:'Source-list fixture',edition:'3.5',level:1,classes:[c.className]};
  assert.equal(e.spellAccess({...c,abilities:{...c.abilities,[ability]:9}},spell).allowed,false,id+' minimum ability');
 }
});
test('unmodeled focus and taint progressions retain explicit source-based manual totals',()=>{
 for(const id of ['chameleon-705','maho-tsukai-637','gnome-artificer-564','shadowcaster-113']){
  const c=make(id,1,{int:18,wis:18,cha:18});
  assert.equal(e.spellSlotPools(c).mode,'manual',id);
  const cached={...c,classSpellSlots:[{sourceClassId:c.classDefinition.catalogId,sourceClassName:c.className,slots:[0,8]}]};
  assert.equal(e.spellSlotPools(cached).mode,'manual',id+' stale source matrix');
  assert.equal(e.spellSlotPools({...c,slotOverride:[0,3]}).mode,'override',id);
  assert.equal(e.characterSlots({...c,slotOverride:[0,3]})[1],3,id);
 }
});
