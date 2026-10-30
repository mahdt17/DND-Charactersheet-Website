import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const rules=await server.ssrLoadModule('/src/lib/rules.js'),play=await server.ssrLoadModule('/src/lib/play.js'),song=await server.ssrLoadModule('/src/lib/bladesinging.js'),res=await server.ssrLoadModule('/src/lib/resources.js'),styles=await server.ssrLoadModule('/src/lib/fightingStyles.js'),integration=await server.ssrLoadModule('/src/lib/classIntegration.js');
const numeric=existsSync('src/lib/subclassNumerics.js')?await server.ssrLoadModule('/src/lib/subclassNumerics.js'):{};
const actor=existsSync('src/lib/subclassState.js')?await server.ssrLoadModule('/src/lib/subclassState.js'):{};
const advancement=await server.ssrLoadModule('/src/lib/advancement.js');
const effect=await server.ssrLoadModule('/src/lib/spellEffects.js'),expanded=await server.ssrLoadModule('/src/lib/expandedSubclasses.js');
await server.close();
const abilities={str:12,dex:16,con:16,int:18,wis:14,cha:16};
const make=(className='Wizard',subclass='Bladesinging',level=2)=>({ruleset:'2014',className,subclass,level,classDefinition:{name:className,index:className.toLowerCase(),edition:'2014'},abilities,hp:{current:20,max:20},speed:30,autoArmor:true,ac:13,inventory:[],resources:[],activeEffects:[],spells:[],actions:[]});
const started=c=>({...c,...song.startBladesong(c)}),gear=index=>({id:index,name:index,equipmentIndex:index,equipped:true});
test('actual armor and movement include dynamic song, Mage Armor and Shield; manual AC remains a base',()=>{
 const c={...started(make()),activeEffects:[...started(make()).activeEffects,{id:'mage',baseAC:{base:13,ability:'dex'}},{id:'shield',acBonus:5}]};
 assert.equal(rules.armorFor(c,abilities),25);assert.equal(play.conditionEffects(c).speed,40);
 assert.equal(rules.sheetArmorFor({...c,autoArmor:false,ac:16},abilities),25);
 assert.equal(rules.armorFor({...c,abilities:{...abilities,int:20}},{...abilities,int:20}),26);
});
test('global resource and lifecycle reconciliation preserve max spent count and permanently end forbidden song',()=>{
 let c=started(make());c.resources.push({id:'old',classResourceKey:song.bladesongId,used:2});
 const resources=res.characterResources(c);assert.equal(resources.filter(r=>r.id===song.bladesongId||r.classResourceKey===song.bladesongId).length,1);assert.equal(resources.find(r=>r.id===song.bladesongId).used,2);
 c=integration.reconcileClassGrants({...c,inventory:[gear('shield')]});assert(!song.bladesongProfile({...c,inventory:[]}).singing);
 assert.equal(res.restResources({...c,resources},'long').resources.find(r=>r.id===song.bladesongId).used,0);
});
test('Song of Victory uses actual melee mode and ends before a two-handed damage calculation',()=>{
 const c={...started(make('Wizard','Bladesinging',14)),inventory:[gear('longsword'),gear('dagger'),gear('longbow')],fightingStyles:{attackModes:{longsword:{grip:'one'},dagger:{mode:'thrown'}}}};
 const attacks=rules.weaponAttacks(c,abilities);assert.equal(attacks[0].damage,'1d8+5');assert.equal(attacks[1].damage,'1d4+3');assert.equal(attacks[2].damage,'1d8+3');
 const two={...c,fightingStyles:{attackModes:{longsword:{grip:'two'}}}};assert.equal(rules.weaponAttacks(two,abilities)[0].damage,'1d10+1');assert.equal(rules.weaponAttacks(two,abilities)[0].hands,2);
});
test('passive profile derives own class HP, maximum alternative AC and safe conditions without baking base HP',()=>{
 assert.equal(typeof numeric.subclassNumericProfile,'function');
 const c=make('Sorcerer','Draconic Bloodline',4);assert.equal(play.conditionEffects(c).maxHP,24);assert.equal(rules.armorFor(c,abilities),16);assert.equal(c.hp.max,20);
 assert.equal(play.conditionEffects({...c,classLevels:[{name:'Sorcerer',edition:'2014',level:1,subclass:'Draconic Bloodline'},{name:'Fighter',edition:'2014',level:10}]}).maxHP,21);
 assert.equal(rules.armorFor({...c,inventory:[gear('chain-mail')]},abilities),16);
 assert.equal(play.conditionEffects({...c,ruleset:'2024'}).maxHP,20);assert.equal(play.conditionEffects({...c,ruleset:'3.5'}).maxHP,20);
 assert.equal(numeric.subclassNumericProfile(make('Wizard','War Magic',10)).saveBonus,0);
 const war={...make('Wizard','War Magic',10),concentration:'Detect Magic'};assert.equal(numeric.subclassNumericProfile(war).saveBonus,2);assert.equal(rules.armorFor(war,abilities),15);
});
test('initiative replaces Lore Mastery Dex, adds source bonuses, and Scout movement is class gated',()=>{
 assert.equal(typeof numeric.subclassNumericProfile,'function');
 assert.equal(numeric.subclassNumericProfile(make('Wizard','Lore Mastery (UA)',2)).initiativeBonus,1);
 assert.equal(numeric.subclassNumericProfile(make('Ranger','Gloom Stalker',3)).initiativeBonus,2);
 assert.equal(play.conditionEffects(make('Ranger','Gloom Stalker',3)).speed,30);
 assert.equal(play.conditionEffects(make('Rogue','Scout',9)).speed,40);
 assert.equal(numeric.subclassNumericProfile(make('Rogue','Scout',13)).initiativeAdvantage,true);
});
test('Swords owns its chosen combat style without Fighter actions; Brute additional style is exact and class gated',()=>{
 const bard={...make('Bard','Swords',3),expandedSubclassChoices:{'2014:bard':{'2014:subclass:bard:swords':{'fighting-style':['Dueling']}}},inventory:[gear('longsword')],fightingStyles:{attackModes:{longsword:{grip:'one',soleWeapon:true}}}};
 assert.equal(rules.weaponAttacks(bard,abilities)[0].damage,'1d8+3');assert.match(styles.secondWindBlock(bard),/Fighter/);assert.throws(()=>styles.useSecondWind(bard,{total:5},{maxHP:20}),/Fighter/);assert.equal(styles.styleResources(bard).length,0);assert.equal(styles.styleChoicePlan(bard).groups.length,0);
 const brute={...make('Fighter','Brute (UA)',10),fightingStyles:{choices:[{id:'archery'},{id:'defense'}]}};assert.equal(styles.fightingStyleProfile(brute).max,2);assert.equal(styles.fightingStyleProfile({...brute,level:9}).max,1);
 const multi={...bard,level:4,classLevels:[{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:1},{catalogId:'2014:bard',name:'Bard',edition:'2014',level:3,subclass:'Swords'}],fightingStyles:{...bard.fightingStyles,choices:[{id:'dueling'}]}};assert.equal(styles.fightingStyleProfile(multi).styles.filter(s=>s.id==='dueling').length,1);
});
test('zero HP exemptions require exact eligible active source, and cannot bypass explicit incapacity or death',()=>{
 assert.equal(typeof actor.actorActionBlock,'function');
 const c={...make('Barbarian','Zealot',14),hp:{current:0,max:20}};assert(actor.actorActionBlock(c));
 const state={id:'zealot',subclassRecordId:'2014:subclass:barbarian:zealot',sourceClassId:'2014:barbarian',sourceFeatureId:'2014:subclass:barbarian:zealot:rage-beyond-death',stateKey:'rage-beyond-death',remainingSeconds:60};
 const active={...c,activeEffects:[state]};assert.equal(actor.actorActionBlock(active),'');assert(actor.actorActionBlock({...active,conditions:['Unconscious']}));assert.equal(actor.actorActionBlock({...active,deathSaves:{failure:3}}),'');assert(actor.actorActionBlock({...active,conditions:['Dead']}));assert(actor.actorActionBlock({...active,level:13}));assert.equal(actor.actorActionBlock({...active,activeEffects:[],hp:{current:5,max:20},deathSaves:{failure:3}}),'','Ending Rage after healing does not cause postponed death');
});

test('attack counts use max own-class progression, source critical ranges and no blanket conditional riders',()=>{
 assert.equal(numeric.subclassNumericProfile(make('Fighter','Champion',15)).criticalThreshold,18);
 assert.equal(numeric.subclassNumericProfile(make('Warlock','Hexblade',15)).criticalThreshold,20);
 const multi={...make('Wizard','Bladesinging',6),level:17,classLevels:[{name:'Wizard',edition:'2014',level:6,subclass:'Bladesinging'},{name:'Fighter',edition:'2014',level:11,subclass:'Champion'}]};assert.equal(numeric.subclassNumericProfile(multi).attacks,3);
 assert.equal(numeric.subclassNumericProfile({...multi,ruleset:'2024'}).attacks,1);
});
test('explicit numerical states expire and clean up by exact source without deleting concentration',()=>{
 let c=make('Sorcerer','Stone Sorcery (UA)',1);assert.equal(rules.armorFor(c,abilities),13);
 c={...c,...numeric.setSubclassNumericToggle(c,'stone-skin',true),concentration:'Detect Magic'};assert.equal(rules.armorFor(c,abilities),16);assert.equal(rules.armorFor({...c,inventory:[gear('shield')]},abilities),18);
 c=integration.reconcileClassGrants({...c,conditions:['Stunned']});assert.equal(c.concentration,'Detect Magic');assert.equal(rules.armorFor({...c,conditions:[]},abilities),13);
 let ranger=make('Ranger','Gloom Stalker',3);ranger={...ranger,...numeric.setSubclassNumericToggle(ranger,'dread-ambusher-first-turn',true)};assert.equal(play.conditionEffects(ranger).speed,40);assert.equal(play.conditionEffects({...ranger,...effect.advanceEffectTime(ranger,{startTurn:true})}).speed,30);assert.equal(play.conditionEffects({...ranger,...effect.advanceEffectTime(ranger,{seconds:6})}).speed,30);
 assert(!numeric.subclassNumericProfile({...ranger,subclass:'Hunter'}).rows.some(r=>r.applied&&r.kind==='speed-bonus'));
});
test('song expiry, manual AC, duplicate counters, rest and subclass cleanup preserve independent owners',()=>{
 let c={...started(make()),concentration:'Detect Magic',resources:[{id:'renamed',classResourceKey:song.bladesongId,used:2},{id:'manual',name:'My reserve',max:3,used:1,manual:true}],activeEffects:[...started(make()).activeEffects,{id:'independent',name:'My effect'}]};
 assert.equal(res.characterResources(c).find(r=>r.id===song.bladesongId).used,2);
 const expired={...c,...effect.advanceEffectTime(c,{seconds:60})};assert(!song.bladesongProfile(expired).singing);assert.equal(expired.concentration,'Detect Magic');assert(expired.activeEffects.some(e=>e.id==='independent'));
 const rested={...c,...effect.restEffectPatch(c,'long'),...res.restResources(c,'long')};assert(!song.bladesongProfile(rested).singing);assert.equal(res.characterResources(rested).find(r=>r.id===song.bladesongId).used,0);
 const removed=integration.reconcileClassGrants({...c,subclass:'Evocation'});assert(!removed.activeEffects.some(e=>e.id===song.bladesongEffectId));assert(removed.resources.some(r=>r.id==='manual'&&r.used===1));
});
test('Samurai extra turn never postpones three failures; all exemptions reject explicit death and expired sources',()=>{
 const c={...make('Fighter','Samurai',18),hp:{current:0,max:30},activeEffects:[{id:'samurai',sourceClassId:'2014:fighter',subclassRecordId:'2014:subclass:fighter:samurai',sourceFeatureId:'2014:subclass:fighter:samurai:strength-before-death',stateKey:'strength-before-death',remainingSeconds:6}]};assert.equal(actor.actorActionBlock(c),'');assert(actor.actorActionBlock({...c,deathSaves:{failure:3}}));for(const patch of [{dead:true},{instantDeath:true},{exhaustion:6},{conditions:['Paralyzed']},{level:17},{activeEffects:c.activeEffects.map(e=>({...e,remainingSeconds:0}))}])assert(actor.actorActionBlock({...c,...patch}));
});
test('Swords selection excludes an independently owned Fighter style',()=>{
 const c={...make('Bard','Swords',3),level:4,classLevels:[{name:'Fighter',edition:'2014',level:1},{name:'Bard',edition:'2014',level:3,subclass:'Swords'}],fightingStyles:{choices:[{id:'dueling'}]}};
 const group=expanded.expandedSubclassChoicePlan(c).groups.find(g=>g.id.endsWith(':fighting-style'));assert(group);assert(!group.options.includes('Dueling'));assert(group.options.includes('Two-Weapon Fighting'));
});

test('measurable Forge heavy armor, Redemption UA AC, Samurai and Fey Wanderer checks apply source-correct bonuses',()=>{
 const forge={...make('Cleric','Forge',6),inventory:[gear('chain-mail')]};assert.equal(rules.armorFor(forge,abilities),17);assert.equal(rules.armorFor({...forge,inventory:[gear('leather-armor')]},abilities),14);
 const peace=make('Paladin','Redemption (UA)',3);assert.equal(rules.armorFor(peace,abilities),19);assert.equal(rules.armorFor({...peace,inventory:[gear('shield')]},abilities),15);
 assert.equal(numeric.subclassNumericProfile(make('Fighter','Samurai',7)).skillBonuses.Persuasion,2);
 assert.equal(numeric.subclassNumericProfile(make('Ranger','Fey Wanderer',3)).skillBonuses.Deception,2);
 const champion={...make('Fighter','Champion',7),skillProf:{Athletics:true}};const p=numeric.subclassNumericProfile(champion);assert.equal(p.skillBonuses.Acrobatics,2);assert.equal(p.skillBonuses.Athletics||0,0);assert.equal(p.initiativeBonus,2);
 const loreChampion={...champion,level:9,classLevels:[{name:'Fighter',edition:'2014',level:7,subclass:'Champion'},{name:'Wizard',edition:'2014',level:2,subclass:'Lore Mastery (UA)'}]};assert.equal(numeric.subclassNumericProfile(loreChampion).initiativeBonus,2,'Choose Dex plus eligible physical check bonus or Intelligence; never both');
});

test('all 214 profiles expose every unlocked passive with finite derived totals through levels 1-20',()=>{
 for(const record of expanded.availableSubclasses())for(let level=1;level<=20;level++){
  const c=make(record.className,record.name,level),p=numeric.subclassNumericProfile(c);
  for(const key of ['acBonus','hpBonus','speedBonus','initiativeBonus','saveBonus','concentrationBonus','meleeWeaponDamageBonus','attacks','criticalThreshold'])assert(Number.isFinite(p[key]),`${record.id} ${level} ${key}`);
  const expected=expanded.expandedSubclassRows(c).flatMap(owner=>(owner.mechanics?.passives||[]).filter(item=>expanded.expandedFeatureUnlocked(owner,item)));
  assert.equal(p.rows.length,expected.length,`${record.id} ${level} all source rows accounted for`);assert(p.rows.every(r=>['automated','reference','training','attack-context'].includes(r.status)&&r.sourceUrl&&r.subclassRecordId===record.id));
 }
});

test('inherently two-handed weapons always use both hands even with an invalid imported one-hand mode',()=>{
 const c={...started(make('Wizard','Bladesinging',14)),inventory:[gear('longbow'),gear('greatsword')],fightingStyles:{attackModes:{longbow:{grip:'one'},greatsword:{grip:'one'}}}};
 for(const a of rules.weaponAttacks(c,abilities)){assert.equal(a.hands,2);assert(!song.bladesongProfile({...c,...song.afterBladesingerAttack(c,a)}).singing);}
 assert.equal(rules.weaponAttacks({...c,fightingStyles:{}},abilities)[0].hands,2);
});

const sorcerer={...rules.classes.find(c=>c.name==='Sorcerer'),edition:'2014'};
const fighter={...rules.classes.find(c=>c.name==='Fighter'),edition:'2014'};
const draconic=current=>({...make('Sorcerer','Draconic Bloodline',4),classDefinition:sorcerer,hp:{current,max:20,temp:3}});
test('own-class advancement adds base gain and new subclass HP while retaining injury',()=>{
 for(const [current,want] of [[24,30],[17,23],[0,6]]){
  const before=draconic(current),after=advancement.advanceClass(before,sorcerer,{hpGain:5});
  assert.deepEqual(after.hp,{current:want,max:25,temp:3});assert.equal(play.conditionEffects(after).maxHP,30);assert.equal(before.hp.current,current);
 }
});
test('advancing another class retains earned Sorcerer HP and prior injury',()=>{
 for(const [current,want] of [[24,31],[17,24]]){
  const after=advancement.advanceClass(draconic(current),fighter,{hpGain:7});
  assert.deepEqual(after.hp,{current:want,max:27,temp:3});assert.equal(play.conditionEffects(after).maxHP,31);
 }
});
test('advancement does not add 2014 subclass HP to 2024 or 3.5 characters',()=>{
 for(const edition of ['2024','3.5']){
  const record={...sorcerer,edition},c={...draconic(17),ruleset:edition,classDefinition:record};
  const after=advancement.advanceClass(c,record,{hpGain:5});assert.deepEqual(after.hp,{current:22,max:25,temp:3});assert.equal(play.conditionEffects(after).maxHP,25);
 }
});
test('reloading source-owned HP retains base and injury without refilling or double-counting',()=>{
 let c=draconic(17);
 for(let i=0;i<3;i++){c=integration.reconcileClassGrants(advancement.normalizeAdvancement(JSON.parse(JSON.stringify(c))));assert.deepEqual(c.hp,{current:17,max:20,temp:3});assert.equal(play.conditionEffects(c).maxHP,24);}
});

test('all four unconditional HP sources advance by owner class level, including Custom and multiclass',()=>{
 for(const source of ['draconic-bloodline','favored-soul-revisited-ua','giant-soul-ua','stone-sorcery-ua']){
  const c={...draconic(24),subclass:`2014:subclass:sorcerer:${source}`,ruleset:'custom',mechanics:'2014'};
  const after=advancement.advanceClass(c,sorcerer,{hpGain:5});assert.equal(after.hp.max,25);assert.equal(after.hp.current,30);assert.equal(play.conditionEffects(after).maxHP,30);
 }
 const c={...draconic(31),level:5,hp:{current:31,max:27,temp:3},classLevels:[{catalogId:advancement.contentKey(sorcerer),name:'Sorcerer',edition:'2014',level:4,subclass:'Draconic Bloodline',definition:sorcerer},{catalogId:advancement.contentKey(fighter),name:'Fighter',edition:'2014',level:1,definition:fighter}]};
 const after=advancement.advanceClass(c,sorcerer,{hpGain:5});assert.deepEqual(after.hp,{current:37,max:32,temp:3});assert.equal(play.conditionEffects(after).maxHP,37);
 const homebrew={...draconic(20),classDefinition:{...sorcerer,homebrew:true}};
 assert.equal(advancement.advanceClass(homebrew,{...sorcerer,homebrew:true},{hpGain:5}).hp.current,25);
});
