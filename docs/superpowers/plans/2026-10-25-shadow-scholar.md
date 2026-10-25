# Shadow Scholar Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline.

**Goal:** Make the user-supplied Shadow Scholar selectable with complete starting benefits.
**Architecture:** Dedicated data/shadowScholar.js and lib/shadowScholar.js own the supplied record and source-gated grants. GuidedSetup integrates selection/details/language choice/finalization; the existing language and training models provide saved sheet behavior.
**Tech Stack:** Existing React, Vite, Node and Playwright; no new dependencies.
**Spec:** ../specs/2026-10-25-shadow-scholar-design.md

## Global constraints
- 2014 5e and compatible Custom only; no 2024/3.5 benefit leakage.
- Stealth, Arcana, Thieves' Tools, Draconic default / Undercommon alternate; keep race grants.
- Researcher and editable personality notes; no automatic class/subclass changes.
- Six background items and 10 gp are creation awards, never normalization/rest awards.
- Keep class gear, existing notes and unrelated traits/proficiencies.

## Review focus
- Class skills cannot redundantly consume background or racial skills.
- MotM Shadar-kai Trance must see the permanent Thieves' Tools grant before creation.
- Reopening, rest and leveling cannot duplicate the letter, gold or notes.
- Language switches/background switches cannot retain the previous language grant.
- Default story notes remain editable and source identity survives saves.

### Task 1: Background and creation
**Files:** Create src/data/shadowScholar.js, src/lib/shadowScholar.js, src/ShadowScholar.jsx, tests/shadow-scholar.mjs, tests/browser-shadow-scholar.mjs. Modify CharacterManager.jsx, GuidedSetup.jsx, ModernLedger.jsx, lib/languages.js and lib/training.js as required.
- [x] Write and run failing checks for selectable data, source/edition gates, grants, starting inventory/currency, notes, language changes, and the full creation flow.
- [x] Add the data, helpers and UI; validate actual saved skills, tool training, Researcher, gear and notes for Shadar-kai and another race.

### Task 2: Verify and deliver
**Files:** package.json and modernization.yml; relevant tests above.
- [x] Verify default/alternate language, background replacement, class and race preservation, reload/rest idempotence and mobile usability; add CI coverage.
- [x] Run full rules suite, targeted background/Shadar-kai/Eladrin/Aasimar browser checks and production build/loading. Obtain fresh independent review and fix actionable findings with regression checks.
- [ ] Commit, push and open a separate PR.

## Execution ledger
- Base merged main 3ada01a. Reusing the clean existing isolated checkout on new branch codex/shadow-scholar-background; paused dice checkout is untouched.
- Linear context retrieval was unavailable (server reports tool not found); existing code supplies the implementation context.
- Main app uses GuidedSetup and ModernLedger. Backgrounds currently supply skills/equipment but only Eladrin/Shadar-kai append background tool notes; add this background's canonical tool grant and Researcher explicitly. Notes are a single editable field.

- Task 1 complete: new data/rules/browser checks failed for the missing background, then passed. Browser checks cover both Shadar-kai sources plus a Human Rogue, required Expertise, default/alternate language, canonical tools, exact items/10gp, class gear, one Researcher entry, editable notes and rest/save idempotence.
- Independent review found one P2: manual/reference/homebrew racial language handling omitted the background language. A new focused test failed before the fix; background grants now survive early manual-race returns, appear in the language UI, and merge into saved manual languages. Unit and a full Custom/manual-race browser case pass.
- Considered existing Half-Elf extra-skill reselection and legacy Eladrin/background Trance behavior: unchanged existing behavior outside the user’s Shadar-kai build; no broad background-system rewrite undertaken. MotM Shadar-kai/Shadow Scholar Trance conflicts are tested and correctable before creation.
- Final verification passed: npm test, browser-shadow-scholar.mjs, test:browser:shadar-kai, browser-eladrin.mjs, browser-aasimar.mjs, npm run build and browser-loading.mjs. Final build/browser checks use GITHUB_ACTIONS=true to match the deployment subpath. Notes persistence waits for the app’s autosave before testing reopen/rest.
