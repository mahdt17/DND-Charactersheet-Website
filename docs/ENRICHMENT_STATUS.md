# Enrichment status checkpoint

Branch: `codex/content-foundation`  
PR: #4 — Add canonical content foundation  
Live/catalog writes: **LOCKED**

## Next classifier correction — exact quantitative condition

- Clean batch 040 head `602b1c65ed82baa370c59e657652ade57a3475fb` passed Spell effect review #259 (`35647739424`) and Validate modernization #822 (`35647743162`).
- Review #259 measured **1,094 remaining**, **3,603 reviews**, **2,006 regressions**, zero errors/warnings/digest drift; all strict/reference/prerequisite/duplicate selectors returned **0 eligible**. Classification artifact `10661321176`, ZIP SHA-256 `3b7ac7ea93b7de2a935eb87dcc0ca66871da79c39bacadbb09be009989c3ae99`.
- Blocker discovery found Rebirth of Iron (`881`) blocked only by the quantitative parenthetical `(as long as at least 1/4 of the object remains)`, which is ordinary condition text rather than a spell dependency.
- This correction excludes only the exact prefix `(as long as at least ...)`. It intentionally does **not** suppress the broader `(as long as ...)` family, so Spider Curse/Spiderform remain fail-closed pending their implicit drider mechanics review. A positive self-test preserves `(as longstrider)` as a spell reference.
- No content is locked by this parser commit. Wait for both CI gates, inspect the fresh strict selector, and independently review any newly eligible record. Live/catalog writes remain locked; no Supabase changes; PR #4 remains open/unmerged.

## Active spell checkpoint — clean batch 040

- Parser commit `bc171a76e454c7941342d09471b5aa84782b262d` passed Spell effect review #258 (`35647248642`) and Validate modernization #821 (`35647256312`).
- Review #258 measured **1,095 remaining**, **3,602 reviews**, **2,005 regressions**, zero errors/warnings/digest drift. The strict selector exposed exactly **1** clean standalone record: Touch of Adamantine (`119`); all other selectors remained **0 eligible**.
- Classification artifact `10660706619`, ZIP SHA-256 `9d74d4447859528213dc28189c45353086ba21a5648b40d47e439c5ee0ba6ec0`.
- Batch `2026-09-21-clean-040.json` locks Touch of Adamantine to primary digest `0c4032de7c87612eab52624c5740b366fe5ac180e4554754f5bc2168f08ffcb6` and adds a permanent regression ID. Its masterwork comparison is retained as ordinary rules prose, not a spell dependency.
- Corpus after this commit: **3,603** summaries / **2,006** permanent regression IDs. Predicted queue after remeasurement: **1,094**; treat that as provisional until both CI gates pass.
- Selector request remains measurement-only. Live/catalog writes remain locked; no Supabase changes; PR #4 remains open/unmerged.

## Next classifier correction — exact non-reference comparison

- Clean batch 039 head `58401054ca5fea6732925e1d7e58a52aa7f495ef` passed Spell effect review #257 (`35646657027`) and Validate modernization #820 (`35646660418`).
- Review #257 measured **1,095 remaining**, **3,602 reviews**, **2,005 regressions**, zero errors/warnings/digest drift; all strict/reference/prerequisite/duplicate selectors were **0 eligible**. Classification artifact `10660581321`, ZIP SHA-256 `57318ca520cf6140db4d134ab281c25d161c533073bebc7d99f25b93db6d4b4b`.
- Blocker discovery found the generic parenthetical detector misclassifying Touch of Adamantine's exact comparison `(as though it was a masterwork weapon)` as a spell reference. Across the current artifact, this exact `though it was` prefix affects only Touch of Adamantine (`119`).
- This correction excludes only `(as though it was ...)`; a positive fail-closed test preserves `(as though by greater teleport)` as a reference-bearing clause. No content is locked by this parser commit.
- Wait for both CI gates, then inspect the fresh strict selector and independently review any newly eligible record. Live/catalog writes remain locked; no Supabase changes; PR #4 remains open/unmerged.

## Active spell checkpoint — clean batch 039

- Classifier commit `b21ed44eba6ea339f99c2de4c8c2e711b3c348fe` passed Spell effect review #256 (`35581099508`) and Validate modernization #819 (`35581104312`).
- Review #256 measured **1,098 remaining**, **3,599 reviews**, **2,002 regressions**, zero errors/warnings/digest drift. The corrected strict selector exposed exactly **3 clean standalone** records; reference, prerequisite, exact-duplicate and near-duplicate selectors remained **0 eligible**.
- Classification artifact `10629449336`, ZIP SHA-256 `955f8fd4db5eb434076c0b5f16e80b06026a250c9d915efd473626386e23e0a5`.
- Batch `2026-09-21-clean-039.json` independently locks Speak With Animals (`2515`), Speak With Plants (`2516`) and Stone Tell (`2518`) to their unchanged primary digests and adds permanent regression IDs. The exact phrase `(as determined by the DM)` is retained as adjudication, not treated as a spell reference.
- Corpus after this commit: **3,602** summaries / **2,005** permanent regression IDs. Predicted queue after remeasurement: **1,095**. Treat that queue value as provisional until both CI gates on this lock commit pass.
- Selector request remains measurement-only. Live/catalog writes remain locked; no Supabase changes; PR #4 remains open/unmerged.

## Next classifier correction — exact DM parenthetical

- Batch 037 head: `fdee502dc41cc65ba7eb9f49f719a3a5adde8bd9`; Validate modernization #818 (`35580638629`) passed all regressions and browser checks.
- Spell effect review #255 (`35580634861`) passed and measured **1,098 remaining**, **3,599 reviews**, **2,002 regressions**, zero errors/warnings/digest drift; strict/reference/prerequisite selectors all **0 eligible**.
- Classification artifact `10629919477`, ZIP SHA-256 `c1849d09a1c1d99fd6aeede12428077291002e65fe5b24fc1b7b52593f57f811`.
- The classifier correction excludes only the complete parenthetical `(as determined by the DM)` from spell-name extraction. Same-prefix larger clauses and actual spell references still fail closed; positive/negative/mixed-clause tests cover both sides.
- Across the entire current artifact, the only changed reference classifications are Speak With Animals (`2515`), Speak With Plants (`2516`) and Stone Tell (`2518`). Fresh primary digests match. These records are not locked by this classifier commit.
- Wait for this commit's Spell effect review and Validate modernization passes; inspect the new strict selection and then independently lock the three self-contained summaries. Request stays in measurement mode.

## Full spell audit — 2026-09-21, parser commit 74c6bee

Category Enrichment Audit #83 (`35580155383`) independently verified:

- All samples (25/50/100/250) and source shards passed; **5,035 / 5,035** source records, zero critical gaps and coverage errors.
- All candidate shards passed; **5,035** unique candidate records. The Effect geometry for both Otiluke sphere records is preserved in candidate output.
- Output audit: **3,935 / 5,035 (78.1529%)** complete; **1,100** incomplete; `errors: []`.
- Source verified: true; output verified: false; release ready: false. The final job fails deliberately at the unchanged 100% output gate.
- Source artifact `10630155946` SHA-256 `b6df7195f1b1c9dd14b67ba3b2926ffa31aa7ef14493ad0929a4463f64352ef6`; output artifact `10630111395` SHA-256 `136358c509698f1bd0571a8a21228dd5ce36823b2d438c9183ccc5bece821eac`.
- This audit predates batch 037. Never substitute its output count for a later lock commit's measurement.

## Active spell checkpoint — batch 037

- Parser/header commit `74c6bee7a8a0f838faa77aa1d64eadfe1797e7d0` passed Spell effect review #254 (`35580155438`) and Validate modernization #817 (`35580159270`), including full regressions and browser tests.
- Review #254 measured **1,100** remaining, **2** eligible references, **0** strict standalone and **0** prerequisite targets. Classification artifact `10629818777`, ZIP SHA-256 `2f801de9dca6db1e545f362fe7b2740a90b4acfcded982001b1ace1a538cac1f`.
- Batch `2026-09-21-reference-037.json` adds **2** digest-locked, self-contained summaries and permanent regression IDs: Portal Alarm, Improved (`4651`, Spell Compendium) and Otiluke's Telekinetic Sphere (`2638`, PHB v.3.5). Both parent digests were independently refetched; geometry, header exceptions, components, saves/SR and all inherited mechanics were checked.
- Corpus after this commit: **3,599** summaries / **2,002** permanent regression IDs. Queue reduction to 1,098 is a prediction until the lock commit's measurement artifact passes.
- Selector is in measurement mode. Require both CI gates on the lock commit before proceeding. Full category audit #83 (`35580155383`) is running on the preceding parser commit; preserve its actual source/output results separately from queue measurements.
- Next high-confidence blocker: the parenthetical reference detector misreads the exact phrase `(as determined by the DM)` as a spell name. A temporary evaluation changes only Speak With Animals (`2515`), Speak With Plants (`2516`), and Stone Tell (`2518`) in the 1,100-record artifact; their primary digests were refetched unchanged. Implement a narrowly scoped exclusion with positive/negative self-tests, pass CI, then independently review each newly eligible record. Do not broadly suppress parentheticals or genuine spell references.
- Manual of the Planes legacy records remain held for verified 3.0 provenance. Live/catalog writes locked; no Supabase changes; PR #4 must remain open/unmerged.

## Resume checkpoint — 2026-09-21

- Verified incoming head: `f50ad5a1d03a213e7c1229a86afe71836df0355b`; PR #4 open, unmerged, mergeable.
- Incoming CI: Spell effect review #253 (`35571808946`) and Validate modernization #816 (`35571813689`) passed.
- Classification artifact `10626465973`: SHA-256 `2ecebfa12420ee76a1228256651297e79a5bf7edf54e1ec9d44dc26c64bf6bc5`.
- Authoritative incoming queue: **1,100**; reviewed summaries **3,597**; permanent spell regression IDs **2,000**; supplements **83**; corpus errors/warnings/digest overlap **0**.
- Buckets: 997 reference-dependent, 62 repair, 41 table-driven. Strict/prerequisite selectors: 0 eligible. Incoming reference selector: 3 eligible.
- New review-integrity change: preserve the source Effect header as `effectGeometry` in parsed candidates, review exports, dependency packets, and header comparisons. Positive and negative self-tests keep header geometry separate from required effect mechanics.
- Hold `spells/portal-alarm-improved-1849` (Manual of the Planes) for explicit 3.0 provenance review; it must not be accepted as a 3.5 reference merely because DnDTools labels its site 3.5. Legacy selector exclusion added; no edition or mechanics are silently rewritten.
- Next verified candidates: Spell Compendium `spells/portal-alarm-improved-4651` -> same-book `spells/portal-alarm-4649`; PHB v.3.5 `spells/otilukes-telekinetic-sphere-2638` -> `spells/otilukes-resilient-sphere-2637`. Fresh primary fetches matched all four artifact effect digests. No new locks yet.
- Selector reset to measurement mode. Require both CI workflows to pass and inspect the new artifact before locking. A full 3.5 spell category source/candidate-output audit is requested for this parser change; output completeness is expected to remain below 100% while the queue is nonempty.
- Preserve the 16-shard spell review workflow, permanent regression order, repair-component protections, and Tome and Blood 3.0 provenance. PR stays open; live/catalog and Supabase writes remain prohibited.

Older checkpoints below are historical, not current queue measurements.

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

- Digest-locked reviewed spell effects: **2,554**
- Primary catalog: `https://new.dndtools.org`
- Live/catalog writes: **LOCKED**
- Permanent focused spell regression corpus: **889 / 889 green**
- Latest review-only classifier checkpoint: Spell effect review **#47**, run **35470886781**, on commit `8d67dd2e7bd3b20655a168d9cf0d089ca872fba1`.
- Remaining review queue: **2,143**; clean standalone long effects: **985**; reference-dependent primary bucket: **1,036**; manual-verification tag count: **890**.
- Known corpus at that checkpoint: **2,554 reviews / 889 regressions / 80 supplements**, with **0 digest drift**, **0 errors**, and **0 warnings**.
- The next strict-clean selector produced **100 / 973 eligible** candidates with selection SHA-256 `fa2cc5c3635804454a96d5472ee0eaf377e6a54ef00a3f272fe509fc9195a778`.
- Validate modernization **#550**, run **35470889209**, passed end-to-end on batch-eight commit `8d67dd2e7bd3b20655a168d9cf0d089ca872fba1`, including all **889** spell regressions and browser tests.
- Expensive all-category audits remain periodic milestone checks rather than running after every 100-record review batch; this does not relax the final 100% release/write gate.
- Outside sources remain repair-only: they may fill an existing primary-catalog record only when its primary material is missing, truncated, corrupted, contradictory, delegated outside the spell page, or otherwise insufficient. Valid primary facts are preserved and provenance is recorded. Same-primary printings and official errata are preferred when they can supply the missing mechanic.
- Ordinary reviewed summaries remain SHA-256 locked to the exact primary effect text. Table-driven reviews also lock the captured table digest. Records whose primary prose or tables are genuinely incomplete remain provenance-backed supplements instead of digest-locking bad source material.
- **Reference-dependent spell effects remain strict:** short prose such as “functions like/as …” or “as …, except/but …” does not count as standalone-complete until inherited mechanics are resolved into a self-contained reviewed effect summary. Generic rules language such as “functions as a splash weapon” and ordinary “functions as if …” phrasing is excluded from this detector so those clauses are not falsely treated as spell references.

### Recent source-completeness repairs

The current permanent regression corpus includes the damaged-primary/parser cases that must remain green:

- `Dragonblood Beast` (`spells/dragonblood-beast-4864`): rebuilt primary text drops die values from the bite-damage progression; repaired from the printed *Dragonmarked* progression.
- Spell Compendium `Dragon Ally, Lesser` (`spells/dragon-ally-lesser-4417`): rebuilt primary corrupts the payment unit as “250 fp per HD”; repaired to the printed 250 gp/HD value.
- `Dragonshape` and `Dragonshape, Lesser`: rebuilt pages omit required form/stat-block mechanics; repaired by provenance-backed supplements.
- Spaced class-level parsing was hardened so all listed spell class levels are preserved.
- `Dreaded Form of the Eye Tyrant` (`spells/dreaded-form-of-the-eye-tyrant-873`): rebuilt primary effect is truncated; repaired by supplement.
- `Drown` (`spells/drown-5004`, Dragonlance Campaign Setting): rebuilt primary text truncates after “or begin to drown (see The...” and later resumes near the Concentration rule. The supplement restores the omitted staggered state, immunity for creatures that do not breathe or can breathe water, DC 25 Concentration requirement, and speech/verbal-component restrictions.
- Oriental Adventures `Elemental Burst` (`spells/elemental-burst-2066`): the rebuilt primary page lists “wood, fire, water, stone, or air” even though the same effect supplies metal mechanics and no air mechanics. Official *Oriental Adventures* errata changes the final target element from **air** to **metal**.
- `Enlarge Person` (`spells/enlarge-person-2805`): the rebuilt Player's Handbook effect corrupts/truncates the equipment paragraph; the supplement restores the missing equipment, size-stacking, reduce person, and permanency mechanics.
- `Evil Weather` (`spells/evil-weather-139`): the spell page delegates its actual weather mechanics to Chapter 2 instead of including them. The supplement restores the five weather modes from the same *Book of Vile Darkness* source and preserves the spell-specific radius, duration, corruption cost, and violet-rain costs.
- `Extract Drug` (`spells/extract-drug-140`): the rebuilt spell table corrupts the air/wood rows. A source-incomplete-only table replacement restores **Mordayn vapor** for air and **Mushroom powder** for wood plus the correct focus effects. Spell supplements may replace parsed tables only when the exact record is already flagged source-incomplete and the supplement explicitly resolves that defect.
- Miniatures Handbook `Favorable Sacrifice` (`spells/favorable-sacrifice-1942`): the rebuilt primary record mixes the later *Spell Compendium* 250/1,000/10,000 gp benefit tiers into the earlier printing while retaining the original 1,000/5,000/25,000 gp material-cost line. The record is now flagged source-incomplete and repaired from the printed *Miniatures Handbook* table: the three sacrifice tiers grant DR / five-energy resistance / spell resistance of **10 / 10 / 10**, **15 / 15 / 15**, and **20 / 20 / 20** respectively.

These records remain supplement-backed where the primary spell page is damaged, contradictory, or not self-contained; corrupt source text is **not** accepted as an ordinary digest-locked review.

### Latest authoritative full spell audit

Category Enrichment Audit **#77**, run **35429119970**, audited commit `6f50ffaa75e59884fdd5a29fe9cf7a4373c3e667` with **1,489** digest-locked reviewed summaries and **82** permanent focused spell regressions:

- Samples: **25 / 25**, **50 / 50**, **100 / 100**, **250 / 250** passed.
- Source shards: **8 / 8 passed**.
- Source aggregate: **5,035 / 5,035 passed**, **0 failed**, **100.00%**, **0 critical source gaps**.
- Candidate shards: **8 / 8 generated successfully**.
- Candidate merge: **5,035 / 5,035 exact candidate records**, no duplicates, missing IDs, unexpected IDs, or merge errors.
- Candidate/output audit: **1,820 / 5,035 output-complete**, **3,215 incomplete**, **36.1470%** output-complete.
- `criticalMissingCount`: **3,215**.
- `errors`: **empty**.
- `sourceExtractionVerified: true`
- `outputCompletenessVerified: false`
- `releaseReady: false`

The workflow's final `output-audit` job therefore reports **failure by design** because the independent final-output gate remains below 100%. The source and candidate-integrity gates passed cleanly and were not weakened.

For comparison, recent strict-reference checkpoints include:

- 1,340 reviews / 78 regressions: **1,667 / 5,035** output-complete, **3,368** incomplete, **33.1082%**.
- 1,359 reviews / 79 regressions: **1,686 / 5,035** output-complete, **3,349** incomplete, **33.4856%**.
- 1,398 reviews / 79 regressions: **1,726 / 5,035** output-complete, **3,309** incomplete, **34.2800%**.
- 1,438 reviews / 81 regressions: **1,768 / 5,035** output-complete, **3,267** incomplete, **35.1142%**.
- 1,456 reviews / 81 regressions: **1,786 / 5,035** output-complete, **3,249** incomplete, **35.4717%**.
- 1,489 reviews / 82 regressions: **1,820 / 5,035** output-complete, **3,215** incomplete, **36.1470%**.

The resumed ordinary queue after the 1,438 checkpoint advanced through the first post-`Extract Drug` records and then into the F-section. Cross-referenced mechanics were resolved through targeted primary-catalog exports rather than leaving pointer-only summaries. The earliest held long-effect record in catalog order is now `spells/fantastic-machine-4478` (`Fantastic Machine, Greater`), whose inherited `Fantastic Machine` mechanics must be folded into a standalone summary before proceeding. Same-name and same-family printing differences remain independent, and damaged-primary records continue to be diverted to provenance-backed supplements instead of digest-locking bad source text.

No catalog enrichment and no `--write` operation has been performed. Supabase remains unchanged.

## Next work

The 3.5 class category is now complete under both independent gates:

1. Source extraction: **1,054 / 1,054**, zero critical gaps.
2. Dry-run final candidate output: **1,054 / 1,054**, zero critical gaps.

The 67-record permanent regression corpus must remain green, provenance and supplement-conflict checks must remain enabled, and the class candidate/output audit should remain part of CI.

Do **not** use `--write` and do **not** unlock live/catalog writes. Overall release-readiness remains false because the required non-class categories have not yet completed both independent 100% audits. Work should continue one category at a time rather than treating the completed class audit as permission to enrich the bundled catalog.

## Validation status

The current 1,489-review / 82-regression audit head (`6f50ffaa75e59884fdd5a29fe9cf7a4373c3e667`) passed Validate modernization run `35429122461` (#399) end-to-end. Category Enrichment Audit #77 (run `35429119970`) independently confirmed 5,035 / 5,035 source and candidate integrity with `errors: []`; only the intentionally strict final spell output-completeness gate remains failed at 1,820 / 5,035.
