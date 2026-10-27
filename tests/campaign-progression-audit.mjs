import assert from 'node:assert/strict';
import * as C from '../src/lib/archivistCampaign.js';
import * as D from '../src/data/archivistCampaign.js';
import * as A from '../src/lib/advancement.js';
import * as P from '../src/lib/campaignPsionics.js';
import {removeClassProgression} from '../src/lib/classIntegration.js';
import {psionPoints,psionKnown} from '../src/data/campaignExpansion.js';
import levels from '../src/data/levels.json' with {type:'json'};
import {createServer} from 'vite';
import {psicrystalProfile} from '../src/lib/campaignPsicrystal.js';
const [archivist,psion,thrallherd]=D.campaignClasses;
const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:definition.edition,definition,level});
const build=(rows)=>({...C.createArchivistCampaign('Audit'),race:'Human',level:rows.reduce((n,r)=>n+r.level,0),className:rows[0].name,classDefinition:rows[0].definition,classLevels:rows,abilities:{str:10,dex:10,con:10,int:20,wis:10,cha:16},archivistCampaign:{independentChoices:true},feats:[]});
for(let n=1;n<=20;n++){
 const c=build([row(archivist,n)]),p=C.campaignProfile(c),table=levels.find(x=>x.class.name==='Wizard'&&x.level===n&&!x.subclass).spellcasting;
 assert.equal(p.archivist,n);assert.equal(p.psion,0);assert.equal(p.total,n);assert.equal(p.pb,2+Math.floor((n-1)/4));
 assert.deepEqual(p.slots,[0,...Array.from({length:9},(_,i)=>table[`spell_slots_level_${i+1}`]||0)]);
 assert.equal(p.maxSpellLevel,Math.min(9,Math.ceil(n/2)));assert.equal(p.darkMax,3+Math.floor(n/3));
 assert.equal(p.preparedLimit,n+5);assert.equal(p.cantrips,7);assert.equal(p.growthAllowance,8+2*(n-1));
 assert.deepEqual(C.campaignFeats(c),[]);
 for(const [kind,gate] of Object.entries(C.knowledgeKinds)){
  if(n<gate){assert.throws(()=>C.useDarkKnowledge(c,kind,{target:'Undead',check:35}),/level/);continue;}
  for(const [check,tier] of [[14,0],[15,1],[24,1],[25,2],[34,2],[35,3]]){
   const used=C.useDarkKnowledge(c,kind,{target:'Undead',check});assert.equal(used.archivistCampaign.darkUsed,1);assert.equal(used.archivistCampaign.knowledgeEffect.bonus,tier);assert.equal(used.archivistCampaign.knowledgeEffect.rounds,kind==='dread-secret'?1:10);
  }
 }
 assert.throws(()=>C.useDarkKnowledge(c,'tactics',{check:15}),/target/);assert.throws(()=>C.useDarkKnowledge(c,'tactics',{target:'Undead'}),/check/);
 assert.throws(()=>C.useDarkKnowledge({...c,archivistCampaign:{darkUsed:p.darkMax}},'tactics',{target:'Undead',check:35}),/remain/);
 const used=C.useDarkKnowledge(c,'tactics',{target:'Undead',check:14});assert.equal(C.campaignRest(used,'short').archivistCampaign.darkUsed,1);assert.equal(C.campaignRest(used,'long').archivistCampaign.darkUsed,0);
 const lore={...c,archivistCampaign:{loreSkills:['Arcana','Arcana','Arcana','Arcana']}};assert.equal(C.campaignSkillBonus(lore,'Arcana'),2*[2,7,13,17].filter(x=>n>=x).length);
 for(const ruleset of ['3.5','2024','custom'])assert.equal(C.campaignProfile({...c,ruleset}).active,false);
 const telepath=build([row(psion,n)]),tp=P.extendedPsionProfile(telepath);
 assert.equal(tp.manifesterLevel,n);assert.equal(tp.ppMax,psionPoints[n]+Math.floor(5*n/2));assert.equal(tp.knownLimit,psionKnown[n]);assert.equal(tp.maxPowerLevel,Math.min(9,Math.ceil(n/2)));
 assert.deepEqual(tp.bonusFeatLevels,[1,5,10,15,20].filter(x=>n>=x));assert.equal(C.campaignProfile(telepath).darkMax,0);
}
for(const def of [archivist,psion]){
 let c=build([row(def,1)]);c={...c,powerPointsUsed:2,slotsUsed:{1:1},archivistCampaign:{...c.archivistCampaign,darkUsed:1}};
 for(let n=2;n<=20;n++){c=A.advanceClass(c,def,{hpGain:4});assert.equal(c.level,n);assert.equal(c.powerPointsUsed,2);assert.equal(c.archivistCampaign.darkUsed,1);assert.equal(c.slotsUsed[1],1);}
 assert.throws(()=>A.advanceClass(c,def,{hpGain:4}),/20/);
}
let herd=build([row(psion,5)]);herd=P.learnCampaignPower(herd,{...D.campaignPowers[0],level:1});
assert(A.eligibleClass(herd,thrallherd,'prestige').allowed);
for(const bad of [{...herd,abilities:{...herd.abilities,int:12}},{...herd,skillProf:{Arcana:true}},{...herd,archivistCampaign:{knownPowers:[]}},build([row(psion,4)])])assert(!A.eligibleClass(bad,thrallherd,'prestige').allowed);
for(let n=1;n<=10;n++){herd=A.advanceClass(herd,thrallherd,{flow:'prestige',hpGain:4});assert.equal(C.campaignProfile(herd).manifesterLevel,5+Math.min(8,n-1));assert.equal(P.extendedPsionProfile(herd).psicrystalLevel,5);assert.deepEqual(P.extendedPsionProfile(herd).bonusFeatLevels,[1,5]);}
assert.throws(()=>A.advanceClass(herd,thrallherd,{flow:'prestige',hpGain:4}),/prerequisites/);
const chain={...D.conversionFeats.find(f=>f.name==='Chain Spell'),id:'chain-audit',conversionBonusSlot:'archivist:10'};
const wizard={name:'Wizard',catalogId:'2014:wizard',edition:'2014',hit_die:6,multiclassRequirement:'Intelligence 13'};
let before=build([row(wizard,7),row(archivist,10)]);before.feats=[chain];
const removed=removeClassProgression(before,archivist.catalogId);
assert(!removed.feats.some(f=>f.conversionBonusSlot==='archivist:10'),'removing Archivist removes its saved bonus feat even before explicit source metadata');
const returned=A.advanceClass(removed,archivist,{hpGain:4});
assert.equal(C.campaignProfile(returned).archivist,1);assert(!C.hasConversionFeat(returned,'Chain Spell'),'re-entering Archivist 1 must not keep a level-10 class bonus feat');
const cure={catalogId:'2014:audit-cure',edition:'2014',name:'Audit Cure',level:1,classes:['Cleric'],range:'30 feet'};
let castable=C.acquireCampaignSpell(returned,cure);castable=C.prepareCampaignSpell(castable,cure.catalogId,true);
assert.throws(()=>C.castCampaignSpell(castable,cure.catalogId,{slot:4,chain:true,confirmed:true}),/Chain eligibility/);
for(const definition of [archivist,psion]){
 const kind=C.campaignKind(definition),other=kind==='archivist'?psion:archivist;
 const ordinary={id:'ordinary',name:'Mother Cyst'},otherBonus={id:'other-bonus',name:'Other bonus',conversionBonusSlot:C.campaignKind(other)+':10'};
 const legacyBonus={id:'legacy-bonus',name:'Legacy bonus',conversionBonusSlot:kind+':10'};
 const ownedBonus={id:'owned-bonus',name:'Owned bonus',sourceType:'converted-class-bonus',sourceClassId:definition.catalogId};
 const c=build([row(definition,10),row(other,5)]);c.feats=[ordinary,otherBonus,legacyBonus,ownedBonus];
 assert.deepEqual(removeClassProgression(c,definition.catalogId).feats,[ordinary,otherBonus],'remove only the removed class bonus grants, retaining race/ASI/manual and other-class feats');
}
const original35={name:'Archivist',catalogId:'dndtools:classes/archivist-74',edition:'3.5',hit_die:6};
const mixed=build([row(original35,1),row(archivist,10)]);mixed.feats=[chain];
assert.deepEqual(removeClassProgression(mixed,original35.catalogId).feats,[chain],'removing the original 3.5 Archivist must not remove converted bonus feats');
const deadCrystal=build([row(psion,1)]);
deadCrystal.feats=[{name:'Psicrystal Affinity'}];
deadCrystal.archivistCampaign.psicrystal={damage:11}; // Older saves did not record maxHP or destruction.
assert.equal(psicrystalProfile(deadCrystal).alive,false);
const raised=A.advanceClass(deadCrystal,psion,{hpGain:4});
assert.equal(psicrystalProfile(raised).alive,false,'gaining owner HP through normal class advancement must not revive a destroyed legacy Psicrystal');
const server=await createServer({server:{middlewareMode:true,hmr:false}});
try{
 const choices=await server.ssrLoadModule('/src/ConvertedClassChoices.jsx');
 const E=await server.ssrLoadModule('/src/lib/editions.js');
 for(const definition of [archivist,psion,thrallherd])for(let n=1;n<=(definition===thrallherd?10:20);n++){
  const c=build([row(definition,n)]),kind=C.campaignKind(definition);
  const expected=kind==='archivist'?[10,20].filter(x=>n>=x):kind==='psion'?[1,5,10,15,20].filter(x=>n>=x):[];
  assert.deepEqual(choices.conversionBonusSlots(c).map(x=>x.id),expected.map(x=>kind+':'+x));
  assert.equal(E.levelRecord(c,n).features.some(f=>f.name==='Ability Score Improvement'),[4,8,12,16,19].includes(n),'converted ASIs follow actual class levels');
 }
 let c=build([row(psion,5)]);
 for(let n=0;n<psionKnown[5];n++)c=P.learnCampaignPower(c,{name:'Audit Power '+n,level:1,description:'Approved test power'});
 const first={...D.conversionFeats.find(f=>f.name==='Psicrystal Affinity'),conversionBonusSlot:'psion:1'};
 const incomplete={id:'incomplete',name:'Magic Initiate',catalogId:'2014:magic-initiate',edition:'2014',conversionBonusSlot:'psion:5'};
 c.feats=[first,incomplete];
 assert.equal(choices.conversionChoicesComplete(c),false,'class bonus feats must complete their supported spell/ability choices before saving level-up');
 c.feats=[first,{id:'custom',name:'Approved custom psionic feat',edition:'2014',source:'Homebrew',eligibilityReviewed:true,conversionBonusSlot:'psion:5'}];
 assert.equal(choices.conversionChoicesComplete(c),true,'complete table-approved custom bonus feats remain available');
 c.feats[1]={...c.feats[1],eligibilityReviewed:false};
 assert.equal(choices.conversionChoicesComplete(c),false,'custom bonus feats require their existing table review');
 c.feats[1]={...c.feats[1],eligibilityReviewed:true,edition:'2024'};
 assert.equal(choices.conversionChoicesComplete(c),false,'converted bonus choices must match the character edition');
 const previous=JSON.parse(JSON.stringify(c));
 previous.feats=[first,{id:'saved-choice',name:'Saved approved feat',catalogId:'test:saved-approved',edition:'2014',conversionBonusSlot:'psion:5',prerequisites:[{kind:'ability',ability:'Strength',minimum:13}]}];
 const continuing=JSON.parse(JSON.stringify(previous));
 assert.equal(choices.conversionChoicesComplete(continuing,previous),true,'unchanged saved bonus feats are preserved when their prerequisites are no longer met');
 assert.equal(choices.conversionChoicesComplete(continuing,{...previous,feats:[first]}),false,'the same feat chosen for a new slot must still meet its prerequisites');
 for(const invalid of [incomplete,{id:'unreviewed-new',name:'New custom feat',edition:'2014',source:'Homebrew',conversionBonusSlot:'psion:5'},{id:'wrong-edition-new',name:'New feat',edition:'2024',conversionBonusSlot:'psion:5'}]){
  assert.equal(choices.conversionChoicesComplete({...continuing,feats:[first,invalid]},{...previous,feats:[first]}),false,'previous character context cannot exempt a new incomplete, unreviewed or wrong-edition choice');
 }
 const invalidChanged={...continuing,feats:[first,{...incomplete,id:'saved-choice'}]};
 assert.equal(choices.conversionChoicesComplete(invalidChanged,previous),false,'replacing an existing bonus choice must validate the newly selected feat');
 const priorMagic={...previous,feats:[first,{id:'old-telepathy',catalogId:'2014:telepathic',name:'Telepathic',edition:'2014',conversionBonusSlot:'psion:5',magicChoices:{ability:'int'}}]};
 assert.equal(choices.conversionChoicesComplete({...priorMagic,feats:[first,{...priorMagic.feats[1],magicChoices:{}}]},priorMagic),false,'editing the same saved feat to incomplete choices must be revalidated');
 const legacy=build([row(psion,10)]);
 for(let n=0;n<psionKnown[10];n++)legacy.archivistCampaign.knownPowers=(legacy.archivistCampaign.knownPowers||[]).concat({id:'old-'+n,name:'Saved Power '+n,level:1});
 legacy.feats=[first,...[5,10].map(level=>({id:'expanded-'+level,name:'Expanded Knowledge',catalogId:'test:expanded-knowledge',edition:'2014',conversionBonusSlot:'psion:'+level}))];
 assert.equal(choices.conversionChoicesComplete(JSON.parse(JSON.stringify(legacy)),legacy),true,'repeatable saved Expanded Knowledge selections in separate earned bonus slots survive further advancement');
}finally{await server.close();}
console.log('PASS converted progression audit: all Archivist/Telepath levels 1–20, Thrallherd 1–10, knowledge gates/thresholds/caps/rests, Lore, reserves, retained expenditure, prestige entry, ASIs/bonus grants, complete feat choices, source isolation and class-bonus removal/re-entry.');
