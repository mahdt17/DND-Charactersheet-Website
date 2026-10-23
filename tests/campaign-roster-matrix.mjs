import assert from 'node:assert/strict';
import {campaignClasses} from '../src/data/archivistCampaign.js';
import {createArchivistCampaign,campaignProfile,addCampaignFollower} from '../src/lib/archivistCampaign.js';

// Guide score rows 10–24 and the documented converted lower/25+ defaults.
// Each row is [maximum thrall level, six believer-tier allowances].
const roster=[null,
 [0,0,0,0,0,0,0],[1,0,0,0,0,0,0],[2,0,0,0,0,0,0],[3,0,0,0,0,0,0],[3,0,0,0,0,0,0],
 [4,0,0,0,0,0,0],[5,0,0,0,0,0,0],[5,0,0,0,0,0,0],[6,0,0,0,0,0,0],
 [7,5,0,0,0,0,0],[7,6,0,0,0,0,0],[8,8,0,0,0,0,0],[9,10,1,0,0,0,0],[10,15,1,0,0,0,0],
 [10,20,2,1,0,0,0],[11,25,2,1,0,0,0],[12,30,3,1,1,0,0],[12,35,3,1,1,0,0],
 [13,40,4,2,1,1,0],[14,50,5,3,2,1,0],[15,60,6,3,2,1,1],[15,75,7,4,2,2,1],
 [16,90,9,5,3,2,1],[17,110,11,6,3,2,1],[17,135,13,7,4,2,2]
];
let combinations=0;
for(let total=6;total<=20;total++)for(let thrallherd=1;thrallherd<=Math.min(total-5,10);thrallherd++)for(let charisma=1;charisma<=30;charisma++){
 const levels=[total-5-thrallherd,5,thrallherd],base=createArchivistCampaign('Roster matrix');
 const char={...base,level:total,abilities:{...base.abilities,int:20,cha:charisma},feats:[],archivistCampaign:{independentChoices:true,followers:[]},classLevels:campaignClasses.flatMap((definition,i)=>levels[i]?[{catalogId:definition.catalogId,name:definition.name,edition:'2014',definition,level:levels[i]}]:[])};
 const score=total+Math.floor((charisma-10)/2)+thrallherd,expected=roster[Math.max(1,Math.min(25,score))],p=campaignProfile(char);
 assert.equal(p.score,score);assert.equal(p.thrallLevel,Math.min(total-1,expected[0]));assert.deepEqual(p.believers,expected.slice(1));
 if(p.thrallLevel>0){const one=addCampaignFollower(char,{name:'First thrall',kind:'thrall',level:p.thrallLevel});
  if(thrallherd<10)assert.throws(()=>addCampaignFollower(one,{name:'Second thrall',kind:'thrall',level:1}),/roster limit/);
  else {const two=addCampaignFollower(one,{name:'Second thrall',kind:'thrall',level:Math.min(8,p.thrallLevel)});assert.throws(()=>addCampaignFollower(two,{name:'Third thrall',kind:'thrall',level:1}),/roster limit/);}
 }
 for(let tier=1;tier<=6;tier++){const allowance=expected[tier];if(allowance>0){const full=addCampaignFollower(char,{name:'Believers',kind:'believers',level:tier,quantity:allowance});assert.throws(()=>addCampaignFollower(full,{name:'One too many',kind:'believers',level:tier}),/roster limit/);}else assert.throws(()=>addCampaignFollower(char,{name:'Unavailable tier',kind:'believers',level:tier}),/roster limit/);}
 combinations++;
}
assert.equal(combinations,3150);
console.log('PASS 3150 legal level/Thrallherd/Charisma rosters, both thrall caps, all believer tiers and over-cap rejection');
