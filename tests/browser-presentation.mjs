import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5182}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage',...(process.platform==='win32'?[]:['--no-zygote','--single-process']),'--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const capture=async name=>page.screenshot({path:`test-results/presentation-${name}.png`,fullPage:true});
const scenic=()=>page.locator('.appearance-control').locator('summary').click();
const clear=async()=>{if(await page.getByRole('button',{name:'Clear history',exact:true}).count())await page.getByRole('button',{name:'Clear history',exact:true}).click();await page.locator('.dice-stage').waitFor({state:'hidden'});};
// Abrupt removal or disposal before a transparent frame must fail this check.
const expectDissipation=async()=>{
 const samples=await page.locator('.dice-stage').evaluate(stage=>new Promise((resolve,reject)=>{
  const samples=[],canvas=stage.querySelector('canvas'),context=canvas.dataset.engine==='webgl-physics'?canvas.getContext('webgl2'):null;let frame;
  const timeout=setTimeout(()=>{cancelAnimationFrame(frame);reject(new Error('Dice did not disappear'));},12000);
  const sample=()=>{
   if(!stage.isConnected||stage.hidden){clearTimeout(timeout);resolve(samples);return;}
   const style=getComputedStyle(canvas);
   samples.push({opacity:Number(getComputedStyle(stage).opacity),diceVisible:!context||(!context.isContextLost()&&canvas.dataset.ready==='true'&&style.opacity==='1'&&style.visibility==='visible')});frame=requestAnimationFrame(sample);
  };sample();
 }));
 assert(samples.filter(sample=>sample.opacity>0&&sample.opacity<1).length>=2,'Dice must fade through intermediate opacity before removal');
 assert(samples.filter(sample=>sample.opacity>0).every(sample=>sample.diceVisible),'Rendered dice must remain intact throughout the fade');
 assert.equal(samples.at(-1).opacity,0,'Dice must reach a fully transparent frame before teardown');
};
try {
 await fs.mkdir('test-results',{recursive:true});await page.goto('http://127.0.0.1:5182/');await page.getByRole('button',{name:'Explore the demo'}).waitFor();
 await capture('signin-dark');await scenic();await page.getByLabel('Scenic backgrounds',{exact:true}).uncheck();assert.equal(await page.locator('.auth-page').getAttribute('data-backgrounds'),'off');assert.equal(await page.locator('.auth-page').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
 await page.reload();await scenic();assert(!await page.getByLabel('Scenic backgrounds',{exact:true}).isChecked());await page.getByLabel('Scenic backgrounds',{exact:true}).check();await scenic();
 await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).waitFor();await capture('characters-dark');
 for(const name of ['Campaigns','Compendium','Encounters','Homebrew']){await page.locator('.ledger-nav nav').getByRole('button',{name,exact:true}).click();await capture(name.toLowerCase());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.locator('.ledger-nav nav').getByRole('button',{name:/Characters/}).click();await page.getByRole('button',{name:'Open character'}).click();await capture('sheet-dark');
 await page.getByRole('button',{name:'Dice roller',exact:true}).click();const tray=page.getByRole('complementary',{name:'Dice roller'});
 assert.equal(await tray.getByRole('radio').count(),5);
 let releaseRenderer;const rendererGate=new Promise(resolve=>{releaseRenderer=resolve;});
 await page.route('**/src/lib/diceRenderer*',async route=>{await rendererGate;await route.continue();});
 await tray.getByRole('button',{name:'d6',exact:true}).click();await page.locator('.dice-stage[data-phase="loading"]').waitFor();
 assert.equal(await page.locator('.dice-canvas').evaluate(e=>getComputedStyle(e).opacity),'0','Uninitialized WebGL canvas must stay hidden');
 releaseRenderer();await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 assert.equal(await page.locator('.dice-canvas').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 await page.unroute('**/src/lib/diceRenderer*');
 await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 const recordedRoll=await tray.locator('.roll-result').first().innerText();
 await expectDissipation();assert.equal(await tray.locator('.roll-result').first().innerText(),recordedRoll);await clear();

 // A new roll must cancel the pending fade without replacing the canvas.
 await tray.getByRole('button',{name:'d6',exact:true}).click();
 await page.waitForFunction(()=>{const stage=document.querySelector('.dice-stage');return stage&&Number(getComputedStyle(stage).opacity)<.8;});
 const fadingRoll=await page.locator('.dice-stage').getAttribute('data-roll-ids');
 await tray.getByRole('button',{name:'d20',exact:true}).click();
 await page.waitForFunction(previous=>document.querySelector('.dice-stage')?.dataset.rollIds!==previous,fadingRoll);
 await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.match(await tray.locator('.roll-result').first().innerText(),/1d20/);await expectDissipation();await clear();

 for(const [name,id] of [['Emberforge','emberforge'],['Moonstone','moonstone'],['Verdant','verdant'],['Voidglass','voidglass'],['Royal Ivory','royal-ivory']]){
  await tray.getByRole('radio',{name,exact:true}).check();await tray.getByLabel('Dice expression').fill('3d20+4');await tray.getByRole('button',{name:'Roll',exact:true}).click();
  const canvas=page.locator('.dice-canvas');await page.locator('.dice-canvas[data-ready="true"]').waitFor();assert.equal(await page.locator('.dice-stage').getAttribute('data-style'),id);assert.equal(await canvas.getAttribute('data-engine'),'webgl-physics');assert.equal(await canvas.getAttribute('data-ready'),'true');assert.equal(await canvas.getAttribute('data-top-values'),await canvas.getAttribute('data-values'));
  const values=(await canvas.getAttribute('data-values')).split(',').map(Number),history=await tray.locator('.roll-result').first().innerText();assert.match(history,new RegExp('\\['+values.join(', ')+'\\]'));assert.equal(Number(await tray.locator('.roll-result>strong').first().innerText()),values.reduce((a,b)=>a+b,4));await capture('dice-'+id);await clear();
 }
 for(const sides of [4,6,8,10,12]){await tray.getByRole('button',{name:`d${sides}`,exact:true}).click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();assert.equal(await page.locator('.dice-canvas').getAttribute('data-top-values'),await page.locator('.dice-canvas').getAttribute('data-values'));await clear();}
 await tray.getByRole('button',{name:'d6',exact:true}).click();await page.locator('.dice-canvas[data-phase="rolling"]').waitFor();await tray.getByRole('button',{name:'d20',exact:true}).click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();assert.equal(await page.locator('.dice-stage').count(),1);assert.match(await tray.locator('.roll-result').first().innerText(),/1d20/);await clear();
 await tray.getByLabel('D20 roll mode').selectOption('advantage');await tray.getByRole('button',{name:'d20',exact:true}).click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();let values=(await page.locator('.dice-canvas').getAttribute('data-values')).split(',').map(Number);assert.equal(values.length,2);assert.equal(Number(await tray.locator('.roll-result>strong').first().innerText()),Math.max(...values));await clear();
 await tray.getByLabel('D20 roll mode').selectOption('normal');await tray.getByRole('button',{name:'d100',exact:true}).click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();values=(await page.locator('.dice-canvas').getAttribute('data-values')).split(',').map(Number);assert.equal(Number(await tray.locator('.roll-result>strong').first().innerText()),values[0]*10+values[1]||100);await clear();
 await tray.getByRole('button',{name:'d10',exact:true}).click();await page.locator('.dice-canvas[data-phase="rolling"]').waitFor();await page.setViewportSize({width:1,height:1});await page.setViewportSize({width:1440,height:1000});await page.locator('.dice-canvas[data-ready="true"]').waitFor();await clear();
 await tray.getByLabel('Animated dice',{exact:true}).uncheck();await tray.getByRole('button',{name:'d6',exact:true}).click();assert.equal(await page.locator('.dice-stage').isVisible(),false);assert.equal(await tray.locator('.roll-result').count(),1);await clear();
 await tray.getByLabel('Animated dice',{exact:true}).check();await page.emulateMedia({reducedMotion:'reduce'});await tray.getByRole('button',{name:'d8',exact:true}).click();assert.equal(await page.locator('.dice-stage').isVisible(),false);assert.match(await tray.innerText(),/Reduced motion/);await clear();await page.emulateMedia({reducedMotion:'no-preference'});
 await tray.getByLabel('Dice expression').fill('not dice');await tray.getByRole('button',{name:'Roll',exact:true}).click();assert.equal(await page.locator('.dice-stage').isVisible(),false);await page.getByRole('button',{name:'Dismiss error'}).click();
 await tray.getByRole('button',{name:'Close dice roller'}).click();await scenic();await page.getByLabel('Scenic backgrounds',{exact:true}).uncheck();assert.equal(await page.locator('.sheet-heading').evaluate(e=>getComputedStyle(e).backgroundImage),'none');await scenic();await capture('sheet-plain');
 await page.getByRole('button',{name:'Light appearance',exact:true}).click();await capture('sheet-light-plain');await scenic();await page.getByLabel('Scenic backgrounds',{exact:true}).check();await scenic();await capture('sheet-light');
 await page.setViewportSize({width:390,height:844});await capture('sheet-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Dice roller',exact:true}).click();await tray.getByRole('button',{name:'d12',exact:true}).click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();await capture('dice-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await tray.getByRole('button',{name:'Close dice roller'}).click();
 await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Dice roller',exact:true}).click();assert(await page.getByRole('radio',{name:'Royal Ivory',exact:true}).isChecked());assert(await tray.getByLabel('Animated dice',{exact:true}).isChecked());
 await page.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:getContext.call(this,kind,...args);};});
 await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Dice roller',exact:true}).click();await tray.getByRole('button',{name:'d6',exact:true}).click();await page.locator('.dice-stage[data-phase="unavailable"]').waitFor();assert.equal(await tray.locator('.roll-result').count(),1);assert.match(await tray.locator('.roll-result').innerText(),/1d6/);
 await expectDissipation();assert.equal(await tray.locator('.roll-result').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS WebGL physics, all standard shapes, rapid rolls, no-WebGL fallback, all five dice styles, exact rendered results, advantage, percentile pairs, invalid rolls, plain/scenic backgrounds, saved preferences, reduced motion, all main pages and mobile layout');
} catch(e){await capture('failure');throw e;}finally{await browser.close();await server.close();}
