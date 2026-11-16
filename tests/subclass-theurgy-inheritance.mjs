import {spellAccess} from '../src/lib/editions.js';
import {reconcileSubclassSpells} from '../src/lib/subclassSpells.js';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {expandedSubclassRows,expandedSubclassResources,expandedSubclassActions,useExpandedSubclassAction,reconcileExpandedSubclasses,expandedSubclassChoicePlan,expandedSubclassFeatures,expandedSubclassSpellGrants} from '../src/lib/expandedSubclasses.js';
import {healingFeaturePlan,blessedHealerPatch} from '../src/lib/subclassHealing.js';
import {subclassNumericProfile} from '../src/lib/subclassNumerics.js';
import {characterResources} from '../src/lib/resources.js';
const make=(domain='Life',level=6)=>({ruleset:'2014',className:'Wizard',subclass:'Theurgy (UA)',level,classDefinition:{name:'Wizard',index:'wizard',edition:'2014'},abilities:{str:10,dex:12,con:12,int:18,wis:12,cha:10},hp:{current:10,max:50,temp:0},resources:[],activeEffects:[],inventory:[],spells:[],actions:[],expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{'divine-domain':[domain]}}}});
const spell={name:'Cure Wounds',level:1,heal_at_slot_level:{1:'1d8+4'}},plan={rolls:[{expression:'1d8+4',label:'Healing'}]};
test('Theurgy Life grants exact 6/10/14 inherited healing and suppresses other sources and editions',()=>{
 for(const [level,expression,blessed] of [[5,'1d8+4',false],[6,'1d8+7',false],[9,'1d8+7',false],[10,'1d8+7',true],[13,'1d8+7',true],[14,'15',true]]){const c=make('Life',level);assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,expression);assert.equal(blessedHealerPatch(c,spell,{recipient:'other',slotLevel:1,maxHP:50}).hp?.current,blessed?13:undefined);}
 for(const c of [{...make(),subclass:'Evocation'},{...make(),ruleset:'2024',classDefinition:{name:'Wizard',index:'wizard',edition:'2024'}},make('Light')])assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,'1d8+4');
});
test('inherited Channel options use one Wizard Arcana pool, Wizard DC, explicit Cleric level',()=>{
 for(const [level,max] of [[2,1],[6,2],[18,3]]){let c=make('Life',level),a=expandedSubclassActions(c).find(a=>a.name==='Channel Divinity: Preserve Life');assert(a);assert.equal(a.rolls[0].expression,'0');assert.equal(a.saveDC,14+Math.floor((level-1)/4));assert(a.resourceId.includes('channel-arcana'));c={...c,...useExpandedSubclassAction(c,a.id,{eligible:true})};const resources=characterResources(c);assert.equal(resources.filter(r=>r.name==='Channel Arcana').length,1);assert.equal(resources.find(r=>r.name==='Channel Arcana').used,1);assert.equal(resources.find(r=>r.name==='Channel Arcana').max,max);assert(!resources.some(r=>r.id==='2014:channel-divinity'));}
 let c=make('Life',10);c.level=13;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',subclass:'Theurgy (UA)',level:10},{catalogId:'2014:cleric',name:'Cleric',edition:'2014',subclass:'Light',level:3}];assert.equal(expandedSubclassActions(c).find(a=>a.sourceClassId==='2014:wizard'&&a.name.includes('Preserve Life')).rolls[0].expression,'15');
});
test('inheritance routes Wisdom resources, tool training, choices, numeric AC and source cleanup',()=>{
 let c=make('Grave',10);assert.equal(expandedSubclassResources(c).find(r=>r.name.startsWith("Sentinel at Death")).max,1);
 c=make('Forge',10);c.inventory=[{id:'mail',equipmentIndex:'chain-mail',equipped:true}];assert.equal(subclassNumericProfile(c).acBonus,1);const trained=reconcileExpandedSubclasses(c);assert(trained.trainingGrants.some(g=>g.proficiencies.some(p=>p.name==="smith's tools")));assert(!trained.trainingGrants.some(g=>g.proficiencies.some(p=>p.kind==='armor'||p.kind==='weapons')));
 c=make('Knowledge',6);assert(expandedSubclassChoicePlan(c,null,{},{}).groups.some(g=>g.label==='Blessings of Knowledge'));assert(expandedSubclassFeatures(c).some(f=>f.name==='Blessings of Knowledge'));const switched={...c,expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{'divine-domain':['Life']}}}};assert(!expandedSubclassFeatures(switched).some(f=>f.name==='Blessings of Knowledge'));
});

test('inherited domain cantrips preserve their printed Cleric spellcasting ability and Wizard ownership',()=>{
 const c=make('Arcana',6);c.expandedSubclassChoices['2014:wizard']['2014:subclass:wizard:theurgy-ua']['domain:expanded-cleric-arcana:wizard-cantrips']=['Fire Bolt','Light'];
 const grants=expandedSubclassSpellGrants(c).filter(g=>['Fire Bolt','Light'].includes(g.name));
 assert.equal(grants.length,2);for(const g of grants){assert.equal(g.sourceClassId,'2014:wizard');assert.equal(g.ability,'wis');}
});



test('inherited healing is suppressed while Polymorph replaces class features',()=>{
 const c=make('Life',14);c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:14,subclass:'Theurgy (UA)'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}];c.level=15;c.activeEffects=[{id:'sheep',sourceClassId:'2014:sorcerer',subclassRecordId:'2014:subclass:sorcerer:wild-magic',sourceFeatureId:'2014:subclass:sorcerer:wild-magic:wild-magic-surge',stateKey:'wild-surge:77',saveSucceeded:false,remainingSeconds:60}];
 assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,'1d8+4');assert.deepEqual(blessedHealerPatch(c,spell,{recipient:'other',slotLevel:1,maxHP:50}),{});
});

test('inherited choice training is source-owned and removed after switching domains',()=>{
 const c=make('Knowledge',6),state=c.expandedSubclassChoices['2014:wizard']['2014:subclass:wizard:theurgy-ua'];state['domain:expanded-cleric-knowledge:knowledge-skills']=['Arcana','History'];state['domain:expanded-cleric-knowledge:languages']=['Elvish','Dwarvish'];
 const learned=reconcileExpandedSubclasses(c);assert.equal(learned.expertise.Arcana,true);assert(learned.trainingGrants.some(g=>g.sourceClassId==='2014:wizard'&&g.proficiencies.some(p=>p.name==='Arcana')));
 const swapped=reconcileExpandedSubclasses({...c,...learned,expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{...state,'divine-domain':['Life']}}}});assert.equal(!!swapped.expertise.Arcana,false);assert(!swapped.trainingGrants.some(g=>g.proficiencies.some(p=>p.name==='Arcana')));
});

test('feature cantrip and independently known ordinary cantrip keep distinct casting abilities',()=>{
 const c=make('Arcana',6);c.expandedSubclassChoices['2014:wizard']['2014:subclass:wizard:theurgy-ua']['domain:expanded-cleric-arcana:wizard-cantrips']=['Fire Bolt','Light'];
 const feature=reconcileSubclassSpells(c).find(s=>s.name==='Fire Bolt');assert(feature);assert.equal(spellAccess(c,feature).ability,'wis');
 const ordinary={...feature,id:'ordinary-fire-bolt',classSpellGrant:false,expandedSubclassManaged:false,subclassRecordId:undefined,sourceAbility:undefined};assert.notEqual(spellAccess(c,ordinary).ability,'wis');c.spells=[ordinary];assert.equal(reconcileSubclassSpells(c).filter(s=>s.name==='Fire Bolt').length,2);const legacy={...ordinary,castingClassId:undefined};c.spells=[legacy];assert.notEqual(spellAccess(c,legacy).ability,'wis');assert.equal(reconcileSubclassSpells(c).filter(s=>s.name==='Fire Bolt').length,2);
});

test('Arcana domain choice retains a Wizard-known cantrip as a separate casting source',()=>{
 const c=make('Arcana',6);c.spells=[{name:'Fire Bolt',id:'ordinary-fire',castingClassId:'2014:wizard',edition:'2014'}];
 const g=expandedSubclassChoicePlan(c,null,{},{}).groups.find(g=>g.choiceKey==='domain:expanded-cleric-arcana:wizard-cantrips');assert(g);assert(g.options.includes('Fire Bolt'));
});

test('Theurgy inherits domain bonus cantrips but not domain spell tables',()=>{
 for(const [name,cantrip] of [['Grave','Spare the Dying'],['Light','Light'],['City (UA)','On/Off']]){const c=make(name,6),grants=expandedSubclassSpellGrants(c);const spell=grants.find(g=>g.name===cantrip);assert(spell,`${name} ${cantrip}`);assert.equal(spell.ability,'wis');assert.equal(spell.sourceClassId,'2014:wizard');assert(!grants.some(g=>g.acquisition==='prepared'));}
 assert(!expandedSubclassSpellGrants({...make('Grave',5)}).some(g=>g.name==='Spare the Dying'));
});
import {activateMoonForm,bindWildSheep} from '../src/lib/subclassOwnForm.js';
test('Grave healing tests the active Moon body rather than stored normal HP',()=>{
 let c=make('Grave',6);c.level=8;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:6,subclass:'Theurgy (UA)'},{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'}];c={...c,...activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true})};c.hp={...c.hp,current:0};assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,'1d8+4');const id=c.activeEffects.find(e=>e.stateKey==='moon-wild-shape').id;c.hp.current=10;c.profileState[id].hp.current=0;assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,'12');
});

test('Light bonus cantrip respects already known spells and source removal',()=>{
 const c=make('Light',6);c.spells=[{id:'known-light',name:'Light',edition:'2014',castingClassId:'2014:wizard'}];assert(!expandedSubclassSpellGrants(c).some(g=>g.name==='Light'));c.spells=[];assert(reconcileSubclassSpells(c).some(s=>s.name==='Light'));c.expandedSubclassChoices['2014:wizard']['2014:subclass:wizard:theurgy-ua']['divine-domain']=['Grave'];assert(!reconcileSubclassSpells(c).some(s=>s.name==='Light'));
});

test('Life Cleric plus Theurgy Life applies the shared healing benefit only once',()=>{
 const c=make('Life',10);c.level=16;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:10,subclass:'Theurgy (UA)'},{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:6,subclass:'Life'}];assert.equal(healingFeaturePlan(c,spell,plan,{recipient:'self'}).rolls[0].expression,'1d8+7');assert.equal(blessedHealerPatch(c,spell,{recipient:'other',slotLevel:1,maxHP:50}).hp.current,13);assert.equal(characterResources(c).filter(r=>r.id==='2014:channel-divinity').length,1);assert.equal(characterResources(c).filter(r=>r.name==='Channel Arcana').length,1);
});

test('Light inherited cantrip does not duplicate an actual Cleric bonus source',()=>{const c=make('Light',6);c.level=7;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:6,subclass:'Theurgy (UA)'},{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:1,subclass:'Light'}];c.spells=[{id:'cleric-light',name:'Light',edition:'2014',classSpellGrant:true,castingClassId:'2014:cleric',subclassRecordId:'2014:subclass:cleric:light'}];assert(!expandedSubclassSpellGrants(c).some(g=>g.sourceClassId==='2014:wizard'&&g.name==='Light'));});

test('Light multiclass reconciliation is stable from an empty spell list',()=>{const c=make('Light',6);c.level=7;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:6,subclass:'Theurgy (UA)'},{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:1,subclass:'Light'}];const first=reconcileSubclassSpells(c);assert.equal(first.filter(s=>s.name==='Light').length,1);assert.equal(first.find(s=>s.name==='Light').castingClassId,'2014:cleric');assert.deepEqual(reconcileSubclassSpells({...c,spells:first}),first);});

test('Light inherited cantrip remains stable across reconciliation and reload',()=>{const c=make('Light',6),first=reconcileSubclassSpells(c);assert.equal(first.filter(s=>s.name==='Light').length,1);const second=reconcileSubclassSpells({...c,spells:JSON.parse(JSON.stringify(first))});assert.deepEqual(second,first);});
test('Solidarity Supreme Healing and Protection Blessed Healer inherit without stacking Life',()=>{const s=make('Solidarity',14);assert.equal(healingFeaturePlan(s,spell,plan,{recipient:'self'}).rolls[0].expression,'12');assert.equal(healingFeaturePlan({...s,level:13},spell,plan,{recipient:'self'}).rolls[0].expression,'1d8+4');const p=make('Protection (UA)',10);assert.equal(blessedHealerPatch(p,spell,{recipient:'other',slotLevel:1,maxHP:50}).hp?.current,13);p.level=16;p.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:10,subclass:'Theurgy (UA)'},{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:6,subclass:'Life'}];assert.equal(blessedHealerPatch(p,spell,{recipient:'other',slotLevel:1,maxHP:50}).hp?.current,13);});
test('Invoke Duplicity spends Channel Arcana and tracks concentration and movement',()=>{let c=make('Trickery',14);const actions=expandedSubclassActions(c),start=actions.find(a=>a.key.endsWith('channel-divinity-invoke-duplicity')),move=actions.find(a=>a.key.endsWith('move-duplicate'));assert(start&&move);assert.throws(()=>useExpandedSubclassAction(c,move.id,{eligible:true}),/duplicate/i);c={...c,...useExpandedSubclassAction(c,start.id,{eligible:true})};assert.equal(c.concentration,'Invoke Duplicity');assert.equal(c.activeEffects.find(e=>e.stateKey==='invoke-duplicity')?.duplicates,4);assert.equal(characterResources(c).find(r=>r.id===start.resourceId).used,1);assert.deepEqual(useExpandedSubclassAction(c,move.id,{eligible:true}),{});});
import {advanceEffectTime,castEffectPatch} from '../src/lib/spellEffects.js';import {reconcileSubclassStates} from '../src/lib/subclassState.js';
test('Invoke Duplicity ends on expiry, lost concentration and domain change',()=>{let c=make('Trickery',6);const a=expandedSubclassActions(c).find(a=>a.key.endsWith('channel-divinity-invoke-duplicity'));c={...c,...useExpandedSubclassAction(c,a.id,{eligible:true})};const expired=advanceEffectTime(c,{seconds:60});assert.equal(expired.concentration,null);assert(!expired.activeEffects.some(e=>e.stateKey==='invoke-duplicity'));const changed=reconcileSubclassStates({...c,expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{'divine-domain':['Life']}}}});assert.equal(changed.concentration,null);assert(!changed.activeEffects.some(e=>e.stateKey==='invoke-duplicity'));const lost=reconcileSubclassStates({...c,concentration:null});assert(!lost.activeEffects.some(e=>e.stateKey==='invoke-duplicity'));});
test('Wholeness of Body restores the active body once and spends its long-rest use',()=>{let c=make('Life',6);c={...c,className:'Monk',subclass:'Open Hand',classDefinition:{name:'Monk',index:'monk',edition:'2014'},expandedSubclassChoices:{},hp:{current:10,max:50,temp:0}};const a=expandedSubclassActions(c).find(a=>a.key==='wholeness-body');assert(a);c={...c,...useExpandedSubclassAction(c,a.id,{eligible:true,maxHP:50})};assert.equal(c.hp.current,28);assert.throws(()=>useExpandedSubclassAction(c,a.id,{eligible:true,maxHP:50}),/resource/i);});
test('Wholeness respects the current HP maximum and active Moon body',()=>{let c={...make('Life',6),className:'Monk',subclass:'Open Hand',classDefinition:{name:'Monk',index:'monk',edition:'2014'},expandedSubclassChoices:{},hp:{current:20,max:50,temp:0}};let a=expandedSubclassActions(c).find(a=>a.key==='wholeness-body');assert.equal(useExpandedSubclassAction(c,a.id,{eligible:true,maxHP:25}).hp.current,25);c.level=8;c.classLevels=[{catalogId:'2014:monk',name:'Monk',edition:'2014',level:6,subclass:'Open Hand'},{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'}];c={...c,...activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true})};const id=c.activeEffects.find(e=>e.stateKey==='moon-wild-shape').id;c.profileState[id].hp.current=5;a=expandedSubclassActions(c).find(a=>a.key==='wholeness-body');const result=useExpandedSubclassAction(c,a.id,{eligible:true,maxHP:50});assert.equal(result.profileState[id].hp.current,23);assert.equal(c.hp.current,20);});
import {healingFeatures,useHealingFeature} from '../src/lib/subclassHealing.js';
test('Mercy healing uses the Monk die and Wisdom and spends ki once unless replacing Flurry',()=>{let c={...make('Life',6),className:'Monk',subclass:'Mercy',classDefinition:{name:'Monk',index:'monk',edition:'2014'},expandedSubclassChoices:{},resources:[{id:'2014:Monk:points',classResourceKey:'2014:Monk:points',used:0,max:6}],hp:{current:10,max:50,temp:0}};const d=healingFeatures(c).find(d=>d.key==='mercy-healing');assert.equal(d.roll,'1d6+1');let r=useHealingFeature(c,'mercy-healing',{result:{total:5},recipient:'self',triggered:true,maxHP:50});assert.equal(r.hp.current,15);assert.equal(r.resources.find(r=>r.id==='2014:Monk:points').used,1);r=useHealingFeature(c,'mercy-healing',{result:{total:5},recipient:'self',triggered:true,flurry:true,maxHP:50});assert.equal(r.hp.current,15);assert(!r.resources);});
test('Mercy UA uses its own level and handles low Wisdom',()=>{const c={...make('Life',3),className:'Monk',subclass:'Mercy (UA)',classDefinition:{name:'Monk',index:'monk',edition:'2014'},expandedSubclassChoices:{},abilities:{str:10,dex:10,con:10,int:10,wis:6,cha:10},resources:[{id:'2014:Monk:points',classResourceKey:'2014:Monk:points',used:0,max:3}]};const d=healingFeatures(c).find(d=>d.key==='mercy-healing');assert.equal(d.roll,'1d4-2');const r=useHealingFeature(c,'mercy-healing',{result:{total:-1},recipient:'self',triggered:true,maxHP:50});assert.equal(r.hp.current,10);});

test('Rage prevents starting Invoke Duplicity without spending Channel Arcana',()=>{
 const c=make('Trickery',2);
 c.classLevels=[
   {catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Theurgy (UA)'},
   {catalogId:'2014:barbarian',name:'Barbarian',edition:'2014',level:1}
 ];
 c.level=3;
 c.activeEffects=[{id:'rage',baseClassId:'2014:Barbarian:rage',stateKey:'rage',remainingSeconds:60}];
 const action=expandedSubclassActions(c).find(a=>a.key.endsWith('channel-divinity-invoke-duplicity'));
 assert(action);
 assert.throws(()=>useExpandedSubclassAction(c,action.id,{eligible:true}),/concentrate.*raging/i);
 assert.equal(characterResources(c).find(r=>r.id===action.resourceId).used,0);
});
import {applySubclassTable} from '../src/lib/subclassTables.js';
test('potted plant incapacity ends Invoke Duplicity concentration',()=>{let c=make('Life',2);c.className='Cleric';c.subclass='Trickery';c.level=3;c.classDefinition={name:'Cleric',index:'cleric',edition:'2014'};c.classLevels=[{catalogId:'2014:cleric',name:'Cleric',edition:'2014',level:2,subclass:'Trickery'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}];c.expandedSubclassChoices={};c.resources=characterResources(c);const action=expandedSubclassActions(c).find(a=>a.key.endsWith('channel-divinity-invoke-duplicity'));c={...c,...useExpandedSubclassAction(c,action.id,{eligible:true})};c=reconcileSubclassStates({...c,...applySubclassTable(c,'sorcerer-wild-magic',{total:41},{triggered:true,rolls:[]})});assert.equal(c.concentration,null);assert(!c.activeEffects.some(e=>e.stateKey==='invoke-duplicity'));});
import {stormbornProfile,setStormbornEnvironment} from '../src/lib/subclassStormborn.js';
test('Theurgy Tempest grants Stormborn at Wizard14 only when outdoors and above ground',()=>{let c=make('Tempest',13);assert.equal(stormbornProfile(c),null);c.level=14;let p=stormbornProfile(c);assert(p);assert.equal(p.active,false);c={...c,...setStormbornEnvironment(c,'2014:wizard',true)};assert(stormbornProfile(c).active);c={...c,...setStormbornEnvironment(c,'2014:wizard',false)};assert(!stormbornProfile(c).active);});
test('Stormborn follows owner, source cleanup and feature retention',()=>{let c=make('Tempest',14);c={...c,...setStormbornEnvironment(c,'2014:wizard',true)};let downgraded=reconcileSubclassStates({...c,level:13});assert.equal(stormbornProfile(downgraded),null);assert(!downgraded.activeEffects.some(e=>e.stateKey==='stormborn-outdoors'));const changed=reconcileSubclassStates({...c,expandedSubclassChoices:{'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{'divine-domain':['Life']}}}});assert(!changed.activeEffects.some(e=>e.stateKey==='stormborn-outdoors'));});
test('Stormborn environment survives retained Moon form but is suppressed by replacement Polymorph',()=>{let c=make('Tempest',14);c.level=16;c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:14,subclass:'Theurgy (UA)'},{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'}];c={...c,...setStormbornEnvironment(c,'2014:wizard',true)};c={...c,...activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true})};assert(stormbornProfile(c).active);let s=make('Tempest',14);s.level=15;s.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:14,subclass:'Theurgy (UA)'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}];s={...s,...setStormbornEnvironment(s,'2014:wizard',true)};s={...s,...applySubclassTable(s,'sorcerer-wild-magic',{total:77},{triggered:true,rolls:[{total:2}]})};s={...s,...bindWildSheep(s,'goat',{confirmed:true})};assert.equal(stormbornProfile(s),null);});
