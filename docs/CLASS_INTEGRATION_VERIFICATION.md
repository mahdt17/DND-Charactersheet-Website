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

## Remaining work before claiming full automation

The previous generic audit counts 1,078/1,079 records as structurally usable and
one as requiring a parent-class choice. That measures progression extraction.
For 3.5, only 70 records have full local feature prose; 984 use progression
summaries. Only 100 source proficiency supplements are verified, and 203 class
records have proficiency source text. The audit now states its scope explicitly.

Source-specific spell acquisition/preparation limits, restricted domain and
specialist slots, bonus slots for unreviewed casting classes, all subclass casting progressions,
psionics/invocations/binding/incarnum effects, companions, and remaining training
rules still need structured source work. Cross-edition slot conversions remain
table-controlled. A spell access grant is an explicit exception, not evidence
that these systems are automated.

No Supabase schema, catalog storage, policies or live character rows were changed.
Read-only verification confirmed row-level security on both public tables.

## Rules references

- [2014 multiclass spellcasting](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options#Spellcasting)
- [2024 multiclass spellcasting](https://www.dndbeyond.com/sources/dnd/free-rules/creating-a-character)
- [3.5 Cleric](https://www.d20srd.org/srd/classes/cleric.htm)
- [3.5 ability bonus spells](https://www.d20srd.org/srd/theBasics.htm#tableAbilityModifiersandBonusSpells)
- [Artificer catalog source](https://dnd5e.wikidot.com/artificer)
- [Archivist](https://new.dndtools.org/classes/archivist-74)
- [Favored Soul](https://new.dndtools.org/classes/favored-soul-7)
- [Spirit Shaman](https://new.dndtools.org/classes/spirit-shaman-9)
- [Cloistered Cleric](https://www.d20srd.org/srd/variant/classes/variantCharacterClasses.htm#clericVariantCloisteredCleric)
