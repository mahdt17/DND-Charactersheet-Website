# Follower Inventory and Notes Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Give each follower accessible inventory controls and bottom-of-sheet notes.
**Architecture:** Extract the main Inventory into a shared component; mount it in the follower Inventory panel with follower-owned patches and the existing item-details callback. Preserve existing n.notes in one bottom section.
**Tech Stack:** React, Vite, Node, Playwright; existing catalogs/storage.
**Spec:** ../specs/2026-10-24-follower-inventory-design.md

## Global Constraints
- Preserve existing saved gear/notes and independent NPC state; no database, dependency or catalog changes.
- Main character equipped armor/actions keep working. Follower equipment tracking does not silently override conversion statistics.
- Keep action panels mounted, scope labels and avoid phone overflow.

## Review Focus
- Old sheets without inventory/currency load and save safely.
- Changes remain isolated between player, thrall and believer, including rest, regrouping and save/reopen.
- Item names/details, quantity and coin bounds behave like the main inventory.
- Main inventory equip behavior and catalog/details callbacks survive extraction.
- Notes appear at the bottom in every action panel; prior notes survive without duplicate editors.

### Task 1: Shared inventory and follower integration
**Files:** Create src/CharacterInventory.jsx, tests/browser-follower-inventory.mjs; modify src/ModernLedger.jsx, src/CampaignCreatureSheet.jsx, src/CampaignWorkshop.jsx, src/ArchivistCampaign.jsx, src/ClassFeatTools.jsx, src/lib/campaignCreatures.js, src/refined.css and package.json.
**Interfaces:** CharacterInventory({char,patch,show,follower=false}); follower patch accepts inventory/currency only through updateCreature; show uses the existing item detail dialog.

- [x] Write browser coverage for independent gear/coins, quantity/equip/item notes, published/basic/custom additions and details, missing old fields, retained drafts, bottom notes, save/reopen, and 390px layout. Verify the first new assertion fails before product changes.
- [x] Extract and integrate shared inventory; add defaults for new NPCs and move notes to the bottom.
- [x] Run focused browser checks and existing thrall, class/feat and main inventory/browser checks. Run npm test, npm run test:archivist and npm run build; inspect desktop/mobile screenshots.
- [x] Obtain independent whole-branch review and address material findings with regression coverage. Publish the verified branch as a reviewable PR.

## Execution ledger
- Implementation defaults follow the user-selected main-sheet controls and bottom-notes placement; no additional design choice is needed from the user.
- Pre-flight: shared inventory defaults and scoped follower patches must agree; item details callback must pass through both Thrallherd and Encounter owners. Reuse the clean task checkout on a new branch based on merged main 758c0c5.
- Baseline: npm run test:archivist passed. Initial new browser check failed as intended because follower notes were inaccessible outside Manage.
- Extracted CharacterInventory with the existing catalog/custom items, mutable quantities/equipped markers/item notes, weight and coin controls. Player autoArmor behavior is preserved; follower writes remain scoped through updateCreature. Old missing fields render empty and new templates receive independent defaults.
- Moved the existing notes field to a single bottom editor; no saved text migration or duplicate field.
- Independent review found no product issues. It identified an async Playwright polling pitfall in the new test; corrected the test to poll the actual saved record until autosave completes. Numeric bounds and rest preservation are explicitly exercised.
- Phone screenshot inspection caught cramped item names. Added a failing readable-name bounding-box check, then follower-specific grid rows with notes below on phones. Red/green confirmed; desktop and phone screenshots inspected again.
- Final verification passed: npm test; npm run test:archivist; npm run test:browser:archivist (all ten scripts); node tests/browser-integration.mjs; node tests/browser-follower-inventory.mjs; npm run build; git diff --check. Existing build chunk-size warnings remain.
- Verified independent player/thrall/believer inventories and coins, published/basic/custom item details, quantity/coin bounds, rest and regrouping, retained unfinished entries, existing notes, actual player AC update, save/reopen and readable 390px layout without horizontal overflow. No deferred product findings.
