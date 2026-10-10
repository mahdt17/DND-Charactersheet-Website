# Shared Class Gates Implementation Plan

> **For agentic workers:** Use Superpowers TDD and verification before completion.

**Goal:** Automate reusable prerequisite checks and make certification audits accurately reflect existing runtime coverage.

**Architecture:** Keep `requirements` as the public runtime entry point. Resolve audit coverage from the layered catalog and cluster the unchanged certification ledger.

**Tech Stack:** JavaScript modules, React, Node assertions, Playwright, Vite.

**Spec:** `docs/superpowers/specs/2026-10-09-shared-class-gates-design.md`

## Global constraints

- Continue the existing branch/PR; no merge, deploy, main, or Supabase changes.
- Exact source identity, all eleven evidence axes, and fail-closed certification remain mandatory.
- Preserve existing state ownership and unresolved narrative requirements.

## Review focus

- Mixed true/false/unknown nested groups must not falsely qualify.
- Duplicate grants or alternate-source copies must not inflate feat counts.
- Same-name feat subjects and class versions must stay distinct.
- Later choices see earlier transaction grants and survive reload/removal.
- Reviewed runtime metadata removes only supported diagnostics, never tracker blockers or certification axes.

## Task 1: Runtime prerequisites

Files: `src/lib/advancement.js`, focused prerequisite helper if needed,
`tests/structured-prerequisites35.mjs`.
Interface: retain `requirements(record, character, confirmations, options)`.

- [x] Add failing tests for three-valued groups, count predicates, typed feat and skill-count text, named alternatives, exact feat subjects/training, and ordinary Two-Weapon Fighting.
- [x] Observe expected assertion failures before changing runtime code.
- [x] Implement narrow parsing and reusable evaluators; preserve unknowns.
- [x] Verify targeted tests and catalog impact with exact source IDs.

## Task 2: Runtime-aware audit and clusters

Files: `scripts/build_class_review_queue.mjs`, focused shared audit helper,
`scripts/build_class_completion_ledger.mjs`, focused audit tests.

- [x] Reproduce missing-profile false diagnostics using catalog fixtures and exact real records.
- [x] Resolve reviewed provenance from the layered runtime catalog.
- [x] Add deterministic clusters with deduplicated source IDs and unmapped blockers.
- [x] Verify all existing certification tests and unchanged completion totals.

## Task 3: Source choice integration

Files: `src/lib/featureChoices.js`, `src/lib/sourceFeatTemplates35.js` as needed,
focused choice lifecycle tests and browser regression.

- [x] Reproduce stale prerequisite context for linked typed feat milestones.
- [x] Use current transaction grants and selected template subject for eligibility.
- [x] Verify invalid choices, source ownership, JSON round trip, removal and browser UI.

## Task 4: Review, verification and existing PR checkpoint

- [x] Integrate focused tests into npm/CI and regenerate the ledger/queue.
- [x] Run broader relevant Node/Python suites, build, browser and live regressions.
- [x] Obtain fresh review; fix substantiated failures with regressions.
- [ ] Commit and push only the existing branch; inspect its CI and PR state.
- [x] Report exact impact, remaining blockers, certification totals and any limits.

The user explicitly authorized uploading the prepared changes to the existing
branch and PR #8 after reviewing the local checkpoint. All local verification
passed; publication and CI verification are the remaining checkpoint steps.
