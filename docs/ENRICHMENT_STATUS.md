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

- Digest-locked reviewed spell effects: **1,046**
- Primary catalog: `https://new.dndtools.org`
- Outside sources are allowed only when the primary record is missing, truncated, corrupted, contradictory, or otherwise insufficient; such repairs must retain provenance and must not expand catalog membership.
- Primary-page repairs pinned during this review cycle include `Analyze Portal`, `Anathema`, `Arboreal Transformation`, the truncated Defenders of the Faith printing of `Aspect of the Deity, Greater`, and `Blessing of the Snake Mother`.
- The spell parser retains structured spell tables, and spell review exports include those tables so table-driven mechanics are not silently lost.
- The parser now also flags spells that explicitly reference a missing table when no structured table was captured. The Magic of Faerûn `Celebration` record was repaired from its sourcebook table and pinned as a regression.
- `City's Might` from Races of Destiny was also treated as an incomplete-primary record because the primary page omits its settlement-size scaling values; the verified scaling was added as a provenance-backed supplement and pinned as a regression.
- The Expedition to Undermountain `Cloak of Dark Power` record was found truncated mid-effect; it is repaired using the complete Spell Compendium printing already present on the same primary `new.dndtools.org` catalog, with the truncation explicitly detected.
- `Crumble` (`spells/crumble-1748`) was found to omit its caster-level target-size table. The matching 1d6/level printing on the same primary catalog (`spells/crumble-740`) supplies the missing Huge/Gargantuan/Colossal thresholds; the repair is provenance-backed and regression-pinned.
- Full audit at the 263-review checkpoint: **5,035 total / 900 output-complete / 4,135 incomplete**, **17.8749%** output-complete.
- Full audit at the 423-review checkpoint: **5,035 total / 1,061 output-complete / 3,974 incomplete**, **21.0725%** output-complete.
- Full audit at the 547-review checkpoint: **5,035 total / 1,185 output-complete / 3,850 incomplete**, **23.5353%** output-complete. The remaining critical gaps are the expected unresolved `effect/effectSummary` backlog; no new failure class appeared.
- Full audit at the 827-review checkpoint: **5,035 total / 1,479 output-complete / 3,556 incomplete**, **29.3744%** output-complete. All source shards passed; the only remaining audit failure class was the expected unresolved `effect/effectSummary` backlog.
- The 423-review audit restored the source gate to **5,035 / 5,035, zero failures** after a prior 323-review audit was falsely interrupted by a transient `RemoteDisconnected` on `Shadow Double`. The fetcher now retries `RemoteDisconnected` and `ConnectionResetError` alongside HTTP 429/5xx and timeout failures.
- The 423-review output audit's remaining critical gaps are the expected unresolved `effect/effectSummary` review backlog; no new critical failure class appeared.
- Four table-driven `Bolt of Glory` records were deliberately deferred from the normal review count until exact table mechanics could be recovered rather than guessed. Their variants have now been independently verified, and a fresh table-aware primary review export is being generated before they are committed.
- The 707-review full source audit exposed **14 table-reference cases** after the stronger missing-table guard was introduced: **12 genuine missing-table omissions** and **2 false positives** whose complete tables were already flattened into primary-page prose (`Channel the Dragon` and `Random Action`). The 12 genuine omissions now have provenance-backed fill-only supplements; all 14 cases are pinned in the permanent spell regression corpus.
- Previous 966-review scoped audit: source **5,035 / 5,035**; candidate output **1,620 / 5,035 complete / 3,415 incomplete**, **32.1748%** output-complete.
- While advancing beyond that checkpoint, review of `Detect Aberration` exposed a source-audit blind spot: some rebuilt primary pages referred to required tables as an **"accompanying table"**, **"see the table"**, **"as shown on the table"**, or by a **"Length Aura Lingers"** heading rather than the phrases already guarded by the parser. A full scan of the table-aware long-effect review corpus isolated seven genuine omissions: `Detect Aberration`, `Detect Dragonblood`, `Detect Incarnum`, both `Detect Taint` printings, `Freeze Armor`, and `Prismatic Wall`. The detector now covers those reference forms; the seven existing primary-catalog records have provenance-backed fill-only supplements, and all seven are permanently regression-pinned. `Prismatic Wall` also has an explicit corruption marker for its truncated raw table markup.
- `Deific Bastion` is also regression-pinned because both the primary page and the printed source omit a separate enhancement value for 17th caster level. The reviewed summary preserves the literal +4 at 15th–16th and +5 at 18th+ brackets and explicitly leaves 17th unspecified instead of inferring a value.
- **Authoritative 1,026-review audit after those repairs:** Category Enrichment Audit run **35415467603**, audited commit `636a74c56b60f135360c1a9e1ca59d1a81f1b474`. All 8 source shards and `source-aggregate` passed: **5,035 / 5,035**, **0 failed**, **100.00%**, **0 critical source gaps**. All 8 candidate shards passed generation; the independent output audit reported **1,687 / 5,035 output-complete / 3,348 incomplete**, **33.5055%** output-complete. `errors` was empty and sampled incomplete records still contained only the expected `effect` / `effectSummary` backlog. The top-level audit therefore correctly remains failed because output completeness is below 100%; the gate was not weakened.
- The exact repaired 1,026 audit head also passed **Validate modernization** run **35415470538** end-to-end.
- Review of the next queue then exposed one additional genuine primary-page table omission: `Detect Ship` (`spells/detect-ship-3339`) ends immediately after introducing its visible-ship Profession (sailor) information table. The exact DC/result rows were restored from *Stormwrack* as a provenance-backed fill-only supplement, an explicit parser marker was added, and the record is permanently regression-pinned rather than digest-locking incomplete prose.
- **Authoritative 1,046-review audit after the Detect Ship repair:** Category Enrichment Audit run **35416189035**, audited commit `c0799944c0ff7d86cf1329a27c693501542956aa`. Samples 25/50/100/250 all passed; all 8 source shards and `source-aggregate` passed: **5,035 / 5,035**, **0 failed**, **100.00%**, **0 critical source gaps**. All 8 candidate shards passed generation; the independent output audit reported **1,708 / 5,035 output-complete / 3,327 incomplete**, **33.9225%** output-complete. `errors` was empty and sampled incomplete records still contained only `effect` / `effectSummary`. The top-level audit correctly remains failed because output completeness is below 100%; the final gate was not weakened.
- The exact 1,046 audit head passed **Validate modernization** run **35416191208** end-to-end. The permanent spell regression corpus now contains **63** focused records.
- The seven earlier table/corruption repairs plus `Detect Ship` remain supplement-backed rather than digest-locking incomplete/corrupted primary prose.
- Live/catalog writes remain locked.

## Next work

The 3.5 class category is now complete under both independent gates:

1. Source extraction: **1,054 / 1,054**, zero critical gaps.
2. Dry-run final candidate output: **1,054 / 1,054**, zero critical gaps.

The 67-record permanent regression corpus must remain green, provenance and supplement-conflict checks must remain enabled, and the class candidate/output audit should remain part of CI.

Do **not** use `--write` and do **not** unlock live/catalog writes. Overall release-readiness remains false because the required non-class categories have not yet completed both independent 100% audits. Work should continue one category at a time rather than treating the completed class audit as permission to enrich the bundled catalog.

## Validation status

The repaired 1,026-review audit head (`636a74c56b60f135360c1a9e1ca59d1a81f1b474`) passed Validate modernization run `35415470538` end-to-end, including the browser suites. The previously noted browser-editions regression is therefore no longer a current blocker.
