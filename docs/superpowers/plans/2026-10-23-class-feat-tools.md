# Class and Feat Tools Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Derive independent class and feat tools from character ownership, with Mother Cyst usable across eligible multiclass builds.
**Architecture:** Keep canonical character state. Add source identity and feat casting helpers, then a tool directory and owner-filtered React panels. Reuse spending/effect/project engines and preserve saved history.
**Tech Stack:** React, Vite, Node tests, Playwright.
**Spec:** ../specs/2026-10-23-class-feat-tools-design.md

## Constraints and review focus

- No extra slots or free casts; no imposed feat schedule; original editions stay isolated.
- Missing feat, wrong-edition lookalikes and class removal cannot enable unearned actions.
- Mixed spellcasting abilities, Pact slots and unavailable characters must validate at execution.
- Navigation must preserve drafts; removing a source must preserve historical expenditure without enabling fresh use.
- Generic records expose their existing implemented mechanics or rules without claiming bespoke automation.

## Tasks

1. [x] Write and run failing tests for feat-only Mother Cyst access, total-level grants and non-Archivist casting. Implement source/feat casting helpers and integrate the existing spell/effect/rest engines. Extend project source checks for independent grafts/crystals.
2. [x] Write and run failing browser checks for dynamic class/feat tabs. Add the directory/workspace, route converted controls by owner and expose existing generic feat magic. Keep shared resources canonical.
3. [x] Extend tests across levels 1–20, class combinations, removal/reopen, prerequisite failures, owned feat controls, drafts and mobile. Update existing navigation helpers to the new owner structure.
4. [x] Run the relevant rules/browser suites and build. Review the whole diff, fix confirmed issues, document coverage and prepare a reviewable pull request.

## Execution ledger

- User approved the class-tab direction, explicitly requested independent feat behavior and asked to continue. Proceed within that scope using the existing application; no further design questions needed.
- Ruling: total-level Mother Cyst unlocks use the ordinary full-caster tier thresholds, while casting still requires an existing valid slot. This separates requested access from spell-slot progression.

- RED→GREEN observed for independent Cyst access/casting, graft source gates, class preparation limits, cooperative DC, stable feat tab identity, pure Pact UI casting and removed-source project history.
- Review fixes: respect primary casting-ability overrides and existing slot policy; no inferred slots for a homebrew Wizard lookalike; normalize both slot-pool directions; preserve paid history and installed grafts after source removal.

- Verification: full npm test, Archivist and independent feat rules/browser suites, Entomancer browser regressions, shared integration/resources/usability (5/5), production build and diff checks passed. Independent review findings were reproduced and fixed; source-policy follow-up confirmed no remaining important issue in those fixes.
