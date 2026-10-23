# Simpler Spells Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore familiar spell rows/dialogs in Spells and focused class/feat abilities.
**Architecture:** Reuse the current spell and activity engines. Replace the campaign prayerbook renderer with compact spell rows and a casting dialog, render Mother Cyst independently of class selection, and make ability tools route to Spells.
**Tech Stack:** Existing React, Vite, Node and Playwright.
**Spec:** ../specs/2026-10-23-simpler-spells-design.md

## Global constraints

- Keep canonical spell/feat spending and acquired spells; no new game rules or dependencies.
- Remove prayerbook navigation and duplicate casting from tools; preserve inventory and projects.
- Preserve ownership, original editions, preparations, DM confirmations and source checks.

## Review focus

- Feat-only and pure Pact characters must reach Cyst spells in Spells and spend the correct pool.
- An active noncaster class must not hide the character's feat spells.
- Exhausted/unprepared/blocked spell casts must remain unavailable; rituals retain their valid path.
- Removing feats must revoke new casts while preserving spending and effects.
- Dialogs, retained tool drafts and mobile navigation must stay usable.

## Tasks

### Task 1: Familiar campaign spell rows
Files: new src/CampaignSpells.jsx; src/EditionSpellbook.jsx; src/ModernLedger.jsx; src/ArchivistCampaign.jsx; tests/browser-simpler-spells.mjs.
- [x] Add a failing browser case for Archivist spell rows/dialogs and Mother Cyst in Spells on a Cleric/Fighter and pure Warlock.
- [x] Replace the campaign prayerbook renderer with Manage spells and per-spell Dialogs using acquireCampaignSpell, prepareCampaignSpell, castCooperativeSpell and CampaignEffectResolver.
- [x] Render Cyst spells once in Spells independently of selected class; preserve generic feat spell rendering.
- [x] Verify standard/Pact spending, preparation, source removal, save/reopen and phone layout.

### Task 2: Focused tools and casting options
Files: src/ClassFeatTools.jsx; src/ArchivistCampaign.jsx; src/FeatMetamagic.jsx; src/EditionSpellbook.jsx; src/ModernLedger.jsx; tests/helpers/class-tools.mjs; affected browser tests.
- [x] Add failing checks for no Prayerbook navigation, generic class ability selection and feat shortcuts to Spells.
- [x] Remove class/feat casting duplicates, keep full descriptions, focused ability choices and source controls; route spells to Spells.
- [x] Keep existing metamagic/cooperative functionality available from casting dialogs; adapt browser helpers to spell dialogs.
- [x] Run changed browser checks and existing class/feat and campaign action checks.

### Task 3: Verification and review
- [x] Run npm test, Archivist/feat rules, affected campaign browser suites, Entomancer browser regressions and production build; inspect results.
- [x] Review the diff and obtain one independent whole-change review; fix material findings and verify them.
- [x] Commit the result and prepare a reviewable PR without merging or deploying.

## Execution ledger

- Recovered the failed session's final instruction; its checkout was clean and contained no partial implementation.
- Baseline: refreshed origin/main (616080d); reused the existing isolated task clone with installed dependencies, on codex/simplify-spells-actions.
- Linear shared-notes endpoint is unavailable; project/issue queries returned no records. Saved conversation and repository supply the handoff.

- Resumed after a model-capacity failure with partial CampaignSpells/tool changes and a failing browser regression. Kept the existing isolated task clone and feature branch.
- Ruling: use the already approved familiar spell rows/dialogs and existing casting engines. Reuse FeatMetamagic inside ordinary class casting dialogs, scoped to that class; class and feat tools link to Spells.
- Updated browser navigation helpers and assertions for compact rows and Manage spells/casting dialogs while retaining the underlying spending, creature, progression and draft checks.
- Independent whole-change review found retained spell-effect controls could disappear after Mother Cyst removal. A browser regression failed first; effect resolution now renders once in Spells independently of current grants and that regression passes.
- Verification passed: npm test; npm run test:archivist; npm run test:browser:archivist (all eight browser scripts, including guide levels 1–20); npm run test:browser:entomancer; npm run build; git diff --check. Focused browser checks additionally verify cantrips, unprepared rituals, inventory notes, selected noncaster class, pure Pact casting, source removal, advanced class casting and mobile layout.
- Local test processes require process access outside the default sandbox (otherwise esbuild spawn EPERM). Browser runs use the installed Chrome through BROWSER_EXECUTABLE_PATH. Build retains the existing large-chunk warning.
- Delivery: commit and pull request on codex/simplify-spells-actions; leave main and deployment untouched.

- Post-merge correction: the independent 3.5 acquisition CI check exposed a Spells crash for original Warlocks with no Mother Cyst. CampaignSpells mounted the unused Cyst section and called conversionFeatSlots, whose single-Warlock adaptation assumes a 5e slot pool. Gate the lookup on current feat ownership; leave retained effect resolution in Spells independent of ownership.
- Added a focused original-Warlock regression, observed its failure before the guard and pass after. The complete browser-spell-acquisition35 suite now passes (Warlock/Dragonfire Adept/legacy invocations, Sorcerer, Wizard, Favored Soul, Hexblade, Duskblade, Magewright, Shugenja, Spirit Shaman, Wu Jen and Factotum). Full npm test, focused simpler-spells browser check and build pass; independent review found no issues in this correction.
