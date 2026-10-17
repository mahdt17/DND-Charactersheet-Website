import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const e=await server.ssrLoadModule('/src/lib/editions.js'),a=await server.ssrLoadModule('/src/lib/advancement.js');
 const f=await server.ssrLoadModule('/src/lib/featMagic.js'),cast=await server.ssrLoadModule('/src/lib/featCasting.js');
 const {validFeatSelection}=await server.ssrLoadModule('/src/lib/featSelection.js');
 const {reconcileClassGrants}=await server.ssrLoadModule('/src/lib/classIntegration.js');
 const named=(name,edition='2014')=>e.allSpells.find(s=>s.name===name&&s.edition===edition);
 const make=(name,edition='2014',level=3,subclass='')=>({name:'Test',className:name,ruleset:edition,classDefinition:{name,edition},level,subclass,abilities:{str:14,dex:14,con:14,int:16,wis:18,cha:12},abilityBonuses:{},feats:[],spells:[],slotsUsed:{}});
 for(const edition of ['2014','2024'])for(const [name,subclass] of [['Fighter','Eldritch Knight'],['Rogue','Arcane Trickster']])for(let level=1;level<=20;level++){
  const c=make(name,edition,level,subclass),slots=e.characterSlots(c);
  assert.equal(e.castingKey(c),'int');assert.equal(slots[1],level<3?0:level===3?2:level<7?3:4);
  assert.equal(slots[2],level<7?0:level<10?2:3);assert.equal(slots[3],level<13?0:level<16?2:3);assert.equal(slots[4],level<19?0:1);
  assert.equal(e.spellAccess(c,named('Shield',edition)).allowed,level>=3);
  assert(!e.spellAccess(c,named('Cure Wounds',edition)).allowed);
  assert.equal(e.spellAccess(c,named('Fireball',edition)).allowed,level>=13);
  assert.equal(e.spellCounts(c).cantrips,level<3?0:level<10?2:3);
  const derived=reconcileClassGrants(c);assert.equal(derived.spells.filter(s=>s.name==='Mage Hand').length,name==='Rogue'&&level>=3?1:0);
 }
 const knight=make('Fighter','2014',7,'Eldritch Knight'),sleep=named('Sleep'),charm=named('Charm Person');
 assert(e.spellAccess(knight,sleep).allowed);assert(!e.spellAccess({...knight,spells:[sleep]},charm).allowed);
 assert(e.spellAccess({...knight,spells:[sleep]},sleep).allowed,'An existing exception remains castable');
 assert(e.spellAccess({...knight,level:8,spells:[sleep]},charm).allowed);
 assert(!e.spellAccess({...knight,spells:[{name:'Sleep',level:'1st-level spell',school:'Enchantment'}]},charm).allowed,'Legacy spell shapes consume school choices');
 assert(e.spellAccess({...knight,ruleset:'2024',classDefinition:{edition:'2024'},spells:[named('Sleep','2024')]},named('Charm Person','2024')).allowed);
 for(const edition of ['2014','2024']){
  const ek=make('Fighter',edition,7,'Eldritch Knight'),wizard=make('Wizard',edition,2);
  const rows=[ek,wizard].map(c=>a.characterClasses(c)[0]),multi={...ek,level:9,classLevels:rows};
  assert.deepEqual(e.characterSlots(multi),[0,4,3,0,0,0,0,0,0,0]);assert.equal(e.spellSlotPools(multi).mode,'automatic');
  assert(!e.spellAccess(a.classCharacter(multi,rows[1]),named('Misty Step',edition)).allowed,'Shared second-level slots do not unlock Wizard 2 spells');
  const sole={...ek,level:9,classLevels:[rows[0],a.characterClasses(make('Barbarian',edition,2))[0]]};assert.deepEqual(e.characterSlots(sole),[0,4,2,0,0,0,0,0,0,0]);
 }
 const initiate=(edition='2024')=>({id:'initiate',name:'Magic Initiate',edition,magicChoices:{list:'Wizard',ability:'wis',cantrips:[`${edition}:fire-bolt`,`${edition}:mage-hand`],spell:`${edition}:magic-missile`}});
 for(const edition of ['2014','2024']){
  const feat=initiate(edition),c={...make('Cleric',edition,3),feats:[feat]},grants=f.featMagicSpells(c);
  assert.equal(grants.length,3);assert(grants.every(s=>e.spellAccess(c,s).allowed));
  assert(!e.permittedSpells(c).some(s=>s.name==='Magic Missile'),'Feat access must not unlock class picks');
  const missile=grants.find(s=>s.level===1);assert.equal(missile.featAbility,edition==='2014'?'int':'wis');
  assert.equal(cast.featCastOptions(c,missile).filter(o=>o.pool==='standard').length,edition==='2024'?2:0);
  const spent={...c,...cast.spendFeatCast(c,missile,{pool:'feat',level:1})};assert.deepEqual(spent.slotsUsed,{});
  assert(!cast.featCastOptions(spent,missile).some(o=>o.pool==='feat'));assert.throws(()=>cast.spendFeatCast(spent,missile,{pool:'feat',level:1}));
  assert.deepEqual(f.restFeatMagic(spent,'short'),{});assert(cast.featCastOptions({...spent,...f.restFeatMagic(spent,'long')},missile).some(o=>o.pool==='feat'));
  assert(!e.spellAccess({...c,feats:[]},missile).allowed);assert.deepEqual(cast.featCastOptions({...c,feats:[]},missile),[]);
  assert.equal(f.featMagicSpells({...c,feats:[{...feat,magicChoices:{...feat.magicChoices,cantrips:[undefined,`${edition}:mage-hand`]}}]}).length,0);
  assert(!f.featMagicState({...feat,magicChoices:{...feat.magicChoices,spell:`${edition}:fireball`}},c).valid);
 }
 const touched={id:'fey',name:'Fey Touched',edition:'2024',magicChoices:{ability:'wis',spell:'2024:bless'}};
 for(const name of ['Bard','Sorcerer','Warlock']){
  const feat={...initiate('2014'),magicChoices:{list:name,cantrips:name==='Bard'?['2014:light','2014:mage-hand']:name==='Warlock'?['2014:eldritch-blast','2014:mage-hand']:['2014:fire-bolt','2014:mage-hand'],spell:name==='Bard'?'2014:healing-word':name==='Warlock'?'2014:charm-person':'2014:magic-missile'}};
  const c={...make(name,'2014',3),feats:[feat]},spell=f.featMagicSpells(c).find(s=>s.level===1);assert(spell);assert(f.featSpellUsesSlots(c,spell));
 }
 const wizardFeat=initiate('2014'),wizard={...make('Wizard','2014',3),feats:[wizardFeat]},wizardSpell=f.featMagicSpells(wizard).find(s=>s.level===1);
 assert(!f.featSpellUsesSlots(wizard,wizardSpell));assert(f.featSpellUsesSlots({...wizard,spells:[{...named('Magic Missile'),prepared:true}]},wizardSpell));
 for(const edition of ['2014','2024']){const shadow={id:'shadow',name:'Shadow Touched',edition,magicChoices:{ability:'int',spell:`${edition}:false-life`}},c={...make('Fighter',edition,4),feats:[shadow]};assert.deepEqual(f.featMagicSpells(c).map(s=>s.name),['False Life','Invisibility']);assert(!f.featMagicState({...shadow,magicChoices:{ability:'int',spell:`${edition}:bless`}},c).valid);}
 const c={...make('Fighter','2024',4),feats:[touched]};assert.equal(f.applyFeatAbilityIncrease(c,'wis',19),20);assert.equal(f.applyFeatAbilityIncrease(c,'wis',20),20);
 assert.equal(f.applyFeatAbilityIncrease({...c,feats:[{...touched,magicChoices:{...touched.magicChoices,applyAbilityIncrease:false}}]},'wis',18),18);
 const grants=f.featMagicSpells(c);assert.deepEqual(grants.map(s=>s.name),['Bless','Misty Step']);
 const spent={...c,...cast.spendFeatCast(c,grants[0],{pool:'feat',level:1})};assert.equal(cast.featCastOptions(spent,grants[1]).length,1,'Each Touched spell has its own use');
 const updated={...touched,magicChoices:{...touched.magicChoices,spell:'2024:command'}};assert(!cast.featCastOptions({...spent,feats:[updated]},f.featMagicSpells({...spent,feats:[updated]})[0]).length,'Editing a choice does not refresh its use');
 const first=initiate(),second={...initiate(),id:'second'};assert(!f.featMagicState(second,{...c,feats:[first]}).valid);
 const cleric={...second,magicChoices:{list:'Cleric',ability:'cha',cantrips:['2024:guidance','2024:light'],spell:'2024:bless'}};assert(f.featMagicState(cleric,{...c,feats:[first]}).valid);assert(validFeatSelection(cleric,{...c,feats:[first]}));
 assert(!validFeatSelection({...touched,magicChoices:{}},make('Fighter','2024',4)));
 const source={...make('Fighter','2024',4),classDefinition:{name:'Fighter',edition:'2024',levelGrants:[{name:'Magic Initiate',kind:'feat',level:3}]}};
 const initial=reconcileClassGrants(source),configured={...initial,feats:initial.feats.map(feat=>({...feat,magicChoices:initiate().magicChoices}))};
 assert.equal(f.featMagicSpells(reconcileClassGrants(configured)).length,3,'Reconciliation retains class-granted feat choices');
 assert.deepEqual(reconcileClassGrants(reconcileClassGrants(configured)),reconcileClassGrants(configured));
 assert.equal(f.featMagicSpells(reconcileClassGrants({...configured,level:2})).length,0,'Removing the source grant removes feat spells');
 console.log('PASS 80 subclass-level progressions, school exceptions, Mage Hand, shared slots, feat selection/access, ability bonuses, independent uses, grant reconciliation and rest recovery');
}finally{await server.close();}
