import {sourceFeature,featureState,putState,healHP,validRoll} from './subclassActionUtils.js';
import {actorIncapacitated,actorDeathBlock,retainsOwnFeatures,sourceSubclassEffects} from './subclassState.js';
import {ownFormProfile} from './subclassOwnForm.js';
import {conditionEffects} from './play.js';
export function protectiveSpiritProfile(c){
 if(((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')!=='2014'||!retainsOwnFeatures(c))return null;
 let p;try{p=sourceFeature(c,['paladin:redemption','paladin:redemption-ua'],'protective-spirit');}catch{return null;}
 const form=ownFormProfile(c),current=form?form.hp.current:Number(c.hp?.current),max=form?form.hp.max:conditionEffects(c).maxHP;
 return {...p,current,max,used:sourceSubclassEffects(c,{recordId:p.record.id,ownerId:p.row.catalogId,stateKey:'protective-spirit-used'}).length>0};
}
export function protectiveSpiritPlan(c,{combat=false}={}){
 const p=protectiveSpiritProfile(c);if(!p||!combat||p.used||actorIncapacitated(c)||actorDeathBlock(c)||!Number.isFinite(p.current)||!Number.isFinite(p.max)||p.current*2>=p.max)return null;
 return {...p,expression:`1d6+${Math.floor(p.row.level/2)}`};
}
export function resolveProtectiveSpirit(c,{combat=false,result}={}){
 const p=protectiveSpiritPlan(c,{combat});if(!p)throw Error('Protective Spirit is not available at this end of turn.');const bonus=Math.floor(p.row.level/2);validRoll(result,{min:bonus+1,max:bonus+6});const healed=healHP(c,result.total,p.max);return {...healed,...putState({...c,...healed},featureState(c,p,'protective-spirit-used',{expires:'start-next-turn',canEnd:false}))};
}
