import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCatalogService} from '../src/lib/catalog.js';
import {featureChoicePlan} from '../src/lib/featureChoices.js';

const service=createCatalogService({fetcher:async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile('public'+url,'utf8'))})});
const classes=await service.load('3.5/classes');
const dragonShaman=classes.find(record=>record.sourceId==='classes/dragon-shaman-101');
assert(dragonShaman,'exact Dragon Shaman source record must exist');

function character(alignment){
  return {
    id:'dragon-shaman-choice-eligibility',ruleset:'3.5',mechanics:'3.5',alignment,level:1,
    classLevels:[{catalogId:dragonShaman.catalogId,name:dragonShaman.name,edition:'3.5',level:1,definition:dragonShaman}],
    abilities:{str:12,dex:12,con:14,int:12,wis:12,cha:16},
    feats:[],actions:[],resources:[],spells:[],featureChoices:{},trainingGrants:[]
  };
}

function totemGroup(alignment,picks={}){
  const plan=featureChoicePlan(character(alignment),null,picks,{});
  const group=plan.groups.find(item=>item.label==='Totem Dragon');
  assert(group,`Totem Dragon choice must be prompted for ${alignment}`);
  return group;
}

const lawfulGood=totemGroup('Lawful Good');
assert.deepEqual(lawfulGood.options,['Bronze','Gold','Silver'],'Lawful Good must only see source-legal dragon totems');
const lawfulGoodBlack=totemGroup('Lawful Good',{[lawfulGood.id]:['Black']});
assert.equal(lawfulGoodBlack.valid,false,'an alignment-ineligible totem must be rejected even if it exists in source options');
const lawfulGoodGold=totemGroup('Lawful Good',{[lawfulGood.id]:['Gold']});
assert.equal(lawfulGoodGold.valid,true,'an alignment-eligible totem must remain selectable');

const chaoticEvil=totemGroup('CE');
assert.deepEqual(chaoticEvil.options,['Black','Red','White'],'alignment abbreviations must use the same source constraints as full names');

const unknown=totemGroup('');
assert.equal(unknown.options.length,10,'missing alignment must not silently discard source options before the character supplies alignment');

console.log('PASS option-specific alignment eligibility filters reviewed 3.5 source choices.');
