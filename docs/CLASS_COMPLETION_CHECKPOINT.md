# 3.5 Class Completion Checkpoint

Updated: 2026-09-29 (America/New_York)

## Current state

- Repository: `mahdt17/DND-Charactersheet-Website`
- Branch: `codex/class-integration-engine`
- Pull request: #8 — keep open, draft, and unmerged.
- Last fully validated functional SHA: `a6123fe36ddc952a07456a98a71233efd5bdf176`
- Full validation: [Validate modernization #1395](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36534180093) — **passed**
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
  - Save/reopen, exact training/skills, invalid prerequisite, and multiclass source-removal regressions are preserved.
  - Full source audit, unit/regression/build/browser validation passed #1395.

## Same-name records deliberately NOT inherited

- `classes/commoner-24` — Commoner (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only an “Also appears in: DMG” pointer.
- `classes/warrior-28` — Warrior (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only “Also appears in” pointers.
- These remain independent until their exact Dragonlance mechanics can be verified.

## Bulk audit findings

- Class inventory: **1,054 exact source IDs**.
- Same-name scan: **107 groups covering 236 records**; name-based inheritance is not proof of equivalence.
- Of those same-name groups, the bulk audit found **92 with structured mechanical differences**.
- Tracker totals now: **6 complete**, **2 blocked**; all remaining records retain individual audit states.
- Current direct-summary count is **45** and remains a coverage metric only, never a completion count.
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

1. Process the homogeneous Unearthed Arcana feature-swap batch: `classes/fighter-variant-953`, `classes/rogue-variant-958`, and `classes/wizard-variant-959`.
2. Reuse only the specific verified Rogue Sneak Attack / Fighter bonus-feat mechanics; do not inherit unrelated class mechanics.
3. Keep the remaining p.58 variants reviewed separately because they introduce companions, conditional smites, AC/speed changes, wild shape restrictions, or other higher-risk systems.
4. Continue the feat/class-feature self-contained-description audit in parallel.
