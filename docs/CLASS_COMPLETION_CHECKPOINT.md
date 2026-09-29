# 3.5 Class Completion Checkpoint

Updated: 2026-09-29 (America/New_York)

## Current state

- Repository: `mahdt17/DND-Charactersheet-Website`
- Branch: `codex/class-integration-engine`
- Pull request: #8 — keep open, draft, and unmerged.
- Last fully validated functional SHA: `163eb27b109e228e40b9e85e5a26062e61286fa1`
- Full validation: [Validate modernization #1393](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36530886999) — **passed**
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
  - Exact source independently reviewed.
  - Thug receives simple weapons, martial weapons, and light armor only.
  - Exact Thug class skills are source-owned, including Knowledge (local).
  - The inherited Fighter bonus feat at 1st level is explicitly suppressed.
  - Fighter bonus-feat progression resumes at 2nd level and every two levels thereafter through 20th.
  - The choice pool is strict: normalized Fighter Bonus Feat records plus the exact Thug-only Urban Tracking exception.
  - Full source audit, unit/regression/build/browser validation passed #1393.

## Reviewed but not complete

- `classes/wilderness-rogue-136` — **Wilderness Rogue (Unearthed Arcana p. 56)** — reviewed partial.
  - Exact page says to retain Rogue baseline except the listed changes.
  - Remove Appraise, Diplomacy, Decipher Script, Forgery, and Gather Information from the Rogue class-skill list.
  - Add Handle Animal, Knowledge (geography), Knowledge (nature), Ride, and Survival.
  - Add Woodland Stride, Camouflage, and Hide in Plain Sight to Rogue Special Ability choices.
  - Hide in Plain Sight requires Camouflage first.
  - Remaining engine gap: selecting those added abilities must grant their actual standalone mechanics and enforce the prerequisite, not merely record a label.

## Same-name records deliberately NOT inherited

- `classes/commoner-24` — Commoner (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only an “Also appears in: DMG” pointer.
- `classes/warrior-28` — Warrior (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only “Also appears in” pointers.
- These remain independent until their exact Dragonlance mechanics can be verified.

## Bulk audit findings

- Class inventory: **1,054 exact source IDs**.
- Same-name scan: **107 groups covering 236 records**; name-based inheritance is not proof of equivalence.
- Of those same-name groups, the bulk audit found **92 with structured mechanical differences**.
- Tracker totals now: **5 complete**, **2 blocked**, **1 reviewed partial**; all remaining records retain individual audit states.
- Current direct-summary count is a coverage metric only, never a completion count.

## Description-quality queue

- The exact-source description audit remains active in CI.
- Minor Malevolence, Malevolence, and Grand Malevolence now have standalone exact-ID description overrides with provenance.
- Reviewed summaries that still delegate core mechanics via unresolved “functions as / same as / see…” wording fail the audit.
- Unreviewed candidates remain queued for exact-source resolution rather than being silently accepted.

## New reusable variant mechanism validated by Thug

- Exact variants can suppress inherited feature events at source-defined levels.
- Exact variants can override inherited feature choice pools.
- Choice pools can derive from normalized feat-type metadata and add exact source-specific exceptions.
- Intentionally empty post-suppression grant lists no longer fall back and resurrect parent features.
- Derived features retain exact choice option lists through sheet reconciliation.

## Next work

1. Implement reusable source-choice option prerequisites and selected-option mechanic grants.
2. Use that mechanism to finish `classes/wilderness-rogue-136` without leaving Ranger cross-references unresolved.
3. Continue exact-source review of the remaining Unearthed Arcana variant group, but split spellcasting/spell-list variants into their own higher-risk batch.
4. Keep source-damaged records blocked and never infer equivalence from class names alone.
