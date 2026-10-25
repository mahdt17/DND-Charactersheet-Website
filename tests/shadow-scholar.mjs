import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
let server,api,backgrounds,languages,training,resources;
before(async()=>{server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});backgrounds=(await server.ssrLoadModule('/src/CharacterManager.jsx')).BACKGROUND_DATA;if(existsSync('src/lib/shadowScholar.js'))api=await server.ssrLoadModule('/src/lib/shadowScholar.js');languages=await server.ssrLoadModule('/src/lib/languages.js');training=await server.ssrLoadModule('/src/lib/training.js');resources=await server.ssrLoadModule('/src/lib/resources.js');});
after(async()=>server?.close());
const make=()=>({name:'Shadow researcher',ruleset:'2014',race:'Elf',className:'Fighter',background:'Shadow Scholar',level:1,hp:{current:10,max:10},inventory:[],currency:{gp:0},notes:'',traits:[],skillProf:{Perception:true},toolProf:'',spells:[],resources:[]});
test('the supplied custom background is in the shared creation catalog',()=>{const bg=backgrounds['Shadow Scholar'];assert(bg,'Shadow Scholar must be selectable');assert.equal(bg.skills,'Stealth, Arcana');assert.match(bg.proficiencies,/Thieves' Tools/);assert.equal(bg.feature[0],'Researcher');assert.match(bg.blurb,/knowledge|magic/i);});
test('completion grants the requested skills, actual tools training and source-owned Researcher without changing classes',()=>{
 assert(api);const c=api.finishShadowScholar(make());assert(c.skillProf.Stealth&&c.skillProf.Arcana&&c.skillProf.Perception);assert.match(c.toolProf,/Thieves' Tools/);assert(training.recordedTraining(c).some(p=>p.index==='thieves-tools'&&p.kind==='tools'));assert.equal(c.backgroundDefinition.catalogId,'2014:shadow-scholar');assert.equal(c.className,'Fighter');assert.equal(c.subclass,undefined);assert.equal(c.feats,undefined);
 const researcher=c.traits.find(t=>t.name==='Researcher');assert(researcher);assert.match(researcher.description,/where|person|place/i);assert.match(researcher.source,/Sage.*2014/);assert.equal(api.reconcileShadowScholar(c).traits.filter(t=>t.name==='Researcher').length,1);
});
test('language defaults and alternate do not require exotic permission or replace racial choices',()=>{
 assert(api);for(const [selected,expected] of [[undefined,'Draconic'],['Undercommon','Undercommon'],['invalid','Draconic']]){
  const c={...make(),shadarKai:undefined,shadowScholar:{language:selected}},plan=languages.languagePlan(c);assert(plan.automatic.some(x=>x.name===expected&&x.source==='Shadow Scholar'));assert(plan.automatic.some(x=>x.name==='Elvish'));assert.equal(plan.groups.filter(x=>x.id==='background').length,0);assert.equal(plan.manual,false);
 }
 const c={...make(),race:'Human'},plan=languages.languagePlan(c);assert(plan.groups.some(g=>g.id==='race'&&g.count===1));assert(languages.chosenLanguages(plan,{race:['Elvish']}).complete);assert.equal(languages.chosenLanguages({...plan,groups:[{id:'race',count:1,options:['Draconic','Elvish']}]},{race:['Draconic']}).complete,false);
 assert(!languages.languagePlan({...c,background:'Sage'}).automatic.some(x=>x.source==='Shadow Scholar'));
});
test('starting gear includes six items and exactly ten background gold, with a usable story letter',()=>{
 assert(api);const gear=api.shadowScholarEquipment(make()),items=gear.filter(i=>!i.money);assert.equal(items.length,6);assert.deepEqual(items.map(i=>i.name),['Bottle of black ink','Quill','Small knife','Mysterious letter','Dark common traveling clothes','Pouch']);assert(items.every(i=>i.qty===1));assert.equal(gear.filter(i=>i.money).reduce((n,i)=>n+i.qty,0),10);assert.match(items.find(i=>i.name==='Mysterious letter').description,/mentor|colleague/i);assert.match(items.find(i=>i.name==='Mysterious letter').description,/question|research/i);assert(!items.some(i=>/thieves.*tools/i.test(i.name)),'proficiency does not give an unrequested tools kit');
});
test('normalization, save/reopen and rests never award gear/gold again or overwrite edited notes',()=>{
 assert(api);const custom={id:'custom-researcher',name:'Researcher',homebrew:true,description:'Personal ruling'};let c=api.finishShadowScholar({...make(),currency:{gp:17},inventory:[{id:'class-gear',name:'Longbow',qty:1}],traits:[custom]});assert.match(c.notes,/Personality Trait/);assert.match(c.notes,/Knowledge/);assert.match(c.notes,/mentor/i);assert.match(c.notes,/curiosity/i);
 c={...c,notes:'My edited story'};for(let n=0;n<3;n++)c=api.reconcileShadowScholar(JSON.parse(JSON.stringify({...c,...resources.restResources(c,'long')})));assert.deepEqual(c.inventory,[{id:'class-gear',name:'Longbow',qty:1}]);assert.equal(c.currency.gp,17);assert.equal(c.notes,'My edited story');assert(c.traits.some(t=>t.id===custom.id));assert.equal(c.traits.filter(t=>t.backgroundGrantId==='2014:shadow-scholar').length,1);
});
test('only this 2014 background grants its benefits; unrelated backgrounds and editions stay unchanged',()=>{
 assert(api);for(const change of [{background:'Sage'},{ruleset:'2024'},{ruleset:'3.5'},{ruleset:'custom',mechanics:'2024'},{backgroundDefinition:{catalogId:'other:shadow-scholar',edition:'2014'}}]){const c={...make(),...change};assert.equal(api.isShadowScholar(c),false);assert.deepEqual(api.shadowScholarTraining(c),[]);assert.deepEqual(api.shadowScholarEquipment(c),[]);assert.equal(api.finishShadowScholar(c),c);}
 assert(api.isShadowScholar({...make(),ruleset:'custom',mechanics:'2014'}));
});
test('manual/homebrew/reference races keep the explicit background language alongside recorded racial languages',()=>{
 assert(api);for(const definition of [{category:'race',edition:'2014'},{referenceOnly:true,edition:'2014'},{edition:'3.5'}])for(const language of ['Draconic','Undercommon']){
  const c={...make(),ruleset:'custom',mechanics:'2014',race:'Manual race',raceDefinition:definition,shadowScholar:{language},languages:'Common, Elvish'},plan=languages.languagePlan(c);
  assert.equal(plan.manual,true);assert(plan.automatic.some(x=>x.name===language&&x.source==='Shadow Scholar'),'the explicit background language must survive a manual race');
  const complete=api.finishShadowScholar(c);assert.equal(complete.languages,`Common, Elvish, ${language}`);assert.equal(api.finishShadowScholar(complete).languages,complete.languages);
 }
});
