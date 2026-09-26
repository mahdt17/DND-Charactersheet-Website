import {contentKey,requirements,qualified} from './advancement.js';
import {featMagicState,featMagicProfile} from './featMagic.js';

// Check against the character before this selection: a feat cannot satisfy its
// own prerequisites. Existing selections are preserved, not revalidated here.
export function validFeatSelection(feat,char,{required=true}={}) {
  if(!feat)return !required;
  if(feat.integrityIssues?.length)return false;
  if(char.ruleset!=='custom'&&(feat.edition||'2014')!==(char.ruleset||'2014'))return false;
  if(!featMagicState(feat,char).valid)return false;
  const repeatMagic=featMagicProfile(feat,char)?.kind==='initiate'&&(feat.edition||char.ruleset)==='2024';
  if(!repeatMagic&&(char.feats||[]).some(f=>contentKey(f)===contentKey(feat)))return false;
  if(feat.source==='Homebrew'&&!feat.catalogId&&!feat.eligibilityReviewed)return false;
  return qualified(requirements(feat,char,feat.prerequisiteConfirmations||{}));
}
