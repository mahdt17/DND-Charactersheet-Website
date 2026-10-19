import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=process.env.DICE_TEST_URL?null:await createServer({server:{host:'127.0.0.1',port:5189}});
await server?.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const checkSettleDelay=async()=>{
 const events=await page.evaluate(()=>window.dicePhases),fade=events.findLastIndex(e=>e.phase==='dissipating');
 assert(fade>0,'Dice must fade after settling');
 assert.equal(events[fade-1].phase,'settled','The whole group must settle before fading');
 const delay=events[fade].time-events[fade-1].time;
 assert(delay>=550&&delay<1200,`Fade must start about 600 ms after the last die settles, got ${delay} ms`);
};
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
  window.dicePhases=[];let previous;
  new MutationObserver(()=>{
   const stage=document.querySelector('.dice-stage'),canvas=stage?.querySelector('canvas');
   if(!stage||!canvas)return;
   const phase=stage.hidden?'idle':stage.dataset.phase==='dissipating'?'dissipating':canvas.dataset.phase;
   if(phase&&phase!==previous){window.dicePhases.push({phase,time:performance.now()});previous=phase;}
  }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-phase','hidden']});
 });
 await page.goto(process.env.DICE_TEST_URL||'http://127.0.0.1:5189/');
 await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character',exact:true}).click();
 const initiative=page.getByRole('button',{name:/Initiative ↗/});
 await initiative.click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 // One die must finish rolling even when no further clicks arrive.
 await page.waitForTimeout(750);
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1','A single die must not fade while still rolling');
 await page.locator('.dice-stage').waitFor({state:'hidden'});await checkSettleDelay();
 await initiative.click();await page.locator('.dice-canvas[data-ready="true"]').waitFor();
 await page.evaluate(()=>{window.originalDiceCanvas=document.querySelector('.dice-canvas');window.firstDiceIds=window.originalDiceCanvas.dataset.diceIds;});
 for(let i=0;i<5;i++){
  await initiative.click();
  assert(await page.evaluate(()=>document.querySelector('.dice-canvas')===window.originalDiceCanvas),'Repeated rolls must keep the original canvas');
 }
 await page.waitForFunction(()=>document.querySelector('.dice-canvas')?.dataset.values.split(',').length===6);
 assert.equal(await page.evaluate(()=>window.diceContexts.size),1,'A burst must use one WebGL context');
 assert(await page.evaluate(()=>window.firstDiceIds.split(',').every(id=>window.originalDiceCanvas.dataset.diceIds.split(',').includes(id))),'New rolls must retain existing dice');

 // A new die during the settled hold cancels the previous group's deadline.
 await page.locator('.dice-canvas[data-phase="settled"]').waitFor();
 await page.waitForTimeout(250);await initiative.click();
 await page.waitForTimeout(750);
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1','An earlier settled timer must not fade a moving die');
 await page.locator('.dice-stage[data-phase="dissipating"]').waitFor();
 await checkSettleDelay();

 // A click during the fade revives the same canvas and keeps the older dice.
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.dice-stage')).opacity)<.8);
 await initiative.click();await page.waitForFunction(()=>document.querySelector('.dice-canvas').dataset.values.split(',').length===8);
 assert.equal(await page.locator('.dice-stage').evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.locator('.dice-stage').waitFor({state:'hidden'});await checkSettleDelay();
 assert(await page.evaluate(()=>document.querySelector('.dice-canvas')===window.originalDiceCanvas));
 assert.equal(await page.evaluate(()=>window.diceContextLosses),0,'Idle cleanup must not destroy the context');

 const tray=page.getByRole('complementary',{name:'Dice roller'});
 await tray.locator('.roll-result').first().waitFor();
 assert.equal(await tray.locator('.roll-result').count(),9,'Every initiative result must remain in history');
 // Bound rendered geometry during sustained spam while preserving all results.
 for(let i=0;i<22;i++)await tray.getByRole('button',{name:i%2?'d6':'d20',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.dice-canvas').dataset.values.split(',').length===18);
 assert.equal(await tray.locator('.roll-result').count(),31);
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
 await page.locator('.dice-stage').waitFor({state:'hidden'});await checkSettleDelay();
 assert.deepEqual(errors,[]);
 console.log('PASS single and repeated dice settle before the 600 ms hold, hold/fade interruption, shared context, queued rolls, bounded geometry, saved results and reduced motion');
}finally{await browser.close();await server?.close();}
