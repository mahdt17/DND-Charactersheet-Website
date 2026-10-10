# Needs-Review Class Waves Design

## Goal

Reduce the D&D 3.5 class `needs-review` queue from its current 918 records by completing the largest safe, reusable cohorts first, without redoing verified work or merging/deploying PR #8.

## Current State

The tracker contains 1,054 D&D 3.5 class records and 918 `needs-review` records at the current branch head. The largest implementation cohorts are:

- psionics/manifesting: 221
- class actions/resources and feature reconciliation: 210
- companions/mounts/cohorts: 143
- persistent feature choices: 77
- ordinary prestige spellcasting/selected caster advancement: 71

Existing infrastructure already reconciles generic class features, actions, resources, training, source removal, spell acquisition, companions, daily spell-like abilities, invocations, domain grants, and selected legacy casting mechanics. The class lifecycle regression currently covers all 1,054 catalog classes.

## Scope and Ordering

Work through the queue by reusable mechanic cohort rather than alphabetically.

1. Start with `class actions/resources and feature reconciliation` because it is the largest cohort that can mostly use the existing generic reconciler.
2. Process this cohort in batches targeting roughly 50 records, allowing larger batches only when the records are sufficiently uniform and can share the same implementation/test pattern.
3. After that cohort, prefer the 71 ordinary prestige-casting records and already-supported portions of the companion cohort before undertaking larger new subsystems such as the 221-record psionics cohort.
4. New subsystem work discovered during a batch must be split out rather than hidden inside one-off class patches.

## Record Completion Contract

A class may move from `needs-review` to `complete` only when the exact source record is represented correctly and verified. Completion requires, as applicable:

- exact source ID, book/version, and source identity preserved;
- reviewed feature summaries for all progression features that affect character behavior or presentation;
- verified class skills and starting/later proficiency grants, including explicit-none evidence where the source grants nothing;
- fixed feat grants and feature choices represented structurally;
- actions and resource pools represented with source-faithful usage formulas, reset/recovery rules, action types, level scaling, ability modifiers, minimums, or caps;
- conditional mechanics represented structurally when they affect automation rather than being silently discarded;
- source removal and multiclass reconciliation remain idempotent;
- no same-name cross-source substitution unless an explicit source-equivalence rule already exists;
- tracker status and notes updated only after tests pass.

## Source Research Policy

Reuse supplied and already-reviewed evidence whenever it establishes the needed fact. Research only missing, ambiguous, or conflicting details.

Discovery order:

1. Exa for discovery/recovery.
2. Tavily for targeted extraction when needed.
3. Source-faithful alternatives when necessary.
4. Firecrawl only as a last resort.

Do not claim a page was inspected unless it was actually retrieved. Preserve exact source/version identity even when another class has the same name.

## Implementation Strategy

For each batch:

1. Select only `needs-review` records in the target cohort.
2. Group records by shared mechanic shape (ordinary passive features, finite resources, spell-like actions, fixed feats, scaling feature names, conditional state, etc.).
3. First add a failing batch regression that pins exact IDs, expected feature sets, resources/actions, training, prerequisites where applicable, idempotence, and removal behavior.
4. Fill missing reviewed data in existing structured data files. Extend generic runtime logic only when multiple records need the same missing representation.
5. Avoid one-off runtime branches keyed to individual class IDs unless the source rule is genuinely unique and cannot be represented by existing metadata.
6. Run the focused batch test plus the existing class integration/lifecycle checks before changing tracker statuses.
7. Update the tracker for records proven complete by the batch, then run the cohort classifier/check and relevant CI.
8. Commit/push each completed batch to `codex/class-integration-engine`; keep PR #8 draft, unmerged, and undeployed.

## Expected Files

Existing files are preferred over introducing parallel systems. Likely touch points are:

- `src/data/class-feature-summaries-35.json` for reviewed feature metadata and rule summaries;
- `src/data/class-proficiencies35.json` for verified class skills/training evidence;
- `src/lib/classIntegration.js` only for reusable generic reconciliation gaps;
- focused batch regression files under `tests/`;
- `docs/class-completion-tracker.json` after verification;
- `.github/workflows/modernization.yml` only if a new persistent regression must be wired into CI.

## Validation

Every completed batch must pass its focused regression and the applicable existing checks. At minimum, validate:

- class integration reconciliation;
- the new batch regression;
- all-class catalog lifecycle/idempotence/source removal;
- class automation audit;
- cohort metadata consistency;
- any affected subsystem tests such as resources, feature choices, spell access/acquisition, companions, or browser integration.

Use full CI at sensible checkpoints or whenever shared runtime behavior changes. Data-only batches may use focused CI first, but tracker records are not considered complete if the relevant validation is red.

## Non-Goals

- Do not merge PR #8.
- Do not deploy to `main` or GitHub Pages.
- Do not modify Supabase.
- Do not mark records complete merely because the generic reconciler can parse their progression table.
- Do not spend research effort re-verifying facts already established by supplied evidence.
- Do not build psionics, binding, incarnum, maneuvers, or another major subsystem as an incidental side effect of the first action/resource wave.

## Success Criteria

The first wave succeeds when the largest safe batch from the 210-record action/resource cohort is source-reviewed, structurally represented, regression-tested, tracker-updated, pushed to PR #8, and green in relevant CI, with an exact completed/remaining count reported. Repeating that process should steadily reduce the queue without accumulating one-off automation debt.
