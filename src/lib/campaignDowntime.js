import {campaignProfile,hasConversionFeat,campaignCystSpells,acquireCampaignSpell,castCampaignSpell,advanceCampaignTime} from './archivistCampaign.js';
import {graftRecipes,necroticRules,scrollScribingCosts} from '../data/campaignExpansion.js';
import {archivistMaterial,supplyArchivistComponents} from './archivistComponents.js';
import {spendCampaignGold} from './campaignEconomy.js';
import {whole,updateCreature,creatureProfile} from './campaignCreatures.js';
import {campaignModifiers,graftModifiers} from './campaignModifiers.js';
import {archivistFeatureEnabled} from './archivistFeatures.js';
import {assertCampaignCanAct} from './campaignActivity.js';
export function campaignRecipe(c,id){
 const base=graftRecipes.find(recipe=>recipe.id===id);
 if(!base)return null;
 const recipe={...base,...c.archivistCampaign?.rulings?.graftRecipes?.[id]};
 return {...recipe,hours:Math.max(2,Math.ceil(recipe.cost/500))*8};
}
const findSpell=(c,id)=>[...(c.spells||[]).filter(s=>s.castingClassId==='homebrew:darkdonte:archivist'),...campaignCystSpells(c)].find(s=>s.catalogId===id);
function recipient(c,id){return id==='self'?{grafts:c.archivistCampaign?.grafts||[],hp:c.hp,type:'humanoid'}:c.archivistCampaign?.creatures?.find(n=>n.id===id);}
function eligibleGraft(c,id,recipe){
 const n=recipient(c,id);
 if(!n||n.dead||n.soulDestroyed||n.incorporeal||['construct','undead'].includes(String(n.type).toLowerCase()))throw Error('A living corporeal recipient is required.');
 if(n.grafts?.some(g=>g.recipeId===recipe.id))throw Error('Recipient already has this graft.');
}
export function startCampaignProject(c,{kind,spell,recipeId,targetId='self',source='',scrollId='',copySource='scroll',materialsConfirmed=false,prerequisitesConfirmed=false,componentsConfirmed=false,componentItemId=''}={}){
 assertCampaignCanAct(c);
 const p=campaignProfile(c),r=p.rulings;if(!materialsConfirmed)throw Error('Confirmed materials/workspace required.');
 if(kind!=='graft'&&!p.archivist)throw Error('Archivist required for prayerbook copying and Scribe Scroll.');
 let cost,hours,record,recipe,next=c;
 if(kind==='graft'){
  if(!hasConversionFeat(c,'Graft Flesh: Silthilar'))throw Error('Choose Graft Flesh: Silthilar before creating grafts.');recipe=campaignRecipe(c,recipeId);if(!recipe)throw Error('Unknown graft recipe.');eligibleGraft(c,targetId,recipe);
  if(recipe.prerequisites.length&&!prerequisitesConfirmed)throw Error(`Confirm the required graft spells from you or a qualified collaborator: ${recipe.prerequisites.join(', ')}.`);
  cost=recipe.cost;hours=recipe.hours;
 }else if(kind==='copy'){
  if(!['scroll','book'].includes(copySource))throw Error('Choose a divine scroll or book as the source.');
  if(!spell?.level)throw Error('Cantrips cannot be copied from scrolls using the 5e Wizard procedure.');
  acquireCampaignSpell(c,spell,{channel:'outside',source,confirmed:true});record=spell;cost=50*spell.level;hours=2*spell.level;
  if(scrollId&&copySource==='scroll'){const item=c.inventory?.find(i=>i.id===scrollId);if(!item||Number(item.qty)<1||item.campaignScroll?.spell?.catalogId&&item.campaignScroll.spell.catalogId!==spell.catalogId)throw Error('Choose an available scroll of this spell.');next={...c,inventory:c.inventory.map(i=>i.id===scrollId?{...i,qty:Number(i.qty)-1}:i)};}
 }else if(kind==='backup'){
  record=(c.spells||[]).find(s=>s.castingClassId==='homebrew:darkdonte:archivist'&&s.catalogId===spell?.catalogId&&s.level>0);
  if(!record)throw Error('Choose a leveled spell already recorded in your prayerbook.');
  if((c.inventory||[]).some(i=>i.prayerbookBackup?.some(s=>s.catalogId===record.catalogId)))throw Error('This spell is already recorded in the backup prayerbook.');
  cost=Number(r.backupGoldPerLevel??10)*record.level;hours=Number(r.backupHoursPerLevel??1)*record.level;
 }else if(kind==='scroll'){
  if(!archivistFeatureEnabled(c,'Scribe Scroll'))throw Error('Scribe Scroll is disabled by your DM.');
  if(!c.skillProf?.Arcana&&!c.expertise?.Arcana)throw Error('Scribing requires Arcana proficiency.');
  record=findSpell(c,spell?.catalogId);if(!record||record.level>p.maxSpellLevel||record.level&&!record.prepared&&!record.campaignCyst)throw Error('Prepare an available prayerbook spell or choose an unlocked cyst spell.');
  const {hasMaterial}=archivistMaterial(record);
  if(hasMaterial&&!componentsConfirmed)throw Error('Supply the necessary spell material components for scribing.');
  next=supplyArchivistComponents(c,record,{componentsConfirmed,componentItemId});
  const schedule=scrollScribingCosts[record.level];
  if(!schedule)throw Error('Choose a spell of a valid level.');
  cost=schedule.cost;hours=schedule.days*8;
  const ruleId=record.catalogId.replace('darkdonte:',''),rule={...necroticRules[ruleId],...r.spellRules?.[ruleId]};
  const spellCost=Number(rule.cost||0);if(!Number.isFinite(spellCost)||spellCost<0)throw Error('Invalid spell material cost.');cost+=spellCost;
 }else throw Error('Choose copying, scroll scribing or grafting.');
 whole(hours,'Project hours',1,100000);if(!Number.isFinite(cost)||cost<0)throw Error('Invalid project cost.');
 const paid=spendCampaignGold(next,cost),job={id:crypto.randomUUID(),kind,spell:record,recipe,targetId,source,cost,hours,worked:0,status:'active',name:recipe?.name||record.name,...(kind==='copy'?{copyRules:copySource==='scroll'?'5e-scroll':'5e-book',arcanaDC:10+record.level,scrollId:copySource==='scroll'?scrollId:'',scrollConsumed:copySource==='scroll'}: {})};
 return {...paid,archivistCampaign:{...paid.archivistCampaign,projects:[...(paid.archivistCampaign?.projects||[]),job]}};
}
function project(c,id){const job=c.archivistCampaign?.projects?.find(p=>p.id===id);if(!job||job.status!=='active')throw Error('Project is not active or already completed.');return job;}
function requireProjectSource(c,j){if(j.kind==='graft'&&!hasConversionFeat(c,'Graft Flesh: Silthilar'))throw Error('Graft Flesh feat required for this project.');if(j.kind==='scroll'&&!archivistFeatureEnabled(c,'Scribe Scroll'))throw Error('Scribe Scroll is disabled by your DM.');if(j.kind!=='graft'&&!campaignProfile(c).archivist)throw Error('Archivist required for this project.');}
const setJob=(c,id,values)=>({...c,archivistCampaign:{...c.archivistCampaign,projects:c.archivistCampaign.projects.map(j=>j.id===id?{...j,...values}:j)}});
export function workCampaignProject(c,id,hours){assertCampaignCanAct(c);const j=project(c,id);requireProjectSource(c,j);if(!Number.isFinite(hours)||hours<=0||hours>j.hours-j.worked)throw Error('Work hours must be positive and within the remaining project hours.');return setJob(advanceCampaignTime(c,hours*60),id,{worked:j.worked+hours});}
export function setCampaignProjectHours(c,id,hours){const j=project(c,id);if(typeof hours!=='number'||!Number.isFinite(hours)||hours<0||hours>j.hours)throw Error(`Completed hours must be between 0 and ${j.hours}.`);return setJob(c,id,{worked:hours});}
const graftRecipientDead=n=>n?.dead||n?.soulDestroyed||(Array.isArray(n?.conditions)?n.conditions:String(n?.conditions||'').split(',')).some(x=>String(x?.name??x).trim().toLowerCase()==='dead');
export function canTriggerSilthilarHeart(c,id,damage){const state=c.archivistCampaign||{},n=id==='self'?c:recipient(c,id),mods=id==='self'?campaignModifiers(c):graftModifiers(n?.grafts),used=id==='self'?state.heartUsedAt:n?.heartUsedAt,now=Number(state.clockMinutes||0);if(!n||!mods.heart||graftRecipientDead(n)||id==='self'&&(state.dead||c.entomancer?.dead||c.deathSaves?.failure>=3)||used!=null&&now-used<1440)return false;const hp=Number(n.hp?.current||0),effective=Math.max(0,damage-Number(n.hp?.temp||0));return hp>0&&effective>=hp&&effective-hp<Number(n.hp.max||0);}
export function finishCampaignProject(c,id,{arcana}={}){
 const j=project(c,id);if(j.worked<j.hours)throw Error('Complete the project work first.');let next=c;
 requireProjectSource(c,j);
 if(j.kind==='copy'){
  if(j.copyRules==='5e-scroll'){
   if(!Number.isInteger(arcana))throw Error('Roll or enter the Intelligence (Arcana) check total.');
   if(arcana<j.arcanaDC)return setJob(c,id,{status:'failed',arcana});
  }
  next=acquireCampaignSpell(c,j.spell,{channel:'outside',source:j.source,confirmed:true});
 }
 if(j.kind==='scroll')next={...c,inventory:[...(c.inventory||[]),{id:crypto.randomUUID(),name:`Scroll of ${j.spell.name}`,qty:1,weight:0,description:'Campaign scribed scroll; one use, no slot spent on activation.',campaignScroll:{spell:j.spell,level:j.spell.level}}]};
 if(j.kind==='backup'){
  const backup=(c.inventory||[]).find(i=>i.prayerbookBackup);
  if(backup?.prayerbookBackup.some(s=>s.catalogId===j.spell.catalogId))throw Error('The backup already contains this spell.');
  next={...c,inventory:backup?c.inventory.map(i=>i===backup?{...i,prayerbookBackup:[...i.prayerbookBackup,j.spell],description:[...i.prayerbookBackup,j.spell].map(s=>s.name).join(', ')}:i):[...(c.inventory||[]),{id:crypto.randomUUID(),name:'Backup prayerbook',qty:1,weight:3,prayerbookBackup:[j.spell],description:j.spell.name}]};
 }
 if(j.kind==='graft'){
  assertCampaignCanAct(c);
  eligibleGraft(c,j.targetId,j.recipe);
  const graft={id:crypto.randomUUID(),recipeId:j.recipe.id,effects:j.recipe};
  if(j.targetId==='self'){
   const before=campaignProfile(c).scores.con,grafts=[...(c.archivistCampaign.grafts||[]),graft],after=campaignProfile({...c,archivistCampaign:{...c.archivistCampaign,grafts}}).scores.con,hpGain=(Math.floor((after-10)/2)-Math.floor((before-10)/2))*c.level;
   next={...c,hp:{...c.hp,max:c.hp.max+hpGain,current:c.hp.current>0?c.hp.current+hpGain:0},archivistCampaign:{...c.archivistCampaign,grafts}};
  }else next=updateCreature(c,j.targetId,n=>{const before=creatureProfile(n).abilities.con,grafts=[...(n.grafts||[]),graft],after=creatureProfile({...n,grafts}).abilities.con,gain=(Math.floor((after-10)/2)-Math.floor((before-10)/2))*n.hitDice;return {...n,grafts,hp:{...n.hp,max:n.hp.max+gain,current:n.hp.current>0?n.hp.current+gain:0}};});
 }
 return setJob(next,id,{status:'completed',...(j.kind==='copy'?{arcana}: {})});
}
export function cancelCampaignProject(c,id){project(c,id);return setJob(c,id,{status:'cancelled'});}
export function useCampaignScroll(c,id){
 const item=c.inventory?.find(i=>i.id===id);if(!item?.campaignScroll||item.qty<1)throw Error('No usable campaign scroll.');
 const {spell,level}=item.campaignScroll,p=campaignProfile(c);if(!p.archivist||level>p.maxSpellLevel)throw Error('Scroll exceeds the current Archivist spell tier.');
 const spellId=spell.catalogId,original=c.spells,book=[...(c.spells||[]).filter(s=>s.catalogId!==spellId),{...spell,prepared:true,castingClassId:'homebrew:darkdonte:archivist'}];
 const cast=castCampaignSpell({...c,spells:book},spellId,{slot:level,confirmed:true,fromScroll:true});
 return {...cast,spells:original,slotsUsed:c.slotsUsed,inventory:c.inventory.map(i=>i.id===id?{...i,qty:i.qty-1}:i),archivistCampaign:{...cast.archivistCampaign,lastCast:{...cast.archivistCampaign.lastCast,scroll:true}}};
}
export function triggerSilthilarHeart(c,id,healing){whole(healing,'4d8+20 healing',24,52);const state=c.archivistCampaign||{},now=Number(state.clockMinutes||0),n=id==='self'?{...c,heartUsedAt:state.heartUsedAt}:recipient(c,id),mods=id==='self'?campaignModifiers(c):graftModifiers(n?.grafts);if(!mods.heart||!n||graftRecipientDead(n)||id==='self'&&(c.deathSaves?.failure>=3||c.archivistCampaign?.dead)||n.hp.current!==0||n.heartUsedAt!=null&&now-n.heartUsedAt<1440)throw Error('Heart requires a living recipient at 0 HP and 24 hours since its last use.');return id==='self'?{...c,concentration:null,hp:{...c.hp,current:Math.min(c.hp.max,healing)},deathSaves:{success:0,failure:0},archivistCampaign:{...state,heartUsedAt:now}}:updateCreature(c,id,n=>({...n,hp:{...n.hp,current:Math.min(n.hp.max,healing)},heartUsedAt:now}));}

// Observe completed HP updates, so damage from spells and other sheet tools also triggers the graft.
export function observeSilthilarHearts(before,after,roll){
 let next=after;
 for(const id of ['self',...(after.archivistCampaign?.creatures||[]).map(n=>n.id)]){
  const old=id==='self'?before:before.archivistCampaign?.creatures?.find(n=>n.id===id),current=id==='self'?next:next.archivistCampaign?.creatures?.find(n=>n.id===id);
  if(!old?.hp||current?.hp?.current!==0||!canTriggerSilthilarHeart(before,id,old.hp.current+Number(old.hp.temp||0)))continue;
  const conditions=Array.isArray(current.conditions)?current.conditions:String(current.conditions||'').split(',');
  if(current.dead||current.soulDestroyed||current.killedOutright||conditions.some(x=>String(x?.name??x).trim().toLowerCase()==='dead')||id==='self'&&(next.archivistCampaign?.dead||next.entomancer?.dead||current.deathSaves?.failure>=3))continue;
  const result=roll('4d8+20',(id==='self'?'':current.name+' ')+'Silthilar Heart',{ignoreCharacterEffects:true});
  if(result)next=triggerSilthilarHeart(next,id,result.total);
 }
 const {killedOutright,...saved}=next;
 return saved;
}
