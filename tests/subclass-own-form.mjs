import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const lifecycle=await server.ssrLoadModule('/src/lib/spellEffects.js');
const actor=await server.ssrLoadModule('/src/lib/subclassState.js');
const integration=await server.ssrLoadModule('/src/lib/classIntegration.js');
const casting=await server.ssrLoadModule('/src/lib/rage2014.js');
const actions=await server.ssrLoadModule('/src/lib/subclassActionUtils.js');
const quant=await server.ssrLoadModule('/src/lib/subclassQuantities.js');
const healing=await server.ssrLoadModule('/src/lib/subclassHealing.js');
const fighter=await server.ssrLoadModule('/src/lib/fightingStyles.js');
const aasimar=await server.ssrLoadModule('/src/lib/aasimar.js');
const race=await server.ssrLoadModule('/src/data/aasimar.js');
const tables=await server.ssrLoadModule('/src/lib/subclassTables.js');
const blade=await server.ssrLoadModule('/src/lib/bladesinging.js');
const lib=existsSync('src/lib/subclassOwnForm.js')?await server.ssrLoadModule('/src/lib/subclassOwnForm.js'):{};await server.close();
const make=(level=2)=>({ruleset:'2014',className:'Druid',subclass:'Moon',level,classDefinition:{name:'Druid',index:'druid',edition:'2014'},abilities:{str:10,dex:10,con:10,int:14,wis:16,cha:12},hp:{current:20,max:20,temp:0},resources:[],inventory:[],activeEffects:[],spells:[],actions:[]});const apply=(c,p)=>({...c,...p});
test('Moon form requires seen confirmation and spends canonical Wild Shape',()=>{
 assert.equal(typeof lib.activateMoonForm,'function');let c=make();assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{}),/seen/i);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(c.resources.find(r=>r.id==='2014:Druid:wild-shape').used,1);const p=lib.ownFormProfile(c);assert.equal(p.name,'Brown Bear');assert.equal(p.hp.current,34);assert.equal(p.hp.max,34);assert.equal(c.hp.current,20);assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}),/active/i);
});
test('elemental form costs both uses, and damage overflow reaches normal HP only once',()=>{
 assert.equal(typeof lib.damageOwnForm,'function');let c=make(10);c=apply(c,lib.activateMoonForm(c,'fire-elemental',{equipmentResolved:true}));assert.equal(c.resources.find(r=>r.id==='2014:Druid:wild-shape').used,2);const hp=lib.ownFormProfile(c).hp.current;c=apply(c,lib.damageOwnForm(c,hp+3));assert.equal(c.hp.current,17);assert.equal(lib.ownFormProfile(c),null);assert.throws(()=>lib.damageOwnForm(c,3),/active/i);
});
test('Moon requires equipment resolution and expiry removes the linked profile state',()=>{
 let c=make();assert.throws(()=>lib.activateMoonForm(c,'brown-bear',{seen:true}),/equipment/i);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lifecycle.advanceEffectTime(c,{seconds:3600}));assert.equal(lib.ownFormProfile(c),null);assert.deepEqual(c.profileState,{});
});
test('Moon projection retains mental scores and tags Primal Strike at Druid 6',()=>{
 let c=make(6);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));const p=lib.ownFormProfile(c);assert.equal(p.abilities.str,19);assert.equal(p.abilities.int,14);assert.equal(p.abilities.wis,16);assert.equal(p.abilities.cha,12);assert.equal(p.magicalAttacks,true);
});
test('Moon healing spends a spell slot without changing normal HP',()=>{
 assert.equal(typeof lib.healMoonForm,'function');let c=make(10);c.slotsUsed={};c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,lib.healMoonForm(c,{slotLevel:1,slotPool:'standard',result:{total:5}}));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);assert.equal(c.slotsUsed[1],1);
});
test('actor guard uses active form HP instead of the preserved normal body',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c.hp.current=0;assert.equal(actor.actorActionBlock(c),'');
});
test('Moon below Druid 18 cannot cast while transformed',()=>{
 let c=make(10);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.match(casting.featureCastingBlock(c,{name:'Cure Wounds',level:1,components:['V','S']}),/Wild Shape/i);
});
test('Beast Spells permits Druid verbal and somatic spells at 18; Archdruid can waive eligible materials at 20',()=>{
 let c=make(18);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(casting.featureCastingBlock(c,{name:'Cure Wounds',level:1,classes:['Druid'],components:['V','S']}),'');assert.match(casting.featureCastingBlock(c,{name:'Goodberry',level:1,classes:['Druid'],components:['V','S','M']}),/material/i);let d=make(20);d=apply(d,lib.activateMoonForm(d,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(casting.featureCastingBlock(d,{name:'Goodberry',level:1,classes:['Druid'],components:['V','S','M'],archdruidMaterialEligible:true}),'');
});
test('ordinary healing in Wild Shape heals form HP only',()=>{
 assert.equal(typeof lib.healOwnForm,'function');let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,lib.healOwnForm(c,5));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);
});
test('shared healing features heal the active form, preserving normal HP',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,actions.healHP(c,5,20));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);
});
test('self healing spell effects heal the form rather than normal HP',()=>{
 let c=make(18);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,lifecycle.castEffectPatch(c,{name:'Cure Wounds',level:1,heal_at_slot_level:{1:'1d8'}},{recipient:'self',rolls:[{label:'Healing',total:5}],slotLevel:1,maxHP:20}));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);
});
test('Moon form retains owner training and uses the better monster proficiency',()=>{
 let c=make(10);c.skillProf={Perception:true};c.saveProf={con:true};c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));const p=lib.ownFormProfile(c);assert.equal(p.skills.Perception,7);assert.equal(p.saves.con,7);
});
test('form AC composes with Mage Armor and additive magical defenses',()=>{
 assert.equal(typeof lib.ownFormArmor,'function');let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c.activeEffects.push({id:'mage',key:'mage armor',baseAC:{base:13,ability:'dex'},requiresUnarmored:true},{id:'shield',key:'shield',acBonus:5});assert.equal(lib.ownFormArmor(c),18);
});
test('shared body damage helper handles temporary HP, reversion and overflow once',()=>{
 assert.equal(typeof actor.damageActiveBody,'function');let c=make();c.hp.temp=3;c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,actor.damageActiveBody(c,40));assert.equal(lib.ownFormProfile(c),null);assert.equal(c.hp.current,17);assert.equal(c.hp.temp,0);
});
test('Arcane Ward sends remaining damage to the active form',()=>{
 let c=make(10);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:10,subclass:'Moon'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Abjuration'}];c.level=12;c=apply(c,quant.wardCastPatch(c,{school:'Abjuration'},1));c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));const r=quant.absorbWard(c,{amount:2,rawDamage:10});c=apply(c,r.patch);assert.equal(lib.ownFormProfile(c).hp.current,26);assert.equal(c.hp.current,20);
});
test('Bastion damage reaches the form and retains its own remaining dice',()=>{
 let c=make(10);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:10,subclass:'Moon'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass:'Clockwork Soul'}];c.level=16;c=apply(c,healing.useHealingFeature(c,'bastion-of-law',{n:2,recipient:'self',triggered:true,maxHP:20}));c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,healing.consumeBastion(c,{n:1,result:{total:4},rawDamage:10,triggered:true}).patch);assert.equal(lib.ownFormProfile(c).hp.current,28);assert.equal(c.hp.current,20);assert.equal(c.activeEffects.find(e=>e.stateKey==='bastion-of-law').dice,1);
});
test('Second Wind heals the active form on a multiclass character',()=>{
 let c=make(10);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:10,subclass:'Moon'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:1}];c.level=11;c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c=apply(c,fighter.useSecondWind(c,{total:6},{maxHP:20}));assert.equal(lib.ownFormProfile(c).hp.current,30);assert.equal(c.hp.current,20);
});
test('Moon form ends on unconsciousness or death, but not merely incapacitation',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert(lib.ownFormProfile(integration.reconcileClassGrants({...c,conditions:['Incapacitated']})));assert.equal(lib.ownFormProfile(integration.reconcileClassGrants({...c,conditions:['Unconscious']})),null);assert.equal(lib.ownFormProfile(integration.reconcileClassGrants({...c,dead:true})),null);
});
test('start-turn healing reaches form HP while effect and form states remain intact',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));c.activeEffects.push({id:'regeneration',healAtTurnStart:5,remainingSeconds:60});c=apply(c,lifecycle.advanceEffectTime(c,{startTurn:true,maxHP:20}));assert.equal(lib.ownFormProfile(c).hp.current,29);assert(c.activeEffects.some(e=>e.id==='regeneration'));
});
test('a long rest heals whichever body remains after time advances',()=>{
 assert.equal(typeof actor.longRestBody,'function');let c=make(18);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,10));const timed=lifecycle.restEffectPatch(c,'long');let rested=apply(c,{...timed,...actor.longRestBody({...c,...timed},20)});assert.equal(lib.ownFormProfile(rested).hp.current,34);assert.equal(rested.hp.current,20);let short=make(2);short.hp.current=10;short=apply(short,lib.activateMoonForm(short,'brown-bear',{seen:true,equipmentResolved:true}));const elapsed=lifecycle.restEffectPatch(short,'long');rested=apply(short,{...elapsed,...actor.longRestBody({...short,...elapsed},20)});assert.equal(lib.ownFormProfile(rested),null);assert.equal(rested.hp.current,20);
});
test('Aasimar Healing Hands heals the current form',()=>{
 let c={...make(10),race:'Aasimar',raceDefinition:{catalogId:race.aasimarId,edition:'2014'}};c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,lib.damageOwnForm(c,15));c=apply(c,aasimar.useHealingHands(c,{self:true}));assert.equal(lib.ownFormProfile(c).hp.current,29);assert.equal(c.hp.current,20);
});
test('Wild Magic self damage reverts form without restoring stale form effects',()=>{
 let c=make(10);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:10,subclass:'Moon'},{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:1,subclass:'Wild Magic'}];c.level=11;c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=apply(c,tables.applySubclassTable(c,'sorcerer-wild-magic',{total:7},{triggered:true,rolls:[{total:40},{total:0}],maxHP:20}));assert.equal(lib.ownFormProfile(c),null);assert.equal(c.hp.current,14);assert(!c.activeEffects.some(e=>e.stateKey==='moon-wild-shape'));
});
test('form retains explicit table-resolved equipment and base AC choices',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true,equipmentNotes:'Shield worn; armor merged',baseAC:13}));assert.equal(lib.ownFormProfile(c).equipmentNotes,'Shield worn; armor merged');assert.equal(lib.ownFormArmor(c),13);assert.equal(lib.ownFormProfile(JSON.parse(JSON.stringify(c))).equipmentNotes,'Shield worn; armor merged');
});
test('worn armor suppresses Mage Armor while additive defenses remain',()=>{
 let c=make();c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true,equipmentNotes:'armor worn',baseAC:12,wearingArmor:true}));c.activeEffects.push({id:'mage',key:'mage armor',baseAC:{base:13,ability:'dex'},requiresUnarmored:true},{id:'shield',key:'shield',acBonus:5});assert.equal(lib.ownFormArmor(c),17);
});
test('Beast Spells does not allow another class to cast a spell merely on the Druid list',()=>{
 let c=make(18);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.match(casting.featureCastingBlock(c,{name:'Cure Wounds',level:1,castingClassId:'2014:bard',classes:['Druid','Bard'],components:['V','S']}),/Druid spells/);
});
test('worn armor or shield requires a confirmed form base AC',()=>{
 assert.throws(()=>lib.activateMoonForm(make(),'brown-bear',{seen:true,equipmentResolved:true,wearingArmor:true}),/base AC/i);assert.throws(()=>lib.activateMoonForm(make(),'brown-bear',{seen:true,equipmentResolved:true,wearingShield:true}),/base AC/i);
});
test('merged equipment is not considered equipped by active-body consumers',()=>{
 assert.equal(typeof actor.equippedForActiveBody,'function');let c={...make(),inventory:[{id:'staff',equipped:true}]};c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(actor.equippedForActiveBody(c,c.inventory[0]),false);c=apply(c,lib.endOwnForm(c));c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true,wornItemIds:['staff']}));assert.equal(actor.equippedForActiveBody(c,c.inventory[0]),true);
});
test('active Bladesong AC bonus is retained by an eligible form',()=>{
 let c=make(2);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Bladesinging'}];c.level=4;c=apply(c,blade.startBladesong(c));c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(lib.ownFormArmor(c),13);
});
test('removing Moon cleans its form state and preserves unrelated effects and manual entries',()=>{
 let c=make();c.activeEffects=[{id:'manual',name:'Manual'}];c.subclassCompanions=[{id:'manual-pet'}];c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c=integration.reconcileClassGrants({...c,subclass:'Land'});assert.equal(lib.ownFormProfile(c),null);assert.deepEqual(c.profileState,{});assert(c.activeEffects.some(e=>e.id==='manual'));assert.deepEqual(c.subclassCompanions,[{id:'manual-pet'}]);
});
test('level loss invalidates a form above the current Moon CR limit before actor guards run',()=>{
 let c=make(6);c=apply(c,lib.activateMoonForm(c,'polar-bear',{seen:true,equipmentResolved:true}));c.level=2;c.hp.current=0;
 assert.equal(lib.ownFormProfile(c),null);assert.match(actor.actorActionBlock(c),/conscious/);c=integration.reconcileClassGrants(c);assert.deepEqual(c.profileState,{});
});
test('Primal Strike follows current Druid level rather than the activation snapshot',()=>{
 let c=make(6);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));c.level=5;
 assert.equal(lib.ownFormProfile(c).magicalAttacks,false);
});
test('Moon profile rejects a wrong source feature and an unrelated profile catalog',()=>{
 let c=make(10);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));
 const effect=c.activeEffects.find(e=>e.stateKey==='moon-wild-shape');effect.sourceFeatureId='2014:subclass:druid:moon:primal-strike';
 assert.equal(lib.ownFormProfile(c),null);effect.sourceFeatureId='2014:subclass:druid:moon:combat-wild-shape';effect.profileRef.catalogId='manual';assert.equal(lib.ownFormProfile(c),null);
});
test('Archdruid confirmation cannot waive listed costly or consumed materials',()=>{
 let c=make(20);c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));
 for(const material of ['Diamond dust worth 100 gp, which the spell consumes.','A pearl worth at least 100gp.','Herbs that the spell consumes.'])assert.match(casting.featureCastingBlock(c,{name:'Material spell',level:1,castingClassId:'2014:druid',components:['V','S','M'],material,archdruidMaterialEligible:true}),/material/i);
});
test('merged shield does not prevent Bladesong or cancel it on sheet reconciliation',()=>{
 let c=make(2);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'},{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Bladesinging'}];c.level=4;c.inventory=[{id:'shield',equipmentIndex:'shield',equipped:true}];
 c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));assert.equal(blade.bladesongProfile(c).blocked,'');c=apply(c,blade.startBladesong(c));c=blade.reconcileBladesinging(c);assert.equal(lib.ownFormArmor(c),13);
});
test('form damage applies elemental nonmagical resistance and explicit vulnerability once',()=>{
 let c=make(10);c=apply(c,lib.activateMoonForm(c,'fire-elemental',{equipmentResolved:true}));
 assert.equal(lib.ownFormDamageAmount(c,15,{type:'slashing',weapon:true}),7);assert.equal(lib.ownFormDamageAmount(c,15,{type:'slashing',magical:true}),15);assert.equal(lib.ownFormDamageAmount(c,15,{type:'slashing',weapon:true,vulnerable:true}),14);assert.equal(lib.ownFormDamageAmount(c,15,{type:'fire',vulnerable:true}),0);
});
test('retained Rage resistance applies to form damage without stacking resistance',()=>{
 let c=make(2);c.classLevels=[{catalogId:'2014:druid',name:'Druid',edition:'2014',level:2,subclass:'Moon'},{catalogId:'2014:barbarian',name:'Barbarian',edition:'2014',level:1}];c.level=3;c.activeEffects=[{id:'rage',stateKey:'rage',baseClassId:'2014:Barbarian:rage',remainingSeconds:60}];c=apply(c,lib.activateMoonForm(c,'brown-bear',{seen:true,equipmentResolved:true}));
 assert.equal(lib.ownFormDamageAmount(c,15,{type:'slashing',magical:true}),7);assert.equal(lib.ownFormDamageAmount(c,15,{type:'cold'}),15);
});
