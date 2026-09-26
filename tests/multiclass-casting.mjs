import assert from 'node:assert/strict';
import {createServer} from 'vite';
import fs from 'node:fs';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try {
 const e=await server.ssrLoadModule('/src/lib/editions.js');
 const p=await server.ssrLoadModule('/src/lib/play.js');
 const a=await server.ssrLoadModule('/src/lib/advancement.js');
 const {restSpellSlots}=await server.ssrLoadModule('/src/lib/multiclassCasting.js');
 const srd=JSON.parse(fs.readFileSync('src/data/classes.json'));
 const make=(edition,classes)=>({ruleset:edition,className:classes[0][0],level:classes.reduce((n,[,l])=>n+l,0),abilities:{str:14,dex:14,con:14,int:16,wis:14,cha:18},hp:{max:30,current:20,temp:3},spells:[],slotsUsed:{},classLevels:classes.map(([name,level])=>({name,level,edition,catalogId:edition+':'+name,definition:{...(edition==='2024'?e.modern.classes:srd).find(c=>c.name===name),edition}}))});
 const sample=make('2014',[['Ranger',4],['Wizard',3]]);
 assert.deepEqual(e.characterSlots(sample),[0,4,3,2,0,0,0,0,0,0]); // Published multiclass example.
 const wizard=a.classCharacter(sample,sample.classLevels[1]);
 assert.equal(Math.max(...e.permittedSpells(wizard).map(s=>s.level)),2,'Shared 3rd-level slots must not unlock 3rd-level Wizard spells');
 assert.equal(e.spellCounts(wizard,16).prepared,6);
 assert.equal(e.characterSlots(make('2014',[['Paladin',3],['Wizard',2]]))[2],2);
 assert.equal(e.characterSlots(make('2024',[['Paladin',3],['Wizard',2]]))[2],3);
 assert.deepEqual(e.characterSlots(make('2014',[['Paladin',3],['Fighter',2]])),[0,3,0,0,0,0,0,0,0,0],'A sole Spellcasting class uses its own class table');
 assert.equal(e.characterSlots(make('2014',[['Paladin',1],['Wizard',3]]))[2],2);
 assert.equal(e.characterSlots(make('2024',[['Paladin',1],['Wizard',3]]))[2],3);
 for(const edition of ['2014','2024']) {
  const c=make(edition,[['Warlock',3],['Wizard',3]]);
  assert.deepEqual(e.spellSlotPools(c).standard,[0,4,2,0,0,0,0,0,0,0]);
  assert.deepEqual(e.spellSlotPools(c).pact,[0,0,2,0,0,0,0,0,0,0]);
  const s={level:1};
  const first={...c,...p.spendSpellSlot(c,s,2,'pact')};
  assert.equal(first.pactSlotsUsed[2],1);assert.deepEqual(first.slotsUsed,{});
  const spent={...first,...p.spendSpellSlot(first,s,2)};
  assert.equal(spent.slotsUsed[2],1);assert.equal(spent.pactSlotsUsed[2],1);
  const rested={...spent,...restSpellSlots(spent,'short')};
  assert.equal(rested.slotsUsed[2],1);assert.deepEqual(rested.pactSlotsUsed,{});
  assert.deepEqual(restSpellSlots(spent,'long'),{slotsUsed:{},pactSlotsUsed:{}});
  assert.throws(()=>p.spendSpellSlot({...spent,pactSlotsUsed:{2:2}},s,2,'pact'),/available slot/);
  assert.throws(()=>p.spendSpellSlot(c,{level:3},2,'pact'),/available slot/);
  assert.throws(()=>p.spendSpellSlot(c,s,2,'invented'),/available slot/);
  assert.equal(e.castingKey(a.classCharacter({...c,castingAbility:'cha'},c.classLevels[1])),'int');
  assert.equal(e.castingKey(a.classCharacter({...c,castingAbility:'cha'},{...c.classLevels[1],castingAbility:'wis'})),'wis');
 }
 const old=make('2014',[['Warlock',3]]);delete old.classLevels;old.classDefinition={...srd.find(x=>x.name==='Warlock'),edition:'2014'};old.slotsUsed={2:1};
 const fighter={...srd.find(x=>x.name==='Fighter'),edition:'2014',catalogId:'2014:Fighter'};
 const advanced=a.advanceClass(old,fighter,{hpGain:7});
 assert.deepEqual(advanced.slotsUsed,{});assert.deepEqual(advanced.pactSlotsUsed,{2:1});assert.equal(old.slotsUsed[2],1);
 const checks=a.requirements(fighter,{...old,abilities:{str:8,dex:14}}, {},{multiclass:true});assert(a.qualified(checks));
 const blocked=a.requirements(fighter,{...old,abilities:{str:8,dex:8}}, {},{multiclass:true});assert(!a.qualified(blocked));assert(blocked.some(c=>c.status==='unmet'));
 assert(!a.qualified(a.requirements({name:'Unknown',multi_classing:{prerequisite_options:{choose:1,from:{options:[{weird:true}]}}}},old,{}, {multiclass:true})));
 assert.equal(e.spellSlotPools({...sample,ruleset:'custom',mechanics:'2014'}).mode,'manual');
 const cross=make('2014',[['Wizard',3],['Cleric',3]]);cross.classLevels[1].edition='2024';assert.equal(e.spellSlotPools(cross).mode,'manual');
 const artificer=make('2014',[['Artificer',3],['Wizard',3]]);assert.equal(e.spellSlotPools(artificer).mode,'automatic');assert.equal(e.characterSlots(artificer)[3],2);
 const unknown=make('2014',[['Unknown caster',3],['Wizard',3]]);assert.equal(e.spellSlotPools(unknown).mode,'manual');
 const override={...sample,slotOverride:[0,2,1]};assert.equal(e.spellSlotPools(override).mode,'override');assert.deepEqual(e.characterSlots(override),[0,2,1,0,0,0,0,0,0,0]);
 assert.deepEqual(e.characterSlots({...override,slotOverride:null}),e.characterSlots(sample));
 console.log('PASS 2014/2024 multiclass slots, class spell limits, Pact Magic spending/rests, save migration, abilities and prerequisites');
} finally {await server.close();}
