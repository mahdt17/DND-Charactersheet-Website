# 3.5 Companion Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a permanent D&D 3.5 companion engine with persisted creature state, reusable progression/lifecycle rules, and a dedicated Companions UI that initially supports animal companions, familiars, special mounts, and healer-style companions.

**Architecture:** Add a focused `src/lib/companions35.js` engine backed by a small source-locked `src/data/companions35.json` catalog. Class features supply compact companion configuration; `featureChoices.js` asks the engine for legal selections, `classIntegration.js` reconciles companion state after class progression, and `Companions35.jsx` renders/manages only player-mutable companion state.

**Tech Stack:** React 18, Vite 6, Node 22 ESM, JSON data catalogs, Playwright browser regressions.

**Spec:** `docs/superpowers/specs/2026-09-30-companion-engine-design.md`

## Global Constraints

- Keep PR #8 open, draft, and unmerged.
- Do not deploy.
- Do not modify Supabase.
- Preserve existing verified class behavior.
- Do not use 5e monster statistics for 3.5 companions.
- Do not silently invent missing source mechanics.
- Prefer reusable rule/configuration changes over one-off class checks.
- Companion lifecycle durations are campaign state, not wall-clock timers.
- A tracker record reaches `complete` only when all of its known blockers are resolved and regression evidence is green.

## Review Focus

- A character with no companion-granting feature must reconcile to no automatic companion and must never fall back to the 5e monster catalog.
- Multiple qualifying familiar-granting classes must contribute to one familiar's progression rather than create duplicate familiars.
- Removing one familiar-granting class while another still qualifies must recalculate the same familiar rather than delete it.
- Recalculation must preserve player-owned mutable state (name/notes/current HP/status), clamping current HP only when a lower new maximum requires it.
- An unresolved or missing 3.5 creature reference must fail closed with an incomplete companion record/choice rather than silently substitute a same-name non-3.5 creature.

---

### Task 1: Source-Locked Companion Catalog and Core Progression Engine

**Files:**
- Create: `src/data/companions35.json`
- Create: `src/lib/companions35.js`
- Create: `tests/companions35.mjs`

**Interfaces:**
- Produces: `companionCreature35(idOrName)`
- Produces: `companionChoiceOptions35(profileId, effectiveLevel)`
- Produces: `companionProgression35(profileId, effectiveLevel)`
- Produces: `companionEffectiveLevel35(contributions, levelAdjustment=0)`
- Produces: `COMPANION_ENGINE_VERSION`

- [ ] **Step 1: Add failing catalog/progression tests in `tests/companions35.mjs`**

Assert:
- Wolf resolves only from `monsters/wolf-596`.
- Ape resolves from `monsters/ape-531`.
- Raven resolves from `monsters/raven-575`.
- Imp resolves from `monsters/devil-imp-73`.
- Heavy Warhorse resolves from `monsters/warhorse-heavy-555`.
- Unicorn resolves from `monsters/unicorn-500`.
- Druid animal companion progression at effective level 1 yields +0 bonus HD, +0 natural armor, +0 Str/Dex, 1 bonus trick, Link + Share Spells.
- Druid progression at effective level 4 yields the existing source-correct level-band result.
- Standard familiar progression level 1 yields natural armor +1, Intelligence 6, Alertness/Improved Evasion/Share Spells/Empathic Link.
- Paladin mount progression level 5 yields +2 HD, +4 natural armor, +1 Strength, Int 6 and the initial mount abilities.
- Healer companion progression level 8 yields the source level-8 band.
- No lookup path imports or consults `src/data/monsters.json`.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node tests/companions35.mjs`

Expected: FAIL because `src/lib/companions35.js` and the companion catalog do not exist.

- [ ] **Step 3: Populate `src/data/companions35.json` with only the representative source-locked records and declarative progression profiles**

Initial creatures:
- Wolf
- Ape
- Raven
- Imp
- Heavy Warhorse
- Unicorn

Initial profiles:
- `druid-animal-companion`
- `standard-familiar`
- `paladin-special-mount`
- `healer-companion`

Use exact 3.5 source URLs and source-derived base statistics. Research missing exact fields with Exa/Tavily before entering them; do not use the local 5e monster catalog.

- [ ] **Step 4: Implement the exported core functions in `src/lib/companions35.js`**

Use deterministic pure functions. `companionEffectiveLevel35` accepts contribution objects with modes `full`, `fraction`, `minus`, or `fixed`, sums eligible contributions where the profile permits stacking, floors fractions, then applies the nonnegative level adjustment.

- [ ] **Step 5: Run focused tests and existing companion-choice regressions**

Run:
```bash
node tests/companions35.mjs
node tests/feature-choices.mjs
node tests/class-integration.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add 3.5 companion progression engine`

---

### Task 2: Generic Companion Source Configuration and Guided Selection

**Files:**
- Modify: `src/data/class-feature-summaries-35.json`
- Modify: `src/lib/classIntegration.js`
- Modify: `src/lib/featureChoices.js`
- Modify: `tests/feature-choices.mjs`
- Modify: `tests/class-integration.mjs`

**Interfaces:**
- Consumes: `companionChoiceOptions35`, `companionEffectiveLevel35`
- Produces feature metadata fields:
  - `companionRelationshipType`
  - `companionProfileId`
  - `companionContribution`
  - `companionChoiceRequired`
  - optional `companionExceptions`

- [ ] **Step 1: Write failing tests for generic source configuration**

Add tests proving:
- Druid Animal Companion obtains its legal list from `druid-animal-companion` rather than hard-coded option math in `featureChoices.js`.
- Ranger level 4 exposes standard companions using effective Druid level 2.
- Ranger level 8 exposes level-4 alternative companions using effective Druid level 4.
- Adept level 2 exposes a standard familiar choice.
- Wizard + Sorcerer source configurations identify the same `standard-familiar` relationship instead of independent familiar engines.
- Hexblade familiar contribution is `class level - 3`.
- Dread Necromancer identifies its familiar as a standard-familiar-derived relationship with explicit exceptions.

- [ ] **Step 2: Run focused tests and verify RED**

Run:
```bash
node tests/feature-choices.mjs
node tests/class-integration.mjs
```

Expected: FAIL on missing companion configuration behavior.

- [ ] **Step 3: Extend reviewed feature summaries with compact companion configuration**

Configure:
- Druid → animal companion, full contribution.
- Ranger → animal companion, half contribution.
- Wizard/Sorcerer/Adept → familiar, stackable full contribution when qualified.
- Hexblade → familiar, minus-3 contribution.
- Dread Necromancer → familiar with its source creature list and exceptions.
- Paladin → special mount.
- Healer → healer companion.

Do not duplicate entire progression tables into each class row.

- [ ] **Step 4: Pass companion metadata through `classIntegration.js` feature normalization**

Extend the existing metadata-copy list so companion configuration survives coalescing and derived feature construction.

Remove `animalCompanionProgression()` as the canonical progression calculator once equivalent engine-backed tests are green. Existing display summaries may still reference engine-derived values during migration.

- [ ] **Step 5: Refactor `featureChoices.js` to ask the companion engine for legal choices**

For any feature with `companionChoiceRequired`:
- calculate current effective level from the feature contribution;
- obtain legal options from `companionChoiceOptions35`;
- persist the selected creature ID/name and source choice ID;
- preserve current guided setup behavior.

Keep generic non-companion source choices untouched.

- [ ] **Step 6: Run focused regression set**

Run:
```bash
node tests/companions35.mjs
node tests/feature-choices.mjs
node tests/class-integration.mjs
node tests/setup-choices.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message: `refactor: route class companion choices through engine`

---

### Task 3: Persisted Companion Reconciliation and Lifecycle

**Files:**
- Modify: `src/lib/companions35.js`
- Modify: `src/lib/classIntegration.js`
- Modify: `src/CharacterManager.jsx`
- Modify: `tests/companions35.mjs`
- Modify: `tests/class-integration.mjs`

**Interfaces:**
- Produces: `reconcileCompanions35(character)`
- Produces: `transitionCompanion35(character, companionId, event, options={})`
- Produces companion records under `character.companions`

- [ ] **Step 1: Write failing reconciliation tests**

Assert:
- selected Druid Wolf materializes one persisted companion record;
- Ape carries the alternative-companion level adjustment;
- Ranger recalculates using half-level contribution;
- Wizard/Sorcerer multiclass produces one familiar whose effective master level includes both qualifying contributions;
- Hexblade contribution joins a pre-existing familiar correctly;
- removing one familiar source recalculates rather than deletes when another source remains;
- removing the last source deletes only the source-owned automatic companion;
- current HP, nickname/name override, notes, and lifecycle status survive level-up reconciliation;
- current HP clamps if a source removal lowers maximum HP below the stored current value;
- unresolved creature IDs fail closed and report incomplete state;
- unrelated/manual character arrays remain unchanged.

- [ ] **Step 2: Run tests and verify RED**

Run:
```bash
node tests/companions35.mjs
node tests/class-integration.mjs
```

Expected: FAIL on missing persisted reconciliation.

- [ ] **Step 3: Implement `reconcileCompanions35(character)`**

The reconciler:
- reads reviewed companion feature configuration and persisted feature choices;
- groups contributions by logical companion relationship;
- enforces one-familiar semantics for compatible familiar sources;
- calculates effective levels through the core engine;
- joins exact 3.5 base creature records;
- derives progression/stat adjustments;
- merges player-owned mutable fields from existing records;
- returns `companions` plus any companion-specific incomplete reasons.

- [ ] **Step 4: Integrate reconciliation into `reconcileClassGrants(character)`**

Call the companion reconciler after class-derived feature state exists. Include its incomplete reason in the appropriate class automation report rather than silently marking integration complete.

Ensure `removeClassProgression` relies on reconciliation/source ownership instead of ad hoc companion deletion.

- [ ] **Step 5: Add lifecycle transitions**

`transitionCompanion35` supports:
- `dismiss`
- `release`
- `mark-dead`
- `restore`
- `call`
- `uncall`
- `confirm-replacement-available`

Persist source rule/restriction text. No JavaScript dates/timers are used for campaign-time restrictions.

- [ ] **Step 6: Add `companions: []` to new-character defaults where explicit defaults are used**

Existing saves without the field remain valid because reconciliation treats missing state as an empty array.

- [ ] **Step 7: Run focused regressions**

Run:
```bash
node tests/companions35.mjs
node tests/class-integration.mjs
node tests/feature-choices.mjs
node tests/class-catalog-lifecycle.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

Commit message: `feat: persist 3.5 companion state and lifecycle`

---

### Task 4: Dedicated Companions Character-Sheet UI

**Files:**
- Create: `src/Companions35.jsx`
- Modify: `src/ModernLedger.jsx`
- Modify: `tests/browser-feature-choices.mjs`

**Interfaces:**
- Consumes: `character.companions`
- Consumes: `transitionCompanion35`
- Produces: a 3.5-only `Companions` character-sheet tab

- [ ] **Step 1: Write failing browser assertions**

Extend the guided companion browser flow to assert:
- a created Druid with Wolf has a `Companions` tab;
- the tab shows Wolf, Animal Companion, granting class, effective level, HP, AC, ability scores, progression bonuses, special abilities, and source link;
- current companion HP can be changed and survives save/reopen;
- derived level/AC/progression fields are not arbitrary editable inputs;
- lifecycle actions update status and persist;
- a 3.5 character without companions shows an intentional empty state rather than a broken panel.

- [ ] **Step 2: Run browser test and verify RED**

Run: `node tests/browser-feature-choices.mjs`

Expected: FAIL because the Companions tab/component does not exist.

- [ ] **Step 3: Implement `src/Companions35.jsx`**

Render companion cards/details with:
- identity + relationship;
- source class(es);
- effective levels;
- current/max HP;
- AC/speed/abilities;
- attacks/saves if present in source data;
- progression adjustments;
- special abilities;
- lifecycle status/restriction;
- source link;
- player notes.

Only current HP, notes/nickname, and valid lifecycle actions are mutable.

- [ ] **Step 4: Add the `Companions` tab to `ModernLedger.jsx` for 3.5/custom-3.5 characters**

Keep other editions unchanged.

Add a compact companion summary to print output when companions exist.

- [ ] **Step 5: Run UI and focused engine regressions**

Run:
```bash
node tests/browser-feature-choices.mjs
node tests/companions35.mjs
node tests/class-integration.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add 3.5 companions sheet`

---

### Task 5: Complete Representative Class Adapters

**Files:**
- Modify: `src/data/companions35.json`
- Modify: `src/data/class-feature-summaries-35.json`
- Modify: `src/lib/companions35.js`
- Modify: `tests/companions35.mjs`
- Modify: `tests/class-integration.mjs`
- Modify: `tests/browser-feature-choices.mjs`

**Interfaces:**
- Consumes the generic engine from Tasks 1–4.
- Produces source-faithful adapters for initial completion candidates.

- [ ] **Step 1: Write failing source-specific tests**

Cover:
- Adept familiar begins at class level 2 and uses standard familiar progression.
- Dread Necromancer level 7 permits Imp/Quasit/Vargouille/Ghostly Visage, preserves creature type, omits speak-with-kind, and retains deliver-touch behavior.
- Paladin level 5 special mount uses Heavy Warhorse for a standard Medium-character test case, correct call resource/duration metadata, and source progression.
- Healer level 8 Unicorn companion uses Healer-specific progression and daily call behavior.
- Ranger source variants inherit the reviewed PHB companion profile only where existing source/profile inheritance already authorizes it.

- [ ] **Step 2: Verify RED**

Run:
```bash
node tests/companions35.mjs
node tests/class-integration.mjs
```

Expected: FAIL for source-specific adapters/data not yet present.

- [ ] **Step 3: Research and add only missing exact 3.5 creature/source data**

Use Exa + Tavily in batches. Firecrawl only if exact pages fail extraction.

Add Ghostly Visage or additional standard familiar/mount records only when required by these tests.

- [ ] **Step 4: Implement source-specific adapter configuration**

Keep exception code narrow and profile-driven. Do not introduce checks such as `if (className === ...)` when equivalent source configuration can express the rule.

- [ ] **Step 5: Run all companion/class-focused tests**

Run:
```bash
node tests/companions35.mjs
node tests/feature-choices.mjs
node tests/class-integration.mjs
node tests/class-catalog-lifecycle.mjs
node tests/browser-feature-choices.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: integrate reviewed 3.5 companion classes`

---

### Task 6: Tracker Promotion and Full Validation Checkpoint

**Files:**
- Modify: `docs/class-completion-tracker.json`
- Modify: `docs/CLASS_INTEGRATION_VERIFICATION.md`
- Modify: `docs/PROJECT_STATUS.md` if that file is still the active checkpoint log

**Interfaces:**
- Consumes: green implementation/regression evidence.
- Produces: narrowed or completed tracker records with exact commit/CI evidence.

- [ ] **Step 1: Audit each affected tracker record against remaining blockers**

Primary direct-completion candidates:
- Adept
- Dread Necromancer
- Healer
- four Paladin source records
- four Ranger source records

For Hexblade, Sorcerer, and Wizard records, remove only the companion blocker and preserve the independent spells-known/spellbook blocker.

- [ ] **Step 2: Update tracker/docs without inflating the queue**

Promote only records whose known blockers are fully resolved.

For every touched record, replace generic notes with precise remaining blockers and record companion-engine regression evidence.

- [ ] **Step 3: Run the full local validation set available without changing deployment/Supabase**

Run at minimum:
```bash
npm test
node tests/casting.mjs
node tests/editions.mjs
npm run test:content
node tests/setup-choices.mjs
node tests/integration-foundation.mjs
node tests/class-integration.mjs
node tests/class-catalog-lifecycle.mjs
node tests/multiclass-casting.mjs
node tests/feature-choices.mjs
node tests/companions35.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 4: Push checkpoint commit and wait for Validate modernization CI**

Commit message: `chore: record companion engine verification`

Do not merge or deploy.

- [ ] **Step 5: Inspect CI evidence**

Require Validate modernization to complete successfully. If it fails, use `superpowers:systematic-debugging`, reproduce the relevant failure, fix test-first, and rerun.

- [ ] **Step 6: Record successful CI run in tracker/verification docs if a final evidence-only commit is needed**

The final state must leave PR #8 draft/open/unmerged and Supabase untouched.
