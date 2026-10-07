import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {reconcileClassGrants} from '../src/lib/classIntegration.js';
import {featureChoicePlan,applyFeatureChoices} from '../src/lib/featureChoices.js';
import {requirements} from '../src/lib/advancement.js';

const rows=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8'));
const exact=id=>normalizeCatalogRecord(rows.find(row=>row.id===id),'dndtools','classes');
const character=(definition,level,cha=16)=>reconcileClassGrants({ruleset:'3.5',mechanics:'3.5',level,abilities:{str:16,dex:16,con:16,int:16,wis:16,cha},classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition}],actions:[],feats:[],resources:[],spells:[],featureChoices:{}});

const devotee=exact('classes/arcane-devotee-657');
assert(devotee.prerequisites.some(p=>p.text==='Enlarge Spell'),'recover missing feat prerequisite');
assert(!devotee.classSkills.includes('Swim'),'armor penalty prose must not become class skills');
assert(devotee.levelGrants.every(g=>g.description.length>=12),'reviewed descriptions must reach the catalog');
assert.equal(character(devotee,1).resources.find(r=>r.name==='Reach of the Holy')?.max,4);
assert.equal(character(devotee,1,6).resources.find(r=>r.name==='Reach of the Holy')?.max,1);
assert(!character(devotee,1).grantedFeatures.some(f=>f.name==='Divine Shroud'),'later summaries must not grant early features');
assert.equal(character(devotee,5).resources.find(r=>r.name==='Divine Shroud')?.max,1);

const champion=exact('classes/divine-champion-661');
assert.equal(character(champion,5).resources.find(r=>r.name==='Lay on Hands')?.max,15);
assert(!character(champion,5,8).resources.some(r=>r.name==='Lay on Hands'));
assert.deepEqual(champion.proficiencies.map(p=>p.index).sort(),['martial-weapons','simple-weapons']);
assert.equal(character(exact('classes/cipher-adept-688'),1).feats.filter(f=>f.name==='Improved Unarmed Strike').length,1);

const mage=exact('classes/escalation-mage-467');
assert.equal(character(mage,6).resources.filter(r=>r.name.startsWith('Escalation')).length,1,'modes share one pool');
assert.equal(character(mage,6).resources.find(r=>r.name==='Escalation')?.max,6);
const slayer=exact('classes/gnome-giant-slayer-314');
assert(character(slayer,1).grantedFeatures.some(f=>f.name==='Favored Enemy (Giant)'),'preserve source-qualified feature identity');
const knight=exact('classes/thayan-knight-337');
assert(character(knight,1).trainingGrants.some(g=>g.proficiencies?.some(p=>p.index==='tower-shields')));
const featContext={feats:['Weapon Specialization','Weapon Specialization (longsword)','Blind-Fight'].map(name=>({name,edition:'3.5',featType:'Fighter',prerequisites:[]}))};
const knightChoice=featureChoicePlan(character(knight,3),null,{},featContext).groups.find(g=>g.label==='Fighter Feat');
assert.deepEqual(knightChoice?.options,['Blind-Fight'],'source exclusions also apply to specialized feat variants');
assert.throws(()=>applyFeatureChoices(character(knight,3),null,{[knightChoice.id]:['Weapon Specialization']},featContext),/Complete/);
const excludedContext={feats:featContext.feats.filter(f=>f.name!=='Blind-Fight')};
const noOptions=featureChoicePlan(character(knight,3),null,{},excludedContext).groups.find(g=>g.label==='Fighter Feat');
assert.equal(noOptions.options.length,0);
assert.throws(()=>applyFeatureChoices(character(knight,3),null,{[noOptions.id]:['Weapon Specialization']},excludedContext),/Complete/,'an empty constrained list cannot turn into arbitrary input');
const cipher=character(exact('classes/cipher-adept-688'),4);
const eligibilityContext={feats:[{name:'Mobility',edition:'3.5',prerequisites:[{kind:'ability',text:'Dexterity 19'}]},{name:'Alertness',edition:'3.5',prerequisites:[]}]};
const eligibleChoice=featureChoicePlan(cipher,null,{},eligibilityContext).groups.find(g=>g.label==='Bonus Feat');
assert.deepEqual(eligibleChoice.options,['Alertness'],'explicit feat lists must enforce published prerequisites and require resolved references');
assert.throws(()=>applyFeatureChoices(cipher,null,{[eligibleChoice.id]:['Mobility']},eligibilityContext),/Complete/);
const chosenCipher=applyFeatureChoices(cipher,null,{[eligibleChoice.id]:['Alertness']},eligibilityContext);
assert(chosenCipher.feats.some(f=>f.name==='Alertness'&&f.sourceClassId===cipher.classLevels[0].catalogId));
const night=character(exact('classes/nightcloak-971'),8).resources.find(r=>r.name==='Minions of Night');
assert.equal(night?.max,1);
assert.equal(night?.reset,'none','weekly uses must not recover on a daily rest');
assert.match(night?.recoveryText,/week/);
assert.equal(character(exact('classes/forest-reeve-227'),1).actions.find(a=>a.name==="Earth's Defender")?.type,'Move action');
const cloud=exact('classes/cloud-anchorite-499');
assert.equal(requirements(cloud,{feats:[{name:'Improved Unarmed Strike'}]}).find(p=>p.text.startsWith('Improved Unarmed Strike'))?.status,'met','a display alias must not become an extra feat specialization');
assert.equal(requirements(champion,{feats:[{name:'Weapon Focus (longsword)'}]}).find(p=>p.text.includes("deity's favored weapon"))?.status,'manual','patron weapon condition must not reject valid weapon-specific feats');
for(const [id,levels] of [['classes/cipher-adept-688',[4,8]],['classes/cloud-anchorite-499',[3,7]],['classes/divine-champion-661',[2,4]],['classes/blade-bravo-726',[3,6,9]],['classes/stormtalon-746',[2,4,6,8,10]],['classes/sword-of-righteousness-155',[1,2,3]]]){
 const groups=featureChoicePlan(character(exact(id),levels.at(-1)),null).groups.filter(g=>g.choiceKind==='feat');
 assert.deepEqual(groups.map(g=>[g.level,g.required]),levels.map(level=>[level,1]),id+' grants one feat per milestone, not cumulative counts');
}
assert(character(cloud,1).grantedFeatures.some(f=>f.name==='Monk Abilities'),'source prose grants absent from advancement tables must be included at the reviewed level');
const special=character(exact('classes/crimson-scourge-262'),1).grantedFeatures.find(f=>f.name==='Special Dispensation');
assert.match(special?.description,/Special Dispensation feat/,'show conditional feat benefit, not the later Swift Tracker benefit');
assert.doesNotMatch(special.description,/half.hour/);
const zeroDefinition={catalogId:'test:zero-pool',name:'Zero Pool',edition:'3.5',levelGrants:[{level:1,name:'Test Pool',description:'Once per day when the ability modifier is positive.',resource:{levelTimesAbility:1,ability:'cha',abilityMinimum:0,period:'day'}}]};
assert(!character(zeroDefinition,1,8).resources.some(r=>r.name==='Test Pool'),'an explicit zero pool must not fall back to prose usage');

const unknown=normalizeCatalogRecord({...rows.find(r=>r.id==='classes/arcane-devotee-657'),id:'classes/unreviewed-same-name'},'dndtools','classes');
assert.equal(unknown.reviewBatch,undefined,'same-name records cannot inherit exact-source review');
console.log('PASS reviewed wave metadata: source recovery, training, fixed feats, level gates, resource formulas, shared pool, qualified names, weekly recovery.');
