# Archivist DM Spellcasting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply the DM's Archivist casting rules with persistent, individually adjustable features.
**Architecture:** Extend the existing 2014 conversion; centralize spellbook/recovery and component validation so the UI and saved sheet use the same rules. Keep historical allowances separate from live derived preparation capacity.
**Tech Stack:** Existing React, Vite, JavaScript and Playwright; no dependencies added.
**Spec:** docs/superpowers/specs/2026-10-27-archivist-dm-casting-design.md

## Global Constraints
- Preserve the original 3.5 Archivist and unrelated class behavior.
- Keep existing spells, resources, projects, notes and deliberate personal overrides.
- Starting prayerbook: all Cleric cantrips and 3 + positive starting Intelligence modifier first-level Cleric spells; subsequent Archivist levels grant two Cleric-list spells each.
- Prepared limit: max(1, total character level + current Intelligence modifier).
- Recovery: ceil(Archivist level / 2), standard slots level 1–5, once per long-rest cycle at a completed short rest.
- Existing Archivist features remain enabled by default; individual suppression persists.

## Review Focus
1. Legacy saves lacking acquisition metadata must preserve spells and avoid creating repeat grants.
2. Multiclass level-up drafts carry class level separately from total character level.
3. Cancelled rest/copy/cast dialogs must not consume resources.
4. Losing a feature/feat must remove actual effects without deleting unrelated selections.
5. Material objects and scrolls must be consumed once, including cooperative and scroll casting paths.

### Task 1: Prayerbook and live preparation rules
**Files:** src/lib/archivistCampaign.js, src/data/archivistCampaign.js, src/GuidedSetup.jsx, src/EditionLevelUp.jsx, src/CampaignSpells.jsx; tests/archivist-dm-casting.mjs.
**Interfaces:** campaignProfile(c) adds startingAllowance/startingRemaining and retains growthAllowance/growthRemaining for subsequent levels; reconcileCampaign(c) establishes historical bookkeeping and automatic cantrips; acquireCampaignSpell(c,s,{channel}) accepts starting/growth/outside with class-tier validation.
- [x] Write and run failing tests for starter/growth channels, all cantrips, retained legacy books, total-level/Int preparation and class-level slots 1–20.
- [x] Implement the profile, historical fields and UI creation/level-up changes without duplicating grants.
- [x] Run focused tests and existing progression tests; commit.

### Task 2: Arcane Recovery and feature/feat controls
**Files:** src/lib/archivistCampaign.js, focused feature helper if needed, src/ArchivistCampaign.jsx, src/RestDialog.jsx, src/lib/resources.js, src/FeatChoices.jsx, src/ConvertedClassChoices.jsx; tests/archivist-dm-casting.mjs.
**Interfaces:** archivistFeatureEnabled(c,name), setArchivistFeatureEnabled(c,name,enabled), recoverArchivistSlots(c,selection) -> updated character; rest integration applies validated recovery after the short-rest base transaction.
- [x] Write and observe failing tests for slot budgets, levels, invalid counts, daily use, persistence, long-rest reset, multiclass pool exclusion, disabled mechanics and removed feat suppression.
- [x] Implement recovery at completed short rest, derived resources, feature controls and normal feat removal with persistent suppression.
- [x] Run focused and existing class/feat tests; commit.

### Task 3: Components and divine scroll copying
**Files:** focused src/lib/archivistComponents.js, src/lib/campaignDowntime.js, src/CampaignWorkshop.jsx, src/CampaignSpells.jsx, src/lib/archivistCampaign.js; tests/archivist-dm-casting.mjs.
**Interfaces:** component requirements and transaction helper shared by normal and cooperative casting; startCampaignProject copy metadata and finishCampaignProject(c,id,{arcana}) enforce copying checks for new scroll projects. Legacy project compatibility is explicit.
- [x] Write and observe failing tests for 50 gp/2 hours per spell level, DC 10 + spell level, success/failure/scroll consumption, divine-source confirmation, component focus eligibility, consumed/reusable items and validation atomicity.
- [x] Implement user-facing rules, item selection, copying check, and scroll activation component exemption.
- [x] Run focused, project and cooperative regressions; commit.

### Task 4: Browser journey, regressions and review
**Files:** tests/browser-archivist-dm-casting.mjs, package.json, .github/workflows/modernization.yml, existing tests whose old expectations are superseded by the approved rules.
**Interfaces:** npm run test:archivist-dm-casting and test:browser:archivist-dm-casting.
- [x] Add and run a browser journey for creation, preparation/Int edits, level-ups, recovery, reopen, feature/feat removal, components and copying; observe failures and correct the actual cause.
- [x] Run existing Archivist suites, full npm test, build and diff whitespace validation; read results.
- [x] Obtain a fresh whole-branch review, fix important issues with regression tests, and record final verification.

## Final verification
- New Archivist rules: 13 tests pass, including all three reproduced independent-review defects.
- Full npm test and npm run test:archivist pass.
- npm run test:browser:archivist passes all eleven suites; general browser suite passes.
- New browser coverage includes creation, levels 1–4 and Int ASI, saved preparation capacity, rest cancellation/recovery/reopen, feature/feat removal, real materials, paid copying, backup and scribe/activation lifecycle.
- Existing mixed-class advancement explicitly verifies character level is counted once for preparation.
- Production build passes (existing bundle-size advisory); git diff --check passes.
- Independent review: three important findings reproduced RED and fixed GREEN; no deferred findings.
