// Complete play instructions, paraphrased from the linked Entomancer class.
// Unspecified timings/DCs remain explicit table rulings, as in the rules engine.
export const entomancerActionDetails={
 entomancy:[
  'Use an action to cast Animal Friendship without spending a spell slot or Population. Choose an insect you can see within 30 feet, with challenge rating 1/8 or lower. The insect must see and hear you; Animal Friendship has no effect on a creature with Intelligence 4 or higher.',
  'The insect makes a Wisdom save against your Constitution spell save DC. Failure charms it for 24 hours. Harming it, yourself or through a companion, ends the charm. Being charmed does not give you direct control of its actions.'
 ],
 pestilence:[
  'Spend 1 Population as a bonus action to send insects at one visible target within 30 feet. The target makes a Dexterity save against 8 + your proficiency bonus + your Wisdom modifier.',
  'On failure, roll 1d6 necrotic damage and blind the target until the end of the next round. A successful save prevents both damage and blindness. The Population is spent either way.'
 ],
 'bug-swarm':[
  'Spend 2 Population and use an action against one creature within 30 feet. It makes a Constitution save against 8 + your proficiency bonus + your Wisdom modifier.',
  'Roll 2d12 + your Wisdom modifier as necrotic damage. A failed save takes the full result; a successful save takes half, rounded down. The Population is spent on either outcome.',
  'Bug Swarm resolves immediately. It does not create a controlled creature or an ongoing swarm effect. The result below records this use; apply resistance, vulnerability and the final damage to the target at the table. Use Swarm Summon to create a creature instead.'
 ],
 summon:[
  'Spend 2 Population to create a Swarm of Insects in a space within 10 feet. The source does not specify the activation timing; use your table’s ruling. Set its name and maximum HP; the default SRD swarm has 22 HP.',
  'One bonus action can command all your summoned swarms. Without a command they attempt to carry out your wishes. Their attacks, HP and statistics appear under controlled creatures.',
  'A living swarm can return to you: recover 1 Population if its HP is below half maximum, or 2 otherwise. Returning removes that swarm. A dead or simply removed swarm gives no refund.'
 ],
 'bug-armor':[
  'As a bonus action or reaction, spend 3 Population to surround yourself with insects for 1 minute. Gain temporary HP equal to 5 × your Wisdom modifier. Temporary HP does not stack; confirm replacement if you already have some.',
  'When the minute ends, recover 3 Population if none of this armor’s temporary HP was lost, 1 if some remains after taking damage, or 0 if all was lost. The sheet tracks the temporary HP and applies the refund once when time advances or you rest.'
 ],
 infest:[
  'From level 5, when using your action for a melee attack, invest a positive whole number of Population to attempt an infestation. The target makes a Constitution save. The source leaves the DC unspecified; the sheet uses your saved table ruling. Constructs and elementals are immune.',
  'On failure, the target is infested for your Wisdom modifier in minutes. It has disadvantage on Constitution checks, Constitution saves and attack rolls. On success the infestation fails, but the invested Population is still spent.',
  'While an infested target is within 60 feet, use a bonus action to deal Xd8 necrotic damage, where X is the Population invested. This damage needs no additional Population or saving throw. Use the infestation damage control on that target and advance game time to track expiration.'
 ],
 'many-eyed':[
  'From level 7, Many-Eyed gives advantage on Perception and Insight and lets you sense the presence of hidden or invisible entities within 100 feet. Sensing presence alone does not reveal a precise location.',
  'Use an action and spend 1 Population to locate an entity you previously detected within that radius. Confirm the prior detection and enter its name and distance. Locating it does not itself remove invisibility or other conditions.'
 ],
 'psychic-save':[
  'From level 13, Hive Mind gives psychic resistance. When a psychic attack targets you and requires a save, use your reaction and spend 3 Population to gain advantage on that saving throw. Choose this when targeted.',
  'This control readies the advantage; roll the triggering saving throw using the sheet’s saving throw controls. It is consumed by that save rather than granting permanent advantage.'
 ],
 'end-condition':[
  'From level 13, spend 2 Population and use a bonus action to end one effect making you Charmed or Frightened. Select a condition that is currently recorded on your character. This does not require a saving throw and does not end unrelated conditions.'
 ],
 'hungry-mouths':[
  'From level 15, forage for a full hour in at least one environment matching your Adaptation. Send all remaining Population out to gather food and recruits. On return, recover twice the amount committed, up to your maximum; if you started at zero, recover 1 instead.',
  'You can use this once before a long rest in which the swarm feeds. Foraging can happen during a short rest, but its recovery and normal short-rest recovery are separate. Record the current environment under your swarm settings before using it.'
 ],
 'swarm-form':[
  'From level 17, use an action to transform yourself and your carried equipment into a swarm for 1 minute. Keep your statistics, ability scores and HP. Your AC becomes 10 + Dexterity modifier + Wisdom modifier, and you resist bludgeoning, piercing and slashing damage.',
  'Reaching 0 HP in this form kills you immediately. End it early with a bonus action, or advance game time until it expires. This transformation is available once per long rest; ending it early does not restore its use. It does not create a separate controlled creature.'
 ],
 invisible:[
  'At level 20, spend 3 Population and use an action to become invisible for Wisdom modifier + Constitution modifier minutes. This effect needs no concentration and remains when you attack or cast spells. Advance game time to track its duration.'
 ],
 'apex-attack':[
  'At level 20, while Swarm Form is active, use an action to attack a target in melee. Choose Strength or Dexterity: add that modifier, your Wisdom modifier and proficiency bonus to the attack roll.',
  'On a hit, deal damage equal to your current HP when the attack is made. Resolve hit or miss with the result controls. This special attack spends no Population and is available once per long rest; its daily use is spent on the attempt, including a miss.'
 ],
 'corpse-jacker':[
  'Decomposers gain this at level 6. Touch a fresh Medium humanoid corpse and use an action and 2 Population to animate a controlled zombie. At level 18 the cost becomes 1 Population and Large humanoid corpses are also eligible.',
  'You can control up to your Wisdom modifier in zombies, with a minimum of one. Each remains controlled for that many days, then dies. A corpse already used for Corpse Jacker cannot be used again. Your DM supplies zombie statistics; the sheet starts with SRD statistics and provides adjustments.'
 ],
 decompose:[
  'Decomposers gain this at level 10. Use an action to send all available Population to a visible corpse within 30 feet. Tiny corpses return it immediately with no gain; Small, Medium and Large corpses take 1, 2 and 4 turns respectively. Larger corpses are ineligible.',
  'While feeding, the committed Population is unavailable. When finished, it returns with additional Population equal to the turns spent feeding, capped at your maximum. The corpse’s flesh is consumed and it cannot be reused. Advance rounds to complete feeding.',
  'At level 18, Corpse Eater also heals you for your Constitution modifier + maximum Population when decomposition finishes, up to your maximum HP.'
 ],
 'dead-man':[
  'From level 14, a Decomposer reduced to 0 HP can spend 3 Population to remain at 1 HP, once per long rest. Use it at that trigger; it cannot revive an already dead character. Swarm Form’s immediate death takes precedence unless your saved table ruling permits this interaction.',
  'At this level you no longer need food yourself and evade life/undead detection. Your insects still need feeding for full long-rest Population recovery.'
 ],
 latch:[
  'Endo-Gotas can spend 1 Population after successfully grappling a living creature to attach their swarm. The swarm stays attached until the grapple ends. Constructs, undead, elementals and oozes are immune.',
  'At the start of your turn, Hemo Vamprisis deals Constitution modifier + proficiency bonus damage to the grappled target and heals you for the damage actually dealt. Enter that actual amount, then resolve the turn trigger. From level 10, the victim also has disadvantage on Strength and Dexterity checks.',
  'From level 14, Neuro Toxin adds a Constitution save against your saved table DC; failure paralyzes the victim. It repeats the save at the end of each of its turns. Hemo damage and healing also trigger at that turn end. From level 18, a frightened victim instead takes Constitution modifier + twice proficiency + Wisdom modifier damage.'
 ],
 'pure-terror':[
  'At level 18, while latched through Hemo Vamprisis, spend 1 Population to make your swarm visibly attach. Every non-friendly creature that can see you, including the grappled target, makes a Wisdom save against your saved table DC.',
  'Failure frightens that creature for 5 minutes. Pay only once for the activation, then resolve each additional target without another cost. Against a frightened grappled victim, Hemo damage becomes Constitution modifier + twice proficiency + Wisdom modifier.'
 ],
 strength:[
  'From level 6, an Exo-Gotas making a melee weapon attack can spend 2 Population for +2 to the next melee weapon attack roll and its damage. This readies the bonus; make the weapon attack from Actions & attacks to consume it.',
  'Monstrous Strength also grants Athletics proficiency, or expertise if already proficient, and doubles movement speed, jumping distance and carrying capacity. These passive benefits do not spend Population.'
 ],
 'reflex-armor':[
  'From level 14, an Exo-Gotas can use a reaction and spend 2 Population for +2 AC. The source does not give a duration; use the rounds specified in your saved table ruling (one round by default). Advance game time to expire it.',
  'Enhanced Exoskeleton also provides resistance to nonmagical slashing and adds your Constitution modifier to unarmed attack rolls. Those passive benefits do not spend Population.'
 ],
 invicta:[
  'At level 18, an Exo-Gotas can spend 4 Population for resistance to every damage type except types to which you are vulnerable, lasting 2 minutes. The source does not specify activation timing; follow your table’s ruling. Advance game time to expire the effect.',
  'Invicta Periplaneta also grants slashing and bludgeoning resistance and heavy armor proficiency. Add Constitution modifier to AC in armor; while unarmored, your Entomancer level is an alternative AC calculation.'
 ],
 harmonize:[
  'From level 6, an Orthoptera uses an action to begin singing with the swarm. Friendly creatures within 30 feet add your Wisdom modifier to saving throws. Before level 14, moving or taking another action ends the song.',
  'Damage requires a Constitution concentration check to continue singing, DC 10 or half the damage, whichever is higher. Resolve each pending check separately; failure or incapacity ends the song. At level 14, Walking Orchestra increases the radius to 60 feet and lets you move and take other actions while singing.'
 ],
 sonnet:[
  'From level 10, while Harmonize is active, each hostile creature starting its turn within song range makes a Wisdom save against your Constitution spell save DC. On failure it takes psychic damage equal to Wisdom modifier + Constitution modifier + proficiency bonus; on success it takes half, rounded down.',
  'Resolve this at each affected creature’s turn start, with no additional Population cost. Song range is 30 feet, increasing to 60 feet at level 14.'
 ],
 serenade:[
  'At level 18, while Harmonize is active, a friendly creature within its 60-foot range regains HP equal to your Wisdom modifier at the start of its turn. The ally must hear the song and already have at least 1 HP. This cannot revive an unconscious ally at 0 HP.',
  'This turn trigger spends no Population. The sheet records the healing on the named target; apply it to that ally’s sheet without exceeding its maximum HP.'
 ]
};
