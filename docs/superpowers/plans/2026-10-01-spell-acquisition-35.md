# D&D 3.5 Spell Acquisition Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a reusable D&D 3.5 spell-acquisition layer that correctly owns Sorcerer/Hexblade known spells, Wizard spellbook entries, legal replacements, and feat-driven learned/spellbook grants without disturbing the verified casting/preparation systems.

**Architecture:** Create a focused `spellAcquisition35` rules/reconciliation module backed by source-locked acquisition tables and exact source-class mappings. The engine produces acquisition events and reconciles persisted ownership/provenance into the existing `char.spells` runtime list; setup, level-up, Wizard campaign acquisition, and feat selection consume those events through small UI adapters instead of implementing their own rules.

**Tech Stack:** React 18, Vite 6, Node 22 ESM, JSON rule data, Playwright browser regressions.

**Spec:** `docs/superpowers/specs/2026-10-01-spell-acquisition-35-design.md`

## Global Constraints

- Keep PR #8 open, draft, and unmerged.
- Do not deploy.
- Do not modify Supabase.
- Preserve modern-edition behavior.
- Preserve the verified 3.5 casting/preparation/companion systems.
- Keep source-specific same-name classes distinct unless existing verified inheritance proves equivalence.
- Do not fabricate source progression values.
- Do not treat legal spell-list membership as proof of acquisition.
- Do not treat acquisition as preparation.
- Do not treat preparation as current castability.
- Do not collapse feat spell casting, feat spell access, and feat spell acquisition into one behavior.
- Never silently choose a required spell for the player.
- Wizard campaign time/cost/check requirements are surfaced and explicitly confirmed, not simulated automatically.

## Review Focus

- A multiclass Sorcerer/Wizard that owns the same spell through both classes must preserve two acquisition records while avoiding duplicate runtime spell rows for the same source class.
- Removing and re-adding the exact Wizard source class must archive/reactivate compatible spellbook history without resurrecting prohibited or otherwise illegal entries.
- A prepared Wizard spell must remain prepared after an idempotent reconciliation when its acquisition remains valid.
- A feat that merely adds a spell to a class list must never become a known/spellbook spell automatically.
- A feat that teaches/adds a spell must resolve immediately in creation/level-up and must be removed independently if the feat is removed.

---

### Task 1: Source-Locked Acquisition Profiles and Event Engine

**Files:**
- Create: `src/data/spell-acquisition35.json`
- Create: `src/lib/spellAcquisition35.js`
- Create: `tests/spell-acquisition35.mjs`
- Create: `.github/workflows/spell-acquisition35.yml`

**Interfaces:**
- Produces: `spellAcquisitionProfile35(classIdOrDefinition)`
- Produces: `spellKnownLimits35(profileId, classLevel)`
- Produces: `spellAcquisitionEvents35(character, {classId, previousClassLevel, targetClassLevel})`
- Produces: `validateSpellReplacement35(character, event, {removedSpellKey, addedSpell})`
- Produces: `SPELL_ACQUISITION35_VERSION`

- [x] **Step 1: Write failing unit tests for source profiles and exact tables**

In `tests/spell-acquisition35.mjs`, assert:
- PHB Sorcerer and its existing verified source-equivalent records resolve to the same `sorcerer-35` acquisition profile without losing exact class IDs.
- PHB Wizard and its existing verified source-equivalent records resolve to `wizard-35`.
- Hexblade resolves to `hexblade-35`.
- Sorcerer level 1 limits are exactly level 0: 4 and level 1: 2.
- Sorcerer representative rows (4, 10, 20) match the reviewed source table.
- Hexblade levels 1–3 have zero known spells.
- Hexblade level 4 exposes exactly two 1st-level known-spell acquisitions only when the character can legally cast that spell level.
- Hexblade representative rows (8, 12, 20) match the reviewed source table.
- Wizard profile is `spellbook`, not `known-table`.

- [x] **Step 2: Write failing event/replacement tests**

Assert:
- Sorcerer delta events are generated per spell level, not as one total count.
- Sorcerer optional replacement appears at 4 and every even Sorcerer level, never odd levels.
- Hexblade replacement appears only at 12, 15, and 18.
- Sorcerer/Hexblade replacement rejects a different-level replacement.
- Replacement rejects a spell level that is not at least two below the highest castable class spell level.
- Replacement rejects a spell already independently known through the same class acquisition profile.
- Wizard level 1 creates a starting-spellbook event.
- Wizard level 2+ creates exactly one `wizard-free-spellbook-additions` event with count 2.

- [x] **Step 3: Run the unit test and verify RED**

Run: `node tests/spell-acquisition35.mjs`

Expected: FAIL because the module/data do not exist.

- [x] **Step 4: Populate `src/data/spell-acquisition35.json`**

Include:
- exact source-class → profile mappings for the reviewed Sorcerer/Wizard source records and Hexblade;
- full Sorcerer spells-known table, levels 1–20, by spell level;
- full Hexblade spells-known table, levels 1–20, by spell level;
- replacement schedules/rules;
- Wizard starting/free-level-up rule metadata.

Do not infer source equivalence beyond mappings already supported by the repository.

- [x] **Step 5: Implement pure event/rule functions in `src/lib/spellAcquisition35.js`**

The event engine must operate on class level, never total character level.

Events must use stable event IDs derived from exact class ID + class level + event kind + spell level.

- [x] **Step 6: Add dedicated CI workflow**

`.github/workflows/spell-acquisition35.yml` runs:
```bash
npm ci
node tests/spell-acquisition35.mjs
node tests/spell-access.mjs
node tests/legacy-casting-choices.mjs
node tests/legacy-preparation.mjs
```

- [x] **Step 7: Run focused regressions**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/spell-access.mjs
node tests/legacy-casting-choices.mjs
node tests/legacy-preparation.mjs
```

Expected: PASS.

- [x] **Step 8: Commit**

Commit message: `feat: add 3.5 spell acquisition rule engine`

---

### Task 2: Persisted Acquisition State and Runtime Spell Reconciliation

**Files:**
- Modify: `src/lib/spellAcquisition35.js`
- Modify: `src/lib/classIntegration.js`
- Modify: `src/lib/advancement.js`
- Modify: `tests/spell-acquisition35.mjs`
- Modify: `tests/class-integration.mjs`
- Modify: `tests/multiclass-casting.mjs`

**Interfaces:**
- Produces: `reconcileSpellAcquisition35(character)`
- Produces: `applySpellAcquisitionEvent35(character, event, selection)`
- Produces: `activeAcquiredSpells35(character, classId)`
- Persisted state: `character.spellAcquisition35[classId]`

- [x] **Step 1: Write failing persistence/reconciliation tests**

Assert:
- acquisition records persist exact class ID, profile ID, acquired class level, spell level, origin, and stable source event ID;
- one active acquisition produces at most one runtime `char.spells` entry for that source class;
- repeated reconciliation is idempotent;
- prepared flag survives reconciliation when ownership remains valid;
- removing a source-owned acquisition removes only its runtime entry;
- unrelated feat/domain/feature spells remain unchanged;
- two classes can own the same spell independently;
- removing one class does not remove the other class's acquisition/runtime spell;
- removing Wizard marks its profile `active:false, orphaned:true` and removes only its source-owned runtime spells;
- re-adding the exact Wizard source can reactivate still-legal archived history;
- a newly prohibited Wizard spell is not silently reactivated;
- source-owned excess/illegal acquisitions produce precise incomplete reasons rather than silent deletion/repair.

- [x] **Step 2: Run unit/class tests and verify RED**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/class-integration.mjs
node tests/multiclass-casting.mjs
```

- [x] **Step 3: Implement reconciliation and event application**

Persist acquisition state separately from `char.spells`.

Runtime synchronization rules:
- acquisition state is authoritative for ownership/provenance;
- `char.spells` remains the casting/preparation representation;
- preserve runtime preparation/user display fields when the acquisition identity remains stable;
- never remove spells owned by another subsystem.

- [x] **Step 4: Integrate reconciliation into class progression**

Call `reconcileSpellAcquisition35` from the existing 3.5 class reconciliation path after class/source IDs are stable.

Class removal uses source ownership rather than name matching.

- [x] **Step 5: Verify multiclass/runtime compatibility**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/class-integration.mjs
node tests/multiclass-casting.mjs
node tests/spell-access.mjs
```

Expected: PASS.

- [x] **Step 6: Commit**

Commit message: `feat: persist and reconcile 3.5 spell ownership`

---

### Task 3: Guided Setup for Sorcerer and Wizard Starting Acquisition

**Files:**
- Create: `src/SpellAcquisitionChoices35.jsx`
- Modify: `src/GuidedSetup.jsx`
- Modify: `tests/spell-acquisition35.mjs`
- Create: `tests/browser-spell-acquisition35.mjs`
- Modify: `.github/workflows/spell-acquisition35.yml`

**Interfaces:**
- Consumes: `spellAcquisitionEvents35`
- Consumes: `applySpellAcquisitionEvent35`
- Produces: controlled UI selections keyed by acquisition event ID

- [x] **Step 1: Write failing creation-state tests**

Assert:
- level-1 Sorcerer setup exposes exactly 4 level-0 + 2 level-1 mandatory acquisitions;
- level-1 Wizard setup automatically includes all legal 0-level Wizard spells except prohibited schools;
- Wizard starting selected 1st-level count is exactly `3 + max(0, INT modifier)`;
- Hexblade level 1 exposes no spell-acquisition choices;
- unresolved mandatory events mark the setup state invalid.

- [x] **Step 2: Write failing browser creation flows**

In `tests/browser-spell-acquisition35.mjs`:
- create a Sorcerer and verify Continue/Create remains disabled until exact mandatory spells are selected;
- verify saved acquisition provenance is `starting`;
- create a specialized Wizard, choose prohibited schools, verify prohibited cantrips/1st-level choices never appear;
- verify legal 0-level spells are automatically in the saved spellbook;
- verify the exact starting 1st-level selection count;
- save/reopen and verify owned spellbook/known state remains stable.

- [x] **Step 3: Verify RED**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
```

- [x] **Step 4: Implement `SpellAcquisitionChoices35.jsx`**

Render event-specific spell pickers:
- group by event and spell level;
- legal candidates come from existing `permittedSpells` + `spellAccess`;
- do not duplicate source filtering in the component;
- report unresolved mandatory counts.

- [x] **Step 5: Replace 3.5 unlimited setup selection only for acquisition-profile classes**

In `GuidedSetup.jsx`:
- keep existing manual behavior for unsupported 3.5 classes;
- for Sorcerer/Wizard/Hexblade profile classes, use acquisition events/state instead of `manual ? Infinity`;
- build final `char.spells` through acquisition reconciliation;
- creation cannot finish with unresolved mandatory acquisition events.

- [x] **Step 6: Run creation regressions**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
node tests/browser-casting-setup.mjs
node tests/browser-feature-choices.mjs
```

Expected: PASS.

- [x] **Step 7: Commit**

Commit message: `feat: enforce 3.5 starting spell acquisition`

---

### Task 4: Class-Level-Up Acquisition and Legal Replacement

**Files:**
- Modify: `src/SpellAcquisitionChoices35.jsx`
- Modify: `src/EditionLevelUp.jsx`
- Modify: `src/LevelUp.jsx`
- Modify: `tests/spell-acquisition35.mjs`
- Modify: `tests/browser-spell-acquisition35.mjs`

**Interfaces:**
- Consumes: `spellAcquisitionEvents35(character,{classId,previousClassLevel,targetClassLevel})`
- Consumes: `validateSpellReplacement35`
- Produces: atomic level-up + acquisition result

- [x] **Step 1: Write failing level-up unit tests**

Assert:
- Sorcerer 1→2 requires only the table delta;
- Sorcerer 3→4 requires exact new-spell deltas and offers one optional replacement;
- Sorcerer 4→5 offers no replacement;
- Hexblade 3→4 requires its first legal known spells;
- Hexblade 11→12 offers one legal optional replacement;
- Wizard 1→2 requires exactly two free spellbook additions;
- Wizard multiclass advancement uses Wizard class level, not total character level;
- advancing an unrelated class creates no Wizard/Sorcerer/Hexblade acquisition event.

- [x] **Step 2: Write failing browser level-up flows**

Cover:
- Sorcerer gains only the required new spell(s);
- optional replacement can be skipped;
- illegal replacement choices are unavailable/rejected;
- Wizard must choose exactly two legal spellbook additions;
- Hexblade first-spell acquisition appears on reaching class level 4;
- saved acquisition state survives reopen.

- [x] **Step 3: Verify RED**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
```

- [x] **Step 4: Integrate acquisition events into `EditionLevelUp.jsx`**

Remove `manual = Infinity` only for classes with a supported acquisition profile.

Mandatory events block Apply Level Up until resolved.

Optional replacement events remain skippable.

- [x] **Step 5: Make `LevelUp.jsx` pass exact class/source context**

The draft used by `EditionLevelUp` must carry the exact source class ID and previous/target class level so acquisition never uses total character level accidentally.

Apply class progression, feat choice, feature choice, and spell acquisition atomically.

- [x] **Step 6: Run level-up and casting regressions**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
node tests/multiclass-casting.mjs
node tests/casting.mjs
node tests/legacy-preparation.mjs
```

Expected: PASS.

- [x] **Step 7: Commit**

Commit message: `feat: enforce 3.5 level-up spell acquisition`

---

### Task 5: Wizard Campaign Spellbook Acquisition

**Files:**
- Create: `src/WizardSpellbookAcquisition35.jsx`
- Modify: `src/lib/spellAcquisition35.js`
- Modify: `src/EditionSpellbook.jsx`
- Modify: `tests/spell-acquisition35.mjs`
- Modify: `tests/browser-spell-acquisition35.mjs`

**Interfaces:**
- Produces: `recordWizardCampaignAcquisition35(character, classId, spell, details)`
- `details.origin`: `copied-spellbook | copied-scroll | independent-research | manual-source`
- `details.sourceNote`: non-empty string
- `details.confirmed`: boolean
- Optional details: `spellcraftOutcome`, `campaignCostNote`, `campaignTimeNote`

- [x] **Step 1: Write failing Wizard campaign-acquisition tests**

Assert:
- prohibited-school spells cannot be recorded;
- a spell already owned by the same Wizard profile is rejected as a duplicate;
- copied spellbook/scroll/research origins are preserved;
- campaign entry requires explicit confirmation;
- the engine records the source rule note/check requirement but does not roll Spellcraft or subtract GP automatically;
- copied/researched entries do not consume the two-free-spells-per-level quota;
- removing/re-adding Wizard follows the archival policy from Task 2.

- [x] **Step 2: Write failing browser flow**

From a Wizard's Spells tab:
- open Manage spells;
- choose Add spell to spellbook;
- select a legal non-owned spell;
- select provenance;
- record source note;
- confirm campaign requirements;
- save and verify the spell appears in the normal spellbook/preparation UI;
- verify a prohibited spell never appears as a legal candidate.

- [x] **Step 3: Verify RED**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
```

- [x] **Step 4: Implement campaign acquisition API**

Do not simulate time, cost, scroll consumption, or Spellcraft success.

The API records confirmed campaign state and provenance only.

- [x] **Step 5: Implement `WizardSpellbookAcquisition35.jsx` and integrate into `EditionSpellbook.jsx`**

Only show it for active 3.5 Wizard spellbook profiles.

The existing preparation/casting UI continues to consume reconciled `char.spells`.

- [x] **Step 6: Run Wizard/preparation regressions**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
node tests/legacy-preparation.mjs
node tests/legacy-casting-choices.mjs
node tests/browser-casting-gaps.mjs
```

Expected: PASS.

- [x] **Step 7: Commit**

Commit message: `feat: add Wizard campaign spellbook acquisition`

---

### Task 6: Feat-Driven Learned/Spellbook Acquisition with Immediate Resolution

**Files:**
- Create: `src/lib/featSpellAcquisition35.js`
- Create: `src/FeatSpellAcquisition35.jsx`
- Modify: `src/FeatChoices.jsx`
- Modify: `src/LevelUpFeatChoice.jsx`
- Modify: `src/GuidedSetup.jsx`
- Modify: `src/LevelUp.jsx`
- Modify: `src/lib/spellAcquisition35.js`
- Modify: `tests/spell-acquisition35.mjs`
- Modify: `tests/browser-spell-acquisition35.mjs`
- Modify: `tests/browser-feature-choices.mjs`

**Interfaces:**
- Structured feat metadata: `feat.spellAcquisition35`
- Produces: `featSpellAcquisitionPlan35(feat, character)`
- Produces: `featSpellAcquisitionComplete35(feat, character)`
- Produces: `featSpellAcquisitionRecords35(feat, character)`
- Selected choices persist on: `feat.spellAcquisitionChoices35`

**Metadata contract:**
- `effect`: `known-spell | spellbook-entry | access-only`
- `count`: integer for choice grants
- `fixedSpellIds`: exact named automatic grants
- `allowedLists` / `allowedLevels` / optional source filters
- `affectsQuota`: boolean, default false
- `required`: boolean, default true for learned/spellbook choice grants

- [x] **Step 1: Write failing feat semantics tests**

Use structured reviewed-style fixture feats and assert:
- `known-spell` choice produces a mandatory picker and an `origin:'feat'` acquisition;
- `spellbook-entry` with a fixed named spell requires no picker and materializes automatically;
- choice-based `spellbook-entry` requires the legal choice immediately;
- `access-only` produces no acquisition record;
- existing feat-casting profiles remain handled by `featMagic` and do not become class acquisitions;
- `affectsQuota:false` does not reduce ordinary Sorcerer/Hexblade known-spell capacity;
- `affectsQuota:true` is counted where the source explicitly requires it;
- removing a feat removes only acquisitions owned by that feat unless another source independently owns the spell.

- [x] **Step 2: Write failing browser feat flows**

Cover:
- during character creation, selecting a feat with "learn an additional spell" immediately exposes its spell picker and blocks Create Character until resolved;
- during level-up feat selection, the picker appears in the same workflow and blocks Apply Level Up until resolved;
- a fixed "add this spell to your spellbook" feat automatically places the spell into the normal Spells section with no extra manual management step;
- an access-only feat does not add the spell to known/spellbook ownership;
- feat-spell casting still appears in the existing Feat Spells region, proving subsystem separation.

- [x] **Step 3: Verify RED**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
node tests/browser-feature-choices.mjs
```

- [x] **Step 4: Implement feat acquisition helper**

Do not parse arbitrary feat prose at runtime.

Only reviewed/structured `spellAcquisition35` metadata enables automation; unstructured feat text remains unresolved/manual rather than guessed.

- [x] **Step 5: Implement `FeatSpellAcquisition35.jsx`**

Render immediately adjacent to the selected feat.

Mandatory choice grants expose incomplete state until valid.

Fixed named grants display what will be added automatically rather than asking the player to re-select it.

- [x] **Step 6: Integrate all supported feat attachment flows**

- `FeatChoices.jsx`: newly selected/editable feats.
- `LevelUpFeatChoice.jsx`: level-up feat selection.
- `GuidedSetup.jsx`: creation cannot complete with unresolved feat acquisition.
- `LevelUp.jsx`: apply feat + feat acquisition atomically.
- Class-feature-selected feats: after `applyFeatureChoices` resolves the feat record, surface any mandatory structured feat acquisition before final save rather than leaving a hidden incomplete feat.

- [x] **Step 7: Reconcile feat-origin acquisitions into runtime spells**

Feat ownership is exact by feat ID/source.

Removing the feat removes only feat-owned acquisitions/runtime entries.

- [x] **Step 8: Run feat/casting/acquisition regressions**

Run:
```bash
node tests/spell-acquisition35.mjs
node tests/browser-spell-acquisition35.mjs
node tests/browser-feature-choices.mjs
node tests/casting.mjs
node tests/spell-access.mjs
```

Expected: PASS.

- [x] **Step 9: Commit**

Commit message: `feat: resolve feat-driven 3.5 spell acquisition immediately`

---

### Task 7: Source-Specific Verification, Tracker Promotion, and Full CI

**Files:**
- Modify: `docs/class-completion-tracker.json`
- Modify: `docs/CLASS_INTEGRATION_VERIFICATION.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `.github/workflows/modernization.yml` if the new unit test is not already included through the dedicated workflow

**Interfaces:**
- Consumes all engine/UI behavior from Tasks 1–6.
- Produces verified tracker evidence only after complete CI succeeds.

- [x] **Step 1: Run source-specific class audit against implemented behavior**

Audit:
- `classes/hexblade-19`
- `classes/sorcerer-98`
- `classes/sorcerer-46`
- `classes/sorcerer-70`
- `classes/sorcerer-109`
- `classes/wizard-99`
- `classes/wizard-47`
- `classes/wizard-71`
- `classes/wizard-110`

Confirm no independent blocker remains before promotion.

- [x] **Step 2: Add exact source-record regressions where generic tests are insufficient**

At minimum verify each source-equivalent Sorcerer/Wizard record resolves its reviewed acquisition profile through exact source ID/inheritance evidence.

- [x] **Step 3: Run the complete local validation set**

Run:
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
node tests/spell-acquisition35.mjs
node tests/spell-access.mjs
node tests/legacy-casting-choices.mjs
node tests/legacy-preparation.mjs
node tests/legacy-special-casting.mjs
npm run build
node tests/browser-spell-acquisition35.mjs
```

Expected: PASS.

- [x] **Step 4: Commit implementation checkpoint before tracker promotion**

Commit message: `chore: checkpoint 3.5 spell acquisition verification`

- [x] **Step 5: Require both dedicated and full CI green**

Require:
- Spell acquisition checks — success.
- Validate modernization — success.

If either fails, use `superpowers:systematic-debugging`, reproduce the failing gate, fix test-first, and rerun.

- [x] **Step 6: Update tracker/docs conservatively**

Promote only records whose acquisition blocker and all other blockers are gone.

Record:
- exact implementation commit;
- dedicated workflow run;
- Validate modernization run;
- precise remaining blocker for any record not promoted.

Do not reopen resolved companion blockers.

- [x] **Step 7: Final post-documentation verification**

Run the dedicated acquisition workflow and Validate modernization from the documentation/tracker head.

PR #8 must remain open, draft, unmerged; no deployment or Supabase mutation.


## Completion checkpoint (2026-10-01)

- Tasks 1–7 are complete.
- Verified implementation head: `b0d613a22aaf56efe83f8f31696ce08f88bbc8c4`.
- Spell acquisition checks #58: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977364
- Companion engine checks #83: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977553
- Validate modernization #1583: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977372
- The final source audit found no independent blocker on the nine targeted
  Hexblade/Sorcerer/Wizard records, so the tracker/docs checkpoint promotes only
  those nine records.
- PR #8 remains draft/open/unmerged. Nothing was deployed and Supabase was not
  modified.
