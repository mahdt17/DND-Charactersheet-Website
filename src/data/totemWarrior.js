export const totemSourceUrl='https://dnd5e.wikidot.com/barbarian:totem-warrior';
export const totemAnimals=['Bear','Eagle','Elk','Tiger','Wolf'];
export const totemTigerSkills=['Athletics','Acrobatics','Stealth','Survival'];
export const totemBenefits={
  3:{
    Bear:'During Rage, resist every damage type except psychic.',
    Eagle:'During Rage without heavy armor, Dash as a bonus action; opportunity attacks against you have disadvantage.',
    Elk:'During Rage without heavy armor, add 15 feet to walking speed.',
    Tiger:'During Rage, long jumps gain 10 feet and high jumps gain 3 feet.',
    Wolf:'During Rage, allies gain advantage on melee attacks against hostile creatures within 5 feet of you.'
  },
  6:{
    Bear:'Double carrying and lifting capacity. Strength checks to push, pull, lift or break objects have advantage.',
    Eagle:'See fine detail a mile away as if it were within 100 feet. Dim light does not hinder Perception checks.',
    Elk:'Double overland travel pace, mounted or on foot, for yourself and up to ten companions within 60 feet while you are not incapacitated.',
    Tiger:'Gain two available proficiencies from Athletics, Acrobatics, Stealth and Survival.',
    Wolf:'Track at a fast travel pace, and travel stealthily at a normal pace.'
  },
  14:{
    Bear:'During Rage, hostile creatures within 5 feet have disadvantage attacking others, except another bearer of this feature. They must see or hear you and be susceptible to fright.',
    Eagle:'During Rage, fly at your current walking speed. You fall at turn end unless another effect keeps you aloft.',
    Elk:'During Rage, a bonus action during movement lets you pass through a Large or smaller creature. On a failed Strength save (8 + proficiency + Strength), it falls prone and takes 1d12 + Strength bludgeoning damage.',
    Tiger:'During Rage, moving 20 feet straight toward a Large or smaller target immediately before a melee weapon attack enables a bonus action melee weapon attack against it.',
    Wolf:'During Rage, after hitting a Large or smaller creature with a melee weapon attack, use a bonus action to knock it prone.'
  }
};
export const totemFeatureNames={3:'Totem Spirit',6:'Aspect of the Beast',14:'Totemic Attunement'};
const feature=(level,name,description)=>({index:`totem-warrior-${level}-${name.toLowerCase().replace(/[^a-z]+/g,'-')}`,level,name,description,desc:[description],sourceUrl:totemSourceUrl});
export const totemFeatures=[
  feature(3,'Spirit Seeker','Cast Beast Sense and Speak with Animals as rituals only.'),
  feature(3,'Totem Spirit','Choose an animal spirit. Make or acquire a matching physical totem; record it yourself. Cosmetic animal traits are optional.'),
  feature(6,'Aspect of the Beast','Choose an animal benefit independently of your earlier spirit.'),
  feature(10,'Spirit Walker','Cast Commune with Nature as a ritual only; an animal spirit delivers its guidance.'),
  feature(14,'Totemic Attunement','Choose an animal benefit independently of your earlier choices.')
];
export const totemSubclassRecords=[{index:'totem-warrior',name:'Path of the Totem Warrior',class:{name:'Barbarian'},edition:'2014',source:'Player’s Handbook (2014); Sword Coast Adventurer’s Guide animal options',sourceUrl:totemSourceUrl,features:totemFeatures}];
