# Shadar-kai Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline.

**Goal:** Add both requested source-labelled Shadar-kai races to 5e creation and usable sheets.
**Architecture:** Source data in data/shadarKai.js, pure mechanics in lib/shadarKai.js, creation/Trance/action UI in ShadarKai.jsx; integrate with existing race, resource, training, language, prerequisite and rest flows.
**Tech Stack:** Existing React, Vite, Node and Playwright; no dependencies.
**Spec:** ../specs/2026-10-25-shadar-kai-design.md

## Global constraints
- Distinct MToF 2018 / MotM 2022 records, both 2014-mechanics only, exact source gates.
- Preserve dice work in its separate checkout; no dice changes in this PR.
- Shared canonical spending, no short-rest recharge, total-level proficiency scaling.
- Temporary all-damage resistance is explicitly a turn reminder; no automatic map/damage engine.
- MotM-only temporary training; source-owned traits and duplicate skill handling preserve unrelated grants.

## Review focus
- Switching source, invalid imports or missing race definitions cannot grant the other variant's benefits.
- Level changes preserve expenditure; ending the ward never refunds uses.
- Perception/background overlap cannot discard a skill choice.
- Temporary weapon training expires/replaces at a long rest and changes actual attack proficiency.
- Source/year labels remain legible and save/reopen retains identity on mobile.

### Task 1: Rules and creation integration
**Files:** Create src/data/shadarKai.js, src/lib/shadarKai.js, src/ShadarKai.jsx, tests/shadar-kai.mjs. Modify GuidedSetup.jsx, ModernLedger.jsx, RestDialog.jsx, lib/resources.js, lib/languages.js, lib/training.js, lib/advancement.js.
- [x] Write and run failing tests for both race identities, level 1–20 charges/ward gate, source guards, resting, Trance training and elf prerequisites.
- [x] Implement records, mechanics, creator, action panel and existing-system integration; run rules tests.

### Task 2: Usability and verification
**Files:** Create tests/browser-shadar-kai.mjs and tests/browser-shadar-kai-creation-regressions.mjs; update package.json and modernization.yml.
- [x] Verify full creation of both variants, bonus options, language/skill overlap, spending, turn reminder, save/reopen, long-rest training, mobile and edition isolation in a real browser.
- [x] Run existing Eladrin/Aasimar and race integration checks, npm test and build; independently review and fix findings.

## Execution ledger
- Baseline 69ea1fd, existing Eladrin/Aasimar checks pass. Native worktree creation was unavailable because this chat's folder is not a Git repo; created a separate Git checkout at work/shadar-kai-5e and reused installed dependencies via a junction.

- Task 1 complete: new rules tests first failed for missing source records, then passed all seven source/lifecycle suites; browser confirmed source-specific creation and both rest paths.
- Task 2 review: independent reviewer found two P2 creation blockers (background/Trance duplicate tool and hidden required Custom Perception replacement). New browser regressions failed all three scenarios before fixes; all pass after shared effective background proficiency validation, an inline Trance correction UI and moving the replacement control outside the manual-class branch.
- Review disposition: all requested mechanics and integration paths judged; general existing race-switch retention was outside this new feature and remains unchanged. No actionable review findings deferred.

- Final verification: npm test; npm run build; npm run test:browser:shadar-kai; browser-eladrin.mjs; browser-aasimar.mjs; browser-loading.mjs all pass after review fixes. Final browser/build runs use GITHUB_ACTIONS=true to verify the deployed subpath. resources.mjs and editions.mjs also passed. Shared existing bundle-size advisories remain unchanged in scope.
