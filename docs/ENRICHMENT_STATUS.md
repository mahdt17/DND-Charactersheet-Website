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

- Digest-locked reviewed spell effects: **1,185**
- Primary catalog: `https://new.dndtools.org`
- Live/catalog writes: **LOCKED**
- Permanent focused spell regression corpus: **70 / 70 green** on the 1,185-review validation head.
- Outside sources remain repair-only: they may fill an existing primary-catalog record only when its primary material is missing, truncated, corrupted, contradictory, or otherwise insufficient. Valid primary facts are preserved and provenance is recorded. Same-primary printings are preferred when they can supply the missing mechanic.
- Ordinary reviewed summaries remain SHA-256 locked to the exact primary effect text. Table-driven reviews also lock the captured table digest. Records whose primary prose or tables are genuinely incomplete remain provenance-backed supplements instead of digest-locking bad source material.

### Recent source-completeness repairs

Review beyond the earlier 966 checkpoint exposed several source-page omissions that were not detectable by the original narrow “table below” guard. The parser and permanent regressions now cover the following additional cases:

- `Detect Aberration`, `Detect Dragonblood`, `Detect Incarnum`, both `Detect Taint` printings, `Freeze Armor`, and `Prismatic Wall`: missing tables referenced with wording such as “accompanying table,” “see the table,” “as shown on the table,” or lingering-aura headings.
- `Deific Bastion`: the primary page and printed source both omit a separate 17th-caster-level enhancement bracket. The review preserves the literal +4 at 15th–16th and +5 at 18th+ and explicitly leaves 17th unspecified instead of inferring a value.
- `Detect Ship`: rebuilt primary prose ends after introducing the visible-ship Profession (sailor) information table. The verified DC/result rows are restored by supplement.
- `Sandform`: rebuilt primary prose omits the caster-size slam-damage table.
- `Standing Wave`: the Masters of the Wild printing omits its caster-level/maximum-size table; matching thresholds were restored from a same-primary printing.
- `Word of Balance`: the Underdark printing omits its Hit-Dice/effect threshold table; matching thresholds were restored from a same-primary Spell Compendium printing.
- `Know Greatest Enemy`: the Magic of Faerûn printing omits its CR/strength table; matching thresholds were restored from a same-primary printing.
- Libris Mortis `Summon Undead I`: its 1st-level summon list is omitted by the rebuilt page. The exact older-printing list—Medium skeleton or Small zombie—was restored without importing later revision mechanics.
- Ghostwalk `Weapon of the Deity`: its deity-specific favored-weapon property list is omitted by the rebuilt page. The exact Ghostwalk table was restored rather than normalizing to later printings.
- `Doom of the Seas` (`spells/doom-of-the-seas-3332`): the rebuilt primary page says a creature statistics block follows but omits that block. The omitted *Stormwrack* Doom of the Seas / half-fiend kraken statistics are restored by a provenance-backed supplement while retaining the primary spell's own summoning, obedience, duration, and 500 XP-cost rules. This record remains **supplement-backed only** and is not digest-locked to the corrupt primary effect text.

These records are supplement-backed and regression-pinned as appropriate; corrupt/incomplete source prose is **not** treated as a trustworthy ordinary digest-locked effect.

### Latest authoritative full spell audit

Category Enrichment Audit run **35417846309** audited commit `0ad5b31e7d642892be09e7e9ccad12845f10d1b8` with **1,185** digest-locked reviewed summaries and all **70** focused source regressions active:

- Samples: **25 / 25**, **50 / 50**, **100 / 100**, **250 / 250** passed.
- Source shards: **8 / 8 passed**.
- Source aggregate: **5,035 / 5,035 passed**, **0 failed**, **100.00%**, **0 critical source gaps**.
- Candidate shards: **8 / 8 generated successfully**.
- Candidate/output audit: **1,854 / 5,035 output-complete**, **3,181 incomplete**, **36.8222%** output-complete.
- `criticalMissingCount`: **3,181**.
- `errors`: **empty**.
- Sampled incomplete records contain only the expected missing `effect` / `effectSummary` backlog.
- `sourceExtractionVerified: true`
- `outputCompletenessVerified: false`
- `releaseReady: false`

The workflow's final `output-audit` job therefore reports **failure by design** because the independent final-output gate remains below 100%. The strengthened source gate passed cleanly and was not weakened.

For comparison, earlier authoritative checkpoints included:

- 966 reviews: **1,620 / 5,035** output-complete, **3,415** incomplete, **32.1748%**.
- 1,026 reviews: **1,687 / 5,035** output-complete, **3,348** incomplete, **33.5055%**.
- 1,046 reviews: **1,714 / 5,035** output-complete, **3,321** incomplete, **34.0417%**.
- 1,106 reviews: **1,774 / 5,035** output-complete, **3,261** incomplete, **35.2334%**.
- 1,185 reviews: **1,854 / 5,035** output-complete, **3,181** incomplete, **36.8222%**.

Validate modernization run **35417848494** passed end-to-end on the 1,185-review/Doom-repair audit head, including all spell regressions, enrichment self-tests, the mechanical write gate, build, and browser suites.

No catalog enrichment and no `--write` operation has been performed. Supabase remains unchanged.

## Next work

The 3.5 class category is now complete under both independent gates:

1. Source extraction: **1,054 / 1,054**, zero critical gaps.
2. Dry-run final candidate output: **1,054 / 1,054**, zero critical gaps.

The 67-record permanent regression corpus must remain green, provenance and supplement-conflict checks must remain enabled, and the class candidate/output audit should remain part of CI.

Do **not** use `--write` and do **not** unlock live/catalog writes. Overall release-readiness remains false because the required non-class categories have not yet completed both independent 100% audits. Work should continue one category at a time rather than treating the completed class audit as permission to enrich the bundled catalog.

## Validation status

The repaired 1,026-review audit head (`636a74c56b60f135360c1a9e1ca59d1a81f1b474`) passed Validate modernization run `35415470538` end-to-end, including the browser suites. The previously noted browser-editions regression is therefore no longer a current blocker.
