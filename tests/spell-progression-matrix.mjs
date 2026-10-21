import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {entomancerClass} from '../src/data/entomancer.js';

// Independent SRD 5.1 / 5.2.1 spell-slot and multiclass tables, levels 1–20.
// https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf
// https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf
const full=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const fullNames=['Bard','Cleric','Druid','Sorcerer','Wizard'];
const baseNames=[...fullNames,'Paladin','Ranger','Warlock','Barbarian','Fighter','Monk','Rogue'];
const pad=slots=>[0,...Array.from({length:9},(_,i)=>slots?.[i]||0)];
const pact=level=>{const a=Array(10).fill(0);a[Math.min(5,Math.ceil(level/2))]=level===1?1:level<11?2:level<17?3:4;return a;};
const expected=(name,level,edition,subclass='')=>fullNames.includes(name)?pad(full[level]):name==='Warlock'?pact(level):['Artificer','Entomancer','Paladin','Ranger'].includes(name)?pad(full[level===1&&name!=='Artificer'&&edition==='2014'?0:Math.ceil(level/2)]):subclass?pad(full[level<3?0:Math.ceil(level/3)]):pad([]);
let server,e,adv,rest,definitions;
before(async()=>{
 server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
 e=await server.ssrLoadModule('/src/lib/editions.js');adv=await server.ssrLoadModule('/src/lib/advancement.js');
 rest=(await server.ssrLoadModule('/src/lib/multiclassCasting.js')).restSpellSlots;
 const normalize=(await server.ssrLoadModule('/src/lib/catalog.js')).normalizeCatalogRecord;
 definitions={2014:JSON.parse(readFileSync('src/data/classes.json','utf8')).map(c=>({...c,edition:'2014'})),2024:e.modern.classes.map(c=>({...c,edition:'2024'}))};
 const artificer=JSON.parse(readFileSync('public/catalogs/wikidot5e/classes.json','utf8')).find(c=>c.name==='Artificer');
 definitions[2014].push(normalize(artificer,'wikidot5e','classes'),entomancerClass);
});
after(async()=>{await server?.close();});
const make=(name,level,edition,subclass='')=>({name:'Progression matrix',className:name,level,ruleset:edition,mechanics:edition,classDefinition:definitions[edition].find(c=>c.name===name),subclass,abilities:{str:16,dex:16,con:16,int:16,wis:16,cha:16},abilityBonuses:{},spells:[],slotsUsed:{}});
const custom=c=>({...c,ruleset:'custom',unrestrictedSpellAccess:true});
const profiles=edition=>[...baseNames.map(name=>({name,subclass:''})),{name:'Fighter',subclass:'Eldritch Knight'},{name:'Rogue',subclass:'Arcane Trickster'},...(edition==='2014'?[{name:'Artificer',subclass:''},{name:'Entomancer',subclass:''}]:[])];

test('all 2014 and revised class/subclass slot tables match every level',()=>{
 let checked=0;
 for(const edition of ['2014','2024'])for(const {name,subclass} of profiles(edition))for(let level=1;level<=20;level++){
  const c=make(name,level,edition,subclass),want=expected(name,level,edition,subclass);
  assert.deepEqual(e.characterSlots(c),want,`${edition} ${name} ${subclass} ${level}`);
  assert.deepEqual(e.characterSlots(custom(c)),want,`Custom ${edition} ${name} ${subclass} ${level}`);
  checked++;
 }
 console.log(`Verified ${checked} class/subclass level rows in normal and Custom modes.`);
});

test('Custom characters obey source spell counts, level gates and editions for every class level',()=>{
 for(const edition of ['2014','2024'])for(const {name,subclass} of profiles(edition))for(let level=1;level<=20;level++){
  const c=make(name,level,edition,subclass),mixed=custom(c),slots=expected(name,level,edition,subclass),max=slots.reduce((m,n,i)=>n?i:m,0);
  assert.deepEqual(e.spellCounts(mixed,16),e.spellCounts(c,16),`${edition} ${name} ${subclass} ${level}: spell counts`);
  const illegal={name:'Too high',edition,classes:[subclass?'Wizard':name],school:'Evocation',level:Math.min(9,max+1)};
  if(max<9)assert(!e.spellAccess(mixed,illegal).allowed,`${edition} ${name} ${subclass} ${level}: over-level spell`);
  assert(!e.spellAccess(mixed,{...illegal,edition:edition==='2014'?'2024':'2014',level:0}).allowed,'a saved unrestricted flag cannot cross editions');
 }
});

test('stored manual totals cannot replace verified class slot progressions',()=>{
 for(const edition of ['2014','2024'])for(const {name,subclass} of profiles(edition))for(let level=1;level<=20;level++){
  const c=custom(make(name,level,edition,subclass));
  assert.deepEqual(e.characterSlots({...c,slotOverride:Array(10).fill(30)}),expected(name,level,edition,subclass),`${edition} ${name} ${subclass} ${level}`);
 }
});

test('all legal two-class level combinations calculate exact shared and Pact Magic pools in Custom too',()=>{
 let checked=0;
 for(const edition of ['2014','2024']){
  const types=profiles(edition);
  for(let i=0;i<types.length;i++)for(let j=i+1;j<types.length;j++){
   if(types[i].name===types[j].name)continue;
   for(let l=1;l<=19;l++)for(let r=1;r<=20-l;r++){
    const parts=[make(types[i].name,l,edition,types[i].subclass),make(types[j].name,r,edition,types[j].subclass)];
    const rows=parts.map(c=>({catalogId:adv.contentKey(c.classDefinition),name:c.className,definition:c.classDefinition,edition,level:c.level,subclass:c.subclass}));
    const c={...parts[0],classLevels:rows,level:l+r};
    const active=parts.filter(p=>p.className!=='Warlock'&&expected(p.className,p.level,edition,p.subclass).some(Boolean));
    const casterLevel=active.reduce((n,p)=>n+(fullNames.includes(p.className)?p.level:p.subclass?Math.floor(p.level/3):edition==='2024'||p.className==='Artificer'?Math.ceil(p.level/2):Math.floor(p.level/2)),0);
    const standard=active.length===1?expected(active[0].className,active[0].level,edition,active[0].subclass):pad(full[casterLevel]);
    const warlock=parts.find(p=>p.className==='Warlock'),wantPact=warlock?pact(warlock.level):pad([]);
    for(const model of [c,custom(c)]){
     const pools=e.spellSlotPools(model),label=`${edition} ${parts.map(p=>p.className+' '+p.subclass+' '+p.level).join(' / ')} ${model.ruleset}`;
     assert.equal(pools.mode,'automatic',label);
     assert.deepEqual(pools.standard,standard,label+' shared');assert.deepEqual(pools.pact,wantPact,label+' pact');
    }
    checked++;
   }
  }
 }
 console.log(`Verified ${checked} two-class combinations in normal and Custom modes.`);
});

test('Custom Warlocks recover Pact Magic on short rests without clearing ordinary multiclass slots',()=>{
 for(const edition of ['2014','2024'])for(let level=1;level<=20;level++){
  const c=custom({...make('Warlock',level,edition),slotsUsed:{[Math.min(5,Math.ceil(level/2))]:1}});
  assert.deepEqual(rest(c,'short').slotsUsed,{},`${edition} Warlock ${level}`);
 }
 const wizard=make('Wizard',3,'2014'),warlock=make('Warlock',3,'2014');
 const c=custom({...wizard,level:6,slotsUsed:{1:1},pactSlotsUsed:{2:1},classLevels:[wizard,warlock].map(p=>({name:p.className,definition:p.classDefinition,catalogId:adv.contentKey(p.classDefinition),edition:'2014',level:3}))});
 assert.deepEqual(rest(c,'short').slotsUsed,{1:1});assert.deepEqual(rest(c,'short').pactSlotsUsed,{});
});

test('homebrew names cannot inherit standard multiclass tables, including campaign combinations',()=>{
 const wizard=make('Wizard',3,'2014'),cleric=make('Cleric',3,'2014');
 const homebrew={...wizard,classDefinition:{...wizard.classDefinition,catalogId:'homebrew:wizard',homebrew:true,source:'Dandwiki homebrew'}};
 for(const companion of [cleric,{...cleric,className:'Archivist',classDefinition:{name:'Archivist',edition:'2014',catalogId:'homebrew:darkdonte:archivist'}}]){
  const c=custom({...homebrew,level:6,classLevels:[homebrew,companion].map(p=>({name:p.className,definition:p.classDefinition,catalogId:adv.contentKey(p.classDefinition),edition:'2014',level:3}))});
  assert.equal(e.spellSlotPools(c).mode,'manual');
 }
});
