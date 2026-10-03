import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {languagePlan,chosenLanguages}=await server.ssrLoadModule('/src/lib/languages.js');
 const {spellCounts,levelRecord,classes,modern}=await server.ssrLoadModule('/src/lib/editions.js');
 const {classOptions}=await server.ssrLoadModule('/src/GuidedSetup.jsx');
 const human={ruleset:'2014',race:'Human',className:'Sorcerer',subclass:'Draconic Bloodline',background:'Sage',level:1};
 let p=languagePlan(human);assert.deepEqual(p.automatic.map(x=>x.name),['Common','Draconic']);assert.equal(p.groups.reduce((n,g)=>n+g.count,0),3);assert(!p.groups[0].options.includes('Abyssal'));
 assert(languagePlan({...human,allowExoticLanguages:true}).groups[0].options.includes('Abyssal'));
 assert.equal(chosenLanguages(p,{race:['Common'],background:['Elvish','Elvish']}).complete,false);
 let picked=chosenLanguages(p,{race:['Dwarvish'],background:['Elvish','Giant']});assert.equal(picked.complete,true);assert.equal(picked.names.length,5);
 p=languagePlan({...human,race:'Elf',subrace:'High Elf',background:'Soldier'});assert.equal(p.groups[0].id,'subrace');assert.equal(chosenLanguages(p,{race:['Dwarvish'],background:['Elvish','Giant']}).complete,false);
 p=languagePlan({ruleset:'2024',race:'Dwarf',className:'Rogue'});assert.equal(p.groups[0].count,2);assert(p.groups[0].options.includes('Common Sign Language'));assert(!p.groups[0].options.includes('Infernal'));assert(p.groups[1].options.includes('Infernal'));assert(p.automatic.some(x=>x.name==="Thieves' Cant"));
 p=languagePlan({ruleset:'3.5',race:'Dwarf',className:'Cleric'},16);assert.equal(p.groups[0].count,3);assert(p.groups[0].options.includes('Celestial'));assert(!p.groups[0].options.includes('Druidic'));assert.equal(languagePlan({ruleset:'3.5',race:'Human',className:'Druid'},8).groups.length,0);assert(languagePlan({ruleset:'3.5',race:'Human',className:'Druid'},8).automatic.some(x=>x.name==='Druidic'));
 assert(languagePlan({...human,raceDefinition:{referenceOnly:true}}).manual);
 assert.equal(spellCounts(human).known,2);assert.equal(spellCounts({...human,level:2}).known,3);assert.equal(spellCounts({...human,ruleset:'2024'}).prepared,2);
 const canonicalFighter={id:'dndtools:classes/fighter-test',catalogId:'dndtools:classes/fighter-test',index:'classes/fighter-test',category:'class',name:'Fighter',edition:'3.5',hit_die:10,classSkills:['Climb','Craft'],description:'Canonical Fighter'};
 const fighterOptions=classOptions('3.5',[canonicalFighter]).filter(x=>x.name==='Fighter');
 assert.equal(fighterOptions[0].catalogId,canonicalFighter.catalogId,'canonical 3.5 class must be preferred over reduced legacy fallback');
 assert.deepEqual(fighterOptions[0].classSkills,['Climb','Craft']);
 assert(!fighterOptions.some(x=>x.catalogId!==canonicalFighter.catalogId),'redundant legacy fallback should be suppressed when canonical class exists');

 for(const edition of ['2014','2024'])for(const c of modern.classes)for(let level=1;level<=20;level++)assert.equal(levelRecord({ruleset:edition,className:c.name},level).level,level);
 console.log('PASS language grants, eligibility, canonical 3.5 class preference, duplicates, changed choices and complete class progression data');
}finally{await server.close();}
