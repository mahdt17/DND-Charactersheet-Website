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

## Enrichment source policy

Catalog membership and normal enrichment are anchored to exactly two primary reference sites:

- D&D 3.x / 3.5 content: `https://new.dndtools.org`
- D&D 5e content: `https://dnd5e.wikidot.com`

Do not expand the catalog from unrelated third-party sites. If a record already present in one of those two primary catalogs has missing, truncated, corrupted, contradictory, or otherwise insufficient gameplay data, outside sources may be used only to verify and repair that existing record. Such repairs must be provenance-tracked, fill missing/corrupt information without overriding valid primary-source facts, and be pinned in a permanent regression when the defect could recur.

## Additional category audit progress

The reusable sharded category audit has now also produced complete **source + dry-run output** passes for the currently supported Wikidot 5e reference categories:

- 5e classes: **13 / 13** output records passed, zero critical gaps.
- 5e spells: **574 / 574** output records passed, zero critical gaps.
- 5e feats: **199 / 199** output records passed, zero critical gaps.
- 5e items: **830 / 830** output records passed, zero critical gaps.

These are scoped category passes only. They do not make the global report release-ready and do not unlock writes.

The repaired 3.5 spell source extractor has now passed its complete source gate:

- Source records: **5,035 / 5,035**
- Failed source records: **0**
- Source success rate: **100.00%**
- Source-extraction gate: **PASSED**

The independent 3.5 spell candidate-output gate correctly remains **FAILED**. An earlier baseline full candidate audit reported:

- Candidate records: **5,035**
- Output-complete records: **656**
- Records still requiring reviewed effect summaries: **4,379**
- Output success rate: **13.0288%**
- Critical output gaps: **4,379**

This is expected under the copyright-safe enrichment design: long third-party effect prose is captured for review but is not copied into bundled candidate data. A spell is not output-complete until it has either a sufficiently short factual effect, structured mechanics, or a reviewed concise effect summary whose SHA-256 digest is locked to the exact source effect text. Do not weaken this gate to make the category pass.

The 3.5 item audit has been repaired through the latest known failures. The final remaining source failure was the `Varie` sentinel, which is a generic non-gameplay reference rather than a playable item. It is now modeled explicitly with `nonGameplayReference: true` and `referenceKind: "generic-varied-entry"` instead of fabricating item mechanics. The real catalog record is also pinned in the permanent live item regression corpus. A fresh full item audit is queued from the branch head containing that regression.

## Current 3.5 spell review checkpoint

- Digest-locked reviewed spell effects: **1,340**
- Primary catalog: `https://new.dndtools.org`
- Live/catalog writes: **LOCKED**
- Permanent focused spell regression corpus: **78 / 78 green**
- Outside sources remain repair-only: they may fill an existing primary-catalog record only when its primary material is missing, truncated, corrupted, contradictory, or otherwise insufficient. Valid primary facts are preserved and provenance is recorded. Same-primary printings and official errata are preferred when they can supply the missing mechanic.
- Ordinary reviewed summaries remain SHA-256 locked to the exact primary effect text. Table-driven reviews also lock the captured table digest. Records whose primary prose or tables are genuinely incomplete remain provenance-backed supplements instead of digest-locking bad source material.
- **Reference-dependent spell effects are now strict:** short prose such as “functions like/as …” or “as …, except/but …” no longer counts as standalone-complete merely because it is short. Those records enter the reviewed-summary backlog until the inherited mechanics are resolved into a self-contained effect summary.

### Recent source-completeness repairs

The current permanent regression corpus includes the recent damaged-primary/parser cases that must remain green:

- `Dragonblood Beast` (`spells/dragonblood-beast-4864`): rebuilt primary text drops die values from the bite-damage progression; repaired from the printed *Dragonmarked* progression.
- Spell Compendium `Dragon Ally, Lesser` (`spells/dragon-ally-lesser-4417`): rebuilt primary corrupts the payment unit as “250 fp per HD”; repaired to the printed 250 gp/HD value.
- `Dragonshape` and `Dragonshape, Lesser`: rebuilt pages omit required form/stat-block mechanics; repaired by provenance-backed supplements.
- Spaced class-level parsing was hardened so all listed spell class levels are preserved.
- `Dreaded Form of the Eye Tyrant` (`spells/dreaded-form-of-the-eye-tyrant-873`): rebuilt primary effect is truncated; repaired by supplement.
- `Drown` (`spells/drown-5004`, Dragonlance Campaign Setting): rebuilt primary text truncates after “or begin to drown (see The...” and later resumes near the Concentration rule. The supplement restores the omitted staggered state, immunity for creatures that do not breathe or can breathe water, DC 25 Concentration requirement, and speech/verbal-component restrictions.
- Oriental Adventures `Elemental Burst` (`spells/elemental-burst-2066`): the rebuilt primary page lists “wood, fire, water, stone, or air” even though the same effect supplies metal mechanics and no air mechanics. Official *Oriental Adventures* errata changes the final target element from **air** to **metal**. The record is therefore supplement-backed and permanently regression-tested rather than digest-locking contradictory source prose.

These records remain supplement-backed where the primary source is damaged or contradictory; corrupt source text is **not** accepted as an ordinary digest-locked review.

### Latest authoritative full spell audit

Category Enrichment Audit **#72**, run **35425577685**, audited commit `144e2c2f4f1a77fb64f3386e2e1b38f31c3977b5` with **1,340** digest-locked reviewed summaries, **78** permanent focused spell regressions, and strict reference-dependent effect resolution enabled:

- Samples: **25 / 25**, **50 / 50**, **100 / 100**, **250 / 250** passed.
- Source shards: **8 / 8 passed**.
- Source aggregate: **5,035 / 5,035 passed**, **0 failed**, **100.00%**, **0 critical source gaps**, `coverageErrors: []`.
- Candidate shards: **8 / 8 generated successfully**.
- Candidate merge: **5,035 / 5,035 exact candidate records**, no duplicates, missing IDs, unexpected IDs, or merge errors.
- Candidate/output audit: **1,667 / 5,035 output-complete**, **3,368 incomplete**, **33.1082%** output-complete.
- `criticalMissingCount`: **3,368**.
- `errors`: **empty**.
- `sourceExtractionVerified: true`
- `outputCompletenessVerified: false`
- `releaseReady: false`

The stricter reference-resolution gate intentionally reduced the complete count from the prior non-strict **1,996** to **1,667**. That **329-record decrease is a correction of false-positive completeness**, not lost enrichment data: those short effects depended on another spell/power/maneuver and are now required to have inherited mechanics resolved before they can pass.

The workflow's final `output-audit` job therefore reports **failure by design** because the independent final-output gate remains below 100%. The source gate passed cleanly and was not weakened.

For comparison, recent checkpoints include:

- 1,301 reviews / 77 regressions, pre-strict-reference: **1,976 / 5,035** output-complete, **3,059** incomplete, **39.2453%**.
- 1,320 reviews / 78 regressions, pre-strict-reference: **1,996 / 5,035** output-complete, **3,039** incomplete, **39.6425%**.
- 1,340 reviews / 78 regressions, **strict reference resolution**: **1,667 / 5,035** output-complete, **3,368** incomplete, **33.1082%**.

The next ordinary review queue begins immediately after `spells/energy-ebb-4440`. Same-name and same-family printing differences must remain independent, and cross-referenced base mechanics must be resolved into standalone summaries from the same primary catalog when available.

No catalog enrichment and no `--write` operation has been performed. Supabase remains unchanged.

## Next work

The 3.5 class category is now complete under both independent gates:

1. Source extraction: **1,054 / 1,054**, zero critical gaps.
2. Dry-run final candidate output: **1,054 / 1,054**, zero critical gaps.

The 67-record permanent regression corpus must remain green, provenance and supplement-conflict checks must remain enabled, and the class candidate/output audit should remain part of CI.

Do **not** use `--write` and do **not** unlock live/catalog writes. Overall release-readiness remains false because the required non-class categories have not yet completed both independent 100% audits. Work should continue one category at a time rather than treating the completed class audit as permission to enrich the bundled catalog.

## Validation status

The current 1,340-review / 78-regression strict-reference audit head (`144e2c2f4f1a77fb64f3386e2e1b38f31c3977b5`) passed Validate modernization run `35425579375` end-to-end. The checkpoint is therefore validated while the final spell output-completeness gate remains intentionally locked.
