import {addDamageBonus} from './subclassCantripDamage.js';

export function attackRollMode(options,preferred) {
  const mode=options.mode??preferred;
  const advantage=options.advantage||mode==='advantage';
  const disadvantage=options.disadvantage||mode==='disadvantage';
  if(advantage&&disadvantage)return 'normal';
  if(advantage)return options.elvenAccuracy?'elven-accuracy':'advantage';
  return disadvantage?'disadvantage':'normal';
}

export function hasSharpshooter2014(character) {
  const edition=(character.ruleset==='custom'?character.mechanics:character.ruleset)||'2014';
  return edition==='2014'&&(character.feats||[]).some(feat=>feat.name==='Sharpshooter'&&
    (feat.edition||edition)==='2014'&&!feat.homebrew&&feat.source!=='Homebrew');
}

export function sharpshooterAttack(character,weapon,requested) {
  if(!requested||!weapon.rangedWeapon||!weapon.trained||!hasSharpshooter2014(character))return weapon;
  return {...weapon,attack:weapon.attack-5,damage:addDamageBonus(weapon.damage,10),sharpshooter:true};
}
