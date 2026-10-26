import {isVariantHuman,variantHumanId} from '../data/variantHuman.js';
import {requirements,qualified} from './advancement.js';
import {featMagicState} from './featMagic.js';
import {SKILLS} from '../CharacterManager.jsx';
export {isVariantHuman};
export function variantHumanComplete(c,backgroundSkills=[]){
 if(!isVariantHuman(c))return true;
 const abilities=['str','dex','con','int','wis','cha'];
 if(!abilities.includes(c.bonusA)||!abilities.includes(c.bonusB)||c.bonusA===c.bonusB)return false;
 const skill=c.variantHuman?.skill;
 if(!SKILLS.some(([name])=>name===skill)||[...backgroundSkills,...(c.classSkills||[])].includes(skill))return false;
 const feats=(c.feats||[]).filter(f=>f.raceGrantId===variantHumanId);
 if(feats.length!==1)return false;
 const feat=feats[0],context={...c,abilityBonuses:{[c.bonusA]:1,[c.bonusB]:1},feats:(c.feats||[]).filter(f=>f!==feat)},magic=featMagicState(feat,c);
 return feat.edition==='2014'&&!feat.integrityIssues?.length&&(feat.source!=='Homebrew'||feat.eligibilityReviewed===true)&&magic.valid&&(!magic.supported||magic.complete)&&qualified(requirements(feat,context,feat.prerequisiteConfirmations));
}
