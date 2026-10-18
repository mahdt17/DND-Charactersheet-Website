import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {requirements} from '../src/lib/advancement.js';
import {castingAdvancementPlan,applyCastingAdvancementSelections,reconcileClassGrants,removeClassProgression} from '../src/lib/classIntegration.js';

const catalog=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','classes'));
const exact=id=>{const r=catalog.find(r=>r.sourceId===id);assert(r,id);return r;};
const row=(id,level)=>{const definition=exact(id);return {catalogId:definition.catalogId,name:definition.name,definition,edition:'3.5',level};};
const psion=n=>row('classes/psion-137',n),warrior=n=>row('classes/psychic-warrior-138',n),wilder=n=>row('classes/wilder-140',n),fighter=row('classes/fighter-93',1);
const make=classLevels=>({ruleset:'3.5',classLevels,abilities:{int:18,wis:18,cha:18},abilityBonuses:{},feats:[],spells:[],resources:[],featureChoices:{}});
const power=(level,owner=psion(1).catalogId,klass='Psion')=>({id:`test-power-${klass}-${level}`,name:`Test ${klass} power ${level}`,edition:'3.5',school:'Psychokinesis',level,classLevels:{[klass]:level},classes:[klass],castingClassId:owner});
const check=(c,p)=>requirements({catalogId:'test:manifesting-entry',edition:'3.5',prerequisites:[p]},c)[0].status;
const ml=minimum=>({kind:'manifester_level',minimum}),access=minimum=>({kind:'manifesting',minimum});
const p5=make([psion(5)]);
assert.equal(check(p5,{kind:'psionics',text:'Manifester level 5th.'}),'met');
assert.equal(check(make([psion(3)]),ml(5)),'unmet');
assert.equal(check(make([psion(3),warrior(2)]),ml(5)),'unmet','manifester levels do not pool across classes');
const practiced=JSON.parse(await fs.readFile('public/catalogs/dndtools/feats.json','utf8')).map(r=>normalizeCatalogRecord(r,'dndtools','feats')).find(r=>r.sourceId==='feats/practiced-manifester-2230');
assert(practiced);
assert.equal(check({...make([psion(3),{...fighter,level:2}]),feats:[practiced]},ml(5)),'manual','unimplemented permanent ML modifiers must not falsely reject eligibility');
assert.equal(check({...p5,feats:[{...practiced,name:'Practiced Manifester (Psion)'}]},ml(6)),'manual');
assert.equal(check({...p5,feats:[practiced]},ml(5)),'met','known base ML still proves a threshold');
assert.equal(check({...make([psion(3),{...fighter,level:2}]),feats:[practiced],spells:[power(3)]},access(3)),'unmet','ML feats do not grant higher-level powers');
assert.equal(check({...p5,powerPointsUsed:999,abilities:{}},ml(5)),'met','manifester level is independent of spending and ability');
assert.equal(check(p5,access(3)),'manual','table ceiling alone does not prove a known usable power');
assert.equal(check({...p5,spells:[power(3)]},access(3)),'met');
assert.equal(check({...p5,spells:[power(3)],powerPointsUsed:999},access(3)),'met','entry capability survives daily spending');
assert.equal(check({...p5,spells:[power(3)],abilities:{int:12}},access(3)),'unmet');
assert.equal(check({...p5,spells:[power(3)],abilities:{}},access(3)),'manual');
assert.equal(check({...p5,spells:[power(3)],abilityBonuses:{int:Infinity}},access(3)),'manual');
assert.equal(check({...make([psion(1),warrior(7)]),spells:[power(3)]},access(3)),'manual','another class cannot borrow an owned Psion power');
assert.equal(check({...p5,spells:[{...power(3),school:'Evocation'}]},access(3)),'manual','ordinary spells are not power access proof');
assert.equal(check({...p5,spells:[{...power(3),edition:'2014'}]},access(3)),'manual');
assert.equal(check({...make([psion(1)]),spells:[power(3)],powerPointBonus:{amount:99,source:'Recorded grant'}},access(3)),'unmet','extra PP does not unlock power levels');
const w3=make([wilder(3)]),w4=make([wilder(4)]);
assert.equal(check({...w3,spells:[power(2,wilder(3).catalogId)]},access(2)),'unmet','Wilder third level is still limited to first-level powers');
assert.equal(check({...w4,spells:[power(2,wilder(4).catalogId)]},access(2)),'met');
const lowWarrior={...make([warrior(1)]),abilities:{wis:11},spells:[power(1,warrior(1).catalogId,'Psychic Warrior')]};
assert.equal(check(lowWarrior,access(1)),'unmet','zero base and bonus PP cannot fund a power');
assert.equal(check({...lowWarrior,powerPointBonus:{amount:1,source:'Recorded grant'}},access(1)),'met');
for(const minimum of [0,-1,1.5,'3',Infinity])assert.equal(check(p5,ml(minimum)),'manual');
assert.equal(check(p5,access(10)),'manual');
for(const id of ['classes/ardent-10','classes/divine-mind-11','classes/war-mind-916']){
 assert.equal(check(make([row(id,5)]),ml(5)),'manual','unreviewed manifester-level rules: '+id);
 assert.equal(check(make([row(id,5)]),access(1)),'manual');
}
const unreviewed={...psion(5),catalogId:'dndtools:classes/unreviewed-psion',definition:{...psion(5).definition,id:'dndtools:classes/unreviewed-psion',sourceId:'classes/unreviewed-psion',catalogId:'dndtools:classes/unreviewed-psion'}};
assert.equal(check(make([unreviewed]),ml(5)),'manual','same-name records cannot borrow an exact source review');
const incomplete={...unreviewed,definition:{...unreviewed.definition,tables:[],progression:[],advancement:[]}};
assert.equal(check(make([incomplete]),ml(5)),'manual','a missing table is not proof that an unreviewed Psion cannot manifest');
assert.equal(check(make([incomplete]),access(1)),'manual');
for(const id of ['classes/epic-psion-55','classes/epic-psychic-warrior-56']){
 assert.equal(check(make([row(id,5)]),ml(5)),'manual','inherited manifesting requires source review');
 assert.equal(check(make([row(id,5)]),access(1)),'manual');
}
for(const bad of [{...psion(5),name:'Wilder'},{...psion(5),catalogId:'bad'},{...psion(5),edition:'2014'}])assert.equal(check(make([fighter,bad]),ml(5)),'manual');
assert.equal(check({...p5,ruleset:'2014'},ml(5)),'manual');
assert.equal(check({...p5,ruleset:'custom',mechanics:'2014'},ml(5)),'met');
for(const text of ['Manifester level 5th and able to manifest mindlink.','Ability to manifest a 3rd-level psychic warrior power.','Ability to manifest two 3rd-level powers.','Ability to manifest a 7th-level power, knowledge of 4th-level or higher powers from at least 3 psionic disciplines.'])assert.equal(check(p5,{kind:'manifesting',text}),'manual');
const cereb=exact('classes/cerebremancer-908'),wizard=row('classes/wizard-99',3),before=make([psion(4),wizard,row(cereb.sourceId,1)]);
const plan=castingAdvancementPlan(before,cereb,1),picks=Object.fromEntries(plan.groups.map(g=>[g.id,g.kind==='psionic'?psion(4).catalogId:wizard.catalogId]));
const advanced=reconcileClassGrants(applyCastingAdvancementSelections({...before,spells:[power(3)]},plan,picks));
assert.equal(check(advanced,ml(5)),'met');assert.equal(check(advanced,access(3)),'met');
assert.equal(check(JSON.parse(JSON.stringify(advanced)),access(3)),'met');
assert.equal(check(removeClassProgression(advanced,cereb.catalogId),access(3)),'unmet');
assert.equal(check({...advanced,castingAdvancements:[...advanced.castingAdvancements,...advanced.castingAdvancements]},ml(6)),'manual');
assert.equal(check({...p5,castingAdvancements:[{kind:'psionic',targetClassId:psion(5).catalogId,amount:10}]},ml(10)),'manual');
const thresholds=[['classes/crystal-master-1046',5],['classes/meditant-1049',5],['classes/metamind-912',4],['classes/psychic-assassin-1051',5],['classes/sangehirn-1052',5]];
for(const [id,n] of thresholds){const clause=exact(id).prerequisites.find(p=>/^Manifester level/.test(p.text));assert.equal(check(make([psion(n)]),clause),'met',id);assert.equal(check(make([psion(n-1)]),clause),'unmet',id);}
const powerTargets=['classes/ballisteer-993','classes/cerebral-assassin-994','classes/cerebremancer-908','classes/crystal-master-996','classes/crystalsinger-997','classes/defender-of-sardior-1041','classes/devotee-of-sardior-1040','classes/diamond-dragon-371','classes/elocater-909','classes/grim-psion-1023','classes/iron-mind-733','classes/kineticist-1024','classes/percipient-1042','classes/planar-vanguard-1043','classes/psion-uncarnate-913','classes/psionic-dragon-comrade-1047','classes/psychic-theurge-990','classes/psychic-weapon-master-1034','classes/sangehirn-1036','classes/shadow-mind-1037','classes/soul-manifester-1055'];
for(const id of powerTargets){const clause=exact(id).prerequisites.find(p=>/^(?:Ability to|Able to) manifest (?:(?:a|one|any|at least one) )?\d/.test(p.text));assert(clause,id);assert.equal(check({...make([psion(9)]),spells:[1,2,3,4,5].map(n=>power(n))},clause),'met',id);assert.equal(check(make([fighter]),clause),'unmet',id);}
console.log('PASS manifesting entry: five manifester-level and 21 power-level source clauses, known powers, class ownership, abilities, reserve and prestige lifecycle');
