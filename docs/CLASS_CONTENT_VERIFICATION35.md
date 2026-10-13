# Class content verification

## Scope and meaning

The catalog contains 1,054 D&D 3.5 class records. Existing import validation,
historical `sourceReview: verified` labels, and passing catalog lifecycle tests
do **not** establish that all rules text, prerequisites, skills, progression
tables, spell lists or feature exceptions are correct. Automation certification
is a separate measure.

The field correction register in
`src/data/class-source-corrections35.json` records exactly which fields were
checked, their sources, and work still outstanding. Its current nine records
are **partial content reviews**, not nine fully verified or completed classes.
Earlier review evidence remains relevant but is not silently promoted into
field-by-field accuracy evidence. Imported `referenceOnly`/enrichment flags are
preserved; they must not be read as this stronger content guarantee.

## Unearthed Arcana corrections — 2026-10-13

| Exact source record | Confirmed extraction problem | Correction |
| --- | --- | --- |
| `classes/bardic-sage-118` | Only “Knowledge” listed as a skill; alignment text omitted allowed alignments | Full Bard skills, including the ten distinct Knowledge skills; 6 + Int points; neutral good, neutral, or neutral evil |
| `classes/divine-bard-121` | No fixed class skill list or skill-point value | Full Bard skills and 6 + Int points |
| `classes/battle-sorcerer-119` | Retained Bluff; undifferentiated Knowledge; missing skill points | Intimidate replaces Bluff; Knowledge (arcana); other Sorcerer skills; 2 + Int points |
| `classes/domain-wizard-122` | No fixed class skill list | Full Wizard skills, including all ten Knowledge skills; 2 + Int points |
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
for the first four records only.
The summaries are not exhaustive feature text or spell lists.

Corrections apply during catalog normalization only when edition source,
category, source ID, name and source book match. Raw imports are preserved.
The reviewed values reach derived skills and normalized stats. Characters
already storing an older embedded definition are not silently migrated by this
change; reselecting/refreshing their catalog definition is a separate concern.

## Still required

- Check complete progression tables and inherited feature text for these nine
  variants against the sources, including replacement and loss rules.
- Verify and represent Bardic Sage/Divine Bard added spell lists, Battle
  Sorcerer spells known, and every arcane-domain list.
- Complete the distinct automation for split casting abilities, alignment
  spell restrictions, bonus divinations, armor casting and domain choices.
  Bardic Sage's three-alignment prerequisite is now accurate reference text
  but still requires manual confirmation in the existing prerequisite evaluator.
- Continue source comparison across the rest of the catalog. The nine partial
  reviews do not establish accuracy of the other 1,045 records.

## Validation

`tests/class-source-corrections35.mjs` first failed on Bardic Sage's truncated
skill list; the second batch failed on Paladin of Freedom's missing list.
It now checks all nine corrected lists, point values, four summaries,
alignment, partial evidence, source isolation and sheet grants at levels
1/10/20. JSON save/reload is stable for corrected definitions.
The test is part of `npm test`.

The full unit suite, all 1,054 class lifecycles (2,063 cases), and production
build passed locally. The build retains its existing bundle-size warning.
These results do not certify unreviewed rules. PR #8 remains draft; no merge
or deployment is part of this content correction.
