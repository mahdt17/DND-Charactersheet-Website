import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const C=await server.ssrLoadModule('/src/lib/archivistCampaign.js'),D=await server.ssrLoadModule('/src/data/archivistCampaign.js');
 const E=await server.ssrLoadModule('/src/lib/editions.js'),R=await server.ssrLoadModule('/src/lib/resources.js'),G=await server.ssrLoadModule('/src/GuidedSetup.jsx');
 const A=await server.ssrLoadModule('/src/lib/advancement.js'),T=await server.ssrLoadModule('/src/lib/training.js');
 let c=C.createArchivistCampaign();
 assert.equal(G.classOptions('2014').filter(x=>D.campaignClasses.some(d=>d.catalogId===x.catalogId)).length,3);
 assert(A.prestige(D.campaignClasses.find(x=>x.campaignKind==='thrallherd')),'Thrallherd cannot be selected as a starting class');
 const adjusted=C.reconcileCampaign({...c,archivistCampaign:{...c.archivistCampaign,rulings:{archivistHitDie:8,proficiencies:[{index:'martial-weapons',name:'Martial weapons'}]}}});
 assert.equal(adjusted.classLevels[0].definition.hit_die,8);
 assert.deepEqual(T.startingProficiencies(adjusted).map(x=>x.index),['martial-weapons']);
 assert.deepEqual(E.characterSlots(c).slice(0,4),[0,4,3,0]);
 assert.equal(R.characterResources(c).find(r=>r.id===D.campaignPPId).max,3);
 c={...c,...R.adjustResource(c,D.campaignPPId,1)};assert.equal(c.powerPointsUsed,1);
 c=C.useCampaignPower(c,'mindlink');assert.equal(R.characterResources(c).find(r=>r.id===D.campaignPPId).used,2);
 c={...c,...R.adjustResource(c,D.campaignDarkId,1)};assert.equal(c.archivistCampaign.darkUsed,1);
 c={...c,...R.restResources(c,'short')};assert.equal(c.powerPointsUsed,2);assert.equal(c.archivistCampaign.darkUsed,1);
 c={...c,...R.restResources(c,'long')};assert.equal(c.powerPointsUsed,0);assert.equal(c.archivistCampaign.darkUsed,0);
 c=C.advanceArchivistCampaign(c);assert.deepEqual(E.characterSlots(c).slice(0,4),[0,4,3,0]);
 c=C.advanceArchivistCampaign(c);assert.deepEqual(E.characterSlots(c).slice(0,4),[0,4,3,2]);
 assert(E.permittedSpells({...c,classLevels:[c.classLevels[0]],level:5}).some(s=>s.name==='Cure Wounds'));
 const removed={...c,ruleset:'2014',className:'Fighter',classDefinition:{name:'Fighter',edition:'2014'},classLevels:[],resources:R.characterResources(c)};
 assert(!R.characterResources(removed).some(r=>r.campaignManaged));
 console.log('PASS campaign class selection, multiclass slots, shared tracker/action spending, rest and removal');
}finally{await server.close();}
