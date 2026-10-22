import {entomancerProfile,entomancerResource,populationId,entomancerActionBlockReason,entomancerSongSaves} from './entomancer.js';
import {entomancerActionDetails} from '../data/entomancerActionDetails.js';
const integer=(v,min=0)=>{const n=Number(v);if(!Number.isInteger(n)||n<min)throw Error(`Enter a whole number of at least ${min}.`);return n;};
const state=c=>{const {songSaveDC,...saved}=c.entomancer||{};return {...saved,songSaveDCs:entomancerSongSaves(c),effects:Object.fromEntries(Object.entries(saved.effects||{}).filter(([,effect])=>effect&&typeof effect==='object')),daily:{...saved.daily},targets:(saved.targets||[]).map(t=>({...t,conditions:[...t.conditions||[]],timers:{...t.timers}})),summons:(saved.summons||[]).map(t=>({...t})),corpses:[...saved.corpses||[]]};};
const stopSong=s=>{s.song=false;s.songSaveDCs=[];};
export function reconcileEntomancerActivity(c){
 const p=entomancerProfile(c);if(!p.level)return c;
 const s=state(c);if(!p.song)stopSong(s);
 return {...c,entomancer:s};
}
function reserve(c,used){const d=entomancerResource(c);if(!d)return c;const others=(c.resources||[]).filter(r=>r.id!==populationId&&r.classResourceKey!==populationId);return {...c,resources:[...others,{...d,used:Math.max(0,used)}]};}
function spend(c,n){integer(n);const p=entomancerProfile(c);if(n>p.remaining)throw Error('Not enough Population remaining.');return reserve(c,p.used+n);}
function refund(c,n){return reserve(c,Math.max(0,entomancerProfile(c).used-Math.max(0,n)));}
const heal=(c,n)=>({...c,hp:{...c.hp,current:c.entomancer?.dead?c.hp.current:Math.min(c.hp.max,c.hp.current+Math.max(0,n))}});
const fail=(condition,message)=>{if(condition)throw Error(message);};
const dice=(count,sides,random)=>Array.from({length:count},()=>1+Math.floor(random()*sides)).reduce((a,b)=>a+b,0);
const log=(c,text)=>{c.entomancer.log=[...(c.entomancer.log||[]).slice(-29),text];return c;};
export const entomancerActions=[
 ['entomancy','Entomancy',1,'',0,'Action','Animal Friendship; insects only, CR ≤ 1/8.'],
 ['pestilence','Glaring Pestilence',1,'',1,'Bonus action','30 ft; Dexterity save; 1d6 necrotic and blinded on failure.'],
 ['bug-swarm','Bug Swarm',1,'',2,'Action','30 ft; Constitution save; 2d12 + Wisdom necrotic, half on success.'],
 ['summon','Swarm Summon',1,'',2,'Table ruling','Summon within 10 ft. Commands use a bonus action. Returning living swarms refund 1 below half HP, otherwise 2.'],
 ['bug-armor','Bug Armor',1,'',3,'Bonus action / reaction','Temporary HP = 5 × Wisdom for 1 minute. Refund 3/1/0 when none/some/all of that armor was lost.'],
 ['infest','Crawling Sensation',5,'',null,'Melee attack action','Invest Population; failed Constitution save infests a non-construct, non-elemental target.'],
 ['many-eyed','Locate with Many-Eyed',7,'',1,'Action','Locate a previously detected hidden or invisible entity within 100 ft.'],
 ['psychic-save','Hive Mind save',13,'',3,'Reaction','Roll the triggering save against a psychic attack with advantage.'],
 ['end-condition','Hive Mind cleanse',13,'',2,'Bonus action','End one charm or fear effect on yourself.'],
 ['hungry-mouths','Hungry Mouths',15,'',null,'1 hour','Once per long rest in an adapted environment; commit available Population and recover twice that amount, or 1 when empty.'],
 ['swarm-form','Swarm Form',17,'',0,'Action','Once per long rest; 1 minute, bonus action to end. Reaching 0 HP causes immediate death.'],
 ['invisible','Apex invisibility',20,'',3,'Action','Wisdom + Constitution minutes; no concentration; persists through attacks and spells.'],
 ['apex-attack','Apex attack',20,'',0,'Action','Once per long rest in Swarm Form; damage equals current HP.'],
 ['corpse-jacker','Corpse Jacker',6,'Decomposers',null,'Action','Touch a fresh humanoid corpse. Medium; also Large at level 18.'],
 ['decompose','Decomposition',10,'Decomposers',null,'Action','Corpse within 30 ft; commit all available Population for 0/1/2/4 turns by Tiny/Small/Medium/Large size.'],
 ['dead-man','Dead Man Walking',14,'Decomposers',3,'At 0 HP','Once per long rest, remain at 1 HP. Swarm Form death takes precedence unless your saved ruling allows this feature.'],
 ['latch','Hemo Vamprisis',1,'Endo-Gotas',1,'After successful grapple','Latch onto a living target; excluded types: constructs, undead, elementals, oozes.'],
 ['pure-terror','Pure Terror',18,'Endo-Gotas',1,'While latched','Visible hostiles make Wisdom saves or become frightened for 5 minutes.'],
 ['strength','Monstrous Strength strike',6,'Exo-Gotas',2,'Melee weapon attack','+2 on the next melee weapon attack and damage.'],
 ['reflex-armor','Enhanced Exoskeleton reaction',14,'Exo-Gotas',2,'Reaction','+2 AC for the duration in saved rulings.'],
 ['invicta','Invicta resistance',18,'Exo-Gotas',4,'Table ruling','2 minutes: resistance to damage types to which you are not vulnerable.'],
 ['harmonize','Harmonize',6,'Orthoptera',0,'Action','Sing; allies add Wisdom to saves. Damage prompts a Constitution concentration check.'],
 ['sonnet','Sonic Sonnet',10,'Orthoptera',0,'Hostile turn start','Wisdom save against spell DC; Wisdom + Constitution + proficiency psychic damage, half on success.'],
 ['serenade','Soothing Serenade',18,'Orthoptera',0,'Ally turn start','A hearing ally in song range with at least 1 HP heals Wisdom modifier.']
].map(([id,name,level,species,cost,activation,description])=>({id,name,level,species,cost,activation,description,fullDescription:entomancerActionDetails[id]}));
export function availableEntomancerActions(c){const p=entomancerProfile(c);return entomancerActions.filter(a=>p.level>=a.level&&(!a.species||a.species===p.species));}
function finishArmor(c){const a=c.entomancer.effects.bugArmor;if(!a)return c;const n=a.left>=a.initial?3:a.left>0?1:0;c=refund(c,n);if(!a.replaced)c.hp={...c.hp,temp:Math.max(0,(c.hp.temp||0)-a.left)};delete c.entomancer.effects.bugArmor;return log(c,`Bug Armor ended; ${n} Population returned.`);}
export function observeEntomancerHP(before,after){
 if(!entomancerProfile(after).level)return after;
 after=reconcileEntomancerActivity(after);
 if(entomancerActionBlockReason(before))stopSong(after.entomancer);
 const a=before.entomancer?.effects?.bugArmor;if(!a||after.entomancer?.effects?.bugArmor!==a)return after;
 if(before.hp?.temp===after.hp?.temp)return after;
 const next=state(after),delta=Number(before.hp?.temp||0)-Number(after.hp?.temp||0);
 next.effects.bugArmor={...a,left:a.replaced?a.left:Math.max(0,a.left-Math.max(0,delta)),replaced:a.replaced||delta<0};
 return {...after,entomancer:next};
}
export function entomancerDamage(c,amount,{type='',magical=false,vulnerable=false,deadMan=false}={}){
 amount=integer(amount);const p=entomancerProfile(c);if(!p.level)return c;
 let n=amount;if(!magical&&['bludgeoning','piercing','slashing'].includes(type))n=Math.max(0,n-p.physicalReduction);
 const resistant=p.resistances.includes(type)||p.nonmagicalSlashing&&!magical&&type==='slashing'||p.allResistance&&!!type&&!vulnerable;
 if(resistant)n=Math.floor(n/2);if(vulnerable)n*=2;
 const absorbed=Math.min(c.hp.temp||0,n),hp={...c.hp,temp:(c.hp.temp||0)-absorbed,current:Math.max(0,c.hp.current-(n-absorbed))};
 let next=observeEntomancerHP(c,{...c,hp});next={...next,entomancer:state(next)};
 if(p.song&&hp.current>0&&n>0)next.entomancer.songSaveDCs.push(Math.max(10,Math.floor(n/2)));
 if(!hp.current&&p.form)next.entomancer.dead=true;
 if(c.hp.current>0&&!c.entomancer?.dead&&!hp.current&&deadMan&&p.species==='Decomposers'&&p.level>=14&&!next.entomancer.daily.deadMan&&p.remaining>=3&&(!p.form||p.settings.deadManInSwarm)){next.entomancer.dead=false;next=applyEntomancerAction(next,'dead-man');}
 return log(next,`${n} ${type||'untyped'} damage taken${resistant?' (resistance)':''}${vulnerable?' (vulnerability)':''}.`);
}
export function entomancerRest(c,rest,{fed=false}={}){
 if(!entomancerProfile(c).level)return c;
 let next={...c,entomancer:state(c)};const p=entomancerProfile(next);
 next=applyEntomancerAction(next,'advance-time',{rounds:rest==='long'?4800:600});
 if(rest==='long'){next.entomancer.daily=!fed&&next.entomancer.daily.hungryMouths?{hungryMouths:true}:{};stopSong(next.entomancer);next.entomancer.latch=null;next.entomancer.strengthStrike=false;next.entomancer.psychicSave=false;delete next.entomancer.lastAction;}
 if(rest==='long'&&fed)next=reserve(next,0);
 if(rest==='short'&&(!p.settings.shortRestRequiresFood||fed))next=refund(next,p.settings.shortRecovery==null?Math.floor(p.max/2):integer(p.settings.shortRecovery));
 return next;
}
export function applyEntomancerAction(character,id,input={},random=Math.random){
 let c=reconcileEntomancerActivity({...character,hp:{...character.hp},entomancer:state(character)}),s=c.entomancer,p=entomancerProfile(c);
 fail(!p.level,'This character has no supported Entomancer class.');
 const blocked=entomancerActionBlockReason(c),cleanup=['advance-time','clear-target','dismiss-summon','summon-hp','end-song','end-grapple','toxin-save','apex-hit','consume-strike','consume-psychic-save'];
 fail(blocked&&!cleanup.includes(id)&&!(id==='dead-man'&&!s.dead),blocked);
 const a=entomancerActions.find(a=>a.id===id);
 let result;
 if(a){fail(p.level<a.level||a.species&&a.species!==p.species,'This action requires the listed species and class level.');if(a.cost)c=spend(c,a.cost);}
 const once=key=>{fail(s.daily[key],'This ability was already used before your next long rest.');s.daily[key]=true;};
 const target=(range=Infinity)=>{fail(!String(input.target||'').trim(),'Name the target.');fail(Number(input.distance||0)>range,'Target is out of range.');const name=String(input.target).trim();let t=s.targets.find(t=>t.name===name);if(!t){t={id:crypto.randomUUID(),name,type:input.type||'humanoid',damage:0,conditions:[]};s.targets.push(t);}return t;};
 const effect=(key,rounds,extra={})=>{s.effects[key]={remaining:Math.max(0,rounds),...extra};};
 const freshCorpse=()=>{fail(!input.target?.trim(),'Name the corpse.');fail(s.corpses.includes(input.target.trim().toLowerCase()),'This corpse was already used.');s.corpses.push(input.target.trim().toLowerCase());};
 const timed=(t,condition,rounds)=>{t.conditions=[...new Set([...t.conditions,condition])];t.timers={...t.timers,[condition]:rounds};};
 const physicalHP=n=>Math.max(0,n);
 switch(id){
 case 'entomancy':{const t=target(30);fail(input.type!=='insect'||Number(input.cr)>0.125,'Entomancy requires an insect of CR 1/8 or lower.');if(!input.success)timed(t,'Charmed (Animal Friendship)',14400);result={saveAbility:'Wisdom',saveDC:p.spellDC,saveSucceeded:!!input.success,conditions:input.success?[]:['Charmed (Animal Friendship)']};break;}
 case 'pestilence':{const t=target(30),damage=input.success?0:dice(1,6,random);if(!input.success){t.damage+=damage;timed(t,'Blinded',2);}result={damage,damageType:'necrotic',saveAbility:'Dexterity',saveDC:p.populationDC,saveSucceeded:!!input.success,conditions:input.success?[]:['Blinded until the end of the next round']};break;}
 case 'bug-swarm':{const t=target(30),roll=Math.max(0,dice(2,12,random)+p.wis),damage=input.success?Math.floor(roll/2):roll;t.damage+=damage;result={roll,damage,formula:`2d12 ${p.wis<0?'-':'+'} ${Math.abs(p.wis)}`,saveDC:p.populationDC,saveSucceeded:!!input.success};break;}
 case 'summon':{fail(Number(input.distance||0)>10,'Summon is out of range.');const maxHP=integer(input.maxHP??22,1);s.summons.push({id:crypto.randomUUID(),kind:'swarm',name:input.target||'Insect swarm',hp:maxHP,maxHP});break;}
 case 'return-swarm':{const summon=s.summons.find(t=>t.id===input.id&&t.kind==='swarm');fail(!summon||summon.hp<=0,'No living summon to return.');c=refund(c,summon.hp<summon.maxHP/2?1:2);s.summons=s.summons.filter(t=>t.id!==input.id);break;}
 case 'summon-hp':{const summon=s.summons.find(t=>t.id===input.id);fail(!summon,'Summon not found.');summon.hp=Math.min(summon.maxHP,integer(input.hp));break;}
 case 'dismiss-summon':fail(!s.summons.some(t=>t.id===input.id),'Summon not found.');s.summons=s.summons.filter(t=>t.id!==input.id);break;
 case 'bug-armor':fail(!!s.effects.bugArmor,'Bug Armor is already active.');fail((c.hp.temp||0)>0&&!input.replaceTemp,'Confirm replacement of existing temporary HP.');c.hp.temp=Math.max(0,5*p.wis);effect('bugArmor',10,{initial:c.hp.temp,left:c.hp.temp});break;
 case 'infest':{const t=target(input.reach??5);fail(['construct','elemental'].includes(input.type),'This target is immune.');const points=integer(input.points,1);c=spend(c,points);if(!input.success){t.infestation={points,remaining:Math.max(0,p.wis*10)};timed(t,'Infested: disadvantage on CON checks/saves and attacks',Math.max(0,p.wis*10));}result={saveAbility:'Constitution',saveDC:p.uncertainDC,saveSucceeded:!!input.success,conditions:input.success?[]:[`Infested for ${Math.max(0,p.wis)} minutes · bonus action damage ${points}d8 necrotic`]};break;}
 case 'infestation-damage':{fail(p.level<5,'Requires level 5.');const t=s.targets.find(t=>t.id===input.id);fail(!t?.infestation?.remaining,'No active infestation.');fail(Number(input.distance)>60,'Target is out of range.');t.damage+=dice(t.infestation.points,8,random);break;}
 case 'many-eyed':fail(!input.detected,'Confirm that this entity was previously detected.');target(100);break;
 case 'psychic-save':s.psychicSave=true;break;
 case 'consume-psychic-save':s.psychicSave=false;break;
 case 'end-condition':{const conditions=Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',').map(x=>x.trim());fail(!['charmed','frightened'].includes(String(input.condition).toLowerCase())||!conditions.some(x=>x.toLowerCase()===input.condition.toLowerCase()),'Choose an active Charmed or Frightened condition.');c.conditions=conditions.filter(x=>x.toLowerCase()!==input.condition.toLowerCase());break;}
 case 'hungry-mouths':fail(!p.forageEnvironment,'Hungry Mouths requires an adapted environment.');fail(Number(input.hours)<1,'Complete one hour of foraging.');once('hungryMouths');c=spend(c,p.remaining);c=refund(c,p.remaining?2*p.remaining:1);break;
 case 'swarm-form':once('swarmForm');effect('swarmForm',10);break;
 case 'end-form':delete s.effects.swarmForm;break;
 case 'invisible':effect('invisible',(p.wis+p.con)*10);break;
 case 'apex-attack':fail(!p.form,'Enter Swarm Form first.');once('apexAttack');{const t=target(input.reach??5),attack=dice(1,20,random)+(input.ability==='str'?p.str:p.dex)+p.wis+p.pb;s.pendingApex={targetId:t.id,damage:c.hp.current,attack};log(c,`Apex attack ${attack}; damage on a hit: ${c.hp.current}.`);}break;
 case 'apex-hit':{fail(!s.pendingApex,'No pending Apex attack.');const t=s.targets.find(t=>t.id===s.pendingApex.targetId);fail(!t,'Target not found.');if(input.hit)t.damage+=s.pendingApex.damage;s.pendingApex=null;break;}
 case 'corpse-jacker':{fail(input.type!=='humanoid'||!['Medium',...(p.level>=18?['Large']:[])].includes(input.size),'Requires an eligible humanoid corpse.');fail(Number(input.distance||0)>5,'Touch the corpse.');fail(s.summons.filter(t=>t.kind==='zombie').length>=Math.max(1,p.wis),'Zombie control limit reached.');freshCorpse();c=spend(c,p.level>=18?1:2);const maxHP=integer(input.maxHP??22,1);s.summons.push({id:crypto.randomUUID(),kind:'zombie',name:input.target,hp:maxHP,maxHP,remaining:Math.max(1,p.wis)*14400});break;}
 case 'decompose':{fail(s.effects.decompose,'Decomposition is already active.');fail(Number(input.distance||0)>30,'Corpse is out of range.');const rounds={Tiny:0,Small:1,Medium:2,Large:4}[input.size];fail(rounds==null,'Choose a corpse no larger than Large.');freshCorpse();c=spend(c,p.remaining);effect('decompose',rounds,{committed:p.remaining,turns:rounds});if(!rounds){c=refund(c,p.remaining);if(p.level>=18)c=heal(c,p.con+p.max);delete s.effects.decompose;}break;}
 case 'dead-man':fail(c.hp.current!==0,'Dead Man Walking triggers only at 0 HP.');fail(p.form&&!p.settings.deadManInSwarm,'Swarm Form causes immediate death under the saved ruling.');once('deadMan');c.hp.current=1;s.dead=false;c.deathSaves={success:0,failure:0};break;
 case 'latch':{fail(!input.grappled,'Confirm a successful grapple first.');fail(['construct','undead','elemental','ooze'].includes(input.type),'This target is immune.');const t=target(input.reach??5);s.latch={targetId:t.id};if(p.level>=14&&input.failedSave)timed(t,'Paralyzed',Infinity);break;}
 case 'end-grapple':s.latch=null;break;
 case 'hemo':{fail(p.species!=='Endo-Gotas'||!s.latch,'Latch onto a grappled target first.');fail(input.timing==='target-end'&&p.level<14,'Target-end damage requires level 14.');const t=s.targets.find(t=>t.id===s.latch.targetId);fail(!t,'Latched target not found.');const amount=integer(input.actualDamage);t.damage+=amount;c=heal(c,amount);if(p.level>=14&&input.failedSave)timed(t,'Paralyzed',Infinity);break;}
 case 'toxin-save':{const t=s.targets.find(t=>t.id===input.id);fail(!t,'Target not found.');if(input.success){t.conditions=t.conditions.filter(x=>x!=='Paralyzed');delete t.timers?.Paralyzed;}break;}
 case 'pure-terror':fail(!s.latch,'Latch onto a grappled target first.');effect('terror',1,{resolved:[]});if(input.target?.trim()){const t=target();s.effects.terror.resolved.push(t.id);if(!input.success)timed(t,'Frightened',50);}break;
 case 'terror-save':{fail(p.species!=='Endo-Gotas'||p.level<18||!s.effects.terror,'No active Pure Terror saving throws.');const t=target();fail(s.effects.terror.resolved.includes(t.id),'This target already resolved this Terror save.');s.effects.terror={...s.effects.terror,resolved:[...s.effects.terror.resolved,t.id]};if(!input.success)timed(t,'Frightened',50);break;}
 case 'strength':s.strengthStrike=true;break;
 case 'consume-strike':s.strengthStrike=false;break;
 case 'reflex-armor':effect('reflexArmor',integer(p.settings.reflexArmorRounds??1,1));break;
 case 'invicta':effect('invicta',20);break;
 case 'harmonize':fail(p.song,'Harmonize is already active.');s.song=true;s.songSaveDCs=[];break;
 case 'end-song':stopSong(s);break;
 case 'song-save':fail(!p.song||!s.songSaveDCs.length,'No song concentration check is pending.');s.songSaveDCs.shift();if(!input.success)stopSong(s);break;
 case 'move':case 'other-action':if(p.song&&p.level<14)stopSong(s);break;
 case 'sonnet':{fail(!p.song,'Start Harmonize first.');const t=target(p.songRange),n=Math.max(0,p.wis+p.con+p.pb),damage=input.success?Math.floor(n/2):n;t.damage+=damage;result={damage,damageType:'psychic',saveAbility:'Wisdom',saveDC:p.spellDC,saveSucceeded:!!input.success};break;}
 case 'serenade':{fail(!p.song,'Start Harmonize first.');fail(Number(input.hp)<1||!input.canHear,'The ally must have at least 1 HP and hear the song.');const t=target(p.songRange),healing=physicalHP(p.wis);t.healing=(t.healing||0)+healing;result={healing};break;}
 case 'clear-target':s.targets=s.targets.filter(t=>t.id!==input.id);if(s.latch?.targetId===input.id)s.latch=null;break;
 case 'advance-time':{const rounds=integer(input.rounds);for(const [key,value] of Object.entries(s.effects)){s.effects[key]={...value,remaining:Math.max(0,value.remaining-rounds)};if(s.effects[key].remaining>0)continue;if(key==='bugArmor')c=finishArmor(c);else if(key==='decompose'){c=refund(c,value.committed+value.turns);if(p.species==='Decomposers'&&p.level>=18)c=heal(c,p.con+p.max);delete s.effects[key];}else delete s.effects[key];}
   for(const t of s.targets){if(t.infestation)t.infestation={...t.infestation,remaining:Math.max(0,t.infestation.remaining-rounds)};for(const [condition,n] of Object.entries(t.timers||{})){if(n===null)continue;t.timers={...t.timers,[condition]:Math.max(0,n-rounds)};if(t.timers[condition]===0)t.conditions=t.conditions.filter(x=>x!==condition);}}
   s.summons=s.summons.map(t=>t.remaining==null?t:{...t,remaining:Math.max(0,t.remaining-rounds)}).filter(t=>t.remaining!==0);break;}
 default:throw Error('Unknown Entomancer action.');
 }
 // A null timer denotes a condition that ends through its repeat save, not time.
 for(const t of s.targets)for(const [key,n] of Object.entries(t.timers||{}))if(n===Infinity)t.timers[key]=null;
 if(a&&p.song&&p.level<14&&['Action','Melee attack action','Melee weapon attack'].includes(a.activation)&&id!=='harmonize')stopSong(s);
 c.entomancer=s;
 if(a)s.lastAction={id:a.id,name:a.name,target:String(input.target||'').trim()||null,populationSpent:Math.max(0,entomancerProfile(c).used-p.used),...result};
 return log(c,a?`${a.name} resolved${a.cost?`; ${a.cost} Population spent`:''}.`:`${id.replaceAll('-',' ')} resolved.`);
}
