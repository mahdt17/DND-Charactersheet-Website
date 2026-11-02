import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
const load=async path=>existsSync(`src/lib/${path}.js`)?server.ssrLoadModule(`/src/lib/${path}.js`):{};
const [active,effect,actor,play,styles,resources,integration,quant,healing,bindings,featurecast,recovery,triggers,numerics,theurgy,tables,featmagic,featcast,rules]=await Promise.all(['subclassActive','spellEffects','subclassState','play','fightingStyles','resources','classIntegration','subclassQuantities','subclassHealing','subclassEquipment','subclassFeatureCasting','subclassRecovery','subclassTriggered','subclassNumerics','subclassTheurgy','subclassTables','featMagic','featCasting','rules'].map(load));await server.close();
export const make=(className='Druid',subclass='Stars',level=10)=>({ruleset:'2014',className,subclass,level,classDefinition:{name:className,index:className.toLowerCase(),edition:'2014'},abilities:{str:16,dex:14,con:16,int:18,wis:18,cha:18},hp:{current:30,max:50,temp:0},speed:30,inventory:[],resources:[],activeEffects:[],spells:[],actions:[]});
const apply=(c,p)=>({...c,...p});
test('normal Rage spends canonical pool once, clears concentration-owned states, forbids casting and expires',()=>{
 assert.equal(typeof active.startRage,'function');let c=make('Barbarian','Zealot',14);c.concentration='Bless';c.activeEffects=[{id:'bless',concentration:'Bless'},{id:'mage',key:'mage armor'}];
 c=apply(c,active.startRage(c));assert.equal(c.resources.find(r=>r.id==='2014:Barbarian:rage').used,1);assert(!c.activeEffects.some(e=>e.id==='bless'));assert(c.activeEffects.some(e=>e.id==='mage'));assert.throws(()=>active.startRage(c),/already/);assert.throws(()=>play.spendSpellSlot(c,{level:1},1),/Rage|raging/);assert.equal(active.rageProfile(c).damage,3);
 c=apply(c,effect.advanceEffectTime(c,{seconds:60}));assert(!active.rageProfile(c).active);
});
test('Zealot postpones failed-save death until rage ends; Samurai can trigger at zero and heal with Second Wind',()=>{
 assert.equal(typeof active.startStrengthBeforeDeath,'function');let z=apply(make('Barbarian','Zealot',14),active.startRage(make('Barbarian','Zealot',14)));z.hp.current=0;z.deathSaves={failure:3};assert.equal(actor.actorActionBlock(z),'');assert.equal(apply(z,active.endRage(z)).dead,true);
 let healed=apply(z,styles.useSecondWind({...z,classLevels:[{catalogId:'2014:barbarian',name:'Barbarian',edition:'2014',level:14,subclass:'Zealot'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:1}]},{total:6},{maxHP:50}));assert.equal(healed.deathSaves.failure,0);assert(!apply(healed,active.endRage(healed)).dead);
 let c=make('Fighter','Samurai',18);c.hp.current=0;c=apply(c,active.startStrengthBeforeDeath(c,{triggered:true}));assert.equal(actor.actorActionBlock(c),'');assert(actor.actorActionBlock({...c,deathSaves:{failure:3}}));c=apply(c,styles.useSecondWind(c,{total:8},{maxHP:50}));assert.equal(c.hp.current,8);assert.deepEqual(c.deathSaves,{success:0,failure:0});c=apply(c,effect.advanceEffectTime(c,{seconds:6}));assert.equal(actor.actorActionBlock(c),'');
});
test('Stars validates constellation and source; Spores tracks its own replaceable temporary HP pool',()=>{
 assert.equal(typeof active.activateSubclassForm,'function');let c=make();assert.throws(()=>active.activateSubclassForm(c,'starry-form',{choice:'unknown'}),/Choose/);c=apply(c,active.activateSubclassForm(c,'starry-form',{choice:'Dragon'}));assert.equal(c.activeEffects.find(e=>e.stateKey==='starry-form').choice,'Dragon');assert.equal(c.resources.find(r=>r.id==='2014:Druid:wild-shape').used,1);assert.equal(active.activeFormProfile(c).flyingSpeed,20);assert.throws(()=>active.activateSubclassForm({...c,level:1},'starry-form',{choice:'Dragon'}),/available/);
 let s=make('Druid','Spores',6);s.hp.temp=40;assert.throws(()=>active.activateSubclassForm(s,'symbiotic-entity'),/replace/i);s=apply(s,active.activateSubclassForm(s,'symbiotic-entity',{replaceTemp:true}));assert.equal(s.hp.temp,24);assert.equal(s.hp.tempSource,'symbiotic-entity');assert(active.activeFormProfile(s).symbiotic);s=integration.reconcileClassGrants({...s,hp:{...s.hp,temp:0}});assert(!active.activeFormProfile(s).symbiotic);assert(!integration.reconcileClassGrants({...c,subclass:'Land'}).activeEffects.some(e=>e.stateKey==='starry-form'));
});

test('Ward starts empty, creates on qualifying cast once per cycle, restores and absorbs raw damage before resistance',()=>{
 assert.equal(typeof quant.wardCastPatch,'function');let c=make('Wizard','Abjuration',6);assert.equal(quant.quantityProfile(c,'arcane-ward-hp').current,0);assert.deepEqual(quant.wardCastPatch(c,{name:'Magic Missile',level:1,school:'Evocation'},1),{});
 c=apply(c,quant.wardCastPatch(c,{name:'Shield',level:1,school:'Abjuration'},1));assert.equal(quant.quantityProfile(c,'arcane-ward-hp').current,16);c.concentration='Bless';const absorbed=quant.absorbWard(c,{amount:12,rawDamage:12});c=apply(c,absorbed.patch);assert.equal(c.hp.current,30);assert.equal(c.concentration,'Bless');assert.equal(quant.quantityProfile(c,'arcane-ward-hp').current,4);c=apply(c,quant.wardCastPatch(c,{level:2,school:'Abjuration'},2));assert.equal(quant.quantityProfile(c,'arcane-ward-hp').current,8);c=apply(c,quant.quantityRest(c,'long'));assert.equal(quant.quantityProfile(c,'arcane-ward-hp').current,0);
});
test('Trinkets retain actual quantity across PB changes; surges start one and recover only when empty',()=>{
 assert.equal(typeof quant.resourceEvent,'function');let c=make('Rogue','Phantom',9);assert.equal(quant.quantityProfile(c,'soul-trinkets').current,0);assert.throws(()=>quant.resourceEvent(c,'collect-trinket',{}),/Confirm/);c=apply(c,quant.resourceEvent(c,'collect-trinket',{visibleDeath:true,within30:true,freeHand:true}));assert.equal(quant.quantityProfile({...c,level:17},'soul-trinkets').current,1);assert.equal(quant.quantityProfile(apply(c,quant.quantityRest(c,'long')),'soul-trinkets').current,1);
 let w=make('Wizard','War Magic',6);assert.equal(quant.quantityProfile(w,'power-surges').current,1);w=apply(w,quant.resourceEvent(w,'spend-surge',{ownTurn:true,wizardSpellDamage:true}));assert.equal(quant.quantityProfile(w,'power-surges').current,0);assert.throws(()=>quant.resourceEvent(w,'gain-surge',{}),/Confirm/);w=apply(w,quant.quantityRest(w,'short'));assert.equal(quant.quantityProfile(w,'power-surges').current,1);
});
test('Portent stores visible d20s and consumes one selected result, never rerolls on reload',()=>{
 assert.equal(typeof quant.rollPortent,'function');let c=make('Wizard','Divination',14);assert.throws(()=>quant.rollPortent(c,[{total:2}]),/three|3/);c=apply(c,quant.rollPortent(c,[{total:2},{total:12},{total:20}]));assert.deepEqual(quant.portentProfile(c).values,[2,12,20]);c=apply(c,quant.usePortent(c,1,{triggered:true}));assert.deepEqual(quant.portentProfile(c).values,[2,null,20]);assert.throws(()=>quant.usePortent(c,1,{triggered:true}),/spent/);assert.throws(()=>quant.rollPortent(c,[{total:1},{total:1},{total:1}]),/already/);c=apply(c,quant.quantityRest(c,'long'));assert.deepEqual(quant.portentProfile(c).values,[]);
});

test('Life healing adds slot bonus, Blessed Healer heals caster only for Other; Grave maximizes only confirmed zero',()=>{
 assert.equal(typeof healing.healingFeaturePlan,'function');const life=make('Cleric','Life',17),spell={name:'Cure Wounds',level:1,heal_at_slot_level:{1:'1d8+MOD'}},plan=play.spellPlan(spell,life,1,4);assert.equal(healing.healingFeaturePlan(life,spell,plan,{slotLevel:1,recipient:'self'}).rolls[0].expression,'15');
 const other=effect.castEffectPatch(life,spell,{recipient:'other',rolls:[{label:'Healing',total:15}],plan,slotLevel:1,maxHP:50});assert.equal(other.hp.current,33);const self=effect.castEffectPatch(life,spell,{recipient:'self',rolls:[{label:'Healing',total:15}],plan,slotLevel:1,maxHP:50});assert.equal(self.hp.current,45);
 const grave=make('Cleric','Grave',1);assert.equal(healing.healingFeaturePlan(grave,spell,plan,{slotLevel:1,recipient:'other'}).rolls[0].expression,'1d8+4');assert.equal(healing.healingFeaturePlan(grave,spell,plan,{slotLevel:1,recipient:'other',targetAtZero:true}).rolls[0].expression,'12');
});
test('Fighting Spirit executes temp HP and turn advantage; variable healing validates cost and roll before spend',()=>{
 assert.equal(typeof healing.useHealingFeature,'function');let c=make('Fighter','Samurai',10);c=apply(c,healing.useHealingFeature(c,'fighting-spirit',{}));assert.equal(c.hp.temp,10);assert(active.activeFormProfile(c).weaponAdvantage);c=apply(c,effect.advanceEffectTime(c,{seconds:6}));assert(!active.activeFormProfile(c).weaponAdvantage);
 let d=make('Druid','Dreams',6);assert.throws(()=>healing.useHealingFeature(d,'balm',{n:4,recipient:'self',triggered:true,result:{total:12},maxHP:50}),/1.*3/);assert.throws(()=>healing.useHealingFeature(d,'balm',{n:2,recipient:'self',triggered:true,maxHP:50}),/roll/);d=apply(d,healing.useHealingFeature(d,'balm',{n:2,recipient:'self',triggered:true,result:{total:9},maxHP:50}));assert.equal(d.hp.current,39);assert.equal(d.hp.temp,2);assert.equal(d.resources.find(r=>r.id.endsWith('resource:balm-dice')).used,2);
});

test('Hex Warrior binds one actual item ID; Battle Smith requires confirmed magic weapon',()=>{
 assert.equal(typeof bindings.bindSubclassEquipment,'function');let c=make('Warlock','Hexblade',3);c.inventory=[{id:'rapier-a',name:'Rapier',equipmentIndex:'rapier',equipped:true},{id:'rapier-b',name:'Rapier',equipmentIndex:'rapier',equipped:true},{id:'great',name:'Greatsword',equipmentIndex:'greatsword',equipped:true}];assert.throws(()=>bindings.bindSubclassEquipment(c,'hex-weapon','great',{confirmed:true}),/Two-Handed|two-handed/);c=apply(c,bindings.bindSubclassEquipment(c,'hex-weapon','rapier-a',{confirmed:true}));assert.equal(bindings.weaponSubclassAbility(c,c.inventory[0]),'cha');assert.equal(bindings.weaponSubclassAbility(c,c.inventory[1]),null);assert.equal(bindings.weaponSubclassAbility({...c,subclass:'Fiend'},c.inventory[0]),null);
 let b=make('Artificer','Battle Smith',3);b.inventory=c.inventory;assert.throws(()=>bindings.bindSubclassEquipment(b,'magic-weapon','rapier-a'),/magic/);b=apply(b,bindings.bindSubclassEquipment(b,'magic-weapon','rapier-a',{magic:true}));assert.equal(bindings.weaponSubclassAbility(b,b.inventory[0]),'int');
});
test('Feature casts have legal costs/slots and Rage guards; temporary choices expire rather than becoming permanent spells',()=>{
 assert.equal(typeof featurecast.featureCastPlan,'function');let c=make('Monk','Four Elements',5);c.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:four-elements':{disciplines:['Sweeping Cinder Strike']}}};const cast=featurecast.featureCastPlan(c,'discipline:Sweeping Cinder Strike',{ki:3});assert.equal(cast.spell.name,'Burning Hands');assert.equal(cast.slotLevel,2);assert.equal(cast.ability,'wis');assert.throws(()=>featurecast.featureCastPlan(c,'discipline:Sweeping Cinder Strike',{ki:4}),/maximum|Maximum/);
 let s=make('Bard','Spirits',6);s=apply(s,featurecast.acquireTemporarySpell(s,'spirit-session',{name:'Detect Magic',participants:2,confirmed:true}));assert(s.spells.some(r=>r.name==='Detect Magic'&&r.temporarySubclassSpell));s=apply(s,featurecast.startSubclassLongRest(s));assert(!s.spells.some(r=>r.temporarySubclassSpell));
});

test('UA Psionic Talent changes die size once per visible result and replenishes by its own rules',()=>{
 assert.equal(typeof recovery.rollPsionicTalent,'function');let c=make('Fighter','Psi Knight (UA)',5);assert.equal(recovery.psionicTalentProfile(c).sides,8);assert.throws(()=>recovery.rollPsionicTalent(c,{total:9},{triggered:true}),/roll/);c=apply(c,recovery.rollPsionicTalent(c,{total:8},{triggered:true}));assert.equal(recovery.psionicTalentProfile(c).sides,6);c=apply(c,recovery.rollPsionicTalent(c,{total:1},{triggered:true}));assert.equal(recovery.psionicTalentProfile(c).sides,8);c=apply(c,recovery.rollPsionicTalent(c,{total:8},{triggered:true}));c=apply(c,recovery.replenishPsionicTalent(c));assert.equal(recovery.psionicTalentProfile(c).sides,8);assert.throws(()=>recovery.replenishPsionicTalent(c),/resource/);
});
test('Undead Husk validates visible cooldown and damage before revival, exhaustion and persisted long-rest decrement',()=>{
 assert.equal(typeof recovery.useCooldownFeature,'function');let c=make('Warlock','Undead',10);c.hp.current=0;assert.throws(()=>recovery.useCooldownFeature(c,'necrotic-husk',{triggered:true,cooldown:{total:3}}),/roll/);c=apply(c,recovery.useCooldownFeature(c,'necrotic-husk',{triggered:true,cooldown:{total:3},result:{total:21}}));assert.equal(c.hp.current,1);assert.equal(c.exhaustion,1);assert.equal(recovery.cooldownProfile(c)[0].remaining,3);c=apply(c,recovery.specialRecoveryRest(c,'long'));assert.equal(recovery.cooldownProfile(c)[0].remaining,2);assert.throws(()=>recovery.useCooldownFeature({...c,hp:{...c.hp,current:0}},'necrotic-husk',{triggered:true,cooldown:{total:1},result:{total:20}}),/cooldown/);
});
test('verified rune activation and Stars Archer rolls require source choices and real triggering contexts',()=>{
 assert.equal(typeof triggers.executeTriggeredFeature,'function');let c=make('Fighter','Rune Knight',7);c.expandedSubclassChoices={'2014:fighter':{'2014:subclass:fighter:rune-knight':{'runes-known':['Frost','Hill','Fire']}}};assert.throws(()=>triggers.executeTriggeredFeature(c,'invoke-frost',{}),/Confirm/);c=apply(c,triggers.executeTriggeredFeature(c,'invoke-frost',{triggered:true,equipment:true}));assert.equal(active.activeFormProfile(c).frostBonus,2);assert.throws(()=>triggers.executeTriggeredFeature(c,'invoke-cloud',{triggered:true,equipment:true}),/known/);
 let s=make();assert.throws(()=>triggers.executeTriggeredFeature(s,'archer',{triggered:true,rolls:[{total:15},{total:9}]}),/Archer/);s=apply(s,active.activateSubclassForm(s,'starry-form',{choice:'Archer'}));s=apply(s,triggers.executeTriggeredFeature(s,'archer',{triggered:true,rolls:[{total:15},{total:9}]}));assert(s.subclassLastResult);
});

test('active benefits reach actual roll traits and source-owned Monk attack dice',()=>{
 let c=make('Druid','Stars',10);c=apply(c,active.activateSubclassForm(c,'starry-form',{choice:'Dragon'}));assert.equal(numerics.subclassRollTraits(c,{kind:'save',name:'Concentration save',concentration:true}).minimumD20,10);assert.equal(numerics.subclassRollTraits(c,{kind:'check',name:'Perception'}).minimumD20,10);
 let m=make('Monk','Sun Soul',11);assert.equal(triggers.subclassNaturalAttacks(m)[0].damage,'1d8+2');m={...m,level:15,classLevels:[{catalogId:'2014:monk',name:'Monk',edition:'2014',level:3,subclass:'Sun Soul'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:12}]};assert.equal(triggers.subclassNaturalAttacks(m)[0].damage,'1d4+2');
});

test('Life low-level roll expression remains executable and active quantities never appear full by default',()=>{
 const c=make('Cleric','Life',6),s={name:'Cure Wounds',level:1,heal_at_slot_level:{1:'1d8+MOD'}};assert.equal(healing.healingFeaturePlan(c,s,play.spellPlan(s,c,1,4),{slotLevel:1,recipient:'other'}).rolls[0].expression,'1d8+7');const w=make('Wizard','Abjuration',2),r=resources.characterResources(w).find(r=>r.key==='arcane-ward-hp');assert.equal(r.max-r.used,0);assert(r.quantityManaged);
});

test('Theurgy trades one free Wizard book acquisition for selected domain, then unlocks Cleric list only with all domain spells',()=>{
 assert.equal(typeof theurgy.replaceTheurgySpell,'function');let c=make('Wizard','Theurgy (UA)',2);c.expandedSubclassChoices={'2014:wizard':{'2014:subclass:wizard:theurgy-ua':{'divine-domain':['Life']}}};c.spells=[{id:'free',name:'Magic Missile',level:1,classes:['Wizard'],castingClassId:'2014:wizard'}];assert(theurgy.theurgyProfile(c).options.some(s=>s.name==='Cure Wounds'));assert(!theurgy.theurgyProfile(c).options.some(s=>s.name==='Guiding Bolt'));c=apply(c,theurgy.replaceTheurgySpell(c,{removedId:'free',name:'Cure Wounds',confirmed:true}));assert.equal(c.spells.length,1);assert(c.spells[0].theurgyBookSpell);assert.throws(()=>theurgy.replaceTheurgySpell(c,{removedId:c.spells[0].id,name:'Bless',confirmed:true}),/already/);
});

test('Wild Magic tables use visible outcomes, execute typed self effects, and preserve source distinctions',()=>{
 assert.equal(typeof tables.applySubclassTable,'function');let c=make('Sorcerer','Wild Magic',6);c=apply(c,tables.applySubclassTable(c,'sorcerer-wild-magic',{total:51},{triggered:true,maxHP:50}));assert.equal(c.activeEffects.find(e=>e.stateKey==='wild-surge:51').acBonus,2);assert.throws(()=>tables.applySubclassTable(c,'sorcerer-wild-magic',{total:39},{triggered:true}),/roll/);c=apply(c,tables.applySubclassTable(c,'sorcerer-wild-magic',{total:39},{triggered:true,rolls:[{total:12}],maxHP:50}));assert.equal(c.hp.current,42);
 const ua=make('Barbarian','Wild Soul (UA)',3),u=tables.applySubclassTable(ua,'barbarian-wild-soul-ua',{total:4},{triggered:true,maxHP:50});assert.equal(u.activeEffects.find(e=>e.stateKey==='rage-wild-surge').acBonus,2);
});
test('Spirits retain a rolled tale until bestowed; Alchemist creates real consumables before drinking',()=>{
 assert.equal(typeof tables.bestowSpiritTale,'function');let c=make('Bard','Spirits',6);c=apply(c,tables.applySubclassTable(c,'spirit-tales',{total:6},{triggered:true,maxHP:50}));assert(c.activeEffects.some(e=>e.stateKey==='held-spirit-tale'));assert.equal(c.hp.temp,0);c=apply(c,tables.bestowSpiritTale(c,{recipient:'self',triggered:true,rolls:[{total:10}],maxHP:50}));assert.equal(c.hp.temp,10);assert(!c.activeEffects.some(e=>e.stateKey==='held-spirit-tale'));assert.throws(()=>tables.bestowSpiritTale(c,{triggered:true,rolls:[{total:8}],maxHP:50}),/tale/);
 let a=make('Artificer','Alchemist',3);a=apply(a,tables.createElixir(a,{result:{total:3},confirmed:true}));assert.equal(a.subclassElixirs.length,1);a=apply(a,tables.drinkElixir(a,a.subclassElixirs[0].id,{recipient:'self',confirmed:true,maxHP:50}));assert.equal(a.subclassElixirs.length,0);assert.equal(a.activeEffects.find(e=>e.stateKey==='elixir-resilience').acBonus,1);
});

test('Bastion stores unrolled ward dice, then reaction rolls and spends selected dice once with raw-damage self workflow',()=>{
 assert.equal(typeof healing.consumeBastion,'function');let c=make('Sorcerer','Clockwork Soul',6);c=apply(c,healing.useHealingFeature(c,'bastion-of-law',{n:3,recipient:'self',triggered:true,maxHP:50}));assert.equal(c.activeEffects.find(e=>e.stateKey==='bastion-of-law').dice,3);assert.throws(()=>healing.consumeBastion(c,{n:2,rawDamage:14,triggered:true}),/roll/);const r=healing.consumeBastion(c,{n:2,result:{total:10},rawDamage:14,triggered:true});c=apply(c,r.patch);assert.equal(c.hp.current,26);assert.equal(c.activeEffects.find(e=>e.stateKey==='bastion-of-law').dice,1);
});

test('UA Frost changes Strength score instead of published check/save bonus; Ghost Walk trinkets and source revival consume correctly',()=>{
 let c=make('Fighter','Rune Knight (UA)',7);c.expandedSubclassChoices={'2014:fighter':{'2014:subclass:fighter:rune-knight-ua':{'runes-known':['Frost','Hill','Fire']}}};c=apply(c,triggers.executeTriggeredFeature(c,'invoke-frost',{triggered:true,equipment:true}));assert.equal(active.activeFormProfile(c).frostBonus,0);assert.equal(numerics.subclassNumericProfile(c).abilityCheckBonuses.str||0,0);
 let p=make('Rogue','Phantom',13);p=apply(p,quant.resourceEvent(p,'collect-trinket',{visibleDeath:true,within30:true,freeHand:true}));p=apply(p,active.activateSubclassForm(p,'ghost-walk',{useTrinket:true}));assert.equal(quant.quantityProfile(p,'soul-trinkets').current,0);
 let v=make('Warlock','Celestial',14);v.hp.current=0;v=apply(v,healing.useHealingFeature(v,'searing-vengeance',{triggered:true,result:{total:14},maxHP:50}));assert.equal(v.hp.current,25);assert.deepEqual(v.deathSaves,{success:0,failure:0});
});

test('source variants retain Stars early ending and Chalice formula, Shadow UA cost, and Giant Might activation',()=>{
 let c=make('Druid','Stars (UA)',10);c=apply(c,active.activateSubclassForm(c,'starry-form',{choice:'Chalice'}));assert.equal(triggers.triggeredFeaturePlan(c,'chalice').rolls[0],'1d8+5');assert(!integration.reconcileClassGrants({...c,conditions:['Stunned']}).activeEffects.some(e=>e.stateKey==='starry-form'));
 const shadow=featurecast.featureCastPlan(make('Sorcerer','Shadow (UA)',2),'shadow-darkness');assert.equal(shadow.cost,1);const g=make('Fighter','Rune Knight',3);assert(active.subclassForms(g).some(d=>d.key==='giants-might'));assert(active.activateSubclassForm(g,'giants-might').activeEffects.some(e=>e.stateKey==='giants-might'));
});

test('free feat spells share actor and source casting restrictions without spending on invalid casts',()=>{
 let c=make('Fighter','Champion',4);c.feats=[{id:'initiate',name:'Magic Initiate',edition:'2014',magicChoices:{list:'Wizard',ability:'int',cantrips:['2014:fire-bolt','2014:mage-hand'],spell:'2014:magic-missile'}}];const spell=featmagic.featMagicSpells(c).find(s=>s.level===1);assert(spell);assert.throws(()=>featcast.spendFeatCast({...c,hp:{...c.hp,current:0}},spell,{pool:'feat',level:1}),/conscious/);
});

test('Kensei binds sharpened bonus to an eligible actual weapon and validated ki; Dragon uses own Monk die',()=>{
 let c=make('Monk','Kensei',11);c.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:kensei':{'initial-kensei-melee':['Longsword'],'initial-kensei-ranged':['Longbow']}}};c.inventory=[{id:'sword',name:'Longsword',equipmentIndex:'longsword',equipped:true}];assert.throws(()=>triggers.executeTriggeredFeature(c,'sharpen-blade',{itemId:'sword',n:4,triggered:true}),/1.*3/);c=apply(c,triggers.executeTriggeredFeature(c,'sharpen-blade',{itemId:'sword',n:2,triggered:true}));assert.equal(bindings.weaponSubclassBonus(c,c.inventory[0]),2);assert.equal(c.resources.find(r=>r.id==='2014:Monk:points').used,2);assert.equal(triggers.subclassNaturalAttacks(make('Monk','Ascendant Dragon',5))[0].damage,'1d6+3');
});

test('Stars switches only at own turn start, Cosmic Omen stores raw parity until rest, projection owns concentration',()=>{
 let s=make();s=apply(s,active.activateSubclassForm(s,'starry-form',{choice:'Dragon'}));assert.equal(typeof active.switchStarryForm,'function');assert.throws(()=>active.switchStarryForm(s,'Archer',{}),/start/);const before=JSON.stringify(s.resources);s=apply(s,active.switchStarryForm(s,'Archer',{startTurn:true}));assert.equal(active.activeFormProfile(s).star,'Archer');assert.equal(JSON.stringify(s.resources),before);assert.throws(()=>active.switchStarryForm({...s,subclass:'Stars (UA)'},'Chalice',{startTurn:true}),/available/);
 assert.equal(typeof recovery.consultCosmicOmen,'function');s=apply(s,recovery.consultCosmicOmen(s,{total:4}));assert.equal(recovery.cosmicOmenProfile(s).omen,'weal');assert.throws(()=>recovery.consultCosmicOmen(s,{total:3}),/already/);s=apply(s,recovery.useCosmicOmen(s,{total:5},{triggered:true}));assert.match(s.subclassLastResult.instructions,/Add 5/);s=apply(s,effect.restEffectPatch(s,'long'));assert.equal(recovery.cosmicOmenProfile(s).omen,null);
 let u=make('Warlock','Undead',14);u.concentration='Bless';u.activeEffects=[{id:'bless',concentration:'Bless'},{id:'mage',key:'mage armor'}];u=apply(u,active.activateSubclassForm(u,'spirit-projection'));assert.equal(u.concentration,'Spirit Projection');assert(!u.activeEffects.some(e=>e.id==='bless'));assert(u.activeEffects.some(e=>e.id==='mage'));assert(active.activeFormProfile(u).resistances.includes('slashing'));u=apply(u,active.endSubclassForm(u,'spirit-projection'));assert.equal(u.concentration,null);
});

test('Alternate slot and trinket costs validate availability and preserve ordinary pools atomically',()=>{
 let c=make('Ranger','Swarmkeeper (UA)',11);c.slotsUsed={3:2};assert.throws(()=>active.activateSubclassForm(c,'scuttling-eyes',{slotLevel:2}),/3|slot/);const p=active.activateSubclassForm(c,'scuttling-eyes',{slotLevel:3});assert.equal(p.slotsUsed[3],3);assert(!p.resources);assert.throws(()=>active.activateSubclassForm({...c,slotsUsed:{3:3}},'scuttling-eyes',{slotLevel:3}),/available|slot/);
 let r=make('Rogue','Phantom',9);r=apply(r,quant.resourceEvent(r,'collect-trinket',{visibleDeath:true,within30:true,freeHand:true}));r=apply(r,triggers.executeTriggeredFeature(r,'wails-from-grave',{triggered:true,useTrinket:true,rolls:[{total:9}]}));assert.equal(quant.quantityProfile(r,'soul-trinkets').current,0);assert(!r.resources.some(v=>v.id.endsWith('resource:wails-from-the-grave')&&v.used));
});

test('Source reconciliation removes deselected flexible states and stale equipment context but preserves manual state',()=>{
 let c=make('Wizard','Mage of Silverquill (UA)',14);const p=featurecast.featureCastingOptions(c);c.expandedSubclassChoices={'2014:wizard':{'2014:subclass:wizard:mage-of-silverquill-ua':{'later-subclass-feature:6':['Inky Shroud']}}};const records=JSON.parse(JSON.stringify(c));c.activeEffects=[{id:'manual',name:'Manual'},{id:'shroud',subclassRecordId:'2014:subclass:wizard:mage-of-silverquill-ua',sourceClassId:'2014:wizard',sourceFeatureId:'2014:subclass:wizard:mage-of-silverquill-ua:inky-shroud',stateKey:'inky-shroud'}];assert.equal(actor.sourceSubclassEffects(c).length,1);c.expandedSubclassChoices={};assert.equal(actor.sourceSubclassEffects(c).length,0);assert(actor.reconcileSubclassStates(c).activeEffects.some(e=>e.id==='manual'));
 let k=make('Monk','Kensei',3);k.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:kensei':{'initial-kensei-melee':['Longsword'],'initial-kensei-ranged':['Longbow']}}};k.inventory=[{id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true}];assert.throws(()=>triggers.executeTriggeredFeature(k,'agile-parry',{triggered:true,itemId:'bow'}),/melee/);
});

test('Nonspell Four Elements use source-selected disciplines, legal variable ki, and real Martial Arts fire attacks',()=>{
 let m=make('Monk','Four Elements',5);m.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:four-elements':{disciplines:['Fist of Unbroken Air','Fangs of the Fire Snake']}}};assert.equal(triggers.triggeredFeaturePlan(m,'fist-unbroken-air',{n:5}).rolls[0],'6d10');assert.throws(()=>triggers.executeTriggeredFeature(m,'fist-unbroken-air',{n:5,triggered:true,rolls:[]}),/roll/);m=apply(m,triggers.executeTriggeredFeature(m,'fist-unbroken-air',{n:5,triggered:true,rolls:[{total:31}]}));assert.equal(m.resources.find(r=>r.id==='2014:Monk:points').used,5);assert.throws(()=>triggers.triggeredFeaturePlan(m,'water-whip',{n:2}),/Choose|known|available/);
 m={...m,resources:[]};m=apply(m,triggers.executeTriggeredFeature(m,'fangs-fire-snake',{triggered:true}));const fire=triggers.subclassNaturalAttacks(m).find(a=>a.name==='Fangs of the Fire Snake');assert.equal(fire.damage,'1d6+3');assert.match(fire.notes,/fire|reach/i);
});

test('Conditional Giant and Beast riders validate actual active forms and enforce own-turn cadence',()=>{
 let g=make('Fighter','Rune Knight',10);assert.throws(()=>triggers.executeTriggeredFeature(g,'giant-damage',{triggered:true,rolls:[{total:5}]}),/active/);g=apply(g,active.activateSubclassForm(g,'giants-might'));assert.equal(triggers.triggeredFeaturePlan(g,'giant-damage').rolls[0],'1d8');g=apply(g,triggers.executeTriggeredFeature(g,'giant-damage',{triggered:true,rolls:[{total:5}]}));assert.throws(()=>triggers.executeTriggeredFeature(g,'giant-damage',{triggered:true,rolls:[{total:5}]}),/turn/);
 let b=make('Barbarian','Beast',5);b.hp.current=20;b=apply(b,active.startRage(b,{weapon:'Bite'}));b=apply(b,triggers.executeTriggeredFeature(b,'beast-bite-heal',{triggered:true}));assert.equal(b.hp.current,23);assert.throws(()=>triggers.executeTriggeredFeature(b,'beast-bite-heal',{triggered:true}),/turn/);assert.throws(()=>triggers.executeTriggeredFeature(b,'beast-tail-defense',{triggered:true,rolls:[{total:5}]}),/Tail/);
 let t=make('Monk','Tranquility (UA)',3);t=apply(t,healing.useHealingFeature(t,'healing-hands',{n:12,recipient:'self',triggered:true,maxHP:50}));assert.equal(t.hp.current,42);assert.equal(t.resources.find(r=>r.id.endsWith(':healing-hands')).used,12);assert.throws(()=>healing.useHealingFeature(t,'healing-hands',{n:2,recipient:'self',triggered:true,targetType:'undead',maxHP:50}),/undead/);
});

test('Feature casting guards preserve Ward and Arcanum in one patch and protect explicit death from revival',()=>{
 let c=make('Warlock','Genie',19);c.classLevels=[{name:'Warlock',catalogId:'2014:warlock',edition:'2014',level:17,subclass:'The Genie'},{name:'Wizard',catalogId:'2014:wizard',edition:'2014',level:2,subclass:'Abjuration'}];const patch=featurecast.executeFeatureCast(c,'arcanum:9',{name:'Imprisonment',confirmed:true,rolls:[]});assert.equal(patch.subclassArcanum['2014:warlock'][9].used,true);assert.equal(patch.subclassQuantities['2014:wizard']['2014:subclass:wizard:abjuration']['arcane-ward-hp'].current,8);
 const dead={...make('Warlock','Celestial',14),hp:{current:0,max:50,temp:0},dead:true};assert.throws(()=>healing.useHealingFeature(dead,'searing-vengeance',{triggered:true,result:{total:10},maxHP:50}),/dead/);
});


test('Wild Rage requires a visible table result and applies its owned state atomically with the Rage spend',()=>{
 let b=make('Barbarian','Wild Magic',3);assert.throws(()=>active.startRage(b),/surge|roll/i);b=apply(b,active.startRage(b,{surgeResult:{total:6},surgeRolls:[]}));assert.equal(b.resources.find(r=>r.id==='2014:Barbarian:rage').used,1);assert.equal(b.activeEffects.find(e=>e.stateKey==='rage-wild-surge').acBonus,1);b=apply(b,active.endRage(b));assert(!b.activeEffects.some(e=>e.stateKey==='rage-wild-surge'));
 let high=make('Barbarian','Wild Magic',14);assert.throws(()=>active.startRage(high,{surgeResult:{total:6}}),/two|2|roll/);high=apply(high,active.startRage(high,{surgeResult:{total:6},surgeChoices:[{total:6},{total:3}]}));assert.equal(high.activeEffects.find(e=>e.stateKey==='rage-wild-surge').tableResult,6);
});

test('Wild self spell and shape outcomes retain source durations and exact profile handoff without concentration',()=>{
 let c=make('Sorcerer','Wild Magic',6);c.concentration='Bless';c=apply(c,tables.applySubclassTable(c,'sorcerer-wild-magic',{total:45},{triggered:true}));assert.equal(c.activeEffects.find(e=>e.stateKey==='wild-surge:45').remainingSeconds,600);assert.equal(c.concentration,'Bless');c=apply(c,tables.applySubclassTable(c,'sorcerer-wild-magic',{total:77},{triggered:true,rolls:[{total:2}]}));const sheep=c.activeEffects.find(e=>e.stateKey==='wild-surge:77');assert.equal(sheep.remainingSeconds,3600);assert.equal(sheep.profileRef.creatureId,'sheep');assert.equal(c.concentration,'Bless');assert.throws(()=>tables.applySubclassTable(make('Sorcerer','Wild Magic',6),'sorcerer-wild-magic',{total:87},{triggered:true}),/target|recipient/);
});


test('Kensei active ranged hit bonus reaches actual damage; UA pummel keeps its source action and no false ki cost',()=>{
 let k=make('Monk','Kensei',6);k.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:kensei':{'initial-kensei-melee':['Longsword'],'initial-kensei-ranged':['Longbow']}}};k.inventory=[{id:'bow',name:'Longbow',equipmentIndex:'longbow',equipped:true}];k=apply(k,triggers.executeTriggeredFeature(k,'kensei-shot',{triggered:true,itemId:'bow'}));assert.match(rules.weaponAttacks(k,k.abilities)[0].damage,/1d4/);assert.equal(rules.rollDice(rules.weaponAttacks(k,k.abilities)[0].damage,'normal',()=>0).total,5);k=apply(k,effect.advanceEffectTime(k,{endTurn:true}));assert(!/1d4/.test(rules.weaponAttacks(k,k.abilities)[0].damage));
 const ua=make('Monk','Kensei (UA)',6);assert(!triggers.triggeredFeatures(ua).some(d=>d.key==='deft-strike'));assert.equal(triggers.triggeredFeaturePlan(ua,'kensei-pummel').rolls[0],'1d4');
});


test('Active defenses and Astral substitutions reach derived profiles and actual save traits',()=>{
 let p=make('Rogue','Phantom',9);p=apply(p,quant.resourceEvent(p,'collect-trinket',{visibleDeath:true,within30:true,freeHand:true}));assert(numerics.subclassRollTraits(p,{kind:'save',name:'Constitution save'}).advantage);
 let a=make('Monk','Astral Self',6);a=apply(a,triggers.executeTriggeredFeature(a,'astral-arms',{triggered:true,rolls:[{total:7}]}));assert.equal(numerics.subclassNumericProfile(a).saveBonuses.str,1);
 let u=make('Warlock','Undead',10);u=apply(u,active.activateSubclassForm(u,'form-of-dread',{result:{total:15}}));assert(active.activeFormProfile(u).damageImmunities.includes('necrotic'));assert(active.activeFormProfile(u).conditionImmunities.includes('frightened'));
});


test('Generic quantity adjustment writes the authoritative amount and projected Ward rejects incapacitated reactions',()=>{
 let p=make('Rogue','Phantom',9);p=apply(p,quant.resourceEvent(p,'collect-trinket',{visibleDeath:true,within30:true,freeHand:true}));const resource=resources.characterResources(p).find(r=>r.key==='soul-trinkets');p=apply(p,resources.adjustResource(p,resource.id,1));assert.equal(quant.quantityProfile(p,'soul-trinkets').current,0);p=apply(p,resources.adjustResource(p,resource.id,-1));assert.equal(quant.quantityProfile(p,'soul-trinkets').current,1);
 let w=make('Wizard','Abjuration',6);w=apply(w,quant.wardCastPatch(w,{school:'Abjuration'},1));assert.throws(()=>quant.absorbWard({...w,conditions:['Stunned']},{amount:2,project:true}),/incapacitated/);
});

test('Defensive reactions apply own-sheet AC only against the triggering attack and retain separate casting restriction',()=>{
 let w=make('Wizard','War Magic',2);w=apply(w,triggers.executeTriggeredFeature(w,'arcane-deflection',{triggered:true,defense:'ac'}));assert.equal(rules.sheetArmorFor({...w,ac:12,autoArmor:false},w.abilities),14);assert(w.activeEffects.some(e=>e.stateKey==='arcane-deflection'&&e.onlyCantrips));w=apply(w,active.endSubclassForm(w,'arcane-deflection-defense'));assert.equal(rules.sheetArmorFor({...w,ac:12,autoArmor:false},w.abilities),12);assert(w.activeEffects.some(e=>e.stateKey==='arcane-deflection'));
 let b=make('Barbarian','Beast',3);b=apply(b,active.startRage(b,{weapon:'Tail'}));b=apply(b,triggers.executeTriggeredFeature(b,'beast-tail-defense',{triggered:true,rolls:[{total:5}]}));assert.equal(rules.sheetArmorFor({...b,ac:12,autoArmor:false},b.abilities),17);
});

test('Armorer UA binds the owning multiclass feature; Kensei rejects source-ineligible selected weapons',()=>{
 let a=make('Wizard','Evocation',6);a.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:3,subclass:'Evocation'},{catalogId:'2014:artificer',name:'Artificer',edition:'2014',level:3,subclass:'Armorer (UA)'}];a.inventory=[{id:'armor',name:'Plate',equipmentIndex:'plate-armor',equipped:true}];a=apply(a,bindings.bindSubclassEquipment(a,'arcane-armor','armor',{confirmed:true,model:'Guardian'}));assert.equal(bindings.armorModelProfile(a).row.catalogId,'2014:artificer');
 let k=make('Monk','Kensei',3);k.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:kensei':{'initial-kensei-melee':['Greatsword']}}};assert.equal(bindings.kenseiWeaponProfile(k,{id:'bad',equipmentIndex:'greatsword'}),null);
});

test('Omen and Tranquility cooldown cannot be ended manually to reroll or bypass source recovery',()=>{
 let s=make();s=apply(s,recovery.consultCosmicOmen(s,{total:4}));assert.throws(()=>effect.endEffect(s,s.activeEffects.find(e=>e.stateKey==='cosmic-omen').id),/rest|cannot/i);
 let t=make('Monk','Tranquility (UA)',3);t=apply(t,recovery.tranquilityCast(t,{confirmed:true}));assert.throws(()=>effect.endEffect(t,t.activeEffects.find(e=>e.stateKey==='tranquility-cooldown').id),/cannot|clock/i);
});

test('Martial Arts substitutions require legal equipment while independent Sun Bolt and UA Kensei retain their own rules',()=>{
 let d=make('Monk','Ascendant Dragon',5);d.inventory=[{id:'armor',equipmentIndex:'chain-mail',equipped:true}];assert.equal(triggers.subclassNaturalAttacks(d)[0].damage,'4');assert.equal(triggers.subclassNaturalAttacks({...d,subclass:'Sun Soul'})[0].damage,'1d6+2');
 let k=make('Monk','Kensei',6);k.abilities={...k.abilities,dex:20,str:10};k.expandedSubclassChoices={'2014:monk':{'2014:subclass:monk:kensei':{'initial-kensei-melee':['Club']}}};k.inventory=[{id:'club',equipmentIndex:'club',name:'Club',equipped:true},{id:'armor',equipmentIndex:'chain-mail',equipped:true}];assert.equal(rules.weaponAttacks(k,k.abilities)[0].damage,'1d4+0');
});

test('Fanatical Focus rerolls the actual source save including another class active save bonus',()=>{
 let c=make('Barbarian','Zealot',13);c.classLevels=[{catalogId:'2014:barbarian',name:'Barbarian',edition:'2014',level:6,subclass:'Zealot'},{catalogId:'2014:fighter',name:'Fighter',edition:'2014',level:7,subclass:'Rune Knight'}];c.saveProf={con:true};c.expandedSubclassChoices={'2014:fighter':{'2014:subclass:fighter:rune-knight':{'runes-known':['Frost','Hill','Fire']}}};c=apply(c,triggers.executeTriggeredFeature(c,'invoke-frost',{triggered:true,equipment:true}));c=apply(c,active.startRage(c));assert.equal(triggers.triggeredFeaturePlan(c,'fanatical-focus',{ability:'con'}).rolls[0],'1d20+10');
});


test('fix I1: damage-only feature callbacks cannot spend an attack cast; real counted attacks preserve critical damage',()=>{
 let c=make();c.expandedSubclassChoices={'2014:druid':{'2014:subclass:druid:stars':{'holding-star-map':['yes']}}};
 const input={confirmed:true,name:'Guiding Bolt',rolls:[{label:'Radiant damage on hit',total:12}]};
 assert.throws(()=>featurecast.executeFeatureCast(c,'star-map',input),/attack|visible/i);
 const d=featurecast.featureCastPlan(c,'star-map',input),seen=[];
 const rolls=featurecast.rollFeatureCast(d,(expression,label,options)=>{seen.push({expression,label,...options});return rules.rollDice(expression,'normal',()=>.999);});
 assert.deepEqual(seen.map(r=>[r.expression,r.kind]),[['1d20+8','attack'],['8d6','damage']]);
 const patch=featurecast.executeFeatureCast(c,'star-map',{...input,rolls});assert.equal(patch.resources.find(r=>r.id.endsWith('resource:star-map-casts')).used,1);
 assert.throws(()=>featurecast.executeFeatureCast(c,'star-map',{...input,rolls:rolls.slice(1)}),/visible|attack/i);
 assert.throws(()=>featurecast.rollFeatureCast(d,()=>null),/visible|roll/i);
 const counted=featurecast.rollFeatureCast({...d,plan:{...d.plan,count:3}},(e)=>rules.rollDice(e,'normal',()=>0));assert.equal(counted.filter(r=>r.kind==='attack').length,3);assert.equal(counted.filter(r=>r.kind==='damage').length,3);
});

test('fix I2: zero-HP triggers preserve original death representations and source-specific condition exceptions',()=>{
 const actions=[['Monk','Long Death',11,c=>triggers.executeTriggeredFeature(c,'mastery-of-death',{triggered:true})],['Warlock','Celestial',14,c=>healing.useHealingFeature(c,'searing-vengeance',{triggered:true,result:{total:10},maxHP:50})],['Warlock','Undying',6,c=>healing.useHealingFeature(c,'defy-death',{triggered:true,result:{total:8},maxHP:50})],['Warlock','Undead',10,c=>recovery.useCooldownFeature(c,'necrotic-husk',{triggered:true,cooldown:{total:2},result:{total:20}})],['Warlock','Undead (UA)',10,c=>recovery.useCooldownFeature(c,'mortal-husk',{triggered:true,cooldown:{total:2},result:{total:20}})]];
 for(const [cls,sub,lvl,use] of actions){const c={...make(cls,sub,lvl),hp:{current:0,max:50,temp:0}};
  for(const dead of [{deathSaves:{failure:3}},{dead:true},{instantDeath:true},{exhaustion:6},{conditions:['Dead']}])assert.throws(()=>use({...c,...dead}),/dead|reviv/i,`${sub} ${JSON.stringify(dead)}`);
  assert(use({...c,conditions:['Poisoned']}).hp.current>0);
 }
 const vengeance=actions[1][3],celestial={...make('Warlock','Celestial',14),hp:{current:0,max:50,temp:0},conditions:['Unconscious','Stunned','Poisoned']};assert.equal(vengeance(celestial).hp.current,25);
 assert.throws(()=>actions[3][3]({...make('Warlock','Undead',10),hp:{current:0,max:50,temp:0},conditions:['Unconscious']}),/incapacitated|conscious/i);
 assert(actions[4][3]({...make('Warlock','Undead (UA)',10),hp:{current:0,max:50,temp:0},conditions:['Unconscious']}).hp.current===1);
 const paralyzed={...make('Monk','Long Death',11),hp:{current:0,max:50,temp:0},conditions:['Paralyzed']};assert.equal(actions[0][3](paralyzed).hp.current,1);assert.deepEqual(paralyzed.conditions,['Paralyzed']);
});

test('fix I3: compulsory deflection and Wild Magic states reject End while source clock and attack resolution remain legal',()=>{
 let c=apply(make('Wizard','War Magic',6),triggers.executeTriggeredFeature(make('Wizard','War Magic',6),'arcane-deflection',{triggered:true,defense:'ac'}));
 const restriction=c.activeEffects.find(e=>e.stateKey==='arcane-deflection'),defense=c.activeEffects.find(e=>e.stateKey==='arcane-deflection-defense');assert.throws(()=>effect.endEffect(c,restriction.id),/cannot.*end/i);c=apply(c,effect.endEffect(c,defense.id));assert(c.activeEffects.some(e=>e.id===restriction.id));c=apply(c,effect.advanceEffectTime(c,{startTurn:true}));c=apply(c,effect.advanceEffectTime(c,{endTurn:true}));assert(!c.activeEffects.some(e=>e.id===restriction.id));
 const older={...c,activeEffects:[Object.fromEntries(Object.entries(restriction).filter(([key])=>key!=='canEnd'))]};assert.throws(()=>effect.endEffect(older,restriction.id),/cannot.*end/i);
 for(const n of [49,95]){let s=make('Sorcerer','Wild Magic',5);s=apply(s,tables.applySubclassTable(s,'sorcerer-wild-magic',{total:n},{triggered:true}));assert.throws(()=>effect.endEffect(s,s.activeEffects[0].id),/cannot.*end/i);assert.equal(apply(s,effect.advanceEffectTime(s,{seconds:60})).activeEffects.length,0);}
});

test('fix I4: table outcomes carry typed source saves/attacks while table and duration dice remain raw',()=>{
 const negative=make('Sorcerer','Wild Magic',5);assert.doesNotThrow(()=>tables.applySubclassTable(negative,'sorcerer-wild-magic',{total:77},{triggered:true,rolls:[{total:-1}]}));
 const s=make('Sorcerer','Wild Magic',5);assert.deepEqual(tables.tableExtraRolls(s,'sorcerer-wild-magic',{total:77}).map(r=>[r.kind,r.ability,r.expression]),[['save','wis','1d20+4']]);assert.equal(tables.tableExtraRolls(s,'sorcerer-wild-magic',{total:73})[0].kind,'raw');assert.equal(tables.tableExtraRolls(s,'sorcerer-wild-magic',{total:7})[1].ability,'dex');
 let b=make('Bard','Spirits',6);b=apply(b,tables.applySubclassTable(b,'spirit-tales',{total:2},{triggered:true}));assert.equal(tables.spiritTalePlan(b).rolls[0].kind,'attack');assert.equal(tables.spiritTalePlan(b).rolls[0].ability,'cha');
});

test('fix I5: active Flight and Boldness reach shared consumers only for their own active source duration',()=>{
 let c=make('Artificer','Alchemist',6);const drink=(c,n)=>{c=apply(c,tables.createElixir(c,{confirmed:true,result:{total:n}}));return apply(c,tables.drinkElixir(c,c.subclassElixirs.at(-1).id,{confirmed:true,recipient:'self'}));};c=drink(c,5);assert.equal(active.activeFormProfile(c).flyingSpeed,10);c=drink(c,4);assert.deepEqual(numerics.subclassRollTraits(c,{kind:'attack'}).bonusDice,['1d4']);assert.deepEqual(numerics.subclassRollTraits(c,{kind:'save'}).bonusDice,['1d4']);assert.deepEqual(numerics.subclassRollTraits(c,{kind:'check'}).bonusDice,[]);assert.deepEqual(numerics.subclassRollTraits(c,{kind:'damage'}).bonusDice,[]);
 c=apply(c,effect.advanceEffectTime(c,{seconds:60}));assert.deepEqual(numerics.subclassRollTraits(c,{kind:'attack'}).bonusDice,[]);assert.equal(active.activeFormProfile(c).flyingSpeed,10);c=apply(c,effect.advanceEffectTime(c,{seconds:540}));assert.equal(active.activeFormProfile(c).flyingSpeed,0);
});
test('Drake essence resists typed Wild Magic fireball and Bastion damage once after reduction',async()=>{const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});const drake=await server.ssrLoadModule('/src/lib/subclassDrakewarden.js');await server.close();const multiclass=(subclass)=>{let c=make('Sorcerer',subclass,13);c.classLevels=[{catalogId:'2014:sorcerer',name:'Sorcerer',edition:'2014',level:6,subclass},{catalogId:'2014:ranger',name:'Ranger',edition:'2014',level:7,subclass:'Drakewarden'}];return apply(c,drake.summonDrake(c,{confirmed:true,essence:'fire'}));};let w=multiclass('Wild Magic');assert.equal(drake.drakeResistsDamage(w,'Fire'),true);w=apply(w,tables.applySubclassTable(w,'sorcerer-wild-magic',{total:7},{triggered:true,rolls:[{total:24},{total:1}]}));assert.equal(w.hp.current,18);let b=multiclass('Clockwork Soul');b=apply(b,healing.useHealingFeature(b,'bastion-of-law',{n:1,recipient:'self',triggered:true,maxHP:50}));let out=healing.consumeBastion(b,{n:1,result:{total:4},rawDamage:20,damageType:'fire',triggered:true,resistant:true});assert.equal(out.patch.hp.current,22);});
test('Arcane Ward applies Drake resistance after ward absorption exactly once',async()=>{const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});const drake=await server.ssrLoadModule('/src/lib/subclassDrakewarden.js');await server.close();let c=make('Wizard','Abjuration',9);c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Abjuration'},{catalogId:'2014:ranger',name:'Ranger',edition:'2014',level:7,subclass:'Drakewarden'}];c=apply(c,drake.summonDrake(c,{confirmed:true,essence:'fire'}));c=apply(c,quant.wardCastPatch(c,{name:'Shield',level:1,school:'Abjuration'},1));const result=quant.absorbWard(c,{amount:4,rawDamage:20,damageType:'fire'});assert.equal(result.patch.hp.current,22);});
test('pending Reflexive Resistance applies once after Arcane Ward absorption',async()=>{const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});const drake=await server.ssrLoadModule('/src/lib/subclassDrakewarden.js');await server.close();let c=make('Wizard','Abjuration',17);c.classLevels=[{catalogId:'2014:wizard',name:'Wizard',edition:'2014',level:2,subclass:'Abjuration'},{catalogId:'2014:ranger',name:'Ranger',edition:'2014',level:15,subclass:'Drakewarden'}];c=apply(c,drake.summonDrake(c,{confirmed:true,essence:'fire'}));c=apply(c,quant.wardCastPatch(c,{name:'Shield',level:1,school:'Abjuration'},1));c=apply(c,drake.armDrakeResistance(c,{target:'self',confirmed:true}));const result=quant.absorbWard(c,{amount:4,rawDamage:20,damageType:'cold'});assert.equal(result.patch.hp.current,22);assert.ok(!result.patch.activeEffects.some(e=>e.stateKey==='drake-reflexive-resistance'));});
