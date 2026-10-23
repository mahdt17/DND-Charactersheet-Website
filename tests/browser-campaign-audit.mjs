import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {campaignClasses,campaignPowers,conversionFeats} from '../src/data/archivistCampaign.js';
import {createArchivistCampaign} from '../src/lib/archivistCampaign.js';
import {openClassTools,openClassDisclosure,chooseClassPower} from './helpers/class-tools.mjs';

const server=await createServer({server:{host:'127.0.0.1',port:5211,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const E=await server.ssrLoadModule('/src/lib/editions.js');
const N=await server.ssrLoadModule('/src/lib/campaignCreatures.js');
const C=await server.ssrLoadModule('/src/lib/archivistCampaign.js');
const slots=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1]];
const archivist=[1,1,2,3,4,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
const dark=[3,3,3,4,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9];
const lore=[0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,4,4];
const thralls=[5,6,7,8,9,10,11,12,12,13,14,15,15,16,17];
const featSchedule=[[1,'Mother Cyst'],[2,'Psicrystal Affinity'],[5,'Reach Spell'],[10,'Draconic Archivist'],[12,'Chain Spell'],[14,'Graft Flesh: Silthilar'],[18,'Cooperative Spell']];
const tools=()=>page.locator('.class-owner-panel:visible');
const reserve=name=>page.getByRole('group',{name:name+' resource',exact:true}).locator('.resource-count');
function build(level,name='Guide level '+level){
 const base=createArchivistCampaign(name),a=archivist[level-1];
 const classLevels=campaignClasses.flatMap((definition,i)=>{const count=i===0?a:i===1?(level>=2?1:0):(level>=6?1:0);return count?[{catalogId:definition.catalogId,name:definition.name,edition:'2014',definition,level:count}]:[];});
 return {...base,name,level,classLevels,hp:{current:6+(level-1)*4,max:6+(level-1)*4,temp:0},
  feats:featSchedule.filter(([at])=>at<=level).map(([,name])=>({...conversionFeats.find(f=>f.name===name),id:crypto.randomUUID(),...(name==='Psicrystal Affinity'?{conversionBonusSlot:'psion:1'}:name==='Chain Spell'?{conversionBonusSlot:'archivist:10'}:{})})),
  spells:['Cure Wounds','Bless'].map(name=>({...E.catalogSpells('2014').find(s=>s.name===name),id:crypto.randomUUID(),castingClassId:campaignClasses[0].catalogId,campaignAcquisition:'growth',prepared:true})),
  archivistCampaign:{independentChoices:true,darkUsed:0,growthSpent:2,loreSkills:['Religion','Arcana','Nature','History'].slice(0,lore[level-1]),knownPowers:level>=2?campaignPowers.map(p=>({...p,level:1,range:p.id==='inertial-armor'?'Self':'30 feet'})):[],followers:[],rulings:{}}
 };
}
async function load(char){await page.locator('input[type=file]').setInputFiles({name:'gameplay-audit.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(char))});await page.locator('.sheet-identity').filter({hasText:char.name}).waitFor();}
async function prayerbook(){await page.getByRole('tab',{name:'Spells',exact:true}).click();const selector=page.getByLabel('Spellcasting class',{exact:true}).filter({visible:true});if(await selector.count())await selector.selectOption(campaignClasses[0].catalogId);return page.getByRole('region',{name:'Archivist prayerbook',exact:true});}
async function saved(name){return page.evaluate(async name=>{const index=JSON.parse((await window.storage.get('char-index')).value);return JSON.parse((await window.storage.get('char-detail:'+index.find(c=>c.name===name).id)).value);},name);}
try{
 mkdirSync('test-results',{recursive:true});await page.goto('http://127.0.0.1:5211');await page.getByRole('button',{name:'Explore the demo'}).click();
 for(let level=1;level<=20;level++){
  const char=build(level),a=archivist[level-1];await load(char);await openClassTools(page);
  assert.equal(await reserve('Dark Knowledge').innerText(),`${dark[level-1]} / ${dark[level-1]}`);
  const options=await tools().getByLabel('Dark Knowledge effect').locator('option').evaluateAll(options=>options.map(o=>o.value));
  assert.deepEqual(options,['tactics',...(a>=5?['puissance']:[]),...(a>=8?['foe']:[]),...(a>=11?['dread-secret']:[]),...(a>=14?['foreknowledge']:[])]);
  for(const kind of options){await tools().getByLabel('Dark Knowledge effect').selectOption(kind);assert((await tools().locator('.class-ability-rules').innerText()).length>30,'every unlocked effect has rules');}
  await tools().getByLabel('Knowledge check result').fill('35');await tools().getByLabel('Studied creature or group').fill('Undead');await tools().getByRole('button',{name:'Use Dark Knowledge',exact:true}).click();
  assert.equal(await reserve('Dark Knowledge').innerText(),`${dark[level-1]-1} / ${dark[level-1]}`);
  if(level>=2){await chooseClassPower(page,'Mindlink');await tools().getByRole('button',{name:'Manifest Mindlink',exact:true}).click();assert.equal(await reserve('Power Points').innerText(),'2 / 3');}
  await openClassTools(page,'Settings');assert.equal(await tools().getByLabel(/Lore Mastery \d/).count(),lore[level-1]);
  await openClassTools(page,'Companions');if(level>=6)assert.match(await tools().innerText(),new RegExp('Maximum thrall level: '+thralls[level-6]+'\\.'));
  const book=await prayerbook();const shown=await book.locator('.slot-level').allInnerTexts();assert.equal(shown.length,slots[a].length);
  for(let i=0;i<shown.length;i++)assert.match(shown[i],new RegExp(`Level ${i+1}\\s*${slots[a][i]} / ${slots[a][i]} slots`));
  await book.getByRole('button',{name:'Cast Cure Wounds',exact:true}).click();assert.match(await book.locator('.slot-level').first().innerText(),new RegExp(`${slots[a][0]-1} / ${slots[a][0]} slots`));
  await openClassTools(page);await tools().getByRole('button',{name:'Long rest · restore resources',exact:true}).click();await page.getByRole('button',{name:'Complete long rest',exact:true}).click();
  assert.equal(await reserve('Dark Knowledge').innerText(),`${dark[level-1]} / ${dark[level-1]}`);if(level>=2){await chooseClassPower(page,'Mindlink');assert.equal(await reserve('Power Points').innerText(),'3 / 3');}
  console.log(`PASS guide character level ${level}: class tools, abilities, slots, spending, lore, roster and recovery`);
 }
 for(const condition of ['Unconscious','Stunned','Paralyzed']){
  const char={...build(20,'Blocked '+condition),conditions:[condition]};await load(char);await openClassTools(page);
  assert(await tools().getByRole('button',{name:'Use Dark Knowledge',exact:true}).isDisabled(),'incapacity must disable class actions');
  await chooseClassPower(page,'Mindlink');assert(await tools().getByRole('button',{name:'Manifest Mindlink',exact:true}).isDisabled());
  const book=await prayerbook();assert(await book.getByRole('button',{name:'Cast Cure Wounds',exact:true}).isDisabled());
  await page.getByRole('tab',{name:'Actions',exact:true}).click();assert(await page.getByRole('button',{name:/to hit/}).first().isDisabled());
 }
 let followers=build(6,'Individual follower handling');followers=C.addCampaignFollower(followers,{name:'Scout group',kind:'believers',level:1,quantity:5});followers=N.createFollowerSheets(followers,followers.archivistCampaign.followers[0].id,'caster');followers=C.advanceCampaignTime(followers,1440);
 for(const n of followers.archivistCampaign.creatures)n.spells=[{id:'bless',name:'Bless',level:1,prepared:true,concentration:true}];
 await load(followers);await openClassTools(page,'Companions');await openClassDisclosure(page,'Creatures and follower combat sheets');
 const first=page.locator(`[data-creature-id="${followers.archivistCampaign.creatures[0].id}"]`),second=page.locator(`[data-creature-id="${followers.archivistCampaign.creatures[1].id}"]`);
 await first.locator('summary').first().click();await first.getByRole('button',{name:'Record follower loss — Scout group 1',exact:true}).click();
 assert(await first.getByRole('button',{name:'Attack +4',exact:true}).isDisabled());await second.locator('summary').first().click();assert(await second.getByRole('button',{name:'Attack +4',exact:true}).isEnabled());
 await tools().getByLabel('Follower name or group').fill('Replacement scout');await tools().getByRole('button',{name:'Add follower record',exact:true}).click();assert.match(await tools().innerText(),/Replacement scout.*24 hours until arrival/s);
 let persisted=false;for(let attempt=0;attempt<100;attempt++){const state=await saved(followers.name);if(state.archivistCampaign.followers[0].lostMembers?.[0]===0&&state.archivistCampaign.followers.length===2){persisted=true;break;}await page.waitForTimeout(50);}assert(persisted,'individual losses and the replacement are saved');
 const groupState=await saved(followers.name);assert.deepEqual(groupState.archivistCampaign.followers[0].lostMembers,[0]);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'test-results/campaign-gameplay-audit-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS incapacitated actions, individual follower losses/replacement, persisted history and mobile');
}catch(error){await page.screenshot({path:'test-results/campaign-gameplay-audit-failure.png',fullPage:true});throw error;}finally{await browser.close();await server.close();}
