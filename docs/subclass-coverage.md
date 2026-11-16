# 2014 subclass runtime coverage

This ledger covers 214 source records and 1142 feature milestones. Published, digital and Unearthed Arcana records retain separate identities.

The entries distinguish observed data and controls from source-specific effect behavior. Generic action observations cover only candidate availability, confirmed pool spending and separately offered dice. A dedicated panel can replace the generic control. A numeric route may require the stated state, equipment or timing.

Open sheet gaps are separate from table facts such as target position or an external saving throw. An unverified effect needs additional testing before it can be claimed. Resource capacities and rolls shown here are examples at the feature milestone; they can change with levels, choices or ability scores.

Rebuild with `node scripts/build_subclass_coverage.mjs`. Use `--check` to verify the checked-in ledger. The checked-in source-keyed evidence is the input to this report.

## Artificer — Alchemist

Entry level 3 · [Tasha's Cauldron of Everything; Eberron: Rising from the Last War](https://dnd5e.wikidot.com/artificer:alchemist)

Source spell progression · level 3 prepared: Healing Word, Ray of Sickness · level 5 prepared: Flaming Sphere, Melf's Acid Arrow · level 9 prepared: Gaseous Form, Mass Healing Word · level 13 prepared: Blight, Death Ward · level 17 prepared: Cloudkill, Raise Dead

### Level 3 · Tool Proficiency

Fixed tool and alternate artisan tool choice on existing duplicate training via expandedSubclassChoicePlan/reconciliation.

- Training grants · alchemist's supplies
- Table fact · Establish existing tool proficiency.

### Level 3 · Alchemist Spells

Owner Intelligence always-prepared spells at listed Artificer levels outside preparation quota.


### Level 3 · Experimental Elixir

SubclassTableTools purchases selected brews with a real standard/Pact slot or uses long-rest-scaled pool plus visible d6. Drinking consumes one persisted brew. Self healing, walking +10, AC +1, visible Boldness d4 attacks/saves and flight display have consumers. Long rest clears brews.

- Choice controls · paid-elixir-effect (activation)
- Counters · Experimental Elixir; 1 uses at probe level; long reset verified
- Table fact · Confirm tools/flask/rest or action and intended drinker. Other recipient effects use visible rolls.
- Open sheet gap · Alter Self mode is instruction only and its own Transformation timer is 3600 seconds instead of the printed 600. The self healing/temp formulas interpolate a literal plus and need low-Int bounds checked.

### Level 5 · Alchemical Savant

- Numeric effects awaiting verification · spell-roll-bonus (Spell cast with alchemist supplies focus; one healing or acid/fire/necrotic/poison damage roll.)
- Table fact · Confirm alchemist's supplies used as focus and eligible acid/fire/necrotic/poison or healing roll.
- Open sheet gap · No once-per-spell Intelligence (minimum +1) consumed by spell rolls or self healing.

### Level 9 · Restorative Reagents

Drinking a brew at Artificer 9+ adds a separate visible 2d6+Int result and grants self temporary HP. Separate Lesser Restoration generic spend.

- Counters · Restorative Reagents; 3 uses at probe level; long reset verified
- Generic action model · Restorative Reagents: spends 1 from expanded:2014:artificer:2014:subclass:artificer:alchemist:resource:lesser-restoration
- Numeric effects awaiting verification · temporary-hit-points (Whenever creature drinks your elixir.)
- Table fact · Confirm brew recipient/action and supplies focus.
- Open sheet gap · Lesser Restoration use does not cast or clear a qualifying self condition. Minimum 1 temp HP and signed modifier need checking at negative Intelligence.

### Level 15 · Chemical Mastery

Typed own incoming acid/poison resistance. Separate Greater Restoration and Heal spend.

- Counters · Chemical Mastery; 1 uses at probe level; long reset verified
- Generic action model · Chemical Mastery: spends 1 from expanded:2014:artificer:2014:subclass:artificer:alchemist:resource:greater-restoration · Chemical Mastery: spends 1 from expanded:2014:artificer:2014:subclass:artificer:alchemist:resource:heal
- Recognized numeric routes · resistance
- Numeric effects awaiting verification · condition-immunity
- Table fact · Supplies focus and external creature/conditions resolved at table.
- Open sheet gap · Poisoned condition immunity and dedicated free casting including self Heal/condition restoration lack consumers.

## Artificer — Armorer

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/artificer:armorer)

Source spell progression · level 3 prepared: Magic Missile, Thunderwave · level 5 prepared: Mirror Image, Shatter · level 9 prepared: Hypnotic Pattern, Lightning Bolt · level 13 prepared: Fire Shield, Greater Invisibility · level 17 prepared: Passwall, Wall of Force

### Level 3 · Tools of the Trade

Heavy armor and smith's tools training. Duplicate-tool choice uses source condition.

- Training grants · smith's tools · heavy armor
- Table fact · Establish existing tool proficiency.

### Level 3 · Armorer Spells

Owner Intelligence always-prepared record-specific spells at printed Artificer levels outside preparation quota.


### Level 3 · Arcane Armor

Equipment binding validates actual worn armor and confirms tools/model.

- Generic action model · Arcane Armor: source rules or unverified dedicated path (Smith's tools in hand; wearing armor)
- Table fact · Worn conversion and table positioning.
- Open sheet gap · Strength-requirement removal, cannot-remove and don/doff rules lack mechanical enforcement.

### Level 3 · Armor Model

Bound worn model gates real Guardian defensive-field temp HP patch and Infiltrator +5 walking speed. Dedicated modeled gauntlet/launcher attacks use owning Int with displayed damage.

- Choice controls · armor-model (rest)
- Counters · Armor Model; 2 uses at probe level; long reset verified
- Generic action model · Armor Model: separate roll 1d20+5, 1d8+3 (Guardian; empty gauntlet in published version) · Armor Model: separate roll 1d20+5, 1d6+3, 1d6 (Infiltrator) · Armor Model: spends 1 from expanded:2014:artificer:2014:subclass:artificer:armorer:resource:defensive-field; separate roll 3 (Guardian; armor worn)
- Numeric effects awaiting verification · walking-speed-bonus (Infiltrator)
- Table fact · Confirm thunder-gauntlet hit and affected target; qualifying first lightning hit and armor Stealth context.
- Open sheet gap · Verify one launcher rider per turn and armor Stealth advantage/disadvantage cancellation; separate generic roll buttons do not enforce them.

### Level 5 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action on own turn)

### Level 9 · Armor Modifications

- Numeric effects awaiting verification · infused-item-cap-bonus (Extra infusions restricted to armor components; source lists components.)
- Table fact · Select eligible infusion per armor piece.
- Open sheet gap · No armor-piece infusion or extra infused-item cap integration.

### Level 15 · Perfected Armor

Use tracking where present.

- Counters · Perfected Armor; 5 uses at probe level; long reset verified
- Generic action model · Perfected Armor: spends 1 from expanded:2014:artificer:2014:subclass:artificer:armorer:resource:guardian-pull (Guardian)
- Numeric effects awaiting verification · extra-damage (Infiltrator: next attack against glowing target, with advantage. UA attack must be by someone else. Published also gives target disadvantage against you.)
- Table fact · Guardian incoming movement trigger and Strength save; Infiltrator qualifying next attack against glimmering target.
- Open sheet gap · Generic action leaves own follow-up weapons and target-specific advantage unmodified.

## Artificer — Artillerist

Entry level 3 · [Tasha's Cauldron of Everything; Eberron: Rising from the Last War](https://dnd5e.wikidot.com/artificer:artillerist)

Source spell progression · level 3 prepared: Shield, Thunderwave · level 5 prepared: Scorching Ray, Shatter · level 9 prepared: Fireball, Wind Wall · level 13 prepared: Ice Storm, Wall of Fire · level 17 prepared: Cone of Cold, Wall of Force

### Level 3 · Tool Proficiency

Fixed tool and alternate artisan tool choice on existing duplicate training via expandedSubclassChoicePlan/reconciliation.

- Training grants · woodcarver's tools
- Table fact · Establish existing tool proficiency.

### Level 3 · Artillerist Spells

Owner Intelligence always-prepared spells at printed Artificer levels outside preparation quota.


### Level 3 · Eldritch Cannon

EldritchCannonTools creates independent typed objects with size/legs, free rest use or real slot cost as declared by runtime, own HP and hour expiry, own saves, confirmed Mending and independent dismissal. Force Ballista uses current owner attack pipeline; Protector own cannon gets rolled temp HP. Reviewed C2 check37 and browser-artillerist-creation/15th-level sheet.

- Choice controls · cannon-type (activation) · cannon-size (activation)
- Counters · Eldritch Cannon; 1 uses at probe level; long reset verified
- Table fact · Tools, external positions, targets and saves, command range, external Protector temp HP.

### Level 5 · Arcane Firearm

- Numeric effects awaiting verification · spell-damage-bonus (One damage roll of artificer spell cast through firearm.)
- Table fact · Confirm the actual firearm used as a focus on an Artificer spell.
- Open sheet gap · No inventory-marked firearm or once-per-spell d8 damage roll integration.

### Level 9 · Explosive Cannon

Actual C2 model/sheet confirms increased cannon damage dice and chosen-cannon detonation (consumes only that instance).

- Table fact · Confirm range and apply detonation Dexterity saves/external damage.

### Level 15 · Fortified Position

Own Artificer 15 allows two independently paid cannon instances and caps capacity on downgrade.

- Numeric effects awaiting verification · cover (You/allies within 10 ft cannon)
- Table fact · Creature locations relative to cannon.
- Open sheet gap · No own half-cover AC/Dex save integration from confirmed proximity.

## Artificer — Battle Smith

Entry level 3 · [Tasha's Cauldron of Everything; Eberron: Rising from the Last War](https://dnd5e.wikidot.com/artificer:battle-smith)

Source spell progression · level 3 prepared: Heroism, Shield · level 5 prepared: Branding Smite, Warding Bond · level 9 prepared: Aura of Vitality, Conjure Barrage · level 13 prepared: Aura of Purity, Fire Shield · level 17 prepared: Banishing Smite, Mass Cure Wounds

### Level 3 · Tool Proficiency

Fixed tool and alternate artisan tool choice on existing duplicate training via expandedSubclassChoicePlan/reconciliation.

- Training grants · smith's tools
- Table fact · Establish existing tool proficiency.

### Level 3 · Battle Smith Spells

Owner Intelligence always-prepared spells at printed Artificer levels outside preparation quota.


### Level 3 · Battle Ready

Martial training and actual selected/confirmed magical inventory weapon uses Int in weapon rolls.

- Training grants · martial
- Numeric effects awaiting verification · attack-ability (Magic weapons only, optional instead of STR/DEX)
- Table fact · Confirm magical status.

### Level 3 · Steel Defender

SteelDefenderTools has owner-level HP/Hit Dice and independent conditions and rolls. Confirmed command gates Rend/Repair, incapacitated owner allows independent action; Deflect reaction, Mending, independent Repair rest, actual-slot revival, owner-rest replacement and reload. C2 review check38; browser-artificer-creation and dedicated sheet.

- Table fact · Confirm tools, distances, revival timing, eligible heals and which external attack/creature/object is affected.

### Level 5 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action)

### Level 9 · Arcane Jolt

Generic costs are tracked.

- Counters · Arcane Jolt; 3 uses at probe level; long reset verified
- Generic action model · Arcane Jolt: spends 1 from expanded:2014:artificer:2014:subclass:artificer:battle-smith:resource:arcane-jolt (You hit with magic weapon or defender hits)
- Table fact · Confirm hitting with a magical weapon or defender Rend, choosing damage versus recipient heal within range.
- Open sheet gap · Missing triggered 2d6 (4d6 at 15), once-per-turn guard and caster self-healing.

### Level 15 · Improved Defender

Defender AC +2 at owning 15 and confirmed Deflect Attack reaction rolls/Int-based damage.

- Numeric effects awaiting verification · companion-ac-bonus (Steel Defender) · deflect-attack-damage (Defender uses Deflect Attack) · arcane-jolt-dice (Damage or healing; replaces2d6)
- Table fact · Resolve disadvantage and force damage on external attacker.
- Open sheet gap · Arcane Jolt 4d6 and heal lack integration.

## Artificer — Archivist (UA)

Entry level 3 · [Unearthed Arcana 58 - Artificer](https://dnd5e.wikidot.com/artificer:archivist-ua)

Source spell progression · level 3 prepared: Comprehend Languages, Dissonant Whispers · level 5 prepared: Detect Thoughts, Locate Object · level 9 prepared: Hypnotic Pattern, Tongues · level 13 prepared: Locate Creature, Phantasmal Killer · level 17 prepared: Legend Lore, Modify Memory

### Level 3 · Tools of the Trade

Source tool grants/conditional substitutes, as shown by reconciled training.

- Training grants · calligrapher's supplies · forgery kit
- Numeric effects awaiting verification · scroll-crafting
- Table fact · Evaluate scroll crafting time/cost and required tools at table.

### Level 3 · Archivist Spells

Owner Intelligence always-prepared spells at printed Artificer levels outside preparation quota.


### Level 3 · Artificial Mind

Intangible inventory-item/matter bond selects 2 adviser skills; carried bonus in actual skills/passive Perception. Manifestation, source-origin long-rest spend, confirming failed save plus real slot boost, psychic damage/DC plan, senses concentration replaces existing concentration and cleans up. C2 reviewed actual reload.

- Choice controls · mind-material (rest) · advisor-skills (rest)
- Counters · Artificial Mind; 3 uses at probe level; long reset verified
- Table fact · Confirm rest, correct item, placement/range, cast origin, external save/damage and boost.

### Level 5 · Mind Network

Actual psychic spell roll modifier for owning Artificer and Information Overload plan add Int.

- Numeric effects awaiting verification · psychic-damage-bonus (Artificer spell psychic roll or Information Overload) · telepathy (Artificial Mind item on person; two-way with bearers of your infusions)
- Table fact · Telepathy range, eligible item holders.

### Level 14 · Pure Information

Dedicated Infoportation trigger with free long-rest use or >=2 slot.

- Counters · Pure Information; 1 uses at probe level; long reset verified
- Table fact · Confirm carried mind item, infusion destination and adjacent space; stun/save recipient resolves at table.
- Open sheet gap · No triggered save/stun control for boosting Information Overload.

## Artificer — Armorer (UA)

Entry level 3 · [Unearthed Arcana 69 - Subclasses, Part 3](https://dnd5e.wikidot.com/artificer:armorer-ua)

Source spell progression · level 3 prepared: Magic Missile, Shield · level 5 prepared: Mirror Image, Shatter · level 9 prepared: Hypnotic Pattern, Lightning Bolt · level 13 prepared: Fire Shield, Greater Invisibility · level 17 prepared: Passwall, Wall of Force

### Level 3 · Tool Proficiency

Fixed tool and alternate artisan tool choice on existing duplicate training via expandedSubclassChoicePlan/reconciliation.

- Training grants · smith's tools · heavy armor
- Table fact · Establish existing tool proficiency.

### Level 3 · Armorer Spells

Owner Intelligence always-prepared record-specific spells at printed Artificer levels outside preparation quota.


### Level 3 · Power Armor

Actual heavy armor binding with tools confirm. Infiltrator speed and active armor model via equipment consumer.

- Generic action model · Power Armor: source rules or unverified dedicated path (Smith's tools in hand; wearing heavy armor)
- Table fact · Confirm eligible armor and source tool use.
- Open sheet gap · Strength/removal and armor transformation timing only rules.

### Level 3 · Armor Model

Bound worn model gates real Guardian defensive-field temp HP patch and Infiltrator +5 walking speed. Dedicated modeled gauntlet/launcher attacks use owning Int with displayed damage.

- Choice controls · armor-model (rest)
- Generic action model · Armor Model: separate roll 1d20+5, 1d8+3 (Guardian; empty gauntlet in published version) · Armor Model: separate roll 1d20+5, 1d6+3, 1d6 (Infiltrator) · Armor Model: separate roll 3 (Guardian; armor worn)
- Numeric effects awaiting verification · walking-speed-bonus (Infiltrator)
- Table fact · Confirm thunder-gauntlet hit and affected target; qualifying first lightning hit and armor Stealth context.
- Open sheet gap · Verify one launcher rider per turn and armor Stealth advantage/disadvantage cancellation; separate generic roll buttons do not enforce them.

### Level 5 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action on own turn)

### Level 9 · Armor Modifications

- Numeric effects awaiting verification · infused-item-cap-bonus (Extra infusions restricted to armor components; source lists components.)
- Table fact · Select eligible infusion per armor piece.
- Open sheet gap · No armor-piece infusion or extra infused-item cap integration.

### Level 15 · Perfected Armor

Use tracking where present.

- Counters · Perfected Armor; 3 uses at probe level; long reset verified
- Generic action model · Perfected Armor: spends 1 from expanded:2014:artificer:2014:subclass:artificer:armorer-ua:resource:guardian-pull (Guardian)
- Numeric effects awaiting verification · extra-damage (Infiltrator: next attack against glowing target, with advantage. UA attack must be by someone else. Published also gives target disadvantage against you.)
- Table fact · Guardian incoming movement trigger and Strength save; Infiltrator qualifying next attack against glimmering target.
- Open sheet gap · Generic action leaves own follow-up weapons and target-specific advantage unmodified.

## Bard — Creation

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/bard:creation)

### Level 3 · Mote of Potential

- Numeric effects awaiting verification · bardic-check-reroll (Recipient spends Bardic Inspiration on ability check; reroll die choose either) · bardic-attack-thunder (Target and chosen visible creatures within5ft target; CON save negates; after inspiration used on attack) · bardic-save-temporary-hp (After inspiration used on save)
- Table fact · Recipient chooses source outcome after spending inspiration on check/attack/save and resolves adjacent creature saves.
- Open sheet gap · No reroll, damage rider or temporary HP combined with own Bardic Inspiration.

### Level 3 · Performance of Creation

Source use tracker where available.

- Counters · Performance of Creation; 1 uses at probe level; long reset verified
- Generic action model · Performance of Creation: spends 1 from expanded:2014:bard:2014:subclass:bard:creation:resource:create-item
- Table fact · Confirm space, item type/size/value, musical note and source duration.
- Open sheet gap · No owned conjured inventory/expiration or alternate slots workflow.

### Level 6 · Animating Performance

DancingItemTools confirms actual or named external item, published/UA profiles, action Cost free or actual level 3+ slot, command, attacks/saves/HP/conditions and expiry. C2 5/5 plus actual mobile attack/injury/reload.

- Counters · Animating Performance; 1 uses at probe level; long reset verified
- Table fact · Confirm object, position/range, attack/friendly selection, initiative and potential Inspiring movement recipient.
- Open sheet gap · Conditional allied/enemy movement change remains table because positions not modeled.

### Level 14 · Creative Crescendo

- Numeric effects awaiting verification · created-item-count (Performance of Creation; only one item max size, others Small/Tiny) · creation-gp-limit (Removed at14)
- Table fact · Count simultaneous created items and confirm size/space at table.
- Open sheet gap · Creation inventory/slot and concurrent-cap handling are absent, including level-14 unlimited value.

## Bard — Eloquence

Entry level 3 · [Mythic Odysseys of Theros; Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/bard:eloquence)

### Level 3 · Silver Tongue

- Numeric effects awaiting verification · d20-floor (Persuasion and Deception)
- Open sheet gap · No actual Persuasion/Deception natural 1–9 becomes 10.

### Level 3 · Unsettling Words

Generic Inspiration spend.

- Generic action model · Unsettling Words: spends 1 from 2014:Bard:inspiration (Visible target within 60 ft; next save before start next turn)
- Table fact · Confirm visible target, roll inspiration and apply to its next save before next turn.
- Open sheet gap · Missing dedicated automatic inspiration die sizing/result persistence.

### Level 6 · Unfailing Inspiration

Dedicated generic use where routed.

- Numeric effects awaiting verification · preserve-bardic-die (Recipient attack/check/save fails after adding your die)
- Table fact · Recipient failed/successful ability roll and eligible additional recipient are table facts.
- Open sheet gap · No inspiration retention or propagation link to result/recipient.

### Level 6 · Universal Speech

Generic use spend.

- Counters · Universal Speech; 1 uses at probe level; long reset verified
- Generic action model · Universal Speech: spends 1 from expanded:2014:bard:2014:subclass:bard:eloquence:resource:universal-speech
- Table fact · Confirm creatures, language, range and when comprehension ends.
- Open sheet gap · Confirm source slot alternative separately.

### Level 14 · Infectious Inspiration

Dedicated generic use where routed.

- Counters · Infectious Inspiration; 3 uses at probe level; long reset verified
- Generic action model · Infectious Inspiration: spends 1 from expanded:2014:bard:2014:subclass:bard:eloquence:resource:infectious-inspiration
- Table fact · Recipient failed/successful ability roll and eligible additional recipient are table facts.
- Open sheet gap · No inspiration retention or propagation link to result/recipient.

## Bard — Glamour

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/bard:glamour)

### Level 3 · Mantle of Inspiration

Generic Inspiration spend.

- Generic action model · Mantle of Inspiration: spends 1 from 2014:Bard:inspiration (Max(1,cha) visible creatures within60 ft that see you)
- Table fact · Confirm chosen creatures in range and their voluntary reactions/movement.
- Open sheet gap · Click does not grant own eligible temporary HP derived from Bard level.

### Level 3 · Enthralling Performance

Generic long/short-rest use as routed.

- Counters · Enthralling Performance; 1 uses at probe level; short reset verified
- Generic action model · Enthralling Performance: spends 1 from expanded:2014:bard:2014:subclass:bard:glamour:resource:enthralling-performance
- Table fact · Confirm audience listened and see/can hear conditions, target count and saves.

### Level 6 · Mantle of Majesty

Generic per-rest spend.

- Counters · Mantle of Majesty; 1 uses at probe level; long reset verified
- Generic action model · Mantle of Majesty: spends 1 from expanded:2014:bard:2014:subclass:bard:glamour:resource:mantle-majesty
- Table fact · Confirm charming creature/attack target, save and timing, apply external choices/effects.
- Open sheet gap · No concentration/follow-up free Command for Mantle or attack-triggered state defense for Unbreakable.

### Level 14 · Unbreakable Majesty

Generic per-rest spend.

- Counters · Unbreakable Majesty; 1 uses at probe level; short reset verified
- Generic action model · Unbreakable Majesty: spends 1 from expanded:2014:bard:2014:subclass:bard:glamour:resource:unbreakable-majesty
- Table fact · Confirm charming creature/attack target, save and timing, apply external choices/effects.
- Open sheet gap · No concentration/follow-up free Command for Mantle or attack-triggered state defense for Unbreakable.

## Bard — Lore

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/bard:lore)

### Level 3 · Bonus Proficiencies

Reconciled 3 chosen skills; reviewed legacy Lore migration keeps choices source-owned.

- Choice controls · bonus-skills (advancement)

### Level 3 · Cutting Words

Generic Inspiration spend.

- Generic action model · Cutting Words: spends 1 from 2014:Bard:inspiration (Visible target within60 ft can hear and is not charm-immune; after roll before result/damage)
- Table fact · Confirm range, hearing, immunity and result to reduce.
- Open sheet gap · Die scaling/result integration with roll missing.

### Level 6 · Additional Magical Secrets

Spell choice filter enforces owner slot-level ceiling; known spell grants separate from quota.

- Choice controls · additional-magical-secrets (advancement)

### Level 14 · Peerless Skill

Generic Inspiration spend.

- Generic action model · Peerless Skill: spends 1 from 2014:Bard:inspiration
- Table fact · Confirm your eligible own ability check and before result is ruled.
- Open sheet gap · No applying scaled inspiration die to actual own check.

## Bard — Spirits

Entry level 3 · [Van Richten's Guide to Ravenloft](https://dnd5e.wikidot.com/bard:spirits)

Source spell progression · level 3 known: Guidance

### Level 3 · Guiding Whispers

Guidance bonus cantrip.

- Table fact · 60-ft range and target confirmation.

### Level 3 · Spiritual Focus

- Table fact · Confirm eligible focus held and focus used on Bard spell.
- Open sheet gap · No source d6 added to one eligible Bard damage/healing roll at 6.

### Level 3 · Tales from Beyond

Uses own Inspiration, level-scaled visible tale roll, stores a tale, bestows to confirmed Self/Other and reuses visible effects. On self tales 3/6 grant temp HP, 6 links AC+1/speed+10 to surviving Traveler temp HP, 11 heals and clears chosen allowed condition, 1/5/8 set duration. Signed Spirit Tale expressions normalize negative Cha.

- Dedicated plans · spirit-tales via applySubclassTable
- Table fact · Confirm range, eligible recipient, attacks, damage, saving throws and nonself conditions; apply movement and external effects using displayed result.
- Open sheet gap · Reference-only parts of own 1/5/8 should be checked against actual consumer effects.

### Level 6 · Spirit Session

Confirm ritual & focus; choose eligible divination/necromancy spell and participants 1–PB; temporary known slot access, start-long-rest expiration/use reset.

- Choice controls · session-spell (activation)
- Counters · Spirit Session; 1 uses at probe level; none reset
- Table fact · Confirm actual ritual participants, timing and focus.

### Level 14 · Mystical Connection

Higher-level tale die still scales.

- Numeric effects awaiting verification · tale-selection (When rolling Tales from Beyond; UA still uses BI die type for effect)
- Open sheet gap · Two-roll selection and duplicate-choice outcome do not flow through script's single-result table profile.

## Bard — Swords

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/bard:swords)

### Level 3 · Bonus Proficiencies

Source-reconciled medium armor and scimitar training.

- Training grants · medium · scimitar
- Table fact · Confirm melee weapon proficiency used as Bard focus.
- Open sheet gap · Spell tools do not enforce focus hand/equipment legality.

### Level 3 · Fighting Style

Dueling/Two-Weapon Fighting selection connects to weapon damage/off-hand roll, deduplicated with Fighter. Reviewed 5A actual whole sheet.

- Choice controls · fighting-style (advancement)
- Recognized numeric routes · dueling-damage-bonus (Dueling selected; melee weapon one hand,no other weapons) · offhand-ability-damage (Two-Weapon Fighting selected; second attack)
- Table fact · Confirm occupied hands/offhand eligibility.

### Level 3 · Blade Flourish

Generic Inspiration cost for recorded flourishes.

- Generic action model · Blade Flourish: spends 1 from 2014:Bard:inspiration (Weapon hit as part Attack on own turn; once per turn)
- Numeric effects awaiting verification · walking-speed-bonus (Take Attack action; until end turn)
- Table fact · Confirm own Attack action hit, eligible external damage targets and push/reaction position.
- Open sheet gap · Real walking-speed +10 in turn, Defensive Flourish AC and extra damage/die scaling, the no-cost d6 Master's version and once-per-turn enforcement lack a consumer.

### Level 6 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action)

### Level 14 · Master's Flourish

Generic Inspiration cost for recorded flourishes.

- Numeric effects awaiting verification · free-flourish-die (May replace normal BI expenditure for any flourish)
- Table fact · Confirm own Attack action hit, eligible external damage targets and push/reaction position.
- Open sheet gap · Real walking-speed +10 in turn, Defensive Flourish AC and extra damage/die scaling, the no-cost d6 Master's version and once-per-turn enforcement lack a consumer.

## Bard — Valor

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/bard:valor)

### Level 3 · Bonus Proficiencies

Source-reconciled medium armor, shield and martial weapon training.

- Training grants · medium · shields · martial

### Level 3 · Combat Inspiration

Source reference.

- Generic action model · Combat Inspiration: source rules or unverified dedicated path
- Table fact · Recipient chooses damage on its own hit or reactive AC and confirms attack outcome.

### Level 6 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action)

### Level 14 · Battle Magic

Source action guidance.

- Generic action model · Battle Magic: source rules or unverified dedicated path (Used action to cast bard spell)
- Table fact · Confirm Bard spell cast using action and available bonus action.
- Open sheet gap · No verified bonus weapon-attack callback.

## Bard — Whispers

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/bard:whispers)

### Level 3 · Psychic Blades

Generic Inspiration spend.

- Generic action model · Psychic Blades: spends 1 from 2014:Bard:inspiration (Weapon hit; once per round on own turn)
- Table fact · Confirm qualifying weapon hit on your turn and external damage.
- Open sheet gap · No level-scaled psychic rider roll or once-per-round enforcement.

### Level 3 · Words of Terror

Generic per-rest/discrete use where present.

- Counters · Words of Terror; 1 uses at probe level; short reset verified
- Generic action model · Words of Terror: spends 1 from expanded:2014:bard:2014:subclass:bard:whispers:resource:words-terror
- Table fact · Private conversation/time, qualifying humanoid death and persona, hearing, external saves/charm/fear or secret target resolutions.
- Open sheet gap · Own disguise state from Mantle is reference.

### Level 6 · Mantle of Whispers

Generic per-rest/discrete use where present.

- Counters · Mantle of Whispers; 1 uses at probe level; short reset verified
- Generic action model · Mantle of Whispers: spends 1 from expanded:2014:bard:2014:subclass:bard:whispers:resource:capture-shadow
- Table fact · Private conversation/time, qualifying humanoid death and persona, hearing, external saves/charm/fear or secret target resolutions.
- Open sheet gap · Own disguise state from Mantle is reference.

### Level 14 · Shadow Lore

Generic per-rest/discrete use where present.

- Counters · Shadow Lore; 1 uses at probe level; long reset verified
- Generic action model · Shadow Lore: spends 1 from expanded:2014:bard:2014:subclass:bard:whispers:resource:shadow-lore
- Table fact · Private conversation/time, qualifying humanoid death and persona, hearing, external saves/charm/fear or secret target resolutions.
- Open sheet gap · Own disguise state from Mantle is reference.

## Bard — Mage of Lorehold (UA)

Entry level 3 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/bard:mage-of-lorehold-ua)

Source spell progression · level 3 known: Sacred Flame, Comprehend Languages, Knock, Locate Object · level 5 known: Speak with Dead, Spirit Guardians · level 7 known: Arcane Eye, Stone Shape · level 9 known: Destructive Wave, Legend Lore

### Level 3 · Lorehold Spells

Source-known grants outside quota, clipped by owning class unlocks and source conditions recorded per spell.


### Level 3 · Ancient Companion

One source-owned ancient bond globally across classes. Dedicated Healer/Sage/Warrior profile, actual owner rolls for eligible callbacks, companion conditions/HP/command/slot heal/replacement/reload/source cleanup. C2 25/25 and actual Bard-to-Wizard replacement.

- Choice controls · companion-type (rest)
- Table fact · Confirm statue/source and external targets, range, commands or rest.

### Level 6 · Lessons of the Past

Selected owner feature plus actual bond type gates Healer signed owner-level max/current HP and eligible self spell d8, Sage skill advantage/verified once-turn damage and Warrior cantrip-to-weapon/use hit rider.

- Numeric effects awaiting verification · max-hit-points-bonus (Selected feature, Healer companion; gain same HP on bonding) · healing-received-bonus (Selected feature, Healer; regain HP from spell) · skill-advantage (Selected feature, Sage) · spell-extra-damage (Selected feature,Sage,once per turn spell>=1 damages creature)
- Table fact · Confirm eligible healing target/spell damage/weapon hit and creature context.

### Level 10 · War Echoes

Dedicated owner DC/cost/once-turn and typed own vulnerability until end-next-turn only on confirmed failed save.

- Table fact · Confirm visible trigger and target save; apply external vulnerability.

### Level 14 · History’s Whims

One-minute selected-different-each-turn state, use or actual 4+ slot; Swiftness +15, contextual Luck d6 on actual damage-related own save, Resistance typed B/P/S.

- Choice controls · chronal-benefit (activation)
- Counters · History’s Whims; 1 uses at probe level; long reset verified
- Table fact · Confirm damage context and opportunity-attack exception.

## Bard — Mage of Silverquill (UA)

Entry level 3 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/bard:mage-of-silverquill-ua)

### Level 3 · Eloquent Apprentice

Two of five skill proficiencies; either Sacred Flame or Vicious Mockery bonus cantrip as available under source.

- Choice controls · cantrip (advancement) · skills (advancement)

### Level 3 · Silvery Barbs

Generic use.

- Counters · Silvery Barbs; 1 uses at probe level; long reset verified
- Generic action model · Silvery Barbs: spends 1 from expanded:2014:bard:2014:subclass:bard:mage-of-silverquill-ua:resource:silvery-barbs
- Table fact · Confirm visible target's success and reroll, eligible second recipient advantage.
- Open sheet gap · Slot alternative/actual owned self recipient advantage require dedicated consumer.

### Level 6 · Inky Shroud

Owner flexible feature grants Darkness; dedicated free cast/default generic spell effect with actual pool.

- Counters · Inky Shroud; 1 uses at probe level; long reset verified
- Generic action model · Inky Shroud: spends 1 from expanded:2014:bard:2014:subclass:bard:mage-of-silverquill-ua:resource:inky-shroud
- Numeric effects awaiting verification · start-turn-damage (Selected feature; visible creature starts in feature free-cast Darkness)
- Table fact · Confirm targets/position.
- Open sheet gap · Verify casting uses owning Bard/Warlock Cha rather than default Int for Bard; seeing through created darkness is reference.

### Level 10 · Infusion of Eloquence

Later feature choice saved.

- Table fact · Confirm eligible damage or damage reduction and external target vulnerability/resistance.
- Open sheet gap · No actual infuse-spell damage conversion/bonus or Word of Power own resistance.

### Level 14 · Word of Power

Later feature choice saved.

- Generic action model · Word of Power: source rules or unverified dedicated path (Selected feature; visible creature within60 ft takes damage)
- Table fact · Confirm eligible damage or damage reduction and external target vulnerability/resistance.
- Open sheet gap · No actual infuse-spell damage conversion/bonus or Word of Power own resistance.

## Bard — Creation (UA)

Entry level 3 · [Unearthed Arcana 68 - Subclasses, Part 2](https://dnd5e.wikidot.com/bard:creation-ua)

### Level 3 · Note of Potential

- Numeric effects awaiting verification · bardic-check-reroll (Recipient spends Bardic Inspiration on ability check; reroll die choose either) · bardic-attack-thunder (Every other creature within5ft recipient; CON save negates; after inspiration used on attack) · bardic-save-temporary-hp (After inspiration used on save; only if no existing temporaryHP)
- Table fact · Confirm inspiration recipient and check/attack/save context.
- Open sheet gap · No check reroll, attack damage, or temporary HP integration.

### Level 6 · Animating Performance

DancingItemTools confirms actual or named external item, published/UA profiles, action Cost free or actual level 3+ slot, command, attacks/saves/HP/conditions and expiry. C2 5/5 plus actual mobile attack/injury/reload.

- Counters · Animating Performance; 1 uses at probe level; long reset verified
- Table fact · Confirm object, position/range, attack/friendly selection, initiative and potential Inspiring movement recipient.
- Open sheet gap · Conditional allied/enemy movement change remains table because positions not modeled.

### Level 14 · Performance of Creation

Source use tracker where available.

- Counters · Performance of Creation; 1 uses at probe level; long reset verified
- Generic action model · Performance of Creation: spends 1 from expanded:2014:bard:2014:subclass:bard:creation-ua:resource:create-item
- Table fact · Confirm space, item type/size/value, musical note and source duration.
- Open sheet gap · No owned conjured inventory/expiration or alternate slots workflow.

## Bard — Spirits (UA)

Entry level 3 · [Unearthed Arcana 74 - Subclasses, Part 4](https://dnd5e.wikidot.com/bard:spirits-ua)

Source spell progression · level 3 known: Guidance

### Level 3 · Guiding Whispers

Guidance bonus cantrip.

- Table fact · 60-ft range and target confirmation.

### Level 3 · Spiritual Focus

- Table fact · Confirm eligible focus held and focus used on Bard spell.
- Open sheet gap · No source d6 added to one eligible Bard damage/healing roll at 6.

### Level 3 · Tales from Beyond

Uses own Inspiration, level-scaled visible tale roll, stores a tale, bestows to confirmed Self/Other and reuses visible effects. On self tales 3/6 grant temp HP, 6 links AC+1/speed+10 to surviving Traveler temp HP, 11 heals and clears chosen allowed condition, 1/5/8 set duration. Signed Spirit Tale expressions normalize negative Cha.

- Dedicated plans · spirit-tales via applySubclassTable
- Table fact · Confirm range, eligible recipient, attacks, damage, saving throws and nonself conditions; apply movement and external effects using displayed result.
- Open sheet gap · Reference-only parts of own 1/5/8 should be checked against actual consumer effects.

### Level 6 · Spirit Session

Confirm ritual & focus; choose eligible divination/necromancy spell and participants 1–PB; temporary known slot access, start-long-rest expiration/use reset.

- Choice controls · session-spell (activation)
- Counters · Spirit Session; 1 uses at probe level; none reset
- Table fact · Confirm actual ritual participants, timing and focus.

### Level 14 · Mystical Connection

Higher-level tale die still scales.

- Numeric effects awaiting verification · tale-selection (When rolling Tales from Beyond; UA still uses BI die type for effect)
- Open sheet gap · Two-roll selection and duplicate-choice outcome do not flow through script's single-result table profile.

## Bard — Satire (UA)

Entry level 3 · [Unearthed Arcana 12 - Kits of Old](https://dnd5e.wikidot.com/bard:satire-ua)

### Level 3 · Bonus Proficiencies

Source-reconciled thieves' tools, Sleight of Hand and selectable skill.

- Choice controls · bonus-skills (advancement)
- Training grants · thieves' tools · Sleight of Hand

### Level 3 · Tumbling Fool

Generic control/instructions.

- Generic action model · Tumbling Fool: source rules or unverified dedicated path
- Table fact · Confirm position, route and falling.
- Open sheet gap · No persistent speed/movement or typed fall-resistance handler.

### Level 6 · Fool's Insight

Generic resource use when routed.

- Counters · Fool's Insight; 3 uses at probe level; long reset verified
- Generic action model · Fool's Insight: spends 1 from expanded:2014:bard:2014:subclass:bard:satire-ua:resource:detect-thoughts
- Table fact · Confirm target and applicable failed roll/save.
- Open sheet gap · No dedicated Detect Thoughts use/cast or actual own Inspiration die addition.

### Level 14 · Fool's Luck

Generic resource use when routed.

- Generic action model · Fool's Luck: spends 1 from 2014:Bard:inspiration
- Table fact · Confirm target and applicable failed roll/save.
- Open sheet gap · No dedicated Detect Thoughts use/cast or actual own Inspiration die addition.

## Cleric — Arcana

Entry level 1 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/cleric:arcana)

Source spell progression · level 1 prepared: Detect Magic, Magic Missile · level 3 prepared: Magic Weapon, Nystul's Magic Aura · level 5 prepared: Dispel Magic, Magic Circle · level 7 prepared: Arcane Eye, Leomund's Secret Chest · level 9 prepared: Planar Binding, Teleportation Circle

### Level 1 · Arcane Initiate

- Choice controls · Arcane Initiate (advancement)
- Training grants · Arcana
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Arcane Abjuration

- Generic action model · Channel Divinity: Arcane Abjuration: spends 1 from 2014:channel-divinity
- Numeric effects awaiting verification · banish-max-cr (Target fails save and not native plane;banish1m no concentration)
- Remaining source effects need verification.

### Level 6 · Spell Breaker

- Numeric effects awaiting verification · end-spell (Restore HP to ally with spell>=1;end one spell on ally)
- Open sheet gap · Healing cast does not remove an eligible tracked spell at or below the casting slot level.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Arcane Mastery

- Choice controls · Arcane Mastery (advancement)
- Remaining source effects need verification.

## Cleric — Death

Entry level 1 · [Dungeon Master's Guide](https://dnd5e.wikidot.com/cleric:death)

Source spell progression · level 1 prepared: False Life, Ray of Sickness · level 3 prepared: Blindness/Deafness, Ray of Enfeeblement · level 5 prepared: Animate Dead, Vampiric Touch · level 7 prepared: Blight, Death Ward · level 9 prepared: Antilife Shell, Cloudkill

### Level 1 · Bonus Proficiency

- Training grants · martial
- Remaining source effects need verification.

### Level 1 · Reaper

- Choice controls · Reaper (advancement)
- Numeric effects awaiting verification · necromancy-cantrip-targets (Normally single creature;both in range and within5ft each other)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Touch of Death

- Generic action model · Channel Divinity: Touch of Death: spends 1 from 2014:channel-divinity; separate roll 9
- Numeric effects awaiting verification · extra-damage (Melee attack hit; necrotic; spend CD)
- Remaining source effects need verification.

### Level 6 · Inescapable Destruction

- Numeric effects awaiting verification · ignore-resistance (Cleric spells and Channel Divinity)
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Improved Reaper

- Numeric effects awaiting verification · necromancy-spell-targets (Spell level1..5 normally one creature;both in range and within5ft;consumed materials for each)
- Remaining source effects need verification.

## Cleric — Forge

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/cleric:forge)

Source spell progression · level 1 prepared: Identify, Searing Smite · level 3 prepared: Heat Metal, Magic Weapon · level 5 prepared: Elemental Weapon, Protection from Energy · level 7 prepared: Fabricate, Wall of Fire · level 9 prepared: Animate Objects, Creation

### Level 1 · Bonus Proficiencies

- Training grants · heavy · smith's tools
- Remaining source effects need verification.

### Level 1 · Blessing of the Forge

Forge tools bind one owned armor or weapon to a persistent +1 AC or attack/damage bonus, cleared by long rest/death/source loss.

- Counters · expanded:2014:cleric:2014:subclass:cleric:forge:resource:forge-blessing; 1 uses at probe level; long reset verified
- Generic action model · Blessing of the Forge: spends 1 from expanded:2014:cleric:2014:subclass:cleric:forge:resource:forge-blessing
- Table fact · Confirm touch and timing at the end of a long rest; resolve another creature’s item separately.
- Verification · subclass-forge; browser-subclass-forge

### Level 2 · Channel Divinity: Artisan's Blessing

- Generic action model · Channel Divinity: Artisan's Blessing: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Soul of the Forge

- Recognized numeric routes · armor-class-bonus (Wearing heavy armor) · resistance
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Saint of Forge and Fire

Fire immunity and resistance to physical damage from confirmed nonmagical attacks while wearing heavy armor, including inherited Theurgy.

- Recognized numeric routes · fire immunity · conditional physical resistance: nonmagical attack, heavy armor
- Table fact · Confirm attack and magic status; damage on ward-specific controls needs manual adjustment.
- Verification · subclass-passive-defenses; browser-subclass-passive-defenses

## Cleric — Grave

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/cleric:grave)

Source spell progression · level 1 known: Spare the Dying · level 1 prepared: Bane, False Life · level 3 prepared: Gentle Repose, Ray of Enfeeblement · level 5 prepared: Revivify, Vampiric Touch · level 7 prepared: Blight, Death Ward · level 9 prepared: Antilife Shell, Raise Dead

### Level 1 · Circle of Mortality

- Numeric effects awaiting verification · healing-dice (Healing spell targets creature at0HP)
- Remaining source effects need verification.

### Level 1 · Eyes of the Grave

- Counters · expanded:2014:cleric:2014:subclass:cleric:grave:resource:eyes-grave; 3 uses at probe level; long reset verified
- Generic action model · Eyes of the Grave: spends 1 from expanded:2014:cleric:2014:subclass:cleric:grave:resource:eyes-grave
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Path to the Grave

- Generic action model · Channel Divinity: Path to the Grave: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Sentinel at Death's Door

- Counters · expanded:2014:cleric:2014:subclass:cleric:grave:resource:sentinel; 3 uses at probe level; long reset verified
- Generic action model · Sentinel at Death's Door: spends 1 from expanded:2014:cleric:2014:subclass:cleric:grave:resource:sentinel
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Keeper of Souls

- Generic action model · Keeper of Souls: source rules or unverified dedicated path (Not incapacitated; visible enemy dies within30 ft)
- Remaining source effects need verification.

## Cleric — Knowledge

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:knowledge)

Source spell progression · level 1 prepared: Command, Identify · level 3 prepared: Augury, Suggestion · level 5 prepared: Nondetection, Speak with Dead · level 7 prepared: Arcane Eye, Confusion · level 9 prepared: Legend Lore, Scrying

### Level 1 · Blessings of Knowledge

- Choice controls · Blessings of Knowledge (advancement)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Knowledge of the Ages

- Choice controls · Channel Divinity: Knowledge of the Ages (activation)
- Generic action model · Channel Divinity: Knowledge of the Ages: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Channel Divinity: Read Thoughts

- Generic action model · Channel Divinity: Read Thoughts: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Visions of the Past

- Counters · expanded:2014:cleric:2014:subclass:cleric:knowledge:resource:visions-past; 1 uses at probe level; short reset verified
- Generic action model · Visions of the Past: spends 1 from expanded:2014:cleric:2014:subclass:cleric:knowledge:resource:visions-past
- Remaining source effects need verification.

## Cleric — Life

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:life)

Source spell progression · level 1 prepared: Bless, Cure Wounds · level 3 prepared: Lesser Restoration, Spiritual Weapon · level 5 prepared: Beacon of Hope, Revivify · level 7 prepared: Death Ward, Guardian of Faith · level 9 prepared: Mass Cure Wounds, Raise Dead

### Level 1 · Bonus Proficiency

- Training grants · heavy
- Remaining source effects need verification.

### Level 1 · Disciple of Life

- Numeric effects awaiting verification · healing-bonus (Spell >=1 restoring HP)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Preserve Life

- Generic action model · Channel Divinity: Preserve Life: spends 1 from 2014:channel-divinity; separate roll 10
- Numeric effects awaiting verification · healing-pool (Divide among chosen within30 ft; max half target maxHP; excludes undead/constructs)
- Remaining source effects need verification.

### Level 6 · Blessed Healer

- Numeric effects awaiting verification · self-healing (Spell >=1 restores HP to another)
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Supreme Healing

- Numeric effects awaiting verification · healing-dice (Spell healing dice)
- Remaining source effects need verification.

## Cleric — Light

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:light)

Source spell progression · level 1 known: Light · level 1 prepared: Burning Hands, Faerie Fire · level 3 prepared: Flaming Sphere, Scorching Ray · level 5 prepared: Daylight, Fireball · level 7 prepared: Guardian of Faith, Wall of Fire · level 9 prepared: Flame Strike, Scrying

### Level 1 · Bonus Cantrip

- Spell grants · Light
- Remaining source effects need verification.

### Level 1 · Warding Flare

- Counters · expanded:2014:cleric:2014:subclass:cleric:light:resource:warding-flare; 3 uses at probe level; long reset verified
- Generic action model · Warding Flare: spends 1 from expanded:2014:cleric:2014:subclass:cleric:light:resource:warding-flare
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Radiance of the Dawn

- Generic action model · Channel Divinity: Radiance of the Dawn: spends 1 from 2014:channel-divinity; separate roll 2d10+2
- Numeric effects awaiting verification · damage (Hostiles30 ft; CON save half; total cover excludes; dispel magical darkness30 ft)
- Remaining source effects need verification.

### Level 6 · Improved Flare

- Numeric effects awaiting verification · warding-flare-protect-others (Visible attacker30ft attacks creature other than you)
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Corona of Light

- Generic action model · Corona of Light: source rules or unverified dedicated path
- Remaining source effects need verification.

## Cleric — Nature

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:nature)

Source spell progression · level 1 prepared: Animal Friendship, Speak with Animals · level 3 prepared: Barkskin, Spike Growth · level 5 prepared: Plant Growth, Wind Wall · level 7 prepared: Dominate Beast, Grasping Vine · level 9 prepared: Insect Plague, Tree Stride

### Level 1 · Acolyte of Nature

- Choice controls · Acolyte of Nature (advancement)
- Remaining source effects need verification.

### Level 1 · Bonus Proficiency

- Training grants · heavy
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Charm Animals and Plants

- Generic action model · Channel Divinity: Charm Animals and Plants: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Dampen Elements

The incoming damage control can apply the confirmed reaction once to own acid, cold, fire, lightning or thunder damage, including inherited Theurgy; the checkbox resets after use.

- Generic action model · Dampen Elements: source rules or unverified dedicated path (You/creature within30 ft takes acid/cold/fire/lightning/thunder)
- Table fact · Confirm reaction availability and range; apply resistance for another creature at the table. Ward and Bastion damage controls do not yet offer this reaction.
- Verification · subclass-passive-defenses; browser-subclass-passive-defenses

### Level 8 · Divine Strike

- Choice controls · Divine Strike (activation)
- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Master of Nature

- Generic action model · Master of Nature: source rules or unverified dedicated path (Targets charmed by Charm Animals and Plants)
- Remaining source effects need verification.

## Cleric — Order

Entry level 1 · [Guildmaster's Guide to Ravnica; Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/cleric:order)

Source spell progression · level 1 prepared: Command, Heroism · level 3 prepared: Hold Person, Zone of Truth · level 5 prepared: Mass Healing Word, Slow · level 7 prepared: Compulsion, Locate Creature · level 9 prepared: Commune, Dominate Person

### Level 1 · Bonus Proficiencies

- Choice controls · Bonus Proficiencies (advancement)
- Training grants · heavy
- Remaining source effects need verification.

### Level 1 · Voice of Authority

- Generic action model · Voice of Authority: source rules or unverified dedicated path (Slot>=1 spell targets ally)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Order's Demand

- Generic action model · Channel Divinity: Order's Demand: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Embodiment of the Law

- Counters · expanded:2014:cleric:2014:subclass:cleric:order:resource:embodiment-law; 3 uses at probe level; long reset verified
- Generic action model · Embodiment of the Law: spends 1 from expanded:2014:cleric:2014:subclass:cleric:order:resource:embodiment-law
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Order's Wrath

- Generic action model · Order's Wrath: separate roll 2d8
- Remaining source effects need verification.

## Cleric — Peace

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/cleric:peace)

Source spell progression · level 1 prepared: Heroism, Sanctuary · level 3 prepared: Aid, Warding Bond · level 5 prepared: Beacon of Hope, Sending · level 7 prepared: Aura of Purity, Otiluke's Resilient Sphere · level 9 prepared: Greater Restoration, Rary's Telepathic Bond

### Level 1 · Implement of Peace

- Choice controls · Implement of Peace (advancement)
- Remaining source effects need verification.

### Level 1 · Emboldening Bond

- Counters · expanded:2014:cleric:2014:subclass:cleric:peace:resource:emboldening-bond; 2 uses at probe level; long reset verified
- Generic action model · Emboldening Bond: spends 1 from expanded:2014:cleric:2014:subclass:cleric:peace:resource:emboldening-bond
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Balm of Peace

- Generic action model · Channel Divinity: Balm of Peace: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Protective Bond

- Generic action model · Protective Bond: source rules or unverified dedicated path (Two bonded creatures within30 (60 at17), one about to take damage)
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Expansive Bond

- Numeric effects awaiting verification · bond-distance (Emboldening/Protective Bond) · resistance (Protective Bond recipient)
- Remaining source effects need verification.

## Cleric — Tempest

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:tempest)

Source spell progression · level 1 prepared: Fog Cloud, Thunderwave · level 3 prepared: Gust of Wind, Shatter · level 5 prepared: Call Lightning, Sleet Storm · level 7 prepared: Control Water, Ice Storm · level 9 prepared: Destructive Wave, Insect Plague

### Level 1 · Bonus Proficiencies

- Training grants · heavy · martial
- Remaining source effects need verification.

### Level 1 · Wrath of the Storm

- Choice controls · Wrath of the Storm (activation)
- Counters · expanded:2014:cleric:2014:subclass:cleric:tempest:resource:wrath-storm; 3 uses at probe level; long reset verified
- Generic action model · Wrath of the Storm: spends 1 from expanded:2014:cleric:2014:subclass:cleric:tempest:resource:wrath-storm; separate roll 2d8
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Destructive Wrath

- Generic action model · Channel Divinity: Destructive Wrath: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Thunderous Strike

- Numeric effects awaiting verification · push-distance (Lightning damage dealt to Large or smaller creature)
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Stormborn

- Numeric effects awaiting verification · flying-speed (Not underground or indoors)
- Remaining source effects need verification.

## Cleric — Trickery

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:trickery)

Source spell progression · level 1 prepared: Charm Person, Disguise Self · level 3 prepared: Mirror Image, Pass without Trace · level 5 prepared: Blink, Dispel Magic · level 7 prepared: Dimension Door, Polymorph · level 9 prepared: Dominate Person, Modify Memory

### Level 1 · Blessing of the Trickster

- Generic action model · Blessing of the Trickster: source rules or unverified dedicated path
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Invoke Duplicity

Channel spend, source-owned concentrated duplicate, duration and source cleanup. Movement is contingent on the state.

- Generic action model · Channel Divinity: Invoke Duplicity: spends 1 from 2014:channel-divinity
- Table fact · Confirm unoccupied space, distance, line of sight, movement and attack targets.
- Verification · subclass-theurgy-inheritance; browser-subclass-duplicity

### Level 6 · Channel Divinity: Cloak of Shadows

- Generic action model · Channel Divinity: Cloak of Shadows: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Improved Duplicity

- Numeric effects awaiting verification · duplicate-count (Invoke Duplicity;move any number30ft sameBA,range120)
- Remaining source effects need verification.

## Cleric — Twilight

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/cleric:twilight)

Source spell progression · level 1 prepared: Faerie Fire, Sleep · level 3 prepared: Moonbeam, See Invisibility · level 5 prepared: Aura of Vitality, Leomund's Tiny Hut · level 7 prepared: Aura of Life, Greater Invisibility · level 9 prepared: Circle of Power, Mislead

### Level 1 · Bonus Proficiencies

- Training grants · heavy · martial
- Remaining source effects need verification.

### Level 1 · Eyes of Night

- Counters · expanded:2014:cleric:2014:subclass:cleric:twilight:resource:share-night; 1 uses at probe level; long reset verified
- Generic action model · Eyes of Night: spends 1 from expanded:2014:cleric:2014:subclass:cleric:twilight:resource:share-night
- Numeric effects awaiting verification · darkvision
- Remaining source effects need verification.

### Level 1 · Vigilant Blessing

- Generic action model · Vigilant Blessing: source rules or unverified dedicated path
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Twilight Sanctuary

- Generic action model · Channel Divinity: Twilight Sanctuary: spends 1 from 2014:channel-divinity; separate roll 1d6+2
- Numeric effects awaiting verification · temporary-hit-points (End turn in30-ft dim sphere1m; can instead end charm/fear effect)
- Remaining source effects need verification.

### Level 6 · Steps of Night

- Counters · expanded:2014:cleric:2014:subclass:cleric:twilight:resource:steps-night; 3 uses at probe level; long reset verified
- Generic action model · Steps of Night: spends 1 from expanded:2014:cleric:2014:subclass:cleric:twilight:resource:steps-night
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Twilight Shroud

- Numeric effects awaiting verification · cover (You/allies in Twilight Sanctuary)
- Remaining source effects need verification.

## Cleric — War

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/cleric:war)

Source spell progression · level 1 prepared: Divine Favor, Shield of Faith · level 3 prepared: Magic Weapon, Spiritual Weapon · level 5 prepared: Crusader's Mantle, Spirit Guardians · level 7 prepared: Freedom of Movement, Stoneskin · level 9 prepared: Flame Strike, Hold Monster

### Level 1 · Bonus Proficiency

- Training grants · heavy · martial
- Remaining source effects need verification.

### Level 1 · War Priest

- Counters · expanded:2014:cleric:2014:subclass:cleric:war:resource:war-priest; 3 uses at probe level; long reset verified
- Generic action model · War Priest: spends 1 from expanded:2014:cleric:2014:subclass:cleric:war:resource:war-priest
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Guided Strike

- Generic action model · Channel Divinity: Guided Strike: spends 1 from 2014:channel-divinity; separate roll 10
- Remaining source effects need verification.

### Level 6 · Channel Divinity: War God's Blessing

- Generic action model · Channel Divinity: War God's Blessing: spends 1 from 2014:channel-divinity; separate roll 10
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Avatar of Battle

Confirmed nonmagical bludgeoning, piercing or slashing attacks are resisted on the own damage control, including inherited Theurgy and restored-body overflow.

- Table fact · Confirm the incoming damage is from an attack and whether it is magical.
- Verification · subclass-passive-defenses; browser-subclass-passive-defenses

## Cleric — Solidarity

Entry level 1 · [Amonkhet](https://dnd5e.wikidot.com/cleric:solidarity)

Source spell progression · level 1 prepared: Bless, Guiding Bolt · level 3 prepared: Aid, Warding Bond · level 5 prepared: Beacon of Hope, Crusader's Mantle · level 7 prepared: Aura of Life, Guardian of Faith · level 9 prepared: Circle of Power, Mass Cure Wounds

### Level 1 · Bonus Proficiency

- Training grants · heavy
- Remaining source effects need verification.

### Level 1 · Solidarity's Action

- Counters · expanded:2014:cleric:2014:subclass:cleric:solidarity:resource:solidarity-s-action; 3 uses at probe level; long reset verified
- Generic action model · Solidarity's Action: spends 1 from expanded:2014:cleric:2014:subclass:cleric:solidarity:resource:solidarity-s-action
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Preserve Life

- Generic action model · Channel Divinity: Preserve Life: spends 1 from 2014:channel-divinity; separate roll 10
- Numeric effects awaiting verification · healing-pool (Divide among chosen within30 ft; max half target maxHP; excludes undead/constructs)
- Remaining source effects need verification.

### Level 6 · Channel Divinity: Oketra's Blessing

- Generic action model · Channel Divinity: Oketra's Blessing: spends 1 from 2014:channel-divinity; separate roll 10
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Supreme Healing

Healing integration applies this benefit once alongside equivalent Life features, including Theurgy inheritance.

- Verification · subclass-theurgy-inheritance

## Cleric — Strength

Entry level 1 · [Amonkhet](https://dnd5e.wikidot.com/cleric:strength)

Source spell progression · level 1 prepared: Divine Favor, Shield of Faith · level 3 prepared: Enhance Ability, Protection from Poison · level 5 prepared: Haste, Protection from Energy · level 7 prepared: Dominate Beast, Stoneskin · level 9 prepared: Destructive Wave, Insect Plague

### Level 1 · Bonus Proficiency

- Training grants · heavy
- Remaining source effects need verification.

### Level 1 · Acolyte of Strength

- Choice controls · Acolyte of Strength (advancement)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Feat of Strength

- Generic action model · Channel Divinity: Feat of Strength: spends 1 from 2014:channel-divinity; separate roll 10
- Remaining source effects need verification.

### Level 6 · Channel Divinity: Rhonas' Blessing

- Generic action model · Channel Divinity: Rhonas' Blessing: spends 1 from 2014:channel-divinity; separate roll 10
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Avatar of Battle

Confirmed nonmagical bludgeoning, piercing or slashing attacks are resisted on the own damage control, including inherited Theurgy and restored-body overflow.

- Table fact · Confirm the incoming damage is from an attack and whether it is magical.
- Verification · subclass-passive-defenses; browser-subclass-passive-defenses

## Cleric — Ambition

Entry level 1 · [Amonkhet](https://dnd5e.wikidot.com/cleric:ambition)

Source spell progression · level 1 prepared: Bane, Disguise Self · level 3 prepared: Mirror Image, Ray of Enfeeblement · level 5 prepared: Bestow Curse, Vampiric Touch · level 7 prepared: Death Ward, Dimension Door · level 9 prepared: Dominate Person, Modify Memory

### Level 1 · Warding Flare

- Counters · expanded:2014:cleric:2014:subclass:cleric:ambition:resource:warding-flare; 3 uses at probe level; long reset verified
- Generic action model · Warding Flare: spends 1 from expanded:2014:cleric:2014:subclass:cleric:ambition:resource:warding-flare
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Invoke Duplicity

Channel spend, source-owned concentrated duplicate, duration and source cleanup. Movement is contingent on the state.

- Generic action model · Channel Divinity: Invoke Duplicity: spends 1 from 2014:channel-divinity
- Table fact · Confirm unoccupied space, distance, line of sight, movement and attack targets.
- Verification · subclass-theurgy-inheritance; browser-subclass-duplicity

### Level 6 · Channel Divinity: Cloak of Shadows

- Generic action model · Channel Divinity: Cloak of Shadows: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Improved Duplicity

- Numeric effects awaiting verification · duplicate-count (Invoke Duplicity;move any number30ft sameBA,range120)
- Remaining source effects need verification.

## Cleric — Zeal

Entry level 1 · [Amonkhet](https://dnd5e.wikidot.com/cleric:zeal)

Source spell progression · level 1 prepared: Searing Smite, Thunderous Smite · level 3 prepared: Magic Weapon, Shatter · level 5 prepared: Haste, Fireball · level 7 prepared: Fire Shield, Freedom of Movement · level 9 prepared: Destructive Wave, Flame Strike

### Level 1 · Bonus Proficiencies

- Training grants · heavy · martial
- Remaining source effects need verification.

### Level 1 · Priest of Zeal

- Counters · expanded:2014:cleric:2014:subclass:cleric:zeal:resource:priest-of-zeal; 3 uses at probe level; long reset verified
- Generic action model · Priest of Zeal: spends 1 from expanded:2014:cleric:2014:subclass:cleric:zeal:resource:priest-of-zeal
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Consuming Fervor

- Generic action model · Channel Divinity: Consuming Fervor: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Resounding Strike

- Numeric effects awaiting verification · push-distance (Thunder damage dealt to Large or smaller creature)
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Blaze of Glory

- Counters · expanded:2014:cleric:2014:subclass:cleric:zeal:resource:blaze-glory; 1 uses at probe level; long reset verified
- Generic action model · Blaze of Glory: spends 1 from expanded:2014:cleric:2014:subclass:cleric:zeal:resource:blaze-glory; separate roll 5d10, 5d10 (Reduced0 by visible attacker, even killed outright)
- Remaining source effects need verification.

## Cleric — Fate (UA)

Entry level 1 · [Unearthed Arcana 85 - Wonders of the Multiverse](https://dnd5e.wikidot.com/cleric:fate-ua)

Source spell progression · level 1 prepared: Dissonant Whispers, Heroism · level 3 prepared: See Invisibility, Warding Bond · level 5 prepared: Beacon of Hope, Clairvoyance · level 7 prepared: Death Ward, Divination · level 9 prepared: Commune, Geas

### Level 1 · Omens and Portents

- Counters · expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:augury; 1 uses at probe level; long reset verified
- Generic action model · Omens and Portents: spends 1 from expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:augury
- Remaining source effects need verification.

### Level 1 · Ties That Bind

- Counters · expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:ties-bind; 2 uses at probe level; long reset verified
- Generic action model · Ties That Bind: spends 1 from expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:ties-bind; separate roll 1d6
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Strands of Fate

- Generic action model · Channel Divinity: Strands of Fate: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Insightful Striking

- Counters · expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:insightful-striking; 3 uses at probe level; long reset verified
- Generic action model · Insightful Striking: spends 1 from expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:insightful-striking; separate roll 1d6
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Visions of the Future

- Counters · expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:foresight; 1 uses at probe level; long reset verified
- Generic action model · Visions of the Future: spends 1 from expanded:2014:cleric:2014:subclass:cleric:fate-ua:resource:foresight
- Remaining source effects need verification.

## Cleric — City (UA)

Entry level 1 · [Unearthed Arcana 7 - Modern Magic](https://dnd5e.wikidot.com/cleric:city-ua)

Source spell progression · level 1 known: On/Off · level 1 prepared: Comprehend Languages, Remote Access · level 3 prepared: Find Vehicle, Heat Metal · level 5 prepared: Lightning Bolt, Protection from Ballistics · level 7 prepared: Locate Creature, Synchronicity · level 9 prepared: Commune with City, Shutdown

### Level 1 · Bonus Cantrip

- Spell grants · On/Off
- Remaining source effects need verification.

### Level 1 · Bonus Proficiencies

- Training grants · land · sidearms
- Remaining source effects need verification.

### Level 1 · Heart of the City

- Counters · expanded:2014:cleric:2014:subclass:cleric:city-ua:resource:heart-city; 3 uses at probe level; long reset verified
- Generic action model · Heart of the City: spends 1 from expanded:2014:cleric:2014:subclass:cleric:city-ua:resource:heart-city (In city)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Spirits of the City

- Generic action model · Channel Divinity: Spirits of the City: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Block Watch

- Recognized numeric routes · expertise (Urban environment)
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Express Transit

- Counters · expanded:2014:cleric:2014:subclass:cleric:city-ua:resource:express-transit; 1 uses at probe level; short reset verified
- Generic action model · Express Transit: spends 1 from expanded:2014:cleric:2014:subclass:cleric:city-ua:resource:express-transit
- Remaining source effects need verification.

## Cleric — Protection (UA)

Entry level 1 · [Unearthed Arcana 22 - Cleric](https://dnd5e.wikidot.com/cleric:protection-ua)

Source spell progression · level 1 prepared: Compelled Duel, Protection from Evil and Good · level 3 prepared: Aid, Protection from Poison · level 5 prepared: Protection from Energy, Slow · level 7 prepared: Guardian of Faith, Otiluke's Resilient Sphere · level 9 prepared: Antilife Shell, Wall of Force

### Level 1 · Bonus Proficiency

- Training grants · heavy
- Remaining source effects need verification.

### Level 1 · Shield of the Faithful

- Generic action model · Shield of the Faithful: source rules or unverified dedicated path (Creature attacks another target within5 ft; see both)
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Radiant Defense

- Generic action model · Channel Divinity: Radiant Defense: spends 1 from 2014:channel-divinity; separate roll 2d10+2
- Remaining source effects need verification.

### Level 6 · Blessed Healer

Healing integration applies this benefit once alongside equivalent Life features, including Theurgy inheritance.

- Verification · subclass-theurgy-inheritance

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Indomitable Defense

- Choice controls · Indomitable Defense (rest)
- Generic action model · Indomitable Defense: source rules or unverified dedicated path
- Remaining source effects need verification.

## Cleric — Twilight (UA)

Entry level 1 · [Unearthed Arcana 63 - Cleric, Druid, Wizard](https://dnd5e.wikidot.com/cleric:twilight-ua)

Source spell progression · level 1 prepared: Faerie Fire, Sleep · level 3 prepared: Darkness, Invisibility · level 5 prepared: Leomund's Tiny Hut, Aura of Vitality · level 7 prepared: Aura of Life, Greater Invisibility · level 9 prepared: Circle of Power, Dream

### Level 1 · Bonus Proficiencies

- Training grants · heavy · martial
- Remaining source effects need verification.

### Level 1 · Eyes of Night

- Counters · expanded:2014:cleric:2014:subclass:cleric:twilight-ua:resource:share-night; 3 uses at probe level; long reset verified
- Generic action model · Eyes of Night: spends 1 from expanded:2014:cleric:2014:subclass:cleric:twilight-ua:resource:share-night
- Numeric effects awaiting verification · darkvision
- Remaining source effects need verification.

### Level 1 · Vigilant Blessing

- Generic action model · Vigilant Blessing: source rules or unverified dedicated path
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Twilight Sanctuary

- Generic action model · Channel Divinity: Twilight Sanctuary: spends 1 from 2014:channel-divinity; separate roll 1d8
- Numeric effects awaiting verification · temporary-hit-points (End turn in30-ft dim sphere1m; can instead end charm/fear effect)
- Remaining source effects need verification.

### Level 6 · Steps of the Brave

- Generic action model · Steps of the Brave: source rules or unverified dedicated path (Dim light/darkness)
- Numeric effects awaiting verification · save-advantage
- Remaining source effects need verification.

### Level 8 · Divine Strike

- Numeric effects awaiting verification · extra-weapon-damage (Once on each own turn when weapon attack hits)
- Remaining source effects need verification.

### Level 17 · Midnight Shroud

- Numeric effects awaiting verification · darkness-vision-grants (Cast Darkness with slot;choose that many visible creatures including self)
- Remaining source effects need verification.

## Cleric — Unity (UA)

Entry level 1 · [Unearthed Arcana 68 - Subclasses, Part 2](https://dnd5e.wikidot.com/cleric:unity-ua)

Source spell progression · level 1 prepared: Heroism, Shield of Faith · level 3 prepared: Aid, Warding Bond · level 5 prepared: Beacon of Hope, Sending · level 7 prepared: Aura of Purity, Guardian of Faith · level 9 prepared: Greater Restoration, Rary's Telepathic Bond

### Level 1 · Emboldening Bond

- Counters · expanded:2014:cleric:2014:subclass:cleric:unity-ua:resource:emboldening-bond; 1 uses at probe level; long reset verified
- Generic action model · Emboldening Bond: spends 1 from expanded:2014:cleric:2014:subclass:cleric:unity-ua:resource:emboldening-bond
- Remaining source effects need verification.

### Level 2 · Channel Divinity: Shared Burden

- Generic action model · Channel Divinity: Shared Burden: spends 1 from 2014:channel-divinity
- Remaining source effects need verification.

### Level 6 · Protective Bond

- Generic action model · Protective Bond: source rules or unverified dedicated path
- Remaining source effects need verification.

### Level 8 · Potent Spellcasting

- Recognized numeric routes · cantrip-damage-bonus (Cleric cantrip damage)
- Remaining source effects need verification.

### Level 17 · Enduring Unity

- Generic action model · Enduring Unity: source rules or unverified dedicated path (Bonded partner at0; touch;1m window)
- Remaining source effects need verification.

## Druid — Dreams

Entry level 2 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/druid:dreams)

### Level 2 · Balm of the Summer Court

Dedicated pool = owning Druid level, spends 1 to half owner level of d6, rolls once, self heal capped and temp HP equals number of dice.

- Counters · Balm of the Summer Court; 2 uses at probe level; long reset verified
- Dedicated plans · balm via useHealingFeature
- Table fact · Confirm visible creature within source range. Other-target heal/temp at table.

### Level 6 · Hearth of Moonlight and Shadow

- Numeric effects awaiting verification · skill-bonus (Rest sphere30 ft: allies Stealth/Perception; cover blocks; ends when you leave/rest ends)
- Table fact · Establish shelter area, watch/rest boundaries and creatures covered.
- Open sheet gap · No own Stealth/Perception bonus from confirmed Hearth.

### Level 10 · Hidden Paths

Generic source pool spend.

- Counters · Hidden Paths; 3 uses at probe level; long reset verified
- Generic action model · Hidden Paths: spends 1 from expanded:2014:druid:2014:subclass:druid:dreams:resource:hidden-paths
- Table fact · Confirm sight, willing creature, positions or correct previous rest destination and spell restrictions.
- Open sheet gap · No dedicated slot-free spell workflow for Walker's spells.

### Level 14 · Walker in Dreams

Generic source pool spend.

- Counters · Walker in Dreams; 1 uses at probe level; long reset verified
- Generic action model · Walker in Dreams: spends 1 from expanded:2014:druid:2014:subclass:druid:dreams:resource:walker-dreams
- Table fact · Confirm sight, willing creature, positions or correct previous rest destination and spell restrictions.
- Open sheet gap · No dedicated slot-free spell workflow for Walker's spells.

## Druid — Land

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/druid:land)

### Level 2 · Bonus Cantrip

One Druid bonus cantrip selected during advancement and reconciled separately from ordinary known quota.

- Choice controls · bonus-cantrip (advancement)

### Level 2 · Natural Recovery

Generic per-day use; normal slot controls exist.

- Counters · Natural Recovery; 1 uses at probe level; long reset verified
- Generic action model · Natural Recovery: spends 1 from expanded:2014:druid:2014:subclass:druid:land:resource:natural-recovery
- Table fact · Confirm short rest.
- Open sheet gap · Missing selecting/recovering real slot levels subject to total half Druid rounded up and per-slot <6.

### Level 3 · Circle Spells

Eight terrain options including Underdark. Owner level 3/5/7/9 prepared grants, legacy terrain adapter.

- Choice controls · land (advancement)
- Table fact · Confirm terrain choice.

### Level 6 · Land's Stride

Source rules.

- Numeric effects awaiting verification · ignore-difficult-terrain (Also nonmagical plant slow/thorns;advantage save magical plants impeding movement)
- Table fact · Establish terrain plant hazards, plant/elemental origin or attacking beast/plant saves.
- Open sheet gap · Nature's Ward poison/disease immunity and contextual own saves remain without sheet integration.

### Level 10 · Nature's Ward

Source rules.

- Numeric effects awaiting verification · condition-immunity
- Table fact · Establish terrain plant hazards, plant/elemental origin or attacking beast/plant saves.
- Open sheet gap · Nature's Ward poison/disease immunity and contextual own saves remain without sheet integration.

### Level 14 · Nature's Sanctuary

Source rules.

- Numeric effects awaiting verification · attack-ward (Beast/plant attacks you:fail choose new target or miss,success immune24h)
- Table fact · Establish terrain plant hazards, plant/elemental origin or attacking beast/plant saves.
- Open sheet gap · Nature's Ward poison/disease immunity and contextual own saves remain without sheet integration.

## Druid — Moon

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/druid:moon)

### Level 2 · Combat Wild Shape

MoonFormTools local known/seen creature or elemental overlay, owner levels and movement gates, actual 1/2 Wild Shape uses, bound separate HP/physical stats/armor/rolls, restoration/overflow; bonus slot-heal d8 per slot using actual slot then capped active form heal. Reviewed Task5C1 and own-form tests.

- Table fact · Confirm seen form and source limitations, choose worn/merged/fallen equipment and DM permission.

### Level 2 · Circle Forms

MoonFormTools local known/seen creature or elemental overlay, owner levels and movement gates, actual 1/2 Wild Shape uses, bound separate HP/physical stats/armor/rolls, restoration/overflow; bonus slot-heal d8 per slot using actual slot then capped active form heal. Reviewed Task5C1 and own-form tests.

- Numeric effects awaiting verification · max-beast-cr (Other Wild Shape limitations still apply)
- Table fact · Confirm seen form and source limitations, choose worn/merged/fallen equipment and DM permission.

### Level 6 · Primal Strike

Active beast overlay stores level-6 magical-strike flag.

- Numeric effects awaiting verification · magical-attacks (Beast-form attacks for overcoming nonmagical resistance/immunity)
- Table fact · Apply target's magical-strike resistance interaction.

### Level 10 · Elemental Wild Shape

MoonFormTools local known/seen creature or elemental overlay, owner levels and movement gates, actual 1/2 Wild Shape uses, bound separate HP/physical stats/armor/rolls, restoration/overflow; bonus slot-heal d8 per slot using actual slot then capped active form heal. Reviewed Task5C1 and own-form tests.

- Table fact · Confirm seen form and source limitations, choose worn/merged/fallen equipment and DM permission.

### Level 14 · Thousand Forms

- Table fact · Confirm desired Alter Self effect and concentration.
- Open sheet gap · Missing dedicated at-will cast/own Alter Self activation.

## Druid — Shepherd

Entry level 2 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/druid:shepherd)

### Level 2 · Speech of the Woods

Source language training where reconciled.

- Table fact · Beast communication and limits on interpretation.

### Level 2 · Spirit Totem

Generic use pools at Spirit Totem/Faithful Summons where available.

- Choice controls · totem-type (activation)
- Counters · Spirit Totem; 1 uses at probe level; short reset verified
- Generic action model · Spirit Totem: spends 1 from expanded:2014:druid:2014:subclass:druid:shepherd:resource:spirit-totem
- Table fact · Confirm aura positions, summoned creatures, qualifying conjuration and zero-HP trigger.
- Open sheet gap · Missing totem aura state and own bear temp HP/strength advantage; summoned creatures' max-HP/healing benefits and Faithful Summons actor support are reference.

### Level 6 · Mighty Summoner

Generic use pools at Spirit Totem/Faithful Summons where available.

- Numeric effects awaiting verification · summon-hp-bonus (Spell summoned/created beast/fey; natural weapons magical)
- Table fact · Confirm aura positions, summoned creatures, qualifying conjuration and zero-HP trigger.
- Open sheet gap · Missing totem aura state and own bear temp HP/strength advantage; summoned creatures' max-HP/healing benefits and Faithful Summons actor support are reference.

### Level 10 · Guardian Spirit

Generic use pools at Spirit Totem/Faithful Summons where available.

- Numeric effects awaiting verification · summon-healing (Summoned beast/fey ends turn in aura)
- Table fact · Confirm aura positions, summoned creatures, qualifying conjuration and zero-HP trigger.
- Open sheet gap · Missing totem aura state and own bear temp HP/strength advantage; summoned creatures' max-HP/healing benefits and Faithful Summons actor support are reference.

### Level 14 · Faithful Summons

Generic use pools at Spirit Totem/Faithful Summons where available.

- Counters · Faithful Summons; 1 uses at probe level; long reset verified
- Generic action model · Faithful Summons: spends 1 from expanded:2014:druid:2014:subclass:druid:shepherd:resource:faithful-summons
- Table fact · Confirm aura positions, summoned creatures, qualifying conjuration and zero-HP trigger.
- Open sheet gap · Missing totem aura state and own bear temp HP/strength advantage; summoned creatures' max-HP/healing benefits and Faithful Summons actor support are reference.

## Druid — Spores

Entry level 2 · [Guildmaster's Guide to Ravnica; Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/druid:spores)

Source spell progression · level 2 known: Chill Touch · level 3 prepared: Blindness/Deafness, Gentle Repose · level 5 prepared: Animate Dead, Gaseous Form · level 7 prepared: Blight, Confusion · level 9 prepared: Cloudkill, Contagion

### Level 2 · Circle Spells

Owner Wisdom always-prepared list outside preparation quota, plus any explicit known cantrip.


### Level 2 · Halo of Spores

Dedicated contextual visible d4/6/8/10 by owner level, doubled during valid Symbiotic Entity.

- Dedicated plans · halo-spores via executeTriggeredFeature / executeConditionalAction (Reaction; visible creature enters within 10 ft or starts there; Constitution save negates)
- Table fact · Confirm eligible creature and reaction, target Con save.

### Level 2 · Symbiotic Entity

Actual Wild Shape spend, 4× Druid level source-tagged temp HP, expires on timeout/losing temp HP/re-shaping. Active state doubles Halo dice.

- Dedicated plans · symbiotic-entity via activateSubclassForm
- Numeric effects awaiting verification · melee-weapon-extra-damage (Entity active)
- Table fact · Confirm choose to replace existing higher temp HP.
- Open sheet gap · Melee weapon 1d6 necrotic damage is reference; no actual weapon roll mutation.

### Level 6 · Fungal Infestation

Dedicated fungal zombie with 1 HP then persistent own conditions, attacks, Undead Fortitude, independent damage/reload and printed HD. C2 browser actual + model 3/3.

- Counters · Fungal Infestation; 3 uses at probe level; long reset verified
- Table fact · Confirm qualifying corpse, space, command, target and damage circumstances.

### Level 10 · Spreading Spores

Generic control with source text.

- Generic action model · Spreading Spores: source rules or unverified dedicated path (Symbiotic Entity active)
- Table fact · Choose cube and external creature entering/starting within, resolve saves.
- Open sheet gap · No active cube state linked to suppressing own Halo reaction.

### Level 14 · Fungal Body

- Numeric effects awaiting verification · condition-immunity · critical-hit-conversion (Unless incapacitated)
- Open sheet gap · No blinded/deafened/frightened/poisoned immunity or incoming critical conversion.

## Druid — Stars

Entry level 2 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/druid:stars)

Source spell progression · level 2 known: Guidance · level 2 prepared: Guiding Bolt

### Level 2 · Star Map

Holding-map state gates grants and dedicated no-slot Guiding Bolt (UA also Augury) with long-rest pool, correct Wis attack and visible critical dice.

- Counters · Star Map; 2 uses at probe level; long reset verified
- Generic action model · Star Map: spends 1 from expanded:2014:druid:2014:subclass:druid:stars:resource:star-map-casts
- Table fact · Confirm replacement/map focus and casting requirements.

### Level 2 · Starry Form

Actual Wild Shape spend, timed source state; Archer own attack/damage plan, Chalice source-slot recipient roll and capped self heal, Dragon d20 floor on listed ability/skill checks and concentration.

- Choice controls · constellation (activation)
- Dedicated plans · archer via executeTriggeredFeature / executeConditionalAction (Archer active; bonus action; visible target within 60 ft) · chalice via executeTriggeredFeature / executeConditionalAction (Chalice active; a spell cast with a slot just restored HP; self/other within 30 ft) · starry-form via activateSubclassForm
- Numeric effects awaiting verification · chalice-healing (Chalice; cast slotted healing spell, heal self/other30ft) · d20-floor (Dragon;INT/WIS check or CON concentration save)
- Table fact · Confirm attack target/range, qualifying slot spell healing and Chalice recipient/range.

### Level 6 · Cosmic Omen

Visible d6 sets Weal/Woe state until long rest, and own pool spends one with separate visible d6 and signed result.

- Counters · Cosmic Omen; 3 uses at probe level; long reset verified
- Table fact · Confirm eligible creature/visibility/range, roll trigger and reaction.

### Level 10 · Twinkling Constellations

Owner 10 doubles Archer/Chalice dice, Dragon gets 20-ft fly display, confirmed start-turn constellation change.

- Numeric effects awaiting verification · dragon-flying-speed (Dragon Starry Form,can hover) · constellation-change (While Starry Form active)
- Table fact · Flight positioning.

### Level 14 · Full of Stars

Active form gates typed physical resistance at source-specific level.

- Numeric effects awaiting verification · resistance (Starry Form active)
- Table fact · Select incoming damage type.

## Druid — Wildfire

Entry level 2 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/druid:wildfire)

Source spell progression · level 2 prepared: Burning Hands, Cure Wounds · level 3 prepared: Flaming Sphere, Scorching Ray · level 5 prepared: Plant Growth, Revivify · level 7 prepared: Aura of Life, Fire Shield · level 9 prepared: Flame Strike, Mass Cure Wounds

### Level 2 · Circle Spells

Owner Wisdom always-prepared list outside preparation quota, plus any explicit known cantrip.


### Level 2 · Summon Wildfire Spirit

Dedicated Wild Shape spend; source spirit own HP/saves/Flame Seed/Fiery Teleportation and owner effects separated, ranged command and cleanup with actual reload. C2 16/16 combined Druid families.

- Table fact · Confirm placement, initial/terminal external fire damage, target saves and teleport spaces.

### Level 6 · Enhanced Bond

Active valid spirit + retained own features adds exactly one eligible visible d8 to owning fire-damage or healing spell, no repeat per projectile/critical; self heal capped once, other recipient untouched. Task5D browser and model actual proof.

- Numeric effects awaiting verification · spell-roll-bonus (Wildfire spirit summoned;one damage/healing roll of spell dealingfire/restoringHP) · spell-origin (Spell range not self)
- Table fact · Choose casting origin and source range/target geometry; deal damage to external targets at table.

### Level 10 · Cauterizing Flames

Generic costs and die when declared.

- Counters · Cauterizing Flames; 4 uses at probe level; long reset verified
- Generic action model · Cauterizing Flames: spends 1 from expanded:2014:druid:2014:subclass:druid:wildfire:resource:cauterizing-flames; separate roll 2d10+3
- Table fact · Confirm qualifying death/flame location, creature movement, or spirit proximity and zero-HP trigger.
- Open sheet gap · No flame state/own heal or automatic revival/half-HP restoration and dismissal.

### Level 14 · Blazing Revival

Generic costs and die when declared.

- Counters · Blazing Revival; 1 uses at probe level; long reset verified
- Generic action model · Blazing Revival: spends 1 from expanded:2014:druid:2014:subclass:druid:wildfire:resource:blazing-revival
- Table fact · Confirm qualifying death/flame location, creature movement, or spirit proximity and zero-HP trigger.
- Open sheet gap · No flame state/own heal or automatic revival/half-HP restoration and dismissal.

## Druid — Primeval (UA)

Entry level 2 · [Unearthed Arcana 83 - Giant Options](https://dnd5e.wikidot.com/druid:primeval-ua)

### Level 2 · Keeper of Old

Generic skill training reconciliation.

- Training grants · History
- Numeric effects awaiting verification · skill-roll-bonus (INT History)
- Table fact · Confirm History relates to ancient events.
- Open sheet gap · Extra d4 not routed into that actual owner History roll.

### Level 2 · Primeval Companion

Dedicated Wild Shape summon and body profile, confirms commands, separate HP/saves/conditions and source cleanup, owner-level scaling.

- Table fact · Confirm placement and attacks/target.

### Level 6 · Prehistoric Conduit

Source companion origin instructions and dedicated reaction interception use raw damage, floor-half target share and remaining companion share with separate typed defenses; compatible normal/Moon/sheep own body consumers.

- Numeric effects awaiting verification · spell-origin (Spell range not self) · companion-save-advantage (Own spell permits save) · companion-own-spell-evasion (Own spell normally deals half damage on save)
- Table fact · Confirm visibility, positioning, attack and external target actual damage; source spell-origin is table confirmed.
- Open sheet gap · Own-spell companion save advantage/evasion is reference/context, no universal spell-target integration.

### Level 10 · Titanic Bond

Owning level 10 companion Large, choose alternate movement; source spell-slot heighten, cramped size selection, temp HP/speed/visible boost damage. Actual model and browser with persisted costs and independent HP.

- Choice controls · companion-speed (activation)
- Generic action model · Titanic Bond: source rules or unverified dedicated path (Companion summoned; target visible)
- Table fact · Confirm available space and damage/position.

### Level 14 · Scourge of the Ancients

Source rules.

- Table fact · Determine proximity and eligible creatures/save.
- Open sheet gap · No trigger that applies own supported scaling from the later feature.

## Druid — Mage of Prismari (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-prismari-ua)

### Level 2 · Creative Skills

Source-filtered two skill choices consumed by advancement training reconciliation.

- Choice controls · skills (advancement)

### Level 2 · Kinetic Artistry

Generic costs/visible rolls where declared; creative skill choice separately reconciles.

- Choice controls · kinetic-effect (activation)
- Counters · Kinetic Artistry; 2 uses at probe level; long reset verified
- Generic action model · Kinetic Artistry: spends 1 from expanded:2014:druid:2014:subclass:druid:mage-of-prismari-ua:resource:kinetic-artistry; separate roll 1d4+3
- Table fact · Confirm elemental Dash trail/water/position and external damage.
- Open sheet gap · No linked movement/specific Dash modes or end-turn AC/position effect.

### Level 6 · Favored Medium

Flexible owner feature choice saved.

- Choice controls · favored-medium (rest)
- Numeric effects awaiting verification · resistance (Selected feature)
- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

### Level 10 · Focused Expression

Flexible owner feature choice saved.

- Numeric effects awaiting verification · extra-damage (Selected feature;once per turn dealdamage;one target;Medium cold CON slow10,fire grants ally30ft1d6tempHP,lightning DEX no reactions;see source conditions) · fire-temporary-hit-points (Selected feature and fire medium;creature30ft)
- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

### Level 14 · Impeccable Physicality

Flexible owner feature choice saved.

- Training grants · dex
- Numeric effects awaiting verification · d20-floor (DEX saves; selected feature)
- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

## Druid — Mage of Witherbloom (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-witherbloom-ua)

Source spell progression · level 2 known: Spare the Dying · level 2 prepared: Cure Wounds, Inflict Wounds · level 3 prepared: Lesser Restoration, Ray of Enfeeblement · level 5 prepared: Revivify, Vampiric Touch · level 7 prepared: Blight, Greater Restoration · level 9 prepared: Antilife Shell, Mass Cure Wounds

### Level 2 · Witherbloom Spells

Owner-specific spell advancement materialization and additional source training where declared.


### Level 2 · Essence Tap

Flexible owner choices and generic pool where present.

- Choice controls · essence-mode (activation)
- Counters · Essence Tap; 2 uses at probe level; long reset verified
- Generic action model · Essence Tap: spends 1 from expanded:2014:druid:2014:subclass:druid:mage-of-witherbloom-ua:resource:essence-tap · Essence Tap: source rules or unverified dedicated path (Overgrowth mode active)
- Numeric effects awaiting verification · ignore-resistance (Withering Strike active;may change any damage to necrotic)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 6 · Witherbloom Brew

Flexible owner choices and generic pool where present.

- Choice controls · brew-effect (activation) · fortifying-type (activation)
- Training grants · herbalism kit
- Counters · Witherbloom Brew; 3 uses at probe level; long reset verified
- Generic action model · Witherbloom Brew: spends 1 from expanded:2014:druid:2014:subclass:druid:mage-of-witherbloom-ua:resource:brews; separate roll 2d6 (Quickening brew exists) · Witherbloom Brew: spends 1 from expanded:2014:druid:2014:subclass:druid:mage-of-witherbloom-ua:resource:brews; separate roll 2d6 (Toxifying brew exists)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 10 · Witherbloom Adept

Flexible owner choices and generic pool where present.

- Numeric effects awaiting verification · spell-damage-or-healing-bonus (Selected feature;once/turn necrotic damage or heal using spell,one target)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 14 · Withering Vortex

Flexible owner choices and generic pool where present.

- Counters · Withering Vortex; 5 uses at probe level; long reset verified
- Generic action model · Withering Vortex: spends 1 from expanded:2014:druid:2014:subclass:druid:mage-of-witherbloom-ua:resource:withering-vortex
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

## Druid — Stars (UA)

Entry level 2 · [Unearthed Arcana 69 - Subclasses, Part 3](https://dnd5e.wikidot.com/druid:stars-ua)

### Level 2 · Star Map

Holding-map state gates grants and dedicated no-slot Guiding Bolt (UA also Augury) with long-rest pool, correct Wis attack and visible critical dice.

- Counters · Star Map; 3 uses at probe level; long reset verified
- Generic action model · Star Map: spends 1 from expanded:2014:druid:2014:subclass:druid:stars-ua:resource:star-map-casts
- Table fact · Confirm replacement/map focus and casting requirements.

### Level 2 · Starry Form

Actual Wild Shape spend, timed source state; Archer own attack/damage plan, Chalice source-slot recipient roll and capped self heal, Dragon d20 floor on listed ability/skill checks and concentration.

- Choice controls · constellation (activation)
- Dedicated plans · archer via executeTriggeredFeature / executeConditionalAction (Archer active; bonus action; visible target within 60 ft) · chalice via executeTriggeredFeature / executeConditionalAction (Chalice active; a spell cast with a slot just restored HP; self/other within 30 ft) · starry-form via activateSubclassForm
- Numeric effects awaiting verification · chalice-healing (Chalice; cast slotted healing spell, heal self/other30ft) · d20-floor (Dragon;INT/WIS check or CON concentration save)
- Table fact · Confirm attack target/range, qualifying slot spell healing and Chalice recipient/range.

### Level 6 · Cosmic Omen

Visible d6 sets Weal/Woe state until long rest, and own pool spends one with separate visible d6 and signed result.

- Counters · Cosmic Omen; 3 uses at probe level; long reset verified
- Table fact · Confirm eligible creature/visibility/range, roll trigger and reaction.

### Level 10 · Full of Stars

Active form gates typed physical resistance at source-specific level.

- Numeric effects awaiting verification · resistance (Starry Form active)
- Table fact · Select incoming damage type.

### Level 14 · Star Flare

Generic visible 4d10 and pool.

- Counters · Star Flare; 1 uses at probe level; long reset verified
- Generic action model · Star Flare: spends 1 from expanded:2014:druid:2014:subclass:druid:stars-ua:resource:star-flare; separate roll 4d10
- Table fact · Confirm point, allies/enemies and Con saves.
- Open sheet gap · Does not apply own self-heal if selected.

## Druid — Twilight (UA)

Entry level 2 · [Unearthed Arcana 22 - Druid](https://dnd5e.wikidot.com/druid:twilight-ua)

### Level 2 · Harvest's Scythe

Source pool reference.

- Counters · Harvest's Scythe; 2 uses at probe level; long reset verified
- Generic action model · Harvest's Scythe: source rules or unverified dedicated path
- Table fact · Confirm spell damage, kill and recipient.
- Open sheet gap · No elective paid necrotic dice added to spell roll or resulting heal.

### Level 6 · Speech Beyond the Grave

Generic use pool.

- Counters · Speech Beyond the Grave; 1 uses at probe level; short reset verified
- Generic action model · Speech Beyond the Grave: spends 1 from expanded:2014:druid:2014:subclass:druid:twilight-ua:resource:speak-dead
- Table fact · Confirm corpse and questions.
- Open sheet gap · No slot-free cast integration.

### Level 10 · Watcher at the Threshold

Own typed radiant/necrotic resistance.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · save-advantage (Ally30ft;you not incapacitated)
- Table fact · Confirm eligible creatures within source aura.
- Open sheet gap · Save advantage on death saves not routed for self or other.

### Level 14 · Paths of the Dead

Generic daily use.

- Counters · Paths of the Dead; 1 uses at probe level; short reset verified
- Generic action model · Paths of the Dead: spends 1 from expanded:2014:druid:2014:subclass:druid:twilight-ua:resource:etherealness
- Table fact · Confirm spell targets and destination.
- Open sheet gap · No dedicated free Etherealness state.

## Druid — Wildfire (UA)

Entry level 2 · [Unearthed Arcana 63 - Cleric, Druid, Wizard](https://dnd5e.wikidot.com/druid:wildlife-ua)

Source spell progression · level 2 known: Fire Bolt · level 3 prepared: Locate Animals or Plants, Scorching Ray · level 5 prepared: Fireball, Plant Growth · level 7 prepared: Aura of Life, Fire Shield · level 9 prepared: Flame Strike, Raise Dead

### Level 2 · Circle Spells

Owner Wisdom always-prepared list outside preparation quota, plus any explicit known cantrip.


### Level 2 · Summon Wildfire

Variant-specific profile, attack/save scaling and teleport recovery; reusing Wild Shape terminates this UA summon.

- Counters · Summon Wildfire; 1 uses at probe level; short reset verified
- Table fact · Confirm placement, initial external damage, saves and space.

### Level 6 · Enhanced Bond

Active valid spirit + retained own features adds exactly one eligible visible d8 to owning fire-damage or healing spell, no repeat per projectile/critical; self heal capped once, other recipient untouched. Task5D browser and model actual proof.

- Numeric effects awaiting verification · spell-roll-bonus (Wildfire spirit summoned;one damage/healing roll of spell dealingfire/restoringHP) · spell-origin (Spell range not self)
- Table fact · Choose casting origin and source range/target geometry; deal damage to external targets at table.

### Level 10 · Flames of Life

Generic costs/rolls.

- Counters · Flames of Life; 3 uses at probe level; long reset verified
- Generic action model · Flames of Life: spends 1 from expanded:2014:druid:2014:subclass:druid:wildlife-ua:resource:flames-life; separate roll 2d10+3
- Table fact · Confirm source death/flame position and chosen recipients or zero-HP trigger.
- Open sheet gap · No flame state/own heal or automatic endurance effect/dismissal.

### Level 14 · Blazing Endurance

Generic costs/rolls.

- Counters · Blazing Endurance; 1 uses at probe level; long reset verified
- Generic action model · Blazing Endurance: spends 1 from expanded:2014:druid:2014:subclass:druid:wildlife-ua:resource:blazing-endurance; separate roll 70, 2d10+14
- Table fact · Confirm source death/flame position and chosen recipients or zero-HP trigger.
- Open sheet gap · No flame state/own heal or automatic endurance effect/dismissal.

## Monk — Astral Self

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/monk:astral-self)

### Level 3 · Arms of the Astral Self

- Generic action model · Arms of the Astral Self: spends 1 from 2014:Monk:points
- Dedicated plans · astral-arms via astral-arms (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · attack-ability (Astral arms only;optional replaces STR/DEX) · strength-check-save-ability (Arms active;optional replaces STR)
- Remaining source effects need verification.

### Level 6 · Visage of the Astral Self

- Generic action model · Visage of the Astral Self: spends 1 from 2014:Monk:points
- Dedicated plans · astral-visage via astral-visage (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · darkness-vision (Visage active;magical/nonmagical)
- Remaining source effects need verification.

### Level 11 · Body of the Astral Self

- Numeric effects awaiting verification · extra-damage (Once on own turn hit with astral arms)
- Remaining source effects need verification.

### Level 17 · Awakened Astral Self

- Generic action model · Awakened Astral Self: spends 5 from 2014:Monk:points
- Dedicated plans · awaken-astral via awaken-astral (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · armor-class-bonus (Astral self fully active) · Attack-action-count (All attacks astral arms)
- Remaining source effects need verification.

## Monk — Ascendant Dragon

Entry level 3 · [Fizban's Treasury of Dragons](https://dnd5e.wikidot.com/monk:ascendant-dragon)

### Level 3 · Draconic Disciple

- Choice controls · Draconic Disciple
- Training grants · Draconic or another language
- Counters · Draconic Disciple; 1 uses at probe level; long reset
- Generic action model · Draconic Disciple: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon:resource:draconic-presence
- Remaining source effects need verification.

### Level 3 · Breath of the Dragon

- Counters · Breath of the Dragon; 6 uses at probe level; long reset
- Generic action model · Breath of the Dragon: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon:resource:dragon-breath
- Remaining source effects need verification.

### Level 6 · Wings Unfurled

- Counters · Wings Unfurled; 6 uses at probe level; long reset
- Generic action model · Wings Unfurled: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon:resource:wings-unfurled
- Remaining source effects need verification.

### Level 11 · Aspect of the Wyrm

- Counters · Aspect of the Wyrm; 1 uses at probe level; long reset
- Generic action model · Aspect of the Wyrm: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon:resource:wyrm-aura
- Remaining source effects need verification.

### Level 17 · Ascendant Aspect

- Generic action model · Ascendant Aspect: spends 1 from 2014:Monk:points · Ascendant Aspect: separate roll 3d10
- Numeric effects awaiting verification · blindsight
- Remaining source effects need verification.

## Monk — Drunken Master

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/monk:drunken-master)

### Level 3 · Bonus Proficiencies

- Training grants · {'featureId': '2014:subclass:monk:drunken-master:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'Performance', 'index': 'performance'}]} · {'featureId': '2014:subclass:monk:drunken-master:bonus-proficiencies', 'proficiencies': [{'kind': 'tools', 'name': "brewer's supplies", 'index': 'brewerssupplies'}]}
- Remaining source effects need verification.

### Level 3 · Drunken Technique

- Numeric effects awaiting verification · walking-speed-bonus (Flurry of Blows;until endturn) · disengage (Flurry of Blows)
- Remaining source effects need verification.

### Level 6 · Tipsy Sway

- Generic action model · Tipsy Sway: spends 1 from 2014:Monk:points (Melee attack misses you; chosen other visible creature5ft)
- Numeric effects awaiting verification · stand-movement-cost (Instead of halfspeed)
- Remaining source effects need verification.

### Level 11 · Drunkard's Luck

- Generic action model · Drunkard's Luck: spends 2 from 2014:Monk:points (Attack/check/save has disadvantage)
- Remaining source effects need verification.

### Level 17 · Intoxicated Frenzy

- Numeric effects awaiting verification · flurry-extra-attacks (Every Flurry attack different target;total5)
- Remaining source effects need verification.

## Monk — Four Elements

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/monk:four-elements)

### Level 3 · Disciple of the Elements

- Choice controls · Disciple of the Elements
- Generic action model · Breath of Winter: spends 6 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Clench of the North Wind: spends 3 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Eternal Mountain Defense: spends 5 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Fangs of the Fire Snake: spends 1 from 2014:Monk:points; separate roll 1d10 (Discipline selected (Elemental Attunement initially known)) · Fist of Four Thunders: spends 2 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Fist of Unbroken Air: spends 2 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Flames of the Phoenix: spends 4 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Gong of the Summit: spends 3 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Mist Stance: spends 4 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Ride the Wind: spends 4 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · River of Hungry Flame: spends 5 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Rush of the Gale Spirits: spends 2 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Shape the Flowing River: spends 1 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Sweeping Cinder Strike: spends 2 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Water Whip: spends 2 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known)) · Wave of Rolling Earth: spends 6 from 2014:Monk:points (Discipline selected (Elemental Attunement initially known))
- Dedicated plans · fangs-fire-snake via fangs-fire-snake (Attack action on your turn; unarmed reach increases10ft and damage becomes fire through turn end.) · fangs-fire-hit via fangs-fire-hit (After hitting with an active Fire Snake unarmed strike; spend1additional ki for1d10 fire.) · elemental-attunement via elemental-attunement (Action; harmless elemental effect within30ft. Choose the source effect at the table.)
- Numeric effects awaiting verification · max-spell-ki (Total base+upcast cost; upcast from5 only if spell has higher-level effect; no material components)
- Remaining source effects need verification.

## Monk — Kensei

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/monk:kensei)

### Level 3 · Path of the Kensei

- Choice controls · Path of the Kensei
- Training grants · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Club', 'index': 'club'}]} · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Crossbow, light', 'index': 'crossbowlight'}]} · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Dagger', 'index': 'dagger'}]} · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Greatclub', 'index': 'greatclub'}]} · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Handaxe', 'index': 'handaxe'}]} · {'featureId': '2014:subclass:monk:kensei:path-of-the-kensei', 'proficiencies': [{'kind': 'tools', 'name': "calligrapher's supplies", 'index': 'calligrapherssupplies'}]}
- Generic action model · Path of the Kensei: separate roll 1d4
- Dedicated plans · agile-parry via agile-parry (After unarmed strike in Attack action; holding an eligible melee Kensei weapon; +2AC until next turn while held and not incapacitated.) · kensei-shot via kensei-shot (Bonus action; published ranged Kensei weapon hits add1d4 until end of turn; UA pummel applies1d4 to targets hit with the Kensei Attack action.)
- Numeric effects awaiting verification · armor-class-bonus (Unarmed strike in Attack, hold melee kensei (UA any kensei), not incapacitated; until start next turn)
- Remaining source effects need verification.

### Level 6 · One with the Blade

- Generic action model · One with the Blade: spends 1 from 2014:Monk:points (Kensei weapon hit; once on own turn)
- Dedicated plans · deft-strike via deft-strike (After a Kensei weapon hit on your turn; once per turn;1ki.)
- Remaining source effects need verification.

### Level 11 · Sharpen the Blade

- Dedicated plans · sharpen-blade via sharpen-blade (Bonus action; touch a known Kensei weapon; choose1–3ki. Published: weapon has no existing magic attack/damage bonus. Lasts1minute or until used again.)
- Remaining source effects need verification.

### Level 17 · Unerring Accuracy

- Remaining source effects need verification.

## Monk — Long Death

Entry level 3 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/monk:long-death)

### Level 3 · Touch of Death

- Dedicated plans · touch-of-death via touch-of-death
- Numeric effects awaiting verification · temporary-hit-points (Reduce creature within5 to0)
- Remaining source effects need verification.

### Level 6 · Hour of Reaping

- Remaining source effects need verification.

### Level 11 · Mastery of Death

- Generic action model · Mastery of Death: spends 1 from 2014:Monk:points
- Dedicated plans · mastery-of-death via mastery-of-death (When reduced to 0 HP without dying outright, spend 1 ki to have 1 HP instead.)
- Remaining source effects need verification.

### Level 17 · Touch of the Long Death

- Remaining source effects need verification.

## Monk — Mercy

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/monk:mercy)

### Level 3 · Implements of Mercy

- Training grants · {'featureId': '2014:subclass:monk:mercy:implements-of-mercy', 'proficiencies': [{'kind': 'skills', 'name': 'Insight', 'index': 'insight'}]} · {'featureId': '2014:subclass:monk:mercy:implements-of-mercy', 'proficiencies': [{'kind': 'skills', 'name': 'Medicine', 'index': 'medicine'}]} · {'featureId': '2014:subclass:monk:mercy:implements-of-mercy', 'proficiencies': [{'kind': 'tools', 'name': 'herbalism kit', 'index': 'herbalismkit'}]}
- Remaining source effects need verification.

### Level 3 · Hands of Healing

Hands of Healing rolls the owning Monk martial arts die plus Wisdom, spends one ki, and heals the active self body up to its maximum. A confirmed eligible Flurry replacement spends no extra ki.

- Generic action model · Hands of Healing: spends 1 from 2014:Monk:points
- Table fact · Confirm touch, the Flurry strike replacement and its per-Flurry limits; apply healing to another creature at the table.
- Verification · subclass-theurgy-inheritance; browser-subclass-mercy-healing

### Level 3 · Hands of Harm

- Generic action model · Hands of Harm: spends 1 from 2014:Monk:points
- Remaining source effects need verification.

### Level 6 · Physician's Touch

- Numeric effects awaiting verification · heal-condition-cure (Hands of Healing;choose one) · harm-condition (Hands of Harm)
- Remaining source effects need verification.

### Level 11 · Flurry of Healing and Harm

- Numeric effects awaiting verification · free-hands-healing-strikes (Flurry may replace each unarmed strike without extra ki) · free-hands-harm (Flurry hit;still once/turn)
- Remaining source effects need verification.

### Level 17 · Hand of Ultimate Mercy

- Counters · Hand of Ultimate Mercy; 1 uses at probe level; long reset
- Generic action model · Hand of Ultimate Mercy: spends 1 from expanded:2014:monk:2014:subclass:monk:mercy:resource:ultimate-mercy; separate roll 4d10+3
- Remaining source effects need verification.

## Monk — Open Hand

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/monk:open-hand)

### Level 3 · Open Hand Technique

- Remaining source effects need verification.

### Level 6 · Wholeness of Body

Confirmed action spends the long-rest use and heals the current body by three times Monk level, capped by its maximum.

- Counters · Wholeness of Body; 1 uses at probe level; long reset
- Generic action model · Wholeness of Body: spends 1 from its long-rest counter and heals the active body
- Verification · subclass-theurgy-inheritance; browser-subclass-wholeness

### Level 11 · Tranquility

- Remaining source effects need verification.

### Level 17 · Quivering Palm

- Generic action model · Quivering Palm: spends 3 from 2014:Monk:points
- Remaining source effects need verification.

## Monk — Shadow

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/monk:shadow)

### Level 3 · Shadow Arts

- Generic action model · Shadow Arts: spends 2 from 2014:Monk:points
- Remaining source effects need verification.

### Level 6 · Shadow Step

- Remaining source effects need verification.

### Level 11 · Cloak of Shadows

- Remaining source effects need verification.

### Level 17 · Opportunist

- Remaining source effects need verification.

## Monk — Sun Soul

Entry level 3 · [Sword Coast Adventurer's Guide; Xanathar's Guide to Everything](https://dnd5e.wikidot.com/monk:sun-soul)

### Level 3 · Radiant Sun Bolt

- Generic action model · Radiant Sun Bolt: spends 1 from 2014:Monk:points · Radiant Sun Bolt: separate roll 1d20+9
- Remaining source effects need verification.

### Level 6 · Searing Arc Strike

- Remaining source effects need verification.

### Level 11 · Searing Sunburst

- Remaining source effects need verification.

### Level 17 · Sun Shield

- Generic action model · Sun Shield: separate roll 8 (Light active; creature hits you melee)
- Remaining source effects need verification.

## Monk — Ascendant Dragon (UA)

Entry level 3 · [Unearthed Arcana 75 - Subclasses, Part 5](https://dnd5e.wikidot.com/monk:ascendant-dragon-ua)

### Level 3 · Draconic Disciple

- Training grants · Draconic
- Counters · Draconic Disciple; 1 uses at probe level; long reset
- Generic action model · Draconic Disciple: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon-ua:resource:draconic-presence
- Remaining source effects need verification.

### Level 3 · Breath of the Dragon

- Counters · Breath of the Dragon; 6 uses at probe level; long reset
- Generic action model · Breath of the Dragon: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon-ua:resource:dragon-breath
- Remaining source effects need verification.

### Level 6 · Wings Unfurled

- Counters · Wings Unfurled; 6 uses at probe level; long reset
- Generic action model · Wings Unfurled: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon-ua:resource:wings-unfurled
- Remaining source effects need verification.

### Level 11 · Aspect of the Wyrm

- Counters · Aspect of the Wyrm; 1 uses at probe level; long reset
- Generic action model · Aspect of the Wyrm: spends 1 from expanded:2014:monk:2014:subclass:monk:ascendant-dragon-ua:resource:wyrm-aura
- Remaining source effects need verification.

### Level 17 · Ascendant Aspect

- Generic action model · Ascendant Aspect: separate roll 4d10
- Numeric effects awaiting verification · blindsight · breath-ongoing-damage (Damaged by breath; start each target turn, repeat DEX end turn to end)
- Remaining source effects need verification.

## Monk — Astral Self (UA)

Entry level 3 · [Unearthed Arcana 60 - Barbarian and Monk](https://dnd5e.wikidot.com/monk:astral-self-ua)

### Level 3 · Arms of the Astral Self

- Generic action model · Arms of the Astral Self: spends 2 from 2014:Monk:points
- Dedicated plans · astral-arms via astral-arms (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · attack-ability (Astral arms only;optional replaces STR/DEX) · strength-check-save-ability (Arms active;optional replaces STR)
- Remaining source effects need verification.

### Level 6 · Visage of the Astral Self

- Generic action model · Visage of the Astral Self: spends 1 from 2014:Monk:points
- Dedicated plans · astral-visage via astral-visage (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · darkness-vision (Visage active;magical/nonmagical)
- Remaining source effects need verification.

### Level 11 · Awakening of the Astral Self

- Generic action model · Awakening of the Astral Self: separate roll 1d10+23 (Both arms and visage summoned; acid/cold/fire/force/lightning)
- Numeric effects awaiting verification · extra-damage (Once on own turn hit with astral arms)
- Remaining source effects need verification.

### Level 17 · Complete Astral Self

- Generic action model · Complete Astral Self: spends 10 from 2014:Monk:points · Complete Astral Self: separate roll 3 (Complete astral active; creature within10 reduced0)
- Dedicated plans · awaken-astral via awaken-astral (Bonus action; manifests for10minutes. Source features retain their own level gates. Astral Arms use Wisdom instead of Strength for Strength checks/saves and unarmed attacks; reach10ft on own turn.)
- Numeric effects awaiting verification · armor-class-bonus (Astral self fully active;not incapacitated) · Attack-action-count (All attacks astral arms)
- Remaining source effects need verification.

## Monk — Kensei (UA)

Entry level 3 · [Source: Unearthed Arcana 24 - Monk](https://dnd5e.wikidot.com/monk:kensei-ua)

### Level 3 · Path of the Kensei

- Choice controls · Path of the Kensei
- Training grants · {'featureId': '2014:subclass:monk:kensei-ua:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Battleaxe', 'index': 'battleaxe'}]} · {'featureId': '2014:subclass:monk:kensei-ua:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Flail', 'index': 'flail'}]} · {'featureId': '2014:subclass:monk:kensei-ua:path-of-the-kensei', 'proficiencies': [{'kind': 'weapons', 'name': 'Glaive', 'index': 'glaive'}]}
- Generic action model · Path of the Kensei: separate roll 1d4
- Dedicated plans · agile-parry via agile-parry (After unarmed strike in Attack action; holding an eligible melee Kensei weapon; +2AC until next turn while held and not incapacitated.) · kensei-pummel via kensei-pummel (Bonus action after hitting with a Kensei weapon in your Attack action this turn; apply the roll once to each creature hit in that Attack action.)
- Numeric effects awaiting verification · armor-class-bonus (Unarmed strike in Attack, hold melee kensei (UA any kensei), not incapacitated; until start next turn)
- Remaining source effects need verification.

### Level 6 · One with the Blade

- Counters · One with the Blade; 1 uses at probe level; short reset
- Generic action model · One with the Blade: spends 1 from expanded:2014:monk:2014:subclass:monk:kensei-ua:resource:precise-strike
- Remaining source effects need verification.

### Level 11 · Sharpen the Blade

- Dedicated plans · sharpen-blade via sharpen-blade (Bonus action; touch a known Kensei weapon; choose1–3ki. Published: weapon has no existing magic attack/damage bonus. Lasts1minute or until used again.)
- Remaining source effects need verification.

### Level 17 · Unerring Accuracy

- Remaining source effects need verification.

## Monk — Mercy (UA)

Entry level 3 · [Unearthed Arcana 67 - Subclasses, Part 1](https://dnd5e.wikidot.com/monk:mercy-ua)

### Level 3 · Implements of Mercy

- Choice controls · Implements of Mercy
- Training grants · {'featureId': '2014:subclass:monk:mercy-ua:implements-of-mercy', 'proficiencies': [{'kind': 'tools', 'name': 'herbalism kit', 'index': 'herbalismkit'}]} · {'featureId': '2014:subclass:monk:mercy-ua:implements-of-mercy', 'proficiencies': [{'kind': 'tools', 'name': "poisoner's kit", 'index': 'poisonerskit'}]} · {'featureId': '2014:subclass:monk:mercy-ua:implements-of-mercy', 'proficiencies': [{'kind': 'skills', 'name': 'Insight', 'index': 'insight'}]}
- Remaining source effects need verification.

### Level 3 · Hands of Healing

Hands of Healing rolls the owning Monk martial arts die plus Wisdom, spends one ki, and heals the active self body up to its maximum. A confirmed eligible Flurry replacement spends no extra ki.

- Generic action model · Hands of Healing: spends 1 from 2014:Monk:points
- Table fact · Confirm touch, the Flurry strike replacement and its per-Flurry limits; apply healing to another creature at the table.
- Verification · subclass-theurgy-inheritance; browser-subclass-mercy-healing

### Level 3 · Hands of Harm

- Generic action model · Hands of Harm: spends 1 from 2014:Monk:points
- Remaining source effects need verification.

### Level 6 · Noxious Aura

- Generic action model · Noxious Aura: spends 1 from 2014:Monk:points; separate roll 3
- Remaining source effects need verification.

### Level 11 · Healing Technique

- Numeric effects awaiting verification · heal-condition-cure (Hands of Healing;choose one)
- Remaining source effects need verification.

### Level 17 · Hand of Mercy

- Generic action model · Hand of Mercy: spends 4 from 2014:Monk:points
- Remaining source effects need verification.

## Monk — Tranquility (UA)

Entry level 3 · [Unearthed Arcana 24 - Monk](https://dnd5e.wikidot.com/monk:tranquility-ua)

### Level 3 · Path of Tranquility

- Counters · Path of Tranquility; 1 uses at probe level; none reset
- Remaining source effects need verification.

### Level 3 · Healing Hands

- Counters · Healing Hands; 200 uses at probe level; long reset
- Dedicated plans · healing-hands via healing-hands
- Remaining source effects need verification.

### Level 6 · Emissary of Peace

- Choice controls · Emissary of Peace
- Training grants · {'featureId': '2014:subclass:monk:tranquility-ua:emissary-of-peace', 'proficiencies': [{'kind': 'skills', 'name': 'Performance', 'index': 'performance'}]}
- Numeric effects awaiting verification · charisma-check-advantage (Good-faith calm violent emotions/counselpeace;not Deception/Intimidation)
- Remaining source effects need verification.

### Level 11 · Douse the Flames of War

- Remaining source effects need verification.

### Level 17 · Anger of a Gentle Soul

- Counters · Anger of a Gentle Soul; 1 uses at probe level; short reset
- Generic action model · Anger of a Gentle Soul: spends 1 from expanded:2014:monk:2014:subclass:monk:tranquility-ua:resource:gentle-anger
- Remaining source effects need verification.

## Paladin — Ancients

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/paladin:ancients)

Source spell progression · level 3 prepared: Ensnaring Strike, Speak with Animals · level 5 prepared: Moonbeam, Misty Step · level 9 prepared: Plant Growth, Protection from Energy · level 13 prepared: Ice Storm, Stoneskin · level 17 prepared: Commune with Nature, Tree Stride

### Level 3 · Tenets of the Ancients

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared 2014 Channel Divinity pool spends on Nature's Wrath or Turn the Faithless; short or long rest resets.

- Generic action model · Nature's Wrath: spends 1 from 2014:channel-divinity · Turn the Faithless: spends 1 from 2014:channel-divinity
- Table fact · Confirm visible creature and chosen Str/Dex save, or fiend/fey within range and Wis save. Resolve restraint duration and turning at table.

### Level 7 · Aura of Warding

- Numeric effects awaiting verification · aura-radius · resistance (You/friendly within10/30)
- Table fact · Confirm incoming damage from a spell and friendly creatures' positions in 10/30-ft aura.
- Open sheet gap · No typed spell-origin damage resistance for this owner.

### Level 15 · Undying Sentinel

Generic long-rest tracking.

- Counters · Undying Sentinel; 1 uses at probe level; long reset verified
- Generic action model · Undying Sentinel: spends 1 from expanded:2014:paladin:2014:subclass:paladin:ancients:resource:undying-sentinel
- Table fact · Confirm non-instant-death zero-HP trigger and aging.
- Open sheet gap · Generic action cannot enact 1 HP via own zero-HP control.

### Level 20 · Elder Champion

Generic long-rest use.

- Counters · Elder Champion; 1 uses at probe level; long reset verified
- Generic action model · Elder Champion: spends 1 from expanded:2014:paladin:2014:subclass:paladin:ancients:resource:elder-champion
- Numeric effects awaiting verification · start-turn-self-healing (Transformation active1m) · action-spell-to-bonus-action (Transformation;paladin spell normally1action) · enemy-save-disadvantage (Transformation;enemy10ft vs paladin spells/CD)
- Table fact · Confirm enemies within 10 feet and eligible saves against Paladin spells/Channel Divinity.
- Open sheet gap · No one-minute state, +10 start-turn self heal or action→bonus cast consumption.

## Paladin — Conquest

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/paladin:conquest)

Source spell progression · level 3 prepared: Armor of Agathys, Command · level 5 prepared: Hold Person, Spiritual Weapon · level 9 prepared: Bestow Curse, Fear · level 13 prepared: Dominate Beast, Stoneskin · level 17 prepared: Cloudkill, Dominate Person

### Level 3 · Tenets of Conquest

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend; Guided Strike shows fixed +10.

- Generic action model · Conquering Presence: spends 1 from 2014:channel-divinity · Guided Strike: spends 1 from 2014:channel-divinity; separate roll 10
- Table fact · Confirm Conquering Presence targets/Wis saves or determining eligible attack roll before adjudication.
- Open sheet gap · Guided Strike does not modify a pending attack.

### Level 7 · Aura of Conquest

Source rules.

- Numeric effects awaiting verification · aura-radius · damage (Creature frightened of you starts in aura; speed0 while in aura; not incapacitated, no total cover)
- Table fact · Verify frightened creature in aura and turn start, or attack hit and paladin not incapacitated; apply psychic damage at table.

### Level 15 · Scornful Rebuke

Source rules.

- Numeric effects awaiting verification · retaliation (Creature hits you with attack; not incapacitated)
- Table fact · Verify frightened creature in aura and turn start, or attack hit and paladin not incapacitated; apply psychic damage at table.

### Level 20 · Invincible Conqueror

Generic long-rest use.

- Counters · Invincible Conqueror; 1 uses at probe level; long reset verified
- Generic action model · Invincible Conqueror: spends 1 from expanded:2014:paladin:2014:subclass:paladin:conquest:resource:invincible-conqueror
- Numeric effects awaiting verification · resistance (Active1m) · Attack-action-extra-attacks (Active1m) · critical-range (Active1m;melee weapon attacks)
- Table fact · Confirm action, duration and target.
- Open sheet gap · Missing minute state for own all-damage resistance, extra attack, 19–20 melee weapon crit range.

## Paladin — Crown

Entry level 3 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/paladin:crown)

Source spell progression · level 3 prepared: Command, Compelled Duel · level 5 prepared: Warding Bond, Zone of Truth · level 9 prepared: Aura of Vitality, Spirit Guardians · level 13 prepared: Banishment, Guardian of Faith · level 17 prepared: Circle of Power, Geas

### Level 3 · Tenets of the Crown

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Champion Challenge: spends 1 from 2014:channel-divinity · Turn the Tide: spends 1 from 2014:channel-divinity
- Table fact · Confirm Champion Challenge creatures/range/Wis saves; Turn the Tide audible recipients at or below half HP.
- Open sheet gap · No Turn the Tide visible source die and own healing.

### Level 7 · Divine Allegiance

Trigger guidance.

- Generic action model · Divine Allegiance: source rules or unverified dedicated path (Creature5ft takes damage)
- Table fact · Confirm creature within 5 ft and actual incoming damage.
- Open sheet gap · No confirmed redirected nonreducible self damage workflow.

### Level 15 · Unyielding Saint

- Numeric effects awaiting verification · save-advantage
- Table fact · Confirm save is to avoid or end paralysis/stun.
- Open sheet gap · Missing contextual advantage in own saving rolls.

### Level 20 · Exalted Champion

Generic long-rest use.

- Counters · Exalted Champion; 1 uses at probe level; long reset verified
- Generic action model · Exalted Champion: spends 1 from expanded:2014:paladin:2014:subclass:paladin:crown:resource:exalted-champion
- Numeric effects awaiting verification · resistance (Active1h;from nonmagical weapons) · save-advantage (Active;you and allies30ft) · save-advantage (Active;allies30ft)
- Table fact · Confirm source aura, allies, applicable saves and damage magic status.
- Open sheet gap · No transformation state applying self nonmagical weapon physical resistance and saving-throw advantage.

## Paladin — Devotion

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/paladin:devotion)

Source spell progression · level 3 prepared: Protection from Evil and Good, Sanctuary · level 5 prepared: Lesser Restoration, Zone of Truth · level 9 prepared: Beacon of Hope, Dispel Magic · level 13 prepared: Freedom of Movement, Guardian of Faith · level 17 prepared: Commune, Flame Strike

### Level 3 · Tenets of Devotion

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend and Sacred Weapon Cha display.

- Generic action model · Sacred Weapon: spends 1 from 2014:channel-divinity; separate roll 3 · Turn the Unholy: spends 1 from 2014:channel-divinity
- Table fact · Confirm qualifying held weapon or valid undead/fiend and Wis save.
- Open sheet gap · Sacred Weapon doesn't bind Cha bonus into the weapon's attacks, magical weapon classification or timer. Cha is the Sacred Weapon modifier, while normal weapon ability is retained.

### Level 7 · Aura of Devotion

- Numeric effects awaiting verification · aura-radius · condition-immunity (You/friendly aura while conscious)
- Table fact · Confirm aura presence or applicable creature type/effect.
- Open sheet gap · Own charmed immunity and always-on Protection from Evil and Good contextual defenses lack consumers.

### Level 15 · Purity of Spirit

- Table fact · Confirm aura presence or applicable creature type/effect.
- Open sheet gap · Own charmed immunity and always-on Protection from Evil and Good contextual defenses lack consumers.

### Level 20 · Holy Nimbus

Generic long-rest use.

- Counters · Holy Nimbus; 1 uses at probe level; long reset verified
- Generic action model · Holy Nimbus: spends 1 from expanded:2014:paladin:2014:subclass:paladin:devotion:resource:holy-nimbus
- Numeric effects awaiting verification · start-turn-damage (Active1m;enemy starts in brightlight30ft) · save-advantage (Active1m)
- Table fact · Confirm enemy turn start in aura and casts by fiends/undead.
- Open sheet gap · No timed nimbus state or contextual advantage on own saves.

## Paladin — Glory

Entry level 3 · [Mythic Odysseys of Theros; Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/paladin:glory)

Source spell progression · level 3 prepared: Guiding Bolt, Heroism · level 5 prepared: Enhance Ability, Magic Weapon · level 9 prepared: Haste, Protection From Energy · level 13 prepared: Compulsion, Freedom Of Movement · level 17 prepared: Commune, Flame Strike

### Level 3 · Tenets Of Glory

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend; Inspiring Smite has 2d8+Paladin level in source; generic action currently uses 2d8+Cha.

- Generic action model · Peerless Athlete: spends 1 from 2014:channel-divinity · Inspiring Smite: spends 1 from 2014:channel-divinity; separate roll 2d8+3
- Table fact · Confirm Peerless Athlete requirements or smite hit, chosen creatures and temporary HP split.
- Open sheet gap · No Athletics/Acrobatics advantage, carry/jump state or own allocated smite temp HP.

### Level 7 · Aura of Alacrity

Real +10 owner walking speed via subclassNumericProfile.

- Recognized numeric routes · walking-speed-bonus (You always; allies start turn5ft(18:10ft) if not incapacitated, lasts turn)
- Table fact · Allies entering starting-turn radius and improved radius at 18 handled at table.

### Level 15 · Glorious Defense

Generic Cha-count use.

- Counters · Glorious Defense; 3 uses at probe level; long reset verified
- Generic action model · Glorious Defense: spends 1 from expanded:2014:paladin:2014:subclass:paladin:glory:resource:glorious-defense
- Table fact · Confirm hit, applicable reaction/range, whether AC change causes miss and attack range.
- Open sheet gap · No own/ally reactive AC workflow or follow-up attack callback.

### Level 20 · Living Legend

Generic long-rest spend.

- Counters · Living Legend; 1 uses at probe level; long reset verified
- Generic action model · Living Legend: spends 1 from expanded:2014:paladin:2014:subclass:paladin:glory:resource:living-legend · Living Legend: source rules or unverified dedicated path (Active Living Legend;failed save)
- Numeric effects awaiting verification · check-advantage (Active1m) · miss-to-hit (Active;once each ownturn weapon attack miss)
- Table fact · Confirm failed save, misses and trigger timing.
- Open sheet gap · No minute check-advantage/miss-to-hit/save-reroll state or level-5-slot alternate cost.

## Paladin — Redemption

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/paladin:redemption)

Source spell progression · level 3 prepared: Sanctuary, Sleep · level 5 prepared: Calm Emotions, Hold Person · level 9 prepared: Counterspell, Hypnotic Pattern · level 13 prepared: Otiluke's Resilient Sphere, Stoneskin · level 17 prepared: Hold Monster, Wall of Force

### Level 3 · Tenets of Redemption

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend; Emissary shows +5 roll.

- Generic action model · Emissary of Peace: spends 1 from 2014:channel-divinity; separate roll 5 · Rebuke the Violent: spends 1 from 2014:channel-divinity
- Table fact · Confirm emitted Path or witnessed damage/save recipient, external reflected damage.
- Open sheet gap · Emissary of Peace lacks +5 Persuasion state/actual check consumption.

### Level 7 · Aura of the Guardian

Source reaction use instructions.

- Generic action model · Aura of the Guardian: source rules or unverified dedicated path (Creature10ft(18:30ft) takes damage)
- Numeric effects awaiting verification · aura-radius
- Table fact · Confirm other creature in source radius, actual damage and restrictions.
- Open sheet gap · No redirected own raw damage bypassing reduction.

### Level 15 · Protective Spirit

Source rules.

- Numeric effects awaiting verification · self-healing (End turn in combat below halfHP and not incapacitated)
- Table fact · Confirm combat end-of-turn timing.
- Open sheet gap · No own 1d6+half Paladin capped healing below half max.

### Level 20 · Emissary of Redemption

Source rules.

- Numeric effects awaiting verification · resistance (Per-creature loss conditions differ; see source) · retaliation (UA whenever creature damages you, same amount described; published attack hits only, radiant. See source loss conditions.)
- Table fact · Track external source creature and whether owner attacked it, targeted it, or damaged it.
- Open sheet gap · No eligible incoming resistance consumer; reflection and source exclusion require adjudication.

## Paladin — Vengeance

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/paladin:vengeance)

Source spell progression · level 3 prepared: Bane, Hunter's Mark · level 5 prepared: Hold Person, Misty Step · level 9 prepared: Haste, Protection from Energy · level 13 prepared: Banishment, Dimension Door · level 17 prepared: Hold Monster, Scrying

### Level 3 · Tenets of Vengeance

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Abjure Enemy: spends 1 from 2014:channel-divinity · Vow of Enmity: spends 1 from 2014:channel-divinity
- Table fact · Confirm target range, Wis save and fear/turn effects, or designated Vow target.
- Open sheet gap · No named Vow target state supplying own attack advantage.

### Level 7 · Relentless Avenger

Source reaction guidance.

- Generic action model · Relentless Avenger: source rules or unverified dedicated path (Hit opportunity attack)
- Table fact · Confirm qualifying opportunity hit or Vow target attack, range and movement.
- Open sheet gap · No Vow-linked reaction attack callback.

### Level 15 · Soul of Vengeance

Source reaction guidance.

- Generic action model · Soul of Vengeance: source rules or unverified dedicated path (Vow target attacks; within melee weapon reach)
- Table fact · Confirm qualifying opportunity hit or Vow target attack, range and movement.
- Open sheet gap · No Vow-linked reaction attack callback.

### Level 20 · Avenging Angel

Generic long-rest use.

- Counters · Avenging Angel; 1 uses at probe level; long reset verified
- Generic action model · Avenging Angel: spends 1 from expanded:2014:paladin:2014:subclass:paladin:vengeance:resource:avenging-angel
- Numeric effects awaiting verification · flying-speed (Transformation active1h) · fear-aura-radius (Active;first enemy entry/start in battle,WIS fear1m or damage;attack rolls against frightened target advantage)
- Table fact · Confirm position and creature entry/start in range; external Wis save and follow-on effects.
- Open sheet gap · No timed flying-speed/area state.

## Paladin — Watchers

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/paladin:watchers)

Source spell progression · level 3 prepared: Alarm, Detect Magic · level 5 prepared: Moonbeam, See Invisibility · level 9 prepared: Counterspell, Nondetection · level 13 prepared: Aura of Purity, Banishment · level 17 prepared: Hold Monster, Scrying

### Level 3 · Tenets of the Watchers

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Watcher's Will: spends 1 from 2014:channel-divinity · Abjure the Extraplanar: spends 1 from 2014:channel-divinity
- Table fact · Select valid willing recipients and mental saves, or qualifying creature types with Wis save and turn.
- Open sheet gap · Watcher's Will lacks own contextual Int/Wis/Cha save advantage.

### Level 7 · Aura of the Sentinel

PB initiative bonus consumed by owner when conscious/action-capable.

- Recognized numeric routes · initiative-bonus (You/chosen creatures aura; not incapacitated)
- Numeric effects awaiting verification · aura-radius
- Table fact · Confirm external allies' positions in 10/30-ft aura.

### Level 15 · Vigilant Rebuke

Generic visible 2d8+Cha formula.

- Generic action model · Vigilant Rebuke: separate roll 2d8+3 (You/visible creature30ft succeeds INT/WIS/CHA save)
- Table fact · Confirm visible creature's successful mental save and spell/source creature; apply damage externally.

### Level 20 · Mortal Bulwark

Generic source pool.

- Counters · Mortal Bulwark; 1 uses at probe level; long reset verified
- Generic action model · Mortal Bulwark: spends 1 from expanded:2014:paladin:2014:subclass:paladin:watchers:resource:mortal-bulwark
- Numeric effects awaiting verification · truesight (Active1m) · attack-advantage (Active1m)
- Table fact · Determine creature type, target planar origin, saves and banishment.
- Open sheet gap · No duration state or own special-target attack advantage/truesight integration.

## Paladin — Oathbreaker

Entry level 3 · [Dungeon Master’s Guide](https://dnd5e.wikidot.com/paladin:oathbreaker)

Source spell progression · level 3 prepared: Hellish Rebuke, Inflict Wounds · level 5 prepared: Crown of Madness, Darkness · level 9 prepared: Animate Dead, Bestow Curse · level 13 prepared: Blight, Confusion · level 17 prepared: Contagion, Dominate Person

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Control Undead: spends 1 from 2014:channel-divinity · Dreadful Aspect: spends 1 from 2014:channel-divinity
- Table fact · Confirm target undead CR, range and Wis save for control; confirm Dreadful Aspect targets and Wis saves.
- Open sheet gap · No owned controlled undead tracking or follow-up turn lifecycle.

### Level 7 · Aura of Hate

Source rules.

- Numeric effects awaiting verification · aura-radius · melee-weapon-damage-bonus (You plus any fiends/undead10/30; only one paladin bonus)
- Table fact · Confirm qualifying creatures/weapons and aura ranges.
- Open sheet gap · Owner melee bonus is a reference passive.

### Level 15 · Supernatural Resistance

Source rules.

- Numeric effects awaiting verification · resistance
- Table fact · Confirm actually nonmagical weapon damage.
- Open sheet gap · Typed nonmagical physical resistance is absent in subclassPassiveDamageDefense for this source.

### Level 20 · Dread Lord

Generic use and source damage button where declared.

- Counters · Dread Lord; 1 uses at probe level; long reset verified
- Generic action model · Dread Lord: spends 1 from expanded:2014:paladin:2014:subclass:paladin:oathbreaker:resource:dread-lord · Dread Lord: separate roll 3d10+3 (Dread Lord active)
- Numeric effects awaiting verification · start-turn-damage (Enemy frightened by you starts in30-ft aura)
- Table fact · Confirm targets, lighting, frightened status and attack choice.
- Open sheet gap · No timed state or contextual incoming attack disadvantage.

## Paladin — Treachery (UA)

Entry level 3 · [Unearthed Arcana 26 - Paladin](https://dnd5e.wikidot.com/paladin:treachery-ua)

Source spell progression · level 3 prepared: Charm Person, Expeditious Retreat · level 5 prepared: Invisibility, Mirror Image · level 9 prepared: Gaseous Form, Haste · level 13 prepared: Confusion, Greater Invisibility · level 17 prepared: Dominate Person, Passwall

### Level 3 · Tenets of Treachery

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend and generic hit dice/fixed advantage result for Poison Strike.

- Generic action model · Conjure Duplicate: spends 1 from 2014:channel-divinity · Poison Strike: spends 1 from 2014:channel-divinity; separate roll 2d10+3, 23
- Numeric effects awaiting verification · poison-strike-damage (Next weapon/ammo hit within1m after Poison Strike)
- Table fact · Confirm concentration and placement for duplicate; attack advantage and target poison damage are contextual.
- Open sheet gap · Duplicate projection/concentration and one-hit Poison Strike state are absent.

### Level 7 · Aura of Treachery

Source reaction instructions.

- Counters · Aura of Treachery; 3 uses at probe level; short reset verified
- Generic action model · Aura of Treachery: spends 1 from expanded:2014:paladin:2014:subclass:paladin:treachery-ua:resource:treacherous-strike
- Numeric effects awaiting verification · melee-attack-advantage (Target has one or more own allies within5ft)
- Table fact · Confirm adjacent creature positions/enemies, target hit and eligible redirection target.
- Open sheet gap · No own attack-advantage handler for Cull the Herd.

### Level 15 · Blackguard's Escape

Generic use tracking.

- Counters · Blackguard's Escape; 1 uses at probe level; short reset verified
- Generic action model · Blackguard's Escape: spends 1 from expanded:2014:paladin:2014:subclass:paladin:treachery-ua:resource:blackguards-escape
- Table fact · Confirm triggered hit/position, actual attack with advantage, and movement restrictions.
- Open sheet gap · No own timed invisibility, movement/teleport or advantage damage state.

### Level 20 · Icon of Deceit

Generic use tracking.

- Counters · Icon of Deceit; 1 uses at probe level; long reset verified
- Generic action model · Icon of Deceit: spends 1 from expanded:2014:paladin:2014:subclass:paladin:treachery-ua:resource:icon-of-deceit
- Numeric effects awaiting verification · advantage-damage-bonus (Active1m;attack has advantage) · invisible (Active1m)
- Table fact · Confirm triggered hit/position, actual attack with advantage, and movement restrictions.
- Open sheet gap · No own timed invisibility, movement/teleport or advantage damage state.

## Paladin — Redemption (UA)

Entry level 3 · [Unearthed Arcana 35 - A Trio of Subclasses](https://dnd5e.wikidot.com/paladin:redemption-ua)

Source spell progression · level 3 prepared: Shield, Sleep · level 5 prepared: Hold Person, Ray of Enfeeblement · level 9 prepared: Counterspell, Hypnotic Pattern · level 13 prepared: Otiluke’s Resilient Sphere, Stoneskin · level 17 prepared: Hold Monster, Wall of Force

### Level 3 · Tenets of Redemption

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Redemption Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota; source variant list.


### Level 3 · Armor of Peace

Own alternate 16+Dex AC applies with no armor and no shield; compares to other alternate bases.

- Recognized numeric routes · base-armor-class (No armor and no shield)
- Table fact · Confirm worn equipment.

### Level 3 · Warrior of Reconciliation

Source rules.

- Numeric effects awaiting verification · spare-charm-duration (Simple bludgeoning weapon reduces target0 and spare;docile refusing action/reaction unless command;cannot commandharm/attack/save;source end conditions)
- Table fact · Confirm reducing eligible creatures to zero with the printed weapon, choice to spare, long-lived charm and hostile actions.

### Level 3 · Channel Divinity

Shared Channel Divinity spend; Emissary shows +5 roll.

- Generic action model · Emissary of Peace: spends 1 from 2014:channel-divinity; separate roll 5 · Rebuke the Violent: spends 1 from 2014:channel-divinity
- Table fact · Confirm emitted Path or witnessed damage/save recipient, external reflected damage.
- Open sheet gap · Emissary of Peace lacks +5 Persuasion state/actual check consumption.

### Level 7 · Aura of the Guardian

Source reaction use instructions.

- Generic action model · Aura of the Guardian: source rules or unverified dedicated path (Ally10ft takes damage)
- Table fact · Confirm other creature in source radius, actual damage and restrictions.
- Open sheet gap · No redirected own raw damage bypassing reduction.

### Level 15 · Protective Spirit

Source rules.

- Numeric effects awaiting verification · self-healing (End turn in combat below halfHP and not incapacitated)
- Table fact · Confirm combat end-of-turn timing.
- Open sheet gap · No own 1d6+half Paladin capped healing below half max.

### Level 20 · Emissary of Redemption

Source rules.

- Numeric effects awaiting verification · resistance (Per-creature loss conditions differ; see source) · retaliation (UA whenever creature damages you, same amount described; published attack hits only, radiant. See source loss conditions.)
- Table fact · Track external source creature and whether owner attacked it, targeted it, or damaged it.
- Open sheet gap · No eligible incoming resistance consumer; reflection and source exclusion require adjudication.

## Paladin — Watchers (UA)

Entry level 3 · [Unearthed Arcana 67 - Subclasses, Part 1](https://dnd5e.wikidot.com/paladin:watchers-ua)

Source spell progression · level 3 prepared: Alarm, Chromatic Orb · level 5 prepared: Augury, Moonbeam · level 9 prepared: Counterspell, Nondetection · level 13 prepared: Aura of Purity, Banishment · level 17 prepared: Hallow, Hold Monster

### Level 3 · Tenets of the Watchers

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Watcher's Will: spends 1 from 2014:channel-divinity · Abjure the Extraplanar: spends 1 from 2014:channel-divinity
- Table fact · Select valid willing recipients and mental saves, or qualifying creature types with Wis save and turn.
- Open sheet gap · Watcher's Will lacks own contextual Int/Wis/Cha save advantage.

### Level 7 · Aura of the Sentinel

PB initiative bonus consumed by owner when conscious/action-capable.

- Recognized numeric routes · initiative-bonus (You/chosen creatures aura; not incapacitated)
- Numeric effects awaiting verification · aura-radius
- Table fact · Confirm external allies' positions in 10/30-ft aura.

### Level 15 · Vigilant Rebuke

Generic visible 2d8+Cha formula.

- Generic action model · Vigilant Rebuke: separate roll 2d8+3 (You/visible creature30ft succeeds save against spell)
- Table fact · Confirm visible creature's successful mental save and spell/source creature; apply damage externally.

### Level 20 · Mortal Bulwark

Generic source pool.

- Counters · Mortal Bulwark; 1 uses at probe level; long reset verified
- Generic action model · Mortal Bulwark: spends 1 from expanded:2014:paladin:2014:subclass:paladin:watchers-ua:resource:mortal-bulwark
- Numeric effects awaiting verification · truesight (Active1m) · attack-advantage (Active1m)
- Table fact · Determine creature type, target planar origin, saves and banishment.
- Open sheet gap · No duration state or own special-target attack advantage/truesight integration.

## Paladin — Heroism (UA)

Entry level 3 · [Unearthed Arcana 62 - Bard and Paladin](https://dnd5e.wikidot.com/paladin:heroism-ua)

Source spell progression · level 3 prepared: Expeditious Retreat, Guiding Bolt · level 5 prepared: Enhance Ability, Enthrall · level 9 prepared: Haste, Protection from Energy · level 13 prepared: Compulsion, Freedom of Movement · level 17 prepared: Commune, Conjure Volley

### Level 3 · Tenets of Heroism

Printed oath text.

- Table fact · Interpret roleplay promises at the table.

### Level 3 · Oath Spells

Prepared spell access added at owning Paladin 3/5/9/13/17, outside ordinary quota.


### Level 3 · Channel Divinity

Shared Channel Divinity spend.

- Generic action model · Legendary Strike: spends 1 from 2014:channel-divinity · Peerless Athlete: spends 1 from 2014:channel-divinity
- Table fact · Confirm Athletics/Acrobatics, jump and carrying context.
- Open sheet gap · No timed own extended crit range or Peerless Athlete state.

### Level 7 · Mighty Deed

Source trigger instructions.

- Generic action model · Mighty Deed: source rules or unverified dedicated path
- Table fact · Confirm crit or reducing to zero, up to Cha recipients and frightened save.
- Open sheet gap · No own temp-HP application or once-per-turn enforcement.

### Level 15 · Glorious Defense

Generic Cha-count use.

- Generic action model · Glorious Defense: source rules or unverified dedicated path (Visible creature hits you)
- Table fact · Confirm hit, applicable reaction/range, whether AC change causes miss and attack range.
- Open sheet gap · No own/ally reactive AC workflow or follow-up attack callback.

### Level 20 · Living Myth

Generic use.

- Counters · Living Myth; 1 uses at probe level; long reset verified
- Generic action model · Living Myth: spends 1 from expanded:2014:paladin:2014:subclass:paladin:heroism-ua:resource:living-myth · Living Myth: source rules or unverified dedicated path (Active Living Myth;failed save)
- Numeric effects awaiting verification · check-advantage (Active10m) · miss-to-hit (Active;once each ownturn weapon miss)
- Table fact · Confirm qualifying casts/attacks/checks and reactions.
- Open sheet gap · No timed d20/advantage/reroll state.

## Ranger — Beast Master

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/ranger:beast-master)

### Level 3 · Ranger's Companion

- Remaining source effects need verification.

### Level 3 · Primal Companion (Optional)

- Remaining source effects need verification.

### Level 7 · Exceptional Training

- Remaining source effects need verification.

### Level 11 · Bestial Fury

- Numeric effects awaiting verification · companion-attack-count (Command companion Attack; alternatively its Multiattack)
- Remaining source effects need verification.

### Level 15 · Share Spells

- Remaining source effects need verification.

## Ranger — Fey Wanderer

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/ranger:fey-wanderer)

Source spell progression · level 3 known: Charm Person · level 5 known: Misty Step · level 9 known: Dispel Magic · level 13 known: Dimension Door · level 17 known: Mislead

### Level 3 · Dreadful Strikes

- Numeric effects awaiting verification · weapon-extra-psychic-damage (Each target at most once per turn)
- Remaining source effects need verification.

### Level 3 · Fey Wanderer Magic

- Spell grants · Charm Person · Misty Step · Dispel Magic · Dimension Door · Mislead
- Remaining source effects need verification.

### Level 3 · Otherworldly Glamour

- Choice controls · Otherworldly Glamour
- Training grants · {'featureId': '2014:subclass:ranger:fey-wanderer:otherworldly-glamour', 'proficiencies': [{'kind': 'skills', 'name': 'Deception', 'index': 'deception'}]}
- Recognized numeric routes · charisma-check-bonus
- Remaining source effects need verification.

### Level 7 · Beguiling Twist

- Remaining source effects need verification.

### Level 11 · Fey Reinforcements

- Counters · Fey Reinforcements; 1 uses at probe level; long reset
- Generic action model · Fey Reinforcements: spends 1 from expanded:2014:ranger:2014:subclass:ranger:fey-wanderer:resource:fey-reinforcements (At 11th level, the royal courts of the Feywild have blessed you with the assistance of fey beings: you know the spell Summon Fey. It doesn't count against the number of ranger spells you know, and you can cast it without a material component. You can also cast it once without using a spell slot, and you regain the ability to do so when you finish a long rest. Whenever you start casting the spell, you can modify it so that it doesn't require concentration. If you do so, the spell's duration becomes 1 minute for that casting.)
- Remaining source effects need verification.

### Level 15 · Misty Wanderer

- Counters · Misty Wanderer; 3 uses at probe level; long reset
- Generic action model · Misty Wanderer: spends 1 from expanded:2014:ranger:2014:subclass:ranger:fey-wanderer:resource:misty-wanderer (When you reach 15th level, you can slip in and out of the Feywild to move in a blink of an eye: you can cast Misty Step without expending a spell slot. You can do so a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a long rest. In addition, whenever you cast Misty Step, you can bring along one willing creature you can see within 5 feet of you. That creature teleports to an unoccupied space of your choice within 5 feet of your destination space.)
- Remaining source effects need verification.

## Ranger — Gloom Stalker

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/ranger:gloom-stalker)

Source spell progression · level 3 known: Disguise Self · level 5 known: Rope Trick · level 9 known: Fear · level 13 known: Greater Invisibility · level 17 known: Seeming

### Level 3 · Gloom Stalker Magic

- Spell grants · Disguise Self · Rope Trick · Fear · Greater Invisibility · Seeming
- Remaining source effects need verification.

### Level 3 · Dread Ambusher

First-turn speed, one qualified additional weapon attack with critical-aware d8, and initiative Wisdom. End turn clears first-turn availability.

- Recognized numeric routes · initiative · speed-bonus (First combat turn only)
- Numeric effects awaiting verification · first-turn-extra-attack (Attack action on first combat turn; extra attack adds1d8 weapon type damage)
- Table fact · Confirm an eligible first-turn Attack action.
- Verification · gloom-stalker; browser-gloom-stalker

### Level 3 · Umbral Sight

- Numeric effects awaiting verification · darkvision (If racial darkvision already present instead increase by30ft)
- Remaining source effects need verification.

### Level 7 · Iron Mind

- Training grants · {'featureId': '2014:subclass:ranger:gloom-stalker:iron-mind', 'proficiencies': [{'kind': 'saves', 'name': 'wis', 'index': 'wis'}]}
- Remaining source effects need verification.

### Level 11 · Stalker's Flurry

Own weapon callback and once-per-turn availability tied to confirmed weapon miss.

- Table fact · Identify the miss and validate current turn and weapon.
- Verification · gloom-stalker; browser-gloom-stalker

### Level 15 · Shadowy Dodge

Reaction availability and confirmed pre-result trigger are tracked.

- Table fact · Apply disadvantage to an eligible incoming attack before the result.
- Verification · gloom-stalker; browser-gloom-stalker

## Ranger — Horizon Walker

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/ranger:horizon-walker)

Source spell progression · level 3 known: Protection from Evil and Good · level 5 known: Misty Step · level 9 known: Haste · level 13 known: Banishment · level 17 known: Teleportation Circle

### Level 3 · Horizon Walker Magic

- Spell grants · Protection from Evil and Good · Misty Step · Haste · Banishment · Teleportation Circle
- Remaining source effects need verification.

### Level 3 · Detect Portal

- Counters · Detect Portal; 1 uses at probe level; short reset
- Generic action model · Detect Portal: spends 1 from expanded:2014:ranger:2014:subclass:ranger:horizon-walker:resource:detect-portal (At 3rd level, you gain the ability to magically sense the presence of a planar portal. As an action, you detect the distance and direction to the closest planar portal within 1 mile of you.)
- Remaining source effects need verification.

### Level 3 · Planar Warrior

- Numeric effects awaiting verification · weapon-extra-force-damage (Bonus-action designated creature; next weapon hit this turn converts entire attack to force)
- Remaining source effects need verification.

### Level 7 · Ethereal Step

- Counters · Ethereal Step; 1 uses at probe level; short reset
- Generic action model · Ethereal Step: spends 1 from expanded:2014:ranger:2014:subclass:ranger:horizon-walker:resource:ethereal-step (At 7th level, you learn to step through the Ethereal Plane. As a bonus action on your turn, you can cast the Etherealness spell with this feature, without expending a spell slot, but the spell ends at the end of the current turn.)
- Remaining source effects need verification.

### Level 11 · Distant Strike

- Remaining source effects need verification.

### Level 15 · Spectral Defense

- Remaining source effects need verification.

## Ranger — Hunter

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/ranger:hunter)

### Level 3 · Hunter's Prey

- Choice controls · Hunter's Prey
- Remaining source effects need verification.

### Level 7 · Defensive Tactics

- Choice controls · Defensive Tactics
- Remaining source effects need verification.

### Level 11 · Multiattack

- Choice controls · Multiattack
- Remaining source effects need verification.

### Level 15 · Superior Hunter's Defense

- Choice controls · Superior Hunter's Defense
- Remaining source effects need verification.

## Ranger — Monster Slayer

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/ranger:monster-slayer)

Source spell progression · level 3 known: Protection from Evil and Good · level 5 known: Zone of Truth · level 9 known: Magic Circle · level 13 known: Banishment · level 17 known: Hold Monster

### Level 3 · Monster Slayer Magic

- Spell grants · Protection from Evil and Good · Zone of Truth · Magic Circle · Banishment · Hold Monster
- Remaining source effects need verification.

### Level 3 · Hunter's Sense

- Counters · Hunter's Sense; 3 uses at probe level; long reset
- Generic action model · Hunter's Sense: spends 1 from expanded:2014:ranger:2014:subclass:ranger:monster-slayer:resource:hunter-s-sense (At 3rd level, you gain the ability to peer at a creature and magically discern how best to hurt it. As an action, choose one creature you can see within 60 feet of you. You immediately learn whether the creature has any damage immunities, resistances, or vulnerabilities and what they are. If the creature is hidden from divination magic, you sense that it has no damage immunities, resistances, or vulnerabilities. You can use this feature a number of times equal to your Wisdom modifier (minimum of once). You regain all expended uses of it when you finish a long rest.)
- Remaining source effects need verification.

### Level 3 · Slayer's Prey

- Numeric effects awaiting verification · weapon-extra-damage (Designated target; first hit each turn)
- Remaining source effects need verification.

### Level 7 · Supernatural Defense

- Numeric effects awaiting verification · save-or-grapple-escape-bonus (Slayer’s Prey target causes save or grapple escape check)
- Remaining source effects need verification.

### Level 11 · Magic-User's Nemesis

- Counters · Magic-User's Nemesis; 1 uses at probe level; short reset
- Generic action model · Magic-User's Nemesis: spends 1 from expanded:2014:ranger:2014:subclass:ranger:monster-slayer:resource:magic-user-s-nemesis (At 11th level, you gain the ability to thwart someone else's magic. When you see a creature casting a spell or teleporting within 60 feet of you, you can use your reaction to try to magically foil it. The creature must succeed on a Wisdom saving throw against your spell save DC, or its spell or teleport fails and is wasted.)
- Remaining source effects need verification.

### Level 15 · Slayer's Counter

- Remaining source effects need verification.

## Ranger — Swarmkeeper

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/ranger:swarmkeeper)

Source spell progression · level 3 known: Faerie Fire, Mage Hand · level 5 known: Web · level 9 known: Gaseous Form · level 13 known: Arcane Eye · level 17 known: Insect Plague

### Level 3 · Gathered Swarm

- Numeric effects awaiting verification · extra-piercing-damage (One attack hit on own turn; choose damage instead of swarm movement)
- Remaining source effects need verification.

### Level 3 · Swarmkeeper Magic

- Spell grants · Faerie Fire · Mage Hand · Web · Gaseous Form · Arcane Eye · Insect Plague
- Remaining source effects need verification.

### Level 7 · Writhing Tide

- Counters · Writhing Tide; 6 uses at probe level; long reset
- Generic action model · Writhing Tide: spends 1 from expanded:2014:ranger:2014:subclass:ranger:swarmkeeper:resource:writhing-tide (Beginning at 7th level, you can condense part of your swarm into a focused mass that lifts you up. As a bonus action, you gain a flying speed of 10 feet and can hover. This effect lasts for 1 minute or until you are incapacitated. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Numeric effects awaiting verification · fly-speed (Writhing Tide active1minute; hover)
- Remaining source effects need verification.

### Level 11 · Mighty Swarm

- Remaining source effects need verification.

### Level 15 · Swarming Dispersal

- Counters · Swarming Dispersal; 6 uses at probe level; long reset
- Generic action model · Swarming Dispersal: spends 1 from expanded:2014:ranger:2014:subclass:ranger:swarmkeeper:resource:swarming-dispersal (When you reach 15th level, you can discorporate into your swarm, avoiding danger. When you take damage, you can use your reaction to give yourself resistance to that damage. You vanish into your swarm and then teleport to an unoccupied space that you can see within 30 feet of you, where you reappear with the swarm. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

## Ranger — Drakewarden

Entry level 3 · [Fizban's Treasury of Dragons](https://dnd5e.wikidot.com/ranger:drakewarden)

Source spell progression · level 3 known: Thaumaturgy

### Level 3 · Draconic Gift

- Spell grants · Thaumaturgy
- Remaining source effects need verification.

### Level 3 · Drake Companion

- Counters · Drake Companion; 1 uses at probe level; long reset
- Remaining source effects need verification.

### Level 7 · Bond of Fang and Scale

- Remaining source effects need verification.

### Level 11 · Drake’s Breath

- Counters · Drake’s Breath; 1 uses at probe level; long reset
- Generic action model · Drake’s Breath: spends 1 from expanded:2014:ranger:2014:subclass:ranger:drakewarden:resource:drake-breath (At 11th level, as an action, you can exhale a 30-foot cone of damaging breath or cause your drake to exhale it. Choose acid, cold, fire, lightning, or poison damage (your choice doesn’t have to match your drake’s Draconic Essence). Each creature in the cone must make a Dexterity saving throw against your spell save DC, taking 8d6 damage on a failed save, or half as much damage on a successful one. This damage increases to 10d6 when you reach 15th level in this class.)
- Remaining source effects need verification.

### Level 15 · Perfected Bond

- Counters · Perfected Bond; 6 uses at probe level; long reset
- Generic action model · Perfected Bond: spends 1 from expanded:2014:ranger:2014:subclass:ranger:drakewarden:resource:perfected-bond (At 15th level, your bond to your drake reaches the pinnacle of its power. While your drake is summoned, you and the drake gain the following benefits: Large Drake. The drake grows to Large size. When you ride your drake, it is no longer prohibited from using the flying speed of Bond of Fang and Scale. Reflexive Resistance. When either you or the drake takes damage while you’re within 30 feet of each other, you can use your reaction to give yourself or the drake resistance to that instance of damage. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

## Ranger — Drakewarden (UA)

Entry level 3 · [Unearthed Arcana 75 - Subclasses, Part 5](https://dnd5e.wikidot.com/ranger:drakewarden-ua)

Source spell progression · level 3 known: Thaumaturgy

### Level 3 · Draconic Gift

- Training grants · Draconic
- Spell grants · Thaumaturgy
- Remaining source effects need verification.

### Level 3 · Drake Companion

- Counters · Drake Companion; 1 uses at probe level; long reset
- Remaining source effects need verification.

### Level 7 · Bond of Fang and Scale

- Choice controls · Bond of Fang and Scale
- Remaining source effects need verification.

### Level 11 · Drake’s Breath

- Counters · Drake’s Breath; 1 uses at probe level; long reset
- Generic action model · Drake’s Breath: spends 1 from expanded:2014:ranger:2014:subclass:ranger:drakewarden-ua:resource:drake-breath (When you reach 11th-level as an action, you can exhale a 30-foot cone of damaging breath or cause your drake to exhale it. Choose acid, cold, fire, lightning, or poison damage. Each creature in the cone must make a Dexterity saving throw against your spell save DC, taking 6d6 damage on a failed save, or half as much damage on a successful one. This damage increases to 8d6 when you reach 15th level in this class.)
- Remaining source effects need verification.

### Level 15 · Perfected Bond

- Remaining source effects need verification.

## Ranger — Deep Stalker (UA)

Entry level 3 · [Unearthed Arcana 10 - Light, Dark, Underdark!](https://dnd5e.wikidot.com/ranger:deep-stalker-ua)

Source spell progression · level 3 known: Disguise Self · level 5 known: Rope Trick · level 9 known: Glyph of Warding · level 13 known: Greater Invisibility · level 17 known: Seeming

### Level 3 · Underdark Scout

- Remaining source effects need verification.

### Level 3 · Deep Stalker Magic

- Spell grants · Disguise Self · Rope Trick · Glyph of Warding · Greater Invisibility · Seeming
- Numeric effects awaiting verification · darkvision
- Remaining source effects need verification.

### Level 7 · Iron Mind

- Remaining source effects need verification.

### Level 11 · Stalker's Flurry

- Remaining source effects need verification.

### Level 15 · Stalker's Dodge

- Remaining source effects need verification.

## Ranger — Fey Wanderer (UA)

Entry level 3 · [Unearthed Arcana 69 - Subclasses, Part 3](https://dnd5e.wikidot.com/ranger:fey-wanderer-ua)

Source spell progression · level 3 known: Charm Person · level 5 known: Misty Step · level 9 known: Dispel Magic · level 13 known: Banishment · level 17 known: Mislead

### Level 3 · Feywild Gifts

- Remaining source effects need verification.

### Level 3 · Fey Wanderer Magic

- Spell grants · Charm Person · Misty Step · Dispel Magic · Banishment · Mislead
- Remaining source effects need verification.

### Level 3 · Cunning Will

- Choice controls · Cunning Will
- Training grants · {'featureId': '2014:subclass:ranger:fey-wanderer-ua:cunning-will', 'proficiencies': [{'kind': 'skills', 'name': 'Deception', 'index': 'deception'}]}
- Remaining source effects need verification.

### Level 3 · Dreadful Strikes

- Remaining source effects need verification.

### Level 5 · Extra Attack

- Remaining source effects need verification.

### Level 7 · Blessings of the Courts

- Remaining source effects need verification.

### Level 11 · Beguiling Twist

- Remaining source effects need verification.

### Level 15 · Misty Presence

- Counters · Misty Presence; 1 uses at probe level; long reset
- Generic action model · Misty Presence: spends 1 from expanded:2014:ranger:2014:subclass:ranger:fey-wanderer-ua:resource:misty-presence (At 15th level, you can magically remove yourself from one creature’s perception: you gain a bonus action that you can use to force a creature you can see within 30 feet of you to make a Wisdom saving throw against your spell save DC. On a failed save, the target can’t see or hear you for 24 hours. The target can repeat the saving throw at the end of any turn during which you hit it with an attack roll, forced it to make a saving throw, or dealt damage to it. The effect ends early if you use this bonus action again. On a successful save, the target is immune to this feature for 7 days.)
- Remaining source effects need verification.

## Ranger — Monster Slayer (UA)

Entry level 3 · [Unearthed Arcana 35 - A Trio of Subclasses](https://dnd5e.wikidot.com/ranger:monster-slayer-ua)

Source spell progression · level 3 known: Protection from Evil and Good · level 5 known: Zone of Truth · level 9 known: Magic Circle · level 13 known: Banishment · level 17 known: Planar Binding

### Level 3 · Slayer’s Mysticism

- Spell grants · Protection from Evil and Good · Zone of Truth · Magic Circle · Banishment · Planar Binding
- Remaining source effects need verification.

### Level 3 · Slayer’s Eye

- Remaining source effects need verification.

### Level 5 · Extra Attack (Revised Ranger)

- Remaining source effects need verification.

### Level 7 · Supernatural Defense

- Numeric effects awaiting verification · save-bonus (Slayer’s Eye target causes save; UA does not add published grapple escape check)
- Remaining source effects need verification.

### Level 11 · Relentless Slayer

- Remaining source effects need verification.

### Level 15 · Slayer’s Counter

- Remaining source effects need verification.

## Ranger — Primeval Guardian (UA)

Entry level 3 · [Unearthed Arcana 27 - Ranger & Rogue](https://dnd5e.wikidot.com/ranger:primeval-guardian-ua)

Source spell progression · level 3 known: Entangle · level 5 known: Enhance Ability · level 9 known: Conjure Animals · level 13 known: Giant Insect · level 17 known: Insect Plague

### Level 3 · Guardian Magic

- Spell grants · Entangle · Enhance Ability · Conjure Animals · Giant Insect · Insect Plague
- Remaining source effects need verification.

### Level 3 · Guardian Soul

- Numeric effects awaiting verification · speed (Guardian form; retain lower speeds) · reach-bonus (Guardian form) · temporary-hp (Start each turn in Guardian form; vanish at form end)
- Remaining source effects need verification.

### Level 3 · Piercing Thorns

- Numeric effects awaiting verification · weapon-extra-piercing-damage (One hit on own turn)
- Remaining source effects need verification.

### Level 7 · Ancient Fortitude

- Numeric effects awaiting verification · hp-max-and-current-bonus (Entering Guardian form; max reverts on leaving, current stays capped at normal max)
- Remaining source effects need verification.

### Level 11 · Rooted Defense

- Remaining source effects need verification.

### Level 15 · Guardian Aura

- Numeric effects awaiting verification · ally-regeneration (Ally turn starts within30ft Guardian form, below half hp; excludes undead/constructs)
- Remaining source effects need verification.

## Ranger — Swarmkeeper (UA)

Entry level 3 · [Unearthed Arcana 64 - Fighter, Ranger, Rogue](https://dnd5e.wikidot.com/ranger:swarmkeeper-ua)

Source spell progression · level 3 known: Faerie Fire · level 5 known: Web · level 9 known: Gaseous Form · level 13 known: Giant Insect · level 17 known: Insect Plague

### Level 3 · Swarmkeeper Magic

- Spell grants · Faerie Fire · Web · Gaseous Form · Giant Insect · Insect Plague
- Remaining source effects need verification.

### Level 3 · Gathered Swarm

- Counters · Gathered Swarm; 3 uses at probe level; long reset
- Generic action model · Gathered Swarm: spends 1 from expanded:2014:ranger:2014:subclass:ranger:swarmkeeper-ua:resource:gathered-swarm (As a bonus action, you can agitate the swarm for 1 minute. For the duration, some of the swarm clings to your weapons or follows your strikes when you attack: once during each of your turns when you hit a creature with a weapon attack, you can deal an extra 1d6 force damage to that creature, and the swarm moves the creature up to 5 feet toward you or away from you (your choice). At 11th level, the extra damage increases to 2d6. You can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Numeric effects awaiting verification · weapon-extra-force-damage (Gathered Swarm active1minute; once own turn; also5ft movement)
- Remaining source effects need verification.

### Level 7 · Writhing Tide

- Remaining source effects need verification.

### Level 11 · Scuttling Eyes

- Counters · Scuttling Eyes; 1 uses at probe level; long reset
- Generic action model · Scuttling Eyes: spends 1 from expanded:2014:ranger:2014:subclass:ranger:swarmkeeper-ua:resource:scuttling-eyes (At 11th level, as an action, you can magically form one of the spirits of your swarm into the shape of a Tiny beast of your choice. The transformation lasts for 1 hour, at which point the spirit disappears. For the duration, the spirit has a speed of 40 feet, which it can use to walk, climb, fly, or swim. The spirit has your senses and telepathically relays what it sees and hears to you. During your turn, you can speak through the spirit, telepathically command it to move, and it can Hide using your bonus to Dexterity (Stealth) checks. The spirit has AC 18. If it takes damage, you must succeed on a Wisdom saving throw (DC equal to 10, or half the damage dealt, whichever is higher) or the spirit disappears. As an action, you can dismiss the spirit early. If you do, you can magically teleport to an unoccupied space within 5 feet of where the spirit disappeared.)
- Dedicated plans · scuttling-eyes via scuttling-eyes
- Remaining source effects need verification.

### Level 15 · Storm of Minions

- Counters · Storm of Minions; 1 uses at probe level; long reset
- Remaining source effects need verification.

## Rogue — Arcane Trickster

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/rogue:arcane-trickster)

Source spell progression · level 3 known: Mage Hand

### Level 3 · Spellcasting

- Spell grants · Mage Hand
- Remaining source effects need verification.

### Level 3 · Mage Hand Legerdemain

- Remaining source effects need verification.

### Level 9 · Magical Ambush

- Remaining source effects need verification.

### Level 13 · Versatile Trickster

- Remaining source effects need verification.

### Level 17 · Spell Thief

- Counters · Spell Thief; 1 uses at probe level; long reset
- Generic action model · Spell Thief: spends 1 from expanded:2014:rogue:2014:subclass:rogue:arcane-trickster:resource:spell-thief (Immediately after a creature casts a spell that targets you or includes you in its area of effect, you can use your reaction to force the creature to make a saving throw with its spellcasting ability modifier. The DC equals your spell save DC. On a failed save, you negate the spell's effect against you, and you steal the knowledge of the spell if it is at least 1st level and of a level you can cast (it doesn't need to be a wizard spell). For the next 8 hours, you know the spell and can cast it using your spell slots. The creature can't cast that spell until the 8 hours have passed.)
- Remaining source effects need verification.

## Rogue — Assassin

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/rogue:assassin)

### Level 3 · Bonus Proficiencies

- Training grants · {'featureId': '2014:subclass:rogue:assassin:bonus-proficiencies', 'proficiencies': [{'kind': 'tools', 'name': 'disguise kit', 'index': 'disguisekit'}]} · {'featureId': '2014:subclass:rogue:assassin:bonus-proficiencies', 'proficiencies': [{'kind': 'tools', 'name': "poisoner's kit", 'index': 'poisonerskit'}]}
- Remaining source effects need verification.

### Level 3 · Assassinate

- Remaining source effects need verification.

### Level 9 · Infiltration Expertise

- Remaining source effects need verification.

### Level 13 · Impostor

- Remaining source effects need verification.

### Level 17 · Death Strike

- Remaining source effects need verification.

## Rogue — Inquisitive

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/rogue:inquisitive)

### Level 3 · Ear for Deceit

- Numeric effects awaiting verification · insight-die-minimum (Insight to determine lying; treat d20<=7 as8)
- Remaining source effects need verification.

### Level 3 · Eye for Detail

- Remaining source effects need verification.

### Level 3 · Insightful Fighting

- Remaining source effects need verification.

### Level 9 · Steady Eye

- Remaining source effects need verification.

### Level 13 · Unerring Eye

- Counters · Unerring Eye; 3 uses at probe level; long reset
- Generic action model · Unerring Eye: spends 1 from expanded:2014:rogue:2014:subclass:rogue:inquisitive:resource:unerring-eye (At 13th level, your senses are almost impossible to foil. As an action, you sense the presence of illusions, shapechangers not in their original form, and other magic designed to deceive the senses within 30 feet of you, provided you aren't blinded or deafened. You sense that an effect is attempting to trick you, but you gain no insight into what is hidden or into its true nature. You can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses of it when you finish a long rest.)
- Remaining source effects need verification.

### Level 17 · Eye for Weakness

- Numeric effects awaiting verification · sneak-attack-extra-damage (Insightful Fighting applies to target)
- Remaining source effects need verification.

## Rogue — Mastermind

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/rogue:mastermind)

### Level 3 · Master of Intrigue

- Choice controls · Master of Intrigue
- Training grants · {'featureId': '2014:subclass:rogue:mastermind:master-of-intrigue', 'proficiencies': [{'kind': 'tools', 'name': 'disguise kit', 'index': 'disguisekit'}]} · {'featureId': '2014:subclass:rogue:mastermind:master-of-intrigue', 'proficiencies': [{'kind': 'tools', 'name': 'forgery kit', 'index': 'forgerykit'}]} · {'featureId': '2014:subclass:rogue:mastermind:master-of-intrigue', 'proficiencies': [{'kind': 'tools', 'name': 'Dice set', 'index': 'diceset'}]} · Common · Dwarvish
- Remaining source effects need verification.

### Level 3 · Master of Tactics

- Remaining source effects need verification.

### Level 9 · Insightful Manipulator

- Remaining source effects need verification.

### Level 13 · Misdirection

- Remaining source effects need verification.

### Level 17 · Soul of Deceit

- Remaining source effects need verification.

## Rogue — Phantom

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/rogue:phantom)

### Level 3 · Whispers of the Dead

- Remaining source effects need verification.

### Level 3 · Wails from the Grave

- Counters · Wails from the Grave; 6 uses at probe level; long reset
- Generic action model · Wails from the Grave: spends 1 from expanded:2014:rogue:2014:subclass:rogue:phantom:resource:wails-from-the-grave (Immediately after own-turn Sneak Attack; visible second creature within30ft first; roll ceil(SneakAttackDice/2)d6 necrotic. At17 damage both first and second. At9 optional soul trinket instead of use.)
- Dedicated plans · wails-from-grave via wails-from-grave (Immediately after own-turn Sneak Attack; visible second creature within30ft first; roll ceil(SneakAttackDice/2)d6 necrotic. At17 damage both first and second. At9 optional soul trinket instead of use.)
- Remaining source effects need verification.

### Level 9 · Tokens of the Departed

- Counters · Tokens of the Departed; 6 uses at probe level; none reset
- Remaining source effects need verification.

### Level 13 · Ghost Walk

- Counters · Ghost Walk; 1 uses at probe level; long reset
- Generic action model · Ghost Walk: spends 1 from expanded:2014:rogue:2014:subclass:rogue:phantom:resource:ghost-walk (At 13th level, you can phase partially into the realm of the dead, becoming like a ghost. As a bonus action, you assume a spectral form. While in this form, you have a flying speed of 10 feet, you can hover, and attack rolls have disadvantage against you. You can also move through creatures and objects as if they were difficult terrain, but you take 1d10 force damage if you end your turn inside a creature or an object. You stay in this form for 10 minutes or until you end it as a bonus action. To use this feature again, you must finish a long rest or destroy one of your soul trinkets as part of the bonus action you use to activate Ghost Walk.)
- Dedicated plans · ghost-walk via ghost-walk
- Remaining source effects need verification.

### Level 17 · Death's Friend

- Remaining source effects need verification.

## Rogue — Scout

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/rogue:scout)

### Level 3 · Skirmisher

- Remaining source effects need verification.

### Level 3 · Survivalist

- Training grants · {'featureId': '2014:subclass:rogue:scout:survivalist', 'proficiencies': [{'kind': 'skills', 'name': 'Nature', 'index': 'nature'}]} · {'featureId': '2014:subclass:rogue:scout:survivalist', 'proficiencies': [{'kind': 'skills', 'name': 'Survival', 'index': 'survival'}]}
- Recognized numeric routes · expertise (Also fixed proficiency in these skills if lacking)
- Remaining source effects need verification.

### Level 9 · Superior Mobility

- Recognized numeric routes · speed-bonus (Walking, and existing climb/swim speeds)
- Remaining source effects need verification.

### Level 13 · Ambush Master

- Recognized numeric routes · initiative-advantage
- Remaining source effects need verification.

### Level 17 · Sudden Strike

- Remaining source effects need verification.

## Rogue — Soulknife

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/rogue:soulknife)

### Level 3 · Psionic Power

- Counters · Psionic Power; 12 uses at probe level; long reset · Recover one Psionic Energy die; 1 uses at probe level; short reset · Psychic Whispers free use; 1 uses at probe level; long reset
- Remaining source effects need verification.

### Level 3 · Psychic Blades

- Generic action model · Psychic Blade Attack: separate roll 1d20+9, 1d6+3 (Attack action; free hand; simple finesse thrown weapon,60ft normal range no long range.) · Second Psychic Blade: separate roll 1d20+9, 1d4+3 (Attacked with Psychic Blade this turn; other hand free.)
- Dedicated plans · psychic-blade via psychic-blade (Attack action; free hand; simple finesse thrown weapon,60ft normal range no long range.) · psychic-blade-offhand via psychic-blade-offhand (Attacked with Psychic Blade this turn; other hand free.)
- Remaining source effects need verification.

### Level 9 · Soul Blades

- Remaining source effects need verification.

### Level 13 · Psychic Veil

- Counters · Psychic Veil; 1 uses at probe level; long reset
- Generic action model · Psychic Veil: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife:resource:psychic-veil (At 13th level, you can weave a veil of psychic static to mask yourself. As an action, you can magically become invisible, along with anything you are wearing or carrying, for 1 hour or until you dismiss this effect (no action required). This invisibility ends early immediately after you deal damage to a creature, or you force a creature to make a saving throw.)
- Remaining source effects need verification.

### Level 17 · Rend Mind

- Counters · Rend Mind; 1 uses at probe level; long reset
- Generic action model · Rend Mind: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife:resource:rend-mind (When you reach 17th level, you can sweep your Psychic Blade directly through a creature's mind. When you use your Psychic Blades to deal Sneak Attack damage to a creature, you can force that target to make a Wisdom saving throw (DC equal to 8 + your proficiency bonus + your Dexterity modifier). If the save fails, the target is stunned for 1 minute. The stunned target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.)
- Remaining source effects need verification.

## Rogue — Swashbuckler

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/rogue:swashbuckler)

### Level 3 · Fancy Footwork

- Remaining source effects need verification.

### Level 3 · Rakish Audacity

- Recognized numeric routes · initiative
- Remaining source effects need verification.

### Level 9 · Panache

- Remaining source effects need verification.

### Level 13 · Elegant Maneuver

- Remaining source effects need verification.

### Level 17 · Master Duelist

- Counters · Master Duelist; 1 uses at probe level; short reset
- Generic action model · Master Duelist: spends 1 from expanded:2014:rogue:2014:subclass:rogue:swashbuckler:resource:master-duelist
- Remaining source effects need verification.

## Rogue — Thief

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/rogue:thief)

### Level 3 · Fast Hands

- Remaining source effects need verification.

### Level 3 · Second-Story Work

- Numeric effects awaiting verification · climb-extra-movement-cost · running-jump-distance-bonus
- Remaining source effects need verification.

### Level 9 · Supreme Sneak

- Remaining source effects need verification.

### Level 13 · Use Magic Device

- Remaining source effects need verification.

### Level 17 · Thief's Reflexes

- Numeric effects awaiting verification · first-round-second-turn-initiative (Only first combat round; no extra turn if surprised)
- Remaining source effects need verification.

## Rogue — Phantom (UA)

Entry level 3 · [Unearthed Arcana 72 - Subclasses Revisited](https://dnd5e.wikidot.com/rogue:phantom-ua)

### Level 3 · Whispers of the Dead

- Remaining source effects need verification.

### Level 3 · Wails from the Grave

- Counters · Wails from the Grave; 6 uses at probe level; long reset
- Generic action model · Wails from the Grave: spends 1 from expanded:2014:rogue:2014:subclass:rogue:phantom-ua:resource:wails-from-the-grave (Immediately after own-turn Sneak Attack; visible second creature within30ft first; roll ceil(SneakAttackDice/2)d6 necrotic. UA17 Death Knell affects additional damage; see source.)
- Dedicated plans · wails-from-grave via wails-from-grave (Immediately after own-turn Sneak Attack; visible second creature within30ft first; roll ceil(SneakAttackDice/2)d6 necrotic. UA17 Death Knell affects additional damage; see source.)
- Remaining source effects need verification.

### Level 9 · Tokens of the Departed

- Counters · Tokens of the Departed; 6 uses at probe level; none reset
- Remaining source effects need verification.

### Level 13 · Ghost Walk

- Counters · Ghost Walk; 1 uses at probe level; long reset
- Generic action model · Ghost Walk: spends 1 from expanded:2014:rogue:2014:subclass:rogue:phantom-ua:resource:ghost-walk (At 13th level, you can now phase partially into the realm of the dead, becoming like a ghost. As a bonus action, you assume a spectral form. While in this form, you have a flying speed of 10 feet, you can hover, and attack rolls have disadvantage against you. You can also move through creatures and objects as if they were difficult terrain, but you take 1d10 force damage if you end your turn inside a creature or an object. You stay in this form for 10 minutes or until you end it as a bonus action. To use this feature again, you must finish a long rest or destroy one of your soul trinkets as part of the bonus action you use to activate Ghost Walk.)
- Dedicated plans · ghost-walk via ghost-walk
- Remaining source effects need verification.

### Level 17 · Death Knell

- Remaining source effects need verification.

## Rogue — Revived (UA)

Entry level 3 · [Unearthed Arcana 64 - Fighter, Ranger, Rogue](https://dnd5e.wikidot.com/rogue:revived-ua)

### Level 3 · Tokens of Past Lives

- Remaining source effects need verification.

### Level 3 · Revived Nature

- Remaining source effects need verification.

### Level 3 · Bolts from the Grave

- Remaining source effects need verification.

### Level 9 · Connect with the Dead

- Counters · Connect with the Dead; 1 uses at probe level; short reset
- Generic action model · Connect with the Dead: spends 1 from expanded:2014:rogue:2014:subclass:rogue:revived-ua:resource:connect-with-the-dead (At 9th level, you can create a link with a spirit through their corpse. When you do so, you cast the Speak with Dead spell, without using a spell slot or material components. Intelligence is your spellcasting ability for this spell. Speaking with the dead in this way temporarily gives you a capability from a past life-you're unsure whether its from your past life or the spirit's. When the spell ends, you gain one random benefit from the Revived Capabilities table. These benefits last until you finish a short or long rest.)
- Remaining source effects need verification.

### Level 13 · Audience with Death

- Remaining source effects need verification.

### Level 17 · Ethereal Jaunt

- Remaining source effects need verification.

## Rogue — Soulknife (2019) (UA)

Entry level 3 · [Unearthed Arcana 66 - Fighter, Rogue, Wizard](https://dnd5e.wikidot.com/rogue:soulknife-ua)

### Level 3 · Psychic Blade

- Remaining source effects need verification.

### Level 3 · Psionic Enhancement

- Numeric effects awaiting verification · hp-max-and-current-bonus (HP option selected after long rest) · speed-bonus (Speed option selected after long rest)
- Remaining source effects need verification.

### Level 9 · Terrifying Blade

- Remaining source effects need verification.

### Level 13 · Psychic Veil

- Counters · Psychic Veil; 3 uses at probe level; long reset
- Generic action model · Psychic Veil: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife-ua:resource:psychic-veil (Starting at 13th level, you can weave a veil of psionic static to mask your physical presence. As an action, you can magically become invisible, along with anything you are wearing or carrying, for 10 minutes. This invisibility ends if you make an attack or if you force a creature to make a saving throw. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 17 · Rend Mind

- Counters · Rend Mind; 3 uses at probe level; long reset
- Generic action model · Rend Mind: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife-ua:resource:rend-mind (Starting at 17th level, you can sweep your Psychic Blade directly through a creature's mind. As an action while you have at least one Psychic Blade manifested, you can force a creature you can see within 30 feet of you to make an Intelligence saving throw (DC equal to 10 + your proficiency bonus + your Intelligence modifier). If you are hidden from the target, it has disadvantage on the save. On a failed save, the target takes 12d6 psychic damage, and it is stunned until the start of your next turn. On a successful save, the target takes half as much damage and isn't stunned. One of your Psychic Blades vanishes after using this feature. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

## Rogue — Soulknife (2020) (UA)

Entry level 3 · [Unearthed Arcana 71 - Psionic Options Revisited](https://dnd5e.wikidot.com/rogue:soulknife-revisited-ua)

### Level 3 · Psionic Talent

- Counters · Psionic Talent; 1 uses at probe level; long reset
- Remaining source effects need verification.

### Level 3 · Psi Replenishment.

- Counters · Psi Replenishment.; 1 uses at probe level; long reset
- Generic action model · Psi Replenishment.: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife-revisited-ua:resource:psi-replenishment
- Remaining source effects need verification.

### Level 3 · Psychic Blades

- Generic action model · Psychic Blade Attack: separate roll 1d20+9, 1d6+3 (Attack action; free hand; simple finesse thrown weapon,60ft normal range no long range.) · Second Psychic Blade: separate roll 1d20+9, 1d4+3 (Attacked with Psychic Blade this turn; other hand free.)
- Dedicated plans · psychic-blade via psychic-blade (Attack action; free hand; simple finesse thrown weapon,60ft normal range no long range.) · psychic-blade-offhand via psychic-blade-offhand (Attacked with Psychic Blade this turn; other hand free.)
- Remaining source effects need verification.

### Level 9 · Soul Blades

- Remaining source effects need verification.

### Level 13 · Psionic Veil

- Counters · Psionic Veil; 1 uses at probe level; long reset
- Generic action model · Psionic Veil: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife-revisited-ua:resource:psionic-veil (When you reach 13th-level, you can weave a veil of psychic static to mask yourself. As an action, you can magically become invisible, along with anything you are wearing or carrying, for 10 minutes or until you dismiss this effect (no action required). This invisibility ends if you deal damage to a creature or if you force a creature to make a saving throw.)
- Remaining source effects need verification.

### Level 17 · Rend Mind

- Counters · Rend Mind; 1 uses at probe level; long reset
- Generic action model · Rend Mind: spends 1 from expanded:2014:rogue:2014:subclass:rogue:soulknife-revisited-ua:resource:rend-mind (By 17th-level, you can sweep your Psychic Blades directly through a creature’s mind. When you use your Psychic Blades to deal Sneak Attack damage to a creature, you can force that target to make a Wisdom saving throw (DC equal to 8 + your proficiency bonus + your Dexterity modifier). Unless the save succeeds, the target is stunned until the end of your next turn.)
- Remaining source effects need verification.

## Sorcerer — Aberrant Mind

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/sorcerer:aberrant-mind)

Source spell progression · level 1 known: Arms of Hadar, Dissonant Whispers, Mind Sliver · level 3 known: Calm Emotions, Detect Thoughts · level 5 known: Hunger of Hadar, Sending · level 7 known: Evard's Black Tentacles, Summon Aberration · level 9 known: Rary's Telepathic Bond, Telekinesis

### Level 1 · Psionic Spells

Source-known grants outside quota.

- Generic action model · Psionic Spells: source rules or unverified dedicated path (Starting at 1st level, you learn additional spells when you reach certain levels in this class, as shown on the Psionic Spells table. Each of these spells counts as a sorcerer spell for you, but it doesn't count against the number of sorcerer spells you know. Whenever you gain a sorcerer level, you can replace one spell you gained from this feature with another spell of the same level. The new spell must be a divination or an enchantment spell from the sorcerer, warlock, or wizard spell list.)
- Open sheet gap · Published eligible spell replacements and real sheet ownership through swaps need confirmation beyond saved declarations.

### Level 1 · Telepathic Speech

Source rules.

- Generic action model · Telepathic Speech: source rules or unverified dedicated path (Starting at 1st level, you can form a telepathic connection between your mind and the mind of another. As a bonus action, choose one creature you can see within 30 feet of you. You and the chosen creature can speak telepathically with each other while the two of you are within a number of miles of each other equal to your Charisma modifier (minimum of 1 mile). To understand each other, you each must speak mentally in a language the other knows. The telepathic connection lasts for a number of minutes equal to your sorcerer level. It ends early if you are incapacitated or die or if you use this ability to form a connection with a different creature.)
- Table fact · Confirm selected creature/range/common-language choice and whether link continues.

### Level 6 · Psionic Sorcery

- Generic action model · Psionic Sorcery: source rules or unverified dedicated path (Beginning at 6th level, when you cast any spell of 1st level or higher from your Psionic Spells feature, you can cast it by expending a spell slot as normal or by spending a number of sorcery points equal to the spell's level. If you cast the spell using sorcery points, it requires no verbal or somatic components, and it requires no material components, unless they are consumed by the spell.)
- Table fact · Confirm the spell comes from the source list and material component exception.
- Open sheet gap · No paid Sorcery-Point cast from subclass spell list or components override.

### Level 6 · Psychic Defenses

Typed incoming psychic resistance.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · save-advantage
- Table fact · Confirm the save is against charmed/frightened.
- Open sheet gap · No contextual save advantage.

### Level 14 · Revelation in Flesh

- Choice controls · revelation-benefits (activation)
- Generic action model · Revelation in Flesh: source rules or unverified dedicated path (Beginning at 14th level, you can unleash the aberrant truth hidden within yourself. As a bonus action, you can spend 1 or more sorcery points to magically transform your body for 10 minutes. For each sorcery point you spend, you can gain one of the following benefits of your choice, the effects of which last until the transformation ends: - Your body, along with any equipment you are wearing or carrying, becomes slimy and pliable. You can move through any space as narrow as 1 inch without squeezing, and you can spend 5 feet of movement to escape from nonmagical restraints or being grappled.)
- Table fact · Confirm chosen movement, position/space and applicable sensory rules.
- Open sheet gap · No point-cost selected own states/speeds.

### Level 18 · Warping Implosion

Generic use.

- Counters · Warping Implosion; 1 uses at probe level; long reset verified
- Generic action model · Warping Implosion: spends 5 from 2014:Sorcerer:points (At 18th level, you can unleash your aberrant power as a space-warping anomaly. As an action, you can teleport to an unoccupied space you can see within 120 feet of you. Immediately after you disappear, each creature within 30 feet of the space you left must make a Strength saving throw against your spell save DC. On a failed save, a creature takes 3d10 force damage and is pulled straight toward the space you left, ending in an unoccupied space as close to your former space as possible. On a successful save, the creature takes half as much damage and isn't pulled.)
- Table fact · Confirm teleport placement, proximity, targets and Strength saves.
- Open sheet gap · Real points alternate recharge and own movement are reference.

## Sorcerer — Clockwork Soul

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/sorcerer:clockwork-soul)

Source spell progression · level 1 known: Alarm, Protection from Evil and Good · level 3 known: Aid, Lesser Restoration · level 5 known: Dispel Magic, Protection from Energy · level 7 known: Freedom of Movement, Summon Construct · level 9 known: Greater Restoration, Wall of Force

### Level 1 · Clockwork Magic

Source-known grants outside quota and source spell selection declaration.

- Generic action model · Clockwork Magic: source rules or unverified dedicated path (You learn additional spells when you reach certain levels in this class, as shown on the Clockwork Spells table. Each spell counts as a sorcerer spell for you, but it doesn’t count against the number of sorcerer spells you know. Whenever you gain a sorcerer level, you can replace one spell you gained from this feature with another spell of the same level. The new spell must be an abjuration or a transmutation spell from the sorcerer, warlock, or wizard spell list. In addition, consult the Manifestations of Order table and choose or randomly determine a way your connection to order manifests while you are casting any of your sorcerer spells.)
- Open sheet gap · Check published replacement workflow consumes legal school/class substitutions, rather than static grants only.

### Level 1 · Restore Balance

Generic use count.

- Counters · Restore Balance; 2 uses at probe level; long reset verified
- Generic action model · Restore Balance: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:clockwork-soul:resource:restore-balance (Starting at 1st level, your connection to the plane of absolute order allows you to equalize chaotic moments. When a creature you can see within 60 feet of you is about to roll a d20 with advantage or disadvantage, you can use your reaction to prevent the roll from being affected by advantage and disadvantage. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm visible creature starting advantage/disadvantage roll and whether reaction used.
- Open sheet gap · No canceling own roll's advantage/disadvantage through actual roll call.

### Level 6 · Bastion of Law

Dedicated points→self/other ward dice, consume d8, subtract before typed damage, self HP/temp pools via real incoming-damage helper; long rest or used-up state cleanup.

- Dedicated plans · bastion-of-law via useHealingFeature
- Table fact · Confirm target, ward reaction, chosen dice, raw damage and type; external ward target HP handled at table.

### Level 14 · Trance of Order

Generic rest use.

- Counters · Trance of Order; 1 uses at probe level; long reset verified
- Generic action model · Trance of Order: spends 5 from 2014:Sorcerer:points (Starting at 14th level, you gain the ability to align your consciousness to the endless calculations of Mechanus. As a bonus action, you can enter this state for 1 minute. For the duration, attack rolls against you can't benefit from advantage, and whenever you make an attack roll, an ability check, or a saving throw, you can treat a roll of 9 or lower on the d20 as a 10.)
- Table fact · Confirm targets, distance/order-cube choices, spell levels, restore/distribute HP or repairs.
- Open sheet gap · No Trance floor/incoming-advantage safeguard or Cavalcade self HP and spell cleanup; no point alternative.

### Level 18 · Clockwork Cavalcade

Generic rest use.

- Counters · Clockwork Cavalcade; 1 uses at probe level; long reset verified
- Generic action model · Clockwork Cavalcade: spends 7 from 2014:Sorcerer:points (At 18th level, you summon spirits of order to expunge disorder around you. As an action, you summon the spirits in a 30-foot cube originating from you. The spirits look like modrons or other constructs of your choice. The spirits are intangible and invulnerable, and they create the following effects within the cube before vanishing:)
- Table fact · Confirm targets, distance/order-cube choices, spell levels, restore/distribute HP or repairs.
- Open sheet gap · No Trance floor/incoming-advantage safeguard or Cavalcade self HP and spell cleanup; no point alternative.

## Sorcerer — Draconic Bloodline

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/sorcerer:draconic-bloodline)

### Level 1 · Dragon Ancestor

Persisted ancestor choice and Draconic training.

- Choice controls · dragon-ancestor (advancement)
- Generic action model · Dragon Ancestor: source rules or unverified dedicated path (You can speak, read, and write Draconic. Additionally, whenever you make a Charisma check when interacting with dragons, your proficiency bonus is doubled if it applies to the check.)
- Table fact · Confirm ancestry and Charisma check interacts with an eligible dragon.
- Open sheet gap · No doubled own check proficiency on dragon context.

### Level 1 · Draconic Resilience

Actual 13+Dex unarmored AC and owner Sorcerer-level HP increase; creation/advancement/source swap test preserves base HP/caps.

- Recognized numeric routes · ac (Not wearing armor) · hp-max-bonus
- Table fact · Confirm armor.

### Level 6 · Elemental Affinity

Generic 1-point cost.

- Generic action model · Elemental Affinity: spends 1 from 2014:Sorcerer:points (Starting at 6th level, when you cast a spell that deals damage of the type associated with your draconic ancestry, add your Charisma modifier to one damage roll of that spell. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour.)
- Numeric effects awaiting verification · spell-damage-bonus (One roll of spell dealing selected dragon ancestor damage type)
- Table fact · Confirm selected ancestral damage type, triggering spell and one eligible roll.
- Open sheet gap · No one-roll Cha spell modifier or timed typed resistance from cost.

### Level 14 · Dragon Wings

Generic points where present.

- Generic action model · Dragon Wings: source rules or unverified dedicated path (At 14th level, you gain the ability to sprout a pair of dragon wings from your back, gaining a flying speed equal to your current speed. You can create these wings as a bonus action on your turn. They last until you dismiss them as a bonus action on your turn. You can't manifest your wings while wearing armor unless the armor is made to accommodate them, and clothing not made to accommodate your wings might be destroyed when you manifest them.)
- Table fact · Confirm compatible armor, positions and targets/Wis saves, concentration.
- Open sheet gap · No flight state, or source concentration/aura runtime.

### Level 18 · Draconic Presence

Generic points where present.

- Generic action model · Draconic Presence: spends 5 from 2014:Sorcerer:points (Beginning at 18th level, you can channel the dread presence of your dragon ancestor, causing those around you to become awestruck or frightened. As an action, you can spend 5 sorcery points to draw on this power and exude an aura of awe or fear (your choice) to a distance of 60 feet. For 1 minute or until you lose your concentration (as if you were casting a concentration spell), each hostile creature that starts its turn in this aura must succeed on a Wisdom saving throw or be charmed (if you chose awe) or frightened (if you chose fear) until the aura ends. A creature that succeeds on this saving throw is immune to your aura for 24 hours.)
- Table fact · Confirm compatible armor, positions and targets/Wis saves, concentration.
- Open sheet gap · No flight state, or source concentration/aura runtime.

## Sorcerer — Divine Soul

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/sorcerer:divine-soul)

### Level 1 · Divine Magic

Ordinary Cleric spell access for target Sorcerer choice and source alignment-known spell grant where shown.

- Choice controls · divine-affinity (advancement)
- Generic action model · Divine Magic: source rules or unverified dedicated path (Your link to the divine allows you to learn spells normally associated with the cleric class. When your Spellcasting feature lets you learn a sorcerer cantrip or a sorcerer spell of 1st level or higher, you can choose the new spell from the cleric spell list or the sorcerer spell list. You must otherwise obey all the restrictions for selecting the spell, and it becomes a sorcerer spell for you. In addition, choose an affinity for the source of your divine power: good, evil, law, chaos, or neutrality. You learn an additional spell based on that affinity, as shown below. It is a sorcerer spell for you, but it doesn't count against your number of sorcerer spells known. If you later replace this spell, you must replace it with a spell from the cleric spell list.)
- Table fact · Confirm source selection.

### Level 1 · Favored by the Gods

Dedicated confirmed trigger, actual visible 2d4 and shared short/long use spend; result is displayed.

- Counters · Favored by the Gods; 1 uses at probe level; short reset verified
- Dedicated plans · favored-by-gods via executeTriggeredFeature / executeConditionalAction (Use after fail save or miss attack, potentially change outcome; no reaction stated.)
- Table fact · Confirm failed save or missed attack and adjudicate adjusted total.
- Open sheet gap · Existing result not linked to active attack/save rerender/outcome.

### Level 6 · Empowered Healing

Dedicated point spend after confirmed trigger where routed.

- Dedicated plans · empowered-healing via executeTriggeredFeature / executeConditionalAction (You or ally within5ft rolls spell healing; not incapacitated; once/turn. Reroll any number of those healing dice once.)
- Table fact · Confirm nearby eligible healing roll and die choice.
- Open sheet gap · No actual owner healing die reroll or recompute self healing.

### Level 14 · Angelic Form

- Generic action model · Angelic Form: source rules or unverified dedicated path (Starting at 14th level, you can use a bonus action to manifest a pair of spectral wings from your back. While the wings are present, you have a flying speed of 30 feet. The wings last until you're incapacitated, you die, or you dismiss them as a bonus action.)
- Numeric effects awaiting verification · fly-speed (Spectral wings active)
- Table fact · Confirm presentation and flight positioning.
- Open sheet gap · No spectral wings active state affecting movement.

### Level 18 · Unearthly Recovery

Dedicated trigger metadata routes through generic executeTriggeredFeature; use/visible result if any.

- Counters · Unearthly Recovery; 1 uses at probe level; long reset verified
- Dedicated plans · unearthly-recovery via executeTriggeredFeature / executeConditionalAction (Current hp below half maximum; regain floor(maxHP/2).)
- Table fact · Confirm HP below half and bonus action.
- Open sheet gap · Missing actual capped restoration of half max HP to self.

## Sorcerer — Lunar Sorcery

Entry level 1 · [Dragonlance: Shadow of the Dragon Queen](https://dnd5e.wikidot.com/sorcerer:lunar-sorcery)

Source spell progression · level 1 known: Sacred Flame, Shield, Ray of Sickness, Color Spray · level 3 known: Lesser Restoration, Blindness/Deafness, Alter Self · level 5 known: Dispel Magic, Vampiric Touch, Phantom Steed · level 7 known: Death Ward, Confusion, Hallucinatory Terrain · level 9 known: Rary's Telepathic Bond, Hold Monster, Mislead

### Level 1 · Lunar Embodiment

Lunar phase choices and authored phase-specific spell grants may reconcile.

- Choice controls · lunar-phase (rest)
- Counters · Lunar Embodiment; 1 uses at probe level; long reset verified
- Generic action model · Lunar Embodiment: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:lunar-sorcery:resource:lunar-first-level-free (You learn additional spells when you reach certain levels in this class, as shown on the Lunar Spells table. Each of these spells counts as a sorcerer spell for you, but it doesn’t count against the number of sorcerer spells you know. Whenever you finish a long rest, you can choose what lunar phase manifests its power through your magic: Full Moon, New Moon, or Crescent Moon. While in the chosen phase, you can cast one 1st-level spell of the associated phase in the Lunar Spells table once without expending a spell slot. Once you cast a spell in this way, you can’t do so again until you finish a long rest.)
- Table fact · Confirm phase choice and casting requirements.
- Open sheet gap · Check free spell actual phase-specific cast, and use reset after changing phase, before claiming automation.

### Level 1 · Moon Fire

Source-known Sacred Flame.

- Generic action model · Moon Fire: source rules or unverified dedicated path (Starting at 1st level, you can call down the radiant light of the moon on command. You learn the Sacred Flame spell, which doesn’t count against the number of sorcerer cantrips you know. When you cast the spell, you can target one creature as normal or target two creatures within range that are within 5 feet of each other.)
- Table fact · Confirm second eligible target and adjacency, separate saves.

### Level 6 · Lunar Boons

Generic resource use where present.

- Counters · Lunar Boons; 3 uses at probe level; long reset verified
- Generic action model · Lunar Boons: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:lunar-sorcery:resource:lunar-boons (Whenever you use Metamagic on a spell of a school of magic associated with your current Lunar Embodiment phase, you can reduce the sorcery points spent by 1 (minimum 0). You can reduce the sorcery points spent for your Metamagic a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest)
- Table fact · Confirm phase and applicable spell and Metamagic.
- Open sheet gap · No qualifying Metamagic discount tied to cast or paid mid-rest switch flowing into active bonuses.

### Level 6 · Waxing and Waning

Generic resource use where present.

- Counters · Waxing and Waning; 1 uses at probe level; long reset verified
- Generic action model · Waxing and Waning: spends 1 from 2014:Sorcerer:points (Starting at 6th level, you gain greater control over the phases of your lunar magic. As a bonus action, you can spend 1 sorcery point to change your current Lunar Embodiment phase for a different one.)
- Table fact · Confirm phase and applicable spell and Metamagic.
- Open sheet gap · No qualifying Metamagic discount tied to cast or paid mid-rest switch flowing into active bonuses.

### Level 14 · Lunar Empowerment

Generic use where present.

- Generic action model · Lunar Empowerment: source rules or unverified dedicated path (Starting at 14th level, the power of a lunar phase saturates your being. While you are in a Lunar Embodiment phase, you also gain the following benefit associated with that phase: - Full Moon: You can use a bonus action to shed bright light in a 10-foot radius and dim light for an additional 10 feet or to douse the light. In addition, you and creatures of your choice have advantage on Intelligence (Investigation) and Wisdom (Perception) checks while within the bright light you shed. - New Moon: You have advantage on Dexterity (Stealth) checks. In addition, while you are entirely in darkness, attack rolls have disadvantage against you.)
- Numeric effects awaiting verification · resistance (Current phase Crescent Moon) · skill-advantage (Current phase New Moon) · incoming-attack-disadvantage (Current phase New Moon; entirely in darkness)
- Table fact · Confirm phase, positions and external targets/saves.
- Open sheet gap · Phase resistance/check advantage/hostile attack disadvantage and own healing/teleport lack dedicated handlers.

### Level 18 · Lunar Phenomenon

Generic use where present.

- Counters · Full Moon phenomenon; 1 uses at probe level; long reset verified · New Moon phenomenon; 1 uses at probe level; long reset verified · Crescent Moon phenomenon; 1 uses at probe level; long reset verified
- Generic action model · Lunar Phenomenon: spends 5 from 2014:Sorcerer:points (At 18th level, as a bonus action, you can tap into a special power of your current Lunar Embodiment phase. Alternatively, as part of the bonus action you take to change your lunar phase using the Waxing and Waning feature, you can immediately use the power of the lunar phase you are entering: - Full Moon: You radiate moonlight for a moment. Each creature of your choice within 30 feet of you must succeed on a Constitution saving throw against your spell save DC or be blinded until the end of its next turn. In addition, one creature of your choice in that area regains 3d8 hit points. - New Moon: You momentarily emanate gloom. Each creature of your choice within 30 feet of you must succeed on a Dexterity saving throw against your spell save DC or take 3d10 necrotic damage and have its speed reduced to 0 until the end of its next turn. In addition, you become invisible until the end of your next turn, or until immediately after you make an attack or cast a spell.)
- Table fact · Confirm phase, positions and external targets/saves.
- Open sheet gap · Phase resistance/check advantage/hostile attack disadvantage and own healing/teleport lack dedicated handlers.

## Sorcerer — Shadow Magic

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/sorcerer:shadow-magic)

Source spell progression · level 3 known: Darkness

### Level 1 · Shadow Sorcerer Quirks

Source roleplay reference.

- Table fact · Select or roll a quirk and roleplay it.

### Level 1 · Eyes of the Dark

Dedicated Darkness using 2 points published at owner 3 or 1 point UA at owner 1, with concentration and visible spell effects.

- Numeric effects awaiting verification · darkvision
- Table fact · Confirm darkvision conditions, map geometry and eligible targets.
- Open sheet gap · Own darkvision and can-see-through source Darkness are reference.

### Level 1 · Strength of the Grave

- Counters · Strength of the Grave; 1 uses at probe level; long reset verified
- Table fact · Confirm not critical/radiant, nonlethal and source recovery.
- Open sheet gap · No zero-HP trigger/Cha save and 1HP survival mutation.

### Level 6 · Hound of Ill Omen

Dedicated multiple independent 3-point pets; target/range confirmation, typed profile (published monstrosity + creation-only half owner-level temp HP vs UA beast), own attacks/saves/conditions/HP/lifecycle and true reload. C2 actual test.

- Dedicated plans · summon-hound via executeTriggeredFeature / executeConditionalAction (Choose a visible target; published target within120ft; summon within30ft target. Dire wolf statistics with stated source changes.) · summon-hound via executeTriggeredFeature / executeConditionalAction (Bonus action; visible target within120ft; hound appears within30ft of target. Hound has half Sorcerer level tempHP; lasts5minutes; target within5ft has disadvantage on saves against your spells. Hound sheet in companions.)
- Table fact · Confirm target, placement/path, Pack Tactics and whether neighbor's spell save disadvantage applies.

### Level 14 · Shadow Walk

Dedicated confirmed source action/instructions.

- Dedicated plans · shadow-walk via executeTriggeredFeature / executeConditionalAction (Start in dim light/darkness; destination visible within120ft also dim light/darkness.)
- Table fact · Confirm initial and destination dim light/darkness, visible empty space/range.

### Level 18 · Umbral Form

Points buy one-minute active state; typed resistance except force/radiant.

- Dedicated plans · shadow-form via executeTriggeredFeature / executeConditionalAction (Published lasts1minute and resists all except force/radiant. UA lasts1minute and resists all except force.) · shadow-form via executeTriggeredFeature / executeConditionalAction (Bonus action;1 minute; resistance to all except force/radiant; move through creatures/objects as difficult terrain;5force if ending turn inside object.)
- Table fact · Confirm obstacles, movement and ending inside an object.
- Open sheet gap · No end-turn inside-object own force-damage consumer.

## Sorcerer — Storm Sorcery

Entry level 1 · [Sword Coast Adventurer's Guide; Xanathar's Guide to Everything](https://dnd5e.wikidot.com/sorcerer:storm-sorcery)

### Level 1 · Wind Speaker

Source language grants where reconciled (Primordial).

- Table fact · Dialect communication across Aquan/Auran/Ignan/Terran.

### Level 1 · Tempestuous Magic

Source rules.

- Generic action model · Tempestuous Magic: source rules or unverified dedicated path (Starting at 1st level, you can use a bonus action on your turn to cause whirling gusts of elemental air to briefly surround you, immediately before or after you cast a spell of 1st level or higher. Doing so allows you to fly up to 10 feet without provoking opportunity attacks.)
- Table fact · Confirm weather/position, eligible spell or melee hit, save/knockback.
- Open sheet gap · Tactical movement is table-resolved; no integrated reaction damage/trigger control.

### Level 6 · Heart of the Storm

Typed lightning/thunder resistance.

- Generic action model · Heart of the Storm: source rules or unverified dedicated path (At 6th level, you gain resistance to lightning and thunder damage. In addition, whenever you start casting a spell of 1st level or higher that deals lightning or thunder damage, stormy magic erupts from you. This eruption causes creatures of your choice that you can see within 10 feet of you to take lightning or thunder damage (choose each time this ability activates) equal to half your sorcerer level.)
- Recognized numeric routes · resistance
- Numeric effects awaiting verification · aura-damage (Start casting spell >=1 that deals lightning/thunder; chosen visible creatures within10ft; choose lightning/thunder)
- Table fact · Confirm qualifying leveled spell, creatures in aura and actual external damage.
- Open sheet gap · No triggered damage output tied to spell.

### Level 6 · Storm Guide

Source rules.

- Generic action model · Storm Guide: source rules or unverified dedicated path (If it is raining, you can use an action to cause the rain to stop falling in a 20-foot-radius sphere centered on you. You can end this effect as a bonus action. If it is windy, you can use a bonus action each round to choose the direction that the wind blows in a 100-foot-radius sphere centered on you. The wind blows in that direction until the end of your next turn. This feature doesn't alter the speed of the wind.)
- Table fact · Confirm weather/position, eligible spell or melee hit, save/knockback.
- Open sheet gap · Tactical movement is table-resolved; no integrated reaction damage/trigger control.

### Level 14 · Storm's Fury

Source rules.

- Generic action model · Storm's Fury: source rules or unverified dedicated path (Starting at 14th level, when you are hit by a melee attack, you can use your reaction to deal lightning damage to the attacker. The damage equals your sorcerer level. The attacker must also make a Strength saving throw against your sorcerer spell save DC. On a failed save, the attacker is pushed in a straight line up to 20 feet away from you.)
- Table fact · Confirm weather/position, eligible spell or melee hit, save/knockback.
- Open sheet gap · Tactical movement is table-resolved; no integrated reaction damage/trigger control.

### Level 18 · Wind Soul

Typed lightning/thunder immunity; generic source use.

- Counters · Wind Soul; 1 uses at probe level; short reset verified
- Generic action model · Wind Soul: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:storm-sorcery:resource:wind-soul-share (You also gain a magical flying speed of 60 feet. As an action, you can reduce your flying speed to 30 feet for 1 hour and choose a number of creatures within 30 feet of you equal to 3 + your Charisma modifier. The chosen creatures gain a magical flying speed of 30 feet for 1 hour. Once you reduce your flying speed in this way, you can't do so again until you finish a short or long rest.)
- Recognized numeric routes · immunity
- Numeric effects awaiting verification · fly-speed (Can temporarily reduce to30ft when sharing flight)
- Table fact · Choose eligible recipients/positions and shared flight.
- Open sheet gap · No flight speed/costed shared flight duration state.

## Sorcerer — Wild Magic

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/sorcerer:wild-magic)

### Level 1 · Wild Magic Surge

Dedicated confirmed d100, visible outcome rolls, own healing, typed Fireball after actual Dex save and temp HP first, source conditions, spell/typed damage/turn consumers and bound sheep separate body with restoration/overflow. Reviewed typed damage and own-form tests.

- Generic action model · Wild Magic Surge: source rules or unverified dedicated path (Starting when you choose this origin at 1st level, your spellcasting can unleash surges of untamed magic. Once per turn, the DM can have you roll a d20 immediately after you cast a sorcerer spell of 1st level or higher. If you roll a 1, roll on the Wild Magic Surge table to create a magical effect. If that effect is a spell, it is too wild to be affected by your Metamagic, and if it normally requires concentration, it doesn't require concentration in this case; the spell lasts for its full duration.)
- Dedicated plans · sorcerer-wild-magic via applySubclassTable
- Table fact · Confirm DM trigger, external targets, random recipient, creature outcomes/saves, and approved sheep body.
- Open sheet gap · Persistent reference-only outcomes cannot be counted as applied just because a state is recorded.

### Level 1 · Tides of Chaos

Generic tracker.

- Counters · Tides of Chaos; 1 uses at probe level; long reset verified
- Generic action model · Tides of Chaos: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:wild-magic:resource:tides-of-chaos (Starting at 1st level, you can manipulate the forces of chance and chaos to gain advantage on one attack roll, ability check, or saving throw. Once you do so, you must finish a long rest before you can use this feature again.)
- Table fact · Confirm qualifying own roll and DM-triggered recharge on later Sorcerer cast.
- Open sheet gap · No actual own advantage or table-driven special refresh.

### Level 6 · Bend Luck

Visible confirmed 1d4, real 2-point spend; result recorded.

- Dedicated plans · bend-luck via executeTriggeredFeature / executeConditionalAction (After roll, before effects occur.)
- Table fact · Confirm another creature rolled and whether to add/subtract before adjudication.

### Level 14 · Controlled Chaos

Single-result surge control remains available.

- Generic action model · Controlled Chaos: source rules or unverified dedicated path (At 14th level, you gain a modicum of control over the surges of your wild magic. Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number.)
- Table fact · Confirm opportunity and choose outcome/damage die using source text.
- Open sheet gap · No two-roll surge selection or addition of highest matching spell-damage die once per turn.

### Level 18 · Spell Bombardment

Single-result surge control remains available.

- Generic action model · Spell Bombardment: source rules or unverified dedicated path (Beginning at 18th level, the harmful energy of your spells intensifies. When you roll damage for a spell and roll the highest number possible on any of the dice, choose one of those dice, roll it again and add that roll to the damage. You can use the feature only once per turn. | Wild Magic Surge |
| --- |
| d100 | Effect | d100 | Effect |
| 01-02 | Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls. | 51-52 | A spectral shield hovers near you for the next minute, granting you a +2 bonus to AC and immunity to Magic Missile. |
| 03-04 | For the next minute, you can see any invisible creature if you have line of sight to it. | 53-54 | You are immune to being intoxicated by alcohol for the next 5d6 days. |
| 05-06 | A modron chosen and controlled by the DM appears in an unoccupied space within 5 feet of you, then disappears 1 minute later. | 55-56 | Your hair falls out but grows back within 24 hours. |
| 07-08 | You cast Fireball as a 3rd-level spell centered on yourself. | 57-58 | For the next minute, any flammable object you touch that isn't being worn or carried by another creature bursts into flame. |
| 09-10 | You cast Magic Missile as a 5th-level spell. | 59-60 | You regain your lowest-level expended spell slot. |
| 11-12 | Roll a d10. Your height changes by a number of inches equal to the roll. If the roll is odd, you shrink. If the roll is even, you grow. | 61-62 | For the next minute, you must shout when you speak. |
| 13-14 | You cast Confusion centered on yourself. | 63-64 | You cast Fog Cloud centered on yourself. |
| 15-16 | For the next minute, you regain 5 hit points at the start of each of your turns. | 65-66 | Up to three creatures you choose within 30 feet of you take 4d10 lightning damage. |
| 17-18 | You grow a long beard made of feathers that remains until you sneeze, at which point the feathers explode out from your face. | 67-68 | You are frightened by the nearest creature until the end of your next turn. |
| 19-20 | You cast Grease centered on yourself. | 69-70 | Each creature within 30 feet of you becomes invisible for the next minute. The invisibility ends on a creature when it attacks or casts a spell. |
| 21-22 | Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw. | 71-72 | You gain resistance to all damage for the next minute. |
| 23-24 | Your skin turns a vibrant shade of blue. A Remove Curse spell can end this effect. | 73-74 | A random creature within 60 feet of you becomes poisoned for 1d4 hours. |
| 25-26 | An eye appears on your forehead for the next minute. During that time, you have advantage on Wisdom (Perception) checks that rely on sight. | 75-76 | You glow with bright light in a 30-foot radius for the next minute. Any creature that ends its turn within 5 feet of you is blinded until the end of its next turn. |
| 27-28 | For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action. | 77-78 | You cast Polymorph on yourself. If you fail the saving throw, you turn into a sheep for the spell's duration. |
| 29-30 | You teleport up to 60 feet to an unoccupied space of your choice that you can see. | 79-80 | Illusory butterflies and flower petals flutter in the air within 10 feet of you for the next minute. |
| 31-32 | You are transported to the Astral Plane until the end of your next turn, after which time you return to the space you previously occupied or the nearest unoccupied space if that space is occupied. | 81-82 | You can take one additional action immediately. |
| 33-34 | Maximize the damage of the next damaging spell you cast within the next minute. | 83-84 | Each creature within 30 feet of you takes 1d10 necrotic damage. You regain hit points equal to the sum of the necrotic damage dealt. |
| 35-36 | Roll a d10. Your age changes by a number of years equal to the roll. If the roll is odd, you get younger (minimum 1 year old). If the roll is even, you get older. | 85-86 | You cast Mirror Image. |
| 37-38 | 1d6 flumphs controlled by the DM appear in unoccupied spaces within 60 feet of you and are frightened of you. They vanish after 1 minute. | 87-88 | You cast Fly on a random creature within 60 feet of you. |
| 39-40 | You regain 2d10 hit points. | 89-90 | You become invisible for the next minute. During that time, other creatures can't hear you. The invisibility ends if you attack or cast a spell. |
| 41-42 | You turn into a potted plant until the start of your next turn. While a plant, you are incapacitated and have vulnerability to all damage. If you drop to 0 hit points, your pot breaks, and your form reverts. | 91-92 | If you die within the next minute, you immediately come back to life as if by the Reincarnate spell. |
| 43-44 | For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns. | 93-94 | Your size increases by one size category for the next minute. |
| 45-46 | You cast Levitate on yourself. | 95-96 | You and all creatures within 30 feet of you gain vulnerability to piercing damage for the next minute. |
| 47-48 | A unicorn controlled by the DM appears in a space within 5 feet of you, then disappears 1 minute later. | 97-98 | You are surrounded by faint, ethereal music for the next minute. |
| 49-50 | You can't speak for the next minute. Whenever you try, pink bubbles float out of your mouth. | 99-00 | You regain all expended sorcery points. |)
- Table fact · Confirm opportunity and choose outcome/damage die using source text.
- Open sheet gap · No two-roll surge selection or addition of highest matching spell-damage die once per turn.

## Sorcerer — Pyromancy

Entry level 1 · [Plane Shift: Kaladesh](https://dnd5e.wikidot.com/sorcerer:pyromancy)

### Level 1 · Heart of Fire

Source rules.

- Generic action model · Heart of Fire: source rules or unverified dedicated path (At 1st level, whenever you start casting a spell of 1st level or higher that deals fire damage, fiery magic erupts from you. This eruption causes creatures of your choice that you can see within 10 feet of you to take fire damage equal to half your sorcerer level (minimum of 1).)
- Numeric effects awaiting verification · aura-fire-damage (Start casting noncantrip spell dealing fire; chosen visible creatures within10ft)
- Table fact · Confirm fire cast/radius or hit/reaction and external targets.
- Open sheet gap · No triggered damage/control.

### Level 6 · Fire in the Veins

Typed incoming fire resistance at 6 and immunity at 18.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · ignore-resistance (Spells you cast)
- Table fact · Apply source fire resistance bypass/target immunity conversion on external damage.

### Level 14 · Pyromancer's Fury

Source rules.

- Generic action model · Pyromancer's Fury: source rules or unverified dedicated path (Starting at 14th level, when you are hit by a melee attack, you can use your reaction to deal fire damage to the attacker. The damage equals your sorcerer level, and ignores resistance to fire damage.)
- Table fact · Confirm fire cast/radius or hit/reaction and external targets.
- Open sheet gap · No triggered damage/control.

### Level 18 · Fiery Soul

Typed incoming fire resistance at 6 and immunity at 18.

- Recognized numeric routes · immunity
- Numeric effects awaiting verification · treat-immunity-as-resistance (Any spell/effect you create; also ignores resistance)
- Table fact · Apply source fire resistance bypass/target immunity conversion on external damage.

## Sorcerer — Lunar Magic (UA)

Entry level 1 · [Unearthed Arcana 81 - Heroes of Krynn](https://dnd5e.wikidot.com/sorcerer:lunar-magic-ua)

Source spell progression · level 1 known: Sacred Flame, Faerie Fire, Dissonant Whispers, Sanctuary · level 3 known: Moonbeam, Darkness, Blindness/Deafness · level 5 known: Death Ward, Bestow Curse, Phantom Steed · level 7 known: Freedom of Movement, Evard's Black Tentacles, Hallucinatory Terrain · level 9 known: Mass Cure Wounds, Mislead, Dream

### Level 1 · Moon Fire

Source-known Sacred Flame.

- Generic action model · Moon Fire: source rules or unverified dedicated path (Starting at 1st level, you can call down the radiant light of the moon on command. You learn the Sacred Flame spell, which doesn’t count against the number of sorcerer cantrips you know. When you cast the spell, you can target one creature as normal or target two creatures within range that are within 5 feet of each other.)
- Table fact · Confirm second eligible target and adjacency, separate saves.

### Level 1 · Lunar Embodiment

Lunar phase choices and authored phase-specific spell grants may reconcile.

- Choice controls · lunar-phase (rest)
- Counters · Each Lunar table spell free cast; 1 uses at probe level; long reset verified
- Generic action model · Lunar Embodiment: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:lunar-magic-ua:resource:lunar-free-spell (You learn additional spells when you reach certain levels in this class, as shown on the Lunar Spells table. Each spell counts as a sorcerer spell for you, but it doesn’t count against the number of sorcerer spells you know. Whenever you finish a long rest, you can choose what lunar phase manifests its power through your magic: Full Moon, New Moon, or Crescent Moon. While in the chosen phase, spells of the associated phase in the Lunar Spells table can be cast once without expending a spell slot. Once you cast a spell in this way, you can’t do so again until you finish a long rest.)
- Table fact · Confirm phase choice and casting requirements.
- Open sheet gap · Check free spell actual phase-specific cast, and use reset after changing phase, before claiming automation.

### Level 6 · Lunar Boons

Generic resource use where present.

- Counters · Lunar Boons; 3 uses at probe level; long reset verified
- Generic action model · Lunar Boons: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:lunar-magic-ua:resource:lunar-boons (Whenever you use Metamagic on a spell from the Lunar Spells table or a spell of a school of magic associated with the lunar phase you are in, you can reduce the sorcery points spent by 1 (minimum 0). You can reduce the sorcery points spent for your Metamagic a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest)
- Table fact · Confirm phase and applicable spell and Metamagic.
- Open sheet gap · No qualifying Metamagic discount tied to cast or paid mid-rest switch flowing into active bonuses.

### Level 6 · Waxing and Waning

Generic resource use where present.

- Generic action model · Waxing and Waning: spends 1 from 2014:Sorcerer:points (Starting at 6th level, you gain greater control over the phases of your lunar magic. As a bonus action, you can spend 1 sorcery point to change your lunar phase for a different one.)
- Table fact · Confirm phase and applicable spell and Metamagic.
- Open sheet gap · No qualifying Metamagic discount tied to cast or paid mid-rest switch flowing into active bonuses.

### Level 14 · Lunar Empowerment

Generic use where present.

- Generic action model · Lunar Empowerment: source rules or unverified dedicated path (Starting at 14th level, the power of a lunar phase saturates your being. Whenever you choose a lunar phase to affect your magic, you also gain the following benefit associated with that phase: - Full Moon: You shed bright light in a 10-foot radius and dim light for an additional 10 feet. In addition, you and creatures of your choice have advantage on saving throws while within the bright light you shed. - New Moon: You have advantage on Dexterity (Stealth) checks. In addition, while you are in dim light or darkness, attack rolls have disadvantage against you.)
- Numeric effects awaiting verification · resistance (Current phase Crescent Moon) · skill-advantage (Current phase New Moon) · incoming-attack-disadvantage (Current phase New Moon; dim light or darkness)
- Table fact · Confirm phase, positions and external targets/saves.
- Open sheet gap · Phase resistance/check advantage/hostile attack disadvantage and own healing/teleport lack dedicated handlers.

### Level 18 · Lunar Phenomenon

Generic use where present.

- Counters · Full Moon phenomenon; 1 uses at probe level; long reset verified · New Moon phenomenon; 1 uses at probe level; long reset verified · Crescent Moon phenomenon; 1 uses at probe level; long reset verified
- Generic action model · Lunar Phenomenon: spends 5 from 2014:Sorcerer:points (At 18th level, your lunar phase magic bursts. As a bonus action, you can tap into a special power of the lunar phase you are currently in. Alternatively, as part of the bonus action you take to change your lunar phase using your Waxing and Waning feature, you can immediately use the power of the lunar phase you are entering: - Full Moon: You radiate intense moonlight for a moment. Each creature of your choice within 30 feet of you must succeed on a Constitution saving throw against your spell save DC or be blinded until the end of its next turn. In addition, one creature of your choice in that area regains 3d8 hit points. - New Moon: You momentarily emanate an oppressive gloom. Each creature of your choice within 30 feet of you must succeed on a Dexterity saving throw against your spell save DC or take 3d10 necrotic damage and have its speed reduced to 0 until the end of its next turn. In addition, you become invisible until the end of your next turn, or until you make an attack or cast a spell.)
- Table fact · Confirm phase, positions and external targets/saves.
- Open sheet gap · Phase resistance/check advantage/hostile attack disadvantage and own healing/teleport lack dedicated handlers.

## Sorcerer — Aberrant Mind (UA)

Entry level 1 · [Unearthed Arcana 61 - Sorcerer and Warlock](https://dnd5e.wikidot.com/sorcerer:aberrant-mind-ua)

Source spell progression · level 1 known: Arms of Hadar, Dissonant Whispers · level 3 known: Calm Emotions, Detect Thoughts · level 5 known: Hunger of Hadar, Sending · level 7 known: Compulsion, Evard's Black Tentacles · level 9 known: Modify Memory, Rary's Telepathic Bond

### Level 1 · Psionic Spells

Source-known grants outside quota.

- Generic action model · Psionic Spells: source rules or unverified dedicated path (Starting at 1st level, your aberrant nature changes your mind in subtle but profound ways. You learn additional spells when you reach certain levels in this class, as shown on the Psionic Spells table. The spell counts as a sorcerer spell for you, but it doesn’t count against the number of sorcerer spells you know.)
- Open sheet gap · Published eligible spell replacements and real sheet ownership through swaps need confirmation beyond saved declarations.

### Level 1 · Warped Being

Alternate 13+Dex AC when unarmored.

- Generic action model · Warped Being: source rules or unverified dedicated path (Starting at 1st level, your aberrant origin protects you from harm. Your body might have a coating of viscous slime, tough hide, scales, or an invisible psionic barrier (choose the form of protection when you gain this feature). Whatever form the protection takes, your AC equals 13 + your Dexterity modifier while you aren’t wearing armor.)
- Recognized numeric routes · ac (Not wearing armor)
- Table fact · Confirm equipment.

### Level 6 · Psionic Sorcery

- Generic action model · Psionic Sorcery: source rules or unverified dedicated path (Beginning at 6th level, when you cast any of the spells gained from your Psionic Spells feature, you can cast it by expending a spell slot as normal or by spending a number of sorcery points equal to the spell’s level. If you cast the spell using sorcery points, it requires no components.)
- Table fact · Confirm the spell comes from the source list and material component exception.
- Open sheet gap · No paid Sorcery-Point cast from subclass spell list or components override.

### Level 6 · Psychic Defenses

Typed incoming psychic resistance.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · save-advantage
- Table fact · Confirm the save is against charmed/frightened.
- Open sheet gap · No contextual save advantage.

### Level 14 · Revelation in Flesh

- Choice controls · revelation-benefits (activation)
- Generic action model · Revelation in Flesh: source rules or unverified dedicated path (Beginning at 14th level, you can unleash the aberrant truth hidden within your flesh. As a bonus action, you can spend 1 or more sorcery points to magically transform your body for 1 minute. For each sorcery point you spend, you can gain one of the following benefits of your choice, the effects of which last until the transformation ends: - Your body, along with any equipment you are wearing or carrying, becomes slimy and pliable. You can move through any space as narrow as 1 inch without squeezing, and you can spend 5 feet of movement to escape from nonmagical restraints or being grappled.)
- Table fact · Confirm chosen movement, position/space and applicable sensory rules.
- Open sheet gap · No point-cost selected own states/speeds.

### Level 18 · Warp Reality

Source rules.

- Counters · Warp Reality; 1 uses at probe level; long reset verified
- Generic action model · Warp Reality: source rules or unverified dedicated path (At 18th level, you become the focal point of a reality-warping anomaly. As an action, you can magically radiate a transparent, 20-foot-radius aura for 1 minute. This might take the form of a sphere of rippling psychic energy, a fluctuating amoebic gel, an extrusion of ephemeral parasites, or some other manifestation. Other creatures treat the aura as difficult terrain, and when they start their turn in it, they take 2d10 psychic damage. When you activate this feature, you can choose any number of creatures you can see to be unaffected by the aura. As a bonus action, you can end the aura early. If you do so, you and any number of creatures you choose within the aura are teleported to a location you can see within 1 mile of you. Each creature must appear within 20 feet of you and in an unoccupied space. An unwilling creature that succeeds on a Charisma saving throw against your spell save DC is not teleported.)
- Table fact · Confirm origin, affected creatures/save and timing.
- Open sheet gap · No actual lasting poor-reality state/numerical effects.

## Sorcerer — Clockwork Soul (UA)

Entry level 1 · [Unearthed Arcana 68 - Subclasses, Part 2](https://dnd5e.wikidot.com/sorcerer:clockwork-soul-ua)

Source spell progression · level 1 known: Alarm, Protection from Evil and Good · level 3 known: Find Traps, Heat Metal · level 5 known: Counterspell, Glyph of Warding · level 7 known: Arcane Eye, Otiluke’s Resilient Sphere · level 9 known: Animate Objects, Wall of Force

### Level 1 · Clockwork Magic

Source-known grants outside quota and source spell selection declaration.

- Generic action model · Clockwork Magic: source rules or unverified dedicated path (You learn additional spells when you reach certain levels in this class, as shown on the Clockwork Spells table. Each spell counts as a sorcerer spell for you, but it doesn’t count against the number of sorcerer spells you know. These spells can’t be replaced when you gain a level in this class.)
- Open sheet gap · Check published replacement workflow consumes legal school/class substitutions, rather than static grants only.

### Level 1 · Restore Balance

Generic use count.

- Counters · Restore Balance; 3 uses at probe level; long reset verified
- Generic action model · Restore Balance: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:clockwork-soul-ua:resource:restore-balance (Starting at 1st level, your connection to the plane of absolute order allows you to equalize chaotic moments. When a creature you can see within 60 feet of you is about to roll a d20 with advantage or disadvantage, you can use your reaction to prevent the roll from being affected by advantage and disadvantage. You can use this feature a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm visible creature starting advantage/disadvantage roll and whether reaction used.
- Open sheet gap · No canceling own roll's advantage/disadvantage through actual roll call.

### Level 6 · Bulwark of Law

Source data has law-ward; dedicated healingFeatures looks up bastion-of-law slug.

- Table fact · Confirm UA target and damage timing.
- Open sheet gap · UA source lookup mismatch likely leaves the specific ward inaccessible; generic law-ward is explicitly hidden. Verify before claiming UA parity.

### Level 14 · Trance of Order

Generic rest use.

- Counters · Trance of Order; 1 uses at probe level; long reset verified
- Generic action model · Trance of Order: spends 5 from 2014:Sorcerer:points (Starting at 14th level, you gain the ability to enter a state of clockwork consciousness as a bonus action. For the next minute, attack rolls against you can’t benefit from advantage, and whenever you make an attack roll, an ability check, or a saving throw, you can treat a d20 roll of 9 or lower as a 10. Once you use this action, you can’t use it again until you finish a long rest or until you expend 5 sorcery points to use it again.)
- Table fact · Confirm targets, distance/order-cube choices, spell levels, restore/distribute HP or repairs.
- Open sheet gap · No Trance floor/incoming-advantage safeguard or Cavalcade self HP and spell cleanup; no point alternative.

### Level 18 · Clockwork Cavalcade

Generic rest use.

- Counters · Clockwork Cavalcade; 1 uses at probe level; long reset verified
- Generic action model · Clockwork Cavalcade: spends 7 from 2014:Sorcerer:points (At 18th level, you summon spirits of order to restore balance around you. As an action, you summon the spirits in a 30-foot cube originating from you. The spirits look like modrons or other constructs of your choice. The spirits are intangible and invulnerable, work fast and efficiently, and create the following effects within the cube before vanishing:)
- Table fact · Confirm targets, distance/order-cube choices, spell levels, restore/distribute HP or repairs.
- Open sheet gap · No Trance floor/incoming-advantage safeguard or Cavalcade self HP and spell cleanup; no point alternative.

## Sorcerer — Favored Soul (2015) (UA)

Entry level 1 · [Unearthed Arcana 3 - Modifying Classes](https://dnd5e.wikidot.com/sorcerer:favored-soul-ua)

### Level 1 · Chosen of the Gods

Selected domain supplies level-banded bonus-known spells without Cleric class identity.

- Choice controls · divine-domain (advancement)
- Generic action model · Chosen of the Gods: source rules or unverified dedicated path (At 1st level, you choose one of the cleric class’s divine domains. You add that domain’s spells for 1st-level clerics to your known spells. These spells do not count against the number of spells you can know, and they are considered to be sorcerer spells for you. When you reach 3rd, 5th, 7th, and 9th levels in the sorcerer class, you likewise learn your domain’s spells that become available at those levels.)
- Table fact · Confirm chosen domain.

### Level 1 · Bonus Proficiencies

Light armor, medium armor, shields and simple weapons consumed by training.

- Training grants · light · medium · shields · simple

### Level 6 · Extra Attack

Own feature sets Attack action count to 2 at owning unlock level; takes maximum across qualifying classes.

- Recognized numeric routes · attack-count (Attack action)

### Level 14 · Divine Wings

Source rules.

- Generic action model · Divine Wings: source rules or unverified dedicated path (At 14th level, you gain the ability to sprout a pair of wings from your back (feathered or bat-like, your choice), gaining a flying speed equal to your current walking speed. You can create these wings as a bonus action on your turn. They last until you dismiss them as a bonus action on your turn. You can’t manifest your wings while wearing armor unless the armor is made to accommodate them, and clothing not made to accommodate your wings might be destroyed when you manifest them.)
- Table fact · Confirm space and wing type.
- Open sheet gap · Missing flight activation.

### Level 18 · Power of the Chosen

Source rules.

- Generic action model · Power of the Chosen: source rules or unverified dedicated path (Starting at 18th level, when you cast one of the spells you learned from your Chosen of the Gods class feature, you regain hit points equal to your Charisma modifier (minimum +1) + the spell’s level.)
- Table fact · Confirm cast uses a bonus spell from chosen domain.
- Open sheet gap · No own Cha-based capped healing after qualifying cast.

## Sorcerer — Favored Soul (2017) (UA)

Entry level 1 · [Unearthed Arcana 28 - Sorcerer](https://dnd5e.wikidot.com/sorcerer:favored-soul-revisited-ua)

### Level 1 · Divine Magic

Ordinary Cleric spell access for target Sorcerer choice and source alignment-known spell grant where shown.

- Generic action model · Divine Magic: source rules or unverified dedicated path (Your link to the divine allows you to learn spells normally associated with the cleric class. When your Spellcasting feature lets you learn a sorcerer cantrip or a sorcerer spell of 1st level or higher, you can choose the new spell from the cleric spell list, in addition to the sorcerer spell list. You must otherwise obey all the restrictions for selecting the spell, and it becomes a sorcerer spell for you.)
- Table fact · Confirm source selection.

### Level 1 · Supernatural Resilience

Owner class-level HP bonus in normal HP calc/advancement.

- Recognized numeric routes · hp-max-bonus

### Level 1 · Favored by the Gods

Dedicated confirmed trigger, actual visible 2d4 and shared short/long use spend; result is displayed.

- Counters · Favored by the Gods; 1 uses at probe level; short reset verified
- Dedicated plans · favored-by-gods via executeTriggeredFeature / executeConditionalAction (Use after fail save or miss attack, potentially change outcome; no reaction stated.)
- Table fact · Confirm failed save or missed attack and adjudicate adjusted total.
- Open sheet gap · Existing result not linked to active attack/save rerender/outcome.

### Level 6 · Blessed Countenance

Reconciled own training/expertise.

- Recognized numeric routes · expertise (Only when PB applies)

### Level 14 · Divine Purity

Typed poison damage immunity.

- Recognized numeric routes · immunity
- Open sheet gap · Poisoned/disease status immunity needs condition routing.

### Level 18 · Unearthly Recovery

Dedicated trigger metadata routes through generic executeTriggeredFeature; use/visible result if any.

- Counters · Unearthly Recovery; 1 uses at probe level; long reset verified
- Dedicated plans · unearthly-recovery via executeTriggeredFeature / executeConditionalAction (Current hp below half maximum; regain floor(maxHP/2).)
- Table fact · Confirm HP below half and bonus action.
- Open sheet gap · Missing actual capped restoration of half max HP to self.

## Sorcerer — Giant Soul (UA)

Entry level 1 · [Unearthed Arcana 50 - Giant Soul](https://dnd5e.wikidot.com/sorcerer:giant-soul-ua)

### Level 1 · Jotun Resilience

Owner class-level HP bonus in normal HP calc/advancement.

- Recognized numeric routes · hp-max-bonus

### Level 1 · Mark of the Ordning

Source option yields known spells.

- Choice controls · giant-kind (advancement)
- Table fact · Confirm lineage.

### Level 6 · Soul of Lost Ostoria

Source rules.

- Generic action model · Soul of Lost Ostoria: source rules or unverified dedicated path (Starting at 6th level, you gain a benefit whenever you cast one of the spells granted by your Mark of the Ordning Feature. - Cloud Giant._ Immediately after you cast any of your Mark of the Ordning spells, you can magically teleport as a bonus action. You teleport to an unoccupied space you can see that is no farther away than a number of feet equal to 10 + your Constitution modifier. - Frost Giant._ Immediately after you cast any of your Mark of the Ordning spells, you gain temporary hit points equal to your Constitution modifier (minimum of 1). If the spell is Armor of Agathys, you instead increase its temporary hit points by an amount equal to your Constitution modifier (minimum of 1). - Hill Giant._ Immediately after you cast any of your Mark of the Ordning spells, you can target up to two creatures within 5 feet of you that you can see. Each target must succeed on a Strength saving throw against your spell save DC or be pushed a number of feet away from you equal to 5 + your Constitution modifier (minimum of +1). A target can choose to fail this save.)
- Numeric effects awaiting verification · spell-damage-bonus (Fire Giant selection; Mark of Ordning spells) · ac-bonus (Stone Giant selection; after Mark of Ordning spell until next turn end)
- Table fact · Confirm selected lineage and source spell/target.
- Open sheet gap · No actual spell damage modifier/conditional AC and other self riders.

### Level 14 · Rage of Fallen Ostoria

Generic uses where routed.

- Counters · Rage of Fallen Ostoria; 1 uses at probe level; short reset verified
- Generic action model · Rage of Fallen Ostoria: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:giant-soul-ua:resource:rage-of-fallen-ostoria (Starting at 14th level, you gain the ability to channel the souls of your ancestors into your physical form. When you start casting a sorcerer spell on your turn and expend a spell slot, you can increase your size by one category – from Medium to Large, for example. This increase lasts for 1 minute. It ends early if you die or are incapacitated. Until it ends, you gain the following benefits:)
- Numeric effects awaiting verification · hp-max-and-current-bonus (Rage of Fallen Ostoria active; stacks at18 only as specified) · speed-bonus (Rage of Fallen Ostoria active; stacks at18 only as specified) · melee-weapon-damage-bonus (Rage of Fallen Ostoria active)
- Table fact · Confirm cast, size space and target(s).
- Open sheet gap · No timed size/current-and-max HP/speed/reach or own melee-damage modifier and extra use state.

### Level 18 · Blessing of the All Father

Generic uses where routed.

- Generic action model · Blessing of the All Father: source rules or unverified dedicated path (In addition, you can now use Rage of Fallen Ostoria twice between rests, but no more than once on a turn. If you use that feature while under its effects, its increases to your size, hit points, reach, and walking speed are cumulative.)
- Table fact · Confirm cast, size space and target(s).
- Open sheet gap · No timed size/current-and-max HP/speed/reach or own melee-damage modifier and extra use state.

## Sorcerer — Mage of Prismari (UA)

Entry level 1 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-prismari-ua)

### Level 1 · Creative Skills

Source-filtered two skill choices consumed by advancement training reconciliation.

- Choice controls · creative-skills (advancement)

### Level 1 · Kinetic Artistry

Generic costs/visible rolls where declared; creative skill choice separately reconciles.

- Choice controls · kinetic-mode (activation)
- Counters · Kinetic Artistry; 2 uses at probe level; long reset verified
- Generic action model · Kinetic Artistry: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:mage-of-prismari-ua:resource:kinetic-artistry (You can Dash as a bonus action. When you take this bonus action, choose one of the following additional effects: Boreal Sweep. Icy water swirls around you. Until the end of your turn, you can move across the surface of water as if it were harmless solid ground. Additionally, when you leave a space within 5 feet of a creature, you can force that creature to make a Strength saving throw against your spell save DC. On a failed save, the creature is knocked prone. A creature can be affected by the water only once each turn. Thunderlight Jaunt. You take on a nimble lightning form. Until the end of your turn, you can move through the space of other creatures, and you do not provoke opportunity attacks. If you end your turn inside a creature’s space, you are pushed into the nearest unoccupied space. You can use a bonus action in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm elemental Dash trail/water/position and external damage.
- Open sheet gap · No linked movement/specific Dash modes or end-turn AC/position effect.

### Level 6 · Favored Medium

Flexible owner feature choice saved.

- Choice controls · favored-medium (rest)
- Generic action model · Favored Medium: source rules or unverified dedicated path (Additionally, when you cast a spell using a spell slot that deals the chosen damage type, you emit a spectacular aura of artistry, which extends 5 feet from you in every direction (but not through total cover) and lasts until the end of your next turn. While the aura is active, each creature of your choice has resistance to your chosen damage type while within the aura, as you shape your favored elemental medium around them. You can change your choice of damage type whenever you finish a long rest.)
- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

### Level 10 · Focused Expression

Flexible owner feature choice saved.

- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

### Level 14 · Impeccable Physicality

Flexible owner feature choice saved.

- Generic action model · Impeccable Physicality: source rules or unverified dedicated path (Your relentless dedication and training have instilled an outstanding sense of precision and grace in your art. You gain proficiency in Dexterity saving throws if you do not already have it. Additionally, when you make a Dexterity saving throw, you can treat a d20 roll of a 9 or lower as a 10.)
- Numeric effects awaiting verification · dexterity-save-die-minimum (Impeccable Physicality chosen; treat d20<=9 as10)
- Table fact · Confirm qualifying spell's damage type/nearby ally position.
- Open sheet gap · Missing chosen resistance/short duration, supported save training and own ability/roll effects where source calls for them.

## Sorcerer — Mage of Quandrix (UA)

Entry level 1 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-quandrix-ua)

Source spell progression · level 1 known: Guidance, Guiding Bolt · level 3 known: Enlarge/Reduce, Spike Growth · level 5 known: Aura of Vitality, Haste · level 7 known: Control Water, Freedom of Movement · level 9 known: Circle of Power, Passwall

### Level 1 · Quandrix Spells

Source known spells at owning unlock outside normal quotas.

- Generic action model · Quandrix Spells: source rules or unverified dedicated path (You learn the cantrip Guidance and the 1st-level spell Guiding Bolt. You learn additional spells when you reach certain levels in this class, as shown on the Quandrix Spells table. Each of these spells counts as a class spell for you, but it doesn’t count against the number of spells you know. If you are a wizard, you can add these spells to your spellbook upon learning them, without expending any gold, and prepare them as normal.)

### Level 1 · Functions of Probability

Later owner feature choices saved.

- Choice controls · probability-mode (activation)
- Generic action model · Functions of Probability: source rules or unverified dedicated path (By iterating on the mathematical patterns of reality, you can nudge chance to tilt around a creature. When you cast a spell using a spell slot that targets at least one creature, you can choose that creature or another creature within 30 feet of it (including yourself) and add one of the following effects: Diminishing Function. The chosen creature must succeed on a Wisdom saving throw against your spell save DC, or the creature must roll a d6 and subtract the number rolled from the next attack roll it takes before the start of your next turn. Supplemental Function. Once before the start of your next turn, the chosen creature can roll a d6 and add the number rolled to an attack roll or a saving throw of its choice. The creature can roll the d6 after rolling the d20 but must decide before any effects of the roll occur.)
- Table fact · Confirm eligible spell/targets, external saves, teleport geometry.
- Open sheet gap · Own recipient roll benefit/resistance/position effects lack dedicated consumers.

### Level 6 · Velocity Shift

Later owner feature choices saved.

- Counters · Velocity Shift; 3 uses at probe level; long reset verified
- Generic action model · Velocity Shift: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:mage-of-quandrix-ua:resource:velocity-shift (You learn to manipulate kinetic formulas and alter the velocity of another creature. When a creature you can see starts its turn or moves to a space within 30 feet of you, you can use your reaction to force the creature to make a Charisma saving throw against your spell save DC, which it can choose to fail. On a failure, the creature is teleported to an unoccupied space of your choice that you can see within 30 feet of you. You can use your reaction in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm eligible spell/targets, external saves, teleport geometry.
- Open sheet gap · Own recipient roll benefit/resistance/position effects lack dedicated consumers.

### Level 10 · Null Equation

Later owner feature choices saved.

- Table fact · Confirm eligible spell/targets, external saves, teleport geometry.
- Open sheet gap · Own recipient roll benefit/resistance/position effects lack dedicated consumers.

### Level 14 · Quantum Tunneling

Later owner feature choices saved.

- Numeric effects awaiting verification · resistance (Quantum Tunneling chosen)
- Table fact · Confirm eligible spell/targets, external saves, teleport geometry.
- Open sheet gap · Own recipient roll benefit/resistance/position effects lack dedicated consumers.

## Sorcerer — Phoenix Sorcery (UA)

Entry level 1 · [Unearthed Arcana 28 - Sorcerer](https://dnd5e.wikidot.com/sorcerer:phoenix-sorcery-ua)

### Level 1 · Ignite

Source rules.

- Generic action model · Ignite: source rules or unverified dedicated path (At 1st level, you gain the ability to start fires with a touch. As an action, you can magically ignite a flammable object you touch with your hand—an object such as a torch, a piece of tinder, or the hem of drapes.)
- Table fact · Confirm touched flammable object.

### Level 1 · Mantle of Flame

Generic uses where routed.

- Counters · Mantle of Flame; 1 uses at probe level; long reset verified
- Generic action model · Mantle of Flame: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:phoenix-sorcery-ua:resource:mantle-of-flame (As a bonus action, you magically wreathe yourself in swirling fire, as your eyes glow like hot coals. For 1 minute, you gain the following benefits: - Any creature takes fire damage equal to your Charisma modifier if it hits you with a melee attack from within 5 feet of you or if it touches you. - Whenever you roll fire damage on your turn, the roll gains a bonus equal to your Charisma modifier.)
- Numeric effects awaiting verification · fire-damage-roll-bonus (Mantle active; fire damage on your turn)
- Table fact · Confirm nearby creatures and fire timing; external damage handled at table.
- Open sheet gap · No actual Mantle spell bonus, zero-HP Spark, fire-cast own healing, flight or typed resistance state.

### Level 6 · Phoenix Spark

Generic uses where routed.

- Counters · Phoenix Spark; 1 uses at probe level; long reset verified
- Generic action model · Phoenix Spark: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:phoenix-sorcery-ua:resource:phoenix-spark (If you are reduced to 0 hit points, you can use your reaction to draw on the spark of the phoenix. You are instead reduced to 1 hit point, and each creature within 10 feet of you takes fire damage equal to half your sorcerer level + your Charisma modifier. If you use this feature while under the effects of your Mantle of Flame, this feature instead deals fire damage equal to your sorcerer level + double your Charisma modifier, and your Mantle of Flame immediately ends.)
- Table fact · Confirm nearby creatures and fire timing; external damage handled at table.
- Open sheet gap · No actual Mantle spell bonus, zero-HP Spark, fire-cast own healing, flight or typed resistance state.

### Level 14 · Nourishing Fire

Generic uses where routed.

- Generic action model · Nourishing Fire: source rules or unverified dedicated path (Starting at 14th level, your fire spells soothe and restore you. When you expend a spell slot to cast a spell that includes a fire damage roll, you regain hit points equal to the slot’s level + your Charisma modifier.)
- Table fact · Confirm nearby creatures and fire timing; external damage handled at table.
- Open sheet gap · No actual Mantle spell bonus, zero-HP Spark, fire-cast own healing, flight or typed resistance state.

### Level 18 · Form of the Phoenix

Generic uses where routed.

- Numeric effects awaiting verification · fly-speed (Mantle of Flame active; can hover) · resistance (Mantle of Flame active)
- Table fact · Confirm nearby creatures and fire timing; external damage handled at table.
- Open sheet gap · No actual Mantle spell bonus, zero-HP Spark, fire-cast own healing, flight or typed resistance state.

## Sorcerer — Psionic Soul (UA)

Entry level 1 · [Unearthed Arcana 71 - Psionic Options Revisited](https://dnd5e.wikidot.com/sorcerer:psionic-soul-ua)

### Level 1 · Psionic Origin

Source roleplay reference.

- Table fact · Choose origin or consult source roll.

### Level 1 · Psionic Talent

Dedicated visible die increases on 1/decreases on max, owner-level ceiling, real replenishment use and long-rest restoration; Psionic Discovery confirms meditation and grants legal temporary spell/expiry.

- Choice controls · psionic-discovery (activation)
- Counters · Psionic Talent; 1 uses at probe level; long reset verified
- Table fact · Confirm exact Psychic Talent trigger, duration/conditions and components.
- Open sheet gap · Die declared here is separate from some own effects detailed in the feature.

### Level 1 · Psi Replenishment

Dedicated visible die increases on 1/decreases on max, owner-level ceiling, real replenishment use and long-rest restoration; Psionic Discovery confirms meditation and grants legal temporary spell/expiry.

- Counters · Psi Replenishment; 1 uses at probe level; long reset verified
- Table fact · Confirm exact Psychic Talent trigger, duration/conditions and components.
- Open sheet gap · Die declared here is separate from some own effects detailed in the feature.

### Level 6 · Psychic Strike

Source rules.

- Generic action model · Psychic Strike: source rules or unverified dedicated path (At 6th-level, you have learned to channel additional psychic energy into your spells. Immediately after you deal damage to a creature with a sorcerer spell for which you expend a spell slot, you can roll your Psionic Talent die and also deal psychic damage to that creature equal to the number rolled. You can deal this extra damage only once per turn.)
- Table fact · Confirm target damage, chosen temporary capability, or external conditions/position.
- Open sheet gap · No extra psychic spell damage roll, selectable movement/sense/body states or visible aura integration.

### Level 14 · Mind Over Body

Source rules.

- Choice controls · mind-body-benefits (activation)
- Generic action model · Mind Over Body: source rules or unverified dedicated path (When you reach 14th-level, you can now use the psi that flows through you to give your body extraordinary abilities. As a bonus action, you can roll your Psionic Talent die and spend 1 or more sorcery points to magically transform yourself for a number of hours equal to the number rolled. Until the transformation ends, you gain one of the following benefits of your choice for each sorcery point you spent, choosing a different benefit for each point: - Your body, along with any equipment you are wearing or carrying, becomes pliable. You can move through any space as narrow as 1 inch without squeezing, and you can spend 5 feet of movement to escape from nonmagical restraints or being grappled.)
- Table fact · Confirm target damage, chosen temporary capability, or external conditions/position.
- Open sheet gap · No extra psychic spell damage roll, selectable movement/sense/body states or visible aura integration.

### Level 18 · Psychic Aura

Source rules.

- Generic action model · Psychic Aura: source rules or unverified dedicated path (At 18th-level, if your Psionic Talent die is available, you can unleash your psionic power in a crackling aura of psychic energy; as a bonus action, you can magically radiate this transparent, 30-foot radius aura for 1 minute or until you’re incapacitated or lose the use of your Psionic Talent die. Whenever a creature starts its turn in the aura or moves into it for the first time on a turn, you can roll your Psionic Talent die and deal psychic damage to the creature, equaling the number rolled plus your Charisma modifier. If the creature takes any of this damage, its speed is halved until the start of its next turn.)
- Table fact · Confirm target damage, chosen temporary capability, or external conditions/position.
- Open sheet gap · No extra psychic spell damage roll, selectable movement/sense/body states or visible aura integration.

## Sorcerer — Sea Sorcery (UA)

Entry level 1 · [Unearthed Arcana 28 - Sorcerer](https://dnd5e.wikidot.com/sorcerer:sea-sorcery-ua)

### Level 1 · Soul of the Sea

Source rules.

- Numeric effects awaiting verification · swim-speed (Also breathe underwater)
- Table fact · Confirm target and eligible spell/damage or water movement.
- Open sheet gap · Swim speed and curse tracking/bonuses absent.

### Level 1 · Curse of the Sea

Source rules.

- Generic action model · Curse of the Sea: source rules or unverified dedicated path (When you choose this origin at 1st level, you learn the secret of infusing your spells with a watery curse. When you hit a creature with a cantrip’s attack or when a creature fails a saving throw against your cantrip, you can curse the target until the end of your next turn or until you curse a different creature with this feature. Once per turn when you cast a spell, you can trigger the curse if that spell deals cold or lightning damage to the cursed target or forces it to move. Doing so subjects the target to the appropriate additional effect below, and then the curse ends if the spell isn’t a cantrip (you choose the effect to use if more than one effect applies): - Cold Damage._ If the affected target takes cold damage from your spell, the target’s speed is also reduced by 15 feet until the end of your next turn. If the spell already reduces the target’s speed, use whichever reduction is greater. - Lightning Damage._ If the affected target takes lightning damage from your spell, the target takes additional lightning damage equal to your Charisma modifier. - Forced Movement._ If the target is moved by your spell, increase the distance it is moved by 15 feet.)
- Table fact · Confirm target and eligible spell/damage or water movement.
- Open sheet gap · Swim speed and curse tracking/bonuses absent.

### Level 6 · Watery Defense

Typed incoming fire resistance and generic rest spend.

- Counters · Watery Defense; 1 uses at probe level; short reset verified
- Generic action model · Watery Defense: spends 1 from expanded:2014:sorcerer:2014:subclass:sorcerer:sea-sorcery-ua:resource:watery-defense (You also gain the ability to defend yourself by momentarily assuming a watery form. As a reaction when you are hit by an attack and take bludgeoning, piercing, or slashing damage from it, you can reduce that damage by an amount equal to your sorcerer level plus your Charisma score, and then you can move up to 30 feet without provoking opportunity attacks. Once you use this special reaction, you can’t use it again until you finish a short or long rest.)
- Recognized numeric routes · resistance
- Table fact · Confirm attack type, reaction, available movement and paths.
- Open sheet gap · Missing own damage reduction and movement trigger.

### Level 14 · Shifting Form

Water Soul typed physical resistance.

- Generic action model · Shifting Form: source rules or unverified dedicated path (Starting at 14th level, you gain the ability to enter a liquid state while moving. When you move on your turn, you take only half damage from opportunity attacks, and you can move through any enemy’s space but can’t willingly end your move there. On your turn, you can move through any space that is at least 3 inches in diameter and do so without squeezing. When you stop moving, the regular squeezing rules apply if you’re in a space one size smaller than you. You can’t willingly stop in a space smaller than that, and if you’re forced to do so, you immediately flow to the nearest space that can fit you, back along the path of your movement.)
- Table fact · Confirm qualifying space and nonmagical movement restrictions.
- Open sheet gap · Other movement and own crit conversion lack consumers.

### Level 18 · Water Soul

Water Soul typed physical resistance.

- Recognized numeric routes · resistance
- Table fact · Confirm qualifying space and nonmagical movement restrictions.
- Open sheet gap · Other movement and own crit conversion lack consumers.

## Sorcerer — Shadow (UA)

Entry level 1 · [Unearthed Arcana 10 - Light, Dark, Underdark!](https://dnd5e.wikidot.com/sorcerer:shadow-ua)

### Level 1 · Eyes of the Dark

Dedicated Darkness using 2 points published at owner 3 or 1 point UA at owner 1, with concentration and visible spell effects.

- Dedicated plans · darkness-points via executeTriggeredFeature / executeConditionalAction (See through darkness from this casting. UA feature does not explicitly add a known spell.)
- Numeric effects awaiting verification · darkvision
- Table fact · Confirm darkvision conditions, map geometry and eligible targets.
- Open sheet gap · Own darkvision and can-see-through source Darkness are reference.

### Level 1 · Strength of the Grave

- Table fact · Confirm not critical/radiant, nonlethal and source recovery.
- Open sheet gap · No zero-HP trigger/Cha save and 1HP survival mutation.

### Level 6 · Hound of Ill Omen

Dedicated multiple independent 3-point pets; target/range confirmation, typed profile (published monstrosity + creation-only half owner-level temp HP vs UA beast), own attacks/saves/conditions/HP/lifecycle and true reload. C2 actual test.

- Dedicated plans · summon-hound via executeTriggeredFeature / executeConditionalAction (Choose a visible target; published target within120ft; summon within30ft target. Dire wolf statistics with stated source changes.) · summon-hound via executeTriggeredFeature / executeConditionalAction (Bonus action; visible target within120ft; hound appears within30ft of target. Hound has half Sorcerer level tempHP; lasts5minutes; target within5ft has disadvantage on saves against your spells. Hound sheet in companions.)
- Table fact · Confirm target, placement/path, Pack Tactics and whether neighbor's spell save disadvantage applies.

### Level 14 · Shadow Walk

Dedicated confirmed source action/instructions.

- Dedicated plans · shadow-walk via executeTriggeredFeature / executeConditionalAction (Start in dim light/darkness; destination visible within120ft also dim light/darkness.)
- Table fact · Confirm initial and destination dim light/darkness, visible empty space/range.

### Level 18 · Shadow Form

3 points buy one-minute state; typed resistances except force (including radiant).

- Dedicated plans · shadow-form via executeTriggeredFeature / executeConditionalAction (Published lasts1minute and resists all except force/radiant. UA lasts1minute and resists all except force.) · shadow-form via executeTriggeredFeature / executeConditionalAction (Bonus action;1 minute; resistance to all except force; move through creatures/objects as difficult terrain;5force if ending turn inside object.)
- Table fact · Confirm obstacle movement/end position.
- Open sheet gap · No end-turn inside-object own force-damage consumer.

## Sorcerer — Stone Sorcery (UA)

Entry level 1 · [Unearthed Arcana 28 - Sorcerer](https://dnd5e.wikidot.com/sorcerer:stone-sorcery-ua)

Source spell progression · level 1 expanded: Compelled Duel, Searing Smite, Thunderous Smite, Wrathful Smite · level 3 expanded: Branding Smite, Magic Weapon · level 5 expanded: Blinding Smite, Elemental Weapon · level 7 expanded: Staggering Smite

### Level 1 · Bonus Proficiencies

Shields and simple/martial weapons consumed by training.

- Training grants · shields · simple · martial

### Level 1 · Metal Magic

Source additional eligible spell list, inspect runtime grants.

- Generic action model · Metal Magic: source rules or unverified dedicated path (Your affinity for metal gives you the option to learn some non-sorcerer spells that focus on weapon attacks. When your Spellcasting feature lets you learn a sorcerer spell of 1st level or higher, you can select the spell from the following list of spells, in addition to the sorcerer spell list. You must otherwise obey all the restrictions for selecting the spell, and it becomes a sorcerer spell for you.)

### Level 1 · Stone's Durability

Owner class-level HP bonus and explicit toggle gates 13+Con alternate AC while not armored and retained; ends on incapacity.

- Generic action model · Stone's Durability: source rules or unverified dedicated path (At 1st level, your connection to stone gives you extra fortitude. Your hit point maximum increases by 1, and it increases by 1 again whenever you gain a level in this class. As an action, you can gain a base AC of 13 + your Constitution modifier if you aren’t wearing armor, and your skin assumes a stony appearance. This effect lasts until you end it as a bonus action, you are incapacitated, or you don armor other than a shield.)
- Recognized numeric routes · hp-max-bonus · ac (Stone skin activated; no armor except shield; ends incapacitated or dismissed)
- Table fact · Confirm action and remove incompatible armor.

### Level 6 · Stone Aegis

Triggered controls where present.

- Dedicated plans · stone-aegis via executeTriggeredFeature / executeConditionalAction (One visible ally within60ft; lasts1minute or until replaced/incapacitated.) · aegis-counter via executeTriggeredFeature / executeConditionalAction (Visible creature within60ft hits protected ally with melee attack; same surface as attacker; teleport to visible unoccupied space within5ft attacker and may make one melee weapon attack.)
- Numeric effects awaiting verification · physical-damage-reduction (Chosen ally aegis active; bludgeoning/piercing/slashing only)
- Table fact · Confirm ally target, incoming hit/attacker/position or damage to target.
- Open sheet gap · No lasting multi-target ward/mitigation or spell hit force-damage effect.

### Level 14 · Stone's Edge

Triggered controls where present.

- Generic action model · Stone's Edge: source rules or unverified dedicated path (Starting at 14th level, your mastery of earth magic allows you to add the force of elemental earth to your spells. When you cast a spell that deals damage, choose one creature damaged by that spell on the round you cast it. That creature takes extra force damage equal to half your sorcerer level. This feature can be used only once per casting of a spell.)
- Numeric effects awaiting verification · force-spell-damage (One creature damaged on round spell cast; once per casting)
- Table fact · Confirm ally target, incoming hit/attacker/position or damage to target.
- Open sheet gap · No lasting multi-target ward/mitigation or spell hit force-damage effect.

### Level 18 · Earth Master's Aegis

Triggered controls where present.

- Generic action model · Earth Master's Aegis: source rules or unverified dedicated path (Beginning at 18th level, when you use your Stone’s Aegis to protect an ally, you can choose up to three creatures to gain its benefits.)
- Table fact · Confirm ally target, incoming hit/attacker/position or damage to target.
- Open sheet gap · No lasting multi-target ward/mitigation or spell hit force-damage effect.

## Warlock — Archfey

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/warlock:archfey)

Source spell progression · level 1 expanded: Faerie Fire, Sleep · level 3 expanded: Calm Emotions, Phantasmal Force · level 5 expanded: Blink, Plant Growth · level 7 expanded: Dominate Beast, Greater Invisibility · level 9 expanded: Dominate Person, Seeming

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Archfey lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Fey Presence

Generic use where routed.

- Counters · Fey Presence; 1 uses at probe level; short reset verified
- Generic action model · Fey Presence: spends 1 from expanded:2014:warlock:2014:subclass:warlock:archfey:resource:fey-presence (Starting at 1st level, your patron bestows upon you the ability to project the beguiling and fearsome presence of the fey. As an action, you can cause each creature in a 10-foot cube originating from you to make a Wisdom saving throw against your warlock spell save DC. The creatures that fail their saving throws are all charmed or frightened by you (your choice) until the end of your next turn.)
- Table fact · Confirm visibility/range, trigger, creatures and Wisdom saves.
- Open sheet gap · Misty Escape lacks timed own invisibility; Dark Delirium no concentration.

### Level 6 · Misty Escape

Generic use where routed.

- Counters · Misty Escape; 1 uses at probe level; short reset verified
- Generic action model · Misty Escape: spends 1 from expanded:2014:warlock:2014:subclass:warlock:archfey:resource:misty-escape (Starting at 6th level, you can vanish in a puff of mist in response to harm. When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet to an unoccupied space you can see. You remain invisible until the start of your next turn or until you attack or cast a spell.)
- Table fact · Confirm visibility/range, trigger, creatures and Wisdom saves.
- Open sheet gap · Misty Escape lacks timed own invisibility; Dark Delirium no concentration.

### Level 10 · Beguiling Defenses

Source rules.

- Generic action model · Beguiling Defenses: source rules or unverified dedicated path (Beginning at 10th level, your patron teaches you how to turn the mind-affecting magic of your enemies against them. You are immune to being charmed, and when another creature attempts to charm you, you can use your reaction to attempt to turn the charm back on that creature. The creature must succeed on a Wisdom saving throw against your warlock spell save DC or be charmed by you for 1 minute or until the creature takes any damage.)
- Numeric effects awaiting verification · condition-immunity
- Table fact · Confirm charm attempt and source Wisdom save/reflection.
- Open sheet gap · No own charm immunity or dedicated reaction.

### Level 14 · Dark Delirium

Generic use where routed.

- Counters · Dark Delirium; 1 uses at probe level; short reset verified
- Generic action model · Dark Delirium: spends 1 from expanded:2014:warlock:2014:subclass:warlock:archfey:resource:dark-delirium (Starting at 14th level, you can plunge a creature into an illusory realm. As an action, choose a creature that you can see within 60 feet of you. It must make a Wisdom saving throw against your warlock spell save DC. On a failed save, it is charmed or frightened by you (your choice) for 1 minute or until your concentration is broken (as if you are concentrating on a spell). This effect ends early if the creature takes any damage. You must finish a short or long rest before you can use this feature again.)
- Table fact · Confirm visibility/range, trigger, creatures and Wisdom saves.
- Open sheet gap · Misty Escape lacks timed own invisibility; Dark Delirium no concentration.

## Warlock — Celestial

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/warlock:celestial)

Source spell progression · level 1 known: Light, Sacred Flame · level 1 expanded: Cure Wounds, Guiding Bolt · level 3 expanded: Flaming Sphere, Lesser Restoration · level 5 expanded: Daylight, Revivify · level 7 expanded: Guardian of Faith, Wall of Fire · level 9 expanded: Flame Strike, Greater Restoration

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Celestial lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Bonus Cantrips

Light and Sacred Flame outside ordinary known quota.


### Level 1 · Healing Light

Dedicated 1+owner level pool; up to Cha (minimum 1) d6, visible combined roll and capped self heal.

- Counters · Healing Light; 2 uses at probe level; long reset verified
- Dedicated plans · healing-light via executeTriggeredFeature / executeConditionalAction (Creature visible within60ft. Choose1..max(1,cha) available dice; cost is chosen dice count.) · healing-light via useHealingFeature
- Table fact · Confirm visible creature/range; other recipient HP at table.

### Level 6 · Radiant Soul

Own typed radiant resistance.

- Generic action model · Radiant Soul: source rules or unverified dedicated path (Starting at 6th level, your link to the Celestial allows you to serve as a conduit for radiant energy. You have resistance to radiant damage, and when you cast a spell that deals radiant or fire damage, you add your Charisma modifier to one radiant or fire damage roll of that spell against one of its targets.)
- Recognized numeric routes · resistance
- Numeric effects awaiting verification · spell-damage-bonus (One target; radiant/fire spell; published adds to one radiant/fire damage roll)
- Table fact · Confirm qualifying radiant/fire spell.
- Open sheet gap · No Cha bonus to one eligible damage roll.

### Level 10 · Celestial Resistance

Source rules.

- Numeric effects awaiting verification · temporary-hp (Finish short or long rest) · ally-temporary-hp (Up to five visible creatures chosen at rest end)
- Table fact · Confirm rest, select eligible visible allies and apply temp HP.
- Open sheet gap · No automatic self level+Cha temp HP on rest.

### Level 14 · Searing Vengeance

Dedicated zero-HP death-save replacement, visible 2d8+Cha, tracked long-rest spend, capped half max HP own heal.

- Counters · Searing Vengeance; 1 uses at probe level; long reset verified
- Generic action model · Searing Vengeance: spends 1 from expanded:2014:warlock:2014:subclass:warlock:celestial:resource:searing-vengeance (Starting at 14th level, the radiant energy you channel allows you to resist death. When you have to make a death saving throw at the start of your turn, you can instead spring back to your feet with a burst of radiant energy. You regain hit points equal to half your hit point maximum, and then you stand up if you so choose. Each creature of your choice that is within 30 feet of you takes radiant damage equal to 2d8 + your Charisma modifier, and is blinded until the end of the current turn.)
- Dedicated plans · searing-vengeance via useHealingFeature
- Table fact · Confirm start of turn/zero HP; standing choice and external radiant damage/blinded until turn end.

## Warlock — Fathomless

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/warlock:fathomless)

Source spell progression · level 1 expanded: Create or Destroy Water, Thunderwave · level 3 expanded: Gust of Wind, Silence · level 5 expanded: Lightning Bolt, Sleet Storm · level 7 expanded: Control Water, Summon Elemental · level 9 expanded: Bigby's Hand, Cone of Cold

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Fathomless lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Tentacle of the Deep

Generic tentacle pool.

- Counters · Tentacle of the Deep; 2 uses at probe level; long reset verified
- Generic action model · Tentacle of the Deep: spends 1 from expanded:2014:warlock:2014:subclass:warlock:fathomless:resource:tentacle-summon (At 1st level, you can magically summon a spectral tentacle that strikes at your foes. As a bonus action, you create a 10-foot-long tentacle at a point you can see within 60 feet of you. The tentacle lasts for 1 minute or until you use this feature to create another tentacle. When you create the tentacle, you can make a melee spell attack against one creature within 10 feet of it. On a hit, the target takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn. When you reach 10th level in this class, the damage increases to 2d8. As a bonus action on your turn, you can move the tentacle up to 30 feet and repeat the attack. You can summon the tentacle a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm target, range, reach, tentacle position, cold hit, and damage-to-ally context.
- Open sheet gap · No persisted tentacle tied to movement/range/actual strike or self damage reduction.

### Level 1 · Gift of the Sea

Source rules.

- Numeric effects awaiting verification · swim-speed (Also breathe underwater)
- Table fact · Determine underwater position.
- Open sheet gap · Swim speed and breathing lack sheet consumer.

### Level 6 · Oceanic Soul

Typed cold resistance.

- Recognized numeric routes · resistance
- Table fact · Confirm underwater speech.

### Level 6 · Guardian Coil

Generic tentacle pool.

- Generic action model · Guardian Coil: source rules or unverified dedicated path (At 6th level, your Tentacle of the Deeps can defend you and others, interposing itself between them and harm. When you or a creature you can see takes damage while within 10 feet of the tentacle, you can use your reaction to choose one of those creatures and reduce the damage to that creature by 1d8. When you reach 10th level in this class, the damage reduced by the tentacle increases to 2d8.)
- Table fact · Confirm target, range, reach, tentacle position, cold hit, and damage-to-ally context.
- Open sheet gap · No persisted tentacle tied to movement/range/actual strike or self damage reduction.

### Level 10 · Grasping Tentacles

Generic source use.

- Counters · Grasping Tentacles; 1 uses at probe level; long reset verified
- Generic action model · Grasping Tentacles: spends 1 from expanded:2014:warlock:2014:subclass:warlock:fathomless:resource:grasping-tentacles (Starting at 10th level, you learn the spell Evard's Black Tentacles. It counts as a warlock spell for you, but it doesn't count against the number of spells you know. You can also cast it once without using a spell slot, and you regain the ability to do so when you finish a long rest. Whenever you cast this spell, your patron's magic bolsters you, granting you a number of temporary hit points equal to your warlock level. Moreover, damage can't break your concentration on this spell.)
- Table fact · Confirm target and spell area/save.
- Open sheet gap · No dedicated free Black Tentacles with self temp HP and concentration protection.

### Level 14 · Fathomless Plunge

Generic source use.

- Counters · Fathomless Plunge; 1 uses at probe level; short reset verified
- Generic action model · Fathomless Plunge: spends 1 from expanded:2014:warlock:2014:subclass:warlock:fathomless:resource:fathomless-plunge (When you reach 14th level, you can magically open temporary conduits to watery destinations. As an action, you can teleport yourself and up to five other willing creatures that you can see within 30 feet of you. Amid a whirl of tentacles, you all vanish and then reappear up to 1 mile away in a body of water you've seen (pond size or larger) or within 30 feet of it, each of you appearing in an unoccupied space within 30 feet of the others.)
- Table fact · Confirm willing creatures, appropriate water and destination.

## Warlock — Fiend

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/warlock:fiend)

Source spell progression · level 1 expanded: Burning Hands, Command · level 3 expanded: Blindness/Deafness, Scorching Ray · level 5 expanded: Fireball, Stinking Cloud · level 7 expanded: Fire Shield, Wall of Fire · level 9 expanded: Flame Strike, Hallow

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Fiend lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Dark One's Blessing

Dedicated confirmed hostile kill grants self temporary HP from level+Cha.

- Generic action model · Dark One's Blessing: source rules or unverified dedicated path (Starting at 1st level, when you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).)
- Dedicated plans · dark-ones-blessing via useHealingFeature
- Numeric effects awaiting verification · temporary-hp (Reduce hostile creature to0hp; minimum1 in source)
- Table fact · Confirm owner reduced hostile creature to zero.
- Open sheet gap · Minimum 1 missing at low Cha.

### Level 6 · Dark One's Own Luck

Dedicated visible d10 plus real rest spend.

- Counters · Dark One's Own Luck; 1 uses at probe level; short reset verified
- Dedicated plans · dark-luck via executeTriggeredFeature / executeConditionalAction (After initial roll but before effects occur.)
- Table fact · Confirm eligible check/save before adjudication.
- Open sheet gap · Separate result does not patch original roll.

### Level 10 · Fiendish Resilience

Rest damage-type choice stored.

- Choice controls · fiend-resistance (rest)
- Generic action model · Fiendish Resilience: source rules or unverified dedicated path (Starting at 10th level, you can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.)
- Table fact · Confirm chosen type and silvered/magic weapon exceptions.
- Open sheet gap · Choice does not affect incoming typed damage.

### Level 14 · Hurl Through Hell

Generic use.

- Counters · Hurl Through Hell; 1 uses at probe level; long reset verified
- Generic action model · Hurl Through Hell: spends 1 from expanded:2014:warlock:2014:subclass:warlock:fiend:resource:hurl-through-hell (Starting at 14th level, when you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space. If the target is not a fiend, it takes 10d10 psychic damage as it reels from its horrific experience.)
- Table fact · Confirm attack hit, target type and return position after next turn.
- Open sheet gap · No dedicated external 10d10 output/control.

## Warlock — Genie

Entry level 1 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/warlock:the-genie)

Source spell progression · level 1 expanded: Detect Evil and Good, Sanctuary, Thunderwave, Burning Hands, Fog Cloud · level 3 expanded: Phantasmal Force, Spike Growth, Gust of Wind, Scorching Ray, Blur · level 5 expanded: Create Food and Water, Meld into Stone, Wind Wall, Fireball, Sleet Storm · level 7 expanded: Phantasmal Killer, Stone Shape, Greater Invisibility, Fire Shield, Control Water · level 9 expanded: Creation, Wall of Stone, Seeming, Flame Strike, Cone of Cold · level 17 expanded: Wish

### Level 1 · Expanded Spell List

Genie access-only by kind; level-17 Mystic Arcanum selection admits Wish and casts without slot with separate long-rest use.

- Choice controls · genie-kind (advancement)
- Generic action model · Expanded Spell List: source rules or unverified dedicated path (At 1st level, the Genie lets you choose from an expanded list of spells when you learn a warlock spell. The Genie Expanded Spells table shows the genie spells that are added to the warlock spell list for you, along with the spells associated in the table with your patron's kind: dao, djinni, efreeti, or marid.)
- Table fact · Confirm kind.

### Level 1 · Genie's Vessel

Genie choice gates spell access; generic pools where offered.

- Counters · Genie's Vessel; 1 uses at probe level; long reset verified
- Generic action model · Genie's Vessel: source rules or unverified dedicated path (Also at 1st level, your patron gifts you a magical vessel that grants you a measure of the genie's power. The vessel is a Tiny object, and you can use it as a spellcasting focus for your warlock spells. You decide what the object is, or you can determine what it is randomly by rolling on the Genie's Vessel table. While you are touching the vessel, you can use it in the following ways: - Bottled Respite: As an action, you can magically vanish and enter your vessel, which remains in the space you left. The interior of the vessel is an extradimensional space in the shape of a 20-foot-radius cylinder, 20 feet high, and resembles your vessel. The interior is appointed with cushions and low tables and is a comfortable temperature. While inside, you can hear the area around your vessel as if you were in its space. You can remain inside the vessel up to a number of hours equal to twice your proficiency bonus. You exit the vessel early if you use a bonus action to leave, if you die, or if the vessel is destroyed. When you exit the vessel, you appear in the unoccupied space closest to it. Any objects left in the vessel remain there until carried out, and if the vessel is destroyed, every object stored there harmlessly appears in the unoccupied spaces closest to the vessel's former space. Once you enter the vessel, you can't enter again until you finish a long rest. - Genie's Wrath: Once during each of your turns when you hit with an attack roll, you can deal extra damage to the target equal to your proficiency bonus. The type of this damage is determined by your patron: bludgeoning (dao), thunder (djinni), fire (efreeti), or cold (marid). If the vessel is destroyed or you lose it, you can perform a 1-hour ceremony to receive a replacement from your patron. This ceremony can be performed during a short or long rest, and the previous vessel is destroyed if it still exists. The vessel vanishes in a flare of elemental power when you die.)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 6 · Elemental Gift

Genie choice gates spell access; generic pools where offered.

- Counters · Elemental Gift; 3 uses at probe level; long reset verified
- Generic action model · Elemental Gift: spends 1 from expanded:2014:warlock:2014:subclass:warlock:the-genie:resource:elemental-gift (In addition, as a bonus action, you can give yourself a flying speed of 30 feet that lasts for 10 minutes, during which you can hover. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Numeric effects awaiting verification · resistance (Dao:bludgeoning; Djinni:thunder; Efreeti:fire; Marid:cold) · fly-speed (Elemental Gift active 10 minutes; hover)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 10 · Sanctuary Vessel

Genie choice gates spell access; generic pools where offered.

- Generic action model · Sanctuary Vessel: source rules or unverified dedicated path (At 10th level, when you enter your Genie's Vessel via the Bottled Respite feature, you can now choose up to five willing creatures that you can see within 30 feet of you, and the chosen creatures are drawn into the vessel with you. As a bonus action, you can eject any number of creatures from the vessel, and everyone is ejected if you leave or die or if the vessel is destroyed. In addition, anyone (including you) who remains within the vessel for at least 10 minutes gains the benefit of finishing a short rest, and anyone can add your proficiency bonus to the number of hit points they regain if they spend any Hit Dice as part of a short rest there.)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 14 · Limited Wish

Dedicated level<=6 action spell selection, visible supported effects, self effect by shared spell handler, d4 long-rest cooldown.

- Counters · Limited Wish; 1 uses at probe level; none reset
- Dedicated plans · limited-wish via useCooldownFeature
- Table fact · Confirm external target/save, spell effect choice and timing.
- Open sheet gap · Validate attack-spell callbacks; cooldown control rolls spell plan effects without ordinary per-attack resolution.

## Warlock — Great Old One

Entry level 1 · [Player's Handbook](https://dnd5e.wikidot.com/warlock:great-old-one)

Source spell progression · level 1 expanded: Dissonant Whispers, Tasha's Hideous Laughter · level 3 expanded: Detect Thoughts, Phantasmal Force · level 5 expanded: Clairvoyance, Sending · level 7 expanded: Dominate Beast, Evard's Black Tentacles · level 9 expanded: Dominate Person, Telekinesis

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Great Old One lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Awakened Mind

Source rules.

- Table fact · Confirm telepathic recipient/range/language.

### Level 6 · Entropic Ward

Generic source use.

- Counters · Entropic Ward; 1 uses at probe level; short reset verified
- Generic action model · Entropic Ward: spends 1 from expanded:2014:warlock:2014:subclass:warlock:great-old-one:resource:entropic-ward (At 6th level, you learn to magically ward yourself against attack and to turn an enemy's failed strike into good luck for yourself. When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll. If the attack misses you, your next attack roll against the creature has advantage if you make it before the end of your next turn.)
- Table fact · Confirm triggering attack/miss and next eligible attack.
- Open sheet gap · No real attack-context defender disadvantage or subsequent self advantage.

### Level 10 · Thought Shield

Typed psychic resistance.

- Recognized numeric routes · resistance (Reflect same psychic damage to attacker; thoughts unreadable unless allowed)
- Table fact · Confirm telepathic defense and pass received damage back to external source.

### Level 14 · Create Thrall

Source rules.

- Generic action model · Create Thrall: source rules or unverified dedicated path (At 14th level, you gain the ability to infect a humanoid's mind with the alien magic of your patron. You can use your action to touch an incapacitated humanoid. That creature is then charmed by you until a Remove Curse spell is cast on it, the charmed condition is removed from it, or you use this feature again.)
- Table fact · Confirm incapacitated humanoid touch, removal conditions and communication.
- Open sheet gap · No persistent thrall relationship control.

## Warlock — Hexblade

Entry level 1 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/warlock:hexblade)

Source spell progression · level 1 expanded: Shield, Wrathful Smite · level 3 expanded: Blur, Branding Smite · level 5 expanded: Blink, Elemental Weapon · level 7 expanded: Phantasmal Killer, Staggering Smite · level 9 expanded: Banishing Smite, Cone of Cold

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Hexblade lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Hexblade's Curse

Generic pool.

- Counters · Hexblade's Curse; 1 uses at probe level; short reset verified
- Generic action model · Hexblade's Curse: spends 1 from expanded:2014:warlock:2014:subclass:warlock:hexblade:resource:hexblade-s-curse (Starting at 1st level, you gain the ability to place a baleful curse on someone. As a bonus action, choose one creature you can see within 30 feet of you. The target is cursed for 1 minute. The curse ends early if the target dies, you die, or you are incapacitated. Until the curse ends, you gain the following benefits: - If the cursed target dies, you regain hit points equal to your warlock level + your Charisma modifier (minimum of 1 hit point).)
- Numeric effects awaiting verification · damage-bonus (Damage rolls against currently cursed target) · critical-range (Attack rolls against currently cursed target)
- Table fact · Confirm cursed creature/range/death and target damage.
- Open sheet gap · No named target state, PB damage, 19–20 crit or capped death heal.

### Level 1 · Hex Warrior

Source training, actual confirmed proficient non-two-handed weapon uses Cha, UA only melee, published can separately bind confirmed Pact weapon at own 3. Published ordinary bond clears at long rest.

- Training grants · medium · shields · martial
- Generic action model · Hex Warrior: source rules or unverified dedicated path (The influence of your patron also allows you to mystically channel your will through a particular weapon. Whenever you finish a long rest, you can touch one weapon that you are proficient with and that lacks the two-handed property. When you attack with that weapon, you can use your Charisma modifier, instead of Strength or Dexterity, for the attack and damage rolls. This benefit lasts until you finish a long rest. If you later gain the Pact of the Blade feature, this benefit extends to every pact weapon you conjure with that feature, no matter the weapon's type.)
- Numeric effects awaiting verification · weapon-ability (Chosen eligible weapon; extends to pact weapon per published text)
- Table fact · Confirm eligibility, touch and actual Pact property.

### Level 6 · Accursed Specter

Slain humanoid bind, real long-rest cost, creation temp HP, Cha attack adjustment, own profile/conditions/rolls and persistent HP. Cleans up at zero or next long rest. C2 actual reload/rest.

- Counters · Accursed Specter; 1 uses at probe level; long reset verified
- Table fact · Confirm victim/spawn/initiative, command, sunlight and external target.

### Level 10 · Armor of Hexes

Dedicated visible d6 with confirmation/result record.

- Dedicated plans · armor-of-hexes via executeTriggeredFeature / executeConditionalAction (Your Hexblade’s Curse target hits you with an attack roll.)
- Table fact · Confirm cursed attacker and hit; apply miss if 4+.
- Open sheet gap · No curse state linking identity or adjudicating actual attack.

### Level 14 · Master of Hexes

Source rules.

- Generic action model · Master of Hexes: source rules or unverified dedicated path (Starting at 14th level, you can spread your Hexblade's Curse from a slain creature to another creature. When the creature cursed by your Hexblade's Curse dies, you can apply the curse to a different creature you can see within 30 feet of you, provided you aren't incapacitated. When you apply the curse in this way, you don't regain hit points from the death of the previously cursed creature.)
- Table fact · Confirm proximity, original target death, eligible replacement.
- Open sheet gap · No transfer/reapplication state.

## Warlock — Undead

Entry level 1 · [Van Richten's Guide to Ravenloft](https://dnd5e.wikidot.com/warlock:undead)

Source spell progression · level 1 expanded: Bane, False Life · level 3 expanded: Blindness/Deafness, Phantasmal Force · level 5 expanded: Phantom Steed, Speak with Dead · level 7 expanded: Death Ward, Greater Invisibility · level 9 expanded: Antilife Shell, Cloudkill

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (At 1st level, the Undead lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Form of Dread

Actual use, visible d10+owner level temp HP and minute state.

- Counters · Form of Dread; 2 uses at probe level; long reset verified
- Dedicated plans · form-of-dread via activateSubclassForm
- Numeric effects awaiting verification · temporary-hp (On transformation) · condition-immunity (Form of Dread active)
- Table fact · Confirm eligible hit and target Wisdom save.
- Open sheet gap · Frightened immunity exists on active profile; verify actual condition-input enforcement. Missing per-turn hit trigger.

### Level 6 · Grave Touched

Source rules.

- Generic action model · Grave Touched: source rules or unverified dedicated path (In addition, once during each of your turns, when you hit a creature with an attack and roll damage against the creature, you can replace the damage type with necrotic damage. While you are using your Form of Dread, you can roll one additional damage die when determining the necrotic damage the target takes.)
- Table fact · Confirm eligible damage and Dread state.
- Open sheet gap · No own damage type conversion, extra die or once-turn guard.

### Level 10 · Necrotic Husk

Typed necrotic defense becomes immunity during Dread, dedicated zero-HP 1 HP/exhaustion and visible effect/cooldown.

- Counters · Necrotic Husk; 1 uses at probe level; none reset
- Dedicated plans · necrotic-husk via useCooldownFeature
- Numeric effects awaiting verification · resistance (Immunity while Form of Dread active)
- Table fact · Confirm source trigger and chosen creatures/range, apply external damage.

### Level 14 · Spirit Projection

Concentration/one hour, actual use and typed physical resistance/flight. Valid Projection+Dread enables once-turn own capped heal from half actual necrotic damage dealt.

- Counters · Spirit Projection; 1 uses at probe level; long reset verified
- Dedicated plans · projection-heal via executeTriggeredFeature / executeConditionalAction (Projection and Form of Dread active; once on your turn after necrotic damage. Enter actual necrotic damage dealt; regain half.) · spirit-projection via activateSubclassForm
- Table fact · Confirm actual damage, body position and movement.
- Open sheet gap · No body damage mirroring/inside-object scaling or spell component exception.

## Warlock — Undying

Entry level 1 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/warlock:undying)

Source spell progression · level 1 known: Spare the Dying · level 1 expanded: False Life, Ray of Sickness · level 3 expanded: Blindness/Deafness, Silence · level 5 expanded: Feign Death, Speak with Dead · level 7 expanded: Aura of Life, Death Ward · level 9 expanded: Contagion, Legend Lore

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Undying lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Among the Dead

Source-known Spare the Dying.

- Table fact · Confirm undead attacker, save, timeline and immunity to further interactions.
- Open sheet gap · No disease save advantage in actual own roll.

### Level 6 · Defy Death

Dedicated visible capped self heal and true source use; Defy has zero-HP allowance.

- Counters · Defy Death; 1 uses at probe level; long reset verified
- Dedicated plans · defy-death via executeTriggeredFeature / executeConditionalAction (Succeed death saving throw OR stabilize creature with Spare the Dying.) · defy-death via useHealingFeature
- Table fact · Confirm successful death save, or another stabilized by Spare the Dying; eligible limb placed for reattachment.

### Level 10 · Undying Nature

Source rules.

- Table fact · Confirm age, sustenance, breathing and rest.

### Level 14 · Indestructible Life

Dedicated visible capped self heal and true source use; Defy has zero-HP allowance.

- Counters · Indestructible Life; 1 uses at probe level; short reset verified
- Dedicated plans · indestructible-life via executeTriggeredFeature / executeConditionalAction (Can reattach severed body part when using feature.) · indestructible-life via useHealingFeature
- Table fact · Confirm successful death save, or another stabilized by Spare the Dying; eligible limb placed for reattachment.

## Warlock — Mage of Lorehold (UA)

Entry level 1 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-lorehold-ua)

Source spell progression · level 1 known: Sacred Flame, Comprehend Languages · level 3 known: Knock, Locate Object · level 5 known: Speak with Dead, Spirit Guardians · level 7 known: Arcane Eye, Stone Shape · level 9 known: Destructive Wave, Legend Lore

### Level 1 · Lorehold Spells

Source-known grants outside quota, clipped by owning class unlocks and source conditions recorded per spell.

- Generic action model · Lorehold Spells: source rules or unverified dedicated path (You learn the cantrip Sacred Flame and the 1st level spell Comprehend Languages. You learn additional spells when you reach certain levels in this class, as shown on the Lorehold Spells table. Each of these spells counts as a class spell for you, but it doesn’t count against the number of spells you know. If you are a wizard, you can add these spells to your spellbook upon learning them, without expending any gold, and prepare them as normal.)

### Level 1 · Ancient Companion

One source-owned ancient bond globally across classes. Dedicated Healer/Sage/Warrior profile, actual owner rolls for eligible callbacks, companion conditions/HP/command/slot heal/replacement/reload/source cleanup. C2 25/25 and actual Bard-to-Wizard replacement.

- Choice controls · ancient-spirit (rest)
- Table fact · Confirm statue/source and external targets, range, commands or rest.

### Level 6 · Lessons of the Past

Selected owner feature plus actual bond type gates Healer signed owner-level max/current HP and eligible self spell d8, Sage skill advantage/verified once-turn damage and Warrior cantrip-to-weapon/use hit rider.

- Numeric effects awaiting verification · hp-max-and-current-bonus (Healer companion bonded AND Lessons of the Past chosen as later subclass feature) · spell-healing-received-bonus (Healer companion bonded AND Lessons of the Past chosen; whenever regain HP from a spell) · spell-extra-force-damage (Sage companion bonded AND Lessons chosen; spell>=1; once/turn) · cantrip-action-weapon-attack (Warrior companion bonded AND Lessons chosen; action cast cantrip; attack part of same action adds1d8radiant on hit)
- Table fact · Confirm eligible healing target/spell damage/weapon hit and creature context.

### Level 10 · War Echoes

Dedicated owner DC/cost/once-turn and typed own vulnerability until end-next-turn only on confirmed failed save.

- Counters · War Echoes; 4 uses at probe level; long reset verified
- Table fact · Confirm visible trigger and target save; apply external vulnerability.

### Level 14 · History’s Whims

One-minute selected-different-each-turn state, use or actual 4+ slot; Swiftness +15, contextual Luck d6 on actual damage-related own save, Resistance typed B/P/S.

- Choice controls · history-mode (activation)
- Counters · History’s Whims; 1 uses at probe level; long reset verified
- Table fact · Confirm damage context and opportunity-attack exception.

## Warlock — Mage of Silverquill (UA)

Entry level 1 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-silverquill-ua)

### Level 1 · Eloquent Apprentice

Two of five skill proficiencies; either Sacred Flame or Vicious Mockery bonus cantrip as available under source.

- Choice controls · eloquent-cantrip (advancement) · eloquent-skills (advancement)

### Level 1 · Silvery Barbs

Generic use.

- Counters · Silvery Barbs; 1 uses at probe level; long reset verified
- Generic action model · Silvery Barbs: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-silverquill-ua:resource:silvery-barbs (You can invoke words laced with magic to demoralize your foes and turn their misfortune into a boon to bolster your allies. Immediately after a creature you can see within 60 feet of you succeeds on an attack roll, an ability check, or a saving throw, you can use your reaction to demoralize the creature. Unless the creature is immune to being charmed, it rerolls the d20 and must use the lower roll. If the attack roll, ability check, or saving throw then fails, you can choose a different creature you can see within 60 feet of you (you can choose yourself). That creature is empowered, and can reroll one attack roll, ability check, or saving throw it makes within 1 minute and use the higher result. A creature can be empowered by only one use of this feature at a time.)
- Table fact · Confirm visible target's success and reroll, eligible second recipient advantage.
- Open sheet gap · Slot alternative/actual owned self recipient advantage require dedicated consumer.

### Level 6 · Inky Shroud

Owner flexible feature grants Darkness; dedicated free cast/default generic spell effect with actual pool.

- Counters · Inky Shroud; 1 uses at probe level; long reset verified
- Generic action model · Inky Shroud: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-silverquill-ua:resource:inky-shroud (You learn the Darkness spell, and it is added to your class spell list if it isn’t there already. If you are a wizard, you add it to your spellbook, if it’s not there already. You can cast the spell without expending a spell slot, and you can’t do so again until you finish a long rest. When you cast the spell in this way, you can see normally through the darkness created, and when a creature you can see starts its turn in the darkness, you can deal 2d10 psychic damage to that creature.)
- Table fact · Confirm targets/position.
- Open sheet gap · Verify casting uses owning Bard/Warlock Cha rather than default Int for Bard; seeing through created darkness is reference.

### Level 10 · Infusion of Eloquence

Later feature choice saved.

- Counters · Infusion of Eloquence; 4 uses at probe level; long reset verified
- Generic action model · Infusion of Eloquence: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-silverquill-ua:resource:infusion-of-eloquence (When you cast a spell that deals damage, you can invoke additional words of power to change the spell’s damage type to your choice of psychic or radiant. Any creature damaged by the spell takes extra damage equal to your proficiency bonus and has its emotions swayed with despair or adoration, based on the damage type dealt: You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm eligible damage or damage reduction and external target vulnerability/resistance.
- Open sheet gap · No actual infuse-spell damage conversion/bonus or Word of Power own resistance.

### Level 14 · Word of Power

Later feature choice saved.

- Generic action model · Word of Power: source rules or unverified dedicated path (Deadly Despair. When the target of your Silvery Barbs fails an attack roll, an ability check, or a saving throw because of the reroll, you can invoke a word of despair to give the target vulnerability to one damage type of your choice until the start of your next turn. Selfless Invocation. When a creature you can see within 60 feet of you takes damage, you can invoke a word of power using your reaction to grant the creature resistance to that damage, and you take an amount of psychic damage equal to the damage that creature takes.)
- Table fact · Confirm eligible damage or damage reduction and external target vulnerability/resistance.
- Open sheet gap · No actual infuse-spell damage conversion/bonus or Word of Power own resistance.

## Warlock — Mage of Witherbloom (UA)

Entry level 1 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-witherbloom-ua)

Source spell progression · level 1 known: Spare the Dying, Cure Wounds, Inflict Wounds · level 3 known: Lesser Restoration, Ray of Enfeeblement · level 5 known: Revivify, Vampiric Touch · level 7 known: Blight, Greater Restoration · level 9 known: Antilife Shell, Mass Cure Wounds

### Level 1 · Witherbloom Spells

Owner-specific spell advancement materialization and additional source training where declared.

- Generic action model · Witherbloom Spells: source rules or unverified dedicated path (You learn the cantrip Spare the Dying and the 1st level spells Cure Wounds and Inflict Wounds. You learn additional spells when you reach certain levels in this class, as shown on the Witherbloom Spells table. Each of these spells count as a class spell for you, but it doesn’t count against the number of spells you know. If you are a druid, you always have the spells prepared, and they don’t count against the number of spells you can prepare each day.)

### Level 1 · Essence Tap

Flexible owner choices and generic pool where present.

- Choice controls · essence-mode (activation)
- Counters · Essence Tap; 2 uses at probe level; long reset verified
- Generic action model · Essence Tap: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-witherbloom-ua:resource:essence-tap (As a bonus action, you can draw on a reservoir of life essence to empower yourself for 1 minute, or until you use this feature again. For the duration, you gain one of the following benefits of your choice: Overgrowth. When you choose this benefit, and as a bonus action on subsequent turns while the benefit lasts, you can expend and roll one Hit Die. You regain a number of hit points equal to the number rolled plus your spellcasting ability modifier. Withering Strike. When you deal damage, you can change the damage type to necrotic, and you ignore resistance to necrotic damage. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 6 · Witherbloom Brew

Flexible owner choices and generic pool where present.

- Choice controls · brew-mode (activation) · fortifying-element (activation)
- Counters · Witherbloom Brew; 3 uses at probe level; long reset verified
- Generic action model · Witherbloom Brew: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-witherbloom-ua:resource:witherbloom-brews (You gain proficiency with herbalism kits if you don’t already have it. When you finish a long rest, you can use an herbalism kit and a pot or cauldron to create magical brews. You create a number of brews equal to your proficiency bonus. Each brew requires its own flask. A brew retains its magical potency for 24 hours or until it is used. For each brew, choose one of the following effects: Fortifying. When you create this brew, choose a damage type from the following list: cold, fire, necrotic, poison, or radiant. A creature can drink this brew or administer it to another creature as an action. The recipient gains resistance to the chosen damage type for 1 hour. Quickening. A creature can drink this brew or administer it to another creature as an action. The recipient regains 2d6 hit points, and one disease or condition from the following list affecting the recipient ends (brew user’s choice): charmed, frightened, paralyzed, poisoned, stunned. Toxifying. As an action, a creature can apply this brew to a simple or martial weapon. The next time the weapon or a piece of ammunition fired by it hits a creature within 1 hour, the target takes 2d6 poison damage and must succeed on a Constitution saving throw against your spell save DC or be poisoned for 1 minute.)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 10 · Witherbloom Adept

Flexible owner choices and generic pool where present.

- Generic action model · Witherbloom Adept: source rules or unverified dedicated path (Your connection to the flow of life force deepens. Once per turn when you deal necrotic damage or restore hit points using a spell, one target of the spell takes additional damage or regains additional hit points equal to your proficiency bonus.)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

### Level 14 · Withering Vortex

Flexible owner choices and generic pool where present.

- Counters · Withering Vortex; 5 uses at probe level; long reset verified
- Generic action model · Withering Vortex: spends 1 from expanded:2014:warlock:2014:subclass:warlock:mage-of-witherbloom-ua:resource:withering-vortex (When you cast a spell using a spell slot that deals necrotic damage to any number of creatures that aren’t Undead or Constructs, choose one of the creatures that took damage. You drain an amount of life energy equal to half the damage dealt to the chosen creature. One creature other than yourself that you can see within 30 feet of you regains a number of hit points equal to the life energy drained. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm ingredients/brew recipient, target damage type and actual necrotic damage.
- Open sheet gap · No owned brew/expiry, Hit Die healing/effect state, typed spell rider, or triggered healing integrated.

## Warlock — Celestial (UA)

Entry level 1 · [Unearthed Arcana 40 - Revised Class Options](https://dnd5e.wikidot.com/warlock:celestial-ua)

Source spell progression · level 1 known: Light, Sacred Flame · level 1 expanded: Burning Hands, Cure Wounds · level 3 expanded: Flaming Sphere, Lesser Restoration · level 5 expanded: Daylight, Revivify · level 7 expanded: Guardian of Faith, Wall of Fire · level 9 expanded: Flame Strike, Greater Restoration

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Celestial lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Bonus Cantrips

Light and Sacred Flame outside ordinary known quota.


### Level 1 · Healing Light

Distinct source long-rest die pool.

- Counters · Healing Light; 2 uses at probe level; long reset verified
- Dedicated plans · healing-light via executeTriggeredFeature / executeConditionalAction (Creature visible within60ft. Choose1..max(1,cha) available dice; cost is chosen dice count.)
- Table fact · Confirm range and allocation.
- Open sheet gap · Published-only healing handler omits variants, generic action is hidden.

### Level 6 · Radiant Soul

Own typed radiant resistance.

- Generic action model · Radiant Soul: source rules or unverified dedicated path (Starting at 6th level, your link to the Celestial allows you to serve as a conduit for radiant energy. You have resistance to radiant damage, and when you cast a spell that deals radiant or fire damage, you add your Charisma modifier to that damage against one target of your choice.)
- Recognized numeric routes · resistance
- Numeric effects awaiting verification · spell-damage-bonus (One target; radiant/fire spell; published adds to one radiant/fire damage roll)
- Table fact · Confirm qualifying radiant/fire spell.
- Open sheet gap · No Cha bonus to one eligible damage roll.

### Level 10 · Celestial Resistance

Source rules.

- Numeric effects awaiting verification · temporary-hp (Finish short or long rest) · ally-temporary-hp (Up to five visible creatures chosen at rest end)
- Table fact · Confirm rest, select eligible visible allies and apply temp HP.
- Open sheet gap · No automatic self level+Cha temp HP on rest.

### Level 14 · Searing Vengeance

Long-rest source pool.

- Counters · Searing Vengeance; 1 uses at probe level; long reset verified
- Generic action model · Searing Vengeance: spends 1 from expanded:2014:warlock:2014:subclass:warlock:celestial-ua:resource:searing-vengeance (Starting at 14th level, the radiant energy you channel allows you to overcome grievous injuries. When you have to make a death saving throw at the start of your turn, you can instead spring back to your feet with a burst of radiant energy. You regain hit points equal to half your hit point maximum, and then you stand up, if you so choose. Each creature of your choice that is within 30 feet of you takes radiant damage equal to 2d8 + your Charisma modifier, and it is blinded until the end of the current turn.)
- Table fact · Confirm zero-HP and range facts using variant.
- Open sheet gap · Published-only healingFeatures excludes variants; generic action cannot activate while at zero.

## Warlock — Genie (UA)

Entry level 1 · [Unearthed Arcana 72 - Subclasses Revisited](https://dnd5e.wikidot.com/warlock:genie-ua)

Source spell progression · level 1 expanded: Detect Evil and Good, Sanctuary, Thunderwave, Burning Hands, Fog Cloud · level 3 expanded: Phantasmal Force, Spike Growth, Gust of Wind, Scorching Ray, Blur · level 5 expanded: Create Food and Water, Meld into Stone, Wind Wall, Fireball, Sleet Storm · level 7 expanded: Phantasmal Killer, Stone Shape, Greater Invisibility, Fire Shield, Control Water · level 9 expanded: Creation, Wall of Stone, Seeming, Flame Strike, Cone of Cold · level 17 expanded: Wish

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Choice controls · genie-kind (advancement)
- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Genie lets you choose from an expanded list of spells when you learn a warlock spell. The Genie Expanded Spells table shows the genie spells that are added to the warlock spell list for you, along with the spells associated in the table with your patron’s kind: dao, djinni, efreeti, or marid.)

### Level 1 · Genie’s Vessel

Genie choice gates spell access; generic pools where offered.

- Counters · Genie’s Vessel; 1 uses at probe level; long reset verified
- Generic action model · Genie’s Vessel: source rules or unverified dedicated path (At 1st level, your patron gifts you a magical vessel that grants you a measure of the genie’s power. The vessel is a Tiny object, and you can use it as a spellcasting focus for your warlock spells. You decide what the object is, or you can determine what it is randomly by rolling on the Genie’s Vessel table. While you are touching the vessel, you can use it in the following ways: - Bottled Respite: As an action, you can magically vanish and enter your vessel, which remains in the space you left. The interior of the vessel is an extradimensional space in the shape of a 20-foot-radius cylinder, 20 feet high, and resembles your vessel. The interior is comfortably appointed with cushions and low tables and is a comfortable temperature. While inside, you can hear the area around your vessel as if you were in its space. You can remain inside the vessel up to a number of hours equal to twice your proficiency bonus. You exit the vessel early if you use a bonus action to leave, if you die, or if the vessel is destroyed. When you exit the vessel, you appear in the unoccupied space closest to it. Any objects left in the vessel remain there until carried out, and if the vessel is destroyed, every object stored there harmlessly appears in the unoccupied spaces closest to the vessel’s former space. Once you enter the vessel, you can’t enter again until you finish a long rest. - Genie’s Wrath: Once during each of your turns when you hit with an attack roll, you can deal extra damage to the target equal to your proficiency bonus. The type of this damage is determined by your patron: bludgeoning (dao), thunder (djinni), fire (efreeti), or cold (marid). If the vessel is destroyed or you lose it, you can perform a 1-hour ceremony to receive a replacement from your patron. This ceremony can be performed during a short or long rest, and the previous vessel is destroyed if it still exists. The vessel vanishes in a flare of elemental power when you die.)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 6 · Elemental Gift

Genie choice gates spell access; generic pools where offered.

- Counters · Elemental Gift; 3 uses at probe level; long reset verified
- Generic action model · Elemental Gift: spends 1 from expanded:2014:warlock:2014:subclass:warlock:genie-ua:resource:elemental-gift (In addition, as a bonus action, you can give yourself a flying speed of 30 feet that lasts for 10 minutes, during which you can hover. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Numeric effects awaiting verification · resistance (Dao:bludgeoning; Djinni:thunder; Efreeti:fire; Marid:cold) · fly-speed (Elemental Gift active 10 minutes; hover)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 10 · Sanctuary Vessel

Genie choice gates spell access; generic pools where offered.

- Generic action model · Sanctuary Vessel: source rules or unverified dedicated path (At 10th level, when you enter your Genie’s Vessel via the Bottled Respite feature, you can now choose up to five willing creatures that you can see within 30 feet of you, and the chosen creatures are drawn into the vessel with you. As a bonus action, you can eject any number of creatures from the vessel, and everyone is ejected if you leave or the vessel is destroyed. In addition, anyone (including you) who remains within the vessel for at least 10 minutes gains the benefit of finishing a short rest, and anyone can add your proficiency bonus to the number of hit points they regain if they spend any Hit Dice as part of a short rest there.)
- Table fact · Confirm vessel item/occupants, type, placement, hit and rest timing.
- Open sheet gap · No owned vessel state/PB damage rider, flight/resistance or Sanctuary rest-healing bonus.

### Level 14 · Limited Wish

Resource declaration.

- Counters · Limited Wish; 1 uses at probe level; none reset
- Table fact · Confirm spell/source requirements.
- Open sheet gap · Published-only cooldown handler excludes UA; generic Limited Wish is hidden.

## Warlock — Ghost in the Machine (UA)

Entry level 1 · [Unearthed Arcana 7 - Modern Magic](https://dnd5e.wikidot.com/warlock:ghost-in-the-machine-ua)

Source spell progression · level 1 known: On/Off · level 1 expanded: Infallible Relay, Remote Access · level 3 expanded: Arcane Hacking, Digital Phantom · level 5 expanded: Haywire, Invisibility to Cameras · level 7 expanded: Conjure Knowbot, System Backdoor · level 9 expanded: Shutdown, Synchronicity

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Ghost in the Machine lets you choose from an expanded list of spells when you learn a warlock spell. You gain the On/Off\* cantrip, and the following new spells are added to the warlock spell list for you.)

### Level 1 · Information Surge

Generic uses where routed.

- Counters · Information Surge; 1 uses at probe level; short reset verified
- Generic action model · Information Surge: spends 1 from expanded:2014:warlock:2014:subclass:warlock:ghost-in-the-machine-ua:resource:information-surge (At 1st level, you gain the ability to temporarily render computerized devices inoperable. As an action, you can target a computerized device within 30 feet of you. If the targeted device is held or otherwise actively used by a living creature, that creature must make an Intelligence saving throw against your spell save DC. On a failed save, the targeted device ceases to function until the end of your next turn. If the targeted device is not held or used by a creature, the DM makes a special saving throw for the device with disadvantage and a +0 modifier. Certain shielded devices might negate the disadvantage, at the DM’s determination.)
- Table fact · Confirm devices, connectivity/range, valid external targets/saves and resulting effects.

### Level 6 · Wire Walk

Generic uses where routed.

- Counters · Wire Walk; 1 uses at probe level; short reset verified
- Generic action model · Wire Walk: spends 1 from expanded:2014:warlock:2014:subclass:warlock:ghost-in-the-machine-ua:resource:wire-walk (Starting at 6th level, you gain the ability to travel short distances over electrical wires, data lines, or telephone cables. As a bonus action, you can touch a device or socket connected to a hardwired network and teleport along this network to another device or socket within your line of sight.)
- Table fact · Confirm devices, connectivity/range, valid external targets/saves and resulting effects.

### Level 10 · Personal Encryption

Generic uses where routed.

- Table fact · Confirm devices, connectivity/range, valid external targets/saves and resulting effects.

### Level 14 · Technovirus

Generic uses where routed.

- Counters · Technovirus; 1 uses at probe level; long reset verified
- Generic action model · Technovirus: spends 1 from expanded:2014:warlock:2014:subclass:warlock:ghost-in-the-machine-ua:resource:technovirus (At 14th level, you gain the ability to infect a humanoid’s body with living circuitry. You can use an action to make a melee attack against a humanoid creature using your spell attack modifier. The target must make a Constitution saving throw against your spell save DC as a techno-organic virus quickly spreads through its body. On a failed save, the target takes 8d10 psychic damage, or half as much damage on a successful one. Additionally, if the target fails the saving throw, you can use an action to issue it a single command, as if you were casting the Command spell. The target makes its saving throw against your command with disadvantage. You can issue this command at any time while the target remains infected.)
- Table fact · Confirm devices, connectivity/range, valid external targets/saves and resulting effects.

## Warlock — Hexblade (UA)

Entry level 1 · [Unearthed Arcana 29 - Warlock and Wizard](https://dnd5e.wikidot.com/warlock:hexblade-ua)

Source spell progression · level 1 expanded: Shield, Wrathful Smite · level 3 expanded: Branding Smite, Magic Weapon · level 5 expanded: Blink, Elemental Weapon · level 7 expanded: Phantasmal Killer, Staggering Smite · level 9 expanded: Cone of Cold, Destructive Wave

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Hexblade lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Hex Warrior

Source training, actual confirmed proficient non-two-handed weapon uses Cha, UA only melee, published can separately bind confirmed Pact weapon at own 3. Published ordinary bond clears at long rest.

- Training grants · medium · shields · martial
- Numeric effects awaiting verification · weapon-ability (Proficient melee weapon lacking two-handed property; no daily chosen-weapon limit)
- Table fact · Confirm eligibility, touch and actual Pact property.

### Level 1 · Hexblade's Curse

Generic pool.

- Counters · Hexblade's Curse; 1 uses at probe level; short reset verified
- Generic action model · Hexblade's Curse: spends 1 from expanded:2014:warlock:2014:subclass:warlock:hexblade-ua:resource:hexblade-s-curse (Starting at 1st level, you gain the ability to place a baleful curse on someone. As a bonus action, choose one creature you can see within 30 feet of you. The target is cursed for 1 minute. The curse ends early if the target dies, you die, or you are incapacitated. Until the curse ends, you gain the following benefits: - If the cursed target dies, you regain hit points equal to your warlock level + your Charisma modifier.)
- Numeric effects awaiting verification · damage-bonus (Damage rolls against currently cursed target) · critical-range (Attack rolls against currently cursed target)
- Table fact · Confirm cursed creature/range/death and target damage.
- Open sheet gap · No named target state, PB damage, 19–20 crit or capped death heal.

### Level 6 · Shadow Hound

Dedicated noncreature tracking state.

- Dedicated plans · shadow-hound via executeTriggeredFeature / executeConditionalAction (Bonus action; visible target within60ft. Hound merges into shadow; no half/three-quarter cover against your attacks; know direction/distance. Ends on other plane, incapacity, or dispelling.)
- Table fact · Confirm target range/cover/position, plane, dispelling and incapacity.
- Open sheet gap · No attack-cover delta.

### Level 10 · Armor of Hexes

Dedicated visible d6 with confirmation/result record.

- Dedicated plans · armor-of-hexes via executeTriggeredFeature / executeConditionalAction (Your Hexblade’s Curse target hits you with attack roll; UA does not state a reaction cost.)
- Table fact · Confirm cursed attacker and hit; apply miss if 4+.
- Open sheet gap · No curse state linking identity or adjudicating actual attack.

### Level 14 · Master of Hexes

Source rules.

- Generic action model · Master of Hexes: source rules or unverified dedicated path (Starting at 14th level, you can use your Hexblade’s Curse again without resting, but when you apply it to a new target, the curse immediately ends on the previous target.)
- Table fact · Confirm proximity, original target death, eligible replacement.
- Open sheet gap · No transfer/reapplication state.

## Warlock — Lurker in the Deep (UA)

Entry level 1 · [Unearthed Arcana 61 - Sorcerer and Warlock](https://dnd5e.wikidot.com/warlock:lurker-in-the-deep-ua)

Source spell progression · level 1 expanded: Create or Destroy Water, Thunderwave · level 3 expanded: Gust of Wind, Shatter · level 5 expanded: Lightning Bolt, Sleet Storm · level 7 expanded: Control Water, Evard's Black Tentacles · level 9 expanded: Commune with Nature, Cone of Cold

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Lurker in the Deep lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Grasp of the Deep

Generic source pools/rolls where available.

- Counters · Grasp of the Deep; 3 uses at probe level; long reset verified
- Generic action model · Grasp of the Deep: spends 1 from expanded:2014:warlock:2014:subclass:warlock:lurker-in-the-deep-ua:resource:tentacle-summon (At 1st level, you gain the ability to magically summon a spectral tentacle that strikes at your foes. As a bonus action, you create a 10-foot-long tentacle at a point you can see within 60 feet of you. The tentacle lasts for 1 minute or until you use this feature to create another tentacle. When you create the tentacle, you can make a melee spell attack against a creature within 10 feet of it. On a hit, the target takes 1d8 cold or lightning damage (your choice when it takes the damage) and its speed is reduced by 10 feet until the start of your next turn. When you reach 10th level in this class, the damage dealt by the tentacle increases to 2d8. As a bonus action on your turn, you can move the tentacle up to 30 feet and repeat the attack. You can summon the tentacle a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm tentacle position, external target/save and route.
- Open sheet gap · No typed tentacle state, own damage reduction or Devouring Maw temp HP.

### Level 1 · Scion of the Deep

Source rules.

- Table fact · Confirm underwater communication and terrain.

### Level 6 · Fathomless Soul

Typed cold resistance.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · swim-speed (Also breathe air/water)
- Table fact · Confirm aquatic context.
- Open sheet gap · Own swim speed only reference.

### Level 6 · Guardian Grasp

Generic source pools/rolls where available.

- Generic action model · Guardian Grasp: source rules or unverified dedicated path (At 6th level, the tentacle you create with Grasp of the Deep can defend you and others. When you or a creature you can see takes damage while within 10 feet of the tentacle, you can use your reaction to choose one of those creatures and reduce the damage to the chosen creature by half. After doing so, the tentacle vanishes.)
- Table fact · Confirm tentacle position, external target/save and route.
- Open sheet gap · No typed tentacle state, own damage reduction or Devouring Maw temp HP.

### Level 10 · Devouring Maw

Generic source pools/rolls where available.

- Counters · Devouring Maw; 1 uses at probe level; short reset verified
- Generic action model · Devouring Maw: spends 1 from expanded:2014:warlock:2014:subclass:warlock:lurker-in-the-deep-ua:resource:devouring-maw (Starting at 10th level, you can magically draw forth a manifestation of your patron’s insatiable hunger. As an action, choose a point you can see within 60 feet of you. For 1 minute, a translucent maw manifests in a 10-foot radius centered on that point. Each creature in that area when the maw appears must succeed on a Strength saving throw against your spell save DC or be restrained. Any creature that starts its turn in the maw’s area takes 3d6 cold or lightning damage (your choice when it takes the damage). As an action, a restrained creature can repeat the saving throw, ending the restraint on a success. At the start of your turn, if there is a creature in the maw’s area, you gain temporary hit points equal to your warlock level.)
- Table fact · Confirm tentacle position, external target/save and route.
- Open sheet gap · No typed tentacle state, own damage reduction or Devouring Maw temp HP.

### Level 14 · Unleash the Depths

Generic source pools/rolls where available.

- Counters · Unleash the Depths; 1 uses at probe level; long reset verified
- Generic action model · Unleash the Depths: spends 1 from expanded:2014:warlock:2014:subclass:warlock:lurker-in-the-deep-ua:resource:unleash-the-depths (Starting at 14th level, you gain the ability to call upon your patron for aid. As an action, you choose a point within 30 feet of you where your patron tears through reality, manifesting a measure of its thalassic grandeur. Choose one of the following effects to issue from this manifestation point. Once you use either effect, you can’t use this feature again until you finish a long rest. Fury. You can direct a barrage of spectral tentacles to issue forth and strike up to five creatures you can see within 30 feet of the manifestation point. Each target must make a Dexterity saving throw against your spell save DC. On a failed save, the creature takes 6d10 cold or lightning damage (your choice) and is knocked prone. On a successful save, it takes half as much damage and is not knocked prone. The tentacles then vanish.)
- Table fact · Confirm tentacle position, external target/save and route.
- Open sheet gap · No typed tentacle state, own damage reduction or Devouring Maw temp HP.

## Warlock — Noble Genie (UA)

Entry level 1 · [Unearthed Arcana 67 - Subclasses, Part 1](https://dnd5e.wikidot.com/warlock:noble-genie-ua)

Source spell progression · level 1 expanded: Fog Cloud, Sleep · level 3 expanded: Enlarge/Reduce, Phantasmal Force · level 5 expanded: Create Food and Water, Protection from Energy · level 7 expanded: Polymorph, Phantasmal Killer · level 9 expanded: Bigby's Hand, Creation

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Noble Genie lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Collector’s Vessel

Generic source choice/pools where offered.

- Counters · Collector’s Vessel; 3 uses at probe level; long reset verified
- Generic action model · Collector’s Vessel: spends 1 from expanded:2014:warlock:2014:subclass:warlock:noble-genie-ua:resource:collectors-vessel (If you lose your vessel, you can perform a 1-hour ceremony to receive a replacement from your patron. This ceremony can be performed during a short or long rest, and it destroys the previous vessel. The vessel vanishes in a flare of elemental power when you die. As an action while you are holding the vessel, you target a willing creature you can see within 100 feet of you and create a tether of wispy elemental material that links the target to you. The tether lasts for 1 hour, until you use this feature to create another tether, until the bound target is reduced to 0 hit points, or until the target ends its turn more than 100 feet from you. While you are tethered to a creature, you gain the following benefits: - When you can cast a spell, you can deliver the spell from your space or the bound creature’s space. You can create the tether a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Table fact · Confirm tethered creature, spell target/origin, external save/range and existence of relevant components.
- Open sheet gap · No stored tether lifecycle, own chosen typed resistance/protective damage or alternative self healing.

### Level 6 · Elemental Resistance

Generic source choice/pools where offered.

- Choice controls · elemental-resistance (rest)
- Generic action model · Elemental Resistance: source rules or unverified dedicated path (Starting at 6th level, your patron grants you protection from an element. Whenever you finish a long rest, you gain resistance to acid, cold, fire, or lightning damage (your choice) until the end of your next long rest. While the tether of your Collector’s Vessel is active, the tethered creature gains resistance to the damage type you chose.)
- Table fact · Confirm tethered creature, spell target/origin, external save/range and existence of relevant components.
- Open sheet gap · No stored tether lifecycle, own chosen typed resistance/protective damage or alternative self healing.

### Level 10 · Protective Wish

Generic source choice/pools where offered.

- Generic action model · Protective Wish: source rules or unverified dedicated path (Beginning at 10th level, you’re now able to use your Collector’s Vessel to wish for protection for yourself or your tethered creature. If you or the tethered creature is hit by an attack, you can use your reaction to teleport, swapping places with the creature and switching which one of you is hit by the attack.)
- Table fact · Confirm tethered creature, spell target/origin, external save/range and existence of relevant components.
- Open sheet gap · No stored tether lifecycle, own chosen typed resistance/protective damage or alternative self healing.

### Level 10 · Genie’s Entertainment

Generic source choice/pools where offered.

- Counters · Genie’s Entertainment; 1 uses at probe level; long reset verified
- Generic action model · Genie’s Entertainment: spends 1 from expanded:2014:warlock:2014:subclass:warlock:noble-genie-ua:resource:genies-entertainment (Starting at 10th level, as an action, you can attempt to send a creature you can see within 90 feet to your patron’s court. The target must succeed on a Charisma saving throw against your warlock spell save DC or be magically drawn into your vessel and teleported to your patron’s court in the Elemental Planes. While there, the target is stunned and your patron marvels at the target with amusement but brings no harm to it. The target can repeat the saving throw at the end of each of its turns, reappearing in the space it left or in the nearest unoccupied space if that space is occupied on a success. Once you use this feature, you can’t use it again until you finish a long rest. If the target remains in your patron’s court for 1 minute, the genie sends the target back at the end of its turn as if it successfully saved, and you regain the use of this feature.)
- Table fact · Confirm tethered creature, spell target/origin, external save/range and existence of relevant components.
- Open sheet gap · No stored tether lifecycle, own chosen typed resistance/protective damage or alternative self healing.

### Level 14 · Collector's Call

Generic source choice/pools where offered.

- Counters · Collector's Call; 1 uses at probe level; long reset verified
- Generic action model · Collector's Call: spends 1 from expanded:2014:warlock:2014:subclass:warlock:noble-genie-ua:resource:collector-s-call (At 14th level, in exchange for extending your patron’s influence over the multiverse, you can call on more of their power. As an action, you can implore your patron for aid by making a Charisma (Persuasion) check against your warlock spell save DC. If the check succeeds, you can choose one of the following effects:)
- Table fact · Confirm tethered creature, spell target/origin, external save/range and existence of relevant components.
- Open sheet gap · No stored tether lifecycle, own chosen typed resistance/protective damage or alternative self healing.

## Warlock — Raven Queen (UA)

Entry level 1 · [Unearthed Arcana 29 - Warlock and Wizard](https://dnd5e.wikidot.com/warlock:raven-queen-ua)

Source spell progression · level 1 expanded: False Life, Sanctuary · level 3 expanded: Silence, Spiritual Weapon · level 5 expanded: Feign Death, Speak with Dead · level 7 expanded: Ice Storm, Locate Creature · level 9 expanded: Commune, Cone of Cold

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Raven Queen lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Sentinel Raven

Separate 1 HP profile, perch invulnerability, owner Perception/passive +Cha while perched, owned rolls, source service history/perch/return/reload. Confirmed selected killer activates actual owner attack advantage. C2 true reload.

- Generic action model · Sentinel Raven: source rules or unverified dedicated path (Starting at 1st level, you gain the service of a spirit sent by the Raven Queen to watch over you. The spirit assumes the form and game statistics of a raven, and it always obeys your commands, which you can give telepathically while it is within 100 feet of you. While the raven is perched on your shoulder, you gain darkvision with a range of 30 feet and a bonus to your passive Wisdom (Perception) score and to Wisdom (Perception) checks. The bonus equals your Charisma modifier. While perched on your shoulder, the raven can’t be targeted by any attack or other harmful effect; only you can cast spells on it; it can’t take damage; and it is incapacitated. You can see through the raven’s eyes and hear what it hears while it is within 100 feet of you. In combat, you roll initiative for the raven and control how it acts. If it is slain by a creature, you gain advantage on all attack rolls against the killer for the next 24 hours. The raven doesn’t require sleep. While it is within 100 feet of you, it can awaken you from sleep as a bonus action. The raven vanishes when it dies, if you die, or if the two of you are separated by more than 5 miles.)
- Table fact · Confirm killer and correct target, range/positions/5-mile separation, actual commands.

### Level 6 · Soul of the Raven

Source rules.

- Generic action model · Soul of the Raven: source rules or unverified dedicated path (At 6th level, you gain the ability to merge with your raven spirit. As a bonus action when your raven is perched on your shoulder, your body merges with your raven’s form. While merged, you become Tiny, you replace your speed with the raven’s, and you can use your action only to Dash, Disengage, Dodge, Help, Hide, or Search. During this time, you gain the benefits of your raven being perched on your shoulder. As an action, you and the raven return to normal.)
- Table fact · Confirm raven within reach and fusion positions.
- Open sheet gap · No fused own-body/stat/action state.

### Level 10 · Raven's Shield

Own typed necrotic resistance.

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · condition-immunity · save-advantage
- Table fact · Confirm death save.
- Open sheet gap · No own frightened immunity/death-save advantage.

### Level 14 · Queen's Right Hand

Generic source use.

- Counters · Queen's Right Hand; 1 uses at probe level; long reset verified
- Generic action model · Queen's Right Hand: spends 1 from expanded:2014:warlock:2014:subclass:warlock:raven-queen-ua:resource:queen-s-right-hand (Starting at 14th level, you can channel the Raven Queen’s power to slay a creature. You can cast Finger of Death. After you cast the spell with this feature, you can’t do so again until you finish a long rest.)
- Table fact · Confirm Finger of Death target/save.
- Open sheet gap · No dedicated slot-free cast.

## Warlock — Seeker (UA)

Entry level 1 · [Unearthed Arcana 16 - The Faithful](https://dnd5e.wikidot.com/warlock:seeker-ua)

Source spell progression · level 1 expanded: Feather Fall, Jump · level 3 expanded: Levitate, Locate Object · level 5 expanded: Clairvoyance, Sending · level 7 expanded: Arcane Eye, Locate Creature · level 9 expanded: Legend Lore, Passwall

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Seeker lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Shielding Aurora

Generic use.

- Counters · Shielding Aurora; 1 uses at probe level; short reset verified
- Generic action model · Shielding Aurora: spends 1 from expanded:2014:warlock:2014:subclass:warlock:seeker-ua:resource:shielding-aurora (Starting at 1st level, you can invoke the Seeker’s power to protect you from harm. As a bonus action, you create a whirling aurora of brilliant energy that swirls around you. Until the end of your next turn, you gain resistance to all damage, and if a hostile creature ends its turn within 10 feet of you, it takes radiant damage equal to your warlock level + your Charisma modifier.)
- Table fact · Confirm hostile melee attacker and damage timing.
- Open sheet gap · No one-turn own all-damage resistance state or retaliation.

### Level 3 · Pact Boon: Pact of the Star Chain

Optional persisted choice where exposed.

- Counters · Pact Boon: Pact of the Star Chain; 1 uses at probe level; short reset verified
- Generic action model · Pact Boon: Pact of the Star Chain: spends 1 from expanded:2014:warlock:2014:subclass:warlock:seeker-ua:resource:star-chain-advantage (The Seeker grants you a chain forged from starlight, decorated with seven gleaming motes of brightness. While the chain is on your person, you know the augury spell and can cast it as a ritual. The spell doesn’t count against your number of spells known. Additionally, you can invoke the Seeker’s power to gain advantage on an Intelligence check while you carry this item. Once you use this ability, you cannot use it again until you complete a short or long rest. If you lose your Star Chain, you can perform a 1-hour ceremony to receive a replacement from the Seeker. The ceremony can be performed during a short or long rest, and it destroys the previous chain. The chain disappears in a flash of light when you die.)
- Table fact · Confirm chain possessions and qualifying Int check.
- Open sheet gap · No dedicated Augury cast or check advantage.

### Level 6 · Astral Refuge

Generic uses where routed.

- Generic action model · Astral Refuge: source rules or unverified dedicated path (At 6th level, you gain the ability to step into an astral refuge. As an action, you disappear from the world for a brief moment and enter the Astral Plane, taking advantage of its timeless nature. While in your astral refuge, you can take two actions to cast spells that target only you. After using those two actions, you return to the space you occupied and your turn ends.)
- Table fact · Confirm eligible self spells and whether approved group completes short rest.
- Open sheet gap · No dedicated self-cast sequence or controlled rest integration.

### Level 10 · Far Wanderer

Own typed fire/cold resistance.

- Recognized numeric routes · resistance (Also no breathing required)
- Table fact · Confirm environment/breathing context.

### Level 14 · Astral Sequestration

Generic uses where routed.

- Counters · Astral Sequestration; 1 uses at probe level; long reset verified
- Generic action model · Astral Sequestration: spends 1 from expanded:2014:warlock:2014:subclass:warlock:seeker-ua:resource:astral-sequestration (By performing a special ritual over the course of 5 minutes, you shift yourself and up to ten willing creatures you can see to the Astral Plane. You and those creatures gain the benefits of a short rest while sequestered on the Astral Plane. You then return to the spaces you all occupied when you used this ability, with no time having passed in the world.)
- Table fact · Confirm eligible self spells and whether approved group completes short rest.
- Open sheet gap · No dedicated self-cast sequence or controlled rest integration.

## Warlock — Undead (UA)

Entry level 1 · [Unearthed Arcana 74 - Subclasses, Part 4](https://dnd5e.wikidot.com/warlock:undead-ua)

Source spell progression · level 1 expanded: Bane, False Life · level 3 expanded: Blindness/Deafness, Phantasmal Force · level 5 expanded: Speak with Dead, Phantom Steed · level 7 expanded: Death Ward, Greater Invisibility · level 9 expanded: Antilife Shell, Cloudkill

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (At 1st level, the Undead lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Form of Dread

Actual use, visible d10+owner level temp HP and minute state.

- Counters · Form of Dread; 2 uses at probe level; long reset verified
- Dedicated plans · form-of-dread via activateSubclassForm
- Numeric effects awaiting verification · temporary-hp (On transformation) · condition-immunity (Form of Dread active)
- Table fact · Confirm eligible hit and target Wisdom save.
- Open sheet gap · Frightened immunity exists on active profile; verify actual condition-input enforcement. Missing per-turn hit trigger.

### Level 6 · Grave Touched

Source rules.

- Generic action model · Grave Touched: source rules or unverified dedicated path (In addition, when you hit a creature with an attack and roll damage against the creature, you can replace the damage type with necrotic damage. While you are using your Form of Dread, you can roll one additional damage die when determining the necrotic damage the target takes.)
- Table fact · Confirm eligible damage and Dread state.
- Open sheet gap · No own damage type conversion, extra die or once-turn guard.

### Level 10 · Mortal Husk

Typed necrotic defense, 1HP/exhaustion and source d4 cooldown via dedicated zero-HP handler.

- Counters · Mortal Husk; 1 uses at probe level; none reset
- Dedicated plans · mortal-husk via useCooldownFeature
- Numeric effects awaiting verification · resistance (Immunity while Form of Dread active)
- Table fact · Confirm UA death trigger and creatures within range.

### Level 14 · Spirit Projection

Concentration/one hour, actual use and typed physical resistance/flight. Valid Projection+Dread enables once-turn own capped heal from half actual necrotic damage dealt.

- Counters · Spirit Projection; 1 uses at probe level; long reset verified
- Dedicated plans · projection-heal via executeTriggeredFeature / executeConditionalAction (Projection and Form of Dread active; once on your turn after necrotic damage. Enter actual necrotic damage dealt; regain half.) · spirit-projection via activateSubclassForm
- Table fact · Confirm actual damage, body position and movement.
- Open sheet gap · No body damage mirroring/inside-object scaling or spell component exception.

## Warlock — Undying Light (UA)

Entry level 1 · [Unearthed Arcana 10 - Light, Dark, Underdark!](https://dnd5e.wikidot.com/warlock:undying-light-ua)

Source spell progression · level 1 known: Light, Sacred Flame · level 1 expanded: Burning Hands · level 3 expanded: Flaming Sphere · level 5 expanded: Daylight · level 7 expanded: Fire Shield · level 9 expanded: Flame Strike

### Level 1 · Expanded Spell List

Source spell choices unlocked at owning Warlock milestones as access candidates. These grants use ordinary spells-known choices.

- Generic action model · Expanded Spell List: source rules or unverified dedicated path (The Undying Light lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you.)

### Level 1 · Radiant Soul

Own typed radiant resistance.

- Generic action model · Radiant Soul: source rules or unverified dedicated path (Starting at 1st level, your link to the Positive Plane allows you to serve as a conduit for radiant energy. You have resistance to radiant damage, and when you cast a spell that deals radiant damage or fire damage, you add your Charisma modifier to that damage. Additionally, you know the Light and Sacred Flame cantrips and can cast them at will. They don't count against your number of cantrips known.)
- Recognized numeric routes · resistance
- Numeric effects awaiting verification · spell-damage-bonus (Cast spell dealing radiant/fire)
- Table fact · Confirm qualifying radiant/fire spell.
- Open sheet gap · No Cha bonus to one eligible damage roll.

### Level 6 · Searing Vengeance

Long-rest source pool.

- Counters · Searing Vengeance; 1 uses at probe level; long reset verified
- Generic action model · Searing Vengeance: spends 1 from expanded:2014:warlock:2014:subclass:warlock:undying-light-ua:resource:searing-vengeance (Starting at 6th level, the radiant energy you channel allows you to overcome grievous injuries. When you would make a death saving throw, you can instead spring back to your feet with a burst of radiant energy. You immediately stand up (if you so choose), and you regain hit points equal to half your hit point maximum. All hostile creatures within 30 feet of you take 10 + your Charisma modifier radiant damage and are blinded until the end of your turn.)
- Table fact · Confirm zero-HP and range facts using variant.
- Open sheet gap · Published-only healingFeatures excludes variants; generic action cannot activate while at zero.

### Level 10 · Radiant Resistance

Source rules.

- Numeric effects awaiting verification · temporary-hp (Short or long rest end) · ally-temporary-hp (Up to five visible chosen creatures at rest end)
- Table fact · Confirm rest and eligible allies.
- Open sheet gap · No own post-rest temporary HP.

### Level 14 · Healing Light

Distinct source long-rest die pool.

- Counters · Healing Light; 15 uses at probe level; long reset verified
- Dedicated plans · healing-light via executeTriggeredFeature / executeConditionalAction (Touch a creature; spend1–5 available dice. Cost is chosen dice count.)
- Table fact · Confirm range and allocation.
- Open sheet gap · Published-only healing handler omits variants, generic action is hidden.

## Wizard — Abjuration

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:abjuration)

### Level 2 · Abjuration Savant

- Remaining source effects need verification.

### Level 2 · Arcane Ward

- Counters · expanded:2014:wizard:2014:subclass:wizard:abjuration:resource:arcane-ward-hp; 7 uses at probe level; none reset · expanded:2014:wizard:2014:subclass:wizard:abjuration:resource:arcane-ward-create; 1 uses at probe level; long reset verified
- Generic action model · Create Arcane Ward: spends 1 from expanded:2014:wizard:2014:subclass:wizard:abjuration:resource:arcane-ward-create (Cast abjuration spell>=1; create ward maxHP2*level+int, lasting to long-rest end.)
- Remaining source effects need verification.

### Level 6 · Projected Ward

- Generic action model · Projected Ward: source rules or unverified dedicated path (Visible creature within30ft takes damage; ward absorbs that damage. Cost is actual HP absorbed up to remaining wardHP; excess damages target normally.)
- Remaining source effects need verification.

### Level 10 · Improved Abjuration

- Generic action model · Improved Abjuration: source rules or unverified dedicated path (Beginning at 10th level, when you cast an abjuration spell that requires you to make an ability check as a part of casting that spell (as in Counterspell and Dispel Magic), you add your proficiency bonus to that ability check.)
- Numeric effects awaiting verification · abjuration-check-bonus (Abjuration spell requiring ability check, e.g. Counterspell/Dispel Magic)
- Remaining source effects need verification.

### Level 14 · Spell Resistance

- Numeric effects awaiting verification · save-advantage · resistance
- Remaining source effects need verification.

## Wizard — Bladesinging

Entry level 2 · [Sword Coast Adventurer's Guide; Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/wizard:bladesinging)

### Level 2 · Training in War and Song

- Choice controls · Training in War and Song (advancement)
- Training grants · light · Performance
- Remaining source effects need verification.

### Level 2 · Bladesong

Bladesinging tools track proficiency-based uses, duration and rest; own AC, movement, concentration and Acrobatics use the active state.

- Recognized numeric routes · ac-bonus (Bladesong active; no medium/heavy armor or shield; ends on two-hand weapon attack) · speed-bonus (Bladesong active; same armor/weapon restrictions) · concentration-save-bonus (Bladesong active) · skill-advantage (Bladesong active)
- Table fact · Confirm a two-handed attack, armor and incapacitation when appropriate.
- Verification · bladesinging; browser-subclass-numerics

### Level 6 · Extra Attack

- Recognized numeric routes · attack-count (Attack action; may replace one attack with a cantrip)
- Remaining source effects need verification.

### Level 10 · Song of Defense

Bladesinging tools spend a selected eligible slot and show the damage reduction.

- Table fact · Confirm qualifying damage and reaction.
- Verification · bladesinging; browser-subclass-numerics

### Level 14 · Song of Victory

Weapon damage adds Intelligence during Bladesong for eligible melee attacks.

- Recognized numeric routes · melee-weapon-damage-bonus (Bladesong active)
- Verification · bladesinging; browser-subclass-numerics

## Wizard — Chronurgy

Entry level 2 · [Explorer's Guide to Wildemount](https://dnd5e.wikidot.com/wizard:chronurgy)

### Level 2 · Chronal Shift

- Counters · expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:chronal-shift; 2 uses at probe level; long reset verified
- Generic action model · Chronal Shift: spends 1 from expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:chronal-shift (You or visible creature within30ft makes attack/check/save; after success/failure known; force reroll and use second result.)
- Remaining source effects need verification.

### Level 2 · Temporal Awareness

- Recognized numeric routes · initiative
- Remaining source effects need verification.

### Level 6 · Momentary Stasis

- Counters · expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:momentary-stasis; 3 uses at probe level; long reset verified
- Generic action model · Momentary Stasis: spends 1 from expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:momentary-stasis (Visible Large or smaller creature within60ft; Constitution save vs wizard spellDC or incapacitated and speed0 until next turn end or damage.)
- Remaining source effects need verification.

### Level 10 · Arcane Abeyance

- Counters · expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:arcane-abeyance; 1 uses at probe level; short reset verified
- Generic action model · Arcane Abeyance: spends 1 from expanded:2014:wizard:2014:subclass:wizard:chronurgy:resource:arcane-abeyance (At 10th level, when you cast a spell using a spell slot of 4th level or lower, you can condense the spell's magic into a mote. The spell is frozen in time at the moment of casting and held within a gray bead for 1 hour. This bead is a Tiny object with AC 15 and 1 hit point, and it is immune to poison and psychic damage. When the duration ends, or if the bead is destroyed, it vanishes in aflash of light, and the spell is lost. A creature holding the bead can use its action to release the spell within, whereupon the bead disappears. The spell uses your spell attack bonus and save DC, and the spell treats the creature who released it as the caster for all other purposes.)
- Remaining source effects need verification.

### Level 14 · Convergent Future

- Generic action model · Convergent Future: source rules or unverified dedicated path (Starting at 14th level, you can peer through possible futures and magically pull one of them into events around you, ensuring a particular outcome. When you or a creature you can see within 60 feet of you makes an attack roll, an ability check, or a saving throw, you can use your reaction to ignore the die roll and decide whether the number rolled is the minimum needed to succeed or one less than that number (your choice). When you use this feature, you gain one level of exhaustion. Only by finishing a long rest can you remove a level of exhaustion gained in this way.)
- Remaining source effects need verification.

## Wizard — Conjuration

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:conjuration)

### Level 2 · Conjuration Savant

- Remaining source effects need verification.

### Level 2 · Minor Conjuration

- Generic action model · Minor Conjuration: source rules or unverified dedicated path (Starting at 2nd level when you select this school, you can use your action to conjure up an inanimate object in your hand or on the ground in an unoccupied space that you can see within 10 feet of you. This object can be no larger than 3 feet on a side and weigh no more than 10 pounds, and its form must be that of a nonmagical object that you have seen. The object is visibly magical, radiating dim light out to 5 feet. The object disappears after 1 hour, when you use this feature again, or if it takes or deals any damage.)
- Remaining source effects need verification.

### Level 6 · Benign Transportation

- Counters · expanded:2014:wizard:2014:subclass:wizard:conjuration:resource:benign-transportation; 1 uses at probe level; long reset verified
- Generic action model · Benign Transportation: spends 1 from expanded:2014:wizard:2014:subclass:wizard:conjuration:resource:benign-transportation (Starting at 6th level, you can use your action to teleport up to 30 feet to an unoccupied space that you can see. Alternatively, you can choose a space within range that is occupied by a Small or Medium creature. If that creature is willing, you both teleport, swapping places.)
- Remaining source effects need verification.

### Level 10 · Focused Conjuration

- Numeric effects awaiting verification · concentration-damage-protection (Concentrating on conjuration spell; damage cannot break concentration)
- Remaining source effects need verification.

### Level 14 · Durable Summons

- Numeric effects awaiting verification · summon-temporary-hp (Creature summoned or created with conjuration spell)
- Remaining source effects need verification.

## Wizard — Divination

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:divination)

### Level 2 · Divination Savant

- Remaining source effects need verification.

### Level 2 · Portent

Portent tools store two separate visible d20 rolls after a long rest and consume a selected value.

- Counters · expanded:2014:wizard:2014:subclass:wizard:divination:resource:portent; 2 uses at probe level; long reset verified
- Generic action model · Portent: spends 1 from expanded:2014:wizard:2014:subclass:wizard:divination:resource:portent (Starting at 2nd level when you choose this school, glimpses of the future begin to press in on your awareness. When you finish a long rest, roll two d20s and record the numbers rolled. You can replace any attack roll, saving throw, or ability check made by you or a creature that you can see with one of these foretelling rolls. You must choose to do so before the roll, and you can replace a roll in this way only once per turn. Each foretelling roll can be used only once. When you finish a long rest, you lose any unused foretelling rolls.)
- Table fact · Before a visible attack, save or check, confirm which roll to replace.
- Verification · subclass-active; browser-subclass-active

### Level 6 · Expert Divination

- Generic action model · Expert Divination: source rules or unverified dedicated path (Beginning at 6th level, casting divination spells comes so easily to you that it expends only a fraction of your spellcasting efforts. When you cast a divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The slot you regain must be of a level lower than the spell you cast and can't be higher than 5th level.)
- Remaining source effects need verification.

### Level 10 · The Third Eye

- Choice controls · The Third Eye (activation)
- Counters · expanded:2014:wizard:2014:subclass:wizard:divination:resource:the-third-eye; 1 uses at probe level; short reset verified
- Generic action model · The Third Eye: spends 1 from expanded:2014:wizard:2014:subclass:wizard:divination:resource:the-third-eye (Starting at 10th level, you can use your action to increase your powers of perception. When you do so, choose one of the following benefits, which lasts until you are incapacitated or you take a short or long rest. You can't use the feature again until you finish a short or long rest.)
- Remaining source effects need verification.

### Level 14 · Greater Portent

Portent tools use three stored values beginning at Wizard 14.

- Verification · subclass-active; browser-subclass-active

## Wizard — Enchantment

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:enchantment)

### Level 2 · Enchantment Savant

- Remaining source effects need verification.

### Level 2 · Hypnotic Gaze

- Generic action model · Hypnotic Gaze: source rules or unverified dedicated path (Starting at 2nd level when you choose this school, your soft words and enchanting gaze can magically enthrall another creature. As an action, choose one creature that you can see within 5 feet of you. If the target can see or hear you, it must succeed on a Wisdom saving throw against your wizard spell save DC or be charmed by you until the end of your next turn. The charmed creature's speed drops to 0, and the creature is incapacitated and visibly dazed. On subsequent turns, you can use your action to maintain this effect, extending its duration until the end of your next turn. However, the effect ends if you move more than 5 feet away from the creature, if the creature can neither see nor hear you, or if the creature takes damage. Once the effect ends, or if the creature succeeds on its initial saving throw against this effect, you can't use this feature on that creature again until you finish a long rest.)
- Remaining source effects need verification.

### Level 6 · Instinctive Charm

- Generic action model · Instinctive Charm: source rules or unverified dedicated path (Beginning at 6th level, when a creature you can see within 30 feet of you makes an attack roll against you, you can use your reaction to divert the attack, provided that another creature is within the attack's range. The attacker must make a Wisdom saving throw against your wizard spell save DC. On a failed save, the attacker must target the creature that is closest to it, not including you or itself. If multiple creatures are closest, the attacker chooses which one to target. You must choose to use this feature before knowing whether the attack hits or misses. Creatures that can't be charmed are immune to this effect.)
- Remaining source effects need verification.

### Level 10 · Split Enchantment

- Generic action model · Split Enchantment: source rules or unverified dedicated path (Starting at 10th level, when you cast an enchantment spell of 1st level or higher that targets only one creature, you can have it target a second creature.)
- Remaining source effects need verification.

### Level 14 · Alter Memories

- Generic action model · Alter Memories: source rules or unverified dedicated path (At 14th level, you gain the ability to make a creature unaware of your magical influence on it. When you cast an enchantment spell to charm one or more creatures, you can alter one creature's understanding so that it remains unaware of being charmed. Additionally, once before the spell expires, you can use your action to try to make the chosen creature forget some of the time it spent charmed. The creature must succeed on an Intelligence saving throw against your wizard spell save DC or lose a number of hours of its memories equal to 1 + your Charisma modifier (minimum 1). You can make the creature forget less time, and the amount of time can't exceed the duration of your enchantment spell.)
- Remaining source effects need verification.

## Wizard — Evocation

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:evocation)

### Level 2 · Evocation Savant

- Remaining source effects need verification.

### Level 2 · Sculpt Spells

- Generic action model · Sculpt Spells: source rules or unverified dedicated path (Beginning at 2nd level, you can create pockets of relative safety within the effects of your evocation spells. When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.)
- Numeric effects awaiting verification · safe-target-count (Visible creatures affected by your evocation spell; auto save/no damage if normally half on success)
- Remaining source effects need verification.

### Level 6 · Potent Cantrip

- Numeric effects awaiting verification · cantrip-save-damage (Successful save against damaging cantrip; no extra effects)
- Remaining source effects need verification.

### Level 10 · Empowered Evocation

An eligible Wizard evocation cast uses Intelligence (minimum +1) for exactly one damage roll. The cast dialog lets the player choose the roll for multiple rays; other damage rolls and the slot cost are unchanged.

- Verification · subclass-cantrip-damage; browser-subclass-cantrip-damage

### Level 14 · Overchannel

- Generic action model · Overchannel: source rules or unverified dedicated path (Starting at 14th level, you can increase the power of your simpler spells. When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell, immediately after you cast it. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12. This damage ignores resistance and immunity.)
- Remaining source effects need verification.

## Wizard — Graviturgy

Entry level 2 · [Explorer's Guide to Wildemount](https://dnd5e.wikidot.com/wizard:graviturgy)

### Level 2 · Adjust Density

- Generic action model · Adjust Density: source rules or unverified dedicated path (At 2nd level, as an action, you can magically alter the weight of one object or creature you can see within 30 feet of you. The object or creature must be Large or smaller. The target's weight is halved or doubled for up to 1 minute or until your concentration ends (as if you were concentrating on a spell). While the weight of a creature is halved by this effect, the creature's speed increases by 10 feet, it can jump twice as far as normal, and it has disadvantage on Strength checks and Strength saving throws. While the weight of a creature is doubled by this effect, the creature's speed is reduced by 10 feet, and it has advantage on Strength checks and Strength saving throws.)
- Remaining source effects need verification.

### Level 6 · Gravity Well

- Generic action model · Gravity Well: source rules or unverified dedicated path (When you reach 6th level, whenever you cast a spell on a creature, you can move the target 5 feet to an unoccupied space of your choice if the target is willing to move, the spell hits it with an attack, or it fails a saving throw against the spell.)
- Remaining source effects need verification.

### Level 10 · Violent Attraction

- Counters · expanded:2014:wizard:2014:subclass:wizard:graviturgy:resource:violent-attraction; 3 uses at probe level; long reset verified
- Generic action model · Violent Attraction: Attack: spends 1 from expanded:2014:wizard:2014:subclass:wizard:graviturgy:resource:violent-attraction; separate roll 1d10 (Visible creature within60ft hits with weapon attack.) · Violent Attraction: Fall: spends 1 from expanded:2014:wizard:2014:subclass:wizard:graviturgy:resource:violent-attraction; separate roll 2d10 (Visible creature within60ft takes falling damage.)
- Remaining source effects need verification.

### Level 14 · Event Horizon

- Counters · expanded:2014:wizard:2014:subclass:wizard:graviturgy:resource:event-horizon; 1 uses at probe level; long reset verified
- Generic action model · Event Horizon: spends 1 from expanded:2014:wizard:2014:subclass:wizard:graviturgy:resource:event-horizon (Starting at 14th level, as an action, you can magically emit a powerful field of gravitational energy that tugs at other creatures for up to 1 minute or until your concentration ends (as if you were concentrating on a spell). For the duration, whenever a creature hostile to you starts its turn within 30 feet of you, it must make a Strength saving throw against your spell save DC. On a failed save, it takes 2d10 force damage, and its speed is reduced to 0 until the start of its next turn. On a successful save, it takes half as much damage, and every foot it moves this turn costs 2 extra feet of movement.)
- Remaining source effects need verification.

## Wizard — Illusion

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:illusion)

Source spell progression · level 2 known: Minor Illusion

### Level 2 · Illusion Savant

- Remaining source effects need verification.

### Level 2 · Improved Minor Illusion

- Generic action model · Improved Minor Illusion: source rules or unverified dedicated path (When you choose this school at 2nd level, you learn the Minor Illusion cantrip. If you already know this cantrip, you learn a different wizard cantrip of your choice. The cantrip doesn't count against your number of cantrips known. When you cast Minor Illusion, you can create both a sound and an image with a single casting of the spell.)
- Remaining source effects need verification.

### Level 6 · Malleable Illusions

- Generic action model · Malleable Illusions: source rules or unverified dedicated path (Starting at 6th level, when you cast an illusion spell that has a duration of 1 minute or longer, you can use your action to change the nature of that illusion (using the spell's normal parameters for the illusion), provided that you can see the illusion.)
- Remaining source effects need verification.

### Level 10 · Illusory Self

- Counters · expanded:2014:wizard:2014:subclass:wizard:illusion:resource:illusory-self; 1 uses at probe level; short reset verified
- Generic action model · Illusory Self: spends 1 from expanded:2014:wizard:2014:subclass:wizard:illusion:resource:illusory-self (Beginning at 10th level, you can create an illusory duplicate of yourself as an instant, almost instinctual reaction to danger. When a creature makes an attack roll against you, you can use your reaction to interpose the illusory duplicate between the attacker and yourself. The attack automatically misses you, then the illusion dissipates.)
- Remaining source effects need verification.

### Level 14 · Illusory Reality

- Generic action model · Illusory Reality: source rules or unverified dedicated path (By 14th level, you have learned the secret of weaving shadow magic into your illusions to give them a semi-reality. When you cast an illusion spell of 1st level or higher, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. You can do this on your turn as a bonus action while the spell is ongoing. The object remains real for 1 minute. For example, you can create an illusion of a bridge over a chasm and then make it real long enough for your allies to cross.)
- Remaining source effects need verification.

## Wizard — Necromancy

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:necromancy)

Source spell progression · level 6 spellbook: Animate Dead

### Level 2 · Necromancy Savant

- Remaining source effects need verification.

### Level 2 · Grim Harvest

- Generic action model · Grim Harvest: source rules or unverified dedicated path (At 2nd level, you gain the ability to reap life energy from creatures you kill with your spells. Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell's level, or three times its level if the spell belongs to the School of Necromancy. You don't gain this benefit for killing constructs or undead.)
- Remaining source effects need verification.

### Level 6 · Undead Thralls

- Generic action model · Undead Thralls: source rules or unverified dedicated path (At 6th level, you add the Animate Dead spell to your spellbook if it is not there already. When you cast Animate Dead, you can target one additional corpse or pile of bones, creating another zombie or skeleton, as appropriate. Whenever you create an undead using a necromancy spell, it has additional benefits:)
- Numeric effects awaiting verification · undead-hp-max-bonus (Undead created by necromancy spell) · undead-weapon-damage-bonus (Undead created by necromancy spell)
- Remaining source effects need verification.

### Level 10 · Inured to Undeath

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · hp-max-reduction-immunity
- Remaining source effects need verification.

### Level 14 · Command Undead

- Generic action model · Command Undead: source rules or unverified dedicated path (Starting at 14th level, you can use magic to bring undead under your control, even those created by other wizards. As an action, you can choose one undead that you can see within 60 feet of you. That creature must make a Charisma saving throw against your wizard spell save DC. If it succeeds, you can't use this feature on it again. If it fails, it becomes friendly to you and obeys your commands until you use this feature again. Intelligent undead are harder to control in this way. If the target has an Intelligence of 8 or higher, it has advantage on the saving throw. If it fails the saving throw and has an Intelligence of 12 or higher, it can repeat the saving throw at the end of every hour until it succeeds and breaks free.)
- Remaining source effects need verification.

## Wizard — Order of Scribes

Entry level 2 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/wizard:order-of-scribes)

### Level 2 · Wizardly Quill

- Generic action model · Wizardly Quill: source rules or unverified dedicated path (At 2nd level, as a bonus action, you can magically create a Tiny quill in your free hand. The magic quill has the following properties: - The quill doesn't require ink. When you write with it, it produces ink in a color of your choice on the writing surface. - The time you must spend to copy a spell into your spell book equals 2 minutes per spell level if you use the quill for the transcription. - You can erase anything you write with the quill if you wave the feather over the text as a bonus action, provided the text is within 5 feet of you. This quill disappears if you create another one or if you die.)
- Remaining source effects need verification.

### Level 2 · Awakened Spellbook

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:awakened-spellbook; 1 uses at probe level; long reset verified
- Generic action model · Awakened Spellbook: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:awakened-spellbook (At 2nd level, while you are holding the book, it grants you the following benefits: - You can use the book as a spellcasting focus for your wizard spells. - When you cast a wizard spell with a spell slot, you can temporarily replace its damage type with a type that appears in another spell in your spellbook, which magically alters the spell's formula for this casting only. The latter spell must be of the same level as the spell slot you expend. - When you cast a wizard spell as a ritual, you can use the spell's normal casting time, rather than adding 10 minutes to it. Once you use this benefit, you can't do so again until you finish a long rest. If necessary, you can replace the book over the course of a short rest by using your Wizardly Quill to write arcane sigils in a blank book or a magic spellbook to which you're attuned. At the end of the rest, your spellbook's consciousness is summoned into the new book, which the consciousness transforms into your spellbook, along with all its spells. If the previous book still existed somewhere, all the spells vanish from its pages.)
- Remaining source effects need verification.

### Level 6 · Manifest Mind

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:manifest-mind-summon; 1 uses at probe level; long reset verified · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:manifest-mind-cast; 3 uses at probe level; long reset verified
- Generic action model · Cast through Manifest Mind: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:manifest-mind-cast (Cast wizard spell on your turn; mind manifested; use mind space and senses.) · Move Manifest Mind: source rules or unverified dedicated path (Mind manifested; hover30ft to unoccupied space visible to owner or mind; pass through creatures, not objects.) · Summon Manifest Mind: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:manifest-mind-summon (Awakened Spellbook on person; summon spectral object/construct in unoccupied space within60ft. Published free once/long-rest or spellslot; UA no summon use limit.)
- Remaining source effects need verification.

### Level 10 · Master Scriviner

- Generic action model · Master Scriviner: source rules or unverified dedicated path (At 10th level, whenever you finish a long rest, you can create one magic scroll by touching your Wizardly Quill to a blank piece of paper or parchment and causing one spell from your Awakened Spellbook to be copied onto the scroll. The spellbook must be within 5 feet of you when you make the scroll. The chosen spell must be of 1st or 2nd level and must have a casting time of 1 action. Once in the scroll, the spell's power is enhanced, counting as one level higher than normal. You can cast the spell from the scroll by reading it as an action. The scroll is unintelligible to anyone else, and the spell vanishes from the scroll when you cast it or when you finish your next long rest. You are also adept at crafting spell scrolls, which are described in the treasure chapter of the Dungeon Master's Guide. The gold and time you must spend to make such a scroll are halved if you use your Wizardly Quill.)
- Remaining source effects need verification.

### Level 14 · One with the Word

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:one-with-the-word; 1 uses at probe level; long reset verified
- Generic action model · One with the Word: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes:resource:one-with-the-word (At 14th level, your connection to your Awakened Spellbook has become so profound that your soul has become entwined with it. While the book is on your person, you have advantage on all Intelligence (Arcana) checks, as the spellbook helps you remember magical lore. Moreover, if you take damage while your spellbook's mind is manifested, you can prevent all of that damage to you by using your reaction to dismiss the spectral mind, using its magic to save yourself. Then roll 3d6. The spellbook temporarily loses spells of your choice that have a combined spell level equal to that roll or higher. For example, if the roll's total is 9, spells vanish from the book that have a combined level of at least 9, which could mean one 9th-level spell, three 3rd-level spells, or some other combination. If there aren't enough spells in the book to cover this cost, you drop to 0 hit points. Until you finish 1d6 long rests, you are incapable of casting the lost spells, even if you find them on a scroll or in another spellbook. After you finish the required number of rests, the spells reappear in the spell book. Once you use this reaction, you can't do so again until you finish a long rest.)
- Numeric effects awaiting verification · skill-advantage (Awakened Spellbook on person)
- Remaining source effects need verification.

## Wizard — Transmutation

Entry level 2 · [Player's Handbook](https://dnd5e.wikidot.com/wizard:transmutation)

### Level 2 · Transmutation Savant

- Remaining source effects need verification.

### Level 2 · Minor Alchemy

- Generic action model · Minor Alchemy: source rules or unverified dedicated path (Starting at 2nd level when you select this school, you can temporarily alter the physical properties of one nonmagical object, changing it from one substance into another. You perform a special alchemical procedure on one object composed entirely of wood, stone (but not a gemstone), iron, copper, or silver, transforming it into a different one of those materials. For each 10 minutes you spend performing the procedure, you can transform up to 1 cubic foot of material. After 1 hour, or until you lose your concentration (as if you were concentrating on a spell), the material reverts to its original substance.)
- Remaining source effects need verification.

### Level 6 · Transmuter's Stone

- Choice controls · Transmuter's Stone (activation)
- Generic action model · Transmuter's Stone: source rules or unverified dedicated path (Starting at 6th level, you can spend 8 hours creating a transmuter's stone that stores transmutation magic. You can benefit from the stone yourself or give it to another creature. A creature gains a benefit of your choice as long as the stone is in the creature's possession. When you create the stone, choose the benefit from the following options: - An increase to speed of 10 feet while the creature is unencumbered - Resistance to acid, cold, fire, lightning, or thunder damage (your choice whenever you choose this benefit) Each time you cast a transmutation spell of 1st level or higher, you can change the effect of your stone if the stone is on your person. If you create a new transmuter's stone, the previous one ceases to function.)
- Remaining source effects need verification.

### Level 10 · Shapechanger

- Counters · expanded:2014:wizard:2014:subclass:wizard:transmutation:resource:shapechanger; 1 uses at probe level; short reset verified
- Generic action model · Shapechanger: spends 1 from expanded:2014:wizard:2014:subclass:wizard:transmutation:resource:shapechanger (At 10th level, you add the Polymorph spell to your spellbook, if it is not there already. You can cast Polymorph without expending a spell slot. When you do so, you can target only yourself and transform into a beast whose challenge rating is 1 or lower.)
- Remaining source effects need verification.

### Level 14 · Master Transmuter

- Choice controls · Master Transmuter (activation)
- Counters · expanded:2014:wizard:2014:subclass:wizard:transmutation:resource:master-transmuter; 1 uses at probe level; long reset verified
- Generic action model · Master Transmuter: spends 1 from expanded:2014:wizard:2014:subclass:wizard:transmutation:resource:master-transmuter (Starting at 14th level, you can use your action to consume the reserve of transmutation magic stored within your transmuter's stone in a single burst. When you do so, choose one of the following effects. Your transmuter's stone is destroyed and can't be remade until you finish a long rest. Major Transformation._ You can transmute one nonmagical object – no larger than a 5-foot cube – into another nonmagical object of similar size and mass and of equal or lesser value. You must spend 10 minutes handling the object to transform it.)
- Remaining source effects need verification.

## Wizard — War Magic

Entry level 2 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/wizard:war-magic)

### Level 2 · Arcane Deflection

- Generic action model · Arcane Deflection: source rules or unverified dedicated path (Hit by attack OR fail saving throw: +2AC against that attack OR +4 to that save. Until next turn end can cast only cantrips.)
- Remaining source effects need verification.

### Level 2 · Tactical Wit

- Recognized numeric routes · initiative
- Remaining source effects need verification.

### Level 6 · Power Surge

- Counters · expanded:2014:wizard:2014:subclass:wizard:war-magic:resource:power-surges; 3 uses at probe level; none reset
- Generic action model · Power Surge: source rules or unverified dedicated path (You can store a maximum number of power surges equal to your Intelligence modifier (minimum of one). Whenever you finish a long rest, your number of power surges resets to one. Whenever you successfully end a spell with Dispel Magic or Counterspell, you gain one power surge, as you steal magic from the spell you foiled. If you end a short rest with no power surges, you gain one power surge. Once per turn when you deal damage to a creature or object with a wizard spell, you can spend one power surge to deal extra force damage to that target. The extra damage equals half your wizard level.)
- Remaining source effects need verification.

### Level 10 · Durable Magic

- Recognized numeric routes · ac-bonus (Concentrating on spell) · save-bonus (Concentrating on spell)
- Remaining source effects need verification.

### Level 14 · Deflecting Shroud

- Generic action model · Deflecting Shroud: source rules or unverified dedicated path (At 14th level, your Arcane Deflection becomes infused with deadly magic. When you use your Arcane Deflection feature, you can cause magical energy to arc from you. Up to three creatures of your choice within 60 feet of you each take force damage equal to half your wizard level.)
- Numeric effects awaiting verification · force-damage (Use Arcane Deflection; up to 3 chosen creatures within60ft)
- Remaining source effects need verification.

## Wizard — Runecrafter (UA)

Entry level 2 · [Unearthed Arcana 83 - Giant Options](https://dnd5e.wikidot.com/wizard:runecrafter-ua)

Source spell progression · level 2 prepared: Comprehend Languages

### Level 2 · Runes of Understanding

- Generic action model · Runes of Understanding: source rules or unverified dedicated path (Your study of runecraft has unlocked the ability to decode runes and languages, regardless of their origin; you always have Comprehend Languages prepared, you can cast it without expending a spell slot, and the spell doesn’t count against the number of spells you have prepared.)
- Remaining source effects need verification.

### Level 2 · Runic Empowerment

- Counters · expanded:2014:wizard:2014:subclass:wizard:runecrafter-ua:resource:runic-empowerment; 2 uses at probe level; long reset verified
- Generic action model · Runic Empowerment: spends 1 from expanded:2014:wizard:2014:subclass:wizard:runecrafter-ua:resource:runic-empowerment (When you choose this subclass, you learn how to amplify your magic through the application of various runes. Your knowledge of these runes is stored in your spellbook, though you determine the runes’ cosmetic appearance. For example, your runes could be engraved into the cover of your spellbook, glowing whenever you cast a spell, or you could work the shape and meaning of the runes directly into a spell’s somatic and verbal components. When you cast a spell using a spell slot, you can invoke one of the following runes: - Life Rune. When you invoke this rune, choose one creature you can see within 30 feet of you (you can choose yourself). The chosen creature gains temporary hit points equal to 5 times the level of the spell slot expended.
- War Rune. When you invoke this rune, choose one creature you can see within 30 feet of you. Until the end of your next turn, attack rolls that target the chosen creature gain a bonus equal to half the level of the spell slot expended (rounded up, minimum of +1).
- Wind Rune. When you invoke this rune, your speed increases by a number of feet equal to 5 times the level of the spell slot expended, and your movement doesn’t provoke opportunity attacks. These benefits last until the start of your next turn. You can invoke no more than one rune per spell. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 6 · Sigils of Warding

- Generic action model · Sigils of Warding: spends 1 from expanded:2014:wizard:2014:subclass:wizard:runecrafter-ua:resource:runic-empowerment (Fail Strength/Dexterity/Constitution save; expend one Runic Empowerment use and succeed instead.)
- Remaining source effects need verification.

### Level 10 · Rune Maven

- Generic action model · Rune Maven: source rules or unverified dedicated path (Your understanding of runecraft has grown immensely. Whenever you use your Arcane Recovery feature, you also regain a number of your expended uses of Runic Empowerment. The number of uses you regain can be no more than half your Intelligence modifier, rounded up (minimum of 1).)
- Remaining source effects need verification.

### Level 14 · Engraved Emnity

- Counters · expanded:2014:wizard:2014:subclass:wizard:runecrafter-ua:resource:engraved-emnity; 1 uses at probe level; long reset verified
- Generic action model · Engraved Emnity: spends 1 from expanded:2014:wizard:2014:subclass:wizard:runecrafter-ua:resource:engraved-emnity (You have mastered the art of wielding your runes directly against your foes. As a bonus action, you can target one creature you can see within 60 feet of yourself. The creature must succeed on a Wisdom saving throw against your spell save DC or be magically marked by an enmity rune. - Unveiled Enemy. The radiance of the glowing rune makes the creature visible if it’s invisible, and the creature can’t become invisible while the rune persists.
- Woeful Curse. When you mark the creature, and as a bonus action on subsequent turns for the duration, you can invoke the enmity rune to curse the creature until the start of your next turn. The next time one of your allies hits the cursed creature with an attack roll, the target also takes 1d8 force damage, and the curse ends. The enmity rune lasts for 1 minute or until you lose your concentration (as if you were concentrating on a spell). Once you have marked a creature in this way, you can’t do so again until you finish a long rest, unless you expend a spell slot of 3rd level or higher to use this feature again.)
- Remaining source effects need verification.

## Wizard — Artificer (UA)

Entry level 2 · [Unearthed Arcana 1 - Eberron](https://dnd5e.wikidot.com/wizard:artificer-ua)

### Level 2 · Infuse Potions

- Remaining source effects need verification.

### Level 2 · Infuse Scrolls

- Remaining source effects need verification.

### Level 6 · Infuse Weapons and Armor

- Remaining source effects need verification.

### Level 10 · Superior Artificer

- Remaining source effects need verification.

### Level 14 · Master Artificer

- Remaining source effects need verification.

## Wizard — Invention (UA)

Entry level 2 · [Unearthed Arcana 46 - Three Subclasses](https://dnd5e.wikidot.com/wizard:invention-ua)

### Level 2 · Tools of the Inventor

- Choice controls · Tools of the Inventor (advancement)
- Remaining source effects need verification.

### Level 2 · Arcanomechanical Armor

- Training grants · light
- Numeric effects awaiting verification · ac (Wearing attuned arcanomechanical armor; light armor) · resistance (Wearing attuned arcanomechanical armor)
- Remaining source effects need verification.

### Level 2 · Reckless Casting

- Generic action model · Reckless Casting: source rules or unverified dedicated path (Starting at 2nd level, you can attempt to cast a spell you don’t have prepared. When you use this ability, you use your action and choose one of the following options: - Expend a spell slot and roll twice on the Reckless Casting table for its level, or the 5th-level table if the slot is 6th level or higher. Pick which of the two results you want to use and cast the resulting spell as part of this action. If the spell you cast isn’t a wizard spell, it is nonetheless a wizard spell for you when you cast it with this feature. | Reckless Casting |
| --- |
| d10 | Cantrip |
| 1 | Acid Splash |
| 2 | Chill Touch |
| 3 | Fire Bolt |
| 4 | Light |
| 5 | Poison Spray |
| 6 | Ray of Frost |
| 7 | Shocking Grasp |
| 8 | Sacred Flame |
| 9 | Thorn Whip |
| 10 | Roll twice and cast each cantrip, but if you roll another 10 on either die, you cast nothing, wasting your action. |
| d10 | 1st-Level Spell |
| 1 | Burning Hands |
| 2 | Chromatic Orb |
| 3 | Color Spray |
| 4 | Faerie Fire |
| 5 | False Life |
| 6 | Fog Cloud |
| 7 | Jump |
| 8 | Magic Missile |
| 9 | Thunderwave |
| 10 | Roll twice and cast each spell, but if you roll another 10 on either die, you cast nothing, wasting your action. |
| d10 | 2nd-Level Spell |
| 1 | Blur |
| 2 | Darkness |
| 3 | Enlarge/Reduce |
| 4 | Gust of Wind |
| 5 | Invisibility |
| 6 | Levitate |
| 7 | Melf's Acid Arrow |
| 8 | Scorching Ray |
| 9 | Shatter |
| 10 | Roll twice and cast each spell, but if you roll another 10 on either die, you cast nothing, wasting your action. |
| d10 | 3rd-Level Spell |
| 1 | Blink |
| 2 | Fear |
| 3 | Feign Death |
| 4 | Fireball |
| 5 | Fly |
| 6 | Gaseous Form |
| 7 | Lightning Bolt |
| 8 | Sleet Storm |
| 9 | Stinking Cloud |
| 10 | Roll twice and cast each spell, but if you roll another 10 on either die, you cast nothing, wasting your action. |
| d10 | 4th-Level Spell |
| 1 | Blight |
| 2 | Confusion |
| 3 | Evard's Black Tentacles |
| 4 | Fire Shield |
| 5 | Greater Invisibility |
| 6 | Ice Storm |
| 7 | Phantasmal Killer |
| 8 | Stoneskin |
| 9 | Wall of Fire |
| 10 | Roll twice and cast each spell, but if you roll another 10 on either die, you cast nothing, wasting your action. |
| d10 | 5th-Level Spell |
| 1 | Cloudkill |
| 2 | Cone of Cold |
| 3 | Destructive Wave |
| 4 | Flame Strike |
| 5 | Hold Monster |
| 6 | Insect Plague |
| 7 | Mass Cure Wounds |
| 8 | Wall of Force |
| 9 | Wall of Stone |
| 10 | Roll twice and cast each spell, but if you roll another 10 on either die, you cast nothing, wasting your action. |)
- Remaining source effects need verification.

### Level 6 · Alchemical Casting

- Generic action model · Alchemical Casting: source rules or unverified dedicated path (At 6th level, you learn to channel magic through your arcanomechanical armor to augment spells in a variety of ways. When you cast a spell while wearing that armor and attuned to it, you can expend one additional spell slot of 1st or 2nd level to alter the spell. The effect depends on the spell slot you expend. A 1st-level slot allows you to manipulate the spell’s energy. When you cast a spell that deals acid, cold, fire, lightning, or thunder damage, you can substitute that damage type for another one from that list. A 2nd-level slot increases the spell’s raw force. If you roll damage for the spell when you cast it, increase that damage by 2d10 force damage against one of the spell’s targets (your choice) this turn.)
- Remaining source effects need verification.

### Level 10 · Prodigious Inspiration

- Counters · expanded:2014:wizard:2014:subclass:wizard:invention-ua:resource:prodigious-inspiration; 1 uses at probe level; short reset verified
- Generic action model · Prodigious Inspiration: spends 1 from expanded:2014:wizard:2014:subclass:wizard:invention-ua:resource:prodigious-inspiration (At 10th level, you have attained a greater mastery of spell preparation. As a bonus action, you can replace one spell you have prepared with another spell from your spellbook. You can’t use this ability again until you finish a short or long rest.)
- Remaining source effects need verification.

### Level 14 · Controlled Chaos

- Generic action model · Controlled Chaos: source rules or unverified dedicated path (At 14th level, your ability to improvise magic grows stronger. Whenever you roll on a Reckless Casting table for a spell other than a cantrip, you can roll on the table that is one level higher than the expended spell slot.)
- Remaining source effects need verification.

## Wizard — Lore Mastery (UA)

Entry level 2 · [Unearthed Arcana 29 - Warlock and Wizard](https://dnd5e.wikidot.com/wizard:lore-mastery-ua)

### Level 2 · Lore Mastery

- Choice controls · Lore Mastery (activation)
- Generic action model · Lore Mastery: source rules or unverified dedicated path (Starting at 2nd level, you become a compendium of knowledge on a vast array of topics. Your proficiency bonus is doubled for any ability check you make that uses the Arcana, History, Nature, or Religion skill if you are proficient in that skill. In addition, your analytical abilities are so well-honed that your initiative in combat can be driven by mental agility, rather than physical agility. When you roll initiative, it is either an Intelligence check or a Dexterity check for you (your choice).)
- Recognized numeric routes · expertise (Only skills already proficient) · initiative-ability (Choose each initiative roll)
- Remaining source effects need verification.

### Level 2 · Spell Secrets

- Counters · expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:spell-secrets-save; 1 uses at probe level; short reset verified
- Generic action model · Spell Secrets: spends 1 from expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:spell-secrets-save (When you cast a spell with a spell slot and the spell deals acid, cold, fire, force, lightning, necrotic, radiant, or thunder damage, you can substitute that damage type with one other type from that list (you can change only one damage type per casting of a spell). You replace one energy type for another by altering the spell's formula as you cast it. When you cast a spell with a spell slot and the spell requires a saving throw, you can change the saving throw from one ability score to another of your choice. Once you change a saving throw in this way, you can't do so again until you finish a short or long rest.)
- Remaining source effects need verification.

### Level 2 · Altering Spells

- Remaining source effects need verification.

### Level 6 · Alchemical Casting

- Generic action model · Alchemical Casting: source rules or unverified dedicated path (At 6th level, you learn to augment spells in a variety of ways. When you cast a spell with a spell slot, you can expend one additional spell slot to augment its effects for this casting, mixing the raw stuff of magic into your spell to amplify it. The effect depends on the spell slot you expend. An additional 1st-level spell slot can increase the spell's raw force. If you roll damage for the spell when you cast it, increase the damage against every target by 2d10 force damage. If the spell can deal damage on more than one turn, it deals this extra force damage only on the turn you cast the spell. An additional 2nd-level spell slot can increase the spell's range. If the spell's range is at least 30 feet, it becomes 1 mile.)
- Remaining source effects need verification.

### Level 10 · Prodigious Memory

- Counters · expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:prodigious-memory; 1 uses at probe level; short reset verified
- Generic action model · Prodigious Memory: spends 1 from expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:prodigious-memory (At 10th level, you have attained a greater mastery of spell preparation. As a bonus action, you can replace one spell you have prepared with another spell from your spellbook. You can't use this feature again until you finish a short or long rest.)
- Remaining source effects need verification.

### Level 14 · Master of Magic

- Counters · expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:master-of-magic; 1 uses at probe level; long reset verified
- Generic action model · Master of Magic: spends 1 from expanded:2014:wizard:2014:subclass:wizard:lore-mastery-ua:resource:master-of-magic (At 14th level, your knowledge of magic allows you to duplicate almost any spell. As a bonus action, you can call to mind the ability to cast one spell of your choice from any class's spell list. The spell must be of a level for which you have spell slots, you mustn't have it prepared, and you follow the normal rules for casting it, including expending a spell slot. If the spell isn't a wizard spell, it counts as a wizard spell when you cast it. The ability to cast the spell vanishes from your mind when you cast it or when the current turn ends.)
- Remaining source effects need verification.

## Wizard — Mage of Lorehold (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-lorehold-ua)

Source spell progression · level 2 known: Sacred Flame · level 2 spellbook: Comprehend Languages · level 3 spellbook: Knock, Locate Object · level 5 spellbook: Speak with Dead, Spirit Guardians · level 7 spellbook: Arcane Eye, Stone Shape · level 9 spellbook: Destructive Wave, Legend Lore

### Level 2 · Lorehold Spells

- Spell grants · Sacred Flame · Comprehend Languages
- Generic action model · Lorehold Spells: source rules or unverified dedicated path (You learn the cantrip Sacred Flame and the 1st level spell Comprehend Languages. You learn additional spells when you reach certain levels in this class, as shown on the Lorehold Spells table. Each of these spells counts as a class spell for you, but it doesn’t count against the number of spells you know. If you are a wizard, you can add these spells to your spellbook upon learning them, without expending any gold, and prepare them as normal.)
- Remaining source effects need verification.

### Level 2 · Ancient Companion

- Choice controls · Ancient Companion (rest)
- Generic action model · Ancient Companion: source rules or unverified dedicated path (Whenever you finish a short or long rest, you can call forth and bond with one such spirit, who comes to inhabit a Medium, freestanding statue within 10 feet of you to serve as your ancient companion. See this creature’s game statistics in the Ancient Companion stat block, which uses your proficiency bonus (PB) in several places. When you bond with your ancient companion, choose the type of spirit you bond with: Healer, Sage, or Warrior. Your choice of spirit determines certain traits in its stat block. The statue determines the spirit’s appearance. The ancient companion is friendly to you and your companions and obeys your commands. In combat, the companion shares your initiative count, but it takes its turn immediately after yours. It can move and use its reaction on its own, but the only action it takes on its turn is the Dodge action, unless you take a bonus action on your turn to command it to take another action. That action can be one in its stat block or some other action. If you are incapacitated, the companion can take any action of its choice, not just Dodge. As an action, you can touch the ancient companion and expend a spell slot of 1st-level or higher. The ancient companion regains a number of hit points equal to 10 times the level of spell slot expended. The companion perishes when it drops to 0 hit points, when you bond with a new ancient companion at the end of a short or long rest, or when you die. When the companion perishes, the spirit within returns to its plane of origin, and the statue becomes an inert object. | Ancient Companion |
| --- |
| Medium construct, Any Alignment |
| Armor Class: 14 (natural armor) + 2 (Warrior only) |
| Hit Points: 5 + 5 times your level in this class (the companion has a number of Hit Dice [d8s] equal to your level in this class) |
| Speed: 30 ft. |
| STR | DEX | CON | INT | WIS | CHA |
| 14 (+2) | 9 (-1) | 15 (+2) | 14 (+2) | 14 (+2) | 11 (+0) |
| Saving Throws: Con +2 plus PB, Int +2 plus PB, Wis +2 plus PB |
| Skills: History +2 plus PB, Perception +2 plus (PB × 2) |
| Damage Immunities: poison |
| Condition Immunities: charmed, exhaustion |
| Senses: passive Perception 12 + (PB × 2) |
| Languages: speaks and understands the languages you speak |
| Challenge: — |
| Proficiency Bonus: equals your bonus |
| Ancient Fortitude._ If damage reduces the companion to 0 hit points, it can make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is from a critical hit. On a success, the companion drops to 1 hit point instead. |
| Sage’s Counsel (Sage Only)._ While within 15 feet of the companion, you and your allies gain a +2 bonus to Intelligence and Wisdom checks. |
| Actions |
| Spirit Strike._ Melee Weapon Attack:_ your spell attack modifier to hit, reach 5 ft., one target you can see. Hit:_ 1d8 + 2 + PB force damage. |
| Healer’s Light (Healer Only)._ The companion chooses a creature it can see within 15 feet of itself and flares with invigorating light. The creature gains 1d8 + PB temporary hit points. |
| Reactions |
| Warrior’s Protection (Warrior Only)._ When a creature within 5 feet of the companion makes a Strength or Dexterity saving throw, the companion imposes itself between the creature and the danger. The creature can roll a d4 and add the number rolled to the saving throw. |)
- Remaining source effects need verification.

### Level 6 · Lessons of the Past

- Remaining source effects need verification.

### Level 10 · War Echoes

- Remaining source effects need verification.

### Level 14 · History’s Whims

- Remaining source effects need verification.

## Wizard — Mage of Prismari (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-prismari-ua)

### Level 2 · Creative Skills

- Choice controls · Creative Skills (advancement)
- Remaining source effects need verification.

### Level 2 · Kinetic Artistry

- Choice controls · Kinetic Artistry (activation)
- Counters · expanded:2014:wizard:2014:subclass:wizard:mage-of-prismari-ua:resource:kinetic-artistry; 2 uses at probe level; long reset verified
- Generic action model · Kinetic Artistry: spends 1 from expanded:2014:wizard:2014:subclass:wizard:mage-of-prismari-ua:resource:kinetic-artistry (You can Dash as a bonus action. When you take this bonus action, choose one of the following additional effects: Boreal Sweep. Icy water swirls around you. Until the end of your turn, you can move across the surface of water as if it were harmless solid ground. Additionally, when you leave a space within 5 feet of a creature, you can force that creature to make a Strength saving throw against your spell save DC. On a failed save, the creature is knocked prone. A creature can be affected by the water only once each turn. Thunderlight Jaunt. You take on a nimble lightning form. Until the end of your turn, you can move through the space of other creatures, and you do not provoke opportunity attacks. If you end your turn inside a creature’s space, you are pushed into the nearest unoccupied space. You can use a bonus action in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 6 · Favored Medium

- Remaining source effects need verification.

### Level 10 · Focused Expression

- Remaining source effects need verification.

### Level 14 · Impeccable Physicality

- Remaining source effects need verification.

## Wizard — Mage of Quandrix (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-quandrix-ua)

Source spell progression · level 2 known: Guidance · level 2 spellbook: Guiding Bolt · level 3 spellbook: Enlarge/Reduce, Spike Growth · level 5 spellbook: Aura of Vitality, Haste · level 7 spellbook: Control Water, Freedom of Movement · level 9 spellbook: Circle of Power, Passwall

### Level 2 · Quandrix Spells

- Spell grants · Guidance · Guiding Bolt
- Generic action model · Quandrix Spells: source rules or unverified dedicated path (You learn the cantrip Guidance and the 1st-level spell Guiding Bolt. You learn additional spells when you reach certain levels in this class, as shown on the Quandrix Spells table. Each of these spells counts as a class spell for you, but it doesn’t count against the number of spells you know. If you are a wizard, you can add these spells to your spellbook upon learning them, without expending any gold, and prepare them as normal.)
- Remaining source effects need verification.

### Level 2 · Functions of Probability

- Choice controls · Functions of Probability (activation)
- Generic action model · Functions of Probability: source rules or unverified dedicated path (By iterating on the mathematical patterns of reality, you can nudge chance to tilt around a creature. When you cast a spell using a spell slot that targets at least one creature, you can choose that creature or another creature within 30 feet of it (including yourself) and add one of the following effects: Diminishing Function. The chosen creature must succeed on a Wisdom saving throw against your spell save DC, or the creature must roll a d6 and subtract the number rolled from the next attack roll it takes before the start of your next turn. Supplemental Function. Once before the start of your next turn, the chosen creature can roll a d6 and add the number rolled to an attack roll or a saving throw of its choice. The creature can roll the d6 after rolling the d20 but must decide before any effects of the roll occur.)
- Remaining source effects need verification.

### Level 6 · Velocity Shift

- Remaining source effects need verification.

### Level 10 · Null Equation

- Remaining source effects need verification.

### Level 14 · Quantum Tunneling

- Remaining source effects need verification.

## Wizard — Mage of Silverquill (UA)

Entry level 2 · [Unearthed Arcana 79 - Mages of Strixhaven](https://dnd5e.wikidot.com/multisubclass:mage-of-silverquill-ua)

### Level 2 · Eloquent Apprentice

- Choice controls · Eloquent Apprentice (advancement)
- Remaining source effects need verification.

### Level 2 · Silvery Barbs

- Counters · expanded:2014:wizard:2014:subclass:wizard:mage-of-silverquill-ua:resource:silvery-barbs; 1 uses at probe level; long reset verified
- Generic action model · Silvery Barbs: spends 1 from expanded:2014:wizard:2014:subclass:wizard:mage-of-silverquill-ua:resource:silvery-barbs (You can invoke words laced with magic to demoralize your foes and turn their misfortune into a boon to bolster your allies. Immediately after a creature you can see within 60 feet of you succeeds on an attack roll, an ability check, or a saving throw, you can use your reaction to demoralize the creature. Unless the creature is immune to being charmed, it rerolls the d20 and must use the lower roll. If the attack roll, ability check, or saving throw then fails, you can choose a different creature you can see within 60 feet of you (you can choose yourself). That creature is empowered, and can reroll one attack roll, ability check, or saving throw it makes within 1 minute and use the higher result. A creature can be empowered by only one use of this feature at a time.)
- Remaining source effects need verification.

### Level 6 · Inky Shroud

- Remaining source effects need verification.

### Level 10 · Infusion of Eloquence

- Remaining source effects need verification.

### Level 14 · Word of Power

- Remaining source effects need verification.

## Wizard — Onomancy (UA)

Entry level 2 · [Unearthed Arcana 63 - Cleric, Druid, Wizard](https://dnd5e.wikidot.com/wizard:onomancy-ua)

### Level 2 · Bonus Proficiencies

- Choice controls · Bonus Proficiencies (advancement)
- Training grants · calligrapher's tools
- Remaining source effects need verification.

### Level 2 · Extract Name

- Counters · expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:extract-name; 3 uses at probe level; long reset verified
- Generic action model · Extract Name: spends 1 from expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:extract-name (At 2nd level, you can magically compel a creature to divulge its true name. As a bonus action, you target one creature you can see within 60 feet of you. The target must make a Wisdom saving throw against your spell save DC. On a successful save, you discern that this magic failed, and you can’t use this feature on the target again. On a failed save, the target is charmed by you until the end of your next turn, and you mentally learn the charmed target’s name or the fact that the target lacks a name. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses of it when you finish a long rest.)
- Remaining source effects need verification.

### Level 2 · Fateful Naming

- Counters · expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:fateful-naming; 3 uses at probe level; long reset verified
- Generic action model · Fateful Naming: spends 1 from expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:fateful-naming (You can cast either spell without expending a spell slot if you speak the true name of one target of the spell as part of casting it. You can cast the spells in this way a number of times equal to your Intelligence modifier (a minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 6 · Resonant Utterance

- Choice controls · Resonant Utterance (advancement)
- Counters · expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:resonants; 3 uses at probe level; long reset verified
- Generic action model · Resonant Utterance: spends 1 from expanded:2014:wizard:2014:subclass:wizard:onomancy-ua:resource:resonants (Resonants Known. When you gain this feature, you learn two Resonants of your choice, which are detailed in the “Resonant Options” section. Each time you gain a level in this class, you can replace one resonant you know with a different one. Using a Resonant. You can use one Resonant when you cast a wizard spell with a spell slot and speak the true name of one creature targeted by the spell. Speaking the name is part of casting the spell. You can use Resonants a number of times equal to half of your wizard level (round down), and you regain all expended uses when you finish a long rest. Resonant Options. Here are your options when choosing a Resonant: - Absorption. When you cast a spell that deals damage to the named target, you gain 3d6 temporary hit points. The number of temporary hit points you gain increases by 1d6 when you reach 10th level (4d6) and 14th level (5d6) in this class. - Devastation. If the spell requires the named creature to make a saving throw, that creature has disadvantage on the first save it makes against the spell. - Dissolution. The first time the named creature takes damage from the spell, that creature takes an extra 2d8 force damage. The extra force damage increases by 1d8 when you reach 10th level (3d8) and 14th level (4d8) in this class. - Nullification. If the named target is affected by any other spells, you know what those spells are, and you can attempt to end one of your choice by succeeding on an Intelligence check with a DC equal to 10 + the level of the chosen spell. - Sympathy. If the named creature is within range of the spell, you can target the creature with the spell even if you can’t see the creature or it has total cover against the spell.)
- Remaining source effects need verification.

### Level 10 · Inexorable Pronouncement

- Remaining source effects need verification.

### Level 14 · Relentless Naming

- Generic action model · Relentless Naming: source rules or unverified dedicated path (At 14th level, you have learned how to bypass a named creature’s defenses against certain types of damage. When you cast a spell that deals damage to a creature whose true name you speak as part of casting the spell, you can cause the spell to deal force or psychic damage to the creature, instead of the spell’s normal damage type.)
- Remaining source effects need verification.

## Wizard — Order of Scribes (UA)

Entry level 2 · [Unearthed Arcana 72 - Subclasses Revisited](https://dnd5e.wikidot.com/wizard:order-of-scribes-ua)

### Level 2 · Wizardly Quill

- Generic action model · Wizardly Quill: source rules or unverified dedicated path (At 2nd level, as a bonus action, you can magically create a Tiny quill in your free hand. The magic quill has the following properties: - The quill doesn’t require ink. When you write with it, it produces ink in a color of your choice on the writing surface. - The gold and time you must spend to copy a spell into your spellbook are halved if you use the quill for the transcription. - You can erase anything you write with the quill if you wave the feather over the text as a bonus action, provided the text is within 5 feet of you. This quill disappears if you create another one or if you die.)
- Remaining source effects need verification.

### Level 2 · Awakened Spellbook

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:awakened-spellbook; 1 uses at probe level; long reset verified
- Generic action model · Awakened Spellbook: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:awakened-spellbook (At 2nd level, while you are holding the book, it grants you the following benefits: - You can use the book as a spellcasting focus for your wizard spells. - When you cast a wizard spell with a spell slot, you can temporarily replace its damage type with the damage type of another spell in your spellbook, as your spellbook magically alters the spell’s formula for this casting. - When you cast a wizard spell as a ritual, you can use the spell’s normal casting time, rather than adding 10 minutes to it. Once you use this benefit, you can’t do so again until you finish a long rest. If necessary, you can replace the book over the course of a short rest by using your Wizardly Quill to write arcane sigils in a blank book or a magic spellbook to which you’re attuned. At the end of the rest, your spellbook’s consciousness is summoned into the new book, which the consciousness transforms into your spellbook, along with all its spells. If the previous book still existed somewhere, all the spells vanish from its pages.)
- Remaining source effects need verification.

### Level 6 · Master Scrivener

- Generic action model · Master Scrivener: source rules or unverified dedicated path (At 6th level, whenever you finish a long rest, you can create one magic scroll by touching your Wizardly Quill to a blank piece of paper or parchment and causing one spell from your Awakened Spellbook to be copied onto the scroll. The spellbook must be within 5 feet of you when you make the scroll. The chosen spell must be of 1st or 2nd level and must have a casting time of 1 action. Once in the scroll, the spell’s power is enhanced, counting as one level higher than normal. You can cast the spell from the scroll by reading it as an action. The scroll is unintelligible to anyone else, and the spell vanishes from the scroll when you cast it or when you finish your next long rest. You are also adept at crafting spell scrolls, which are described in chapter 7 of the Dungeon Master’s Guide. The gold and time you must spend to make such a scroll are halved if you use your Wizardly Quill.)
- Remaining source effects need verification.

### Level 10 · Manifest Mind

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:manifest-mind-cast; 4 uses at probe level; long reset verified
- Generic action model · Cast through Manifest Mind: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:manifest-mind-cast (Cast wizard spell on your turn; mind manifested; use mind space and senses.) · Move Manifest Mind: source rules or unverified dedicated path (Mind manifested; hover30ft to unoccupied space visible to owner or mind; pass through creatures, not objects.) · Summon Manifest Mind: source rules or unverified dedicated path (Awakened Spellbook on person; summon spectral object/construct in unoccupied space within60ft. Published free once/long-rest or spellslot; UA no summon use limit.)
- Remaining source effects need verification.

### Level 14 · One with the Word

- Counters · expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:one-with-the-word; 5 uses at probe level; long reset verified
- Generic action model · One with the Word: spends 1 from expanded:2014:wizard:2014:subclass:wizard:order-of-scribes-ua:resource:one-with-the-word (At 14th level, your connection to your Awakened Spellbook has become so profound that your soul has become entwined with it. While you are holding the book and its spectral mind is manifest, you can take an action to cause the two of you to teleport, swapping places. You can teleport in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest. Moreover, if you die but at least one spell remains in your Awakened Spellbook, you can return to life 1 minute later within 5 feet of the book. You revive with 1 hit point. Then roll 3d6. The book loses spells of your choice that have a combined spell level equal to that roll or higher. For example, if the roll’s total is 9, spells vanish from the book that have a combined level of at least 9, which could mean one 9th-level spell, three 3rd-level spells, or some other combination. Thereafter, you are incapable of casting the lost spells, even if you find them on a scroll or in another spellbook. The only way to restore your ability to cast one of the lost spells is through the wish spell, which can restore one spell to the book per casting.)
- Remaining source effects need verification.

## Wizard — Psionics (UA)

Entry level 2 · [Unearthed Arcana 66 - Fighter, Rogue, Wizard](https://dnd5e.wikidot.com/wizard:psionics-ua)

### Level 2 · Psionic Focus

- Generic action model · Psionic Focus: source rules or unverified dedicated path (At 2nd level, you have learned to channel psionic energy through a special object: a psionic focus. You gain the object with this feature. While your psionic focus is on your person, you gain the following benefits: - When you roll psychic or force damage for any of your wizard spells, you can reroll any of those damage dice that rolls a 1, but you must use the new roll. - If your psionic focus is lost, you can magically recreate it by meditating for 1 hour during a short or long rest, at the end of which the focus appears in your hand. Every member of the Psionics tradition has a story about how their psionic focus came into their life. Consider how you found yours and what form it takes. The event that brought your psionic focus to you probably holds personal significance. Did your master give it to you upon the completion of your apprenticeship? Was it awarded to you when you graduated from your academy of wizardry? Did it call to you in a jeweler's shop? Was it associated with the moment when your psionic powers first manifested? One morning, did you wake up with it humming under your pillow? The form your psionic focus takes is also yours to define, likely being a reflection of how your magic came into being, a symbol of your own psyche, or an item you use to focus your thoughts. It is a handheld object that has special meaning to you, but that can't be a weapon or magic item. Perhaps it's a childhood memento, the skull of an alien creature, a crystal that makes you feel a certain way, a coin that only lands on its edge, a firescarred planchette, or any other enigmatic personal relic._)
- Remaining source effects need verification.

### Level 2 · Psionic Devotion

- Choice controls · Psionic Devotion (advancement)
- Generic action model · Psionic Devotion: source rules or unverified dedicated path (Starting at 2nd level, your study of psionics begins to unleash your mind's potential. When you gain this feature, choose one of the following cantrips: Friends, Mage Hand, or Message. You learn that cantrip if you don't already know it, and it doesn't count against the number of wizard cantrips you know. While your psionic focus is on your person, you can cast the chosen cantrip as a bonus action, requiring no components, and with the modification listed below. Friends._ When the spell ends, the target doesn't become hostile to you. Mage Hand._ You can make the hand invisible when you cast the spell, and controlling the spell is a bonus action for you.)
- Remaining source effects need verification.

### Level 6 · Thought Form

- Counters · expanded:2014:wizard:2014:subclass:wizard:psionics-ua:resource:thought-form; 3 uses at probe level; long reset verified
- Generic action model · Thought Form: spends 1 from expanded:2014:wizard:2014:subclass:wizard:psionics-ua:resource:thought-form (At 6th level, while you are carrying your psionic focus, you can use a bonus action to magically transform your body into pure psionic energy. The transformation lasts for 10 minutes, until you use a bonus action to assume your normal form, or until you are incapacitated or die. While in thought form, you are a figure of luminous psychic energy, with your psionic focus hovering within. Your form can appear as anything you wish, but it is obviously magical, is the same size as you, and sheds dim light in a 5-foot radius. Any other equipment you are wearing or carrying transforms with you and melds into your thought form. You also gain the following benefits. Psionic Spellcasting._ When you cast a spell while in thought form, you can cast the spell psionically. If you do so, the spell doesn't require verbal, somatic, or material components that lack a gold cost. You can transform using this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 10 · Empowered Psionics

- Generic action model · Empowered Psionics: source rules or unverified dedicated path (At 10th level, when you deal psychic or force damage with a wizard spell, you can add your Intelligence modifier to the damage against one of the spell's targets.)
- Numeric effects awaiting verification · psychic-force-spell-damage-bonus (Wizard spell deals psychic or force damage; add int against one target. No Thought Form or once/turn prerequisite stated.)
- Remaining source effects need verification.

### Level 10 · Mental Discipline

- Choice controls · Mental Discipline (advancement)
- Counters · expanded:2014:wizard:2014:subclass:wizard:psionics-ua:resource:mental-discipline; 1 uses at probe level; long reset verified
- Generic action model · Mental Discipline: spends 1 from expanded:2014:wizard:2014:subclass:wizard:psionics-ua:resource:mental-discipline (Starting at 10th level, your mind's power expands to greater heights. When you gain this feature, choose one of the following spells: Dominate Person, Scrying, or Telekinesis. You can add the spell to your spellbook, and you can cast it without components. You can also cast the chosen spell once without expending a spell slot. After you do so, you regain the ability to cast the spell without a slot when you finish a long rest.)
- Remaining source effects need verification.

### Level 14 · Thought Travel

- Remaining source effects need verification.

## Wizard — Technomancy (UA)

Entry level 2 · [Unearthed Arcana 7 - Modern Magic](https://dnd5e.wikidot.com/wizard:technomancy-ua)

### Level 2 · Bonus Proficiencies

- Training grants · hacking tools · sidearms
- Generic action model · Bonus Proficiencies: source rules or unverified dedicated path (Beginning when you select this arcane tradition at 2nd level, you gain proficiency with sidearms and hacking tools.)
- Remaining source effects need verification.

### Level 2 · Technological Savant

- Remaining source effects need verification.

### Level 6 · Program Spell

- Counters · expanded:2014:wizard:2014:subclass:wizard:technomancy-ua:resource:program-spell; 1 uses at probe level; long reset verified
- Remaining source effects need verification.

### Level 10 · Online Casting

- Counters · expanded:2014:wizard:2014:subclass:wizard:technomancy-ua:resource:online-casting; 3 uses at probe level; none reset
- Generic action model · Online Casting: spends 1 from expanded:2014:wizard:2014:subclass:wizard:technomancy-ua:resource:online-casting (At 10th level, you can cast spells through networked electronic devices, including cameras, mobile phones, and computers. For example, if a creature is under the observation of a security camera and you can see the video feed from that camera on a computer, you can cast a spell into the computer and out through the security camera to target that creature. If the spell requires the caster to be seen, the target must see you or a live image of you. If the spell requires the caster to be heard, the target must be able to hear you or a live audio transmission of you. The spell’s range is determined using the distance from you to your device, and then from the target to its device. You must be able to see or otherwise determine the location of the target. This feature can be used to cast only spells that target specific creatures. Spells that affect an area are not subject to online casting.)
- Remaining source effects need verification.

### Level 14 · Chained Device

- Counters · expanded:2014:wizard:2014:subclass:wizard:technomancy-ua:resource:chained-device; 1 uses at probe level; long reset verified
- Generic action model · Chained Device: spends 1 from expanded:2014:wizard:2014:subclass:wizard:technomancy-ua:resource:chained-device (By 14th level, you have learned to imprint vestiges of your consciousness on electronic devices with significant computing power. When you cast a concentration spell, you can use a device whose computing power is equal to or greater than a tablet computer to maintain concentration of the spell on your behalf. The device must be held or worn by you to maintain this effect. If the device is destroyed, taken from you, dropped, or turned off, the concentration ends. Once you use this feature, you can’t use it again until you finish a long rest.)
- Remaining source effects need verification.

## Wizard — Theurgy (UA)

Entry level 2 · [Unearthed Arcana 33 - Wizard Revisited](https://dnd5e.wikidot.com/wizard:theurgy-ua)

### Level 2 · Divine Inspiration

- Choice controls · Divine Inspiration (advancement)
- Generic action model · Divine Inspiration: source rules or unverified dedicated path (When you choose this tradition at 2nd level, choose a cleric domain from your chosen deity’s list of eligible domains. The Knowledge and Light domains are especially appropriate choices for a theurgist.)
- Remaining source effects need verification.

### Level 2 · Arcane Initiate

- Generic action model · Arcane Initiate: source rules or unverified dedicated path (Beginning when you select this tradition at 2nd level, whenever you gain a wizard level, you can replace one of the wizard spells you add to your spellbook with a cleric domain spell for your chosen domain. The spell must be of a level for which you have spell slots. If you add all of your domain spells to your spellbook, you can subsequently add any spell from the cleric spell list instead. The spell must still be of a level for which you have spell slots.)
- Remaining source effects need verification.

### Level 2 · Channel Arcana

- Counters · expanded:2014:wizard:2014:subclass:wizard:theurgy-ua:resource:channel-arcana; 1 uses at probe level; short reset verified
- Generic action model · Channel Arcana: spends 1 from expanded:2014:wizard:2014:subclass:wizard:theurgy-ua:resource:channel-arcana (When you use your Channel Arcana, you choose which effect to create. You must then finish a short or long rest to use your Channel Arcana again. Some Channel Arcana effects require saving throws. When you use such an effect, the save DC equals your wizard spell save DC. Beginning at 6th level, you can use your Channel Arcana twice between rests, and beginning at 18th level, you can use it three times between rests. When you finish a short or long rest, you regain your expended uses. If you gain additional Channel Divinity options from your domain, you can employ them by using your Channel Arcana feature.)
- Remaining source effects need verification.

### Level 2 · Channel Arcana: Divine Arcana

- Generic action model · Channel Arcana: Divine Arcana: source rules or unverified dedicated path (As a bonus action, you speak a prayer to control the flow of magic around you. The next spell you cast gains a +2 bonus to any attack roll you make for it or to its saving throw DC, as appropriate.)
- Remaining source effects need verification.

### Level 6 · Arcane Acolyte

- Remaining source effects need verification.

### Level 10 · Arcane Priest

- Remaining source effects need verification.

### Level 14 · Arcane High Priest

- Remaining source effects need verification.

## Fighter — Arcane Archer

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/fighter:arcane-archer)

### Level 3 · Arcane Archer Lore

- Choice controls · Arcane Archer Lore
- Training grants · {'featureId': '2014:subclass:fighter:arcane-archer:arcane-archer-lore', 'proficiencies': [{'kind': 'skills', 'name': 'Arcana', 'index': 'arcana'}]}
- Spell grants · Prestidigitation
- Remaining source effects need verification.

### Level 3 · Arcane Shot

- Choice controls · Arcane Shot
- Counters · Arcane Shot; 2 uses at probe level; short reset
- Generic action model · Arcane Shot: spends 1 from expanded:2014:fighter:2014:subclass:fighter:arcane-archer:resource:arcane-shot (At 3rd level, you learn to unleash special magical effects with some of your shots. When you gain this feature, you learn two Arcane Shot options of your choice (see "Arcane Shot Options" below). Once per turn when you fire an arrow from a shortbow or longbow as part of the Attack action, you can apply one of your Arcane Shot options to that arrow. You decide to use the option when the arrow hits, unless the option doesn’t involve an attack roll. You have two uses of this ability, and you regain all expended uses of it when you finish a short or long rest. You gain an additional Arcane Shot option of your choice when you reach certain levels in this class: 7th, 10th, 15th, and 18th level. Each option also improves when you become an 18th-level fighter.)
- Remaining source effects need verification.

### Level 7 · Magic Arrow

- Remaining source effects need verification.

### Level 7 · Curving Shot

- Remaining source effects need verification.

### Level 15 · Ever-Ready Shot

- Remaining source effects need verification.

### Level 3 · Arcane Shot Options

- Remaining source effects need verification.

## Fighter — Banneret

Entry level 3 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/fighter:banneret)

### Level 3 · Rallying Cry

- Numeric effects awaiting verification · ally-healing (Use Second Wind; up to3 allies within60ft that can see/hear)
- Remaining source effects need verification.

### Level 7 · Royal Envoy

- Training grants · {'featureId': '2014:subclass:fighter:banneret:royal-envoy', 'proficiencies': [{'kind': 'skills', 'name': 'Persuasion', 'index': 'persuasion'}]}
- Recognized numeric routes · expertise
- Remaining source effects need verification.

### Level 10 · Inspiring Surge

- Remaining source effects need verification.

### Level 15 · Bulwark

- Remaining source effects need verification.

## Fighter — Battle Master

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/fighter:battle-master)

### Level 3 · Combat Superiority

Sourced maneuver choices, Strength/Dexterity DC and short-rest dice, critical roll and Parry arithmetic are available in the Battle Master tool.

- Table fact · Confirm maneuver timing, target, range, hit and critical. Resolve saves, movement and external conditions.
- Open sheet gap · Precision roll does not alter an existing attack result; Evasive Footwork, Rally and Parry effects are not auto-applied to own state.
- Verification · fighter-subclasses; browser-battle-master-priority

### Level 3 · Student of War

- Remaining source effects need verification.

### Level 7 · Know Your Enemy

- Remaining source effects need verification.

### Level 10 · Improved Combat Superiority

- Remaining source effects need verification.

### Level 15 · Relentless

Initiative callback restores one die at zero in an eligible encounter.

- Verification · browser-battle-master-priority

## Fighter — Cavalier

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/fighter:cavalier)

### Level 3 · Bonus Proficiency

- Remaining source effects need verification.

### Level 3 · Born to the Saddle

- Remaining source effects need verification.

### Level 3 · Unwavering Mark

- Remaining source effects need verification.

### Level 7 · Warding Maneuver

- Remaining source effects need verification.

### Level 10 · Hold the Line

- Remaining source effects need verification.

### Level 15 · Ferocious Charger

- Remaining source effects need verification.

### Level 18 · Vigilant Defender

- Remaining source effects need verification.

## Fighter — Champion

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/fighter:champion)

### Level 3 · Improved Critical

- Recognized numeric routes · critical-range (Weapon attack)
- Remaining source effects need verification.

### Level 7 · Remarkable Athlete

- Recognized numeric routes · physical-ability-check-bonus (STR/DEX/CON check that does not already use PB)
- Numeric effects awaiting verification · running-long-jump-bonus (Distance in feet)
- Remaining source effects need verification.

### Level 10 · Additional Fighting Style

- Remaining source effects need verification.

### Level 15 · Superior Critical

- Recognized numeric routes · critical-range (Weapon attack; supersedes19)
- Remaining source effects need verification.

### Level 18 · Survivor

- Dedicated plans · survivor via survivor
- Numeric effects awaiting verification · regeneration (Start turn; hp below half maximum and hp>0)
- Remaining source effects need verification.

## Fighter — Echo Knight

Entry level 3 · [Explorer's Guide to Wildemount](https://dnd5e.wikidot.com/fighter:echo-knight)

### Level 3 · Manifest Echo

- Numeric effects awaiting verification · echo-ac (Echo active; echo has1hp, all-condition immunity; use bearer save modifiers)
- Remaining source effects need verification.

### Level 3 · Unleash Incarnation

- Counters · Unleash Incarnation; 3 uses at probe level; long reset
- Generic action model · Unleash Incarnation: spends 1 from expanded:2014:fighter:2014:subclass:fighter:echo-knight:resource:unleash-incarnation (At 3rd level, you can heighten your echo's fury. Whenever you take the Attack action, you can make one additional melee attack from the echo's position. You can use this feature a number of times equal to your Constitution modifier (a minimum of once). You regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 7 · Echo Avatar

- Remaining source effects need verification.

### Level 10 · Shadow Martyr

- Counters · Shadow Martyr; 1 uses at probe level; short reset
- Generic action model · Shadow Martyr: spends 1 from expanded:2014:fighter:2014:subclass:fighter:echo-knight:resource:shadow-martyr (Starting at 10th level, you can make your echo throw itself in front of an attack directed at another creature that you can see. Before the attack roll is made, you can use your reaction to teleport the echo to an unoccupied space within 5 feet of the targeted creature. The attack roll that triggered the reaction is instead made against your echo.)
- Remaining source effects need verification.

### Level 15 · Reclaim Potential

- Counters · Reclaim Potential; 3 uses at probe level; long reset
- Generic action model · Reclaim Potential: spends 1 from expanded:2014:fighter:2014:subclass:fighter:echo-knight:resource:reclaim-potential (By 15th level, you've learned to absorb the fleeting magic of your echo. When an echo of yours is destroyed by taking damage, you can gain a number of temporary hit points equal to 2d6 + your Constitution modifier, provided you don't already have temporary hit points. You can use this feature a number of times equal to your Constitution modifier (a minimum of once). You regain all expended uses when you finish a long rest.)
- Numeric effects awaiting verification · temporary-hp (Echo destroyed by damage while you lack temporary hp)
- Remaining source effects need verification.

### Level 18 · Legion of One

- Remaining source effects need verification.

## Fighter — Eldritch Knight

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/fighter:eldritch-knight)

### Level 3 · Spellcasting

- Remaining source effects need verification.

### Level 3 · Weapon Bond

- Remaining source effects need verification.

### Level 7 · War Magic

- Remaining source effects need verification.

### Level 10 · Eldritch Strike

- Remaining source effects need verification.

### Level 15 · Arcane Charge

- Remaining source effects need verification.

### Level 18 · Improved War Magic

- Remaining source effects need verification.

## Fighter — Psi Warrior

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/fighter:psi-warrior)

### Level 3 · Psionic Power

- Counters · Psionic Power; 12 uses at probe level; long reset · Psionic Power; 1 uses at probe level; short reset
- Generic action model · Protective Field: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:psionic-energy (You or visible creature within30ft takes damage.) · Psionic Strike: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:psionic-energy (Once own turn; weapon damage to target within30ft.) · Telekinetic Movement: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:telekinetic-movement (Visible loose object Large or smaller OR willing other creature within30ft; move up to30ft to visible unoccupied space. Free use OR1PsionicEnergy die.)
- Dedicated plans · protective-field via protective-field (You or visible creature within30ft takes damage.) · psionic-strike via psionic-strike (Once own turn; weapon damage to target within30ft.) · telekinetic-movement via telekinetic-movement (Visible loose object Large or smaller OR willing other creature within30ft; move up to30ft to visible unoccupied space. Free use OR1PsionicEnergy die.)
- Remaining source effects need verification.

### Level 7 · Telekinetic Adept

- Counters · Telekinetic Adept; 1 uses at probe level; short reset
- Generic action model · Telekinetic Adept: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:psi-powered-leap (_Psi-Powered Leap._ As a bonus action, you can propel your body with your mind. You gain a flying speed equal to twice your walking speed until the end of the current turn. Once you take this bonus action, you can't do so again until you finish a short or long rest, unless you expend a Psionic Energy die to take it again. _Telekinetic Thrust._ When you deal damage to a target with your Psionic Strike, you can force the target to make a Strength saving throw against a DC equal to 8 + your proficiency bonus + your Intelligence modifier. If the save fails, you can knock the target prone or move it up to 10 feet in any direction horizontally.)
- Remaining source effects need verification.

### Level 10 · Guarded Mind

- Generic action model · End Charmed and Frightened: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:psionic-energy (Start own turn charmed/frightened; end every such effect on self.)
- Dedicated plans · guarded-mind via guarded-mind (Start own turn charmed/frightened; end every such effect on self.)
- Recognized numeric routes · resistance
- Remaining source effects need verification.

### Level 15 · Bulwark of Force

- Counters · Bulwark of Force; 1 uses at probe level; long reset
- Generic action model · Bulwark of Force: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:bulwark-of-force (At 15th level, you can shield yourself and others with telekinetic force. As a bonus action, you can choose creatures, which can include you, that you can see within 30 feet of you, up to a number of creatures equal to your Intelligence modifier (minimum of one creature). Each of the chosen creatures is protected by half cover for 1 minute or until you're incapacitated.)
- Remaining source effects need verification.

### Level 18 · Telekinetic Master

- Counters · Telekinetic Master; 1 uses at probe level; long reset
- Generic action model · Telekinetic Master: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-warrior:resource:telekinetic-master (By 18th level, your ability to move creatures and objects with your mind is matched by few. You can cast the Telekinesis spell, requiring no components, and your spellcasting ability for the spell is Intelligence. On each of your turns while you concentrate on the spell, including the turn when you cast it, you can make one attack with a weapon as a bonus action.)
- Remaining source effects need verification.

## Fighter — Rune Knight

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/fighter:rune-knight)

### Level 3 · Bonus Proficiencies

- Training grants · {'featureId': '2014:subclass:fighter:rune-knight:bonus-proficiencies', 'proficiencies': [{'kind': 'tools', 'name': "smith's tools", 'index': 'smithstools'}]} · Giant
- Remaining source effects need verification.

### Level 3 · Rune Carver

- Choice controls · Rune Carver
- Counters · Cloud Rune; 2 uses at probe level; short reset · Fire Rune; 2 uses at probe level; short reset · Frost Rune; 2 uses at probe level; short reset · Stone Rune; 2 uses at probe level; short reset · Hill Rune; 2 uses at probe level; short reset
- Generic action model · Invoke Cloud Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:rune-cloud (Must know rune and wear/carry its inscribed object. You or visible creature within30ft hit by attack roll; redirect same roll to different creature within30ft other than attacker.) · Invoke Fire Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:rune-fire; separate roll 2d6 (Must know rune and wear/carry its inscribed object. Hit creature with weapon attack; STR save vs runeDC or restrained1minute, repeat save endturn. Source iteration governs initial damage and ongoing damage.) · Invoke Frost Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:rune-frost (Must know rune and wear/carry its inscribed object. Lasts10minutes. Published:+2STR/CON checks+saves; UA:+2Strength score, can exceed20 up to30.) · Invoke Stone Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:rune-stone (Must know rune and wear/carry its inscribed object. Visible creature ends turn within30ft; WIS save vs runeDC or charmed1minute, incapacitated speed0; source damage/shake ends effect.) · Invoke Hill Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:rune-hill (Must know rune and wear/carry its inscribed object. Hill/Storm require fighter7. Resistance bludgeoning/piercing/slashing1minute.)
- Dedicated plans · invoke-cloud via invoke-cloud (Known Cloud rune; inscribed object worn/carried. Reaction to an attack hit within 30 ft; choose another target within 30 ft other than attacker; same roll.) · invoke-fire via invoke-fire (Known Fire rune; inscribed object worn/carried. Initial and ongoing fire damage; Strength save DC 17 to avoid restraints; repeats save at end of target turns.) · invoke-frost via invoke-frost (Known Frost rune; inscribed object worn/carried. +2 Strength/Constitution checks and saves for10minutes.) · invoke-stone via invoke-stone (Known Stone rune; inscribed object worn/carried. Reaction when a visible creature ends its turn within 30 ft; Wisdom save DC 17 or charm/incapacitation; repeats at end of target turns.) · invoke-hill via invoke-hill (Known Hill rune; inscribed object worn/carried. Resistance to bludgeoning/piercing/slashing for 1 minute.) · invoke-storm via invoke-storm (Known Storm rune; inscribed object worn/carried. For 1 minute, use reactions to impose advantage/disadvantage on a visible creature’s roll within 60 ft.)
- Remaining source effects need verification.

### Level 3 · Giant's Might

- Counters · Giant's Might; 6 uses at probe level; long reset
- Generic action model · Giant's Might: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:giants-might (At 3rd level, you have learned how to imbue yourself with the might of giants. As a bonus action, you magically gain the following benefits, which last for 1 minute: - If you are smaller than Large, you become Large, along with anything you are wearing. If you lack the room to become Large, your size doesn't change. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses of it when you finish a long rest.)
- Dedicated plans · giant-damage via giant-damage (Active Giant Might; after an eligible hit. Published: weapon or unarmed hit, once on your turn. UA: each weapon attack hit.) · giants-might via giants-might
- Numeric effects awaiting verification · extra-damage (Giant’s Might active; one weapon/unarmed hit on own turn)
- Remaining source effects need verification.

### Level 7 · Runic Shield

- Counters · Runic Shield; 6 uses at probe level; long reset
- Generic action model · Runic Shield: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight:resource:runic-shield (At 7th level, you learn to invoke your rune magic to protect your allies. When another creature you can see within 60 feet of you is hit by an attack roll, you can use your reaction to force the attacker to reroll the d20 and use the new roll. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 10 · Great Stature

- Numeric effects awaiting verification · giants-might-damage (Giant’s Might active; one weapon/unarmed hit on own turn)
- Remaining source effects need verification.

### Level 15 · Master of Runes

- Remaining source effects need verification.

### Level 18 · Runic Juggernaut

- Remaining source effects need verification.

## Fighter — Samurai

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/fighter:samurai)

### Level 3 · Bonus Proficiency

- Choice controls · Bonus Proficiency
- Training grants · {'featureId': '2014:subclass:fighter:samurai:bonus-proficiency', 'proficiencies': [{'kind': 'skills', 'name': 'History', 'index': 'history'}]}
- Remaining source effects need verification.

### Level 3 · Fighting Spirit

- Counters · Fighting Spirit; 3 uses at probe level; long reset
- Generic action model · Fighting Spirit: spends 1 from expanded:2014:fighter:2014:subclass:fighter:samurai:resource:fighting-spirit (Starting at 3rd level, your intensity in battle can shield you and help you strike true. As a bonus action on your turn, you can give yourself advantage on all weapon attack rolls until the end of the current turn. When you do so, you also gain 5 temporary hit points. The number of hit points increases when you reach certain levels in this class, increasing to 10 at 10th level and 15 at 15th level. You can use this feature three times. You regain all expended uses of it when you finish a long rest.)
- Dedicated plans · fighting-spirit via fighting-spirit
- Numeric effects awaiting verification · temporary-hp (Activate Fighting Spirit; advantage weapon attacks until current turn end)
- Remaining source effects need verification.

### Level 7 · Elegant Courtier

- Training grants · {'featureId': '2014:subclass:fighter:samurai:elegant-courtier', 'proficiencies': [{'kind': 'saves', 'name': 'wis', 'index': 'wis'}]}
- Recognized numeric routes · persuasion-check-bonus
- Remaining source effects need verification.

### Level 10 · Tireless Spirit

- Remaining source effects need verification.

### Level 15 · Rapid Strike

- Remaining source effects need verification.

### Level 18 · Strength Before Death

- Counters · Strength Before Death; 1 uses at probe level; long reset
- Generic action model · Strength Before Death: spends 1 from expanded:2014:fighter:2014:subclass:fighter:samurai:resource:strength-before-death (Starting at 18th level, your fighting spirit can delay the grasp of death. If you take damage that reduces you to 0 hit points, you can use your reaction to delay falling unconscious, and you can immediately take an extra turn. While you have 0 hit points during that extra turn, taking damage causes death saving throw failures as normal, and three death saving throw failures can still kill you. When the extra turn ends, you fall unconscious if you still have 0 hit points.)
- Remaining source effects need verification.

## Fighter — Arcane Archer (2016) (UA)

Entry level 3 · [Unearthed Arcana 23 - Fighter](https://dnd5e.wikidot.com/fighter:arcane-archer-ua)

### Level 3 · Arcane Arrow

- Remaining source effects need verification.

### Level 3 · Arcane Shot

- Choice controls · Arcane Shot
- Counters · Arcane Shot; 2 uses at probe level; short reset
- Generic action model · Arcane Shot: spends 1 from expanded:2014:fighter:2014:subclass:fighter:arcane-archer-ua:resource:arcane-shot (At 3rd level, you learn to unleash special magical effects with some of your shots. When you gain this feature, you learn two Arcane Shot options of your choice (see "Arcane Shot Options" below). - Create Magic Arrow.As a bonus action on your turn, you can create one magic arrow in your hand. The arrow lasts until the end of the turn or until it hits or misses a target. You can fire the arrow from a shortbow or longbow. The arrow is a magic weapon that deals an additional 2d6 force damage on a hit. - You have two uses of this feature, and you regain all expended uses of it when you finish a short or long rest. - Arcane Shot.When you gain this feature, you learn two Arcane Shot options of your choice (see the Arcane Shots section below). Whenever you create a magic arrow with this feature, you can apply the benefits of one of your Arcane Shot options to that arrow.)
- Remaining source effects need verification.

### Level 3 · Archer's Lore

- Choice controls · Archer's Lore
- Training grants · {'featureId': '2014:subclass:fighter:arcane-archer-ua:archers-lore', 'proficiencies': [{'kind': 'skills', 'name': 'Arcana', 'index': 'arcana'}]} · {'featureId': '2014:subclass:fighter:arcane-archer-ua:archers-lore', 'proficiencies': [{'kind': 'skills', 'name': 'Athletics', 'index': 'athletics'}]}
- Remaining source effects need verification.

### Level 7 · Conjure Arrows

- Remaining source effects need verification.

### Level 15 · Ever-Ready Arrow

- Remaining source effects need verification.

### Level 18 · Deadly Arrow

- Remaining source effects need verification.

### Level 3 · Arcane Shots

- Remaining source effects need verification.

## Fighter — Arcane Archer (2017) (UA)

Entry level 3 · [Unearthed Arcana 39 - Revised Subclasses](https://dnd5e.wikidot.com/fighter:arcane-archer-revised-ua)

### Level 3 · Magic Arrow

- Remaining source effects need verification.

### Level 3 · Arcane Shot

- Choice controls · Arcane Shot
- Counters · Arcane Shot; 2 uses at probe level; short reset
- Generic action model · Arcane Shot: spends 1 from expanded:2014:fighter:2014:subclass:fighter:arcane-archer-revised-ua:resource:arcane-shot (At 3rd level, you learn to unleash special magical effects with some of your shots. When you gain this feature, you learn two Arcane Shot options of your choice (see the "Arcane Shot Options" section below). Once per turn when you fire a magic arrow from a shortbow or longbow as part of the Attack action, you can apply one of your Arcane Shot options to that arrow. You decide to use the option when the arrow hits, unless the option doesn't involve an attack roll. You have two uses of this ability, and you regain all expended uses of it when you finish a short or long rest. You gain an additional Arcane Shot option of your choice when you reach certain levels in this class: 7th, 10th, 15th, and 18th level. Each option also improves when you become an 18th-level fighter.)
- Remaining source effects need verification.

### Level 3 · Arcane Archer's Lore

- Choice controls · Arcane Archer's Lore
- Training grants · {'featureId': '2014:subclass:fighter:arcane-archer-revised-ua:arcane-archers-lore', 'proficiencies': [{'kind': 'skills', 'name': 'Arcana', 'index': 'arcana'}]}
- Remaining source effects need verification.

### Level 7 · Curving Shot

- Remaining source effects need verification.

### Level 15 · Ever-Ready Shot

- Remaining source effects need verification.

### Level 3 · Arcane Shot Options

- Remaining source effects need verification.

## Fighter — Brute (UA)

Entry level 3 · [Unearthed Arcana 46 - Three Subclasses](https://dnd5e.wikidot.com/fighter:brute-ua)

### Level 3 · Brute Force

- Numeric effects awaiting verification · weapon-extra-damage (Hit with proficient weapon)
- Remaining source effects need verification.

### Level 7 · Brutish Durability

- Numeric effects awaiting verification · save-bonus (Includes death saves; total>=20 on death save treated as natural20)
- Remaining source effects need verification.

### Level 10 · Additional Fighting Style

- Remaining source effects need verification.

### Level 15 · Devastating Critical

- Numeric effects awaiting verification · critical-extra-damage (Weapon critical hit)
- Remaining source effects need verification.

### Level 18 · Survivor

- Numeric effects awaiting verification · regeneration (Start turn; hp below half maximum and hp>0)
- Remaining source effects need verification.

## Fighter — Cavalier (UA)

Entry level 3 · [Unearthed Arcana 40 - Revised Class Options](https://dnd5e.wikidot.com/fighter:cavalier-ua)

### Level 3 · Bonus Proficiency

- Choice controls · Bonus Proficiency
- Training grants · {'featureId': '2014:subclass:fighter:cavalier-ua:bonus-proficiency', 'proficiencies': [{'kind': 'skills', 'name': 'Animal Handling', 'index': 'animalhandling'}]}
- Remaining source effects need verification.

### Level 3 · Born to the Saddle

- Remaining source effects need verification.

### Level 3 · Unwavering Mark

- Remaining source effects need verification.

### Level 7 · Ferocious Charger

- Remaining source effects need verification.

### Level 10 · Improved Combat Superiority

- Remaining source effects need verification.

### Level 15 · Relentless

- Remaining source effects need verification.

## Fighter — Knight (UA)

Entry level 3 · [Unearthed Arcana 23 - Fighter](https://dnd5e.wikidot.com/fighter:knight-ua)

### Level 3 · Born to the Saddle

- Remaining source effects need verification.

### Level 3 · Implacable Mark

- Counters · Implacable Mark; 3 uses at probe level; short reset
- Generic action model · Implacable Mark: spends 1 from expanded:2014:fighter:2014:subclass:fighter:knight-ua:resource:implacable-mark (At 3rd level, you excel at foiling attacks and protecting your allies by menacing your foes. When you hit a creature with a melee weapon attack, the target is marked by you until the end of your next turn. A creature ignores this effect if the creature can’t be frightened. If a target marked by you is within 5 feet of you on its turn and it moves at least 1 foot or makes an attack that suffers disadvantage from this feature, you can make one melee weapon attack against it using your reaction. This attack roll has advantage, and if it hits, the attack’s weapon deals extra damage to the target equal to your fighter level. You can make this special attack even if you have already expended your reaction this round, but not if you have already used your reaction this turn. You can make this attack three times, and you regain all expended uses of it when you finish a short or long rest.)
- Remaining source effects need verification.

### Level 7 · Noble Cavalry

- Choice controls · Noble Cavalry
- Remaining source effects need verification.

### Level 10 · Hold the Line

- Remaining source effects need verification.

### Level 15 · Rapid Strike

- Remaining source effects need verification.

### Level 18 · Defender's Blade

- Remaining source effects need verification.

## Fighter — Monster Hunter (UA)

Entry level 3 · [Unearthed Arcana 13 - Gothic Heroes](https://dnd5e.wikidot.com/fighter:monster-hunter-ua)

### Level 3 · Bonus Proficiencies

- Choice controls · Bonus Proficiencies
- Training grants · {'featureId': '2014:subclass:fighter:monster-hunter-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'Arcana', 'index': 'arcana'}]} · {'featureId': '2014:subclass:fighter:monster-hunter-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'History', 'index': 'history'}]}
- Remaining source effects need verification.

### Level 3 · Combat Superiority

- Remaining source effects need verification.

### Level 3 · Hunter's Mysticism

- Choice controls · Hunter's Mysticism
- Training grants · Abyssal
- Counters · Hunter's Mysticism; 1 uses at probe level; long reset
- Generic action model · Hunter's Mysticism: spends 1 from expanded:2014:fighter:2014:subclass:fighter:monster-hunter-ua:resource:hunter-s-mysticism (At 3rd level, your study of the supernatural gives you a limited ability to use magic. You can cast Detect Magic as a ritual. You can cast Protection from Evil and Good, but you cannot cast it again with this feature until you finish a long rest. Wisdom is your spellcasting ability for these spells.)
- Remaining source effects need verification.

### Level 7 · Monster Slayer

- Remaining source effects need verification.

### Level 10 · Improved Combat Superiority

- Remaining source effects need verification.

### Level 15 · Relentless

- Remaining source effects need verification.

## Fighter — Psi Knight (UA)

Entry level 3 · [Unearthed Arcana 71 - Psionic Options Revisited](https://dnd5e.wikidot.com/fighter:psi-knight-ua)

### Level 3 · Psionic Talent

- Counters · Psionic Talent; 1 uses at probe level; long reset
- Remaining source effects need verification.

### Level 3 · Psi Replenishment

- Counters · Psi Replenishment; 1 uses at probe level; long reset
- Generic action model · Psi Replenishment: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-knight-ua:resource:psi-replenishment
- Remaining source effects need verification.

### Level 7 · Telekinetic Adept

- Remaining source effects need verification.

### Level 10 · Psi-Enhanced Metabolism

- Recognized numeric routes · resistance
- Numeric effects awaiting verification · condition-immunity
- Remaining source effects need verification.

### Level 15 · Bulwark of Force

- Counters · Bulwark of Force; 1 uses at probe level; long reset
- Generic action model · Bulwark of Force: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psi-knight-ua:resource:bulwark-of-force (At 15th level, you can shield yourself and others with telekinetic force. As a bonus action, you can choose creatures, which can include you, that you can see within 30 feet of you, up to a number of creatures equal to your Intelligence modifier (minimum of one creature). Each of the chosen creatures is protected by half cover for 1 minute or until you’re incapacitated.)
- Remaining source effects need verification.

### Level 18 · Telekinetic Master

- Remaining source effects need verification.

## Fighter — Psychic Warrior (UA)

Entry level 3 · [Unearthed Arcana 66 - Fighter, Rogue, Wizard](https://dnd5e.wikidot.com/fighter:psychic-warrior-ua)

Source spell progression · level 3 known: Mage Hand

### Level 3 · Telekinetic Hand

- Spell grants · Mage Hand
- Remaining source effects need verification.

### Level 3 · Psionic Armament

- Remaining source effects need verification.

### Level 7 · Strength of Mind

- Counters · Strength of Mind; 3 uses at probe level; long reset
- Generic action model · Strength of Mind: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psychic-warrior-ua:resource:strength-of-mind (At 7th level, as a bonus action, you can telekinetically lash out at a creature you can see within 20 feet of you. The target must make a Strength saving throw against a DC equal to 8 + your proficiency modifier + your Intelligence modifier. On a failed save, the target takes force damage equal to 2d6 plus your Intelligence modifier and is telekinetically moved 15 feet directly toward or away from you (your choice). On a successful save, it takes half as much damage and isn't moved. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 10 · Telekinetic Bulwark

- Counters · Telekinetic Bulwark; 1 uses at probe level; long reset
- Generic action model · Telekinetic Bulwark: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psychic-warrior-ua:resource:telekinetic-bulwark (At 10th level, when you take the Attack action, you can forgo one of your attacks to project a bastion of psionic power in a 10-foot radius around yourself. It lasts for 1 minute or until you're incapacitated. For the duration, you and your allies in that area gain the benefits of half cover and have advantage on Strength saving throws.)
- Remaining source effects need verification.

### Level 15 · Agonizing Strikes

- Counters · Agonizing Strikes; 3 uses at probe level; long reset
- Generic action model · Agonizing Strikes: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psychic-warrior-ua:resource:agonizing-strikes (Starting at 15th level, your attacks can channel psychic agony. When you hit a creature with a weapon attack, you can also deal 2d10 psychic damage to that target and force it to make a Constitution saving throw against a DC equal to 8 + your proficiency bonus + your Intelligence modifier. Unless the save succeeds, the target falls prone, and it suffers disadvantage on ability checks until the end of your next turn. You can use this feature a number of times equal to your Intelligence modifier (minimum of once), and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 18 · Psychic Dreadnought

- Counters · Psychic Dreadnought; 1 uses at probe level; long reset
- Generic action model · Psychic Dreadnought: spends 1 from expanded:2014:fighter:2014:subclass:fighter:psychic-warrior-ua:resource:psychic-dreadnought (At 18th level, the power of your mind suffuses your entire being, making you a nigh-unstoppable force on the battlefield. Using your reaction when you take damage, you can give yourself the following benefits for 1 minute or until you're incapacitated. - If you're prone, you can stand up by spending 5 feet of movement.)
- Remaining source effects need verification.

## Fighter — Rune Knight (UA)

Entry level 3 · [Unearthed Arcana 64 - Fighter, Ranger, Rogue](https://dnd5e.wikidot.com/fighter:rune-knight-ua)

### Level 3 · Bonus Proficiencies

- Training grants · {'featureId': '2014:subclass:fighter:rune-knight-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'tools', 'name': "smith's tools", 'index': 'smithstools'}]} · Giant
- Remaining source effects need verification.

### Level 3 · Rune Magic

- Choice controls · Rune Magic
- Counters · Cloud Rune; 2 uses at probe level; short reset · Fire Rune; 2 uses at probe level; short reset · Frost Rune; 2 uses at probe level; short reset · Stone Rune; 2 uses at probe level; short reset · Hill Rune; 2 uses at probe level; short reset · Storm Rune; 2 uses at probe level; short reset
- Generic action model · Invoke Cloud Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-cloud (Must know rune and wear/carry its inscribed object. You or visible creature within30ft hit by attack roll; redirect same roll to different creature within30ft other than attacker.) · Invoke Fire Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-fire; separate roll 2d6 (Must know rune and wear/carry its inscribed object. Hit creature with weapon attack; STR save vs runeDC or restrained1minute, repeat save endturn. Source iteration governs initial damage and ongoing damage.) · Invoke Frost Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-frost (Must know rune and wear/carry its inscribed object. Lasts10minutes. Published:+2STR/CON checks+saves; UA:+2Strength score, can exceed20 up to30.) · Invoke Stone Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-stone (Must know rune and wear/carry its inscribed object. Visible creature ends turn within30ft; WIS save vs runeDC or charmed1minute, incapacitated speed0; source damage/shake ends effect.) · Invoke Hill Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-hill (Must know rune and wear/carry its inscribed object. Resistance bludgeoning/piercing/slashing1minute.) · Invoke Storm Rune: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:rune-storm (Must know rune and wear/carry its inscribed object. Enter prophetic state1minute; reaction to impose advantage/disadvantage on visible creature attack/check/save within60ft.)
- Dedicated plans · invoke-cloud via invoke-cloud (Known Cloud rune; inscribed object worn/carried. Reaction to an attack hit within 30 ft; choose another target within 30 ft other than attacker; same roll.) · invoke-fire via invoke-fire (Known Fire rune; inscribed object worn/carried. Ongoing fire damage; Strength save DC 17 to avoid restraints; repeats save at end of target turns.) · invoke-frost via invoke-frost (Known Frost rune; inscribed object worn/carried. Strength score increases2, maximum30, for10minutes.) · invoke-stone via invoke-stone (Known Stone rune; inscribed object worn/carried. Reaction when a visible creature ends its turn within 30 ft; Wisdom save DC 17 or charm/incapacitation; repeats at end of target turns.) · invoke-hill via invoke-hill (Known Hill rune; inscribed object worn/carried. Resistance to bludgeoning/piercing/slashing for 1 minute.) · invoke-storm via invoke-storm (Known Storm rune; inscribed object worn/carried. For 1 minute, use reactions to impose advantage/disadvantage on a visible creature’s roll within 60 ft.)
- Remaining source effects need verification.

### Level 3 · Giant Might

- Counters · Giant Might; 2 uses at probe level; long reset
- Generic action model · Giant Might: spends 1 from expanded:2014:fighter:2014:subclass:fighter:rune-knight-ua:resource:giants-might (At 3rd level, you can imbue yourself with the might of giants. As a bonus action, you magically gain the following benefits, which last for 1 minute: - If you are smaller than Large, you become Large, along with anything you are wearing. If you lack the room to become Large, your size doesn’t change. You can use this feature twice, and you regain all expended uses of it when you finish a long rest.)
- Dedicated plans · giant-damage via giant-damage (Active Giant Might; after an eligible hit. Published: weapon or unarmed hit, once on your turn. UA: each weapon attack hit.) · giants-might via giants-might
- Numeric effects awaiting verification · weapon-extra-damage (Giant Might active; every weapon attack, not once/turn)
- Remaining source effects need verification.

### Level 7 · Defensive Runes

- Remaining source effects need verification.

### Level 10 · Great Stature

- Numeric effects awaiting verification · giant-might-damage (Giant Might active)
- Remaining source effects need verification.

### Level 15 · Rune Magic Mastery

- Remaining source effects need verification.

### Level 18 · Blessing of the All Father

- Remaining source effects need verification.

## Fighter — Samurai (UA)

Entry level 3 · [Unearthed Arcana 23 - Fighter](https://dnd5e.wikidot.com/fighter:samurai-ua)

### Level 3 · Bonus Proficiency

- Choice controls · Bonus Proficiency
- Training grants · {'featureId': '2014:subclass:fighter:samurai-ua:bonus-proficiency', 'proficiencies': [{'kind': 'skills', 'name': 'History', 'index': 'history'}]}
- Remaining source effects need verification.

### Level 3 · Fighting Spirit

- Counters · Fighting Spirit; 3 uses at probe level; short reset
- Generic action model · Fighting Spirit: spends 1 from expanded:2014:fighter:2014:subclass:fighter:samurai-ua:resource:fighting-spirit (Starting at 3rd level, the might of your willpower can shield you and help you strike true. As a bonus action on your turn, you can give yourself two benefits: advantage on all attack rolls and resistance to bludgeoning, piercing, and slashing damage. These benefits last until the end of your next turn. You can use this feature three times. You regain all expended uses of it when you finish a short or long rest.)
- Numeric effects awaiting verification · resistance (Fighting Spirit active until NEXT turn end; advantage all attack rolls)
- Remaining source effects need verification.

### Level 7 · Elegant Courtier

- Choice controls · Elegant Courtier
- Training grants · {'featureId': '2014:subclass:fighter:samurai-ua:elegant-courtier', 'proficiencies': [{'kind': 'skills', 'name': 'History', 'index': 'history'}]}
- Remaining source effects need verification.

### Level 10 · Tireless Spirit

- Training grants · {'featureId': '2014:subclass:fighter:samurai-ua:tireless-spirit', 'proficiencies': [{'kind': 'saves', 'name': 'wis', 'index': 'wis'}]}
- Remaining source effects need verification.

### Level 15 · Rapid Strike

- Remaining source effects need verification.

### Level 18 · Strength Before Death

- Counters · Strength Before Death; 1 uses at probe level; long reset
- Remaining source effects need verification.

## Fighter — Scout (UA)

Entry level 3 · [Unearthed Arcana 12 - Kits of Old](https://dnd5e.wikidot.com/fighter:scout-ua)

### Level 3 · Bonus Proficiencies

- Choice controls · Bonus Proficiencies
- Training grants · {'featureId': '2014:subclass:fighter:scout-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'Acrobatics', 'index': 'acrobatics'}]} · {'featureId': '2014:subclass:fighter:scout-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'Athletics', 'index': 'athletics'}]} · {'featureId': '2014:subclass:fighter:scout-ua:bonus-proficiencies', 'proficiencies': [{'kind': 'skills', 'name': 'Investigation', 'index': 'investigation'}]}
- Remaining source effects need verification.

### Level 3 · Combat Superiority

- Remaining source effects need verification.

### Level 3 · Natural Explorer

- Choice controls · Natural Explorer
- Remaining source effects need verification.

### Level 10 · Improved Combat Superiority

- Remaining source effects need verification.

### Level 15 · Relentless

- Remaining source effects need verification.

## Fighter — Sharpshooter (UA)

Entry level 3 · [Unearthed Arcana 23 - Fighter](https://dnd5e.wikidot.com/fighter:sharpshooter-ua)

### Level 3 · Steady Aim

- Counters · Steady Aim; 3 uses at probe level; short reset
- Generic action model · Steady Aim: spends 1 from expanded:2014:fighter:2014:subclass:fighter:sharpshooter-ua:resource:steady-aim (Beginning when you choose this archetype at 3rd level, your aim becomes deadly. As a bonus action on your turn, you can take careful aim at a creature you can see that is within range of a ranged weapon you’re wielding. Until the end of this turn, your ranged attacks with that weapon gain two benefits against the target: You can use this feature three times. You regain all expended uses of it when you finish a short or long rest.)
- Numeric effects awaiting verification · ranged-weapon-damage-bonus (Steady Aim target current turn; ignore half/three-quarters cover)
- Remaining source effects need verification.

### Level 7 · Careful Eyes

- Choice controls · Careful Eyes
- Training grants · {'featureId': '2014:subclass:fighter:sharpshooter-ua:careful-eyes', 'proficiencies': [{'kind': 'skills', 'name': 'Perception', 'index': 'perception'}]}
- Remaining source effects need verification.

### Level 10 · Close-Quarters Shooting

- Numeric effects awaiting verification · ignore-close-range-disadvantage (Ranged attack with hostile creature within5ft)
- Remaining source effects need verification.

### Level 15 · Rapid Strike

- Remaining source effects need verification.

### Level 18 · Snap Shot

- Remaining source effects need verification.

## Barbarian — Ancestral Guardian

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/barbarian:ancestral-guardian)

### Level 3 · Ancestral Protectors

- Remaining source effects need verification.

### Level 6 · Spirit Shield

- Dedicated plans · spirit-shield via spirit-shield (Raging; another visible creature within30ft takes damage. At14 attacker takes force damage equal amount prevented from its attack.)
- Remaining source effects need verification.

### Level 10 · Consult the Spirits

- Counters · Consult the Spirits; 1 uses at probe level; short reset
- Generic action model · Consult the Spirits: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:ancestral-guardian:resource:consult-the-spirits (At 10th level, you gain the ability to consult with your ancestral spirits. When you do so, you cast the Augury or Clairvoyance spell, without using a spell slot or material components. Rather than creating a spherical sensor, this use of clairvoyance invisibly summons one of your ancestral spirits to the chosen location. Wisdom is your spellcasting ability for these spells.)
- Remaining source effects need verification.

### Level 14 · Vengeful Ancestors

- Remaining source effects need verification.

## Barbarian — Battlerager

Entry level 3 · [Sword Coast Adventurer's Guide](https://dnd5e.wikidot.com/barbarian:battlerager)

### Level 3 · Restriction: Dwarves Only

- Remaining source effects need verification.

### Level 3 · Battlerager Armor

- Generic action model · Armor Spikes Attack: separate roll 1d20+9, 1d4+3 (Raging and wearing spiked armor; target within5ft.)
- Dedicated plans · armor-spikes via armor-spikes (Raging and wearing spiked armor; target within5ft.)
- Numeric effects awaiting verification · grapple-damage (Successful grapple check with Attack action; piercing)
- Remaining source effects need verification.

### Level 6 · Reckless Abandon

- Numeric effects awaiting verification · temporary-hp (Use Reckless Attack while raging; vanish at rage end)
- Remaining source effects need verification.

### Level 10 · Battlerager Charge

- Remaining source effects need verification.

### Level 14 · Spiked Retribution

- Numeric effects awaiting verification · retaliatory-piercing-damage (Within5ft creature hits you in melee; raging, spiked armor, not incapacitated)
- Remaining source effects need verification.

## Barbarian — Beast

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/barbarian:beast)

### Level 3 · Form of the Beast

- Generic action model · Tail Defense: separate roll 1d8 (Raging with Tail form; visible creature within10ft hits you with attack roll.)
- Dedicated plans · beast-tail-defense via beast-tail-defense (Raging with Tail form; visible creature within10ft hits you with attack roll.) · beast-bite-heal via beast-bite-heal (After damaging a creature with your active Bite on your turn; once per turn. Published: below half maximum HP when you hit.)
- Numeric effects awaiting verification · bite-healing (Once own turn on bite damage; hp below half maximum)
- Remaining source effects need verification.

### Level 6 · Bestial Soul

- Remaining source effects need verification.

### Level 10 · Infectious Fury

- Counters · Infectious Fury; 6 uses at probe level; long reset
- Generic action model · Infectious Fury: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:beast:resource:infectious-fury; separate roll 2d12 (Raging and hit creature with natural weapon; target Wisdom save DC8+pb+con; on fail force reaction attack against chosen visible other creature OR deal2d12 psychic.)
- Dedicated plans · infectious-fury via infectious-fury (Raging and hit creature with natural weapon; target Wisdom save DC8+pb+con; on fail force reaction attack against chosen visible other creature OR deal2d12 psychic.)
- Remaining source effects need verification.

### Level 14 · Call the Hunt

- Counters · Call the Hunt; 6 uses at probe level; long reset
- Remaining source effects need verification.

## Barbarian — Berserker

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/barbarian:berserker)

### Level 3 · Frenzy

- Remaining source effects need verification.

### Level 6 · Mindless Rage

- Numeric effects awaiting verification · condition-immunity (Raging; existing effect suspended)
- Remaining source effects need verification.

### Level 10 · Intimidating Presence

- Remaining source effects need verification.

### Level 14 · Retaliation

- Remaining source effects need verification.

## Barbarian — Giant

Entry level 3 · [Bigby Presents: Glory of the Giants](https://dnd5e.wikidot.com/barbarian:giant)

### Level 3 · Giant’s Power

- Choice controls · Giant’s Power
- Spell grants · Druidcraft
- Remaining source effects need verification.

### Level 3 · Giant’s Havoc

- Numeric effects awaiting verification · reach (Raging; increases to 10 feet at 14)
- Remaining source effects need verification.

### Level 6 · Elemental Cleaver

- Numeric effects awaiting verification · weapon-extra-elemental-damage (Raging, holding own infused weapon; selected element)
- Remaining source effects need verification.

### Level 10 · Mighty Impel

- Remaining source effects need verification.

### Level 14 · Demiurgic Colossus

- Remaining source effects need verification.

## Barbarian — Storm Herald

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/barbarian:storm-herald)

### Level 3 · Storm Aura

- Choice controls · Storm Aura
- Dedicated plans · storm-aura via storm-aura (While raging; entry or bonus action on your turn. Aura 10 ft; no total cover. Choose self/other for Tundra.)
- Numeric effects awaiting verification · desert-fire-damage (Desert aura activation; all other creatures within10ft and no total cover) · tundra-temporary-hp (Tundra aura activation; chosen creatures within10ft and no total cover)
- Remaining source effects need verification.

### Level 6 · Storm Soul

- Numeric effects awaiting verification · resistance (Desert:fire; Sea:lightning; Tundra:cold; always active, no rage requirement) · swim-speed (Sea environment; also breathe underwater)
- Remaining source effects need verification.

### Level 10 · Shielding Storm

- Remaining source effects need verification.

### Level 14 · Raging Storm

- Remaining source effects need verification.

## Barbarian — Totem Warrior

Entry level 3 · [Player's Handbook](https://dnd5e.wikidot.com/barbarian:totem-warrior)

### Level 3 · Spirit Seeker

- Remaining source effects need verification.

### Level 3 · Totem Spirit

- Remaining source effects need verification.

### Level 6 · Aspect of the Beast

- Remaining source effects need verification.

### Level 10 · Spirit Walker

- Remaining source effects need verification.

### Level 14 · Totemic Attunement

- Remaining source effects need verification.

## Barbarian — Wild Magic

Entry level 3 · [Tasha's Cauldron of Everything](https://dnd5e.wikidot.com/barbarian:wild-magic)

### Level 3 · Magic Awareness

- Counters · Magic Awareness; 6 uses at probe level; long reset
- Generic action model · Magic Awareness: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:wild-magic:resource:magic-awareness (When you choose this path at 3rd level, as an action, you can open your awareness to the presence of concentrated magic. Until the end of your next turn, you know the location of any spell or magic item within 60 feet of you that isn’t behind total cover. When you sense a spell, you learn which school of magic it belongs to. You can use this feature a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 3 · Wild Surge

- Remaining source effects need verification.

### Level 6 · Bolstering Magic

- Counters · Bolstering Magic; 6 uses at probe level; long reset
- Generic action model · Bolstering Magic: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:wild-magic:resource:bolstering-magic; separate roll 1d3 (Touch creature including self; choose one effect. Spell-slot benefit recipient once/long-rest.)
- Dedicated plans · bolstering-magic via bolstering-magic (Touch creature including self; choose one effect. Spell-slot benefit recipient once/long-rest.)
- Remaining source effects need verification.

### Level 10 · Unstable Backlash

- Remaining source effects need verification.

### Level 14 · Controlled Surge

- Remaining source effects need verification.

## Barbarian — Zealot

Entry level 3 · [Xanathar's Guide to Everything](https://dnd5e.wikidot.com/barbarian:zealot)

### Level 3 · Divine Fury

- Choice controls · Divine Fury
- Numeric effects awaiting verification · extra-damage (First weapon hit on own turn while raging; selected damage type)
- Remaining source effects need verification.

### Level 3 · Warrior of the Gods

- Remaining source effects need verification.

### Level 6 · Fanatical Focus

- Counters · Fanatical Focus; 1 uses at probe level; none reset
- Generic action model · Fanatical Focus: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:zealot:resource:fanatical-focus
- Dedicated plans · fanatical-focus via fanatical-focus (Failed saving throw while raging; once per Rage. Reroll and use the new result.)
- Remaining source effects need verification.

### Level 10 · Zealous Presence

- Counters · Zealous Presence; 1 uses at probe level; long reset
- Generic action model · Zealous Presence: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:zealot:resource:zealous-presence (At 10th level, you learn to channel divine power to inspire zealotry in others. As a bonus action, you unleash a battle cry infused with divine energy. Up to ten other creatures of your choice within 60 feet of you that can hear you gain advantage on attack rolls and saving throws until the start of your next turn.)
- Remaining source effects need verification.

### Level 14 · Rage Beyond Death

- Remaining source effects need verification.

## Barbarian — Beast (UA)

Entry level 3 · [Unearthed Arcana 67 - Subclasses, Part 1](https://dnd5e.wikidot.com/barbarian:beast-ua)

### Level 3 · Form of the Beast

- Dedicated plans · beast-bite-heal via beast-bite-heal (After damaging a creature with your active Bite on your turn; once per turn. Published: below half maximum HP when you hit.)
- Numeric effects awaiting verification · bite-healing (Once own turn on bite damage; no published below-half restriction)
- Remaining source effects need verification.

### Level 6 · Bestial Soul

- Remaining source effects need verification.

### Level 10 · Infectious Fury

- Counters · Infectious Fury; 3 uses at probe level; long reset
- Generic action model · Infectious Fury: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:beast-ua:resource:infectious-fury; separate roll 2d12 (Raging and hit creature with natural weapon; target Wisdom save DC8+pb+con; on fail force reaction attack against chosen visible other creature OR deal2d12 psychic.)
- Dedicated plans · infectious-fury via infectious-fury (Raging and hit creature with natural weapon; target Wisdom save DC8+pb+con; on fail force reaction attack against chosen visible other creature OR deal2d12 psychic.)
- Remaining source effects need verification.

### Level 14 · Call the Hunt

- Counters · Call the Hunt; 3 uses at probe level; long reset
- Remaining source effects need verification.

## Barbarian — Giant (UA)

Entry level 3 · [Unearthed Arcana 83 - Giant Options](https://dnd5e.wikidot.com/barbarian:giant-ua)

### Level 3 · Giant Power

- Choice controls · Giant Power
- Spell grants · Druidcraft
- Remaining source effects need verification.

### Level 3 · Giant's Havoc

- Numeric effects awaiting verification · reach-bonus (Raging)
- Remaining source effects need verification.

### Level 6 · Elemental Cleaver

- Numeric effects awaiting verification · weapon-extra-elemental-damage (Raging, holding own infused weapon; selected element)
- Remaining source effects need verification.

### Level 10 · Mighty Impel

- Remaining source effects need verification.

### Level 14 · Demiurgic Collussus

- Remaining source effects need verification.

## Barbarian — Wild Soul (UA)

Entry level 3 · [Unearthed Arcana 60 - Barbarian and Monk](https://dnd5e.wikidot.com/barbarian:wild-soul-ua)

### Level 3 · Lingering Magic

- Counters · Lingering Magic; 3 uses at probe level; long reset
- Generic action model · Lingering Magic: spends 1 from expanded:2014:barbarian:2014:subclass:barbarian:wild-soul-ua:resource:lingering-magic (At 3rd level, your body reacts to the presence of magic. You can cast the detect magic spell without using a spell slot or components. Constitution is your spellcasting ability for this spell. You faintly glow a color corresponding to the school of magic you detect (you choose the colors). You can use this feature a number of times equal to your Constitution modifier (minimum of once). You regain all expended uses when you finish a long rest.)
- Remaining source effects need verification.

### Level 3 · Wild Surge

- Remaining source effects need verification.

### Level 6 · Magic Reserves

- Dedicated plans · magic-reserves via magic-reserves (Touch creature; no use limit stated in UA.)
- Remaining source effects need verification.

### Level 10 · Arcane Rebuke

- Generic action model · Arcane Rebuke: separate roll 3d6 (Raging; creature forces you to make saving throw.)
- Dedicated plans · arcane-rebuke via arcane-rebuke (Raging; creature forces you to make saving throw.)
- Remaining source effects need verification.

### Level 14 · Chaotic Fury

- Remaining source effects need verification.
