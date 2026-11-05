import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createArchivistCampaign} from '../src/lib/archivistCampaign.js';
import {manifestationOptions} from '../src/lib/campaignPsionics.js';
import {refreshConversionFeatDescriptions} from '../src/lib/conversionFeatures.js';
const make=()=>createArchivistCampaign();
test('basic powers expose only eligible crystal modes and armor augmentation',()=>{
 const c=make(),mindlink={id:'mindlink',range:'30 feet',cost:1},armor={id:'inertial-armor',range:'Self',cost:1};
 assert.deepEqual(manifestationOptions(c,mindlink).modes.map(x=>x.id),['normal']);
 assert.deepEqual(manifestationOptions(c,armor).modes.map(x=>x.id),['normal','share']);
 for(const power of [mindlink,armor,{id:'attraction',cost:1}]){
  const options=manifestationOptions(c,power);
  assert.equal(options.discount,false);
  assert.equal(options.targetTypes,false);
  assert.equal(options.typeWaiver,0);
 }
 assert.equal(manifestationOptions(c,armor).augmentation,0);
 const higher={...c,classLevels:c.classLevels.map((row,i)=>i?{...row,level:3}:row)};
 assert.equal(manifestationOptions(higher,armor).augmentation,2);
 assert(!manifestationOptions(higher,armor).modes.some(x=>x.id==='touch'));
});
test('advanced mode unlocks use real Psion levels and a living crystal',()=>{
 const c=make(),power={id:'custom',range:'Touch',cost:1};
 const higher={...c,classLevels:c.classLevels.map((row,i)=>i?{...row,level:15}:row),archivistCampaign:{...c.archivistCampaign,psicrystal:{distance:0}}};
 assert.deepEqual(manifestationOptions(higher,power).modes.map(x=>x.id),['normal','touch','channel']);
 higher.archivistCampaign.psicrystal.destroyed=true;
 assert.deepEqual(manifestationOptions(higher,power).modes.map(x=>x.id),['normal']);
});
test('imported converted feats use approved current rules and retain identities and notes',()=>{
 const c=make();
 c.feats=[{id:'crystal',name:'Psicrystal Affinity',description:'No autonomous casting or revival is assumed.',notes:'Private character notes'},{id:'chain',name:'Chain Spell',description:'Selected class level only'},{id:'other',name:'Psicrystal Affinity',edition:'3.5',description:'Original source'}];
 const next=refreshConversionFeatDescriptions(c);
 assert.match(next.feats[0].description,/after your death/);
 assert.equal(next.feats[0].id,'crystal');
 assert.equal(next.feats[0].notes,'Private character notes');
 assert.match(next.feats[1].description,/distinct secondary targets/);
 assert.equal(next.feats[2].description,'Original source');
 assert.equal(c.feats[0].description,'No autonomous casting or revival is assumed.');
});
test('converted feat rules migration retains editable custom descriptions as notes',()=>{
 const c=make();c.feats=[{id:'reach',name:'Reach Spell',description:'Ask the DM about my wand',notes:'Existing note'}];
 const next=refreshConversionFeatDescriptions(c);assert.match(next.feats[0].notes,/Ask the DM about my wand/);assert.match(next.feats[0].notes,/Existing note/);
 assert.deepEqual(refreshConversionFeatDescriptions(next),next);
});
