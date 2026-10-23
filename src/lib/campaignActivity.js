import {campaignSourceActive} from './campaignModifiers.js';

export function campaignActionBlockReason(char){
 if(!campaignSourceActive(char))return '';
 const conditions=(Array.isArray(char.conditions)?char.conditions:String(char.conditions||'').split(',')).map(value=>String(typeof value==='object'?value?.name:value).trim().toLowerCase());
 if(Number(char.exhaustion||0)>=6||char.archivistCampaign?.dead||Number(char.deathSaves?.failure||0)>=3||conditions.includes('dead'))return 'Record a revival before this character can act.';
 if(Number(char.hp?.current??1)<=0||conditions.some(name=>['incapacitated','unconscious','paralyzed','stunned','petrified'].includes(name)))return 'You cannot act while unconscious or incapacitated.';
 return '';
}

export function assertCampaignCanAct(char){const reason=campaignActionBlockReason(char);if(reason)throw Error(reason);}
