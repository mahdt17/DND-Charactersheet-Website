import {campaignCystSpells,campaignProfile,hasConversionFeat} from './archivistCampaign.js';
import {castCooperativeSpell} from './campaignSpellEffects.js';
import {conversionFeatCaster} from './conversionFeatCasting.js';
import {characterClasses,classCharacter,spellsForClass} from './advancement.js';
import {resolveSpell,spellAccess,spellCounts,castingKey,keyOf} from './editions.js';
import {spendSpellSlot} from './play.js';
import {castCreatureSpell,creatureProfile,updateCreature} from './campaignCreatures.js';
import {assertCampaignCanAct} from './campaignActivity.js';

export function toolSpellCandidates(c){
 const caster=conversionFeatCaster(c),row=characterClasses(c).find(r=>r.catalogId===caster?.id);
 return [...(row?spellsForClass(c,row.catalogId).map(s=>({...s,...resolveSpell(s,classCharacter(c,row)),castingClassId:row.catalogId,prepared:s.prepared,auto:s.auto})):[]),...campaignCystSpells(c)];
}
export function castToolSpell(c,id,options={},participants=[]){
 assertCampaignCanAct(c);
 const {slot,pool='standard',reach=false,chain=false,confirmed=false,formationConfirmed=false}=options;
 const spell=toolSpellCandidates(c).find(s=>keyOf(s)===id);
 if(!spell)throw Error('This class or feat no longer grants the selected spell.');
 if(spell.campaignCyst||spell.castingClassId==='homebrew:darkdonte:archivist')return castCooperativeSpell(c,id,options,participants);
 const caster=conversionFeatCaster(c),row=characterClasses(c).find(r=>r.catalogId===caster?.id),model=row&&classCharacter(c,row);
 if(!model||!spellAccess(model,spell).allowed)throw Error('This spell is not available to the selected class.');
 const p=campaignProfile(c),ability=castingKey(model),modifier=Math.floor((p.scores[ability]-10)/2),counts=spellCounts(model,p.scores[ability]);
 const regular=spellsForClass(c,row.catalogId).filter(s=>!s.auto&&!spellAccess(model,resolveSpell(s,model)).alwaysPrepared),leveled=regular.filter(s=>Number(s.level)>0);
 if(regular.filter(s=>Number(s.level)===0).length>counts.cantrips||counts.mode==='known'&&leveled.length>counts.known||['prepared','spellbook'].includes(counts.mode)&&leveled.filter(s=>s.prepared).length>counts.prepared)throw Error('This class exceeds its spell limit. Review spell choices and preparation first.');
 if(Number(spell.level)>0&&['prepared','spellbook'].includes(counts.mode)&&!spell.prepared&&!spell.auto)throw Error('Prepare this class spell first.');
 if(reach&&(!hasConversionFeat(c,'Reach Spell')||String(spell.range).toLowerCase()!=='touch'))throw Error('Reach requires its feat and a Touch spell.');
 if(chain&&(!hasConversionFeat(c,'Chain Spell')||!confirmed||String(spell.range).toLowerCase()==='touch'&&!reach))throw Error('Confirm single-target Chain eligibility and range.');
 let minimum=Number(spell.level)+(reach?2:0)+(chain?3:0);if(minimum>9&&p.rulings.chainCapApproved===true)minimum=9;
 if(minimum&&(!Number.isInteger(slot)||slot<minimum))throw Error('Choose a slot covering the adjusted spell level.');
 let next={...c,...(minimum?spendSpellSlot(c,spell,slot,pool):{})},dc=8+p.pb+modifier;
 if(participants.length){
  if(!hasConversionFeat(c,'Cooperative Spell')||!formationConfirmed)throw Error('Cooperative feat and confirmed formation/Ready timing required.');
  if(new Set(participants.map(x=>x.creatureId)).size!==participants.length)throw Error('Duplicate cooperator.');
  for(const entry of participants){const n=next.archivistCampaign?.creatures?.find(n=>n.id===entry.creatureId),s=n?.spells?.find(s=>s.id===entry.spellId);if(!n?.cooperative||n.reactionUsed||s?.name!==spell.name)throw Error('Each cooperator needs the feat, same prepared spell and unused reaction.');next=castCreatureSpell(next,n.id,s.id,entry.slot);next=updateCreature(next,n.id,n=>({...n,reactionUsed:true}));dc=Math.max(dc,creatureProfile(n).dc);}
  dc+=participants.length+1;
 }
 return {...next,...(spell.concentration?{concentration:spell.name}:{}),archivistCampaign:{...next.archivistCampaign,lastCast:{id:crypto.randomUUID(),name:spell.name,spellId:id,rule:{},resolved:[],slot:minimum?slot:0,pool,dc,castingAbility:ability,casterLevel:row.level,effectLevel:minimum?Math.max(Number(spell.level),slot-(reach?2:0)-(chain?3:0)):0,reach,chain,secondaryTargets:chain?Math.min(20,row.level):0,secondaryDC:chain?dc-4:null,cooperators:participants.map(x=>x.creatureId)}}};
}
