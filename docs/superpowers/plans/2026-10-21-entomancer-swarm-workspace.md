# Entomancer Swarm Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Native execution with one whole-branch review is recommended for these tightly connected tasks.

**Goal:** Give Entomancer a coordinated Swarm workspace for abilities, ongoing effects, creatures and recovery while preserving its existing saved state and shared reserve.

**Architecture:** A pure derived model projects the existing class engine into four focused views. A workspace shell receives session-only UI state from the keyed CharacterSheet, and delegates mutations to the existing functional patch, action, resource and rest boundaries. Compatibility exports preserve creation and level-up callers.

**Tech Stack:** Existing React 18, JavaScript, Vite, Node assertions and Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-21-entomancer-swarm-workspace-design.md` (user approved 2026-10-21).

## Global Constraints

- "There is one full Swarm workspace and one primary Population counter."
- "Switching sections never spends uses, advances time or clears input/results."
- "Keep the persisted character shape: `resources` owns Population expenditure; `entomancer` owns effects, targets, creatures, daily flags, last result and log."
- "Do not persist a second calculated Population balance or duplicate effect/creature collections. No database migration is needed."
- "All writes apply to the latest character through the existing functional `patch` boundary."
- "Use the existing shared RestDialog for both the sheet's Rest button and Swarm shortcuts."
- "Time changes occur only when the player advances game time or completes an existing rest; no real-world countdown runs in the background."
- "Bug Swarm remains an immediate damage ability."
- "Merge and deployment remain separate actions requested by the user."

## Review Focus

1. Imported/manual Population values can disagree with possible future returns: display the canonical balance and conditional returns separately; never deduct or refund during rendering (Tasks 1, 3).
2. Unfinished ability/target inputs must survive internal and sheet-tab navigation without leaking to another character (Tasks 2, 4).
3. Multiple infestations and Pure Terror targets must use their own inputs; processing one must not consume another's range/save state (Task 3).
4. Incapacity/death must block personal actions while leaving valid bookkeeping, companion controls and revival reachable (Tasks 1, 3, 4).
5. A level/species/class change can invalidate a selected ability or remove Swarm altogether: fall back safely and preserve unrelated character fields (Tasks 1, 4).

## File Responsibilities

Create:

- `src/lib/entomancerSubsystem.js`: pure workspace projections, action state/validation, refund summaries and initial UI state.
- `src/entomancer/SwarmWorkspace.jsx`: controlled four-section shell, one summary/result, functional mutation callbacks.
- `src/entomancer/SwarmAbilities.jsx`: searchable cards, availability filter, complete rules and relevant inputs.
- `src/entomancer/SwarmActive.jsx`: effects, targets, turn triggers, saves and global elapsed-time controls.
- `src/entomancer/SwarmRecovery.jsx`: return explanations, manual adjustment, choices, environment, rulings and history.
- `src/entomancer/SwarmChoices.jsx`: reusable creation/level-up choices extracted from the current component.
- `src/entomancer/SwarmResult.jsx`: one result presentation reused by the workspace.
- `tests/entomancer-subsystem.mjs`: model/transaction/purity regressions.
- `tests/browser-entomancer-subsystem.mjs`: workspace session and navigation regressions, initially on port 5202.
- `tests/helpers/entomancer-workspace.mjs`: `openSwarm(page,section='abilities')`, `selectSwarmAbility(page,id)` and `setSwarmSave(page,success)` browser helpers.

Modify:

- `src/Entomancer.jsx`: compatibility wrapper and choice re-exports after extraction.
- `src/lib/entomancer.js`: move the pure `entomancerChoicesComplete` check here, with its existing signature.
- `src/lib/entomancerActions.js`: retain validation and provide useful saved results for turn-triggered operations.
- `src/EntomancerPopulation.jsx`: accept the derived summary; move manual adjustment to Recovery; retain one accessible meter and both rest shortcuts.
- `src/EntomancerCompanions.jsx`: refund/removal labels and functional updates; reuse existing statistics and damage helpers.
- `src/ModernLedger.jsx`: supported-only Swarm tab/default/shortcut, sheet-owned UI state and Actions shortcut.
- `src/refined.css`: scoped section navigation, summaries, forms, focus and phone layout.
- `package.json`, `docs/ENTOMANCER.md`, and existing affected browser suites: integrate new checks and navigation.

## Shared Interfaces

`entomancerChoicesComplete(character, {startingClass=entomancerStartsCharacter(character)}={}) -> boolean` keeps its current behavior and named JSX export.

`createSwarmUi(character) -> SwarmUi` initializes `{section:'abilities', actionId, inputsByAction:{}, activeInputs:{infestations:{},terror:{},hemo:{}}, creatureInput:{amount:1,type:'',critical:false}, recoveryInput:{amount:1}, query:'', availableOnly:false, recoveryDisclosure:null}`. `actionId` uses a currently legal last-action ID or `pestilence`. Missing input values receive action-specific defaults in the model; required target-save outcomes default to null until explicitly selected. Draft data is not persisted in the character.

`swarmSubsystem(character, {actionId, inputs={}}={}) -> SwarmModel` returns:

- `supported`, `profile` (existing profile), `setupComplete`, `blockedReason`.
- `summary:{available,max,unavailable,activityCount,creatureCount}`. Unavailable is `max-available`, with existing over-limit expenditure retained in saved state.
- `actions:ActionView[]`, each with existing action metadata plus `cost`, `costLabel`, `active`, `usedDaily`, `available`, `unavailableReason`, `fields`, and `save` (`{ability,dc,ruling}` or null).
- `selected`: an ActionView or null, plus `inputs`, `errors` (field-name/message map), and `canResolve`. Missing target/range/save-related facts prevent resolution where required; availability filtering itself ignores unfinished encounter inputs.
- `activities:ActivityView[]`, identified by saved effect/target IDs, with `kind`, `name`, optional `targetId`/`effectKey`, `remainingRounds` (null for non-timed state), `nextTrigger`, and optional explicit `committed` and conditional `refund` (`{amount,trigger}`). Include all categories listed in the spec; avoid duplicate infestation-condition rows.
- `creatures`: saved summon records with `returnAmount` (0 when dead or not an insect swarm), and `returnAllowed`.
- `recovery:{shortRecovery,shortRequiresFood,longRequiresFood:true,pendingReturns}`, retaining the current source/table rulings. Actual rest previews continue through RestDialog and `restResources`.

UI props:

- `SwarmWorkspace({char,patch,roll,onRest,ui,onUiChange})`, where `onUiChange` accepts a functional UI-state updater. `patch` accepts the current functional character updater and returns the resulting character.
- `SwarmAbilities({model,ui,onUiChange,onRun,onSection})`.
- `SwarmActive({char,model,ui,onUiChange,onRun,roll,onSection})`.
- `SwarmRecovery({char,model,patch,onRun,onRest,ui,onUiChange})`.
- `SwarmResult({result,available,max,onSection})`.
- `EntomancerCompanions({char,patch,roll,input,onInputChange})` accepts optional controlled creature-input props; existing callers can retain its local-input fallback.
- `onRun(id,inputs={})` resolves against the latest character; callbacks never precompute a character from a captured render.

`SwarmWorkspace` uses labelled ordinary section buttons with `aria-pressed`; the sheet retains its existing tablist. Focus/scroll explicitly targets the selected section heading when requested. Only the selected section's DOM is mounted, with its draft owned above that component.

### Task 1: Derive one authoritative workspace model

**Files:** `src/lib/entomancerSubsystem.js`, `src/lib/entomancer.js`, `src/Entomancer.jsx`, `tests/entomancer-subsystem.mjs`.

**Consumes/produces:** existing profile, actions, action descriptions, saved effects/targets/summons and resource helpers; produces all pure shared interfaces above.

- [x] Write Node assertions before implementation. Loop species and levels 1–20, compare available/max to the existing profile and action IDs to `availableEntomancerActions`, require complete descriptions, and check fixed/variable/Corpse Jacker costs. Pin Swarm Form used/active, song/form/environment prerequisites, zero-Population free actions, incapacity and the valid Dead Man Walking trigger.
- [x] Add fixture assertions: Bug Armor refund 3/1/0; living swarm HP 11/22 returns 2 and HP 10/22 returns 1; dead swarm returns 0; Large Decomposition exposes its committed amount and 4-round duration. A fed rest with a living summon keeps a full canonical reserve while displaying a possible later return separately.
- [x] Add purity/import/fallback assertions: a deep-frozen character remains unchanged across repeated projections; imported Population IDs retain expenditure; Custom 2014 and multiclass support work; unsupported classes return an empty safe model; a stale action ID safely falls back. Inputs with missing target, invalid investment, NaN or negative distance cannot resolve and produce a field explanation.
- [x] Run `node tests/entomancer-subsystem.mjs`; confirm a meaningful missing-model failure before adding the implementation.
- [x] Implement the specified projection and initializer, extracting the pure choice-completion helper and preserving its JSX re-export. Resolve all recorded inputs/defaults without side effects. Use existing rules for numbers and eligibility, including saved overrides; do not invent new mechanics.
- [x] Run the new suite and `npm run test:entomancer`; require exit 0. Commit as `Add the Entomancer Swarm subsystem model`.

### Task 2: Extract the workspace shell, abilities and shared result

**Files:** `src/entomancer/SwarmWorkspace.jsx`, `SwarmAbilities.jsx`, `SwarmChoices.jsx`, `SwarmResult.jsx`, `src/Entomancer.jsx`, `src/EntomancerPopulation.jsx`, `src/refined.css`, `tests/browser-entomancer-subsystem.mjs`, browser helpers.

**Consumes/produces:** Task 1 model and `SwarmUi`; produces controlled workspace/components and keeps the existing default/named Entomancer exports working. Until sheet integration, the compatibility wrapper can own fallback local UI state.

- [x] Write browser assertions for four labelled section buttons, one Population group/meter, full Bug Swarm rules, ability-name search and All/Available filtering. Selecting or navigating changes neither saved Population nor daily flags. An unavailable card still reveals its rules.
- [x] Add draft assertions: enter Bug Swarm's target/range, choose another ability, return, and retain the first draft. Invalid/missing encounter data disables resolution and shows its field reason. With valid inputs, resolving uses the existing reducer once and shows the saved target/save/damage/cost result.
- [x] Run `node tests/browser-entomancer-subsystem.mjs` with the configured Chrome executable; confirm the missing-workspace failure.
- [x] Extract choices and result presentation, implement controlled Abilities and the shell using the shared model, and retain the current class-source link. Use explicitly labelled Failed/Succeeded radio options for required target saves; resolution stays blocked until chosen. The shell has one summary and latest-result presentation outside the selected section. Add contextual View active effect/View creature navigation. Keep manual editing out of the summary.
- [x] Add scoped layout and visible focus styles, including the 390-pixel viewport. Reset visible field errors when their inputs change. Reuse full existing descriptions and accessible names where they still describe the same control.
- [x] Run the new browser suite and production build; require exit 0. Commit as `Create the coordinated Swarm workspace and abilities view`.

### Task 3: Complete Active, Creatures and Recovery transactions

**Files:** `src/entomancer/SwarmActive.jsx`, `SwarmRecovery.jsx`, `SwarmWorkspace.jsx`, `src/EntomancerCompanions.jsx`, `src/lib/entomancerActions.js`, both new subsystem suites.

**Consumes/produces:** Task 1 activities/refund views and Task 2 callbacks/drafts; produces the remaining fully functional sections without a second reserve or duplicated records.

- [x] Write failing Node assertions for sequential action/manual/time/rest transactions preserving unrelated counters and input snapshots. Verify armor/decomposition/creature refunds occur once, cap correctly and do not run while projecting/prevewing. Include stale imported expenditure and unfed/fed rest outcomes.
- [x] Write browser assertions for two independently ranged infestations (one at 60 ft, one at 61 ft), one-cost multi-target Pure Terror, Hemo actual-damage start/end triggers and repeat toxin saves, Harmonize's ordered checks, prepared attack/save bonuses, Apex hit/miss and explicit elapsed-time expiry. Incapacity blocks personal resolution but valid cleanup remains reachable.
- [x] Add creature/recovery assertions: change a swarm's HP across the half-HP boundary and observe its return preview; Return removes/refunds once; Remove explicitly gives no refund; retain zombie overrides/Fortitude. Both rest entry points share their dialog and exact feeding preview; manual edits preserve other resources; setup/environment prerequisite links focus the corresponding Recovery disclosure.
- [x] Run the affected suites and observe the missing controls/results failing before implementation.
- [x] Implement Active with `activeInputs` keyed by target ID and separate Terror/Hemo drafts. Time controls advance all tracked effects only on explicit use. Include saved target history in a disclosure and an actionable empty state. Implement Recovery with controlled `recoveryInput` manual adjustment and reusable choices/environment/rulings/history; give Creatures an empty-state link to Swarm Summon. Its damage controls use controlled `creatureInput`, so navigating sections retains their values too.
- [x] Convert companion update/damage/return/Fortitude writes to functional patches against the latest character. Show each Return preview and label removal without refund. Reuse existing monster statistics/damage helpers.
- [x] Extend existing action-result recording for infestation damage, Hemo, additional Terror saves and Apex resolution so these controls show actual outcomes rather than only `resolved`. Preserve the existing `lastAction` object shape, add optional `populationRestored`, and keep time/cleanup feedback specific without inventing a new saved collection. Rest continues to clear/reset according to current rules.
- [x] Run the new Node/browser suites and `npm run test:entomancer`; require exit 0. Commit as `Coordinate active swarm effects creatures and recovery`.

### Task 4: Integrate Swarm navigation and isolate character drafts

**Files:** `src/ModernLedger.jsx`, `src/Entomancer.jsx`, `src/refined.css`, browser helpers and new subsystem browser suite.

**Consumes/produces:** controlled workspace from Tasks 2–3; produces supported-only sheet navigation and retained session UI state.

- [x] Write failing browser assertions: supported Entomancers default to Swarm/Abilities; Actions retains weapon attacks and one Open Swarm shortcut; Spells retains casting; ordinary characters retain Actions/default navigation and no Swarm tab. Include Custom 2014, multiclass and a character losing its supported Entomancer class.
- [x] Add state assertions: enter unfinished ability and per-target drafts, visit Spells/Actions, return, and retain them; open another character and see fresh drafts. Persisted results/resources survive save/reopen independently of temporary drafts. Assert one visible Population counter and one workspace, no duplicate IDs, and no hidden mounted copy performing side effects.
- [x] Add keyboard/phone assertions: the sheet's arrows/Home/End still change sheet tabs; Swarm section buttons can be reached/activated with Tab/Enter/Space without changing sheet tabs; selected state and focus stay clear. At width 390, all five character shortcuts (including Checks) fit or wrap without overflow, and dialogs remain usable.
- [x] Run the new suite and confirm the missing Swarm-tab/default behavior fails.
- [x] Initialize sheet tab from `entomancerLevel(char)` and `SwarmUi` from `createSwarmUi(char)`. The existing `CharacterSheet key={char.id}` owns drafts above conditional tab content. Pass controlled state through the compatibility wrapper. Add a supported-only Swarm tab/mobile shortcut, remove the embedded full workspace from Actions, and pass Actions an Open Swarm callback. Fall back to Actions if supported levels are removed.
- [x] Run the new suite, `npm run test:browser:usability` and production build; require exit 0. Commit as `Integrate the Swarm workspace into character navigation`.

### Task 5: Migrate regressions and publish a reviewable branch

**Files:** `tests/helpers/entomancer-workspace.mjs`, `tests/browser-entomancer.mjs`, `browser-entomancer-playability.mjs`, `browser-entomancer-resources.mjs`, `browser-entomancer-feedback.mjs`, `browser-usability.mjs`, `browser-creation-choices.mjs`, `package.json`, `docs/ENTOMANCER.md`.

**Consumes/produces:** completed workspace; produces a verified branch/PR and accurate player/developer documentation.

- [ ] Update existing Entomancer tests to explicitly enter the relevant sheet/workspace section through the helpers, retaining their rules/save/refund assertions. Scope manual controls to Recovery, turns/conditions to Active, summons to Creatures, and weapon checks to Actions. Search for other test assumptions about embedded Swarm rather than removing failing assertions.
- [ ] Add the new Node suite to `test:entomancer` and browser suite to `test:browser:entomancer`, preserving existing commands. Document the four sections, conditional-return meaning, shared reserve and rest behavior.
- [ ] Run `npm test`, `npm run test:entomancer`, `npm run test:browser:entomancer`, `npm run test:browser:usability`, `node tests/browser-resources.mjs`, `node tests/browser-creation-choices.mjs`, `npm run build`, and `git diff --check`. On this machine set `BROWSER_EXECUTABLE_PATH` to `C:/Program Files/Google/Chrome/Application/chrome.exe`; run browser suites with distinct ports or sequentially. Require exit 0 for affected checks and inspect desktop/mobile screenshots.
- [ ] Confirm no new failures versus the recorded baseline. If broad integration/browser checks encounter the known Archivist description or Psion source-label assertion, report/reproduce that failure separately rather than marking the suite passed or changing unrelated class behavior.
- [ ] Request independent whole-branch review using the approved spec and current diff; fix actionable issues and recheck affected behavior. Check the final diff for accidental saved-state changes and duplicate reserve writes.
- [ ] Commit final regression/documentation adjustments, push `codex/entomancer-swarm-workspace`, and create a PR against `main` describing the final player behavior and actual verification. Do not merge or deploy without the user's separate request.

## Self-review and execution handoff

Coverage checked against every spec section: Task 1 owns calculations/purity; Task 2 owns discoverability/full rules/results; Task 3 owns all effects, creature operations and recovery; Task 4 owns navigation/draft lifetime/accessibility; Task 5 owns existing flows and release evidence. The five review-focus cases each have explicit assertions above. All downstream interfaces use the shared names in this plan; the existing sheet key supplies the required character boundary.

Recommended execution: **Native**—implement sequentially in this session, then independent whole-branch review. These tasks share the projection and UI-state interfaces, so sequential integration avoids parallel changes to the same controllers. Await the user's plan review and execution-method choice before product implementation.
