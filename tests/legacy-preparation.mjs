import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const e=await server.ssrLoadModule('/src/lib/editions.js'),p=await server.ssrLoadModule('/src/lib/legacyPreparation.js'),a=await server.ssrLoadModule('/src/lib/advancement.js'),l=await server.ssrLoadModule('/src/lib/legacyCastingChoices.js'),m=await server.ssrLoadModule('/src/lib/multiclassCasting.js'),play=await server.ssrLoadModule('/src/lib/play.js');
 const {normalizeCatalogRecord}=await server.ssrLoadModule('/src/lib/catalog.js');
 const raw=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json')),rawSpells=JSON.parse(fs.readFileSync('public/catalogs/dndtools/spells.json'));
 const core=JSON.parse(fs.readFileSync('src/data/srd35.json')).classes;
 for(const broken of raw.filter(x=>['Druid','Paladin'].includes(x.name))){
  const repaired=normalizeCatalogRecord(broken,'dndtools','classes'),expected=core.find(x=>x.name===broken.name);
  for(let level=1;level<=20;level++){
   assert.deepEqual(a.baseProgression(repaired,level),a.baseProgression(expected,level));
   assert.deepEqual(e.characterSlots({ruleset:'3.5',className:broken.name,classDefinition:repaired,level,abilities:{wis:18}}),e.characterSlots({ruleset:'3.5',className:broken.name,classDefinition:expected,level,abilities:{wis:18}}));
  }
  const personal={...repaired,progression:[['Level','BAB'],['1st','+7']]};assert.equal(a.baseProgression(personal,1).bab,7,'Preserve personal table changes');
 }
 const make=name=>({ruleset:'3.5',className:name,classDefinition:normalizeCatalogRecord(raw.find(x=>x.name===name),'dndtools','classes'),level:5,abilities:{int:18,wis:18,cha:18},spells:[]});
 const spell=name=>({...normalizeCatalogRecord(rawSpells.find(x=>x.name===name),'dndtools','spells'),id:name});
 const pools=c=>e.spellSlotPools(c),state=c=>p.preparationState(c,pools(c)),options=(c,s)=>p.preparedCastOptions(c,s,pools(c),x=>e.spellAccess(c,x));
 const prepare=(c,choices,daily=true)=>({...c,...p.prepareLegacySpells(c,pools(c),choices,c.spells,x=>e.spellAccess(c,x),{daily})});
 const cast=(c,s,pool,level)=>({...c,...p.spendPreparedSpell(c,s,pools(c),{pool,level},x=>e.spellAccess(c,x))});
 let w=make('Wizard');w.spells=['Magic Missile','Mage Armor','Detect Magic'].map(spell);const [missile,armor,detect]=w.spells,wid=l.legacyChoiceKey(w);
 assert(p.usesLegacyPreparation(w));assert(!p.usesLegacyPreparation({...w,ruleset:'2014',classDefinition:{edition:'2014'}}));assert(!p.usesLegacyPreparation(make('Sorcerer')));
 assert.deepEqual(options({...w,spells:[{...missile,prepared:true}]},missile),[],'Old prepared booleans cannot bypass copy counts');
 w=prepare(w,{'standard:1:0':missile.id,'standard:1:1':missile.id,'standard:2:0':missile.id,'standard:0:0':detect.id});
 assert.deepEqual(options(w,missile),[{pool:'standard',level:1,remaining:2},{pool:'standard',level:2,remaining:1}]);
 w=cast(w,missile,'standard',1);assert.equal(options(w,missile)[0].remaining,1);w=cast(w,missile,'standard',1);assert.equal(options(w,missile)[0].level,2);
 assert.throws(()=>cast(w,missile,'standard',1),/prepared copy/);assert.throws(()=>prepare(w,{'standard:1:0':armor.id},false),/Only open/);
 w=cast(w,detect,'standard',0);assert.equal(options(w,detect).length,0,'Level 0 preparations are spent');
 const rested={...w,...m.restSpellSlots(w,'long')};assert.deepEqual(rested.legacyPreparation,w.legacyPreparation);assert.deepEqual(rested.classSlotsUsed,w.classSlotsUsed);assert.equal(options(rested,missile)[0].level,2);
 w=prepare(rested,{'standard:1:0':'spent','standard:1:1':armor.id});assert.equal(state(w).find(x=>x.key==='standard:1:0').spent,true);assert.equal(options(w,armor)[0].remaining,1);
 w=prepare(w,{'standard:1:2':armor.id},false);assert.equal(options(w,armor)[0].remaining,2);assert.throws(()=>prepare(w,{'standard:1:1':missile.id},false),/Only open/);
 const serialized=JSON.parse(JSON.stringify(w));assert.deepEqual(options(serialized,armor),options(w,armor));
 const old={...make('Wizard'),slotsUsed:{1:2}};assert.equal(state(old).filter(s=>s.pool==='standard'&&s.level===1&&s.spent).length,2);
 assert.throws(()=>prepare(w,{'standard:0:1':missile.id}),/eligible/);assert.throws(()=>prepare(w,{'standard:1:3':'missing'}),/eligible/);
 const specialist={...w,legacyCastingChoices:{[wid]:{school:'Evocation',prohibited:['Enchantment','Necromancy']}}};
 assert.throws(()=>prepare(specialist,{'specialist:1:0':armor.id}),/eligible/);
 const sw=prepare(specialist,{'specialist:1:0':missile.id});assert(options(sw,missile).some(x=>x.pool==='specialist'));
 assert(!options({...sw,legacyCastingChoices:{}},missile).some(x=>x.pool==='specialist'),'Removing specialization removes its slot access');
 let c=make('Cleric');const cid=l.legacyChoiceKey(c);c.legacyCastingChoices={[cid]:{domains:['Fire','Healing']}};c.spells=['Burning Hands','Bless'].map(spell);const [burn,bless]=c.spells;
 assert.throws(()=>prepare(c,{'standard:1:0':burn.id}),/eligible/);assert.throws(()=>prepare(c,{'domain:1:0':bless.id}),/eligible/);
 c=prepare(c,{'domain:1:0':burn.id,'domain:2:0':burn.id,'standard:1:0':bless.id});assert.equal(options(c,burn).length,2);c=cast(c,burn,'domain',1);assert.deepEqual(c.classSlotsUsed[cid],{});assert.equal(c.classRestrictedSlotsUsed[cid].domain[1],1);
 assert.equal(options({...c,legacyCastingChoices:{[cid]:{domains:['Water','Healing']}}},burn).length,0,'Changed domains invalidate preparations');
 const cure=spell('Cure Light Wounds'),inflict=spell('Inflict Light Wounds');
 let conversion={...c,spells:[...c.spells,cure,inflict],legacyCastingChoices:{[cid]:{domains:['Fire','Healing'],spontaneous:'cure'}}};
 assert(options(conversion,cure).some(o=>o.pool==='conversion-0'));assert.equal(options(conversion,inflict).length,0);
 conversion=cast(conversion,cure,'conversion-0',1);assert.equal(options(conversion,bless).length,0);assert(!options(conversion,cure).some(o=>o.pool.startsWith('conversion-')),'Domain preparations cannot be converted');
 assert(!p.spontaneousConversion({...conversion,alignment:'Lawful Evil'},cure));
 assert(!p.spontaneousConversion({...conversion,legacyCastingChoices:{[cid]:{spontaneous:'inflict'}},alignment:'Neutral Good'},inflict));
 let druid=make('Druid');const summon=spell("Summon Nature's Ally I"),entangle=spell('Entangle');druid.spells=[summon,entangle];druid=prepare(druid,{'standard:2:0':entangle.id});assert.equal(options(druid,summon)[0].level,2);druid=cast(druid,summon,'conversion-0',2);assert.equal(options(druid,entangle).length,0);
 const combined={...w,classLevels:[{name:'Wizard',edition:'3.5',level:5,catalogId:wid,definition:w.classDefinition},{name:'Cleric',edition:'3.5',level:5,catalogId:cid,definition:c.classDefinition}],legacyPreparation:{...w.legacyPreparation,...c.legacyPreparation},classSlotsUsed:{...w.classSlotsUsed,...c.classSlotsUsed},spells:[...w.spells.map(s=>({...s,castingClassId:wid})),...c.spells.map(s=>({...s,castingClassId:cid}))],legacyCastingChoices:c.legacyCastingChoices};
 const own=a.classCharacter(combined,combined.classLevels[1]);assert.equal(options(own,armor).length,0);
 const {removeClassProgression}=await server.ssrLoadModule('/src/lib/classIntegration.js');assert.equal(removeClassProgression(combined,cid).legacyPreparation[cid],undefined);
 assert(play.availableSlots({...make('Sorcerer'),slotOverride:[0,0,1]},{level:1}).some(x=>x.level===2),'Spontaneous casters can use a higher-level slot');
 console.log('PASS 3.5 per-slot preparation, duplicate copies, higher slots, level 0, restrictions, expenditure, daily/open preparation, recent casts, persistence, class ownership and source removal');
}finally{await server.close();}
