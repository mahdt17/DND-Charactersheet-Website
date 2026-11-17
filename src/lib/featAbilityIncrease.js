import {normalizeEdition} from './content.js';

export const elvenAccuracyAbilities={dex:'Dexterity',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};

export function isElvenAccuracyFeat(feat,character={}){
 const edition=normalizeEdition(character.ruleset==='custom'?character.mechanics:character.ruleset);
 return edition==='2014'&&normalizeEdition(feat?.edition||edition)==='2014'&&feat?.source!=='Homebrew'&&!feat?.homebrew&&!feat?.integrityIssues?.length
  &&(feat?.catalogId==='wikidot5e:feat:elven-accuracy'||String(feat?.name||'').trim().toLowerCase()==='elven accuracy');
}

// The attack benefit is independent of the choice made for the ability increase.
export function hasElvenAccuracy(character){
 return (character.feats||[]).some(feat=>isElvenAccuracyFeat(feat,character));
}

export function elvenAccuracyAbility(feat){
 const ability=feat.abilityChoices?.ability;
 return Object.hasOwn(elvenAccuracyAbilities,ability)?ability:'';
}

export function featAbilityChoicesComplete(feat,character){
 return !isElvenAccuracyFeat(feat,character)||Boolean(elvenAccuracyAbility(feat));
}
