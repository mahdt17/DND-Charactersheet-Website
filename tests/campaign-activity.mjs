import assert from 'node:assert/strict';
import {campaignActionBlockReason,assertCampaignCanAct} from '../src/lib/campaignActivity.js';

const char={ruleset:'2014',level:5,classLevels:[{edition:'2014',level:4,definition:{edition:'2014',catalogId:'homebrew:darkdonte:archivist'}}],hp:{current:22,max:22},conditions:[]};
assert.equal(campaignActionBlockReason(char),'');
assert.doesNotThrow(()=>assertCampaignCanAct(char));
for(const state of [{hp:{current:0,max:22}},{deathSaves:{failure:3}},{archivistCampaign:{dead:true}},{exhaustion:6},...['Dead','Unconscious','Incapacitated','Paralyzed','Stunned','Petrified'].map(name=>({conditions:[name]})),{conditions:[{name:'Stunned',rounds:2}]},{conditions:'Poisoned, unconscious'}]){
 const blocked={...char,...state};
 assert.match(campaignActionBlockReason(blocked),/cannot act|reviv/i);
 assert.throws(()=>assertCampaignCanAct(blocked),/cannot act|reviv/i);
}
for(const name of ['Poisoned','Blinded','Prone','Frightened'])assert.doesNotThrow(()=>assertCampaignCanAct({...char,conditions:[name]}));
assert.equal(campaignActionBlockReason({...char,ruleset:'3.5',hp:{current:0}}),'','this guard does not change original 3.5 rules');
assert.equal(campaignActionBlockReason({...char,classLevels:[],classDefinition:{name:'Wizard',edition:'2014'},hp:{current:0}}),'','ordinary class behavior is outside the conversion guard');
console.log('PASS converted character action availability, incapacitation, death and source isolation');
