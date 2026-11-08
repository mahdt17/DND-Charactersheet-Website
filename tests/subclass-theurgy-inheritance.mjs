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
