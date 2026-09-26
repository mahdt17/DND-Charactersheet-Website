import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5184}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const classes14=JSON.parse(await fs.readFile('src/data/classes.json','utf8'));
const modern=JSON.parse(await fs.readFile('src/data/srd2024.json','utf8'));
const legacy=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8'));
const spells14=JSON.parse(await fs.readFile('src/data/spells.json','utf8'));
const definition=(name,edition)=>({...((edition==='3.5'?legacy:edition==='2024'?modern.classes:classes14).find(c=>c.name===name)),edition});
const row=(name,edition,level)=>({name,level,edition,catalogId:`${edition}:${name}`,definition:{...definition(name,edition),catalogId:`${edition}:${name}`}});
const make=(edition,rows)=>({name:`Access ${edition}`,ruleset:edition,mechanics:edition,className:rows[0].name,classDefinition:rows[0].definition,classLevels:rows,level:rows.reduce((n,r)=>n+r.level,0),race:'Human',abilities:{str:16,dex:16,con:16,int:18,wis:18,cha:18},hp:{current:20,max:20,temp:0},spells:[],inventory:[],actions:[],feats:[],notes:''});
const importChar=async c=>{await page.locator('input[type=file]').setInputFiles({name:'character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();await page.getByRole('tab',{name:'Spells',exact:true}).click();};
const closeManager=async edition=>edition==='2014'?page.getByRole('button',{name:'Close dialog',exact:true}).click():page.getByRole('button',{name:'Done',exact:true}).click();
const picker=edition=>page.getByRole('region',{name:edition==='3.5'?'Available class spells':'Prepared class spells',exact:true});
try {
 await page.goto('http://127.0.0.1:5184');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).click();
 for(const edition of ['2014','2024','3.5']){
  await importChar(make(edition,[row('Cleric',edition,3)]));await page.getByRole('button',{name:'Manage spells',exact:true}).click();
  if(edition==='2014'){
   await page.getByLabel('Find a class spell').fill('Magic Missile');assert.equal(await page.locator('.catalog-list').getByRole('button',{name:/^Add Magic Missile/}).count(),0);
   await page.getByLabel('Find a class spell').fill('Bless');await page.locator('.catalog-list').getByRole('button',{name:/^Add Bless /}).first().waitFor();
  } else {
   await picker(edition).getByLabel('Search spells',{exact:true}).fill('Magic Missile');assert.equal(await picker(edition).getByRole('button',{name:/^Select Magic Missile/}).count(),0);
   await picker(edition).getByLabel('Search spells',{exact:true}).fill('Bless');await picker(edition).getByRole('button',{name:/^Select Bless /}).first().waitFor();
  }
  await closeManager(edition);
 }
 const bad={...spells14.find(s=>s.name==='Magic Missile'),id:'bad-spell',edition:'2014',prepared:true,castingClassId:'2014:Cleric'};
 await importChar({...make('2014',[row('Cleric','2014',3)]),spells:[bad]});
 await page.getByRole('region',{name:'Spells needing review'}).waitFor();assert(await page.locator('.spell-item').getByRole('button',{name:'Cast',exact:true}).isDisabled());
 await page.getByRole('button',{name:'Manage spells',exact:true}).click();await page.getByText('Additional spell access from a feature',{exact:true}).click();
 await page.getByLabel('Find a granted spell').fill('Magic Missile');await page.getByLabel('Granted spell',{exact:true}).selectOption('2014:magic-missile');await page.getByLabel('Feature or source granting access').fill('Table-approved feature');await page.getByRole('button',{name:'Record spell access'}).click();await closeManager('2014');
 assert.equal(await page.getByRole('region',{name:'Spells needing review'}).count(),0);assert(!await page.locator('.spell-item').getByRole('button',{name:'Cast',exact:true}).isDisabled());
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:'Access 2014'}).last().getByRole('button',{name:'Open character'}).click();await page.getByRole('tab',{name:'Spells',exact:true}).click();assert(!await page.locator('.spell-item').getByRole('button',{name:'Cast',exact:true}).isDisabled());
 await importChar({...make('2024',[row('Cleric','2024',1),row('Wizard','2024',5)]),name:'Multiclass access'});await page.getByRole('button',{name:'Manage spells',exact:true}).click();
 await picker('2024').getByLabel('Search spells',{exact:true}).fill('Fireball');assert.equal(await page.getByRole('button',{name:/^Select Fireball/}).count(),0);
 await page.getByLabel('Spellcasting class').selectOption('2024:Wizard');const wizardPicker=page.getByRole('region',{name:'Spellbook spells',exact:true});await wizardPicker.getByLabel('Search spells',{exact:true}).fill('Fireball');await wizardPicker.getByRole('button',{name:/^Select Fireball/}).click();
 await page.getByLabel('Spellcasting class').selectOption('2024:Cleric');assert.equal(await page.locator('.spell-item').count(),0);
 const legacySpells=JSON.parse(await fs.readFile('src/data/srd35.json','utf8')).spells;
 const bless={...legacySpells.find(s=>s.name==='Bless'),id:'legacy-bless',castingClassId:'3.5:Cleric',prepared:true};
 await importChar({...make('3.5',[row('Cleric','3.5',3),row('Wizard','3.5',3)]),name:'Legacy slot ownership',slotsUsed:{1:1},spells:[bless]});
 assert.match(await page.getByRole('button',{name:'Cleric Level 1 slot 1',exact:true}).getAttribute('class'),/used/);
 await page.getByText('Spell slots and homebrew adjustments',{exact:true}).click();await page.getByLabel('Level 1 slots',{exact:true}).fill('6');
 await page.getByLabel('Spellcasting class').selectOption('3.5:Wizard');assert.equal(await page.getByLabel('Level 1 slots',{exact:true}).inputValue(),'3');
 await page.getByLabel('Level 1 slots',{exact:true}).fill('2');await page.getByLabel('Spellcasting class').selectOption('3.5:Cleric');assert.equal(await page.getByLabel('Level 1 slots',{exact:true}).inputValue(),'6');
 await page.locator('.spell-item').getByRole('button',{name:'Cast',exact:true}).click();await page.getByRole('button',{name:'Cast & spend slot',exact:true}).click();
 assert.match(await page.getByRole('button',{name:'Cleric Level 1 slot 2',exact:true}).getAttribute('class'),/used/);
 await page.getByLabel('Spellcasting class').selectOption('3.5:Wizard');assert.doesNotMatch(await page.getByRole('button',{name:'Wizard Level 1 slot 1',exact:true}).getAttribute('class'),/used/);
 await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:'Long rest',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();
 await page.getByLabel('Spellcasting class').selectOption('3.5:Cleric');assert.doesNotMatch(await page.getByRole('button',{name:'Cleric Level 1 slot 1',exact:true}).getAttribute('class'),/used/);assert.equal(await page.getByLabel('Level 1 slots',{exact:true}).inputValue(),'6');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/spell-access-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS browser class restrictions in all three editions, preserved invalid spells, source grant and reopen, per-class multiclass selection, 3.5 slot ownership/overrides/rests and mobile layout');
} catch(error){await page.screenshot({path:'test-results/spell-access-failure.png',fullPage:true});await fs.writeFile('test-results/spell-access-failure.html',await page.content());throw error;} finally {await browser.close();await server.close();}
