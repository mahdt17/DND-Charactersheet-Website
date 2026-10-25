import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

// Known real inputs make this regression independent of click timing and RNG.
// The old renderer's isolated worlds cannot report a new/old collision pair.
export async function verifySharedDiceCollisions(browser,url,base='/'){
 const page=await browser.newPage({viewport:{width:900,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const root=new URL(base,url).href;await page.goto(root);
  await page.evaluate(async root=>{
   const [{createDiceRenderer},{diceStyles}]=await Promise.all([import(new URL('src/lib/diceRenderer.js',root).href),import(new URL('src/lib/presentation.js',root).href)]);
   const canvas=document.createElement('canvas');canvas.id='collision-fixture';Object.assign(canvas.style,{position:'fixed',left:'20px',top:'20px',width:'640px',height:'400px',zIndex:100000,background:'#1a1f28'});document.body.append(canvas);
   window.collisionFixture={renderer:createDiceRenderer(canvas),styles:diceStyles};
   window.collisionFixture.renderer.addDice(Array.from({length:18},(_,i)=>({id:'collision-fixture:'+i,sides:6,value:i%6+1})),diceStyles[1]);
  },root);
  const canvas=page.locator('#collision-fixture');await page.locator('#collision-fixture[data-phase="settled"]').waitFor();
  assert.equal(await canvas.getAttribute('data-values'),await canvas.getAttribute('data-top-values'));
  await page.evaluate(()=>window.collisionFixture.renderer.addDice([{id:'incoming-fixture:0',sides:20,value:17}],window.collisionFixture.styles[0]));
  const pairs=JSON.parse(await canvas.getAttribute('data-collision-pairs'));
  assert(pairs.some(pair=>pair.includes('incoming-fixture:0')&&pair.some(id=>id.startsWith('collision-fixture:'))),'New rolls must hit sleeping dice from the earlier roll');
  assert(pairs.every(pair=>!pair.includes('collision-fixture:0')),'Pruned dice must leave the physical world');
  assert.equal((await canvas.getAttribute('data-dice-ids')).split(',').length,18);
  assert.equal((await canvas.getAttribute('data-values')).split(',').at(-1),'17');
  assert.equal((await canvas.getAttribute('data-top-values')).split(',').at(-1),'17','The new die lands on its recorded value');
  mkdirSync('test-results',{recursive:true});
  await page.waitForTimeout(550);await canvas.screenshot({path:'test-results/dice-collision-moving.png'});
  await page.locator('#collision-fixture[data-phase="settled"]').waitFor();await canvas.screenshot({path:'test-results/dice-collision-settled.png'});
  // Per-roll styles stay independent even when the lazy-load queue is coalesced.
  await page.evaluate(()=>{const f=window.collisionFixture;f.renderer.clear();f.renderer.addBatches([{dice:[{id:'style-a',sides:20,value:12}],style:f.styles[0]},{dice:[{id:'style-b',sides:6,value:3}],style:f.styles[1]}]);});
  await page.locator('#collision-fixture[data-phase="settled"]').waitFor();assert.equal(await canvas.getAttribute('data-values'),'12,3');assert.equal(await canvas.getAttribute('data-top-values'),'12,3');await canvas.screenshot({path:'test-results/dice-collision-styles.png'});
  await page.evaluate(()=>window.collisionFixture.renderer.dispose());assert.deepEqual(errors,[]);
 }finally{await page.close();}
}
