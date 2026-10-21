import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {entomancerClass} from '../src/data/entomancer.js';
import {prepareEntomancerSpells} from '../src/lib/entomancerPreparation.js';

const source=JSON.parse(readFileSync('public/catalogs/wikidot5e/spells.json','utf8'));
const druid=source.filter(s=>s.classes?.includes('Druid')&&s.level<=5);
const publishedList=JSON.parse(readFileSync('tests/fixtures/entomancer-druid-spell-list.json','utf8')).spells;
const base={name:'Spell review',ruleset:'2014',className:'Entomancer',classDefinition:entomancerClass,level:18,race:'Human',speed:30,hp:{current:80,max:80,temp:0},abilities:{str:10,dex:14,con:16,int:10,wis:18,cha:10},abilityBonuses:{},inventory:[],actions:[],entomancer:{species:'Decomposers',tool:'Herbalism Kit',moisture:'Dry',temperature:'Hot'}};
let server,browser,editions,play,normalize;
before(async()=>{
 server=await createServer({server:{host:'127.0.0.1',port:5197}});await server.listen();
 editions=await server.ssrLoadModule('/src/lib/editions.js');
 play=await server.ssrLoadModule('/src/lib/play.js');
 normalize=(await server.ssrLoadModule('/src/lib/catalog.js')).normalizeCatalogRecord;
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
});
after(async()=>{await browser?.close();await server?.close();});
const spell=name=>normalize(source.find(s=>s.name===name),'wikidot5e','spells');
const plan=(name,level=18,slot=5)=>play.spellPlan(editions.resolveSpell(spell(name),base),{...base,level},slot,3);

test('all Entomancer source spells resolve to substantive rules even from stale saves',()=>{
 assert.equal(druid.length,123);
 for(const row of druid){
  const saved={id:'saved-'+row.id,catalogId:row.id,edition:'2014',name:row.name,level:row.level,description:row.generatedDescription||'',descriptionOrigin:'generated',prepared:true};
  const resolved=editions.resolveSpell(saved,base);
  assert(resolved.description.length>70,row.name+' must have rules');
  assert(!resolved.description.startsWith(row.name+' is a'),row.name+' must not show boilerplate');
  assert.equal(resolved.range,row.range,row.name+' range');
  assert.equal(resolved.casting_time,row.casting_time,row.name+' casting time');
 }
});

test('Infestation and damaging cantrips use total character level and the correct save or attack',()=>{
 assert.equal(spell('Infestation').damage[0].damage_at_character_level[1],'1d6','picker and catalog receive mechanics too');
 for(const [level,dice] of [[1,'1d6'],[5,'2d6'],[11,'3d6'],[17,'4d6']]){
  const p=plan('Infestation',level,0);assert.equal(p.rolls[0]?.expression,dice);assert.equal(p.attack,false);assert.equal(p.save,'Constitution');
 }
 assert.equal(plan('Primal Savagery',5,0).rolls[0]?.expression,'2d10');
 assert.equal(plan('Primal Savagery',5,0).attack,true);
 assert.equal(plan('Thorn Whip',11,0).rolls[0]?.expression,'3d6');
 assert.equal(plan('Frostbite',17,0).rolls[0]?.expression,'4d6');
 assert.equal(plan('Create Bonfire',5,0).rolls[0]?.expression,'2d8');
});

test('leveled damage, healing and Half Alive retain their distinct scaling rules',()=>{
 assert.equal(plan('Earth Tremor',18,3).rolls[0]?.expression,'3d6');
 assert.equal(plan('Erupting Earth',18,5).rolls[0]?.expression,'5d12');
 assert.equal(plan('Wall of Fire',18,5).rolls[0]?.expression,'6d8');
 assert.equal(plan('Healing Word',18,3).rolls[0]?.expression,'3d4+3');
 assert.equal(plan('Healing Spirit',18,4).rolls[0]?.expression,'3d6');
 assert.deepEqual(plan('Wither and Bloom',18,3).rolls.map(r=>r.expression),['3d6','3d4']);
 assert.match(plan('Wither and Bloom').notes,/Hit Di/i);
 assert.deepEqual(plan('Ice Knife',18,3).rolls.map(r=>r.expression),['1d10','4d6']);
 assert.equal(plan('Ice Knife',18,3).rolls[1].critical,false,'save-based explosion cannot crit');
 const refreshed=editions.resolveSpell({catalogId:'wikidot5e:spell:infestation',edition:'2014',description:'Old placeholder',level:0},base);
 assert.equal(refreshed.descriptionOrigin,'source');
 for(const [name,save] of [['Call Lightning','Dexterity'],['Flaming Sphere','Dexterity'],['Earthbind','Strength'],['Watery Sphere','Strength']])assert.equal(plan(name).save,save);
});

test('conditional and utility spells retain rules without inventing immediate spell damage',()=>{
 for(const name of ['Magic Stone','Shillelagh','Absorb Elements','Guardian of Nature','Summon Draconic Spirit','Wrath Of Nature','Control Water','Spike Growth','Produce Flame']){
  const p=plan(name);assert.equal(p.rolls.length,0,name);assert.equal(p.attack,false,name);assert(p.notes.length>20,name);
 }
 assert.equal(plan('Guidance').rolls.length,0);
 assert.match(editions.resolveSpell(spell('Beast Sense'),base).description,/special senses.*blinded and deafened/);
 assert.match(editions.resolveSpell(spell('Locate Object'),base).description,/within 30 feet/);
 const custom={catalogId:'custom:infestation',edition:'custom',name:'Infestation',description:'My own version.'};
 assert.equal(editions.resolveSpell(custom,base),custom,'homebrew is not replaced by a same-name source spell');
 for(const slug of ['flame-blade','control-water','spike-growth']){
  const srd=editions.resolveSpell({catalogId:'2014:'+slug,edition:'2014'},base);
  const p=play.spellPlan(srd,base,5,3);
  assert.equal(p.rolls.length,0,slug+' SRD variant');assert.equal(p.attack,false);
  assert.equal(srd.catalogId,'2014:'+slug,'SRD identity survives');assert.equal(srd.source,'SRD 5.1');
 }
 const srdFire=editions.resolveSpell({catalogId:'2014:wall-of-fire',edition:'2014'},base);
 assert.equal(play.spellPlan(srdFire,base,5,3).rolls[0].expression,'6d8');
 const picker=editions.permittedSpells(base);
 assert.equal(play.spellPlan(picker.find(s=>s.catalogId==='2014:flame-blade'),base,5,3).rolls.length,0,'SRD picker also uses the corrected rules');
});

test('Entomancer has every published Druid spell through level 5, including optional spells',()=>{
 const catalog=source.map(s=>normalize(s,'wikidot5e','spells'));
 // Existing characters retain an older class definition in their save.
 const character={...base,classDefinition:{...entomancerClass,spellLists:['Druid']}};
 const available=editions.permittedSpells(character,catalog);
 const expected=publishedList.filter(s=>s.level<=5);
 assert.equal(expected.length,136);
 for(const row of publishedList){
  const candidate=catalog.find(s=>s.name.toLowerCase()===row.name.toLowerCase()&&s.level===row.level);
  assert(candidate,'catalog contains '+row.name);
  if(row.level>5){assert(!available.some(s=>s.catalogId===candidate.catalogId),row.name+' exceeds class progression');continue;}
  const option=available.find(s=>s.catalogId===candidate.catalogId);
  assert(option,row.name+' must be available');
  assert.doesNotThrow(()=>prepareEntomancerSpells({...character,spells:[]},entomancerClass.catalogId,[option]),row.name+' must be preparable');
  assert(editions.resolveSpell(option,base).description.length>70,row.name+' has rules');
 }
 const cone=available.find(s=>s.catalogId==='wikidot5e:spell:cone-of-cold');
 assert.equal(play.spellPlan(cone,base,5,3).rolls[0]?.expression,'8d8');
 const summon=available.find(s=>s.name==='Summon Beast');
 assert.equal(play.spellPlan(summon,base,2,3).rolls.length,0,'summon has no immediate spell damage');
 assert.match(summon.description,/1d8/,'summoned creature damage is present');
 const fey=available.find(s=>s.name==='Summon Fey');
 assert.equal(play.spellPlan(fey,base,3,3).save,'Wisdom');
 assert.match(fey.saveNotes,/only for Mirthful/);
 const low={...character,level:1};
 assert.equal(editions.permittedSpells(low,catalog).filter(s=>s.level>0).length,0,'level one remains cantrips only');
 const highestSpellLevel=[0,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5];
 for(let level=1;level<=20;level++){
  const choices=editions.permittedSpells({...character,level},catalog);
  for(const row of publishedList){
   const entry=catalog.find(s=>s.name.toLowerCase()===row.name.toLowerCase()&&s.level===row.level);
   assert.equal(choices.some(s=>s.catalogId===entry.catalogId),row.level<=highestSpellLevel[level-1],`Entomancer level ${level}: ${row.name}`);
  }
 }
 const level2={...character,level:2,spells:[]};
 assert.throws(()=>prepareEntomancerSpells(level2,entomancerClass.catalogId,[cone]),/level/i);
 const tooMany=available.filter(s=>s.level>0).slice(0,25);
 assert.throws(()=>prepareEntomancerSpells({...character,spells:[]},entomancerClass.catalogId,tooMany),/no more than/i);
 assert(!available.some(s=>s.name==='Magic Missile'),'unrelated Wizard spells remain excluded');
});

test('existing saved Infestation shows rules, save and damage while casting without spending slots',async t=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
 const row=source.find(s=>s.name==='Infestation');
 const c={...base,spells:[{...row,id:'old-infestation',catalogId:row.id,description:row.generatedDescription,descriptionOrigin:'generated',prepared:true,castingClassId:entomancerClass.catalogId,rollFormula:'',rollAttack:false}]};
 await page.goto('http://127.0.0.1:5197/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.locator('input[type=file]').setInputFiles({name:'spell-review.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});
 await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();await page.getByRole('tab',{name:'Spells',exact:true}).click();
 const item=page.locator('.spell-item').filter({hasText:'Infestation'});
 await item.getByRole('button',{name:'Cast',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByText(/1d6 poison damage/).waitFor();
 await dialog.getByText(/Poison damage.*4d6/).waitFor();
 await dialog.getByText(/Constitution.*DC 17/).waitFor();
 assert.equal(await dialog.getByLabel('Spell slot',{exact:true}).count(),0);
 await dialog.getByRole('button',{name:'Cast',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Infestation cast'}).waitFor();
 await item.locator('.spell-name').click();await page.getByRole('dialog').getByText(/1d6 poison damage/).waitFor();
 await page.setViewportSize({width:360,height:800});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'spell rules fit a phone screen');
});

test('older Custom Entomancers can choose, save and reopen optional spells in the spellbook',async t=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
 const c={...base,name:'Optional spell choices',ruleset:'custom',mechanics:'2014',classDefinition:{...entomancerClass,spellLists:['Druid']},spells:[]};
 await page.goto('http://127.0.0.1:5197/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.locator('input[type=file]').setInputFiles({name:'optional-spells.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});
 await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();await page.getByRole('tab',{name:'Spells',exact:true}).click();
 await page.getByRole('button',{name:'Manage spells',exact:true}).click();
 const picker=page.getByRole('region',{name:'Prepared class spells'});
 for(const name of ['Summon Beast','Cone of Cold']){
  await picker.getByLabel('Search spells',{exact:true}).fill(name);
  await picker.getByRole('button',{name:new RegExp('^Select '+name+' \\(5e')}).click();
 }
 await page.getByRole('button',{name:'Save Entomancer spell choices',exact:true}).click();
 await page.locator('.spell-item').filter({hasText:'Summon Beast'}).waitFor();
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 await page.locator('.character-card').filter({hasText:c.name}).getByRole('button',{name:'Open character',exact:true}).click();
 await page.getByRole('tab',{name:'Spells',exact:true}).click();
 await page.locator('.spell-item').filter({hasText:'Cone of Cold'}).getByRole('button',{name:'Cast',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByText(/Cold damage.*8d8/).waitFor();
 await dialog.getByText(/Constitution save.*DC 17/).waitFor();
 await dialog.getByRole('button',{name:'Cancel casting',exact:true}).click();
 await page.locator('.spell-item').filter({hasText:'Summon Beast'}).getByRole('button',{name:'Cast',exact:true}).click();
 await page.getByRole('dialog').getByText(/Use the Bestial Spirit/).waitFor();
});
