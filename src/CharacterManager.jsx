import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Heart, Shield, Sparkles, ScrollText, Swords, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, BookOpen, X } from "lucide-react";

const INK = "#2B2620";
const PAPER = "#EDE6D3";
const PAPER_DARK = "#E2DAC2";
const RED = "#7A2E2E";
const BRASS = "#A9822C";
const BLUE = "#33506B";
const MOSS = "#4B5D45";

const abilityDescriptions = {
  str: "Strength measures physical power, athletic force, and the ability to push, lift, break, or strike with raw might.",
  dex: "Dexterity measures agility, reflexes, balance, and coordination. It commonly influences initiative, Armor Class, and finesse or ranged attacks.",
  con: "Constitution measures endurance, toughness, and bodily resilience. It commonly influences hit points and Constitution saving throws.",
  int: "Intelligence measures reasoning, memory, knowledge, and analytical ability. It is commonly used for recalling lore and solving problems.",
  wis: "Wisdom measures awareness, intuition, perception, and insight into people or situations.",
  cha: "Charisma measures force of personality, confidence, leadership, and social presence.",
};

const ABILITIES = [
  { key: "str", label: "Strength" },
  { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" },
  { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" },
  { key: "cha", label: "Charisma" },
];

const RACE_DATA = {
  Dragonborn: {
    blurb: "Proud, honor-bound descendants of dragons with a breath weapon of their own.",
    abilityBonus: "Strength +2, Charisma +1",
    bonuses: { str: 2, cha: 1 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Draconic Ancestry", "Choose a dragon type; it sets the damage type of your breath weapon and resistance."],
      ["Breath Weapon", "Exhale destructive energy in a line or cone once per short rest."],
      ["Damage Resistance", "You resist the damage type tied to your draconic ancestry."],
    ],
  },
  Dwarf: {
    blurb: "Stout, hardy folk with an unshakable resistance to poison and a feel for stone.",
    abilityBonus: "Constitution +2",
    bonuses: { con: 2 },
    size: "Medium", speed: "25 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Dwarven Resilience", "Advantage on saving throws against poison, and resistance to poison damage."],
      ["Stonecunning", "Double proficiency bonus on History checks about the origin of stonework."],
    ],
  },
  Elf: {
    blurb: "Graceful, long-lived people with keen senses and an otherworldly touch.",
    abilityBonus: "Dexterity +2",
    bonuses: { dex: 2 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Keen Senses", "Proficiency in the Perception skill."],
      ["Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."],
      ["Trance", "You don't need to sleep; 4 hours of meditation gives the same benefit as 8 hours of sleep."],
    ],
  },
  Gnome: {
    blurb: "Small, inventive folk with an innate resistance to magic.",
    abilityBonus: "Intelligence +2",
    bonuses: { int: 2 },
    size: "Small", speed: "25 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Gnome Cunning", "Advantage on Intelligence, Wisdom, and Charisma saves against magic."],
    ],
  },
  "Half-Elf": {
    blurb: "Walkers between two worlds, sociable and adaptable by nature.",
    abilityBonus: "Charisma +2, and +1 to two other abilities of your choice",
    bonuses: { cha: 2 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."],
      ["Skill Versatility", "Proficiency in two skills of your choice."],
    ],
  },
  "Half-Orc": {
    blurb: "Powerfully built survivors known for their endurance in a fight.",
    abilityBonus: "Strength +2, Constitution +1",
    bonuses: { str: 2, con: 1 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Relentless Endurance", "When reduced to 0 HP but not killed outright, drop to 1 HP instead (once per long rest)."],
      ["Savage Attacks", "Roll an extra weapon damage die when you score a critical hit."],
    ],
  },
  Halfling: {
    blurb: "Small, nimble, and famously lucky in the moments that matter most.",
    abilityBonus: "Dexterity +2",
    bonuses: { dex: 2 },
    size: "Small", speed: "25 ft.",
    traits: [
      ["Lucky", "Reroll a 1 on an attack roll, ability check, or saving throw."],
      ["Brave", "Advantage on saving throws against being frightened."],
      ["Halfling Nimbleness", "You can move through the space of any creature larger than you."],
    ],
  },
  Human: {
    blurb: "Adaptable and ambitious, humans are found in every corner of the world.",
    abilityBonus: "+1 to every ability score",
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Versatile", "Balanced ability scores let you fit almost any class."],
      ["Extra Language", "You can read, write, and speak one extra language of your choice."],
    ],
  },
  Tiefling: {
    blurb: "Marked by an infernal bloodline, with a natural knack for the fiendish arts.",
    abilityBonus: "Charisma +2, Intelligence +1",
    bonuses: { cha: 2, int: 1 },
    size: "Medium", speed: "30 ft.",
    traits: [
      ["Darkvision", "See in dim light within 60 ft. as if it were bright, and in darkness as dim light."],
      ["Hellish Resistance", "Resistance to fire damage."],
      ["Infernal Legacy", "You know a cantrip innately, gaining more spell-like abilities as you level."],
    ],
  },
};

const CLASS_DATA = {
  Barbarian: {
    blurb: "A fierce warrior who channels primal rage into unstoppable force.",
    hitDie: "d12", primaryAbility: "Strength", saves: "Strength, Constitution",
    armor: "Light, medium, shields", weapons: "Simple, martial",
    features: [
      ["Rage", "In battle, fight with primal ferocity: bonus damage on melee attacks and resistance to bludgeoning, piercing, and slashing damage."],
      ["Unarmored Defense", "While not wearing armor, your AC equals 10 + Dexterity modifier + Constitution modifier."],
    ],
    table: [[1,["Rage","Unarmored Defense"]],[2,["Reckless Attack","Danger Sense"]],[3,["Primal Path"]],[4,["Ability Score Improvement"]],[5,["Extra Attack","Fast Movement"]],[6,["Path feature"]],[7,["Feral Instinct"]],[8,["Ability Score Improvement"]],[9,["Brutal Critical (1 die)"]],[10,["Path feature"]],[11,["Relentless Rage"]],[12,["Ability Score Improvement"]],[13,["Brutal Critical (2 dice)"]],[14,["Path feature"]],[15,["Persistent Rage"]],[16,["Ability Score Improvement"]],[17,["Brutal Critical (3 dice)"]],[18,["Indomitable Might"]],[19,["Ability Score Improvement"]],[20,["Primal Champion"]]],
  },
  Bard: {
    blurb: "A performer whose words and music weave real magic.",
    hitDie: "d8", primaryAbility: "Charisma", saves: "Dexterity, Charisma",
    armor: "Light", weapons: "Simple, hand crossbows, longswords, rapiers, shortswords",
    features: [
      ["Spellcasting", "You've learned to cast spells through your music, using Charisma as your spellcasting ability."],
      ["Bardic Inspiration", "As a bonus action, give an ally a die they can add to one ability check, attack roll, or save."],
    ],
    table: [[1,["Spellcasting","Bardic Inspiration (d6)"]],[2,["Jack of All Trades","Song of Rest (d6)"]],[3,["Bard College","Expertise"]],[4,["Ability Score Improvement"]],[5,["Bardic Inspiration (d8)","Font of Inspiration"]],[6,["Countercharm","College feature"]],[7,[]],[8,["Ability Score Improvement"]],[9,["Song of Rest (d8)"]],[10,["Bardic Inspiration (d10)","Expertise","Magical Secrets"]],[11,[]],[12,["Ability Score Improvement"]],[13,["Song of Rest (d10)"]],[14,["Magical Secrets","College feature"]],[15,["Bardic Inspiration (d12)"]],[16,["Ability Score Improvement"]],[17,["Song of Rest (d12)"]],[18,["Magical Secrets"]],[19,["Ability Score Improvement"]],[20,["Superior Inspiration"]]],
  },
  Cleric: {
    blurb: "A conduit for divine power, channeling a deity's will into miracles.",
    hitDie: "d8", primaryAbility: "Wisdom", saves: "Wisdom, Charisma",
    armor: "Light, medium, shields", weapons: "Simple",
    features: [
      ["Spellcasting", "You cast spells drawn from the cleric list, using Wisdom as your spellcasting ability."],
      ["Divine Domain", "You choose a domain tied to your deity, granting extra spells and features."],
    ],
    table: [[1,["Spellcasting","Divine Domain"]],[2,["Channel Divinity (1/rest)","Domain feature"]],[3,[]],[4,["Ability Score Improvement"]],[5,["Destroy Undead (CR 1/2)"]],[6,["Channel Divinity (2/rest)","Domain feature"]],[7,[]],[8,["Ability Score Improvement","Destroy Undead (CR 1)"]],[9,[]],[10,["Divine Intervention"]],[11,["Destroy Undead (CR 2)"]],[12,["Ability Score Improvement"]],[13,[]],[14,["Destroy Undead (CR 3)"]],[15,[]],[16,["Ability Score Improvement"]],[17,["Destroy Undead (CR 4)","Domain feature"]],[18,["Channel Divinity (3/rest)"]],[19,["Ability Score Improvement"]],[20,["Divine Intervention improves"]]],
  },
  Druid: {
    blurb: "A guardian of the wild who can take on the shape of beasts.",
    hitDie: "d8", primaryAbility: "Wisdom", saves: "Intelligence, Wisdom",
    armor: "Light, medium, shields (non-metal)", weapons: "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears",
    features: [
      ["Spellcasting", "You cast spells drawn from the druid list, using Wisdom as your spellcasting ability."],
      ["Wild Shape", "Use a bonus action to magically transform into a beast you've seen, several times per day."],
    ],
    table: [[1,["Druidic","Spellcasting"]],[2,["Wild Shape","Druid Circle"]],[3,[]],[4,["Wild Shape improves","Ability Score Improvement"]],[5,[]],[6,["Circle feature"]],[7,[]],[8,["Wild Shape improves","Ability Score Improvement"]],[9,[]],[10,["Circle feature"]],[11,[]],[12,["Ability Score Improvement"]],[13,[]],[14,["Circle feature"]],[15,[]],[16,["Ability Score Improvement"]],[17,[]],[18,["Timeless Body","Beast Spells"]],[19,["Ability Score Improvement"]],[20,["Archdruid"]]],
  },
  Fighter: {
    blurb: "A master of martial combat, skilled with a wide range of weapons and tactics.",
    hitDie: "d10", primaryAbility: "Strength or Dexterity", saves: "Strength, Constitution",
    armor: "All armor, shields", weapons: "Simple, martial",
    features: [
      ["Fighting Style", "Adopt a specialty, such as Archery or Defense, that sharpens your combat style."],
      ["Second Wind", "Regain hit points as a bonus action once per short rest."],
    ],
    table: [[1,["Fighting Style","Second Wind"]],[2,["Action Surge (1 use)"]],[3,["Martial Archetype"]],[4,["Ability Score Improvement"]],[5,["Extra Attack"]],[6,["Ability Score Improvement"]],[7,["Archetype feature"]],[8,["Ability Score Improvement"]],[9,["Indomitable (1 use)"]],[10,["Archetype feature"]],[11,["Extra Attack (2)"]],[12,["Ability Score Improvement"]],[13,["Indomitable (2 uses)"]],[14,["Ability Score Improvement"]],[15,["Archetype feature"]],[16,["Ability Score Improvement"]],[17,["Action Surge (2 uses)","Indomitable (3 uses)"]],[18,["Archetype feature"]],[19,["Ability Score Improvement"]],[20,["Extra Attack (3)"]]],
  },
  Monk: {
    blurb: "A disciplined martial artist who channels inner energy, or ki, into supernatural feats.",
    hitDie: "d8", primaryAbility: "Dexterity & Wisdom", saves: "Strength, Dexterity",
    armor: "None", weapons: "Simple, shortswords",
    features: [
      ["Martial Arts", "Use Dexterity for unarmed strikes and monk weapons, with a bonus unarmed strike."],
      ["Unarmored Defense", "While not wearing armor, your AC equals 10 + Dexterity modifier + Wisdom modifier."],
    ],
    table: [[1,["Martial Arts","Unarmored Defense"]],[2,["Ki","Unarmored Movement"]],[3,["Monastic Tradition","Deflect Missiles"]],[4,["Ability Score Improvement","Slow Fall"]],[5,["Extra Attack","Stunning Strike"]],[6,["Ki-Empowered Strikes","Tradition feature"]],[7,["Evasion","Stillness of Mind"]],[8,["Ability Score Improvement"]],[9,["Unarmored Movement improves"]],[10,["Purity of Body"]],[11,["Tradition feature"]],[12,["Ability Score Improvement"]],[13,["Tongue of the Sun and Moon"]],[14,["Diamond Soul"]],[15,["Timeless Body"]],[16,["Ability Score Improvement"]],[17,["Tradition feature"]],[18,["Empty Body"]],[19,["Ability Score Improvement"]],[20,["Perfect Self"]]],
  },
  Paladin: {
    blurb: "A holy warrior bound by a sacred oath, blending martial prowess and divine magic.",
    hitDie: "d10", primaryAbility: "Strength & Charisma", saves: "Wisdom, Charisma",
    armor: "All armor, shields", weapons: "Simple, martial",
    features: [
      ["Divine Sense", "Detect the presence of celestials, fiends, and undead nearby."],
      ["Lay on Hands", "A pool of healing power you can call on to mend wounds."],
    ],
    table: [[1,["Divine Sense","Lay on Hands"]],[2,["Fighting Style","Spellcasting","Divine Smite"]],[3,["Divine Health","Sacred Oath"]],[4,["Ability Score Improvement"]],[5,["Extra Attack"]],[6,["Aura of Protection"]],[7,["Oath feature"]],[8,["Ability Score Improvement"]],[9,[]],[10,["Aura of Courage"]],[11,["Improved Divine Smite"]],[12,["Ability Score Improvement"]],[13,[]],[14,["Cleansing Touch"]],[15,["Oath feature"]],[16,["Ability Score Improvement"]],[17,[]],[18,["Aura improvements"]],[19,["Ability Score Improvement"]],[20,["Oath feature"]]],
  },
  Ranger: {
    blurb: "A skilled hunter and tracker equally at home with a blade or a bow.",
    hitDie: "d10", primaryAbility: "Dexterity & Wisdom", saves: "Strength, Dexterity",
    armor: "Light, medium, shields", weapons: "Simple, martial",
    features: [
      ["Favored Enemy", "Choose a type of creature you know well, gaining an edge tracking and recalling lore about it."],
      ["Natural Explorer", "Choose a favored terrain where you and your group travel and forage with ease."],
    ],
    table: [[1,["Favored Enemy","Natural Explorer"]],[2,["Fighting Style","Spellcasting"]],[3,["Ranger Archetype","Primeval Awareness"]],[4,["Ability Score Improvement"]],[5,["Extra Attack"]],[6,["Favored Enemy/Explorer improve"]],[7,["Archetype feature"]],[8,["Ability Score Improvement","Land's Stride"]],[9,[]],[10,["Explorer improves","Hide in Plain Sight"]],[11,["Archetype feature"]],[12,["Ability Score Improvement"]],[13,[]],[14,["Favored Enemy improves","Vanish"]],[15,["Archetype feature"]],[16,["Ability Score Improvement"]],[17,[]],[18,["Feral Senses"]],[19,["Ability Score Improvement"]],[20,["Foe Slayer"]]],
  },
  Rogue: {
    blurb: "A cunning survivor who relies on skill, stealth, and precision strikes.",
    hitDie: "d8", primaryAbility: "Dexterity", saves: "Dexterity, Intelligence",
    armor: "Light", weapons: "Simple, hand crossbows, longswords, rapiers, shortswords",
    features: [
      ["Sneak Attack", "Deal extra damage once per turn when you have advantage or an ally is adjacent to your target."],
      ["Expertise", "Double your proficiency bonus for two chosen skills."],
    ],
    table: [[1,["Expertise","Sneak Attack","Thieves' Cant"]],[2,["Cunning Action"]],[3,["Roguish Archetype"]],[4,["Ability Score Improvement"]],[5,["Uncanny Dodge"]],[6,["Expertise"]],[7,["Evasion"]],[8,["Ability Score Improvement"]],[9,["Archetype feature"]],[10,["Ability Score Improvement"]],[11,["Reliable Talent"]],[12,["Ability Score Improvement"]],[13,["Archetype feature"]],[14,["Blindsense"]],[15,["Slippery Mind"]],[16,["Ability Score Improvement"]],[17,["Archetype feature"]],[18,["Elusive"]],[19,["Ability Score Improvement"]],[20,["Stroke of Luck"]]],
  },
  Sorcerer: {
    blurb: "A spellcaster who commands magic that flows from an innate, often mysterious source.",
    hitDie: "d6", primaryAbility: "Charisma", saves: "Constitution, Charisma",
    armor: "None", weapons: "Daggers, darts, slings, quarterstaffs, light crossbows",
    features: [
      ["Spellcasting", "You cast spells drawn from the sorcerer list, using Charisma as your spellcasting ability."],
      ["Sorcerous Origin", "The source of your innate magic shapes a set of unique features you gain over time."],
    ],
    table: [[1,["Spellcasting","Sorcerous Origin"]],[2,["Font of Magic"]],[3,["Metamagic"]],[4,["Ability Score Improvement"]],[5,[]],[6,["Origin feature"]],[7,[]],[8,["Ability Score Improvement"]],[9,[]],[10,["Metamagic"]],[11,[]],[12,["Ability Score Improvement"]],[13,[]],[14,["Origin feature"]],[15,[]],[16,["Ability Score Improvement"]],[17,["Metamagic"]],[18,["Origin feature"]],[19,["Ability Score Improvement"]],[20,["Sorcerous Restoration"]]],
  },
  Warlock: {
    blurb: "A wielder of magic granted through a pact with a powerful otherworldly patron.",
    hitDie: "d8", primaryAbility: "Charisma", saves: "Wisdom, Charisma",
    armor: "Light", weapons: "Simple",
    features: [
      ["Otherworldly Patron", "You've struck a bargain with a being of great power, who grants you abilities in kind."],
      ["Pact Magic", "You cast spells through a pact, recovering your limited spell slots on a short rest."],
    ],
    table: [[1,["Otherworldly Patron","Pact Magic"]],[2,["Eldritch Invocations"]],[3,["Pact Boon"]],[4,["Ability Score Improvement"]],[5,[]],[6,["Patron feature"]],[7,[]],[8,["Ability Score Improvement"]],[9,[]],[10,["Patron feature"]],[11,["Mystic Arcanum (6th)"]],[12,["Ability Score Improvement"]],[13,["Mystic Arcanum (7th)"]],[14,["Patron feature"]],[15,["Mystic Arcanum (8th)"]],[16,["Ability Score Improvement"]],[17,["Mystic Arcanum (9th)"]],[18,[]],[19,["Ability Score Improvement"]],[20,["Eldritch Master"]]],
  },
  Wizard: {
    blurb: "A scholar of the arcane whose spellbook holds power drawn from long study.",
    hitDie: "d6", primaryAbility: "Intelligence", saves: "Intelligence, Wisdom",
    armor: "None", weapons: "Daggers, darts, slings, quarterstaffs, light crossbows",
    features: [
      ["Spellcasting", "You cast spells drawn from the wizard list, using Intelligence as your spellcasting ability."],
      ["Arcane Recovery", "Once per day, recover some expended spell slots during a short rest."],
    ],
    table: [[1,["Spellcasting","Arcane Recovery"]],[2,["Arcane Tradition"]],[3,[]],[4,["Ability Score Improvement"]],[5,[]],[6,["Tradition feature"]],[7,[]],[8,["Ability Score Improvement"]],[9,[]],[10,["Tradition feature"]],[11,[]],[12,["Ability Score Improvement"]],[13,[]],[14,["Tradition feature"]],[15,[]],[16,["Ability Score Improvement"]],[17,[]],[18,["Spell Mastery"]],[19,["Ability Score Improvement"]],[20,["Signature Spells"]]],
  },
};

const BACKGROUND_DATA = {
  Acolyte: { blurb: "You've spent your life in service to a temple.", skills: "Insight, Religion", proficiencies: "Two languages of your choice", equipment: "Holy symbol, prayer book, vestments, common clothes, 15 gp", feature: ["Shelter of the Faithful", "Temples of your faith offer you aid, and you have a priestly contact nearby."] },
  Charlatan: { blurb: "You've always had a gift for telling people what they want to hear.", skills: "Deception, Sleight of Hand", proficiencies: "Disguise kit, forgery kit", equipment: "Fine clothes, disguise kit, forgery tools, 15 gp", feature: ["False Identity", "You have a second identity, complete with documents and contacts, that others can't easily trace to you."] },
  Criminal: { blurb: "You have a history of breaking the law and survived by it.", skills: "Deception, Stealth", proficiencies: "One gaming set, thieves' tools", equipment: "Crowbar, dark common clothes with a hood, 15 gp", feature: ["Criminal Contact", "You have a reliable contact in the criminal underworld who relays messages and can point you to fences."] },
  Entertainer: { blurb: "You thrive in front of a crowd, on stage or in the street.", skills: "Acrobatics, Performance", proficiencies: "Disguise kit, one musical instrument", equipment: "A musical instrument, costume, 15 gp", feature: ["By Popular Demand", "You can find a place to perform almost anywhere, earning free lodging and a modest income."] },
  "Folk Hero": { blurb: "You come from humble roots but are marked for greatness.", skills: "Animal Handling, Survival", proficiencies: "One artisan's tools, land vehicles", equipment: "Artisan's tools, shovel, iron pot, common clothes, 10 gp", feature: ["Rustic Hospitality", "Common folk will shelter and hide you, unless you've put them in danger."] },
  "Guild Artisan": { blurb: "You're a member of an artisan's guild, skilled in a particular trade.", skills: "Insight, Persuasion", proficiencies: "One artisan's tools, one language", equipment: "Artisan's tools, letter of introduction, traveler's clothes, 15 gp", feature: ["Guild Membership", "Your guild provides lodging and political connections in exchange for dues and service."] },
  Hermit: { blurb: "You lived in seclusion, whether for religious, spiritual, or exile reasons.", skills: "Medicine, Religion", proficiencies: "Herbalism kit, one language", equipment: "Herbalism kit, scroll case of notes, winter blanket, common clothes, 5 gp", feature: ["Discovery", "Your seclusion led to a unique discovery that could prove important."] },
  Noble: { blurb: "You were raised in a family of privilege and expected to lead.", skills: "History, Persuasion", proficiencies: "One gaming set, one language", equipment: "Fine clothes, signet ring, pedigree scroll, 25 gp", feature: ["Position of Privilege", "People assume you have the right to be wherever you are, and merchants extend you credit."] },
  Outlander: { blurb: "You grew up in the wilds, far from settled lands.", skills: "Athletics, Survival", proficiencies: "One musical instrument", equipment: "Staff, hunting trap, traveler's clothes, 10 gp", feature: ["Wanderer", "You have an excellent memory for maps and geography, and can always find food and fresh water."] },
  Sage: { blurb: "You spent years learning the lore of the world in libraries and monasteries.", skills: "Arcana, History", proficiencies: "Two languages", equipment: "Ink, quill, small knife, common clothes, 10 gp", feature: ["Researcher", "You know where to find information, even if you don't have it, often through a library or sage contact."] },
  Sailor: { blurb: "You've sailed on a seagoing vessel for years.", skills: "Athletics, Perception", proficiencies: "Navigator's tools, water vehicles", equipment: "Rope, lucky charm, common clothes, 10 gp", feature: ["Ship's Passage", "You can secure free passage on a ship for yourself and companions in exchange for work."] },
  Soldier: { blurb: "You served in an army, militia, or mercenary company.", skills: "Athletics, Intimidation", proficiencies: "One gaming set, land vehicles", equipment: "Insignia of rank, weapon trophy, common clothes, 10 gp", feature: ["Military Rank", "Soldiers loyal to your former organization recognize your authority and influence."] },
  Urchin: { blurb: "You grew up on the streets, alone and forgotten by the wealthy.", skills: "Sleight of Hand, Stealth", proficiencies: "Disguise kit, thieves' tools", equipment: "Small knife, city map, pet mouse, common clothes, 10 gp", feature: ["City Secrets", "You know the secret patterns and flow of cities and can find passages others miss."] },
};

const SKILLS = [
  ["Acrobatics", "dex"], ["Animal Handling", "wis"], ["Arcana", "int"],
  ["Athletics", "str"], ["Deception", "cha"], ["History", "int"],
  ["Insight", "wis"], ["Intimidation", "cha"], ["Investigation", "int"],
  ["Medicine", "wis"], ["Nature", "int"], ["Perception", "wis"],
  ["Performance", "cha"], ["Persuasion", "cha"], ["Religion", "int"],
  ["Sleight of Hand", "dex"], ["Stealth", "dex"], ["Survival", "wis"],
];

const HIT_DICE = ["d6", "d8", "d10", "d12"];

const NIGHT = "#22201C";
const NIGHT_CARD = "#2E2A24";
const PARCHMENT_TEXT = "#EDE6D3";

function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}
function fmtMod(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}
function profBonus(level) {
  return 2 + Math.floor((level - 1) / 4);
}
function avgHitDie(die) {
  const n = parseInt(die.replace("d", ""), 10);
  return Math.floor(n / 2) + 1;
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function raceBonus(raceName, key) {
  return (RACE_DATA[raceName] && RACE_DATA[raceName].bonuses && RACE_DATA[raceName].bonuses[key]) || 0;
}
function effectiveAbilities(char) {
  const out = {};
  ABILITIES.forEach((a) => {
    out[a.key] = (char.abilities[a.key] || 0) + raceBonus(char.race, a.key);
  });
  return out;
}

const ABILITY_NAME_TO_KEY = {
  Strength: "str", Dexterity: "dex", Constitution: "con",
  Intelligence: "int", Wisdom: "wis", Charisma: "cha",
};
function parseAbilityNames(str) {
  return (str || "").split(",").map((s) => ABILITY_NAME_TO_KEY[s.trim()]).filter(Boolean);
}

function applyRace(char, raceName) {
  const data = RACE_DATA[raceName];
  const speed = data ? parseInt(data.speed, 10) : char.speed;
  return syncProgression({ ...char, race: raceName, speed: Number.isFinite(speed) ? speed : char.speed }, char.level);
}

function applyClass(char, className) {
  const data = CLASS_DATA[className];
  if (!data) return { ...char, className };

  const saveProf = { ...char.saveProf };
  parseAbilityNames(data.saves).forEach((k) => { saveProf[k] = true; });

  let hp = char.hp;
  const isUntouchedDefault = char.hp.max === 10 && char.hp.current === 10 && char.hp.temp === 0 && !char.className && char.level === 1;
  if (isUntouchedDefault) {
    const dieMax = parseInt(data.hitDie.replace("d", ""), 10);
    const conMod = abilityMod((char.abilities.con || 10) + raceBonus(char.race, "con"));
    const startHp = Math.max(1, dieMax + conMod);
    hp = { current: startHp, max: startHp, temp: 0 };
  }

  return syncProgression({
    ...char,
    className,
    hitDie: data.hitDie,
    armorProf: data.armor,
    weaponProf: data.weapons,
    saveProf,
    hp,
  }, char.level);
}

function applyBackground(char, bgName) {
  const data = BACKGROUND_DATA[bgName];
  if (!data) return { ...char, background: bgName };

  const skillProf = { ...char.skillProf };
  (char._autoBgSkills || []).forEach((s) => { skillProf[s] = false; });
  const newSkills = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
  newSkills.forEach((s) => { skillProf[s] = true; });

  const keptInventory = (char.inventory || []).filter((i) => i.auto !== "background");
  const newItems = data.equipment
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ id: uid(), name, qty: 1, auto: "background" }));

  return {
    ...char,
    background: bgName,
    skillProf,
    toolProf: data.proficiencies,
    inventory: [...keptInventory, ...newItems],
    _autoBgSkills: newSkills,
  };
}


// Progression data used by the character sheet. Choice-dependent features (ASI/feats,
// subclasses, prepared spells, etc.) are surfaced as choices rather than silently
// selecting something for the player.
const FULL_CASTER_CLASSES = new Set(["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"]);
const HALF_CASTER_CLASSES = new Set(["Paladin", "Ranger"]);
const SPELL_KNOWN_CLASSES = new Set(["Bard", "Ranger", "Sorcerer", "Warlock"]);

const SPELL_PROGRESSION = {
  Bard:    [0,2,2,2,2,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  Cleric:  [0,2,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  Druid:   [0,2,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  Sorcerer:[0,2,4,6,6,7,8,8,10,10,10,12,12,12,14,14,15,15,15,15,15],
  Wizard:  [0,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44],
  Paladin: [0,0,0,0,0,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4],
  Ranger:  [0,0,0,0,0,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4,4],
  Warlock: [0,2,3,4,5,6,7,8,8,9,10,10,11,11,12,12,13,13,14,14,15],
};

const FIXED_RACIAL_SPELLS = {
  Tiefling: [
    [1, "Thaumaturgy", "Cantrip", "You manifest a minor wonder tied to your infernal heritage."],
    [3, "Hellish Rebuke", "1st-level spell", "When injured, you can answer with fiery retaliation. Your exact spellcasting details depend on your character ruleset."],
    [5, "Darkness", "2nd-level spell", "You create an area of magical darkness."],
  ],
};

function progressionEntries(char, targetLevel) {
  const entries = [];
  const classData = CLASS_DATA[char.className];
  if (classData) {
    classData.table.forEach(([level, features]) => {
      if (level <= targetLevel) features.forEach((name) => entries.push({
        id: `class:${char.className}:${level}:${name}`,
        name,
        source: char.className,
        level,
        kind: /spell/i.test(name) ? "spellcasting" : /ability score improvement|feat/i.test(name) ? "choice" : "feature",
        description: (classData.features || []).find(([n]) => n === name)?.[1] || "This feature is part of your class progression. Choose a subclass, feat, or other option when your rules require a choice.",
      }));
    });
  }
  if (RACE_DATA[char.race]) {
    RACE_DATA[char.race].traits.forEach(([name, description]) => entries.push({
      id: `race:${char.race}:${name}`,
      name,
      source: char.race,
      level: 1,
      kind: "racial",
      description,
    }));
  }
  return entries;
}

function syncProgression(char, targetLevel) {
  const existing = Array.isArray(char.grantedFeatures) ? char.grantedFeatures : [];
  const all = progressionEntries(char, targetLevel);
  const existingIds = new Set(existing.map((x) => x.id));
  const grantedFeatures = [...existing, ...all.filter((x) => !existingIds.has(x.id))];

  const spellEntries = Array.isArray(char.spells) ? char.spells : [];
  const spellIds = new Set(spellEntries.map((x) => x.id));
  const newSpells = [...spellEntries];
  const racialSpells = FIXED_RACIAL_SPELLS[char.race] || [];
  racialSpells.forEach(([level, name, levelLabel, description]) => {
    if (level <= targetLevel && !spellIds.has(`race-spell:${char.race}:${name}`)) {
      newSpells.push({ id: `race-spell:${char.race}:${name}`, name, level: levelLabel, source: char.race, auto: true, description });
    }
  });

  const className = char.className;
  const spellcasting = !!SPELL_PROGRESSION[className];
  let spellInfo = char.spellInfo || null;
  if (spellcasting) {
    const count = SPELL_PROGRESSION[className][targetLevel] || 0;
    const casterType = FULL_CASTER_CLASSES.has(className) ? "Full caster" : HALF_CASTER_CLASSES.has(className) ? "Half caster" : "Pact caster / spells known";
    spellInfo = { casterType, spellsKnownOrPrepared: count, spellcastingAbility: classDataAbility(className), level: targetLevel };
  } else {
    spellInfo = null;
  }

  return { ...char, grantedFeatures, spells: newSpells, spellInfo };
}

function classDataAbility(className) {
  return CLASS_DATA[className]?.primaryAbility || "—";
}

function blankCharacter(name) {
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  return {
    id: uid(),
    name: name || "Unnamed adventurer",
    race: "",
    className: "",
    background: "",
    level: 1,
    hitDie: "d8",
    abilities,
    hp: { current: 10, max: 10, temp: 0 },
    ac: 10,
    speed: 30,
    inspiration: false,
    skillProf: {},
    saveProf: {},
    armorProf: "",
    weaponProf: "",
    toolProf: "",
    languages: "",
    defenses: "",
    conditions: "",
    inventory: [],
    actions: [],
    grantedFeatures: [],
    spells: [],
    spellInfo: null,
    spellNotes: "",
    notes: "",
  };
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: INK, opacity: 0.65, letterSpacing: 0.2 }}>{label}</span>
      {children}
    </label>
  );
}

const inputBase = {
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  color: INK,
  background: "#FBF8EE",
  border: `1px solid ${BRASS}55`,
  borderRadius: 4,
  padding: "6px 8px",
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />;
}

function OpenChooserButton({ label, value, onClick, width }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cm-btn"
      className="cm-number-box"
      style={{
        ...inputBase,
        width,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        cursor: "pointer",
        color: value ? INK : INK + "88",
      }}
    >
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value || label}</span>
      <ChevronDown size={13} style={{ flexShrink: 0 }} />
    </button>
  );
}

function ChooserModal({ kind, onClose, onChoose }) {
  const [selected, setSelected] = useState(null);
  const dataMap = kind === "race" ? RACE_DATA : kind === "class" ? CLASS_DATA : BACKGROUND_DATA;
  const title = kind === "race" ? "Choose a species" : kind === "class" ? "Choose a class" : "Choose a background";
  const names = Object.keys(dataMap);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,18,14,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cm-scroll"
        style={{
          background: PAPER, border: `2px solid ${BRASS}`, borderRadius: 10,
          width: "min(760px, 100%)", maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BRASS}66`, position: "sticky", top: 0, background: PAPER, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selected && (
              <button onClick={() => setSelected(null)} className="cm-btn" aria-label="Back to list" style={{ background: "none", border: `1px solid ${BRASS}`, borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", color: INK }}>
                <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
              </button>
            )}
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: INK, margin: 0 }}>
              {selected ? selected : title}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="cm-btn" style={{ background: "none", border: "none", color: INK, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {!selected && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {names.map((name) => (
                <div
                  key={name}
                  onClick={() => setSelected(name)}
                  className="cm-row cm-card-hover"
                  style={{
                    border: `1px solid ${BRASS}77`, borderRadius: 8, padding: 14, cursor: "pointer",
                    background: "#FBF8EE", display: "flex", flexDirection: "column", gap: 6,
                    boxShadow: "0 1px 3px rgba(43,38,32,0.06)",
                  }}
                >
                  <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: INK }}>{name}</span>
                  <span style={{ fontSize: 12, color: INK, opacity: 0.65, lineHeight: 1.4 }}>{dataMap[name].blurb}</span>
                </div>
              ))}
            </div>
          )}

          {selected && kind === "race" && (
            <RaceDetail data={RACE_DATA[selected]} name={selected} onChoose={() => onChoose(selected)} />
          )}
          {selected && kind === "class" && (
            <ClassDetail data={CLASS_DATA[selected]} name={selected} onChoose={() => onChoose(selected)} />
          )}
          {selected && kind === "background" && (
            <BackgroundDetail data={BACKGROUND_DATA[selected]} name={selected} onChoose={() => onChoose(selected)} />
          )}
        </div>
      </div>
    </div>
  );
}

function ChooseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="cm-btn"
      style={{
        marginTop: 18, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
        padding: "9px 20px", borderRadius: 20, border: "none", background: RED, color: "#FBF8EE", cursor: "pointer",
      }}
    >
      Choose this
    </button>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, color: INK, marginBottom: 4 }}>
      <span style={{ opacity: 0.6, minWidth: 130 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function RaceDetail({ data, onChoose }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: INK, opacity: 0.75, marginBottom: 14, lineHeight: 1.5 }}>{data.blurb}</p>
      <StatRow label="Ability increase" value={data.abilityBonus} />
      <StatRow label="Size" value={data.size} />
      <StatRow label="Speed" value={data.speed} />
      <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginTop: 16, marginBottom: 8 }}>Racial traits</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.traits.map(([name, desc]) => (
          <div key={name} style={{ borderLeft: `2px solid ${BRASS}`, paddingLeft: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{name}</div>
            <div style={{ fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>
      <ChooseButton onClick={onChoose} />
    </div>
  );
}

function BackgroundDetail({ data, onChoose }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: INK, opacity: 0.75, marginBottom: 14, lineHeight: 1.5 }}>{data.blurb}</p>
      <StatRow label="Skill proficiencies" value={data.skills} />
      <StatRow label="Other proficiencies" value={data.proficiencies} />
      <StatRow label="Equipment" value={data.equipment} />
      <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginTop: 16, marginBottom: 8 }}>Background feature</h4>
      <div style={{ borderLeft: `2px solid ${BRASS}`, paddingLeft: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{data.feature[0]}</div>
        <div style={{ fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.4 }}>{data.feature[1]}</div>
      </div>
      <ChooseButton onClick={onChoose} />
    </div>
  );
}

function ClassDetail({ data, onChoose }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: INK, opacity: 0.75, marginBottom: 14, lineHeight: 1.5 }}>{data.blurb}</p>
      <StatRow label="Hit die" value={data.hitDie} />
      <StatRow label="Primary ability" value={data.primaryAbility} />
      <StatRow label="Saving throws" value={data.saves} />
      <StatRow label="Armor" value={data.armor} />
      <StatRow label="Weapons" value={data.weapons} />

      <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginTop: 16, marginBottom: 8 }}>Starting features</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {data.features.map(([name, desc]) => (
          <div key={name} style={{ borderLeft: `2px solid ${BRASS}`, paddingLeft: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{name}</div>
            <div style={{ fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.4 }}>{desc}</div>
          </div>
        ))}
      </div>

      <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginBottom: 8 }}>Class table</h4>
      <div style={{ border: `1px solid ${BRASS}66`, borderRadius: 6, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: PAPER_DARK }}>
              <th style={{ textAlign: "left", padding: "6px 10px", color: INK, fontWeight: 600 }}>Level</th>
              <th style={{ textAlign: "left", padding: "6px 10px", color: INK, fontWeight: 600 }}>Prof. bonus</th>
              <th style={{ textAlign: "left", padding: "6px 10px", color: INK, fontWeight: 600 }}>Features</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map(([level, features]) => (
              <tr key={level} style={{ borderTop: `1px solid ${BRASS}33` }}>
                <td style={{ padding: "5px 10px", fontFamily: "IBM Plex Mono, monospace", color: INK }}>{level}</td>
                <td style={{ padding: "5px 10px", fontFamily: "IBM Plex Mono, monospace", color: INK }}>{fmtMod(profBonus(level))}</td>
                <td style={{ padding: "5px 10px", color: INK, opacity: 0.85 }}>{features.length ? features.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChooseButton onClick={onChoose} />
    </div>
  );
}


function CreationChoiceCard({ selected, title, description, meta, onClick, children }) {
  return (
    <button type="button" className={`creation-choice ${selected ? "is-selected" : ""}`} onClick={onClick}>
      <div className="creation-choice-head">
        <div><div className="creation-choice-title">{title}</div>{meta && <div className="creation-choice-meta">{meta}</div>}</div>
        <span className="creation-choice-check">{selected ? "✓" : ""}</span>
      </div>
      {description && <div className="creation-choice-description">{description}</div>}
      {children}
    </button>
  );
}
function CreationProgress({ step, total }) {
  return <div className="creation-progress">{Array.from({length: total}).map((_,i)=><div key={i} className={`creation-progress-segment ${i<=step?"is-active":""}`} />)}</div>;
}
function CreationStepHeader({ eyebrow, title, description }) {
  return <div className="creation-step-header"><div className="creation-eyebrow">{eyebrow}</div><h2>{title}</h2><p>{description}</p></div>;
}
function CreationWizard({ onCancel, onFinish }) {
  const steps=["Basics","Species","Class","Background","Abilities","Training","Review"];
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState({name:"",ruleset:"2014",level:1,race:"",className:"",background:"",abilityMethod:"standard",abilities:{str:15,dex:14,con:13,int:12,wis:10,cha:8},skillExtras:[]});
  const selectedRace=RACE_DATA[draft.race], selectedClass=CLASS_DATA[draft.className], selectedBackground=BACKGROUND_DATA[draft.background];
  const standardValues=[15,14,13,12,10,8];
  const pointCosts={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
  const pointSpend=Object.values(draft.abilities).reduce((s,v)=>s+(pointCosts[Math.max(8,Math.min(15,Number(v)||8))]??0),0);
  const skillExtraNeeded=draft.race==="Half-Elf"?2:0;
  const valid=()=>{
    if(step===0)return draft.name.trim().length>=2;
    if(step===1)return !!draft.race;
    if(step===2)return !!draft.className;
    if(step===3)return !!draft.background;
    if(step===4)return draft.abilityMethod==="standard"?new Set(Object.values(draft.abilities).map(Number)).size===6: draft.abilityMethod==="pointbuy"?pointSpend<=27:Object.values(draft.abilities).every(v=>Number(v)>=1&&Number(v)<=20);
    if(step===5)return draft.skillExtras.length===skillExtraNeeded;
    return true;
  };
  function setAbility(k,v){setDraft(d=>({...d,abilities:{...d.abilities,[k]:Number(v)}}));}
  function toggleSkill(name){setDraft(d=>{const has=d.skillExtras.includes(name); if(has)return {...d,skillExtras:d.skillExtras.filter(x=>x!==name)}; if(d.skillExtras.length>=skillExtraNeeded)return d; return {...d,skillExtras:[...d.skillExtras,name]};});}
  function next(){if(valid())setStep(s=>Math.min(steps.length-1,s+1));}
  function finish(){
    let built={...blankCharacter(draft.name.trim()),name:draft.name.trim(),ruleset:draft.ruleset,level:1,abilities:draft.abilities};
    built=applyRace(built,draft.race); built=applyClass(built,draft.className); built=applyBackground(built,draft.background);
    if(draft.skillExtras.length) built={...built,skillProf:{...(built.skillProf||{}),...Object.fromEntries(draft.skillExtras.map(x=>[x,true]))}};
    onFinish(syncProgression({...built,ruleset:draft.ruleset},1));
  }
  const stepPrompt=[
    ["Start with the basics","Name your character and choose which ruleset this character belongs to."],
    ["Choose your species","Your choice will automatically apply its speed, traits, and ability bonuses."],
    ["Choose your class","Your class determines hit die, saving throws, proficiencies, features, and spellcasting."],
    ["Choose your background","Your background adds skills, tools, story flavor, and starting gear."],
    ["Assign your abilities","Choose a score method. The final sheet will calculate modifiers automatically."],
    ["Review your training","Most proficiencies are derived automatically. Only ask for choices when the character needs one."],
    ["Everything is ready","Review the result. Finish to create the populated character sheet."],
  ];
  return <div className="creation-overlay" role="dialog" aria-modal="true">
    <div className="creation-shell">
      <aside className="creation-sidebar">
        <div className="creation-brand"><div className="creation-brand-mark">✦</div><div><strong>Create your character</strong><span>Guided setup</span></div></div>
        <CreationProgress step={step} total={steps.length}/>
        <div className="creation-step-list">{steps.map((name,i)=><button type="button" key={name} className={`creation-step-item ${i===step?"is-current":""} ${i<step?"is-complete":""}`} onClick={()=>i<=step&&setStep(i)}><span>{i<step?"✓":String(i+1).padStart(2,"0")}</span><div><strong>{name}</strong><small>{i<step?"Complete":i===step?"Current step":"Upcoming"}</small></div></button>)}</div>
        <button type="button" className="creation-cancel" onClick={onCancel}>Cancel</button>
      </aside>
      <section className="creation-content">
        <div className="creation-topbar"><div><span>Step {step+1} of {steps.length}</span><strong>{steps[step]}</strong></div><div className="creation-top-summary">{draft.name||"New character"}{draft.className?` · ${draft.className}`:""}</div></div>
        <div className="creation-scroll">
          {step===0&&<><CreationStepHeader eyebrow="Character basics" title={stepPrompt[0][0]} description={stepPrompt[0][1]}/><div className="creation-section-grid two"><label className="creation-field"><span>Character name</span><input autoFocus value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="e.g. Newman"/><small>You can change this later.</small></label><label className="creation-field"><span>Starting level</span><select value="1" disabled><option value="1">Level 1</option></select><small>Guided creation currently starts at level 1.</small></label></div><div className="creation-section"><div className="creation-section-title">Ruleset</div><div className="creation-grid two">{[["2014","2014 5e","Classic 5th Edition"],["2024","2024 rules","Revised 5th Edition"]].map(([id,t,m])=><CreationChoiceCard key={id} selected={draft.ruleset===id} title={t} meta={m} description={id==="2014"?"Use the current 2014-style data available in the app.":"Store this as a 2024 character; rules-specific content will continue to expand."} onClick={()=>setDraft(d=>({...d,ruleset:id}))}/>)}</div></div></>}
          {step===1&&<><CreationStepHeader eyebrow="Ancestry" title={stepPrompt[1][0]} description={stepPrompt[1][1]}/><div className="creation-grid three">{Object.entries(RACE_DATA).map(([n,d])=><CreationChoiceCard key={n} selected={draft.race===n} title={n} meta={`${d.size} · ${d.speed}`} description={d.blurb} onClick={()=>setDraft(x=>({...x,race:n,skillExtras:n==="Half-Elf"?x.skillExtras.slice(0,2):[]}))}><div className="creation-choice-foot">{d.abilityBonus}</div></CreationChoiceCard>)}</div>{selectedRace&&<div className="creation-info-panel"><strong>{draft.race}</strong><span>{selectedRace.traits.map(([n])=>n).join(" · ")}</span></div>}</>}
          {step===2&&<><CreationStepHeader eyebrow="Calling" title={stepPrompt[2][0]} description={stepPrompt[2][1]}/><div className="creation-grid three">{Object.entries(CLASS_DATA).map(([n,d])=><CreationChoiceCard key={n} selected={draft.className===n} title={n} meta={`${d.hitDie} · ${d.primaryAbility}`} description={d.blurb} onClick={()=>setDraft(x=>({...x,className:n}))}><div className="creation-choice-foot">{d.saves} saves</div></CreationChoiceCard>)}</div>{selectedClass&&<div className="creation-detail-panel"><div><strong>Level 1 features</strong></div><div className="creation-feature-list">{selectedClass.features.map(([n,d])=><div key={n}><b>{n}</b><span>{d}</span></div>)}</div></div>}</>}
          {step===3&&<><CreationStepHeader eyebrow="Origin" title={stepPrompt[3][0]} description={stepPrompt[3][1]}/><div className="creation-grid three">{Object.entries(BACKGROUND_DATA).map(([n,d])=><CreationChoiceCard key={n} selected={draft.background===n} title={n} meta={d.skills} description={d.blurb} onClick={()=>setDraft(x=>({...x,background:n}))}><div className="creation-choice-foot">{d.feature[0]}</div></CreationChoiceCard>)}</div>{selectedBackground&&<div className="creation-info-panel"><strong>{selectedBackground.feature[0]}</strong><span>{selectedBackground.feature[1]}</span></div>}</>}
          {step===4&&<><CreationStepHeader eyebrow="Abilities" title={stepPrompt[4][0]} description={stepPrompt[4][1]}/><div className="creation-methods">{[["standard","Standard array","15, 14, 13, 12, 10, 8"],["pointbuy","Point buy","27 points"],["custom","Custom","Enter your own values"]].map(([id,t,m])=><button type="button" key={id} className={`creation-method ${draft.abilityMethod===id?"is-selected":""}`} onClick={()=>setDraft(d=>({ ...d,abilityMethod:id,abilities:id==="standard"?{str:15,dex:14,con:13,int:12,wis:10,cha:8}:id==="pointbuy"?{str:8,dex:8,con:8,int:8,wis:8,cha:8}:d.abilities}))}><strong>{t}</strong><span>{m}</span></button>)}</div><div className="ability-builder">{ABILITIES.map(a=><label className="ability-builder-row" key={a.key}><span><b>{a.label}</b><small>{fmtMod(abilityMod(Number(draft.abilities[a.key])))}</small></span><select value={draft.abilities[a.key]} onChange={e=>setAbility(a.key,e.target.value)}>{(draft.abilityMethod==="standard"?standardValues:draft.abilityMethod==="pointbuy"?[8,9,10,11,12,13,14,15]:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]).map(v=><option key={v} value={v} disabled={draft.abilityMethod==="standard"&&v!==draft.abilities[a.key]&&Object.values(draft.abilities).includes(v)}>{v}</option>)}</select>{draft.abilityMethod==="pointbuy"&&<small>{pointCosts[Math.max(8,Math.min(15,Number(draft.abilities[a.key])))]??0} pts</small>}</label>)}</div>{draft.abilityMethod==="pointbuy"&&<div className={`creation-budget ${pointSpend>27?"over":""}`}><span>Points spent</span><strong>{pointSpend} / 27</strong></div>}</>}
          {step===5&&<><CreationStepHeader eyebrow="Training" title={stepPrompt[5][0]} description={stepPrompt[5][1]}/><div className="training-summary"><div className="training-card"><span>Saving throws</span><strong>{selectedClass?.saves||"—"}</strong></div><div className="training-card"><span>Armor</span><strong>{selectedClass?.armor||"—"}</strong></div><div className="training-card"><span>Weapons</span><strong>{selectedClass?.weapons||"—"}</strong></div><div className="training-card"><span>Background skills</span><strong>{selectedBackground?.skills||"—"}</strong></div></div>{skillExtraNeeded>0&&<div className="creation-section"><div className="creation-section-title">Choose {skillExtraNeeded} extra skills</div><p className="creation-helper">Your {draft.race} grants additional skill choices.</p><div className="skill-picker-grid">{SKILLS.map(([n])=><button type="button" key={n} className={`skill-pill ${draft.skillExtras.includes(n)?"is-selected":""}`} onClick={()=>toggleSkill(n)}>{draft.skillExtras.includes(n)?"✓ ":""}{n}</button>)}</div></div>}<div className="creation-auto-note"><strong>Applied automatically</strong><span>Species traits, class saving throws, class HP, background skills, background equipment, speed, and level 1 features are applied when you finish.</span></div></>}
          {step===6&&<><CreationStepHeader eyebrow="Final review" title={stepPrompt[6][0]} description={stepPrompt[6][1]}/><div className="review-hero"><div className="review-avatar">{(draft.name||"?").charAt(0).toUpperCase()}</div><div><h3>{draft.name||"Unnamed adventurer"}</h3><p>{draft.race||"No species"} · {draft.className||"No class"} · {draft.background||"No background"} · Level 1</p></div></div><div className="review-grid">{ABILITIES.map(a=>{const s=Number(draft.abilities[a.key]),b=draft.race?raceBonus(draft.race,a.key):0;return <div className="review-stat" key={a.key}><span>{a.label}</span><strong>{s+b}</strong><small>{fmtMod(abilityMod(s+b))}</small></div>})}</div><div className="review-sections"><div><span>Hit die</span><strong>{selectedClass?.hitDie||"—"}</strong></div><div><span>Speed</span><strong>{selectedRace?.speed||"—"}</strong></div><div><span>Saving throws</span><strong>{selectedClass?.saves||"—"}</strong></div><div><span>Background skills</span><strong>{selectedBackground?.skills||"—"}</strong></div><div className="wide"><span>Starting features</span><strong>{selectedClass?.features.map(([n])=>n).join(" · ")||"—"}</strong></div><div className="wide"><span>Background equipment</span><strong>{selectedBackground?.equipment||"—"}</strong></div></div></>}
        </div>
        <div className="creation-footer"><button type="button" className="creation-secondary" onClick={step===0?onCancel:()=>setStep(s=>s-1)}>{step===0?"Cancel":"Back"}</button><div className="creation-footer-status">{!valid()&&<span>{step===0?"Add a name to continue.":step===4?"Finish assigning your ability scores.":"Complete this step to continue."}</span>}</div>{step<steps.length-1?<button type="button" className="creation-primary" disabled={!valid()} onClick={next}>Continue <ChevronRight size={17}/></button>:<button type="button" className="creation-primary" onClick={finish}>Create Character <Plus size={17}/></button>}</div>
      </section>
    </div>
  </div>;
}

export default function CharacterManager() {
  const [index, setIndex] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [char, setChar] = useState(null);
  const [tab, setTab] = useState("actions");
  const [chooserOpen, setChooserOpen] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [error, setError] = useState(null);
  const [creationWizardOpen, setCreationWizardOpen] = useState(false);
  const saveTimer = useRef(null);
  const saveTimerId = useRef(null);
  const saveVersions = useRef({});

  const loadIndex = useCallback(async () => {
    try {
      const res = await window.storage.get("char-index");
      const list = res ? JSON.parse(res.value) : [];
      setIndex(list);
      if (list.length && !selectedId) {
        selectCharacter(list[0].id);
      }
    } catch {
      setIndex([]);
    }
  }, [selectedId]);

  useEffect(() => {
    loadIndex();
  }, []);

  async function selectCharacter(id) {
    setError(null);
    try {
      const res = await window.storage.get(`char-detail:${id}`);
      if (res) {
        setChar(JSON.parse(res.value));
        setSelectedId(id);
        setTab("stats");
      }
    } catch {
      setError("Couldn't load that character.");
    }
  }

  async function createCharacter() {
    setError(null);
    setCreationWizardOpen(true);
  }

  async function finishCharacterCreation(newChar) {
    try {
      await window.storage.set(`char-detail:${newChar.id}`, JSON.stringify(newChar));
      const newIndex = [...(index || []), { id:newChar.id, name:newChar.name, race:newChar.race||"", className:newChar.className||"", level:newChar.level||1 }];
      await window.storage.set("char-index", JSON.stringify(newIndex));
      setIndex(newIndex); setChar(newChar); setSelectedId(newChar.id); setTab("stats"); setCreationWizardOpen(false);
    } catch (err) {
      console.error("Character creation failed:", err);
      setError(`Couldn't create a new character: ${err?.message || "database request failed"}`);
    }
  }

  async function deleteCharacter(id) {
    // Cancel a pending autosave for this character so deletion cannot be undone by the save timer.
    if (saveTimer.current && saveTimerId.current === id) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      saveTimerId.current = null;
    }
    saveVersions.current[id] = (saveVersions.current[id] || 0) + 1;
    const deletionVersion = saveVersions.current[id];

    try {
      await window.storage.delete(`char-detail:${id}`);
      const newIndex = (index || []).filter((c) => c.id !== id);
      await window.storage.set("char-index", JSON.stringify(newIndex));
      setIndex(newIndex);
      setActiveNote(null);
      if (selectedId === id) {
        setChar(null);
        setSelectedId(null);
        if (newIndex.length) await selectCharacter(newIndex[0].id);
      }
      // Clean up if an already-running save raced the deletion.
      if (saveVersions.current[id] !== deletionVersion) {
        await window.storage.delete(`char-detail:${id}`);
      }
    } catch (err) {
      console.error("Character deletion failed:", err);
      setError(`Couldn't delete that character: ${err?.message || "database request failed"}`);
    }
  }

  const persist = useCallback(
    (nextChar) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const version = (saveVersions.current[nextChar.id] || 0) + 1;
      saveVersions.current[nextChar.id] = version;
      saveTimerId.current = nextChar.id;
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          if (version !== saveVersions.current[nextChar.id]) return;
          await window.storage.set(`char-detail:${nextChar.id}`, JSON.stringify(nextChar));
          if (version !== saveVersions.current[nextChar.id]) {
            await window.storage.delete(`char-detail:${nextChar.id}`);
            return;
          }
          const newIndex = (index || []).map((c) =>
            c.id === nextChar.id
              ? { id: c.id, name: nextChar.name, race: nextChar.race, className: nextChar.className, level: nextChar.level }
              : c
          );
          await window.storage.set("char-index", JSON.stringify(newIndex));
          if (version !== saveVersions.current[nextChar.id]) {
            // A deletion may have raced the index write. Restore the index without this character.
            const latestIndex = await window.storage.get("char-index");
            if (latestIndex) {
              const cleanedIndex = JSON.parse(latestIndex.value).filter((c) => c.id !== nextChar.id);
              await window.storage.set("char-index", JSON.stringify(cleanedIndex));
              setIndex(cleanedIndex);
            }
            return;
          }
          setIndex(newIndex);
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 1200);
        } catch {
          setSaveState("error");
        } finally {
          saveTimer.current = null;
          saveTimerId.current = null;
        }
      }, 500);
    },
    [index]
  );

  function updateChar(updater) {
    setChar((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }

  function levelUp() {
    updateChar((prev) => {
      const newLevel = Math.min(20, prev.level + 1);
      const conMod = abilityMod(prev.abilities.con + raceBonus(prev.race, "con"));
      const gain = avgHitDie(prev.hitDie) + conMod;
      return syncProgression({
        ...prev,
        level: newLevel,
        hp: { ...prev.hp, max: prev.hp.max + Math.max(1, gain), current: prev.hp.current + Math.max(1, gain) },
      }, newLevel);
    });
  }

  function levelDown() {
    updateChar((prev) => {
      const newLevel = Math.max(1, prev.level - 1);
      return { ...prev, level: newLevel, spellInfo: prev.className && SPELL_PROGRESSION[prev.className] ? { ...(prev.spellInfo || {}), spellsKnownOrPrepared: SPELL_PROGRESSION[prev.className][newLevel] || 0, level: newLevel } : null };
    });
  }

  if (index === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, background: PAPER, fontFamily: "Inter, sans-serif", color: INK }}>
        <Loader2 className="animate-spin" size={20} style={{ marginRight: 8 }} /> Opening the ledger…
      </div>
    );
  }

  if (creationWizardOpen) {
    return <CreationWizard onCancel={() => setCreationWizardOpen(false)} onFinish={finishCharacterCreation} />;
  }

  const pb = char ? profBonus(char.level) : 2;
  const effAbilities = char ? effectiveAbilities(char) : null;

  return (
    <div className="cm-root" style={{ background: PAPER, minHeight: 600, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap');
        .cm-scroll::-webkit-scrollbar { width: 8px; }
        .cm-scroll::-webkit-scrollbar-thumb { background: ${BRASS}66; border-radius: 4px; }
        .cm-scroll::-webkit-scrollbar-track { background: transparent; }
        .cm-tab { cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
        .cm-tab:hover { background: ${PAPER_DARK}; }
        .cm-btn { cursor: pointer; transition: transform 0.1s ease, background 0.15s ease, border-color 0.15s ease; }
        .cm-btn:hover { border-color: ${BRASS}; }
        .cm-btn:active { transform: scale(0.96); }
        .cm-row { transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease; }
        .cm-row:hover { background: ${PAPER_DARK}; }
        .cm-card-hover:hover { box-shadow: 0 3px 10px rgba(43,38,32,0.12); transform: translateY(-1px); }
        .cm-clickable { cursor: pointer; }
        .cm-clickable:focus-visible { outline: 2px solid ${BRASS}; outline-offset: 2px; }
        .cm-app-shell { background-image: radial-gradient(${BRASS}14 1px, transparent 1px); background-size: 14px 14px; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${BRASS} !important; box-shadow: 0 0 0 2px ${BRASS}33; }
      `}</style>

      <div className="cm-app-shell cm-topbar" style={{ borderBottom: `2px solid ${BRASS}99`, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(180deg, ${PAPER_DARK}, ${PAPER})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${BRASS}`, display: "flex", alignItems: "center", justifyContent: "center", background: INK }}>
            <ScrollText size={16} color={PARCHMENT_TEXT} />
          </div>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 20, color: INK, lineHeight: 1.1 }}>Adventurer's Ledger</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: INK, opacity: 0.55, letterSpacing: 0.3 }}>Character sheets, saved and ready</div>
          </div>
        </div>
      </div>

      <div className="cm-body">
      {/* Sidebar ledger */}
      <div className="cm-scroll cm-sidebar" style={{ width: sidebarCollapsed ? 48 : 250, transition: "width 0.2s ease", borderRight: `2px solid ${BRASS}55`, padding: sidebarCollapsed ? "12px 8px" : "20px 14px", overflowY: "auto", maxHeight: 700, background: PAPER_DARK + "55", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "space-between", marginBottom: sidebarCollapsed ? 0 : 16 }}>
          {!sidebarCollapsed && <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, color: INK, margin: 0, letterSpacing: 0.2 }}>Your ledger</h2>}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {!sidebarCollapsed && <button onClick={createCharacter} className="cm-btn" aria-label="New character" style={{ background: RED, border: `1px solid ${RED}`, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#FBF8EE" }}><Plus size={15} /></button>}
            <button onClick={() => setSidebarCollapsed((v) => !v)} className="cm-btn" aria-label={sidebarCollapsed ? "Expand character ledger" : "Collapse character ledger"} title={sidebarCollapsed ? "Expand ledger" : "Collapse ledger"} style={{ background: "none", border: `1px solid ${BRASS}77`, color: INK, borderRadius: 5, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}><ChevronLeft size={14} style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none" }} /></button>
          </div>
        </div>
        {sidebarCollapsed && <button onClick={createCharacter} className="cm-btn" aria-label="New character" title="New character" style={{ marginTop: 10, background: RED, border: `1px solid ${RED}`, borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#FBF8EE", padding: 0 }}><Plus size={15} /></button>}
        {!sidebarCollapsed && index.length === 0 && <p style={{ fontSize: 13, color: INK, opacity: 0.6, lineHeight: 1.5 }}>No adventurers logged yet. Add your first character to begin.</p>}
        {!sidebarCollapsed && <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {index.map((c) => (
            <div key={c.id} className="cm-row" onClick={() => selectCharacter(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 6, cursor: "pointer", background: selectedId === c.id ? "#FBF8EE" : "transparent", boxShadow: selectedId === c.id ? `0 1px 4px rgba(43,38,32,0.15)` : "none", borderLeft: selectedId === c.id ? `3px solid ${RED}` : "3px solid transparent" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: selectedId === c.id ? RED : BRASS, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 13, color: "#FBF8EE" }}>{(c.name || "?").trim().charAt(0).toUpperCase() || "?"}</div>
              <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name || "Unnamed"}</div><div style={{ fontSize: 11, color: INK, opacity: 0.6 }}>Lv {c.level} {c.className || "—"}</div></div>
              <button onClick={(e) => { e.stopPropagation(); deleteCharacter(c.id); }} aria-label="Delete character" className="cm-btn" style={{ background: "none", border: "none", color: RED, opacity: 0.45, cursor: "pointer", padding: 4, flexShrink: 0 }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>}
      </div>

      {/* Main sheet */}
      <div className="cm-scroll cm-main" style={{ flex: 1, padding: "28px 36px", overflowY: "auto", maxHeight: 700 }}>
        {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12, background: "#FBF8EE", border: `1px solid ${RED}55`, borderRadius: 6, padding: "8px 12px" }}>{error}</div>}

        {!char ? (
          <StartScreen onBegin={createCharacter} hasCharacters={index.length > 0} onOpenFirst={() => selectCharacter(index[0].id)} />
        ) : (
          <>
            {/* Header bar */}
            <div className="cm-character-header" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap", background: "#FBF8EE", border: `1px solid ${BRASS}66`, borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 3px rgba(43,38,32,0.08)" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                background: INK, border: `2px solid ${BRASS}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, color: PARCHMENT_TEXT,
              }}>
                {(char.name || "?").trim().charAt(0).toUpperCase() || "?"}
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 180 }}>
                <input
                  value={char.name}
                  onChange={(e) => updateChar({ ...char, name: e.target.value })}
                  style={{
                    fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 24, color: INK,
                    background: "transparent", border: "none", outline: "none", width: "100%", padding: "1px 0",
                  }}
                  placeholder="Character name"
                />
                <div style={{ fontSize: 12, color: INK, opacity: 0.6 }}>
                  {char.race || "No species"} · {char.className || "No class"} · Level {char.level}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <OpenChooserButton label="Species" value={char.race} onClick={() => setChooserOpen("race")} width={120} />
                <OpenChooserButton label="Class" value={char.className} onClick={() => setChooserOpen("class")} width={120} />
                <OpenChooserButton label="Background" value={char.background} onClick={() => setChooserOpen("background")} width={130} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, borderLeft: `1px solid ${BRASS}44`, paddingLeft: 14 }}>
                <span style={{ fontSize: 11, color: INK, opacity: 0.6 }}>Lvl</span>
                <button onClick={levelDown} className="cm-btn" aria-label="Level down" style={{ background: "none", border: `1px solid ${BRASS}77`, borderRadius: 5, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronDown size={11} />
                </button>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, fontWeight: 600, color: INK, minWidth: 20, textAlign: "center" }}>{char.level}</span>
                <button onClick={levelUp} className="cm-btn" aria-label="Level up" style={{ background: "none", border: `1px solid ${BRASS}77`, borderRadius: 5, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronUp size={11} />
                </button>
              </div>

              <div style={{ fontSize: 11, color: saveState === "error" ? RED : MOSS, minWidth: 46 }}>
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : ""}
              </div>
            </div>

            {/* Ability score row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 10, marginBottom: 20 }}>
              {ABILITIES.map((a) => {
                const score = char.abilities[a.key];
                const bonus = raceBonus(char.race, a.key);
                const mod = abilityMod(score + bonus);
                return (
                  <div key={a.key} className="cm-card-hover" style={{ border: `1px solid ${BRASS}88`, borderRadius: 8, padding: "10px 8px", textAlign: "center", background: "#FBF8EE", boxShadow: "0 1px 3px rgba(43,38,32,0.08)" }}>
                    <div style={{ fontSize: 10, color: INK, opacity: 0.6, marginBottom: 2, letterSpacing: 0.3 }}>{a.label.slice(0, 3).toUpperCase()}</div>
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 600, color: INK }}>{fmtMod(mod)}</div>
                    <input
                      type="number"
                      value={score}
                      onChange={(e) => updateChar({ ...char, abilities: { ...char.abilities, [a.key]: parseInt(e.target.value || "0", 10) } })}
                      style={{ ...inputBase, width: 40, textAlign: "center", marginTop: 4, fontFamily: "IBM Plex Mono, monospace", padding: "3px 4px", fontSize: 12 }}
                    />
                    <div style={{ fontSize: 9, color: MOSS, marginTop: 3, height: 11 }}>{bonus ? `+${bonus} racial` : ""}</div>
                  </div>
                );
              })}
            </div>

            {/* Three-column dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 260px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
              {/* Column 1 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SavingThrowsBox char={char} abilities={effAbilities} updateChar={updateChar} pb={pb} />
                <SensesBox char={char} abilities={effAbilities} pb={pb} />
                <ProficienciesBox char={char} updateChar={updateChar} />
              </div>

              {/* Column 2 */}
              <SkillsBox char={char} abilities={effAbilities} updateChar={updateChar} pb={pb} />

              {/* Column 3 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                <div className="cm-vital-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <VitalCard icon={<Swords size={16} color={BRASS} />} label="Proficiency">
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 600, color: INK }}>{fmtMod(pb)}</span>
                  </VitalCard>
                  <VitalCard icon={<Sparkles size={16} color={BRASS} />} label="Speed">
                    <NumberBox value={char.speed} onChange={(v) => updateChar({ ...char, speed: v })} width={50} big />
                  </VitalCard>
                  <div
                    className="cm-card-hover"
                    onClick={() => updateChar({ ...char, inspiration: !char.inspiration })}
                    style={{
                      border: `1px solid ${BRASS}88`, borderRadius: 8, padding: "12px 16px", cursor: "pointer",
                      background: char.inspiration ? RED : "#FBF8EE", minWidth: 120, boxShadow: "0 1px 3px rgba(43,38,32,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Sparkles size={16} color={char.inspiration ? "#FBF8EE" : BRASS} />
                      <span style={{ fontSize: 11, color: char.inspiration ? "#FBF8EE" : INK, opacity: char.inspiration ? 1 : 0.65 }}>Inspiration</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: char.inspiration ? "#FBF8EE" : INK, opacity: char.inspiration ? 1 : 0.5 }}>
                      {char.inspiration ? "Ready" : "None"}
                    </span>
                  </div>
                  <VitalCard icon={<Heart size={16} color={RED} />} label="Hit points">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <NumberBox value={char.hp.current} onChange={(v) => updateChar({ ...char, hp: { ...char.hp, current: v } })} width={44} />
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", color: INK, opacity: 0.5 }}>/</span>
                      <NumberBox value={char.hp.max} onChange={(v) => updateChar({ ...char, hp: { ...char.hp, max: v } })} width={44} />
                      <span style={{ fontSize: 9, color: INK, opacity: 0.5 }}>temp</span>
                      <NumberBox value={char.hp.temp} onChange={(v) => updateChar({ ...char, hp: { ...char.hp, temp: v } })} width={36} />
                    </div>
                  </VitalCard>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <VitalCard icon={<Sparkles size={16} color={BLUE} />} label="Initiative">
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 600, color: INK }}>{fmtMod(abilityMod(effAbilities.dex))}</span>
                  </VitalCard>
                  <div className="cm-card-hover" style={{ border: `2px solid ${BLUE}`, borderRadius: 8, padding: "10px 18px", background: "#FBF8EE", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 1px 3px rgba(43,38,32,0.08)" }}>
                    <Shield size={14} color={BLUE} />
                    <NumberBox value={char.ac} onChange={(v) => updateChar({ ...char, ac: v })} width={44} big />
                    <span style={{ fontSize: 9, color: INK, opacity: 0.6, marginTop: 2 }}>Armor class</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
                    <textarea
                      value={char.defenses}
                      onChange={(e) => updateChar({ ...char, defenses: e.target.value })}
                      placeholder="Resistances, immunities, vulnerabilities"
                      rows={2}
                      style={{ ...inputBase, resize: "none", fontSize: 11, fontFamily: "Inter, sans-serif" }}
                    />
                    <textarea
                      value={char.conditions}
                      onChange={(e) => updateChar({ ...char, conditions: e.target.value })}
                      placeholder="Active conditions"
                      rows={2}
                      style={{ ...inputBase, resize: "none", fontSize: 11, fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, marginTop: 4, background: "#FBF8EE", border: `1px solid ${BRASS}44`, borderRadius: 8, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
                  {[
                    ["actions", "Actions", <Swords size={13} key="i" />],
                    ["inventory", "Inventory", <ScrollText size={13} key="i" />],
                    ["features", "Features & traits", <BookOpen size={13} key="i" />],
                    ["background", "Background", <Sparkles size={13} key="i" />],
                    ["notes", "Notes", <Sparkles size={13} key="i" />],
                  ].map(([key, label, icon]) => (
                    <div
                      key={key}
                      className="cm-tab"
                      onClick={() => { setTab(key); setActiveNote(null); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6,
                        fontSize: 12, color: tab === key ? "#FBF8EE" : INK,
                        background: tab === key ? RED : "transparent",
                        fontWeight: tab === key ? 600 : 400, whiteSpace: "nowrap",
                      }}
                    >
                      {icon} {label}
                    </div>
                  ))}
                </div>

                <div style={{ border: `1px solid ${BRASS}44`, borderRadius: 8, background: "#FBF8EE", padding: 16, minHeight: 200 }}>
                  {tab === "actions" && <ActionsTab char={char} updateChar={updateChar} onShowNote={setActiveNote} />}
                  {tab === "inventory" && <InventoryTab char={char} updateChar={updateChar} onShowNote={setActiveNote} />}
                  {tab === "features" && <FeaturesTab char={char} updateChar={updateChar} onShowNote={setActiveNote} />}
                  {tab === "background" && <BackgroundTab char={char} onShowNote={setActiveNote} />}
                  {tab === "notes" && (
                    <Field label="Notes">
                      <textarea
                        value={char.notes}
                        onChange={(e) => updateChar({ ...char, notes: e.target.value })}
                        rows={10}
                        placeholder="Backstory, allies, quest hooks…"
                        style={{ ...inputBase, resize: "vertical", fontFamily: "Inter, sans-serif" }}
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      <InfoNote note={activeNote} onClose={() => setActiveNote(null)} />

      {chooserOpen && char && (
        <ChooserModal
          kind={chooserOpen}
          onClose={() => setChooserOpen(null)}
          onChoose={(value) => {
            if (chooserOpen === "race") updateChar(applyRace(char, value));
            if (chooserOpen === "class") updateChar(applyClass(char, value));
            if (chooserOpen === "background") updateChar(applyBackground(char, value));
            setChooserOpen(null);
          }}
        />
      )}
    </div>
  );
}

function VitalCard({ icon, label, children }) {
  return (
    <div className={`cm-card-hover cm-vital-card cm-vital-${label.toLowerCase().replace(/\s+/g, "-")}`} style={{ border: `1px solid ${BRASS}88`, borderRadius: 8, padding: "12px 16px", background: "#FBF8EE", minWidth: 140, boxShadow: "0 1px 3px rgba(43,38,32,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, color: INK, opacity: 0.65, letterSpacing: 0.2 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function NumberBox({ value, onChange, width, big }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
      onClick={(e) => e.stopPropagation()}
      style={{
        ...inputBase,
        width,
        textAlign: "center",
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: big ? 20 : 15,
        fontWeight: 600,
      }}
    />
  );
}

function StartCard({ eyebrow, title, blurb, art, onClick, primary }) {
  return (
    <div
      className="cm-card-hover"
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        background: NIGHT_CARD,
        border: `1px solid ${BRASS}55`,
        display: "flex",
        flexDirection: "column",
        minHeight: 200,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ height: 96, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${NIGHT_CARD}, ${NIGHT})` }}>
        {art}
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, letterSpacing: 0.4, color: BRASS, textTransform: "uppercase" }}>{eyebrow}</span>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: PARCHMENT_TEXT }}>{title}</span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: PARCHMENT_TEXT, opacity: 0.65, flex: 1 }}>{blurb}</span>
        <button
          onClick={onClick}
          className="cm-btn"
          style={{
            alignSelf: "flex-end",
            marginTop: 8,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
            padding: "8px 16px",
            borderRadius: 20,
            border: primary ? "none" : `1px solid ${BRASS}`,
            background: primary ? RED : "transparent",
            color: primary ? PARCHMENT_TEXT : BRASS,
            cursor: "pointer",
          }}
        >
          Begin
        </button>
      </div>
    </div>
  );
}

function ClassIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="18" y1="46" x2="42" y2="22" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="18" x2="46" y2="26" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="44" x2="12" y2="52" stroke={PARCHMENT_TEXT} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <line x1="12" y1="52" x2="20" y2="52" stroke={PARCHMENT_TEXT} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
function SpeciesIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" stroke={BRASS} strokeWidth="3" />
      <line x1="32" y1="10" x2="32" y2="18" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="46" x2="32" y2="54" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="32" x2="18" y2="32" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="32" x2="54" y2="32" stroke={BRASS} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill={PARCHMENT_TEXT} opacity="0.8" />
    </svg>
  );
}
function BackgroundIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M18 14 H40 L46 20 V50 H18 Z" stroke={BRASS} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M40 14 V20 H46" stroke={BRASS} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <line x1="23" y1="28" x2="38" y2="28" stroke={PARCHMENT_TEXT} strokeWidth="2" opacity="0.6" />
      <line x1="23" y1="34" x2="38" y2="34" stroke={PARCHMENT_TEXT} strokeWidth="2" opacity="0.6" />
      <line x1="23" y1="40" x2="33" y2="40" stroke={PARCHMENT_TEXT} strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

function StartScreen({ onBegin, hasCharacters, onOpenFirst }) {
  return (
    <div className="cm-dashboard">
      <section className="cm-hero">
        <div className="cm-hero-art" aria-hidden="true">
          <div className="cm-hero-candle" />
          <div className="cm-hero-book cm-book-one" />
          <div className="cm-hero-book cm-book-two" />
          <div className="cm-hero-map" />
          <div className="cm-hero-die">20</div>
        </div>
        <div className="cm-hero-content">
          <div className="cm-eyebrow">Your next campaign starts here</div>
          <h1>Welcome, Adventurer!</h1>
          <p>Create, manage, and prepare your D&D characters in a ledger built for the table. Keep your heroes organized and ready for the next quest.</p>
          <div className="cm-hero-actions">
            <button className="cm-primary-action cm-btn" onClick={onBegin}><Plus size={17} /> Create New Character</button>
            {hasCharacters && <button className="cm-secondary-action cm-btn" onClick={onOpenFirst}>Open a Character</button>}
          </div>
        </div>
      </section>

      <div className="cm-stat-strip">
        <div className="cm-stat"><div className="cm-stat-icon"><Swords size={19} /></div><div><strong>{hasCharacters ? "Your" : "0"}</strong><span>{hasCharacters ? "Characters" : "Characters"}</span></div></div>
        <div className="cm-stat"><div className="cm-stat-icon"><BookOpen size={19} /></div><div><strong>Ready</strong><span>For Adventure</span></div></div>
        <div className="cm-stat"><div className="cm-stat-icon"><Sparkles size={19} /></div><div><strong>1</strong><span>Living Ledger</span></div></div>
      </div>

      <section className="cm-section-panel">
        <div className="cm-section-heading">
          <div><div className="cm-eyebrow">Your ledger</div><h2>Your Characters</h2></div>
          <button className="cm-primary-action cm-btn cm-small-action" onClick={onBegin}><Plus size={16} /> Create New Character</button>
        </div>
        <div className="cm-empty-state">
          <div className="cm-empty-book"><BookOpen size={48} /></div>
          <h3>No characters yet</h3>
          <p>Every great adventure begins with a single hero. Create your first character and start building their story.</p>
          <button className="cm-secondary-action cm-btn" onClick={onBegin}>Build Your Hero</button>
        </div>
      </section>

      <section className="cm-feature-grid">
        <div className="cm-feature-card"><Swords size={23}/><div><h3>Build Your Hero</h3><p>Shape class, species, background, abilities, equipment, and more.</p></div></div>
        <div className="cm-feature-card"><BookOpen size={23}/><div><h3>Stay Organized</h3><p>Keep your characters together and ready for any campaign.</p></div></div>
        <div className="cm-feature-card"><Sparkles size={23}/><div><h3>Play With Confidence</h3><p>Quickly reach the stats, actions, spells, and notes you need at the table.</p></div></div>
      </section>
    </div>
  );
}

function BoxPanel({ title, children }) {
  return (
    <div style={{ border: `1px solid ${BRASS}66`, borderRadius: 8, background: "#FBF8EE", padding: "12px 14px", boxShadow: "0 1px 3px rgba(43,38,32,0.06)" }}>
      {children}
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 11, fontWeight: 600, color: BRASS, letterSpacing: 0.4, textTransform: "uppercase", textAlign: "center", marginTop: 10, borderTop: `1px solid ${BRASS}33`, paddingTop: 8 }}>
        {title}
      </div>
    </div>
  );
}

function SavingThrowsBox({ char, abilities, updateChar, pb }) {
  return (
    <BoxPanel title="Saving throws">
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {ABILITIES.map((a) => {
          const isProf = !!char.saveProf[a.key];
          const total = abilityMod(abilities[a.key]) + (isProf ? pb : 0);
          return (
            <label key={a.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: INK, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isProf}
                onChange={(e) => updateChar({ ...char, saveProf: { ...char.saveProf, [a.key]: e.target.checked } })}
                style={{ accentColor: MOSS }}
              />
              <span style={{ fontFamily: "IBM Plex Mono, monospace", width: 28 }}>{fmtMod(total)}</span>
              <span style={{ flex: 1 }}>{a.label}</span>
            </label>
          );
        })}
      </div>
    </BoxPanel>
  );
}

function SensesBox({ char, abilities, pb }) {
  const passive = (skillName, abilKey) => 10 + abilityMod(abilities[abilKey]) + (char.skillProf[skillName] ? pb : 0);
  const rows = [
    ["Passive Perception", passive("Perception", "wis")],
    ["Passive Investigation", passive("Investigation", "int")],
    ["Passive Insight", passive("Insight", "wis")],
  ];
  return (
    <BoxPanel title="Senses">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, fontWeight: 600, color: INK, border: `1px solid ${BRASS}66`, borderRadius: 5, width: 28, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{val}</span>
            <span style={{ fontSize: 11, color: INK, opacity: 0.75 }}>{label}</span>
          </div>
        ))}
      </div>
    </BoxPanel>
  );
}

function ProficienciesBox({ char, updateChar }) {
  const rows = [
    ["armorProf", "Armor"],
    ["weaponProf", "Weapons"],
    ["toolProf", "Tools"],
    ["languages", "Languages"],
  ];
  return (
    <BoxPanel title="Proficiencies & training">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(([key, label]) => (
          <div key={key}>
            <div style={{ fontSize: 10, color: INK, opacity: 0.55, marginBottom: 2, letterSpacing: 0.2 }}>{label}</div>
            <input
              value={char[key] || ""}
              onChange={(e) => updateChar({ ...char, [key]: e.target.value })}
              placeholder="—"
              style={{ ...inputBase, width: "100%", fontSize: 12, padding: "5px 7px" }}
            />
          </div>
        ))}
      </div>
    </BoxPanel>
  );
}

function SkillsBox({ char, abilities, updateChar, pb }) {
  return (
    <div style={{ border: `1px solid ${BRASS}66`, borderRadius: 8, background: "#FBF8EE", padding: "12px 14px", boxShadow: "0 1px 3px rgba(43,38,32,0.06)" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 12, fontWeight: 600, color: INK, marginBottom: 8 }}>Skills</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {SKILLS.map(([name, abilKey]) => {
          const isProf = !!char.skillProf[name];
          const total = abilityMod(abilities[abilKey]) + (isProf ? pb : 0);
          return (
            <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: INK, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isProf}
                onChange={(e) => updateChar({ ...char, skillProf: { ...char.skillProf, [name]: e.target.checked } })}
                style={{ accentColor: MOSS, flexShrink: 0 }}
              />
              <span style={{ fontFamily: "IBM Plex Mono, monospace", width: 26, flexShrink: 0 }}>{fmtMod(total)}</span>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
              <span style={{ fontSize: 10, opacity: 0.45, flexShrink: 0 }}>{abilKey}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function InfoNote({ note, onClose }) {
  if (!note) return null;
  return (
    <div role="dialog" aria-label={`${note.title} information`} style={{ position: "fixed", right: 28, top: 118, width: "min(320px, calc(100vw - 56px))", zIndex: 200, background: "#F4E6A5", color: INK, padding: "20px 18px 16px", border: `1px solid ${BRASS}99`, borderRadius: "2px 2px 6px 2px", boxShadow: "4px 6px 18px rgba(43,38,32,0.25)", transform: "rotate(-1deg)", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: 70, height: 16, background: "#D8C77A99", borderRadius: 2 }} />
      <button onClick={onClose} aria-label="Close information note" className="cm-btn" style={{ position: "absolute", top: 7, right: 7, background: "none", border: "none", color: INK, padding: 3 }}><X size={15} /></button>
      <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 19, paddingRight: 20 }}>{note.title}</div>
      {note.subtitle && <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.55, marginTop: 2 }}>{note.subtitle}</div>}
      {note.meta && <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, marginTop: 10, padding: "6px 8px", background: "#E8D88F88", borderRadius: 3 }}>{note.meta}</div>}
      <div style={{ fontSize: 13, lineHeight: 1.55, marginTop: 11, whiteSpace: "pre-wrap" }}>{note.description || "No description has been added yet."}</div>
    </div>
  );
}

function ActionsTab({ char, updateChar, onShowNote }) {
  const [draft, setDraft] = useState({ name: "", type: "Action", hit: "", damage: "", notes: "" });
  const actions = char.actions || [];
  function addAction() { if (!draft.name.trim()) return; updateChar({ ...char, actions: [...actions, { id: uid(), ...draft }] }); setDraft({ name: "", type: "Action", hit: "", damage: "", notes: "" }); }
  function removeAction(id) { updateChar({ ...char, actions: actions.filter((a) => a.id !== id) }); }
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <TextInput placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ flex: "1 1 120px" }} />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} style={{ ...inputBase, width: 100 }}>{["Melee", "Ranged", "Spell", "Action", "Bonus action", "Reaction"].map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <TextInput placeholder="Hit / DC" value={draft.hit} onChange={(e) => setDraft({ ...draft, hit: e.target.value })} style={{ width: 80 }} />
        <TextInput placeholder="Damage" value={draft.damage} onChange={(e) => setDraft({ ...draft, damage: e.target.value })} style={{ width: 90 }} />
        <TextInput placeholder="Description / notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={{ flex: "1 1 140px" }} />
        <button onClick={addAction} className="cm-btn" style={{ background: MOSS, color: "#FBF8EE", border: "none", borderRadius: 4, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Plus size={14} /> Add</button>
      </div>
      {actions.length === 0 ? <p style={{ fontSize: 13, color: INK, opacity: 0.55 }}>No actions logged yet. Add weapon attacks, spells, or special actions above.</p> : (
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: PAPER_DARK }}><th style={{ textAlign: "left", padding: "6px 8px", color: INK }}>Name</th><th style={{ textAlign: "left", padding: "6px 8px", color: INK }}>Type</th><th style={{ textAlign: "left", padding: "6px 8px", color: INK }}>Hit / DC</th><th style={{ textAlign: "left", padding: "6px 8px", color: INK }}>Damage</th><th style={{ textAlign: "left", padding: "6px 8px", color: INK }}>Notes</th><th></th></tr></thead>
          <tbody>{actions.map((a) => <tr key={a.id} style={{ borderTop: `1px solid ${BRASS}33` }}>
            <td style={{ padding: "6px 8px", fontWeight: 600, color: INK }}><button onClick={() => onShowNote({ title: a.name, subtitle: a.type, description: a.notes, meta: [a.hit && `Hit / DC ${a.hit}`, a.damage && `Damage ${a.damage}`].filter(Boolean).join(" · ") })} className="cm-btn cm-clickable" style={{ background: "none", border: "none", padding: 0, color: INK, fontWeight: 600, textAlign: "left", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>{a.name}</button></td>
            <td style={{ padding: "6px 8px", color: INK, opacity: 0.75 }}>{a.type}</td><td style={{ padding: "6px 8px", fontFamily: "IBM Plex Mono, monospace", color: INK }}>{a.hit}</td><td style={{ padding: "6px 8px", fontFamily: "IBM Plex Mono, monospace", color: INK }}>{a.damage}</td><td style={{ padding: "6px 8px", color: INK, opacity: 0.75 }}>{a.notes}</td>
            <td style={{ padding: "6px 8px" }}><button onClick={() => removeAction(a.id)} aria-label="Remove action" style={{ background: "none", border: "none", color: RED, opacity: 0.5, cursor: "pointer" }}><X size={13} /></button></td>
          </tr>)}</tbody></table></div>)}
    </div>
  );
}

function FeaturesTab({ char, updateChar, onShowNote }) {
  const classData = CLASS_DATA[char.className];
  const gained = classData ? classData.table.filter(([lvl]) => lvl <= char.level) : [];
  const classDescriptions = Object.fromEntries((classData?.features || []).map(([name, desc]) => [name, desc]));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><span style={{ fontSize: 11, color: INK, opacity: 0.6 }}>Hit die</span><select value={char.hitDie} onChange={(e) => updateChar({ ...char, hitDie: e.target.value })} style={{ ...inputBase, width: 70, cursor: "pointer" }}>{HIT_DICE.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
      {classData ? <div style={{ marginBottom: 18 }}><h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginBottom: 8 }}>{char.className} features gained so far</h4><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{gained.map(([lvl, features]) => features.length > 0 && <div key={lvl} style={{ display: "flex", gap: 8, fontSize: 12, color: INK }}><span style={{ fontFamily: "IBM Plex Mono, monospace", opacity: 0.6, minWidth: 20 }}>{lvl}</span><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{features.map((feature) => <button key={feature} onClick={() => onShowNote({ title: feature, subtitle: `${char.className} · Level ${lvl}`, description: classDescriptions[feature] || "No detailed description has been added for this feature yet." })} className="cm-btn cm-clickable" style={{ background: "none", border: `1px solid ${BRASS}55`, borderRadius: 4, padding: "3px 6px", color: INK, fontSize: 12, textAlign: "left" }}>{feature}</button>)}</div></div>)}</div></div> : <p style={{ fontSize: 13, color: INK, opacity: 0.55, marginBottom: 14 }}>Choose a class to see its features here.</p>}
      {RACE_DATA[char.race] && <div style={{ marginBottom: 18 }}><h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginBottom: 8 }}>{char.race} traits</h4><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{RACE_DATA[char.race].traits.map(([name, desc]) => <button key={name} onClick={() => onShowNote({ title: name, subtitle: `${char.race} trait`, description: desc })} className="cm-btn cm-clickable" style={{ border: "none", borderLeft: `2px solid ${BRASS}`, padding: "2px 0 2px 10px", background: "none", textAlign: "left" }}><div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{name}</div><div style={{ fontSize: 11, color: INK, opacity: 0.7, lineHeight: 1.4 }}>{desc}</div></button>)}</div></div>}
            {char.grantedFeatures?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 14, color: INK, marginBottom: 8 }}>Automatically granted to this character</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {char.grantedFeatures.filter((f) => f.level <= char.level).map((feature) => (
              <button key={feature.id} onClick={() => onShowNote({ title: feature.name, subtitle: `${feature.source} · Level ${feature.level}`, description: feature.description })} className="cm-btn cm-clickable" style={{ background: feature.kind === "choice" ? `${BRASS}22` : "none", border: `1px solid ${BRASS}55`, borderRadius: 4, padding: "4px 7px", color: INK, fontSize: 11, textAlign: "left" }}>
                {feature.name}{feature.kind === "choice" ? " · choose" : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {char.spellInfo && (
        <div style={{ marginBottom: 18, border: `1px solid ${BLUE}55`, borderRadius: 7, padding: "10px 12px", background: `${BLUE}0A` }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>Spellcasting progression</div>
          <div style={{ fontSize: 12, color: INK, opacity: 0.75 }}>
            {char.spellInfo.casterType} · {char.spellInfo.spellsKnownOrPrepared} spells known/prepared guideline · {char.spellInfo.spellcastingAbility}
          </div>
          {char.spells?.length > 0 && <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>{char.spells.map((spell) => <button key={spell.id} onClick={() => onShowNote({ title: spell.name, subtitle: `${spell.source} · ${spell.level}`, description: spell.description })} className="cm-btn" style={{ background: "none", border: `1px solid ${BLUE}55`, borderRadius: 4, padding: "3px 6px", color: INK, fontSize: 11 }}>{spell.name}</button>)}</div>}
          <div style={{ marginTop: 7, fontSize: 10, color: INK, opacity: 0.55 }}>Spells that require a player choice are intentionally not selected automatically.</div>
        </div>
      )}
<Field label="Additional features, spells & traits"><textarea value={char.spellNotes} onChange={(e) => updateChar({ ...char, spellNotes: e.target.value })} rows={7} placeholder="Known spells, spell slots, homebrew features…" style={{ ...inputBase, resize: "vertical", fontFamily: "Inter, sans-serif" }} /></Field>
    </div>
  );
}

function BackgroundTab({ char, onShowNote }) {
  const bg = BACKGROUND_DATA[char.background];
  if (!bg) return <p style={{ fontSize: 13, color: INK, opacity: 0.55 }}>Choose a background to see its details here.</p>;
  return <div><p style={{ fontSize: 13, color: INK, opacity: 0.75, marginBottom: 12, lineHeight: 1.5 }}>{bg.blurb}</p><StatRow label="Skill proficiencies" value={bg.skills} /><StatRow label="Other proficiencies" value={bg.proficiencies} /><StatRow label="Equipment" value={bg.equipment} /><h4 style={{ fontFamily: "Fraunces, serif", fontSize: 13, color: INK, marginTop: 14, marginBottom: 6 }}>Background feature</h4><button onClick={() => onShowNote({ title: bg.feature[0], subtitle: `${char.background} feature`, description: bg.feature[1] })} className="cm-btn cm-clickable" style={{ border: "none", borderLeft: `2px solid ${BRASS}`, padding: "2px 0 2px 10px", background: "none", textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{bg.feature[0]}</div><div style={{ fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.4 }}>{bg.feature[1]}</div></button></div>;
}

function InventoryTab({ char, updateChar, onShowNote }) {
  const [draftName, setDraftName] = useState(""); const [draftQty, setDraftQty] = useState(1); const [draftDescription, setDraftDescription] = useState("");
  function addItem() { if (!draftName.trim()) return; updateChar({ ...char, inventory: [...char.inventory, { id: uid(), name: draftName.trim(), qty: draftQty || 1, description: draftDescription.trim() }] }); setDraftName(""); setDraftQty(1); setDraftDescription(""); }
  function removeItem(id) { updateChar({ ...char, inventory: char.inventory.filter((i) => i.id !== id) }); }
  return <div><div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}><TextInput placeholder="Item name" value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} style={{ flex: "1 1 130px" }} /><input type="number" value={draftQty} min={1} onChange={(e) => setDraftQty(parseInt(e.target.value || "1", 10))} style={{ ...inputBase, width: 56, fontFamily: "IBM Plex Mono, monospace", textAlign: "center" }} /><TextInput placeholder="Description (optional)" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} style={{ flex: "1 1 180px" }} /><button onClick={addItem} className="cm-btn" style={{ background: MOSS, color: "#FBF8EE", border: "none", borderRadius: 4, padding: "0 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Plus size={14} /> Add</button></div>{char.inventory.length === 0 ? <p style={{ fontSize: 13, color: INK, opacity: 0.55 }}>No items carried yet.</p> : <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{char.inventory.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${BRASS}44` }}><button onClick={() => onShowNote({ title: item.name, subtitle: "Inventory item", description: item.description || "No description has been added for this item yet.", meta: `Quantity ×${item.qty}` })} className="cm-btn cm-clickable" style={{ background: "none", border: "none", padding: 0, color: INK, fontSize: 14, textAlign: "left", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>{item.name}</button><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: INK, opacity: 0.75 }}>×{item.qty}</span><button onClick={() => removeItem(item.id)} aria-label="Remove item" style={{ background: "none", border: "none", color: RED, opacity: 0.6, cursor: "pointer" }}><X size={14} /></button></div></div>)}</div>}</div>;
}
