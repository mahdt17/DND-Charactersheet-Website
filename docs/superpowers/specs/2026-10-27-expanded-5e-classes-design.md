# Expanded 5e classes and casting

## Intent
Make characters created from scratch usable through level 20: spell casting updates the sheet, Fighter features are selectable and usable, and every missing 2014-compatible subclass from published books and Unearthed Arcana is available with its progression and actionable rules.

The user explicitly expanded scope from Wizard/Fighter/Barbarian to all 5e classes and subsequently included Unearthed Arcana. Existing 2024 and 3.5 rules remain separate. The paused dice appearance work is unrelated.

## Approach
Extend the existing React character sheet and its pure rules helpers. Reuse the source reference catalog rather than introducing another spell database. Store subclass definitions separately from saved choices and spent resources. Source labels distinguish published material, UA playtests, and older versions. Existing Battle Master, Cavalier, Totem Warrior, and saved SRD subclasses keep their working adapters.

A names-only selector would not fulfill the request. Per-subclass bespoke screens would duplicate persistence, resource, and level-selection logic. A shared feature/action/choice model with targeted adapters for mechanics such as Bladesong is the chosen implementation approach (builder decision following the user's instruction to continue).

## Required behavior
- Shield adds 5 AC until the start of the caster's next turn; Mage Armor offers 13 + Dexterity while unarmored for 8 hours. Recasting replaces the same effect. Equipment restrictions apply immediately. Effects persist on reload, can be ended, and expire at their correct boundaries or duration.
- Healing casts expose a recipient. A valid Self selection applies the rolled healing once, capped at maximum HP; another creature never heals the caster. Invalid casting spends nothing. Existing roll results are reused.
- Spell effects and AC formulas are separate: alternative base AC formulas do not stack. Concentration replacement/removal clears effects owned by that concentration. 3.5 behavior stays unchanged.
- Full Wizard spell availability includes the existing optional/extra-book reference spells in creation, level-up, and management. Absorb Elements is a regression example. Spell identity and ownership remain stable across duplicate SRD/reference records.
- Fighter level 1 selects a Fighting Style. All user-listed PHB/TCE/UA styles are available with source labels, restrictions, and persistent choices. Numeric combat bonuses apply where the attack/equipment model can determine eligibility; conditional triggers remain explicit actions/instructions. Superior Technique grants a maneuver and its own d6 short-rest resource, compatible with Battle Master.
- Second Wind explains and applies 1d10 + Fighter level healing once per short/long rest for 2014 characters, with a visible roll and resource spend. Multiclass total level is not substituted for Fighter level.
- Subclasses are selected at their actual entry level, including level-1 Cleric/Sorcerer/Warlock and level-2 Wizard/Druid. Creation and level-up persist selection on the correct class row.
- Subclass features unlock by class level. Features have source, level, clear rules, and required choices. Limited-use actions show their remaining uses, recovery, rolls, and target/trigger requirements. Source-dependent or external-board effects are explicitly presented for the player to resolve; do not invent automatic attacks, damage to other characters, or encounter movement.
- Published and UA variants are separately identified rather than silently replacing each other. No 2024-only subclasses are assigned to 2014 classes. Artificer is included among the 13 classes.
- Bladesinging has usable Bladesong with armor/shield/two-handed-attack restrictions, Intelligence AC bonus, movement/concentration benefit, correct duration/uses/reset, and subclass progression.

## Data and architecture
The acceptance roster is the subclass tables on the 13 current 2014 class reference pages at dnd5e.wikidot.com (Artificer through Wizard), including archived UA rows and distinct historical iterations listed there. Reprints with identical mechanics are one record with multiple sources; mechanically different UA records have separate IDs. Plane Shift entries are labeled separately as digital supplements. 2024/One D&D class redesign playtests are outside this 2014 subclass roster. Preserve existing base-class systems; the newly requested base-class work is Fighter styles/Second Wind and shared casting, plus base-class integration necessary for a subclass to function. This is a builder ruling on scope, not an expansion to rewrite all base classes.

Fighting Style roster: Archery, Blind Fighting, Defense, Dueling, Great Weapon Fighting, Interception, Protection, Superior Technique, Thrown Weapon Fighting, Two-Weapon Fighting, Unarmed Fighting, Close Quarters Shooter (UA), Mariner (UA), Tunnel Fighter (UA).

`src/data/expandedSubclasses.js` (or JSON) owns source-labeled subclass records; `src/lib/expandedSubclasses.js` owns lookup, progression, saved choices, and generic action/resource reconciliation. A shared class-tools component renders the feature/choice/action controls. Existing creation and level-up screens consume this same catalog.

`src/lib/spellEffects.js` owns pure cast effect patches and effect expiry/AC contributions. Spellbook screens gather explicit recipient and roll results, then commit the effect patch alongside slot/resource changes. The shared AC calculation consumes active effects. Rest and turn controls handle expiration; the sheet provides an explicit End effect action.

`src/lib/fightingStyles.js` and its UI own style choices/actions and numeric modifiers, sharing current equipment and attack calculations without importing UI into rules modules.

## Validation and delivery
Use behavior tests for stacking, armor changes, reload persistence, recipient choices, invalid casts, class-level ownership, UA/published identity, subclass entry levels, resource exhaustion/recovery, and existing adapter compatibility. Browser tests exercise creation, casting, and class tools. Run relevant existing regressions and production build. A fresh reviewer inspects the final branch before delivery. Report coverage and limitations honestly; do not describe a catalog of names as complete mechanics.

Work proceeds in the existing isolated checkout on a new branch from merged main. No merge or deployment is included until requested.
