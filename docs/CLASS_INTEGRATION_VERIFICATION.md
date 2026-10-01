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
  Their known-spell acquisition remains a separate source-review task.
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

Source-specific spell acquisition and preparation for other classes,
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
