# Class integration verification

The catalog-wide checks cover **1,079 class records**: 13 for 2014 (including
Artificer), 12 for 2024, and 1,054 for 3.5. This is not a claim that every class
mechanic is fully automated.

## Implemented spell access

- Normal characters select spells from their class list and edition. Reference
  records cannot bypass membership or an unknown spell level.
- Multiclass selection uses each class's own level, ability and spell ownership.
  Combined slots and personal slot overrides do not unlock higher-level spells.
- 3.5 uses the spell's class-specific level, unlocked class progression and minimum
  casting ability. Table footnotes cannot replace the actual level row. A printed
  zero represents an unlocked spell level; a dash does not. Base slots in `1+1`
  are parsed separately from restricted domain slots.
- Source-reviewed 3.5 casters receive ability bonus slots only for already
  unlocked spell levels. Each class retains independent spent slots and personal
  slot overrides, including older saves that recorded primary slots separately.
- Artificer uses its source table, Intelligence preparation limit, and rounded-up
  half-level contribution to multiclass slots.
- Source-reviewed Life domain, Devotion oath and Circle of the Land spells are
  added at their own class levels and stay prepared without using the normal
  preparation allowance. Circle terrain is selectable per class. The 2024
  Draconic and Fiend tables also grant prepared spells; 2014 Fiend spells instead
  expand the list of known-spell choices. These spells still spend slots.
  Changing subclass, terrain, or class level reconciles only derived spells;
  manually recorded spells remain available for eligibility review.
- Archivist and Favored Soul use the Cleric list; Spirit Shaman uses Druid.
  Cloistered Cleric includes its source-listed additions and adjusted spell levels.
  Noncleric divine spells copied by an Archivist require an explicit source grant.
- Specific subclass, feat, item, scroll or table-rule access can be recorded and
  removed with a named source. This grants access, not extra preparation capacity
  or free casting. Missing class spell-level progression requires such an explicit
  source review rather than unrestricted selection.
- Custom characters must opt in to unrestricted cross-class/edition spell access,
  during creation or spell management.
- Previously saved ineligible spells remain visible for review/removal and cannot
  be cast. Removing a class also removes its explicit access grants and primary
  spells from legacy saves; independent racial spells survive.

## Validation and its limits

### Subclass casting and magic feats

- Eldritch Knight and Arcane Trickster use their own level 3–20 spell tables,
  Intelligence, Wizard spell lists, and one-third multiclass slot contributions
  in both 2014 and 2024. A sole casting class retains its own slot table.
- The 2014 school restrictions and out-of-school allowances are enforced across
  current and proposed selections. The 2024 versions have no school restriction.
  Arcane Trickster receives Mage Hand separately from its chosen cantrips.
- Magic Initiate, Fey Touched and Shadow Touched have guided, validated choices
  for both editions. Only the selected spells are granted; a feat never unlocks
  the whole class list. Grants remain separate from class preparation/known limits.
- Feat spells use the chosen or source-prescribed ability, and separate free-use
  counters. Touched feats add their capped ability increase without modifying the
  base score; an explicit opt-out accommodates older manually adjusted saves.
- Free uses recover on a long rest. The 2024 Magic Initiate and both Touched feats
  can also use available standard or Pact Magic slots. The 2014 Magic Initiate
  follows the matching class's casting rules, including preparation where needed.
- Repeated 2024 Magic Initiate selections require distinct lists. Invalid choices
  block advancement. Class-granted feat choices survive reconciliation; removing
  the grant removes its benefits. Replacing a choice does not refresh a spent use.
- Older string-form spell levels are resolved before counting selected spells,
  so legacy level-up saves cannot bypass known-spell/cantrip limits. Feat spells
  are also included in the printable spell list.

`tests/subclass-feat-magic.mjs` checks 80 subclass/class-level combinations,
school allowances, multiclass ownership/slots, feat list and school choices,
casting abilities, capped ability changes, grant reconciliation, repeated feats,
free/slot casting, rest recovery, source removal, and malformed saved choices.
`tests/browser-subclass-feat-magic.mjs` checks both subclass level-up flows,
feat configuration and advancement, actual casts/slot expenditure, rests,
save/reopen, ability display, feat removal and mobile layout.

### Additional feat and legacy casting integration

- Background Magic Initiate is configured during creation. Sage is locked to
  Wizard; Acolyte is locked to Cleric. Changing backgrounds removes the previous
  derived background feat and its choices.
- Feat selectors also load complete published spell records from the reference
  catalog, retain the selected records for offline use, and reject incomplete
  reference records. Edition, school, ritual and attack requirements still apply.
- Artificer Initiate (2014), Spell Sniper (2014), Ritual Caster, Telekinetic and
  Telepathic now have guided choices. Artificer Initiate derives its tool training.
  Spell Sniper shows adjusted range/cover rules. Telekinetic shows its shove save
  DC; Telepathic shows its communication restrictions. These reminders do not
  simulate another creature's position, save, cover, or response.
- Ritual Caster (2014) supports a persistent ritual book and copying eligible
  written rituals with source attribution and displayed time/gold costs. Payment
  and elapsed time remain explicit table actions. The 2024 version gains rituals
  as proficiency increases. Quick Ritual has one shared use for feat rituals and
  any eligible prepared class ritual; it never spends a spell slot.
- Wizard book rituals can be used without preparation in either modern edition.
  Ordinary slot casting still requires preparation. A ritual tag alone does not
  give a 2014 Sorcerer or Warlock ritual casting.
- 2024 Magic Initiate allows one spell replacement upon gaining a level; changing
  the list or ability requires a recorded setup correction. Other configured feat
  choices are locked behind a correction with a reason. Neither path resets uses.
- Five non-SRD 2024 magic feats have concise, source-linked catalog supplements.
- 3.5 Cleric domains use 22 SRD lists with nine spell levels each. Two distinct
  domains are required, opposed alignments are rejected, and Cloistered Cleric
  receives Knowledge additionally. Domain-only spells cannot use ordinary slots.
  Deity restrictions still require source review; domain granted powers are not
  applied by this spell-list implementation.
- Wizard specialization adds school-only slots and prohibits selected schools.
  Diviners give up one other school; other specialists give up two. Divination
  cannot be prohibited. Domain/specialist expenditure is separate per class and
  is refreshed through daily preparation. Changes to specialization remain setup
  corrections; acquisition timing is not an advancement-history engine.
- Core Psion, Psychic Warrior and Wilder calculate a shared power-point reserve,
  including ability bonuses, while access and spending caps use each class's own
  manifester level. Psion discipline lists remain separate from the general list.
  Source augmentation effects, recent expenditure recovery restrictions, wild
  surge and other exceptional rules require table adjudication.
- 3.5 Warlock invocations use grade and known-count restrictions and at-will use;
  they do not spend spell slots. The available catalog of powers and invocations
  is still incomplete; this does not claim full psionic/invocation coverage.
- Four source-linked Sorcerer records now use the SRD class progression instead
  of an accidentally extracted familiar table. Known-spell tables are excluded
  from slot parsing, and multirow headers work for class level lookup.
- Mixed-edition spellbooks keep independent class slots; modern Warlock pools
  recover on a short rest without resetting another edition's slots. This does
  not invent a shared cross-edition slot conversion rule.

`tests/feat-gaps.mjs`, `tests/legacy-casting-choices.mjs` and
`tests/legacy-special-casting.mjs` cover these mechanics. The browser suite
`tests/browser-casting-gaps.mjs` checks domain selection, specialist restrictions,
actual resource spending, save/reopen, power limits, at-will use, shared Quick
Ritual, unprepared Wizard rituals, and mobile layout. The edition creation suite
now verifies that background Magic Initiate must be configured before continuing.

### Individual 3.5 preparations

- Wizard, Cleric, Cloistered Cleric, Druid, Paladin and Ranger prepare individual
  copies in standard, domain or specialist slots. Level 0 spells consume a copy.
  Lower-level spells can occupy higher slots without increasing spell level/DC.
- Each cast spends one eligible prepared copy. Domain-only spells cannot occupy
  standard slots, specialist slots require the chosen school, and changes to
  class access, domains or prohibited schools invalidate affected preparations.
- Daily preparation supports replacement and leaving slots open. Later study or
  prayer can fill only open, unused slots; it cannot replace existing or spent
  preparations. Recent casts can be kept unavailable against the day's allowance.
  The player confirms timing by completing the preparation session; the app does
  not track elapsed game time or automatically decide the eight-hour restriction.
- Rest does not automatically replenish prepared copies. Saves retain exact
  preparations and expenditure per class, including mixed-edition characters.
  Old aggregate spent counts remain unavailable until daily preparation; an old
  `prepared` flag does not create copies. Removing a class removes its preparation
  ledger, slot expenditure and slot overrides.
- Spontaneous 3.5 casters can spend a higher-level slot on a lower-level spell.
  Sorcerer and Hexblade acquisition is now source-managed through exact class-level
  known-spell tables and legal replacement events. Other spontaneous 3.5 casting
  classes remain source-specific unless they already use a verified fixed-list or
  dedicated acquisition model.
- Clerics configure cure/inflict conversion according to alignment and deity;
  Druids can convert to Summon Nature's Ally. Casting lets the player choose the
  prepared standard copy to sacrifice, of the same level or higher. Domain and
  specialist slots cannot be sacrificed; the target spell must be in the saved
  class spell list and independently eligible. Deity alignment is source-reviewed
  by the player; the character's conflicting good/evil alignment is rejected.
- Eight Druid/Paladin source-linked reprints that contained companion/mount
  tables now use the SRD class tables. The repair only matches the original
  malformed shape and preserves personal progression edits. All 160 class/level
  combinations are checked for spell slots and base progression.

`tests/legacy-preparation.mjs` verifies copy counts, level 0 expenditure, higher
slots, restricted slots, invalid selections, daily versus later preparation,
recent-cast reservations, old-save migration, persistence, ownership and removal.
The casting-gap and spell-access browser suites cover actual preparation, casting,
open-slot filling, domain/specialist restrictions, class switching, rest behavior,
save/reopen and mobile layout.

`tests/spell-access.mjs` checks all 480 core class/level combinations (12 classes
per core edition, levels 1–20), Artificer, 3.5 spell lists, minimum abilities,
class-specific levels, multiclassing, source grants, and Custom opt-in. It checks
that every one of the 1,054 legacy classes rejects unrelated spells.

`tests/class-catalog-lifecycle.mjs` checks all 1,054 legacy records through 2,048
starting/final-level cases, including required variant choices. It verifies
idempotence, unique derived entries, preservation of manual actions, and removal
of class grants and spells. These are lifecycle checks, not independent reviews
of every source rule.

`tests/browser-spell-access.mjs` exercises class restrictions across all three
editions, saved-spell repair through a source grant, persistence after reopening,
multiclass selection and mobile layout. Existing creation, casting, progression,
resource, training, hit-die, feat and integration suites remain in CI.
Subclass checks cover every reviewed spell table and terrain, prepared grants,
duplicate prevention, removal, 2014 expanded-list selection while leveling,
and domain spells spending slots without consuming preparation choices.

## Remaining work before claiming full automation

The previous generic audit counts 1,078/1,079 records as structurally usable and
one as requiring a parent-class choice. That measures progression extraction.
For 3.5, only 66 records have full local feature prose; 988 use progression
summaries. Only 100 source proficiency supplements are verified, and 203 class
records have proficiency source text. The audit now states its scope explicitly.

Source-specific spell acquisition for 3.5 classes outside the verified Sorcerer/Hexblade/Wizard profiles, preparation for other classes,
metamagic preparation, bonus slots
for unreviewed casting classes, additional subclass casting progressions,
complete power/invocation catalogs and effects, binding/incarnum, remaining companion creature catalogs and alternate-companion selection flows,
domain granted powers, remaining training rules, additional spell-granting feats,
and non-spell feat effects still need structured source work. Cross-edition slot
conversions remain table-controlled. A spell access grant is an explicit
exception, not evidence that these systems are automated.

No Supabase schema, catalog storage, policies or live character rows were changed.
Read-only verification confirmed row-level security on both public tables.

## Rules references

### Soulknife and Complete Warrior Samurai review (2026-09-28)

- XPH Soulknife has 14 reviewed feature summaries, its four fixed bonus feats,
  explicit action types, and level-dependent Mind Blade formation timing.
  The +1 through +5 blade milestones remain history on one feature.
- Complete Warrior Samurai has 12 reviewed summaries, weapon-restricted feat
  reminders, fixed proficiency/initiative feats, level-scaled Kiai Smite uses,
  and the level-14 Staredown action upgrade. The Oriental Adventures class remains
  separate. Empty en-dash progression cells no longer create spurious features.
- Damaged Samurai blocks in the newer source were checked against the intact
  [older Complete Warrior page](https://dndtools.net/classes/samurai/).
  Individual features link to the source whose digest was verified; Kiai Smite
  uses the intact newer block including its once-per-round restriction.
- Optional bonus-language availability no longer forces a separate class choice
  during creation. Required bonus-feat selections still require completion.
- Integration tests cover every level, multiclass timing, reconciliation,
  saved resource expenditure, variant isolation, and removal. Source-review tests
  cover alternate-page headings, missing blocks, duplicate blocks, and changed
  digests. The exporter accepts repeatable `--class-id` filters for focused checks.

These changes present rules, grants, choices and counters. They do not resolve
attacks, equipment-dependent feat benefits, blade property costs, Psychic Strike
charges, ability damage, fear saves, or target conditions automatically. Wild
Talent is granted as a feat; its power-point contribution remains separate work.

### Reference links

- [2014 subclass spell tables](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes)
- [2024 subclass spell tables](https://www.dndbeyond.com/sources/dnd/free-rules/character-classes)
- [2014 multiclass spellcasting](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options#Spellcasting)
- [2024 multiclass spellcasting](https://www.dndbeyond.com/sources/dnd/free-rules/creating-a-character)
- [3.5 Cleric](https://www.d20srd.org/srd/classes/cleric.htm)
- [3.5 ability bonus spells](https://www.d20srd.org/srd/theBasics.htm#tableAbilityModifiersandBonusSpells)
- [Artificer catalog source](https://dnd5e.wikidot.com/artificer)
- [Archivist](https://new.dndtools.org/classes/archivist-74)
- [Favored Soul](https://new.dndtools.org/classes/favored-soul-7)
- [Spirit Shaman](https://new.dndtools.org/classes/spirit-shaman-9)
- [Cloistered Cleric](https://www.d20srd.org/srd/variant/classes/variantCharacterClasses.htm#clericVariantCloisteredCleric)
- [2014 Eldritch Knight](https://dnd5e.wikidot.com/fighter:eldritch-knight)
- [2014 Arcane Trickster](https://dnd5e.wikidot.com/rogue:arcane-trickster)
- [2024 Eldritch Knight](https://dnd2024.wikidot.com/fighter:eldritch-knight)
- [2024 Arcane Trickster](https://dnd2024.wikidot.com/rogue:arcane-trickster)
- [2014 Magic Initiate](https://dnd5e.wikidot.com/feat:magic-initiate)
- [Official Magic Initiate slot-casting clarification](https://media.wizards.com/2020/dnd/downloads/SA-Compendium.pdf)
- [2024 Magic Initiate](https://www.dndbeyond.com/sources/dnd/free-rules/feats)
- [2014 Fey Touched](https://dnd5e.wikidot.com/feat:fey-touched)
- [2014 Shadow Touched](https://dnd5e.wikidot.com/feat:shadow-touched)
- [2024 Fey Touched](https://dnd2024.wikidot.com/feat:fey-touched)
- [2024 Shadow Touched](https://dnd2024.wikidot.com/feat:shadow-touched)
- [2024 backgrounds](https://www.dndbeyond.com/sources/dnd/free-rules/character-origins)
- [2014 Artificer Initiate](https://dnd5e.wikidot.com/feat:artificer-initiate)
- [2014 Spell Sniper](https://dnd5e.wikidot.com/feat:spell-sniper)
- [2014 Ritual Caster](https://dnd5e.wikidot.com/feat:ritual-caster)
- [2024 Ritual Caster](https://dnd2024.wikidot.com/feat:ritual-caster)
- [2024 Telekinetic](https://dnd2024.wikidot.com/feat:telekinetic)
- [2024 Telepathic](https://dnd2024.wikidot.com/feat:telepathic)
- [3.5 domains](https://www.d20srd.org/srd/spellLists/clericDomains.htm)
- [3.5 Wizard specialization and Sorcerer progression](https://www.d20srd.org/srd/classes/sorcererWizard.htm)
- [Sorcerer source-linked reprints](https://new.dndtools.org/classes/sorcerer-98)
- [3.5 Psion](https://www.d20srd.org/srd/psionic/classes/psion.htm)
- [3.5 shared power points](https://www.d20srd.org/srd/psionic/classes/index.htm)
- [3.5 Warlock](https://new.dndtools.org/classes/warlock-4)
- [3.5 arcane preparation](https://www.d20srd.org/srd/magicOverview/arcaneSpells.htm)
- [3.5 divine preparation](https://www.d20srd.org/srd/magicOverview/divineSpells.htm)
- [3.5 Druid progression](https://www.d20srd.org/srd/classes/druid.htm)
- [3.5 Paladin progression](https://www.d20srd.org/srd/classes/paladin.htm)
- [Druid source-linked reprints](https://new.dndtools.org/classes/druid-106)
- [Paladin source-linked reprints](https://new.dndtools.org/classes/paladin-107)


## 3.5 Companion Engine checkpoint (2026-10-01)

The 3.5 companion work is now a dedicated reusable subsystem rather than a set
of class-name patches. `src/lib/companions35.js` owns effective-level
contributions, progression, source ownership, deterministic reconciliation,
derived combat statistics, lifecycle transitions, and familiar master effects.
`src/data/companions35.json` is source-locked to 3.5 references and the engine
fails closed when a selected creature has no exact local record; it never falls
back to the 5e monster catalog.

The first production profiles cover Druid/Ranger animal companions, standard
familiars, Paladin special mounts, and Healer companions. Familiar-granting class
levels stack through contribution rules, including Hexblade's class-level-minus-3
contribution. Ranger uses half class level. Dread Necromancer keeps its familiar's
original creature type, omits Speak with Animals of Its Kind, and exposes its
touch-delivery exception.

Persisted companion records preserve player-owned nickname, current HP, notes and
lifecycle state across recalculation. Bonus HD now drive deterministic total HD,
HP, BAB and base saves, and Dexterity progression contributes to AC. Standard
familiars use the master's BAB when better and the better master/familiar base
save with the familiar's own ability modifier. The source-specific familiar
benefits to the master are structured as derived effects rather than mutations:
skill/save/HP bonuses, conditional Hawk/Owl Spot bonuses, and Raven's chosen
spoken language.

The character sheet has a dedicated 3.5 Companions tab for creature statistics,
progression, source, HP, notes and legal lifecycle controls. Paladin standard
mount defaults are size-aware (heavy warhorse for Medium masters, warpony for
Small masters). Paladin and Healer calling state is tracked separately from
death/replacement state. Campaign-time restrictions remain explicit game state
rather than wall-clock timers.

Source-locked creature coverage includes all standard familiars, all four reviewed
Dread Necromancer familiars, Wolf/Ape animal-companion representatives, Heavy
Warhorse/Warpony and Unicorn. Exact 3.5 source pages were also matched and
researched for the full core animal-companion list and the five Healer alternative
companions. Those larger data sets remain incremental because several parsed
monster pages omit secondary movement modes; incomplete source parses are not
silently imported.

Completion impact is deliberately conservative. Adept, Dread Necromancer and the
four verified Paladin source records move to complete because companion state was
their remaining blocker. Healer and Ranger remain needs-review with narrowed
alternative/full-creature-catalog work. Hexblade, Sorcerer and Wizard families
lose their familiar blocker but retain their independent spells-known or
spellbook acquisition blockers.

Verification evidence:
- code head: `324603885c0cbe9a4731e1a79fe7eafd6b4f9801`
- Companion engine checks #18: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36821790956
- Validate modernization #1518: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36821790949
- #1518 passed the full 3.5 class/feat/spell/item regressions, build, general and
  edition browser tests, casting/setup, catalog/advancement, spell-access and the
  remaining specialized browser suites.

No Supabase schema, policy, catalog, or live character data was changed. Nothing
was deployed or merged.


## 3.5 Spell Acquisition Engine checkpoint (2026-10-01)

The reusable 3.5 spell-acquisition subsystem is complete for the exact reviewed
Hexblade, Sorcerer, and Wizard source records covered by the tracker. Acquisition
state is persisted separately from runtime spell rows, uses exact source-class IDs,
and reconciles ownership idempotently without conflating acquisition, preparation,
access, or current castability.

Sorcerer uses exact per-spell-level spells-known tables and even-level legal
replacement events. Hexblade uses its delayed spell access, exact known-spell
progression, and replacements at class levels 12, 15, and 18. Wizard creation
records all legal 0-level spellbook entries plus the required first-level choices,
level-up requires exactly two free spellbook additions, and campaign copying or
research records provenance/confirmation without simulating time, cost, checks, or
scroll consumption.

Feat-driven spell acquisition remains separate from feat casting and access-only
effects. Reviewed learned-spell/spellbook feats resolve immediately in creation or
level-up, preserve source feat ownership, do not consume ordinary known-spell quota
unless structured metadata says so, and are removed independently when their feat
source disappears. Class-feature-selected feats now preserve canonical feat
metadata and must resolve the same mandatory spell acquisition before final save.

The source-specific verification pass promoted exactly nine records whose only
remaining blocker was acquisition state:
- `classes/hexblade-19`
- `classes/sorcerer-98`, `classes/sorcerer-46`,
  `classes/sorcerer-70`, `classes/sorcerer-109`
- `classes/wizard-99`, `classes/wizard-47`,
  `classes/wizard-71`, `classes/wizard-110`

Verification evidence:
- implementation head: `b0d613a22aaf56efe83f8f31696ce08f88bbc8c4`
- Spell acquisition checks #58: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977364
- Companion engine checks #83: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977553
- Validate modernization #1583: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977372
- #1583 passed the full 3.5 class/feat/spell/item regressions, production build,
  edition/general browser suites, guided feature choices, level-up feat coverage,
  spell-access/casting/resource suites, and production-loading checks.

Tracker impact: **60 complete, 642 needs-review, 1 source-conflict, 2 blocked,
349 pending audit**. No Supabase schema, policy, catalog, or live character data
was changed. Nothing was deployed or merged.

## 3.5 Companion source-lock completion checkpoint (2026-10-01)

The Companion Engine now has exact local 3.5 creature records for the complete
legal core Druid/Ranger animal-companion option set and for all Healer celestial
companion alternatives. Grouped choices are no longer placeholders: light horse
and heavy horse are separate options, as are Small and Medium vipers, and all
legal options resolve to source-locked creature IDs.

Ranger has its own source-faithful companion profile rather than blindly sharing
the Druid choice table. Ranger still contributes one-half class level for
companion progression, but the PHB aquatic-campaign starting exception allows
Crocodile at Ranger 4; Druid keeps Crocodile in its higher-level alternative
list. The PHB, Eberron, Forgotten Realms, and Sandstorm Ranger records are
source-equivalent and regression-tested against this profile.

Healer level 12+ supports Unicorn, Lammasu, Gynosphinx, Water Naga, Androsphinx,
and Couatl. The three -4 and two -8 alternatives use the source-defined
effective-level adjustments, retain Healer's celestial companion marker, and
use the existing calling/death/replacement lifecycle. After a source-defined
replacement condition becomes available, the Companions tab can choose a
different currently legal source creature. Replacement rewrites the persisted
source choice, removes the former automatic companion, creates the selected
creature from its own source-derived state, and does not carry the former
creature's HP or notes forward.

Completion impact is limited to records whose documented final blocker was this
companion work: `classes/healer-77` plus `classes/ranger-96`,
`classes/ranger-44`, `classes/ranger-68`, and `classes/ranger-108`.
All five move from needs-review to complete.

Verification evidence:
- implementation head: `8d08de8c763b6c5559e605bf26626090db49e199`
- Companion engine checks #89: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570641
- Spell acquisition checks #64: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570489
- Validate modernization #1589: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570642
- #1589 passed the full 3.5 class/feat/spell/item regressions, production build,
  every general/specialized browser suite, guided feature-choice coverage, and
  production-loading checks.

Tracker impact: **65 complete, 637 needs-review, 1 source-conflict, 2 blocked,
349 pending audit**. No Supabase schema, policy, catalog, or live character data
was changed. Nothing was deployed or merged.

## 3.5 Duskblade flexible spell-acquisition checkpoint (2026-10-01)

Duskblade now uses the reusable 3.5 spell-acquisition subsystem without being
forced into the Sorcerer/Hexblade fixed known-table model. The new `flex-known`
profile preserves the source rule that each class level after 1st grants one
spell of any level the Duskblade can currently cast.

At class level 1, guided acquisition requires two 0-level spells plus additional
0-level spells equal to the character's Intelligence bonus at that acquisition
event, and two 1st-level spells. Once those source events are completed they are
persisted by exact Duskblade source ID and are not recalculated merely because
Intelligence later changes.

At class level 2 and every later Duskblade level, one required flexible acquisition
event accepts a legal Duskblade spell from level 0 through the class's current
maximum spell level. Beginning at level 5 and on every subsequent odd Duskblade
level, a separate optional replacement event permits one known spell to be replaced
by another Duskblade spell of the same spell level; that spell level must be at
least two levels below the highest level the Duskblade can currently cast.

The implementation keeps acquisition history separate from runtime spell rows.
Known Duskblade spells reconcile into the normal Spells section as spontaneous
castable spells, preserve exact class ownership in multiclass characters, do not
duplicate completed acquisition events on reopen, and archive rather than erase
their source-owned history if the Duskblade class is removed. Re-adding the same
source class restores compatible history.

Regression coverage includes source-profile mapping, Intelligence-based starting
counts, flexible-level legality, level-5 and level-9 replacement caps, even-level
replacement exclusion, persisted event deduplication, spontaneous runtime
materialization, class removal/restoration, and an end-to-end browser test that
creates a Duskblade and completes its level-2 flexible spell choice through the
actual UI.

Completion impact is intentionally limited to `classes/duskblade-102`, whose
tracker entry identified persisted Spells Known acquisition/replacement as its
remaining blocker. It moves from needs-review to complete.

Verification evidence:
- implementation head: `e5bdc37d14a5801195268017a5f2fecb45e9fcdb`
- Spell acquisition checks #70: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080860
- Companion engine checks #95: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080985
- Validate modernization #1595: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080868
- #1595 passed the full 3.5 class/feat/spell/item regressions, production build,
  every general/specialized browser suite, guided feature-choice coverage, and
  production-loading checks.

Tracker impact: **66 complete, 636 needs-review, 1 source-conflict, 2 blocked,
349 pending audit**. No Supabase schema, policy, catalog, or live character data
was changed. Nothing was deployed or merged.

## 3.5 Magewright mastered-repertoire checkpoint (2026-10-01)

Magewright now has source-owned spell acquisition and prepared casting that match
its distinct 3.5 model: a limited mastered repertoire, no spellbook, and daily
preparation from the spells it has mastered.

At class level 1, the acquisition engine requires a number of mastered spells
equal to the Magewright's current Intelligence modifier. New Spell Mastery events
occur at class levels 4, 8, 12, and 16 when a new spell level becomes available,
and again at level 20. Each post-1st event also requires one additional 0-level
spell. Event selections enforce the source-defined maximum spell level, the
Intelligence requirement to learn/cast that spell level, distinct choices, and
exact Magewright spell-list ownership.

The mastered repertoire persists independently from runtime spell rows. Completed
events are not duplicated on reopen, source removal archives the exact
Magewright-owned history, and re-adding the same source restores compatible
repertoire state. The creation and level-up adapters both preserve the structured
`mastered` and `bonusCantrips` choice payload rather than flattening it.

Magewright is also registered with the existing per-slot 3.5 preparation engine.
Acquired repertoire spells are not marked spontaneously castable; instead they
become candidates for daily prepared slots, and casting expends the selected
prepared copy. The Manage Spells surface recognizes the acquisition profile and
does not expose unrestricted manual class-spell addition.

Regression coverage includes every mastery trigger, Intelligence-scaled counts,
maximum-level and duplicate rejection, source removal/restoration, prepared-slot
use and expenditure, plus a browser flow covering creation, persisted repertoire,
manual-add lockout, daily preparation, and casting.

Completion impact is limited to `classes/magewright-1029`, which moves from
needs-review to complete.

Verification evidence:
- implementation head: `faaa79b8150a361f397957ffb0f1746756acdd91`
- Spell acquisition checks #75: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670234
- Companion engine checks #100: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670267
- Validate modernization #1600: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670249
- #1600 passed all full catalog regressions, production build, every
  general/specialized browser suite, guided feature-choice and level-up-feat
  coverage, fantasy presentation/dice, and production-loading checks.

Tracker impact: **67 complete, 635 needs-review, 1 source-conflict, 2 blocked,
349 pending audit**. No Supabase schema, policy, catalog, or live character data
was changed. Nothing was deployed or merged.


## 3.5 Favored Soul spell-acquisition and deity-weapon checkpoint (2026-10-01)

The reviewed Complete Divine Favored Soul and its source-equivalent Miniatures
Handbook appearance now use the reusable 3.5 spell-acquisition subsystem for
their source-defined spontaneous spells known.

The shared `favored-soul-35` profile stores the complete level 1-20 spells-known
table. At 1st level guided acquisition requires four 0-level spells and three
1st-level spells. Later class levels generate only the exact per-spell-level
deltas. Starting at Favored Soul 4 and at every even Favored Soul level
thereafter, the engine exposes one optional replacement: the replacement must
be the same spell level as the spell being exchanged, and that level must be
at least two levels below the highest Favored Soul spell level currently
castable.

Favored Soul is explicitly source-reviewed as using the Cleric spell list.
Acquisition validation therefore recognizes the existing reviewed
Favored Soul -> Cleric list relationship instead of requiring catalog spell
rows to name Favored Soul directly. Spells outside the reviewed Cleric list
are rejected. Acquired spells reconcile into the normal Spells section as
spontaneously castable Favored Soul spells with exact source-class ownership.

The acquisition profile also preserves source-owned history across class
removal and re-addition. Removing the exact Favored Soul source archives its
acquisition bucket and retires its runtime spell rows; re-adding the same
source restores compatible known-spell history without inventing new picks.

The already-reviewed Deity's favored weapon proficiency choice is now linked
to the class's later feat grants. At class level 3, Deity's Weapon Focus offers
Weapon Focus for the persisted favored weapon. At class level 12, Deity's
Weapon Specialization does the same for Weapon Specialization. If the exact
linked feat is already owned, the class retains the source-defined ability to
choose a different feat through the existing manual class feat-choice path.

Regression coverage includes both exact source mappings, representative
spells-known table rows, class-level acquisition deltas, even/odd replacement
timing, Cleric-list acceptance and non-Cleric rejection, spontaneous runtime
materialization, exact-source archival/restoration, persisted favored-weapon
linkage, level-3 and level-12 feat targeting, and a browser flow that creates
a Favored Soul with the source's 4/3 starting spells, records Longsword as the
deity's favored weapon, advances to level 3, and verifies Weapon Focus
(Longsword) is the guided class feature choice.

Completion impact is limited to `classes/favored-soul-7` and
`classes/favored-soul-76`. Both move from needs-review to complete because
their tracker-recorded final blocker covered exactly the spell-acquisition /
replacement and deity-favored-weapon state closed by this checkpoint.

Verification evidence:
- implementation head: `1ccbc5ad3d9a14b32ec66cf1c50c52838e06072e`
- Spell acquisition checks #86: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352369
- Companion engine checks #111: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352373
- Validate modernization #1611: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352401
- #1611 passed all full catalog regressions, production build, every
  general/specialized browser suite, guided feature-choice and level-up-feat
  coverage, fantasy presentation/dice, and production-loading checks.

Tracker impact: **69 complete, 633 needs-review, 1 source-conflict, 2 blocked,
349 pending audit**. No Supabase schema, policy, catalog, or live character data
was changed. Nothing was deployed or merged.

## Unearthed Arcana generic Expert / Warrior base-save checkpoint (2026-10-01)

Generic Expert and generic Warrior now share a structured source-owned save-progression choice rather than relying on unresolved `Good Save(s)` / `Poor Save(s)` table columns. Expert selects exactly two distinct good saves at first class level; Warrior selects exactly one. The available choices are Fortitude, Reflex, and Will, and the selected values persist through the existing 3.5 `featureChoices` model under the exact class source ID.

The advancement engine resolves generic save columns only when a class table does not already provide explicit Fortitude, Reflex, and Will values. Selected saves receive the source table's good-save progression and the remaining saves receive the poor-save progression. This applies during creation, later class-level advancement, and multiclass recomputation, while ordinary 3.5 class progression remains unchanged.

Regression coverage verifies Expert at levels 1 and 6, Warrior at levels 1 and 6, exact-source Expert/Warrior multiclass accumulation, persisted save choices, no re-prompt after completion, and an end-to-end Warrior creation/save/reopen flow with Will selected as the good save.

Completion impact is limited to `classes/expert2-124` and `classes/warrior2-135`.

Verification evidence:
- implementation head: `38932019ada42fe61c38647ae2a77c0b4040ab31`
- Companion engine checks #128: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703851
- Spell acquisition checks #103: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703874
- Validate modernization #1628: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703858

Tracker impact: **71 complete, 631 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**. No Supabase or deployment changes were made.

