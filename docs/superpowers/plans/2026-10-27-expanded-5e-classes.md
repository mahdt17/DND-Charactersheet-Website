# Expanded 5e Classes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fulfill the requested 2014 5e casting fixes, Fighter tools, and published/UA subclass expansion across all 13 classes.

**Architecture:** Extend shared pure rules and persistence; retain existing specialized subclass adapters. Source-verified records drive class-level feature progression, choices, and action/resource controls. New targeted automation integrates with the existing attack, AC, spell and rest pipelines.

**Tech Stack:** React 18, Vite 6, JavaScript ES modules, node:test, Playwright.

**Spec:** docs/superpowers/specs/2026-10-27-expanded-5e-classes-design.md

## Global Constraints
- Use the existing isolated checkout on codex/expanded-5e-classes; do not touch paused dice work.
- 2014-compatible published subclasses and all UA iterations in the 13 reference class tables are included; clearly distinguish their sources.
- Preserve 2024 and 3.5 behavior and existing saved characters.
- Use class level for feature progression and total character level only where the source says proficiency bonus or character level.
- No names-only completion claims; make implementation coverage explicit.
- No merge or deployment until requested.

## Review Focus
- Multiclass owners and subclass entry levels must survive creation, advancement and reload.
- Recasting, concentration replacement, armor changes and rest/turn expiry cannot leave stale AC bonuses.
- Another-creature healing and failed casts cannot change own HP or spend unintended resources.
- UA/published variants with the same title cannot collide or overwrite saves.
- Shared base-class resources and existing specialized adapters cannot double-grant or lose spent uses.

### Task 1: Casting effects and expanded Wizard spell access
**Files:** src/lib/spellEffects.js; src/EditionSpellbook.jsx; src/CampaignSpells.jsx; src/GuidedSetup.jsx; src/lib/rules.js; turn/rest/sheet effect controls as needed; tests/spell-effects.mjs; tests/browser-spell-effects.mjs.
**Interfaces:** Produce pure effect helpers, active effect state and AC application reusable by Bladesong. Consume existing spellPlan rolls and roll callback results; commit effects atomically with slot/resource changes. Existing Fighter/Totem files remain unchanged.
- [ ] Add behavioral tests for Shield +5, unarmored Mage Armor13+Dex, strongest alternative base formula, recast replacement, durations and turn expiration, armor equip/unequip, self healing capped once and other-target no own healing, concentration cleanup and 3.5 exclusion.
- [ ] Run tests and observe failures for missing behavior.
- [ ] Implement helpers, explicit recipient UI, end-effect controls and automatic application in standard casting and compatible campaign casting. Handle manual AC without losing additive effects; reject missing healing results before spending. Use existing roll results.
- [ ] Include reference.entries in creation spell candidates, compare full linked Wizard index against reference records and fix optional memberships/missing records; verify Absorb Elements is selectable on creation and management.
- [ ] Browser test creation/casting/reload/end effect, recipient handling and AC updates. Run relevant rules, spell progression, campaign casting tests and build; report exact results and commit scoped changes.

### Task 2: Fighter level-one tools
**Files:** src/data/fightingStyles.js; src/lib/fightingStyles.js; src/FightingStyles.jsx; src/ClassFeatTools.jsx; src/GuidedSetup.jsx; src/lib/rules.js; src/lib/resources.js; creation/advancement choice integration; tests/fighting-styles.mjs; tests/browser-fighting-styles.mjs.
**Interfaces:** Consume Task1 active effects; produce style choice helpers, combat modifiers and Second Wind actions. Integrate existing Battle Master rather than replacing it.
- [ ] Test required style selection and persisted source-labeled roster, numeric attack/AC/damage restrictions, no duplicate styles, Superior Technique d6 separate short-rest die, Second Wind class-level healing and exhaustion/recovery.
- [ ] Observe RED, implement choices at creation/level-up and sheet editing, then make tests GREEN.
- [ ] Browser-test Fighter1 from scratch and multiclass Fighter1 actions; run existing martial regressions/build and commit.

### Task 3: Source-verified expanded subclass records
**Files:** src/data/expandedSubclasses.json; scripts/build_expanded_subclasses.mjs; docs/subclass-coverage.md; tests/expanded-subclass-data.mjs.
**Interfaces:** Produce uniquely identified records with index/name/class/edition/sourceBook/sourceUrl/playtest/entryLevel/features. Feature rows contain unique id, name, level, description and optional structured choices/actions/resources/passives/spell grants. Existing adapters retained by canonical mapping.
- [ ] Build acceptance inventory from 13 saved class reference tables including every listed UA iteration. Test unique IDs, exact inventory coverage, source labels, entry levels and feature milestones.
- [ ] Retrieve and verify each subclass source; preserve mechanics and versions with clear feature-level progression. Record source errors explicitly and resolve them before completion.
- [ ] Add structured mechanics rather than guessing resource counts from prose. Test representative complex features and all supported structured shapes, commit data plus validation.

### Task 4: Shared subclass lifecycle and selection
**Files:** src/lib/expandedSubclasses.js; src/ExpandedSubclassTools.jsx; src/lib/rules.js; src/lib/editions.js; src/GuidedSetup.jsx; src/EditionLevelUp.jsx; src/CharacterManager.jsx; src/lib/featureChoices.js; src/lib/resources.js; tests/expanded-subclasses.mjs; tests/browser-expanded-subclasses.mjs.
**Interfaces:** Consume Task3 records; expose availableSubclasses/class entry level/feature rows, required choices, action/resource reconciliation. Existing specialized adapters win for their canonical subclass.
- [ ] RED tests correct entry levels, class-row ownership, legacy-name migration, same-name UA variants, grant cleanup, level-specific choices, action/resource spending and rest recovery.
- [ ] Implement shared source-labeled selection in creation and advancement; generic tools render choices, unlocked features and supported actions. Persist class-owned state without overwriting other classes.
- [ ] Wire feature/spell grants, training/passives and resources into existing shared rules. Test create→advance→reload through20 for every catalog record and representative browser workflows.

### Task 5: Bladesinging and remaining subclass mechanic adapters
**Files:** focused subclass adapters/data augmentations and their shared integrations; tests/subclass-mechanics.mjs; browser coverage.
**Interfaces:** Consume Task1 effects and Task4 lifecycle. Extend structured action/passive kinds where needed, retaining external-board/manual resolutions as explicit instructions.
- [ ] RED tests Bladesong availability/restrictions/uses/duration/Int AC/concentration and combat termination, Extra Attack6, Song of Defense10 and Victory14.
- [ ] Implement and test mechanics families for remaining records, including spell grants, feature choices, companions, resource/roll actions, passive numerical changes, stateful transformations and triggered defenses. Coverage document must identify exact automation and table-resolved effects per record.
- [ ] Run all catalog lifecycle tests plus targeted browser scenarios and existing regressions.

### Task 6: Whole-branch validation and review
- [ ] Run complete relevant unit suites, creation/casting/class-tools browser tests and production build. Inspect outputs.
- [ ] Package branch diff and dispatch a fresh reviewer with design, plan, tests and coverage ledger.
- [ ] Fix important findings with observed RED→GREEN tests; rerun affected regressions.
- [ ] Commit final changes; provide reviewable PR when ready, reporting tested behavior and any genuine limitations. Do not merge automatically.
