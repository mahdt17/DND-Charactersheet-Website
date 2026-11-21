import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import classes from '../src/data/classes.json' with {type:'json'};
import revised from '../src/data/srd2024.json' with {type:'json'};

const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const button=name=>page.getByRole('button',{name,exact:true});
async function importCharacter(name,edition,className){
  const data=(edition==='2014'?classes:revised.classes).find(c=>c.name===className);
  const definition={...data,edition,catalogId:edition+':'+data.index};
  const character={name,ruleset:edition,mechanics:edition,className,level:1,classDefinition:definition,
    classLevels:[{name:className,level:1,catalogId:definition.catalogId,edition,definition}],hitDie:'d'+data.hit_die,
    abilities:{str:15,dex:14,con:14,int:10,wis:12,cha:10},hp:{max:12,current:9,temp:3},actions:[],spells:[],inventory:[]};
  await page.locator('input[type=file]').setInputFiles({name:'hero.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(character))});
  await page.locator('.sheet-identity').filter({hasText:name}).waitFor();
  await button('Level up').click();
}
async function checkSave(name,gain){
  await button('Apply level up').click();
  await page.locator('.sheet-identity').filter({hasText:'LEVEL 2'}).waitFor();
  const saved=await page.evaluate(async name=>{
    const list=JSON.parse((await window.storage.get('char-index')).value);
    return JSON.parse((await window.storage.get('char-detail:'+list.find(c=>c.name===name).id)).value);
  },name);
  assert.deepEqual([saved.hp.max,saved.hp.current,saved.hp.temp],[12+gain,9+gain,3]);
  await button('All characters').click();
}
try{
  await page.goto(process.env.SHADOW_ARCHER_TEST_URL);
  await page.getByRole('button',{name:/Explore the demo/}).click();
  await importCharacter('Rolled multiclass HP','2014','Rogue');
  await page.getByLabel('Advancement path').selectOption('normal');
  const chooser=page.getByLabel('Class to advance');
  await page.getByLabel('Search level-up classes',{exact:true}).fill('Barbarian');
  const barbarian=chooser.locator('option').filter({hasText:/^Barbarian ·/}).first();
  await chooser.selectOption(await barbarian.getAttribute('value'));
  await page.getByLabel(/I reviewed the class/).check();
  await button('Continue to level choices').click();
  await button('Roll 1d12').click();
  await button('Rolling hit die…').waitFor();
  assert.equal(await button('Continue').isDisabled(),true);
  const used=page.getByRole('button',{name:/^Use roll of /});
  const value=Number((await used.innerText()).split(' ').at(-1));
  assert(value>=1&&value<=12);
  await button('Take fixed 7').click();
  await used.click();
  await button('Continue').click();
  await button('Back').click();
  assert.equal(await used.getAttribute('aria-pressed'),'true');
  await button('Continue').click();
  await checkSave('Rolled multiclass HP',value+2);

  await importCharacter('Fixed revised HP','2024','Barbarian');
  await button('Continue to level choices').click();
  assert.equal(await button('Take fixed 7').getAttribute('aria-pressed'),'true');
  await button('Roll 1d12').click();
  await button('Take fixed 7').click();
  await button('Continue').click();
  await button('Continue').click();
  await checkSave('Fixed revised HP',9);
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
