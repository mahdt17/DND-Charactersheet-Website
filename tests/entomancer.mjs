import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
assert(existsSync('src/lib/entomancer.js'),'Entomancer rules must be implemented');
const {entomancerClass,populationTable}=await import('../src/data/entomancer.js');
const E=await import('../src/lib/entomancer.js');
export const make=(level=1,species='Decomposers',extra={})=>({ruleset:'2014',className:'Entomancer',classDefinition:entomancerClass,level,abilities:{str:12,dex:14,con:16,int:10,wis:18,cha:10},hp:{current:50,max:100,temp:0},inventory:[],entomancer:{species,moisture:'Dry',temperature:'Hot'},...extra});
assert.deepEqual(populationTable,[2,3,4,6,7,8,10,11,12,14,15,16,18,19,20,22,23,24,26,27]);
for(let level=1;level<=20;level++){
 for(const species of ['Decomposers','Endo-Gotas','Exo-Gotas','Orthoptera'])assert.deepEqual(E.entomancerProfile(make(level,species,{ruleset:'custom',mechanics:'2014'})),E.entomancerProfile(make(level,species)),`${species} level ${level} retains automatic mechanics in Custom`);
 const p=E.entomancerProfile(make(level));
 assert.equal(p.level,level);assert.equal(p.max,populationTable[level-1]);assert.equal(p.cantrips,2+Math.floor((level-1)/4));
 assert.equal(p.prepared,level<2?0:p.max);assert.equal(p.spellDC,8+p.pb+3);assert.equal(p.populationDC,8+p.pb+4);
 assert.equal(p.slots.reduce((m,n,i)=>n?i:m,0),level<2?0:level<5?1:level<9?2:level<13?3:level<17?4:5);
}
assert.equal(E.entomancerProfile({...make(),ruleset:'2024'}).level,0);
for(const [species,feature] of Object.entries({Decomposers:'Half Alive','Endo-Gotas':'Hemo Vamprisis','Exo-Gotas':'Abnormal Size',Orthoptera:'Natural Savant'})){
 const custom=make(1,species,{ruleset:'custom',mechanics:'2014'});
 assert.equal(E.entomancerProfile(custom).level,1,'Custom 5e must retain Entomancer automation');
 assert.equal(E.entomancerProfile(custom).max,2);
 assert(E.entomancerFeatureRows(custom).some(f=>f.name===feature));
 assert.equal(E.entomancerProfile({...custom,mechanics:'3.5'}).level,0);
}
assert.equal(E.entomancerProfile({...make(),classDefinition:{name:'Entomancer',edition:'2014'}}).level,0,'same name is not source identity');
const featBoosted=make(5,'Decomposers',{abilities:{str:10,dex:10,con:16,int:10,wis:17,cha:10},abilityBonuses:{},feats:[{name:'Telekinetic',edition:'2014',magicChoices:{ability:'wis'}}]});
assert.equal(E.entomancerProfile(featBoosted).wis,4,'Swarm abilities use feat-adjusted scores');
assert.equal(E.entomancerProfile(make(1,'Decomposers',{race:'Human',abilities:{wis:17}})).wis,4,'Older saves include racial bonuses');
const secondary={...make(),classLevels:[{name:'Fighter',edition:'2014',level:1,definition:{name:'Fighter',edition:'2014'}},{name:'Entomancer',edition:'2014',level:1,definition:entomancerClass}],entomancer:{species:'Orthoptera',tool:'Herbalism Kit',instrument:'Lute'}};
assert(!E.entomancerTraining(secondary).some(p=>p.name==='Herbalism Kit'),'Multiclassing does not grant starting tools');
assert(E.entomancerTraining(secondary).some(p=>p.name==='Lute'),'Species feature training still applies');
assert.equal(E.entomancerProfile({...make(),classLevels:[{name:'Wizard',level:5,edition:'2014',definition:{name:'Wizard'}}]}).level,0);
assert.equal(E.entomancerProfile(make(11)).resistances.includes('fire'),true);
assert.equal(E.entomancerProfile(make(10)).resistances.includes('fire'),false);
assert.equal(E.entomancerSkillRank(make(11),'Stealth'),1);
assert.equal(E.entomancerSkillRank(make(11,'Decomposers',{skillProf:{Stealth:true}}),'Stealth'),2);
assert.equal(E.entomancerSkillRank(make(6,'Exo-Gotas',{skillProf:{Athletics:true}}),'Athletics'),2);
assert.equal(E.entomancerArmor(make(11),15,'Light'),17);
assert.equal(E.entomancerArmor(make(11),18,'Heavy'),18);
assert.equal(E.entomancerArmor(make(18,'Exo-Gotas'),18,'Heavy'),21);
assert.equal(E.entomancerArmor(make(18,'Exo-Gotas'),12,''),18);
assert.equal(E.entomancerArmor(make(17,'Decomposers',{entomancer:{species:'Decomposers',effects:{swarmForm:{remaining:10}}}}),18,'Heavy'),16);
assert.equal(E.entomancerProfile(make(20)).waterBreathing,true);
assert.equal(E.entomancerProfile(make(6,'Exo-Gotas')).speedMultiplier,2);
assert.equal(E.entomancerProfile(make(5,'Exo-Gotas')).speedMultiplier,1);
console.log('PASS Entomancer levels, identity, spell profile, species, adaptation, armor and training');

const environment=(moisture,temperature)=>make(10,'Decomposers',{entomancer:{species:'Decomposers',moisture:'Dry',temperature:'Hot',environmentMoisture:moisture,environmentTemperature:temperature}});
assert.equal(E.entomancerProfile(environment('Dry','Cold')).adapted,false);
assert.equal(E.entomancerProfile(environment('Humid','Neutral')).opposite,false);
assert.equal(E.entomancerProfile(environment('Humid','Cold')).opposite,true);
assert.equal(E.entomancerProfile(environment('Dry','Hot')).adapted,true);
const incomplete=E.entomancerProfile(make(15,'Decomposers',{entomancer:{species:'Decomposers'}}));
assert.equal(incomplete.adapted,false,'missing choices and environment cannot grant adaptation');
assert.equal(incomplete.forageEnvironment,false,'missing environment cannot enable foraging');
