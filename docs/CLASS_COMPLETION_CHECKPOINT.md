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
- Tracker totals now: **10 complete**, **2 blocked**; all remaining records retain individual audit states.
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
- The 3.5 AC calculator now distinguishes 3.5 Monk/Monk Variant from 5e-style Barbarian/Monk unarmored-defense rules; validate this before promoting Monk Variant.
- After Monk, build the shared Favored Enemy progression needed by Barbarian Variant, Paladin Variant, and Druid Variant.
- Then build the shared Animal Companion path needed by Bard Variant and Sorcerer/Wizard Variant.
- The self-contained-description audit remains active; reviewed descriptions must stay standalone and exact-source-owned.
