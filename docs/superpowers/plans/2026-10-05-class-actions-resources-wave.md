# Class Actions/Resources Review Wave Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the D&D 3.5 `needs-review` queue by completing the largest safe, source-verified batches from the action/resource/feature-reconciliation cohort while preserving generic class-integration behavior and lifecycle correctness.

**Architecture:** Treat `src/data/class-feature-summaries-35.json` and `src/data/class-proficiencies35.json` as source-faithful declarative inputs to the existing generic integration engine. Add generic runtime capability only when a mechanic shape cannot already be represented. Use source-scoped reconciliation so level changes, multiclassing, repeated reconciliation, and source removal remain idempotent. Keep unsupported major subsystems such as psionics, binding, incarnum, and Tome of Battle in `needs-review` rather than adding class-specific runtime exceptions.

**Tech Stack:** Node.js ES modules, React/Vite application code, JSON class data, Python/Node audit scripts, GitHub Actions.

---

## Task 1: Reproduce the live queue and choose the first uniform batch

**Files:**
- Read: `docs/class-completion-tracker.json`
- Read: `scripts/classify_class_implementation_cohorts.mjs`
- Read: `scripts/audit_class_automation.mjs`
- Read: `src/data/class-feature-summaries-35.json`
- Read: `src/data/class-proficiencies35.json`

**Steps:**
1. Reproduce the current `needs-review` count and the action/resource/reconciliation cohort using the repository classifier.
2. Exclude already finalized records, especially `battlesmith-725`, `duelist-768`, `goliath-liberator-732`, `ghost-slayer-525`, `gladiator-771`, and `knight-protector-322`.
3. Group remaining candidates by mechanic shape: ordinary passives, finite resources, spell-like actions, fixed feats, scaling names, ability-mod formulas, level-scaling formulas, action types, conditional mechanics/state, and explicit no-proficiency cases.
4. Select the largest set whose mechanics are already supported by one generic implementation and one shared regression strategy. Target roughly 50 records when evidence and uniformity allow; split only on real mechanic/evidence boundaries.
5. Reuse tracker/structured evidence first. Research only missing, ambiguous, or conflicting facts, using Exa first and Tavily second; do not use Firecrawl unless those fail.

## Task 2: Add the first-batch regression in RED

**Files:**
- Create or modify: `tests/class-actions-resources35.mjs`
- Reference: `tests/class-integration.mjs`
- Reference: `tests/class-catalog-lifecycle.mjs`
- Reference: `tests/class-six-batch-finalization35.mjs`
- Reference: `tests/daily-spell-like35.mjs`

**Steps:**
1. Add a data-driven test table containing every class ID in the chosen batch and the exact expected feature/action/resource/proficiency outcomes supported by evidence.
2. Assert source identity and expected class-level unlocks.
3. Assert actions/resources, usage formulas, modifiers/minimums, recovery, action type, scaling, and conditional metadata where applicable.
4. Assert proficiencies or explicit no-new-proficiency handling.
5. Assert reconciliation at the target level, a repeated reconciliation pass, down-level/removal behavior, and source removal so no duplicate or stale entries survive.
6. Commit the regression before implementation.
7. Use the PR workflow/checks to observe the expected failure and verify it fails for the missing batch data/capability rather than a syntax, fixture, or infrastructure error.

## Task 3: Implement the batch in GREEN

**Files:**
- Modify: `src/data/class-feature-summaries-35.json`
- Modify: `src/data/class-proficiencies35.json`
- Modify only if a generic capability is actually missing: `src/lib/classIntegration.js`
- Modify supporting generic data only when required by the same mechanic shape.

**Steps:**
1. Add or correct source-faithful feature summaries for every selected class, preserving exact class ID, source, book/version, level progression, fixed feats, choices, and descriptions.
2. Encode actions/resources declaratively using existing generic fields whenever possible, including finite uses, formulas, minimums, recovery cadence, action type, and level scaling.
3. Add verified proficiency records. Represent an explicit no-new-proficiency result using the established data convention rather than inventing grants.
4. If conditional mechanics require missing runtime support, add the smallest generic schema/runtime behavior that works for all matching records; do not branch on class IDs.
5. Re-run the focused regression and keep changes minimal until it passes.
6. Run the all-class lifecycle regression to confirm idempotence and source removal remain intact.

## Task 4: Prove completion before tracker changes

**Files:**
- Read/modify: `docs/class-completion-tracker.json`
- Read: `scripts/audit_class_automation.mjs`
- Read: `scripts/classify_class_implementation_cohorts.mjs`
- Read: source-identity/content audit scripts used by the existing workflow.

**Steps:**
1. Run the focused batch regression and lifecycle regression on the implementation commit.
2. Run class automation/source-identity audits and the cohort classifier.
3. For each candidate, confirm the full completion standard: exact source identity, progression/features, skills, proficiencies or explicit no-new-proficiency evidence, prerequisites, feats, choices, actions/resources/formulas/modifiers/scaling/minimums/recovery/action type/conditionals, and multiclass lifecycle/reconciliation.
4. Leave any record with unresolved evidence or unsupported mechanics in `needs-review`; count it as a blocker moved aside rather than weakening the gate.
5. Only after all checks above are green, change proven records from `needs-review` to the tracker’s established complete status and preserve their evidence/notes format.

## Task 5: Verify the pushed batch and continue

**Files:**
- Existing GitHub Actions workflows under `.github/workflows/`

**Steps:**
1. Push the completed batch to `codex/class-integration-engine` so it updates PR #8.
2. Run/observe the relevant CI checks. If `src/lib/classIntegration.js` changed, require the full class/feat/spell/item/browser/build regression set; otherwise require the focused and standard content/class gates that cover the changed data.
3. Inspect the actual workflow jobs/logs before claiming success; retry only clearly transient failed jobs.
4. Record: batch completed count, `needs-review` before→after, target cohort remaining, commit SHA(s), CI result, and blockers moved aside.
5. Immediately repeat Tasks 1–5 for the next largest uniform action/resource batch without redoing completed records.
6. After exhausting the supported action/resource cohort, proceed in this order: ordinary prestige/selected caster advancement, supported companion cases, supported persistent-choice cases, then major missing subsystems such as psionics.
