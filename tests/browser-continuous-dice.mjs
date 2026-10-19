import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=process.env.DICE_TEST_URL?null:await createServer({server:{host:'127.0.0.1',port:5189}});
await server?.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.addInitScript(()=>{
  window.diceContexts=new Set();window.diceContextLosses=0;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   const context=original.call(this,kind,...args);
   if(/webgl/i.test(kind)&&context&&!window.diceContexts.has(context)){
    window.diceContexts.add(context);this.addEventListener('webglcontextlost',()=>window.diceContextLosses++);
   }return context;
  };
 });
 await page.goto(process.env.DICE_TEST_URL||'http://127.0.0.1:5189/');
 await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character',exact:true}).click();
 const initiative=page.getByRole('button',{name:/Initiative ↗/});
 await initiative.click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 await page.evaluate(()=>{window.originalDiceCanvas=document.querySelector('.dice-canvas');window.firstDiceIds=window.originalDiceCanvas.dataset.diceIds;});
 for(let i=0;i<5;i++){
  await initiative.click();
  assert(await page.evaluate(()=>document.querySelector('.dice-canvas')===window.originalDiceCanvas),'Repeated rolls must keep the original canvas');
 }
 await page.waitForFunction(()=>document.querySelector('.dice-canvas')?.dataset.values.split(',').length===6);
 assert.equal(await page.evaluate(()=>window.diceContexts.size),1,'A burst must use one WebGL context');
 assert(await page.evaluate(()=>window.firstDiceIds.split(',').every(id=>window.originalDiceCanvas.dataset.diceIds.split(',').includes(id))),'New rolls must retain existing dice');

 // Reset the inactivity deadline while older dice are still rolling.
 await page.waitForTimeout(300);await initiative.click();
 const lastClick=await page.evaluate(()=>performance.now());
 await page.waitForTimeout(350);
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1','An earlier idle timer must not fade a later roll');
 await page.locator('.dice-stage[data-phase="dissipating"]').waitFor();
 const idle=await page.evaluate(()=>performance.now())-lastClick;
 assert(idle>=500&&idle<1000,`Fade must begin after about 600 ms without a roll, got ${idle} ms`);

 // A click during the fade revives the same canvas and keeps the older dice.
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.dice-stage')).opacity)<.8);
 await initiative.click();await page.waitForFunction(()=>document.querySelector('.dice-canvas').dataset.values.split(',').length===8);
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.locator('.dice-stage').waitFor({state:'hidden'});
 assert(await page.evaluate(()=>document.querySelector('.dice-canvas')===window.originalDiceCanvas));
 assert.equal(await page.evaluate(()=>window.diceContextLosses),0,'Idle cleanup must not destroy the context');

 const tray=page.getByRole('complementary',{name:'Dice roller'});
 await tray.locator('.roll-result').first().waitFor();
 assert.equal(await tray.locator('.roll-result').count(),8,'Every initiative result must remain in history');
 // Bound rendered geometry during sustained spam while preserving all results.
 for(let i=0;i<22;i++)await tray.getByRole('button',{name:i%2?'d6':'d20',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.dice-canvas').dataset.values.split(',').length===18);
 assert.equal(await tray.locator('.roll-result').count(),30);
 assert.equal(await page.evaluate(()=>window.diceContexts.size),1,'Later bursts must reuse the context too');
 assert.equal(await page.evaluate(()=>window.diceContextLosses),0);
 await tray.getByLabel('Animated dice',{exact:true}).uncheck();await page.locator('.dice-stage').waitFor({state:'hidden'});
 await tray.getByLabel('Animated dice',{exact:true}).check();await page.emulateMedia({reducedMotion:'reduce'});
 await initiative.click();assert.equal(await page.locator('.dice-stage').isVisible(),false);

 // A slow first load must accumulate clicks without allocating extra contexts.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();
 await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character',exact:true}).click();
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/*diceRenderer*',async route=>{await gate;await route.continue();});
 try {
  for(let i=0;i<22;i++)await initiative.click();
  assert.equal(await page.evaluate(()=>window.diceContexts.size),0);
 }finally{release();}
 await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 assert.equal((await page.locator('.dice-canvas').getAttribute('data-values')).split(',').length,18);
 assert.equal(await tray.locator('.roll-result').count(),22);
 assert.equal(await page.evaluate(()=>window.diceContexts.size),1);
 await page.locator('.dice-stage').waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);
 console.log('PASS repeated initiative/mixed rolls append dice on one canvas/context, 600 ms idle reset, fade interruption, reuse after idle, bounded geometry, saved results and reduced motion');
}finally{await browser.close();await server?.close();}
