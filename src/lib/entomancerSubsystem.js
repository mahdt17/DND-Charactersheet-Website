import {entomancerProfile,entomancerChoicesComplete,entomancerActionBlockReason,entomancerSongSaves} from './entomancer.js';
import {availableEntomancerActions} from './entomancerActions.js';

const dailyKeys={'hungry-mouths':'hungryMouths','swarm-form':'swarmForm','dead-man':'deadMan','apex-attack':'apexAttack'};
const effectKeys={'bug-armor':'bugArmor','swarm-form':'swarmForm','reflex-armor':'reflexArmor',invisible:'invisible',invicta:'invicta',decompose:'decompose','pure-terror':'terror'};
const names={bugArmor:'Bug Armor',swarmForm:'Swarm Form',reflexArmor:'Enhanced Exoskeleton',invicta:'Invicta resistance',invisible:'Apex invisibility',decompose:'Decomposition',terror:'Pure Terror'};
const targetActions=['entomancy','pestilence','bug-swarm','summon','infest','many-eyed','apex-attack','corpse-jacker','decompose','latch','pure-terror','sonnet','serenade'];
const saveActions=['entomancy','pestilence','bug-swarm','infest','pure-terror','sonnet'];
const positiveInteger=n=>Number.isInteger(n)&&n>0;
export function createSwarmUi(c){
 const actions=availableEntomancerActions(c);
 return {section:'abilities',actionId:actions.some(a=>a.id===c.entomancer?.lastAction?.id)?c.entomancer.lastAction.id:'pestilence',inputsByAction:{},activeInputs:{infestations:{},terror:{},hemo:{},sonnet:{},serenade:{}},creatureInput:{amount:1,type:'',critical:false},recoveryInput:{amount:1},query:'',availableOnly:false,recoveryDisclosure:null};
}
export function swarmSubsystem(c,{actionId,inputs={}}={}){
 const p=entomancerProfile(c),s=c.entomancer||{},blockedReason=entomancerActionBlockReason(c),setupComplete=entomancerChoicesComplete(c);
 if(!p.level)return {supported:false,profile:p,setupComplete,blockedReason,summary:{available:0,max:0,unavailable:0,activityCount:0,creatureCount:0},actions:[],selected:null,activities:[],creatures:[],recovery:{shortRecovery:0,shortRequiresFood:false,longRequiresFood:true,pendingReturns:[]}};
 const activities=[];
 for(const [key,e] of Object.entries(s.effects||{}))if(e?.remaining>0){
  const row={id:`effect:${key}`,kind:'effect',effectKey:key,name:names[key]||key,remainingRounds:e.remaining,nextTrigger:'Advance game time to expire'};
  if(key==='bugArmor')row.refund={amount:e.left>=e.initial?3:e.left>0?1:0,trigger:'When Bug Armor ends'};
  if(key==='decompose'){row.committed=e.committed;row.refund={amount:e.committed+e.turns,trigger:'When feeding finishes'};}
  activities.push(row);
 }
 for(const t of s.targets||[]){
  if(t.infestation?.remaining>0)activities.push({id:`infestation:${t.id}`,kind:'infestation',targetId:t.id,name:`Infestation · ${t.name}`,remainingRounds:t.infestation.remaining,nextTrigger:`Bonus action: ${t.infestation.points}d8 necrotic damage`});
  for(const condition of t.conditions||[]){
   if(condition.startsWith('Infested:'))continue;
   const timer=t.timers?.[condition];
   if(timer===0)continue;
   activities.push({id:`condition:${t.id}:${condition}`,kind:'condition',targetId:t.id,name:`${condition} · ${t.name}`,condition,remainingRounds:Number.isFinite(timer)?timer:null,nextTrigger:condition==='Paralyzed'?'Repeat Constitution save at target turn end':'Resolve at the table'});
  }
 }
 const latch=(s.targets||[]).find(t=>t.id===s.latch?.targetId);
 const add=(kind,name,nextTrigger)=>activities.push({id:kind,kind,name,remainingRounds:null,nextTrigger});
 if(latch)add('latch',`Hemo Vamprisis · ${latch.name}`,'Your turn start'+(p.level>=14?' and target turn end':''));
 if(p.song)add('song','Harmonize',`${p.songRange} ft · friendly saves +${p.wis} · ${entomancerSongSaves(c).length} checks pending`);
 if(s.psychicSave)add('psychic-save','Hive Mind advantage','Next selected saving throw');
 if(s.strengthStrike)add('strength','Monstrous Strength','Next melee weapon attack and damage +2');
 if(s.pendingApex)add('apex','Apex attack','Confirm hit or miss');
 const creatures=(s.summons||[]).map(t=>({...t,returnAllowed:t.kind==='swarm'&&t.hp>0,returnAmount:t.kind==='swarm'&&t.hp>0?(t.hp<t.maxHP/2?1:2):0}));
 const pendingReturns=[...activities.filter(a=>a.refund).map(a=>({id:a.id,name:a.name,...a.refund})),...creatures.filter(t=>t.returnAllowed).map(t=>({id:t.id,name:t.name,amount:t.returnAmount,trigger:'When the living swarm returns'}))];
 const actions=availableEntomancerActions(c).map(a=>{
  const cost=a.id==='corpse-jacker'?(p.level>=18?1:2):a.cost;
  const active=!!s.effects?.[effectKeys[a.id]]?.remaining||a.id==='harmonize'&&p.song||a.id==='strength'&&!!s.strengthStrike||a.id==='psychic-save'&&!!s.psychicSave||a.id==='latch'&&!!latch;
  const usedDaily=!!s.daily?.[dailyKeys[a.id]];
  let reason=!setupComplete?'Complete swarm setup':blockedReason&&!(a.id==='dead-man'&&!s.dead&&c.hp?.current===0)?blockedReason:'';
  if(!reason&&usedDaily)reason=a.id==='hungry-mouths'?'Used · fed long rest required':'Used · long rest required';
  if(!reason&&active&&['bug-armor','decompose','harmonize','strength','psychic-save','latch'].includes(a.id))reason='Already active';
  if(!reason&&(cost||0)>p.remaining)reason=`Needs ${cost} Population`;
  if(!reason&&a.id==='hungry-mouths'&&!p.forageEnvironment)reason='Needs a matching environment';
  if(!reason&&a.id==='apex-attack'&&!p.form)reason='Enter Swarm Form first';
  if(!reason&&['sonnet','serenade'].includes(a.id)&&!p.song)reason='Start Harmonize first';
  if(!reason&&a.id==='dead-man'&&c.hp?.current!==0)reason='Triggers at 0 HP';
  if(!reason&&a.id==='pure-terror'&&!latch)reason='Latch onto a target first';
  if(!reason&&a.id==='infest'&&!p.remaining)reason='Needs Population';
  if(!reason&&a.id==='corpse-jacker'&&creatures.filter(t=>t.kind==='zombie').length>=Math.max(1,p.wis))reason='Zombie control limit reached';
  if(!reason&&a.id==='end-condition'&&!['charmed','frightened'].some(k=>(Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',')).some(n=>n.trim().toLowerCase()===k)))reason='No Charmed or Frightened condition to end';
  const fields=[];
  if(targetActions.includes(a.id))fields.push('target','distance');
  if(['entomancy','infest','corpse-jacker','latch'].includes(a.id))fields.push('type');
  if(['corpse-jacker','decompose'].includes(a.id))fields.push('size');
  if(a.id==='infest')fields.push('points');
  if(a.id==='entomancy')fields.push('cr');
  if(a.id==='many-eyed')fields.push('detected');
  if(a.id==='latch'){fields.push('grappled');if(p.level>=14)fields.push('failedSave');}
  if(a.id==='bug-armor'&&(c.hp?.temp||0)>0)fields.push('replaceTemp');
  if(['summon','corpse-jacker'].includes(a.id))fields.push('maxHP');
  if(a.id==='hungry-mouths')fields.push('hours');
  if(a.id==='end-condition')fields.push('condition');
  if(a.id==='apex-attack')fields.push('ability');
  if(a.id==='serenade')fields.push('hp','canHear');
  const save=saveActions.includes(a.id)?{ability:a.id==='entomancy'||['pure-terror','sonnet'].includes(a.id)?'Wisdom':a.id==='pestilence'?'Dexterity':'Constitution',dc:['infest','pure-terror'].includes(a.id)?p.uncertainDC:['sonnet','entomancy'].includes(a.id)?p.spellDC:p.populationDC,ruling:['infest','pure-terror'].includes(a.id)}:null;
  if(save)fields.push('success');
  return {...a,cost,costLabel:a.id==='decompose'?'Commit available Population':a.id==='hungry-mouths'?'Foraging recovery':cost==null?'Choose Population':cost===0?'Free':`${cost} Population`,active,usedDaily,available:!reason,unavailableReason:reason,fields,save};
 });
 const a=actions.find(a=>a.id===actionId)||actions.find(a=>a.id==='pestilence')||actions[0];let selected=null;
 if(a){
  const values={target:'',distance:0,type:a.id==='entomancy'?'insect':'humanoid',size:'Medium',points:1,maxHP:22,hours:1,hp:1,cr:0,ability:'dex',success:null,...inputs},errors={};
  if(a.fields.includes('target')&&a.id!=='summon'&&!String(values.target).trim())errors.target='Name the target or corpse.';
  const range=['pestilence','bug-swarm','entomancy','decompose'].includes(a.id)?30:a.id==='summon'?10:a.id==='many-eyed'?100:['sonnet','serenade'].includes(a.id)?p.songRange:['infest','latch','corpse-jacker','apex-attack'].includes(a.id)?5:Infinity;
  if(a.fields.includes('distance')&&(!Number.isFinite(values.distance)||values.distance<0||values.distance>range))errors.distance=`Enter a distance from 0 to ${range===Infinity?'the target':range} feet.`;
  if(a.save&&typeof values.success!=='boolean')errors.success='Choose whether the target failed or succeeded on its save.';
  if(a.id==='infest'&&(!positiveInteger(values.points)||values.points>p.remaining))errors.points=`Choose 1–${p.remaining} whole Population.`;
  if(a.fields.includes('maxHP')&&!positiveInteger(values.maxHP))errors.maxHP='Enter positive whole maximum HP.';
  if(a.id==='entomancy'&&(!Number.isFinite(values.cr)||values.cr<0||values.cr>0.125||values.type!=='insect'))errors.cr='Requires an insect of CR 1/8 or lower.';
  if(a.id==='infest'&&['construct','elemental'].includes(values.type))errors.type='This creature type is immune.';
  if(a.id==='latch'&&['construct','undead','elemental','ooze'].includes(values.type))errors.type='This creature type is immune.';
  if(a.id==='corpse-jacker'&&(values.type!=='humanoid'||!['Medium',...(p.level>=18?['Large']:[])].includes(values.size)))errors.type='Choose an eligible humanoid corpse.';
  if(a.id==='decompose'&&!['Tiny','Small','Medium','Large'].includes(values.size))errors.size='Choose a corpse no larger than Large.';
  if(['decompose','corpse-jacker'].includes(a.id)&&(s.corpses||[]).includes(String(values.target).trim().toLowerCase()))errors.target='This corpse has already been used.';
  for(const key of ['detected','grappled','replaceTemp','canHear'])if(a.fields.includes(key)&&!values[key])errors[key]='Confirm this requirement before using the ability.';
  if(a.id==='hungry-mouths'&&(!positiveInteger(values.hours)))errors.hours='Complete at least one whole hour.';
  if(a.id==='serenade'&&!positiveInteger(values.hp))errors.hp='The ally must have at least 1 HP.';
  if(a.id==='end-condition'&&!['Charmed','Frightened'].includes(values.condition))errors.condition='Choose the condition to end.';
  selected={...a,inputs:values,errors,cost:a.id==='infest'?values.points:a.cost,canResolve:a.available&&!Object.keys(errors).length};
 }
 return {supported:p.level>0,profile:p,setupComplete,blockedReason,summary:{available:p.remaining,max:p.max,unavailable:p.max-p.remaining,activityCount:activities.length,creatureCount:creatures.length},actions,selected,activities,creatures,recovery:{shortRecovery:p.settings.shortRecovery==null?Math.floor(p.max/2):Math.max(0,Math.floor(Number(p.settings.shortRecovery)||0)),shortRequiresFood:!!p.settings.shortRestRequiresFood,longRequiresFood:true,pendingReturns}};
}
