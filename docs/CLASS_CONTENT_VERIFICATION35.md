# Class content verification

## Scope and meaning

The catalog contains 1,054 D&D 3.5 class records. Existing import validation,
historical `sourceReview: verified` labels, and passing catalog lifecycle tests
do **not** establish that all rules text, prerequisites, skills, progression
tables, spell lists or feature exceptions are correct. Automation certification
is a separate measure.

The field correction register in
`src/data/class-source-corrections35.json` records exactly which fields were
checked, their sources, and work still outstanding. Its current 92 records
(all 50 Unearthed Arcana records, ten exact PHB parents and all 32 DMG v.3.5
records) are **partial content reviews**, not 92 fully verified or completed classes.
Earlier review evidence remains relevant but is not silently promoted into
field-by-field accuracy evidence. Imported `referenceOnly`/enrichment flags are
preserved; they must not be read as this stronger content guarantee.

## Expanded source-family review — 2026-10-13

The larger pass covers all UA base variants, eight specialist Wizards,
the Sorcerer/Wizard parent choice, prestige variants, legendary-weapon scions,
tainted classes, three racial paragons and three generic classes. It confirms
or corrects fixed skills, hit dice and skill points where cited, restores
missing prestige prerequisites, and pins reviewed inherited definitions to
their exact PHB source. A confirmation can leave an already-correct field
unchanged; the register lists the actual reviewed fields for each record.

Conditional skills remain conditional: Planar Ranger's seven-language rule
does not grant unrestricted Speak Language; optional specialist replacements,
generic class selections and Swift Scion bonus skills are not unconditional
grants. Existing generic saving-throw choices remain implemented and preserved.
Prestige Bard's any-one skill specializations and Dwarf Paragon's eligible
subraces require manual confirmation; literal-name gates would wrongly reject
qualified characters. Other unsupported prerequisites remain explicit.

Ten PHB parents now have source-specific skill lists. This removes extraction
noise such as Cleric Ride, Monk/Wizard Heal, Ranger Bluff/Sense Motive and
Sorcerer Scry, while expanding Knowledge into the correct disciplines.
The catalog's Bard record is labeled Eberron Campaign Setting; it is not
relabeled or counted as an exact PHB parent.

Classes whose source grants all individual Knowledge skills include the ten
core categories plus Knowledge (psionics), the additional category defined by
the [psionic skills rules](https://www.d20srd.org/srd/psionic/skills/overview.htm).
This preserves the existing psionics discipline on Arcane Trickster and extends
the corrected all-Knowledge profiles consistently. Restricted Knowledge lists
remain restricted; this does not grant Psychic skills such as Psicraft.

Eleven advancement tables are repaired or reconstructed: PHB Paladin, Druid,
Ranger and Sorcerer; the three alternate Paladins; Druidic Avenger, Urban Ranger,
Cloistered Cleric and Savage Bard. They retain individual spell-level columns,
printed zero slots and domain-slot notation. Tyranny gains Aura of Despair,
Avenger loses Animal Companion, Urban Ranger loses Woodland Stride/Camouflage,
Cloistered Cleric uses poor BAB, and Savage Bard uses good Fortitude/Will and
poor Reflex. Original malformed imported tables are retained as auxiliary data.
Exact fallback repairs for Druid reprints now exclude companion advancement,
preventing Multiattack from being granted to the character.

Sources and unresolved rules are recorded per field in the correction register.
Additional sources include [specialist variants](https://www.d20srd.org/srd/variant/classes/specialistWizardVariants.htm),
[prestigious classes](https://www.d20srd.org/srd/variant/classes/prestigiousCharacterClasses.htm),
[generic classes](https://www.d20srd.org/srd/variant/classes/genericClasses.htm),
[racial paragons](https://www.d20srd.org/srd/variant/races/racialParagonClasses.htm),
[legendary weapons](https://www.d20srd.org/srd/variant/magic/legendaryWeapons.htm)
and [taint](https://www.d20srd.org/srd/variant/campaigns/taint.htm).

## Dungeon Master's Guide v.3.5 pass

All 32 exact records have partial evidence: five NPC classes, sixteen prestige
classes and eleven epic continuations. Red Wizard's extracted mirror supplied
only its hit die and skill-point rate; its skills and setting-specific rules
remain explicitly unverified. The other 31 have checked skill profiles as well.

Confirmed corrections include Assassin's missing Disable Device, Blackguard's
missing Craft, specific Knowledge disciplines, Horizon Walker's extraneous Swim,
Loremaster's extraneous Tumble and the restricted Craft (alchemy) skill for
Archmage/Loremaster. NPC Expert retains its existing choice of ten skills; the
candidate list is not granted automatically. Already-correct values are retained.

Blackguard's fiendish-servant table is replaced by its ten class levels, preserving
the servant table separately. Epic Bard's 26th-level Inspire Courage becomes +5;
Epic Rogue regains Trap Sense at levels 21, 24, 27 and 30. These bring the batch
to fourteen repaired/reconstructed tables, including the eleven above.
The [epic continuation rules](https://www.d20srd.org/srd/epic/basics.htm) support
retaining the corresponding base-class skill profiles, hit dice and skill points.
This does not implement epic attack/save bonuses, a continuous class-level model,
or all epic feature effects. Inconsistent Epic Paladin source text remains flagged
for exact-book reconciliation rather than being silently chosen or certified.

Sources: [NPC classes](https://www.d20srd.org/indexes/classes.htm),
[prestige classes](https://www.d20srd.org/indexes/prestigeClasses.htm),
[epic progressions](https://www.d20srd.org/srd/epic/classProgressions.htm) and
[the exact Red Wizard mirror](https://new.dndtools.org/classes/red-wizard-391/).
Per-field URLs in the register point to each individual class page.

## Initial nine variant corrections

| Exact source record | Confirmed extraction problem | Correction |
| --- | --- | --- |
| `classes/bardic-sage-118` | Only “Knowledge” listed as a skill; alignment text omitted allowed alignments | Full Bard skills, including individual Knowledge disciplines; 6 + Int points; neutral good, neutral, or neutral evil |
| `classes/divine-bard-121` | No fixed class skill list or skill-point value | Full Bard skills and 6 + Int points |
| `classes/battle-sorcerer-119` | Retained Bluff; undifferentiated Knowledge; missing skill points | Intimidate replaces Bluff; Knowledge (arcana); other Sorcerer skills; 2 + Int points |
| `classes/domain-wizard-122` | No fixed class skill list | Full Wizard skills, including individual Knowledge disciplines; 2 + Int points |
| `classes/paladin-of-freedom-125` | Missing skills, points and alignment | Paladin skills with Bluff replacing Diplomacy; 2 + Int; chaotic good |
| `classes/paladin-of-slaughter-126` | Missing skills, points and alignment | Paladin skills with Intimidate replacing Diplomacy; 2 + Int; chaotic evil |
| `classes/paladin-of-tyranny-127` | Missing skills, points and alignment | Normal Paladin skills (Diplomacy retained); 2 + Int; lawful evil |
| `classes/druidic-avenger-123` | Missing explicit skill list; inherited list cannot express the replacement | Druid skills with Intimidate replacing Diplomacy; 4 + Int |
| `classes/urban-ranger-134` | Survival wrongly retained; Knowledge disciplines collapsed | Remove Survival, Knowledge (nature/dungeoneering); add Gather Information, Knowledge (local), Sense Motive; retain geography; 6 + Int |

Sources: [UA variant rules](https://www.d20srd.org/srd/variant/classes/variantCharacterClasses.htm),
[Bard](https://www.d20srd.org/srd/classes/bard.htm), and
[Sorcerer/Wizard](https://www.d20srd.org/srd/classes/sorcererWizard.htm),
[Paladin](https://www.d20srd.org/srd/classes/paladin.htm),
[Druid](https://www.d20srd.org/srd/classes/druid.htm), and
[Ranger](https://www.d20srd.org/srd/classes/ranger.htm).
Variant rules define the exceptions; unchanged fields inherit from the base
class. Concise source-based summaries replace generated catalog descriptions
for the first four records in the initial batch; later entries add only the
specific summaries identified in their field evidence.
The summaries are not exhaustive feature text or spell lists.

Corrections apply during catalog normalization only when edition source,
category, source ID, name and source book match. Raw imports are preserved.
The reviewed values reach derived skills and normalized stats. Characters
already storing an older embedded definition are not silently migrated by this
change; reselecting/refreshing their catalog definition is a separate concern.

## Still required

- Complete the remaining progression and inherited-feature audits, including
  independent specialist replacements, totem/style choices, variant spell
  lists, scion choices and racial-paragon eligibility history.
- Verify and represent Bardic Sage/Divine Bard added spell lists, Battle
  Sorcerer spells known, and every arcane-domain list.
- Complete the distinct automation for split casting abilities, alignment
  spell restrictions, bonus divinations, armor casting and domain choices.
  Bardic Sage's three-alignment prerequisite is now accurate reference text
  but still requires manual confirmation in the existing prerequisite evaluator.
- Continue source comparison across the rest of the catalog. These 92 partial
  reviews do not establish accuracy of the other 962 records.

## Validation

`tests/class-source-corrections35.mjs` first failed on Bardic Sage's truncated
skill list; the second batch failed on Paladin of Freedom's missing list.
It now checks all nine corrected lists, point values, four summaries,
alignment, partial evidence, source isolation and sheet grants at levels
1/10/20. JSON save/reload is stable for corrected definitions.
The test is part of `npm test`.

The expanded batch adds `core-source-skills35.mjs`,
`core-progression-source35.mjs` and `ua-source-family35.mjs` to `npm test`.
They cover ten PHB skill profiles, all twenty levels of eleven numeric
progressions, all 50 UA records at levels 1/10/20, save/reload, optional-skill
isolation, exact parents and unsupported prerequisite boundaries. Independent
review found the two false prerequisite rejections described above; both now
have passing regression coverage. A second independent review verified the DMG
fields and caught numerical columns being dropped by the epic milestone repair;
the repair now changes only Special cells, with all levels 21–30 checked for
numeric preservation. Final reviewer recheck found no important defects.

`dmg-source-family35.mjs` adds all 32 DMG records, epic skill continuity,
fixed-versus-chosen skills, specialized Craft and the three additional table
repairs. All-Knowledge regression expectations include psionics.

The full unit suite, integration tests, all 1,054 class lifecycles (2,071 cases),
production build, spell-acquisition browser suite and healing/smite browser
checks passed locally. The build retains its existing bundle-size warning.
These results do not certify unreviewed rules. PR #8 remains draft; no merge
or deployment is part of this content correction.
