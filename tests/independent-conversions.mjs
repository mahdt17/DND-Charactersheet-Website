import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const C=await server.ssrLoadModule('/src/lib/archivistCampaign.js'),D=await server.ssrLoadModule('/src/data/archivistCampaign.js');
 const E=await server.ssrLoadModule('/src/lib/editions.js'),R=await server.ssrLoadModule('/src/lib/resources.js');
 const A=await server.ssrLoadModule('/src/lib/advancement.js'),P=await server.ssrLoadModule('/src/lib/campaignPsionics.js');
 const row=(definition,level)=>({catalogId:definition.catalogId||'2014:'+definition.name.toLowerCase(),name:definition.name,edition:'2014',definition,level});
 const build=(rows)=>({...C.createArchivistCampaign('Independent'),race:'Human',level:rows.reduce((n,r)=>n+r.level,0),className:rows[0].name,classDefinition:rows[0].definition,classLevels:rows,archivistCampaign:{},feats:[]});
 const a=D.campaignClasses[0],p=D.campaignClasses[1],t=D.campaignClasses[2];
 let c=build([row(a,4),row(p,1)]);
 assert.deepEqual(C.campaignFeats(c),[],'class levels must never choose the PDF feats');
 assert.equal(P.extendedPsionProfile(c).powers.length,0,'powers must be selected');
 assert.equal(C.campaignProfile(c).psicrystalBonus,0,'no crystal without affinity');
 assert.equal(C.campaignProfile({...c,abilities:{...c.abilities,int:18}}).ppMax,4,'level-1 PP includes ability bonus');
 assert(E.levelRecord({...c,classLevels:undefined,classDefinition:a,level:3},4).features.some(f=>/Ability Score Improvement/i.test(f.name)));
 assert.equal(A.eligibleClass(c,t,'prestige').allowed,false,'Mindlink is an entry prerequisite');
 c=P.learnCampaignPower(c,{...D.campaignPowers[0],level:1});
 assert.equal(A.eligibleClass(c,t,'prestige').allowed,true);
 const wizard={catalogId:'2014:wizard',name:'Wizard',edition:'2014',hit_die:6};
 const mixed=build([row(a,3),row(wizard,2)]);
 assert.deepEqual(E.characterSlots(mixed).slice(0,4),[0,4,3,2]);
 assert.equal(C.campaignProfile(mixed).maxSpellLevel,2,'pooled slots must not unlock higher prayerbook spells');
 assert(E.classFeatures(mixed).some(f=>f.className==='Wizard'),'other class features remain visible');
 const fighter={catalogId:'2014:fighter',name:'Fighter',edition:'2014',hit_die:10};
 assert(R.characterResources(build([row(a,2),row(fighter,2)])).some(r=>r.name==='Action Surge'));
 const saved=C.useDarkKnowledge(C.createArchivistCampaign(),'tactics',{check:25,target:'Undead'});
 const migrated=C.reconcileCampaign(saved);
 assert.equal(migrated.archivistCampaign.darkUsed,1);
 const grownPsion={...migrated,level:6,classLevels:migrated.classLevels.map(r=>r.name==='Psion (Telepath)'?{...r,level:2}:r)};
 assert(C.campaignProfile(grownPsion).ppMax>3,'old level-one PP default must not freeze future progression');
 assert(migrated.feats.some(f=>f.name==='Reach Spell'),'preserve previously granted feats');
 const later={...migrated,level:9,classLevels:migrated.classLevels.map(r=>r.name==='Archivist'?{...r,level:8}:r)};
 assert(!C.campaignFeats(later).some(f=>f.name==='Draconic Archivist'),'migration must not keep granting future PDF feats');
 assert.deepEqual(C.reconcileCampaign(migrated),migrated,'migration is idempotent');
 let pure=build([row(p,1)]);pure.abilities.int=20;pure=P.learnCampaignPower(pure,{...D.campaignPowers[0],level:1});pure=C.useCampaignPower(pure,'mindlink');
 for(let level=2;level<=20;level++){pure=A.advanceClass(pure,p,{hpGain:4});assert.equal(C.campaignProfile(pure).manifesterLevel,level);assert.equal(pure.powerPointsUsed,1);assert.equal(P.extendedPsionProfile(pure).maxPowerLevel,Math.min(9,Math.ceil(level/2)));}
 let scholar=build([row(a,1)]);for(let level=2;level<=20;level++){scholar=A.advanceClass(scholar,a,{hpGain:4});assert.equal(C.campaignProfile(scholar).maxSpellLevel,Math.min(9,Math.ceil(level/2)));}
 let herd=build([row(p,5)]);herd.abilities.int=20;herd=P.learnCampaignPower(herd,{...D.campaignPowers[0],level:1});
 for(let level=1;level<=10;level++){herd=A.advanceClass(herd,t,{flow:'prestige',hpGain:4});assert.equal(C.campaignProfile(herd).manifesterLevel,5+Math.min(8,level-1));}
 const cure=E.catalogSpells('2014').find(s=>s.name==='Cure Wounds');let book=C.acquireCampaignSpell(mixed,cure);book=C.prepareCampaignSpell(book,cure.catalogId,true);book=C.castCampaignSpell(book,cure.catalogId,{slot:3});assert.equal(book.slotsUsed[3],1,'Archivist may upcast using pooled slots without learning tier-3 spells');
 console.log('PASS independent converted class choices, multiclass pooling, prestige entry and save migration');
}finally{await server.close();}
