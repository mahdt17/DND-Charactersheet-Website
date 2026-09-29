# 3.5 Class Completion Checkpoint

Updated: 2026-09-29 (America/New_York)

## Current state

- Repository: `mahdt17/DND-Charactersheet-Website`
- Branch: `codex/class-integration-engine`
- Pull request: #8 — keep open, draft, and unmerged.
- Last fully validated functional SHA: `0ba40d04062dbb6901129d281bce3696ac377c33`
- Full validation: [Validate modernization #1388](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36526588499) — **passed**
- Supabase: unchanged.
- Deploy/merge: not performed.

## Revised bulk-audit rules now in force

- All **1,054 exact class source IDs remain independent**.
- Same-name classes never inherit mechanics merely because their names match.
- Matching catalog fingerprints are candidates only; source verification is still required before any inheritance.
- Self-contained user-facing descriptions are mandatory for reviewed class features and feats.
- `scripts/audit_source_identity_and_descriptions.py` runs in modernization CI and fails if a reviewed summary still delegates core mechanics with unresolved wording such as “functions as” or “identical to”.
- Unreviewed cross-reference descriptions remain queued rather than being silently treated as complete.

## Completed exact-source batch

- `classes/aristocrat-31` — **Aristocrat (Dungeon Master's Guide v.3.5)**
  - Exact source independently verified.
  - Fixed class skills, including individual Knowledge specialties, are source-owned.
  - All simple/martial weapons, all armor, and shields reconcile as class-owned training.
  - Levels 1 and 20, multiclass removal/preservation, manual-entry preservation, and browser advancement coverage passed.

- `classes/commoner-32` — **Commoner (Dungeon Master's Guide v.3.5)**
  - Exact source independently reverified.
  - Exactly one simple weapon is a structured required choice; no armor/shield training is granted by the class.
  - The previously missing focused removal regression is already present and passed #1388.
  - Removing Commoner cleans its source-owned choice, training, and class skills while preserving the other class.

- `classes/warrior-34` — **Warrior (Dungeon Master's Guide v.3.5)**
  - Exact source independently verified.
  - Six fixed class skills plus simple/martial weapons, all armor, and shields are source-owned.
  - Levels 1 and 20, multiclass removal/preservation, manual-entry preservation, and browser advancement coverage passed.

## Same-name records deliberately NOT inherited

- `classes/commoner-24` — Commoner (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only an “Also appears in: DMG” pointer.
- `classes/warrior-28` — Warrior (Dragonlance Campaign Setting): **blocked**. Exact page has no mechanics, only “Also appears in” pointers.
- These remain independent until their exact Dragonlance mechanics can be verified.

## Bulk audit findings

- Class inventory: **1,054 exact source IDs**.
- Same-name scan: **107 groups covering 236 records**; name-based inheritance is therefore not an acceptable proof of equivalence.
- Current direct summary record count remains **44**; this is not a completion count.
- Current tracker totals after this checkpoint: **4 complete**, **2 blocked**, with all other records retaining their individual audit states.

## Description-quality queue

- The exact-source description audit is active in CI.
- Current unresolved cross-reference work is being handled as a separate exact-ID feat queue.
- Existing verified description overrides are evaluated before the fail-closed gate.

## Next work

1. Resolve the first linked feat cross-reference batch (Minor Malevolence → Malevolence → Grand Malevolence) into standalone exact-ID summaries with provenance.
2. Re-run the self-contained-description audit and full modernization validation.
3. Continue selecting the largest safe source-specific class batch from the generated manifest; do not auto-include same-name reprints.
4. Keep source-damaged exact records blocked instead of borrowing mechanics from similarly named records.
