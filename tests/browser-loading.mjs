import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {preview} from 'vite';
const html=await fs.readFile('dist/index.html','utf8'),entry=html.match(/src="([^"]+\.js)"/)[1];
const entryPath=path.join('dist/assets',path.basename(entry)),bytes=(await fs.stat(entryPath)).size;
assert(bytes<500_000,`Sign-in bundle unexpectedly includes ledger data: ${bytes} bytes`);
const base=entry.slice(0,entry.indexOf('/assets/')+1),server=await preview({preview:{host:'127.0.0.1',port:5180}});
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5180${base}`);await page.getByRole('button',{name:'Explore the demo'}).waitFor();
 assert(!requests.some(u=>/LedgerEntry-|RevisedCatalog-|\/catalogs\//.test(u)),'Character rules must not load before entering the ledger');
 await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).click();assert(await page.getByLabel('Current temporary HP').isVisible());assert(requests.some(u=>/LedgerEntry-/.test(u)));assert(!requests.some(u=>/diceRenderer-/.test(u)),'3D physics must stay deferred until the first animated roll');
 await page.getByRole('button',{name:'Exit demo',exact:true}).click();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Open character'}).waitFor();assert.equal(await page.getByRole('button',{name:'Open character'}).count(),1);assert.deepEqual(errors,[]);
 // Reuse the context: Chromium's single-process mode cannot reliably create
 // another one. Navigation resets module state; routing disables HTTP caching.
 const failed=page;await failed.route('**/assets/LedgerEntry-*.js',route=>route.abort());await failed.goto(`http://127.0.0.1:5180${base}`);await failed.getByRole('button',{name:'Explore the demo'}).click();await failed.getByRole('button',{name:'Reload ledger'}).waitFor();assert.match(await failed.getByRole('alert').innerText(),/could not load/);
 await failed.unroute('**/assets/LedgerEntry-*.js');await failed.getByRole('button',{name:'Reload ledger'}).click();await failed.getByRole('button',{name:'Explore the demo'}).click();await failed.getByRole('button',{name:'Open character'}).waitFor();
 console.log(`PASS production entry bundle ${(bytes/1000).toFixed(1)} kB, deferred rules, demo exit/re-entry and visible load-failure recovery`);
} finally {await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
