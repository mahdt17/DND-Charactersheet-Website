import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=await createServer({server:{host:'127.0.0.1',port:0}});
await server.listen();
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${server.resolvedUrls.local[0]}tests/fixtures/source-prerequisite-harness.html`);
  const save=page.getByRole('button',{name:'Save choices',exact:true});
  await save.waitFor();
  assert(await save.isDisabled());
  assert.equal(await page.getByLabel('Sequential Feats 3 Bonus Feat: Advanced',{exact:true}).count(),0,'ineligible later feat must be hidden');
  await page.getByLabel('Sequential Feats 1 Bonus Feat: Foundation',{exact:true}).check();
  await page.getByLabel('Sequential Feats 3 Bonus Feat: Advanced',{exact:true}).waitFor();
  assert(await save.isDisabled(),'all source choices must be completed');
  await page.getByLabel('Sequential Feats 3 Bonus Feat: Advanced',{exact:true}).check();
  assert(!await save.isDisabled());
  await save.click();
  await page.getByText('Met:',{exact:true}).waitFor();
  assert.match(await page.getByRole('list',{name:'Owned feats'}).innerText(),/Foundation[\s\S]*Advanced/);
  await page.reload();
  await page.getByText('Met:',{exact:true}).waitFor();
  assert.equal(await page.getByRole('region',{name:'Class feature choices'}).count(),0,'reload must restore the choice without prompting again');
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('source-choice-regression')));
  assert.equal(Object.keys(persisted.featureChoices).length,2);
  assert.equal(persisted.feats.filter(feat=>feat.sourceClassId==='test:sequential-feats').length,2);
  await page.getByRole('button',{name:'Remove source class'}).click();
  await page.getByText('Unmet:',{exact:true}).waitFor();
  assert.equal((await page.getByRole('list',{name:'Owned feats'}).innerText()).trim(),'Manual feat');
  assert.deepEqual(errors,[]);
  await fs.mkdir('test-results',{recursive:true});
  await page.screenshot({path:'test-results/source-prerequisites35.png'});
  console.log('PASS browser source prerequisites: legal choices, same-transaction unlock, save/reload, automatic feat-count gate and source cleanup.');
}finally{
  if(browser)await browser.close();
  await server.close();
}
