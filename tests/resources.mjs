import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classResourceDefinitions,characterResources,adjustResource,restResources} from '../src/lib/resources.js';
const make=(edition,rows,extra={})=>({ruleset:edition,abilities:{cha:16},classLevels:rows.map(([name,level])=>({name,level,edition,definition:{name,edition}})),...extra});
const pool=(c,name)=>characterResources(c).find(r=>r.name===name);
const spendAll=c=>({...c,resources:characterResources(c).map(r=>({...r,used:r.max}))});
const legacy=JSON.parse(readFileSync('src/data/levels.json'));
const revised=JSON.parse(readFileSync('src/data/srd2024.json')).levels;
for(const edition of ['2014','2024']) {
 const data=edition==='2014'?legacy:revised;
 for(let level=1;level<=20;level++)for(const cls of ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Sorcerer']) {
  const c=make(edition,[[cls,level]]),rows=classResourceDefinitions(c),table=data.find(r=>r.class?.name===cls&&r.level===level&&!r.subclass)?.class_specific||{};
  for(const [name,key] of [['Rage','rage_count'],['Action Surge','action_surges'],['Indomitable','indomitable_uses'],['Second Wind','second_wind_uses'],['Wild Shape','wild_shape_uses'],['Ki Points','ki_points'],['Focus Points','focus_points'],['Sorcery Points','sorcery_points'],[edition==='2014'?'Channel Divinity':`Channel Divinity (${cls})`,'channel_divinity_charges']]) {
   if(table[key]!=null&&table[key]!==9999)assert.equal(rows.find(r=>r.name===name)?.max||0,table[key],`${edition} ${cls} ${level} ${name}`);
  }
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 }
 const c=make(edition,[['Fighter',4],['Monk',2],['Sorcerer',5],['Bard',1]]),spent=spendAll(c);
 const after={...spent,...restResources(spent,'short')};
 assert.equal(pool(after,'Second Wind').used,edition==='2014'?0:2);
 assert.equal(pool(after,'Action Surge').used,0);
 assert.equal(pool(after,edition==='2014'?'Ki Points':'Focus Points').used,edition==='2014'?2:0);
 assert.equal(pool(after,'Sorcery Points').used,5);
 assert.equal(pool(after,'Bardic Inspiration').used,3);
 assert.equal(pool({...spent,...restResources(spent,'short',{meditated:true})},edition==='2014'?'Ki Points':'Focus Points').used,0);
 const long={...spent,...restResources(spent,'long',{meditated:true})};assert(characterResources(long).every(r=>r.used===0));
 assert.equal(pool(make(edition,[['Paladin',3]]),'Lay on Hands').max,15);
 assert.equal(pool(make(edition,[['Bard',1]],{abilities:{cha:8}}),'Bardic Inspiration').max,1);
 const bard=spendAll(make(edition,[['Bard',4]]));bard.classLevels[0].level=5;
 assert.equal(pool(bard,'Bardic Inspiration').used,3);assert.equal(pool({...bard,...restResources(bard,'short')},'Bardic Inspiration').used,0);
}
const mixed14=make('2014',[['Cleric',6],['Paladin',3]]),mixed24=make('2024',[['Cleric',6],['Paladin',3]]);
assert.equal(characterResources(mixed14).filter(r=>r.name.includes('Channel Divinity')).length,1);
assert.equal(pool(mixed14,'Channel Divinity').max,2);
assert.equal(characterResources(mixed24).filter(r=>r.name.includes('Channel Divinity')).length,2);
for(const cls of ['Barbarian','Druid']) {
 assert.equal(classResourceDefinitions(make('2014',[[cls,20]]))[0].unlimited,true);
 assert.equal(classResourceDefinitions(make('2024',[[cls,20]]))[0].unlimited,false);
}
const sorc=spendAll(make('2024',[['Sorcerer',5]]));
const recovered={...sorc,...restResources(sorc,'short',{restoreSorcery:true})};
assert.equal(pool(recovered,'Sorcery Points').used,3);assert.equal(recovered.sorcerousRestorationUsed,true);
assert.equal(pool({...recovered,...restResources(recovered,'short',{restoreSorcery:true})},'Sorcery Points').used,3);
assert.equal(restResources(recovered,'long').sorcerousRestorationUsed,false);
assert.equal(pool({...sorc,...restResources({...sorc,resources:characterResources(sorc).map(r=>({...r,used:0}))},'short',{restoreSorcery:true})},'Sorcery Points').used,0);
assert.equal(restResources(make('2024',[['Sorcerer',5]]),'short',{restoreSorcery:true}).sorcerousRestorationUsed,undefined);
const cap=spendAll(make('2014',[['Sorcerer',20]]));assert.equal(restResources(cap,'short').resources[0].used,16);
const old=make('2024',[['Fighter',4]],{resources:[{id:'custom',name:'SECOND WIND',max:7,used:5,reset:'short',note:'Do not lose'}]});
assert.equal(characterResources(old).filter(r=>r.name.toLowerCase()==='second wind').length,1);
assert.equal(pool(old,'SECOND WIND').max,7);assert.equal(pool(old,'SECOND WIND').note,'Do not lose');
const adopted={...old,resources:[{...classResourceDefinitions(old)[0],id:'custom',used:2}]};
adopted.classLevels[0].level=10;assert.equal(pool(adopted,'Second Wind').max,4);assert.equal(pool(adopted,'Second Wind').used,2);
const custom={...adopted,resources:adopted.resources.map(r=>({...r,manual:true,max:9}))};assert.equal(pool(custom,'Second Wind').max,9);
assert.equal(adjustResource(adopted,'custom',2).resources[0].used,4);assert.throws(()=>adjustResource(adopted,'custom',3),/Not enough/);assert.throws(()=>adjustResource(adopted,'custom',0.5),/whole/);
assert.equal(adjustResource(adopted,'custom',-20).resources[0].used,0);
const lowered={...adopted,resources:adopted.resources.map(r=>({...r,used:5}))};assert.equal(pool(lowered,'Second Wind').used,5,'lowering capacity must not refund spent uses');
const hidden={...make('2024',[['Fighter',1]]),hiddenClassResources:['2024:Fighter:second-wind']};assert.deepEqual(characterResources(hidden),[]);
for(const ruleset of ['custom','3.5'])assert.deepEqual(classResourceDefinitions({...old,ruleset}),[]);
assert.deepEqual(classResourceDefinitions(make('2024',[['Fighter',4],['Monk',2]]).classLevels.reduce((c,r)=>({...c,classLevels:[...c.classLevels,{...r,edition:'2014'}]}),{ruleset:'2024',classLevels:[]})),[]);
assert.deepEqual(classResourceDefinitions(make('2024',[['Fighter',4]],{classLevels:[{name:'Fighter',level:4,edition:'2024',definition:{source:'Homebrew'}}]})),[]);
assert.deepEqual(classResourceDefinitions(make('2024',[['Artificer',4]])),[]);
const manual=make('2024',[['Wizard',1]],{resources:[{id:'a',name:'Item',max:5,used:3,reset:'none'},{id:'b',name:'Custom',max:5,used:3,reset:'long'}]});
assert.deepEqual(restResources(manual,'short').resources.map(r=>r.used),[3,3]);assert.deepEqual(restResources(manual,'long').resources.map(r=>r.used),[3,0]);
assert.deepEqual(characterResources(JSON.parse(JSON.stringify(adopted))),characterResources(adopted));
console.log('PASS all 20 core progression levels, shared/separate Channel Divinity, partial/full/conditional recovery, preserved custom and spent counters, overrides and unsupported rules');
