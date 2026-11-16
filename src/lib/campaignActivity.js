import {campaignSourceActive} from './campaignModifiers.js';
import {actorActionBlock,actorDeathBlock,consciousAtZero} from './subclassState.js';

const campaignEdition=char=>(char.ruleset==='custom'?char.mechanics:char.ruleset)||'2014';
const conditionNames=char=>(Array.isArray(char.conditions)?char.conditions:String(char.conditions||'').split(','))
 .map(value=>String(typeof value==='object'?value?.name:value).trim().toLowerCase());

export function campaignOwnerDead(char){
 const legacyDeath=char.dead||char.instantDeath||char.soulDestroyed||char.archivistCampaign?.dead||
  char.archivistCampaign?.soulDestroyed||Number(char.exhaustion||0)>=6||conditionNames(char).includes('dead');
 if(legacyDeath)return true;
 if(campaignEdition(char)==='2014'&&actorDeathBlock(char))return true;
 return Number(char.deathSaves?.failure||0)>=3&&
  (campaignEdition(char)!=='2014'||!consciousAtZero(char));
}

export function campaignActionBlockReason(char){
 if(!campaignSourceActive(char))return '';
 if(campaignOwnerDead(char))return 'Record a revival before this character can act.';
 if(campaignEdition(char)==='2014')return actorActionBlock(char);
 if(Number(char.hp?.current??1)<=0||conditionNames(char).some(name=>['incapacitated','unconscious','paralyzed','stunned','petrified'].includes(name)))return 'You cannot act while unconscious or incapacitated.';
 return '';
}

export function assertCampaignCanAct(char){const reason=campaignActionBlockReason(char);if(reason)throw Error(reason);}
