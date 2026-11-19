import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {chromium} from 'playwright';

const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('This test requires a local Supabase instance.');
const appUrl=process.env.CAMPAIGN_TEST_URL;
const password='Local-fixture-Password-42';
const email=role=>role+'-'+Date.now()+'@example.com';
const browser=await chromium.launch({headless:true});
async function login(role) {
  const address=email(role);
  const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const signup=await auth.auth.signUp({email:address,password});
  if(signup.error)throw signup.error;
  const context=await browser.newContext();
  const page=await context.newPage();page.setDefaultTimeout(22000);
  page.on('pageerror',e=>console.error(role,e.message));
  await page.goto(appUrl);
  await page.getByLabel('Email',{exact:true}).fill(address);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Enter the Ledger'}).click();
  await page.getByRole('button',{name:'Create character',exact:true}).waitFor();
  return page;
}
const button=(page,name)=>page.getByRole('button',{name,exact:true});
try {
  const dm=await login('dm'),player=await login('player');
  await button(dm,'Campaigns').click();
  await button(dm,'Start a DM campaign').click();
  await dm.getByLabel('DM campaign name').fill('The Violet Archive');
  await button(dm,'Create shared campaign').click();
  const invite=await dm.getByLabel('Campaign invite code').inputValue();
  const sheet={id:'hero',name:'Arden',level:1,ruleset:'2014',className:'Fighter',race:'Elf',
    abilities:{str:15,dex:14,con:13,int:12,wis:10,cha:8},hp:{max:11,current:11,temp:0},ac:15,notes:'First expedition'};
  await player.locator('input[type=file]').setInputFiles({name:'hero.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(sheet))});
  await player.locator('.sheet-identity').filter({hasText:'Arden'}).waitFor();
  await player.getByRole('tab',{name:'Notes',exact:true}).click();
  await button(player,'Manage DM campaign sharing').click();
  await player.getByLabel('Invite code from your DM').fill(invite);
  await button(player,'Join and share sheet').click();
  await player.getByText('Sheet shared with your DM.',{exact:true}).waitFor();
  await dm.getByRole('button',{name:/Arden · Level 1 Fighter/}).click();
  const viewer=dm.getByRole('article',{name:'Live character sheet'});
  await viewer.getByText(/First expedition/).waitFor();
  await player.getByRole('navigation').getByRole('button',{name:/Characters/i}).first().click();
  if(await player.getByRole('button',{name:'Open character',exact:true}).count())await button(player,'Open character').click();
  await player.getByRole('tab',{name:'Notes',exact:true}).click();
  await player.getByLabel('Backstory, personality, bonds, and session notes').fill('Found the lost archive');
  await viewer.getByText(/Found the lost archive/).waitFor();
  assert.equal(await viewer.getByRole('textbox').count(),0);
  await button(player,'Manage DM campaign sharing').click();
  await button(player,'Stop sharing sheet').click();
  await dm.getByText(/Their characters appear here/).waitFor();
  assert.equal(await dm.getByRole('article',{name:'Live character sheet'}).count(),0);
  await dm.reload();await button(dm,'Campaigns').click();
  await dm.getByLabel('Campaign to view as DM').selectOption({label:'The Violet Archive'});
  await dm.getByText(/Their characters appear here/).waitFor();
  console.log('PASS two signed-in accounts, DM campaign creation, player assignment, live saved-sheet edit, unsharing and reload');
} finally {await browser.close();}

