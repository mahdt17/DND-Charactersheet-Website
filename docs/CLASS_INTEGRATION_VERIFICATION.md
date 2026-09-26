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

The guided feat spell selectors currently use the bundled edition spell catalogs.
Other spell-granting feats, additional source spell choices, and non-spell feat
effects still require explicit source grants/manual recording. Choice replacement
timing remains table-controlled; the sheet does not track a replacement budget.
Subclass non-spell combat features are not newly automated by this casting work.
Background-granted Magic Initiate is configured on the sheet after creation.

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
For 3.5, only 70 records have full local feature prose; 984 use progression
summaries. Only 100 source proficiency supplements are verified, and 203 class
records have proficiency source text. The audit now states its scope explicitly.

Source-specific spell acquisition/preparation limits, restricted domain and
specialist slots, bonus slots for unreviewed casting classes, additional subclass casting progressions,
psionics/invocations/binding/incarnum effects, companions, and remaining training
rules still need structured source work. Cross-edition slot conversions remain
table-controlled. A spell access grant is an explicit exception, not evidence
that these systems are automated.

No Supabase schema, catalog storage, policies or live character rows were changed.
Read-only verification confirmed row-level security on both public tables.

## Rules references

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
