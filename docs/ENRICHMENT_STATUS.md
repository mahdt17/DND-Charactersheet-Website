# Enrichment status checkpoint

Branch: `codex/content-foundation`  
PR: #4 — Add canonical content foundation  
Live/catalog writes: **LOCKED**

## Current release rule

No live enrichment is allowed until both of these pass:

1. A strict full-catalog source-extraction audit at 100% with zero critical gaps.
2. A separate final-output completeness audit at 100% with zero critical gaps.

The importers are dry-run by default. `--write` is mechanically blocked unless a complete release-ready audit report is supplied.

## 3.5 class audit progress

Strict samples completed successfully:

- 25 / 25
- 50 / 50
- 100 / 100
- 250 / 250

The first complete class-catalog audit then checked **all 1,054 class records**:

- Passed: **1,024**
- Failed: **30**
- Success rate: **97.15%**
- Critical-gap gate: **FAILED** — expected until all 30 are resolved

No enriched class data was written to the bundled catalog during these tests.

## Remaining 30 class failures

| Class | Remaining critical gap |
| --- | --- |
| Binder | prerequisites |
| Bone Collector | classFeatures, classSkills, hit_die, progression, skillPoints |
| Breachgnome | prerequisites |
| Celebrant of Sharess | prerequisites |
| Corrupt Avenger | skillPoints |
| Dreadmaster | skillPoints |
| Eidolon | progression |
| Elf Paragon | hit_die |
| Expert | classSkills |
| Fangshields Barbarian | classSkills |
| Fangshields Druid | classSkills |
| Fiend of Corruption | no structured mechanics on primary page |
| Giant-killer | no structured mechanics on primary page |
| Great Rift Skyguard | prerequisites |
| Heir of Siberys | classSkills |
| Hida Defender | classSkills |
| Hordebreaker | no structured mechanics on primary page |
| Knight of the Iron Glacier | hit_die |
| Knight-errant of Silverymoon | no structured mechanics on primary page |
| Netherese Arcanist | hit_die |
| Orc Scout | no structured mechanics on primary page |
| Outcast Champion | classSkills |
| Pixie | skillPoints |
| Samurai | prerequisites |
| Shaper of Form | classSkills |
| Spellfire Channeler | prerequisites |
| Spur Lord | no structured mechanics on primary page |
| Survivor | classSkills |
| Warrior Skald | prerequisites |
| Wild Scout | no structured mechanics on primary page |

All 30 have been added to `scripts/class_regression_cases.json`.

## Safeguards already implemented

- Canonical content schema and completeness flags.
- Generated summaries are kept separate from genuine source descriptions.
- DnD Tools and Wikidot importers are dry-run by default.
- Page identity and minimum-field validation.
- Gameplay-completeness contracts for classes, feats, spells, and items.
- Source-extraction and final-output gates are distinct.
- `--write` requires a complete 100% release-ready audit report.
- Exact required audit category set is enforced.
- Same-name class sibling fallback.
- Older D&D Tools class mirror fallback for structured facts missing from rebuilt pages.
- Base-class/variant inheritance support.
- Canonical 3.x class-skill tokenizer for concatenated link text.
- Provenance-backed class supplements use fill-only semantics.
- Supplement conflicts with parsed source data fail the audit.
- Permanent regression corpus for every known problematic class.

## Existing supplements

Structured, provenance-backed supplements currently cover specific missing fields for records including:

- Great Sea Corsair
- Warsling Sniper
- Fiend of Blasphemy
- Alchemist Savant
- Exalted Arcanist
- Peregrine Runner
- Agent Retriever
- Legendary Dreadnought
- Berserk
- Moto Avenger
- Nentyar Hunter
- Righteous Zealot
- Spellfire Hierophant
- Stormcaster

Supplements store short factual mechanics only, not copied long-form sourcebook prose.

## Next work

Work only on the remaining 30 3.5 class failures.

Recommended process:

1. Group by failure type.
2. Fix general parser/inheritance rules first.
3. Use supplements only where the primary/legacy source genuinely omits a required fact.
4. Require provenance for every supplemented field.
5. Add every repaired class to the regression suite.
6. Run the focused regression corpus.
7. Run a 250-class audit if parser logic changes broadly.
8. Re-run the full 1,054-class audit.
9. Do not move to another content category until 3.5 classes are 1,054 / 1,054.
10. Do not unlock enrichment writes after source audit alone; the final staged output still needs its own complete audit.

## Separate non-enrichment issue

The normal website validation job currently has a browser-editions regression involving an older expectation around a reference spell field. This is separate from the 3.5 class enrichment gate and should be fixed independently.
