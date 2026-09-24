import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5178}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const group=name=>page.getByRole('group',{name:`${name} resource`,exact:true});
const remaining=async(name,expected)=>assert.equal(await group(name).locator('.resource-count').innerText(),expected);
const importChar=async c=>{await page.locator('input[type=file]').setInputFiles({name:'resource-character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(c))});await page.locator('.sheet-identity').filter({hasText:c.name}).waitFor();};
const saved=async name=>page.evaluate(async name=>{const rows=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+rows.find(r=>r.name===name).id)).value);},name);
const rest=async(kind,{meditate=false,sorcery=false}={})=>{await page.getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('button',{name:kind==='long'?'Long rest':'Short rest',exact:true}).click();if(meditate)await page.getByLabel(/Meditated for/).check();if(sorcery)await page.getByLabel(/Use Sorcerous Restoration/).check();await page.getByRole('button',{name:`Complete ${kind} rest`}).click();};
try {
 await fs.mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:5178/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).click();
 for(const edition of ['2014','2024']) {
  const row=(name,level)=>({catalogId:`${edition}:${name}`,name,level,edition,definition:{index:name.toLowerCase(),name,edition,hit_die:name==='Fighter'?10:name==='Monk'?8:6}});
  const name=`Resource checks ${edition}`,c={name,ruleset:edition,className:'Fighter',classLevels:[row('Fighter',4),row('Monk',2),row('Sorcerer',5)],level:11,race:'Human',hitDie:'d10',hp:{current:30,max:30,temp:0},abilities:{str:14,dex:14,con:14,int:14,wis:14,cha:16},abilityBonuses:{},inventory:[],actions:[],spells:[]};
  await importChar(c);
  const max=edition==='2014'?1:3,points=edition==='2014'?'Ki Points':'Focus Points';
  await remaining('Second Wind',`${max} / ${max}`);await remaining(points,'2 / 2');await remaining('Sorcery Points','5 / 5');
  for(const [resource,n] of [['Second Wind',max],[points,2],['Sorcery Points',5],['Action Surge',1]]) {await page.getByLabel(`${resource} amount`,{exact:true}).fill(String(n));await group(resource).getByRole('button',{name:'Use',exact:true}).click();assert(await group(resource).getByRole('button',{name:'Use',exact:true}).isDisabled());}
  await rest('short');await remaining('Second Wind',edition==='2014'?'1 / 1':'1 / 3');await remaining(points,edition==='2014'?'0 / 2':'2 / 2');await remaining('Sorcery Points','0 / 5');await remaining('Action Surge','1 / 1');
  await rest('short',{meditate:edition==='2014',sorcery:edition==='2024'});await remaining(points,'2 / 2');await remaining('Sorcery Points',edition==='2014'?'0 / 5':'2 / 5');
  if(edition==='2024') {await page.getByRole('button',{name:'Rest',exact:true}).click();assert(await page.getByLabel(/Use Sorcerous Restoration/).isDisabled());await page.getByRole('button',{name:'Close dialog'}).click();}
  await rest('long');await remaining('Second Wind',`${max} / ${max}`);await remaining('Sorcery Points','5 / 5');
  await page.getByLabel('Second Wind amount',{exact:true}).fill('1');await group('Second Wind').getByRole('button',{name:'Use',exact:true}).click();
  await group('Second Wind').getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Maximum uses',{exact:true}).fill('8');await page.getByLabel('Rest recovery',{exact:true}).selectOption('none');await page.getByRole('button',{name:'Save resource',exact:true}).click();await remaining('Second Wind','7 / 8');
  await rest('long');await remaining('Second Wind','7 / 8');await group('Second Wind').getByRole('button',{name:'Use class progression',exact:true}).click();await remaining('Second Wind',`${max-1} / ${max}`);
  await group('Second Wind').getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await group('Second Wind').count(),0);
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:name}).getByRole('button',{name:'Open character'}).click();assert.equal(await group('Second Wind').count(),0);
  await page.getByRole('button',{name:'Restore removed class counters',exact:true}).click();await remaining('Second Wind',`${max} / ${max}`);
  await page.getByRole('button',{name:'Add resource',exact:true}).click();await page.getByLabel('Resource name',{exact:true}).fill('Moonstone charges');await page.getByLabel('Maximum uses',{exact:true}).fill('6');await page.getByLabel('Rest recovery',{exact:true}).selectOption('partial');await page.getByLabel('Uses recovered on short rest').fill('2');await page.getByRole('button',{name:'Save resource',exact:true}).click();
  await page.getByLabel('Moonstone charges amount',{exact:true}).fill('4');await group('Moonstone charges').getByRole('button',{name:'Use',exact:true}).click();await rest('short');await remaining('Moonstone charges','4 / 6');
  await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:name}).getByRole('button',{name:'Open character'}).click();await remaining('Moonstone charges','4 / 6');
  for(let i=0;i<100;i++){if((await saved(name)).resources.some(r=>r.name==='Moonstone charges'&&r.used===2))break;await new Promise(r=>setTimeout(r,50));}
  const stored=await saved(name);assert.equal(stored.resources.find(r=>r.name==='Moonstone charges').used,2);assert.equal(stored.resources.find(r=>r.name==='Second Wind').max,max);
  console.log(`PASS ${edition} class resources, partial/full/conditional rest recovery, custom counter, override/revert, removal/reopen and persisted expenditure`);
  await importChar({...c,name:`Old resources ${edition}`,resources:[{id:'old',name:'Second Wind',max:7,used:4,reset:'short',note:'Kept'}]});await remaining('Second Wind','3 / 7');assert.equal(await group('Second Wind').count(),1);await group('Second Wind').getByRole('button',{name:'Use Fighter progression'}).click();await remaining('Second Wind',`0 / ${max}`);
  for(let i=0;i<100;i++){const stored=(await saved(`Old resources ${edition}`)).resources.find(r=>r.id==='old');if(stored.classResourceKey){assert.equal(stored.note,'Kept');break;}if(i===99)assert.fail('Adopted resource was not saved');await new Promise(r=>setTimeout(r,50));}
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/resources-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await group('Second Wind').getByRole('button',{name:'Edit',exact:true}).click();await page.screenshot({path:'test-results/resource-edit-mobile.png',fullPage:true});assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.deepEqual(errors,[]);console.log('PASS older counters stay manual until adopted, mobile counters/editor and no browser errors');
} catch(e){await page.screenshot({path:'test-results/resources-failure.png',fullPage:true});throw e;} finally {await browser.close();await server.close();}
