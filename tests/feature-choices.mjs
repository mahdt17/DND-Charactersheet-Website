import assert from 'node:assert/strict';
import {featureChoicePlan,applyFeatureChoices,skillNames} from '../src/lib/featureChoices.js';
const make=(edition,name,level,extra={})=>({ruleset:edition,className:name,level,classDefinition:{name,edition},skillProf:{Stealth:true,Arcana:true,Athletics:true,Perception:true},expertise:{},languages:'Common',...extra});
for(const edition of ['2014','2024']) {
 for(const cls of ['Rogue','Bard','Ranger','Wizard'])for(let level=1;level<=20;level++) {
  const c=make(edition,cls,level),old=level===1?null:make(edition,cls,level-1),plan=featureChoicePlan(c,old);
  const milestones=cls==='Rogue'?[1,6]:cls==='Bard'?(edition==='2014'?[3,10]:[2,9]):edition==='2024'?cls==='Ranger'?[2,9]:[2]:[];
  assert.equal(plan.groups.filter(g=>g.kind==='expertise').length,milestones.includes(level)?1:0,`${edition} ${cls} ${level}`);
 }
 const c=make(edition,'Rogue',1),plan=featureChoicePlan(c),id=plan.groups[0].id;
 assert.equal(plan.valid,false);assert.equal(plan.groups[0].options.includes('Thieves’ tools'),edition==='2014');
 assert.throws(()=>applyFeatureChoices(c,null,{[id]:['Stealth','Stealth']}),/Complete/);
 assert.throws(()=>applyFeatureChoices(c,null,{[id]:['Stealth','Deception']}),/Complete/);
 const chosen=applyFeatureChoices(c,null,{[id]:['Stealth',edition==='2014'?'Thieves’ tools':'Arcana']});
 assert.equal(chosen.expertise.Stealth,true);assert.equal(chosen.skillProf.Athletics,true);
 if(edition==='2014')assert.equal(chosen.toolExpertise['thieves-tools'],true);
 assert.equal(featureChoicePlan(chosen).groups.length,0,'recorded choices must not repeat');
 assert.deepEqual(featureChoicePlan(make(edition,'Rogue',2),make(edition,'Rogue',1)).groups,[],'do not invent historical choices');
 const expertise=featureChoicePlan(make(edition,'Rogue',6,{expertise:{Stealth:true}}),make(edition,'Rogue',5));assert(!expertise.groups[0].options.includes('Stealth'));
 const lore=make(edition,'Bard',3,{subclass:'College of Lore'}),before=make(edition,'Bard',2);
 let lp=featureChoicePlan(lore,before);assert.equal(lp.groups[0].kind,'skills');
 const picks={[lp.groups[0].id]:['Deception','History','Insight']};lp=featureChoicePlan(lore,before,picks);
 if(edition==='2014'){const expertise=lp.groups.find(g=>g.kind==='expertise');assert(expertise.options.includes('Deception'));picks[expertise.id]=['Deception','Stealth'];}
 const next=applyFeatureChoices(lore,before,picks);assert.equal(next.skillProf.Insight,true);assert.equal(next.skillProf.Arcana,true);
 assert.equal(featureChoicePlan(next,next).groups.length,0);
 assert.deepEqual(featureChoicePlan({...c,ruleset:'custom'}).groups,[]);
 assert.deepEqual(featureChoicePlan({...c,classDefinition:{name:'Rogue',edition,source:'Homebrew'}}).groups,[]);
}
const wizard=featureChoicePlan(make('2024','Wizard',2),make('2024','Wizard',1));assert.deepEqual(wizard.groups[0].options,['Arcana']);
const capped=featureChoicePlan(make('2024','Rogue',6,{skillProf:{Stealth:true},expertise:{Stealth:true}}),make('2024','Rogue',5));assert.equal(capped.groups[0].required,0);assert.equal(capped.valid,true);
const life=applyFeatureChoices(make('2014','Cleric',1,{subclass:'Life Domain'}),null,{});assert.equal(life.trainingGrants[0].proficiencies[0].index,'heavy-armor');assert.equal(applyFeatureChoices(life,null,{}).trainingGrants.length,1);
assert.equal(applyFeatureChoices(make('2024','Cleric',3,{subclass:'Life Domain'}),make('2024','Cleric',2),{}).trainingGrants.length,0);
const ranger=make('2024','Ranger',2),before=make('2024','Ranger',1),rp=featureChoicePlan(ranger,before),picks=Object.fromEntries(rp.groups.map(g=>[g.id,g.kind==='languages'?['Draconic','Elvish']:['Perception']]));
assert(!rp.groups.find(g=>g.kind==='languages').options.includes('Common'));const advanced=applyFeatureChoices(ranger,before,picks);assert.equal(advanced.languages,'Common, Draconic, Elvish');assert.equal(advanced.expertise.Perception,true);
const multi={...make('2024','Fighter',6),classLevels:[{name:'Fighter',edition:'2024',level:5},{name:'Rogue',edition:'2024',level:1}]},prior={...multi,classLevels:[multi.classLevels[0]]};
const mp=featureChoicePlan(multi,prior);assert.equal(mp.groups.filter(g=>g.kind==='expertise').length,1);assert.equal(mp.groups.find(g=>g.kind==='expertise').level,1);assert.match(mp.patch.languages,/Thieves' Cant/);
assert.deepEqual(featureChoicePlan({...multi,classLevels:[multi.classLevels[0],{...multi.classLevels[1],edition:'2014'}]},prior).groups,[]);
assert.equal(featureChoicePlan({...multi,classLevels:[multi.classLevels[0],{name:'Druid',edition:'2024',level:1}]},prior).patch.languages,'Common, Druidic');
assert.equal(skillNames.length,18);
console.log('PASS Expertise milestones and eligibility, Lore skill dependencies, Life training, class languages, multiclass attribution, preserved choices, duplicates and manual combinations');
