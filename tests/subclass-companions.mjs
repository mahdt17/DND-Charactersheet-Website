import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {existsSync,readFileSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const integration=await server.ssrLoadModule('/src/lib/classIntegration.js');
const expanded=await server.ssrLoadModule('/src/lib/expandedSubclasses.js');
const lib=existsSync('src/lib/subclassCompanions.js')?await server.ssrLoadModule('/src/lib/subclassCompanions.js'):{};
await server.close();
const make=()=>({ruleset:'2014',className:'Artificer',subclass:'Battle Smith',level:3,classDefinition:{name:'Artificer',index:'artificer',edition:'2014'},abilities:{str:10,dex:10,con:10,int:16,wis:10,cha:10},hp:{current:20,max:20,temp:0},resources:[],inventory:[],activeEffects:[],spells:[],actions:[]});
const apply=(c,p)=>({...c,...p});
test('Steel Defender uses Artificer level, total proficiency and preserves injury across reload and scaling',()=>{
 assert.equal(typeof lib.createSteelDefender,'function');
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));let p=lib.steelDefenderProfile(c);assert.equal(p.hp.max,20);assert.equal(p.ac,15);assert.equal(p.saves.dex,3);assert.equal(p.skills.perception,4);
 c=apply(c,lib.adjustCompanionHP(c,p.id,-7)); assert.equal(lib.steelDefenderProfile(JSON.parse(JSON.stringify(c))).hp.current,13);
 c={...c,level:8,classLevels:[{catalogId:'2014:artificer',name:'Artificer',edition:'2014',level:3,subclass:'Battle Smith'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:5}]};p=lib.steelDefenderProfile(c);assert.equal(p.hp.max,20);assert.equal(p.hp.current,13);assert.equal(p.saves.dex,4);
});
test('Steel Defender repair spends a use and replacement requires a completed rest',()=>{
 assert.equal(typeof lib.repairSteelDefender,'function');let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));let id=lib.steelDefenderProfile(c).id;
 c=apply(c,lib.adjustCompanionHP(c,id,-10)); c=apply(c,lib.repairSteelDefender(c,id,{total:10},{recipient:'self',confirmed:true}));assert.equal(lib.steelDefenderProfile(c).repairUsed,1);
 assert.throws(()=>lib.createSteelDefender(c,{initial:true}),/rest/i);assert.throws(()=>lib.createSteelDefender(c,{}),/rest/i);
});
test('reconciliation removes only invalid source-owned companions and preserves manual entries',()=>{
 assert.equal(typeof lib.reconcileCompanions,'function');let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));c.subclassCompanions.push({id:'manual',name:'Manual pet'});const next=lib.reconcileCompanions({...c,subclass:'Artillerist'});assert.deepEqual(next.subclassCompanions,[{id:'manual',name:'Manual pet'}]);
});
test('normal class reconciliation removes a deselected defender and preserves manual entries',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));c.subclassCompanions.push({id:'manual'});const next=integration.reconcileClassGrants({...c,subclass:'Artillerist'});assert.deepEqual(next.subclassCompanions,[{id:'manual'}]);
});
test('a completed long rest permits only one replacement',()=>{
 assert.equal(typeof lib.companionLongRest,'function');let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));assert.throws(()=>lib.createSteelDefender(c,{restCompleted:true,smithTools:true}),/rest/i);c=apply(c,lib.companionLongRest(c));c=apply(c,lib.createSteelDefender(c,{smithTools:true}));assert.throws(()=>lib.createSteelDefender(c,{smithTools:true}),/rest/i);
});
test('lowering and then raising the maximum never restores previously capped hit points',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));c={...c,abilities:{...c.abilities,int:10}};c=integration.reconcileClassGrants(c);assert.equal(lib.steelDefenderProfile(c).hp.current,17);c={...c,abilities:{...c.abilities,int:16}};c=integration.reconcileClassGrants(c);assert.equal(lib.steelDefenderProfile(c).hp.current,17);
});
test('reviving the same defender spends a slot and retains its repair uses',()=>{
 const classes=JSON.parse(readFileSync('public/catalogs/wikidot5e/classes.json','utf8'));const definition=classes.find(x=>x.name==='Artificer');let c={...make(),classDefinition:definition,classLevels:[{catalogId:'2014:artificer',name:'Artificer',edition:'2014',level:3,subclass:'Battle Smith',definition}],slotsUsed:{}};
 c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;c=apply(c,lib.adjustCompanionHP(c,id,-5));c=apply(c,lib.repairSteelDefender(c,id,{total:7},{recipient:'self',confirmed:true}));c=apply(c,lib.adjustCompanionHP(c,id,-99));
 c=apply(c,lib.reviveSteelDefender(c,id,{withinHour:true,withinFiveFeet:true,smithTools:true,slotLevel:1,slotPool:'standard'}));assert.equal(c.slotsUsed[1],1);assert.equal(lib.steelDefenderProfile(c).id,id);assert.equal(lib.steelDefenderProfile(c).repairUsed,1);assert.equal(lib.steelDefenderProfile(c).hp.current,20);
});
test('Repair recovers once after a confirmed defender long rest, without refilling HP',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;
 c=apply(c,lib.adjustCompanionHP(c,id,-10));c=apply(c,lib.repairSteelDefender(c,id,{total:7},{recipient:'other',confirmed:true}));
 assert.throws(()=>lib.recoverSteelDefenderRepair(c,id,{}),/confirm/i);
 c=apply(c,lib.recoverSteelDefenderRepair(c,id,{confirmed:true}));assert.equal(lib.steelDefenderProfile(c).repairUsed,0);assert.equal(lib.steelDefenderProfile(c).hp.current,10);
 assert.equal(lib.steelDefenderProfile(c).id,id);assert.equal(c.subclassCompanionRest,undefined);
});
test('ordinary healing cannot revive a destroyed defender',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;
 c=apply(c,lib.adjustCompanionHP(c,id,-99));assert.throws(()=>lib.adjustCompanionHP(c,id,5),/reviv/i);assert.throws(()=>lib.recoverSteelDefenderRepair(c,id,{confirmed:true}),/destroyed/i);
});
test('legacy Repair counter transfers once and no duplicate companion actions are exposed',()=>{
 let c=make();const old=expanded.expandedSubclassResources(c).find(r=>r.key==='defender-repair');
 if(old)c.resources=[{...old,used:2}];
 else c.resources=[{id:'expanded:2014:artificer:2014:subclass:artificer:battle-smith:resource:defender-repair',classResourceKey:'expanded:2014:artificer:2014:subclass:artificer:battle-smith:resource:defender-repair',expandedSubclassManaged:true,used:2}];
 c=apply(c,lib.createSteelDefender(c,{initial:true}));
 assert.equal(lib.steelDefenderProfile(c).repairUsed,2);
 assert.equal(expanded.expandedSubclassResources(c).some(r=>r.key==='defender-repair'),false);
 assert.equal(expanded.expandedSubclassActions(c).some(a=>['repair','force-empowered-rend','deflect-attack','revive-defender'].includes(a.key)&&a.subclassRecordId==='2014:subclass:artificer:battle-smith'),false);
});
test('owner death makes the same defender perish without losing its Repair state',()=>{
 const definition=JSON.parse(readFileSync('public/catalogs/wikidot5e/classes.json','utf8')).find(x=>x.name==='Artificer');
 let c={...make(),classDefinition:definition,classLevels:[{catalogId:'2014:artificer',name:'Artificer',edition:'2014',level:3,subclass:'Battle Smith',definition}],slotsUsed:{}};c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;
 c=apply(c,lib.repairSteelDefender(c,id,{total:7},{recipient:'other',confirmed:true}));
 c=integration.reconcileClassGrants({...c,dead:true});const p=lib.steelDefenderProfile(c);
 assert.equal(p.id,id);assert.equal(p.hp.current,0);assert.equal(p.repairUsed,1);
 c=integration.reconcileClassGrants({...c,dead:false});assert.equal(lib.steelDefenderProfile(c).hp.current,0);
 c=apply(c,lib.reviveSteelDefender(c,id,{withinHour:true,withinFiveFeet:true,smithTools:true,slotLevel:1,slotPool:'standard'}));assert.equal(lib.steelDefenderProfile(c).id,id);assert.equal(lib.steelDefenderProfile(c).repairUsed,1);assert.equal(c.slotsUsed[1],1);
});
test('Mending heals the defender only after a confirmed cast and never spends Repair',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;c=apply(c,lib.adjustCompanionHP(c,id,-10));
 assert.throws(()=>lib.mendSteelDefender(c,id,{total:7},{}),/confirm/i);
 c=apply(c,lib.mendSteelDefender(c,id,{total:7},{confirmed:true}));assert.equal(lib.steelDefenderProfile(c).hp.current,17);assert.equal(lib.steelDefenderProfile(c).repairUsed,0);
 c=apply(c,lib.adjustCompanionHP(c,id,-99));assert.throws(()=>lib.mendSteelDefender(c,id,{total:7},{confirmed:true}),/reviv/i);
});
test('defender conditions are instance-owned, reject immunities and affect its rolls',()=>{
 let c=make();c=apply(c,lib.createSteelDefender(c,{initial:true}));const id=lib.steelDefenderProfile(c).id;
 assert.throws(()=>lib.setSteelDefenderConditions(c,id,['Poisoned']),/immune/i);
 c=apply(c,lib.setSteelDefenderConditions(c,id,['Blinded','Restrained']));
 assert.equal(lib.steelDefenderRollState(c,id).attackDisadvantage,true);assert.equal(lib.steelDefenderRollState(c,id).dexSaveDisadvantage,true);
 c=apply(c,lib.setSteelDefenderConditions(c,id,['Stunned']));assert.equal(lib.steelDefenderRollState(c,id).cannotAct,true);assert.equal(lib.steelDefenderRollState(c,id).strDexSaveFails,true);
});
