import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {entomancerClass} from '../src/data/entomancer.js';

let server,browser,spells;
const base={ruleset:'2014',className:'Entomancer',classDefinition:entomancerClass,level:18,race:'Human',speed:30,hitDie:'d8',autoArmor:true,hp:{current:100,max:100,temp:0},abilities:{str:12,dex:14,con:16,int:10,wis:18,cha:10},abilityBonuses:{},saveProf:{con:true},inventory:[],actions:[],entomancer:{species:'Orthoptera',instrument:'Lute',tool:'Herbalism Kit',moisture:'Dry',temperature:'Hot'}};
before(async()=>{
 server=await createServer({server:{host:'127.0.0.1',port:5192}});await server.listen();
 spells=(await server.ssrLoadModule('/src/lib/editions.js')).permittedSpells(base);
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
});
after(async()=>{await browser?.close();await server?.close();});
const fixture=async(t,overrides={})=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
 const c={...base,name:t.name,...overrides,spells:[{...spells.find(s=>s.name==='Cure Wounds'),id:'cure',prepared:true,castingClassId:entomancerClass.catalogId}]};
 await page.goto('http://127.0.0.1:5192/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.locator('input[type=file]').setInputFiles({name:'entomancer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});
 await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();
 return page;
};

test('casting reducers revalidate incapacity before spending slots or feat uses',async()=>{
 const {spendSpellSlot}=await server.ssrLoadModule('/src/lib/play.js');
 const {spendFeatCast,featCastOptions}=await server.ssrLoadModule('/src/lib/featCasting.js');
 const {featMagicSpells}=await server.ssrLoadModule('/src/lib/featMagic.js');
 const initiate={id:'initiate',name:'Magic Initiate',edition:'2014',magicChoices:{list:'Wizard',cantrips:['2014:fire-bolt','2014:mage-hand'],spell:'2014:magic-missile'}};
 const healthy={...base,feats:[initiate]};
 const spell=featMagicSpells(healthy).find(s=>s.level===1),option=featCastOptions(healthy,spell)[0];
 assert(option,'fixture has a legal feat use');
 assert.equal(spendSpellSlot(healthy,{level:1},1).slotsUsed[1],1);
 assert(Object.keys(spendFeatCast(healthy,spell,option).featSpellUses).length);
 for(const overrides of [{hp:{current:0,max:100,temp:0}},{conditions:'Stunned'},{entomancer:{...base.entomancer,dead:true}}]){
  const c={...healthy,...overrides},snapshot=JSON.stringify(c);
  assert.throws(()=>spendSpellSlot(c,{level:1},1),/dead|unconscious|incapacitated/i);
  assert.throws(()=>spendFeatCast(c,spell,option),/dead|unconscious|incapacitated/i);
  assert.equal(JSON.stringify(c),snapshot,'blocked casting preserves resources');
 }
});

for(const [label,overrides] of [
 ['dead',{hp:{current:0,max:100,temp:0},entomancer:{...base.entomancer,dead:true,effects:{swarmForm:{remaining:10}}}}],
 ['unconscious',{hp:{current:0,max:100,temp:0}}],
 ['stunned',{conditions:['Stunned']}]
])test(`${label} Entomancer cannot cast, spend slots or make personal attacks`,async t=>{
 const page=await fixture(t,overrides);
 const unarmed=page.locator('.action-row').filter({hasText:'Unarmed strike'}).getByRole('button').first();
 assert(await unarmed.isDisabled());
 assert.equal(await page.getByRole('complementary',{name:'Dice roller',exact:true}).count(),0);
 await page.locator('[data-swarm-action="pestilence"]').click();
 assert(await page.getByRole('button',{name:'Use Glaring Pestilence',exact:true}).isDisabled());
 await page.getByRole('tab',{name:'Spells',exact:true}).click();
 const open=page.locator('.spell-item').filter({hasText:'Cure Wounds'}).getByRole('button',{name:'Cast',exact:true});
 assert(await open.isDisabled());
 assert(!(await page.getByRole('button',{name:'Level 1 slot 1',exact:true}).getAttribute('class')).includes('used'));
});

test('Harmonize resolves both saved hits and consumes Hive Mind advantage once',async t=>{
 const page=await fixture(t,{entomancer:{...base.entomancer,song:true,songSaveDCs:[10,10],psychicSave:true}});
 const resolve=page.getByRole('button',{name:'Resolve song concentration',exact:true});
 await page.getByText('2 concentration checks pending',{exact:true}).waitFor();
 await resolve.click();
 // +13 on this save guarantees success even on a natural 1.
 await page.getByRole('button',{name:'Dice roller',exact:true}).click();
 await page.getByText('1 concentration check pending',{exact:true}).waitFor();
 assert.equal(await page.getByText('Hive Mind: the next selected saving throw has advantage.',{exact:true}).count(),0);
 await resolve.click();await page.getByRole('button',{name:'Dice roller',exact:true}).click();
 assert.equal(await resolve.count(),0);
 assert.equal(await page.getByRole('button',{name:'Stop singing',exact:true}).count(),1);
});

test('legacy pending checks persist on reopen and healing does not restart a stopped song',async t=>{
 const page=await fixture(t,{level:10,entomancer:{...base.entomancer,song:true,songSaveDC:20}});
 await page.getByText('Song concentration: CON DC 20',{exact:true}).waitFor();
 await page.getByLabel('Incoming damage type').selectOption('force');
 await page.getByLabel('Hit point adjustment').fill('1');await page.getByRole('button',{name:'Damage',exact:true}).click();
 await page.getByRole('button',{name:'All characters',exact:true}).click();
 await page.locator('.character-card').filter({hasText:t.name}).getByRole('button',{name:'Open character',exact:true}).click();
 await page.getByText('2 concentration checks pending',{exact:true}).waitFor();
 await page.getByText('Song concentration: CON DC 20',{exact:true}).waitFor();
 await page.getByLabel('Hit point adjustment').fill('1000');await page.getByRole('button',{name:'Damage',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Stop singing',exact:true}).count(),0);
 await page.getByLabel('Hit point adjustment').fill('1');await page.getByRole('button',{name:'Heal',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Stop singing',exact:true}).count(),0);
 await page.locator('[data-swarm-action="harmonize"]').click();
 assert(await page.getByRole('button',{name:'Use Harmonize',exact:true}).isEnabled());
});

test('incapacitated Entomancer cannot start a grapple or resolve active Hemo and infestation damage',async t=>{
 const page=await fixture(t,{conditions:['Stunned'],entomancer:{...base.entomancer,species:'Endo-Gotas',latch:{targetId:'victim'},targets:[{id:'victim',name:'Victim',type:'humanoid',conditions:[],timers:{},damage:0,infestation:{points:1,remaining:10}}]}});
 await page.getByText('Environment & derived benefits',{exact:true}).click();
 assert(await page.getByRole('button',{name:'Roll grapple',exact:true}).isDisabled());
 assert(await page.getByRole('button',{name:'Resolve Hemo — your turn start',exact:true}).isDisabled());
 await page.getByText('Targets & conditions (1)',{exact:true}).click();assert(await page.getByRole('button',{name:'Infestation damage — Victim',exact:true}).isDisabled());
});
