import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
// Exercise the repository's deployed subpath on every platform, not just CI.
const server=await createServer({base:'/casting-prerequisite-regression/',server:{host:'127.0.0.1',port:0}});
await server.listen();
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined});
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
  await page.goto(`${server.resolvedUrls.local[0]}tests/fixtures/casting-prerequisite-harness.html`);
  await page.getByRole('heading',{name:'Casting entry regression'}).waitFor();
  await page.getByText('Unmet:',{exact:true}).waitFor();
  const option=page.getByLabel('Casting Feat Source 1 Bonus Feat: Advanced Magic',{exact:true});
  assert.equal(await option.count(),0,'spell-level prerequisite hides illegal bonus feat');
  await page.getByRole('button',{name:'Advance Wizard to 5'}).click();
  await page.getByText('Met:',{exact:true}).waitFor();
  await option.check();
  await page.getByRole('button',{name:'Save feat',exact:true}).click();
  await page.getByRole('list',{name:'Owned feats'}).getByText('Advanced Magic',{exact:true}).waitFor();
  await page.reload();
  await page.getByText('Met:',{exact:true}).waitFor();
  assert.match(await page.getByRole('list',{name:'Owned feats'}).innerText(),/Advanced Magic/);
  await page.getByRole('button',{name:'Remove Wizard'}).click();
  await page.getByText('Unmet:',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS casting prerequisite UI: level-up eligibility, legal feat choice, save/reload and caster removal.');
}finally{if(browser)await browser.close();await server.close();}
