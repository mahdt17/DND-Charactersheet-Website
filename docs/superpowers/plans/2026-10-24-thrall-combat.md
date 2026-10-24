# Thrall Combat Workspace Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make follower combat sheets easy to scan and use, matching Entomancer action selection.
**Architecture:** Reorganize shared CreatureSheet rendering around persistent action panels and existing NPC engines; reuse health/ability picker styling.
**Tech Stack:** Existing React, Vite, Node and Playwright.
**Spec:** ../specs/2026-10-24-thrall-combat-design.md

## Global constraints
- Preserve saved NPC data, drafts, independent spending, creature action restrictions and source-specific controls.
- No rule/engine changes or new dependencies.
- Keep the existing follower summary/disclosure and data-creature-id hooks.

## Review focus
- HP/temp HP and bar are individual; healing cannot revive dead/soul-destroyed followers.
- Spell selection and slot spending are legal at the selected spell level, including exhausted/unprepared spells.
- Switching panels/sheets retains inputs; removed selected spells fall back safely.
- NPC actions stay independent of owner conditions; loss/arrival/incapacity guards remain intact.
- Control/refusal, cyst surgery, graft heart, editing and loss controls remain reachable; phone layout fits.

## Tasks
1. [x] Add failing browser checks for HP bars, focused actions, independent damage/heal, spell selection/spending, saved drafts and phone layout.
2. [x] Reorganize CreatureSheet with health header and action panels. Adapt existing browser navigation while keeping behavioral assertions.
3. [x] Run new/affected browser suites, campaign/full rules and build; inspect desktop/mobile; obtain independent review, fix material findings. Publish the verified branch as a PR.

## Execution ledger
- User selected the existing Entomancer interaction pattern. Routine choice: retain expandable follower summaries rather than adding a second roster selector; keep action panels mounted but hidden to retain drafts.
- Pre-flight: CreatureSheet supplies both follower sheets and Encounter creatures; both must retain functionality. Parent creation and follower group bookkeeping remain unchanged.
- Implemented the shared sheet with individual HP bars, compact Damage/Heal, persistent action selection and focused spell casting. Manage contains detailed statistics, preparations, rest and loss controls.
- Added relationship badges and ready/unavailable/history headings. A flat keyed roster preserves component state and native disclosure state while availability changes.
- Moved follower roster administration and template creation into separate disclosures; the follower role is selectable before creation. Verified a newly created scholar believer appears in the unavailable group pending arrival.
- Red/green: the initial browser check failed on the absent HP bar; the later roster-organization check failed because administration was initially visible. Both pass after implementation.
- Verification: npm test, npm run test:archivist and npm run build passed. The first eight scripts in test:browser:archivist passed; the new ninth test passed separately after correcting its summary locator to exclude nested editing disclosures. All behavioral assertions remain intact. Existing build chunk-size warnings remain.
- Inspected desktop roster and 390px phone screenshots; no horizontal overflow. Checked independent HP/temp HP, owner-independent NPC actions, incapacitated regrouping, slot tier/spending, unprepared-spell guards, removed-spell fallback, control/cyst controls, drafts and save/reopen.
- Independent read-only review found no actionable issues. Final organization refinement only wraps existing administrative controls; their browser navigation and draft-retention checks pass.
