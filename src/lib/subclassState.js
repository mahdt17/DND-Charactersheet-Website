import {effectiveAbilityScores} from './abilityScores.js';
import {characterClasses} from './advancement.js';
import {findExpandedSubclass} from './expandedSubclassCatalog.js';
import {rageProfile} from './rage2014.js';
import {isEligibleMoonProfile,localCreatureProfile} from './creatureProfiles.js';

// Shared source-owned states live in activeEffects, using the existing game-time,
// concentration and rest lifecycle. These helpers never start a state implicitly.
const edition=c=>(c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014';
const names=c=>(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).map(n=>String(n?.name||n).trim().toLowerCase());
function selectedFeature(c,row,record,f){
 if(!record.flexibleFeatureSelection||f.level<=record.entryLevel)return true;
 const milestones={Bard:[3,6,14],Druid:[2,6,10,14],Sorcerer:[1,6,14,18],Warlock:[1,6,10,14],Wizard:[2,6,10,14]},state=c.expandedSubclassChoices?.[row.catalogId]?.[record.id]||{},selected=[];
 for(const level of milestones[row.name]||[]){if(level<=record.entryLevel||level>row.level)continue;const values=state[`later-subclass-feature:${level}`]||[];if(values.length===1&&!selected.includes(values[0])&&record.features.some(v=>v.name===values[0]&&v.level<=level))selected.push(values[0]);}
 return selected.includes(f.name);
}
export function sourceSubclassEffects(c,{recordId,ownerId,featureId,stateKey}={}){
 if(edition(c)!=='2014')return [];
 return (c.activeEffects||[]).filter(e=>e.subclassRecordId&&(!recordId||e.subclassRecordId===recordId)&&(!ownerId||e.sourceClassId===ownerId)&&(!featureId||e.sourceFeatureId===featureId)&&(!stateKey||e.stateKey===stateKey)&&(e.remainingSeconds==null||e.remainingSeconds>0)&&(!e.concentration||e.concentration===c.concentration)&&characterClasses(c).some(row=>{
  const record=row.edition==='2014'&&!row.definition?.homebrew&&findExpandedSubclass(row.name,row.subclass);
  if(e.stateKey==='moon-wild-shape'){
   const ref=e.profileRef,profile=localCreatureProfile(ref?.creatureId),feature=profile?.type==='beast'?'combat-wild-shape':'elemental-wild-shape';
   if(record?.id!=='2014:subclass:druid:moon'||ref?.catalogId!=='2014:creatures'||e.sourceFeatureId!==`${record.id}:${feature}`||!isEligibleMoonProfile(ref?.creatureId,row.level))return false;
  }
  return record&&record.id===e.subclassRecordId&&row.catalogId===e.sourceClassId&&record.features.some(f=>f.id===e.sourceFeatureId&&f.level<=row.level&&selectedFeature(c,row,record,f));
 }));
}
export function polymorphSheepEffect(c){return sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic',stateKey:'wild-surge:77'}).find(e=>e.saveSucceeded===false&&e.profileRef?.catalogId==='2014:creatures'&&e.profileRef?.kind==='polymorph-sheep'&&e.dmConfirmed&&localCreatureProfile(e.profileRef.creatureId)?.type==='beast'&&Number.isFinite(c.profileState?.[e.id]?.hp?.current)&&Number.isFinite(c.profileState?.[e.id]?.hp?.max))||null;}
export function pendingWildSheep(c){return sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic',stateKey:'wild-surge:77'}).find(e=>e.saveSucceeded===false)||null;}
export function retainsOwnFeatures(c){return !pendingWildSheep(c);}
export function actorOwnFormEffect(c){return polymorphSheepEffect(c)||sourceSubclassEffects(c,{stateKey:'moon-wild-shape'})[0]||null;}
export function echoAvatarActive(c){return sourceSubclassEffects(c,{stateKey:'echo-avatar'}).some(e=>sourceSubclassEffects(c,{stateKey:'manifest-echo'}).some(x=>x.id===e.echoId));}
export function equippedForActiveBody(c,item){if(!item?.equipped)return false;const e=actorOwnFormEffect(c);return !e||(e.stateKey==='moon-wild-shape'&&(e.wornItemIds||[]).includes(item.id));}
export function actorBodyHP(c){const e=actorOwnFormEffect(c);const hp=e&&c.profileState?.[e.id]?.hp;return hp&&Number.isFinite(hp.current)?hp.current:Number(c.hp?.current??1);}
export function healActiveBody(c,amount){if(pendingWildSheep(c)&&!polymorphSheepEffect(c))throw Error('Choose the DM-confirmed sheep profile before healing.');const e=actorOwnFormEffect(c),state=e&&c.profileState?.[e.id];if(!state?.hp)return null;if(!Number.isFinite(amount)||amount<0)throw Error('Invalid healing.');return {profileState:{...c.profileState,[e.id]:{...state,hp:{...state.hp,current:Math.min(state.hp.max,state.hp.current+amount)}}}};}
export function longRestBody(c,maxHP){if(pendingWildSheep(c)&&!polymorphSheepEffect(c))throw Error('Choose the DM-confirmed sheep profile before resting.');const e=actorOwnFormEffect(c),state=e&&c.profileState?.[e.id];return state?.hp?{hp:{...c.hp,temp:0},profileState:{...c.profileState,[e.id]:{...state,hp:{...state.hp,current:state.hp.max}}}}:{hp:{...c.hp,current:maxHP,temp:0}};}
export function damageActiveBody(c,amount){
 if(pendingWildSheep(c)&&!polymorphSheepEffect(c))throw Error('Choose the DM-confirmed sheep profile before applying damage.');
 const e=actorOwnFormEffect(c),state=e&&c.profileState?.[e.id];if(!state?.hp)return null;if(!Number.isInteger(amount)||amount<0)throw Error('Enter a nonnegative whole damage amount.');
 const temp=Math.max(0,Number(c.hp?.temp)||0),absorbed=Math.min(temp,amount),damage=amount-absorbed,remaining=Math.max(0,state.hp.current-damage),overflow=Math.max(0,damage-state.hp.current),hp={...c.hp,temp:temp-absorbed,current:Math.max(0,c.hp.current-overflow)};
 if(remaining)return {hp,profileState:{...c.profileState,[e.id]:{...state,hp:{...state.hp,current:remaining}}}};
 return {hp,...finishSubclassEffects(c,(c.activeEffects||[]).filter(x=>x.id!==e.id))};
}
export function consciousAtZero(c){
 return sourceSubclassEffects(c).some(e=>e.subclassRecordId==='2014:subclass:barbarian:zealot'&&e.sourceFeatureId==='2014:subclass:barbarian:zealot:rage-beyond-death'&&e.stateKey==='rage-beyond-death'||e.subclassRecordId==='2014:subclass:fighter:samurai'&&e.sourceFeatureId==='2014:subclass:fighter:samurai:strength-before-death'&&e.stateKey==='strength-before-death');
}
export function actorDeathBlock(c,{allowPostponedDeath=true}={}){
 if(edition(c)!=='2014')return '';
 const zealot=allowPostponedDeath&&sourceSubclassEffects(c,{recordId:'2014:subclass:barbarian:zealot',featureId:'2014:subclass:barbarian:zealot:rage-beyond-death',stateKey:'rage-beyond-death'}).length>0;
 return actorBodyHP(c)<=0&&Number(c.deathSaves?.failure)>=3&&!zealot||Number(c.exhaustion)>=6||names(c).includes('dead')||c.dead||c.instantDeath?'A dead character must be revived before acting.':'';
}
export function loreholdOwnerHPBonus(c){if(actorDeathBlock(c))return 0;return sourceSubclassEffects(c,{stateKey:'ancient-companion'}).reduce((sum,e)=>{if(e.kind!=='Healer')return sum;const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),record=row&&findExpandedSubclass(row.name,row.subclass),f=record?.features.find(x=>x.id===`${record.id}:lessons-of-the-past`);return sum+(row&&record&&f&&f.level<=row.level&&selectedFeature(c,row,record,f)?row.level:0);},0);}
export function loreholdHealerActive(c){return loreholdOwnerHPBonus(c)>0;}
export function reconcileLoreholdHP(before,after){const prior=Number.isFinite(before.loreholdHPGranted)?before.loreholdHPGranted:loreholdOwnerHPBonus(before),next=loreholdOwnerHPBonus(after),delta=next-prior;return {activeEffects:after.activeEffects,loreholdHPGranted:next,...(delta?{hp:{...after.hp,current:Math.max(0,Number(after.hp.current)+delta)}}:{})};}
export function actorActionBlock(c,{allowZeroHP=false}={}){
 if(edition(c)!=='2014')return '';
 const death=actorDeathBlock(c);if(death)return death;
 if(pendingWildSheep(c))return polymorphSheepEffect(c)?'Normal features and actions are unavailable while polymorphed.':'Choose the DM-confirmed sheep profile before acting.';
 if(sourceSubclassEffects(c,{recordId:'2014:subclass:sorcerer:wild-magic',stateKey:'wild-surge:41'}).some(e=>e.blocksActions))return 'You are incapacitated while transformed into a potted plant.';
 if(names(c).some(n=>['incapacitated','unconscious','stunned','paralyzed','petrified'].includes(n)))return 'You cannot act while incapacitated.';
 return !allowZeroHP&&actorBodyHP(c)<=0&&!consciousAtZero(c)?'You must be conscious to use this ability.':'';
}
export function finishSubclassEffects(c,effects){
 const was=(c.activeEffects||[]).some(e=>e.stateKey==='rage-beyond-death');
 const samuraiDeath=(c.activeEffects||[]).some(e=>e.stateKey==='strength-before-death')&&Number(c.hp?.current)<=0&&Number(c.deathSaves?.failure)>=3;
 const postponedDeath=was&&!effects.some(e=>e.stateKey==='rage-beyond-death'&&(e.remainingSeconds==null||e.remainingSeconds>0))&&Number(c.hp?.current)<=0&&Number(c.deathSaves?.failure)>=3;
 effects=effects.filter(e=>(e.stateKey!=='primeval-boost'||effects.some(d=>d.id===e.companionId))&&(e.stateKey!=='echo-avatar'||effects.some(d=>d.id===e.echoId))).map(e=>e.stateKey==='druid-companion'&&e.hp?.tempSource==='primeval-boost'&&!effects.some(b=>b.stateKey==='primeval-boost'&&b.companionId===e.id)?{...e,hp:{...e.hp,temp:0,tempSource:null}}:e);
 return {activeEffects:effects,...(c.profileState?{profileState:Object.fromEntries(Object.entries(c.profileState).filter(([id])=>effects.some(e=>e.id===id)))}:{}),...((c.activeEffects||[]).some(e=>e.stateKey==='rage')&&!effects.some(e=>e.stateKey==='rage')?{totemWarrior:{...c.totemWarrior,activeRage:false}}:{}),...(postponedDeath||samuraiDeath?{dead:true}:{})};
}
export function reconcileSubclassStates(c){
 const valid=new Set(sourceSubclassEffects(c));
 const rage=rageProfile(c),unconscious=names(c).includes('unconscious')||actorBodyHP(c)<=0&&!consciousAtZero(c);
 const cannonCounts={},echoCounts={};
 const effects=(c.activeEffects||[]).filter(e=>!(e.stateKey==='ancient-companion'&&actorDeathBlock(c))&&!(e.stateKey==='beast-companion'&&e.kind!=='original'&&actorDeathBlock(c))&&!(e.stateKey==='drake-companion'&&actorDeathBlock(c))&&!(e.stateKey==='dancing-item'&&!e.ua&&actorDeathBlock(c))&&!(e.stateKey==='druid-companion'&&e.kind!=='wildfire-ua'&&actorDeathBlock(c))&&(!e.subclassRecordId||valid.has(e))&&!(e.requiresEquippedItem&&!(c.inventory||[]).some(i=>i.id===e.itemId&&equippedForActiveBody(c,i)))&&!(e.stateKey==='moon-wild-shape'&&(unconscious||actorDeathBlock(c)))&&!(e.stateKey==='wild-surge:77'&&e.profileRef?.kind==='polymorph-sheep'&&actorDeathBlock(c))&&!(e.endsOnIncapacitated&&(actorDeathBlock(c)||names(c).some(n=>['incapacitated','unconscious','stunned','paralyzed','petrified'].includes(n))||actorBodyHP(c)<=0&&!consciousAtZero(c)))&&!(e.endsAtZero&&Number(c.hp?.current)<=0)&&!(e.requiresTempSource&&(c.hp?.tempSource!==e.requiresTempSource||!(c.hp.temp>0)))&&!(e.baseClassId&&(!rage.level||unconscious))).filter(e=>{if(e.stateKey==='manifest-echo'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),count=echoCounts[e.sourceClassId]||0;echoCounts[e.sourceClassId]=count+1;return count<(row?.level>=18?2:1);}if(e.stateKey!=='eldritch-cannon')return true;const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),count=cannonCounts[e.sourceClassId]||0;cannonCounts[e.sourceClassId]=count+1;return count<(row?.level>=15?2:1);}).map(e=>{if(e.stateKey==='ancient-companion'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId);return {...e,hp:{...e.hp,current:Math.min(e.hp.current,5+5*(row?.level||0))}};}if(e.stateKey==='beast-companion'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),level=row?.level||0,profile=e.kind==='original'?localCreatureProfile(e.profileId):null,max=e.kind==='original'?Math.max(profile?.hpMax||0,4*level):e.kind==='sky'?4+4*level:5+5*level;return {...e,hp:{...e.hp,current:Math.min(e.hp.current,max)}};}if(e.stateKey==='drake-companion'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId);return {...e,hp:{...e.hp,current:Math.min(e.hp.current,5+5*(row?.level||0))}};}if(e.stateKey==='dancing-item'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),cha=Math.floor((effectiveAbilityScores(c).cha-10)/2),max=Math.max(1,(e.ua?3+cha:10)+5*(row?.level||0));return {...e,hp:{...e.hp,current:Math.min(e.hp.current,max)}};}if(e.stateKey==='druid-companion'){const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),wis=Math.floor((effectiveAbilityScores(c).wis-10)/2),max=Math.max(1,(e.kind==='wildfire-ua'?2+wis:5)+5*(row?.level||0));return {...e,hp:{...e.hp,current:Math.min(e.hp.current,max)}};}if(e.stateKey==='necromancy-undead'){const profile=localCreatureProfile(e.profileId),row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId);if(!profile||!row)return e;return {...e,hp:{...e.hp,current:Math.min(e.hp.current,profile.hpMax+(e.kind==='created'?row.level:0))}};}if(e.stateKey==='sentinel-raven'&&actorDeathBlock(c))return {...e,status:'gone',perched:false,hp:{...e.hp,current:0}};if(e.stateKey!=='eldritch-cannon')return e;const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId);return {...e,hp:{...e.hp,current:Math.min(e.hp.current,5*row.level)}};});
 const hasRage=effects.some(e=>e.stateKey==='rage'&&(e.remainingSeconds==null||e.remainingSeconds>0));
 const live=new Set(effects.map(e=>e.id));
 const owners=characterClasses(c).flatMap(row=>{const record=row.edition==='2014'&&!row.definition?.homebrew&&findExpandedSubclass(row.name,row.subclass);return record?[{owner:row.catalogId,record:record.id}]:[];});
 const score=Array.isArray(c.subclassCompanions)&&c.subclassCompanions.some(e=>e.managedSubclassCompanion&&e.profileId==='steel-defender')?effectiveAbilityScores(c):null;
 const companions=Array.isArray(c.subclassCompanions)?c.subclassCompanions.filter(e=>!e.managedSubclassCompanion||((!(e.endsOnOwnerDeath&&actorDeathBlock(c))||e.profileId==='steel-defender')&&characterClasses(c).some(row=>{const r=row.edition==='2014'&&!row.definition?.homebrew&&findExpandedSubclass(row.name,row.subclass);return r&&row.catalogId===e.sourceClassId&&r.id===e.subclassRecordId&&r.features.some(f=>f.id===e.sourceFeatureId&&f.level<=row.level&&selectedFeature(c,row,r,f));}))).map(e=>{if(!e.managedSubclassCompanion||e.profileId!=='steel-defender')return e;const row=characterClasses(c).find(r=>r.catalogId===e.sourceClassId),max=Math.max(1,2+Math.floor((score.int-10)/2)+5*row.level);return {...e,hp:{...e.hp,current:e.endsOnOwnerDeath&&actorDeathBlock(c)?0:Math.min(max,e.hp.current)}};}):null;
 const owned={};for(const key of ['subclassQuantities','subclassPortent','subclassEquipment','subclassPsionic'])if(c[key])owned[key]=Object.fromEntries(Object.entries(c[key]).flatMap(([owner,records])=>{const keep=Object.fromEntries(Object.entries(records).filter(([record])=>owners.some(p=>p.owner===owner&&p.record===record)));return Object.keys(keep).length?[[owner,keep]]:[];}));

 const next={...c,...owned,...(companions?{subclassCompanions:companions}:{}),...(c.subclassElixirs?{subclassElixirs:c.subclassElixirs.filter(e=>owners.some(p=>p.owner===e.sourceClassId&&p.record===e.subclassRecordId))}:{}),spells:(c.spells||[]).filter(s=>!s.temporarySubclassSpell||live.has(s.sourceEffectId)),...finishSubclassEffects(c,effects.filter(e=>!['rage-beyond-death','beast-weapon','storm-aura','rage-wild-surge'].includes(e.stateKey)||hasRage||!c.activeEffects.some(e=>e.stateKey==='rage')))};
 if(c.loreholdHPGranted!=null||(c.activeEffects||[]).some(e=>e.stateKey==='ancient-companion'))return {...next,...reconcileLoreholdHP(c,next)};return next;
}
