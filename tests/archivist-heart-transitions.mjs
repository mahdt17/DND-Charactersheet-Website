import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as W from '../src/lib/campaignDowntime.js';
import {createArchivistCampaign} from '../src/lib/archivistCampaign.js';
import {addCampaignCreature,changeCreatureHP} from '../src/lib/campaignCreatures.js';
test('automatic Heart observes self and creature damage once, with saved cooldowns',()=>{
 let c=createArchivistCampaign();c.hp={current:10,max:100,temp:0};c.concentration='Bless';c.archivistCampaign.grafts=[{recipeId:'heart'}];
 c=addCampaignCreature(c,{name:'Ally'});const n=c.archivistCampaign.creatures[0];n.hp={current:10,max:100,temp:0};n.grafts=[{recipeId:'heart'}];
 let calls=0;const dice=()=>{calls++;return {total:38};};
 let next=W.observeSilthilarHearts(c,{...changeCreatureHP(c,n.id,10),hp:{...c.hp,current:0}},dice);
 assert.equal(next.hp.current,38);assert.equal(next.concentration,null);assert.equal(next.archivistCampaign.creatures[0].hp.current,38);assert.equal(calls,2);
 const zero={...next,hp:{...next.hp,current:0}};assert.equal(W.observeSilthilarHearts(next,zero,dice).hp.current,0);assert.equal(calls,2);
 const lethal=changeCreatureHP(c,n.id,110);assert.equal(W.observeSilthilarHearts(c,lethal,dice).archivistCampaign.creatures[0].hp.current,0);
});
import {entomancerDamage,entomancerDamageAmount} from '../src/lib/entomancerActions.js';
test('outright-death marker is event-only and future live KOs can heal',()=>{
 const c=createArchivistCampaign();c.hp={current:10,max:100,temp:0};c.archivistCampaign.grafts=[{recipeId:'heart'}];
 const dead=W.observeSilthilarHearts(c,{...c,hp:{...c.hp,current:0},killedOutright:true},()=>{throw Error('No revival after outright death');});
 assert.equal(dead.killedOutright,undefined);
 const revived={...dead,hp:{...dead.hp,current:1}};assert.equal(W.observeSilthilarHearts(revived,{...revived,hp:{...revived.hp,current:0}},()=>({total:30})).hp.current,30);
});

import {entomancerClass} from '../src/data/entomancer.js';
test('Heart outright-death threshold uses mitigated Entomancer damage',()=>{
 const c={...createArchivistCampaign(),className:'Entomancer',classDefinition:entomancerClass,classLevels:[{catalogId:entomancerClass.catalogId,name:'Entomancer',definition:entomancerClass,level:15,edition:'2014'}],level:15,entomancer:{species:'Decomposers'},feats:[{name:'Graft Flesh: Silthilar'}],hp:{current:10,max:100,temp:0}};c.archivistCampaign.grafts=[{recipeId:'heart'}];
 const actual=entomancerDamageAmount(c,110,{type:'necrotic'}).amount;assert.equal(actual,55);assert(W.canTriggerSilthilarHeart(c,'self',actual));
 const next=W.observeSilthilarHearts(c,entomancerDamage(c,110,{type:'necrotic'}),()=>({total:38}));assert.equal(next.hp.current,38);
});
