import {sourceFeature,assertAct,featureState,putState} from './subclassActionUtils.js';
import {retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
import {weaponAttacks} from './rules.js';
import {effectiveAbilityScores} from './abilityScores.js';
import {ownFormProfile} from './subclassOwnForm.js';

// Each entry is an audited 2014 source, including separate published and UA Twilight.
const types={'city-ua':'psychic',death:'necrotic',forge:'fire',life:'radiant',nature:'choice',order:'psychic','protection-ua':'radiant',solidarity:'weapon',strength:'weapon',tempest:'thunder',trickery:'poison','twilight-ua':'psychic',twilight:'radiant',war:'weapon',zeal:'weapon'};
const records=Object.keys(types).map(key=>`cleric:${key}`);
export function divineStrikeProfile(c){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c))return null;
 let p;try{p=sourceFeature(c,records,'Divine Strike');}catch{return null;}
 // Theurgy receives domain 1, 6, and 17 features, never the domain's level 8 feature.
 if(p.row.name!=='Cleric'||p.row.level<8)return null;
 const effects=sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId});
 return {...p,type:types[p.record.id.split(':').at(-1)],dice:p.row.level>=14?2:1,pending:effects.find(e=>e.stateKey==='divine-strike-pending'),used:effects.some(e=>e.stateKey==='divine-strike-used')};
}
function profile(c){assertAct(c);const p=divineStrikeProfile(c);if(!p)throw Error('Divine Strike is not available.');return p;}
export function divineStrikeWeapons(c){
 const form=ownFormProfile(c),character=form?{...c,inventory:(c.inventory||[]).map(i=>({...i,equipped:i.equipped&&form.wornItemIds.includes(i.id)}))}:c;
 return weaponAttacks(character,{...effectiveAbilityScores(c),...(form?.abilities||{})});
}
export function beginDivineStrike(c,weaponId,{confirmed=false}={}){
 const p=profile(c);if(!confirmed)throw Error('Confirm this weapon attack is on your turn.');if(p.used)throw Error('Divine Strike was already used this turn.');if(p.pending)throw Error('Resolve the previous attack first.');
 const weapon=divineStrikeWeapons(c).find(w=>w.id===weaponId);if(!weapon)throw Error('Choose an available weapon attack.');return {weapon};
}
export function recordDivineAttack(c,weaponId,result,{confirmed=false}={}){
 const {weapon}=beginDivineStrike(c,weaponId,{confirmed});const p=profile(c);if(!Number.isFinite(result?.total)||!Number.isFinite(result?.bonus))throw Error('A valid weapon attack roll is required.');
 const damageType=weapon.damageType?.toLowerCase();if(!damageType)throw Error('Weapon damage type is unavailable.');
 return putState(c,featureState(c,p,'divine-strike-pending',{expires:'end-turn',canEnd:false,weaponName:weapon.name,damageType,critical:result.total-result.bonus>=(weapon.criticalThreshold||20)}));
}
export function resolveDivineStrike(c,{hit=false,type}={}){
 const p=profile(c),pending=p.pending;if(!pending)throw Error('No Divine Strike weapon attack is awaiting a result.');
 const remaining=(c.activeEffects||[]).filter(e=>e.id!==pending.id);if(!hit)return {patch:{activeEffects:remaining}};
 const damageType=p.type==='choice'?type:p.type==='weapon'?pending.damageType:p.type;if(p.type==='choice'&&!['cold','fire','lightning'].includes(type))throw Error('Choose cold, fire, or lightning damage type.');
 const state=featureState(c,p,'divine-strike-used',{expires:'start-next-turn',canEnd:false});return {expression:`${p.dice*(pending.critical?2:1)}d8`,type:damageType,patch:putState({...c,activeEffects:remaining},state)};
}
