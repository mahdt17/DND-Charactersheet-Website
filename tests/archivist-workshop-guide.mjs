import assert from 'node:assert/strict';
import test from 'node:test';
import * as C from '../src/lib/archivistCampaign.js';
import * as N from '../src/lib/campaignCreatures.js';
import * as W from '../src/lib/campaignDowntime.js';
import {effectiveAbilityScores} from '../src/lib/abilityScores.js';
import {graftModifiers} from '../src/lib/campaignModifiers.js';

const fresh=()=>({...C.createArchivistCampaign(),feats:[{name:'Graft Flesh: Silthilar'}],currency:{gp:50000}});
const craft=(c,draft)=>{
 const paid=W.startCampaignProject(c,{...draft,materialsConfirmed:true});
 const job=paid.archivistCampaign.projects.at(-1);
 return W.finishCampaignProject(W.workCampaignProject(paid,job.id,job.hours),job.id);
};

test('each guide graft uses the approved price, workdays and spell requirements',()=>{
 const recipes=[
  ['chitin',250,2,[]],['chitin-2',750,2,[]],['chitin-3',2000,4,[]],['chitin-4',4500,9,[]],['chitin-5',9000,18,[]],
  ['legs',500,2,['Longstrider (1st level)']],['eyes',1000,2,['Regenerate (7th level)']],['spine',2000,4,['Regenerate (7th level)']],
  ['heart',2500,5,['Cure Wounds cast at 3rd level','Contingency (6th level)']],
  ['bones',5000,10,['Enhance Ability: Bear’s Endurance (Constitution)']],
  ['muscles',5000,10,['Enhance Ability: Bull’s Strength (Strength)']],
  ['tendons',5000,10,['Enhance Ability: Cat’s Grace (Dexterity)']],['blood',12000,24,['Regenerate (7th level)']]
 ];
 for(const [id,cost,days,prerequisites] of recipes){
  const recipe=W.campaignRecipe(fresh(),id);
  assert.deepEqual([recipe.cost,recipe.hours,recipe.prerequisites],[cost,days*8,prerequisites],id);
 }
 const c=fresh();
 c.archivistCampaign.rulings={graftRecipes:{chitin:{cost:1001,hours:99}}};
 assert.equal(W.campaignRecipe(c,'chitin').hours,24);
});
test('a qualified spell provider can graft a living creature at 0 HP without a check or a graft cap',()=>{
 let c=N.addCampaignCreature(fresh(),{name:'Recipient'});
 const id=c.archivistCampaign.creatures[0].id;
 c=N.updateCreature(c,id,n=>({...n,hp:{...n.hp,current:0},grafts:[{recipeId:'bones'},{recipeId:'tendons'},{recipeId:'spine'}]}));
 const draft={kind:'graft',recipeId:'legs',targetId:id};
 assert.throws(()=>W.startCampaignProject(c,{...draft,materialsConfirmed:true}),/Longstrider/);
 c=craft(c,{...draft,prerequisitesConfirmed:true});
 assert.equal(c.archivistCampaign.creatures[0].grafts.length,4);
 assert.equal(c.archivistCampaign.creatures[0].hp.current,0);
 const dead=N.updateCreature(c,id,n=>({...n,dead:true}));
 assert.throws(()=>W.startCampaignProject(dead,{...draft,materialsConfirmed:true}),/living corporeal/);
});
test('Chitin records apply only the highest +1 to +5 alongside other AC',()=>{
 const grafts=[{recipeId:'chitin',effects:{ac:1}},{recipeId:'chitin-2'},{recipeId:'chitin-5'},{recipeId:'chitin-5'},{recipeId:'custom',effects:{ac:2}}];
 assert.equal(graftModifiers(grafts).ac,7);
 assert.equal(graftModifiers([{recipeId:'chitin',effects:{ac:8}}]).ac,5);
 const c=craft(craft(fresh(),{kind:'graft',recipeId:'chitin'}),{kind:'graft',recipeId:'chitin-4'});
 assert.equal(graftModifiers(c.archivistCampaign.grafts).ac,4);
});
test('the Constitution graft respects the ability cap on character and creature sheets',()=>{
 let c=fresh();
 c.abilities.con=19;
 c=craft(c,{kind:'graft',recipeId:'bones',prerequisitesConfirmed:true});
 assert.equal(C.campaignProfile(c).scores.con,20);
 assert.equal(effectiveAbilityScores(c).con,20);
 c=N.addCampaignCreature(c,{name:'Strong Constitution',abilities:{con:21}});
 const n=c.archivistCampaign.creatures[0];
 c=craft(c,{kind:'graft',recipeId:'bones',targetId:n.id,prerequisitesConfirmed:true});
 assert.equal(N.creatureProfile(c.archivistCampaign.creatures[0]).abilities.con,21);
 assert.deepEqual(c.archivistCampaign.creatures[0].hp,n.hp);
});
test('Xanathar scribing uses the full level table and preserves exhausted slots',()=>{
 let c=fresh();
 while(c.level<20)c=C.advanceArchivistCampaign(c);
 c={...c,currency:{gp:300000},slotsUsed:{1:8}};
 const table=[[15,1],[25,1],[250,3],[500,5],[2500,10],[5000,20],[15000,40],[25000,80],[50000,160],[250000,240]];
 for(const [level,[cost,days]] of table.entries()){
  const spell={name:'Test prayer',catalogId:'2014:prayer-'+level,edition:'2014',level,castingClassId:'homebrew:darkdonte:archivist',prepared:level>0};
  const source={...c,spells:[spell]},input={kind:'scroll',spell,materialsConfirmed:true};
  assert.throws(()=>W.startCampaignProject({...source,skillProf:{}},input),/Arcana/);
  const paid=W.startCampaignProject(source,input),j=paid.archivistCampaign.projects.at(-1);
  assert.deepEqual([j.cost,j.hours,paid.slotsUsed],[cost,days*8,c.slotsUsed]);
 }
});
test('paid legacy scroll and graft projects retain their stored hours and resources after a reload',()=>{
 let c=fresh();
 const spell={name:'Saved prayer',catalogId:'2014:saved-prayer',level:1};
 c.archivistCampaign.projects=[
  {id:'paid-scroll',kind:'scroll',name:spell.name,spell,cost:50,hours:2,worked:1,status:'active'},
  {id:'paid-graft',kind:'graft',name:'Chitin Plating',recipe:{id:'chitin',ac:2},cost:2000,hours:40,worked:39,status:'active',targetId:'self'}
 ];
 c.slotsUsed={1:1};
 c=JSON.parse(JSON.stringify(c));
 for(const id of ['paid-scroll','paid-graft']){
  c=W.finishCampaignProject(W.workCampaignProject(c,id,1),id);
 }
 assert.deepEqual(c.currency,{gp:50000});
 assert.deepEqual(c.slotsUsed,{1:1});
 assert.equal(c.inventory[0].campaignScroll.spell.catalogId,spell.catalogId);
 assert.equal(graftModifiers(c.archivistCampaign.grafts).ac,2);
});

test('setting completed hours preserves paid project snapshot across reload',()=>{
 let c=fresh(); c.archivistCampaign.projects=[{id:'paid',kind:'graft',name:'Saved graft',recipe:{id:'chitin',ac:2},cost:2000,hours:40,worked:3,status:'active',targetId:'self'}];
 c=W.setCampaignProjectHours(c,'paid',25); c=JSON.parse(JSON.stringify(c));
 assert.equal(c.archivistCampaign.projects[0].worked,25); assert.equal(c.archivistCampaign.projects[0].cost,2000); assert.equal(c.archivistCampaign.projects[0].recipe.ac,2);
 assert.throws(()=>W.setCampaignProjectHours(c,'paid',41),/hours/i);
});
test('heart eligibility requires a living transition to zero without outright death and respects cooldown',()=>{
 let c=fresh(); c.archivistCampaign.grafts=[{recipeId:'heart'}]; c.hp={current:10,max:40,temp:0};
 assert.equal(W.canTriggerSilthilarHeart(c,'self',10),true);
 assert.equal(W.canTriggerSilthilarHeart(c,'self',50),false);
 assert.equal(W.canTriggerSilthilarHeart({...c,deathSaves:{failure:3}},'self',10),false);
 c={...c,archivistCampaign:{...c.archivistCampaign,heartUsedAt:0,clockMinutes:1439}};
 assert.equal(W.canTriggerSilthilarHeart(c,'self',10),false);
 assert.equal(W.canTriggerSilthilarHeart({...c,archivistCampaign:{...c.archivistCampaign,clockMinutes:1440}},'self',10),true);
});

test('fractional recorded work can finish its remaining fraction through Work',()=>{
 let c=fresh();c.archivistCampaign.projects=[{id:'fraction',kind:'graft',name:'Saved graft',recipe:{id:'chitin',ac:2},cost:2000,hours:40,worked:3,status:'active',targetId:'self'}];
 c=W.setCampaignProjectHours(c,'fraction',39.5);c=W.workCampaignProject(c,'fraction',0.5);assert.equal(c.archivistCampaign.projects[0].worked,40);assert.equal(c.archivistCampaign.clockMinutes,30);
});
