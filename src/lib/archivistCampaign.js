import {conversionSlotPool} from './conversionSlots.js';
import {conversionFeatOwned,conversionFeatActive,conversionStateActive} from './conversionFeatures.js';
import {conversionFeatSlots,conversionFeatCaster} from './conversionFeatCasting.js';
import {campaignScores,campaignModifiers} from './campaignModifiers.js';
import {tickCampaign} from './campaignTime.js';
import {spendCampaignGold} from './campaignEconomy.js';
import {assertCampaignCanAct} from './campaignActivity.js';
import {preservePsicrystalDestruction} from './campaignPsicrystal.js';
import {activeFollowerQuantity} from './campaignFollowers.js';
import {necroticRules,psionPoints,thrallFeatures} from '../data/campaignExpansion.js';
import levels from '../data/levels.json' with {type:'json'};
import {campaignIds,campaignClasses,campaignPowers,campaignPPId,campaignDarkId,featTimeline,cystSpells,followerTable,archivistFeatures} from '../data/archivistCampaign.js';
const mod=n=>Math.floor((Number(n??10)-10)/2);
const count=n=>Math.max(0,Math.floor(Number(n)||0));
const key=s=>s.catalogId||`2014:${s.index||s.id||s.name}`;
export const campaignKind=r=>r?.edition==='2014'?Object.keys(campaignIds).find(k=>campaignIds[k]===(r.catalogId||r.id))||'':'';
const rows=c=>c.classLevels?.length?c.classLevels:[{definition:c.classDefinition,level:c.level,edition:c.ruleset}];
export function campaignProfile(c){
 const state=c.archivistCampaign||{},r=state.rulings||{},valid=(c.ruleset||'2014')==='2014';
 const classLevels=Object.fromEntries(Object.keys(campaignIds).map(k=>[k,valid?rows(c).filter(row=>campaignKind(row.definition||row)===k&&(row.edition||'2014')==='2014').reduce((n,row)=>n+count(row.level),0):0]));
 const {archivist,psion,thrallherd}=classLevels,classActive=!!(archivist||psion||thrallherd),active=classActive||conversionFeatActive(c)||conversionStateActive(c),total=rows(c).reduce((n,row)=>n+count(row.level),0),pb=2+Math.floor((Math.max(1,total)-1)/4);
 const scores=campaignScores(c);
 const table=levels.find(row=>row.class.name==='Wizard'&&row.level===archivist&&!row.subclass)?.spellcasting||{};
 const slots=Array.isArray(r.slots)?[0,...Array.from({length:9},(_,i)=>count(r.slots[i+1]))]:[0,...Array.from({length:9},(_,i)=>Number(table[`spell_slots_level_${i+1}`]||0))];
 const maxSpellLevel=slots.reduce((n,x,i)=>x?i:n,0),growthAllowance=archivist*2,growthUsed=count(state.growthSpent??(c.spells||[]).filter(s=>s.campaignAcquisition==='growth').length);
 const manifesterLevel=Math.min(20,psion+Math.min(8,Math.max(0,thrallherd-1)));
 const score=total+mod(scores.cha)+thrallherd,roster=thrallherd?followerTable[Math.max(1,Math.min(25,score))]:null;
 return {...classLevels,active,classActive,total,pb,scores,manifesterLevel,int:mod(scores.int),dc:8+pb+mod(scores.int),slots,maxSpellLevel,
  cantrips:archivist?count(r.cantrips??(archivist>=10?5:archivist>=4?4:3)):0,preparedLimit:archivist?count(r.preparedLimit??Math.max(1,archivist+mod(scores.int))):0,
  growthAllowance,growthUsed,growthRemaining:Math.max(0,growthAllowance-growthUsed),ppMax:psion?count(r.ppMax??(manifesterLevel===1&&(legacyPreset(c)||r.levelOnePPMax!=null)?Number(r.levelOnePPMax??3):psionPoints[manifesterLevel]+Math.max(0,Math.floor(mod(scores.int)*manifesterLevel/2)))):0,ppUsed:count(c.powerPointsUsed),
  darkMax:archivist?3+Math.floor(archivist/3):0,darkUsed:count(state.darkUsed),score,thrallLevel:roster?Math.min(total-1,roster.thrall):null,believers:roster?.believers||null,
  psicrystalBonus:hasConversionFeat(c,'Psicrystal Affinity')&&psion&&!state.psicrystal?.destroyed&&(!Number.isFinite(state.psicrystal?.maxHP)||Number(state.psicrystal?.damage||0)<state.psicrystal.maxHP)&&state.psicrystalNearby!==false&&Number(state.psicrystal?.distance||0)<=5280&&Number(state.psicrystal?.damage||0)<Number(r.crystalHP??Math.max(1,Math.floor((c.hp?.max||1)/2)))?3:0,rulings:r};
}
// Old saves encoded choices implicitly. Read them until the one-time migration runs.
export const legacyPreset=c=>!c.archivistCampaign?.independentChoices&&(c.archivistCampaign?.preset===true||rows(c).some(row=>campaignKind(row.definition||row)&&row.definition?.source?.startsWith('Archivist campaign codex')));
export function hasConversionFeat(c,name){return conversionFeatOwned(c,name)||(legacyPreset(c)&&legacyFeats(c).some(f=>f.name===name));}
function legacyFeats(c){const levels=Object.fromEntries(Object.keys(campaignIds).map(k=>[k,rows(c).filter(row=>campaignKind(row.definition||row)===k).reduce((n,row)=>n+count(row.level),0)]));return featTimeline.filter(f=>f.kind==='human'?(c.race==='Variant Human'||c.archivistCampaign?.motherCyst===true)&&levels.archivist>0:levels[f.kind]>=f.level);}
export function campaignFeats(c){return [...new Map([...(legacyPreset(c)?legacyFeats(c):[]),...(c.feats||[]).filter(f=>conversionFeatOwned(c,f.name))].map(f=>[f.name,f])).values()];}
export function selectedBasePowers(c){return legacyPreset(c)?campaignPowers:campaignPowers.filter(p=>(c.archivistCampaign?.knownPowers||[]).some(k=>k.id===p.id));}
export function campaignCystSpells(c){const p=campaignProfile(c);return hasConversionFeat(c,'Mother Cyst')?cystSpells.filter(s=>s.level<=Math.min(9,Math.ceil(p.total/2))).map(s=>({...s,...p.rulings.spellRules?.[s.catalogId.replace('darkdonte:','')],featSource:'Mother Cyst',featGrantId:'homebrew:conversion-feat:mother-cyst',castingClassId:undefined})):[];}
export function campaignFeatureRows(c){const p=campaignProfile(c);if(!p.active)return [];return [
 ...archivistFeatures.filter(f=>f[0]<=p.archivist).map(([level,name,description],i)=>({index:'campaign-archivist-'+i,level,name,description:description||archivistFeatures.find(f=>f[1]===name&&f[2])?.[2]||'Choose a metamagic or crafting bonus feat.'})),
 ...(p.psion?[{index:'campaign-telepath',level:1,name:'Telepath manifesting',description:'Choose known powers and psionic bonus feats. Power points include the Intelligence bonus and recover on a long rest.'}]:[]),
 ...thrallFeatures.filter(([level])=>level>1&&p.thrallherd>=level).map(([level,name])=>({index:'campaign-thrall-'+level,level,name,description:'See extended psionics for level-based power grants, discounts, target types and twofold roster limits.'})),
 ...[5,10,15,20].filter(level=>p.psion>=level).map(level=>({index:'campaign-psion-feat-'+level,level,name:'Psion bonus feat',description:c.archivistCampaign?.bonusFeats?.[level]||'Choose a psionic, metapsionic or psionic crafting feat during level-up.'})),
 ...(p.thrallherd?[{index:'campaign-thrallherd',level:1,name:'Thrallherd',description:'Score = character level + Charisma modifier + Thrallherd level. Thrall capped at character level minus one; initial and replacement followers arrive within 24 hours.'}]:[])];}
export function campaignResources(c){const p=campaignProfile(c);return [
 ...(p.psion?[{id:campaignPPId,classResourceKey:campaignPPId,name:'Power Points',max:p.ppMax,used:p.ppUsed,reset:'long',shortRecovery:0,campaignManaged:true,edition:'2014',className:'Converted classes'}]:[]),
 ...(p.archivist?[{id:campaignDarkId,classResourceKey:campaignDarkId,name:'Dark Knowledge',max:p.darkMax,used:p.darkUsed,reset:'long',shortRecovery:0,campaignManaged:true,edition:'2014',className:'Converted classes'}]:[])];}
export function createArchivistCampaign(name='Darkdonte'){
 const classLevels=campaignClasses.slice(0,2).map((definition,i)=>({catalogId:definition.catalogId,name:definition.name,edition:'2014',definition,level:i?1:4,subclass:i?'Telepath':''}));
 return {id:crypto.randomUUID(),name,ruleset:'2014',mechanics:'2014',race:'Variant Human',className:'Archivist',classDefinition:campaignClasses[0],classLevels,level:5,hitDie:'d6',abilities:{str:10,dex:10,con:10,int:15,wis:13,cha:16},abilityBonuses:{},hp:{current:22,max:22,temp:0},ac:10,autoArmor:true,speed:30,saveProf:{con:true,wis:true},skillProf:{Arcana:true,Religion:true},inventory:[],spells:[],actions:[],resources:[],feats:[],powerPointsUsed:0,languages:'Common, Infernal',archivistCampaign:{preset:true,psicrystalNearby:true,growthSpent:0,darkUsed:0,rulings:{},followers:[],notes:''}};
}
export function advanceArchivistCampaign(c,{hpGain,kind:chosenKind}={}){
 c=preservePsicrystalDestruction(c);
 const p=campaignProfile(c);if(!p.active)throw Error('No campaign classes.');if(p.total>=20)throw Error('The campaign build ends at character level 20.');
 const all=rows(c),kind=chosenKind||(p.archivist===1&&!p.psion?'psion':p.total>=5&&!p.thrallherd?'thrallherd':'archivist');
 if(!['archivist','psion','thrallherd'].includes(kind)||p[kind]>=(kind==='thrallherd'?10:20))throw Error('Class level limit reached.');
 if(kind==='thrallherd'&&!p.thrallherd&&(p.total<5||!c.skillProf?.Arcana||!c.skillProf?.Religion))throw Error('Thrallherd entry needs character level 5 and Arcana/Religion proficiency.');
 if(kind==='thrallherd'&&!p.psion)throw Error('Thrallherd entry requires psionic capability and Mindlink.');
 const def=campaignClasses.find(d=>d.campaignKind===kind),owned=all.find(row=>campaignKind(row.definition)===kind);
 const nextRows=owned?all.map(row=>row===owned?{...row,level:row.level+1}:row):[...all,{catalogId:def.catalogId,name:def.name,edition:'2014',definition:def,level:1}];
 const die=Number(p.rulings[kind+'HitDie']??6),gain=hpGain==null?Math.max(1,Math.floor(die/2)+1+mod(p.scores.con)):Number(hpGain);
 if(!Number.isInteger(gain)||gain<1)throw Error('Enter a positive whole-number HP gain.');
 return {...c,level:p.total+1,classLevels:nextRows,hp:{...c.hp,max:c.hp.max+gain,current:c.hp.current+gain}};
}
export function acquireCampaignSpell(c,s,{channel='growth',source='',confirmed=false}={}){
 const p=campaignProfile(c);if(!p.archivist)throw Error('Archivist levels are required.');
 if(s.edition!=='2014'||!Number.isInteger(s.level)||s.level<0||s.level>p.maxSpellLevel)throw Error('Choose a 2014 spell at an available class spell level.');
 if((c.spells||[]).some(x=>key(x)===key(s)&&x.castingClassId===campaignIds.archivist))throw Error('Already recorded in the prayerbook.');
 const cleric=(s.classes||[]).some(n=>(n.name||n)==='Cleric');
 if(s.level===0){if(!cleric)throw Error('Choose a Cleric cantrip.');if((c.spells||[]).filter(x=>x.castingClassId===campaignIds.archivist&&x.level===0).length>=p.cantrips)throw Error('Cantrip limit reached.');channel='cantrip';}
 else if(channel==='growth'){if(!cleric)throw Error('Free growth requires a Cleric-list spell.');if(!p.growthRemaining)throw Error('No free prayerbook additions remain.');}
 else if(channel!=='outside'||!confirmed||!source.trim())throw Error('Confirm a valid outside source and completed copying.');
 return {...c,archivistCampaign:{...c.archivistCampaign,growthSpent:p.growthUsed+(channel==='growth'?1:0)},spells:[...(c.spells||[]),{...s,id:crypto.randomUUID(),catalogId:key(s),castingClassId:campaignIds.archivist,prepared:s.level===0,campaignAcquisition:channel,acquisitionSource:source}]};
}
export function prepareCampaignSpell(c,id,value){
 const p=campaignProfile(c),spell=(c.spells||[]).find(s=>key(s)===id&&s.castingClassId===campaignIds.archivist);
 if(!spell||spell.level>p.maxSpellLevel)throw Error('Spell is not available in this prayerbook.');
 if(value&&spell.level>0&&!spell.prepared&&(c.spells||[]).filter(s=>s.castingClassId===campaignIds.archivist&&s.level>0&&s.prepared).length>=p.preparedLimit)throw Error('Preparation limit reached.');
 return {...c,spells:c.spells.map(s=>s===spell?{...s,prepared:!!value}:s)};
}
export function useCampaignPower(c,id,{augmentation=0,discount=false}={}){assertCampaignCanAct(c);const p=campaignProfile(c),power=selectedBasePowers(c).find(x=>x.id===id);if(!p.psion||!power)throw Error('Power unavailable.');if(augmentation!==0)throw Error('Additional augmentation is not configured for this base power.');if(discount)throw Error('No daily discount for this power.');if(p.scores.int<11)throw Error('Insufficient Intelligence for this power.');if(p.ppUsed+power.cost>p.ppMax)throw Error('Not enough power points.');const duration=Number(p.rulings[id+'Minutes']??(id==='mindlink'?10:60));return {...c,powerPointsUsed:p.ppUsed+power.cost,archivistCampaign:{...c.archivistCampaign,psicrystal:{...c.archivistCampaign?.psicrystal,pendingTouch:null},powerEffects:{...c.archivistCampaign?.powerEffects,[id]:{minutes:duration}},lastPower:id,lastManifest:{id:crypto.randomUUID(),power:{...power,level:1,minutes:duration,save:id==='attraction'?'wis':''},cost:power.cost,dc:p.dc,resolved:[]}}};}
export const knowledgeKinds={tactics:1,puissance:5,foe:8,'dread-secret':11,foreknowledge:14};
export function useDarkKnowledge(c,kind,{check,target}={}){
 assertCampaignCanAct(c);
 const p=campaignProfile(c);if(!Object.hasOwn(knowledgeKinds,kind)||p.archivist<knowledgeKinds[kind])throw Error('This Dark Knowledge effect requires a higher Archivist level.');if(p.darkUsed>=p.darkMax)throw Error('No Dark Knowledge uses remain.');if(check==null||String(check).trim()===''||!Number.isFinite(Number(check))||!String(target||'').trim())throw Error('Enter a check result and target.');
 const dc=Number(p.rulings.knowledgeDC??15),bonus=Number(check)<dc?0:Math.min(3,1+Math.floor((Number(check)-dc)/10));
 return {...c,archivistCampaign:{...c.archivistCampaign,darkUsed:p.darkUsed+1,knowledgeEffect:{kind,target,check:Number(check),dc,bonus,rounds:kind==='dread-secret'?1:10}}};
}
export function campaignSkillBonus(c,name){const p=campaignProfile(c);if(!p.active)return 0;const choices=c.archivistCampaign?.loreSkills||[],limit=[2,7,13,17].filter(n=>p.archivist>=n).length;return (name==='Perception'?campaignModifiers(c).perception:name==='Acrobatics'?campaignModifiers(c).acrobatics:0)+(name==='Arcana'?p.psicrystalBonus:0)+(['Perception','Investigation'].includes(name)&&p.psicrystalBonus&&c.archivistCampaign?.psicrystal?.distance===0?Number(p.rulings.crystalAlertnessBonus??2):0)+choices.slice(0,limit).filter(s=>s===name).length*2;}
export function advanceCampaignTime(c,minutes){if(!Number.isInteger(minutes)||minutes<0)throw Error('Enter whole nonnegative minutes.');return tickCampaign(c,minutes);}
export function campaignRest(c,rest){const p=campaignProfile(c);if(!p.active)return c;let next=advanceCampaignTime(c,rest==='long'?480:60);return rest==='long'?{...next,powerPointsUsed:0,archivistCampaign:{...next.archivistCampaign,darkUsed:0,thrallDiscounts:{},psicrystal:{...next.archivistCampaign.psicrystal,sightUsed:false}}}:next;}
export function castCampaignSpell(c,id,{slot,pool='standard',ritual=false,reach=false,chain=false,confirmed=false}={}){
 assertCampaignCanAct(c);
 if(!['standard','pact'].includes(pool))throw Error('Choose a valid spell slot pool.');
 const p=campaignProfile(c),spell=[...(c.spells||[]).filter(s=>s.castingClassId===campaignIds.archivist),...campaignCystSpells(c)].find(s=>key(s)===id);
 if(!spell||!spell.campaignCyst&&(!p.archivist||spell.level>p.maxSpellLevel))throw Error('This spell is not available to the Archivist or selected feat.');
 const caster=spell.campaignCyst?conversionFeatCaster(c):{level:p.archivist,ability:'int'},pools=spell.campaignCyst?conversionFeatSlots(c):Array.isArray(c.slotOverride)?{standard:c.slotOverride,pact:Array(10).fill(0)}:conversionSlotPool(c)||{standard:p.slots,pact:Array(10).fill(0)};
 if(!caster)throw Error('Choose an available spellcasting class for this feat.');
 const slots=pools?.[pool]||[],usedKey=pool==='pact'?'pactSlotsUsed':'slotsUsed',used=c[usedKey]||{},dc=8+p.pb+mod(p.scores[caster.ability]),casterLevel=spell.campaignCyst?p.total:caster.level;
 if(spell.campaignCyst&&c.archivistCampaign?.empowerment?.rounds>0&&spell.name!=='Necrotic Empowerment')throw Error('Necrotic Empowerment blocks other Mother Cyst spells.');
 if(spell.campaignCyst&&!confirmed)throw Error('Confirm the campaign spell effects with your DM before casting.');
 if(ritual){if(!spell.ritual||spell.campaignCyst||reach||chain)throw Error('Only a recorded ritual can be cast without a slot.');return {...c,...(spell.concentration?{concentration:spell.name}:{}),archivistCampaign:{...c.archivistCampaign,lastCast:{name:spell.name,spellId:id,ritual:true}}};}
 if(spell.level&&!spell.campaignCyst&&!spell.prepared)throw Error('Prepare this prayerbook spell first.');
 const feats=campaignFeats(c).map(f=>f.name);
 if(reach&&(!feats.includes('Reach Spell')||String(spell.range).toLowerCase()!=='touch'))throw Error('Reach requires the feat and a Touch spell.');
 if(chain&&(!feats.includes('Chain Spell')||!confirmed||String(spell.range).toLowerCase()==='touch'&&!reach))throw Error('Confirm single-target Chain eligibility and range.');
 let minimum=spell.level+(reach?2:0)+(chain?3:0);
 if(minimum>9&&p.rulings.chainCapApproved===true)minimum=9;
 if(minimum&&(!Number.isInteger(slot)||slot<minimum||!slots[slot]||count(used[slot])>=slots[slot]))throw Error('Choose an available slot that covers the adjusted spell level.');
 const ruleId=id.replace('darkdonte:',''),rule={...necroticRules[ruleId],...p.rulings.spellRules?.[ruleId]};
 const paid=rule.cost?spendCampaignGold(c,Number(rule.cost)):c;
 return {...paid,...(spell.concentration?{concentration:spell.name}:{}),...(minimum?{[usedKey]:{...used,[slot]:count(used[slot])+1}}:{}),archivistCampaign:{...c.archivistCampaign,lastCast:{id:crypto.randomUUID(),resolved:[],rule,name:spell.name,spellId:id,casterLevel,castingAbility:caster.ability,effectLevel:minimum?Math.max(spell.level,slot-(reach?2:0)-(chain?3:0)):0,slot:minimum?slot:0,pool,dc,reach,chain,secondaryTargets:chain?Math.min(20,caster.level):0,secondaryDC:chain?dc-4:null}}};
}
export function addCampaignFollower(c,{name,kind='believers',level=1,quantity=1,notes=''}={}){
 const p=campaignProfile(c),list=c.archivistCampaign?.followers||[];
 if(!p.thrallherd||!p.believers)throw Error('No verified roster for this Thrallherd score.');
 if(!String(name||'').trim()||!['thrall','believers'].includes(kind)||!Number.isInteger(level)||level<1||!Number.isInteger(quantity)||quantity<1)throw Error('Enter a name, whole level and positive quantity.');
 const current=list.filter(f=>f.kind===kind&&(kind==='thrall'||f.level===level)).reduce((n,f)=>n+activeFollowerQuantity(f),0);
 if(kind==='thrall'?(quantity!==1||current>=(p.thrallherd>=10?2:1)||level>p.thrallLevel||p.thrallherd>=10&&[...list.filter(f=>activeFollowerQuantity(f)>0&&f.kind==='thrall').map(f=>f.level),level].filter(l=>l>p.thrallherd-2).length>1):(level>6||current+quantity>p.believers[level-1]))throw Error('Follower level or roster limit exceeded.');
 return {...c,archivistCampaign:{...c.archivistCampaign,followers:[...list,{id:crypto.randomUUID(),name:name.trim(),kind,level,quantity,notes,arrivalHours:24}]}};
}
export function reconcileCampaign(c){
 c=preservePsicrystalDestruction(c);
 if(legacyPreset(c)){
  const before=campaignProfile(c),state=c.archivistCampaign||{};
  const granted=[...campaignFeats(c).map(f=>({...f,...(f.name==='Psicrystal Affinity'?{conversionBonusSlot:'psion:1'}:{}),...(f.name==='Chain Spell'?{conversionBonusSlot:'archivist:10'}:{})})),
   ...Object.entries(state.bonusFeats||{}).filter(([level,name])=>[5,10,15,20].includes(Number(level))&&Number(level)<=before.psion&&typeof name==='string'&&name.trim()).map(([level,name])=>({name:name.trim(),conversionBonusSlot:'psion:'+level}))];
  const feats=[...(c.feats||[])];
  for(const grant of granted){
   const index=feats.findIndex(f=>grant.conversionBonusSlot?f.conversionBonusSlot===grant.conversionBonusSlot||!f.conversionBonusSlot&&f.name===grant.name:f.name===grant.name);
   if(index<0)feats.push({...grant,id:crypto.randomUUID(),edition:'2014',source:'Saved character choices'});
   else if(grant.conversionBonusSlot&&!feats[index].conversionBonusSlot)feats[index]={...feats[index],conversionBonusSlot:grant.conversionBonusSlot};
  }
  c={...c,feats,archivistCampaign:{...state,independentChoices:true,rulings:{...state.rulings,...(before.manifesterLevel===1&&state.rulings?.ppMax==null?{levelOnePPMax:before.ppMax}:{})},knownPowers:[...(before.psion?campaignPowers.map(power=>({...power,level:1,range:power.id==='inertial-armor'?'Self':'30 feet'})):[]),...(state.knownPowers||[])]}};
 }
 const p=campaignProfile(c);if(!p.active)return c;
 const classLevels=rows(c).map(row=>{const kind=campaignKind(row.definition),die=p.rulings[kind+'HitDie'];return kind?{...row,definition:{...row.definition,...(die?{hit_die:Number(die)}:{}),...(kind==='archivist'&&Array.isArray(p.rulings.proficiencies)?{proficiencies:p.rulings.proficiencies}: {})}}:row;});
 const spells=(c.spells||[]).map(s=>!s.castingClassId&&campaignKind(classLevels[0]?.definition)==='archivist'?{...s,castingClassId:campaignIds.archivist,campaignAcquisition:s.level===0?'cantrip':'growth'}:s);
 const state=c.archivistCampaign||{};
 return {...c,classLevels,spells,archivistCampaign:{...state,sensing:c.concentration==='Necrotic Awareness'?state.sensing:null,creatures:(state.creatures||[]).map(n=>({...n,sensor:c.concentration==='Necrotic Scrying'?n.sensor:null}))}};
}
