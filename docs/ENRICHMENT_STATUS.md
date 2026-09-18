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

The first complete class-catalog audit checked **all 1,054 class records** and initially found 30 failures. After parser/inheritance repairs and provenance-backed fill-only supplements, the strict full-catalog source audit was rerun on 2026-09-18:

- Passed: **1,054**
- Failed: **0**
- Success rate: **100.00%**
- Critical gaps: **0**
- Source-extraction gate: **PASSED**
- Final-output completeness gate: **PASSED FOR 3.5 CLASSES**
- Release ready: **NO**
- Live/catalog writes: **LOCKED**

The permanent focused regression corpus also passes **67 / 67**, including all 30 records from the original full-catalog failure set.

A separate full dry-run candidate was then generated for all **1,054 / 1,054** class records and audited independently:

- Candidate records attempted: **1,054**
- Candidate records generated: **1,054**
- Candidate audit passed: **1,054**
- Candidate audit failed: **0**
- Output success rate: **100.00%**
- Output critical gaps: **0**
- `sourceExtractionVerified: true`
- `outputCompletenessVerified: true`
- `releaseReady: false` because this was intentionally scoped to `3.5/classes`
- Candidate generation reported `write: false`

No enriched class data was written to the bundled catalog during these tests. Both class audits were read-only/non-live, and the global release/write gate remains locked because the other required categories have not passed their own complete source-and-output audits.

## Resolved original 30 class failures

All 30 original full-catalog failures are retained in `scripts/class_regression_cases.json` as permanent regressions. Repairs used general parser/inheritance rules where the source exposed the mechanics, and provenance-backed supplements only where the source page genuinely omitted required structured fields.

The repaired set includes Binder, Bone Collector, Breachgnome, Celebrant of Sharess, Corrupt Avenger, Dreadmaster, Eidolon, Elf Paragon, Expert, Fangshields Barbarian, Fangshields Druid, Fiend of Corruption, Giant-killer, Great Rift Skyguard, Heir of Siberys, Hida Defender, Hordebreaker, Knight of the Iron Glacier, Knight-errant of Silverymoon, Netherese Arcanist, Orc Scout, Outcast Champion, Pixie, Samurai, Shaper of Form, Spellfire Channeler, Spur Lord, Survivor, Warrior Skald, and Wild Scout.

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

The 3.5 class category is now complete under both independent gates:

1. Source extraction: **1,054 / 1,054**, zero critical gaps.
2. Dry-run final candidate output: **1,054 / 1,054**, zero critical gaps.

The 67-record permanent regression corpus must remain green, provenance and supplement-conflict checks must remain enabled, and the class candidate/output audit should remain part of CI.

Do **not** use `--write` and do **not** unlock live/catalog writes. Overall release-readiness remains false because the required non-class categories have not yet completed both independent 100% audits. Work should continue one category at a time rather than treating the completed class audit as permission to enrich the bundled catalog.

## Separate non-enrichment issue

The normal website validation job currently has a browser-editions regression involving an older expectation around a reference spell field. This is separate from the 3.5 class enrichment gate and should be fixed independently.
