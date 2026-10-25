import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:5222,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']}),failures=[];
try{
 for(const scenario of ['hermit-trance','custom-mtf','custom-motm']){
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  try{
   const custom=scenario.startsWith('custom'),version=scenario==='custom-mtf'?'mtf':'motm',next=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).click(),choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:new RegExp('^'+name+'$')})}).first().click();
   await page.goto('http://127.0.0.1:5222');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill(scenario);
   if(custom){await page.getByRole('button',{name:/^Custom/}).click();await page.getByLabel('Base mechanics').selectOption('2014');}
   await next();await page.getByLabel('Search class',{exact:true}).fill('Fighter');
   if(custom)await page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:/^Fighter$/})}).filter({hasText:'3.5'}).first().click();else await choose('Fighter');
   await next();await page.getByLabel('Search race',{exact:true}).fill('Shadar-kai');await page.locator(`[data-catalog-id="2014:shadar-kai-${version}"]`).click();
   if(!custom){await page.getByText('Trance weapon and tool training (optional)',{exact:true}).click();await page.getByLabel('Trance proficiency 1',{exact:true}).selectOption('lute');await page.getByLabel('Trance proficiency 2',{exact:true}).selectOption('herbalism-kit');}
   await next();await choose(custom?'Sailor':'Hermit');await next();
   if(version==='motm'){await page.getByLabel('Ability increase 1').selectOption('wis');await page.getByLabel('Ability increase 2').selectOption('dex');}
   await next();
   if(custom){assert.equal(await page.getByLabel('Replacement background skill',{exact:true}).count(),1,'Custom training must expose the required background replacement');await page.getByLabel('Replacement background skill',{exact:true}).selectOption('Stealth');if(version==='motm')await page.getByLabel('Shadar-kai language 1',{exact:true}).fill('Elvish');assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isEnabled());}
   else{
    assert.equal(await page.getByLabel('Trance proficiency 2',{exact:true}).count(),1,'A new background conflict must be correctable on Training');assert(await page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true}).isDisabled());await page.getByLabel('Trance proficiency 2',{exact:true}).selectOption('poisoners-kit');
    await page.getByRole('button',{name:'Acrobatics',exact:true}).click();await page.getByRole('button',{name:'Survival',exact:true}).click();await page.getByLabel('Shadar-kai language 1',{exact:true}).fill('Elvish');await page.getByLabel('Hermit language 1',{exact:true}).fill('Giant');await next();await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:scenario}).waitFor();
    await page.getByRole('tab',{name:'Traits',exact:true}).click();assert.match(await page.getByRole('region',{name:'Training and proficiencies'}).innerText(),/Poisoner's Kit/);
   }
   assert.deepEqual(errors,[]);console.log('PASS '+scenario);
  }catch(error){failures.push(scenario+': '+error.message);console.log('FAIL '+scenario+': '+error.message);}finally{await page.close();}
 }
 assert.deepEqual(failures,[]);
}finally{await browser.close();await server.close();}
