import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  await page.goto(process.env.DICE_TEST_URL);
  await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.getByRole('button',{name:'Dice roller',exact:true}).click();
  const tray=page.getByRole('complementary',{name:'Dice roller'});
  const faces=page.locator('.dice-stage-results strong'),totals=tray.locator('.roll-result strong');
  await tray.getByLabel('D20 roll mode').selectOption('advantage');
  await tray.getByRole('button',{name:'d20',exact:true}).click();
  await page.locator('.dice-canvas[data-phase="rolling"]').waitFor();
  assert.equal(await totals.count(),0);
  assert.equal(await faces.count(),0);
  await tray.getByLabel('D20 roll mode').selectOption('disadvantage');
  await tray.getByRole('button',{name:'d20',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.dice-canvas').dataset.values.split(',').length===4);
  assert.equal(await totals.count(),0);
  assert.equal(await faces.count(),0);
  const revealed=await page.waitForFunction(()=>{
    const canvas=document.querySelector('.dice-canvas');
    const captions=[...document.querySelectorAll('.dice-stage-results strong')].map(e=>Number(e.textContent));
    const history=[...document.querySelectorAll('.roll-result strong')].map(e=>Number(e.textContent));
    if(captions.length===2&&history.length===2)return {phase:canvas.dataset.phase,faces:canvas.dataset.topValues.split(',').map(Number),captions,history};
  });
  const result=await revealed.jsonValue();
  assert.equal(result.phase,'settled');
  const [a,b,c,d]=result.faces,expected=[Math.max(a,b),Math.min(c,d)];
  assert.deepEqual(result.captions,expected);
  assert.deepEqual(result.history,[...expected].reverse());
  await tray.getByRole('button',{name:'d6',exact:true}).click();
  await tray.getByLabel('Animated dice',{exact:true}).uncheck();
  await page.waitForFunction(()=>document.querySelectorAll('.roll-result strong').length===3);
  await tray.getByRole('button',{name:'Clear history'}).click();
  await tray.getByRole('button',{name:'d6',exact:true}).click();
  await totals.first().waitFor();
  assert.equal(await page.locator('.dice-stage').isVisible(),false);
}finally{await browser.close();}
