import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spellCounts, spellAccess, spellSlotPools} from '../src/lib/editions.js';
import {classCharacter} from '../src/lib/advancement.js';
import {arcaneArcherClass} from '../src/lib/arcaneArcher.js';
import {createInstitute, recordFame, trainingStatus, studyLevels, claimStudy} from '../src/lib/esotericTraining.js';

function sheet(levels, fame=0, approval=0, ascended=false) {
  const classLevels=Object.entries(levels).map(([name,level])=>({name,level,edition:'2014',catalogId:'2014:'+name,definition:name==='Archer'?arcaneArcherClass:{name,edition:'2014'}}));
  const level=classLevels.reduce((n,row)=>n+row.level,0);
  const training={...createInstitute(4).training,approvedFame:approval,ascensionQuest:ascended?'Lost elven archive':'',bookAwards:true,rangerKnown:true,events:[{id:'quest',kind:'quest',level:5,amount:fame}]};
  return {ruleset:'2014',level,className:'Fighter',classLevels,affiliations:[{training}],spells:[]};
}
test('actual level gates, replacement rewards and distinct spell and slot ceilings',()=>{
  const c=sheet({Fighter:1,Wizard:4},45,45,true);
  const wizard=classCharacter(c,c.classLevels[1]);
  assert.deepEqual(spellSlotPools(c).standard.slice(1,4),[4,3,2]);
  assert.equal(spellCounts(wizard,18).prepared,9);
  assert.equal(spellCounts(wizard,18).cantrips,4);
  for(const [fame,ascended,dc,rc,cl,spellTier] of [[0,false,13,3,14,7],[35,false,16,4,18,8],[45,true,17,3,18,9]]){
    const end=sheet({Fighter:2,Wizard:13,Ranger:3,Archer:2},fame,fame,ascended);
    const status=trainingStatus(end);
    assert.deepEqual([status.wizardBonus+13,status.rangerBonus+3,spellSlotPools(end).casterLevel],[dc,rc,cl]);
    const model=classCharacter(end,end.classLevels[1]);
    for(let level=1;level<=9;level++)assert.equal(spellAccess(model,{classes:['Wizard'],level,edition:'2014'}).allowed,level<=spellTier);
    assert.equal(model.level,13);
  }
});
test('education consumes failed attempts, rejects repeats and respects enrollment',()=>{
  let g=createInstitute(5);
  const attempt=(level,id,total)=>recordFame(g,level,{id,kind:'education',subject:'Arcana',total});
  assert.throws(()=>attempt(5,'a',20));
  g=attempt(6,'a',15);
  assert.equal(g.training.events[0].amount,0);
  assert.throws(()=>attempt(6,'a',18));
  g=attempt(6,'b',16);g=attempt(6,'c',20);assert.throws(()=>attempt(6,'d',19));
  assert.equal(trainingStatus({...sheet({Wizard:6}),affiliations:[g]}).fame,2);
});
test('each effective Wizard level grants its two study picks only once',()=>{
  const c=sheet({Fighter:1,Wizard:4},5,5);
  assert.deepEqual(studyLevels(c,4),[5]);
  const picks=[{name:'Fireball',level:3,classes:['Wizard'],edition:'2014'},{name:'Counterspell',level:3,classes:['Wizard'],edition:'2014'}];
  const next={...c,...claimStudy(c,c.classLevels[1],5,picks)};
  assert.equal(next.spells.length,2);
  assert.deepEqual(studyLevels(next,4),[]);
  assert.throws(()=>claimStudy(next,c.classLevels[1],5,picks));
});

import {createShadowArcher,shadowArcherRoadmap} from '../src/lib/shadowArcherPlan.js';
import {advanceClass,eligibleClass} from '../src/lib/advancement.js';
import {restSpellSlots} from '../src/lib/multiclassCasting.js';
import {effectiveAbilityScores} from '../src/lib/abilityScores.js';
import {multiclassTrainingPlan} from '../src/lib/training.js';
import classes from '../src/data/classes.json' with {type:'json'};

test('the proposal advances through every class choice and casting milestone from level one',()=>{
  let char=createShadowArcher('Shadow Archer',1);
  const start=createShadowArcher('Campaign start',5);
  assert.deepEqual(start.classLevels.map(r=>r.level),[1,4]);
  assert.deepEqual(start.saveProf,{str:true,con:true});
  assert.equal(start.spells.filter(s=>s.level>0).length,12);
  assert.equal(start.spells.filter(s=>s.level>0&&s.prepared).length,8);
  assert.equal(start.shadarKai.trance.length,2);
  assert.deepEqual(effectiveAbilityScores(start),{str:10,dex:20,con:15,int:18,wis:15,cha:13});
  const tiers=[3,3,4,4,4,4,4,4,4,5,6,6,7,7,8,9];
  const slots=[3,3,4,4,4,5,5,5,5,5,7,7,8,8,9,9];
  for(let level=2;level<=20;level++){
    const [name]=shadowArcherRoadmap[level-1];
    const base=classes.find(c=>c.name===name);
    const record=name==='Arcane Archer'?arcaneArcherClass:{...base,edition:'2014',catalogId:'2014:'+base.index};
    const flow=name==='Arcane Archer'?'prestige':'normal';
    assert.ok(eligibleClass(char,record,flow).allowed,'entry at level '+level);
    const subclass=level===3?'Bladesinging':level===12?'Gloom Stalker':undefined;
    const trainingChoices=Object.fromEntries(multiclassTrainingPlan(char,record).choices.filter(x=>x.required).map(x=>[x.id,x.options.slice(0,x.count)]));
    char=advanceClass(char,record,{flow,subclass,hpGain:6,trainingChoices});
    if(level===5){
      char.feats=start.feats;
      assert.equal(eligibleClass(char,arcaneArcherClass,'prestige').allowed,false);
      const g=createInstitute(5);
      char.affiliations=[recordFame(g,5,{id:'prior',kind:'prior'})];
    }
    if(level<5)continue;
    let g=char.affiliations[0];
    if(level>5)g=recordFame(g,level,{kind:'quest',id:'q'+level,note:'Expedition '+level,amount:5});
    char.affiliations=[{...g,training:{...g.training,approvedFame:45,ascensionQuest:level===20?'Final research':'',bookAwards:true,rangerKnown:true}}];
    const wizard=classCharacter(char,char.classLevels.find(r=>r.name==='Wizard'));
    const highest=spellLevel=>spellAccess(wizard,{name:'Wizard spell',edition:'2014',classes:['Wizard'],level:spellLevel}).allowed;
    assert.equal(highest(tiers[level-5]),true,'learn at '+level);
    if(tiers[level-5]<9)assert.equal(highest(tiers[level-5]+1),false,'learn cap at '+level);
    const pool=spellSlotPools(char).standard;
    assert.equal(pool.findLastIndex(n=>n>0),slots[level-5],'slots at '+level);
  }
  assert.deepEqual(char.classLevels.map(r=>r.level),[2,13,3,2]);
  assert.deepEqual(spellSlotPools(char).standard,[0,4,3,3,3,3,1,1,1,1]);
  assert.equal(spellSlotPools({...char,...restSpellSlots(char,'long')}).casterLevel,18);
});
