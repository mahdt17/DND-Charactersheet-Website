# 3.5 Class Completion Checkpoint

Updated: 2026-09-28 (America/New_York)

## Current state

- Repository: `mahdt17/DND-Charactersheet-Website`
- Branch: `codex/class-integration-engine`
- Pull request: #8 — keep open, draft, and unmerged.
- Last fully validated functional SHA: `51b3241627f3e720c55c69a7de3175e7b2773843`
- Full validation: [Validate modernization #1379](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36518328892) — **passed**
- Supabase: unchanged.
- Deploy/merge: not performed.
- Dirty or unpushed work: none recorded on the branch.

## Completed in the current stop point

- `classes/expert-33` — **Expert (Dungeon Master's Guide v.3.5)**
  - Source review verified.
  - Weapon/armor training is source-owned.
  - "Choose any ten skills to be class skills" is a structured required choice.
  - The 46 skills on the source page are eligibility options only; they are not automatically granted.
  - Exactly ten selections are required and persisted.
  - Only selected Expert skills receive class-skill rank caps.
  - Save/reopen and source-owned multiclass removal are covered.
  - Full unit/regression/build/browser CI passed on `51b3241627f3e720c55c69a7de3175e7b2773843`.

## Reviewed but not promoted to complete

- `classes/commoner-32` — Commoner
  - Source review and structured one-simple-weapon selection are implemented and previously passed full CI.
  - Remaining completion gap: persist a focused multiclass removal regression for the Commoner-owned choice/training grant before marking the record complete.

## Tracker

- Inventory preserved: **1054 source IDs**.
- Current directly keyed summary records: **44**.
- Authoritative maintained tracker: `docs/class-completion-tracker.json`.
- Completion is tracked per exact source ID; same-name reprints/variants are not assumed equivalent.

## Next exact work after the user's questions

Do not start this work until explicitly resuming the class workflow.

1. Re-open the checkpoint and verify the remote PR head/CI first.
2. Finish the remaining Commoner removal regression if desired before promoting `classes/commoner-32`.
3. Next ready related base-class batch:
   - `classes/aristocrat-31`
   - `classes/warrior-34`
4. For that pair, re-confirm the already reviewed fixed class-skill lists and training packages, test levels 1 and 20 plus multiclass removal/preservation, then update this tracker/checkpoint.
