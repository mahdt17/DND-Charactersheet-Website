import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const port=Number(process.env.ABILITY_TEST_PORT||5230);
const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[];
page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const labels=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],keys=['str','dex','con','int','wis','cha'];
const nextButton=()=>page.locator('.creation-footer').getByRole('button',{name:'Continue',exact:true});
const next=()=>nextButton().click();
const choose=name=>page.locator('.creation-choice').filter({has:page.locator('.creation-choice-title').filter({hasText:new RegExp('^'+name+'$')})}).first().click();
const values=()=>page.locator('.ability-builder input').evaluateAll(inputs=>inputs.map(input=>Number(input.value)));
const saved=()=>page.evaluate(async()=>{const rows=JSON.parse((await window.storage.get('char-index')).value),row=rows.find(c=>c.name==='Four dice hero');return row?JSON.parse((await window.storage.get('char-detail:'+row.id)).value):null;});
const rollFixture=async dice=>{
 await page.evaluate(dice=>{const original=Math.random;let cursor=0;Math.random=()=>cursor<dice.length?(dice[cursor++]-.5)/6:original();window.restoreAbilityRandom=()=>{Math.random=original;};},dice.flat());
 try{await page.getByRole('button',{name:'Roll all six ability scores',exact:true}).click();}finally{await page.evaluate(()=>window.restoreAbilityRandom());}
};
const assignDefaults=async()=>{for(let i=0;i<6;i++)await page.getByLabel(`Assign roll ${i+1} to`,{exact:true}).selectOption(keys[i]);};
const rollOne=async(index,dice)=>{
 await page.evaluate(dice=>{const original=Math.random;let cursor=0;Math.random=()=>cursor<dice.length?(dice[cursor++]-.5)/6:original();window.restoreAbilityRandom=()=>{Math.random=original;};},dice);
 try{await page.getByRole('button',{name:new RegExp(`^(Re)?roll score ${index+1}$`,'i')}).click();}finally{await page.evaluate(()=>window.restoreAbilityRandom());}
};
try{
 mkdirSync('test-results',{recursive:true});
 await page.goto(`http://127.0.0.1:${port}/`);await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill('Four dice hero');await next();await page.getByLabel('Search class',{exact:true}).fill('Fighter');await choose('Fighter');await next();await page.getByLabel('Search race',{exact:true}).fill('Human');await choose('Human');await next();await choose('Soldier');await next();
 assert.equal(await page.getByRole('button',{name:'Roll 4d6 scores',exact:true}).count(),1,'creation offers standard four-die ability rolls');
 await page.getByRole('button',{name:'Roll 4d6 scores',exact:true}).click();assert(await nextButton().isDisabled(),'rolling is required before continuing');
 assert.equal(await page.getByRole('button',{name:/^Roll score [1-6]$/}).count(),6,'each of the six rolls has its own button');
 await rollOne(0,[1,2,5,6]);await page.getByLabel('Assign roll 1 to',{exact:true}).selectOption('int');
 await rollOne(1,[1,1,1,1]);await page.getByLabel('Assign roll 2 to',{exact:true}).selectOption('str');
 assert.deepEqual(await values(),[3,0,0,13,0,0]);assert(await nextButton().isDisabled(),'partial or unassigned sets cannot finish');
 await page.getByLabel('Assign roll 1 to',{exact:true}).selectOption('str');
 assert.deepEqual(await values(),[13,0,0,3,0,0],'assigning an occupied ability swaps its existing roll');
 await rollOne(0,[4,4,4,4]);assert.deepEqual(await values(),[12,0,0,3,0,0],'an individual reroll leaves the other five slots alone');
 await rollFixture(Array.from({length:6},()=>[6,6,6,6]));await assignDefaults();assert.deepEqual(await values(),[18,18,18,18,18,18]);
 const dice=[[1,1,1,1],[6,6,6,6],[6,2,2,5],[3,1,4,6],[2,3,4,5],[4,4,4,4]],scores=[3,18,13,13,12,12];
 await rollFixture(dice);assert.deepEqual(await values(),scores,'reroll replaces all six scores and keeps assignments');
 await page.getByLabel('Assign roll 1 to',{exact:true}).selectOption('int');
 const assignedScores=[13,18,13,3,12,12],assignedSlots=[3,1,2,0,4,5];
 assert.deepEqual(await values(),assignedScores);
 assert.equal(await page.locator('.ability-builder input[readonly]').count(),6);
 const results=page.getByRole('region',{name:'Ability roll results',exact:true});
 assert.match(await results.locator('article').nth(0).innerText(),/1, 1, 1, 1.*drop 1.*3/);
 assert.match(await results.locator('article').nth(2).innerText(),/6, 2, 2, 5.*drop 2.*13/);
 for(let i=0;i<6;i++)assert.match(await page.getByLabel(new RegExp('^'+labels[i]+' · total')).locator('..').innerText(),new RegExp('total '+(assignedScores[i]+1)),'Human bonus remains separate from rolled score');
 await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'test-results/ability-rolls-mobile.png'});await page.setViewportSize({width:1440,height:1100});
 await next();await page.getByRole('button',{name:'Acrobatics',exact:true}).click();await page.getByRole('button',{name:'Survival',exact:true}).click();await page.getByLabel('Human language 1',{exact:true}).fill('Elvish');await next();await next();await page.getByRole('button',{name:'Create Character',exact:true}).click();await page.locator('.sheet-identity').filter({hasText:'Four dice hero'}).waitFor();
 let c=await saved();assert.equal(c.method,'4d6');assert.deepEqual(c.abilities,{str:13,dex:18,con:13,int:3,wis:12,cha:12});assert.deepEqual(c.abilityBonuses,{str:1,dex:1,con:1,int:1,wis:1,cha:1});
 for(let i=0;i<6;i++){const record=c.abilityRolls[keys[i]],slot=assignedSlots[i];assert.equal(record.expression,'4d6dl1');assert.deepEqual(record.rolls,dice[slot]);assert.equal(record.total,assignedScores[i]);assert.equal(record.kept.length,3);assert.equal(record.dropped.length,1);assert.equal(record.droppedIndices.length,1);assert.equal(record.kept.reduce((sum,n)=>sum+n,0),assignedScores[i]);assert.equal(record.dropped[0],Math.min(...dice[slot]));}
 assert.deepEqual(c.abilityRollAssignments,{str:3,dex:1,con:2,int:0,wis:4,cha:5});assert.equal(c.abilityRollPool.length,6);
 await page.getByRole('button',{name:'Dice roller',exact:true}).click();const history=page.locator('.roll-result').filter({hasText:'ability score'});assert.equal(await history.count(),15);assert.match(await history.first().innerText(),/4d6dl1.*drop 4/);assert.equal(await history.first().locator('strong').innerText(),'12');await page.getByRole('button',{name:'Close dice roller',exact:true}).click();
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.locator('.character-card').filter({hasText:'Four dice hero'}).getByRole('button',{name:'Open character',exact:true}).click();assert.deepEqual((await saved()).abilityRolls,c.abilityRolls);assert.equal(await page.locator('.ability-tile').filter({hasText:'Strength'}).locator('small').innerText(),'14');
 await page.getByRole('button',{name:'All characters',exact:true}).click();await page.getByRole('button',{name:'Create character',exact:true}).click();await page.getByLabel('Character name',{exact:true}).fill('Method switch hero');await next();await page.getByLabel('Search class',{exact:true}).fill('Fighter');await choose('Fighter');await next();await page.getByLabel('Search race',{exact:true}).fill('Human');await choose('Human');await next();await choose('Soldier');await next();
 await page.getByRole('button',{name:'Roll 4d6 scores',exact:true}).click();await rollFixture(dice);await page.getByRole('button',{name:'27-point buy',exact:true}).click();assert.deepEqual(await values(),[8,8,8,8,8,8]);assert(await nextButton().isEnabled());await page.getByRole('button',{name:'Enter scores',exact:true}).click();await page.getByLabel(/^Strength · total/).fill('16');assert.equal((await values())[0],16);await page.getByRole('button',{name:'Standard array',exact:true}).click();assert.deepEqual(await page.locator('.ability-builder select').evaluateAll(inputs=>inputs.map(input=>Number(input.value))),[15,14,13,12,10,8]);await page.getByRole('button',{name:'Roll 4d6 scores',exact:true}).click();assert(await nextButton().isDisabled());assert.equal(await page.getByRole('button',{name:/^Roll score [1-6]$/}).count(),6,'switching methods clears old rolls and assignments');
 assert.deepEqual(errors,[]);console.log('PASS individual 4d6 rolls, free assignment/swapping, partial-set validation, ties, rerolls, kept/dropped history, racial bonuses, persistence/reopen, method switching and mobile');
}catch(error){await page.screenshot({path:'test-results/ability-rolls-failure.png',fullPage:true});throw error;}finally{await browser.close();await server.close();}
