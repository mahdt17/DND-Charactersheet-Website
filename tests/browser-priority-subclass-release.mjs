import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {preview} from 'vite';

const html = await readFile('dist/index.html', 'utf8');
const entry = html.match(/src="([^"]+\.js)"/)[1];
const base = entry.slice(0, entry.indexOf('/assets/') + 1);
const server = await preview({preview:{host:'127.0.0.1',port:5381,strictPort:true}});
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_EXECUTABLE_PATH || (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
  args: ['--no-sandbox']
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const definitions = JSON.parse(await readFile('src/data/classes.json','utf8'));
const modern = JSON.parse(await readFile('src/data/srd2024.json','utf8'));

async function importCharacter(className, level, subclass, edition='2014') {
  const name = ['Release', edition, className, subclass].join(' ');
  const index = className.toLowerCase();
  const catalogId = edition + ':' + index;
  const definition = {...(edition === '2024' ? modern.classes : definitions).find(c => c.name === className),edition,catalogId};
  const character = {
    id: name.replaceAll(' ','-'), name, className, subclass, level, ruleset:edition, classDefinition:definition,
    classLevels:[{name:className, subclass, level, edition, catalogId, definition}],
    abilities:{str:16,dex:14,con:14,int:16,wis:16,cha:14}, hp:{current:24,max:24,temp:0},
    race:'Human',ac:12,speed:30,inventory:[],spells:[],resources:[],actions:[],activeEffects:[]
  };
  await page.locator('input[type=file]').setInputFiles({
    name:'release-character.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))
  });
  await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
}

async function checkPicker(className, eligible, excluded, expectedValue) {
  await page.locator('.sheet-heading').getByRole('button',{name:'Edit',exact:true}).click();
  const modal = page.getByRole('dialog',{name:'Edit character',exact:true});
  const picker = modal.getByLabel(className + ' subclass source',{exact:true});
  const options = await picker.innerText();
  if (expectedValue) assert.equal(await picker.inputValue(), expectedValue);
  for (const name of eligible) assert.match(options, new RegExp(name,'i'));
  for (const name of excluded) assert.doesNotMatch(options, new RegExp(`\\b${name}\\b`,'i'));
  await modal.getByRole('button',{name:'Done',exact:true}).click();
}

try {
  await page.goto('http://127.0.0.1:5381' + base);
  await page.getByRole('button',{name:'Explore the demo'}).click();

  await importCharacter('Wizard',2,'Bladesinging');
  await checkPicker('Wizard',['Bladesinging','Evocation'],['Theurgy','Chronurgy']);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  await page.getByRole('button',{name:'Start Bladesong',exact:true}).waitFor();

  await importCharacter('Ranger',3,'Gloom Stalker');
  await checkPicker('Ranger',['Gloom Stalker','Hunter'],['Swarmkeeper','Drakewarden']);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  await page.getByRole('region',{name:'Gloom Stalker combat'}).waitFor();

  await importCharacter('Fighter',3,'Battle Master');
  await checkPicker('Fighter',['Battle Master','Champion','Cavalier'],['Samurai','Echo Knight']);
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  await page.getByRole('region',{name:'Battle Master abilities',exact:true}).waitFor();

  await importCharacter('Fighter',18,'Samurai');
  await page.getByRole('tab',{name:'Actions',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Trigger Strength Before Death'}).count(),0);

  await importCharacter('Cleric',1,'Life Domain');
  await checkPicker('Cleric',['Life','Twilight'],['Light','Arcana'],'life');

  await importCharacter('Wizard',3,'Evoker','2024');
  await checkPicker('Wizard',['Evoker'],['Bladesinging','Theurgy']);

  assert.deepEqual(errors,[]);
  console.log('PASS built site releases Bladesinging, Gloom Stalker and Battle Master, preserves existing choices and keeps unfinished features disabled');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
