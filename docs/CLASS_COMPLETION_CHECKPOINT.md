# 3.5 Class Completion Checkpoint

Updated: 2026-09-29 (America/New_York)

## Current state

- Repository: `mahdt17/DND-Charactersheet-Website`
- Branch: `codex/class-integration-engine`
- Pull request: #8 — keep open, draft, and unmerged.
- Last fully validated functional SHA: `174e6a1d8e9e72d9522aa2a0da6aae08c38ba744`
- Full validation: [Validate modernization #1403](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36609989469) — **passed**
- Supabase: unchanged.
- Deploy/merge: not performed.

## Revised bulk-audit rules now in force

- All **1,054 exact class source IDs remain independent**.
- Same-name classes never inherit mechanics merely because their names match.
- Matching catalog fingerprints are candidates only; source verification is still required before any inheritance.
- Self-contained user-facing descriptions are mandatory for reviewed class features and feats.
- `scripts/audit_source_identity_and_descriptions.py` runs in modernization CI and fails if a reviewed summary still delegates core mechanics with unresolved wording such as “functions as” or “identical to”.
- Unreviewed cross-reference descriptions remain queued rather than being silently treated as complete.

## Completed exact-source records at this checkpoint

- `classes/aristocrat-31` — **Aristocrat (Dungeon Master's Guide v.3.5)** — complete.
- `classes/commoner-32` — **Commoner (Dungeon Master's Guide v.3.5)** — complete.
- `classes/warrior-34` — **Warrior (Dungeon Master's Guide v.3.5)** — complete.
- `classes/expert-33` — **Expert (Dungeon Master's Guide v.3.5)** — complete.
- `classes/thug-132` — **Thug (Unearthed Arcana p. 51)** — complete.
- `classes/wilderness-rogue-136` — **Wilderness Rogue (Unearthed Arcana p. 56)** — complete.
  - Exact Rogue baseline retention and the five-for-five class-skill replacement are source-owned.
  - Woodland Stride, Camouflage, and Hide in Plain Sight are added to the Rogue Special Ability choice set at the normal 10/13/16/19 unlocks.
  - Hide in Plain Sight is fail-closed until Camouflage has already been selected.
  - The three Ranger-derived selections materialize complete standalone mechanics with referenced-source provenance; no “as the ranger ability” placeholder remains.
  - Save/reopen, exact training/skills, invalid prerequisite, level 19, and multiclass source-removal regressions are preserved.
  - Full source audit, unit/regression/build/browser validation passed #1401.
- `classes/fighter-variant-953` — **Fighter Variant (Unearthed Arcana p. 58)** — complete.
  - Binds specifically to `classes/fighter-93`, removes Fighter bonus feats, and grants source-owned Rogue Sneak Attack at levels 1/3/5/7/9/11/13/15/17/19.
  - Exact training, standalone description/provenance, and source-removal lifecycle are regression-locked.
- `classes/rogue-variant-958` — **Rogue Variant (Unearthed Arcana p. 58)** — complete.
  - Binds specifically to `classes/rogue-97`, removes Sneak Attack, and grants Fighter-list bonus-feat choices at 1/2/4/6/8/10/12/14/16/18/20.
  - Strict option filtering, save/reopen persistence, materialized selected feats, and source-removal lifecycle are regression-locked.
- `classes/wizard-variant-959` — **Wizard Variant (Unearthed Arcana p. 59)** — complete.
  - Binds specifically to `classes/wizard-99`, removes Scribe Scroll/normal Wizard bonus-feat progression, and grants Fighter-list bonus feats at 1/5/10/15/20.
  - Wizard spellcasting and Familiar retention, strict option filtering, persistence, and source-removal lifecycle are regression-locked.
  - Full source audit, unit/regression/build/browser validation for the three-variant batch passed #1401.
- `classes/ranger-variant-956` — **Ranger Variant (Unearthed Arcana p. 58)** — complete.
  - Binds specifically to `classes/ranger-96` and removes Combat Style, Improved Combat Style, and Combat Style Mastery only.
  - Gains source-owned Barbarian Fast Movement plus Druid Wild Shape restricted permanently to familiar Small or Medium animals.
  - Wild Shape is a Standard action and scales from 1/day at 5th level to 6/day at 18th without importing Druid size, plant, or elemental expansions.
  - Retained Ranger training/baseline mechanics, standalone descriptions/provenance, and source-removal cleanup are regression-locked.
  - Full source audit, unit/regression/build/browser validation passed #1403.

## Same-name records deliberately NOT inherited

- `classes/commoner-24` — Commoner (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only an “Also appears in: DMG” pointer.
- `classes/warrior-28` — Warrior (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only “Also appears in” pointers.
- These remain independent until their exact Dragonlance mechanics can be verified.

## Bulk audit findings

- Class inventory: **1,054 exact source IDs**.
- Same-name scan: **107 groups covering 236 records**; name-based inheritance is not proof of equivalence.
- Of those same-name groups, the bulk audit found **92 with structured mechanical differences**.
- Tracker totals now: **17 complete**, **2 blocked**; all remaining records retain individual audit states.
- Current direct-summary count is **50** and remains a coverage metric only, never a completion count.
- The next exact Unearthed Arcana p.58 records have been independently source-reviewed for batching; cross-class replacements are being split by implementation risk instead of being assumed equivalent.

## Description-quality queue

- The exact-source description audit remains active in CI.
- Reviewed summaries that still delegate core mechanics via unresolved “functions as / same as / see…” wording fail the audit.
- Cross-reference-heavy Unearthed Arcana variants are not considered complete until referenced mechanics are expanded into standalone descriptions with both source identities preserved.
- Unreviewed candidates remain queued for exact-source resolution rather than being silently accepted.

## Reusable variant mechanisms now validated

- Exact variants can suppress inherited feature events at source-defined levels.
- Exact variants can override inherited feature choice pools.
- Source choices can enforce option prerequisites and materialize the selected mechanic rather than only saving a label.
- Selected cross-referenced mechanics can preserve both the variant source and referenced-mechanic provenance.
- Intentionally empty post-suppression grant lists do not fall back and resurrect parent features.
- Derived features retain exact choice option lists through sheet reconciliation.

## Next work

- Ranger Variant is complete and fully validated; do not redo it.
- Monk Variant implementation is now on the branch pending validation: exact Monk parent binding, Wisdom-only unarmored AC, no Monk Fast Movement, Barbarian DR 1/- through 5/-, and source-removal coverage.
- Live source re-verification on 2026-09-29 confirms the exact UA p.58 exchange: `https://new.dndtools.org/classes/monk-variant-954` retains Wisdom-to-AC while losing the level-based unarmored AC bonus and enhancement speed; the referenced SRD Barbarian DR progression is 1/- at 7th, 2/- at 10th, 3/- at 13th, 4/- at 16th, and 5/- at 19th.
- The 3.5 AC calculator now distinguishes 3.5 Monk/Monk Variant from 5e-style Barbarian/Monk unarmored-defense rules; validate this before promoting Monk Variant.
- Shared Favored Enemy automation is now implemented on the branch: exact Ranger options, unique new-enemy selection, and the separate +2 bonus-allocation choice at 5th/10th/15th/20th are persisted and regression-covered.
- Barbarian Variant, Paladin Variant, and Druid Variant now consume that shared Favored Enemy path with exact source restrictions and source-removal coverage; all three remain pending full validation and must not be promoted to complete until CI passes.
- Barbarian Variant also materializes its fixed Archery progression as Rapid Shot, Manyshot, and Improved Precise Shot class-granted feats.
- Druid Variant now has weapon-only Druid training, no Wild Shape, Monk-style unarmored AC/Fast Movement, Ranger Swift Tracker/Track, and 3.5-specific AC calculator support.
- Companion/Favored Enemy variant batch is fully validated on #1433 at `af619352c1ee2b4ce67be94964273a97573f41fe`: Monk Variant, Barbarian Variant, Paladin Variant, Druid Variant, Bard Variant, and Sorcerer/Wizard Variant are complete.
- Animal Companion automation is regression-locked for Druid, Bard Variant, and Sorcerer/Wizard Variant, including exact parent IDs, guided selection, half-level scaling where required, alternative-companion penalties, persistence, and source-removal cleanup.
- Cleric Variant is complete after full validation #1435 at `6f3f95b0853a79d9e17240720af7598732d6ade9`: exact Cleric parent, retained domain choice, no Turn/Rebuke Undead, positive/negative-energy Smite polarity with Paladin scaling, Aura of Courage, persistence, removal, and browser coverage.
- Abjurer Variant (UA p.59) is now implemented pending full validation: exact `classes/wizard-99` parent fixed to Abjuration specialization, two prohibited schools required, no Familiar, no later Wizard bonus feats, no specialist bonus spell slot, and source-owned Resistance to Energy, Aura of Protection, and Spontaneous Dispelling.
- The self-contained-description audit remains active; reviewed descriptions must stay standalone and exact-source-owned.

## 2026-09-29 reprint/training checkpoint

- Green validation baseline: #1461 at `831c5f7ffc0bd92e2c50d1055919c1e432c81833`.
- Complete Warrior Samurai is complete after exact starting-training verification and existing level 1-20 mechanics regressions.
- Cloistered Cleric starting training is verified, but completion remains blocked on shared Cleric domain granted-power/deity automation.
- 28 source-equivalent published-appearance records were processed through the existing parent-equivalence invariant: 12 complete-parent reprints promoted; 16 incomplete-parent reprints moved to explicit `needs-review` with inherited blockers.
- Current canonical tracker totals: **42 complete / 45 needs-review / 1 source-conflict / 2 blocked / 964 pending audit / 1054 total**.

## 2026-09-29 Advanced Learning checkpoint

- Green validation baseline: #1476 at `d7bc51975028f8788157c72268472e74d880c7bb`.
- Beguiler and Warmage promoted to complete after source-restricted Advanced Learning choices became permanent class-scoped spell-access grants.
- The level-up UI now supplies the 3.5 spell reference index to class-feature planning and final application, matching the unit-tested integration path.
- Dread Necromancer Advanced Learning is fixed; only evil-familiar companion state remains before promotion.
- Current tracker totals: **44 complete / 43 needs-review / 1 source-conflict / 2 blocked / 964 pending audit / 1054 total**.

## 2026-09-29 profiled 8-class source-audit checkpoint

- Green baseline before audit: #1477 at `b61de4ef934f46c4905a78a68cba2001b92c3b3b`.
- Eight profiled pending classes were source-reviewed and moved to explicit `needs-review` with class-specific blockers; none were promoted on source completeness alone.
- Heavy subsystem blockers are preserved explicitly for Death Master (spellbook/minion/template), Spellthief (stolen-magic state), and Jester (performance/spells-known), while the racial paragons and Battle Dancer/Noble have narrower structured-state work.
- Current tracker totals: **44 complete / 51 needs-review / 1 source-conflict / 2 blocked / 956 pending audit / 1054 total**.

## 2026-09-29/30 profiled 22-class checkpoint

- Green validation baseline: #1479 at `538c6832cc5aa6b3d664f6d4a16f6ae2e29d4747`.
- Source-audited 22 profiled base classes with Exa discovery + Tavily exact extraction; 0 Firecrawl fallbacks and 0 Supabase writes.
- Miniatures Handbook Warmage promoted through the source-equivalence invariant; 21 classes moved from `pending_audit` to source-verified `needs-review` with explicit subsystem blockers.
- Current canonical tracker totals: **45 complete / 72 needs-review / 1 source-conflict / 2 blocked / 934 pending audit / 1054 total**.

## 2026-09-29/30 prestige 20-class audit

- Baseline #1480 at `9325426767c8e9e39724883243815a9b9faef238` was green before this data-only audit.
- Twenty prestige-class records were moved from `pending_audit` to source-verified `needs-review` with exact entry/mechanics blockers.
- The batch explicitly preserves source-specific differences for duplicate class names and records prestige prerequisites as part of completion rather than treating progression-table extraction as enough.
- Tracker totals: **45 complete / 92 needs-review / 1 source-conflict / 2 blocked / 914 pending / 1054 total**.

## 2026-09-29/30 prestige second 20-class audit

- Green baseline: #1481 at `f636202f739ca0d316697ea2854f7138947e75a9`.
- Twenty additional prestige classes moved from `pending_audit` to source-verified `needs-review` with exact prerequisite/mechanics blockers.
- No source-complete record was marked mechanically complete without reviewed summaries, automation and regression evidence.
- Tracker totals: **45 complete / 112 needs-review / 1 source-conflict / 2 blocked / 894 pending / 1054 total**.


## 2026-09-30 prestige third 20-class audit

- Green baseline: #1482 at `e137c6d5295b38e6b69f5f233cd5768e708c3f2b`.
- Twenty additional prestige classes moved from `pending_audit` to source-verified `needs-review` with exact prerequisite/mechanics blockers; source completeness alone was not treated as automation completeness.
- Duplicate Bear Warrior and Beholder Mage records remain source-independent, and Battle Scion preserves its legendary-weapon-defined entry model.
- Exa + Tavily supplied the usable evidence; grouped Firecrawl fallback search produced no additional source page, and Supabase was not written.
- Tracker totals: **45 complete / 132 needs-review / 1 source-conflict / 2 blocked / 874 pending / 1054 total**.

## 2026-09-30 prestige 75-class audit

- Green baseline: #1483 at `e10f7f700083079952fd14dbac8629b36399da19`.
- **75** additional prestige-class records moved from `pending_audit` to source-verified `needs-review` in a single atomic source-audit checkpoint.
- Exa discovery + Tavily exact extraction were used across the batch; Firecrawl fallback searches on ambiguous same-name pairs returned no additional usable pages, and Supabase was not written.
- Duplicate-name source versions remain independent, and Bloodscaled Fury is explicitly locked to the source-faithful BAB +22 requirement.
- Tracker totals: **45 complete / 207 needs-review / 1 source-conflict / 2 blocked / 799 pending / 1054 total**.

## 2026-09-30 second prestige 75-class audit

- Green baseline: #1484 at `e52020e104b8342cf59f29b838529ef5e447e129`.
- **75** additional prestige-class records (**Cyre Scout → Dragonslayer**) moved from `pending_audit` to source-verified `needs-review` in one atomic source-audit checkpoint.
- Exact source/version extraction used Tavily with Exa source-faithful recovery for omitted prerequisites. Firecrawl duplicate/source fallbacks yielded no additional usable pages; Supabase was not written.
- Duplicate-name/version records remain independent. Dragon Rider (Dragonlance) and Dragonrider (Draconomicon) are explicitly separate.
- Tracker totals: **45 complete / 282 needs-review / 1 source-conflict / 2 blocked / 724 pending / 1054 total**.
