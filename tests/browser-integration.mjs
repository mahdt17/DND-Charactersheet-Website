import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5177}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
const published=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8'));
const sourceClass=name=>{const r=published.find(x=>x.name===name&&!x.prestige);return {...r,id:`dndtools:${r.id}`,catalogId:`dndtools:${r.id}`,edition:'3.5'};};
const base={name:'Branching Archivist',className:'Archivist',classDefinition:sourceClass('Archivist'),race:'Human',ruleset:'3.5',level:5,hitDie:'d6',abilities:{str:14,dex:14,con:14,int:16,wis:14,cha:14},hp:{current:20,max:30,temp:0},spells:[],inventory:[],actions:[],feats:[],skillRanks:{},bab:2,save35:{fort:4,ref:1,will:4},notes:''};
const importChar=async c=>{await page.locator('input[type=file]').setInputFiles({name:'character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();};
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);const row=rows.find(x=>x.name===name);return JSON.parse((await window.storage.get('char-detail:'+row.id)).value);},name);
const waitSaved=async (name,expected)=>{for(let i=0;i<100;i++){const c=await saved(name);if(Object.entries(expected).every(([k,v])=>JSON.stringify(c[k])===JSON.stringify(v)))return c;await new Promise(r=>setTimeout(r,50));}assert.fail('Saved character did not reach expected state: '+JSON.stringify(expected));};
const next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click();
async function branch(flow,name){await page.getByRole('button',{name:'Level up',exact:true}).click();await page.getByLabel('Advancement path').selectOption(flow);await page.getByLabel('Search level-up classes').fill(name);await page.getByLabel('Class to advance').selectOption(await page.getByLabel('Class to advance').locator('option').filter({hasText:new RegExp(`^${name} ·`)}).first().getAttribute('value'));}
try {
 await fs.mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:5177/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).click();assert(!requests.some(u=>u.includes('/catalogs/')),'Catalogs must not load on startup');
 await page.getByRole('button',{name:'Toggle navigation'}).click();assert(!await page.locator('.ledger-nav').isVisible());await page.getByRole('button',{name:'Toggle navigation'}).click();assert(await page.locator('.ledger-nav').isVisible());
 const tempHP=page.getByLabel('Temporary hit points',{exact:true});assert(await tempHP.isVisible());await tempHP.fill('3');await tempHP.press('Enter');assert.equal(await tempHP.inputValue(),'3');await page.getByLabel('Hit point adjustment').fill('5');await page.getByRole('button',{name:'Damage',exact:true}).click();assert.match(await page.locator('.hp-value').innerText(),/^15/);assert.equal(await tempHP.inputValue(),'0');
 await tempHP.fill('9');await tempHP.press('Enter');
 const demoName=await page.locator('.sheet-identity h1').innerText();let demo=await saved(demoName);await waitSaved(demoName,{hp:{...demo.hp,current:15,temp:9}});
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:demoName}).getByRole('button',{name:'Open character'}).click();assert.equal(await page.getByLabel('Temporary hit points',{exact:true}).inputValue(),'9');
 console.log('PASS compact directly editable temporary HP, saved/reopened value, damage absorption and collapsible desktop navigation');
 await importChar(base);await branch('normal','Fighter');assert(!await page.getByLabel('Class to advance').locator('option').filter({hasText:'Abjurant Champion'}).count());await page.getByRole('checkbox',{name:/I reviewed/}).check();await page.getByRole('button',{name:'Continue to level choices'}).click();await next();await next();await page.getByRole('button',{name:'Apply level up'}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();let c=await saved(base.name);assert.deepEqual(c.classLevels.map(r=>r.level),[5,1]);assert.equal(c.bab,3);assert.equal(c.className,'Archivist');
 console.log('PASS legacy 3.5 save normalization and Archivist → Fighter branching, class levels and BAB');
 await importChar({...base,name:'Blocked Prestige'});await branch('prestige','Abjurant Champion');assert.match(await page.getByRole('dialog').innerText(),/Unmet:.*\+\s*5/);assert(await page.getByRole('button',{name:'Continue to level choices'}).isDisabled());await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await importChar({...base,name:'Qualified Prestige',bab:5});await branch('prestige','Abjurant Champion');for(const checkbox of await page.getByRole('dialog').getByRole('checkbox').all())await checkbox.check();await page.getByRole('button',{name:'Continue to level choices'}).click();await next();await next();await page.getByRole('button',{name:'Apply level up'}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();c=await saved('Qualified Prestige');assert.equal(c.classLevels[1].definition.prestige,true);assert.equal(c.bab,6);assert(Object.values(c.prerequisiteConfirmations).every(Boolean));
 console.log('PASS prestige is separated, unmet BAB blocks selection, manual requirements are recorded');
 await importChar({...base,name:'Custom Branch',ruleset:'custom',mechanics:'3.5'});await branch('normal','Fighter');await page.getByLabel('Class to advance').selectOption(await page.getByLabel('Class to advance').locator('option').filter({hasText:/Fighter · 5e/}).first().getAttribute('value'));for(const checkbox of await page.getByRole('dialog').getByRole('checkbox').all())await checkbox.check();await page.getByRole('button',{name:'Continue to level choices'}).click();await next();await next();await page.getByRole('button',{name:'Apply level up'}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();c=await saved('Custom Branch');assert.equal(c.classLevels[1].edition,'2014');assert.equal(c.ruleset,'custom');
 console.log('PASS Custom cross-edition class branching');
 await page.getByRole('button',{name:'Class level table',exact:true}).click();await page.getByRole('button',{name:'Edit personal progression'}).click();await page.getByLabel('Progression table (tab-separated columns)').fill('Level\tFeatures\n1\tPersonal feature');await page.getByLabel('Source attribution / notes').fill('Table-approved homebrew');await page.getByRole('button',{name:'Save personal progression'}).click();assert.match(await page.getByRole('dialog').innerText(),/Personal feature/);await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Class level table',exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/Personal feature/);await page.getByRole('button',{name:'Revert to canonical'}).click();assert.doesNotMatch(await page.getByRole('dialog').innerText(),/Personal feature/);await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('tab',{name:'Inventory',exact:true}).click();await page.getByRole('button',{name:'Browse published items'}).click();await page.getByLabel('Search published items').fill('Aberrant Sphere');const item=page.locator('.feature-detail').filter({hasText:'Aberrant Sphere'});await item.locator('summary').click();await item.getByRole('button',{name:'Add Aberrant Sphere'}).click();await page.getByLabel('Aberrant Sphere quantity').fill('2');await page.getByLabel('Aberrant Sphere notes').fill('Found in the vault');
 console.log('PASS personal progression editing/reverting and mutable item instances');
 const srd=JSON.parse(await fs.readFile('src/data/classes.json','utf8'));
 const revised=JSON.parse(await fs.readFile('src/data/srd2024.json','utf8'));
 const spells14=JSON.parse(await fs.readFile('src/data/spells.json','utf8'));
 for(const edition of ['2014','2024']) {
  const definitions=edition==='2014'?srd:revised.classes;
  const row=(name,level)=>({name,level,edition,catalogId:`${edition}:${name}`,definition:{...definitions.find(c=>c.name===name),edition}});
  const name=`Pact and Wizard ${edition}`,spell={...(edition==='2014'?spells14:revised.spells).find(s=>s.name==='Magic Missile'),id:`missile-${edition}`,edition,castingClassId:`${edition}:Wizard`,prepared:true};
  await importChar({...base,name,ruleset:edition,className:'Warlock',classDefinition:row('Warlock',3).definition,classLevels:[row('Warlock',3),row('Wizard',3)],level:6,abilities:{...base.abilities,cha:18},abilityBonuses:{},castingAbility:'cha',slotsUsed:{2:1},spells:[spell]});
  await page.getByRole('tab',{name:'Spells',exact:true}).click();
  assert.equal(await page.getByLabel('Casting ability',{exact:true}).inputValue(),'cha');
  await page.getByLabel('Spellcasting class').selectOption(`${edition}:Wizard`);
  assert.equal(await page.getByLabel('Casting ability',{exact:true}).inputValue(),'int');
  await page.getByLabel('Casting ability',{exact:true}).selectOption('wis');
  await page.getByLabel('Spellcasting class').selectOption(`${edition}:Warlock`);assert.equal(await page.getByLabel('Casting ability',{exact:true}).inputValue(),'cha');
  await page.getByLabel('Spellcasting class').selectOption(`${edition}:Wizard`);assert.equal(await page.getByLabel('Casting ability',{exact:true}).inputValue(),'wis');
  await page.getByRole('button',{name:'Cast',exact:true}).click();await page.getByLabel('Spell slot',{exact:true}).selectOption('pact:2');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();await page.getByRole('button',{name:'Close dice roller'}).click();
  assert.match(await page.getByRole('button',{name:'Pact Magic level 2 slot 1',exact:true}).getAttribute('class'),/used/);
  c=await waitSaved(name,{pactSlotsUsed:{2:1}});assert.equal(c.pactSlotsUsed[2],1);assert.equal(c.slotsUsed[2],1);
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Short rest',exact:true}).click();await page.getByLabel(/^Hit dice to spend/).first().fill('0');await page.getByRole('button',{name:'Complete short rest'}).click();
  c=await waitSaved(name,{pactSlotsUsed:{}});assert.equal(c.slotsUsed[2],1);assert.deepEqual(c.pactSlotsUsed,{});
  await page.getByRole('button',{name:'Cast',exact:true}).click();await page.getByLabel('Spell slot',{exact:true}).selectOption('2');await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();await page.getByRole('button',{name:'Close dice roller'}).click();
  c=await waitSaved(name,{slotsUsed:{2:2}});assert.equal(c.slotsUsed[2],2);assert.deepEqual(c.pactSlotsUsed,{});
  await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest'}).click();
  c=await waitSaved(name,{slotsUsed:{},pactSlotsUsed:{}});assert.deepEqual(c.slotsUsed,{});assert.deepEqual(c.pactSlotsUsed,{});
  await page.getByText('Spell slots and homebrew adjustments',{exact:true}).click();await page.getByLabel('Level 1 slots',{exact:true}).fill('7');assert.equal((await waitSaved(name,{slotOverride:[0,7,2,0,0,0,0,0,0,0]})).slotOverride[1],7);await page.getByRole('button',{name:'Use calculated spell slots'}).click();assert.equal(await page.getByLabel('Level 1 slots',{exact:true}).inputValue(),'4');
  console.log(`PASS ${edition} independent casting abilities, ordinary/Pact slots, correct rest recovery and override/revert`);
  const branchName=`Fighter to Rogue ${edition}`;
  await importChar({...base,name:branchName,ruleset:edition,className:'Fighter',classDefinition:row('Fighter',5).definition,classLevels:[row('Fighter',5)],level:5,subclass:'Champion',abilityBonuses:{},skillProf:{Athletics:true}});
  await branch('normal','Rogue');for(const checkbox of await page.getByRole('dialog').getByRole('checkbox').all())await checkbox.check();
  assert(await page.getByRole('button',{name:'Continue to level choices'}).isDisabled());
  assert.equal(await page.getByLabel('Multiclass skill',{exact:true}).locator('option').filter({hasText:/^Athletics$/}).count(),0);
  assert.equal(await page.getByLabel('Multiclass skill',{exact:true}).locator('option').filter({hasText:/^Performance$/}).count(),edition==='2014'?1:0);
  await page.getByLabel('Multiclass skill',{exact:true}).selectOption(edition==='2014'?'Performance':'Stealth');await page.getByRole('button',{name:'Continue to level choices'}).click();
  for(let step=0;step<4&&!await page.getByRole('button',{name:'Apply level up',exact:true}).isVisible();step++)await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  assert(await page.getByRole('button',{name:'Save level and choices'}).isDisabled());
  if(edition==='2014')await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Back to level review'}).click();
  assert(await page.getByRole('button',{name:'Apply level up',exact:true}).isVisible());assert.equal((await saved(branchName)).level,5);
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();
  await page.getByLabel('Rogue 1 Expertise: Athletics',{exact:true}).check();await page.getByLabel(`Rogue 1 Expertise: ${edition==='2014'?'Thieves’ tools':'Stealth'}`,{exact:true}).check();
  if(edition==='2024')await page.getByLabel('Rogue 1 Thieves’ Cant language: Draconic',{exact:true}).check();
  await page.getByRole('button',{name:'Save level and choices'}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();c=await saved(branchName);
  assert.equal(c.expertise.Athletics,true);if(edition==='2014')assert.equal(c.toolExpertise['thieves-tools'],true);else assert.equal(c.expertise.Stealth,true);
  assert.match(c.languages,/Thieves' Cant/);
assert.deepEqual(c.classLevels.map(r=>r.level),[5,1]);assert.equal(c.classLevels[1].name,'Rogue');
  assert.equal(c.skillProf[edition==='2014'?'Performance':'Stealth'],true);assert.equal(c.skillProf.Athletics,true);assert.equal(c.trainingGrants.length,1);
  await page.getByRole('tab',{name:'Traits',exact:true}).click();assert.match(await page.getByRole('region',{name:'Training and proficiencies'}).innerText(),/Thieves’ tools/);
  console.log(`PASS ${edition} normal multiclass creation, required proficiency choices and saved skill/tool grants`);
  const restName=`Mixed hit dice ${edition}`;
  await importChar({...base,name:restName,ruleset:edition,className:'Fighter',classDefinition:row('Fighter',3).definition,classLevels:[row('Fighter',3),row('Wizard',2)],level:5,hitDie:'d10',hitDiceUsed:0,hp:{current:10,max:100,temp:3},abilityBonuses:{}});
  await page.getByRole('button',{name:'Rest',exact:true}).click();
  await page.getByLabel(/^Hit dice to spend — Fighter/).fill('1');await page.getByLabel(/^Hit dice to spend — Wizard/).fill('1');
  await page.getByRole('button',{name:'Roll & spend selected hit dice',exact:true}).click();
  const diceResult=await page.getByRole('dialog',{name:'Take a rest'}).getByRole('status').innerText();
  assert.match(diceResult,/Fighter hit die · 1d10/);assert.match(diceResult,/Wizard hit die · 1d6/);
  const healing=Number(diceResult.match(/1d10: (\d+)/)[1])+Number(diceResult.match(/1d6: (\d+)/)[1])+4;
  c=await waitSaved(restName,{hitDiceUsed:2});assert.equal(c.hp.current,10+healing);assert.equal(c.hp.temp,3);
  assert.match(await page.getByRole('dialog',{name:'Take a rest'}).getByRole('status').innerText(),new RegExp(`Hit dice healing: ${healing} HP`));assert(await page.getByRole('dialog',{name:'Take a rest'}).isVisible());
  assert.equal(await page.getByLabel(/^Hit dice to spend — Wizard/).inputValue(),'0');
  await page.getByLabel(/^Hit dice to spend — Wizard/).fill('1');await page.getByRole('button',{name:'Complete short rest'}).click();await page.getByRole('button',{name:'Close dice roller'}).click();
  c=await waitSaved(restName,{hitDiceUsed:3});assert.deepEqual(c.hitDiceUsedByClass,{[`${edition}:Fighter`]:1,[`${edition}:Wizard`]:2});
  await page.getByRole('button',{name:'Rest',exact:true}).click();assert.match(await page.getByLabel(/^Hit dice to spend — Wizard/).getAttribute('max'),/^0$/);
  await page.getByRole('button',{name:'Long rest',exact:true}).click();
  if(edition==='2014') {
   await page.getByLabel(/^Recover hit dice — Wizard/).fill('2');assert(await page.getByRole('button',{name:'Complete long rest'}).isDisabled());
   await page.getByLabel(/^Recover hit dice — Fighter/).fill('0');assert(!await page.getByRole('button',{name:'Complete long rest'}).isDisabled());
  }
  await page.getByRole('button',{name:'Complete long rest'}).click();c=await waitSaved(restName,{hitDiceUsed:edition==='2014'?1:0});assert.equal(c.hp.current,100);assert.equal(c.hp.temp,0);assert.equal(c.hitDiceUsedByClass[`${edition}:Wizard`],0);
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:restName}).getByRole('button',{name:'Open character'}).click();
  await page.getByRole('button',{name:'Rest',exact:true}).click();assert.match(await page.getByLabel(/^Hit dice to spend — Fighter/).getAttribute('max'),edition==='2014'?/^2$/:/^3$/);await page.getByRole('button',{name:'Close dialog'}).click();
  console.log(`PASS ${edition} mixed dice sizes, sequential rolls, bounded spending, chosen/full recovery and saved counters`);
  const weaponName=`Wizard to Fighter training ${edition}`,swordItem={id:'training-sword',name:'Longsword',equipmentIndex:'longsword',equipped:true,qty:1};
  await importChar({...base,name:weaponName,ruleset:edition,className:'Wizard',classDefinition:row('Wizard',5).definition,classLevels:[row('Wizard',5)],level:5,hitDie:'d6',abilityBonuses:{},saveProf:{int:true,wis:true},inventory:[swordItem]});
  const swordAction=()=>page.locator('.action-row').filter({hasText:'Longsword'});
  assert.match(await swordAction().innerText(),/no proficiency bonus/);assert(await swordAction().getByRole('button',{name:'+2 to hit',exact:true}).isVisible());
  await branch('normal','Fighter');for(const checkbox of await page.getByRole('dialog').getByRole('checkbox').all())await checkbox.check();
  assert.match(await page.getByRole('region',{name:'Multiclass proficiencies'}).innerText(),/Martial weapons/);assert.doesNotMatch(await page.getByRole('region',{name:'Multiclass proficiencies'}).innerText(),/Heavy armor/);
  await page.getByRole('button',{name:'Continue to level choices'}).click();
  for(let step=0;step<4&&!await page.getByRole('button',{name:'Apply level up',exact:true}).isVisible();step++)await next();
  await page.getByRole('button',{name:'Apply level up',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:'LEVEL 6'}).waitFor();
  c=await waitSaved(weaponName,{level:6});assert.deepEqual(c.saveProf,{int:true,wis:true});assert.equal(c.inventory.length,1);assert(await swordAction().getByRole('button',{name:'+5 to hit',exact:true}).isVisible());
  await page.getByRole('tab',{name:'Traits',exact:true}).click();await page.getByLabel('Longsword proficiency',{exact:true}).uncheck();await page.getByRole('tab',{name:'Actions',exact:true}).click();assert(await swordAction().getByRole('button',{name:'+2 to hit',exact:true}).isVisible());
  await page.getByRole('tab',{name:'Traits',exact:true}).click();await page.getByRole('button',{name:'Use class weapon proficiencies'}).click();await page.getByRole('tab',{name:'Actions',exact:true}).click();assert(await swordAction().getByRole('button',{name:'+5 to hit',exact:true}).isVisible());
  console.log(`PASS ${edition} multiclass weapon attack bonus, preserved saves/equipment and personal proficiency override/revert`);
  if(edition==='2024') {
   await branch('normal','Bard');for(const checkbox of await page.getByRole('dialog').getByRole('checkbox').all())await checkbox.check();
   await page.getByLabel('Multiclass skill',{exact:true}).selectOption('Perception');assert(await page.getByRole('button',{name:'Continue to level choices'}).isDisabled());
   await page.getByLabel('Multiclass musical instrument',{exact:true}).selectOption('Flute');assert(!await page.getByRole('button',{name:'Continue to level choices'}).isDisabled());
   await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal((await saved(weaponName)).trainingGrants.length,1);
   console.log('PASS Bard requires both choices and canceled advancement grants nothing');
  }

  if(edition==='2014') {
   const oldName='Older mixed hit dice';
   await importChar({...base,name:oldName,ruleset:edition,className:'Fighter',classDefinition:row('Fighter',3).definition,classLevels:[row('Fighter',3),row('Wizard',2)],level:5,hitDie:'d10',hitDiceUsed:4,abilityBonuses:{}});
   await page.getByRole('button',{name:'Rest',exact:true}).click();assert(await page.getByRole('button',{name:'Complete short rest'}).isDisabled());assert.match(await page.getByRole('dialog').innerText(),/older save recorded only a total of 4/);
   await page.getByRole('button',{name:'Confirm spent dice'}).click();assert(!await page.getByRole('button',{name:'Complete short rest'}).isDisabled());
   c=await waitSaved(oldName,{hitDiceUsedByClass:{'2014:Fighter':3,'2014:Wizard':1}});assert.equal(c.hitDiceUsed,4);await page.getByRole('button',{name:'Complete short rest'}).click();
   console.log('PASS older mixed save requires review and preserves total expenditure');
  }

 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/integration-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByRole('button',{name:'Rest',exact:true}).click();await page.screenshot({path:'test-results/integration-rest-mobile.png',fullPage:true});assert.equal(await page.getByRole('dialog',{name:'Take a rest'}).evaluate(el=>el.scrollWidth>el.clientWidth),false);await page.getByRole('button',{name:'Close dialog'}).click();assert.deepEqual(errors,[]);console.log('PASS mobile integrated character/rest UI and no browser errors');
} catch(e){await page.screenshot({path:'test-results/integration-failure.png',fullPage:true});throw e;} finally {await browser.close();await server.close();}
